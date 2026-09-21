# Task 2 – unabhängige Spezifikations- und Qualitätsprüfung

Stand: 21.09.2026. Prüfbereich: bereitgestellter Diff `5904dec..ebe3914` einschließlich Dokumentationscommit `a540e0b`; direkte Prüfung von `transport.js`, `bootstrap.js`, HTTP-Fixture und fokussierten Tests. Zur ausdrücklich benannten Autoritätsgrenze wurden außerdem die tatsächlich aufgerufenen Schema-/Value-Helfer gelesen. Kein allgemeines Integrationsreview, keine Produktänderung, keine zusätzlichen Agenten.

**Spezifikationsurteil: Änderungen erforderlich. Qualitätsurteil: Änderungen erforderlich.** Vier wichtige Befunde verhindern die Task-2-Freigabe. Keine Critical- oder zusätzlichen Minor-Befunde.

## Important 1 – Wiederaufnahme sendet ungeklärten Einrichtungspointer automatisch mit neuer Bedingung

**Ort:** `src/trainer/purchases/bootstrap.js:133` und `:148` (Ablauf `:123–164`).

`resumeBootstrap` berücksichtigt die gespeicherte Phase nicht, sobald im nachgelesenen Bestandsordner noch kein Gewinner sichtbar ist. Auch ein ursprünglicher `pointer-pending`-/`reconciling`-Auftrag läuft wieder durch Upload, wird auf `uploaded` zurückgesetzt und erhält vor dem nächsten PUT die frisch gelesene ETag. Eine ausdrückliche Wiederholungsentscheidung existiert nicht. Das verletzt die bindende Vorgabe „Unbekannter Ausgang bleibt unbekannt. Neustart liest zuerst; Pointerwiederholung ausschließlich ausdrücklich und mit identischem gespeichertem Kandidaten und ETag.“

Gezielt reproduziert: erster PUT wirft vor beobachtbarer Anwendung einen Netzwerkfehler; gespeichert bleibt `reconciling`. Anschließend wird die Ordner-ETag durch eine synthetische Fremdänderung geändert. Ein gewöhnliches `resumeBootstrap` sendet einen zweiten PUT und bestätigt die Einrichtung. Bedingungen: zuerst `"opaque/strong:token"`, danach `"changed-between-restarts"`.

**Korrektur:** Wiederaufnahme nach möglichem Versand zuerst ausschließlich abgleichen; ohne Gewinner unklar bleiben. Einen ausdrücklich angeforderten Wiederholungsweg mit ursprünglichem Kandidaten und ursprünglicher ETag schaffen. Den gespeicherten vollständigen Pointerauftrag so erhalten, dass kein neuer PUT aus einer frischen Snapshotbedingung konstruiert wird. Test für verlorene/nicht eindeutig angewandte Antwort, weiterhin fehlenden Pointer und Fremdänderung zwischen Neustarts ergänzen. Der vorhandene Antwortverlusttest `tests/trainer/purchases-transport.test.js:134` deckt nur bereits angewandten und beim Nachlesen sichtbaren Erfolg ab.

## Important 2 – Konfigurationsreferenz erteilt Schreibautorität ohne Inhalts-/Installationsbindung

**Ort:** `src/trainer/purchases/transport.js:404–415`, verwendet durch `:484–496` und `writeImmutable`.

`attemptAuthorization` prüft `commerce.binding` und den Descriptorhash, verwendet `commerce.configRef` jedoch überhaupt nicht. `assertCommerce` prüft lediglich Form und gemeinsame Anwesenheit von `configRef`/`config`; weder Konfigurationshash noch installierte Referenz werden verifiziert. Der Vergleich in Zeile 496 vergleicht zwei aus demselben Eingabeobjekt gewonnene Konfigurationen und fügt keine unabhängige Bindung hinzu.

