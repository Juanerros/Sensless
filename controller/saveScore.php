<?php

session_start();

require '../model/conex.php';

if (!isset($_SESSION['id_usuario'])) {
    echo 'Usuario no autenticado.';
    $_SESSION['msg'] = 'Logeate para guardar la partida.';

    $_SESSION['score'] = $_POST['score'];
    $_SESSION['time'] = $_POST['time'];
    $_SESSION['win'] = $_POST['win'];
    $_SESSION['seed'] = $_POST['seed'];
    $_SESSION['cause'] = $_POST['cause'];

    header('Location: ./../view/pages/Login.php');
    exit();
}

$score = $_SESSION['score'];
$time = $_SESSION['time'];
$win = $_SESSION['win'];
$seed = $_SESSION['seed'];
$cause = $_SESSION['cause'];

$query = "INSERT INTO partidas (puntos, tiempo, gano, semilla, causa_muerte, id_usuario) VALUES (?, ?, ?, ?, ?, ?)";

$stmt = $conex->prepare($query);
$stmt->bind_param("ississ", $score, $time, $win, $seed, $cause, $_SESSION['id_usuario']);
$stmt->execute();
$result = $stmt->affected_rows;

if ($result > 0) {
    echo 'Partida guardada exitosamente!';
    $_SESSION['msg'] = 'Partida guardada exitosamente!';
    header('Location: ./../index.php');
    exit();
} else {
    echo 'Error al guardar la partida';
    $_SESSION['error'] = 'Error al guardar la partida';
    header('Location: ./../view/pages/Login.php');
    print_r($stmt->error);
    exit();
}

$_SESSION['score'] = null;
$_SESSION['time'] = null;
$_SESSION['win'] = null;
$_SESSION['seed'] = null;
$_SESSION['cause'] = null;

$stmt->close();
$conex->close();