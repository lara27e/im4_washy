## Kurzbeschreibung des Projekts

* **Modul:** Interaktive Medien 4 an der Fachhochschule Graubünden (FS26)  
* **Themenfeld:** IoT-Applikation zum Thema Eltern mit kleinen Kindern  
* **Name des Projekts:** \[*Washy*\]   
* **Team Physical Computing:** \[*Fabienne, Tabea*\]   
* **Team WebApp:** \[*Lara, Sheryn*\]
 
 
* Welches Problem im Alltag von Eltern mit kleinen Kindern wird gelöst? 

Viele kleine Kinder vergessen im Alltag das Händewaschen oder machen es nur ungenügend. Eltern müssen ihre Kinder deshalb häufig daran erinnern und kontrollieren, ob die Hände richtig gewaschen wurden. Das kann im stressigen Familienalltag zeitaufwendig und anstrengend sein.

Unser System unterstützt Eltern dabei, Kinder spielerisch und motivierend an regelmässiges sowie korrektes Händewaschen heranzuführen.

* Was ist der „Sinn und Zweck“ des Systems?

Der Sinn und Zweck des Systems ist es, Kindern die Bedeutung von Hygiene näherzubringen und sie zum richtigen Händewaschen zu motivieren. Durch spielerische Elemente soll das Händewaschen zu einer einfachen und positiven Gewohnheit werden.

Dadurch werden Eltern entlastet, die Hygiene im Alltag verbessert und das Risiko von Krankheiten reduziert.

\[*Bilder / GIFs (optional)*\]

### UX & Konzeption

*In diesem Teil werden die gemeinsamen Schritte aus der UX-Abgabe dokumentiert, damit sich hier alles vollständig an einem Ort befindet (betrifft WebApp und Physical Computing)*

