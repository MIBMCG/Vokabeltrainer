# Shop-Probe v5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Einen isolierten Modus `v2-coherent` implementieren, der alle koordinierten Lese- und Bedingungsschreibwege über Drive v2 führt und einen ignorierten Versionsvorbehalt zuverlässig rot ausweist.

**Architecture:** Ein neuer Transportbaustein kapselt die v2-Metadatenform, stabile Snapshots und v2-PUTs. `createProbeTransport` delegiert nur den neuen Modus dorthin; die drei Legacy-Modi bleiben im bestehenden Modul unverändert. Datei-ID-Reservierung und Anlage bleiben v3-basiert und werden in Diagnose 5 ausdrücklich getrennt ausgewiesen.

**Tech Stack:** JavaScript ES Modules, Node.js >=22.8, `node:test`, Playwright/Edge, Google Identity Services und Drive REST v2/v3.

**Spec:** [Shop-Probe v5 mit kohärentem Drive-v2-Kandidaten](../specs/2026-09-20-shop-probe-v5.md)

## Global Constraints

- Ausschließlich isolierte Probe; keine Änderung unter `src/trainer/` und keine Produktintegration.
- Keine Änderung an Google-Konto, Client-ID, Scope `drive.file`, Anbieter oder Kostenmodell.
- Legacy-Modi `media`, `metadata` und `v2-json` behalten ihre bisherigen HTTP-Wege und Aussagen.
- Alle koordinierten Reads und `If-Match`-Writes des neuen Modus verwenden Drive v2; v3-Anlage wird wahrheitsgemäß berichtet.
- Keine stumme Entschärfung der Snapshot-Stabilität, kein versionsloser Fallback und kein automatischer Moduswechsel.
- Nur synthetische, in derselben Sitzung reservierte Probe-IDs; keine Suche oder Öffnung persönlicher Dateien.
- Berichte enthalten keine Token, IDs, ETags, Rohfehler oder persönlichen Daten; `productReady` bleibt `false`.
- Lokale grüne Tests sind kein REAL-Nachweis. Produktive Planung beginnt erst nach gesonderter Auswertung eines echten Laufs.
- Bestehende fremde Arbeitsbaumänderungen nicht anfassen; nur die in der jeweiligen Aufgabe genannten Dateien stagen.

## File Map

- Create: `src/shop-probe/v2-coherent-transport.js` – vollständiger neuer Transport mit v3-Anlage, v2-Bindung, v2-Snapshot und v2-PUT.
- Modify: `src/shop-probe/transport.js` – ausschließlich frühe Delegation für `etagSource === 'v2-coherent'`; Legacy-Implementierung ansonsten unverändert.
- Modify: `src/shop-probe/scenarios.js` – neuer bereinigter Diagnosewert `v2-coherent`, keine Änderung der elf Szenarien.
- Modify: `src/shop-probe/main.js` – Diagnoseversion 5, korrekte getrennte Pfadangaben und Downloadname.
- Modify: `shop-probe/index.html` – vierte explizite Auswahl und klare v3-Anlage/v2-Koordinationserklärung.
- Create: `tests/shop-probe/v2-coherent-drive-fixture.js` – v2-formgetreuer Fake mit unabhängig abschaltbarer Content-/Metadata-Bedingung.
- Create: `tests/shop-probe/v2-coherent-transport.test.js` – HTTP-, Bindungs-, Stabilitäts- und Konkurrenzverträge des neuen Modus.
- Modify: `tests/shop-probe/transport.test.js` – unveränderte Legacy-Routen gegen Regression absichern.
- Modify: `tests/shop-probe/scenarios.test.js` – Sanitizing des neuen Diagnosewerts prüfen.
- Modify: `tests/shop-probe/browser.mjs` – vierte Auswahl, PUT-CORS, Bericht 5 und negative Gegenprobe.
- Modify: `scripts/serve.mjs` und `tests/serve.test.js` – das neue isolierte Probenmodul ausdrücklich in der Server-Assetliste aufnehmen und seine Auslieferung prüfen.
- Create after local GREEN: `docs/reports/2026-09-20-shop-probe-v5.md` – tatsächlich ausgeführte lokale Nachweise und Grenzen.
- Create after independent review: `docs/reports/2026-09-20-shop-probe-v5-review.md` – unabhängiges Urteil zum isolierten Paket.
- Create only after a real report exists: `docs/reports/2026-09-20-shop-v5-reallauf.md` – bereinigte Auswertung, keine Rohkennung.

