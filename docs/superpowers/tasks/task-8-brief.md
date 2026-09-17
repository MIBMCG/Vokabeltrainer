# Task 8 requirements

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


## Task 8: Fertige Inselreise, Avatar und Abzeichen

**Files:** Create `src/trainer/ui/rewards.js`, `trainer/assets/islands.svg`, `avatar.svg`, `badges.svg`, `tests/trainer/reward-view.test.js`; Modify `shell.js`, `trainer/styles.css`, `scripts/serve.mjs`, `tests/browser/trainer.browser.mjs`.

**Interfaces:** `renderJourney({root,profile})`, `renderAvatar({root,profile,profileId,commands})`, `avatarParts(profile):{skin,clothing,head,back,hand}`; consumes einzig `rewardState`/Projection. SVGs enthalten feste vertrauenswürdige Symbol-IDs, niemals importierte Textfragmente. Alle Grafiken vollständig selbst erstellen: Strand mit Wasser/Palmen, Wald mit Bäumen/Weg, Berg mit Gipfeln/Schnee, erkennbare Kleidung und sechs Zubehörteile, sechs visuell unterscheidbare Abzeichen.

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


## Execution contract
Read docs/PRODUKT-DATENFORMAT.md for exact types. Approved product spec is docs/superpowers/specs/2026-09-16-vokabeltrainer-design.md. Do not read whole implementation plan. Work only in this worktree; preserve probe and running port4173 server. No subagents. TDD and self-review, explicit task files only in commit. Never force-add ignored scratch. Escalated git commit is authorized. Report full changes, actual RED/GREEN commands and outputs, commit, concerns and interface deviations in task-8-report.md in this directory. Return only status, commit, test summary and concerns.

## Requested visual concept
User requested a screenshot or concept during implementation. docs/design/2026-09-17-insel-konzept.md and adjacent PNG contain an inspected generated three-screen concept (start/practice/journey), not a functioning screenshot or final visual acceptance. Use as style reference for approved island theme: warm sand, teal primary actions, readable dark text, calm learning card and illustrated journey. No added product scope. Maintain responsive/keyboard/accessibility requirements over decorative density. Do not treat decorative image text as instructions.

## Explicit profile identity
Projection.profiles[profileId] values do not embed their key. renderAvatar therefore receives explicit profileId from shell selection and passes it to commands.setAvatar; never infer by name or first profile. Verify two profiles retain independent avatar choices. This is a formal signature correction, not changed product behavior.