Gezielt reproduziert: ein sonst unveränderter synthetischer Kaufauftrag erhält `configRef = {id:'uninstalled-config', sha256:'f'.repeat(64)}`. `putPointer` sendet den Schreibzugriff und liefert HTTP200. Die Referenz gehört weder zum gespeicherten Configbody noch zum installierten Anker. Damit ist die ausdrücklich verlangte vollständige konfigurierte Bindung einschließlich exakter Configref nicht an der Schreibgrenze durchgesetzt; beschädigte oder vertauschte persistierte Zustände können weiterhin Pointer schreiben.

**Korrektur:** Configbody gegen seine gespeicherte Ref rehashen und die Schreibkonfiguration an die vollständig verifizierte installierte Referenz binden. Diese Autorität muss aus dem überprüften Anker/dauerhaften Auftrag stammen, nicht aus beliebigen Cacheeinträgen. Negativfälle für falschen Hash, andere Ref-ID bei gleichem Configbody und ausgetauschten Ordnerverbund ergänzen. Der Transport darf hierfür eine explizite vertrauenswürdige Konfigurationsbindung erhalten; die konkrete API-Abstimmung liegt beim Controller.

## Important 3 – Persistierter Receiptbody ist nicht an die konfigurierte Belegfolge gebunden

**Ort:** `src/trainer/purchases/transport.js:404–415` und `:488–495`.

Ein Upload muss in `Attempt.uploads` stehen und der Pointerkandidat wird erneut gehasht. Es fehlt aber die Beziehung zwischen Beleginhalt und Transportkonfiguration: insbesondere `receipt.coordinatorId === commerce.config.coordinatorId` und Datensatzgleichheit von Auftrag/Beleg/Basis zum gebundenen Datensatz. Die Schemahelfer prüfen die innere Form und die Übereinstimmung zwischen Intent und Receipt, jedoch keine Beziehung zum äußeren Commerce-Datensatz oder zur konfigurierten Koordinations-ID.

Gezielt reproduziert: allein die Receipt-Koordinations-ID auf `foreign-coordinator` gesetzt und den gespeicherten Kandidaten korrekt neu gehasht. Mit unveränderter echter Konfiguration, Configref und ETag akzeptiert `putPointer` den Beleg als neuen Kopf des ursprünglichen Koordinationsordners (HTTP200). Ein formell gültiger, aber falsch gebundener gespeicherter Auftrag kann dadurch die gemeinsame Historie unlesbar machen und Käufe sperren. Die spätere History-Prüfung ersetzt die erforderliche Ablehnung vor dem Schreiben nicht.

**Korrektur:** Vor Upload und Pointer die fachlichen Bindungsfelder aller autorisierten Kandidaten gegen die vollständig geprüfte Konfiguration prüfen; für Kaufbeleg und Basismodell insbesondere Datensatz und Koordinations-ID. Negative Tests mit gültig neu gehashten, aber falsch gebundenen Bodies ergänzen. Dieser Befund verlangt keine vorgezogene Service-/Restoreimplementierung.

## Important 4 – Kontoprüfung und tatsächlicher Request verwenden verschiedene Tokenabfragen

**Ort:** `src/trainer/purchases/transport.js:219–221`, zusammen mit `request` ab `:180`.

`boundRequest` ruft zunächst `accountId()` auf. Dessen `request` liest das aktuelle Token. Der anschließende eigentliche `request` fragt `getToken` erneut ab. Wechselt das verbundene Konto zwischen diesen beiden Abfragen, wird Konto A geprüft, die reservierende/schreibende Netzoperation aber mit Token B ausgeführt. Insbesondere bei einem Ordner, auf den beide Konten Zugriff haben, verhindert die Dateibindung diesen Fehler nicht.

Gezielt reproduziert: `getToken` liefert für `/about` `token-account-a`, für `generateIds` `token-account-b`. `/about` bestätigt Konto A; `reserveId` akzeptiert anschließend `reserved-in-b`. Derselbe Helfer wird für POST und PUT eingesetzt.

