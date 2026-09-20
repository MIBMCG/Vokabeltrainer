# Unveränderliche Kaufprobe – Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Einen zusammenhängenden synthetischen Kaufversuch mit Belegkette, Ordnerkoordination und Wiederfinden nach Antwortverlust bereitstellen.

**Architecture:** Ein gemeinsamer Ordner zeigt atomar auf eine unveränderliche, gehashte Belegkette. Ein isolierter Koordinator prüft diese vollständig und trennt Vorbereitung, Schreibbefund und bestätigte Quittung. Die bisherigen Transport- und Szenariopfade bleiben erhalten.

**Tech Stack:** Browser-JavaScript, Web Crypto, vorhandener Node-Testläufer (Node >=22.8.0), vorhandene Playwright-Prüfumgebung. Keine neue Abhängigkeit.

**Spec:** [Kaufprobe-Entwurf](../specs/2026-09-20-immutable-purchase-probe-design.md)

## Global Constraints

- Ausschließlich synthetische neue `SHOP-PROBE-…`-Dateien, kein Produktimport und keine Löschung.
- Keine Produktkäufe, kein Cloud-/Kostenwechsel; `productReady:false` in jedem Bericht.
- Alte veränderliche Snapshots behalten ihre Versions-UND-ETag-Prüfung.
- Genau ein bedingter Ordner-PUT pro Commit; kein automatisches Wiederholen.
- Maximal 64 KiB kanonischer Inhalt und 64 Belege je Kette; Überschreitung sperrt.
- Keine IDs, Tokens, ETags, Hashwerte, Inhalte oder rohen Fehlertexte im Export.
- Node >=22.8.0, keine neue Abhängigkeit.

## Task 1: Unveränderliche Übertragung und Kaufkoordinator

**Files:**
- Create: `src/shop-probe/immutable-value.js` (kanonisches JSON, Größen-/Hashprüfung).
- Create: `src/shop-probe/purchase-coordinator.js` (Kette, Zustandsübergänge, Vorbereitung/Commit/Quittung).
- Modify: `src/shop-probe/v2-coherent-transport.js` (drei getrennte immutable-Methoden und Sperre alter Mutatoren für immutable-Dateien).
- Create: `tests/shop-probe/purchase-coordinator.test.js`, `tests/shop-probe/immutable-transport.test.js`.
- Modify if needed: `tests/shop-probe/v2-coherent-drive-fixture.js` (gezielte Störungen; bisherige Defaults erhalten).

**Interfaces:**

```js
// immutable-value.js
export function canonicalJson(value) {} // string; Error.code='invalid' oder 'limit'
export async function immutableHash(value) {} // SHA-256, 64 lowercase hex

// Transport zusätzlich zu bestehenden Methoden
prepareImmutable({parentId, value}) // Promise<{id,sha256}>; reserviert, lädt nicht hoch
writeImmutable(ref) // Promise<JSON>; prüft nach Anlage/409 Hash und Bindung
readImmutable(ref) // Promise<JSON>; nur registrierte immutable-Referenzen

// purchase-coordinator.js
export function createPurchaseCoordinator({transport, anchorId}) {}
// .read() -> {snapshot, head:null|{id,sha256}, state:null|{epoch,earned,spent,owned,receipts}}
// .prepare(operation) -> {outcome:'prepared',ticket} | {outcome:'committed',active:boolean}
//   ungültige Aufträge werfen Error.code: invalid, conflict, epoch, funds, owned, limit, binding.
// .commit(ticket) -> {outcome:'confirmed'|'stale'|'uncertain'|'rejected',
//                    phase:'upload'|'pointer', code?:string, httpStatus?:number}
//   confirmed bedeutet nur bestätigter PUT, nicht freigegebener Kauf.
// .recover(operation) -> {outcome:'committed'|'absent',active:boolean,state}
//   gleiche Kennung/andere Parameter wirft conflict; read failures bleiben Fehler.
```

