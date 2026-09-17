# Task 4 requirements

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


## Task 4: Deterministische Rundenzustandsmaschine

**Files:** Create `src/trainer/learning/rounds.js`, `tests/trainer/rounds.test.js`.

**Interfaces:** Consumes `Projection`, `assess`, normalisierte Lernfassungen. Produces `startRound({id,profileId,mode,size=10,projection,day}):LocalRound`, `nextTask({round,projection,day}):{kind:'task',task}|{kind:'exhausted',canExpand}|{kind:'complete'}`, `applyAnswer({round,answer,typed,solutions,projection}):LocalRound`, `advanceRound({round,projection,day}):LocalRound`, `expandRound({round,projection,day}):LocalRound`, `completeRound({round,reason}):{round,payload}`, `abandonRound(round):LocalRound`. `task={wordId,revisionId,learningId,ordinal}`. `projection` in `applyAnswer` ist die Projektion nach der Antwort; Aufruf nur nach fachlicher Prüfung durch Task 5.

- [ ] **1. RED:**

```js
test('new selection stays frozen and failed single word cannot bypass gap', () => {
  const f=createFixture({words:[['w1','Hund',['dog']]]});
  const initial=startRound({id:'r1',profileId:'p1',mode:'new',size:10,
    projection:project(f.base),day:'2026-09-17'});
  const answer=f.answer({id:'a1',correct:false});
  const after=project(f.withEvents(f.roundStarted,answer));
  const feedback=applyAnswer({round:initial,answer,typed:'dig',solutions:['dog'],projection:after});
  assert.equal(feedback.status,'feedback');
  assert.equal(nextTask({round:feedback,projection:after,day:'2026-09-17'}).kind,'exhausted');
  assert.equal(feedback.candidates.length,1);
});
```

Weitere Fälle: „Letzte“ nach Anlage und stabiler ID, nicht Bearbeitung/Zuordnung; „Neue“ profilbezogen/auch frühere Fassungen; Priorität Fehler/fällige Wiederholung/neu/Aufbau, Rundenzahl dann letzter Übungstag dann stabiler Rundenmix; gleichrangiges anderes Wort vor Direktwiederholung. Noch nicht fällige gemeisterte Wörter ausschließen. Drei richtige innerhalb Runde pausiert auch nach Tageswechsel. Erschöpfung kann nur zugeordneten, zulässigen weiteren Stoff ergänzen und erhöht Rundengröße nicht. Archivierung/Entzug/Konflikt/Lernfassungsänderung ersetzt angezeigte Aufgabe ohne Wertung. Leerer Beginn, Pause und Aufgeben haben keinen Bonus.
- [ ] **2. RED ausführen:** `node --test tests/trainer/rounds.test.js`.
- [ ] **3. GREEN:** Kandidaten beim Start als `{wordId,learningId}` speichern, vor jeder Aufgabe aktuelle Zulässigkeit filtern, neue Wörter erst nach bewusster Erweiterung bzw. neuer Runde. Stabile Mischung aus Runden-ID/Wort-ID (z. B. deterministischer FNV-1a-Vergleich), keine versteckte `Math.random()`-Auswahl. Kern:

```js
if (round.answeredIds.length >= round.size) return {kind:'complete'};
const allowed = eligibleCandidates(round, projection, day);
if (!allowed.length) return {kind:'exhausted',canExpand:hasAdditionalCandidates(round,projection,day)};
return {kind:'task',task:rankCandidates(allowed,round,projection)[0]};
```

