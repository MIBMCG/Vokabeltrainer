# Vokabeltrainer v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Den vollständig bestätigten Deutsch-Englisch-Trainer einschließlich lokaler Lernlogik, Erwachsenenverwaltung, Inselwelt, Drive-Abgleich, Sicherung und Offlinebetrieb implementieren und automatisiert prüfen; anschließend die reale Geräteabnahme vorbereiten.

**Architecture:** Native ES-Module trennen Fachmodell, lokale Transaktionen, Synchronisation und Darstellung. Die neue App läuft unter `trainer/` mit eigenem Speicher und eigenem Worker; die vorhandene synthetische Probe bleibt unverändert erreichbar und liefert ausschließlich den wiederverwendeten OAuth-/Drive-Adapter. Unveränderliche Ereignisse, Inhaltsfassungen und Wiederherstellungsepochen bilden den gemeinsamen Datenvertrag.

**Tech Stack:** HTML, CSS, JavaScript ES-Module, IndexedDB, Web Locks, WebCrypto, Service Worker; Node.js >=22.8.0 und `node:test`, keine npm-Laufzeitabhängigkeiten. Für Browserprüfungen das bereits dokumentierte optionale Playwright 1.62.1; keine neue Buildkette.

**Spec:** [Bestätigter Gesamtentwurf](../specs/2026-09-16-vokabeltrainer-design.md), [R01–R33](../../ANFORDERUNGEN.md), [Produkt-Datenvertrag](../../PRODUKT-DATENFORMAT.md).

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

---

## Ausführung, Grenzen und Eigentum

Der vorhandene isolierte Worktree wird auf `codex/vokabeltrainer-v1` weiterverwendet. Vor Arbeit `git status --short --branch`, `git log -5 --oneline`, `git remote -v` lesen. Keine Nutzeränderungen zurücksetzen und den bereits laufenden Probe-Server auf Port 4173 nicht beenden. Browsertests starten ihren eigenen Server über `createProbeServer().listen(0, '127.0.0.1')`; so bleiben reale Probe-Browserdaten getrennt.

Dieser Plan umfasst 13 sequenzielle, unabhängig prüfbare Arbeitspakete. Ein Task besitzt nur seine unten aufgeführten Dateien. Schnittstellenänderungen zuerst im Datenvertrag und in den betroffenen Tests nachvollziehen; keine parallelen Writer auf denselben Modulen. Nach jedem Task gezielte Tests, anschließend `npm test`; Reviewhinweise korrigieren. Commit jeweils nur die Taskdateien plus konkret aktualisierte Fortschrittsdokumentation. Die aufgeführten Git-Kommandos sind Ausführungsschritte, keine bereits durchgeführten Commits. Push/Merge/Hosting richten sich nach dem aktuellen Auftrag, nicht nach einem Automatismus dieses Plans.

Relevante Fortschritte hält der ausführende Hauptagent in `ARBEITSSTAND.md` und der aktuellen Übergabe fest. Ein Task ist erst abgeschlossen, wenn seine realen Prüfausgaben gelesen und seine Ergebnisgrenzen benannt sind. Kein Prüfergebnis vorwegnehmen.

### Dateikarte

| Pfad | Verantwortung |
| --- | --- |
| `src/trainer/model/{errors,canonical,schema}.js` | Sichere JSON-/Versions-/Referenzverträge, Hashes und Fehler |
| `src/trainer/model/{revisions,epochs}.js` | Inhalts-DAG und aktive Epochen/Support-/Altbestände |
| `src/trainer/learning/{answers,calendar,progress,rewards}.js` | Reine Bewertung, Tagesrechnung, Projektion, Belohnungen |
| `src/trainer/learning/rounds.js` | Kandidaten, nächste Aufgabe, Rundenzustandsmaschine |
| `src/trainer/storage/store.js`, `src/trainer/commands.js` | Exklusiver Writer, atomare Fachbefehle, dauerhafte Rückmeldung |
| `src/trainer/adult/{pin,import}.js` | Lokale PIN, sichere Tabellen-Vorschau |
| `src/trainer/sync/{packets,drive,scheduler}.js` | Gebundene Drive-Sammlung, unveränderliche Uploads und Retries |
| `src/trainer/backup/{format,restore}.js` | Vollständiger Export, Validierung, gesicherte Epochenwechsel |
| `src/trainer/ui/{dom,shell,adult,practice,rewards,sync,backup}.js` | Darstellen/Aktionen; keine zweite Fachlogik |
| `src/trainer/{main,updates}.js` | Zusammenschaltung, Vordergrund/Online/Updates |
| `trainer/{index.html,styles.css,manifest.webmanifest,sw.js}`, `trainer/assets/*.svg` | Produkt-App und vollständig gezeichnete Insel-/Avatar-Grafiken |
| `tests/trainer/*.test.js`, `tests/trainer/fixtures.js` | Deterministische Node-Tests mit synthetischen Daten |
| `tests/browser/{trainer-harness,trainer.browser}.mjs` | Echte DOM-/IndexedDB-/Worker-Prüfungen, nur Google simuliert |
| `scripts/serve.mjs`, `package.json` | Bisherige Probe erhalten; explizite Produkt-Assets und Tests ergänzen |

### Gemeinsame Schnittstellen

Die Typnamen `Descriptor`, `Event`, `Ledger`, `Snapshot`, `Epoch`, `Projection`, `LocalRound`, `Packet`, `ProductState` sind exakt im [Datenvertrag](../../PRODUKT-DATENFORMAT.md) definiert. Alle Exporte nachfolgend sind ES-Modul-Funktionen; `Promise<T>` bedeutet einen wirklich abgewarteten asynchronen Abschluss. Kein Modul liest versteckt Datum, Zufall, DOM oder Drive, sofern eine entsprechende Abhängigkeit vorgesehen ist.

