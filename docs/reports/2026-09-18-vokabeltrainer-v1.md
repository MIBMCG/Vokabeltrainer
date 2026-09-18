# Prüfbericht Vokabeltrainer Version 1

- Datum: 18.09.2026
- Branch: `codex/vokabeltrainer-v1`
- Task-13-Ausgangscode: `3b1d16d`
- Dokumentationsbasis: `18a5722`, Metadaten `6deba7e`
- Reviewfix-1-Produktcode: `11e3128`

Version 1 ist implementiert und automatisiert geprüft. Die ursprünglichen frischen Gesamtläufe auf `3b1d16d` bestanden mit 277 Node-Tests, elf Trainer-Browsertests und zwölf Szenarien der getrennten Drive-Probe. Reviewfix 1 korrigiert die Abschlussmatrix und Prüfhistorie sowie die Weiterleitung nach profilfreier Navigation. Seine fokussierten Nachweise stehen unten. Die unabhängige Korrekturreview und die nachfolgende Gesamtbranchprüfung werden durch diesen Bericht nicht vorweggenommen.

Nicht nachgewiesen sind das Produktprotokoll mit echtem Google Drive auf zwei physischen Geräten, Safari und Home-Bildschirm-App auf iPhone/iPad, konkrete Mindestversionen und eine HTTPS-Bereitstellung. Die frühere echte Drive-Probe zwischen zwei Browsern desselben Rechners bleibt ein technischer Vorbeleg, keine Produkt- oder Geräteabnahme.

## Task-13-RED/GREEN-Evidenz

Für die ursprüngliche Task-13-Runde existiert kein separater TAP-Log und kein zusätzlicher Implementiererbericht. Das lange damalige `--test-name-pattern` des kombinierten Browserlaufs ist nicht dauerhaft erhalten und wird nicht erfunden.

- Erhaltener Preview-/Workerlauf: `node --test --experimental-test-isolation=none tests/trainer/preview.test.js tests/trainer/sw.test.js`. RED: 8/9 bestanden; der neue Vorschaufall erhielt für `round.abandoned` und `events.adopted` nur die generische Bezeichnung „Historische Lernänderung …“. GREEN: 9/9 bestanden.
- Der kombinierte Browserlauf umfasste die heute auffindbaren Fälle `trainer practice is resumable…`, `trainer setup…`, `trainer rewards…`, `trainer sync and restore exposes…`, `trainer unbound discovery…` und `trainer sync and restore keeps concurrent word versions…` in [trainer.browser.mjs](../../tests/browser/trainer.browser.mjs). Fachliche REDs: falscher Erschöpfungstext bei `canExpand=false`, profilfreie Zukunftsaussage, technischer Restoretext und falsche Mehrzahl. Der Avatar-Neuknotenfall war bereits grün. Der erste neue Authfall hatte einen Testaufbaufehler, weil der Erwachsenenbereich schon entsperrt war; er wurde vor einer Produktwertung korrigiert. Ein erster GREEN-Versuch scheiterte anschließend appweit an der fehlenden Serverfreigabe für `ui/status.js` (404). Nach der Routenfreigabe: 6/6 bestanden. Ein zusätzlicher Restorefall bestand 1/1.
- Reviewfix-1-RED: `node --test --test-name-pattern="trainer setup" tests/browser/trainer.browser.mjs` — 0/1; Timeout nach 30 Sekunden auf „Deine Inselreise“, weil die Profilwahl immer zu Üben führte.
- Reviewfix-1-GREEN: derselbe Befehl — 1/1 bestanden, etwa 3,5 Sekunden. Der Fall prüft Üben, Inselreise und Avatar jeweils bis zur tatsächlich gewünschten Ansicht.
- Cacheprüfung nach der Shelländerung: der isolierte Erstversuch `node --test tests/trainer/sw.test.js` endete an der bekannten Umgebung mit `spawn EPERM`; `node --test --experimental-test-isolation=none tests/trainer/sw.test.js` bestand 8/8. Der Produktcache ist jetzt `v4`, die abweichende Testupdatefassung `v5`.

## Frische Gesamtnachweise vor Reviewfix 1

