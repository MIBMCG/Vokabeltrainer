# Beschleunigung des vollständigen Kaufablaufs

Stand: 28.09.2026. Ausgangspunkt `e3933fc`, Entwicklungszweig
`codex/vokabeltrainer-v1`; Umsetzung im vorhandenen sauberen Arbeitsbereich
`codex/purchase-batch-checks`.

## Auftrag und Ausgangsmessung

Der Nutzer beanstandet eine echte Kaufbestätigung von über zwei Minuten und
genehmigt den konkreten Verbesserungsvorschlag mit „ja, beschleunige so gut
es geht“. Die [vorherige Messung](2026-09-28-kauftest-wiederherstellung.md)
belegt funktionalen Kauf und Erhalt nach Neuladen, ausdrücklich keine
zufriedenstellende Geschwindigkeit. Der getrennte Testbrowser enthält
Drachenstufe 2, 1.400 verfügbare und 1.600 Lernpunkte bei Level 9.

Der vollständige lokale Diagnoseablauf zählt vor dieser Änderung 63
HTTP-Anfragen für die Vorschau und 234 für die Bestätigung. Davon entfallen
102 auf zwei vollständige Lernabgleiche. Die frühere Reduktion einer
Dreier-Uploadgruppe auf 34 Anfragen beschreibt nur einen Teil des Gesamtkaufs.

Freigegeben sind die Wiederverwendung frisch geprüfter Daten innerhalb
desselben Kaufs, das Entfernen des dadurch doppelten Lernabgleichs,
gemeinsame ID-Reservierung und das Zusammenführen doppelter Sicherungsabrufe.
Konto-/Datensatzbindung, Hashes, Revisionen, frischer Koordinatorkopf, ETag,
`If-Match`, dauerhafter Auftrag vor abhängigen Schreibzugriffen und sichere
Wiederaufnahme bleiben erforderlich. Kein neues Kosten-, Konten- oder
Speichermodell.

## Begrenzte Umsetzung

- Eine sofortige Bestätigung verwendet ihren bereits vollständig geprüften
  Lern- und Kaufstand weiter, wenn der gesamte lokale Zustand nach dem eigenen
  gespeicherten Auftrag exakt passt. Der geprüfte Snapshot bleibt der Bezug
  für das anschließende bedingte Speichern. Zwischenzeitliche lokale Änderungen
  können damit nicht ungeprüft in den Kauf geraten. Bei Wiederaufnahme oder
  abweichendem Zustand bleibt der vollständige Abgleich erhalten.