Testfixture Task 1: `createFixture({timeZone='Europe/Berlin', words=[['w1','Hund',['dog']],['w2','Katze',['cat']],['w3','Haus',['house']]]}={})` liefert `{base, roundStarted, event, answer, withEvents}`. `base` hat Datensatz `d1`, Wurzelepoche `e0`, Gerät `dev1`, Profil `p1` mit Name Ada, zugeordnete Lektion `l1` namens Unit 1 und Wortfassungen `rev-w1` usw. `roundStarted` ist eine gültige `round.started`-Tatsache `start-r1` für `r1`, `p1`, Modus `all`, Größe 10. `event(type,payload,overrides={})` erzeugt vollständige gültige Hüllen mit monotoner Fixture-Uhr. `answer({id,ordinal=1,wordId='w1',correct=true,day='2026-09-17',roundId='r1',...overrides})` referenziert die gültige Basiswortfassung. `withEvents(...events)` liefert eine neue Ledgerkopie aus `base` und genau diesen Ereignissen; keine still hinzugefügten Antworten/Runden. Testdaten bleiben intern im Testordner und werden nie vom Server ausgeliefert.

## Task 1: Format, Integrität und Testbasis

**Files:** Create `src/trainer/model/errors.js`, `src/trainer/model/canonical.js`, `src/trainer/model/schema.js`, `tests/trainer/fixtures.js`, `tests/trainer/schema.test.js`. Modify `package.json` nur für zusätzlichen Testglob `tests/trainer/*.test.js`.

**Interfaces:** Produces `ProductError(code,message)`, `canonical(value):string`, `digest(value):Promise<string>`, `assertDescriptor(value):Descriptor`, `assertEvent(value):Event`, `assertLedger(value):Ledger`, `mergeEvents(existing:Event[], incoming:Event[]):Event[]`, `createFixture(options)` wie oben. Validatoren werfen `ProductError`, mutieren Eingaben nicht und geben strukturierte Kopien zurück. `mergeEvents` benötigt keine vollständigen Referenzen; `assertLedger` prüft sie nach dem Batch.

