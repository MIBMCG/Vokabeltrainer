# Task 2 – gebundener Produkttransport und eindeutige Einrichtung

Stand: 21.09.2026
Basis: `5904decdc73d150d0323caa8727e23fe51d5a61e`
Implementierungscommit: `ebe3914` (`feat(purchases): add bound durable transport`)

## Ergebnis

Der reine Produktkern besitzt jetzt einen an Konto, Bestandsordner,
Datensatzbeschreibung, Descriptorhash, Koordinationsordner und Inhaltsordner
gebundenen Drive-Transport. Die Einrichtung reserviert beide Ordner und die
Config-ID, persistiert den vollständigen Setupjob vor jedem Schreibzugriff und
installiert genau eine unveränderliche Configref. Antwortverlust und
konkurrierende Einrichtung werden ausschließlich durch Nachlesen des
ursprünglichen Jobs beziehungsweise der vollständigen Gewinnerconfig geklärt.

Der Produktcode importiert keine Module aus `src/shop-probe/`. Es gab keine
echten Google-Aufrufe, keine UI-Aktivierung und keine Änderung an Lernpunkten,
Galerie oder Service Worker.

## TDD-Nachweis

### RED

Erster Fokuslauf vor Produktimplementierung:

```text
node --test --experimental-test-isolation=none tests/trainer/purchases-transport.test.js
```

Ergebnis: **0/1**, erwartetes `ERR_MODULE_NOT_FOUND` für
`src/trainer/purchases/transport.js`.

Nach der minimalen Implementierung deckte der Fokuslauf schrittweise die noch
fehlenden Grenzen auf:

- **4/9**: fünf Bootstrapfälle scheiterten zunächst an einem Fehler der neuen
  synthetischen Multipart-Fixture; die Uploadroute wurde vor die allgemeinere
  V3-POST-Route gestellt.
- **8/9**: die konkurrierende Einrichtung konnte die abweichenden Ordner-IDs
  der Gewinnerconfig noch nicht gebunden entdecken. Der reine Leseweg prüft
  nun zuerst Refhash und Basisbindung, anschließend den Configbody und danach
  rückwirkend die vollständige Eltern-/Ordnerbindung.
- **10/11**: der neue Negativfall für eine vom gespeicherten Setup abweichende
  Pointer-ETag wurde unerwartet akzeptiert. `putPointer` verlangt seitdem Phase
  `pointer-pending`, exakt `SetupJob.etag` und verweigert das Ersetzen einer
  bereits installierten Configref.
- **11/12**: ein Basismodellmanifest desselben Uploadsatzes wurde zwar
  abgewiesen, aber noch mit `invalid` statt an der vorgesehenen
  Autoritätsgrenze. Der Transport prüft nun explizit Kandidatenref, Receiptbody,
  Bodyhash, Phase und gespeicherte ETag und meldet die Abweichung als `binding`.

### GREEN

Letzter Fokuslauf:

```text
node --test --experimental-test-isolation=none tests/trainer/purchases-transport.test.js
```

Ergebnis: **12/12 bestanden**, **0 fehlgeschlagen**.

Vollständige Regression, einmal vor dem Implementierungscommit ausgeführt:

```text
npm test
```

Ergebnis mit Node.js **v26.8.2**: **403/403 bestanden**, **0 fehlgeschlagen**,
Dauer 22,69 s.

Weitere Prüfungen:

```text
node --check src/trainer/purchases/transport.js
node --check src/trainer/purchases/bootstrap.js
node --check tests/trainer/purchases-transport.test.js
node --check tests/trainer/purchases-http-fixture.js
npm run check:docs
git diff --cached --check
```

Ergebnis: alle Syntaxprüfungen ohne Ausgabe/Fehler; Dokumentprüfung mit
`errors: []` (1148 Dateien, 197 Markdown-Dateien, 916 lokale Links);
gestagter Diff ohne Whitespacefehler.

## Geänderte Dateien

- `src/trainer/purchases/transport.js`: gebundener V2/V3-HTTP-Transport,
  kohärente Metadatenreads, reservierte IDs, unveränderliche Uploads,
  einmaliger Configpointer und Kaufkopfpointer.
