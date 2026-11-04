/// @description Loops through step code for each spine instance

var _list_size = array_length(global.spine_list);

for (var i = 0; i < _list_size; i++)
{
    var _current_instance = global.spine_list[i];
    _current_instance.step();
}