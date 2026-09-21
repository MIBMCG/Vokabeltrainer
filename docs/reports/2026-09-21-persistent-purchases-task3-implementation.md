# Task 3 – Dauerhafter lokaler Kaufdienst und Journal

**Status:** DONE
**Arbeitsbranch:** `codex/vokabeltrainer-v1`
**Freigegebene Task-2-Basis:** `cd6ba45`
**Implementierungscommit:** `5f73008` (`feat: add durable purchase service`)
**Daten:** ausschließlich synthetisch; kein echter Google-, Apple- oder Zwei-Geräte-Lauf

## Ergebnis

Der lokale Produktzustand verwendet `storageVersion:3`, während das Fachformat
bewusst bei Version 2 bleibt. V1/V2 werden nach vollständiger Prüfung und mit
validierter lokaler Sicherheitskopie atomar migriert. Bestehende Ledgerobjekte,
IDs, Hashes, PIN-Daten und ausstehende Pakete bleiben unverändert. Ein offener
alter Restorejob lässt den Produktstart in der bisherigen Version zu und sperrt
nur die Kaufmigration.

`createPurchaseService({commands,transport,sync,now,id,onStatus})` stellt
`prepareActivation`, `confirmActivation`, `refresh`, `preview`, `confirm`,
`resume`, `getStatus`, `getView`, `select`, `prepareRestore` und
`confirmRestore` bereit. Alle Zustandswechsel laufen über
`commands.commitExternal(next,expectedHash)`. Kaufvorschauen sind an den
vollständigen Produktzustand und den bestätigten Kopf gebunden. Neue Käufe
benötigen einen erfolgreichen Onlineabgleich; bestätigter Besitz und Auswahl
bleiben aus dem vollständig geprüften Cache offline nutzbar.

## Persistiertes Schema und Wiederaufnahme

`Commerce` ergänzt `control:ControlJob|null`. Ein `Attempt` ergänzt
`pointerProperties:null|record<string,string>`. Der bestätigte Steuervertrag ist:

```text
ControlJob = {
  version:1,
  operationId,
  operation:'initialize'|'restore',
  phase,
  epochId,
  head,
  etag,
  candidate,
  pointerProperties,
  uploads
}
```

Ab `reserved` sind Kandidat, vollständige Uploadclosure, Ausgangskopf und eine
nichtleere opake ETag gespeichert; nur Initialisierung hat `head:null`. Vor
`pointer-pending` ist der vollständige Pointerbody gespeichert. Upload- und
Pointerautorität prüfen den exakten gespeicherten Auftrag, Configref und
Configbody, Datensatz, Coordinator, Operation, Epoche und vollständige Closure.
Ein nicht abgeschlossener Steuerauftrag sperrt Kaufaufträge. Ein abgeschlossener
Steuerauftrag bleibt erhalten, bis eine neue ausdrücklich vorbereitete
Steueroperation ihn ersetzt; die Belegfolge erhält jede Operationskennung.

`refresh()` und ein neuer Service lesen und gleichen nur ab. Nach unklarem
Ausgang wird kein Pointer automatisch wiederholt. Nur der ausdrückliche
`resume(operationId)` beziehungsweise die ausdrückliche Bestätigung wiederholt
denselben gespeicherten Body, Kandidaten und dieselbe ETag. Ein 412 markiert den
Versuch als `superseded`; eine neue Vorschau ist erforderlich. Antwortverlust,
lokaler Speicherfehler nach erfolgreichem PUT und ein später fortgeschrittener
Kopf werden anhand der vollständigen Historie ohne Doppelbelastung aufgelöst.

## Task-4-Grenze

```text
sync.prepareActivationCandidate({state,control,input,history,reserve})
sync.prepareRestoreCandidate({state,control,input,history,reserve})
  -> {epochId,candidate,uploads}

sync.applyConfirmedControl({state,control,history}) -> ProductState
```

Vor einem `prepare*Candidate` ist der Intent bereits dauerhaft gespeichert.
Die Candidate-Ports dürfen nur eine vollständige gehashte Closure vorbereiten;
sie dürfen noch keinen Marker und keine Epoche veröffentlichen.
`applyConfirmedControl` erhält den vollständig geprüften Verlauf einschließlich
Basen und Cache sowie den exakten gespeicherten ControlJob. Task 4 muss eine
Markerabsicht vor ihrem Upload in der vorhandenen Produkt-Outbox oder einer
ausdrücklich validierten Schemaerweiterung speichern. Das Aktivierungsziel muss
aus persistierten Uploads und geprüften Basen rekonstruierbar sein. Fehlende
Ports scheitern geschlossen mit `not-ready`; Task 3 aktiviert keine Shop-UI.
Fremdimport-Proofs bleiben ein eigener, vollständig gebundener Herkunftspfad
und verleihen gewöhnlichen Käufen keine Schreibautorität.