- `src/trainer/purchases/bootstrap.js`: persistierte Reservierung,
  wiederaufnehmbare Ordner-/Configerstellung, Pointerreconciliation und exakte
  Gewinnerübernahme.
- `tests/trainer/purchases-http-fixture.js`: ausschließlich synthetische
  Drive-Grenze mit opaken ETags, 409, 412 und gezieltem Antwortverlust.
- `tests/trainer/purchases-transport.test.js`: zwölf Transport-, Binding-,
  Konkurrenz-, Persistenz-, Limit- und Autoritätsfälle.
- `docs/KAUFPROTOKOLL.md`: Task-1-Freigabestatus aktualisiert und exakte
  Task-2-Schnittstellen ergänzt.

Die parallel geänderte
`docs/handoffs/2026-09-21-persistent-purchases-fortsetzung.md` wurde nicht
gestagt oder verändert.

## Exakte API-Formen für Task 3

```text
createPurchaseTransport({fetchImpl,getToken,binding,descriptorHash})
  -> Object.freeze({
       binding, descriptorHash,
       accountId, reserveId, readFolder, createFolder,
       readImmutable, writeImmutable, putPointer
     })

accountId() -> Promise<accountId>
reserveId() -> Promise<Id>

readFolder({id,kind:'dataset'|'coordinator'|'content',config?})
  -> Promise<FolderSnapshot>

createFolder({kind:'coordinator'|'content',setup:SetupJob})
  -> Promise<FolderSnapshot>

readImmutable(ref,{kind:'descriptor'|'config'|'content',config?})
  -> Promise<JSON copy>

writeImmutable({
  ref,value,kind:'config'|'content',config,
  authorization:
    {kind:'setup',setup:SetupJob}
    | {kind:'attempt',commerce:Commerce,operationId:Id,attemptId:Id}
}) -> Promise<JSON copy>

putPointer({
  snapshot,configRef,
  authorization:{kind:'setup',setup:SetupJob}
}) -> Promise<{id,status}|{id,status:null,unchanged:true}>

putPointer({
  snapshot,head,headValue,
  authorization:{kind:'attempt',commerce:Commerce,operationId:Id,attemptId:Id}
}) -> Promise<{id,status}>

prepareBootstrap({transport,binding,descriptorHash,operationId,persist})
  -> Promise<SetupJob phase='reserved'>

resumeBootstrap({transport,setup,persist})
  -> Promise<SetupJob phase='confirmed'>
```

`persist(nextSetup)` muss den übergebenen Setupjob dauerhaft und atomar
speichern; sein Reject stoppt den jeweils davon abhängigen Netzschritt. Der
Service übergibt für unveränderliche Kaufuploads den vollständigen validierten
Commerce-Zustand und für den Pointer zusätzlich exakt
`Attempt.candidate`/dessen gespeicherten Receiptbody. Der Transport hasht den
Body erneut und verlangt `Attempt.phase === 'pointer-pending'` sowie
`Attempt.etag === snapshot.etag`.

Die Einrichtung verwendet am bestehenden Produktordner ausschließlich
`purchaseApp`, `purchaseConfigId` und `purchaseConfigSha256`. Spätere Köpfe
werden ausschließlich im Koordinationsordner als `purchaseHeadId` und
`purchaseHeadSha256` geändert. Sämtliche fremden privaten Properties bleiben
erhalten; vor jedem Metadaten-PUT gelten 30 Properties und 124 UTF-8-Bytes je
Schlüssel-Wert-Paar.

## Selbstprüfung und Grenzen

- Vollständige konfigurierte Binding wird an jeder Netzgrenze geprüft; das
  aktuelle Konto wird für jeden Request neu gebunden.
- Starke ETags werden als opake Strings gespeichert und gesendet. Es gibt
  keine Versionsableitung oder cachebasierte Schreibautorität.
- Jeder unveränderliche Upload wird unmittelbar vor dem POST erneut gehasht.
  Ein 409 gilt nur nach vollständigem Metadaten-/Bodyread als Erfolg.
- Ein Pointer-HTTP-200 bestätigt weder Kauf noch Einrichtung allein; der
  Bootstrap liest neu. Task 3 muss denselben Abschlussgrundsatz im Service
  beibehalten.
