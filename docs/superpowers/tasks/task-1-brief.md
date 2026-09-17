# Task 1 requirements

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


## Execution contract
Read docs/PRODUKT-DATENFORMAT.md for exact types. Approved product spec is docs/superpowers/specs/2026-09-16-vokabeltrainer-design.md. Do not read whole implementation plan. Work only in this worktree; preserve probe and running port4173 server. No subagents. TDD and self-review, explicit task files only in commit. Never force-add ignored scratch. Escalated git commit is authorized. Report full changes, actual RED/GREEN commands and outputs, commit, concerns and interface deviations in task-1-report.md in this directory. Return only status, commit, test summary and concerns.
