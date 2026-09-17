# Task 11 requirements

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


## Execution contract
Read docs/PRODUKT-DATENFORMAT.md for exact types. Approved product spec is docs/superpowers/specs/2026-09-16-vokabeltrainer-design.md. Do not read whole implementation plan. Work only in this worktree; preserve probe and running port4173 server. No subagents. TDD and self-review, explicit task files only in commit. Never force-add ignored scratch. Escalated git commit is authorized. Report full changes, actual RED/GREEN commands and outputs, commit, concerns and interface deviations in task-11-report.md in this directory. Return only status, commit, test summary and concerns.

## Local compare-and-swap hash contract
Use productStateHash(state):Promise<string> exported from src/trainer/commands.js for commitExternal expectedStateHash. It clones the complete valid ProductState, converts rounds and each nested wordCounts to ASCII-key-sorted entry arrays, then uses the existing canonical SHA-256 digest. Never substitute digest(state): accepted IDs can be __proto__/constructor/prototype in these local maps while exchange canonical objects reject dangerous keys. Hash is key-insertion-order independent and covers all state values. Before setup commands.getState() is null; setup creates the state, then PIN verifier can be saved. Interrupted setup with null verifier must resume PIN setup.

## Carried minor review finding
Task6 review task-6-review.md records a deferred Minor: root #app is already main but renderAdult inserts main#adult-content. When editing adult UI in this task, resolve to section/div with heading association, preserving one main landmark and navigation. Record explicit test/evidence and resolution in report; finalreviewmustsee status rather than silentlydiscarding.