Umgebung: Node.js 22.23.2, Playwright 1.62.1, Edge 153.0.4234.46 auf Windows. Für Browserläufe waren die dokumentierten optionalen Modul- und Browser-Overrides gesetzt. Kein Produktionspaket wurde ergänzt.

| Nachweis | Befehl | Ergebnis auf `3b1d16d` |
| --- | --- | --- |
| Node-Gesamtlauf | `npm test` | 277/277 bestanden |
| Trainer-Browserregression | `node --test tests/browser/trainer.browser.mjs` | 11/11 bestanden |
| Drive-Probe | separater freier lokaler Port, danach `node tests/browser/probe.browser.mjs` | 12/12 Szenarien, `pageErrors: []` |
| Dokumentation vor Fixrunde | `npm run check:docs` | 168 Dateien, 69 Markdowndateien, 227 lokale Links, 0 Fehler |
| Git-Whitespace | `git diff --check` | ohne Befund |

Die Trainerregression startete ihren eigenen Server. Der Probelauf verwendete ebenfalls einen eigenen freien Port; ein persönlicher Server auf Port 4173 wurde nicht beendet oder verändert. Der Offlinefall beendete den Testserver und öffnete danach neue kontrollierte Tabs sowie neu gestartete persistente Browserkontexte unter `/trainer/` und `/repo/trainer/`. Der Updatefall erreichte einen echten wartenden Worker und aktivierte ihn erst nach gesicherter Pause.

## Abdeckung R01–R33

Jede Zeile folgt der Definition in [ANFORDERUNGEN.md](../ANFORDERUNGEN.md). Ein Testbeleg nennt einen vorhandenen Testfall oder Detailbericht; Entscheidungen und reale Restprüfungen sind ausdrücklich als solche markiert.

