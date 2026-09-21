# Task 3 – Dauerhafter lokaler Kaufdienst und Journal

**Status Erstimplementierung:** DONE; Gesamtstand: Nutzerpause, Fixrunde 1 noch nicht unabhängig nachgeprüft.
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

## Fixrunde 1 nach unabhängiger Prüfung

**Fixbasis:** `5f73008`
**Fixstand:** uncommitteter Arbeitsbaum; Nutzerpause vor dem vorgesehenen Commit
**Fixcheckpoint:** `1ecddd665d6d19978cf53c1fe58df1a0a819f69a` – vom Controller ausschließlich zur Desktop-Übergabe gesichert, keine Reviewfreigabe.

Die vier blockierenden Befunde aus `task-3-review.md` wurden bearbeitet:

- Vor Vorschau, Bestätigung und Reservierung verlangt der Dienst jetzt den
  engen Port `sync.syncLearning() -> {phase:'synced', ...}`. Danach liest er den
  Commands-Zustand erneut und prüft Binding, Outbox, Pendingpakete, Quarantäne,
  Fachkonflikte und Integritätsprobleme. Fehlender Port, nicht bestätigter
  Status oder widersprüchlicher persistierter Zustand scheitert geschlossen.
  Der Task-4-Adapter darf nur den Produkt-Lernabgleich aufrufen und niemals
  rekursiv `PurchaseService.refresh`.
- Konten werden aus `project(currentLedger)` und ausschließlich den verifizierten
  Ausgaben/Besitzlisten der Kaufhistorie neu aufgebaut. Zusätzliche echte
  Antworten erhöhen damit wieder das verfügbare Guthaben, ohne eine frei
  gelieferte Punktesumme zu akzeptieren.
- Der exakte geplante Kauf-, Initialisierungs- oder Restorekandidat wird vor dem
  ersten unveränderlichen Upload zusammen mit der vollständigen geprüften
  Historie lokal durch `readHistory` abgespielt. Ein veralteter Ledger kann den
  gemeinsamen Kopf nicht mehr auf einen fachlich ungültigen Beleg setzen.
- Auftragsabschluss sucht nur auf der aktiven `previous`-Zielkette. Gefundene
  Kaufbelege müssen Kandidatenref/-body und den unveränderlichen Intent exakt
  treffen; Controls zusätzlich Operation und Epoche. Gleichnamige
  Herkunftsoperationen bestätigen keinen Zielauftrag. Abweichungen liefern
  `collision` und aktivieren weder Kauf noch Control.
- `resume(operationId)` rekonstruiert einen nur als `intent` gespeicherten
  Control über den Task-4-Candidate-Port, bevor Upload und Pointer fortgesetzt
  werden. Das benötigt keine flüchtige Marker- oder Vorschauautorität.

### RED

Exakter Lauf:

```text
node --test --experimental-test-isolation=none \
  --test-name-pattern="older ledger|reused operation ID|new learning points" \
  tests/trainer/purchases-recovery.test.js
```

Ergebnis: **0/3 bestanden, 3 fehlgeschlagen**.

- Der ältere Ledger führte einen zweiten Pointer-PUT aus (`2 !== 1`) und setzte
  damit den globalen Kopf auf eine anschließend unlesbare Historie.
- Die wiederverwendete Operations-ID erzeugte keine erwartete Ablehnung und
  bestätigte den falschen lokalen Intent.
- Der Lernzuwachs brach mit `integrity: Die Lernpunkte wurden nicht aus dem
  aktuellen Fachstand abgeleitet.` ab.

### GREEN und Recoverymatrix

- Derselbe Dreifachfokus: **3/3 bestanden**, 0 fehlgeschlagen.
- Vollständiger Recoverylauf:
  `node --test --experimental-test-isolation=none tests/trainer/purchases-recovery.test.js`
  → **53/53 bestanden**, 0 fehlgeschlagen, 39599 ms.
