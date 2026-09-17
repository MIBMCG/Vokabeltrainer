# Google-Drive-Probe Implementation Plan

Änderung der Prüfungsreihenfolge am 17.09.2026: Der Nutzer beauftragt ausdrücklich, zuerst die vollständige App gemäß bestätigtem Gesamtentwurf umzusetzen und erst danach beim Freund auf iPhone/iPad zu testen. Die bisherige Geräteprüfung vor umfangreicher Lernoberfläche ist damit als Entwicklungssperre aufgehoben. Reale Geräteabnahme bleibt offen und darf nicht als bestanden gelten. Bereits bestätigte manuelle Google-/Drive-Tests in zwei Browsern gelten weiter. Keine neue pauschale Startfreigabe verlangen; Hosting/Veröffentlichung und Kostenmodell werden dadurch nicht automatisch geändert.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eine ausführbare, klar als technische Probe bezeichnete Web-App für die frühe Google-/iOS-Prüfung erstellen, mit synthetischen Antworten, haltbarem lokalen Speicher und wiederholbaren Übertragungen.

**Architecture:** Kleine native JavaScript-Module trennen HTTP/OAuth, unveränderliche Probeereignisse, IndexedDB und Oberfläche. Eine eigene Probe-Kennung verhindert Verwechslung mit späteren Lerndaten. Die Probe ist ein technisches Prüfmittel, kein fertiger Trainer und noch kein vollständiges Produkt-Syncprotokoll.

**Tech Stack:** HTML/CSS/ES-Module; Node.js >=22.8.0 mit eingebautem Testrunner und HTTP-Server für Entwicklung; keine Laufzeitpakete aus npm. Browserprüfungen mit Playwright, falls lokal verfügbar, sonst vorhandener Browsersteuerung. Google Identity Services wird im Browser nur bei Verbindungswunsch geladen.

**Spec:** [Bestätigter Gesamtentwurf](../specs/2026-09-16-vokabeltrainer-design.md), insbesondere E01/E07/E08/E09/E10 und Abschnitte 7–10.

## Global Constraints

- Kein zusätzliches kostenpflichtiges Cloudabo, kein stillschweigender Anbieterwechsel.
- Google Drive; gemeinsamer, von Eltern eingerichteter Google-Zugang auf beiden Geräten; getrennte Lernprofile in der späteren App.
- Lokales Speichern, ausstehender Upload und bestätigter Cloudabgleich sind unterschiedliche Zustände.
- Keine Google-Tokens, Passwörter oder Client-Secrets in Dateien, Berichten, URLs oder Browser-Dauerspeichern.
- Eine Desktopsimulation oder ein WebKit-Test ersetzt keine Abnahme auf echtem iPhone/iPad.
- Noch keine Bereitstellung einer laufenden App, Kontoeinrichtung oder Nutzung echter Lerndaten durch diesen Plan.
- Der erste Prüfschritt ist eine technische Probe vor umfangreicher Lernoberfläche. Die gesamte Lernlogik/Gamification aus R01–R33 folgt nach der Probe in eigenen Plänen; sie wird hier weder vorweggenommen noch als erledigt markiert.

## Dateiverantwortlichkeiten und Verträge

| Datei | Verantwortung |
| --- | --- |
| `package.json` | Private ES-Modul-Entwicklung, `npm test`, `npm start`; keine veröffentlichbare Bibliothek |
| `src/drive/client.js` | Authentifizierte Drive-REST-Aufrufe, vollständige Suche, idempotente Dateianlage |
| `src/drive/auth.js` | GIS-Tokenlebensdauer und Verbindungsdialog; ausschließlich RAM |
| `src/probe/model.js` | Validierte synthetische Ereignisse, deduplizierte Ansichten und Wiederherstellungsgenerationen |
| `src/probe/store.js` | Probe-IndexedDB, atomar gespeicherte Zustände und geräteübergreifend unabhängige Kennung |
| `src/probe/controller.js` | Lokale Aktionen, Konto-/Datensatzbindung, Abgleich, geprüfte Sicherheitskopie |
| `src/probe/main.js` | Kleine Testoberfläche, Zustände, Benutzeraktionen, Verbindungsaufbau |
| `index.html`, `styles.css`, `manifest.webmanifest`, `sw.js`, `icons/probe.svg` | Erkennbare technische Probe, mobile Darstellung und eigener Offline-Programmpfad |
| `scripts/serve.mjs` | Lokaler Server auf `http://localhost:4173`, ausschließlich freigegebene Webdateien |
| `tests/drive/*.test.js`, `tests/probe/*.test.js` | HTTP-/Modell-/Controller-Verhalten ohne echtes Google-Konto |
| `docs/GOOGLE-DRIVE-PROBE.md` | Start, Registrierung, Zwei-Geräte-Ablauf, Grenzen und synthetische Datennutzung |
| `docs/reports/2026-09-17-google-drive-probe.md` | Tatsächliche Testbelege; Google und echte iOS-Geräte getrennt offen |

