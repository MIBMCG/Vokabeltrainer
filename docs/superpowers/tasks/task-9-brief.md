# Task 9 requirements

## Global Constraints

- „Zielgruppe: 10–13 Jahre, Klasse 4–7.“
- „Plattformübergreifende Web-App mit besonderem Schwerpunkt iOS/iPadOS.“
- „Lernrichtung zunächst Deutsch nach Englisch mit Texteingabe.“
- „Kein zusätzliches kostenpflichtiges Cloudabo, kein stillschweigender Anbieterwechsel.“
- „Eine gemeinsame JSON-Datei nicht ungeschützt nach dem Prinzip ‚letzter Upload gewinnt‘ überschreiben.“
- „Keine Geräusche oder Musik in der ersten Version.“
- „Keine Münzen und kein Laden.“
- Node.js `>=22.8.0`; keine npm-Laufzeitabhängigkeiten, kein Framework/Buildschritt. Browser-Code muss auch unter einem Repository-Unterpfad funktionieren.
- Exakte fachliche Werte: 10/20/30 Antworten, 10 Antwortpunkte, 20 Abschlussbonus, 2 andere Antworten nach Fehler, Dreierserie, 1/3/7/14/14… Kalendertage, 200 Punkte je Level, 3 Inseln/15 Etappen, 4 Hauttöne/6 Kleidungsfarben/6 Zubehörteile/6 Abzeichen.
- Keine echte PIN, Token, Kontokennung oder Lerndaten in Repository, Screenshots oder Prüfberichten. Öffentliche OAuth-Client-ID ist kein Secret, persönliche Konfiguration trotzdem nicht als Voraussetzung einchecken.
- Arbeitsreihenfolge durch ausdrücklichen Nutzerauftrag vom 17.09.2026: **volle Implementierung jetzt; iPhone/iPad und physische Geräteabnahme durch den Freund danach**. Keine erneute pauschale Entwurfs-/Startfreigabe und keine künstliche Meilensteinpause. Technische Reviewgates bleiben bestehen. Kein Hosting, Cloudkontenumbau, Bezahlen, Kontaktieren des Freundes oder Veröffentlichen einer App in diesem Plan.
- Der Plan beginnt nach dem dokumentierten Probe-Checkpoint; 74/74 vorhandene Node-Tests sind die erhaltene Baseline. Aktuelle Zahlen nach Änderungen tatsächlich erheben, nicht fortschreiben.


### Gemeinsame Schnittstellen

Die Typnamen `Descriptor`, `Event`, `Ledger`, `Snapshot`, `Epoch`, `Projection`, `LocalRound`, `Packet`, `ProductState` sind exakt im [Datenvertrag](../../PRODUKT-DATENFORMAT.md) definiert. Alle Exporte nachfolgend sind ES-Modul-Funktionen; `Promise<T>` bedeutet einen wirklich abgewarteten asynchronen Abschluss. Kein Modul liest versteckt Datum, Zufall, DOM oder Drive, sofern eine entsprechende Abhängigkeit vorgesehen ist.

Testfixture Task 1: `createFixture({timeZone='Europe/Berlin', words=[['w1','Hund',['dog']],['w2','Katze',['cat']],['w3','Haus',['house']]]}={})` liefert `{base, roundStarted, event, answer, withEvents}`. `base` hat Datensatz `d1`, Wurzelepoche `e0`, Gerät `dev1`, Profil `p1` mit Name Ada, zugeordnete Lektion `l1` namens Unit 1 und Wortfassungen `rev-w1` usw. `roundStarted` ist eine gültige `round.started`-Tatsache `start-r1` für `r1`, `p1`, Modus `all`, Größe 10. `event(type,payload,overrides={})` erzeugt vollständige gültige Hüllen mit monotoner Fixture-Uhr. `answer({id,ordinal=1,wordId='w1',correct=true,day='2026-09-17',roundId='r1',...overrides})` referenziert die gültige Basiswortfassung. `withEvents(...events)` liefert eine neue Ledgerkopie aus `base` und genau diesen Ereignissen; keine still hinzugefügten Antworten/Runden. Testdaten bleiben intern im Testordner und werden nie vom Server ausgeliefert.


## Task 9: Produkt-Drive-Abgleich mit unveränderlichen Paketen

**Files:** Create `src/trainer/sync/packets.js`, `drive.js`, `scheduler.js`, `tests/trainer/packets.test.js`, `sync.test.js`, `scheduler.test.js`; Modify `src/trainer/commands.js` für explizite Statusintegration, kein dupliziertes Fachmodell.

**Interfaces:** `buildPackets({events,datasetId,epochId,id}):Packet[]`; `createProductSync({drive,store,commands,now,id,onStatus}):{discover(),createDataset(name),joinDataset(selection,decision),sync(),retry(),getStatus()}` (asynchrone mutierende Methoden). `discover():Promise<{folderId,descriptorFileId,descriptor}[]>`; `selection` enthält diese geprüften IDs, `decision='preview'|'confirm'`; Preview gibt Unterschied/Sicherheitskopie-Voraussetzung zurück. `getStatus():{phase,pendingCount,lateCount,conflictCount,message,lastConfirmedAt}` mit `phase='local'|'pending'|'connect'|'synced'|'error'|'conflict'`. `createSyncScheduler({sync,hasChanges,setTimer,clearTimer,now}):{start(),changed(),roundCompleted(),visibility(visible),online(),stop()}`. Bestehenden `createDriveClient`/`createTokenSession` unverändert konsumieren; ihre exakten Methoden stehen in `src/drive/*.js`.

