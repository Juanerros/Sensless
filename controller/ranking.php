<?php

require './model/conex.php';

$query = "SELECT p.*, u.nombre FROM partidas p JOIN usuarios u ON p.id_usuario = u.id_usuario ORDER BY p.puntos DESC LIMIT 10";

$stmt = $conex->prepare($query);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $ranking = $result->fetch_all(MYSQLI_ASSOC);
    return $ranking;
} else {
    echo 'Error al obtener el ranking.';
    $_SESSION['error'] = 'Error al obtener el ranking.';
    header('Location: ./../view/pages/Login.php');
    exit();
}

$stmt->close();
$conex->close();