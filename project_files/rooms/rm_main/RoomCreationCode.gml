global.spine_list = undefined;

instance_create_layer(0, 0, "lyr_gui", obj_spine_controller);

test = new global.spine_list(spr_spineboy, 60, 600, 1.5, 1.5);
test_1 = new global.spine_list(spr_spineboy, 600, 600, 1.5, 1.5);

test.animation_name = "walk";
test_1.animation_name = "jump";