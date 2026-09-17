# Task 2 requirements

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


## Task 2: Inhaltsfassungen und Epochenprojektion

**Files:** Create `src/trainer/model/revisions.js`, `src/trainer/model/epochs.js`, `tests/trainer/revisions.test.js`, `tests/trainer/epochs.test.js`. Modify `src/trainer/model/schema.js`, `tests/trainer/schema.test.js` nur für die unten beschriebene lokale Snapshotreferenz.

**Interfaces:** Consumes Task-1 Ledger/Validator/Hash. Produces `normalize(text):string`, `semanticWord(value):object`, `nextLearningId({wordId,revisionId,value,parents}):Promise<string>`, `projectEntities(events,{supportEvents=[]}={}):{entities,conflicts}`, `resolveEpochs(ledger):{activeEpochId,heads,epochConflict,effectiveEvents,supportEvents,lateEvents}`, `revisionPayload({entityType,entityId,parents,value}):object`. `entities` ist `{profiles,lessons,words}`, jeweils Objekt nach Entitäts-ID mit `{id,heads,value,createdOrder,conflicted}`; konflikthafte Objekte haben `value:null`. `conflicts` enthält `{entityType,entityId,heads}`. `parents` in `nextLearningId` sind vollständige Vorgängerereignisse.

- [ ] **1. RED:** Parallele unterschiedliche Lösungen bleiben beide erhalten, identische normalisierte Nachfolger gelten kompatibel, Archivierung gegen Bearbeitung ist Konflikt. Beispiel:

```js
test('two successors remain conflict until a revision names both parents', () => {
  const f=createFixture();
  const revise=(id,answers,parents=['rev-w1']) => f.event('entity.revised', {
    entityType:'word',entityId:'w1',parents,
    value:{lessonId:'l1',german:'Hund',hint:'',answers,archived:false,learningId:id}
  }, {id});
  const left=revise('left',['dog']), right=revise('right',['hound']);
  const before=projectEntities([...f.base.events,left,right]);
  assert.equal(before.entities.words.w1.conflicted,true);
  const chosen=revise('chosen',['hound'],['left','right']);
  assert.equal(projectEntities([...f.base.events,left,right,chosen]).conflicts.length,0);
});
```

Integration mit Task 1: Folgeepoche mit vollständigem lokalem Snapshot und `snapshotManifestFileId: null` muss gültig sein (echter RED/GREEN-Test in `schema.test.js`); fehlender `snapshotId` oder Snapshot bleibt ungültig. Der optionale Transportverweis bleibt nach späterer Cloudveröffentlichung unverändert. Zusätzlich zwei gleichzeitige Restore-Köpfe ohne automatischen Gewinner; fehlender Snapshot aktiviert keine Epoche; Snapshot-Support aktiviert keine Wörter/Antwortpunkte; späte Altantwort verbleibt separat; explizite Adoption derselben ID zweimal bleibt einmal wirksam. Fremder Backup-Herkunftsgraph bleibt ausschließlich `historicalEpochs`, erzeugt keinen neuen aktiven Kopf und verletzt nicht die eine Zielwurzel.
- [ ] **2. RED ausführen:** `node --test tests/trainer/revisions.test.js tests/trainer/epochs.test.js` und Fehlbefund lesen.
- [ ] **3. GREEN:** Kopfbestimmung über referenzierte Eltern, nicht Zeitstempel; semantischer Vergleich umfasst Archivierung/Zuordnung. Epochenauswahl:

```js
const parents = new Set(ledger.epochs.flatMap(epoch => epoch.parents));
const heads = ledger.epochs.filter(epoch => !parents.has(epoch.id));
const epochConflict = heads.length !== 1;
const activeEpochId = epochConflict ? null : heads[0].id;
```

Bei Konflikt Daten erhalten und keine scheinbar eindeutige Projektion bilden. Snapshot-/Native-/Adoptionsmengen nach IDs vereinigen; Support separat halten. `projectEntities` erhält optional als zweiten Parameter `{supportEvents: []}`: Vorgängerketten werden transitiv in beiden Mengen verfolgt; aktive Kandidaten stammen ausschließlich aus `events`. Ein aktiver Kopf entfällt nur als Vorfahr eines anderen aktiven Kandidaten, niemals allein wegen eines Support-Nachfolgers. `createdOrder` stammt aus der frühesten erreichbaren Wurzelfassung. Tests prüfen aktive v2/v5 mit unterstützenden v3/v4, ausschließlich unterstützendes v5 gegen aktives v2 sowie erhaltene Lektions-Anlegereihenfolge. `project` aus Task 3 übergibt beide von `resolveEpochs` gelieferten Mengen. Normalisierung und Lern-ID-Regeln exakt aus dem Vertrag. `revisionPayload` ist ein reiner Payload-Builder ohne Zugriff auf den aktuellen Bestand. Die zwingende Prüfung aktueller Köpfe erfolgt in Task5 innerhalb des serialisierten `commands.revise` unmittelbar vor dem Speichern anhand `expectedHeads`; ein altes Formular darf keinen neuen fremden Kopf unterschlagen. Die Regression für einen zwischenzeitlich hinzugekommenen Kopf gehört daher Task5, nicht in einen bestandslosen Builder.
- [ ] **4. GREEN prüfen:** genannte Tests, `npm test`; zusätzlich Permutationen der Eingangsereignisse prüfen, beide Geräte erhalten gleiche Köpfe.
- [ ] **5. Review/Commit:** `git diff --check`; `git add src/trainer/model/revisions.js src/trainer/model/epochs.js src/trainer/model/schema.js tests/trainer/revisions.test.js tests/trainer/epochs.test.js tests/trainer/schema.test.js`; `git commit -m "feat: preserve product revisions and epoch conflicts"`.


## Execution contract
Read docs/PRODUKT-DATENFORMAT.md for exact types. Approved product spec is docs/superpowers/specs/2026-09-16-vokabeltrainer-design.md. Do not read whole implementation plan. Work only in this worktree; preserve probe and running port4173 server. No subagents. TDD and self-review, explicit task files only in commit. Never force-add ignored scratch. Escalated git commit is authorized. Report full changes, actual RED/GREEN commands and outputs, commit, concerns and interface deviations in task-2-report.md in this directory. Return only status, commit, test summary and concerns.
