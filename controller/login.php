<?php

require '../model/conex.php';

$name = $_POST['nombre'];
$password = $_POST['clave'];

$query = "SELECT * FROM usuarios WHERE nombre = ? AND clave = ?";

$stmt = $conex->prepare($query);
$stmt->bind_param("ss", $name, $password);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    echo 'Inicio de sesion exitoso!';
    session_start();
    $_SESSION['msg'] = 'Inicio de sesion exitoso!';
    $user = $result->fetch_assoc();
    $_SESSION['id_usuario'] = $user['id_usuario'];
    $_SESSION['nombre'] = $user['nombre'];
    if(isset($_SESSION['score'])){
        header('Location: ./saveScore.php');
    } else {
        header('Location: ./../index.php');
    }
    exit();
} else {
    echo 'Nombre de usuario o contraseña incorrectos.';
    session_start();
    $_SESSION['error'] = 'Nombre de usuario o contraseña incorrectos.';
    header('Location: ./../view/pages/Login.php');
    exit();
}

$stmt->close();
$conex->close();