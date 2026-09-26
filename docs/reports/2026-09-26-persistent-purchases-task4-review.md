# Task 4 – unabhängige Spezifikations- und Qualitätsprüfung

Datum: 26.09.2026. Reviewer: GPT-6 Astra, high.

Basis: `8b0a6d043bdeaff79218bf5e80459b416ea85cc6`.
Geprüfter Stand: `eb0f532c1930112240b38b16c22ab0ef1c7f1f62`.

## Urteil

**Spezifikation: nicht erfüllt. Qualität: Änderungen erforderlich.**
Es bestehen drei Important-Findings. Task 4 ist vor Task 5 zu korrigieren.
Keine Critical- oder zusätzlichen Minor-Findings.

Die vorherige Architekturberatung ist keine Implementierungsfreigabe. Die
Prüfung bewertet die tatsächliche Zusammensetzung von Sync, Restore,
PurchaseService und CommerceIntegration unabhängig vom Implementierungsbericht.

## R4-1 – Important: Download aktiviert Epochen vor Prüfung des gemeinsamen Kopfes

**Ort:** `src/trainer/sync/drive.js:1049–1052`, insbesondere der erst nach
`download` aufgerufene `reconcileCommerce`.
Der Download speichert vollständige Epochen bereits bei
`src/trainer/sync/drive.js:861–878`. `commands.commitExternal` reagiert auf einen
Epochenwechsel sofort, einschließlich Abbruch bisheriger Runden
(`src/trainer/commands.js:906–925`).

Eine vollständig veröffentlichte Aktivierungs-/Restoreepoche ist absichtlich
schon vor dem gemeinsamen Pointer verfügbar. Der jetzige Sync übernimmt sie
zunächst als aktive Epoche. Scheitert danach die Kopfprüfung, bleibt dieser
Zustand dauerhaft gespeichert. Der zusätzliche Kopfprüfschritt repariert ihn
nicht atomar. Auch bei später erfolgreicher Prüfung können bereits verworfene
Runden nicht durch bloßes Zurücksetzen der Ledger-Epochen wiederhergestellt werden.

**Gezielter Repro:** tatsächlicher ProductSync, Commands, Snapshottransport und
CommerceIntegration; synthetisches Drive mit vollständigem gültigem Snapshot
und v3-Epoche, anschließend Netzfehler beim Beschaffen des Kauftransports.

```text
SYNC_AUTHORITY {"before":"e0","result":{"code":"network"},"after":"orphan-v3","mode":"inactive","head":null}
```

Es wurde also eine neue aktive v3-Epoche gespeichert, obwohl überhaupt kein
gemeinsamer Kopf bestätigt wurde. Beim vorhandenen `head === null`-Zweig in
`src/trainer/purchases/integration.js:355–363` wird eine zuvor im Download
übernommene Epoche ebenfalls nicht zurückgenommen.

**Erforderliche Korrektur:** unbestätigte Epochen/Snapshots und verspätete
Altclientdateien erhalten, aber vor dem ersten wirksamen Commands-Commit von der
aktiven Epochenauswahl trennen. Die geprüfte gemeinsame Autorität muss bereits
für diesen Commit gelten. Initialer Beitritt, fehlender Initializekopf und
fehlgeschlagene Kopfprüfung müssen dieselbe Grenze einhalten.

**Regression:** echten Sync mit veröffentlichtem Kandidaten ohne Pointer,
Netzfehler bei Kopfprüfung und vorhandener laufender Runde prüfen. Aktive Epoche,
Runde und Punkte müssen unverändert bleiben. Danach bestätigten Kopf prüfen und
erst dann atomar aktivieren. Den bereits laufenden eingefrorenen v2-Restore bis
zu seinen späten Uploads fortsetzen und anschließend denselben neuen Syncpfad
prüfen; die Altdateien müssen erhalten bleiben, dürfen aber nicht aktivieren.

## R4-2 – Important: reguläre Restorewiederaufnahme wird als veraltete Vorschau abgewiesen

**Ort:** `src/trainer/purchases/service.js:542–544`, zusammen mit
`src/trainer/backup/restore.js:109–110`.

`RestoreService.confirm` ruft für einen bestehenden `uploading`- oder
`published`-Auftrag wieder `prepareRestore` auf. Dessen neue Prüfung verlangt
jedoch ausschließlich `phase === 'preview'`, bevor die Wiederaufnahme des
vorhandenen Controls bei `service.js:556–559` erreicht werden kann.