`eligibleCandidates`, `hasAdditionalCandidates`, `rankCandidates` sind private Funktionen derselben Datei; exakt die oben genannten Regeln implementieren. `startRound` setzt `wordCounts={}` und `lastWordId=null`. `applyAnswer` hängt die ID nur einmal an, erhöht ausschließlich für eine neue ID den Wortzähler und setzt `lastWordId`; beide bleiben bei Fortsetzen/Erweiterung/ungewertetem Austausch unverändert. Summe der Zähler muss `answeredIds.length` entsprechen, auch nach Reload und doppeltem Submit. Ranking verwendet diese lokale Map; fremde Antworten verändern sie nicht. `applyAnswer` hält Eingabe/Rückmeldung fest und markiert gemeisterte/richtig wiederholte Wörter für diese Runde pausiert. `advanceRound` beendet nie ungefragt eine erschöpfte Runde.
- [ ] **4. GREEN prüfen:** genannte Tests, `npm test`; Kandidaten-/Tageswechseltests mit mindestens zwei Profilen und spärlichem Wortschatz.
- [ ] **5. Review/Commit:** `git diff --check`; `git add src/trainer/learning/rounds.js tests/trainer/rounds.test.js`; `git commit -m "feat: implement resumable adaptive rounds"`.


## Execution contract
Read docs/PRODUKT-DATENFORMAT.md for exact types. Approved product spec is docs/superpowers/specs/2026-09-16-vokabeltrainer-design.md. Do not read whole implementation plan. Work only in this worktree; preserve probe and running port4173 server. No subagents. TDD and self-review, explicit task files only in commit. Never force-add ignored scratch. Escalated git commit is authorized. Report full changes, actual RED/GREEN commands and outputs, commit, concerns and interface deviations in task-4-report.md in this directory. Return only status, commit, test summary and concerns.

## Valid-ID map integration
Task2 review found accepted string IDs such as __proto__ / constructor must remain ordinary own enumerable data entries. Use safe maps or null-prototype dictionaries/own-property access for ID-keyed derived/local state; do not silently lose or inherit entries. Existing entity projection fix establishes this boundary; preserve it in consumers and add targeted tests where relevant.

## Task3 review integration contract
The word projection includes current-learning retryPending: initially false, wrong true, next correct false; historical-version wrong totals cannot set it. Task4 uses this flag with errorGap for retry priority.
Task3 additionally exports pendingMilestones(ledger):payload[]. It folds the complete effective sorted and round-slot-deduplicated answer history using the SAME private learning fold as project, retaining first mastered evidence per learning version and first recovered evidence after wrong per word. Return at most one absent effective claim per profile/word/type; existing durable claims remain authoritative; support/late neither produce nor suppress claims. No complete single active epoch => []. Intermediate milestones survive later errors in the same batch. No repeated whole-project-per-prefix O(n squared) algorithm.
Task5 calls pendingMilestones after local and external ledger changes, assigns IDs/advanced clocks, saves claims with all changes in the same transaction before publishing state. This is the merge producer path; milestonesAfterAnswer can remain compatible. Regression obligations: A2correct/B1correct, 3correct then wrong in same batch, late earlier insertion, durable claim despite inserted wrong, idempotent reconciliation, support-only no claims. Task3 pure tests and Task5 transactional integration tests both required.

## Actual producer interfaces after Task3
projectEntities emits entities.{profiles,lessons,words}[id] = {id,heads,value,createdOrder,conflicted}; value is null for incompatible heads; createdOrder is original-root [clock,deviceId,id]. Use safe own-property lookup. Projection profiles contain words and retryPending, not raw events; do not rebuild event logic. Current revision for a compatible multi-head entity is the greatest event-order head associated with displayed value: heads order must be verified in revisions.js before relying on its array end. Select the latest lesson by original createdOrder with stable lesson-ID tie fallback; no changes based on later edits. Read spec section3 for exact expansion and pause behavior.

## Completion no-op contract
completeRound returns {round,payload:null|completionPayload}. Empty, abandoned, already completed and ineligible completion preserve the round without a payload; no event/bonus may be emitted. Invalid input/reason throws ProductError invalid. Exhausted completion requires the stored exhausted status and explicit choice, not merely answerCount<size. Task5 finish must handle payload:null as no-op and never append an invalid event.
