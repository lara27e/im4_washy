<?php

session_start();

include_once "../system/config.php";

$userID = $_SESSION['user_id'];

$stmt = $pdo->prepare("SELECT * FROM users WHERE id = :userID");
$stmt->execute([':userID' => $userID]); 
$user = $stmt->fetch(PDO::FETCH_ASSOC);

echo json_encode([
    "status" => "success",
    "user_id" => $user['id'],
    "email" => $user['email'],
    "vorname" => $user['firstname'],
    "nachname" => $user['lastname'],
]);