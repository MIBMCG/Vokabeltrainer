# Prüfbericht Vokabeltrainer Version 1

- Datum: 18.09.2026
- Branch: `codex/vokabeltrainer-v1`
- Geprüfter Produktcode: `3b1d16d`
Status: Version 1 ist implementiert und automatisiert geprüft. Die unabhängige Task-13- und Gesamtprüfung des Branches folgt anschließend und wird durch diesen Bericht nicht vorweggenommen.

## Ergebnis

Der bestätigte Umfang R01–R33 und E01–E10 ist im Code abgebildet. Die frischen Gesamtläufe bestanden mit 277 Node-Tests, elf Trainer-Browsertests und zwölf Szenarien der getrennten Drive-Probe. Die Browserläufe verwendeten synthetische Profile und eine simulierte Google-Grenze. Sie bedienten die echte Oberfläche, IndexedDB, Downloads und Service Worker.

Nicht nachgewiesen sind das Produktprotokoll mit echtem Google Drive auf zwei physischen Geräten, Safari und die Home-Bildschirm-App auf iPhone/iPad, konkrete Mindestversionen und eine HTTPS-Bereitstellung. Die frühere echte Drive-Probe zwischen zwei Browsern desselben Rechners bleibt ein technischer Vorbeleg, keine Produkt- oder Geräteabnahme.

## Task-13-Korrekturen

Die gezielten RED-Läufe zeigten falsche oder unvollständige Texte für eine nicht erweiterbare ausgeschöpfte Runde, die profilfreie Navigation, Wiederherstellung und Mehrzahl alter Änderungen. Der neue Vorschau-Test zeigte generische Bezeichnungen für aufgegebene Runden und übernommene alte Ereignisse. Beim ersten GREEN-Lauf fehlte dem lokalen Server die Freigabe für das neue gemeinsame Statusmodul; dadurch lud die App nicht. Die Route wurde ergänzt und danach erneut geprüft.

Der Avatarfall prüft nach asynchronem Rendern den tatsächlich neu erzeugten Schalter und bestätigt, dass der alte DOM-Knoten getrennt wurde. Weitere Browserfälle decken abgelaufenen Zugriff bei ungebundener Suche, Neuerstellung und Beitritt ab. Statusformulierungen stammen aus einem gemeinsamen reinen Formatter. Sicherungstexte nennen den gemeinsamen Datenstand, Ereignisbezeichnungen sind verständlich, und die profilfreie Navigation führt zur Profilauswahl.

Alle ausgelieferten Produktdateien sind im Service-Worker-Cache `v3` explizit aufgeführt. Der Update-Test erzeugt davon verschieden `v4`, wartet auf einen echten wartenden Worker und prüft erst dann die kontrollierte Aktivierung. Das portable Browserharness lädt standardmäßig das Projektpaket `playwright` und dessen Chromium; `PLAYWRIGHT_MODULE` und `BROWSER_EXECUTABLE` bleiben optionale Arbeitsplatz-Overrides.

## Frische Endnachweise

Umgebung: Node.js 22.23.2, Playwright 1.62.1, Edge 153.0.4234.46 auf Windows. Für die beiden Browserläufe wurden auf diesem Arbeitsplatz die dokumentierten optionalen Modul- und Browser-Overrides gesetzt. Es wurde kein Produktionspaket ergänzt.

| Nachweis | Ausgeführter Befehl | Ergebnis |
| --- | --- | --- |
| Node-Gesamtlauf | `npm test` | 277/277 bestanden, 0 fehlgeschlagen |
| Trainer-Browserregression | `node --test tests/browser/trainer.browser.mjs` | 11/11 bestanden, 0 fehlgeschlagen |
| Drive-Probe | eigener freier Port, danach `node tests/browser/probe.browser.mjs` | 12/12 Szenarien bestanden, `pageErrors: []` |
| Dokumentation | `npm run check:docs` | 168 Dateien, 69 Markdowndateien, 227 lokale Links, 0 Fehler |
| Git-Whitespace | `git diff --check` | ohne Befund |