- Restore-Pointerfelder sind bewusst nicht über `Commerce.jobs` modelliert.
  Der Controller hat sie Task 3 zugeordnet; Task 2 erzeugt dafür keine
  Kaufjob-Umdeutung.
- Keine offenen Task-2-Befunde in der Selbstprüfung. Reale Google-,
  Zwei-Geräte-, iPhone-/iPad- und HTTPS-Abnahmen bleiben unberührt offen.

## Korrekturrunde 1 nach unabhängiger Review

Stand: 21.09.2026
Fixbasis: `ebe39147004570f7fb0ee1a0c95d710c9020cafe`
Fixcommit: `c84b8bc` (`fix(purchases): bind durable transport authority`)

Die vier Important-Befunde aus
`.superpowers/sdd/2026-09-20-persistent-purchases/task-2-review.md` wurden als
fokussierte Autoritäts- und Wiederaufnahmegrenzen korrigiert. Es gab keine
echten Google-Aufrufe, keine UI-/Serviceaktivierung und keinen Push.

### RED-Nachweise

Alle Reproduktionen verwendeten:

```text
node --test --experimental-test-isolation=none tests/trainer/purchases-transport.test.js
```

Beobachtete Zwischenstände:

1. **12/13 bestanden, 1 fehlgeschlagen.** Der neue Fall
   `unclear bootstrap resume stays read-only until an explicit identical pointer repeat`
   fand `pointerProperties === undefined`. Damit war der exakte ursprüngliche
   PUT-Body nicht dauerhaft vorhanden; der alte Resumeweg hätte wieder mit
   einer frischen Bedingung gesendet.
2. **13/15 bestanden, 2 fehlgeschlagen.** Falscher Configref-Hash/andere
   Config-ID und eine korrekt rehashte Config mit ausgetauschtem Inhaltsordner
   wurden ohne erwartete `binding`-Ablehnung akzeptiert.
3. **15/18 bestanden, 3 fehlgeschlagen.** Korrekt rehashte Kandidaten mit
   fremder Receipt-Koordinations-ID, fremdem Intent-/Receipt-Datensatz und
   fremdem Basisdatensatz wurden ohne erwartete `binding`-Ablehnung akzeptiert.
4. **18/19 bestanden, 1 fehlgeschlagen.** Der Tokenwechselfall meldete
   `2 !== 1`: `/about` und `generateIds` verwendeten zwei getrennte
   `getToken`-Aufnahmen.

Für die notwendige Setup-Schemaerweiterung wurde zusätzlich ausgeführt:

```text
node --test --experimental-test-isolation=none --test-name-pattern="unclear setup" tests/trainer/purchases-contract.test.js
```

RED-Ergebnis: **0/1 bestanden**. Ein `reconciling`-Setup mit `etag:null` wurde
entgegen der erwarteten `invalid`-Ablehnung akzeptiert. Die davor ergänzten
Negativfälle für fremden Datensatz beziehungsweise abweichende Config-ID/Hash
im gespeicherten Pointerbody trafen dieselbe neue Schemagrenze.

### GREEN-Nachweis

Abschließender gemeinsamer Fokuslauf:

```text
node --test --experimental-test-isolation=none tests/trainer/purchases-transport.test.js tests/trainer/purchases-contract.test.js
```

Ergebnis: **32/32 bestanden**, **0 fehlgeschlagen**, Dauer 15,36 s. Darin:

- 19/19 Transport-/Bootstrapfälle einschließlich aller vier Reviewbefunde;
- 13/13 Vertragsfälle einschließlich der neuen exakten Setup-Pointerform;
- der vorhandene 1000-Transaktionen-Historienfall blieb grün.

Weitere tatsächliche Prüfungen:

```text
node --check src/trainer/purchases/schema.js
node --check src/trainer/purchases/transport.js
node --check src/trainer/purchases/bootstrap.js
node --check tests/trainer/purchases-contract.test.js
node --check tests/trainer/purchases-transport.test.js
node --check tests/trainer/purchases-http-fixture.js
npm run check:docs
git diff --check
git diff --cached --check
```

