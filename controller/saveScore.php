<?php

session_start();

require '../model/conex.php';

$date = date('Y-m-d');
$name = $_POST['score'];
$time = $_POST['time'];
$win = $_POST['win'];
$seed = $_POST['seed'];
$cause = $_POST['cause'];

$query = "INSERT INTO partidas (puntos, fecha, tiempo, gano, semilla, causa_muerte, id_usuario) VALUES (?, ?, ?, ?, ?, ?, ?)";

$stmt = $conex->prepare($query);
$stmt->bind_param("isssssi", $name, $date, $time, $win, $seed, $cause, $_SESSION['id_usuario']);
$stmt->execute();
$result = $stmt->affected_rows;

if ($result > 0) {
    echo 'Partida guardada exitosamente!';
    $_SESSION['msg'] = 'Partida guardada exitosamente!';
    header('Location: ./../index.php');
    exit();
} else {
    echo 'Error al guardar la partida.';
    $_SESSION['error'] = 'Error al guardar la partida.';
    header('Location: ./../view/pages/Login.php');
    exit();
}

$stmt->close();
$conex->close();