## Übernommene Task-1-Befunde

- `readHistory` gibt nach jeweils 32 Cache-, Receipt-, Basis- oder Proofarbeiten
  mit `setTimeout(0)` tatsächlich an die Makrotaskqueue ab.
- Readerfehler vom Typ `ProductError` behalten maschinenlesbare Codes wie
  `auth` und `network`; nur fremde Lesefehler werden als `history` normalisiert.
- Basisleser erhalten neben der ID die erwartete Referenz mit Hash.

## Runtimeabschluss

Durch den neuen `commands.js`-Import sind `purchases/schema.js`, `value.js` und
`proof.js` jetzt Teil des ausgelieferten Laufzeitgraphen. Server-Allowlist und
Service-Worker-Precache enthalten alle drei Dateien. Der Produktcache wurde von
v20 auf v21 erhöht, der synthetische Updateworker entsprechend auf v22. Der
Kaufdienst selbst ist vor Task 5 nicht aus der Produktoberfläche erreichbar und
wurde deshalb nicht in die ausgelieferte Assetliste aufgenommen.

## TDD- und Prüfnachweise

RED:

- `node --test --experimental-test-isolation=none tests/trainer/purchases-recovery.test.js`
  → 0/1, `ERR_MODULE_NOT_FOUND` für `purchases/service.js`.
- `node --test --experimental-test-isolation=none --test-name-pattern="v2 purchase-storage migration" tests/trainer/migration.test.js`
  → 0/1, fehlender Export `migrateProductStateV2`.
- Schema-Fokuslauf → 0/2, fehlende `Attempt.pointerProperties` und
  `Commerce.control`.
- Transport-Fokus für exakten Pointerbody → RED: statt des gespeicherten Bodys
  wurde der aktuelle Aufruferbody gesendet.
- Recovery-Foki für Activation-Port, Restore-Historie, Offlineauswahl,
  Konto-/Ordnerwechsel, Control-Closure/-Autorität, Pointerstatus und
  Control-Neustart waren jeweils zunächst rot.
- `node --test --experimental-test-isolation=none --test-name-pattern="stale ETag" tests/trainer/purchases-recovery.test.js`
  → 0/1; Auftrag blieb fälschlich `open`.

GREEN:

- Fokuspaket aus Recovery, Transport, Commands, Migration, Service Worker und
  Server: **92/92 bestanden**, 0 fehlgeschlagen.
- Finaler Recoverylauf nach der 412-Korrektur:
  `node --test --experimental-test-isolation=none tests/trainer/purchases-recovery.test.js`
  → **14/14 bestanden**, 0 fehlgeschlagen.
- Echter Edge-Fokus mit den vorgegebenen `PLAYWRIGHT_MODULE`- und
  `BROWSER_EXECUTABLE`-Werten, Muster
  `B1 browser migrates|C2 rejected required precache|trainer offline`
  → **4/4 bestanden**, einschließlich v1→lokal-v3, fehlgeschlagenem Precache,
  Offline-Neustart und kontrolliertem Update.
- `npm test` (genau einmal vor Commit) → **431/431 bestanden**, 0
  fehlgeschlagen, Dauer 103017 ms. Danach änderte ausschließlich die zusätzlich
  rot/grün geprüfte 412-Verzweigung den Service.
- `npm run check:docs` → 1154 Dateien, 201 Markdowndateien, 920 lokale Links,
  0 Fehler.
- `git diff --check` und `git diff --cached --check` → ohne Befund.

## Dateien

- Produkt: `src/trainer/purchases/service.js`, `schema.js`, `transport.js`,
  `history.js`, `basis.js`, `src/trainer/commands.js`,
  `src/trainer/storage/migrate.js`.
- Laufzeit: `scripts/serve.mjs`, `trainer/sw.js`.
- Tests: `tests/trainer/purchases-recovery.test.js`,
  `purchases-contract.test.js`, `purchases-transport.test.js`,
  `commands.test.js`, `migration.test.js`, `tests/browser/trainer.browser.mjs`,
  `tests/browser/trainer-harness.mjs`.
- Vertrag: `docs/KAUFPROTOKOLL.md`.

## Selbstprüfung und Grenzen

Der Diff wurde gegen die Task-3-Anforderungen und die akzeptierten Task-2-APIs
geprüft. Die Schreibgrenzen sind dauerhaft, exakt gebunden und fail-closed; es
gibt keinen bekannten offenen Task-3-Codebefund. Unverändert offen bleiben die
eigentliche Task-4-Epochen-/Markerpublikation, die Task-5-Shopoberfläche sowie
reale Google-, Zwei-Geräte- und iPhone-/iPad-Nachweise. Es wurde nicht gepusht.