Die Trainerregression startet ihren eigenen Server auf einem freien Port. Der Probelauf verwendete ebenfalls einen eigenen freien Port; ein persönlicher Server auf Port 4173 wurde weder beendet noch verändert.

Der Offlinefall lädt die App zunächst online, beendet danach den Testserver und öffnet einen neuen kontrollierten Tab. Er wiederholt dies unter `/trainer/` und `/repo/trainer/` sowie mit neu gestarteten persistenten Browserkontexten. Der Updatefall liefert verzögert eine zweite Workerfassung aus und prüft den echten Zustand `waiting`, die gesicherte Pause, die inaktive Oberfläche während des Wechsels und die Freigabe nach `controllerchange`.

## Abdeckung R01–R33

| Anforderungen | Nachweis |
| --- | --- |
| R01–R05 | Produkt-Shell und Übungsbrowserfall: Deutsch nach Englisch, Texteingabe, normalisierte Bewertung, sofortige Rückmeldung und bewusstes Weitergehen; Doppelauslösung wird nicht doppelt gewertet. |
| R06 | Fassungsbasierte Lektionen/Vokabeln, Tabellen-Vorschau, Bearbeiten und Archivieren in Commands-, Projektions- und Erwachsenen-Browsertests. |
| R07–R09 | Deterministische Auswahl, Fehlerabstand, Pausieren nach drei richtigen Antworten, Modi Alle/Letzte/Neue und kleine/ausgeschöpfte Mengen in Lern-, Runden- und Browsertests. |
| R10 | Stabile Ereignis- und Paket-IDs, atomare Commands, Deduplizierung und wiederholbare Uploads in Schema-, Speicher- und Sync-Tests. |
| R11 | Dauerhafte Punkte, Level, Abzeichen, Reise und Avatar in Projektions-, Commands- und Browsertests. |
| R12–R15 | Lokales Speichern, ausstehender Abgleich, Konten-/Datensatzbindung, getrennte Profile und simulierte Zwei-Kontext-Synchronisation einschließlich Fehlern. Realer Produktabgleich bleibt offen. |
| R16–R17 | Portable statische App ohne Produktionsabhängigkeiten und nachvollziehbare lokale Anleitung; keine Veröffentlichung oder Zusatzkosten. |
| R18–R20 | Tagesbasierte Fälligkeit mit Zielzeitzone, persistente Serien sowie unterbrochene und fortgesetzte Runden in Lern-/Rundentests. |
| R21–R22 | Touchgrößen, Fokus, Tastaturbedienung, 320-Pixel-/200-Prozent-Stressfall sowie Text/Symbol-Rückmeldung im Browser. Reale iOS-Tastatur bleibt offen. |
| R23–R24 | Zehn Punkte je richtiger Antwort, zwanzig Abschlussbonus, kein Abzug; 15 Reiseetappen, sechs Abzeichen und sechs Zubehörteile mit bestätigten Schwellen. |
| R25–R27 | Lernstandsansicht, Profil-/Lektionsverwaltung und lokale vierstellige PIN-Sperre mit Race-/BFCache-Tests. Die PIN bleibt ausdrücklich Bedienhürde. |
| R28–R29 | Zusammenführung unveränderlicher Pakete, sichtbare parallele Inhaltsfassungen, bewusste Konfliktwahl und erhaltene Übungsergebnisse. |
| R30 | Vollständiger JSON-Export ohne Token/PIN-Verifier, strikte Prüfung, Vorschau, Sicherheitskopie und Wiederherstellung in neuer Epoche. |
| R31 | Keine allgemeine Lizenz und keine Änderung der Repository-Sichtbarkeit hinzugefügt. |
| R32 | Persistente laufende Runde, bewusstes Fortsetzen/Beenden und kein unverdienter Bonus bei Abbruch oder Wiederherstellung. |
| R33 | Verifizierte Sicherheitskopie, konkurrierende Wiederherstellungen und separat sichtbare verspätete Offlineereignisse einschließlich Übernahmevorschau. |