- Basisdateien und Beleg erhalten ihre IDs aus einer gemeinsamen Reservierung.
  Anzahl, Syntax und Eindeutigkeit werden vor Verwendung geprüft. Größere
  Bestände werden in Gruppen von höchstens 1.000 IDs aufgeteilt; dies entspricht
  der [Google-Drive-Grenze](https://developers.google.com/workspace/drive/api/guides/create-file#generate_ids_to_use_with_your_files).
  Auftrag und alle Kandidatendateien werden weiterhin vor dem Upload gespeichert.
- Ein privater Lesekontext fasst Sicherungsabrufe innerhalb eines Downloads
  zusammen. Nur frisch zwischen Metadatenprüfungen gelesene Inhalte kommen
  hinein; vor der Wiederverwendung werden die Metadaten erneut geprüft.
  Listenreihenfolge, Inhaltsrevision, Bindung und Inhalts-Hashes bleiben relevant.
  Der zusätzliche Inhaltscache hält höchstens 4 MiB und 128 Einträge; darüber
  werden Dateien bei Bedarf wieder vollständig geprüft gelesen. Diese Grenze
  verwirft keine gültigen Sicherungen und ändert nicht deren Fachformat.
- Nach vollständig erfolgreichem Upload und Rücklesen liegen die eigenen
  unveränderlichen Kaufdateien bereits geprüft vor. Ausschließlich diese
  Transport-Rückgaben können in derselben Bestätigung nach eindeutig
  erfolgreichem Kopfschreiben für das vollständige Historien-Replay dienen.
  Der gemeinsame Kopf wird weiterhin frisch gelesen; IDs und Hashes müssen
  exakt passen. Der flüchtige Kontext wird nicht vorab als Kaufhistorie gespeichert.
  Unklare Antworten, Teilfehler und spätere Wiederaufnahme nutzen den normalen
  Fernleseweg.

Die unabhängige Zwischenprüfung fand zwei konkrete Verbesserungen: einen
Wechsel des lokalen Zustands zwischen Hashprüfung und Kandidatenspeicherung
sowie doppelte Inhaltsabrufe bei ungünstiger Reihenfolge von Manifest und
Teildateien. Beide sind korrigiert und durch zuvor fehlschlagende Regressionen
abgedeckt. Die unabhängige Nachprüfung des eingefrorenen Produktdiffs findet
keinen offenen wesentlichen Autoritäts-, Bindungs- oder Revisionsbefund.
Ein abschließender Speicherbefund führte zur genannten Cachebegrenzung;
Einzelgröße, Gesamtsumme und Eintragsgrenze sind ebenfalls durch Regressionen
geprüft. Das unabhängige abschließende Code-Review bewertet den endgültigen
Diff mit **PASS**, ohne offene wichtige Befunde.

## Prüfung während der Umsetzung

99 gezielte vorhandene Sicherungs-/Transport-/Syncfälle bestanden vor den
Änderungen. Der neue Test `tests/trainer/purchases-performance.test.js`
führt den vollständigen Kauf mit echten Diensten und lokalem HTTP-Testdouble
aus. Sein erstes Budget war höchstens 168 Bestätigungsanfragen bei korrektem
Guthaben. Er scheiterte vor der Umsetzung erwartungsgemäß mit 234 statt höchstens 168
Anfragen. Ein vorheriger Startversuch war durch die Prozess-Sandbox blockiert;
der anschließend erlaubte lokale Prozessstart lieferte den tatsächlichen
roten Regressionsnachweis. Nach der zusätzlichen Wiederverwendung verifizierter
Uploadwerte wurde das Budget auf die erreichten 139 Anfragen verschärft.

Die gezielten Abschlussläufe umfassen 79/79 Kauf-/Wiederaufnahmefälle,
49/49 Transportfälle und 65/65 Sicherungs-/Syncfälle. Die neuen Regressionen
prüfen insbesondere verlorene ID-Antworten, eine lokale Änderung vor dem
Kandidatenspeichern, verlorene Kopfschreibantwort mit Fernleseweg bei
Wiederaufnahme, veränderte Snapshot-Metadaten und eine Manifest-/Teilreihenfolge
über Downloadgruppen hinweg.

Die vollständige lokale HTTP-Diagnose mit dem unveränderten synthetischen
1.600-Punkte-Ausgangsstand besteht:

| Phase | Vorher | Jetzt |
| --- | ---: | ---: |
| Vorschau | 63 | 55 |
| Bestätigung | 234 | 139 |
| Ansicht vor/nach dem Kauf | 0 | 0 |

Die Bestätigung spart damit 95 Anfragen (40,6 %). Sie enthält weiterhin
58 Konto-, 58 Metadaten- und 15 Inhaltsabrufe, eine Dateiliste, eine
ID-Reservierung, fünf Uploads und eine Kopfänderung. Höchstens drei Anfragen
laufen gleichzeitig. Einrichtung (31) und Aktivierung (272) bleiben in dieser
Messung unverändert. Guthaben nach Kauf: 1.400, Lernpunkte: 1.600.
Lokale Laufzeiten dieses Durchgangs ohne künstliche Netzverzögerung sind
439 ms für die Vorschau und 1.269 ms für die Bestätigung; das sind ausdrücklich
keine Google-Drive- oder Endnutzerzeiten. Der reale Testbestand hat zudem eine
eigene Einrichtungs-/Wiederherstellungsgeschichte.

## Abschlussprüfung vor Bereitstellung

Am endgültigen Produktstand einschließlich Cachebegrenzung bestehen **624/624
Node-Tests und 8/8 ausgewählte Browserfälle**, ohne Fehler, Abbrüche oder
übersprungene Fälle. Die im Gesamtlauf enthaltene vollständige Kaufdiagnose
bestätigt erneut 55/139 Anfragen; die Speichergrenze verändert diesen Fall nicht.
Der erste Zwischenlauf vor der letzten Speicherbegrenzung hatte 621/621 Fälle.

Tatsächlich ausgeführt:

```text
npm test
node scripts/measure-purchase-requests.mjs
node --test --experimental-test-isolation=none --test-name-pattern="^(C2 rejected required precache|trainer sync and restore exposes|trainer unbound discovery|trainer offline starts|trainer offline update|earned points|server session appears|update notice follows)" tests/browser/trainer.browser.mjs tests/browser/purchases.browser.mjs tests/browser/server-auth.browser.mjs tests/browser/status-feedback.browser.mjs
npm run check:docs
git diff --check
```

Für die Browserfälle waren `PLAYWRIGHT_MODULE` und `BROWSER_EXECUTABLE` auf
die vorhandene lokale Playwright-/Edge-Installation gesetzt. Geprüft sind
Kauf und Wiederaufnahme nach unklarer Antwort, veraltete Vorschau, Reload und
Offlinebetrieb, Google-Sitzung nach Reload, Einrichtung/Import sowie abgelehnte
Cacheinstallation und kontrolliertes Update. Cachekennung v31; der synthetische
Updatefall prüft v31 auf v32. Es kamen keine neuen Laufzeitdateien hinzu.
Dokumentationsprüfung: 244 Markdown-Dateien, 966 lokale Verweise, keine Fehler.
Die synthetischen Browserfälle ersetzen keine reale Drive- oder Geräteabnahme.

Bereitstellung und erneuter realer Kaufversuch werden nach ihren tatsächlichen
Ergebnissen ergänzt. Eine reale Beschleunigung wird damit noch nicht behauptet.
