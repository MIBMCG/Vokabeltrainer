# Spezifikation: Shop-Probe v5 mit kohärentem Drive-v2-Kandidaten

Stand: 20.09.2026. Diese Spezifikation beschreibt ausschließlich eine isolierte technische Probe. Sie ändert weder Produktdaten noch Google-Konto, Berechtigungsumfang, Anbieter oder Kostenmodell. Der Produktshop bleibt unabhängig vom lokalen Prüfergebnis gesperrt, bis ein echter Lauf über den konkret beschriebenen Browser-/HTTP-Pfad ausgewertet ist.

## 1. Ausgangsbefund und Hypothese

Diagnoseversion 4 liest für den Modus `v2-json` eine starke ETag aus `drive/v2`, verwendet sie aber anschließend für bedingte `drive/v3`-Schreibanfragen. Im echten Lauf wurden bei Initialisierung und Kaufkonkurrenz jeweils beide Schreibversuche angenommen. Dieser gemischte Vertrag ist damit widerlegt.

Google dokumentiert die Datei-ETag als Feld der Drive-v2-Dateiressource; in der v2-/v3-Vergleichstabelle ist `Files.etag` für v3 als entfallen ausgewiesen. Der nächste Kandidat hält deshalb alle **koordinierten Lese- und Bedingungsschreibwege** innerhalb Drive v2. Das ist eine begründete Hypothese, keine bereits nachgewiesene Servergarantie.

Die allgemeine Google-Data-Protokolldokumentation beschreibt starke ETags, `If-Match` und `412 Precondition Failed`. Sie dient nur als Protokollhinweis. Erst der echte Drive-Lauf darf zeigen, ob der aktuelle Drive-v2-Endpunkt diese Bedingung im verwendeten Browserpfad tatsächlich exklusiv erzwingt.

## 2. Umfang und feste Grenzen

- Neuer ausdrücklich auswählbarer Modus: `v2-coherent`.
- Die bisherigen Modi `media`, `metadata` und `v2-json` bleiben unverändert und werden nicht automatisch auf den neuen Transport umgeleitet.
- Der neue Modus erhält einen eigenen Transportbaustein. Gemeinsame Szenariologik darf wiederverwendet werden; Legacy-HTTP-Wege werden nicht umgebaut.
- Die Probe erzeugt weiterhin nur neue, klar bezeichnete synthetische Dateien nach bewusster Anmeldung, Checkbox und Startaktion.
- `drive.file`, vorhandene öffentliche OAuth-Client-ID und In-Memory-Tokenverwaltung bleiben unverändert.
- Kein automatischer Retry eines unklar ausgegangenen Bedingungsschreibens, kein versionsloser Fallback und kein Wechsel auf einen anderen Modus.
- `productReady` bleibt immer `false`.
- Keine Produktmodule unter `src/trainer/`, keine Produktdaten, keine Altbestände und keine persönlichen Browserprofile werden geöffnet oder geändert.
- Probe-Dateien werden nicht automatisch gelöscht.

## 3. Ehrliche API-Grenze

Der Name `v2-coherent` bezeichnet nur die koordinierte Versionsklammer:

- stabile Metadaten-/Inhaltslesung über Drive v2;
- starke ETag aus derselben Drive-v2-Dateiressource;
- bedingte Inhalts- und Metadatenschreibung über Drive v2.

Die unveränderte Dateianlage darf weiterhin Drive v3 verwenden:

```text
GET  /drive/v3/files/generateIds?count=1&space=drive&type=files
POST /drive/v3/files?fields=id
POST /upload/drive/v3/files?uploadType=multipart&fields=id
```

Diese Anlage wird nicht als Compare-and-swap ausgegeben. Ihre Wiederholbarkeit beruht weiterhin auf vorab erzeugter Datei-ID, `409 Conflict` und anschließendem Bindungs-/Inhaltsvergleich. Diagnose 5 nennt v3-Anlage und v2-Koordination getrennt.

## 4. Drive-v2-Metadaten und Bindung

Der neue Transport liest für jede eigene Probe-ID:

```http
GET https://www.googleapis.com/drive/v2/files/{id}?fields=id,title,mimeType,parents,properties,labels,version,etag
Authorization: Bearer <access-token>
```

Die Antwort wird in eine interne, von der API-Darstellung getrennte Form normalisiert. Vor jedem Inhaltszugriff oder Schreiben gelten folgende Bedingungen:

