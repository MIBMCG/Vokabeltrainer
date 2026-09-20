# Kaufprotokoll: Verträge der reinen Kernmodule

**Nicht zur Integration freigegeben:** Die [Task-1-Review](reports/2026-09-20-persistent-purchases-task1-review.md) enthält vier wichtige offene Befunde. Dieser Zwischenvertrag wird bei der Fortsetzung korrigiert; keine Produktkäufe daran anschließen.

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
Basismanifesten und Basisteilen, keine lokalen Jobs, Tokens oder Pointer.

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
   belegten Profil/Runde/Ordinal-Platz;
7. bei v3-Restore fachliche Gleichheit von Quelle und Ziel nach Entfernung nur
   der Dataset-/Epochenhülle; danach werden Ausgaben und Besitz aus der
   Quellprojektion übernommen und gegen die echten Punkte der Zielbasis geprüft;
8. bei fremder Binding ein gehashtes Proofmanifest, das exakt alle logisch
   erreichbaren Quellbelege und Basisdateien auf unveränderte Bodies unter
   neuen physischen Refs abbildet.

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
`stored.id`-Dateien. Daraus stellt es die ursprünglichen logischen Refs für das
Replay wieder her. Die ursprünglichen Drive-IDs müssen nicht erreichbar sein.

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
  etag:string|null
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
  uploads:[{ref:Ref, value:JSON}, ...]
}

Phase = 'intent'|'reserved'|'uploaded'|'pointer-pending'|'reconciling'|
        'confirmed'|'rejected'|'superseded'
```

In Phase `intent` sind Kopf, ETag und Kandidat null, `uploads` ist leer. Ab
`reserved` zeigt `candidate` auf den Receipt innerhalb `uploads`. `uploads`
enthält exakt den Receipt, sein Basismanifest und sämtliche darin geordnet
referenzierten Teile, keine zusätzliche Datei. Diese persistierte Closure ist
die einzige Schreibmenge des Versuchs. Jeder Transport-/Service-Schritt muss
vor einem Upload zusätzlich `digest(value) === ref.sha256` prüfen. Weder Cache,
fremde Provenienz noch ein importiertes Backup können Schreib-IDs ergänzen.

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