| ID | Konkreter Beleg und Grenze |
| --- | --- |
| R01 | Zielgruppengestaltung ist in den sechs [aktuellen synthetischen Ansichten](#visuelle-prüfung) und im Browserfall `trainer setup…`/`trainer practice…` sichtbar. Alterseignung auf den Geräten des Hauptnutzers bleibt reale Abnahme. |
| R02 | Statische PWA und Unterpfadbetrieb: [Offline-/PWA-Bericht](2026-09-18-offline-pwa.md), Browserfall `trainer offline starts…`. Safari/iPhone/iPad und Mindestversionen bleiben offen. |
| R03 | Browserfall `trainer practice is resumable…` in [trainer.browser.mjs](../../tests/browser/trainer.browser.mjs): deutsches Wort und englische Texteingabe. |
| R04 | Derselbe Browserfall prüft Richtig-/Falsch-Text, Symbole und richtige Lösungen. |
| R05 | Derselbe Browserfall prüft gesperrtes Feedback und bewusstes „Weiter“/Enter ohne Doppelwertung. |
| R06 | Browserfall `trainer setup, adult decisions…` sowie [Task-6-Historie](history/2026-09-18-tasks-1-6-evidence.md): Vokabeln ohne JSON-Handarbeit verwalten. |
| R07 | [rounds.test.js](../../tests/trainer/rounds.test.js) — `new selection stays frozen and failed single word cannot bypass gap`; [learning.test.js](../../tests/trainer/learning.test.js) — Fehlerabstand; Browserfall `trainer practice…`. |
| R08 | [learning.test.js](../../tests/trainer/learning.test.js) — `three correct answers persist across rounds…`; [rounds.test.js](../../tests/trainer/rounds.test.js) — `three correct answers pause a word…`. |
| R09 | [rounds.test.js](../../tests/trainer/rounds.test.js) — Fälle `latest mode…` und `new mode is profile-specific…`; Browserfall `trainer practice…` prüft die drei Karten. |
| R10 | Browserfall `trainer setup, adult decisions…` prüft die Erwachsenen-Lernstandsübersicht nach Übungen, Archivierung und Reaktivierung. |
| R11 | [Inselreise-/Avatarbericht](2026-09-18-inselreise-avatar.md) und Browserfall `trainer rewards…`: fertige Reise, Punkte/Level, sechs Abzeichen und Avatar. |
| R12 | [Synchronisationsbericht](2026-09-18-synchronisation-zwischenstand.md), [sync.test.js](../../tests/trainer/sync.test.js) — `two offline devices merge packets…`. Reales Produkt-Drive bleibt offen. |
| R13 | Bestätigte Kosten-/Anbietergrenze in [ANFORDERUNGEN.md](../ANFORDERUNGEN.md); keine zusätzliche Laufzeit- oder Cloudabhängigkeit im Repository. Dies ist eine Umfangsentscheidung, kein Produkttest. |
| R14 | [commands.test.js](../../tests/trainer/commands.test.js) — `rounds for another profile remain untouched…`; Browserfälle `trainer rewards…` und Sync-Zweikontextfall. Gemeinsamer echter Zugang auf zwei Geräten bleibt offen. |
| R15 | Privatgebrauch und fehlende Mandanten-/Klassenplattform sind dokumentierte Umfangsgrenzen; keine öffentliche Bereitstellung wurde durchgeführt. |
| R16 | Portable Startanleitung, aktuelle Übergabe und `npm run check:docs`; Remote-Push wird erst nach Review vom Controller verifiziert. |
| R17 | Dialogische Entscheidungen Q1–Q14 sind in [ANFORDERUNGEN.md](../ANFORDERUNGEN.md) und im bestätigten Entwurf erhalten. Dies ist Prozess-/Entscheidungsevidenz. |
| R18 | Browserfall `trainer practice…` prüft 10/20/30, Standard 10 und Fortschrittsanzeige; [rounds.test.js](../../tests/trainer/rounds.test.js) prüft Abschluss bei gewählter Größe. |
| R19 | [learning.test.js](../../tests/trainer/learning.test.js) — `three correct answers persist across rounds and scheduled reviews use 1/3/7/14/14 days` sowie DST-/Zeitzonenfall. |
| R20 | [rounds.test.js](../../tests/trainer/rounds.test.js) — `expansion adds only currently assigned eligible words and keeps the chosen size`; Browserfall `trainer practice…` prüft Beenden/Erweitern und `canExpand=false`. |
| R21 | [learning.test.js](../../tests/trainer/learning.test.js) — `accepted typography does not hide real spelling errors`; Browserfall prüft Großschreibung, Rand-Leerzeichen und Korrekturtext. |
| R22 | Browserfall `trainer setup…` legt mehrere Lösungen an; `trainer practice…` akzeptiert/zeigt die erlaubten Varianten. Fachvalidierung liegt in [schema.test.js](../../tests/trainer/schema.test.js). |
| R23 | [rewards.test.js](../../tests/trainer/rewards.test.js) — `ten correct answers and repeated completion claims award exactly 120 points`; Rundenfälle schließen leere/aufgegebene Boni aus. |
| R24 | [rewards.test.js](../../tests/trainer/rewards.test.js) — exakte Level-/Insel-/Zubehör-/Badgegrenzen; [Inselreise-/Avatarbericht](2026-09-18-inselreise-avatar.md). |
| R25 | Browserfall `trainer setup…` prüft Einzeleingabe, Tabellenvorschau, Dublettenentscheidung und Lektionen; [adult.test.js](../../tests/trainer/adult.test.js) prüft mehrdeutige Tabellenzeilen. |
| R26 | [commands.test.js](../../tests/trainer/commands.test.js) — profilgetrennte Runden; Browserfall `trainer setup…` prüft Zuordnungsänderung ohne Verlust. |
| R27 | [adult.test.js](../../tests/trainer/adult.test.js) — PIN-Salt, Änderung, Reset, Lock- und Racefälle; Browserfall `trainer setup…` prüft Reload-/Hintergrundsperre. PIN bleibt Bedienhürde. |
| R28 | Browserfälle `trainer unbound discovery…` und `trainer offline starts…`; ausstehende Antworten bleiben lokal. Dialogkomfort und Wiederanmeldung auf echten Apple-Geräten bleiben offen. |
| R29 | Browserfall `trainer sync and restore keeps concurrent word versions…`; [sync.test.js](../../tests/trainer/sync.test.js) — Zweikontextzusammenführung ohne Doppelwertung. |
| R30 | [Sicherungs-/Wiederherstellungsbericht](2026-09-18-sicherung-wiederherstellung.md), [restore.test.js](../../tests/trainer/restore.test.js) und Browserfall `trainer sync and restore exposes…`: Vollbackup, Vorschau, Bestätigung, Export ohne Token/PIN-Prüfwert. |
| R31 | Keine allgemeine Lizenz oder Sichtbarkeitsänderung im Repository; dokumentierte Umfangsentscheidung, kein Produkttest. |
| R32 | [commands.test.js](../../tests/trainer/commands.test.js) — `reload in feedback restores…` und `abandon stores one claim…`; Browserfall `trainer practice…` prüft Fortsetzen/Neustart. |
| R33 | [restore.test.js](../../tests/trainer/restore.test.js) — verifizierte Sicherheitskopie, konkurrierende Nachfolger, späte Offlineantwort und bewusste Adoption; Browser-Restorevorschau. |

## Abdeckung E01–E10

| ID | Konkreter Beleg und Grenze |
| --- | --- |
| E01 | Module unter `src/trainer/`, IndexedDB in `storage/store.js`, Service Worker und getrennte Lern-/UI-/Drive-Schichten; [Task-5-Historie](history/2026-09-18-tasks-1-6-evidence.md) und [Offlinebericht](2026-09-18-offline-pwa.md). Kein zusätzlicher Appserver. |
| E02 | [rounds.test.js](../../tests/trainer/rounds.test.js) prüft eingefrorene Auswahl, Fälligkeit, Fehlerabstand, echte Erschöpfung, keinen Leer-/Abbruchbonus und 20 Punkte nach mindestens einer Antwort. |
| E03 | [practice.test.js](../../tests/trainer/practice.test.js) — `keyAction…`; Browserfall `trainer practice…` prüft Prüfen/Weiter mit Enter und Korrekturtext. Animation ist abschaltbar/reduced-motion, Version 1 enthält keine Töne. Reale Bildschirmtastatur bleibt offen. |
| E04 | [Inselreise-/Avatarbericht](2026-09-18-inselreise-avatar.md): drei Inseln, 15 Etappen, Level je 200 Punkte, sechs Zubehörteile und sechs Abzeichen; Browsergrenzen geprüft. |
| E05 | [adult.test.js](../../tests/trainer/adult.test.js) und Browserfall `trainer setup…`: Tabellenvorschau, Archivieren/Reaktivieren, Historie erhalten; [learning.test.js](../../tests/trainer/learning.test.js) — Bedeutungsänderung beginnt neue Lernfassung. |
| E06 | [adult.test.js](../../tests/trainer/adult.test.js) — gerätelokale PIN, Sperren, Änderung und bewusstes Reset ohne Datenverlust; Browser-BFCache-/Hintergrundfälle. |
| E07 | [rounds.test.js](../../tests/trainer/rounds.test.js) — Konflikt ersetzt/entfernt angezeigte Aufgabe ohne Wertung; Browserfall `trainer sync and restore keeps concurrent word versions…` zeigt Konflikt, übrige Wörter bleiben nutzbar. |
| E08 | [Sicherungs-/Wiederherstellungsbericht](2026-09-18-sicherung-wiederherstellung.md) und [restore.test.js](../../tests/trainer/restore.test.js): verifizierte Drive-Sicherheitskopie, neue Epoche, späte Änderungen separat und sichtbar. |
| E09 | Technischer Realvorbeleg: frühe echte Drive-Probe zwischen zwei Browsern eines Rechners. Synthetisch belegt: [Offlinebericht](2026-09-18-offline-pwa.md) und Neustart mit geschlossenem Testserver. **Offen:** Safari und Home-Bildschirm-App auf echtem iPhone/iPad sowie Produkt-Drive auf zwei physischen Geräten. |
| E10 | [packets.test.js](../../tests/trainer/packets.test.js) und [sync.test.js](../../tests/trainer/sync.test.js): unveränderliche Pakete, stabile IDs, Deduplizierung, Kollisionserkennung und lokale Neuprojektion. |

## Arbeitspakete 1–13

| Task | Commits | Finale Befehle/Zählung und Reviewurteil |
| --- | --- | --- |
| 1 Datenformat | `2e8b6a2`, `cf99ed7` | `node --test tests/trainer/schema.test.js` 17/17; `npm test` 91/91; zwei wichtige Befunde behoben, Korrekturreview sauber. [Details](history/2026-09-18-tasks-1-6-evidence.md#task-1--produktformat-und-integrität) |
| 2 Fassungen/Epochen | `5e991bf`, `4527736` | `node --test tests/trainer/revisions.test.js tests/trainer/epochs.test.js` 16/16; `npm test` 108/108; Sonder-ID behoben, Stale-Schutz korrekt Task 5 zugeordnet, Korrekturreview sauber. [Details](history/2026-09-18-tasks-1-6-evidence.md#task-2--inhaltsfassungen-und-epochen) |
| 3 Lernkern/Belohnung | `99920da`, `1bbd80b` | Lern-/Rewardtests 25/25; `npm test` 135/135; vier Reviewkorrekturen bestätigt. [Details](history/2026-09-18-tasks-1-6-evidence.md#task-3--lernprojektion-und-belohnungen) |
| 4 Runden | `49fbfb2` | `rounds.test.js` 14/14; `npm test` 149/149; Review ohne kritischen/wichtigen Befund. [Details](history/2026-09-18-tasks-1-6-evidence.md#task-4--deterministische-runden) |
| 5 Commands | `43e956a` | `npm test` 171/171, darunter 22 neue Tests; Review ohne kritischen/wichtigen Befund. [Details](history/2026-09-18-tasks-1-6-evidence.md#task-5--atomare-speicherung-und-commands) |
| 6 Einrichtung/Erwachsene | `da6eb9b`, `86d7bb7` | `adult.test.js` 16/16, Browser 1/1, `npm test` 187/187; fünf wichtige Befunde behoben, Korrekturreview sauber. [Details](history/2026-09-18-tasks-1-6-evidence.md#task-6--einrichtung-und-erwachsenenbereich) |
| 7 Üben | `85b3629`, `99d8f13` | `practice.test.js` 5/5, Browser 2/2, `npm test` 192/192; Reviewkorrekturen bestätigt, Resttext in Task 13 behoben. [Bericht](2026-09-18-uebungsbildschirm-korrektur.md) |
| 8 Reise/Avatar | `6b83b48`, `ad3701c` | `reward-view.test.js` 2/2, Browser 1/1, `npm test` 194/194; gesamte damalige Browsersuite 4/4; Unlock-Grenzen nachgeprüft, Fokusnachweis in Task 13 verstärkt. [Bericht](2026-09-18-inselreise-avatar.md) |
| 9 Synchronisation | `a1db93f`, `ef9bec0`, `37c459f` | `npm test` 227/227; zwölf wichtige Befunde in zwei Runden behoben, Korrekturreview sauber. [Abschließende Nachprüfung](2026-09-18-synchronisation-fix-2-review.md) |
| 10 Sicherung/Wiederherstellung | `ee50662`, `49fde90` | `npm test` 259/259; Snapshotidentität nach Cache behoben, Korrekturreview sauber. [Bericht](2026-09-18-sicherung-wiederherstellung.md) |
| 11 Abgleich-/Sicherungs-UI | `41c3404`, `d026a4b`, `2a37a25` | `npm test` 260/260 vor UI-Fix, betroffene Browserfälle 4/4; drei wichtige Befunde behoben, Korrekturreview sauber. [Bericht](2026-09-18-abgleich-sicherung-oberflaeche.md) |
| 12 Offline/Updates | `8798dd2`, `2b369e3` | `npm test` 276/276; fokussiert 15/15 Node, Offline 1/1 und Update 1/1; drei wichtige Befunde plus Guard-Abdeckung behoben. [Bericht](2026-09-18-offline-pwa.md) |
| 13 Abschluss/Politur | `3b1d16d`, Reviewfix `11e3128` | Ausgangscode: 277 Node, 11 Trainer-Browser, 12 Probe. Fix 1: Navigation RED 0/1 → GREEN 1/1, Worker 8/8. Unabhängige Korrekturreview und aktueller Gesamtlauf folgen. |

Alle 25 technischen Entscheidungen stehen in [Entwicklungsentscheidungen](../ENTWICKLUNGSENTSCHEIDUNGEN.md). Die Task-1–6-Nachweise sind jetzt unabhängig vom später zu löschenden Arbeitsverzeichnis dauerhaft versionierbar.

## Reviewfix 1

- **I1 geschlossen:** Die Matrix führt R01–R33 und E01–E10 nach ihren Originaldefinitionen einzeln auf. Jede Implementierungsbehauptung verweist auf einen auffindbaren Testnamen, eine Testdatei oder einen versionierten Detailbericht. Kosten-, Privatgebrauchs-, Dialog-, Lizenz- und Pushgrenzen sind als Entscheidungen beziehungsweise Prozessnachweise gekennzeichnet. E09 trennt ausdrücklich die synthetische PWA-/Probe-Evidenz von der offenen Safari-/Home-Bildschirm-/Zwei-Geräte-Abnahme.
- **I2 geschlossen:** [Dauerhafte Prüfhistorie Tasks 1–6](history/2026-09-18-tasks-1-6-evidence.md) bewahrt die tatsächlichen finalen Befehle, Zählungen, wesentlichen Reviewkorrekturen und Urteile. Task 2 steht korrekt bei 16/16 gezielt und 108/108 gesamt. Task 7 und 8 nennen im Arbeitspaketüberblick konkrete Node-/Browserzahlen und verlinken ihre versionierten Berichte. Der Task-13-Abschnitt dokumentiert die erhaltene RED/GREEN-Evidenz und den Verlust des langen Browserfilters ohne Rekonstruktion.
- **M1 geschlossen:** `pendingProfileView` hält die bewusst angeforderte Ansicht bis zur Profilwahl. Der fokussierte Browserfall läuft für Üben, Inselreise und Avatar jeweils bis zur Zielüberschrift. RED 0/1, GREEN 1/1. Wegen der geänderten Shell wurde der Produktcache auf `v4` und die synthetische Updatefassung auf `v5` erhöht; Worker 8/8.
- **Dokumentationsprüfung:** `npm run check:docs` — 170 Dateien, 71 Markdowndateien, 298 lokale Links, 0 Fehler. `git diff --check` ohne Befund.

## Erledigte Restbefunde

| Herkunft | Disposition |
| --- | --- |
| Task 6 `main`-Landmark | In Task 11 durch die integrierte Shell-Struktur beseitigt. |
| Task 7 Erschöpfungstext | An `canExpand` gebunden und im Browser geprüft. |
| Task 8 Avatarfokus | Test wartet auf neuen verbundenen Knoten und prüft den alten als getrennt. |
| Task 11 M1/M2 | Statusformatierung zusammengeführt; ungebundene Suche/Erstellung/Beitritt verlangen nach 401 erneutes Verbinden. |
| Task 11 Texte | Restoretext, Mehrzahl und alte Ereignisbezeichnungen verständlich korrigiert. |
| Task 13 Profilnavigation | Zukunftsaussage entfernt; Reviewfix 1 setzt nach Profilwahl die gewünschte Übungs-/Reise-/Avataransicht fort. |

## Visuelle Prüfung

Die aktuellen Aufnahmen stammen aus dem synthetischen Browserlauf und wurden auf Lesbarkeit, Überlauf und erkennbare Zustände geprüft. Es gab keinen zusätzlichen blockierenden Befund. Sie sind kein Apple-Gerätenachweis.

- [Übung Desktop](assets/2026-09-18-v1-uebung-desktop.png)
- [Übung Mobil](assets/2026-09-18-v1-uebung-mobil.png)
- [Inselreise Desktop](assets/2026-09-18-v1-inselreise-desktop.png)
- [Avatar Mobil](assets/2026-09-18-v1-avatar-mobil.png)
- [Inhaltskonflikt Mobil](assets/2026-09-18-v1-konflikt-mobil.png)
- [Wiederherstellung Mobil](assets/2026-09-18-v1-wiederherstellung-mobil.png)

## Grenzen und nächster Nachweis

Die unabhängige Korrekturreview prüft I1, I2 und M1; danach folgt die Gesamtbranchprüfung. Erst diese Nachweise können eine interne Branchfreigabe begründen. Anschließend bleiben reale Akzeptanzschritte: Produktbestand mit echtem Google Drive auf zwei physischen Geräten verbinden, iPhone und iPad jeweils in Safari und als Home-Bildschirm-App prüfen, Tastatur/Fokus/Offline/erneutes Verbinden testen und tatsächliche Browser-/OS-Versionen festhalten. Eine nötige HTTPS-Bereitstellung wird erst nach gesondertem Auftrag eingerichtet.
