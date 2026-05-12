<?php
session_start();
include_once "../system/config.php";

header("Content-Type: application/json");

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["status" => "error", "message" => "Nicht eingeloggt"]);
    exit;
}

$userID = $_SESSION['user_id'];

$stmt = $pdo->prepare("SELECT id, email, firstname, lastname FROM users WHERE id = :id");
$stmt->execute([':id' => $userID]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(["status" => "error", "message" => "User nicht gefunden"]);
    exit;
}

echo json_encode([
    "status" => "success",
    "user_id" => $user['id'],
    "email" => $user['email'],
    "vorname" => $user['firstname'],
    "nachname" => $user['lastname']
]);