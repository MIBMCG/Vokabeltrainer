# Fortsetzung am Laptop – 18.09.2026

Der Nutzer hat nach dem Klonen und Einlesen ausdrücklich die Weiterarbeit beauftragt. Die Tagespause vom 17.09. ist beendet. Der bestätigte Gesamtentwurf, das Insel-Konzept und die zwölf technischen Präzisierungen bleiben verbindlich. Vollständige Produktumsetzung vor der echten Apple-Geräteabnahme; keine neue pauschale Freigabe nötig.

## Übernommener Stand

- Frischer Checkout auf `codex/vokabeltrainer-v1`, Ausgangspunkt `f67c206`; `main` enthält einen älteren Dokumentationsstand.
- Tasks 1–6 bereits unabhängig geprüft; Task 7 in `85b3629` implementiert.
- Node 26.8.2: Zwei Negativtests verwendeten `locks: undefined`, wodurch der Parameterdefault die vorhandenen Node-Web-Locks einsetzte. Commit `8b961ad` injiziert ausdrücklich `null`; ausschließlich zwei Teständerungen, unabhängig geprüft.
- Nach dieser Korrektur: `npm test` **191/191 bestanden**. Der frische Edge-Browserlauf des unveränderten Produktcodes bestand **2/2 Szenarien**; echte DOM-/IndexedDB-Pfade mit synthetischen Daten. Mobile Screenshots bei 390 und 320 Pixeln angesehen.

## Laufende Arbeit

Task 7 ist nach unabhängiger Nachprüfung abgeschlossen. Commit `99d8f13` behebt die übersehene Hintergrundarchivierung und Profilkonflikte sowie die angebotene Erweiterungsaktion ohne zusätzliche Kandidaten. Profilungültigkeit führt sichtbar und ohne Wertung zur Profilauswahl; eine weiterhin gültige Eingabe bleibt erhalten. Nachweise: **192/192 Node-Tests**, **5/5 fokussierte Practice-Tests**, **2/2 fokussierte Edge-Szenarien**. Siehe [Korrekturbericht](../reports/2026-09-18-uebungsbildschirm-korrektur.md) und [Node-26-Bericht](../reports/2026-09-18-node26-testkorrektur.md).

Task 8 (Inselreise, Avatar, Abzeichen) wird jetzt umgesetzt. Ein kleiner verbliebener Textbefund aus Task 7 wird in Task 13 korrigiert: Ohne zusätzliche Kandidaten ist die Erweiterungsschaltfläche verborgen, der erklärende Text verspricht aber weiterhin zusätzliche Wörter. Der frühere Minor zu verschachtelten `main`-Elementen bleibt Task 11 zugeordnet.

Danach folgen die Tasks 8–13 des [v1-Plans](../superpowers/plans/2026-09-17-vokabeltrainer-v1.md): Inselreise/Avatar, Produktsynchronisation, Sicherung/Wiederherstellung, Erwachsenen-Integration, Offline-PWA und Gesamtprüfung.

## Lokale Prüfwerkzeuge

`npm test` benötigt keine Zusatzpakete. Der Browserharness unterstützt `PLAYWRIGHT_MODULE` und `BROWSER_EXECUTABLE`; am neuen Rechner sind diese auf eine verfügbare Playwright-Installation und Chromium/Edge zu setzen. Direkte Node-Testaufrufe verwenden in dieser Windows-Sandbox `--experimental-test-isolation=none`. Isolierte Headless-Browserstarts benötigen hier Prozessfreigabe außerhalb der Sandbox. Kein persönliches Browserprofil wird verwendet.

## Grenzen

Keine neuen realen Google-, Zwei-Geräte- oder Apple-Nachweise. Keine Bereitstellung, kein Merge nach main und kein Push im Rahmen dieses bisherigen Fortsetzungsschritts. Die ältere erfolgreiche manuelle Drive-Probe bleibt ein eigener historischer Nachweis, keine Produktabnahme.
