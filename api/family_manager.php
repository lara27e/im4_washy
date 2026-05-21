<?php
// api/family_manager.php
session_start();
header('Content-Type: application/json');

// Pfad zur Config - Prüfe unbedingt, ob dieser Pfad stimmt!
require_once '../system/config.php'; 

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["status" => "error", "message" => "Nicht eingeloggt"]);
    exit;
}

$user_id = $_SESSION['user_id'];
$emojiMapping = [1 => '🐢', 2 => '🐬', 3 => '🦭', 4 => '🦈', 5 => '🐧', 6 => '🐙'];
$reverseMapping = ['🐢' => 1, '🐬' => 2, '🦭' => 3, '🦈' => 4, '🐧' => 5, '🐙' => 6];

// FALL 1: DATEN LADEN (GET-Anfrage)
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

// FALL 2: DATEN SPEICHERN (POST-Anfrage)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $name  = trim($data['name'] ?? '');
    $role  = trim($data['role'] ?? 'Kind');
    $color = trim($data['color'] ?? 'pink');
    $emoji = $data['emoji'] ?? '';

    $iconId = $reverseMapping[$emoji] ?? 1;

    try {
        // Bracelet-Logik: Gibt es ein freies Gerät für diesen User?
        // Wir suchen ein Gerät des Users, das noch nicht in family_members vergeben ist
        $stmtDevice = $pdo->prepare("
            SELECT serial_number FROM devices 
            WHERE user_id = ? 
            AND serial_number NOT IN (SELECT bracelet FROM family_members WHERE user_id = ? AND bracelet IS NOT NULL)
            LIMIT 1
        ");
        $stmtDevice->execute([$user_id, $user_id]);
        $device = $stmtDevice->fetch();
        $bracelet_sn = $device ? $device['serial_number'] : null;

        // Eintrag in family_members (Spalten laut Bildschirmfoto 2026-05-13 um 15.41.16.png)
        $sql = "INSERT INTO family_members (role, name, color, icon, bracelet, user_id) 
                VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$role, $name, $color, $iconId, $bracelet_sn, $user_id]); // RICHTIG (Pfeil)

        echo json_encode(["status" => "success", "id" => $pdo->lastInsertId(), "bracelet" => $bracelet_sn]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}