- `id` entspricht exakt der in dieser Sitzung reservierten und intern gebundenen ID.
- `title` entspricht dem beim Anlegen festgehaltenen synthetischen Namen.
- `mimeType` ist für Ordner `application/vnd.google-apps.folder`, sonst `application/json`.
- `labels.trashed` ist exakt `false`.
- Bei einer erwarteten Eltern-ID enthält `parents` exakt einen `ParentReference` mit dieser ID. Ein String-Array aus v3 wird nicht als gültige v2-Antwort akzeptiert.
- Der oberste Probeordner wird ohne explizite Eltern-ID angelegt und landet laut Drive-Vertrag in „Meine Ablage“. Seine gelesene Wurzelreferenz ist gültig; eine leere Elternliste darf nicht vorausgesetzt werden. Auch diese Referenz bleibt ausschließlich intern.
- `properties` ist ein Array aus Objekten mit Stringfeldern `key` und `value` sowie `visibility: "PRIVATE"`. Öffentliche Properties und doppelte Schlüssel sind in diesen ausschließlich selbst angelegten Probedateien ungültig; dies ist bewusst kein allgemeiner Drive-Dateiadapter.
- Die privaten Eigenschaften `app=vokabeltrainer-shop-probe` und die aktuelle `runId` sind vorhanden und haben `visibility: "PRIVATE"`.
- `version` ist eine nichtnegative Dezimalzahl als String.
- `etag` entspricht einer starken HTTP-ETag in Anführungszeichen; fehlende, schwache oder fehlerhaft formatierte Werte ergeben `unsupported` vor jedem Bedingungsschreiben.

Zusätzliche gültige eigene Properties werden beim Metadatenupdate erhalten. Rohwerte von ID, ETag, Token oder unerwarteten Fehlertexten gelangen nicht in Diagnose oder Download.

## 5. Stabiler v2-Snapshot

Für eine JSON-Datei besteht ein Snapshot aus genau dieser Reihenfolge:

1. v2-Metadaten lesen und vollständig binden;
2. Inhalt über v2 lesen;
3. v2-Metadaten erneut lesen und vollständig binden;
4. nur fortfahren, wenn `etag` und `version` zwischen beiden Metadatenantworten identisch sind.

Der Inhaltsweg lautet:

```http
GET https://www.googleapis.com/drive/v2/files/{id}?alt=media
Authorization: Bearer <access-token>
```

Für einen Ordner werden zwei gebundene v2-Metadatenantworten verglichen; ein Medienabruf findet nicht statt. Eine Änderung von v2-ETag oder v2-Version während des Lesens ergibt weiterhin `stale` mit `reason: changed-during-read`. Die Read-Stability-Prüfung wird weder entfernt noch auf nur eine Kennung reduziert.

Die v3-Dateiversion gehört nicht zum neuen Modus. Ihr Wegfall aus dessen Snapshot ist keine Entschärfung: Der neue Modus liest und schreibt den koordinierten Zustand vollständig über v2. Die Legacy-Modi behalten ihre bisherigen v3-Prüfungen unverändert.

## 6. Bedingte Schreibwege

### Inhalt einer Probe-Kontodatei

```http
PUT https://www.googleapis.com/upload/drive/v2/files/{id}?uploadType=media&fields=id,etag,version
Authorization: Bearer <access-token>
Content-Type: application/json; charset=UTF-8
If-Match: "<starke-v2-etag>"

<vollständiges neues synthetisches Konto-JSON>
```

### Exklusive Koordinatorbindung am Probeordner

```http
PUT https://www.googleapis.com/drive/v2/files/{folderId}?fields=id,etag,version,properties
Authorization: Bearer <access-token>
Content-Type: application/json; charset=UTF-8
If-Match: "<starke-v2-etag>"

{
  "properties": [
    {"key":"app","value":"vokabeltrainer-shop-probe","visibility":"PRIVATE"},
    {"key":"runId","value":"<aktuelle-runId>","visibility":"PRIVATE"},
    {"key":"coordinator","value":"<eigene-Kandidaten-ID>","visibility":"PRIVATE"}
  ]
}
```

Die tatsächliche Implementierung baut das Properties-Array aus dem gebundenen Snapshot und erhält zusätzliche gültige Properties. Sie übernimmt niemals ungeprüfte IDs aus einer Antwort oder der Oberfläche.

Nur eine erfolgreiche 2xx-Antwort zählt transportseitig als angenommen. Danach müssen die Szenarien den Serverzustand unabhängig neu lesen; eine Erfolgsantwort allein erfüllt kein Szenario.

## 7. Fehler- und Wiederholungsvertrag

- `412` wird als `stale` klassifiziert. Für die Konkurrenzfälle muss genau ein Versuch angenommen und genau einer mit `stale` abgewiesen werden.
- `409` bleibt nur beim idempotenten Anlegen derselben vorab erzeugten ID ein erwartbarer Create-Konflikt; abweichender Inhalt bleibt `collision`.
- `401`, `403` und `404` bleiben `auth`, `permission` und `missing`.
- Fehlende oder nicht starke v2-ETag sowie ungültige v2-Bindungsdaten verhindern jeden PUT.
- Browser-/Netzfehler, `429` und `5xx` liefern keinen sicheren Kaufmisserfolg. Der Probeablauf darf keinen zweiten Vorgang erzeugen; das vorhandene Antwortverlust-Szenario liest denselben stabilen Vorgang nach.
- Ein Server, der `If-Match` ignoriert, beide PUTs annimmt oder trotz `412` den Inhalt verändert, muss die Probe rot lassen.

## 8. Diagnoseversion 5

