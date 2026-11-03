////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                              VERIFY GIT COMMIT                                                     //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const GITHUB_API = 'https://api.github.com';

const DEFAULT_ASSETS = [
  'package.json',
  'package-lock.json',
  'npm-shrinkwrap.json',
  'CHANGELOG.md',
];

const DEFAULT_MESSAGE = 'chore(release): ${nextRelease.version}\n\n${nextRelease.notes}';

/**
 * Executes a git command synchronously and returns the trimmed output.
 * @param {string[]} args - Arguments to pass to the git executable.
 * @param {string} cwd - Current working directory where the command should run.
 * @returns {string} The trimmed stdout from the git command.
 */
function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

/**
 * Retrieves the GitHub authentication token from environment variables.
 * @returns {string} The GitHub token (`GITHUB_TOKEN` or `GH_TOKEN`).
 * @throws {Error} If neither token is present in the environment.
 */
function getToken() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    throw new Error(
      'verified-git-commit: no GITHUB_TOKEN/GH_TOKEN in the environment - required to create the commit via the API.',
    );
  }
  return token;
}

/**
 * Parses the repository owner and name from the `GITHUB_REPOSITORY` environment variable.
 * @returns {{ owner: string, name: string }} An object containing the repository owner and name.
 * @throws {Error} If `GITHUB_REPOSITORY` is missing or improperly formatted.
 */
function getRepo() {
  // Set automatically inside GitHub Actions, as "owner/repo".
  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo || !repo.includes('/')) {
    throw new Error(
      `verified-git-commit: GITHUB_REPOSITORY is not set to an "owner/repo" value (got ${JSON.stringify(repo)}). This plugin only supports running inside GitHub Actions.`,
    );
  }
  const [owner, name] = repo.split('/');
  return { owner, name };
}

/**
 * Makes an authenticated HTTP request to the GitHub REST API.
 * @param {string} method - HTTP method (e.g., 'GET', 'POST', 'PATCH').
 * @param {string} urlPath - API endpoint path (relative to `GITHUB_API`).
 * @param {string} token - GitHub authentication token.
 * @param {Record<string, unknown>} [body] - Optional request body payload to send as JSON.
 * @returns {Promise<Record<string, unknown>>} The parsed JSON response from the API.
 * @throws {Error} If the HTTP response status indicates failure.
 */
async function api(method, urlPath, token, body) {
  const res = await fetch(`${GITHUB_API}${urlPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '<no body>');
    throw new Error(
      `verified-git-commit: GitHub API ${method} ${urlPath} failed (${res.status}): ${text}`,
    );
  }
  return res.json();
}

/**
 * Safely retrieves a nested property value from an object using a dotted path string.
 * @param {object} obj - The target object to query.
 * @param {string} dottedPath - Dotted path to the property (e.g., 'nextRelease.version').
 * @returns {any} The resolved value, or undefined/null if not found.
 */
function get(obj, dottedPath) {
  return dottedPath
    .split('.')
    .reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

/**
 * Renders a commit message template by replacing `${dotted.path}` expressions with context values.
 * @param {string} template - The template string containing placeholders.
 * @param {object} context - The context object containing release data.
 * @returns {string} The rendered commit message.
 */
function renderMessage(template, context) {
  return template.replace(/\$\{\s*([\w.]+)\s*\}/g, (_match, expr) => {
    const value = get(context, expr);
    return value === undefined || value === null ? '' : String(value);
  });
}

/**
 * Semantic-release `prepare` lifecycle hook. Creates a verified release commit
 * directly via the GitHub Git Data API, bypassing local git wire protocol limitations.
 * @param {object} pluginConfig - Configuration options passed to the plugin.
 * @param {string[]} [pluginConfig.assets] - Array of file paths to commit.
 * @param {string} [pluginConfig.message] - Custom commit message template.
 * @param {object} context - Semantic-release context object.
 * @param {string} context.cwd - Current working directory.
 * @param {object} context.branch - Current branch information.
 * @param {object} context.logger - Logger interface provided by semantic-release.
 * @returns {Promise<void>}
 */
async function prepare(pluginConfig, context) {
  const { cwd, branch, logger } = context;
  const assets = pluginConfig.assets || DEFAULT_ASSETS;
  const messageTemplate = pluginConfig.message || DEFAULT_MESSAGE;
  const branchName = branch.name;

  // Same short-circuit @semantic-release/git applies: only commit assets
  // that exist AND actually changed, and skip entirely if none did -
  // avoids an empty/no-op verified commit.
  const changed = assets.filter((asset) => {
    if (!fs.existsSync(path.join(cwd, asset))) return false;
    const status = git(['status', '--porcelain', '--', asset], cwd);
    return status.length > 0;
  });

  if (changed.length === 0) {
    logger.log(
      'verified-git-commit: no changes to %s, skipping commit.',
      assets.join(', '),
    );
    return;
  }

  const token = getToken();
  const { owner, name: repo } = getRepo();

  logger.log(
    'verified-git-commit: creating a verified commit for %s on %s',
    changed.join(', '),
    branchName,
  );

  const ref = await api(
    'GET',
    `/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branchName)}`,
    token,
  );
  const baseSha = ref.object.sha;
  const baseCommit = await api(
    'GET',
    `/repos/${owner}/${repo}/git/commits/${baseSha}`,
    token,
  );
  const baseTreeSha = baseCommit.tree.sha;

  const tree = [];
  for (const asset of changed) {
    const content = fs.readFileSync(path.join(cwd, asset));
    const blob = await api('POST', `/repos/${owner}/${repo}/git/blobs`, token, {
      content: content.toString('base64'),
      encoding: 'base64',
    });
    tree.push({ path: asset, mode: '100644', type: 'blob', sha: blob.sha });
  }

  const newTree = await api('POST', `/repos/${owner}/${repo}/git/trees`, token, {
    base_tree: baseTreeSha,
    tree,
  });

  const message = renderMessage(messageTemplate, context);
  const commit = await api('POST', `/repos/${owner}/${repo}/git/commits`, token, {
    message,
    tree: newTree.sha,
    parents: [baseSha],
    // No author/committer/signature fields: that's what makes GitHub
    // sign this itself and mark it Verified.
  });

  // Fast-forward only, never force. If the branch moved since baseSha
  // was read (something else pushed in between), this fails loudly -
  // exactly the race @semantic-release/git's own git push would also
  // hit, just surfaced as an API error instead of a rejected push.
  await api(
    'PATCH',
    `/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branchName)}`,
    token,
    { sha: commit.sha },
  );

  // Sync the local checkout to the commit just created via the API.
  // semantic-release reads the local HEAD again right after `prepare`
  // finishes to learn nextRelease.gitHead - i.e. which commit the tag
  // and GitHub release end up pointing at. Without this reset, that
  // would still be the pre-bump commit, one behind what actually shipped
  // - exactly the correctness @semantic-release/git's own local commit
  // preserves today, so it has to be preserved here too.
  git(['fetch', 'origin', branchName], cwd);
  git(['reset', '--hard', `origin/${branchName}`], cwd);

  logger.log(
    'verified-git-commit: pushed verified commit %s to %s',
    commit.sha,
    branchName,
  );
}

module.exports = { prepare };