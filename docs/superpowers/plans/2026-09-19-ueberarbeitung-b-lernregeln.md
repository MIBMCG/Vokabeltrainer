# Lernregeln und Kompatibilität Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Eltern können die Wiederholung je Kind verändern, ohne historische Antworten, Belohnungen oder Geräteabgleich zu beschädigen.

**Architecture:** Alte v1-Ereignisse bleiben unverändert. Explizite v2-Regel-/Reaktivierungsereignisse und eingefrorene Rundenverträge steuern eine separate Wiederholungsprojektion; die bisherige Belohnungsprojektion bleibt fachlich gleich. Leser, lokaler Speicher, Pakete und Sicherungen werden vor Aktivierung der neuen Regler gemeinsam erweitert.

**Tech Stack:** Bestehende ES-Module, Node-Test, IndexedDB, kanonisches JSON/SHA256, immutable Drive-Pakete, vorhandenes Playwright; keine zusätzliche Laufzeitabhängigkeit.

**Spec:** [Freigegebener Entwurf](../../design/2026-09-19-ueberarbeitung.md); [Gesamtplan](2026-09-19-ueberarbeitung.md).

## Global Constraints

- Je Kind getrennt; keine Einstellung verändert ein anderes Profil.
- `slowAfter`: ganze Zahl 2–10, Standard 3.
- `stopAfter`: null oder ganze Zahl zwischen `slowAfter` und 20; Standard null, beim Einschalten Vorschlag `Math.max(6, slowAfter)`.
- `intervals`: genau vier positive, nicht absteigende ganze Tageswerte bis 365; Standard `[1,3,7,14]`, letzter Abstand wiederholt sich.
- Einstellungen gelten ab der nächsten neuen Runde; angefangene/fortgesetzte Runden behalten ihren Vertrag.
- Fehler führen weiter zu Wiederholung nach zwei anderen Antworten, ohne Punktabzug.
- 10/20 Punkte und Dreier-Meilensteine für Abzeichen werden weder durch Einstellungen noch Wiederaktivierung neu vergeben oder entzogen.
- Kein Löschen von Ereignissen oder stilles Umschreiben ihrer IDs/Hashes. Unbekannte Versionen niemals als erfolgreich synchronisiert anzeigen.
- Alle gemeinsamen Ausführungsregeln gelten; A muss abgeschlossen sein, bevor B3 die neue Elternnavigation erweitert.

## Review Focus

1. Offlinegerät lädt nach Reaktivierung alte Antworten hoch: weiter genau einmal werten, aber nicht die neue Wiederholungsserie zerstören (B1/B2).
2. Alte Pakete/Snapshots liegen schon in Drive, Uploadbestätigung fehlt: Migration darf deren Inhalt oder Hash nicht neu versionieren (B1).
3. Eltern ändern Regeln während einer laufenden Runde: Antwort/Weiter/Erweitern/Fortsetzen verwenden den alten Rundenvertrag (B2).
4. Gleichzeitige Elternänderung oder Reset auf zwei Geräten: beide Ereignisse erhalten, deterministisch dieselbe ganze Regel/eine Generation wählen (B2).
5. Sicherung referenziert Regeln/Reset nur als Unterstützung: historische Runde bleibt lesbar, aktuelle Einstellung wird dadurch nicht ersetzt (B1).

## B1: Versionierter Datenvertrag und atomare Migration

**Files:** Neu `src/trainer/model/versions.js`, `src/trainer/model/policies.js`, `src/trainer/storage/migrate.js`, `tests/trainer/policies.test.js`, `tests/trainer/migration.test.js`, `tests/compat/v1/` (unveränderte benötigte v1-Quellen als Testfixture, importiert durch migration.test.js). Ändern `src/trainer/model/schema.js`, `src/trainer/commands.js`, `src/trainer/sync/packets.js`, `src/trainer/sync/drive.js`, `src/trainer/backup/format.js`, `src/trainer/backup/transport.js`, `src/trainer/backup/restore.js`, `src/trainer/storage/store.js` nur falls erforderlich, passende bestehende Schema-/Paket-/Backup-/Sync-/Storetests und `docs/PRODUKT-DATENFORMAT.md`. Kürzere Modulnamen unten beziehen sich auf diese Liste.

**Interfaces und Vertragsentscheidung:**

