# Task 5 requirements

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


## Task 5: Atomare Speicherung und fachliche Befehle

**Files:** Create `src/trainer/storage/store.js`, `src/trainer/commands.js`, `tests/trainer/store.test.js`, `tests/trainer/commands.test.js`.

**Interfaces:** `openProductStore({indexedDBImpl=globalThis.indexedDB,locks=globalThis.navigator?.locks}={}):Promise<{load():Promise<ProductState|null>,save(state):Promise<void>,close():void}>`. Eigene Datenbank/Lock aus Vertrag, `save` bestätigt erst `oncomplete`. `createCommands({store,now,id,deviceId,onChange}):Promise<Commands>`; `now():Date`, `id():string`, `onChange(state)` nach Commit. Commands: `getState()`, `setup({name,timeZone}):Promise<void>`, `revise({entityType,entityId,expectedHeads,value}):Promise<void>`, `start({profileId,mode,size}):Promise<void>`, `submit({roundId,typed}):Promise<{empty,feedback}>`, `next({roundId}):Promise<void>`, `expand({roundId}):Promise<void>`, `finish({roundId,reason}):Promise<void>`, `abandon({roundId}):Promise<void>`, `setAvatar({profileId,skin,clothing,head,back,hand}):Promise<void>`, `setAnimations({profileId,animations}):Promise<void>`, `commitExternal(nextState,expectedStateHash):Promise<void>`. Letzteres serialisiert geprüfte Sync-/Restore-Zustände mit übrigen Mutationen; bei konkurrierender lokaler Änderung `stale`, neu berechnen.

- [ ] **1. RED:** Teststore injiziert Fehler, ohne echte privaten Daten. Mehrfaches Submit und kaputte Transaktion:

```js
test('failed local commit retains draft and awards nothing', async () => {
  const stored=makeMemoryStore(validProductState());
  const commands=await createCommands({store:stored,now:()=>new Date('2026-09-17T10:00:00Z'),
    id:sequenceIds(),deviceId:'dev1',onChange:()=>{}});
  await commands.start({profileId:'p1',mode:'all',size:10});
  stored.failNextSave=true;
  await assert.rejects(commands.submit({roundId:commands.getState().rounds.p1.id,typed:'dog'}),
    {code:'storage'});
  assert.equal(project(commands.getState().ledger).profiles.p1.points,0);
});
```

`makeMemoryStore`, `validProductState`, `sequenceIds` werden testlokal implementiert: strukturierte Kopien, `save` erst bei Erfolg ersetzen, `validProductState` aus Fixture/Vertrag, sequenzielle synthetische IDs. Weitere Fälle: IDB Request erfolgreich aber Transaktion abgebrochen; Neuladen im Feedback; wiederholtes Enter/Submit zählt einmal; Antwort und outbox atomar; Profilwechsel bewahrt Runde; paralleler Tab wird gesperrt; Lock nach `pagehide` freigegeben und bei `pageshow.persisted` kontrolliert neu öffnen.
- [ ] **2. RED ausführen:** `node --test tests/trainer/store.test.js tests/trainer/commands.test.js`.
- [ ] **3. GREEN:** Vorbereitete nächste Fachzustände seriell verarbeiten, Hash/Async-Prüfung vor IDB. Commit-Muster:

```js
const next = structuredClone(state);
// Der jeweilige Befehl fügt in next Ereignis, Rundenzustand und Pending-ID ein.
await store.save(next);
state = next;
onChange(structuredClone(state));
```

Jeder tatsächliche Befehl erhält vollständige Prüfung statt eines universellen ungeprüften State-Setters. `start` speichert das kleine Startereignis ohne Kandidatenliste und die vollständige lokale Auswahl gemeinsam. `submit` prüft die tatsächliche Aufgabe gegen diese aktuelle Auswahl; `expand` erweitert sie ausschließlich bewusst. Regressionen: großer Wortbestand (mindestens 500 Wörter mit produktionsnahen IDs), gültige Antwort nach Erweiterung und abgewiesene unzulässige lokale Antwort. Doppelte Wertung durch gespeicherten `feedback.answerId` verhindern, nicht nur durch deaktivierten Button. Fehler lassen sichtbaren Eingabetext im UI unangetastet. `revise` vergleicht die erwarteten aktuellen Köpfe innerhalb seiner serialisierten Mutation unmittelbar vor dem Commit (Pflichttest: Formular erwartete h1, inzwischen h2 vorhanden -> stale und unveränderter Ledger); Erfolge gemeinsam mit Antwort persistieren. Lokale neue Ereignisse bleiben als unpaketierte Pending-Ereignisse erhalten, bis Task 9 sie bündelt.
- [ ] **4. GREEN prüfen:** gezielte Tests und `npm test`. IDB-Fake nur im Test; keine Abhängigkeit der App darauf. Bereits funktionierende Probe-Speicherdatei nicht umbauen.
- [ ] **5. Review/Commit:** `git diff --check`; `git add src/trainer/storage/store.js src/trainer/commands.js tests/trainer/store.test.js tests/trainer/commands.test.js`; `git commit -m "feat: save trainer commands atomically"`.