Ergebnis: alle Syntaxprüfungen ohne Fehler; Dokumentprüfung mit `errors: []`
(1149 Dateien, 198 Markdown-Dateien, 917 lokale Links); Arbeits- und gestagter
Diff ohne Whitespacefehler. Gemäß Controllerauftrag wurde die breite
unveränderte Produktsuite in dieser Korrekturrunde nicht erneut ausgeführt; der
frühere Stand bleibt 403/403 auf `ebe3914`.

### Geänderte Verträge

`SetupJob` enthält zusätzlich:

```text
pointerProperties:null|{[key:string]:string}
```

In `pointer-pending` und `reconciling` sind `pointerProperties` und die
ursprüngliche nichtleere `etag` Pflicht. Der gespeicherte Body bindet
Produktmarker, Datensatz und exakt `configRef`; fremde vorhandene Properties
bleiben erhalten.

```text
resumeBootstrap({transport,setup,persist,repeatPointer?:boolean}) -> SetupJob
```

Bei einem gespeicherten `pointer-pending`/`reconciling` führt der Standardwert
`false` nur Reads aus. Fehlt ein Gewinner, bleibt der Auftrag unverändert
unklar. Nur `repeatPointer:true` sendet exakt `pointerProperties` mit exakt der
ursprünglichen ETag. Auch bei inzwischen geänderter Ordner-ETag wird keine neue
Bedingung übernommen; der synthetische Fall erhält 412 und bleibt
`reconciling`.

Die äußere Transport-API für Kaufuploads/-pointer bleibt gleich. Ihre
Autorisierung wurde verschärft:

- `digest(commerce.config) === commerce.configRef.sha256`;
- die exakt gleiche Configref muss frisch am Bestandsordner installiert sein;
- der unveränderliche Configbody wird frisch gelesen und muss exakt passen;
- Jobintent, Receipt und Basismanifest müssen zum gebundenen Datensatz gehören;
- der Receipt muss `commerce.config.coordinatorId` tragen;
- erst danach darf ein registrierter Body erneut gehasht und geschrieben
  beziehungsweise als Kopf verwendet werden.

Jeder gebundene HTTP-Schritt nimmt einmal einen Laufzeit-Token auf, prüft mit
genau diesem Token `/about` und verwendet denselben Token für den abhängigen
Request. Ein späterer Tokenwechsel beginnt einen neuen vollständig geprüften
Schritt. Kein Token wird gespeichert oder zurückgegeben.

### Selbstprüfung, Kosten und offene Grenzen

- Der gewöhnliche Bootstrap-Neustart kann einen unklaren Pointer nicht mehr
  senden. Die ausdrückliche Wiederholung erzeugt weder neue ID noch neuen Body
  noch neue ETag.
- Configautorität stammt aus Bestandsanker und unveränderlichem Configbody,
  nicht aus Cache, übergebenem Ref oder einem aus demselben Objekt abgeleiteten
  Vergleich.
- Fremde fachliche Binding bleibt auch bei formal gültigen und korrekt
  rehashten Bodies vor jedem Upload/Pointer gesperrt.
- Die frische Configautorisierung kostet je Kauf-Schreibgrenze fünf gebundene
  Drive-Reads (zwei Bestandsmetadatenreads plus Config-Metadaten/Body/Metadaten)
  und damit fünf zusätzliche `/about`-Prüfungen vor dem eigentlichen Write.
  Das ist der bewusst gewählte Preis für Autorität ohne Cachevertrauen; Task 3
  muss diese Latenz in Status/Bedienung berücksichtigen, darf die Prüfung aber
  nicht durch lokale Cacheautorität ersetzen.
- Keine offenen Befunde in der fokussierten Selbstprüfung. Initialisierungs-
  und Restore-Pointerjournale bleiben ausdrücklich Task 3; reale Google-,
  Geräte- und HTTPS-Abnahmen bleiben offen.

## Korrekturrunde 2 nach unabhängiger Fix-1-Review

Stand: 21.09.2026
Fixbasis: `c84b8bc`
Fixcommit: `cd6ba45a7b3cbdb5d852ddc8c1e58250cc547a8d`
(`fix(purchases): protect installed setup config`)

Der einzelne neue Important-Befund aus
`.superpowers/sdd/2026-09-20-persistent-purchases/task-2-fix1-review.md`
wurde an der Transport-Schreibgrenze korrigiert. Es gab keine echten
Google-Aufrufe, keine UI-/Serviceaktivierung, keinen Push und keine Änderung
des SetupJob-Schemas oder der öffentlichen Methodensignaturen.

