# Sofortiger Google-Abgleich nach Vokabelspeicherung

Stand: 29.09.2026. Abgeschlossen, auf GitHub gesichert und privat bereitgestellt.
Ausgangspunkt: `c39a4ba`.

## Bestätigter Umfang und Änderung

Nach der Unterbrechungsprüfung beauftragt der Nutzer die Fortsetzung. Die
Untersuchung des Tabellenwegs findet eine feste Wartezeit vor dem Google-Abgleich.
Der Nutzer bestätigt ausdrücklich den kurzen Entwurf, diese zehn Sekunden nach
dem Speichern von Wörtern und Lektionen zu entfernen.

Produktcommit `0c3720ad33dc43f52d74b4278b6df79fa2d728cb` ergänzt den bestehenden
Scheduler: Neue lokale `entity.revised`-Ereignisse für `word` oder `lesson`
stoßen ihn sofort an. Das gilt auch für eine gemeinsame Tabellenübernahme;
ein Stapel erzeugt einen Auslöser. Ein bereits laufender Abgleich erhält einen
zusammengeführten Folgelauf, keinen parallelen zweiten Abgleich.

Lernantworten behalten ihre bisherige Bündelung; Rundenabschluss bleibt sofort.
Gleiche Outbox-Mitteilungen, rein interne Abgleichspeicherungen und entfernte
Ereignisse starten keinen zusätzlichen Sofortabgleich. Der App-Aufrufweg bildet
Offlinebetrieb auf dieselbe Scheduler-Sperre wie eine verdeckte App ab;
bei Rückkehr wird der Abgleich wieder angestoßen. Die bestehenden Prüfungen,
Wiederholungen nach Netzfehlern und das regelmäßige Nachsehen bleiben erhalten.

Lokales Speichern und bestätigter Google-Abgleich bleiben unterschiedliche
Zustände. Die Änderung entfernt eine vorgeschaltete Wartezeit von bis zu zehn
Sekunden; sie verspricht keine bestimmte echte Übertragungsdauer. Fachformate,
Kauf-/Restore-Protokoll, Uploads, Google-Berechtigungen und Konten bleiben gleich.
Cache v38 ersetzt v37; kein neues Laufzeitmodul und keine neue Abhängigkeit.

## Diagnose vor Umsetzung

Die Messung verwendet echten Command-Stapelimport, ProductSync, Drive-Client
und Commerce-Integration mit einer synthetischen Google-Grenze. Der Kaufstand
ist unaktiviert; Memory-Store statt IndexedDB, ohne Serverproxy. Reales Netz
ist im Messprogramm gesperrt. Je Kombination ein Lauf:

| Wörter | Künstliche HTTP-Latenz | Lokal speichern | Abgleich selbst | HTTP-Anfragen | Pakete |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 10 | 0 ms | 12 ms | 77 ms | 23 | 1 |
| 100 | 0 ms | 41 ms | 262 ms | 23 | 1 |
| 250 | 0 ms | 109 ms | 980 ms | 31 | 3 |
| 250 | 100 ms | 132 ms | 4.482 ms | 31 | 3 |

Jeweils eine lokale Speicherung; alle importierten IDs/Ereignisse erreichen die
synthetischen Drive-Pakete. Outbox, ausstehende Pakete und Quarantäne sind am
Ende leer, Status `synced`. Der separat geprüfte echte Scheduler/Notifier
plant beim relevanten Wortereignis vor der Änderung exakt 10.000 ms ein.
Die Tabellenzeiten enthalten diesen vorgeschalteten Zeitraum nicht.
Das ist keine Messung mit einem Familienbestand, echtem Google oder Smartphone.

Lokale Diagnoseartefakte liegen unter `.superpowers/sdd/2026-09-29-bulk-sync/`:
`measure.mjs`, `results.json` und `scheduler-baseline.json`. Die abschließende
Schedulerprobe enthält ausdrücklich `payload.entityType: 'word'`; ihre kleine
Notifier-Fixture ersetzt keine vollständige Ereignis-Schemaprüfung.

## Tatsächliche Prüfung

- TDD: Drei neue Schedulerfälle scheitern zunächst am ausbleibenden Sofortstart
  bzw. am verbleibenden Zehn-Sekunden-Timer; danach 14/14 Schedulerfälle PASS.
