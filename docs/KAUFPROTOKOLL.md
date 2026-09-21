# Kaufprotokoll: Verträge der reinen Kernmodule

**Task 1 im geprüften Umfang freigegeben:** Die erneute unabhängige
[Nachprüfung der vier wichtigen Befunde](reports/2026-09-21-persistent-purchases-task1-review.md)
bestätigt alle vier Korrekturen. Diese Freigabe gilt für den reinen Kern und
ist keine Freigabe der noch laufenden Transport-/Serviceintegration oder eines
realen Gerätebetriebs.

Stand: 20.09.2026. Dieses Dokument bindet die nachfolgenden Transport-, Service-,
Speicher- und Restore-Tasks an die öffentlichen Formen aus
`src/trainer/purchases/`. Alle Formen sind JSON-Daten. Unbekannte Felder sind
ungültig. Öffentliche Rückgaben sind Kopien.

Task 1 enthält keine Speicherung, keine HTTP-Aufrufe und keine Oberfläche.
`ProductError.code` ist an allen Fehlergrenzen maschinenlesbar.

## Grundwerte

Eine `Id` erfüllt `[A-Za-z0-9_-]{1,128}`, ein `Sha256` besteht aus genau 64
kleinen Hexadezimalzeichen.

```text
Ref = {id:Id, sha256:Sha256}
Binding = {
  accountId:Id,
  folderId:Id,
  descriptorFileId:Id,
  datasetId:Id
}
```

`value.js` veröffentlicht:

- `canonical(value): string`: sortiertes, verlustfreies kanonisches JSON; weist
  nicht-endliche Zahlen, Zyklen, fremde Prototypen und gefährliche Schlüssel ab.
- `digest(value): Promise<Sha256>`: SHA-256 über die UTF-8-Bytes von
  `canonical(value)`.
- `refFor(id, value): Promise<Ref>`.
- `assertRef`, `assertBinding`, `sameRef`, `sameBinding` und `copy` als
  gemeinsame reine Hilfen.

## Auftrag, Beleg und wirtschaftliche Herkunft

```text
Intent = {
  version:1,
  operationId:Id,
  datasetId:Id,
  profileId:Id,
  epochId:Id,
  articleId:string,
  catalogVersion:1,
  price:nonNegativeSafeInteger,
  confirmed:true
}

EconomicSnapshot = {
  version:1,
  kind:'economic-snapshot',
  source:null | {binding:Binding, head:Ref, proof:Ref|null}
}

Receipt = {
  version:1,
  kind:'receipt',
  datasetId:Id,
  coordinatorId:Id,
  sequence:nonNegativeSafeInteger,
  previous:Ref|null,
  operationId:Id,
  operation:'initialize'|'purchase'|'restore',
  epochId:Id,
  basis:Ref,
  intent:Intent|null,
  economy:EconomicSnapshot|null
}
```

Artikel-IDs sind entweder die ID einer bezahlten Grundfigur oder
`evolution:<figureId>:<stage>`. Nur die Stufen 2 bis 4 sind Käufe. Stufe 1 ist
bei vorhandener Grundfigur kostenlos. Modulare Ausrüstungsartikel sind kein
neues Kaufangebot.

Die drei Belegarten sind enger als die gemeinsame Form:

- `initialize`: Sequenz 0, kein Vorgänger, kein Intent,
  `economy.source === null`.
- `purchase`: Sequenz größer 0, Vorgänger und genau ein passendes Intent,
  `economy === null`.
- `restore`: Sequenz größer 0, Vorgänger, kein Intent und ein
  `EconomicSnapshot`. `source` zeigt bei einem v3-Stand auf den Kopf seiner
  vollständigen Herkunftsclosure. `source:null` ist ausschließlich der leere
  wirtschaftliche Zielstand eines bewusst gewählten, validierten v1/v2-Backups:
  null Ausgaben und null bezahlte Artikel; Lernpunkte stammen weiterhin aus der
  Zielbasis.

