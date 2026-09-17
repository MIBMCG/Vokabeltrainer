# Datenformat der technischen Probe

Stand: 17.09.2026. Dieses Format gehört ausschließlich zur synthetischen Verbindungsprobe. Es ist kein freigegebenes Sicherungs- oder Migrationsformat des späteren Vokabeltrainers. Die konkreten Prüfregeln liegen in `src/probe/model.js` und `src/probe/controller.js`.

## Lokaler Zustand

IndexedDB verwendet die Datenbank `vokabeltrainer-verbindungsprobe`, Version 1, den Objektspeicher `probe-state` und den Schlüssel `current`. Ein exklusiver Web Lock schützt den Zustand vor gleichzeitigen Schreibern in mehreren Tabs. Ein Speichervorgang gilt erst nach Abschluss seiner Transaktion als erfolgreich.

| Feld | Inhalt |
| --- | --- |
| `version` | Formatversion 1 |
| `clientId` | Öffentliche OAuth-Web-Client-ID, kein Geheimnis |
| `scope` | `null` oder die feste Bindung `{accountId, folderId}` |
| `events` | Bekannte synthetische Antwort- und Rücksetzereignisse |
| `pendingUploads` | Noch nicht bestätigte Ereignisse, mit `eventId` und nach Zuteilung stabiler `fileId` |
| `lastConfirmedUpload` | `null` oder `{eventId, fileId}` für den bewussten Wiederholungstest |
| `pendingFolder` | `null` oder `{id, accountId, name}` für eine wiederholbare Ordneranlage |
| `pendingReset` | `null` oder lokal vorbereitete Sicherung und Rücksetzung mit stabilen Datei-IDs und Bestätigungsstatus |

Unbekannte Felder, Versionen und beschädigte Beziehungen werden abgewiesen. Eine fehlgeschlagene Validierung darf den vorhandenen Zustand nicht durch einen leeren ersetzen. Tokens liegen ausschließlich in der Anmeldesitzung im Arbeitsspeicher; kein Token, Passwort oder Client-Secret gehört in diese Struktur.

Ein Browserprofil bleibt in dieser begrenzten Probe an seinen gewählten Bestand gebunden. Es gibt keine Bestandsverwaltung und keinen automatischen Ordnerwechsel. Für einen anderen unabhängigen Testbestand kann ein separates Browserprofil verwendet werden. Das verhindert, dass alte Ereignisse in einen neuen Ordner gelangen.

## Ereignisse

Eine künstliche richtige Antwort hat exakt diese Felder:

```json
{"version":1,"kind":"answer","id":"answer-example","epoch":"initial","correct":true}
```

Eine leere Rücksetzung hat diese Form:

```json
{"version":1,"kind":"reset","id":"reset-example","parentEpoch":"initial","epoch":"epoch-example","baseAnswers":[],"previousAnswerIds":["answer-example"],"backupFileId":"backup-example"}
```

Die Beispiele zeigen Platzhalter, keine vorhandenen Drive-Dateien. Fachliche IDs entstehen unabhängig vom Netz. Drive-Datei-IDs werden vor der jeweiligen Mutation erzeugt und lokal festgeschrieben. Eine Antwort zählt anhand ihrer fachlichen ID einmal; dieselbe ID mit abweichendem Inhalt ist ein Fehler.

`initial` ist die Ausgangsgeneration. Eine Rücksetzung kennt die vorherige Generation und die darin bereits berücksichtigten Antworten. Noch unbekannte alte Antworten bleiben als verspätete Antworten separat erhalten. Konkurrierende Rücksetzungen erzeugen einen sichtbaren Konflikt; die Probe bietet noch keine Auswahl eines Gewinners. Zyklen oder doppelte Zielgenerationen sind beschädigte Daten.

## Drive-Dateien und Bestätigung

Der sichtbare Probeordner trägt `appProperties.vtProbe = "1"`. Je Ereignis entsteht eine unveränderliche JSON-Datei `event-<Ereignis-ID>.json`. Ihre Eigenschaften enthalten `vtProbe`, `vtKind = "event"`, `vtAccountId`, `vtFolderId` und `vtEventId`. Die Metadaten und der Inhalt müssen zum gewählten Konto/Ordner passen.

Vor einer Rücksetzung wird der bekannte Ereignissatz als separate Datei `backup-<Reset-ID>.json` gesichert. Ihr Inhalt enthält `version`, `kind = "backup"`, `scope` und `events`; Metadaten verwenden `vtKind = "backup"` und `vtResetId`. Der Drive-Adapter liest Inhalt und Metadaten nach dem Schreiben zurück und vergleicht sie, bevor er Erfolg meldet. Erst anschließend darf das Rücksetzereignis veröffentlicht werden. Alte Dateien werden nicht gelöscht.

Bei einer verlorenen Übertragungsantwort wird dieselbe Datei-ID erneut verwendet. „Lokal gespeichert“, „Upload ausstehend“ und „Upload bestätigt“ bleiben unterschiedliche Zustände. Browserdaten und Google-Anmeldungen werden nicht über GitHub übertragen.

Das spätere Produktformat braucht zusätzliche Regeln für Profile, Inhalte, Lernereignisse, Sicherungsimport und Migration. Diese dürfen nicht aus dem vereinfachten Probeformat als bereits implementiert abgeleitet werden.
