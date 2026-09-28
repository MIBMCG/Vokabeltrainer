# Kaufversuch mit vorbereiteten Testpunkten

Stand: 28.09.2026. Der Nutzer möchte den echten Kaufpfad testen, ohne dafür
selbst weitere Vokabelrunden durchlaufen zu müssen. Anschließend wurde eine
Pause beauftragt. Die folgende Vorbereitung verändert keinen vorhandenen
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

## Verwendung bei der nächsten Fortsetzung

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

Die separate Testumgebung ist noch nicht im Browser oder in Drive angelegt.
Ein echter Kauf und eine reale Zeitersparnis werden erst nach diesem Versuch
behauptet. Die vorherigen synthetischen Tests und die erfolgreiche Auslieferung
von v29 ersetzen diesen Versuch nicht.