Die Herkunft ist eine flache, ref-adressierte DAG. Sie bettet keine frühere
Historie rekursiv in einen neuen Beleg ein. Mehrere Restorebelege und portable
Backups können daher dieselben gehashten Objekte teilen. Die Quellbindung darf
bei einem bewussten Restore von der Zielbindung abweichen. Jede Quellkette wird
unter ihrer eigenen gespeicherten `Binding` geprüft. Drive-Steuerdateien oder
lokale Journale der Quelle werden nicht übernommen.

Bei derselben Binding darf `proof:null` direkt auf bereits erreichbare
unveränderliche Objekte zeigen. Bei einer fremden Binding ist `proof` Pflicht.
Er verweist auf ein im Ziel-Inhaltsordner gespeichertes portables
Herkunftsmanifest. So benötigt ein leeres Folgegerät keinen Zugriff auf das
ursprüngliche Google-Konto und keine der dortigen physischen Datei-IDs.

`assertIntent(value)`, `assertReceipt(value)` und
`assertEconomicSnapshot(value)` prüfen die exakten Formen und geben Kopien
zurück.

## Vollständige Ledger-Basis

`packBasis(ledger, reserve)` validiert zuerst mit `assertLedger`, serialisiert
das vollständige Ledger kanonisch und zerlegt es an Unicode-Grenzen in Teile
von höchstens 64 KiB UTF-8. `reserve` wird nacheinander so aufgerufen:

```text
await reserve({kind:'basis-part', index:0}) -> Id
...
await reserve({kind:'basis', index:null}) -> Id
```

Rückgabe:

```text
PackedBasis = {
  ref:Ref,
  manifest:BasisManifest,
  parts:[{ref:Ref, value:BasisPart}, ...]
}

BasisManifest = {
  version:1,
  kind:'basis',
  datasetId:Id,
  byteLength:positiveSafeInteger,
  ledgerHash:Sha256,
  parts:[Ref, ...]
}

BasisPart = {
  version:1,
  kind:'basis-part',
  index:nonNegativeSafeInteger,
  count:positiveSafeInteger,
  content:string
}
```

`readBasis(ref, read)` ruft `await read(id)` für Manifest und Teile auf, hasht
jeden gelesenen Wert erneut, prüft Reihenfolge, Anzahl, Gesamtlänge,
Ledgerhash, kanonische Darstellung, Datensatzbindung und `assertLedger` und
liefert das Ledger als Kopie.

Intern und für die Übergabe an Replay wird die vollständig belegte Form
verwendet:

```text
BasisRecord = {
  ref:Ref,
  manifest:BasisManifest,
  parts:[{ref:Ref, value:BasisPart}, ...],
  ledger:Ledger
}
```

`readBasisRecord(ref, read)` liefert diese Form; `verifyBasisRecord(record)`
prüft sie erneut. Ein `BasisRecord` ist kein frei behauptetes Ledger: Manifest,
Teile, Ledgerhash und Ledgerinhalt müssen gemeinsam stimmen.

## Portabler Herkunftsnachweis

Die ursprünglichen logischen Refs und Bodies werden niemals umgeschrieben.
Für einen fremden Restore werden identische Bodies unter neu reservierten
physischen Datei-IDs abgelegt:

```text
ProofManifest = {
  version:1,
  kind:'proof-manifest',
  binding:Binding,
  head:Ref,
  objects:[{logical:Ref, stored:Ref}, ...]
}

ProofRecord = {
  ref:Ref,
  manifest:ProofManifest,
  objects:[{logical:Ref, stored:Ref, value:JSON}, ...]
}
```

`logical.sha256`, `stored.sha256` und der Hash von `value` müssen identisch
sein. Nur die physische ID ändert sich. Das Manifest selbst ist kanonisch
gehasht. Es enthält exakt die vollständige Quellclosure aus Belegen,
Basismanifesten und Basisteilen. Enthält die Quelle bereits fremde
Restoreherkunft, gehören außerdem deren unveränderte Proofmanifeste und
physische Mappingobjekte zur Closure. Dadurch kann ein weiteres Zielgerät die
verschachtelte Herkunft allein aus seinen neu reservierten physischen IDs
rekonstruieren. Lokale Jobs, Tokens und Pointer gehören nie zur Closure.

