<?php
// register.php
session_start();
header('Content-Type: application/json');
require_once '../system/config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    $email     = trim($data['email'] ?? '');
    $password  = trim($data['password'] ?? '');
    $firstname = trim($data['firstname'] ?? ''); // Neu hinzugefügt
    $lastname  = trim($data['lastname'] ?? '');  // Neu hinzugefügt

    if (!$email || !$password || !$firstname || !$lastname) {
        echo json_encode(["status" => "error", "message" => "Alle Felder werden benötigt"]);
        exit;
    }

    // Check email
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = :email");
    $stmt->execute([':email' => $email]);
    if ($stmt->fetch()) {
        echo json_encode(["status" => "error", "message" => "Email existiert bereits"]);
        exit;
    }

    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // SQL erweitert um firstname und lastname (siehe Bild 2)
    $insert = $pdo->prepare("INSERT INTO users (email, password, firstname, lastname) VALUES (?, ?, ?, ?)");
    $insert->execute([$email, $hashedPassword, $firstname, $lastname]);

    $newUserId = $pdo->lastInsertId();

    echo json_encode([
        "status" => "success",
        "user_id" => $newUserId 
    ]);
    exit; // Wichtig: Hier abbrechen
}