---

### Task 1: Isoliertes `v2-coherent`-Prüfpaket

Diese eine Aufgabe liefert ein zusammenhängendes, unabhängig reviewbares Probenpaket. Die folgenden Phasen sind TDD-Schritte innerhalb desselben Tasks und keine getrennten Produktarbeitspakete.

#### Phase A: V2-Vertragsfixture und rote Transporttests

**Files:**
- Create: `tests/shop-probe/v2-coherent-drive-fixture.js`
- Create: `tests/shop-probe/v2-coherent-transport.test.js`
- Read: `src/shop-probe/transport.js`
- Read: `src/shop-probe/scenarios.js`

**Interfaces:**
- Consumes: bestehender Szenariovertrag `{create, read, retryCreate, updateIfUnchanged}`.
- Produces: `v2CoherentDriveFixture(options)` mit `{fetch,calls,files}` und Optionsfeldern `ignoreMediaCondition`, `ignoreMetadataCondition`, `mutateBefore412`, `mutateDuringRead`, `metadataOverride`.
- Erwartet später: `createV2CoherentProbeTransport({fetch,token})` mit derselben öffentlichen Transportoberfläche wie der Legacy-Transport.

- [x] **Step 1: V2-formgetreues Fixture schreiben**

Das Fixture muss v3 ausschließlich für `generateIds` und POST-Anlage bedienen. V2-GET liefert `title`, `parents:[{id}]`, private `properties`, `labels:{trashed:false}`, dezimale `version` und starke JSON-`etag`. V2-Content- und Metadata-PUT prüfen atomar dieselbe aktuelle ETag und erhöhen nach Erfolg Version und ETag.

Bei einer Anlage ohne expliziten Elternordner setzt das Fixture den synthetischen My-Drive-Wurzelordner als Elternreferenz. Der echte API-Vertrag legt solche Dateien in „Meine Ablage“ ab. Nur wenn lokal ein Elternordner vorgegeben ist, muss die gelesene Referenz exakt diesem entsprechen; ein neuer oberster Probeordner darf nicht fälschlich auf `parents: []` festgelegt werden.

```js
const currentEtag = record => `"v2-version-${record.version}"`;

if (method === 'GET' && path.includes('/drive/v2/files/')) {
  if (url.searchParams.get('alt') === 'media') return json(record.value);
  return json({
    id,
    title: record.title,
    mimeType: record.mimeType,
    parents: record.parentId ? [{id: record.parentId}] : [],
    properties: Object.entries(record.properties).map(([key,value]) => ({key,value,visibility:'PRIVATE'})),
    labels: {trashed:false},
    version: String(record.version),
    etag: currentEtag(record),
  });
}
```

- [x] **Step 2: Rote Tests für exakte Pfade und Header schreiben**

```js
test('v2-coherent uses v2 for every coordinated read and conditional write', async () => {
  const fixture = v2CoherentDriveFixture();
  const transport = createProbeTransport({fetch:fixture.fetch, token:()=> 'secret', etagSource:'v2-coherent'});
  const result = await runProbeScenarios({transport});
  assert.equal(result.passed, true);
  const writes = fixture.calls.filter(call => call.method === 'PUT');
  assert.ok(writes.some(call => call.url.includes('/upload/drive/v2/files/') && call.url.includes('uploadType=media')));
  assert.ok(writes.some(call => call.url.includes('/drive/v2/files/') && !call.url.includes('/upload/')));
  assert.ok(writes.every(call => call.headers['If-Match']?.startsWith('"v2-version-')));
  assert.equal(fixture.calls.some(call => call.method === 'PATCH'), false);
});
```

Zusätzlich exakt prüfen: v3-`generateIds` und v3-POST bleiben vorhanden; v3-GET/PATCH sind im neuen Modus verboten.

- [x] **Step 3: Rote Gegenproben für ignoriertes `If-Match` schreiben**