## Task 1: Drive- und Anmeldeschicht

**Files:** Create `package.json`, `src/drive/client.js`, `src/drive/auth.js`, `tests/drive/client.test.js`, `tests/drive/auth.test.js`; HTTP-Fixtures bei Bedarf in `tests/helpers/drive-http.js`.

**Interfaces:**

```js
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
export class DriveError extends Error { /* code: auth|permission|missing|retryable|invalid|conflict|network; status */ }
export function createDriveClient({getToken, fetchImpl = fetch}) {
  // Return { accountId(), generateId(), listFiles(query), metadata(id), readJson(id),
  //          createFolder({id,name,appProperties}),
  //          putJson({id,name,parentId,appProperties,value}) }.
  // All methods async; accountId -> permissionId string, generateId -> string,
  // listFiles -> metadata[]; readJson -> parsed JSON; writes -> verified metadata.
}
export function createTokenSession({oauth2,clientId,now = Date.now}) {
  // Return {connect(), getToken(), disconnect()}.
  // connect() returns Promise<void> and calls requestAccessToken synchronously
  // within the caller's button gesture; GIS must already be loaded.
}
```

- [x] Write failing Node tests using `node:test` and `node:assert/strict`. Mock only external HTTP/GIS. Catch pagination loss, wrong account identifiers, duplicate files after ambiguous upload, 401/token expiry and malformed responses. Example minimal regression:

```js
test('retries the same file after an ambiguous server response', async () => {
  const uploaded = {id:'evt-a', correct:true};
  const seen = [];
  const client = createDriveClient({getToken:()=> 'test-token', fetchImpl:async (url, init) => {
    seen.push([String(url), init?.method ?? 'GET']);
    if (String(url).includes('/upload/')) return new Response('', {status:409});
    if (String(url).includes('alt=media')) return Response.json(uploaded);
    return Response.json({id:'file-a',name:'a.json',mimeType:'application/json',parents:['folder-a'],appProperties:{kind:'probe'}});
  }});
  const result = await client.putJson({id:'file-a',name:'a.json',parentId:'folder-a',appProperties:{kind:'probe'},value:uploaded});
  assert.equal(result.id, 'file-a');
  assert.equal(seen.filter(([url])=>url.includes('/upload/')).length, 1);
});
```

- [x] Run `node --test --experimental-test-isolation=none tests/drive/*.test.js`, observe expected missing implementation or assertion failure, record RED evidence.
- [x] Implement the contract. Use fixed Google API origins; encode IDs and search queries through URL/URLSearchParams. `about?fields=user(permissionId)` binds accounts without retrieving email. `files.generateIds` preallocates IDs; list every page and reject malformed/incompleteSearch results. GET metadata fields include ID/name/MIME/parents/appProperties/trashed. Restrict input IDs to nonempty URL-safe tokens. Folder creation uses stable supplied ID and verifies metadata after 409. JSON creation uses multipart/related with stable supplied ID and metadata, then reads metadata and content back on success or 409. Verify logical JSON equality independent of key order and reject same ID/different content or mismatched parent/properties. A lost response does not silently generate a new ID; caller persists and retries. No automatic unlimited retries. HTTP errors return safe codes, never full response bodies/tokens.
- [x] Implement GIS wrapper with only DRIVE_SCOPE and `include_granted_scopes:false`; validate nonempty web client ID; handle access_denied, missing scope/token/expiry, popup_closed/failed_to_open, double connect and disconnect. Token expiry checked on every getToken with a small margin. Ignore late callbacks after disconnect. Never persist tokens. Browser main loads GIS script separately before exposing the ready connect button.
- [x] Run focused tests, then `npm test`. Self-review token storage, response validation and retry semantics. Commit only task files and record results in the task report.

## Task 2: Persistente mobile Probe mit Rücksetztest