```js
// model/versions.js
export const CURRENT_VERSION = {format:'vokabeltrainer-product',formatVersion:2,ruleVersion:2};
export function assertSupportedVersion(value) {
  if (value?.format !== CURRENT_VERSION.format ||
      !((value.formatVersion === 1 && value.ruleVersion === 1) ||
        (value.formatVersion === 2 && value.ruleVersion === 2))) {
    throw new ProductError('version', 'Diese Daten benötigen eine neuere App-Version.');
  }
  return value.formatVersion;
}
// model/policies.js
export const DEFAULT_POLICY = Object.freeze({slowAfter:3,stopAfter:null,intervals:Object.freeze([1,3,7,14])});
// assertPolicy(value) -> validated independent {slowAfter,stopAfter,intervals} copy
```

`ProductError` aus bestehendem `model/errors.js` importieren. Auf unterstützte Versionspaare pro Objekt dispatchen, nicht bloß Versionsprüfung entfernen. Ein v1-Umschlag darf keine v2-Ereignisse verstecken. Neue Ereignisse, neu erzeugte Pakete/Backups/Snapshotmanifeste erhalten v2; vorhandene Descriptoren, Epochen, Pakete, Snapshots, ausstehende Uploads und Jobs behalten ihre gespeicherte Version. Ein neuer v2-Datensatz darf weiterhin unveränderte v1-Historie enthalten. Der neue Leser akzeptiert diese Mischung ausdrücklich.

Neue v2-Payloads:

```js
// learning.rules.changed
{profileId, slowAfter, stopAfter, intervals}
// word.reactivated
{profileId, wordId, revisionId, learningId}
// round.started v2 = alle bisherigen Pflichtfelder plus:
{policyEventId, policy} // null bedeutet exakt DEFAULT_POLICY
// answer.recorded v2 = alle bisherigen Pflichtfelder plus:
{schedulingGenerationId} // null legacy, sonst ID von word.reactivated
```

Profil, Wort, Wortfassung und Lernfassung müssen zu den referenzierten Objekten passen. `policyEventId` muss ein Regelereignis desselben Kindes mit identischem `policy`-Wert referenzieren. Referenzen dürfen effektiv oder unterstützend sein, aber nur effektive Regel-/Resetereignisse werden aktuelle Gewinner. Nicht vorhandene Abhängigkeiten bleiben unvollständig, nicht still Standard.

`migrateProductStateV1(state) -> Promise<v2State>`: unveränderten v1-Gesamtzustand vollständig validieren, v1-Fachsicherung samt Hash als zusätzliche verifizierte lokale Sicherheitskopie in der bestehenden safetyCopies-Liste erzeugen, Kopie des Zustands zu `storageVersion:2` ergänzen. Lokale v1-Runden bekommen Defaultpolicy, `policyEventId:null`, Kandidaten/current erhalten `schedulingGenerationId:null`, soweit current nicht null ist. Zusätzlich `schedulingMode:'legacy'`; neue Runden verwenden ab B2 `'configurable'`. So behalten bereits laufende v1-Runden exakt ihren bisherigen Scheduler einschließlich bereits gespeicherter Pausen. Outbox, Uploadbodys, Jobs, Bindung, Kopien, Gerät und PIN-Verifier erhalten. Den vollständigen Kandidaten validieren und mit der bestehenden atomaren `store.save()`-Operation sichern; bei Fehler bleibt der ursprüngliche Store unverändert. IndexedDB-Name und Writer-Lock-Namen bleiben gleich. Kein automatisches Leeren bei Versionfehler.

B1 bleibt allein lauffähig: neue v2-round.started-Ereignisse erhalten zunächst Defaultpolicy/null, neue v2-Antworten schedulingGenerationId=null. Lokale Runden arbeiten bis B2 weiterhin im Legacy-Modus. Eine v2-Antwort darf ausdrücklich eine vorhandene v1-Runde referenzieren; dazu ist keine Änderung des alten Startevents nötig. Die neue lokale safetyCopy verwendet die bestehende Form `{id,createdAt,purpose,backup,hash,driveManifestFileId,verified}` mit purpose='format-migration', driveManifestFileId=null und verified=true; diese neue purpose-Ausprägung validieren und in der bestehenden Sicherungsansicht lesbar benennen.

- [x] **1. RED-Regelvalidierung und unveränderte v1-Hashwerte prüfen.** Neue `policies.test.js` enthält echte Randfälle:

```js
assert.deepEqual(assertPolicy({slowAfter:2,stopAfter:2,intervals:[1,1,3,365]}),
  {slowAfter:2,stopAfter:2,intervals:[1,1,3,365]});
for (const value of [
  {slowAfter:1,stopAfter:null,intervals:[1,3,7,14]},
  {slowAfter:5,stopAfter:4,intervals:[1,3,7,14]},
  {slowAfter:3,stopAfter:null,intervals:[1,7,3,14]},
  {slowAfter:3,stopAfter:null,intervals:[1,3,7,366]},
]) assert.throws(() => assertPolicy(value), error => error.code === 'invalid');
```

Bestehende v1-Paketfixtures in `packets.test.js` zusätzlich vor/nach `validatePacket` kanonisch vergleichen. `validatePacket` rekonstruiert heute über eine globale VERSION; das darf die Version alter Pakete nicht ändern. Entsprechenden v1-Snapshotrekonstruktionsfall für `readSnapshot` aufnehmen.
- [x] **2. RED ausführen:** `node --test tests/trainer/policies.test.js tests/trainer/packets.test.js tests/trainer/backup.test.js tests/trainer/migration.test.js`. Fehlende neue Datei vor Lauf anlegen; Import-/Fixturefehler von Produkt-RED unterscheiden.
- [x] **3. Leser, Referenzen und Grenzen gemeinsam erweitern.** Regelvalidierung strikt ohne zusätzliche Schlüssel. Validatoren erhalten jeweils das Eingangsversionpaar; Writer erhalten explizit gewählte Version. Der Inhalt eines vorhandenen Objekts wird nicht durch Spread von CURRENT_VERSION umgeschrieben. Referenzabschluss in `backup/format.js::dependencies` um Regel-/Reset-IDs erweitern. `readSnapshot` rekonstruiert die Version des passenden Manifests statt der globalen Schreibversion. Selective Adoption, Previewtexte und Restorejob-Validierung auf neue Ereignisse vorbereiten; noch keine neue UI-Aktion aktivieren.
- [x] **4. Migration/Fehlerpfade prüfen.** Mit bestehendem `memoryStore`/`productState` aus `backup-fixtures.js`: v1-Start, v1-Runde mit offener Frage und mit Feedback, unbeantwortete alte Pakete, laufender Restorejob und Sicherheitskopien migrieren. SHA256 bestehender Payloads vorher/nachher vergleichen; zweiter Start migriert nicht noch einmal. Absichtlich fehlgeschlagenes `store.save()` erhält v1 und offene Daten. Unbekannte storageVersion erzeugt sichtbaren Fehler statt Neuinitialisierung.
- [x] **5. Tatsächliches Altclientverhalten einfrieren und prüfen.** Die transitive lokale Importmenge der v1-Commands, Packets und Syncmodule aus Produktcommit `cc079cb` unter `tests/compat/v1/` erhalten, einschließlich benötigter `src/drive`-Module; Herkunft und SHA256-Liste ergänzen. Zur Testlaufzeit kein Git/Netz erforderlich. V1-Reader lehnt ein v2-Paket mit `version` ab; vollständiger v1-Sync bekommt es über den bisherigen Drive-Dateityp `packet` und darf nicht `synced` enden. V1 darf noch alte Antworten hochladen: dieser existierende Altclient schreibt vor seiner Quarantäneprüfung. Neuer Reader muss diese Antworten später übernehmen, keine falsche Fernsperre versprechen.
- [x] **6. Neuer Sync blockiert unbekannte Version vor Schreibvorgängen.** Download/Versionsprüfung vor `publishLocalEpochs`, `preparePackets` und Uploads des regulären Syncdurchlaufs ziehen. Bekannte v1/v2-Dateien sind erlaubt; unbekannte Versionspaare bleiben lokal nachvollziehbar und zeigen Updatebedarf. Behutsam Reihenfolge testen, damit bekannter wiederholbarer Setup-/Restoretransport erhalten bleibt. Versionsfehler nicht zu bloßem Netzwerkfehler oder leerem Bestand umdeuten.
- [x] **7. GREEN und Commit.** `npm test` einschließlich v1/2-Referenzen, Mixed-Backup-Roundtrip, Cloud-Snapshotrekonstruktion, fehlender Abhängigkeit, verspäteter Adoption und verlorener Uploadbestätigung. Produktcache/Servermodule ergänzen. Datenvertrag und Grenzen aktualisieren; Commit `feat: introduce compatible v2 learning contracts and migration`. Noch keine abgeänderte Punkteberechnung.