**Gezielter Repro:** echte RestoreService → PurchaseService →
CommerceIntegration-Komposition mit dauerhaftem Commands-Speicher; lediglich
Drive und Lernsync-I/O synthetisch. Nach Annahme des Epochenuploads geht dessen
Antwort verloren. Die erneute öffentliche Bestätigung derselben Vorschau ergibt:

```text
PUBLIC_FIRST network [ 'uploading' ]
PUBLIC_RETRY stale Die koordinierte Wiederherstellungsvorschau ist nicht mehr verfügbar.
```

Der gespeicherte Auftrag bleibt offen und blockiert Folgeoperationen. Der
separate Service-Recoverytest über `service.resume` beweist nicht, dass dieser
öffentlich angeschlossene Restorepfad funktioniert.

**Erforderliche Korrektur:** dieselbe gespeicherte Restoreidentität samt
Kandidat, Upload-IDs, Pointerbody und ursprünglichem ETag über den öffentlichen
Wiederaufnahmeweg fortführen. Bei unbekanntem Pointerausgang zuerst lesen;
erneutes Senden nur ausdrücklich und mit unveränderten gespeicherten Werten.
Keine neue Kandidatur aus der alten Vorschau erzeugen.

**Regression:** tatsächliche Zusammensetzung nach angenommenem Upload mit
verlorener Antwort und nach Prozessneustart prüfen; außerdem unbekannten
Pointerausgang und ausdrückliche Wiederholung über den angeschlossenen Pfad.

## R4-3 – Important: abgeschlossene Veröffentlichungen sperren spätere Restores

**Ort:** `src/trainer/purchases/service.js:539–541`.

`blockingRestores` berücksichtigt jeden anderen Eintrag in `restoreJobs`, auch
`phase === 'activated'`. Die Integration behält abgeschlossene Veröffentlichungen
absichtlich bei und setzt nur deren Phase
(`src/trainer/purchases/integration.js:312–322`). Bereits die Initializeoperation
hinterlässt einen solchen Eintrag. Damit kann nach normaler Aktivierung schon
der erste koordinierte Restore blockiert werden; nach einem abgeschlossenen
Restore wird der nächste ebenfalls blockiert.

**Gezielter Repro:** im vorigen echten Zusammensetzungsfall den gespeicherten
Control über `service.confirmRestore(job.id)` abschließen, um R4-2 für diesen
unabhängigen Nachweis zu umgehen. Dann neue Sicherung exportieren und über
`RestoreService.prepare/confirm` wiederherstellen:

```text
PUBLIC_NEXT_RESTORE restore-pending Eine ältere Wiederherstellung muss zuerst abgeschlossen werden. [ 'activated', 'preview' ]
```

Der Integrationstest entfernt bei
`tests/trainer/purchases-integration.test.js:297` vorher manuell alle
`restoreJobs`; dadurch fehlt gerade der normale Zustand nach Aktivierung.

**Erforderliche Korrektur:** tatsächlich offene Legacy-/andere Restoreaufträge
von abgeschlossenen Veröffentlichungen unterscheiden. Historische Aufträge
nicht zum Umgehen der Sperre löschen. Initialize → Restore → weiterer Restore
mit unverändert vorhandenen abgeschlossenen Journal-/Publikationseinträgen testen.

## Positive Prüfung und abgegrenzte Beobachtungen

- Checkpoints sind im geprüften Replay an den Source-Provenance-Kontext gebunden.
  Rollen werden durch Vorgänger und Herkunftsgraph weitergereicht; ein Checkpoint
  am autoritativen Zielkopf oder in dessen Vorgängerkette wird abgewiesen. Die
  Restoreprüfung behält die strikte normalisierte Fachstandgleichheit bei.
- Der Offlineexport bindet den aktuellen vollständigen Ledger und die lokale
  verifizierte Historie deterministisch. Er enthält die vollständige Herkunft
  sowie Auswahl, keine ausführbaren lokalen Jobs oder lokalen ETags. Er führt
  selbst keine Netzschreiboperation oder Commerce-Mutation aus. Wirtschaftliche
  Ausgaben/Besitz bleiben im neutralen Checkpoint erhalten; zusätzliche Erträge
  werden aus geprüften Lernfakten berechnet.
- Die neue Integration packt auch bei gleicher Bindung die Checkpointherkunft
  unter reservierten physischen IDs. Die strengere Provenienzprüfung wird nicht
  durch allgemeine Freigabe fremder Kaufautorität umgangen.
