/// @description Stores data structure for each generated character.

characters = [];

/// @function																		spine_list
/// @description																Generates instances of spine characters and adds them to a global list.
/// @parameter			{Asset.GMSprite}		_sprite		The sprite containing the spine data.
/// @parameter			{real}							_x				Amount to offset spine object horizontally.
/// @parameter			{real}							_y				Amount to offset spine object vertically
/// @parameter			{real}							_x_scale		Set horizontal scale for spine model.
/// @parameter			{real}							_y_scale		Set vertical scale for spine model.
	
global.spine_list = function(_sprite, _x, _y, _x_scale, _y_scale) constructor 
{
	// Imported Variables
	
    sprite = _sprite;
	
    x = _x;
    y = _y;
	
    x_scale = _x_scale;
    y_scale = _y_scale;
	
	// 
	
	animation_name = "idle";
    
    array_push(obj_spine_controller.characters, self); // Add new spine asset to characters list.
	
	/// @description Spine skeleton logic.
	/// @returns {void}
	 
    static step = function() 
	{

    };
	
	/// @description Draws the skeleton animation.
	/// @returns {void}
	 
    static draw = function() 
	{
		
		static  animation_time = 0;
        animation_time += 1; 
        draw_skeleton(sprite, animation_name, "default", animation_time, x, y, x_scale, y_scale, 0, c_white, 1);
    };
};