## B2: Konfigurierbare Wiederholungsprojektion und unveränderliche Rundenregeln

**Files:** Neu `src/trainer/learning/facts.js`, `src/trainer/learning/schedule.js`, `tests/trainer/schedule.test.js`. Ändern `src/trainer/learning/progress.js` nur zur gemeinsamen Faktorausleitung ohne geänderte Rewardsemantik, `src/trainer/learning/rounds.js`, `src/trainer/model/policies.js`, `src/trainer/commands.js`, bestehende Learning-/Round-/Commands-/Backup-/Synctests.

**Interfaces:**

- `effectiveAnswers(ledger) -> Event[]` in facts: `resolveEpochs(ledger).effectiveEvents`, bestehende `(clock,deviceId,id)`-Ordnung und exakt bestehende Deduplizierung nach `(roundId,ordinal)`. `uniqueAnswers(events)` wird aus bisheriger progress.js dorthin ausgelagert und exportiert; reward fold konsumiert dieselbe Funktion.
- `currentPolicy(ledger,profileId) -> {eventId,policy}` in policies: größtes effektives Regelereignis gemäß bestehender Ordnung, ansonsten Default. Konkurrierende Änderungen werden als ganze Objekte gewählt, keine feldweise Mischung; beide bleiben erhalten.
- `currentGenerations(ledger,profileId) -> Array<{wordId,learningId,generationId}>` in `src/trainer/model/policies.js`: größtes effektives Resetereignis je Lernfassung, sonst null. Keine normalen JS-Objektzugriffe mit ungeprüften IDs.
- `projectSchedule({ledger,profileId,policy,day,generations=null}) -> {words:Map,epochConflict}` in schedule. Map-Key `(wordId,learningId)` als verschachtelte Maps; ein WordSchedule enthält `streak`, `intervalIndex`, `dueDay`, `errorGap`, `retryPending`, `excluded`, `generationId`. Wenn generations angegeben, verwenden; sonst aktuelle Gewinner. Immer dieselben deduplizierten Antworten wie Punkte/Statistik.
- Commands: `setLearningRules({profileId,expectedPolicyEventId,policy})`, `reactivateWord({profileId,wordId,learningId,expectedGenerationId})`, `learningRulePreview({profileId,policy}) -> {excludedCount,dueCount,policyEventId}`. Schreiboperationen prüfen erwartete IDs innerhalb der vorhandenen Serialisierung; ein stale form erzeugt `conflict` und behält den Entwurf.

**Zeitliche Semantik:** Für neue Runden mit konfigurabler Planung werden Serie/Fälligkeit aus wirksamer Antwortgeschichte, eingefrorener Policy und eingefrorener Generation neu berechnet. Deshalb kann eine Intervalländerung die Fälligkeit in neuen Runden verändern. Bestehende v1-Runden behalten den Legacy-Scheduler, neue konfigurierte Runden behalten ihren eigenen Policy-Snapshot über Neustart/Erweiterung. Keine spätere Policy gewinnt innerhalb einer laufenden Runde.

Eine korrekte Antwort erhöht die ungedeckelte Scheduling-Serie. Bei `slowAfter` erhält sie den ersten Tagesabstand und pausiert bis Rundenende. Weitere fällige richtige Wiederholungen erhöhen den Intervallindex höchstens einmal je Runde, letzter Index wiederholt sich. Bei `stopAfter !== null && streak >= stopAfter` fällt das Wort aus weiterer automatischer Auswahl. Fehler setzen Scheduling-Serie/Intervalle zurück und verwenden die bestehende Fehlerlücke. Rewardserie/Meilensteine bleiben unverändert auf ihrem bisherigen Dreiervertrag.

Reset: neue Generation beginnt mit Serie 0, ohne Intervall, sofort fällig. Neue Runden wählen sie; bestehende Runden behalten ihre Kandidatengenerationen. Erweiterung um vorher noch nicht enthaltene Kandidaten verwendet deren aktuelle Generation, aber dieselbe eingefrorene Rundenpolicy. Ein v2-Answer referenziert seine Kandidatengeneration; v1-Answer bedeutet null. Alte/unterlegene Generationen zählen weiter für Versuche, Punkte und Statistik, nicht für die neue Scheduling-Serie. „Neue Vokabeln“ bleibt an jemals geübt gebunden.

- [x] **1. RED mit wirksamen Ereignissen schreiben.** Ein gültiges Fixture enthält zwei korrekt beantwortete Slots unter slowAfter=2; dafür keine Antwortbewertung nach neuer Policy erfinden:

```js
const f = createFixture();
const ledger = f.withEvents(f.roundStarted,
  f.answer({id:'a1',ordinal:1}), f.answer({id:'a2',ordinal:2}));
const schedule = projectSchedule({ledger,profileId:'p1',day:'2026-09-17',
  policy:{slowAfter:2,stopAfter:2,intervals:[1,3,7,14]}});
assert.equal(schedule.words.get('w1').get('learn-w1').streak, 2);
assert.equal(schedule.words.get('w1').get('learn-w1').excluded, true);
assert.equal(project(ledger).profiles.p1.points, 20);
```

Weitere feste Fälle: Schwelle 5 bei vier Richtigen noch nicht verlangsamt, Fehler setzt Serie zurück, 10/20 Grenzwerte, vier gleiche Abstände erlaubt, Intervall nur einmal/Runde, keine rückwirkenden Abzeichen. `node --test tests/trainer/schedule.test.js` als RED ausführen.
- [x] **2. Fakten und Scheduler implementieren.** Bisherige Deduplikation fachlich unverändert auslagern. Neue Zustände per Generation falten. Kern des Stopkriteriums:

```js
state.streak = correct ? state.streak + 1 : 0;
state.excluded = policy.stopAfter !== null && state.streak >= policy.stopAfter;
```

Die Intervall-/Fehlerlogik ergänzt diesen Kern gemäß oben festgelegter Semantik; sie wird nicht in UI oder Statistik nochmals implementiert. Schedule-Neuberechnung verändert keine Ereignisse. Ein Reset mit unterstützendem, aber nicht effektivem Status ist lediglich referenzierbar, kein neuer aktueller Reset.
- [x] **3. Runden/Commands anbinden.** Neue starts speichern `policyEventId`/`policy` im Ereignis und lokalen Vertrag, Kandidaten/current deren Generation. Die bestehenden Objektparameter von `startRound`, `nextTask`, `applyAnswer`, `advanceRound`, `expandRound` bekommen zusätzlich `schedule=null`; Rückgabetypen bleiben bestehen. Commands erzeugt die Projektion aus round.policy und den Kandidatengenerationen, bei neuem Start aus aktueller Policy/Generation. Kandidatenprüfung liest Schedulingfelder daraus; everPracticed/lastPracticedAt und Ranking stammen weiter aus der bisherigen Faktenprojektion. Legacy-Runden reichen schedule=null weiter. `practiceChoices` ruft `previewModes({projection,profileId,day,schedule})` aus A2 mit aktueller Policy und derselben Verfügbarkeitsentscheidung wie ein neuer Start auf. In Commands zur Vorschau nie Events oder Geräteuhren außerhalb der injizierten Uhr verändern.
- [x] **4. Mutationen prüfen und veröffentlichen.** Ganze Policies gemäß B1 validieren, aktives Profil/kein Epochenkonflikt prüfen, erwartete aktuelle Policy-ID vergleichen; dann genau ein `learning.rules.changed` in derselben atomaren Mutation. `reactivateWord` prüft aktuellen Lernbezug und Generation, erzeugt genau ein Resetereignis. Kein Löschen alter Antworten, keine neue Wortrevision als Abkürzung. Bestehende PIN-Grenze bleibt beim Adult-Aufrufer.
- [x] **5. Integrationstests GREEN.** Alte und neue Runde laufen parallel; Änderung der Policy beeinflusst nur neue Runde. Erhöhen/Senken mit vorhandener Serie, Wechsel ohne Ausschluss, Reaktivierung→verspätete alte Antwort, zwei konkurrierende Regeln/Resets in umgekehrter Ankunftsreihenfolge, neue Wort-Lernfassung, Selective Adoption/Snapshot-Support und alte Offlineantworten prüfen. `project().points`, Meilensteine und ausgeschüttete Boni vor/nach reiner Regeländerung exakt vergleichen. Leerraumantwort/Doppelsubmit und ausgeschöpfte Runde bleiben bestehend geprüft.
- [x] **6. Commit:** `npm test` und betreffende Browserintegration mit eingefrorenen Runden; Server/Workerlisten ergänzen; Commit `feat: add per-child scheduling without changing earned rewards`.

## B3: Eltern können Regeln verstehen, speichern und zurücknehmen