```text
await packProof({
  binding:Binding,
  head:Ref,
  objects:[{ref:logicalRef, value:originalValue}, ...]
}, reserve) -> ProofRecord
```

`reserve` erhält für kopierte Objekte `{kind:'proof-object', index}` und zuletzt
`{kind:'proof-manifest', index:null}`. Sämtliche IDs müssen neu und eindeutig
sein. `verifyProofRecord(record)` prüft Manifesthash, exakte Zuordnungen und
beide Inhaltshashes.

## Kaufvorschau

```text
purchaseOffer({ledger, economic, profileId, articleId}) -> {
  version:1,
  datasetId:Id,
  epochId:Id,
  profileId:Id,
  articleId:string,
  catalogVersion:1,
  price:nonNegativeSafeInteger,
  earnedPoints:nonNegativeSafeInteger,
  spentPoints:nonNegativeSafeInteger,
  availablePoints:nonNegativeSafeInteger
}
```

`economic` ist die Rückgabe von `replayHistory` oder
`readHistory(...).projection`. Die Funktion akzeptiert nur eine eindeutige,
vollständige aktive Epoche und dasselbe Dataset/dieselbe aktive Epoche wie die
wirtschaftliche Projektion. `earnedPoints` kommt ausschließlich aus
`project(ledger)`. Ausgaben ändern das Ledger, den Lernpunktestand, das Level
und die Reise nicht.

Für eine Entwicklungsform muss die direkte Vorgängerstufe vorhanden sein.
Bei Stufe 2 genügt die durch Start/Level oder Kauf verfügbare Grundfigur. Preis,
Katalogversion, vorhandener Besitz und verfügbares Guthaben werden neu geprüft.

## Replayform, Provenienz und Rückgabe

```text
Entries = {
  head:Ref,
  values:[{ref:Ref, value:Receipt}, ...],
  proofs:[ProofRecord, ...]
}

replayHistory({
  entries:Entries,
  bases:[BasisRecord, ...],
  binding:Binding
}) -> Promise<EconomicProjection>
```

`entries.values` ist die deduplizierte vollständige Closure aus Zielkette und
allen über `economy.source.head` erreichbaren Quellketten. Zusätzliche,
nicht erreichbare Belege oder Basen sind ein Fehler. Die Reihenfolge der Arrays
ist bedeutungslos. `head` bestimmt die Zielkette. `entries.proofs` enthält
genau die von erreichbaren fremden Restorekanten referenzierten Nachweise;
fehlende oder zusätzliche Proofrecords sperren Replay.

```text
EconomicProjection = {
  version:1,
  binding:Binding,
  coordinatorId:Id,
  head:Ref,
  sequence:nonNegativeSafeInteger,
  activeEpochId:Id,
  basis:Ref,
  accounts:{
    [profileId]:{
      profileId:Id,
      earnedPoints:nonNegativeSafeInteger,
      spentPoints:nonNegativeSafeInteger,
      availablePoints:nonNegativeSafeInteger,
      purchasedArticleIds:[string, ...],
      entitledFigureIds:[Id, ...],
      entitledEvolutionIds:[string, ...]
    }
  },
  receipts:[{
    ref:Ref,
    operationId:Id,
    operation:'initialize'|'purchase'|'restore',
    sequence:nonNegativeSafeInteger,
    datasetId:Id,
    epochId:Id
  }, ...]
}
```

Die Replayprüfung ist iterativ und prüft vor wirtschaftlicher Projektion:

1. vollständige Erreichbarkeit und Kreisfreiheit der `previous`- und
   `source.head`-Kanten;
2. SHA-256 jedes Belegs und jedes Basisobjekts;
3. lückenlose Sequenz jeder Zielkette, Datasetbindung und einen konstanten
   `coordinatorId` je vollständiger Binding;
4. eindeutige Operations-IDs innerhalb derselben Binding und unveränderte
   Intents;