## Abdeckung E01–E10

| Entwurf | Nachweis |
| --- | --- |
| E01 | Native JavaScript-Module, statische HTML/CSS-App, kein Buildschritt und keine Produktionspakete. |
| E02 | Reine Projektion plus lokale `LocalRound`; Ereignisse, Runden und Fortschritt bleiben getrennt. |
| E03 | Zustandsautomat sperrt mehrfaches Prüfen/Weitergehen; Browserfälle prüfen Fokus und bewusste Übergänge. |
| E04 | Reise-, Level-, Abzeichen- und Avatargrenzen sind deterministisch getestet und visuell geprüft. |
| E05 | Inhaltsfassungen, Elternköpfe, Supportereignisse und Lernrevisionen erhalten Historie. |
| E06 | Serienisierte Commands sind der einzige lokale Schreiber; Hash/CAS schützt gegen veraltete Änderungen. |
| E07 | Feste Konto-/Ordner-/Datensatzbindung, explizite Erstellung oder Auswahl und ehrliche Auth-/Synczustände. |
| E08 | Vollsicherung, Inhalts-/Gesamthashes, Sicherheitskopien, neue Epochen und alte Ereignisse sind geprüft. |
| E09 | Scopebegrenzte PWA mit expliziter Assetliste, geschlossenem Server-Neustart und kontrolliertem Update. |
| E10 | Unveränderliche Ereignispakete, stabile IDs, Deduplizierung und kausale Konfliktbehandlung statt „letzter Upload gewinnt“. |

## Arbeitspakete 1–13

| Task | Produktcommits | Prüfung und Reviewstand |
| --- | --- | --- |
| 1 Datenformat | `2e8b6a2`, `cf99ed7` | 17 gezielte, 91 gesamte Tests; zwei wichtige Reviewbefunde korrigiert, Nachprüfung sauber. |
| 2 Fassungen/Epochen | `5e991bf`, `4527736` | 15 gezielte, 107 gesamte Tests; Sonder-IDs korrigiert, Nachprüfung sauber. |
| 3 Lernkern/Belohnung | `99920da`, `1bbd80b` | 25 gezielte, 135 gesamte Tests; vier Reviewbefunde korrigiert, Nachprüfung sauber. |
| 4 Runden | `49fbfb2` | 14 gezielte, 149 gesamte Tests; Review sauber. |
| 5 Commands | `43e956a` | 22 neue, 171 gesamte Tests; Review sauber. |
| 6 Einrichtung/Erwachsene | `da6eb9b`, `86d7bb7` | 187 Node-Tests, 16 gezielte und ein Browserfall; fünf wichtige Befunde korrigiert, Nachprüfung sauber. |
| 7 Üben | `85b3629`, `99d8f13` | unabhängig geprüft; Resttext für ausgeschöpfte Menge in Task 13 korrigiert. |
| 8 Reise/Avatar | `6b83b48`, `ad3701c` | Grenztests und Browserprüfung; asynchroner Fokusnachweis in Task 13 verstärkt. |
| 9 Synchronisation | `a1db93f`, `ef9bec0`, `37c459f` | 227 Node-Tests; zwölf wichtige Befunde über zwei Fixrunden korrigiert, Nachprüfung sauber. |
| 10 Sicherung/Wiederherstellung | `ee50662`, `49fde90` | 259 Node-Tests; Snapshotidentität nach Cache korrigiert, Nachprüfung sauber. |
| 11 Abgleich-/Sicherungsoberfläche | `41c3404`, `d026a4b`, `2a37a25` | 260 Node-Tests und gezielte Browserfälle; drei wichtige Befunde korrigiert, Nachprüfung sauber. |
| 12 Offline/Updates | `8798dd2`, `2b369e3` | 276 Node-Tests, echte Offline- und Updatepfade; drei wichtige Befunde plus Guard-Abdeckung korrigiert, Nachprüfung sauber. |
| 13 Abschluss/Politur | `3b1d16d` | 277 Node-, 11 Trainer-Browser- und 12 Probe-Szenarien grün; unabhängige Task-13-/Gesamtprüfung noch ausstehend. |

