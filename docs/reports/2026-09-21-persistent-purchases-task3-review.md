# Task 3 – unabhängige Spezifikations- und Qualitätsprüfung

Prüfstand: `cd6ba45..5f73008` auf `codex/vokabeltrainer-v1`, 21.09.2026.
Die bereitgestellte Spanne enthält den Dokumentationscommit `a887b55` und den Produktcommit `5f73008`.

**Spezifikationsurteil: nicht bestanden. Qualitätsurteil: Änderungen erforderlich.**
Vier relevante Befunde: drei P1, ein P2. Keine Produktdatei, kein Index und kein HEAD verändert; die vorhandene Änderung an der Fortsetzungsübergabe bleibt erhalten.

## Befunde

### R3-1 – P1: Neue Kaufbasis wird veröffentlicht, bevor ihre Erweiterung der bestätigten Historie geprüft ist

**Ort:** `src/trainer/purchases/service.js:226`, ergänzend `:267` und `:280`.

`refreshInternal` aktualisiert Kaufkopf und Kaufcache, führt aber keinen Fachabgleich durch und übernimmt die geprüfte Kopf-Basis nicht in den lokalen Ledger. `reservePurchase` serialisiert anschließend unverändert `state.ledger`. Der Transport prüft die gespeicherte Closure, Hashes und Bindung, nicht deren fachliche Erweiterung der bisherigen Historie. Die erste vollständige Prüfung des neuen Belegs erfolgt somit erst nach dem Pointer-PUT.

Konkreter synthetischer Nachweis: Zwei Instanzen beginnen mit demselben gültigen Ledger. A speichert `setAnimations({profileId:'p1',animations:false})` und kauft für p1. B liest den neuen Kaufkopf und kauft aus seinem älteren Ledger für p2. Beide Profile haben ausreichende und hier unveränderte Lernpunkte. B sendet den zweiten Pointer erfolgreich; danach scheitert die Historienlesung auf **beiden** Instanzen mit `history: Eine spätere Kaufbasis entfernt frühere aktive Fakten.` Der gemeinsame Kopf hat sich auf diesen ungültigen Beleg geändert. Das ist kein simuliertes ETag-Rennen: B reserviert erst nach A und verwendet dessen aktuellen Kopf.

Erforderlich: vor jeder abhängigen Veröffentlichung einen erfolgreich abgeglichenen, vollständigen Fachstand verwenden und die geplante Belegerweiterung einschließlich Basis gegen die vollständige geprüfte Historie abspielen/validieren. Ein negativer Fall muss vor dem Pointer bleiben; ein älteres Gerät muss zuerst fehlende Fakten übernehmen oder geschlossen abbrechen. Nicht allein nach dem PUT prüfen.

### R3-2 – P1: Historienabgleich bestätigt Aufträge anhand der Operations-ID ohne Prüfung ihres Inhalts

**Ort:** `src/trainer/purchases/service.js:120` und `:136`.

Der Treffer nach `operationId` reicht aus, einen Kaufauftrag beziehungsweise ControlJob auf `confirmed` zu setzen. Es fehlen Vergleiche mit dem vollständigen gespeicherten Intent, dem Kandidatenverweis sowie bei Controls Operation und Epoche. Die Historienzusammenfassungen enthalten zudem Belege aus Herkunftszweigen, nicht ausschließlich Belege der aktiven Zielkette. Deren jeweils gültige Hashes beweisen keine Übereinstimmung mit dem lokalen Auftrag.

Konkreter synthetischer Nachweis: Der p1-Kauf verliert seine Anfrage vor dem PUT. Ein zweites Gerät sendet einen gültigen p2-Kauf mit derselben Operations-ID. `first.service.refresh()` markiert daraufhin den lokalen p1-Auftrag als `confirmed`, obwohl die geprüfte Projektion p1-Ausgaben **0** und p2-Ausgaben **200** zeigt. Die bestehende Schema-Prüfung vergleicht nur den lokalen gespeicherten Intent mit seinem lokalen Kandidaten; sie vergleicht diese nicht mit dem tatsächlich gefundenen Fernbeleg.

Erforderlich: den tatsächlichen Zielkettenbeleg anhand vollständiger Bindung und Identität prüfen; Kandidat, unveränderlichen Intent und Control-Parameter mit der gespeicherten Closure abgleichen. Abweichungen müssen als Integritäts-/Kollisionsfehler sperren und dürfen keinen Epochenabschluss auslösen. Tests für fremdes Profil, geänderten Artikel, gleichnamige Herkunftsoperation und abweichenden Control-Kandidaten ergänzen.

### R3-3 – P1: Nach weiteren richtigen Antworten sind neue Käufe blockiert

