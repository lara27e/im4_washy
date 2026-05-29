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
// FALL 1: DATEN LADEN (GET) INKLUSIVE SENSORDATA & AKTIVITÄTEN
// ══════════════════════════════════════════════════════════════
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // 1. Familienmitglieder & Statistiken laden
        $sqlMembers = "
            SELECT 
                f.*,
                COUNT(CASE WHEN DATE(s.time) = CURDATE() AND s.erfolg = 1 THEN 1 END) as heute_erfolg,
                COUNT(CASE WHEN DATE(s.time) = CURDATE() THEN 1 END) as heute_gesamt,
                COUNT(CASE WHEN DATE(s.time) = CURDATE() AND s.erfolg = 0 THEN 1 END) as heute_fail_total,
                COUNT(CASE WHEN DATE(s.time) = CURDATE() AND s.erfolg = 0 AND s.seife = 0 THEN 1 END) as heute_fail_no_soap,
                
                COUNT(CASE WHEN YEARWEEK(s.time, 1) = YEARWEEK(CURDATE(), 1) AND s.erfolg = 1 THEN 1 END) as woche_erfolg,
                COUNT(CASE WHEN YEARWEEK(s.time, 1) = YEARWEEK(CURDATE(), 1) THEN 1 END) as woche_gesamt,
                COUNT(CASE WHEN YEARWEEK(s.time, 1) = YEARWEEK(CURDATE(), 1) AND s.erfolg = 0 THEN 1 END) as vergessen_woche,
                COUNT(CASE WHEN YEARWEEK(s.time, 1) = YEARWEEK(CURDATE(), 1) AND s.erfolg = 0 AND s.seife = 0 THEN 1 END) as woche_fail_no_soap,
                
                COUNT(CASE WHEN s.erfolg = 1 THEN 1 END) as lifetime_erfolg,
                COUNT(CASE WHEN s.seife = 1 THEN 1 END) as lifetime_seife,
                COUNT(s.id) as lifetime_gesamt
            FROM family_members f
            LEFT JOIN sensordata s ON f.bracelet = s.kind
            WHERE f.user_id = ?
            GROUP BY f.id
        ";
        // FEHLTENDE ZEILEN WIEDER EINGEFÜGT:
        $stmtM = $pdo->prepare($sqlMembers);
        $stmtM->execute([$user_id]);
        $members = $stmtM->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($members as &$m) {
            $m['emoji'] = $emojiMapping[$m['icon']] ?? '❓';
        }

        // 2. Die 5 neuesten Aktivitäten für den Live-Feed laden
        $sqlActivities = "
            SELECT 
                s.erfolg, 
                s.seife, 
                s.wasser, 
                s.time, 
                f.name, 
                f.color, 
                f.icon 
            FROM sensordata s
            JOIN family_members f ON s.kind = f.bracelet
            WHERE f.user_id = ?
            ORDER BY s.time DESC
            LIMIT 5
        ";
        // FEHLTENDE ZEILEN WIEDER EINGEFÜGT:
        $stmtA = $pdo->prepare($sqlActivities);
        $stmtA->execute([$user_id]);
        $activities = $stmtA->fetchAll(PDO::FETCH_ASSOC);

        foreach ($activities as &$act) {
            $act['emoji'] = $emojiMapping[$act['icon']] ?? '✨';
        }
        
        // ==========================================
        // 3. NEU: BERECHNUNG FÜR DAS DIAGRAMM (Mo-So)
        // ==========================================
        $startOfWeek = date('Y-m-d 00:00:00', strtotime('monday this week'));

        // Wir holen alle Waschvorgänge der aktuellen Woche für die ganze Familie
        $stmtChart = $pdo->prepare("
            SELECT s.time, s.erfolg, f.id as child_id
            FROM sensordata s
            JOIN family_members f ON s.kind = f.bracelet
            WHERE f.user_id = ? AND s.time >= ?
        ");
        $stmtChart->execute([$user_id, $startOfWeek]);
        $chartRows = $stmtChart->fetchAll(PDO::FETCH_ASSOC);

        // Arrays für die 7 Tage (Mo-So) vorbereiten
        $chartData = [
            "family" => [
                "success" => [0,0,0,0,0,0,0],
                "fail"    => [0,0,0,0,0,0,0]
            ]
        ];

        foreach ($chartRows as $row) {
            // Wochentag ermitteln: date('N') gibt 1 (Mo) bis 7 (So). Wir machen daraus Index 0 bis 6.
            $dayIndex = date('N', strtotime($row['time'])) - 1;
            $childId = $row['child_id'];
            $isSuccess = ($row['erfolg'] == 1);

            // Wenn dieses Kind noch nicht im Array ist, leere Wochen-Arrays anlegen
            if (!isset($chartData[$childId])) {
                $chartData[$childId] = [
                    "success" => [0,0,0,0,0,0,0],
                    "fail"    => [0,0,0,0,0,0,0]
                ];
            }

            // Werte entsprechend hochzählen
            if ($isSuccess) {
                $chartData["family"]["success"][$dayIndex]++;
                $chartData[$childId]["success"][$dayIndex]++;
            } else {
                $chartData["family"]["fail"][$dayIndex]++;
                $chartData[$childId]["fail"][$dayIndex]++;
            }
        }
        // ==========================================

        // Senden des kombinierten Pakets (inklusive chartData!)
        echo json_encode([
            "members" => $members,
            "activities" => $activities,
            "chartData" => $chartData
        ]);

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
// FALL 3: MITGLIED BEARBEITEN (PUT)
// ══════════════════════════════════════════════════════════════
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data   = json_decode(file_get_contents("php://input"), true);
    $id     = $data['id']    ?? null;
    $name   = trim($data['name']  ?? '');
    $role   = trim($data['role']  ?? 'Kind');
    $color  = trim($data['color'] ?? 'pink');
    $emoji  = $data['emoji'] ?? '';
    $iconId = $reverseMapping[$emoji] ?? 1;

    if (!$id) {
        echo json_encode(["status" => "error", "message" => "Fehlende Mitglied-ID"]);
        exit;
    }

    try {
        $sql  = "UPDATE family_members 
                 SET role = ?, name = ?, color = ?, icon = ? 
                 WHERE id = ? AND user_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$role, $name, $color, $iconId, $id, $user_id]);

        echo json_encode([
            "status"  => "success",
            "message" => "Mitglied erfolgreich aktualisiert"
        ]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

// ══════════════════════════════════════════════════════════════
// FALL 4: MITGLIED VOLLSTÄNDIG LÖSCHEN (DELETE)
// ══════════════════════════════════════════════════════════════
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data    = json_decode(file_get_contents("php://input"), true);
    $kind_id = $data['id'] ?? null;

    if (!$kind_id) {
        echo json_encode(["status" => "error", "message" => "Keine Kind-ID angegeben"]);
        exit;
    }

    try {
        // 1. Prüfen, ob Mitglied existiert, und direkt die Bracelet-ID (Chip) mit auslesen
        $stmt = $pdo->prepare("SELECT id, bracelet FROM family_members WHERE id = ? AND user_id = ?");
        $stmt->execute([$kind_id, $user_id]);
        $member = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$member) {
            echo json_encode(["status" => "error", "message" => "Mitglied nicht gefunden oder keine Berechtigung"]);
            exit;
        }

        $bracelet_id = $member['bracelet'];

        // 2. NEU: Falls das Kind ein Armband gekoppelt hatte, löschen wir zuerst alle Sensordaten!
        if (!empty($bracelet_id)) {
            $stmtSensor = $pdo->prepare("DELETE FROM sensordata WHERE kind = ?");
            $stmtSensor->execute([$bracelet_id]);
        }

        // 3. Erst danach löschen wir das Mitglied selbst aus der Datenbank
        $stmtDelete = $pdo->prepare("DELETE FROM family_members WHERE id = ?");
        $stmtDelete->execute([$kind_id]);
        
        echo json_encode(["status" => "success", "message" => "Mitglied und alle dazugehörigen Wasch-Daten erfolgreich gelöscht"]);

    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}
?>