Die detaillierten Task-1–6-Scratchberichte waren Arbeitsmaterial. Die prüfbaren Kerndaten sind deshalb in dieser versionierten Tabelle festgehalten. Versionierte Berichte zu den späteren Paketen liegen im selben Berichtsordner. Alle 25 technischen Entscheidungen sind dauerhaft in [Entwicklungsentscheidungen](../ENTWICKLUNGSENTSCHEIDUNGEN.md) dokumentiert.

## Erledigte Restbefunde

| Herkunft | Befund | Disposition |
| --- | --- | --- |
| Task 6 | verschachteltes `main`-Landmark | In Task 11 durch die integrierte Shell-Struktur beseitigt; Browserregression prüft die aktuelle Oberfläche. |
| Task 7 | Text versprach Erweiterung trotz `canExpand=false` | In `3b1d16d` bedingt formuliert und im Browser geprüft. |
| Task 8 | Fokusnachweis konnte alten Avatar-Knoten treffen | Test wartet auf den neuen verbundenen Knoten und prüft den alten als getrennt. |
| Task 11 M1 | doppelte Syncstatus-Formatter | In gemeinsamem `ui/status.js` zusammengeführt. |
| Task 11 M2 | ungebundene Authfehler nur teilweise im Browser | Suche, Erstellung und Beitritt verlangen jetzt nach 401 ausdrücklich erneutes Verbinden. |
| Task 11 Texte | technischer Restoretext, falsche Mehrzahl, generische alte Ereignisse | In klarer Alltagssprache und mit passenden Einzahl-/Mehrzahl- und Ereignisbezeichnungen korrigiert. |
| Task 13 | profilfreie Navigation kündigte Funktionen als zukünftig an | Navigation führt jetzt klar zur Profilauswahl. |

## Visuelle Prüfung

Die folgenden aktuellen Aufnahmen stammen aus dem finalen synthetischen Browsertest. Geprüft wurden Lesbarkeit, Überlauf, Fokus-/Dialogdarstellung und erkennbare Zustände. Es gab keinen zusätzlichen blockierenden Befund. Fixierte Navigation und Dialogposition sind Teil der getesteten Browseransicht; die Aufnahmen sind kein Apple-Gerätenachweis.

- [Übung Desktop](assets/2026-09-18-v1-uebung-desktop.png)
- [Übung Mobil](assets/2026-09-18-v1-uebung-mobil.png)
- [Inselreise Desktop](assets/2026-09-18-v1-inselreise-desktop.png)
- [Avatar Mobil](assets/2026-09-18-v1-avatar-mobil.png)
- [Inhaltskonflikt Mobil](assets/2026-09-18-v1-konflikt-mobil.png)
- [Wiederherstellung Mobil](assets/2026-09-18-v1-wiederherstellung-mobil.png)

## Grenzen und nächster Nachweis

Die unabhängige Review prüft Task 13 und danach den Gesamtbranch. Erst ihre eigenen Befunde und Nachweise können eine interne Branchfreigabe begründen. Danach bleiben reale Akzeptanzschritte: Produktbestand mit echtem Google Drive auf zwei physischen Geräten verbinden, iPhone und iPad jeweils in Safari und als Home-Bildschirm-App prüfen, Tastatur/Fokus/Offline/erneutes Verbinden testen und die tatsächlichen Browser-/OS-Versionen festhalten. Eine hierfür nötige HTTPS-Bereitstellung wird erst nach gesondertem Auftrag eingerichtet.
