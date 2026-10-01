# Übergabe: Firefox-Aktualisierung

Stand: 01.10.2026. Nutzerfreigabe erteilt; begrenzte Korrektur abgeschlossen.
Produkt `6b1378096ff88284ba021e61f90442a11c495580`, Cache v47, privat aktiv.
Keine Pause angeordnet.

Firefox liefert bei der Aktivierungsnachricht ein separates natives
ServiceWorker-Objekt. Die bisherige Objektidentität verwarf diesen gültigen
Absender. Nun werden zusätzlich native Scriptadresse und aktiver Zustand
geprüft; Eingabesicherung und kontrolliertes Update bleiben erhalten.
Details, Ursache, Review und Belege stehen im
[Bericht](../reports/2026-10-01-firefox-update.md).

664/664 Node-Tests, 22 Edge-Browserfälle und zwei Firefox-Updatefälle
einschließlich ursprünglichem v46 → v47 bestehen. Das unabhängige Review
ist PASS. Worker `8fc4b574-141f-4203-bd80-d2c911385ffb` ist zu 100 Prozent
aktiv; sieben ausgelieferte Dateien sind bytegleich. Die Übernahme im
bestehenden Codex-Testbrowser erhält 450 verfügbare Punkte, 2.450 Lernpunkte,
Level 13, Drachenstufe 4 und die vorhandenen Wortangebote.

Automatisiert geprüft ist Firefox 153. Der Nutzer verwendet 156.0.1 mit
einem Tab und bestätigt: „Update klappt ohne Fehlermeldung“.
Der zusätzliche Firefox-Offlinetest liefert `NS_ERROR_OFFLINE` sowohl auf
dem unveränderten Ausgangsstand als auch auf dem korrigierten Stand und
bleibt separat offen. Daraus keine erfolgreiche Firefox-Offlineabnahme
ableiten; Edge-Offlinenachweis besteht. Physische Safari-/Handyprüfungen,
natürlicher Google-Tokenablauf und echte Geräteabgleiche bleiben offen.

Bei Fortsetzung zuerst Branch, Änderungen und GitHub-SHA frisch prüfen.
Bestehende Lernbereiche, PIN, Anmeldung, Punkte und Besitz erhalten;
keine Website-Daten löschen oder synthetische Bestände in vorhandene
Lernbereiche importieren. Das Bild-, Import- und Layoutpaket nicht wiederholen.

Konkreter nächster Prüfpunkt: die separate Firefox-Offlinegrenze gezielt
klären. Danach die verbleibenden Praxisnachweise und Optimierungen gemäß
[Roadmap](../ROADMAP.md) priorisieren. Die neue Startadresse mit künftigem
Programmnamen bleibt vorgemerkt; der genaue Name aus der angelegten E-Mail
fehlt noch in den Projektunterlagen. Anschließend folgen die fünf bereits
bestätigten Belohnungsideen in der vereinbarten Reihenfolge.
