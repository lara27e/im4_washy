<?php

ini_set('display_errors', 1);
error_reporting(E_ALL); 
/* muss später entfern werden*/

/*****************************************************
 * IM4 Washy - load.php
 * Empfängt JSON-Daten vom ESP32C6
 * und speichert sie in die Datenbank
 *****************************************************/

###################################### Datenbank-Verbindung
require_once("../system/config.php");


###################################### JSON-Daten empfangen
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);


###################################### Prüfen ob Daten vorhanden sind
if (!$input) {
    echo json_encode([
        "status" => "error",
        "message" => "Keine gültigen JSON-Daten erhalten"
    ]);
    exit;
}


###################################### Werte aus JSON holen

$kind    = $input["kind"] ?? "";
$seife   = $input["seife"] ?? 0;
$wasser  = $input["wasser"] ?? 0;
$erfolg  = $input["erfolg"] ?? 0;


###################################### Daten in DB speichern

$sql = "INSERT INTO sensordata 
        (kind, seife, wasser, erfolg) 
        VALUES (?, ?, ?, ?)";

$stmt = $pdo->prepare($sql);

$success = $stmt->execute([
    $kind,
    $seife,
    $wasser,
    $erfolg
]);


###################################### Antwort an ESP32 senden

if ($success) {

    echo json_encode([
        "status" => "success",
        "message" => "Daten gespeichert"
    ]);

} else {

    echo json_encode([
        "status" => "error",
        "message" => "Fehler beim Speichern"
    ]);

}
?>