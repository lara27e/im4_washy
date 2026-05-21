<?php
/*****************************************************
 * IM4 Washy - check_chip.php
 * Wird vom Arduino aufgerufen wenn ein Chip gescannt wird.
 * Prüft ob die Chip-UID (bracelet) einem Kind zugewiesen ist
 * das zum Gerät (serial) gehört.
 * 
 * GET Parameter:
 *   ?serial=SN-87654321&bracelet=04A3F21B
 * 
 * Antwort wenn bekannt:
 *   { "bekannt": true, "kind_id": "3", "name": "sheryn" }
 * 
 * Antwort wenn unbekannt:
 *   { "bekannt": false }
 *****************************************************/
require_once("../system/config.php");

header('Content-Type: application/json');

$serial   = $_GET["serial"]   ?? "";
$bracelet = $_GET["bracelet"] ?? "";

if (!$serial || !$bracelet) {
    echo json_encode(["bekannt" => false, "message" => "Fehlende Parameter"]);
    exit;
}

// Gerät dem richtigen User zuordnen
$stmtDevice = $pdo->prepare("SELECT user_id FROM devices WHERE serial_number = ? LIMIT 1");
$stmtDevice->execute([$serial]);
$device = $stmtDevice->fetch();

if (!$device) {
    echo json_encode(["bekannt" => false, "message" => "Gerät nicht gefunden"]);
    exit;
}

$user_id = $device["user_id"];

// Prüfen ob bracelet einem Kind dieses Users zugewiesen ist
$stmt = $pdo->prepare("
    SELECT id, name FROM family_members 
    WHERE bracelet = ? AND user_id = ? AND bracelet IS NOT NULL
    LIMIT 1
");
$stmt->execute([$bracelet, $user_id]);
$kind = $stmt->fetch();

if ($kind) {
    echo json_encode([
        "bekannt"  => true,
        "kind_id"  => (string)$kind["id"],
        "name"     => $kind["name"]
    ]);
} else {
    echo json_encode(["bekannt" => false]);
}
?>