**Files:** Create remaining `src/probe/*`, root web assets, server, `tests/probe/model.test.js`, `tests/probe/controller.test.js`, `tests/serve.test.js`. Modify `package.json` scripts only as necessary. Task 1 interfaces are the only Drive dependency.

**Interfaces:**

```js
// JSON-only probe state, version 1; opaque IDs generated using crypto.randomUUID.
// scope={accountId,folderId}; probe files marked appProperties.vtProbe='1'.
// answer={version:1,kind:'answer',id,epoch,correct:true}; no actual words/names.
// reset={version:1,kind:'reset',id,parentEpoch,epoch,baseAnswers:[],previousAnswerIds:[],backupFileId};
// genesis epoch is 'initial'. Concurrent reset children are a visible conflict.
export function projectProbe(events) {
  // validate all events; deduplicate IDs; same ID/different payload throws.
  // Return {epoch,answerCount,points,lateAnswers,conflict}; points=answerCount*10.
  // Reset changes active epoch, old-epoch events outside snapshot are retained.
}
export function openProbeStore() {
  // Promise<{load():Promise<object|null>,save(state):Promise<void>}>;
  // save resolves only after IndexedDB transaction completion.
}
export function createProbeController({store,drive,makeId}) {
  // Return {load(), state(), setClientId(clientId), findFolders(), selectFolder(folder), createFolder(), addAnswer(),
  // sync(), repeatLastUpload(), restoreEmpty()}; async except state().
  // state returns safe clone. Persist pending IDs before each network mutation.
}
```

- [x] Write failing tests for real model/controller with injected memory store and external Drive boundary: duplicates count once; corrupted events rejected atomically; correct scope required before any write; reload preserves queued answer; store failure prevents visible success; upload succeeds remotely but fails locally then retry counts once; reset failure retains old count; late old-epoch answers survive reset; concurrent resets block arbitrary active choice. Example model regression:

```js
const a = {version:1,kind:'answer',id:'a',epoch:'initial',correct:true};
assert.equal(projectProbe([a,a]).points, 10);
assert.throws(()=>projectProbe([a,{...a,correct:false}]));
const r = {version:1,kind:'reset',id:'r',parentEpoch:'initial',epoch:'epoch-r',baseAnswers:[],previousAnswerIds:['a'],backupFileId:'backup-r'};
assert.equal(projectProbe([a,r]).points, 0);
assert.equal(projectProbe([a,r]).lateAnswers.length, 0);
assert.equal(projectProbe([a,r,{...a,id:'late-a'}]).lateAnswers.length, 1);
```

- [x] Run focused tests and record RED. Implement validated reducer and controller. Save JSON-only state including account/folder binding, events, pending uploads, last confirmed upload and client ID; keep auth entirely outside state. Controller serializes actions. Sync checks current account and selected folder metadata before writing; fetch all known probe event files, verify scope/shape, merge in memory before commit, then upload persisted pending packets and persist acknowledgments. No loss on failed commit; retries use the same IDs. Do not auto-switch account/folder when pending work exists. No hidden recovery from corrupted storage by overwriting with empty state.
- [x] Build synthetic-only creation/join flow. Create a visible uniquely identified probe folder only after explicit button press. Persist the pre-generated folder ID before creation so repeated creation after network failure uses that ID. Search existing folders marked `vtProbe=1`, verify selected metadata; do not create another automatically on reload. Offline test answers only after a folder is selected. One immutable file per synthetic event is enough for this bounded probe; product batching is a later implementation task.
- [x] Implement `restoreEmpty()` only as a visibly confirmed synthetic reset experiment: synchronize first, copy current known event set into a local snapshot and immutable Drive backup, read it back and compare before publishing reset event to new epoch. Never delete old files. Failure before reset keeps prior visible count; ambiguous reset publish retried with same ID. Late answers stay listed, no blind addition. Concurrent reset branches show conflict and preserve all events; full adult reconciliation/editor belongs to product implementation. Repeated upload button exercises last confirmed event with identical ID. The probe does not import real backup files or pretend to be R30's finished backup feature.
- [x] Add accessible German page labeled „Verbindungsprobe · noch kein Vokabeltrainer“. Public OAuth client-ID field, prepare/ready connect steps preserving browser gesture, search/create/join, synthetic answer, sync/repeat, preview/confirm empty reset. Show local answer count/points, pending count, old-generation answer count and safe status messages with `aria-live`. Buttons disabled during action. Present clear empty/no OAuth/offline states and a small first-run checklist. Render untrusted names/errors with textContent. Use static CSS with 44px controls and 16px input; no product gamification yet.
- [x] Add manifest with relative URLs and a static SVG icon; SW scope limited to the probe base. Precache own assets including modules, never Google API/GIS responses. No forced skipWaiting during input. Start app offline after first successful load even if GIS fails. Server binds 127.0.0.1:4173, serves only named web assets and src modules with correct MIME, blocks traversal, dotfiles, docs, tests and node_modules. Test allowed GET/HEAD, forbidden paths, malformed URL and missing files. Add npm scripts with portable commands.
- [x] Run all unit/integration tests. Commit only task files, report actual results and known real-Google/iOS gaps.

