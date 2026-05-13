<?php
// register_device.php
session_start();
header('Content-Type: application/json');

// Fehleranzeige für die Entwicklung (später im Live-Betrieb entfernen)
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once '../system/config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // JSON-Daten empfangen
    $data = json_decode(file_get_contents("php://input"), true);

    $user_id       = $data['user_id'] ?? null;
    $serial_number = trim($data['serial_number'] ?? '');

    // Validierung
    if (!$user_id || !$serial_number) {
        echo json_encode(["status" => "error", "message" => "User-ID und Seriennummer sind erforderlich"]);
        exit;
    }

    if (strlen($serial_number) > 16) {
        echo json_encode(["status" => "error", "message" => "Seriennummer zu lang (max. 16 Zeichen)"]);
        exit;
    }

    try {
        // Prüfen, ob das Gerät schon registriert ist (Optional, aber empfohlen)
        $check = $pdo->prepare("SELECT id FROM devices WHERE serial_number = :sn");
        $check->execute([':sn' => $serial_number]);
        if ($check->fetch()) {
            echo json_encode(["status" => "error", "message" => "Dieses Gerät ist bereits registriert"]);
            exit;
        }

        // Gerät in die Datenbank eintragen (basierend auf Bildschirmfoto 2026-05-13 um 10.51.37.png)
        $stmt = $pdo->prepare("INSERT INTO devices (user_id, serial_number) VALUES (:uid, :sn)");
        $stmt->execute([
            ':uid' => $user_id,
            ':sn'  => $serial_number
        ]);

        echo json_encode([
            "status" => "success", 
            "message" => "Gerät erfolgreich mit User $user_id gekoppelt",
            "device_id" => $pdo->lastInsertId()
        ]);

    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Datenbankfehler: " . $e->getMessage()]);
    }

} else {
    echo json_encode(["status" => "error", "message" => "Ungültige Methode"]);
}