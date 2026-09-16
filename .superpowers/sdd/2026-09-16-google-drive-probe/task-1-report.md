# Task 1 Report: Drive- und Anmeldeschicht

Stand: 16.09.2026
Branch: `codex/google-drive-probe`

## Ergebnis

Die abgegrenzte Drive- und Anmeldeschicht ist implementiert. Der Drive-Client verwendet ausschließlich feste Google-API-Ursprünge, holt für jeden HTTP-Aufruf ein aktuelles Zugriffstoken und validiert Antworten vor der Weitergabe. Datei- und Ordneranlagen verwenden vom Aufrufer vorab gespeicherte IDs. Nach erfolgreicher Anlage und nach HTTP 409 werden Metadaten geprüft; bei JSON-Dateien wird zusätzlich der Inhalt zurückgelesen und logisch, unabhängig von Objektschlüssel-Reihenfolgen, verglichen.

Die GIS-Sitzung hält das Zugriffstoken ausschließlich in einer Modul-Closure im RAM. Sie fordert nur `https://www.googleapis.com/auth/drive.file` mit `include_granted_scopes:false` an, startet `requestAccessToken()` synchron im `connect()`-Aufruf, berücksichtigt eine Ablaufmarge und verwirft verspätete Rückrufe nach `disconnect()`.

## RED-Belege

1. Der im Plan genannte Aufruf

   `node --test --test-isolation=none tests/drive/*.test.js`

   endete vor Testausführung mit Exitcode 1, weil Node.js 22.23.2 die Option nur unter dem Namen `--experimental-test-isolation=none` anbietet (`bad option: --test-isolation=none`).

2. Der kompatible Aufruf

   `node --test --experimental-test-isolation=none tests/drive/*.test.js`

   endete vor der Implementierung mit Exitcode 1. Beide Testdateien meldeten erwartungsgemäß `ERR_MODULE_NOT_FOUND` für `src/drive/auth.js` beziehungsweise `src/drive/client.js`.

3. Bei der Selbstprüfung wurde der separate GIS-Fehlerkanal ergänzt. Der gezielte Test

   `node --test --experimental-test-isolation=none --test-name-pattern='GIS error callback' tests/drive/auth.test.js`

   endete zunächst mit Exitcode 1 und `error_callback is not a function`. Damit war belegt, dass Popupfehler über den echten GIS-Vertrag noch nicht behandelt wurden.

## GREEN-Belege

- Nach Ergänzung des GIS-Fehlerkanals bestand der gezielte Test: 1 Test, 1 bestanden, 0 fehlgeschlagen.
- Der anschließende vollständige Lauf `npm test` bestand: 33 Tests, 33 bestanden, 0 fehlgeschlagen, Exitcode 0.
- `git diff --check` endete ohne Ausgabe und mit Exitcode 0.

Der finale vollständige Lauf vor dem Commit bestand ebenfalls: `npm test` meldete 33 bestandene, 0 fehlgeschlagene Tests bei Exitcode 0. Die anschließenden Syntaxprüfungen für beide Produktionsmodule und `git diff --check` endeten ebenfalls mit Exitcode 0.

## Öffentliche Schnittstellen für Task 2

```js
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
export class DriveError extends Error { /* code, optional status */ }
export function createDriveClient({getToken, fetchImpl = fetch});
// -> {accountId, generateId, listFiles, metadata, readJson, createFolder, putJson}
export function createTokenSession({oauth2, clientId, now = Date.now});
// -> {connect, getToken, disconnect}
```

Alle Drive-Client-Methoden sind asynchron. `getToken()` der Sitzung ist synchron und gibt das aktuelle Token zurück oder wirft. `disconnect()` löscht den lokalen Sitzungszustand synchron; ein GIS-Revoke wird anschließend bestmöglich ausgelöst. Öffentliche Fehlercodes sind:

| Code | Bedeutung |
| --- | --- |
| `auth` | Zugriff fehlt, ist abgelaufen oder HTTP 401 |
| `permission` | Scope fehlt oder HTTP 403 |
| `missing` | HTTP 404 |
| `retryable` | HTTP 408, 429 oder 5xx; Aufrufer entscheidet über begrenzte Wiederholung |
| `invalid` | ungültige Eingabe oder malformed API/GIS response |
| `conflict` | paralleles Verbinden oder vorhandene Datei stimmt nicht mit der erwarteten unveränderlichen Datei überein |
| `network` | Fetch ist ohne verwertbare HTTP-Antwort fehlgeschlagen |

