# Task 12 requirements

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


## Execution contract
Read docs/PRODUKT-DATENFORMAT.md for exact types. Approved product spec is docs/superpowers/specs/2026-09-16-vokabeltrainer-design.md. Do not read whole implementation plan. Work only in this worktree; preserve probe and running port4173 server. No subagents. TDD and self-review, explicit task files only in commit. Never force-add ignored scratch. Escalated git commit is authorized. Report full changes, actual RED/GREEN commands and outputs, commit, concerns and interface deviations in task-12-report.md in this directory. Return only status, commit, test summary and concerns.

## Preflight from Task11 integration
Main owns store, Commands, PIN, auth, sync, scheduler and shell; pagehide closes all and pageshow persisted reloads. Read final Task11 report for exact cleanup contract. Practice currently keeps not-yet-submitted typing in the live input; Commands persists submitted feedback, but has no pause/save-draft command. Before implementing pauseAndSave, propose the smallest explicit integration contract to the controller: a confirmed update must not silently discard typing, race a pending answer commit, or award/abandon a round. Do not invent a new local-state schema implicitly. Shell/practice changes may be necessary; agree this concrete boundary before implementation. Preserve automatic status updates that do not replace the practice DOM.
