<?php
session_start();
include_once "../system/config.php";

header("Content-Type: application/json");

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["status" => "error", "message" => "Nicht eingeloggt"]);
    exit;
}

$userID = $_SESSION['user_id'];

$data = json_decode(file_get_contents("php://input"), true);

$vorname = $data['vorname'] ?? '';
$nachname = $data['nachname'] ?? '';
$email = $data['email'] ?? '';
$oldPassword = $data['oldPassword'] ?? '';
$newPassword = $data['newPassword'] ?? '';

try {

    // Aktuellen User laden
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id");
    $stmt->execute([':id' => $userID]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(["status" => "error", "message" => "User nicht gefunden"]);
        exit;
    }

    // Passwort nur ändern wenn neues eingegeben wurde
    if (!empty($newPassword)) {

        if (!password_verify($oldPassword, $user['password'])) {
            echo json_encode(["status" => "error", "message" => "Altes Passwort falsch"]);
            exit;
        }

        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

        $update = $pdo->prepare("
            UPDATE users 
            SET firstname = :vorname,
                lastname = :nachname,
                email = :email,
                password = :password
            WHERE id = :id
        ");

        $update->execute([
            ':vorname' => $vorname,
            ':nachname' => $nachname,
            ':email' => $email,
            ':password' => $hashedPassword,
            ':id' => $userID
        ]);

    } else {

        // Nur Name & Email ändern
        $update = $pdo->prepare("
            UPDATE users 
            SET firstname = :vorname,
                lastname = :nachname,
                email = :email
            WHERE id = :id
        ");

        $update->execute([
            ':vorname' => $vorname,
            ':nachname' => $nachname,
            ':email' => $email,
            ':id' => $userID
        ]);
    }

    echo json_encode(["status" => "success"]);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
