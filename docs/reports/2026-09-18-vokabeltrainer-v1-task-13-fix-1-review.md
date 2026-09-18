# Task 13 – unabhängige Nachprüfung der Korrekturrunde 1

Prüfbasis: `6deba7e74c85bf7ef291c559999fc4c75aabc1c4` → `0ea95025a6b2e738ed34503dc613704143d0c83b`; Produktkorrektur `11e3128`. Gegenstand sind ausschließlich I1, I2, M1 und neue Fehler im Korrekturdiff.

## Finding Verdicts

- **I1 – falsche R-/E-Zuordnung und fehlende konkrete Nachweise — ADDRESSED.** Die Matrix führt nun sämtliche R01–R33 einzeln mit passenden Referenten auf: R10 Lernstandsübersicht, R21 Schreibweisenbewertung, R22 erlaubte Varianten; Umfangs-/Prozessentscheidungen werden von Produktprüfungen getrennt (`docs/reports/2026-09-18-vokabeltrainer-v1.md:43`, `:52`, `:63`, `:64`). E02/E03/E05 enthalten wieder ihre fachlichen Regeln, E06 den PIN-Ablauf und E07 den Umgang mit ungeklärten Konfliktwörtern; E09 weist die reale Safari-/Home-Bildschirm-/Zwei-Geräte-Abnahme ausdrücklich als offen aus (`:82`–`:89`). Benannte Testfälle und versionierte Detailberichte sind auffindbar. Die gezielte Referenzkontrolle bestätigte unter anderem die Lernstandsassertion nach Archivierung/Reaktivierung (`tests/browser/trainer.browser.mjs:840`–`:846`), die Schreibweisenprüfung (`tests/trainer/learning.test.js:44`), PIN-Fälle (`tests/trainer/adult.test.js:88`–`:209`) und das Ersetzen einer konfliktbehafteten Aufgabe ohne Wertung (`tests/trainer/rounds.test.js:287`). Das ist eine korrigierte Nachweiszuordnung, keine neue Vollprüfung dieser unveränderten Produktfunktionen.

- **I2 – unzutreffende beziehungsweise nicht dauerhaft erhaltene Prüfhistorie — ADDRESSED.** Die neue versionierte Historie bewahrt für Tasks 1–6 Kommandos, RED-/GREEN- und Abschlusszählungen, wesentliche Reviewkorrekturen sowie abschließende Urteile (`docs/reports/history/2026-09-18-tasks-1-6-evidence.md:5`, `:24`, `:51`, `:71`, `:88`, `:108`). Task 2 ist korrekt mit 16 gezielten und 108 gesamten Tests dokumentiert; Task 7/8 besitzen konkrete Zahlen und verlinkte vorhandene Detailberichte (`docs/reports/2026-09-18-vokabeltrainer-v1.md:97`, `:102`, `:103`). Die Werte wurden gegen die erhaltenen früheren Berichte abgeglichen. Der Arbeitsstand verweist jetzt ausdrücklich auf den dauerhaften Auszug statt auf vermeintlich bereits vorhandene frühe Detailberichte (`ARBEITSSTAND.md:31`). Task 13 hält die rekonstruierbare fokussierte Evidenz fest und benennt den nicht erhaltenen langen Browserfilter sowie fehlende separate TAP-Logs offen (`docs/reports/2026-09-18-vokabeltrainer-v1.md:15`–`:21`). Historische Gesamtergebnisse sind an `3b1d16d` gebunden; ein neuer Gesamtlauf auf dem Fixcode wird nicht behauptet (`:9`, `:27`, `:108`).

