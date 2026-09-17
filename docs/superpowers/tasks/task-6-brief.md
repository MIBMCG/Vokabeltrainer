# Task 6 requirements

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


## Task 6: Produktstart, Erwachsenenverwaltung, PIN und Tabellenübernahme

**Files:** Create `trainer/index.html`, `trainer/styles.css`, `src/trainer/main.js`, `src/trainer/ui/dom.js`, `shell.js`, `adult.js`, `src/trainer/adult/pin.js`, `import.js`, `tests/trainer/adult.test.js`, `tests/browser/trainer-harness.mjs`, `tests/browser/trainer.browser.mjs`. Modify `scripts/serve.mjs`, `tests/serve.test.js` für explizite neue Assetliste.

**Interfaces:** `createPinGate({loadVerifier,saveVerifier,cryptoImpl=crypto}):{setup(pin,repeat),unlock(pin),change(current,next,repeat),reset(confirmation,next,repeat),lock(),isUnlocked()}`; asynchrone persistierende Methoden, kein synchronisierter PIN-Wert. `parseTable(text):{rows,issues}`, `validateRows(rows,existingWords):{rows,issues}`, `rows` mit `{rowId,german,answers,hint,decision:'include'|'skip'|'separate'}`, Issues `{rowId,code,message}`. `mountShell({root,commands,pinGate}):{render(),destroy(),show(view)}`, Views `profiles/practice/journey/avatar/adult`; `renderAdult({root,state,commands,pinGate,onNavigate})`; `el(tag,{text,attrs}={},children=[])` erzeugt sichere DOM-Knoten. `createTrainerHarness():Promise<{baseUrl,browser,google,newDevice(options),close()}>` startet lokalen Server auf freiem Port; neue Browserkontexte sind synthetisch und erhalten nie ein persönliches User-Data-Verzeichnis.

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


## Execution contract
Read docs/PRODUKT-DATENFORMAT.md for exact types. Approved product spec is docs/superpowers/specs/2026-09-16-vokabeltrainer-design.md. Do not read whole implementation plan. Work only in this worktree; preserve probe and running port4173 server. No subagents. TDD and self-review, explicit task files only in commit. Never force-add ignored scratch. Escalated git commit is authorized. Report full changes, actual RED/GREEN commands and outputs, commit, concerns and interface deviations in task-6-report.md in this directory. Return only status, commit, test summary and concerns.

## Browser integration carried from Task5
Product store close releases its lock. main.js must close on pagehide and reopen safely on pageshow.persisted (a controlled reload is acceptable, as verified for the probe), so Back/Forward Cache restoration does not leave a closed app. Include actual product browser scenario; do not infer from pure store tests. PIN mutations use commands.commitExternal with current hash; do not write through a second writer.

## Requested visual concept
User requested a screenshot or concept during implementation. docs/design/2026-09-17-insel-konzept.md and adjacent PNG contain an inspected generated three-screen concept (start/practice/journey), not a functioning screenshot or final visual acceptance. Use as style reference for approved island theme: warm sand, teal primary actions, readable dark text, calm learning card and illustrated journey. No added product scope. Maintain responsive/keyboard/accessibility requirements over decorative density. Do not treat decorative image text as instructions.

## Local compare-and-swap hash contract
Use productStateHash(state):Promise<string> exported from src/trainer/commands.js for commitExternal expectedStateHash. It clones the complete valid ProductState, converts rounds and each nested wordCounts to ASCII-key-sorted entry arrays, then uses the existing canonical SHA-256 digest. Never substitute digest(state): accepted IDs can be __proto__/constructor/prototype in these local maps while exchange canonical objects reject dangerous keys. Hash is key-insertion-order independent and covers all state values. Before setup commands.getState() is null; setup creates the state, then PIN verifier can be saved. Interrupted setup with null verifier must resume PIN setup.

## PIN expected-verifier persistence contract (review correction)
createPinGate keeps loadVerifier():Promise<Verifier|null> and now calls saveVerifier(nextVerifier, expectedVerifier):Promise<void>. Capture expectedVerifier for the operation before expensive async work. main compares it to the current pinVerifier, rejects stale if changed, then commits via productStateHash/commitExternal so a race during hashing/commit is also rejected. Serialize gate operations and invalidate pending unlock permission when lock() occurs; an operation initiated before a later lock cannot re-unlock, even if its queued work starts later. Setup busy state survives intermediate renders. PIN drafts remain memory/DOM only, never localStorage or docs. A PIN save may finish after explicit background locking but must not unlock afterward.