**Ort:** `src/trainer/purchases/service.js:185`, ebenfalls `:220` und `:290`.

Die Angebote erhalten die wirtschaftlichen Konten des letzten Kaufbelegs unverändert, kombiniert mit dem aktuellen lokalen Ledger. `purchaseOffer` verlangt zu Recht, dass dessen geprüfte Lernpunkte und `economic.accounts[profileId].earnedPoints` übereinstimmen. Der Dienst baut die Konten jedoch nicht aus dem aktuellen vollständigen Fachstand und den bestätigten Ausgaben neu auf. Ein neuer Lernpunktestand kann deshalb durch keinen normalen Kauf in eine neue Belegbasis gelangen.

Konkreter synthetischer Nachweis: Nach Aktivierung mit 300 Punkten werden ein gültiger neuer Rundenstart und eine richtige Antwort atomar über `commitExternal` gespeichert. Der neue Ledger mit 310 Punkten wird akzeptiert. Der nächste `preview` bricht mit `integrity: Die Lernpunkte wurden nicht aus dem aktuellen Fachstand abgeleitet.` ab; es erfolgt kein Pointer-PUT. Die Recoverytests verwenden durchgehend unveränderte verdiente Punkte und erfassen diesen Hauptpfad nicht.

Erforderlich: geprüfte bestehende Ausgaben/Besitz mit dem erfolgreich abgeglichenen aktuellen Fachstand kombinieren und die Konten über die gemeinsame Fachprojektion neu ableiten. Keine frei übergebene Punktesumme als Autorität verwenden. Vorschau, Bestätigung und Reservierung müssen denselben Zustand binden. Regression für weitere Antworten und Rundenbonus nach Aktivierung beziehungsweise nach einem Kauf ergänzen.

### R3-4 – P2: Die vorgeschriebene Neustart- und Speicherfehler-Matrix ist nicht umgesetzt

**Ort:** `tests/trainer/purchases-recovery.test.js:177`, `:214`, `:253`, `:291` und `:312`; Harness `:75`.

Die Tests erzeugen neue Commands-/Serviceobjekte, verwenden beim Neustart aber dieselben `memoryStore`-/Storewrapper- und `PurchaseRemote`-Instanzen weiter. `PurchaseRemote` ist zugleich serverseitiger Zustand und clientseitiger Transport, sodass nicht nachgewiesen ist, dass ein vollständig neuer Transport ausschließlich aus persistierten Informationen arbeiten kann. Es gibt keinen Neustart nach jedem Speicher-/Netzschritt. Speicherfehler werden vor dem ersten Reservieren und nach dem Pointer geprüft, nicht an allen einzelnen Kontroll- und Kaufübergängen. Der Restorefall prüft keinen Neustart; die Control-Fälle decken nur Vorbereitung und einen Uploadfehler ab.

Dies ist eine echte Lücke gegenüber dem ausdrücklichen RED-/Abnahmekriterium, kein Beweis eines zusätzlichen beobachteten Datenverlusts. Die vorhandenen Tests liefern Teilnachweise und dürfen nicht als vollständige Neustartabnahme gelten.

Erforderlich: persistierte Bytes in einen neuen Storeadapter laden, einen neuen Transport mit getrenntem simuliertem Serverzustand erzeugen und Commands/Service/Syncports ebenfalls neu instanziieren. Gezielte Abbruch-/Speicherfehlerpunkte an den dauerhaften Grenzen von Kauf, Aktivierung und Restore prüfen; insbesondere ursprüngliche Anfrage nach unklarem Ausgang unverändert, automatisches Refresh ohne PUT und keine abhängige Netzmutation nach fehlgeschlagenem Speichern.

## Erfüllte Teilanforderungen

- Lokale Version 3 bleibt von Fachformat 2 getrennt. V2-Migration erzeugt und validiert Sicherungen vor dem atomaren Save; alter Inhalt, PIN und Transportidentitäten werden kopiert. V1 migriert zuerst über den bestehenden Sicherungspfad. Offene alte Restorejobs lassen den Commands-Start zu und verschieben nur die Kaufmigration.
- Die bisherigen Runden-/Policyprüfungen gelten nun für lokale Versionen ab 2; `format-migration` bleibt als Sicherungszweck gültig.
- Kauf- und Control-Übergänge verwenden den serialisierten `commitExternal`-Pfad. Der vollständige Pointerbody und die ursprüngliche ETag sind dauerhaft gespeichert. Refresh führt keinen Pointerretry aus. Der ausdrückliche Retry verwendet diese gespeicherten Werte; die zuletzt ergänzte 412-Verzweigung setzt den Kaufversuch auf `superseded`.
- Controls sind getrennt von Kaufjobs gespeichert. Nichtterminale Controls sperren neue Käufe. Control-Uploadautorität prüft lokale Closure, Operation, Epoche über das Schema, Binding und konfigurierte Koordination; jeder Schreibweg verifiziert zusätzlich den installierten Configanker.
- Die tatsächliche Makrotask-Abgabe mit `setTimeout(0)` ist vorhanden; Cache-/Leseaufwand wird mitgezählt. `ProductError`-Codes bleiben erhalten. Die ergänzten Tests enthalten einen Timer-Nachweis und Auth-/Network-Fälle.
- Server-Allowlist und Workerassets enthalten den neu erreichbaren Schema-/Value-/Proof-Importgraphen. Worker v21 und synthetischer Updateworker v22 stimmen zusammen. Keine Shop-UI oder neue Cloudentscheidung wurde aktiviert.