- **M1 – Profilwahl verliert angeforderte Zielansicht — ADDRESSED.** Der Aufruf der Profilauswahl merkt die angeforderte Ansicht; die Profilaktion konsumiert sie einmal und fällt ansonsten weiterhin auf Üben zurück (`src/trainer/ui/shell.js:214`–`:219`, `:247`–`:250`). Der erweiterte Browserfall wählt für Üben, Reise und Avatar tatsächlich ein Profil aus und wartet jeweils auf die passende Zielüberschrift (`tests/browser/trainer.browser.mjs:727`–`:745`). Der Bericht enthält den ursprünglichen Timeout auf „Deine Inselreise“ sowie denselben fokussierten Befehl mit RED 0/1 und GREEN 1/1 (`docs/reports/2026-09-18-vokabeltrainer-v1.md:19`–`:20`).

## New Breakage in the Fix Diff

**None.** Keine neuen Critical-/Important-/Minor-Befunde im geprüften Korrekturdiff.

Die Shelländerung ist durch eine erhöhte Produktcacheversion abgedeckt (`trainer/sw.js:3`). Harness-Grundversion, Ersetzungsmarker, erlaubte Testversion und Browsererwartungen verwenden konsistent Produkt `v4` und synthetisches Update `v5` (`tests/browser/trainer-harness.mjs:21`, `:27`, `:104`; `tests/browser/trainer.browser.mjs:1709`, `:1766`, `:1784`). Es wird kein bereits durchgeführter aktueller vollständiger Updatebrowserlauf behauptet; dieser bleibt Teil des nachgelagerten Abschlusses (`docs/handoffs/2026-09-18-vokabeltrainer-v1.md:44`).

## Out-of-Scope Observations

**Keine neuen.** Gesamtbranchprüfung und reale Produkt-/Geräte-/HTTPS-Nachweise bleiben gesonderte Schritte (`docs/reports/2026-09-18-vokabeltrainer-v1.md:143`). Der offen dokumentierte Verlust des historischen langen Browserfilters lässt sich durch eine neue Testausführung nicht rückwirkend beheben und wird nicht als weitere Fixrunde behandelt.

## Prüfungen und Grenzen

- Korrekturpaket in begrenzten Abschnitten geprüft; bereits bekannte Ausgangsreview und unveränderten Aufgabenvertrag verwendet. Keine umfassende neue Prüfung der Tasks 1–12.
- Gezielte externe Referenzkontrolle ausschließlich für die korrigierte Matrix und Prüfhistorie: benannte Testfälle, alte Tasks-1–6-Berichtswerte und versionierte Task-7/8-Nachweise. Kein unverändertes Produktmodul erneut untersucht.
- Berichtete aktuelle fokussierte Evidenz vorhanden: Navigation RED 0/1 → GREEN 1/1 und Worker 8/8; der vorherige `spawn EPERM` ist getrennt als Umgebungsabbruch gekennzeichnet (`docs/reports/2026-09-18-vokabeltrainer-v1.md:19`–`:21`). Kein Test und keine Suite wiederholt: Die geprüften Änderungen hinterließen keine konkrete, durch vorhandene Evidenz unbeantwortete Reproduktionsfrage.
- Nach Abschluss der Diffprüfung meldete der Controller zusätzlich frische erfolgreiche Gesamtläufe auf `0ea9502`/Produkt `11e3128`: `npm test` 277/277 sowie `node --test tests/browser/trainer.browser.mjs` 11/11, jeweils Exit 0. Er dokumentiert diese unabhängig ausgeführten Abschlussnachweise gesondert. Die Probe wurde nicht erneut ausgeführt; ihr unveränderter letzter Nachweis bleibt 12/12 auf `3b1d16d`.
- Nur diesen Bericht geschrieben. Keine Produkt-, Index-, HEAD-, Konto- oder Browsermutation; persönlichen Server auf Port 4173 unberührt gelassen. Kein Commit, Push oder Merge.

## Verdict

**Fix round: All findings addressed, no new Critical/Important breakage.** I1, I2 und M1 sind geschlossen; Korrekturrunde 1 bestanden. Dies schließt das Task-13-Fixgate, nicht die nachfolgende Gesamtbranch- oder reale Geräteabnahme.
