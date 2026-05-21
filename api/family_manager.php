<?php
// api/family_manager.php
session_start();
header('Content-Type: application/json');
require_once '../system/config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["status" => "error", "message" => "Nicht eingeloggt"]);
    exit;
}

$user_id = $_SESSION['user_id'];

$emojiMapping    = [1 => '🐢', 2 => '🐬', 3 => '🦭', 4 => '🦈', 5 => '🐧', 6 => '🐙'];
$reverseMapping  = ['🐢' => 1, '🐬' => 2, '🦭' => 3, '🦈' => 4, '🐧' => 5, '🐙' => 6];

// ══════════════════════════════════════════════════════════════
// FALL 1: DATEN LADEN (GET)
// ══════════════════════════════════════════════════════════════
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->prepare("SELECT * FROM family_members WHERE user_id = ?");
        $stmt->execute([$user_id]);
        $members = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($members as &$m) {
            $m['emoji'] = $emojiMapping[$m['icon']] ?? '❓';
        }
        echo json_encode($members);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

// ══════════════════════════════════════════════════════════════
// FALL 2: KIND HINZUFÜGEN (POST)
// ══════════════════════════════════════════════════════════════
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data  = json_decode(file_get_contents("php://input"), true);
    $name  = trim($data['name']  ?? '');
    $role  = trim($data['role']  ?? 'Kind');
    $color = trim($data['color'] ?? 'pink');
    $emoji = $data['emoji'] ?? '';
    $iconId = $reverseMapping[$emoji] ?? 1;

    try {
        // Kind speichern – bracelet ist noch NULL, kommt später vom Arduino
        $sql  = "INSERT INTO family_members (role, name, color, icon, bracelet, user_id) 
                 VALUES (?, ?, ?, ?, NULL, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$role, $name, $color, $iconId, $user_id]);
        $kind_id = $pdo->lastInsertId();

        // Gerät des Users holen (Seriennummer für chip_registrations)
        $stmtDevice = $pdo->prepare("SELECT serial_number FROM devices WHERE user_id = ? LIMIT 1");
        $stmtDevice->execute([$user_id]);
        $device = $stmtDevice->fetch();

        if ($device) {
            // Registrierungsauftrag erstellen → Arduino holt diesen ab
            $serial = $device['serial_number'];
            $stmtReg = $pdo->prepare(
                "INSERT INTO chip_registrations (serial, kind_id, pending) VALUES (?, ?, 1)"
            );
            $stmtReg->execute([$serial, $kind_id]);

            echo json_encode([
                "status"  => "success",
                "id"      => $kind_id,
                "message" => "Kind gespeichert – bitte Chip ans Gerät halten",
                "serial"  => $serial
            ]);
        } else {
            // Kein Gerät gefunden – Kind trotzdem gespeichert, aber kein Chip-Auftrag
            echo json_encode([
                "status"  => "success",
                "id"      => $kind_id,
                "message" => "Kind gespeichert – kein Gerät gefunden, Chip-Registrierung übersprungen"
            ]);
        }

    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

// ══════════════════════════════════════════════════════════════
// FALL 3: KIND LÖSCHEN (DELETE)
// Chip-Verbindung lösen: bracelet wird auf NULL gesetzt
// ══════════════════════════════════════════════════════════════
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data    = json_decode(file_get_contents("php://input"), true);
    $kind_id = $data['id'] ?? null;

    if (!$kind_id) {
        echo json_encode(["status" => "error", "message" => "Keine Kind-ID angegeben"]);
        exit;
    }

    try {
        // Sicherstellen dass das Kind diesem User gehört
        $stmt = $pdo->prepare("SELECT id FROM family_members WHERE id = ? AND user_id = ?");
        $stmt->execute([$kind_id, $user_id]);
        if (!$stmt->fetch()) {
            echo json_encode(["status" => "error", "message" => "Kind nicht gefunden"]);
            exit;
        }

        // Bracelet lösen (auf NULL setzen) statt Kind löschen
        // → Chip kann danach einem neuen Kind zugewiesen werden
        $stmt = $pdo->prepare("UPDATE family_members SET bracelet = NULL WHERE id = ?");
        $stmt->execute([$kind_id]);

        // Offene Registrierungsaufträge für dieses Kind abbrechen
        $stmt = $pdo->prepare("UPDATE chip_registrations SET pending = 0 WHERE kind_id = ?");
        $stmt->execute([$kind_id]);

        echo json_encode(["status" => "success", "message" => "Chip-Verbindung gelöst"]);

    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}
?>