`status` ist nur bei einem HTTP-Fehler gesetzt. Fehlermeldungen sind für die Oberfläche begrenzt und enthalten weder Antworttext noch Token. Task 2 kann `fetchImpl` und `oauth2` für Browserprüfungen an der externen Grenze ersetzen; Produktionszustand und Browserstorage bleiben außerhalb dieser Adapter.

## Geänderte Task-1-Dateien

- `package.json`
- `src/drive/client.js`
- `src/drive/auth.js`
- `tests/drive/client.test.js`
- `tests/drive/auth.test.js`
- `.superpowers/sdd/2026-09-16-google-drive-probe/task-1-report.md`

Parallel vorhandene Änderungen an Projekt- und Einrichtungsdokumenten stammen nicht aus Task 1 und werden nicht in diesen Commit aufgenommen.

## Abgedeckte Verträge und Fehlerszenarien

- Kontobindung ausschließlich über `about.get` und `user(permissionId)`, ohne E-Mail-Abfrage.
- Vorab erzeugte, URL-sichere Drive-Datei-ID.
- Vollständige Pagination; unvollständige oder strukturell fehlerhafte Suchantworten werden abgewiesen.
- Metadatenabfrage mit ID, Name, MIME-Typ, Elternordnern, App-Eigenschaften und Papierkorbstatus.
- Ordneranlage mit stabiler ID und Verifikation nach Erfolg oder 409.
- Multipart-JSON-Anlage mit stabiler ID; Rücklesen und Verifikation von Metadaten und Inhalt nach Erfolg oder 409.
- Konflikt bei gleicher ID mit abweichendem Namen, MIME-Typ, Elternordner, App-Eigenschaften oder JSON-Inhalt.
- Logische JSON-Gleichheit unabhängig von der Reihenfolge von Objektschlüsseln.
- Kein automatischer unbegrenzter Wiederholungsversuch; 408/429/5xx werden als wiederholbar klassifiziert, Netzwerkfehler separat gemeldet.
- Sichere Fehlercodes ohne Übernahme von Antworttexten, Tokens oder GIS-Fehlerbeschreibungen.
- Frisches Token pro HTTP-Aufruf; 401 wird als erneute Anmeldung behandelt.
- GIS-Konfiguration, fehlende Berechtigung, fehlendes Token, ungültige Ablaufzeit, Zugriffsablehnung, Popupfehler, paralleles Verbinden, Ablaufmarge, Trennung und verspätete Rückrufe.

## Selbstprüfung

- **Tokenablage:** Keine Verwendung von `localStorage`, `sessionStorage`, IndexedDB, Cookies, URLs oder Dateien. Das Token existiert nur im Closure-Zustand von `createTokenSession` und wird beim Ablauf oder Trennen entfernt.
- **Antwortvalidierung:** Konto-, ID-, Listen-, Metadaten- und JSON-Antworten werden strukturell geprüft. Ungültige und unvollständige Antworten werden nicht als leerer oder erfolgreicher Stand behandelt.
- **Wiederholungssemantik:** Der Adapter erzeugt innerhalb eines Schreibaufrufs nie eine Ersatz-ID und wiederholt Uploads nicht automatisch. Nach 409 wird ausschließlich die angeforderte ID gelesen und geprüft. Nach einem Netzwerkfehler bleibt die Wiederholung mit derselben, vom Aufrufer persistent gehaltenen ID Aufgabe des Controllers aus Task 2.
- **Testqualität:** Die Tests prüfen beobachtbare Rückgaben, Fehlercodes, URLs, Uploadkörper und die Anzahl tatsächlicher externer Aufrufe. Erwartungswerte sind als unabhängige Fixtures formuliert; nur die externen HTTP- und GIS-Grenzen sind ersetzt.
- **Mutationsprüfung:** Entfernte Pagination, wiederverwendete Tokens, ungeschützte IDs, ausgelassene Rückleseprüfung, erneuter Upload nach 409, persistierte/zu spät angenommene Tokens sowie fehlende GIS-Popupfehlerbehandlung würden jeweils mindestens einen Test brechen.

## Grenzen und offene Nachweise

- Es wurde kein echtes Google-Konto verwendet und kein realer Netzwerkaufruf ausgeführt.
- Die tatsächliche OAuth-/Drive-Interoperabilität und das Verhalten auf iPhone/iPad bleiben Bestandteil der späteren externen Probe.
- Node.js 22.23.2 benötigt für prozesslose Testisolation noch die Option `--experimental-test-isolation=none`. Das npm-Skript verwendet deshalb diese auf der festgelegten Mindestversion verfügbare Schreibweise; sie umgeht zugleich die bekannte `spawn EPERM`-Beschränkung der Arbeitsumgebung.
