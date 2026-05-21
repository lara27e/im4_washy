<?php
/*****************************************************
 * IM4 Washy - check_chip.php
 * Wird vom Arduino als POST-Request aufgerufen, wenn ein Chip gescannt wird.
 * * Ablauf:
 * 1. Prüft, ob der Chip bei diesem User bereits registriert ist.
 * -> Wenn ja: Gibt {"status": "bekannt", "kind_id": "...", "name": "..."} zurück.
 * 2. Wenn nein: Sucht nach einem neuen Mitglied mit register_pending = 1.
 * -> Wenn eins da ist: Speichert den Chip dort ab und gibt {"status": "neu"} zurück.
 * -> Wenn keins da ist: Gibt {"status": "unbekannt"} zurück.
 * * POST Body (JSON):
 * { "serial": "SN-87654321", "bracelet": "04A3F21B" }
 *****************************************************/
require_once("../system/config.php");

header('Content-Type: application/json');

// JSON-Body aus dem POST-Request auslesen
$input    = json_decode(file_get_contents('php://input'), true);
$serial   = $input["serial"]   ?? "";
$bracelet = $input["bracelet"] ?? "";

if (!$serial || !$bracelet) {
    echo json_encode(["status" => "error", "message" => "Fehlende Parameter im JSON-Body"]);
    exit;
}

// 1. Gerät dem richtigen User/Haushalt zuordnen
$stmtDevice = $pdo->prepare("SELECT user_id FROM devices WHERE serial_number = ? LIMIT 1");
$stmtDevice->execute([$serial]);
$device = $stmtDevice->fetch();

if (!$device) {
    echo json_encode(["status" => "error", "message" => "Geraet nicht gefunden"]);
    exit;
}

$user_id = $device["user_id"];

// 2. SCHRITT: Prüfen, ob das Bracelet bei diesem User bereits BEKANNT ist
$stmtCheck = $pdo->prepare("
    SELECT id, name FROM family_members 
    WHERE bracelet = ? AND user_id = ?
    LIMIT 1
");
$stmtCheck->execute([$bracelet, $user_id]);
$bekanntesKind = $stmtCheck->fetch();

if ($bekanntesKind) {
    // Der Chip existiert schon bei einem Kind -> Waschgang kann starten!
    // Kompaktes JSON ohne Leerzeichen für das indexOf() im Arduino
    echo '{"status":"bekannt","kind_id":"' . $bekanntesKind["id"] . '","name":"' . $bekanntesKind["name"] . '"}';
    exit;
}

// 3. SCHRITT: Der Chip ist NEU für diesen User.
// Wir suchen das Familienmitglied, das gerade auf ein Armband wartet.
$stmtPending = $pdo->prepare("
    SELECT id, name FROM family_members 
    WHERE user_id = ? AND register_pending = 1 AND (bracelet IS NULL OR bracelet = '')
    ORDER BY id DESC 
    LIMIT 1
");
$stmtPending->execute([$user_id]);
$wartendesKind = $stmtPending->fetch();

if ($wartendesKind) {
    // Wir haben ein Kind gefunden, das auf die Koppelung wartet!
    // Jetzt "verheiraten" wir den Chip mit dem Kind und setzen register_pending zurück.
    $stmtUpdate = $pdo->prepare("
        UPDATE family_members 
        SET bracelet = ?, register_pending = 0 
        WHERE id = ?
    ");
    $success = $stmtUpdate->execute([$bracelet, $wartendesKind["id"]]);

    if ($success) {
        // Erfolgreich gekoppelt!
        echo '{"status":"neu"}';
    } else {
        echo '{"status":"error","message":"Datenbank-Update fehlgeschlagen"}';
    }
} else {
    // Der Chip ist neu, aber es gibt aktuell kein Kind im System, das auf ein Armband wartet
    echo '{"status":"unbekannt"}';
}
?>