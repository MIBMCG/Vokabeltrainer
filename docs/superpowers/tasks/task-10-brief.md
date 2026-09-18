# Task 10 requirements

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


## Task 10: Vollständige Sicherung und sichere gemeinsame Wiederherstellung

**Files:** Create `src/trainer/backup/format.js`, `restore.js`, `tests/trainer/backup.test.js`, `restore.test.js`; Modify `src/trainer/sync/drive.js` für Snapshot-/Epochen-Dateien und Join-Sicherheitskopie, `commands.js` für atomare Aktivierung.

**Interfaces:** `exportBackup(state,exportedAt):Promise<Backup>`, `parseBackup(text):Promise<Backup>`, `previewBackup({current,backup}):{profiles,wordCount,progressChanges,affectsConnectedDevices}`, `createRestoreService({commands,store,sync,drive,now,id}):{prepare(backup),confirm(previewId),resolveEpochConflict({selectedEpochId,expectedHeads}),previewAdoption(eventIds),adopt({eventIds,previewId}),listSafetyCopies(),downloadSafetyCopy(id)}`; `prepare` liefert `{previewId,summary}`, `confirm` `Promise<void>`, übrige mutierende Methoden asynchron. `resolveEpochConflict` erstellt nach Sicherheitskopie eine neue Vorschau, `confirm` vollzieht; keine unbeabsichtigte direkte Aktivierung. `previewAdoption` liefert `{previewId,summary,eventIds,supportEventIds}`. Sicherheitskopien local + Drive im Vertrag, ohne rekursive Sicherungseinbettung.

- [ ] **1. RED:**

```js
test('failed verified safety copy makes restore impossible', async () => {
  const h=await setupRestoreFixture();
  const before=h.commands.getState();
  h.drive.failSafetyReadback=true;
  await assert.rejects(h.restore.prepare(h.olderBackup));
  assert.deepEqual(h.commands.getState().ledger,before.ledger);
});
test('old offline answer remains separate until explicit adoption', async () => {
  const h=await setupRestoreFixture();
  const preview=await h.restore.prepare(h.olderBackup);
  await h.restore.confirm(preview.previewId);
  await h.deliverLateAnswer();
  const before=project(h.commands.getState().ledger);
  assert.equal(before.lateEvents.some(e=>e.id==='late-answer'),true);
  const adoption=await h.restore.previewAdoption(['late-answer']);
  await h.restore.adopt({eventIds:['late-answer'],previewId:adoption.previewId});
  assert.equal(project(h.commands.getState().ledger).profiles.p1.points,before.profiles.p1.points+10);
});
```

`setupRestoreFixture` testlokal: alter Backupstand, aktueller Stand mit mehr Antworten, synthetischer Drive und zwei Geräte. Weitere Pflichtfälle: invalide/zukünftige Datei und kaputte Referenz unverändert ablehnen; Export ohne PIN/Token/typed/Bindung; Pending enthalten; 64KiB Snapshotteile, fehlender Teil/Hashfehler kein Epochenschalter; Uploadverlust nimmt gleiche IDs; Crash nach Manifest/vor Epoche und nach Epoche/vor lokalem Commit; lokaler Offline-Restore; lokaler Backupimport vor späterem Join; Änderung zwischen Vorschau/Bestätigung; zwei Restore-Nachfolger, Auswahl aller Köpfe; alte Runden ohne Bonus beendet; doppelte Adoption ohne Doppelwertung; Inhaltsadoption mit Konflikt; Abschlussadoption ohne volle Antwortmenge abweisen.
- [ ] **2. RED ausführen:** `node --test tests/trainer/backup.test.js tests/trainer/restore.test.js`.
- [ ] **3. GREEN:** Komplette Validierung vor Mutation, Security-Limits/Schlüsselfilter/Hashes, nie importierten Code/HTML ausführen. Persistierte Restorephase ermöglicht Crashfortsetzung. Protokoll in genau dieser Reihenfolge:

