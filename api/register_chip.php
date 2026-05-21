<?php
/*****************************************************
 * IM4 Washy - register_chip.php
 * Empfängt die NFC-Chip-UID vom Arduino und speichert
 * sie unter bracelet beim entsprechenden Kind.
 * Setzt register_pending danach auf 0.
 *
 * POST Body:
 * { "serial": "SN-87654321", "kind_id": "3", "bracelet": "04A3F21B" }
 *****************************************************/
require_once("../system/config.php");
header('Content-Type: application/json');
 
$input    = json_decode(file_get_contents('php://input'), true);
$serial   = $input["serial"]   ?? "";
$kind_id  = $input["kind_id"]  ?? "";
$bracelet = $input["bracelet"] ?? "";
 
if (!$serial || !$kind_id || !$bracelet) {
    echo json_encode(["status" => "error", "message" => "Fehlende Felder"]);
    exit;
}
 
// Sicherstellen dass das Kind zum richtigen Gerät/User gehört
$stmtDevice = $pdo->prepare("SELECT user_id FROM devices WHERE serial_number = ? LIMIT 1");
$stmtDevice->execute([$serial]);
$device = $stmtDevice->fetch();
 
if (!$device) {
    echo json_encode(["status" => "error", "message" => "Gerät nicht gefunden"]);
    exit;
}
 
// Bracelet speichern + register_pending zurücksetzen
$stmt = $pdo->prepare("
    UPDATE family_members 
    SET bracelet = ?, register_pending = 0 
    WHERE id = ? AND user_id = ?
");
$ok = $stmt->execute([$bracelet, $kind_id, $device["user_id"]]);
 
if ($ok && $stmt->rowCount() > 0) {
    echo json_encode([
        "status"   => "success",
        "message"  => "Chip registriert",
        "kind_id"  => $kind_id,
        "bracelet" => $bracelet
    ]);
} else {
    echo json_encode(["status" => "error", "message" => "Kind nicht gefunden oder falscher User"]);
}
?>