- [ ] **1. RED:** Paketgrenzen inkl. UTF-8-Umlauten/JSONhülle, 101 Events -> mindestens zwei Pakete; einzelnes zu großes Event sichtbar abweisen. Sync-Fake implementiert echten vorhandenen Adaptervertrag `accountId/generateId/listFiles/metadata/readJson/createFolder/putJson`; Upload speichern, dann Netzfehler auslösen:

```js
test('lost upload response retries same file and counts one answer', async () => {
  const {sync,drive,commands}=await setupSyntheticSync();
  drive.loseNextUploadResponse=true;
  await assert.rejects(sync.sync());
  const pending=commands.getState().pendingPackets[0];
  const originalId=pending.driveFileId;
  await sync.retry();
  assert.equal(drive.createdPacketIds.filter(id=>id===originalId).length,1);
  assert.equal(sync.getStatus().pendingCount,0);
});
```

`setupSyntheticSync` testlokal aus Commands/Fixture/MemoryStore aufbauen. Weitere Fälle: zwei offline arbeitende Geräte, Seitenwechsel der Dateiliste, unbekannte/kaputte Pakete, falsches Konto/Ordner, Drive-404, geänderte bekannte Datei, Pending nicht in fremden Bestand, 401 invalidiert Zugriff, 403 stoppt Retry, 5 begrenzte Retries, hidden stoppt Polling, Vordergrund/online/Rundenende startet einmal, stale lokaler Commit während Download wird neu gemischt statt überschrieben.
- [ ] **2. RED ausführen:** `node --test tests/trainer/packets.test.js tests/trainer/sync.test.js tests/trainer/scheduler.test.js`.
- [ ] **3. GREEN:** Eigene App-Kennungen und Datensatzbeschreibung, bewusste Anlage/Join. Datei-ID und Paketinhalte vor Upload speichern, nur nach verifiziertem `putJson` quittieren. Ablauf:

```js
await persistPendingPacket(packet);
const fileId = packetRecord.driveFileId ?? await drive.generateId();
await persistDriveFileId(packet.packetId, fileId);
await drive.putJson({id:fileId,name:`packet-${packet.packetId}.json`,parentId:binding.folderId,
  appProperties:{app:'vokabeltrainer-product',kind:'packet',datasetId:packet.datasetId,
    epochId:packet.epochId,packetId:packet.packetId},value:packet});
await confirmPacket(packet.packetId);
```

Die drei `persist.../confirm...` Helfer sind private Funktionen im Syncmodul, verwenden `commands.commitExternal` mit Hash/Retry, keine zweite Writerverbindung. Alle Suchen paginiert über vorhandenen Adapter; bekannte unangefasste Dateien nicht erneut laden, Metadaten/Fremdkennung prüfen. Pending-Satz gewinnt nie über zwischenzeitliche lokale Antworten. Quarantäne blockiert nur betroffene Daten; ungeklärte Epoche verhindert „Abgeglichen“. 10s Bündeln/60s Polling/1–16s Retry aus Vertrag. Bestehenden lokalen Bestand beim Join niemals heimlich ersetzen; Sicherheitskopie/Preview über Task-10-Format anbinden, bis dahin Join mit nichtleerem lokalen Bestand `not-ready` statt Datenverlust.
- [ ] **4. GREEN prüfen:** genannte Tests + `npm test`; Probeadaptertests unverändert grün. Kein echter Google-Zugriff für diese Tests.
- [ ] **5. Review/Commit:** `git diff --check`; nur Taskdateien; `git commit -m "feat: synchronize immutable trainer packets with Drive"`.


## Execution contract
Read docs/PRODUKT-DATENFORMAT.md for exact types. Approved product spec is docs/superpowers/specs/2026-09-16-vokabeltrainer-design.md. Do not read whole implementation plan. Work only in this worktree; preserve probe and running port4173 server. No subagents. TDD and self-review, explicit task files only in commit. Never force-add ignored scratch. Escalated git commit is authorized. Report full changes, actual RED/GREEN commands and outputs, commit, concerns and interface deviations in task-9-report.md in this directory. Return only status, commit, test summary and concerns.

## Valid-ID map integration
Task2 review found accepted string IDs such as __proto__ / constructor must remain ordinary own enumerable data entries. Use safe maps or null-prototype dictionaries/own-property access for ID-keyed derived/local state; do not silently lose or inherit entries. Existing entity projection fix establishes this boundary; preserve it in consumers and add targeted tests where relevant.

## Local compare-and-swap hash contract
Use productStateHash(state):Promise<string> exported from src/trainer/commands.js for commitExternal expectedStateHash. It clones the complete valid ProductState, converts rounds and each nested wordCounts to ASCII-key-sorted entry arrays, then uses the existing canonical SHA-256 digest. Never substitute digest(state): accepted IDs can be __proto__/constructor/prototype in these local maps while exchange canonical objects reject dangerous keys. Hash is key-insertion-order independent and covers all state values. Before setup commands.getState() is null; setup creates the state, then PIN verifier can be saved. Interrupted setup with null verifier must resume PIN setup.