- [ ] **1. RED:** In `schema.test.js` echte Integritätsfälle formulieren:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeEvents, assertLedger} from '../../src/trainer/model/schema.js';
import {createFixture} from './fixtures.js';
test('ID collision cannot replace a previously saved answer', () => {
  const f = createFixture();
  const a = f.answer({id:'a1'});
  assert.equal(mergeEvents([a], [structuredClone(a)]).length, 1);
  assert.throws(() => mergeEvents([a], [{...a,payload:{...a.payload,correct:false}}]),
    {code:'collision'});
});
test('unknown version and broken word reference reject entire ledger', () => {
  const f = createFixture();
  assert.throws(() => assertLedger({...f.base,descriptor:{...f.base.descriptor,formatVersion:2}}),
    {code:'version'});
  const a = f.answer({id:'a1',revisionId:'missing'});
  assert.throws(() => assertLedger(f.withEvents(f.roundStarted,a)), {code:'reference'});
});
```

Weitere konkrete Fälle: JSON-Objekt mit `__proto__`-Schlüssel, ungültiger UTC-/Kalendertag, unendlicher Zähler, Event >16 KiB, falscher Datensatz, zyklische Vorgänger, gleiche Rundennummer mit widersprechender Antwort, verlorene Abhängigkeit und falscher Snapshot-Hash. Hashprüfung bleibt asynchron in `digest`/späterem Backupvalidieren; synchroner Validator prüft Hashsyntax/Referenzen.
- [ ] **2. RED ausführen:** `node --test tests/trainer/schema.test.js`; fehlendes Modul als initiales Rot lesen, anschließend nach Anlegen des Exportgerüsts mindestens den ID-Kollisionsfall fachlich rot beobachten.
- [ ] **3. GREEN:** Feste Schlüssellisten/Typen je Ereignistyp aus dem Datenvertrag implementieren; keine rekursive `Object.assign`-Übernahme unbekannter Werte. Deduplizierungskern:

```js
const byId = new Map(existing.map(event => [event.id, event]));
for (const event of incoming) {
  const previous = byId.get(event.id);
  if (previous && canonical(previous) !== canonical(event)) {
    throw new ProductError('collision', 'Eine Ereignis-ID enthält unterschiedliche Daten.');
  }
  if (!previous) byId.set(event.id, structuredClone(event));
}
return [...byId.values()];
```

`canonical` sortiert Schlüssel rekursiv, UTF-8 via `TextEncoder`, Hash via `crypto.subtle.digest('SHA-256', bytes)`. Den Testglob zur vorhandenen Testliste ergänzen, keine alten Tests entfernen.
- [ ] **4. GREEN prüfen:** `node --test tests/trainer/schema.test.js`, danach `npm test`. Fixture-Kopien sind voneinander unabhängig; kein globaler ID-Zähler zwischen Tests.
- [ ] **5. Review/Commit:** `git diff --check`; Dateien prüfen; `git add src/trainer/model/errors.js src/trainer/model/canonical.js src/trainer/model/schema.js tests/trainer/fixtures.js tests/trainer/schema.test.js package.json`; `git commit -m "feat: define validated product event format"`.

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

## Task 3: Antwortprüfung, Lernstand und dauerhafte Belohnungen

**Files:** Create `src/trainer/learning/answers.js`, `calendar.js`, `progress.js`, `rewards.js`, `tests/trainer/learning.test.js`, `tests/trainer/rewards.test.js`. Modify `src/trainer/model/schema.js`, `tests/trainer/fixtures.js`, `tests/trainer/schema.test.js` für die folgende vorgezogene Integrationskorrektur.

**Interfaces:** Consumes `normalize`, `resolveEpochs`, `projectEntities`. Produces `assess(typed,wordValue):{empty,correct,solutions}`, `dayInZone(instant,timeZone):string`, `addDays(day,count):string`, `project(ledger):Projection`, `rewardState({points,completedRounds,masteredWordIds,recoveredWordIds}):{level,badges,unlocked,journey}`, `milestonesAfterAnswer(projectionBefore,projectionAfter,answer,events):payload[]`, `pendingMilestones(ledger):payload[]`. Milestonepayloads entsprechen dem Datenvertrag und werden Task 5 in derselben Transaktion angefügt. `project` bleibt rein/synchron, nachdem Ledger/Hashes extern geprüft wurden.

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


### Präzisierungen aus der Aufgabenprüfung

Die Wortprojektion enthält `retryPending` für einen offenen Fehler der aktuellen Lernfassung: anfangs `false`, nach Fehler `true`, nach der nächsten richtigen Antwort `false`. Task 4 verwendet diesen Wert gemeinsam mit `errorGap`; historische Fehlersummen sind dafür ungeeignet.

`pendingMilestones(ledger)` verwendet denselben privaten Lernlauf wie `project` und verarbeitet die gesamte wirksame, sortierte und nach Rundenslot deduplizierte Antwortgeschichte. Bereits wirksame Ansprüche werden nicht erneut erzeugt; Support und Altbestände erzeugen und unterdrücken keine Ansprüche. Ohne eindeutige vollständige aktive Epoche ist das Ergebnis `[]`. Erfolge eines Zwischenstands bleiben erhalten, wenn im selben Paket später ein Fehler folgt. Keine wiederholte Gesamtprojektion für jeden einzelnen Präfix.

Task 5 ruft den Helfer nach lokalen und externen Änderungen auf, ergänzt neue IDs und logische Uhren und speichert die Ansprüche mit dem restlichen Zustand atomar vor dessen Veröffentlichung. Pflichtprüfungen im reinen Modell und später in der Befehlsintegration: zwei richtige Antworten auf A plus eine auf B; drei richtige und anschließender Fehler in einem Paket; spät eingetroffene frühere Antwort; dauerhafter Anspruch trotz eingefügtem Fehler; wiederholter Abgleich ohne neue Ansprüche; rein unterstützende Antworten ohne Anspruch.

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

`eligibleCandidates`, `hasAdditionalCandidates`, `rankCandidates` sind private Funktionen derselben Datei; exakt die oben genannten Regeln implementieren. `startRound` setzt `wordCounts={}` und `lastWordId=null`. `applyAnswer` hängt die ID nur einmal an, erhöht ausschließlich für eine neue ID den Wortzähler und setzt `lastWordId`; beide bleiben bei Fortsetzen/Erweiterung/ungewertetem Austausch unverändert. Summe der Zähler muss `answeredIds.length` entsprechen, auch nach Reload und doppeltem Submit. Ranking verwendet diese lokale Map; fremde Antworten verändern sie nicht. `applyAnswer` hält Eingabe/Rückmeldung fest und markiert gemeisterte/richtig wiederholte Wörter für diese Runde pausiert. `advanceRound` beendet nie ungefragt eine erschöpfte Runde. `completeRound` liefert bei leerer, aufgegebener, bereits abgeschlossener oder nicht zulässig abschließbarer Runde unveränderte Daten und `payload:null`; Task 5 erzeugt dann kein Ereignis. Ungültige Eingaben/Gründe werfen `ProductError` mit `invalid`. Ein erschöpfter Abschluss erfordert den gespeicherten Zustand `exhausted` und bewusste Auswahl, nicht nur eine kleine Antwortzahl.
- [ ] **4. GREEN prüfen:** genannte Tests, `npm test`; Kandidaten-/Tageswechseltests mit mindestens zwei Profilen und spärlichem Wortschatz.
- [ ] **5. Review/Commit:** `git diff --check`; `git add src/trainer/learning/rounds.js tests/trainer/rounds.test.js`; `git commit -m "feat: implement resumable adaptive rounds"`.

## Task 5: Atomare Speicherung und fachliche Befehle

**Files:** Create `src/trainer/storage/store.js`, `src/trainer/commands.js`, `tests/trainer/store.test.js`, `tests/trainer/commands.test.js`.

**Interfaces:** `openProductStore({indexedDBImpl=globalThis.indexedDB,locks=globalThis.navigator?.locks}={}):Promise<{load():Promise<ProductState|null>,save(state):Promise<void>,close():void}>`. Eigene Datenbank/Lock aus Vertrag, `save` bestätigt erst `oncomplete`. `createCommands({store,now,id,deviceId,onChange}):Promise<Commands>`; `now():Date`, `id():string`, `onChange(state)` nach Commit. Zusätzlicher lokaler Export `productStateHash(state):Promise<string>` für CAS nach Datenvertrag; Austausch-`digest(state)` ist hierfür ungeeignet. Commands: `getState()`, `setup({name,timeZone}):Promise<void>`, `revise({entityType,entityId,expectedHeads,value}):Promise<void>`, `start({profileId,mode,size}):Promise<void>`, `submit({roundId,typed}):Promise<{empty,feedback}>`, `next({roundId}):Promise<void>`, `expand({roundId}):Promise<void>`, `finish({roundId,reason}):Promise<void>`, `abandon({roundId}):Promise<void>`, `setAvatar({profileId,skin,clothing,head,back,hand}):Promise<void>`, `setAnimations({profileId,animations}):Promise<void>`, `commitExternal(nextState,expectedStateHash):Promise<void>`. Letzteres serialisiert geprüfte Sync-/Restore-Zustände mit übrigen Mutationen; bei konkurrierender lokaler Änderung `stale`, neu berechnen.

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

## Task 6: Produktstart, Erwachsenenverwaltung, PIN und Tabellenübernahme

**Files:** Create `trainer/index.html`, `trainer/styles.css`, `src/trainer/main.js`, `src/trainer/ui/dom.js`, `shell.js`, `adult.js`, `src/trainer/adult/pin.js`, `import.js`, `tests/trainer/adult.test.js`, `tests/browser/trainer-harness.mjs`, `tests/browser/trainer.browser.mjs`. Modify `scripts/serve.mjs`, `tests/serve.test.js` für explizite neue Assetliste.

**Interfaces:** `createPinGate({loadVerifier,saveVerifier,cryptoImpl=crypto}):{setup(pin,repeat),unlock(pin),change(current,next,repeat),reset(confirmation,next,repeat),lock(),isUnlocked()}`; asynchrone persistierende Methoden, kein synchronisierter PIN-Wert. `saveVerifier(nextVerifier, expectedVerifier)` prüft den zu Operationsbeginn gelesenen vorherigen Prüfeintrag vor dem CAS-Commit. Gate-Operationen werden serialisiert; `lock()` invalidiert auch bereits gestartete bzw. wartende Entsperrvorgänge. Ein späterer asynchroner Abschluss darf nicht wieder entsperren. `parseTable(text):{rows,issues}`, `validateRows(rows,existingWords):{rows,issues}`, `rows` mit `{rowId,german,answers,hint,decision:'include'|'skip'|'separate'}`, Issues `{rowId,code,message}`. `mountShell({root,commands,pinGate}):{render(),destroy(),show(view)}`, Views `profiles/practice/journey/avatar/adult`; `renderAdult({root,state,commands,pinGate,onNavigate})`; `el(tag,{text,attrs}={},children=[])` erzeugt sichere DOM-Knoten. `createTrainerHarness():Promise<{baseUrl,browser,google,newDevice(options),close()}>` startet lokalen Server auf freiem Port; neue Browserkontexte sind synthetisch und erhalten nie ein persönliches User-Data-Verzeichnis.

- [ ] **1. RED:**

```js
test('table import preserves ambiguity until adult decision', () => {
  const parsed=parseTable('Fahrrad\tbicycle | bike\t\n\nBank\tbench\tSitzplatz\textra');
  assert.equal(parsed.rows.length,2);
  assert.deepEqual(parsed.rows[0].answers,['bicycle','bike']);
  assert.ok(parsed.issues.some(issue=>issue.code==='columns'));
});
test('PIN reset requires exact confirmation and equal new entries', async () => {
  let verifier=null;
  const gate=createPinGate({loadVerifier:async()=>verifier,saveVerifier:async v=>{verifier=v;}});
  await gate.setup('1234','1234');
  gate.lock();
  await assert.rejects(gate.reset('zurücksetzen','5678','5678'));
  assert.equal(gate.isUnlocked(),false);
  await gate.reset('PIN zurücksetzen','5678','5678');
  gate.lock();
  await gate.unlock('5678');
  assert.equal(gate.isUnlocked(),true);
});
```

PINs nur synthetische Tests. Browsertest `trainer setup`: offene `/trainer/`, PIN zweimal, Datensatz, Ada, Unit 1, zwei Wörter, Zuordnung; Reload sperrt Erwachsenenbereich. Dublette verlangt Entscheidung, `<img onerror=...>` erscheint als Text; archivieren/reaktivieren erhält Lernhistorie. Import mit unaufgelösten Pflichtfehlern deaktiviert Übernehmen.
- [ ] **2. RED ausführen:** `node --test tests/trainer/adult.test.js`; `node --test --test-name-pattern="trainer setup" tests/browser/trainer.browser.mjs` (nach Einrichtung optionaler Browserwerkzeuge gemäß vorhandener Browser-README, ohne Produktionsabhängigkeit).
- [ ] **3. GREEN:** Setup als normaler Erwachsenenfluss, danach Profilauswahl. Verwaltungspunkte „Kinder“, „Lektionen“, „Lernstand“, „Abgleich“, „Sicherung“; letzte zwei zunächst mit wahrheitsgemäßem lokalen Status, nicht falschen Cloudschaltflächen. Alle Formulare vollständig; Wortänderung zeigt Serienneustart-Vorschau, Zuordnungsänderung keinen Datenverlust. Lernstand je Wort: Versuche/richtig/falsch/Serie/letzte Übung/Fälligkeit. PIN gerätelokal als Salt+WebCrypto-PBKDF2-Prüfwert; kein Sicherheitsgrenzenversprechen. Bei `visibilitychange` hidden, Rückkehr zum Üben und Reload sperren. Sicheres DOM-Beispiel:

```js
const label = document.createElement('label');
label.textContent = 'Deutsches Wort';
const input = document.createElement('input');
input.required = true;
input.maxLength = 200;
label.append(input);
```

TSV-Zeilen mit LF/CRLF, Tabspalten, `|`-Varianten; Anführungszeichen/mehrzeilige Zellen nicht erraten, unklare Zeilen zur Korrektur markieren. Keine HTML-Interpretation. Explizite Server-Whitelist erweitern, nicht Projektwurzel beliebig ausliefern; Tests und `.git` bleiben 404. Sand/Türkis/Grün, 44px Ziele, 16px Eingabe, Fokus sichtbar, Skip-Link und semantische Navigation von Beginn an.
- [ ] **4. GREEN prüfen:** gezielte Node-/Browsertests, `npm test`; Probe `/` und `/src/probe/*` erreichbar, `/trainer/` korrekt, Pfade mit `../`/kodiertem Traversal abgewiesen.
- [ ] **5. Review/Commit:** `git diff --check`; genau die Taskdateien stagen; `git commit -m "feat: add trainer setup and adult content management"`.

## Task 7: Vollständiger Übungsablauf und Wiederaufnahme

**Files:** Create `src/trainer/ui/practice.js`; Modify `src/trainer/ui/shell.js`, `main.js`, `trainer/styles.css`, `scripts/serve.mjs`, `tests/browser/trainer.browser.mjs`; Create `tests/trainer/practice.test.js` für kleine UI-Zustandshelfer.

**Interfaces:** `renderPractice({root,state,commands,profileId,onNavigate})`; consumes Commands/LocalRound/Projection. Produces `keyAction({key,repeat,isComposing,phase}):'submit'|'next'|null`, der ausschließlich absichtliche Enter-Aktionen auf den fachlichen Befehl abbildet. `phase` entspricht `LocalRound.status`; Events mit `repeat`/IME-Komposition ignorieren. Render-/Focuswechsel erst nach erfolgreicher Mutation.

- [ ] **1. RED:** Browsertest `trainer practice` über Task-6-Setup; leere Eingabe zählt nicht, falsche Eingabe zeigt „Noch nicht ganz“ und beide erlaubten Lösungen, Wort und Eingabe bleiben bis Weiter. `keydown.repeat` und Doppelklick erzeugen genau eine Antwort. Reload im Feedback zeigt dasselbe Ergebnis. Profilwechsel/Resume und Neue Runde erhalten Antwortpunkte; erschöpfte Einwortliste zeigt korrekten frühen Abschluss/Bonus.

```js
await page.getByRole('button',{name:'Alle Vokabeln',exact:true}).click();
await page.getByLabel('Englische Übersetzung').fill('wrong');
await page.getByRole('button',{name:'Prüfen',exact:true}).click();
await page.getByText('Noch nicht ganz',{exact:true}).waitFor();
await page.reload();
assert.equal(await page.getByLabel('Englische Übersetzung').inputValue(),'wrong');
await page.getByRole('button',{name:'Weiter',exact:true}).click();
```

Zusätzlich aktuelle Wortfassung während Eingabe von Sync/Erwachsenenänderung ungültig machen: keine Wertung, verständliche Info, nächste zulässige Aufgabe; Speicherfehler lässt Eingabe erhalten.
- [ ] **2. RED ausführen:** `node --test tests/trainer/practice.test.js`; `node --test --test-name-pattern="trainer practice" tests/browser/trainer.browser.mjs`.
- [ ] **3. GREEN:** Drei Moduskarten, Rundengröße 10 vorausgewählt/20/30; Fortsetzen/Neue Runde; große deutsche Karte, Hinweis, ehrlicher Fortschritt und Hauptaktion. Eingabe:

```html
<input id="answer" lang="en" autocomplete="off" autocapitalize="none"
       autocorrect="off" spellcheck="false" aria-describedby="feedback">
<div id="feedback" role="status" aria-live="polite"></div>
```

„Prüfen“ sperrt während Commit, nach Ergebnis disabled input, „Weiter“ bekommt Fokus ohne automatisches Auslösen. Bei Fehler Rückmeldung mit ❌ und Text, richtig ✅ plus Vorlage; mehrere Lösungen nebeneinander/untereinander. Kein Timer, Skip, Tipp oder automatische Bewegung zum nächsten Wort. Zusammenfassung zeigt tatsächliche Antwortzahl/richtig/Fehlerwörter/Antwortpunkte/Bonus separat. Kinder dürfen zusätzliche zulässige Wörter wählen oder erschöpfte Runde beenden; leerer Start erhält keinen Erfolgsscreen.
- [ ] **4. GREEN prüfen:** Node/Browser + `npm test`; Screenshots 390×844 und 1280×900 ansehen, 200% Schrift, 320px Breite, Tastaturfokus/Enter, reduzierte Bewegung. Bildschirmtastaturwirkung als reale iOS-Prüfung offen halten.
- [ ] **5. Review/Commit:** `git diff --check`; nur Taskdateien; `git commit -m "feat: deliver resumable touch-friendly practice flow"`.

## Task 8: Fertige Inselreise, Avatar und Abzeichen

**Files:** Create `src/trainer/ui/rewards.js`, `trainer/assets/islands.svg`, `avatar.svg`, `badges.svg`, `tests/trainer/reward-view.test.js`; Modify `shell.js`, `trainer/styles.css`, `scripts/serve.mjs`, `tests/browser/trainer.browser.mjs`.

**Interfaces:** `renderJourney({root,profile})`, `renderAvatar({root,profile,commands})`, `avatarParts(profile):{skin,clothing,head,back,hand}`; consumes einzig `rewardState`/Projection. SVGs enthalten feste vertrauenswürdige Symbol-IDs, niemals importierte Textfragmente. Alle Grafiken vollständig selbst erstellen: Strand mit Wasser/Palmen, Wald mit Bäumen/Weg, Berg mit Gipfeln/Schnee, erkennbare Kleidung und sechs Zubehörteile, sechs visuell unterscheidbare Abzeichen.

- [ ] **1. RED:** `avatarParts` zeigt keine gesperrte Ausstattung, vier Haut-/sechs Kleidungsoptionen. Browsertest `trainer rewards`: echte synthetische gespeicherte Meilensteine bei 0/200/1000/2000/3000 Punkten; 15 Etappen, Levelgrenzen, Wald/Berg und sechs Freischaltungen; keine zusätzlichen Inselversprechen oberhalb 3000. Gesperrte Buttons geben Freischaltlevel an.

```js
assert.equal(rewardState({points:1000,completedRounds:0,masteredWordIds:[],recoveredWordIds:[]}).level,6);
await page.getByRole('button',{name:'Inselreise',exact:true}).click();
assert.equal(await page.locator('[data-stage]').count(),15);
await page.getByRole('button',{name:'Mein Avatar',exact:true}).click();
assert.equal(await page.getByRole('group',{name:'Hautfarbe'}).getByRole('radio').count(),4);
```

- [ ] **2. RED ausführen:** `node --test tests/trainer/reward-view.test.js`; `node --test --test-name-pattern="trainer rewards" tests/browser/trainer.browser.mjs`.
- [ ] **3. GREEN:** Eigene Vektorillustrationen mit Details/ruhiger Farbpalette statt Textkasten oder generischen Emoji als fertige Reise. Mobile senkrechter Pfad, Desktop Landschaft daneben. Keine Inhalte durch Spielfortschritt sperren. Beispiel für den verantwortlichen Datenfluss:

```js
const state = rewardState({points:profile.points,completedRounds:profile.completedRounds,
  masteredWordIds:Object.entries(profile.words).filter(([,w])=>w.masteredEver).map(([id])=>id),
  recoveredWordIds:Object.entries(profile.words).filter(([,w])=>w.recoveredEver).map(([id])=>id)});
levelOutput.textContent = `Level ${state.level}`;
progressOutput.textContent = `${state.journey.completedStages} von 15 Etappen`;
```

`rewardState` erwartet die in Task 3 angegebene Eingabe; UI bildet Profilfelder darauf ab, keine eigenen Schwellen. Avatar-Auswahl speichert über `commands.setAvatar`, Radios/Tastaturbedienung und Textnamen. Animationen kurz, abschaltbar und `prefers-reduced-motion` respektieren; statischer Zustand vollständig verständlich. SVGs dekorativ `aria-hidden`, wichtige Meilensteine als echten Text ausgeben.
- [ ] **4. GREEN prüfen:** Node/Browser + `npm test`; alle drei Landschaften, sechs Zubehörteile und Badges bei Mobil/Desktop visuell prüfen. Leere Grafik oder unfertige Platzhalter beenden diesen Task nicht.
- [ ] **5. Review/Commit:** `git diff --check`; nur Taskdateien; `git commit -m "feat: complete island journey avatar and milestone art"`.

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

## Task 11: Abgleich-, Konflikt- und Sicherungsoberflächen

**Files:** Create `src/trainer/ui/sync.js`, `backup.js`; Modify `ui/adult.js`, `shell.js`, `main.js`, `trainer/styles.css`, `scripts/serve.mjs`, `tests/browser/trainer.browser.mjs`.

**Interfaces:** `renderSync({root,state,sync,restore,auth,commands})`, `renderBackup({root,state,restore,onDownload})`; `onDownload(blob,filename)` startet Benutzerdownload und meldet ausschließlich „Download gestartet“. Erwachsene entsperrt Voraussetzung aller Datensatz-/Restore-/Konfliktaktionen. Main verbindet vorhandene Tokensitzung: `auth.connect/getToken/invalidate/disconnect`; öffentliche Client-ID lokal über Eingabe/Bestätigung, kein eingebauter echter Wert.

- [ ] **1. RED:** Browsertest `trainer sync and restore`: Zwei Kontexte, gleiches simuliertes Googlekonto, Produktordner bewusst anlegen/finden, Word auf A bearbeiten, B offline anders bearbeiten, Sync ergibt Konflikt und Wort wird nicht neu abgefragt. Erwachsene sehen beide Fassungen, Auswahl erzeugt gemeinsame Revision. Rücksetzung zeigt Unterschiede, zweistufige Vorschau, gesicherte Rücklesung, alte Antwort bleibt separat. Export JSON enthält gültige Vollsicherung, Import zukünftiger Version zeigt Fehler ohne Änderung.

```js
await page.getByRole('button',{name:'Sicherung',exact:true}).click();
const downloading=page.waitForEvent('download');
await page.getByRole('button',{name:'Sicherung herunterladen',exact:true}).click();
const download=await downloading;
assert.match(download.suggestedFilename(),/\.json$/);
await page.getByText('Download gestartet',{exact:true}).waitFor();
```

Zusätzlich 401 -> „Mit Google verbinden“ -> bewusste erneute Anmeldung; offline Üben möglich; falsche Bindung/fehlende Datei/Quarantäne deutsch erklärt. „Abgeglichen“ fehlt bei Pending/Restoresplit. PIN gesperrt nach Google-Popup-Hintergrundwechsel, nach Rückkehr keine Erwachsenenaktion ohne erneutes Entsperren.
- [ ] **2. RED ausführen:** `node --test --test-name-pattern="trainer sync and restore" tests/browser/trainer.browser.mjs`.
- [ ] **3. GREEN:** Alle fünf Statusformulierungen exakt aus Entwurf, zusätzlich konkrete Konfliktmeldungen. Datenstand- und Inhaltskonflikte unterscheiden; Fassungen als getrennte sichere Textansichten, Elternköpfe prüfen. UI nur delegiert:

```js
const result = await restore.prepare(await parseBackup(await file.text()));
showRestorePreview(result.summary, async () => {
  await restore.confirm(result.previewId);
});
```

`showRestorePreview` privater DOM-Dialog mit Fokusfalle, Abbrechen und klarer Bestätigung; `stale` zeigt aktualisierte Unterschiede, nie blind erneut bestätigen. Altänderungen einzeln/gruppiert mit Abhängigkeiten, Vorschau Punkte/Inhalte, nicht gewählte bleiben sichtbar/sicherbar. Sicherheitskopien herunterladen. Kein globaler Resetknopf außerhalb Restore, keine echte PIN exportieren.
- [ ] **4. GREEN prüfen:** Browser + `npm test`; Mobilansichten von Fehler/Import/Revision-/Epochenkonflikt visuell ansehen; keine unscrollbaren Dialoge, Fokus zurück zum Auslöser.
- [ ] **5. Review/Commit:** `git diff --check`; nur Taskdateien; `git commit -m "feat: expose safe sync conflict and restore workflows"`.

## Task 12: Offline-PWA und kontrollierte Updates

**Files:** Create `trainer/manifest.webmanifest`, `trainer/sw.js`, `trainer/assets/app-icon.svg`, `src/trainer/updates.js`, `tests/trainer/sw.test.js`, `updates.test.js`; Modify `trainer/index.html`, `src/trainer/main.js`, `scripts/serve.mjs`, `tests/browser/trainer.browser.mjs`.

**Interfaces:** `createUpdateController({registration,hasActiveRound,pauseAndSave,reload,onAvailable}):{check(),activate({pauseConfirmed=false}={}),destroy()}`; `activate` asynchron, `pauseAndSave` bestätigt dauerhafte Pause vor Workeraktivierung. Worker hört nur `{type:'ACTIVATE_UPDATE'}` vom kontrollierten Appclient. `registration` stammt aus `navigator.serviceWorker.register('./sw.js',{scope:'./'})` unter `/trainer/`.

- [ ] **1. RED:** Worker cachet vollständige bekannte Produkt-App inkl. importierter Drive-Module, keine Googleantworten/JSON-Sicherungen/Token; eigene Appcache-Namen, fremde Probe-/andere Origin-Caches bleiben. Test unter `/repo/trainer/` ebenso wie `/trainer/`. Browsertest `trainer offline`: einmal online laden, Service Worker ready, Browsernetz offline setzen UND eigenen Testserver schließen, neuen kontrollierten Tab öffnen, Profil/gespeicherte Wörter üben, Browserneustart desselben synthetischen Persistenzkontexts separat prüfen. Falls Umgebungsbrowser Offline-Neustart nicht testbar macht, konkreten Restnachweis benennen.

```js
test('active round update requires saved explicit pause', async () => {
  const calls=[];
  const updates=createUpdateController({registration:fakeRegistration(calls),
    hasActiveRound:()=>true,pauseAndSave:async()=>{calls.push('saved');},
    reload:()=>calls.push('reload'),onAvailable:()=>{}});
  await assert.rejects(updates.activate(),{code:'not-ready'});
  await updates.activate({pauseConfirmed:true});
  assert.ok(calls.indexOf('saved')<calls.indexOf('ACTIVATE_UPDATE'));
});
```

- [ ] **2. RED ausführen:** `node --test tests/trainer/sw.test.js tests/trainer/updates.test.js`; `node --test --test-name-pattern="trainer offline" tests/browser/trainer.browser.mjs`.
- [ ] **3. GREEN:** Versionierter eigener Cache, Install atomar `cache.addAll`; Worker übernimmt nicht mitten in Antwort. Offlineprogramme an exakte relative Asset-URLs binden; kein universelles `fetch`-Caching. Aktivierung löscht ausschließlich veraltete Produktcaches desselben Scope. Manifestname/Start/Scope relativ, eigenständiges Icon. Kern des Filtervertrags:

```js
if (request.method !== 'GET') return;
const url = new URL(request.url);
if (url.origin !== self.location.origin || !ASSET_URLS.has(url.href)) return;
event.respondWith(caches.match(request).then(hit => hit || fetch(request)));
```

`ASSET_URLS` aus vollständiger installierter Assetliste des Worker-Scope ableiten, auch `../src/trainer/` und `../src/drive/` nur explizit; auf geschützte Appdateien beschränkt. Bei fehlgeschlagener Installation/Migration alte Appversion und Daten erhalten. Main bei `pagehide` Store/Timer schließen, BFCache-Rückkehr korrekt reinitialisieren.
- [ ] **4. GREEN prüfen:** Node/Browser + `npm test`; Offline-Reload bei laufendem Server genügt ausdrücklich nicht allein. Installierbarkeit/Safari/Home-Screen/Gerätetastatur bleiben spätere reale Abnahmen, keine erfundene Mindestversion.
- [ ] **5. Review/Commit:** `git diff --check`; nur Taskdateien; `git commit -m "feat: support isolated offline startup and safe updates"`.

## Task 13: Vollständige Regression, visuelle Prüfung und portable Übergabe

**Files:** Modify `tests/browser/trainer.browser.mjs`, `tests/browser/README.md`, `README.md`, `START-HIER.md`, `ARBEITSSTAND.md`, `docs/ARCHITEKTUR.md`, `docs/QUALITAET-UND-ABNAHME.md`, `docs/GOOGLE-DRIVE-EINRICHTUNG.md`, diesen Plan. Create `docs/reports/2026-09-17-vokabeltrainer-v1.md`, `docs/handoffs/2026-09-17-vokabeltrainer-v1.md`. Produktkorrekturen nur als separat nachvollziehbare RED/GREEN-Fixschritte mit betroffenen Taskdateien.

**Interfaces:** Keine neue Produktfunktion. Ergebnis ist implementierter und automatisiert geprüfter v1-Stand, dessen echte Geräte-/Google-/Hostinggrenzen kenntlich bleiben. Nutzer muss keine neue pauschale Startentscheidung treffen.

- [ ] **1. Fehlende Regressionen konkret ergänzen:** Gesamtreise Setup -> Lektion -> zwei Kinder -> Üben -> Fehlerabstand -> Fortsetzen -> Archivierung -> Offline -> Sync -> Konfliktlösung -> Backup -> Restore -> späte Übernahme. Stressfälle: Speicherkontingent, Abbruch vor/nach Transaktion, zwei physisch simulierte unabhängige Browserkontexte, doppelte Paket-/Abschluss-ID, Unicode, große Tabellen, gefährlicher HTML-Text, beschädigte/fehlende Dateien, wechselnde Browserzeitzone, Sommerzeit, 200% Schrift und 320px Breite. Beispiel letzte Schutzprüfung:

```js
assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true);
const storageDump=await readSyntheticStorage(page);
assert.equal(storageDump.includes('synthetic-browser-token-'),false);
assert.equal((await exportedBackupText(page)).includes('pinVerifier'),false);
assert.equal(pageErrors.length,0);
```

`readSyntheticStorage` liest ausschließlich den Testkontext; `exportedBackupText` fängt ausschließlich dessen Browserdownload ab. Beide im Testharness implementieren, keine Diagnosedumps persönlicher Browserprofile.
- [ ] **2. Vor Fix RED ausführen:** Falls Lücke/Bug erkannt, betroffenen Einzeltest ausführen und konkrete Abweichung dokumentieren. Für reine Dokumentation keine künstlichen Rot-/Grün-Tests erfinden.
- [ ] **3. Korrigieren und Dokumentieren:** Kleinstmögliche Fachkorrekturen, volle Grafiken und bedienbare Leer-/Fehler-/Ladezustände abschließen. Bericht benennt Datum, Codecommit, Node/Browser/Playwrightversion, Szenarienanzahl, echte/simulierte Grenzen und Screenshots ohne echte Daten. Aktualisierte Startanleitung:

```sh
npm test
npm start
```

Produkt unter `http://localhost:4173/trainer/`, Probe unverändert unter `http://localhost:4173/`. Browserregression mit `node --test tests/browser/trainer.browser.mjs`; eigener Testserver belegt einen freien Port. Vorhandene Probe-Browserregression nach ihrer README zusätzlich ausführen, ohne privaten laufenden Probeversuch umzuschalten. Keine ungesicherte Netzfreigabe als iOS-Hostingersatz.
- [ ] **4. Endnachweise ausführen:** `npm test`; `node --test tests/browser/trainer.browser.mjs`; vorhandene Probe-Browserregression; `git diff --check`; relative Markdownlinks lokal prüfen. Screenshots Desktop/Mobil/Reise/Avatar/Erwachsenen-Konflikt/Restore selbst ansehen. Funktions-/Spezifikationsreview und Codequalitätsreview aller finalen Änderungen nach angeforderter Arbeitsweise; Findings korrigieren und nur betroffene Prüfungen plus notwendige Gesamtprüfung wiederholen. R01–R33/E01–E10 Matrix unten abhaken anhand Belegen, nicht anhand bloßer Dateiexistenz.
- [ ] **5. Übergabe/Commit:** Genannte Dokumente und tatsächliche Fixdateien gezielt stagen; `git commit -m "docs: record verified trainer v1 and device acceptance steps"`. Aktueller Branch/Commit, portable Startschritte, Tests und offene reale iPhone/iPad/Safari/Home-Screen/Zwei-Geräte-Nachweise nennen. Keine öffentliche Bereitstellung behaupten. Bei autorisiertem Push anschließend lokalen Commit und `git ls-remote` vergleichen; sonst lokalen Stand klar benennen.

## Abdeckungs- und Selbstprüfmatrix

| Anforderungen/Entwurf | Tasks und verpflichtender Nachweis |
| --- | --- |
| R01–R05, R21–R22, E03 | 3/6/7/13: tatsächliche Texteingabe, Normalisierung, gesperrte Rückmeldung, bewusster Wechsel, Touch/Fokus |
| R06, R10, R25–R27, E05/E06 | 2/6/11: CRUD durch Fassungen, Vorschau, Dubletten, Archivieren, Zuweisung, PIN, Lernstandsansicht |
| R07–R09, R18–R20, R32, E02 | 3/4/5/7: persistente Abstände/Serie, Modusmengen, Tagesfristen, erschöpfte Runde, lokale Fortsetzung |
| R11, R23–R24, E04 | 3/8: 10/20 Punkte, exakt alle Inseln/Etappen/Zubehör/Badges, fertige Grafiken |
| R12–R15, R28–R29, E07/E10 | 1/2/5/9/11: unveränderliche Pakete, Bindung, Offline, kausale Sortierung, Konflikte, kein Datenverlust |
| R30/R33, E08 | 2/10/11: Vollsicherung, Vorschau, verifizierte Sicherheitskopie, neue Epoche, konkurrierende Restores, alte Ereignisse |
| R02, E01/E09 | 5/6/7/12/13: getrennte Module, PWA, echte Browserregression, spätere physische Geräteabnahme |
| R16/R17/R31 | 13 und globale Grenzen: portable Übergabe, bestätigte Entscheidungen erhalten, keine Lizenz-/Sichtbarkeitsänderung |

Selbstprüfung dieses Plans vor Übergabe: alle R01–R33/E01–E10 oben zugeordnet; Datenvertrag und Tasksignaturen abgeglichen; keine Implementierung oder bestandene Prüfung durch dieses Dokument behauptet. Die drei unabhängigen fachlichen Bereiche Lernkern, Sync/Restore und Oberfläche werden durch Tasks getrennt, bleiben durch einen gemeinsamen Version-1-Vertrag verbunden; zusätzliche separate Produktspezifikationen wären hier widersprüchliche Duplikate des bereits vollständig bestätigten Entwurfs.

Technische Restnachweise sind keine neuen Produktentscheidungen: reale Browser-/OS-Mindestversionen, iOS-Tastatur, Web-Lock-/IndexedDB-/Service-Worker-Verhalten auf den Geräten des Freundes, tatsächlicher OAuth-Komfort, reales Produktprotokoll über zwei Geräte sowie später autorisierte HTTPS-Bereitstellung. Bei einem konkreten technischen Konflikt den betroffenen Teil melden; unabhängige genehmigte Implementierung fortsetzen. Keine ungeprüften Behauptungen über deren Bestehen.