## Task-4-Grenze und nicht verifizierbare Integration

Die Ports `prepareActivationCandidate`, `prepareRestoreCandidate` und `applyConfirmedControl({state,control,history})` sind tatsächlich vorhanden. Persistierter Control und vollständige geprüfte Historie/Basen werden übergeben; fehlende Ports liefern `not-ready`. Der Controller muss die eigentliche Markerabsicht, deren Speicherung vor Upload, das neue Fachformat und die Aktivierung der richtigen Epoche in Task 4 nachweisen. Die synthetischen Ports veröffentlichen keinen echten Marker. Das ist die vereinbarte Taskgrenze, kein zusätzlicher Task-3-Befund.

Das Control-Intentstadium allein enthält noch keinen Restore-Zielinhalt. Die Tests belegen Wiederaufnahme erst nach gespeicherter Closure; die Rekonstruktion der Vorschau/Zielentscheidung vor dieser Grenze muss im Task-4-Portvertrag konkret nachgewiesen werden. Ebenso muss ein später fortgeschrittener Kopf die maßgebliche aktive Epoche bestimmen, wenn ein älterer lokaler Control nachträglich gefunden wird. Der Controller wurde über die Grenzen informiert.

## Prüfverfahren und Aussagegrenzen

Gelesen: Task-3-Brief, Implementierungsbericht und bereitgestellter Diff einmal. Der kombinierte Tooloutput wurde gekürzt; die für die genannten Grenzen betroffenen aktuellen Dateien wurden anschließend gezielt mit Zeilennummern geprüft. Kein Diff neu erzeugt. Keine breitere Gesamtpaketprüfung vorgenommen.

Die berichteten 92/92 Fokus-, 4/4 Edge- und 431/431 Gesamttests wurden **nicht erneut ausgeführt**. Sie liegen zeitlich vor der abschließenden 412-Korrektur; der Bericht weist für deren endgültigen Stand 14/14 Recoverytests aus. Die geprüften Assertions liefern keine Abdeckung der drei oben reproduzierten Fehler. Die Zahlen sind die Nachweise des Implementierungsberichts, keine in dieser Review erneut erhobenen Suiteergebnisse.

Ausgeführt wurden ausschließlich lesende Git-/Quellprüfungen und drei kurze `node --input-type=module`-Diagnosen mit synthetischen Daten. Diese luden den Hilfsabschnitt vor dem ersten `test(...)` aus `purchases-recovery.test.js`, lösten relative Imports auf absolute Datei-URLs auf und führten nur die benannten Gegenbeispiele aus; keine Testsuite wurde dadurch importiert oder gestartet.

Diagnoseergebnisse:

1. Wiederverwendete Operations-ID: `status:"confirmed", localProfile:"p1", remoteProfile:"p2", p1Spent:0, p2Spent:200` (Exit 0).
2. Älterer Ledger: `pointerWrites:2, headChanged:true`, anschließend auf B und A jeweils `history` wegen entfernter früherer Fakten. Danach brach ein separat angehängter erster Versuch des Lernzuwachs-Probes mit ungültiger synthetischer Rundengröße 1 ab (Gesamtaufruf Exit 1); dies betrifft nicht den zuvor abgeschlossenen Kopf-Nachweis.
3. Korrigierter Lernzuwachs-Probe mit der bestehenden gültigen Rundengröße: atomarer Produktcommit erfolgreich, danach `preview` mit `integrity` abgelehnt und `pointerWrites:0` (Exit 0).

Reale Google-, Zwei-Geräte- und Apple-Prüfungen bleiben offen. Keine echten Daten oder Netzaufrufe verwendet. Vor Freigabe sind R3-1 bis R3-4 zu korrigieren und gezielt unabhängig nachzuprüfen; anschließend folgt weiterhin die geplante Gesamtpaketprüfung.
