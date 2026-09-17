# Task 3 requirements

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


## Task 3: Antwortprüfung, Lernstand und dauerhafte Belohnungen

**Files:** Create `src/trainer/learning/answers.js`, `calendar.js`, `progress.js`, `rewards.js`, `tests/trainer/learning.test.js`, `tests/trainer/rewards.test.js`. Modify `src/trainer/model/schema.js`, `tests/trainer/fixtures.js`, `tests/trainer/schema.test.js` für die folgende vorgezogene Integrationskorrektur.

**Interfaces:** Consumes `normalize`, `resolveEpochs`, `projectEntities`. Produces `assess(typed,wordValue):{empty,correct,solutions}`, `dayInZone(instant,timeZone):string`, `addDays(day,count):string`, `project(ledger):Projection`, `rewardState({points,completedRounds,masteredWordIds,recoveredWordIds}):{level,badges,unlocked,journey}`, `milestonesAfterAnswer(projectionBefore,projectionAfter,answer,events):payload[]`. Milestonepayloads entsprechen dem Datenvertrag und werden Task 5 in derselben Transaktion angefügt. `project` bleibt rein/synchron, nachdem Ledger/Hashes extern geprüft wurden.

- [ ] **0. Integrationskorrektur mit eigenem RED/GREEN:** `round.started` enthält ausschließlich `{roundId,profileId,mode,size}`. Entferne Kandidaten aus Startereignisschema, Fixture und Import-Mitgliedschaftsprüfung; eine bestehende Wortfassung mit passendem Profil/Rundeneintrag bleibt gültig. Lokale Kandidaten gehören Task4/5. Regression für kleines Startereignis unabhängig von großem Wortbestand und gültige weitere Wortantwort; vorhandene Prüfungen für falsche Wortfassung, Profil, Ordinal und Abschluss erhalten. Task5 prüft zusätzlich echte bewusste Erweiterung sowie Ablehnung einer unzulässigen lokalen Antwort. Danach Lernkern umsetzen.

- [ ] **1. RED:**

```js
test('accepted typography does not hide real spelling errors', () => {
  const word={answers:["don't",'do not']};
  assert.equal(assess(' DON’T ',word).correct,true);
  assert.equal(assess('dont',word).correct,false);
  assert.equal(assess('do  not',word).correct,false);
  assert.equal(assess('  ',word).empty,true);
});
test('three correct answers persist across rounds and use calendar days', () => {
  const f=createFixture();
  const events=[1,2,3].map(ordinal=>f.answer({id:`a${ordinal}`,ordinal}));
  const p=project(f.withEvents(f.roundStarted,...events));
  assert.equal(p.profiles.p1.words.w1.streak,3);
  assert.equal(p.profiles.p1.words.w1.dueDay,'2026-09-18');
  assert.equal(p.profiles.p1.points,30);
  assert.equal(addDays('2026-03-28',1),'2026-03-29');
});
```

Ergänzen: dritte Antwort in neuer Runde, 1/3/7/14/14-Abstände, Fehler nullt Serie, Antworten anderen Profils bauen Fehlerabstand nicht ab, zwei andere Antworten dürfen dasselbe andere Wort betreffen, Änderung Lernfassung setzt nur Serie zurück, Revert bildet neue Lernfassung, reine Schreibänderung erhält sie. Belohnungen bei 199/200/999/1000/1999/2000/2999/3000 Punkten, alle sechs Zubehörgrenzen, sechs Badge-Ansprüche, Fehler/Archivierung nehmen Erfolge nicht zurück, Restore darf älteren Stand wählen. Doppelte/umgekehrt eintreffende Ereignisse führen zu identischem Ergebnis.
- [ ] **2. RED ausführen:** `node --test tests/trainer/learning.test.js tests/trainer/rewards.test.js`.
- [ ] **3. GREEN:** Sortierung `(clock,deviceId,id)`; je Profil eigene Zähler; Tagesaddition über UTC-Datumsbestandteile. Korrekte Ereignisse nach schon erreichter Dreierserie am selben oder noch nicht fälligen Tag geben 10 Punkte, verkürzen/erhöhen aber kein Wiederholungsintervall. Geplante Wiederholung erst `answer.day >= dueDay` und höchstens einmal je Wort/Runde weiterstufen. Kern der Punkte-/Levelrechnung:

```js
const points = uniqueCorrectAnswers.length * 10 + validRoundClaims.length * 20;
const level = 1 + Math.floor(points / 200);
const completedStages = Math.min(15, Math.floor(points / 200));
```

