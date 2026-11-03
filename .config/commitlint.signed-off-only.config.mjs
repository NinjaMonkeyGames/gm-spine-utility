////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                            COMMITLINT CHECK SIGN-OFF                                               //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import base from './commitlint.config.mjs';

export default {
  parserPreset: base.parserPreset,
  plugins: base.plugins,
  rules: {
    'signed-off-by-regex': base.rules['signed-off-by-regex'],
    'signed-off-by': base.rules['signed-off-by'],
  },
};
