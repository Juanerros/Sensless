<?php

$conex = new mysqli("localhost", "root", "", "sensless");
if($conex->connect_error){
    die("Error de conexión: " . $conex->connect_error);
}