```js
for (const [option, checkId] of [
  ['ignoreMediaCondition', 'two-purchases'],
  ['ignoreMetadataCondition', 'initialization'],
]) {
  test(`v2-coherent rejects ${option}`, async () => {
    const fixture = v2CoherentDriveFixture({[option]:true});
    const result = await runProbeScenarios({transport:createProbeTransport({fetch:fixture.fetch,token:()=> 'secret',etagSource:'v2-coherent'})});
    assert.equal(result.passed, false);
    assert.deepEqual(result.checks.find(check => check.id === checkId).evidence, {
      checkpoint:'concurrent-writes', accepted:2, stale:0, other:0, rejections:[],
    });
  });
}
```

- [x] **Step 4: Rote Bindungs- und Stabilitätstests schreiben**

Je ein Fall verändert zwischen den beiden Metadatenreads ausschließlich v2-`version` beziehungsweise v2-`etag`; beide müssen vor jedem PUT mit `changed-during-read` abbrechen. Parametrisierte Fälle für falschen `title`, `mimeType`, `parents`, `labels.trashed`, fehlende/öffentliche `app`- oder `runId`-Property sowie doppelte Property-Schlüssel erwarten `binding` und null PUTs. Fehlende, schwache und malformed ETags erwarten `unsupported` und null PUTs.

- [x] **Step 5: Tests ausführen und RED bestätigen**

Run:

```powershell
node --test --experimental-test-isolation=none tests/shop-probe/v2-coherent-transport.test.js
```

Expected: FAIL, weil `v2-coherent` und `createV2CoherentProbeTransport` noch nicht existieren. Fehler dürfen nicht aus einem defekten Fixture oder Syntaxfehler stammen.

---

#### Phase B: Eigenen `v2-coherent`-Transport implementieren

**Files:**
- Create: `src/shop-probe/v2-coherent-transport.js`
- Modify: `src/shop-probe/transport.js`
- Test: `tests/shop-probe/v2-coherent-transport.test.js`

**Interfaces:**
- Produces: `createV2CoherentProbeTransport({fetch:fetchImpl=globalThis.fetch,token})`.
- Returns: `{create,read,retryCreate,updateIfUnchanged}`.
- `read(id)` returns `{id,value,version,etag,properties,observation:{etagSource:'v2-coherent',jsonEtagReadable:true}}`.
- `updateIfUnchanged(before,value,{metadata:false}={})` accepts only a bound snapshot with strong v2-ETag.
- Errors expose only `{code,status?,diagnostic?}` compatible with `runProbeScenarios`.

- [x] **Step 1: Legacy-Regression vor der Delegation festhalten**

In `tests/shop-probe/transport.test.js` für jeden bestehenden Modus die bisherigen Pfade ausdrücklich prüfen: `media`/`metadata` nutzen v3-GET/PATCH, `v2-json` nutzt v2 nur zum Tokenlesen und weiterhin v3-PATCH. Dadurch kann die neue Delegation keinen alten Modus still verändern.

- [x] **Step 2: Neue Transportdatei mit getrennten API-Wurzeln anlegen**

```js
const API_V2='https://www.googleapis.com/drive/v2/files';
const UPLOAD_V2='https://www.googleapis.com/upload/drive/v2/files';
const API_V3='https://www.googleapis.com/drive/v3/files';
const UPLOAD_V3='https://www.googleapis.com/upload/drive/v3/files';
const V2_FIELDS='id,title,mimeType,parents,properties,labels,version,etag';

```

Der Export `createV2CoherentProbeTransport({fetch:fetchImpl=globalThis.fetch,token}={})` hält eine zufällige Run-ID und eine private Map der in dieser Sitzung reservierten IDs mit Name, MIME-Typ und erwartetem Elternordner. `create` reserviert genau eine ID über v3, bindet sie lokal, legt sie mit v3 an und validiert anschließend über `read` alle v2-Bindungsfelder und den anfänglichen Inhalt. `retryCreate` verwendet ausschließlich dieselbe gebundene ID: Bei 409 wird der vorhandene Inhalt unabhängig gelesen und nur bei Übereinstimmung akzeptiert. `read` und `updateIfUnchanged` folgen den Schritten 3–5; der Rückgabewert enthält genau diese vier Methoden. Netzwerkfehler erzeugen weder neue IDs noch automatische Wiederholungen.

Die Fehlerklassifikation übernimmt 412 als `stale`, 409 als `collision`, 401/403/404 wie bisher und alle übrigen nicht erfolgreichen Antworten als `http`. Tokenfehler und Fetch-Ausnahmen bleiben `auth` beziehungsweise `network`, ohne Rohfehler zu übernehmen.