## Task 3: Browserprüfung und Einrichtung übergeben

**Files:** Create `docs/GOOGLE-DRIVE-PROBE.md`, `docs/PROBE-DATENFORMAT.md`, `docs/reports/2026-09-17-google-drive-probe.md`, `docs/handoffs/2026-09-17-verbindungsprobe.md`; modify README, AGENTS, START-HIER, ARBEITSSTAND, Anforderungen, Architektur, Roadmap and Google-Einrichtung for accepted design and actual state. Die Datumsnamen vom 17.09. ersetzen die im ursprünglichen Plan vorgesehenen neuen 16.09.-Dateien; historische Berichte bleiben unverändert.

- [x] Start `npm start`; verify page on localhost with available browser tooling. Check desktop and narrow viewport, keyboard focus, page errors, no-client-ID state and initial controls. Reopen after local save, exercise actual IndexedDB, verify own SW installation and offline page. Automated browser fixture may supply GIS/Drive network responses to exercise two isolated browser contexts; label this simulation clearly. No fake OAuth results in live mode.
- [x] Document exact Google setup: create/select project, enable Drive API, External test user where required, web application OAuth client, JavaScript origin `http://localhost:4173`, later actual HTTPS origin. Never request a password/client secret. Public client ID entered locally in probe. No new hosting account, billing or deployment performed.
- [x] Provide real-device checklist: two devices with same OAuth app/account, select same probe folder, add sample answers, offline/reload/reconnect, repeat upload without doubled count, preview/reset with backup, old offline device returns. Record actual device/OS/date only once tested. iOS Safari and Home Screen are separate cases. HTTPS hosting and test availability remain prerequisites.
- [x] Run full tests, `git diff --check`, documentation-link check and independent code review. Record RED/GREEN and browser evidence without tokens. Distinguish executable technical probe from unfinished trainer and unperformed Google/device verification.
- [x] Commit docs and verified implementation; push under the user's project handoff instruction only after review. Code und Korrekturen sind bis `92f044e` geprüft und unabhängig freigegeben; Task-3-Dokumentation und Browsertests stehen ab `af56946` bereit. Der Abschlussstand `970a0de` wurde auf den Entwicklungszweig übertragen und per Remote-SHA identisch bestätigt. Main bleibt unverändert; ein Merge ist nicht beauftragt.

## Completion boundary

**Wiederaufnahme am 17.09.2026:** Der Nutzer hat die Pause ausdrücklich beendet und die Weiterarbeit mit passend gewählten Modellen/Denktiefen beauftragt. Die folgenden historischen Pausengrenzen sperren die Fortsetzung von Task 2/3 nicht mehr. Echte Google-/Gerätenachweise bleiben eigenständige offene Prüfschritte.

**Pausencheckpoint vom 16.09.2026:** Auf ausdrücklichen Nutzerwunsch nach dem ersten testbaren Zwischenstand pausiert. Task 1 ist in `7a5a108`/`1745d66` abgeschlossen und nach Korrektur beider Reviewbefunde freigegeben (34 Tests). Task 2 ist noch nicht implementiert; Task 3 enthält bislang nur vorbereitete Einrichtungshinweise, keine Browserprüfung. Aktuelle Übernahme: [Pausenübergabe](../../handoffs/2026-09-16-pause.md). Kein weiteres Entwicklungspaket ohne erneute Fortsetzung beginnen.

Local implementation of the probe can be completed without a Google account. Actual Google authorization and Apple-device evidence cannot. Missing registration/device access leaves the probe's external acceptance open and prevents claiming the early feasibility gate has passed. Independent documentation and local checks proceed while the user's setup answer is pending.

The approved learning UI, adaptive planner, real profile/admin/PIN flows, journey and full production synchronization are tracked in the roadmap for following implementation plans after this evidence gate. Their requirements remain binding.