### RED-Nachweis

Der neue Test
`snapshot-free setup pointer cannot replace an installed config ref` baut zwei
vollständig gültige Setups auf, installiert Config A, lädt Config B
unveränderlich hoch und bietet B anschließend ohne Caller-Snapshot mit der
aktuellen Root-ETag und einem formal gültigen Pointerbody an. Zusätzlich zählt
er die PUT-Aufrufe.

```text
node --test --experimental-test-isolation=none tests/trainer/purchases-transport.test.js
```

Beobachtetes RED-Ergebnis: **19/20 bestanden, 1 fehlgeschlagen**. Der Fall
meldete `Missing expected rejection`; der snapshotfreie Aufruf ersetzte den
installierten A-Anker. Gesamtdauer: 138,13 ms.

### GREEN-Nachweis

Nach der Korrektur wurde derselbe fokussierte Befehl erneut ausgeführt.
Ergebnis: **20/20 bestanden, 0 fehlgeschlagen**, Dauer 138,64 ms. Der neue Fall
belegt beide erlaubten Ausgänge nach vollständiger Configprüfung: Eine fremde
installierte Ref erzeugt `binding` ohne weiteren PUT; dieselbe installierte Ref
liefert `{id,status:null,unchanged:true}` ebenfalls ohne PUT.

Weitere tatsächliche Prüfungen:

```text
node --check src/trainer/purchases/transport.js
node --check tests/trainer/purchases-transport.test.js
npm run check:docs
git diff --check
git diff --cached --check
```

Ergebnis: beide Syntaxprüfungen ohne Fehler; Dokumentprüfung mit `errors: []`
(1151 Dateien, 200 Markdown-Dateien, 919 lokale Links); Arbeits- und gestagter
Diff ohne Whitespacefehler. Wie beauftragt wurde keine breite Suite erneut
ausgeführt.

### Genaue Transportsemantik und Selbstprüfung

`putPointer({snapshot?,configRef,authorization:{kind:'setup',setup}})` bleibt
unverändert. Vor einem Setup-PUT validiert der Transport jetzt immer den
gespeicherten Pointerbody und dessen Grenzen, hasht und liest die gebundene
unveränderliche Config vollständig und liest danach den Bestandsordner selbst
frisch und gebunden. Die Prüfung hängt nicht von `snapshot` ab:

- andere installierte Config-ID oder anderer Hash: `binding`, kein PUT;
- identische vollständige Ref: unverändert erfolgreich, kein PUT;
- noch kein Anker: der PUT verwendet weiterhin ausschließlich
  `setup.pointerProperties` und `setup.etag`.

Die frische Root-Lesung liefert niemals Schreibbody oder Schreibbedingung.
Damit behält auch eine ausdrückliche Wiederholung exakt ihre ursprünglich
persistierten Requesteigenschaften; eine inzwischen geänderte ETag führt beim
unveränderten PUT weiterhin sicher zu 412. Teilanker und fremde Appmarker
scheitern bereits in der gebundenen Ordnerprüfung.

Die zusätzliche Autoritätsprüfung kostet je möglichem Setup-Pointer zwei
Drive-Metadatenreads und zwei dazugehörige Laufzeitkontoprüfungen. Zusammen mit
der bereits verlangten vollständigen Configprüfung sind das vor einem
tatsächlichen Setup-PUT fünf gebundene Drive-Reads und fünf `/about`-Prüfungen.
Das betrifft nur Einrichtung beziehungsweise deren ausdrückliche Wiederholung;
es entsteht keine Cacheautorität und es wird kein Token gespeichert.

Fokussierte Selbstprüfung: Der Fix verändert weder Kaufpointer noch Uploads,
er übernimmt keine frische ETag und keinen frischen Rootbody in den Request,
und alle Ablehnungs-/Unchanged-Zweige liegen vor dem PUT. Keine offenen
technischen Bedenken in diesem Fixumfang. Restore- und
Initialisierungssteueraufträge bleiben Task 3; reale Google-, Geräte- und
HTTPS-Abnahmen bleiben offen.
