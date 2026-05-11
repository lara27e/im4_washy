<?php
session_start();
require_once '../system/config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    $userID = $_SESSION['user_id'];
    $vorname = trim($data['vorname'] ?? '');
    $nachname = trim($data['nachname'] ?? '');

    if (!$vorname || !$nachname) {
        echo json_encode(["status" => "error", "message" => "Vorname and Nachname are required"]);
        exit;
    }

    //echo json_encode(["status" => "success", "vorname" => $vorname, "nachname" => $nachname]);


    // Check user in DB
    $stmt = $pdo->prepare("UPDATE users SET firstname = :vorname, lastname = :nachname WHERE id = :userID");
    $stmt->execute([":vorname" => $vorname, ":nachname" => $nachname, ":userID" => $userID]);
    $userUpdate = $stmt->fetch();

    // Verify password
    if ($userUpdate) {
        echo json_encode(["status" => "success"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid credentials"]);
    }

} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method"]);
} 

