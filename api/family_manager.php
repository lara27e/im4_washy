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

$emojiMapping   = [1 => '🐢', 2 => '🐬', 3 => '🦭', 4 => '🦈', 5 => '🐧', 6 => '🐙'];
$reverseMapping = ['🐢' => 1, '🐬' => 2, '🦭' => 3, '🦈' => 4, '🐧' => 5, '🐙' => 6];

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
    $data   = json_decode(file_get_contents("php://input"), true);
    $name   = trim($data['name']  ?? '');
    $role   = trim($data['role']  ?? 'Kind');
    $color  = trim($data['color'] ?? 'pink');
    $emoji  = $data['emoji'] ?? '';
    $iconId = $reverseMapping[$emoji] ?? 1;

    try {
        // Kind speichern – bracelet NULL, register_pending = 1
        // damit der Arduino weiss dass er auf einen Chip warten soll
        $sql  = "INSERT INTO family_members (role, name, color, icon, bracelet, register_pending, user_id) 
                 VALUES (?, ?, ?, ?, NULL, 1, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$role, $name, $color, $iconId, $user_id]);
        $kind_id = $pdo->lastInsertId();

        echo json_encode([
            "status"  => "success",
            "id"      => $kind_id,
            "message" => "Kind gespeichert – bitte Chip ans Gerät halten"
        ]);

    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

// ══════════════════════════════════════════════════════════════
// FALL 3: CHIP-VERBINDUNG LÖSEN (DELETE)
// Setzt bracelet auf NULL und register_pending auf 0
// Der Chip kann danach einem neuen Kind zugewiesen werden
// ══════════════════════════════════════════════════════════════
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data    = json_decode(file_get_contents("php://input"), true);
    $kind_id = $data['id'] ?? null;

    if (!$kind_id) {
        echo json_encode(["status" => "error", "message" => "Keine Kind-ID angegeben"]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("SELECT id FROM family_members WHERE id = ? AND user_id = ?");
        $stmt->execute([$kind_id, $user_id]);
        if (!$stmt->fetch()) {
            echo json_encode(["status" => "error", "message" => "Kind nicht gefunden"]);
            exit;
        }

        // Chip lösen: bracelet = NULL, pending = 0
        $stmt = $pdo->prepare("
            UPDATE family_members 
            SET bracelet = NULL, register_pending = 0 
            WHERE id = ?
        ");
        $stmt->execute([$kind_id]);

        echo json_encode(["status" => "success", "message" => "Chip-Verbindung gelöst"]);

    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}
?>