- Neue Lernereignisse aus `commands.js:505` und neue Pakete aus
  `sync/packets.js:21` tragen weiterhin Version 2. Aktivierte Epochen und aktive
  Wirtschaftssicherungen tragen Version 3. Das setzt den v3-Kopf nicht zurück;
  die unveränderten Lernfakten haben weiterhin die v2-Semantik und der gemeinsame
  v3-Marker ist die Altclientbarriere. Deshalb hier kein zusätzlicher belegter
  Funktionsfehler. Ein vollständiger Wechsel auch der Ereignis-/Paketheader
  müsste beide Writer gemeinsam berücksichtigen; bloßes globales Hochsetzen von
  CURRENT_VERSION wäre kein geeigneter Fix für die drei Findings.
- Der eingefrorene v2-Test prüft nach Beginn eines Restores nur `sync.sync()`.
  Ein ergänzender enger Aufruf von `restore.confirm(preview.previewId)` danach
  wurde akzeptiert, schrieb drei Dateien und erreichte `activated`. Das ist die
  bekannte Grenze bereits laufender alter Clients, kein Auftrag, eingefrorenen
  Code nachträglich zu ändern. Der fehlende Nachweis ist die anschließende
  Nichtaktivierung dieser Altdateien im neuen Produktpfad (R4-1).
- Kein Finding wegen fehlender eigener v2-`-text`-Regel: die vorhandene
  `*.js text eol=lf`-Regel erzwingt LF auch bei `autocrlf`. Der exemplarisch
  geprüfte Commitblob der eingefrorenen `backup/format.js` hat die im Manifest
  verzeichneten 11976 Bytes. Die v1-`-text`-Regel bleibt erhalten.

## Prüfumfang und Belege

Gelesen wurden Reviewvorlage, Task-4-Brief einschließlich verbindlicher Grenzen
und Checkpointruling, Implementierungsbericht, Integrationaudit sowie das
bereitgestellte Commit-/Stat-/U10-Diffpaket inkrementell. Die eingefrorenen
historischen Quellkopien wurden nicht pauschal erneut vollständig gelesen.
Behauptete grüne Suiten wurden nicht als unabhängiger Beweis übernommen.

Konkrete Nachverfolgungen außerhalb vollständiger Diffhunks:

- Restorevorschau, Bestätigung, Veröffentlichungsphasen und öffentliche Ports,
  um Kandidatenvorbereitung mit tatsächlicher Wiederaufnahme zu verbinden.
- Download/Join/PublishLocalEpochs und Commands.commitExternal, um die erste
  dauerhafte Epochenaktivierung und deren Rundeneffekte zu bestimmen.
- Commands-Ereigniserzeugung, Paketwriter, Versionsprüfung und Epochenauflösung
  für die ausdrücklich angefragte v2/v3-Grenze.
- Snapshottransport, Testfixtures und Recoveryhelper ausschließlich zur
  Konstruktion der obigen engen synthetischen Repros.
- `.gitattributes` und ein Commitblob zur genannten Windows-Bytehypothese.

Ausgeführt: ausschließlich temporäre, nicht gespeicherte
`node --input-type=module`-Repros per PowerShell-Here-String sowie gezielte
Lese-/Suchbefehle. Kein Produktcode geändert, keine Suite wiederholt, kein
Git-/Index-/HEAD-Zustand verändert. Ein versuchter Node-Unterprozess zum Lesen
von Gitblobs scheiterte an `EPERM`; danach wurden die gezielten schreibfreien
Befehle `git cat-file -s HEAD:tests/compat/v2/src/trainer/backup/format.js` und
`git check-attr text eol -- tests/compat/v2/src/trainer/backup/format.js`
verwendet. Zwei anfängliche Sync-Reproansätze hatten einen falschen Import bzw.
fehlende Adapterargumente; sie sind kein Produktbefund. Maßgeblich ist der oben
dokumentierte vollständige erfolgreiche Reproaufbau.

### Reproduzierbarer Aufbau für R4-1

Im Repository-Root des geprüften Checkouts als `node --input-type=module`
ausführen; alle Daten bleiben in den vorhandenen In-Memory-Fixtures:

```js
import {setupSyntheticSync,sequenceIds} from './tests/trainer/backup-fixtures.js';
import {createProductSync} from './src/trainer/sync/drive.js';
import {createCommerceIntegration} from './src/trainer/purchases/integration.js';
import {COMMERCE_VERSION} from './src/trainer/model/versions.js';
import {resolveEpochs} from './src/trainer/model/epochs.js';
import {exportBackup} from './src/trainer/backup/format.js';
import {planSnapshotUploads,uploadVerified} from './src/trainer/backup/transport.js';
const {commands,drive,sync}=await setupSyntheticSync();
const now=()=>new Date('2026-09-26T10:00:00.000Z');
const before=commands.getState(),binding=before.binding;
const backup=await exportBackup(before,now().toISOString());
const uploads=await planSnapshotUploads(backup,'restore',drive);
for(const upload of uploads)await uploadVerified(drive,binding,upload);
drive.addJson({id:'orphan-file',parentId:binding.folderId,
  appProperties:{app:'vokabeltrainer-product',kind:'epoch',
    datasetId:binding.datasetId,epochId:'orphan-v3'},
  value:{...COMMERCE_VERSION,kind:'epoch',id:'orphan-v3',
    datasetId:binding.datasetId,parents:[before.ledger.descriptor.rootEpochId],
    deviceId:'other-device',clock:1000,occurredAt:now().toISOString(),
    snapshotId:backup.snapshot.id,snapshotManifestFileId:uploads.at(-1).fileId}});
const commerce=createCommerceIntegration({now,id:sequenceIds('integration'),
  transportFor:async()=>{throw Object.assign(new Error('synthetic coordinator unavailable'),
    {code:'network'});}});
const current=createProductSync({drive,store:{},commands,commerce,now,
  id:sequenceIds('new-sync'),onStatus(){}});
let result;try{result=await current.sync();}catch(e){result={code:e.code};}
console.log('SYNC_AUTHORITY',JSON.stringify({
  before:resolveEpochs(before.ledger).activeEpochId,result,
  after:resolveEpochs(commands.getState().ledger).activeEpochId,
  mode:commands.getState().commerce.mode,head:commands.getState().commerce.head}));
current.destroy();sync.destroy();
```

### Reproduzierbarer Aufbau für R4-2 und R4-3

Der ausgeführte Repro verwendete nur den Helferpräfix vor dem ersten `test(` aus
`tests/trainer/purchases-recovery.test.js` (Imports relativ zu dieser Datei
aufgelöst, keine Testfälle gestartet). Folgender angehängter Ablauf beschreibt
die tatsächliche Produktkomposition und kann als Regression in dieser Datei
übernommen werden. `createCommerceIntegration`, `createRestoreService` und
`SyntheticDrive` sind aus ihren bestehenden Modulen zu importieren:

```js
const now=()=>new Date('2026-09-26T10:00:00.000Z');
const drive=new SyntheticDrive();drive.account=BINDING.accountId;
const h=await openHarness({syncForCommands:commands=>createCommerceIntegration({
  commands,drive,now,id:sequenceIds('integration'),
  learningSync:()=>learningSync(commands).syncLearning()})});
await h.service.refresh();
const restore=createRestoreService({commands:h.commands,store:h.store,
  sync:{sync:()=>learningSync(h.commands).syncLearning()},drive,now,
  id:sequenceIds('restore'),commerce:h.service});
const backup=await exportBackup(h.commands.getState(),now().toISOString());
const preview=await restore.prepare(backup);drive.loseUploadKind='epoch';
try{await restore.confirm(preview.previewId);}catch(e){
  console.log('PUBLIC_FIRST',e.code,h.commands.getState().restoreJobs.map(j=>j.phase));}
try{await restore.confirm(preview.previewId);}catch(e){
  console.log('PUBLIC_RETRY',e.code,e.message);}
const job=h.commands.getState().restoreJobs[0];
await h.service.confirmRestore(job.id); // R4-2 umgehen, R4-3 separat beobachten.
const second=await restore.prepare(await exportBackup(h.commands.getState(),now().toISOString()));
try{await restore.confirm(second.previewId);}catch(e){
  console.log('PUBLIC_NEXT_RESTORE',e.code,e.message,
    h.commands.getState().restoreJobs.map(j=>j.phase));}
```

## Grenzen

489/489 Gesamttests, 59/59 Recoverytests und 3/3 Browserfälle sind historische
Implementierungsbelege, in dieser Review nicht wiederholt. Die engen Repros
prüfen reale Produktlogik mit synthetischem Netzwerk, keine Google-Latenz,
Kontoberechtigungen oder echten Zwei-Geräte-Rennen. Apple-/Geräteabnahme,
vollständige Task-5-Oberfläche und Freigabe einer Veröffentlichung bleiben offen.
Ein vollständiger fremdgebundener A→B→C-Durchlauf über reale Driveadapter wurde
hier nicht zusätzlich ausgeführt; die geprüften Provenienz- und Mappingpfade
ersetzen keinen solchen Gerätebeleg.