- [ ] RED: Tests mit eigenem synthetischem Drive-Fixture vor Implementierung schreiben und ausführen. Die folgenden Kernbehauptungen sowie die Fehlermatrix aus der Spec konkret abdecken:

```js
const {id:anchorId}=await transport.createMetadataFolder();
const a=createPurchaseCoordinator({transport,anchorId});
const b=createPurchaseCoordinator({transport,anchorId});
const init={kind:'init',id:'init-a',epoch:'e0',earned:1000};
const [pa,pb]=await Promise.all([a.prepare(init),b.prepare({...init,id:'init-b'})]);
const writes=await Promise.all([a.commit(pa.ticket),b.commit(pb.ticket)]);
assert.deepEqual(writes.map(x=>x.outcome).sort(),['confirmed','stale']);
assert.equal((await a.read()).state.earned,1000);
assert.equal((await a.read()).state.receipts.length,1);
```

```js
// Ein sauber registrierter unveränderlicher Inhalt verträgt Versionsänderung
// während des Medienlesens, aber keinen anderen Inhalt unter gleichem Verweis.
const ref=await transport.prepareImmutable({parentId:anchorId,value:{probe:1}});
await transport.writeImmutable(ref);
fixture.files.get(ref.id).value={probe:2};
await assert.rejects(()=>transport.readImmutable(ref),{code:'integrity'});
```

- [ ] GREEN: Kanonisierung rekursiv mit sortierten Objektschlüsseln und JSON.stringify für primitive Werte; unsichere/undefinierte Werte ablehnen, UTF-8-Bytegrenze prüfen. Hash mit `crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonicalJson(value)))` bilden.
- [ ] GREEN: In der vorhandenen privaten Datei-Map `immutable`-Datensätze mit gebundenem Inhalt und Hash speichern. `prepareImmutable` verwendet die vorhandene ID-Reservierung; `writeImmutable` nutzt das vorhandene POST, konsumiert/prüft Erfolgsantwort und verifiziert Inhalt auch nach 409. `readImmutable` verwendet vor/nach Media `readV2Metadata(...,{cache:'no-store'})`, vergleicht Bindung und alle Properties und Hash; es erzeugt keinen beschreibbaren Snapshot. Alte Updates/Retry lehnen immutable-Datensätze ab.
- [ ] GREEN: `read` verifiziert gesamten Vorgängerpfad, Hashes, Anker, Schema, Sequenzen und semantischen Replay sowie äußere Ordnerklammer. `prepare` hält Tickets in einer privaten Map/WeakMap. `commit` lädt erst hoch, schreibt anschließend nur drei Kopf-Properties auf Basis aller bisherigen Properties und dokumentiert den Status ohne automatische Wiederholung. `recover` durchsucht alle geprüften Operationsbelege.
- [ ] Tests starten:

```sh
node --test --experimental-test-isolation=none tests/shop-probe/immutable-transport.test.js tests/shop-probe/purchase-coordinator.test.js
npm run test:shop-probe
```

- [ ] Selbstprüfung, Prüfbericht im planbezogenen Arbeitsordner, unabhängige Task-Review; gefundene Fehler mit passenden Regressionstests beheben. Nur Task-1-Dateien committen.

## Task 2: Ausführbarer Browser-Versuch und bereinigter Bericht

**Files:**
- Create: `src/shop-probe/purchase-scenarios.js` (die sechs neuen Szenarien und feste Exportfelder).
- Modify: `src/shop-probe/scenarios.js` (früher Capability-Check und Delegation des neuen Scopes).
- Modify: `src/shop-probe/main.js`, `shop-probe/index.html` (fünfter Prüfumfang, Diagnoseversion10, Anleitung und Grenzen).
- Modify: `scripts/serve.mjs` (neue Module in bestehender fester Allowlist).
- Create: `tests/shop-probe/purchase-scenarios.test.js`.
- Modify: `tests/shop-probe/browser.mjs`, `tests/serve.test.js` (neuer Scope, Fehlerfälle, Versionsstand).