## Execution contract
Read docs/PRODUKT-DATENFORMAT.md for exact types. Approved product spec is docs/superpowers/specs/2026-09-16-vokabeltrainer-design.md. Do not read whole implementation plan. Work only in this worktree; preserve probe and running port4173 server. No subagents. TDD and self-review, explicit task files only in commit. Never force-add ignored scratch. Escalated git commit is authorized. Report full changes, actual RED/GREEN commands and outputs, commit, concerns and interface deviations in task-5-report.md in this directory. Return only status, commit, test summary and concerns.

## Valid-ID map integration
Task2 review found accepted string IDs such as __proto__ / constructor must remain ordinary own enumerable data entries. Use safe maps or null-prototype dictionaries/own-property access for ID-keyed derived/local state; do not silently lose or inherit entries. Existing entity projection fix establishes this boundary; preserve it in consumers and add targeted tests where relevant.

## Task3 review integration contract
The word projection includes current-learning retryPending: initially false, wrong true, next correct false; historical-version wrong totals cannot set it. Task4 uses this flag with errorGap for retry priority.
Task3 additionally exports pendingMilestones(ledger):payload[]. It folds the complete effective sorted and round-slot-deduplicated answer history using the SAME private learning fold as project, retaining first mastered evidence per learning version and first recovered evidence after wrong per word. Return at most one absent effective claim per profile/word/type; existing durable claims remain authoritative; support/late neither produce nor suppress claims. No complete single active epoch => []. Intermediate milestones survive later errors in the same batch. No repeated whole-project-per-prefix O(n squared) algorithm.
Task5 calls pendingMilestones after local and external ledger changes, assigns IDs/advanced clocks, saves claims with all changes in the same transaction before publishing state. This is the merge producer path; milestonesAfterAnswer can remain compatible. Regression obligations: A2correct/B1correct, 3correct then wrong in same batch, late earlier insertion, durable claim despite inserted wrong, idempotent reconciliation, support-only no claims. Task3 pure tests and Task5 transactional integration tests both required.

## Storage reference and lifecycle boundary
Existing src/probe/store.js and tests/probe/store.test.js demonstrate Web Locks/IDB completion handling without runtime dependencies; consume as reference only, preserve probe. src/probe/main.js pageshow.persisted reload is the verified probe BFCache recovery; product main Task6 owns product lifecycle wiring. Task5 must provide close/lock-release behavior and test it; do not invent main.js before its assigned task. Task6 browser acceptance must verify actual pagehide/pageshow.persisted recovery using the product store.

## Completion no-op contract
completeRound returns {round,payload:null|completionPayload}. Empty, abandoned, already completed and ineligible completion preserve the round without a payload; no event/bonus may be emitted. Invalid input/reason throws ProductError invalid. Exhausted completion requires the stored exhausted status and explicit choice, not merely answerCount<size. Task5 finish must handle payload:null as no-op and never append an invalid event.

## Actual Task4 completion integration
Last answer remains feedback. On explicit next, advanceRound removes feedback and returns asking/current:null when size reached; nextTask then returns complete; completeRound(full) returns completed and full payload. Task5 must append completion and returned round together. Never call advanceRound and forget the full completion event; do not complete on submit before feedback was acknowledged. State-machine review verified this producer path. Task4 report/review available if exact evidence needed.

## Local compare-and-swap hash contract
Use productStateHash(state):Promise<string> exported from src/trainer/commands.js for commitExternal expectedStateHash. It clones the complete valid ProductState, converts rounds and each nested wordCounts to ASCII-key-sorted entry arrays, then uses the existing canonical SHA-256 digest. Never substitute digest(state): accepted IDs can be __proto__/constructor/prototype in these local maps while exchange canonical objects reject dangerous keys. Hash is key-insertion-order independent and covers all state values. Before setup commands.getState() is null; setup creates the state, then PIN verifier can be saved. Interrupted setup with null verifier must resume PIN setup.
