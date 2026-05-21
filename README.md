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

1. *Was benötige ich an Infrastruktur?*
2. *Was muss ich auf meinem Webserver installieren?*  
3. *Wie kann ich die Datenbank importieren?*  
4. *Wo muss ich die DB-Credentials eintragen?*  
5. *…*  
6. *Wie nehme ich das physische Artefakt in Betrieb?*

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