- [x] **Step 3: V2-Metadaten strikt normalisieren und binden**

Eine interne Funktion `readV2Metadata(id)` validiert die in der Spezifikation genannten Felder. `normalizePrivateProperties(properties)` akzeptiert nur eindeutige Stringschlüssel/-werte und `visibility === 'PRIVATE'`, liefert ein Objekt ohne Sonderbehandlung von Schlüsseln wie `__proto__` und prüft anschließend `app` und `runId`. Ein `Map`-Zwischenschritt oder ein Objekt ohne Prototyp verhindert verlorene Eigenschaften und umgangene Duplikatprüfungen. Beim späteren Schreiben erzeugt `privatePropertiesBody(properties)` eine deterministisch nach Schlüssel sortierte Liste.

```js
function strongEtag(value){return typeof value==='string' && /^"[\x21\x23-\x7E\x80-\xFF]+"$/.test(value);}

function normalizeParents(value){
  if(!Array.isArray(value)||!value.every(parent=>parent&&typeof parent.id==='string')) fail('binding');
  return value.map(parent=>parent.id);
}
```

- [x] **Step 4: Stabilen Snapshot implementieren**

`read(id)` liest Metadaten vor und nach dem v2-Medienabruf. Beide Metadatenantworten werden unabhängig gebunden. Unterschiedliche ETag oder Version ergeben:

```js
fail('stale', {
  phase:'read-stability',
  reason:'changed-during-read',
  etagSource:'v2-coherent',
  versionChanged:before.version!==after.version,
  jsonEtagChanged:before.etag!==after.etag,
  jsonEtagState:etagState(after.etag),
});
```

Ordner erhalten denselben doppelten Metadatenread ohne Medienabruf. Es gibt keinen Codepfad, der bei Instabilität trotzdem einen Snapshot zurückgibt.

- [x] **Step 5: V2-Content- und Metadata-PUT implementieren**

```js
const url = metadata
  ? `${API_V2}/${before.id}?fields=id,etag,version,properties`
  : `${UPLOAD_V2}/${before.id}?uploadType=media&fields=id,etag,version`;
const body = metadata
  ? {properties:privatePropertiesBody({...before.properties,...value,app:APP,runId})}
  : value;
await request(url, {
  method:'PUT',
  headers:{'Content-Type':'application/json; charset=UTF-8','If-Match':before.etag},
  body:JSON.stringify(body),
});
return {id:before.id};
```

Vorher `before.id`, MIME-Art, Folderflag, gebundene Run-ID und starke ETag prüfen. Die vom Aufrufer übergebene ETag darf nicht durch eine frisch gelesene ersetzt werden: Die absichtlich falsche starke ETag muss den Server erreichen, verbrauchte Snapshots müssen testbar bleiben. Der Transport darf nach 2xx nur die Annahme der Anfrage berichten; der Szenarioaufrufer liest weiterhin unabhängig nach.

- [x] **Step 6: Delegation ergänzen**

Am Anfang von `createProbeTransport`:

```js
if(etagSource==='v2-coherent') {
  return createV2CoherentProbeTransport({fetch:fetchImpl,token});
}
```

Danach bleibt die bestehende Zulassung `['media','metadata','v2-json']` samt Implementierung unverändert.

- [x] **Step 7: Zieltests und komplette Node-Probe ausführen**

Run:

```powershell
node --test --experimental-test-isolation=none tests/shop-probe/v2-coherent-transport.test.js
npm run test:shop-probe
```

Expected: alle neuen Transporttests und sämtliche bestehenden Probe-Node-Tests PASS. Besonders die beiden Ignore-Gegenproben bleiben als erwartete negative Szenarioergebnisse grün.

- [x] **Step 8: Transportpaket separat committen**

```powershell
git add -- src/shop-probe/v2-coherent-transport.js src/shop-probe/transport.js tests/shop-probe/v2-coherent-drive-fixture.js tests/shop-probe/v2-coherent-transport.test.js tests/shop-probe/transport.test.js
git diff --cached --check
git commit -m "test(shop): add coherent drive v2 write probe"
```

---

#### Phase C: Diagnose 5 und Browsernachweis