**Interfaces:** Konsumiert exakt die Methoden aus Task1. Exportiert `runPurchaseScenarios({transport,emit})`, Ergebnis wie bestehende Szenarien mit `checks`, `passed`, `productReady:false`, `limits`. Feste Check-IDs `purchase-init`, `purchase-race`, `purchase-idempotency`, `purchase-response-loss`, `purchase-reset-first`, `purchase-buy-first`.

- [ ] RED: Die sechs spezifizierten Fälle mit echter Transportimplementierung gegen das vorhandene synthetische Fixture prüfen. Ignorierte Metadatenbedingungen müssen mindestens Initialisierung/Parallelkauf scheitern lassen. Export auf bekannte Token-/ID-/Hash-/Inhaltsmarker prüfen. Ungültige Source/Scope-Kombinationen müssen vor jedem Drive-Aufruf scheitern.

```js
const result=await runProbeScenarios({transport,probeScope:'immutable-purchases'});
assert.equal(result.checks.length,6);
assert.equal(result.passed,true);
assert.equal(result.productReady,false);
assert.equal(JSON.stringify(result).includes('synthetic-only-secret'),false);
```

- [ ] GREEN: Je Check eigener gemeinsamer Anker, davor gemeinsamer synthetischer Hauptordner. Marker vor Kandidatenvorbereitung setzen. Beide parallelen Tickets per Promise.all vorbereiten, erst dann Commit-Aufrufe parallel starten; so ist derselbe Ausgangsstand Teil des Tests. Nachlesen muss die kompletten errechneten Zustände prüfen. Ein fehlgeschlagener Check verhindert folgende unabhängige Fälle nicht.
- [ ] GREEN: Beim Antwortverlust nur das Ergebnis des ersten erfolgreichen Ordner-PUT lokal verwerfen und klassifizierten Netzwerkfehler erzeugen. Anschließend zweiten kleinen Kauf veröffentlichen; neues Koordinatorobjekt muss die erste Quittung als Vorfahren finden. Rückgabe weist `simulatedResponseLoss:true` aus. Keine echte Google-Störung behaupten.
- [ ] GREEN: Bericht als Whitelist erzeugen: feste Phasen/Fehlerklassen/Boolesche Vergleiche, höchstens zwei Schreibbefunde pro Konkurrenzphase, HTTP-Status 100..599, synthetische Restpunkte 0..1000. Keine rohen Fehler oder Objekte durchreichen. UI zeigt verständlichen neuen Umfang „Kaufablauf mit Belegkette prüfen“, verlangt explizit `v2-coherent`, download `shop-probe-bericht10.json`; bestehender Default bleibt `full`.
- [ ] Browserfälle um Erfolg, ignorierte Bedingung und falsche Quellenwahl erweitern; vorhandene Versions-/Optionsanzahl-Assertions auf10/fünf anpassen. Neue Modulpfade müssen auch unter dem vorhandenen Base-Path erreichbar sein. Kein Google-Aufruf ohne expliziten Probestart.
- [ ] Prüfen:

```sh
npm run test:shop-probe
npm run test:shop-probe:browser
node --test --experimental-test-isolation=none tests/serve.test.js
npm run check:docs
git diff --check
```

- [ ] Task-Review und Gesamtprüfung; Bericht, Arbeitsstand, Einstieg und Übergabe aktualisieren. Produkt-/Gerätefreigaben bleiben offen. Nur autorisierte Dateien committen und pushen; HEAD, Remote-Branch und sauberen Arbeitsbaum danach vergleichen.

## Vorprüfung

Task1 und Task2 teilen nur die oben vollständig benannten Koordinator-/Transport-Schnittstellen; Änderungen an der alten Szenariodatei bleiben Task2. Die Spec-Grenzen gelten für beide. Ein grüner simulierten Lauf ist keine Servergarantie. Unbekannter Schreibausgang bleibt ungeklärt, bis ein inhaltlich identischer Beleg in der geprüften Kette gefunden wird. Es wird kein Produktzustand migriert.
