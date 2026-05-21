<?php
/*****************************************************
 * IM4 Washy - poll.php
 * Wird vom Arduino alle 2 Sekunden aufgerufen.
 * Prüft ob ein Kind dieses Geräts auf eine
 * Chip-Registrierung wartet (register_pending = 1).
 *
 * GET Parameter: ?serial=SN-87654321
 *
 * Antwort wenn Auftrag vorhanden:
 *   { "auftrag": "registriere_chip", "kind_id": "3" }
 *
 * Antwort wenn kein Auftrag:
 *   { "auftrag": "" }
 *****************************************************/
require_once("../system/config.php");
header('Content-Type: application/json');

$serial = $_GET["serial"] ?? "";

if (!$serial) {
    echo json_encode(["auftrag" => ""]);
    exit;
}

// User anhand der Seriennummer finden
$stmtDevice = $pdo->prepare("SELECT user_id FROM devices WHERE serial_number = ? LIMIT 1");
$stmtDevice->execute([$serial]);
$device = $stmtDevice->fetch();

if (!$device) {
    echo json_encode(["auftrag" => "", "message" => "Gerät nicht gefunden"]);
    exit;
}

// Kind dieses Users suchen das auf Registrierung wartet
$stmt = $pdo->prepare("
    SELECT id FROM family_members 
    WHERE user_id = ? AND register_pending = 1 
    ORDER BY id DESC LIMIT 1
");
$stmt->execute([$device["user_id"]]);
$kind = $stmt->fetch();

if ($kind) {
    echo json_encode([
        "auftrag" => "registriere_chip",
        "kind_id" => (string)$kind["id"]
    ]);
} else {
    echo json_encode(["auftrag" => ""]);
}
?>