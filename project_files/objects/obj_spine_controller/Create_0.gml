// CONSTRUCTOR CLASS FOR GENERATING SPINE OBJECT

/// @description Singleton guard
// FIRST thing in Create, so a duplicate controller exits before it can touch any globals below.

if (variable_global_exists("controller") && instance_exists(global.controller))
{
	show_debug_message("A singleton pattern has been implemented for this object. Please don't call me again!");
    instance_destroy();	// Cleanup instance from memory.
    exit;				// Stop the rest of Create from running
}

global.controller = id;

/// @description Generate 2D grid

global.spine_list = []; // Stores array of spine structs

/**
 * @function grid()
 * @constructor
 * @description Generates a 2D grid based on parameters.
 * @since v0.1.0
 * @param   {Asset.GMSprite}    [_sprite]           Spine asset to use.
 * @param	{Real}				[_x_offset]			Offset draw position (horizontal).
 * @param	{Real}				[_y_offset]			Offset draw position (vertical).
 * @returns {Struct}								A new grid struct.
 */

function grid
(
_sprite = spr_spineboy,
_x_offset = 32, _y_offset = 32, 



)

constructor
{
	palette_id = (function() 
	{
	    static _instances = [];
	    array_push(_instances, self);
	    return array_length(_instances) - 1;
	})();
	
	spine_data = [];
	
	x_offset = _x_offset;
    y_offset = _y_offset;
	
	static step = function() 
	{
		
	}
	
	static draw = function() 
	{
		
	}
}