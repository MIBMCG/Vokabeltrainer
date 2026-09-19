# A2 Implementierungsbericht

**Status:** DONE  
**BASE:** `b0e826c5b7e78d4aa5fa9727e317bf991c905a2c`
**Commit:** `10987b5ffc556fdeda95d8295811595a36b0ba22` (`feat: clarify practice modes and align learning screens with concept`)

## Ergebnis

- `activeWords` ist exportiert; `previewModes({projection,profileId,day,schedule=null})` liefert `all/latest/new` mit wahrheitsgetreuen Gesamt- und Verfügbarkeitszahlen, letzter Lektion und den vereinbarten Gründen.
- `commands.practiceChoices({profileId})` benutzt die injizierte Uhr und Datensatzzeitzone, speichert nichts und verbraucht keine ID.
- Der Rundenstart verwendet drei erklärte Radiokarten, 10/20/30 Antworten, eine verständliche Zusammenfassung und genau einen Start-Submit. Auswahl und Umfang bleiben beim erneuten Rendern erhalten; nicht verfügbare Modi nennen Grund und Alternative.
- Die Lernansicht nutzt die A1-Strandgrafik, eine ruhige helle Wortkarte und einen gerundeten türkisen Fortschritt. Eingabe und Hauptaktion bleiben in 320 x 568, 390 x 844, 844 x 390, 1024 x 768 sowie bei 200 Prozent Schrift erreichbar.
- Cache und synthetischer Update-Worker wurden wegen der Produktänderung gemeinsam von v7/v8 auf v8/v9 angehoben.
- Die A1-Review-Anmerkung ist behoben: Desktop-Reiseaufnahmen warten nach dem Resize ausdrücklich auf das geladene große Rasterbild und ein gesetztes Layout.

## Geänderte Produkt- und Testdateien

- `src/trainer/learning/rounds.js`
- `src/trainer/commands.js`
- `src/trainer/ui/practice.js`
- `trainer/styles.css`
- `trainer/sw.js`
- `tests/trainer/rounds.test.js`
- `tests/trainer/commands.test.js`
- `tests/browser/overhaul.browser.mjs`
- `tests/browser/trainer.browser.mjs`
- `tests/browser/trainer-harness.mjs`

## RED/GREEN und Verifikation

- RED: fokussierte Fachtests meldeten den fehlenden Export `activeWords`; danach fehlte `commands.practiceChoices` erwartungsgemäß. Ohne isolierte Node-Worker trat in der Umgebung `spawn EPERM` auf; der portable Lauf mit `--experimental-test-isolation=none` prüfte die tatsächlichen Produktfehler.
- GREEN fokussiert: 44/44 Node-Tests bestanden.
- GREEN A1/A2-Browser: 3/3 bestanden; Moduswahl allein erzeugt keine Runde, Navigation erhält Auswahl, Doppel-Submit erzeugt eine Runde, doppeltes Enter eine Antwort, neueste Lektion und Null-/Konfliktgründe werden gezeigt.
- Vollständiger Node-Lauf vor Commit: 285/285 bestanden.
- Vollständiger Trainer-Browserlauf vor Commit: 15/15 bestanden.
- `git diff --check`: ohne Befund.

## Visuelle Belege und Grenzen

Aktuelle synthetische Edge-Aufnahmen liegen unter `test-results/overhaul-a2/` (`round-start-390.png`, `asking-320x568.png`, `asking-844x390.png`, `asking-1024x768.png`, `asking-390-font-200.png`, `feedback-390.png`). Die erneuerte A1-Desktopaufnahme liegt unter `test-results/overhaul-a1/journey-1024.png` und wurde bytegleich nach `docs/reports/assets/2026-09-19-a1-journey-desktop.png` veröffentlicht. Die Aufnahmen wurden nach Bild- und Layout-Settling erzeugt und visuell geprüft; `asking-1024x768.png` zeigt die gesetzte untere Navigation. Die Testartefakte enthalten nur synthetische Daten. Die geringe Höhe simuliert eine Tastatursituation, ersetzt aber keine Prüfung mit echter iOS-Tastatur.

## Selbstreview

- Lernereignisse, Belohnungen, Fokus-/Entwurfsschutz und Fortsetzen-Ansicht bleiben erhalten.
- `totalCount` zählt aktive zugeordnete Wörter des Modus; `availableCount` berücksichtigt Fälligkeit, Ausschluss und Konflikt. Die optionale B2-Scheduling-Map wird ohne neue B2-Regelalgorithmen gelesen.
- Kein zweiter Kandidatenalgorithmus, keine neue Laufzeitabhängigkeit und keine persönlichen Browserdaten wurden eingeführt.
- Keine offenen A2-Bedenken.

## Fixrunde 1

**Fix-Basis:** `10987b5ffc556fdeda95d8295811595a36b0ba22`
**Fix-Commit:** `e0c237f1c8ff3a06602deba2030a5b1e06586475` (`fix: re-enable practice start after save failure`)

Der Reviewbefund wurde im tatsächlichen Browserpfad bestätigt: Nach einem fehlgeschlagenen `commands.start` blieb der einzelne Startbutton deaktiviert, obwohl `ui.busy` bereits zurückgesetzt war. Der Catch-Pfad ruft nun `updateSummary()` auf. Dadurch wird der Button wieder aus der unveränderten Modus-/Größenauswahl abgeleitet und ein direkter Retry möglich.

- RED: `node --test --experimental-test-isolation=none --test-name-pattern="explained mode selection" tests/browser/overhaul.browser.mjs` scheiterte nach einer einmalig simulierten IndexedDB-Schreibstörung an `false !== true`, weil „Runde starten“ deaktiviert blieb.
- GREEN: Derselbe fokussierte Browserfall bestand 1/1. Er bedient den echten Button, erhält „Letzte Vokabeln“ und „20 Antworten“, weist nach dem Fehler null neue Runden und nach dem Doppel-Submit-Retry genau eine neue Runde nach.
- Cacheprüfung: Produktcache v8 -> v9, synthetischer Updateworker v10. Der gezielte Fall `--test-name-pattern="offline update UI blocks typing" tests/browser/trainer.browser.mjs` bestand 1/1; die erste Ausführung deckte ausschließlich die lexikografische Reihenfolge `v10` vor `v9` in der Testerwartung auf.
- `git diff --check`: ohne Befund.
- Selbstreview: Der Fix verändert nur die Fehlererholung des vorhandenen Starts. Auswahl, Zusammenfassung, Einfach-Submit-Schutz und erfolgreicher Startpfad bleiben unverändert; keine Produkt-Testhooks ergänzt.

## Portable Bildnachweise

- [round-start-390.png](assets/2026-09-19-a2-round-start-390.png)
- [asking-320x568.png](assets/2026-09-19-a2-asking-320x568.png)
- [asking-844x390.png](assets/2026-09-19-a2-asking-844x390.png)
- [asking-1024x768.png](assets/2026-09-19-a2-asking-1024x768.png)
- [asking-390-font-200.png](assets/2026-09-19-a2-asking-390-font-200.png)
- [feedback-390.png](assets/2026-09-19-a2-feedback-390.png)