- Kauf-Speichergrenzen mit vollständig neuen Store-, Transport-, Commands-,
  Service- und Syncobjekten: **6/6**. Geprüft sind fehlende Saves für `intent`,
  `reserved`, `uploaded`, `pointer-pending`, `reconciling` und Abschluss.
- Kauf-Netzgrenzen mit vollständigem Neustart: **4/4** einschließlich
  Immutable-Uploadfehler, Anfrageverlust, Antwortverlust, rein lesendem Refresh
  und exakter ausdrücklicher Wiederholung.
- Initialisierung und Restore: **21/21**. Je Operation wurden alle genannten
  Persistenzphasen sowie Uploadfehler, Anfrageverlust und Antwortverlust mit
  neuen Store-/Transport-/Commands-/Service-/Syncobjekten geprüft. Fehlender
  Save verhindert die jeweils nächste abhängige Netzmutation.
- Zusätzliche Identitätsfälle prüfen fremdes Profil, geänderten Artikel,
  gleichnamige Herkunftsoperation und abweichenden Control-Kandidaten.
- Kombinierter Fokus
  `node --test --experimental-test-isolation=none tests/trainer/purchases-recovery.test.js tests/trainer/purchases-contract.test.js tests/trainer/purchases-transport.test.js`
  → **90/90 bestanden**, 0 fehlgeschlagen, 299802 ms.
- Einmaliger vollständiger Lauf `npm test` → **471/471 bestanden**, 0
  fehlgeschlagen, 121736 ms.
- `node --check src/trainer/purchases/service.js`, `git diff --check` und
  `npm run check:docs` → bestanden; Dokumentationsprüfung mit 1156 Dateien,
  203 Markdowndateien, 922 lokalen Links und 0 Fehlern.

### Selbstprüfung und verbleibende Grenze

Der Fixdiff verändert nur Kaufdienst, Recoverytests und den Protokollvertrag.
Der simulierte Serverzustand ist jetzt ausdrücklich von jedem neu erzeugten
Clienttransport getrennt; persistierte Produktdaten werden für jeden Neustart
als Bytes in einen neuen Storeadapter kopiert. Refresh bleibt bezüglich des
Netzes rein lesend, und nur ein ausdrücklicher Resume wiederholt einen unklaren
Pointer mit gespeichertem Body und ETag. Es gibt keinen bekannten offenen
Befund aus R3-1 bis R3-4. Task 4 muss weiterhin den bestätigten schmalen
`syncLearning`-Adapter und die echte dauerhafte Marker-/Epochenpublikation
implementieren. Reale Google-, Zwei-Geräte- und Apple-Nachweise bleiben offen.

Eine unabhängige Nachprüfung dieses Fixstands hat noch nicht stattgefunden. Der
vollständige Lauf war beendet und es lief beim Pausenzeitpunkt kein Prozess mehr.
Es wurden nach der Pause keine weiteren Tests, Reviews oder Produktänderungen
begonnen.

### Gesicherter Pausenstand und Fortsetzung

Der Implementierer stoppte ohne weitere Produktänderungen und übergab die drei
Dateien `src/trainer/purchases/service.js`,
`tests/trainer/purchases-recovery.test.js` und `docs/KAUFPROTOKOLL.md` zunächst
uncommittet. Der Controller hat sie anschließend für die angeforderte portable
Übergabe in `1ecddd6` gesichert. Dies ist ein getesteter Zwischenstand, keine
unabhängige Freigabe. Dieser versionierte Bericht ist die Übergabefassung des
lokalen, ignorierten Agentenberichts; nur der Abschlussvermerk wurde an den
inzwischen gesicherten Zustand angepasst.

Nach ausdrücklicher Fortsetzung zuerst R3-1 bis R3-4 gegen den Fixbereich
`5f73008..1ecddd6` unabhängig nachprüfen. Die vorhandenen grünen Läufe nicht
allein wegen des Arbeitsplatzwechsels wiederholen; bei Änderungen gezielt
nachtesten. Kein erneutes Implementieren bereits abgeschlossener Tasks.
Maßgeblich ist die [Desktop-Übergabe](../handoffs/2026-09-21-desktop-pause.md).
