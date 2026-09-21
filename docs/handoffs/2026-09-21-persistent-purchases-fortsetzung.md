# Fortsetzung der Kauf-Integration – 21.09.2026

Der Nutzer hat nach dem Abgleich mit GitHub ausdrücklich die Weiterarbeit an den Aufgaben beauftragt. Die Pause vom 20.09. ist beendet. Der [bestätigte Integrationsentwurf](../superpowers/specs/2026-09-20-persistent-purchases-design.md) und der [sechsteilige Plan](../superpowers/plans/2026-09-20-persistent-purchases.md) bleiben Grundlage; keine erneute allgemeine Startentscheidung nötig.

## Übernommener Stand

- Branch `codex/vokabeltrainer-v1`, Ausgangspunkt `777b3511e280f37de7aa0a940ca86b6b16a5fdbf`, beim Abruf identisch mit GitHub. 113 neuere Commits seit dem früheren Laptopstand übernommen.
- Vor der Umsetzung am 21.09. frisch geprüft: `npm test` **389/389 bestanden**, 0 Fehler, Node 26.8.2; `npm run check:docs` **194 Markdown-Dateien, 911 lokale Verweise, 0 Fehler**.
- Fünf lokale Dateien hatten abweichende Windows-Zeilenenden. Ausschließlich diese wurden an die gespeicherten LF-Inhalte angeglichen; anschließend war der Git-Arbeitsbereich sauber. Keine fachliche Änderung und kein zusätzlicher Commit dafür.
- Der bisherige Trainer und die isolierte Kaufprobe bleiben erhalten. Reale Probe10 ist bereits mit sechs Fällen bestanden; kein identischer Wiederholungslauf erforderlich. Das ist keine Produkt- oder Geräteabnahme.

## Laufende Arbeit

Task 1 ist in `7ec80fd` vorhanden; Korrekturrunde 1 ist in `5904dec` implementiert und unabhängig nachgeprüft. Alle vier wichtigen Befunde sind behoben: unerlaubter Epochenwechsel beim Kauf, Wiederverwendung alter Restoreepochen, unvollständige Herkunft bei erneutem Fremdrestore und unzureichend gebundene gespeicherte Schreibversuche. Jede Fehlerklasse wurde vor der Korrektur gezielt reproduziert. **49/49 fokussierte und 391/391 vollständige Node-Tests bestanden**, darunter 1.000 Restoretransaktionen auf neuen Zielepochen. [Umsetzungs- und Korrekturbericht](../reports/2026-09-21-persistent-purchases-task1-fix.md), [unabhängige Nachprüfung](../reports/2026-09-21-persistent-purchases-task1-review.md). Task 2 beginnt auf diesem geprüften Kern; das gesamte Kaufpaket ist damit noch nicht freigegeben.

Die beiden kleineren Reviewbefunde bleiben ausdrücklich für Task 3 vorgemerkt: tatsächliche Eventloop-Abgabe bei langen Historien sowie Erhaltung maschinenlesbarer Auth-/Netzfehler. Aktuell entsteht Task 2, Transport/Einrichtung. Danach folgen persistenter Service, gemeinsame Sync-/Restore-/Backupintegration, Oberfläche und Gesamtprüfung.

## Ausführungsentscheidungen

- Der bereits verwendete saubere Checkout auf dem eigenen Featurebranch wird weiterverwendet. Es entsteht kein verschachtelter Worktree. Bei späterem Isolationsbedarf muss die Arbeitskopie umgezogen werden; das Produkt hängt nicht davon ab.
- Der auf diesem Rechner fehlende Aufgabenstand wird aus den versionierten Berichten rekonstruiert. PowerShell ersetzt die hier zuvor an Sandbox-Pipes gescheiterten Bash-Helfer. Die temporäre Koordination ist neu erzeugbar; alle wesentlichen Ergebnisse werden dauerhaft dokumentiert.
- Die abschließende Paketreview beginnt vor dem Kaufkern bei `f54bd5d`, nicht beim historischen `main`. Der langlebige Featurebranch enthält bereits geprüfte frühere Pakete. Zusätzliche Querschnittsprüfung bleibt bei konkreten Integrationsrisiken erforderlich.
- Umsetzung mit GPT-5.6 Sol/hoch; unabhängige Prüfung der Datenverträge und abschließende Paketreview mit GPT-6 Astra/hoch. Jeweils nur ein Produkt-Implementierer, keine parallelen Änderungen an denselben Modulen.
- Falls bereits Task 3 oder 4 neue Kaufmodule über die ausgelieferte Befehls-/Migrationsschicht lädt, werden Serverfreigabe, Worker-Assetliste und Cachekennung im selben Task ergänzt und Offline-/Updatepfad geprüft. Die engere Dateiliste des Plans darf diese bestehende Projektregel nicht bis Task 5 verschieben. Kosten: zusätzliche fokussierte Browserprüfung, keine Erweiterung des Produktumfangs.

## Grenzen

Keine echten Kaufaufträge oder Cloudmigrationen während der automatisierten Umsetzung. Alle Tests verwenden synthetische Daten. Die vollständige Bildproduktion bleibt außerhalb dieses Integrationspakets; verfügbare tatsächliche Bilder werden genutzt. Reale Wiederaufnahme, zwei physische Geräte, iPhone/iPad und HTTPS bleiben gesonderte Nachweise. Der bestehende Auftrag erlaubt den abschließenden Push auf den Entwicklungsbranch; kein Merge nach `main` und keine Veröffentlichung einer laufenden App.