**Files:**
- Modify: `src/shop-probe/scenarios.js`
- Modify: `src/shop-probe/main.js`
- Modify: `shop-probe/index.html`
- Modify: `tests/shop-probe/scenarios.test.js`
- Modify: `tests/shop-probe/browser.mjs`
- Modify: `scripts/serve.mjs`
- Modify: `tests/serve.test.js`

**Interfaces:**
- Consumes: `etagSource:'v2-coherent'` und unveränderten Elf-Szenarien-Vertrag.
- Produces: Bericht mit `diagnosticVersion:5`, `shop-probe-bericht5.json`, getrennten v3-Anlage- und v2-Koordinationspfaden.
- Sanitizing erlaubt `etagSource:'v2-coherent'`, aber weiterhin keine Rohwerte.

- [x] **Step 1: Rote Diagnose- und Browsertests schreiben**

`scenarios.test.js` prüft, dass ein eingehendes Diagnostic-Objekt nur den festen Wert `v2-coherent` übernimmt und eingebettete private Marker verwirft. `browser.mjs` ergänzt einen Fall mit `source:'v2-coherent'`, erwartet vier Optionen, Diagnose 5, neuen Dateinamen, elf Resultate und die exakten berichteten Pfade.

```js
assert.equal(report.diagnosticVersion,5);
assert.equal(report.etagSource,'v2-coherent');
assert.equal(report.apiPaths.idReservation,'GET /drive/v3/files/generateIds');
assert.equal(report.apiPaths.mediaUpdate,'PUT /upload/drive/v2/files/{probeFileId}?uploadType=media');
assert.equal(report.apiPaths.metadataUpdate,'PUT /drive/v2/files/{probeFolderId}');
assert.equal(downloaded.suggestedFilename(),'shop-probe-bericht5.json');
```

Die CORS-Antwort des Harness ergänzt `PUT` in `Access-Control-Allow-Methods`. Der Request-Adapter reicht `If-Match`, Authorization und Content-Type an das neue Fixture weiter.

Der lokale Server verwendet eine ausdrückliche Assetliste. `v2-coherent-transport` muss in die vorhandene Liste der Shop-Probenmodule aufgenommen werden. Ein Server-Test fordert das neue Modul an und prüft Status 200, JavaScript-Inhaltstyp und den erwarteten Export. Die Browserläufe prüfen anschließend auch den tatsächlichen Import. Keine Produkt-Service-Worker-Liste verändern, da die isolierte Probe nicht zur Trainer-Laufzeit gehört.

- [x] **Step 2: Browsertests RED ausführen**

Run:

```powershell
npm run test:shop-probe:browser
```

Expected: FAIL bei fehlender vierter Option beziehungsweise Diagnoseversion 4; bestehende Legacyfälle dürfen nicht wegen veränderter Routen fehlschlagen.

- [x] **Step 3: Diagnosewert und Oberfläche minimal ergänzen**

In `safeDiagnostic` `v2-coherent` als einzigen neuen `etagSource` zulassen. In der Auswahl ergänzen:

```html
<option value="v2-coherent">Drive v2 kohärent (Koordination)</option>
```

Der Erklärungstext nennt ausdrücklich: Reservierung/Anlage v3, koordinierter Snapshot und Bedingungsschreiben v2, keine dokumentierte Garantie und kein stiller Fallback.

- [x] **Step 4: Berichtsversion und Pfadbeschreibung umstellen**

Für alle Modi lautet `diagnosticVersion` 5 und der Download `shop-probe-bericht5.json`. Der `v2-coherent`-Zweig berichtet die in der Spezifikation festgelegten Pfade; Legacyzweige berichten weiterhin ihre tatsächlichen bisherigen Pfade. Kein generischer Text darf behaupten, sämtliche API-Aufrufe seien v2.

- [x] **Step 5: Node- und Browserprüfungen GREEN ausführen**

Run:

```powershell
npm run test:shop-probe
npm run test:shop-probe:browser
```

Expected: alle Node- und Browserfälle PASS; `v2-coherent` positiv mit strengem Fixture und sichtbar negativ mit ignorierter Medien- sowie Metadatenbedingung. Keine Seitenfehler, LocalStorage- oder IndexedDB-Einträge; 320-Pixel-Ansicht ohne horizontalen Überlauf.

- [x] **Step 6: Diagnosepaket separat committen**