5. eindeutige aktive Ledger-Epochen und Übereinstimmung mit dem Beleg;
6. bei Käufen Erhaltung aller früher aktiven Fakten, unveränderte Daten für
   vorhandene Ereignis-IDs und keine neue Antwort-ID für einen bereits
   belegten Profil/Runde/Ordinal-Platz; ein Kauf muss außerdem die aktive
   Epoche seines direkten Vorgängers erhalten;
7. jeder Restore aktiviert innerhalb seiner Zielbindung eine neue, dort noch
   nie verwendete Epoche; die aktuelle oder eine frühere Zielepoche darf nicht
   reaktiviert werden;
8. bei v3-Restore fachliche Gleichheit von Quelle und Ziel nach Entfernung nur
   der Dataset-/Epochenhülle; danach werden Ausgaben und Besitz aus der
   Quellprojektion übernommen und gegen die echten Punkte der Zielbasis geprüft;
9. bei fremder Binding ein gehashtes Proofmanifest, das exakt alle logisch
   erreichbaren Quellbelege, Basisdateien und gegebenenfalls verschachtelten
   Proofartefakte auf unveränderte Bodies unter neuen physischen Refs abbildet.

Die vollständige `receipts`-Liste bleibt erhalten. Es gibt keine 64-Beleg-Grenze
und keine automatische Löschung oder Verdichtung.

## Iteratives Lesen und Cache

```text
Cache = {
  version:1,
  head:Ref|null,
  values:[{ref:Ref, value:JSON}, ...]
}

await readHistory({
  head:Ref,
  read:async (id:Id) => JSON,
  cache:Cache,
  binding:Binding,
  onProgress:({phase:'receipts'|'bases', verified:number, total:number|null}) => void
}) -> {
  entries:Entries,
  bases:[BasisRecord, ...],
  projection:EconomicProjection,
  cache:Cache
}
```

Jeder verwendete Cachewert wird vor Verwendung neu gehasht. Die Lesung läuft
iterativ und gibt spätestens nach je 32 geprüften Objekten an die Eventloop
zurück. Ein neuer Kopf muss den in `cache.head` zuletzt geprüften Zielkopf über
seine `previous`-Kette erweitern. Eine bloße Herkunftskante genügt dafür nicht.
Alternative, abgeschnittene oder hashabweichende Ketten sperren.

Beim fremden Restore liest `readHistory` zuerst das über den Restorebeleg
erreichbare Proofmanifest, dann ausschließlich dessen neue physische
`stored.id`-Dateien. Daraus stellt es die ursprünglichen logischen Refs und
gegebenenfalls ältere Proofmanifeste samt deren Mapping-IDs für das Replay
wieder her. Auch bei A→B→C müssen weder die ursprünglichen A- noch die
physischen B-Datei-IDs erreichbar sein; C verwendet ausschließlich neu
reservierte C-Datei-IDs.

Der Cache ist ausschließlich Lesebeschleunigung. Seine IDs verleihen niemals
Schreibberechtigung.

## Dauerhafter Commerce-Zustand

```text
PurchaseConfig = {
  version:1,
  kind:'purchase-config',
  binding:Binding,
  descriptorHash:Sha256,
  coordinatorId:Id,
  contentFolderId:Id
}

Commerce = {
  version:1,
  mode:'inactive'|'migrating'|'active'|'blocked',
  binding:Binding|null,
  configRef:Ref|null,
  config:PurchaseConfig|null,
  head:Ref|null,
  cache:Cache,
  setup:SetupJob|null,
  control:ControlJob|null,
  jobs:[PurchaseJob, ...],
  selection:[{profileId:Id, figureId:Id, stage:1|2|3|4}, ...]
}
```

`emptyCommerce()` liefert eine neue unabhängige Form mit `mode:'inactive'`,
allen optionalen Werten `null`, leerem Cache, leeren Jobs und leerer Auswahl.
`assertCommerce(value)` prüft exakte Felder, Modusvollständigkeit, eindeutige
Profil-/Operations-/Versuchs-IDs und gibt eine Kopie zurück. `active` und
`blocked` benötigen Binding, Config, Configref und Kopf; `migrating` benötigt
Binding und Setup.