`word.milestone`-Belege sichern früher lokal erreichte Erfolge auch dann, wenn Offlineereignisse später in die Reihenfolge eingefügt werden. Zeitzonendrift nicht zur Löschung gespeicherter Ereignisse verwenden. `rewardState` liefert `unlocked:{head:[],back:[],hand:[]}` mit den erlaubten Ausstattung-IDs und `journey:{completedStages,islands}` mit `islands:[{id:'beach'|'forest'|'mountain',unlocked:boolean}]`; `badges` ist ein Array der verdienten Badge-IDs. Haut-/Kleidungsfarben sind immer verfügbar.
- [ ] **4. GREEN prüfen:** gezielte Tests und `npm test`; reine Funktionen mit eingefrorenen Eingaben auf Mutation prüfen.
- [ ] **5. Review/Commit:** `git diff --check`; `git add src/trainer/learning src/trainer/model/schema.js tests/trainer/fixtures.js tests/trainer/schema.test.js tests/trainer/learning.test.js tests/trainer/rewards.test.js`; `git commit -m "feat: project adaptive progress and island rewards"`.


## Execution contract
Read docs/PRODUKT-DATENFORMAT.md for exact types. Approved product spec is docs/superpowers/specs/2026-09-16-vokabeltrainer-design.md. Do not read whole implementation plan. Work only in this worktree; preserve probe and running port4173 server. No subagents. TDD and self-review, explicit task files only in commit. Never force-add ignored scratch. Escalated git commit is authorized. Report full changes, actual RED/GREEN commands and outputs, commit, concerns and interface deviations in task-3-report.md in this directory. Return only status, commit, test summary and concerns.

## Integration context from existing tests
Existing schema.test.js event-size regression currently uses round.started.candidates; rewrite it to exceed size with an otherwise valid allowed event payload (e.g. large adoption ID arrays), so rejection is truly the size rule rather than an unknown-field false green. Existing deep-copy check also accesses candidates; move that assertion to another genuine nested field. Task2 consumers have no candidates references (focused rg checked). Keep these meaningful tests, do not simply delete them.

## Valid-ID map integration
Task2 review found accepted string IDs such as __proto__ / constructor must remain ordinary own enumerable data entries. Use safe maps or null-prototype dictionaries/own-property access for ID-keyed derived/local state; do not silently lose or inherit entries. Existing entity projection fix establishes this boundary; preserve it in consumers and add targeted tests where relevant.

## Confirmed prior interfaces / integration obligations
Task2 createdOrder is [clock,deviceId,id] (numeric clock then ASCII). projectEntities(effectiveEvents,{supportEvents}) must receive BOTH sets from resolveEpochs; support is ancestry/reference data, never active points/content. A missing required snapshot gives activeEpochId:null and epochConflict:false in resolver; distinguish incomplete integrity from competing heads (normal assertLedger rejects incomplete).
Task2 review could not yet prove support adds no points: this task must prove it. Full suite before Task3 is108 tests; previous workers' actual evidence is in task-1/2 reports. Define precise rewardState.unlocked/journey and profile.avatar output shape in your report/JSDoc for later consumers. No DOM in these pure modules.
Retain valid historical answers while selecting current learningId state; all-version attempts/points survive edits. Identical logical round-slot repeats must not create duplicate scoring even if IDs differ (format contract). No future consumer implementation beyond the explicitly assigned schema integration.
## Task3 review integration contract
The word projection includes current-learning retryPending: initially false, wrong true, next correct false; historical-version wrong totals cannot set it. Task4 uses this flag with errorGap for retry priority.
Task3 additionally exports pendingMilestones(ledger):payload[]. It folds the complete effective sorted and round-slot-deduplicated answer history using the SAME private learning fold as project, retaining first mastered evidence per learning version and first recovered evidence after wrong per word. Return at most one absent effective claim per profile/word/type; existing durable claims remain authoritative; support/late neither produce nor suppress claims. No complete single active epoch => []. Intermediate milestones survive later errors in the same batch. No repeated whole-project-per-prefix O(n squared) algorithm.
Task5 calls pendingMilestones after local and external ledger changes, assigns IDs/advanced clocks, saves claims with all changes in the same transaction before publishing state. This is the merge producer path; milestonesAfterAnswer can remain compatible. Regression obligations: A2correct/B1correct, 3correct then wrong in same batch, late earlier insertion, durable claim despite inserted wrong, idempotent reconciliation, support-only no claims. Task3 pure tests and Task5 transactional integration tests both required.