```powershell
git add -- src/shop-probe/scenarios.js src/shop-probe/main.js shop-probe/index.html tests/shop-probe/scenarios.test.js tests/shop-probe/browser.mjs
git diff --cached --check
git commit -m "test(shop): expose drive v2 coherent diagnostics"
```

---

#### Phase D: Lokale Gesamtprüfung und unabhängige Review

**Files:**
- Create: `docs/reports/2026-09-20-shop-probe-v5.md`
- Create after review: `docs/reports/2026-09-20-shop-probe-v5-review.md`
- Inspect only: all files from Phases A–C

**Interfaces:**
- Consumes: lokal grünes v5-Paket.
- Produces: nachvollziehbare lokale Evidenz und unabhängiges Urteil ohne REAL- oder Produktfreigabebehauptung.

- [x] **Step 1: Vollständige lokale Verifikation frisch ausführen**

```powershell
npm run test:shop-probe
npm run test:shop-probe:browser
npm test
npm run check:docs
git diff --check
```

Alle Ausgaben vollständig ansehen. Testzahlen erst aus den tatsächlichen Ergebnissen in den Bericht übernehmen.

- [x] **Step 2: Negativkontrollen im Bericht einzeln ausweisen**

Der Bericht nennt mindestens: ignoriertes Content-`If-Match`, ignoriertes Metadata-`If-Match`, mutierendes `412`, instabilen v2-Snapshot und jeden Bindungsbruch. Er hält fest, dass ein grüner Fake nur die lokale Erkennung belegt.

- [x] **Step 3: Unabhängige Review durchführen**

Reviewfokus:

1. Kein v3-GET/PATCH im `v2-coherent`-Koordinationspfad.
2. V3-Anlage wird nicht als v2 oder CAS bezeichnet.
3. Parents, Labels und private v2-Properties sind streng gebunden und beim Update erhalten.
4. Beide Snapshot-Kennungen bleiben zwingend stabil.
5. Nur 412 gilt als stale; 2xx erfordert Nachlesen, unklarer Ausgang erzeugt keinen neuen Vorgang.
6. Legacy-Modi, Sanitizing und `productReady:false` bleiben erhalten.
7. Kein Import oder Aufruf aus dem Produkttrainer.

P1/P2-Befunde beheben und die betroffenen sowie vollständigen Prüfungen erneut ausführen. Das Reviewdokument nennt Befunde, Korrekturen und frische Nachweise.

- [x] **Step 4: Dokumentation und Review exakt stagen und committen**

```powershell
git add -- docs/reports/2026-09-20-shop-probe-v5.md docs/reports/2026-09-20-shop-probe-v5-review.md
git diff --cached --check
git commit -m "docs(shop): document drive v2 coherent probe"
```

---

#### Phase E: Gesonderter echter Lauf und Entscheidungsgate

**Files:**
- Create only from a supplied real report: `docs/reports/2026-09-20-shop-v5-reallauf.md`
- Modify after result if required by repository handoff: `ARBEITSSTAND.md`, `START-HIER.md`, current handoff under `docs/handoffs/`
- Do not modify: `src/trainer/**`

**Interfaces:**
- Consumes: unabhängig freigegebenes lokales v5-Paket und einen bewusst gestarteten REAL-Lauf mit `etagSource:'v2-coherent'`.
- Produces: Entscheidung `candidatePassed:true|false` für einen späteren, gesonderten Produktintegrationsentwurf; niemals unmittelbare Produktaktivierung.

- [x] **Step 1: REAL-Lauf nur nach bewusster Nutzeraktion vorbereiten**

Die Seite über einen bereits erlaubten Ursprung öffnen. Der Nutzer verbindet das bestehende Konto, wählt ausdrücklich „Drive v2 kohärent (Koordination)“, bestätigt die Anlage neuer synthetischer Dateien und startet genau diesen neuen Kandidaten. Keine bestehende Probe wiederholen und keine Dateien löschen.

- [x] **Step 2: Bericht gegen harte Kriterien auswerten**

Der Bericht muss Diagnose 5 und die getrennten v3-/v2-Pfade nennen. Alle elf Szenarien müssen bestehen. Der unveränderte Szenariocode verlangt für `invalid-token` und `stale-write` die Klasse `stale` (Transport: HTTP 412), für `initialization` und `two-purchases` jeweils `accepted:1`, `stale:1`, `other:0` und eine passende Nachlese. Im positiven Bericht werden diese Bedingungen durch den bestandenen Szenariostatus belegt; separate Zähler werden bislang nur bei einem Fehlschlag exportiert. Keine nicht exportierten Einzelwerte im REAL-Bericht erfinden.