```text
SetupJob = {
  version:1,
  operationId:Id,
  phase:Phase,
  binding:Binding,
  descriptorHash:Sha256,
  coordinatorId:Id|null,
  contentFolderId:Id|null,
  configRef:Ref|null,
  config:PurchaseConfig|null,
  etag:string|null,
  pointerProperties:null|{[key:string]:string}
}

PurchaseJob = {
  version:1,
  intent:Intent,
  status:'open'|'confirmed'|'rejected'|'superseded',
  attempts:[Attempt, ...]
}

Attempt = {
  version:1,
  attemptId:Id,
  phase:Phase,
  head:Ref|null,
  etag:string|null,
  candidate:Ref|null,
  pointerProperties:null|{[key:string]:string},
  uploads:[{ref:Ref, value:JSON}, ...]
}

ControlJob = {
  version:1,
  operationId:Id,
  operation:'initialize'|'restore',
  phase:Phase,
  epochId:Id|null,
  head:Ref|null,
  etag:string|null,
  candidate:Ref|null,
  pointerProperties:null|{[key:string]:string},
  uploads:[{ref:Ref, value:JSON}, ...]
}

Phase = 'intent'|'reserved'|'uploaded'|'pointer-pending'|'reconciling'|
        'confirmed'|'rejected'|'superseded'
```

In Phase `intent` sind Kopf, ETag und Kandidat null, `uploads` ist leer. Ab
`reserved` sind der gelesene Ausgangskopf und ein nichtleerer ETag dauerhaft
gespeichert. `candidate` zeigt auf einen Kauf-Receipt innerhalb `uploads`,
`candidate.previous` ist exakt der gespeicherte Ausgangskopf und sein Intent
ist exakt das unveränderliche Intent des zugehörigen Kaufauftrags. `uploads`
enthält exakt den Receipt, sein Basismanifest und sämtliche darin geordnet
referenzierten Teile, keine zusätzliche Datei. Diese persistierte Closure ist
die einzige Schreibmenge des Versuchs. Jeder Transport-/Service-Schritt muss
vor einem Upload zusätzlich `digest(value) === ref.sha256` prüfen. Weder Cache,
fremde Provenienz noch ein importiertes Backup können Schreib-IDs ergänzen.

`pointerProperties` hält spätestens vor `pointer-pending` den vollständigen
Kopfpointerbody einschließlich fremder unveränderter Eigenschaften. Ein
ausdrücklicher Wiederholungsversuch verwendet ausschließlich diesen Body und
die ursprüngliche opake ETag. `ControlJob` hält Initialisierung und Restore
getrennt von Kaufintents; es kann höchstens einen solchen Steuerauftrag geben.
Ein nicht abgeschlossener Steuerauftrag sperrt Käufe. `initialize` hat auch ab
`reserved` keinen Ausgangskopf, `restore` dagegen exakt den bestätigten alten
Kopf. Die Belegfolge bewahrt alle abgeschlossenen Operationskennungen.

Der Einrichtungsauftrag hält bis `uploaded` noch keinen Pointerbody. Vor dem
ersten Pointerversand werden die vollständigen privaten Eigenschaften des
Bestandsordners einschließlich Configref in `pointerProperties` und die dazu
gehörende opake Bedingung in `etag` dauerhaft gespeichert. In
`pointer-pending` und `reconciling` sind beide Pflicht. Der Body bindet
Produktmarker, Datensatz und exakt `configRef`; fremde vorhandene Properties
bleiben Teil desselben gespeicherten Bodies.

## Fehlercodes

Die reinen Module verwenden mindestens:

- `invalid`: falsche oder zusätzliche Felder, ungültige Werte;
- `version`: unbekannte Version;
- `reference`: ungültige interne Referenz;
- `collision`: gleiche Identität mit abweichender Bedeutung oder verdrängte
  Antwortidentität;
- `integrity`: Hash, Länge oder Inhalt stimmt nicht;
- `binding`: Konto/Ordner/Datensatz/Koordinator-Kontext passt nicht;
- `history`: fehlende, abgeschnittene oder alternative Kette/Basis;
- `cycle`: Kreis in Beleg- oder Herkunftsgraph;
- `incomplete`: kein eindeutiger vollständiger Fachstand;
- `price`: eingefrorener Preis passt nicht zum Katalog;
- `entitlement`: Artikel kostenlos, schon vorhanden oder Vorgänger fehlt;
- `funds`: echte Punkte reichen nicht oder bestätigte Ausgaben übersteigen sie.