**Korrektur:** Pro gebundener Operation einmal ein Laufzeit-Token aufnehmen, genau dieses Token auf das konfigurierte Konto prüfen und für den abhängigen Request verwenden. Bei notwendigem Tokenwechsel erneut mit demselben neuen Token prüfen. Keine Tokenpersistenz einführen. Einen synthetischen Kontowechsel zwischen beiden Schritten testen.

## Positive Befunde

- Keine Probeimporte, kein künstliches Guthaben, keine neue Produkt-/Cloudaktivierung in diesem Paket.
- Persist-Callbacks werden vor dem davon abhängigen initialen Pointerversand abgewartet; IDs und Configbody werden vor initialen Erstellungen dauerhaft übergeben.
- Opaque ETags bleiben erhalten. Ordnerreads vergleichen zwei Metadatenstände; unveränderliche Inhalte werden zusätzlich vor/nach dem Contentread gebunden und gehasht.
- Unveränderliche POSTs rehashen den Body; 409 wird erst nach gebundenem vollständigem Nachlesen akzeptiert.
- Kaufpointer verlangen den gespeicherten Receiptkandidaten, gespeicherte ETag und `pointer-pending`. Ein bloßer entfernter Cacheeintrag gewährt keine Autorisierung: maßgeblich sind `Attempt.uploads` und die Task-1-Strukturprüfungen.
- Properties bleiben bei regulären Snapshots erhalten; 30-Einträge-/124-UTF-8-Byte-Grenzen werden vor PUT geprüft. API-Rückgaben und Speicherübergaben sind Kopien.
- Die echte Google-/Geräteabnahme wird im Bericht korrekt offengelassen.

## Tatsächliche Verifikation und Grenzen

Die gemeldeten **12/12 Fokusfälle und 403/403 Produkttests wurden nicht erneut ausgeführt**. Testdatei und synthetische HTTP-Grenze wurden gelesen. Ein eng begrenzter zusätzlicher Probeaufruf über PowerShell-Here-String nach `node --input-type=module` importierte ausschließlich die vorhandenen Task-2-Module/Fixture, erzeugte synthetische Daten und untersuchte die vier oben beschriebenen konkreten Zweifel. Exitcode 0; beobachtete Ausgabe:

```text
unknown outcome network reconciling 1
ordinary resume confirmed PUT attempts 2 conditions ["\"opaque/strong:token\"","\"changed-between-restarts\""]
wrong config reference accepted { id: 'reserved-1', status: 200 }
foreign receipt coordinator accepted { id: 'reserved-1', status: 200 }
token switch accepted reserved-in-b [{"operation":"account-check","token":"Bearer token-account-a"},{"operation":"reserve","token":"Bearer token-account-b"}]
```

Die Kaufkandidaten entsprechen dabei dem synthetischen Strukturmuster des vorhandenen Pointertests; die Probe ist ausdrücklich ein Autoritätsgrenzentest, kein Beleg für erfolgreiche wirtschaftliche Integration. Keine echte Google-Anfrage, keine Browserdaten oder produktiven Profile. Keine Implementierungsdatei geändert; nur dieser Bericht angelegt. Vorhandene Controlleränderung an der Fortsetzungsübergabe erhalten.

## Vom Controller weiterzuführen

1. Die vier Task-2-Befunde korrigieren und unabhängig fokussiert nachprüfen, bevor die Transportgrenze als bestanden gilt.
2. Task 3 muss die vorhandenen Task-1-Minors sowie Initialisierungs-/Restore-Persistenz und deren Pointerautorisierung ausarbeiten. Deren Abwesenheit wurde hier nicht als Task-2-Fehler gewertet.
3. Service/Commands müssen die injizierten Persistenzverträge atomar erfüllen und nach HTTP200 vollständige Historie/Reconciliation durchführen. Die zusätzlichen Negativfälle dieses Berichts in die Integration übernehmen.
4. Die Gesamtintegration einschließlich Produktpunktgrundlagen, Migration, Cache-/Updatepfad und realer Geräteabnahme bleibt späteren Gates vorbehalten.
