# Task 9 – Produkt-Drive-Abgleich mit unveränderlichen Paketen

> Pausenstand: Task 9 ist noch nicht freigegeben. Die unabhängige [Review](2026-09-18-synchronisation-review.md) hat neun wichtige Fehler gefunden. Die nachfolgenden Angaben beschreiben die erste Implementierung und ihre damaligen Tests, keine vollständige Korrektheit.

## Ergebnis

Implementiert wurden die drei Produktmodule `packets.js`, `drive.js` und `scheduler.js`, die enge optionale Drive-Metadaten-Erweiterung `version`, sowie die Validierung der neuen persistierten Transportdatensätze in `commands.js`.

- Pakete: höchstens 100 Ereignisse und 64 KiB UTF-8 einschließlich Hülle; Ereignis-, Datensatz- und Epochenprüfung; stabile Paket-IDs.
- Drive: Anlage eines Produktordners mit unveränderlicher echter Wurzelepoche und Descriptor, geprüfte Discovery/Join-Auswahl, CAS-basierter Download und Upload, unveränderliche Pending-Pakete, Quarantäne und Wiederaufnahme nach später eintreffenden Abhängigkeiten.
- Integrität: Drive-ID wird vor `putJson` lokal gespeichert; verlorene Uploadantwort verwendet dieselbe ID und denselben Inhalt. Pending-Dateiinhalt darf unter derselben reservierten ID nicht abweichen.
- Known files: persistierter Hash plus sitzungsinterner verifizierter `version`-Cache. Überspringen erfolgt nur nach frischer Versions-/Metadatenprüfung; fehlende Version erzwingt erneutes Lesen. Inhalt wird durch Metadaten vor und nach dem Lesen geklammert.
- Status: `local|pending|connect|synced|error|conflict` mit Pending-, Late- und Konfliktzählern. Nur ein vollständig bestätigter Lauf meldet `synced`.
- Scheduler: sofort/Foreground/Online/Rundenende, 10-s-Bündelung, 60-s-Polling ohne Änderungen, kein Polling im versteckten Zustand, ein Lauf plus genau ein vorgemerkter Folgelauf, transienter Backoff 1/2/4/8/16 s.
- Adapter: `version` wird optional angefordert und nur als dezimale Zeichenfolge akzeptiert; Auth-/HTTP-Implementierung blieb unverändert.

## TDD-Nachweise

RED:

- `node --test --experimental-test-isolation=none tests/trainer/packets.test.js tests/trainer/sync.test.js tests/trainer/scheduler.test.js`: Exit 1, 0/3; alle drei Produktmodule fehlten.
- Adapter-RED im kombinierten Lauf: Feldliste enthielt `version` nicht und malformed `version` wurde nicht abgewiesen (2 erwartete Fehlschläge).
- Commands-RED: malformed persistierter Known-File-Hash wurde zunächst akzeptiert (1 erwarteter Fehlschlag).
- Pending-Integritäts-RED: veränderter Inhalt unter reservierter Datei-ID gelangte bis zum Adapterkonflikt; der neue Test verlangte die frühere lokale Collision-Sperre.
- Quarantäne-RED: kaputtes Paket wurde mit `value:null` statt prüfbarem synthetischem Wert gespeichert.

GREEN:

- Fokussierter Lauf über Adapter, Commands, Pakete, Sync und Scheduler: 58/58 grün vor den letzten beiden Integritätsfällen; beide zusätzlichen Rot-Grün-Fälle anschließend gezielt grün.
- Einmaliger vollständiger Abschlusslauf `npm test`: 215/215 grün, 0 fehlgeschlagen, Exit 0.
- `node --check` auf allen sechs neuen Quell-/Testdateien: Exit 0.
- `git diff --check`: Exit 0.
- Keine echten Google-Aufrufe, keine persönliche Konfiguration und keine realen Lerndaten.

## Öffentliche Schnittstellen für Task 10/11

- `buildPackets({events,datasetId,epochId,id})` und zusätzlich `validatePacket(packet)`.
- `createProductSync({drive,store,commands,now,id,onStatus})` liefert `discover/createDataset/joinDataset/sync/retry/getStatus`.
- `discover()` liefert genau `{folderId,descriptorFileId,descriptor}[]`.
- Root-Bootstrap: `createDataset` veröffentlicht eine Datei mit App-Properties `{app:'vokabeltrainer-product',kind:'epoch',datasetId,epochId}`; `joinDataset` sucht und lädt diese echte Root-Epoche. Es werden keine Epochenmetadaten aus dem Descriptor erfunden.
- Ein leerer lokaler Setup-Stand kann nach bestätigter Auswahl den Remote-Root öffnen. Ein nichtleerer fremder Stand liefert Preview mit `requiresSafetyCopy:true`; `confirm` bleibt bis Task 10 mit `not-ready` gesperrt.
- Task 10 erweitert den Transport für Folgeepochen, Snapshotteile/-manifeste und die Sicherheitskopie/ausdrückliche Auswahl. Der Root- und Pakettransport ist dafür die bestehende Grenze.
- Bei Drive-`auth`/401 veröffentlicht Task 9 `phase:'connect'` über `onStatus` und wiederholt nicht. Task 11 muss daraufhin seine im RAM gehaltene `tokenSession` invalidieren und die bewusste Neuanmeldung anbieten; es wurde absichtlich kein zweiter Auth-Callback oder eigene Tokenlogik eingebaut.
- `createSyncScheduler` erwartet die vereinbarte Funktion `sync`; Task 11 verdrahtet Browserereignisse und den Rundenabschluss.

## Offene Grenzen

- Keine reale Drive-, Safari-, iPhone- oder iPad-Prüfung; nur synthetische Adaptertests.
- Der nichtleere Cross-Dataset-Join bleibt bis zur Task-10-Sicherheitskopie absichtlich nicht bereit.
- Die unabhängige Review widerlegt die ursprüngliche Einschätzung zur Erstanlage: Bei verlorener Bestätigungsantwort kann bereits ein vollständig auffindbarer Ordner bestehen. Ein erneuter Versuch kann einen zweiten Ordner mit derselben Datensatz-ID erzeugen. Ein persistierter Setup-Auftrag ist deshalb für die Korrektur vorgesehen; er ist noch nicht implementiert. Weitere Integritäts- und Nebenläufigkeitsfehler sind in der Review belegt.
- Commit: `a1db93f feat: synchronize immutable trainer packets with Drive`
