# Fortsetzung am Laptop – 18.09.2026

Historischer Arbeitsverlauf. Anschließend hat der Nutzer erneut pausiert und die Übergabe an den Desktop beauftragt. Maßgeblich ist jetzt die [Desktop-Pause](2026-09-18-desktop-pause.md).

Der Nutzer hat nach dem Klonen und Einlesen ausdrücklich die Weiterarbeit beauftragt. Die Tagespause vom 17.09. ist beendet. Der bestätigte Gesamtentwurf, das Insel-Konzept und die dokumentierten technischen Präzisierungen bleiben verbindlich. Vollständige Produktumsetzung vor der echten Apple-Geräteabnahme; keine neue pauschale Freigabe nötig.

## Übernommener Stand

- Frischer Checkout auf `codex/vokabeltrainer-v1`, Ausgangspunkt `f67c206`; `main` enthält einen älteren Dokumentationsstand.
- Tasks 1–6 bereits unabhängig geprüft; Task 7 in `85b3629` implementiert.
- Node 26.8.2: Zwei Negativtests verwendeten `locks: undefined`, wodurch der Parameterdefault die vorhandenen Node-Web-Locks einsetzte. Commit `8b961ad` injiziert ausdrücklich `null`; ausschließlich zwei Teständerungen, unabhängig geprüft.
- Nach dieser Korrektur: `npm test` **191/191 bestanden**. Der frische Edge-Browserlauf des unveränderten Produktcodes bestand **2/2 Szenarien**; echte DOM-/IndexedDB-Pfade mit synthetischen Daten. Mobile Screenshots bei 390 und 320 Pixeln angesehen.

## Laufende Arbeit

Task 7 ist nach unabhängiger Nachprüfung abgeschlossen. Commit `99d8f13` behebt die übersehene Hintergrundarchivierung und Profilkonflikte sowie die angebotene Erweiterungsaktion ohne zusätzliche Kandidaten. Profilungültigkeit führt sichtbar und ohne Wertung zur Profilauswahl; eine weiterhin gültige Eingabe bleibt erhalten. Nachweise: **192/192 Node-Tests**, **5/5 fokussierte Practice-Tests**, **2/2 fokussierte Edge-Szenarien**. Siehe [Korrekturbericht](../reports/2026-09-18-uebungsbildschirm-korrektur.md) und [Node-26-Bericht](../reports/2026-09-18-node26-testkorrektur.md).

Task 8 (Inselreise, Avatar, Abzeichen) ist in `6b83b48` implementiert; `ad3701c` ergänzt die in der Review geforderten direkten Freischaltprüfungen. Die fachliche Nachprüfung ist bestanden. Nachweise: **194/194 Node-Tests**, kompletter Trainer-Browserlauf **4/4**, erweiterter Rewards-Browserlauf **1/1**. [Bericht und tatsächliche Ansichten](../reports/2026-09-18-inselreise-avatar.md).

Task 9 (Produktsynchronisation) ist zunächst in `a1db93f` implementiert; der dortige Node-Lauf bestand **215/215 Tests**. Die unabhängige Review hat neun wichtige Fehler gefunden, unter anderem bei normalen Drive-Ordnern, gleichzeitigem lokalem Speichern während eines Beitritts, abgebrochener Cloudanlage, Integritätsprüfung und Abgleichstatus. Diese werden vor der Freigabe gezielt reproduziert und korrigiert. Task 9 ist daher noch nicht abgeschlossen.

Kleine vorgemerkte Befunde: Task 13 korrigiert den Erschöpfungstext ohne zusätzliche Kandidaten und stärkt den Fokus-Test, indem er den Austausch des alten Radio-DOM-Knotens vor der Fokusprüfung abwartet. Der frühere Minor zu verschachtelten `main`-Elementen bleibt Task 11 zugeordnet.

Nach der Freigabe von Task 9 folgen die Tasks 10–13 des [v1-Plans](../superpowers/plans/2026-09-17-vokabeltrainer-v1.md): Sicherung/Wiederherstellung, Erwachsenen-Integration, Offline-PWA und Gesamtprüfung.

## Lokale Prüfwerkzeuge

`npm test` benötigt keine Zusatzpakete. Der Browserharness unterstützt `PLAYWRIGHT_MODULE` und `BROWSER_EXECUTABLE`; am neuen Rechner sind diese auf eine verfügbare Playwright-Installation und Chromium/Edge zu setzen. Direkte Node-Testaufrufe verwenden in dieser Windows-Sandbox `--experimental-test-isolation=none`. Isolierte Headless-Browserstarts benötigen hier Prozessfreigabe außerhalb der Sandbox. Kein persönliches Browserprofil wird verwendet.

## Grenzen

Keine neuen realen Google-, Zwei-Geräte- oder Apple-Nachweise. Keine Bereitstellung, kein Merge nach main und kein Push im Rahmen dieses bisherigen Fortsetzungsschritts. Die ältere erfolgreiche manuelle Drive-Probe bleibt ein eigener historischer Nachweis, keine Produktabnahme.
