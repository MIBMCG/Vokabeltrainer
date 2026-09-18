# Task 13 requirements

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


## Execution contract
Read docs/PRODUKT-DATENFORMAT.md for exact types. Approved product spec is docs/superpowers/specs/2026-09-16-vokabeltrainer-design.md. Do not read whole implementation plan. Work only in this worktree; preserve probe and running port4173 server. No subagents. TDD and self-review, explicit task files only in commit. Never force-add ignored scratch. Escalated git commit is authorized. Report full changes, actual RED/GREEN commands and outputs, commit, concerns and interface deviations in task-13-report.md in this directory. Return only status, commit, test summary and concerns.

## Visual deliverable and durable decisions
User explicitly requested screenshot or concept during implementation. A generated preview was delivered and committed at docs/design/2026-09-17-insel-konzept.png with status companion; it is NOT an actual screenshot or visual acceptance. At final state capture and inspect actual synthetic-data practice/journey views; preserve selected representative screenshots in docs/reports/assets (not only ignored test-results) so GitHub handoff can show real implemented UI. Do not copy PIN/auth/realaccount/profile data or test injection fixtures into those final presentation captures. Final report distinguishes concept from actual screenshots and actual browser evidence from deferredphysicaldeviceacceptance. docs/ENTWICKLUNGSENTSCHEIDUNGEN.md records controller Rulings and must remain accurate; no additional generallicense/publication change.

## Carried laptop findings and current dates
Use the actual completion date for report/handoff filenames. The user approved the concept as a style direction on 17 September; it remains a concept, not device evidence.
Resolve the carried Task7 Minor: when roundAvailability/nextTask canExpand is false, exhausted-round text must not promise additional available words.
Resolve the carried Task8 Minor: wait until asynchronous avatar persistence has replaced the old radio DOM node, then assert focus on the new selected radio; do not mistake old-node focus for persistence.
Include all current technical decisions (more than twelve) and preserve their evidence. Task11 owns the already-carried nested-main correction; confirm its resolution in final review.

## Additional Task11 carried Minor observations
From docs/reports/2026-09-18-abgleich-sicherung-oberflaeche-review.md: M1 duplicated five-status formatter/conditions in ui/sync.js and ui/shell.js; consolidate a small shared formatter when completing final polish, preserving exact labels. M2 browser-level invalidation/reconnect coverage after auth errors in unbound discovery, initial create and join is narrower than the Node status tests; add concrete synthetic integration cases for these wrapper paths. Preserve finalTask11fix results; do not reimplement reviewed functions. Finalreview must see explicit disposition of both.
