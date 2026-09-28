# Kaufversuch mit vorbereiteten Testpunkten

Stand: 28.09.2026. Der Nutzer möchte den echten Kaufpfad testen, ohne dafür
selbst weitere Vokabelrunden durchlaufen zu müssen. Die anschließende Pause
wurde ausdrücklich beendet. Die folgende Vorbereitung verändert keinen vorhandenen
Lernbereich und schreibt dem echten Profil keine Punkte gut.

## Getrennter Teststand

Für einen späteren Versuch liegt eine geprüfte
[synthetische Sicherung](../tests/fixtures/purchase-demo-1600.json) mit
einem Profil **Kauftest**, **1.600 Punkten** und **Level 9** bereit.
„Einfacher Drache“ ist damit verfügbar. Die Punkte entstehen
beim Erzeugen aus vollständigen synthetischen Übungsereignissen über dieselben
Produktbefehle wie im Trainer. Es werden weder Kontostände direkt gesetzt noch
Kaufprüfungen umgangen. Der Stand enthält keine persönlichen Inhalte,
Google-Anmeldung, PIN oder vorhandenen Drive-Käufe.

Der [Generator](../scripts/create-purchase-demo.mjs) lässt sich mit
`node scripts/create-purchase-demo.mjs` erneut ausführen. Er erzeugt fünf
Runden mit 150 richtigen Antworten: 1.500 Antwortpunkte plus 100 Rundenpunkte.
Die geschriebene Datei wurde mit dem Produktparser erneut erfolgreich geprüft:
Format v2, 252 Ereignisse, genau ein Profil und keine Kaufhistorie. Die
Übungstage liegen zwischen Februar und Juli 2026; Exportdatum ist der 01.09.2026.

**Diese Sicherung nicht in den bestehenden Familienlernstand importieren.**
Der Sicherungsimport ersetzt den aktiven Datensatzstand; er fügt nicht nur
ein weiteres Profil hinzu.

## Aktueller Versuch

Die Sicherung ist bereits im separaten Codex-Browser importiert; dort zeigt
„Kauftest“ nach zwei erfolgreichen Testkäufen noch **1.000 verfügbare Punkte**,
1.600 Lernpunkte und Level 9. Der eigene Drive-Testbereich und die Kaufaktivierung
sind eingerichtet. Nach dem Update auf Cache v31 wurde ohne erneute
Google-Anmeldung Drachenstufe 3 für 400 Punkte gekauft und bewusst ausgewählt.
Stufe 2 war bereits für 200 Punkte gekauft. Guthaben, Besitz und Auswahl sind
nach Neuladen erhalten. Die neue Vorschau erschien nach etwa 21 Sekunden,
die Bestätigung nach etwa 44 Sekunden; zuvor war die Bestätigung erst nach
knapp zwei Minuten sichtbar. Das ist ein einzelner beobachteter Durchgang,
keine allgemeine Zeitgarantie oder Nutzerabnahme des Tempos.
Die übrigen 1.000 Testpunkte reichen für Stufe 4 (800).
Vor einem weiteren Kauf den aktuellen Google-Status prüfen: Direkt nach dem
letzten Reload erschien ein Verbindungshinweis; die anschließende automatische
Nachkontrolle lieferte wegen eines Werkzeug-Timeouts kein Ergebnis.
Details und nächster Schritt stehen im
[Tempobericht](reports/2026-09-28-kaufablauf-tempo.md) und der
[Laptop-Übergabe](handoffs/2026-09-28-laptop-fortsetzung.md).
Den bereits erfolgten Import nicht wiederholen.

## Ablauf für eine neue, leere Testumgebung

1. Ein separates, leeres Browserprofil ausschließlich für den Kauftest öffnen.
   Die private [Trainer-App](https://vokabeltrainer.marco-civico.workers.dev/trainer/)
   dort aufrufen. Den bisherigen Chrome-Bestand geöffnet und erhalten lassen.
2. Die lokale Ersteinrichtung mit synthetischen Angaben abschließen. Eine
   eigene lokale PIN im Browser eingeben; sie gehört nicht in Chat oder Git.
3. Im separaten Profil unter „Für Erwachsene“ → „Einstellungen“ → „Sicherung“
   die Datei `tests/fixtures/purchase-demo-1600.json` auswählen, Vorschau prüfen und nur diesen
   leeren Teststand ersetzen. Dabei noch keinen bestehenden Drive-Bestand wählen.
4. Vor dem echten Kauf das vorhandene Google-Konto verbinden und bewusst
   einen **neuen, eindeutig benannten Kauftest-Lernbereich** anlegen.
   Den echten Lernbereich nicht als Ziel verwenden. Figuren und Käufe bei
   Bedarf über die bestehende Erwachsenenfunktion aktivieren und abgleichen.
5. Im Testprofil einen tatsächlich bebilderten und bezahlbaren Artikel wählen.
   Start der Kaufvorschau, ausdrückliche Bestätigung und Abschluss zeitlich
   erfassen. Anschließend Besitz, Guthaben, Auswahl und Wiederöffnung prüfen.

Der getrennte Browser- und Drive-Teststand ist eingerichtet. Zwei echte
Käufe mit synthetischen Punkten und ihr Erhalt nach Neuladen sind bestätigt.
Einrichtung und Import für diesen bestehenden Teststand nicht wiederholen.
