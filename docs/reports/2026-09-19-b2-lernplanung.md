# B2: Regeln je Kind und geschützte laufende Runden

Stand: 19.09.2026. Umsetzung GPT-6 Astra / high. Basis `d1cf3027834057ed5ce0e23740f3bd1cc6987928`, Produktcommit `68909b55a1f66cf23d2bd3bbfbc10d552cee6c81`. Die [unabhängige Review](2026-09-19-b2-review.md) durch GPT-5.6 Sol / high ist ohne Befunde abgeschlossen. Elternformulare folgen in B3.

## Ergebnis

Die neue Wiederholungsprojektion verwendet dieselben effektiven, nach Antwortslot deduplizierten Antworten wie die bisherige Punkteberechnung. Ereignisordnung und Deduplizierung sind unverändert in `learning/facts.js` ausgelagert. Die bisherige Belohnungsberechnung mit 10/20 Punkten und Dreier-Meilensteinen bleibt erhalten.

Die Scheduling-Serie ist nicht mehr auf drei begrenzt. Regeln steuern die Schwelle für seltenere Wiederholung, vier Tagesabstände und optional den vollständigen Ausschluss. Fehler setzen die Serie zurück und behalten die bestehende Wiederholung nach zwei anderen Antworten. Der Intervallindex steigt höchstens einmal je Runde; nach dem vierten Abstand bleibt dieser Abstand gültig. Eine Wiederaktivierung beginnt eine neue, sofort fällige Serie. Ältere Antworten zählen weiter für Punkte und Statistik, verändern diese neue Serie aber nicht.

Aktuelle ganze Regeln und Wiederaktivierungsgenerationen stammen ausschließlich aus effektiven Ereignissen; konkurrierende Änderungen werden deterministisch gewählt, Unterstützungsreferenzen bleiben historische Grundlagen. Änderungen prüfen Profil, Lernfassung und erwartete aktuelle IDs innerhalb der vorhandenen atomaren Speicherung. Vorschauen verändern weder Daten noch Regeln.

Neue Runden speichern Regeln und Kandidatengenerationen. Antworten, Weiter, Wiederöffnung und Erweiterung behalten diesen Vertrag. Nur zusätzliche Kandidaten einer Erweiterung erhalten die dann aktuelle Generation. Bereits gespeicherte Legacy-Runden verwenden weiterhin ihre ursprüngliche Planung. Die neue Planung steuert Verfügbarkeit; die bestehende Faktenrangfolge bleibt unverändert. Server/Offlinecache enthalten die neuen Module; Produktcache v15, synthetischer Updateworker v16.

## RED/GREEN und Selbstprüfung

- Sechs Scheduler-/Regel-/Resetfälle zunächst RED, danach Scheduler plus bestehende Learningtests 24/24 GREEN. Geprüft sind unter anderem Schwellen 2/5/10/20, Fehlerlücke, Intervallfortschritt, gleiche Abstände und konkurrierende Regeln/Resets.
- Vier neue Commandfälle zunächst RED; nach Anbindung gemeinsam mit Runden und Schedule 49/49 GREEN. Ein erster Integrationslauf bestand 83/83.
- Ein zusätzlicher echter RED-Fall fand eine veränderte Rangfolge nach Wiederaktivierung: `w2` statt `w1`. Kandidatenverfügbarkeit und Faktenranking wurden getrennt. Danach bestanden die betroffenen Runden-/Command-/Scheduletests 53/53.
- Der erste Browserlauf war 3/4: Die Testannahme einer Profilauswahl nach Reload wurde an die tatsächlich direkte Wiederaufnahme des Feedbacks angepasst. Dafür war keine Produktänderung nötig.
- Der erste Gesamtlauf mit 337 Tests war vor dem Rankingfix. Maßgeblich ist die folgende finale Prüfung nach dem letzten Produktfix.

## Tatsächliche Abschlussprüfungen

Node 22.23.2, Playwright 1.62.1, Edge 153.0.4234.48. Synthetische Daten, isolierte Browserkontexte, freie Serverports. Lokale Runtime-Overrides gemäß [Browseranleitung](../../tests/browser/README.md); arbeitsplatzspezifische Ausgabeumleitungen sind hier ausgelassen.

```sh
node --test --experimental-test-isolation=none tests/trainer/rounds.test.js tests/trainer/commands.test.js tests/trainer/schedule.test.js
npm test
node --test --experimental-test-isolation=none --test-name-pattern='B1 browser|B2 browser|trainer offline' tests/browser/trainer.browser.mjs
npm run check:docs
git diff --check
git diff --cached --check
```

| Prüfung | Tatsächliches Ergebnis |
| --- | --- |
| Runden/Commands/Schedule nach Rankingfix | 53/53 bestanden, 1443.1153 ms |
| Vollständige Node-Suite | 339/339 bestanden, 0 Fehler/Abbrüche/übersprungen, 10669.8852 ms, Exit 0 |
| Betroffene Browserfälle | 4/4 bestanden, 0 Fehler/Abbrüche/übersprungen, 12014.5496 ms, Exit 0 |
| Dokumentprüfung vor Produktcommit | 318 Dateien, 96 Markdown-Dateien, 426 lokale Links, keine Fehler |
| Beide Git-Prüfungen | keine Ausgabe/Fehler |

Die Browserfälle prüfen v1-Migration/Legacyfortsetzung, eine neue Runde mit eingefrorenen Regeln/Generationen über echte IndexedDB und Reload, Offline-Neustart und kontrolliertes Update. Weitere Integrationstests belegen getrennte Kinder, reine Vorschau, überholte Formularbasis, fehlgeschlagenes Speichern, Erweiterung, echte verspätete v1-Pakete mit wiederholtem Abgleich, Sicherungen mit Supportreferenzen und spätere ausdrückliche Adoption. Verdiente Punkte ändern sich durch reine Regeln/Resets nicht.

## Grenzen

Keine neue Elternoberfläche aus B3 vorgezogen. Keine zusätzlichen Produktionsabhängigkeiten, historischen Hashänderungen, privaten Browserdaten oder Änderungen an Google-/Hostingkonfiguration. Physische Apple-/Zwei-Geräte- und reale Produkt-Drive-Abnahme bleiben offen. Der [Datenvertrag](../PRODUKT-DATENFORMAT.md) beschreibt die implementierten Schnittstellen.
