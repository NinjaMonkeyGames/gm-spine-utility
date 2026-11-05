/// @description Cleanup memmory after use

if (variable_instance_exists(id, "my_grid")) 
{
    my_grid.destroy();
}