Die Oberfläche ergänzt genau eine neue Option: „Drive v2 kohärent (Koordination)“. Sie erklärt sichtbar, dass die Anlage weiterhin v3 nutzt und dass ausschließlich die Koordinationswege v2-kohärent sind.

Der bereinigte Download heißt `shop-probe-bericht5.json` und enthält mindestens:

```json
{
  "diagnosticVersion": 5,
  "etagSource": "v2-coherent",
  "apiPaths": {
    "idReservation": "GET /drive/v3/files/generateIds",
    "create": "POST /drive/v3/files oder /upload/drive/v3/files",
    "metadataRead": "GET /drive/v2/files/{ownedId}?fields=...version,etag",
    "read": "GET /drive/v2/files/{probeFileId}?alt=media",
    "mediaUpdate": "PUT /upload/drive/v2/files/{probeFileId}?uploadType=media",
    "metadataUpdate": "PUT /drive/v2/files/{probeFolderId}",
    "condition": "If-Match"
  },
  "productReady": false
}
```

Feste Prüfpunkte, auf 0–2 begrenzte Zähler und bekannte Fehlerklassen bleiben erlaubt. Rohantworten, Headerwerte, Datei-IDs, ETags, Token und Google-Fehlermeldungen bleiben ausgeschlossen.

## 9. Lokale Gegenproben und REAL-Gate

Der synthetische v2-Fake muss die echte v2-Antwortform für `title`, `parents`, `properties`, `labels`, `version` und `etag` liefern. Die neuen roten Gegenproben prüfen mindestens:

1. falsche ETag ergibt `412`, Inhalt bleibt unverändert;
2. verbrauchte ETag ergibt `412`, erster Inhalt bleibt erhalten;
3. zwei parallele Inhalts-PUTs ergeben `accepted: 1`, `stale: 1`;
4. zwei parallele Ordner-PUTs ergeben `accepted: 1`, `stale: 1`;
5. ignoriertes `If-Match` bei Inhalt oder Ordner lässt das Gate fehlschlagen;
6. mutierendes `412` wird durch Nachlesen entdeckt;
7. geänderte v2-ETag oder v2-Version während des Snapshots verhindert Schreiben;
8. falsche Eltern, Papierkorbstatus, private Properties, Titel oder MIME-Typ ergeben `binding` und keinen PUT;
9. Legacy-Modi verwenden weiterhin ihre bisherigen GET-/PATCH-Pfade;
10. Browser-CORS-Harness erlaubt und beobachtet `PUT`, ohne Token oder IDs zu exportieren.

Erst danach folgt genau ein neuer echter Lauf mit bewusst ausgewähltem `v2-coherent`. Kein unveränderter Diagnose-4-Lauf wird wiederholt. Für einen positiven technischen Kandidaten müssen alle elf vorhandenen Szenarien bestehen, insbesondere:

- ungültige und verbrauchte ETag werden als `412/stale` abgewiesen;
- Initialisierung: `accepted: 1`, `stale: 1`;
- zwei Käufe: `accepted: 1`, `stale: 1`, genau ein Beleg und Restguthaben 200;
- Reset-Rennen und Antwortverlust bestehen nach unabhängiger Nachlese.

Auch ein vollständig grüner REAL-Lauf belegt nur den getesteten Endpunkt, Scope, Browserpfad und Zeitpunkt. Er ersetzt keine dokumentierte Google-Garantie, keine echte Leitungsunterbrechung, keine Zwei-Geräte-Abnahme, keine iOS-Abnahme und keine Prüfung von Produktmigration, Altclient, Backup oder echtem Lernstand. Erst nach Auswertung dieses Laufs darf ein gesonderter Produktintegrationsplan den Kandidaten übernehmen.

## 10. Primärquellen

- [Drive API v2: files.update](https://developers.google.com/workspace/drive/api/reference/rest/v2/files/update) – PUT für Metadaten sowie Upload-URI und `uploadType=media`.
- [Drive API v2: files.get](https://developers.google.com/workspace/drive/api/reference/rest/v2/files/get) – Metadaten und Inhalt mit `alt=media`.
- [Drive API v2: File-Ressource](https://developers.google.com/workspace/drive/api/reference/rest/v2/files) – `etag`, `version`, `parents`, `properties` und `labels.trashed`.
- [Drive API v2/v3 comparison](https://developers.google.com/workspace/drive/api/guides/v2-to-v3-reference) – v2-Datei-ETag ist in v3 nicht als File-Feld vorhanden.
- [Drive: Custom file properties](https://developers.google.com/workspace/drive/api/guides/properties) – v2-Form privater Properties mit `key`, `value`, `visibility: PRIVATE`.
- [Drive: Upload file data](https://developers.google.com/workspace/drive/api/guides/manage-uploads) – Medienupload und Fehlergrenzen.
- [Google Data Protocol: Resource versioning](https://developers.google.com/gdata/docs/2.0/reference) – nur Protokollhinweis zu starker ETag, `If-Match` und `412`; kein Ersatz für den Drive-REAL-Nachweis.