* **Figma:** [https://www.figma.com/design/Nw53NZoeG5OGm27H7JYsSu/IM-4-%E2%80%93-App-Konzeption-Vorlage--Copy-?node-id=78-325&t=YUNeZCm5Ir8smF02-1]
* **User Flow \+ Screen Flow** (im4_washy\resources\assets\userflow.png) 
* ggf. weitere Ergänzungen
* *Welche Features waren angedacht?*
* *Welche Features wurden nicht umgesetzt? (Warum)*

### Setup

* **WebApp:** [https://im4washy.laraeberhard.ch/login.html]
* **Video-Dokumentation:** [Link zum Video auf Youtube](http://link.zum.video) 

#### Installationsanleitung WebApp

***verständliche** Schritt-für-Schritt-Anleitung für Aussenstehende, um das Projekt zu klonen und auf einem eigenen Server zu installieren*
Washy – Installationsanleitung
Diese Anleitung erklärt Schritt für Schritt, wie das Projekt geklont und auf einem eigenen Server installiert wird.

1. Benötigte Infrastruktur
Folgende Komponenten werden benötigt:
  Software / Server:
    Webserver mit PHP 8.0 oder neuer
    MySQL- oder MariaDB-Datenbank
    FTP-Client (z.B. FileZilla) zum Hochladen der Dateien
    Git (optional, zum Klonen des Repositories)

  Hardware (physisches Gerät):
    ESP32-C6 Mikrocontroller
    NeoPixel Ring mit 12 LEDs 
    PN532 NFC-Reader
    Druckknopf
    Regensensor (mit AO-Ausgang)
    Arduino IDE zum Flashen des ESP32

2. Webserver einrichten
Der Webserver benötigt folgende Voraussetzungen:
  PHP 8.0+ mit aktivierten Extensions: pdo, pdo_mysql, json, session
  MySQL / MariaDB Datenbank

3. Wie kann ich die Datenbank importieren?*
Schritt 1: In phpMyAdmin einloggen und eine neue Datenbank erstellen:
  CREATE DATABASE im4_washy
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

Schritt 2: Folgende Tabellen anlegen. Dazu im SQL-Tab von phpMyAdmin diesen Code ausführen:
CREATE TABLE users (
  id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email     VARCHAR(255) NOT NULL UNIQUE,
  password  VARCHAR(255) NOT NULL,
  firstname VARCHAR(100),
  lastname  VARCHAR(100),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE devices (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED NOT NULL,
  serial_number VARCHAR(50)  NOT NULL UNIQUE,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE family_members (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  role             VARCHAR(50)  NOT NULL DEFAULT 'Kind',
  name             VARCHAR(100) NOT NULL,
  color            VARCHAR(50),
  icon             INT,
  bracelet         VARCHAR(50)  DEFAULT NULL,
  register_pending TINYINT(1)   DEFAULT 0,
  user_id          INT UNSIGNED NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sensordata (
  id     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  kind   VARCHAR(50),
  seife  TINYINT(1)   DEFAULT 0,
  wasser TINYINT(1)   DEFAULT 0,
  erfolg TINYINT(1)   DEFAULT 0,
  time   DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

5. Datenbank-Zugangsdaten eintragen
Die Datei system/config.php öffnen und die Zugangsdaten anpassen:

<?php
$host     = 'localhost';
$dbname   = 'im4_washy';
$username = 'DEIN_DB_USER';
$password = 'DEIN_DB_PASSWORT';

$pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
?>

Diese Datei enthält sensible Daten und sollte nie in ein öffentliches Git-Repository hochgeladen werden.

6. Physisches Gerät in Betrieb nehmen
6a. Arduino IDE vorbereiten
In der Arduino IDE folgende Libraries installieren (über Sketch → Include Library → Manage Libraries):

Adafruit NeoPixel by Adafruit
Adafruit PN532 by Adafruit
Arduino_JSON by Arduino

Ausserdem den ESP32-C6 als Board installieren:

File → Preferences → Additional Boards Manager URLs folgende URL einfügen:
https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json

Danach unter Tools → Board → Boards Manager nach esp32 suchen und installieren
Board auswählen: ESP32C6 Dev Module

6b. Code anpassen
Die Datei haendewaschen.ino öffnen und folgende Zeilen anpassen:
const char* WIFI_SSID     = "DEIN_WLAN_NAME";
const char* WIFI_PASSWORD = "DEIN_WLAN_PASSWORT";
const char* SERIAL_NUMBER = "SN-XXXXXXXX";   // Einmalige Seriennummer für dieses Gerät
const char* API_URL       = "https://deine-domain.ch/api/load.php";
const char* API_CHECK_URL = "https://deine-domain.ch/api/check_chip.php";

6c. Verkabelung -> Siehe Steckplan

6d. Code hochladen
ESP32-C6 via USB mit dem Computer verbinden
In der Arduino IDE unter Tools → Port den richtigen Port auswählen
Upload drücken (Pfeil-Symbol)
Serial Monitor öffnen (115200 Baud) um zu prüfen ob WLAN-Verbindung und NFC funktionieren

7. Erstgebrauch in der App
App aufrufen und Konto erstellen (Register)
Unter Einstellungen die Seriennummer des Geräts eingeben (z.B. SN-12345678) um das Gerät mit dem Konto zu verknüpfen
Unter Familie Kind hinzufügen — danach erscheint ein Popup das auffordert, das Armband ans Gerät zu halten
Armband 5 Sekunden auf den NFC-Reader halten → Ring leuchtet blau als Bestätigung
Ab jetzt kann das Kind durch Draufhalten des Armbands einen Waschgang starten

#### Bauanleitung Physical Computing

* ***Was muss ich wie bauen, verbinden, installieren?***  
* *ergänze: **Komponentenplan** (betrifft Physical Computing, vgl. Slides Kapitel 15): Schaubild enthält*  
  * *die eingesetzten Komponenten*  
  * *die verbundenen Sensoren und Aktoren*  
  * *die Programme (mit Dateinamen)*  
  * *die Kommunikationswege*  
* *ergänze: **Steckplan** (betrifft Physical Computing, vgl. Slides Kapitel 15): generiert z.B. mit Fritzing (empfohlen), Tinkercad, Wokwi*  
  * *beachtet die [Fritzing Parts](https://github.com/Interaktive-Medien/im_physical_computing/tree/main/15_Intro_Projektdoku) extra für euch*  
* *ggf. **Bildmaterial***

## technische Details

// Hier sollte das Verständnis ersichtlich sein / Wie stehen die Dateien in Beziehung zueinander, Wie reden Die Dateien miteinander, Wie ist der Weg der Daten

* **Projektstruktur / Code-Struktur:** \[*Hinweis: Der Code selbst muss im Repository liegen und im Kopfbereich jeder Datei eine kurze Zusammenfassung enthalten.*\]  
* **Datenschnittstelle: \[***zwischen WebApp und Physical Computing*\]  
* **ERM:** \[*Erklärung und Schaubild*\]  
* **Authentifizierung:** \[*Erklärung*\]

## Known bugs

* Was funktioniert noch nicht einwandfrei?  
* Was ist uns aufgefallen bei der Entwicklung?  
* Was könnte noch verbessert werden?
Zusätzlich könnte beim WC ein Gewichts- oder Spülsensor angebracht werden, um zu erfassen, wie oft die Toilette benutzt wurde. Aktuell wird lediglich das Händewaschen getrackt, ohne dass klar ist, ob zuvor ein Toilettengang stattgefunden hat. Durch die Kombination der WC-Daten mit den Daten zum Händewaschen liesse sich besser abschätzen, ob ein Kind nach dem Toilettengang die Hände gewaschen hat. Gleichzeitig könnten Händewaschgänge vor dem Essen besser eingeordnet werden: Wenn kein Toilettengang registriert wurde, aber ein Händewaschvorgang stattfindet, spricht dies eher dafür, dass das Händewaschen im Zusammenhang mit der Essenshygiene steht. Dadurch würden die erhobenen Daten aussagekräftiger und besser interpretierbar.

Ein weiteres Problem besteht darin, dass keine Händewaschdaten erfasst werden, wenn das Kind sein Armband nicht an den Scanner hält. Dadurch können Lücken in den Daten entstehen, obwohl das Kind möglicherweise tatsächlich auf der Toilette war oder sich die Hände gewaschen hat. Ein zusätzlicher Bewegungssensor im Raum könnte hier helfen. Dieser würde erfassen, ob sich ein Kind im Bereich der Toilette oder des Waschbeckens aufgehalten hat, auch wenn das Armband nicht gescannt wurde. So könnten vergessene Scans erkannt und die Daten besser eingeordnet werden. Der Bewegungssensor würde zwar nicht direkt bestätigen, welches Kind die Handlung ausgeführt hat, könnte aber Hinweise darauf geben, dass eine Toiletten- oder Waschbeckennutzung stattgefunden hat, die vom System nicht korrekt erfasst wurde. Dadurch würden die Daten vollständiger und zuverlässiger.

## Umsetzungsprozess

* **Reflexion / Erfahrung / Lernfortschritt:** *Was haben wir gelernt? Würden wir es nochmal genauso machen? Was war gut, was war schlecht?*  
* **Herausforderungen & Lösungen:** \[*Verworfene Ansätze, Fehler, Umplanungen*\]  
Zu Beginn war geplant, nur ein einzelnes Gerät zu entwickeln, bei dem die Armbänder der Kinder registriert werden können. Während der Entwicklung wurde jedoch klar, dass bei mehreren Geräten im Einsatz, beispielsweise wenn das Produkt später auf den Markt kommen würde und mehrere Familien ein solches Gerät nutzen würden, würde ein grosses Problem entstehen:

Alle Daten der verschiedenen Kinder und Familien würden gemeinsam in derselben Datenbank gespeichert werden. Somit wären in der App Kinder von anderen Familien sichtbar. Dadurch bestand die Herausforderung darin, das System so zu programmieren, dass jede Familie nur die Daten ihrer eigenen Kinder sehen kann.

Eine weitere Schwierigkeit war die Registrierung der Armbänder. Der Scanner musste unterscheiden können, ob ein Kind bereits registriert ist oder ob ein neues Armband hinzugefügt werden soll. Anfangs passierte es, dass ein Armband erneut registriert wurde, wenn es zu lange an den Scanner gehalten wurde. Eigentlich sollte die Registrierung jedoch nur einmal beim ersten Einrichten stattfinden. Beim normalen Scannen sollte direkt der Händewaschprozess gestartet werden.

Deshalb musste das System angepasst werden, damit zwischen „Registrierungsmodus“ und „normalem Waschvorgang“ klar unterschieden werden kann.

* **KI-Einsatz:** *Claude, Gemini. ChatGPT und deren Nutzen*  
* **Fazit:** …
