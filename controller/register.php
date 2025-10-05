<?php

require '../model/conex.php';

$name = $_POST['nombre'];
$password = $_POST['clave'];

$query = "INSERT INTO usuarios (nombre, clave) VALUES (?, ?)";

$stmt = $conex->prepare($query);
$stmt->bind_param("ss", $name, $password);

if ($stmt->execute()) {
    echo 'Registro exitoso!';
    session_start();
    $id_usuario = $conex->insert_id;
    $_SESSION['id_usuario'] = $id_usuario;
    $_SESSION['nombre'] = $name;
    header('Location: ./../view/pages/Login.php');
    exit();
} else {
    echo 'Error en el registro: ' . $stmt->error;
    session_start();
    $_SESSION['error'] = 'Error en el registro: ' . $stmt->error;
    header('Location: ./../view/pages/Register.php');
    exit();
}

$stmt->close();
$conex->close();