**Files:** Neu `src/trainer/ui/learning-rules.js`, Änderung `ui/adult.js`, `ui/vocabulary.js`, `trainer/styles.css`, `tests/browser/overhaul.browser.mjs`, `docs/BENUTZUNG.md`. **Interfaces:** `renderLearningRules({root,state,commands,profileId,onRefresh})`; nutzt B2-Commands, keine eigene Schwellen-/Fälligkeitsberechnung.

- [x] **1. Browser-RED:** „Für Erwachsene“→„Lernregeln“→Kind wählen; bisherige Standards lesen; slowAfter5/stopAfter6 und Abstände ändern; nächste Runde sieht neue Regel. Eine zweite Kinderauswahl zeigt weiterhin Standard. Der bisherige Nur-Lese-Bereich A4 darf diesen Test nicht erfüllen.
- [x] **2. Form implementieren.** Direkt sichtbares Kind, Zahlenwahl 2–10, Toggle „Gelernte Wörter weiter auffrischen“, optionaler Stopwert bis20, Details mit vier Tageswerten. Erklärung als vollständiger Satz plus Auswirkungsvorschau. Kern:

```js
const policy = {slowAfter:Number(slow.value), stopAfter:refresh.checked ? null : Number(stop.value),
  intervals:intervalInputs.map(input => Number(input.value))};
const preview = commands.learningRulePreview({profileId,policy});
notice.textContent = `${preview.excludedCount} Wörter werden in neuen Runden nicht mehr automatisch abgefragt.`;
await commands.setLearningRules({profileId,expectedPolicyEventId:openedPolicyEventId,policy});
```

Dies gehört in validierte Vorschau-/Submitpfade, nicht einen Inputhandler, der sofort speichert. Werte im Formular bei Validierungsfehler erhalten; nicht eigenmächtig umsortieren oder runden. Standardbutton zeigt Werte zuerst im Formular und speichert erst nach bewusstem Submit.
- [x] **3. „Wieder üben“ integrieren.** Ausgenommene Wörter in Vokabel-/Lernstandsansicht für genau dieses Kind mit nachvollziehbarem Status zeigen. Aktion ruft `reactivateWord` mit gelesener Lernfassung/Generation auf; Text erklärt „Beginnt die Wiederholung neu; deine bisherigen Punkte und Antworten bleiben.“ Keine automatische Rücksetzung aller Kinder.
- [x] **4. Grenzen prüfen:** PIN sperrt während Submit; Fremdänderung nach Vorschau erhält Entwurf und meldet Konflikt; Profilwechsel keine Fehlzuordnung; negative/leere/nicht ganze/fallende Abstände werden abgewiesen; Browserneustart/Drive/Backup erhält Regeln; aktive Runde bleibt unverändert. Verspätete unbekannte Formate zeigen Updatebedarf, nicht „Abgeglichen“.
- [x] **5. Commit:** betroffene Node-/Browserprüfungen, Cachekennung/Route prüfen, Anleitung aktualisieren, `feat: expose clear learning controls for each child`.

### B1 implementation clarification: conflicting epoch heads

The approved lossless-migration requirement also covers a valid v1 state with multiple current epoch heads. The existing exportBackup requires an explicit selectedEpochId in this case. Generate one v1 format-migration safetyCopy per current head from the same fully validated ORIGINAL v1 state, using the existing selectedEpochId export path. Do not append earlier new migration copies to the source state used for the next export. Validate each resulting v1 backup and hash; keep unique copy IDs. All original ledger objects, epoch heads, snapshots, events, jobs, pending bodies and local state remain unchanged in the migrated candidate, except the explicitly planned local v2 round metadata/storageVersion and appended safety copies. Do not choose, merge, activate or discard an epoch during migration. The existing conflict-resolution UI must remain reachable after reopening the migrated conflicted state. Cover this path with a real two-head fixture, verify both snapshots/copies and unchanged ledger, then exercise explicit existing conflict resolution. A failure creating/validating/saving any copy leaves the old persisted v1 state intact.

Minimal propagation of schedulingGenerationId in existing rounds.js candidate/current return paths is part of B1 (null for legacy); it does not enable B2 scheduling early. Preserve generation values already present in v2 local data rather than resetting them gratuitously.

The early regular-sync write barrier is specifically for unsupported version errors. Ordinary invalid foreign files retain the existing quarantine and good-local-upload behavior, and do not become a new blanket sync policy. Check version pairs even for orphaned snapshot-part files before marking them known; a future-version part cannot bypass the barrier just because its manifest has not arrived.