Transportfehler ergänzen später eigene Codes, verändern diese fachlichen Codes
aber nicht.

## Gebundener Drive-Transport

`createPurchaseTransport({fetchImpl,getToken,binding,descriptorHash})` bindet
jeden Netzwerkzugriff an die vollständige bestehende `Binding` und den
unveränderten Hash der Datensatzbeschreibung. `getToken` wird ausschließlich
zur Laufzeit aufgerufen. Das zurückgegebene Objekt ist eingefroren und stellt
folgende Formen bereit:

```text
await accountId() -> accountId
await reserveId() -> Id
await readFolder({id, kind:'dataset'|'coordinator'|'content', config?})
  -> FolderSnapshot
await createFolder({kind:'coordinator'|'content', setup}) -> FolderSnapshot
await readImmutable(ref, {kind:'descriptor'|'config'|'content', config?})
  -> JSON
await writeImmutable({ref,value,kind:'config'|'content',config,authorization})
  -> JSON
await putPointer({snapshot,configRef?,head?,headValue?,authorization})
  -> {id,status} | {id,status:null,unchanged:true}

FolderSnapshot = {
  id:Id,
  name:string,
  mimeType:string,
  parents:[Id, ...],
  properties:{[key:string]:string},
  version:string,
  etag:string
}
```

Jeder gebundene HTTP-Schritt nimmt genau einen Laufzeit-Token auf, prüft mit
diesem Token das aktuell angemeldete Drive-Konto und verwendet denselben Token
für den davon abhängigen Request. Ein später notwendiger Tokenwechsel beginnt
einen neuen gebundenen Schritt; Tokens werden nie gespeichert. Ordner werden
durch zwei V2-Metadatenreads kohärent gelesen; unveränderliche JSON-Dateien
durch Metadaten-, Medien- und zweiten Metadatenread. Die starke ETag bleibt als
opaker String unverändert. Fehlende, schwache oder während der Lesung geänderte
ETags/Versionen sperren den Schritt.

Die vorhandene Datensatzbeschreibung ist ausschließlich lesbar als
`{id:binding.descriptorFileId,sha256:descriptorHash}`. Sie muss Kind,
Datensatz, Elternordner und Inhaltshash unverändert erfüllen. Neue
Kaufprotokollobjekte verwenden den Markerwert `vokabeltrainer-purchases`.
Koordinationsordner, Inhaltsordner und unveränderliche Dateien binden in ihren
privaten Properties stets:

```text
app:'vokabeltrainer-purchases'
kind:'coordinator'|'content'|'config'
datasetId
descriptorFileId
descriptorHash
coordinatorId
contentFolderId
```

Unveränderliche Dateien binden zusätzlich `sha256`. Der Elternordner beider
Kaufordner ist der bestehende Bestandsordner; der Elternordner aller
unveränderlichen Kaufobjekte ist der konfigurierte Inhaltsordner. Ein Ref darf
für `readImmutable` lesend entdeckt werden. Das verleiht niemals
Schreibberechtigung.

`writeImmutable` akzeptiert ausschließlich eine der beiden Autorisierungen:

```text
{kind:'setup', setup:SetupJob}
{kind:'attempt', commerce:Commerce, operationId:Id, attemptId:Id}
```