- [x] **Step 3: Negatives oder unvollständiges Ergebnis sicher festhalten**

Bei CORS-/Netzfehler, fehlender ETag, anderem Status, zwei angenommenen Schreibversuchen, instabilem Snapshot oder falschem Nachlesestand bleibt `candidatePassed:false`. Keine Guard-Prüfung entfernen, keine Fehlklasse umdeuten und keinen weiteren identischen Lauf verlangen.

- [ ] **Step 4: Positives Ergebnis begrenzt festhalten**

Auch bei vollständigem Erfolg lautet die Aussage nur: Der konkrete Drive-v2-Browserpfad hat im beobachteten Lauf die elf synthetischen Szenarien erfüllt. Offene Nachweise bleiben echte Leitungsunterbrechung, zwei physische Geräte, iOS, Produktmigration, Altclient, Backup/Restore und Langzeitverhalten. Produktcode bleibt unverändert.

- [ ] **Step 5: Erst danach Folgeplanung zulassen**

Nur `candidatePassed:true` erlaubt einen neuen Produktintegrationsentwurf. Dieser muss Kaufkonto, Belegformat, Migration, Altclient-Sperre, Wiederherstellung und Zwei-Geräte-Abnahme separat planen. Diagnose 5 selbst wird niemals in den Produktadapter kopiert, ohne diese Verträge zu entwerfen und zu prüfen.

## Plan-Selbstprüfung

- Spec coverage: v2-Bindung, v2-Snapshot, beide v2-PUTs, ehrliche v3-Anlage, Diagnose 5, Gegenproben, Legacy-Schutz, Sanitizing, unabhängige Review und REAL-Gate sind jeweils einer Task zugeordnet.
- Type consistency: `v2-coherent`, `createV2CoherentProbeTransport`, `v2CoherentDriveFixture`, `diagnosticVersion:5` und `shop-probe-bericht5.json` werden durchgehend identisch verwendet.
- Scope: Keine Phase ändert Produktmodule oder verspricht Produktreife. Der einzige Cloudschritt steht getrennt in Phase E und setzt bewusste Nutzeraktion voraus.
- Source discipline: Drive-v2-Referenzen begründen Endpunkte und Datenformen; die Google-Data-Seite bleibt ausdrücklich nur Protokollhinweis. Die tatsächliche CAS-Wirkung bleibt Gegenstand des REAL-Laufs.

## Tatsächliche Ausführung

Phasen A–D sind lokal abgeschlossen und unabhängig ohne offene relevante Befunde geprüft. Die beschriebenen Zwischencommits werden durch Root als ein zusammenhängendes, bereits geprüftes Probe-Paket gesichert; der Implementierungsagent hat nichts gestagt oder committet. [Umsetzungsbericht](../../reports/2026-09-20-shop-probe-v5.md), [unabhängiger Review](../../reports/2026-09-20-shop-probe-v5-review.md).

31/31 gezielte Transportfälle, 56/56 Shop-Node-, 9/9 Browser- und 379/379 Produkttests bestanden. Zusätzliche unabhängige Gegenprüfungen für geänderten Wurzelordner und einen trotz 412 mutierenden Ordner-PUT ließen die Probe korrekt fehlschlagen. Die neue Server-Assetfreigabe, realistischer My-Drive-Parent, sichere besondere Property-Schlüssel und strikte ETags sind enthalten.

**Phase E inzwischen negativ ausgewertet:** Der Nutzer lieferte den echten Diagnose-5-Bericht; [Auswertung](../../reports/2026-09-20-shop-v5-reallauf.md) mit 4 bestandenen und 7 instabilen Lesevorgängen. `candidatePassed:false`. Die positiven Zweige E4/E5 sind nicht anwendbar; keine Produktintegration freigegeben. Die lokale Durchführung durch Agenten umfasste weiterhin keine echten Google-Datenaufrufe. Die [Diagnose-6-Ergänzung](2026-09-20-shop-probe-v6-diagnostics.md) ändert ausschließlich Messwerte und Fehlerkontexte.
