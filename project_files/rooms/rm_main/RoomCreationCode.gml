// INITIALISE PROJECT

global.debug_enabled = environment_get_variable("CI") != "";









//example_spine = new obj_spine_controller.spine();	// Generate example spine instance (all other arguments use the constructor defaults).


if global.debug_enabled == true then global.unit_test = instance_create_layer(0, 0, "lyr_gui", obj_unit_test);