Beim Setup müssen Ref und Body exakt `setup.configRef` und `setup.config` sein.
Bei einem Kaufversuch müssen Ref und Body exakt einem Upload des durch
`operationId`/`attemptId` gefundenen, vollständig validierten Commerce-Jobs
entsprechen. Vor jedem Kaufupload wird außerdem die Config gegen ihre Ref
gehasht, die exakt gleiche Configref am Bestandsordner frisch nachgelesen und
der unveränderliche Configbody erneut vollständig geprüft. Receipt und Intent
müssen zum gebundenen Datensatz, Receipt zum konfigurierten Koordinationsordner
und das Basismanifest ebenfalls zum Datensatz gehören. Unmittelbar vor dem
POST wird der eigentliche Uploadbody erneut gehasht. Eine freie
ID, ein Cacheeintrag, ein gelesener Remote-Ref oder ein Aufruferobjekt ist keine
Schreibautorität. Nach einem Create wird die Datei unabhängig vom HTTP-Status
vollständig nachgelesen. Ein 409 nach möglichem Antwortverlust ist nur dann
erfolgreich, wenn Eltern, Marker, vollständige Konfiguration und Inhaltshash
exakt stimmen.

`putPointer` kennt zwei getrennte Formen. Die Einrichtung schreibt
`configRef` einmalig in den bestehenden Bestandsordner und verlangt einen
Setupjob in Phase `pointer-pending`. Der PUT verwendet ausschließlich dessen
gespeicherte `pointerProperties` und ursprüngliche `etag`; ein aktueller
Ordnersnapshot darf diese Werte nicht ersetzen. Configbody und Ref werden vor
dem Versand erneut gelesen und gehasht. Unabhängig von einem optional
übergebenen Snapshot liest der Transport den Bestandsordner außerdem selbst
frisch und gebunden. Eine bereits vollständige gleiche Referenz ist nach dieser
Prüfung unverändert erfolgreich; eine andere oder teilweise Referenz wird ohne
PUT abgelehnt. Die frische Lesung ersetzt weder den gespeicherten PUT-Body noch
dessen ursprüngliche ETag. Ein Kaufkopfschritt schreibt nur in den Koordinationsordner
und verlangt:

```text
putPointer({
  snapshot:FolderSnapshot,
  head:Attempt.candidate,
  headValue:der gespeicherte Receipt-Body,
  authorization:{kind:'attempt',commerce,operationId,attemptId}
})
```

Der Versuch muss `pointer-pending` sein, Kandidat und Body müssen exakt dem
gespeicherten Receipt entsprechen, der Bodyhash wird erneut geprüft und die
Snapshot-ETag muss exakt `Attempt.etag` sein. Vor dem PUT wird dieselbe frisch
nachgelesene installierte Configautorität wie beim Upload geprüft. Die Rückgabe
eines HTTP-200 ist kein Kaufabschluss; Service und Bootstrap lesen den Pointer
anschließend neu.
Initialisierung und Restore verwenden entsprechend
`authorization:{kind:'control',commerce,operationId}`. Der Transport akzeptiert
nur den exakten `Commerce.control`, dessen gespeicherte Uploadclosure,
Konfigurationsbindung, Receiptoperation und Kandidatenpointer. Steueraufträge
werden nicht als Kaufjobs ausgegeben.

Vor jedem Metadaten-PUT werden alle vorhandenen privaten Properties erhalten.
Es gelten höchstens 30 private Properties und höchstens 124 UTF-8-Bytes für
Schlüssel plus Wert jedes Eintrags. Eine Überschreitung erzeugt `limit`, bevor
der PUT gesendet wird.

## Eindeutige Einrichtung

```text
await prepareBootstrap({
  transport,binding,descriptorHash,operationId,persist
}) -> SetupJob

await resumeBootstrap({transport,setup,persist,repeatPointer?:boolean})
  -> SetupJob // confirmed oder weiterhin pointer-pending/reconciling
```

`persist(nextSetup)` ist ein injizierter, dauerhafter Callback. Er erhält stets
eine Kopie; eine Ablehnung beendet den Ablauf vor dem davon abhängigen
Schreibzugriff. `prepareBootstrap` prüft Konto, Beschreibung und Bestandsordner,
reserviert anschließend Koordinationsordner, Inhaltsordner und Config-ID,
erstellt die gehashte vollständige Config und persistiert den Setupjob in Phase
`reserved`. Bis dahin gibt es keinen Drive-POST oder -PUT.