- Der neue echte App-Browserfall mit synthetischem Google scheitert vor der
  Änderung am fehlenden Abgleichstart innerhalb von fünf Sekunden. Danach
  beginnt er innerhalb dieses Fensters; am Ende sind Outbox/Pakete leer und
  beide importierten Wortereignisse genau einmal bei der synthetischen
  Google-Grenze vorhanden. Die gesamte Falllaufzeit ist keine Google-Kaufzeit.
- Gezielte Node-Gruppen: 116/116 PASS. Browser Vokabeleingabe/Bildcache/
  Updatehinweis: 17/17 PASS; Offline-Start und kontrollierte Updates: 3/3 PASS.
- Vollständiger frischer Lauf `npm.cmd test`: **655/655 PASS**, Exit 0,
  261.664,1911 ms, keine abgebrochenen oder übersprungenen Fälle. Der nur für
  diesen Lauf gesetzte Wachzustand wurde anschließend beendet.
- Unabhängige Taskprüfung: Spec PASS, Qualität Approved. Der endgültige
  Commit-Diff ist exakt identisch zum geprüften eingefrorenen Zwischenstand.
- Breite unabhängige Abschlussprüfung auf `0c3720a`: Spec/Qualität PASS,
  bereit zur Integration, keine offenen Befunde.

Der volle Node-Nachweis liegt im isolierten Checkout unter
`test-results/immediate-vocabulary-sync/full-node.log`; gezielte Gate-Auszüge
sind als solche in `gate-output-excerpts.txt` gekennzeichnet. Die unabhängige
Prüfung löst die Offline-Nachweisfrage über `main.js` auf: Das tatsächliche
Offline-Ereignis setzt `visibility(false)`; genau diese Scheduler-Grenze wird
geprüft. Physische Geräteabnahme und natürliche Token-Erneuerung bleiben offen.

## Bereitstellung

Produktcommit `0c3720ad33dc43f52d74b4278b6df79fa2d728cb` ist per Fast-Forward
in `codex/vokabeltrainer-v1` integriert und nach dem Push exakt mit dem
tatsächlichen GitHub-Branchkopf verglichen. Die Dokumentation folgt separat.

199 freigegebene Dateien wurden vorbereitet. Zwei Laufzeitdateien änderten sich:
Scheduler und Service Worker. Worker-Version
`6724d8c7-ae22-48f4-8379-2fd449f10135` ist seit 29.09.2026,
15:58:23.258 UTC zu 100 Prozent aktiv. Um 15:58:49.320 UTC wurden zehn
öffentliche Dateien bytegleich mit dem geprüften Paket verglichen, einschließlich
beider geänderter Dateien und der App-/Importmodule. TLS-Prüfung bleibt aktiv.

Im vorhandenen Codex-Testbrowser erschien nach Neuladen **Jetzt aktualisieren**.
Das kontrollierte Update wurde übernommen; anschließend waren das Updateangebot
und der vorübergehende Google-Hinweis verschwunden. 40 verfügbare Punkte,
2.040 Lernpunkte, Level 11 und ausgewählte Drachenstufe 4 blieben sichtbar.
Keine neue Anmeldung, kein Kauf und kein echter Import wurden dafür ausgeführt;
Familien-Chrome und vorhandene Drive-Bestände blieben unangetastet.

Der frühe Importabgleich ist durch den synthetischen echten Appablauf belegt,
nicht durch einen neuen Import in den bestehenden Drive-Testbereich. Reale
Google-Gesamtdauer und natürliche Token-Erneuerung bleiben offene Nachweise.

## Separater bestätigter Bedienbefund

Ein isolierter Edge-Versuch mit 390 px reproduziert im Tabellenimport:
Eine leere englische Zelle wird korrigiert und anschließend mit Tab verlassen.
Der Wert bleibt erhalten, aber der Fokus geht auf das Dokument zurück.
Ein veralteter Pflichtfeldhinweis sperrt zudem die Übernahme, bis zusätzlich
**Struktur nach Prüfung bestätigen** gedrückt wird. Diese beiden Befunde sind
nicht Bestandteil der bestätigten Scheduleränderung und bleiben Folgearbeit.

Die gezielte Korrektur soll den Fokus erhalten und den Pflichtfeldhinweis anhand
des korrigierten Inhalts neu bewerten. Tatsächliche Mehrdeutigkeiten bei Spalten
oder Anführungszeichen benötigen weiterhin eine bewusste Prüfung.
Die lokale Probe und Aufnahme liegen unter
`.superpowers/sdd/2026-09-29-mobile-entry/`. Ein physisches iPhone/iPad oder
eine virtuelle Bildschirmtastatur wurde damit nicht geprüft.