```js
await sync.sync();
const safety = await saveAndVerifySafetyCopy(commands.getState());
const preview = await buildFreshPreview(backup, safety);
// confirm prüft previewId nach erneutem Sync; bei Veränderung neuer Dialog.
const manifest = await uploadAndVerifySnapshot(confirmedSnapshot);
const epoch = await publishAndVerifyEpoch(manifest, confirmedParentHeads);
await activateEpochAtomically(epoch);
```

Diese Helfer sind private Restorefunktionen mit Verträgen aus dem Datenformat; bei lokalem ungebundenen Bestand entfallen nur Netzschritte, lokale Sicherheitskopie und atomare Aktivierung bleiben. Epochendaten als Kontrolle unabhängig von normalen 100-Event-Paketen, Snapshotteile vollständig vor Kontrollereignis. Lokale Folgeepochen dürfen einen Null-Manifestverweis besitzen und werden bei erster Cloudanlage unverändert veröffentlicht: zuvor alle benötigten Manifeste prüfen, Dateizuordnung separat in `snapshotManifests` speichern. Empfang löst Null-Verweise über gebundenen Ordner plus Datensatz-/Snapshot-ID auf; fehlende/mehrdeutige Inhalte nie aktivieren. Dieses lokale-Restore-dann-Cloud-Szenario gehört in die Integrationstests. Keine Gesamtpunktestandaddition. Snapshotbezug statt ungeschütztem Überschreiben. Fremdes Backup nur explizit auf Zielidentität neu verankern; Kollisionen sichtbar abweisen. Sicherheitskopien in Erwachsenenbereich auflisten/downloaden; keine automatische Löschung.
- [ ] **4. GREEN prüfen:** genannte Tests + `npm test`; Zwei-Geräte-Fake über beliebige Zustellreihenfolgen, ursprüngliche Ereignisse vor/nach Restore erhalten. Test bestätigt nur Protokoll, keine reale Drive-/iOS-Abnahme.
- [ ] **5. Review/Commit:** `git diff --check`; nur Taskdateien; `git commit -m "feat: restore complete backups through verified epochs"`.


## Execution contract
Read docs/PRODUKT-DATENFORMAT.md for exact types. Approved product spec is docs/superpowers/specs/2026-09-16-vokabeltrainer-design.md. Do not read whole implementation plan. Work only in this worktree; preserve probe and running port4173 server. No subagents. TDD and self-review, explicit task files only in commit. Never force-add ignored scratch. Escalated git commit is authorized. Report full changes, actual RED/GREEN commands and outputs, commit, concerns and interface deviations in task-10-report.md in this directory. Return only status, commit, test summary and concerns.

## Valid-ID map integration
Task2 review found accepted string IDs such as __proto__ / constructor must remain ordinary own enumerable data entries. Use safe maps or null-prototype dictionaries/own-property access for ID-keyed derived/local state; do not silently lose or inherit entries. Existing entity projection fix establishes this boundary; preserve it in consumers and add targeted tests where relevant.

## Local compare-and-swap hash contract
Use productStateHash(state):Promise<string> exported from src/trainer/commands.js for commitExternal expectedStateHash. It clones the complete valid ProductState, converts rounds and each nested wordCounts to ASCII-key-sorted entry arrays, then uses the existing canonical SHA-256 digest. Never substitute digest(state): accepted IDs can be __proto__/constructor/prototype in these local maps while exchange canonical objects reject dangerous keys. Hash is key-insertion-order independent and covers all state values. Before setup commands.getState() is null; setup creates the state, then PIN verifier can be saved. Interrupted setup with null verifier must resume PIN setup.

## Desktop integration follow-up 18 September
Before implementation, read the completed Task9 fix report and current data contract. Local datasetSetup and packetIntegrity transport fields are backward-compatible additions and must not leak into portable backups. Preserve stable setup jobs, packet collision protection and command-state subscriptions when extending sync. The unchanged-epoch/null-manifest contract remains mandatory for offline restore followed by initial cloud publication. After changes, include server whitelist entries for every new browser-imported module; a Task9 import omission previously prevented all setup UI from loading.