`resumeBootstrap` arbeitet nur mit diesem validierten gespeicherten Job. Die
beiden Ordner sowie die Config werden unter denselben IDs wiederholbar erzeugt
und vollständig nachgelesen. Nach den Uploads wird `uploaded` persistiert. Vor
dem ersten Pointer-PUT werden ein frischer kohärenter Ordnerstand, dessen
vollständiger resultierender Propertybody und die ETag als `pointer-pending`
gespeichert. Nach Erfolg, 412 oder unklarer Antwort wird `reconciling`
gespeichert und der Bestandsordner zuerst erneut gelesen.

Ein nach Neustart bereits `pointer-pending` oder `reconciling` gespeicherter
Auftrag führt beim gewöhnlichen `resumeBootstrap` ausschließlich Reads aus.
Fehlt weiterhin ein vollständiger Gewinner, bleibt die Phase unklar. Nur die
ausdrückliche Option `repeatPointer:true` sendet nochmals exakt den gespeicherten
Propertybody mit exakt der ursprünglichen ETag. Eine zwischenzeitliche fremde
Metadatenänderung liefert deshalb 412 und wird nicht durch eine frische
Bedingung umgangen. Auch danach entscheidet ausschließlich das erneute Lesen;
es wird weder eine neue Configref noch ein neuer Pointerkandidat erzeugt.

Der Bestandsordner behält seine bestehenden Properties und erhält genau:

```text
purchaseApp:'vokabeltrainer-purchases'
purchaseConfigId:ConfigRef.id
purchaseConfigSha256:ConfigRef.sha256
```

Bei konkurrierender Einrichtung entscheidet ausschließlich die vollständig
nachgelesene Configref samt gehashtem Configbody. Der Verlierer übernimmt deren
`coordinatorId`, `contentFolderId`, `configRef` und `config` in seinen
bestätigten Setupstand; seine eigenen unreferenzierten Dateien verleihen keine
Wirkung. Die Configref wird nie ersetzt. Erst nach dieser Prüfung wird
`confirmed` persistiert und zurückgegeben.

## Dauerhafter Kaufdienst

```text
createPurchaseService({commands,transport,sync,now,id,onStatus}) -> {
  prepareActivation, confirmActivation,
  refresh, preview, confirm, resume,
  getStatus, getView, select,
  prepareRestore, confirmRestore
}
```

`commands.commitExternal(next,expectedHash)` bleibt der einzige lokale
Schreibweg. Vorschauen binden den vollständigen lokalen Zustand und den
bestätigten Kopf; eine Änderung vor `confirm` erzeugt `stale`, ohne einen
Kaufauftrag anzulegen. Jeder weitere Übergang wird einzeln gespeichert. Nach
`pointer-pending` und `reconciling` liest `refresh` ausschließlich. Nur
`confirm`, `confirmActivation`, `confirmRestore` oder ein ausdrückliches
`resume(operationId)` dürfen den exakt gespeicherten Pointerbody mit der exakt
gespeicherten ETag senden beziehungsweise wiederholen.

Der injizierte Task-4-Port hat folgende Grenze:

```text
sync.prepareActivationCandidate({state,control,input,history,reserve})
sync.prepareRestoreCandidate({state,control,input,history,reserve})
  -> {epochId,candidate,uploads}

sync.applyConfirmedControl({state,control,history}) -> ProductState
```

Vor `prepare*Candidate` ist der `ControlJob` in Phase `intent` dauerhaft
gespeichert. Die Candidate-Ports dürfen nur die vollständige gehashte Closure
vorbereiten; sie veröffentlichen keine Epoche und keinen Formatmarker. Der
Aktivierungszielstand muss aus `control.uploads` und der vollständig geprüften
Historie wiederherstellbar sein. Erst wenn der neue gemeinsame Kopf vollständig
nachgelesen wurde, ruft der Dienst `applyConfirmedControl` auf und speichert
dessen Ergebnis gemeinsam mit dem bestätigten Commerce-Kopf. Ein fehlender Port
schließt den Ablauf mit `not-ready`; der Shop wird in diesem Paket nicht
automatisch sichtbar. Markerabsichten gehören in den dauerhaften Produkt-Outbox
oder in eine später ausdrücklich validierte Schemaerweiterung, nie nur in RAM.
