# Task 10 – vollständige Sicherung und sichere Wiederherstellung

Stand: 18.09.2026. Implementiert auf `codex/vokabeltrainer-v1` in **`ee506629d027e51cb4ff59253945ae77ff6c9447`**, Commit `feat: restore complete backups through verified epochs`. Fachlicher Ausgangspunkt: geprüfter Task-9-Code `37c459f`. Die Änderungen des Controllers an Entscheidungen und Task-11-Brief sind separat erhalten. Kein Push, Merge, Hosting oder echter Google-Zugriff.

## Implementiert

Das portable JSON-Format exportiert die vollständige Fachhistorie einschließlich noch ausstehender und separat liegender alter Ereignisse. Lokale PIN-Prüfwerte, Antworttexte, Bindung, Konto, `datasetSetup`, `packetIntegrity`, Sitzungen und Transportaufträge bleiben ausgeschlossen. Import prüft exakte Schlüssel, Version, 25-MiB-/100.000-Ereignis-Grenzen, Ereignisgrenzen, Referenzen, Herkunftsgraphen, Sicherungsauswahl und SHA-256. Snapshot-Hashes umfassen genau die referenzierten Ereignisse; neue unabhängige Tatsachen ändern bestehende Snapshothashes nicht.

Wiederherstellung ist eine persistierte Zustandsfolge mit stabilen Datei-IDs: synchronisieren, lokale Sicherheitskopie speichern/rücklesen, gebunden zusätzlich Teile und Sicherheitsmanifest hochladen/rücklesen, Vorschau, ausdrückliche Bestätigung, erneute Aktualitätsprüfung, Snapshotteile, Manifest, Steuer-Epoche, atomare lokale Aktivierung. Jeder Netzschreibversuch hat zuvor persistierte IDs/Inhalte. Die Tests starten Commands/Restore nach verlorenen Manifest- und Epochenantworten sowie nach einem Speicherabbruch neu; dieselben Versuche werden fortgesetzt. Runden der alten Epoche enden ohne Bonus. Eine bereits in der neuen Epoche begonnene Runde bleibt beim Wiederanlauf erhalten.

Die Syncschicht verarbeitet Steuer-Epochen unabhängig von normalen Ereignispaketen und übernimmt sie erst mit vollständigen Snapshots. Teile sind einschließlich Hülle höchstens 64 KiB. Fehlende, beschädigte oder mehrdeutige Inhalte aktivieren keine Epoche. Lokale Offline-Restores behalten ihren Null-Manifestverweis unverändert; vor erster Cloudanlage werden die zugehörigen Teile/Manifeste geprüft und die Datei-Zuordnung getrennt in `snapshotManifests` gespeichert. Ein zweites Gerät löst den Null-Verweis im gebundenen Ordner auf. Fremde Backups werden nur über die bestätigte Vorschau auf die Zielidentität neu verankert; historische Epochen werden keine aktiven fremden Wurzeln. Kollisionen bleiben Fehler.

Späte Offlineantworten bleiben getrennt. Explizite Adoption referenziert Original-IDs, übernimmt historische Referenzen nur als Support und erzeugt keine zweite Wertung. Inhaltsauswahl darf einen sichtbaren Konflikt erzeugen; Abschlussauswahl ohne alle zugehörigen wirksamen oder mitausgewählten Antworten wird abgewiesen. Zwei Restore-Nachfolger erfordern alle aktuellen Köpfe und eine ausdrücklich ausgewählte Kopfprojektion; die Auswahl erstellt erst eine gesicherte Vorschau, aktiviert also nicht sofort.

Nichtleerer ungebundener Bestand kann nach lokaler Sicherheitskopie und expliziter Auswahl durch einen geprüften Drive-Bestand ersetzt werden. Vorschau und Bestätigung vergleichen lokalen und entfernten Stand; ein Neustart entwertet die flüchtige Joinvorschau. Der entfernte Bestand wird hierfür ohne Generierung/Upload eigener Lernereignisse vorgelesen. Sicherheitskopien sind lokal auflistbar/herunterladbar; neue Geräte übernehmen geprüfte Drive-Sicherheitskopien mit tatsächlichem Exportdatum. Kein automatisches Löschen.

## Schnittstellen für Task 11

Die exakten Rückgaben stehen auch im [Produkt-Datenvertrag](../PRODUKT-DATENFORMAT.md#implementierte-task-10-schnittstellen).

- `exportBackup(state,exportedAt,{selectedEpochId}={}) -> Promise<Backup>`. Ein Epochenkonflikt ohne ausdrückliche Auswahl ergibt `conflict`; die UI muss einen Kopf wählen. `parseBackup(text) -> Promise<Backup>` ist ohne Mutation.
- `prepare(backup) -> Promise<{previewId,summary}>`. `summary` enthält Profil-/Wort-/Antwortzahlen vor/nach, `contentChanges`, `progressChanges` einschließlich Punkten und Wort-Lernständen, `conflicts`, `affectsConnectedDevices`, `foreignDataset`, `timeZoneChange` und Schutzgrenzen. Texte ausschließlich als Text rendern. Fremdimport und abweichende Lernzeitzone in der Bestätigung benennen.
- `confirm(previewId) -> Promise<void>`. `stale` verlangt eine neue Vorschau plus neue ausdrückliche Bestätigung; die Oberfläche darf nicht still erneut bestätigen. Nach einem Abbruch zeigen `commands.getState().restoreJobs` bestätigte Phasen `uploading/published` mit derselben `previewId`; diese Fortsetzung muss die UI anbieten. Ein neuer Restore ist währenddessen mit `not-ready` gesperrt. `activated` ist idempotent. Unbestätigte `preparing/preview`-Aufträge sind keine Veröffentlichungsfreigabe.
- `resolveEpochConflict({selectedEpochId,expectedHeads}) -> Promise<{previewId,summary}>`. `expectedHeads` muss sämtliche aktuellen Köpfe enthalten. Kein Zeitstempelgewinner, kein direkter Schalter. Anschließend dieselbe ausdrückliche `confirm`-Grenze. Ein neuer Kopf ergibt `stale`.
- `previewAdoption(eventIds) -> Promise<{previewId,summary,eventIds,supportEventIds}>`; `adopt({eventIds,previewId}) -> Promise<void>`. Dieselbe Auswahl und derselbe aktuelle Stand sind erforderlich. Nach Neustart neue Vorschau. Fehlende vollständige Abschlussauswahl ist `reference`, nicht eine automatische Erweiterung der gewählten Wertung. Support gibt keine Punkte und aktiviert keine Inhaltsfassung. Die UI muss neue Inhalte/Konflikte/Punkte anzeigen.
- `listSafetyCopies() -> Promise<Array<{id,createdAt,purpose,hash,verified,driveManifestFileId}>>`. `downloadSafetyCopy(id) -> Promise<Backup>` prüft lokale Datei und Hash erneut. Es wird kein Browserdownload automatisch ausgelöst; Task 11 erzeugt daraus die JSON-Download-Datei. `verified` bestätigt die lokale rückgelesene Kopie, `driveManifestFileId` ist nur nach geprüftem Cloudmanifest gesetzt. Cloudkopien anderer Geräte verwenden `snapshotId` als lokale Kopie-ID und `backupMetadata.exportedAt` als Datum. Erzeugende Geräte behalten ihre lokale ID. Auf dem zweiten Gerät entsteht ein fachlich vollständiges Backup, keine zugesagte bytegleiche ursprüngliche Datei.
- `joinDataset(selection,'preview')` liefert die bisherigen `kind,datasetId,name,localEventCount,remoteBootstrapEventCount,requiresSafetyCopy` sowie bei nötigem Ersatz `previewId,safetyCopyId` (sonst beide `null`). Erst `joinDataset({...selection,previewId,safetyCopyId},'confirm')` darf diesen Ersatz vollziehen. Fehlende IDs: `not-ready`; geänderte Auswahl/Stand oder Neustart: `stale`. Der vollständige bisherige Bestand bleibt als lokale Sicherheitskopie verfügbar. `store` muss dafür derselbe reale Speicher mit `load()` sein, den Commands verwendet.

Gemeinsame Präzisierungen des Controllers 17–21 sind umgesetzt: zusätzlicher fokussierter Transporthelfer, explizite Joinvorschau, ausgewählter Konfliktexport, unveränderlicher Teilmengen-Snapshothash und verpflichtende Manifestmetadaten `{exportedAt,safetyCopyIndex}` unter dem Gesamt-Hash. Keine Tokens/PIN/Bindung darin. Es existierten zuvor keine veröffentlichten Produktmanifeste; es wird kein stiller Fallback für eine nicht existierende Vorgängerversion eingeführt.

## TDD und Prüfbelege

Alle Läufe nutzten Node **22.23.2** und synthetische Daten.

Erster RED-Lauf:

```text
node --test --experimental-test-isolation=none tests/trainer/backup.test.js tests/trainer/restore.test.js
tests 2; pass 0; fail 2
ERR_MODULE_NOT_FOUND: src/trainer/backup/format.js und backup/restore.js
```

Die zunächst fehlenden Module waren der erwartete Ausgangszustand. Danach wurden die Verhaltensfälle schrittweise ergänzt. Zusätzliche konkret beobachtete REDs vor der jeweiligen Korrektur:

| Gezielter Lauf | Beobachteter Fehler | Korrektur |
| --- | --- | --- |
| `node --test --experimental-test-isolation=none tests/trainer/restore.test.js` bei den ersten Cloudfällen | `pass 5; fail 4`; unbekannte Snapshotdatei, Zweitgerät blieb in `e0` statt Restore-Epoche | Snapshot-/Kontrollempfang und spätere Offlineveröffentlichung |
| derselbe Befehl mit `--test-name-pattern='nonempty local backup'` | `assert.ok(preview.safetyCopyId)` fehlgeschlagen | Geprüfte lokale Join-Sicherheitskopie mit expliziten IDs |
| `--test-name-pattern='local change while safety'` | `Missing expected rejection` | Sicherheitsstand und Vorschau bei zwischenzeitlichem Lernen nicht auseinanderlaufen lassen |
| `--test-name-pattern='new device discovers'` | `0 !== 1` auf Sicherheitskopienzahl | Cloudkopien samt echtem Datum auf neuem Gerät verfügbar machen |
| `--test-name-pattern='malformed persisted restore'` | `Missing expected rejection` | Lokale Auftrags-/Kopien-/Manifestformen an Commands prüfen |
| `--test-name-pattern='resuming a published job preserves'` | Neue Runde wurde `abandoned` statt `asking` | Beim Wiederanlauf ausschließlich Runden der alten Epoche beenden |
| `node --test --experimental-test-isolation=none tests/serve.test.js` | `/src/trainer/backup/format.js`: `404 !== 200`; `pass 4; fail 1` | Alle drei Backupmodule explizit im Server freigeben |

Die Pattern-Läufe verwenden jeweils `tests/trainer/restore.test.js` als Testdatei. Die gezielten GREEN-Läufe bestanden nach der Korrektur; letzter kompletter Backup-/Restore-Lauf vor dem abschließenden Wiederanlauffall: **26/26**, dessen zusätzliche RED/GREEN-Regression anschließend **1/1**. Bestehende Sync-/Server-Fälle separat **25/25**. Die Mehrkopfprüfung wurde nach dem Gesamtlauf zusätzlich mit umgekehrter Drive-Dateireihenfolge geprüft: **1/1**; keine Produktänderung dabei.

Abschließender vollständiger Node-Lauf:

```text
npm test
tests 254
pass 254
fail 0
cancelled 0
skipped 0
todo 0
```

Browserlauf wegen des neuen von Commands geladenen Formatmoduls und der Serverliste:

```text
node --test --experimental-test-isolation=none tests/browser/trainer.browser.mjs
tests 4
pass 4
fail 0
```

Der erste Browserstart in der Prozess-Sandbox scheiterte mit `browserType.launch: spawn EPERM`. Der danach erlaubte Lauf nutzte einen neuen isolierten Headless-Edge-Kontext mit Playwright, eigenem temporärem Testserver und synthetischem Google-Zugriff. Der persönliche Port 4173 und persönliche Browserdaten wurden nicht verwendet. Geprüft wurden der tatsächliche Modulstart, Einrichtung/Erwachsenenverwaltung, Üben/Persistenz/BFCache sowie Inselreise/Avatar. Es gibt noch keinen Browsertest einer Task-11-Wiederherstellungsoberfläche, weil diese hier nicht implementiert wurde.

`git diff --check` und `git diff --cached --check` wurden ausgeführt. Eine zusätzliche leere EOF-Zeile in der neuen Testfixture wurde vor dem Commit entfernt; der abschließende Indexcheck war ohne Ausgabe. Nur Taskdateien wurden in den Codecommit aufgenommen.

## Dateien und Selbstprüfung

Neu: `src/trainer/backup/format.js`, `restore.js`, `transport.js`, `tests/trainer/backup.test.js`, `restore.test.js`, `backup-fixtures.js`. Angepasst: Commands, Schemaexports, Synccontroller, Serverliste/Servertest, vorhandener Joinregressionstest und Datenvertrag. Der Controller ergänzt separat Arbeitsstand, Übergabe und technische Entscheidungen.

Die Selbstprüfung umfasst Import-/Exportgrenzen, Hashumfang, reservierte IDs vor Netzmutation, CAS, atomaren Epochenwechsel, vorherige Task-9-Integritäts-/Abonnementverträge, Nullmanifest-Empfang, historische statt aktive Fremdwurzeln, Kopfkonflikte, Support gegenüber Wertung und Erhalt spezieller gültiger IDs wie `__proto__`. Reproduzierte Schwächen wurden vor dem Commit korrigiert und sind oben belegt. Der bestehende Synccontroller ist weiterhin umfangreich; der ausdrücklich genehmigte Transporthelfer bündelt Snapshotdetails, ohne fachfremdes Refactoring. Keine weiteren konkreten offenen Fehler aus der Selbstprüfung.

## Grenzen

Task 10 stellt die Backend-/Speicher-/Synchronisationsschnittstellen bereit. Task 11 muss die beschriebenen Vorschauen, Bestätigungen, Konfliktentscheidungen, Wiederanläufe, Dateidialoge und Downloads in die Erwachsenenansicht einbinden. Task 12/PWA wurde nicht vorgezogen. Task-9-Beobachtung O1 zum Authstatus vor Bindung bleibt ausdrücklich Task 11 zugeordnet. Reale Produkt-Google-, physische Zwei-Geräte-, iPhone/iPad-, Safari-/Home-Bildschirm- und Hostingabnahmen bleiben offen. Die Tests sind Protokoll- und Browsernachweise mit synthetischen Daten, keine reale Gerätefreigabe. Unabhängige Review folgt durch den Controller.

## Korrekturrunde 1 – R1: Snapshotidentität unabhängig vom Epochen-Cache

Die [unabhängige Review](2026-09-18-sicherung-wiederherstellung-review.md) hat R1 reproduziert: Nach erfolgreichem Cacheaufbau wurde ein später veröffentlichtes, intern gültiges Manifest mit derselben Snapshot-ID und anderem Inhalt als abgeglichen angenommen. Der ursprüngliche Manifestvergleich lag nur im bei Cachetreffer übersprungenen Epochenzweig. R1 wurde vollständig gelesen und mit den echten Transporthelfern in der synthetischen Drive-Fixture nachgestellt.

Korrekturcode: **`49fde90fb089745e73f7d75438c720dbdab87d62`**, `fix: verify snapshot identity beyond epoch cache`. Unmittelbare Basis: **`fc127499e565e449712c4a4907e5b34300dbee1f`**. Die Controller-Dokumentationscommits bis einschließlich `fc12749`, der Reviewbericht und die übrigen Schnittstellen bleiben erhalten. Nur `src/trainer/sync/drive.js` und `tests/trainer/restore.test.js` wurden im Codecommit geändert.

Jeder Abruf liest und validiert sämtliche gefundenen Snapshotmanifeste samt Teilen und gruppiert sie nach logischer Snapshot-ID, unabhängig vom Cache der Epochen oder Manifestdateien. Bestehende physische Datei-Hashprüfungen bleiben aktiv. Verschiedene gültige `totalHash`-Werte derselben Gruppe erzeugen `collision`-Quarantäne und verhindern „Abgeglichen“. Betroffene neue Epochen werden nicht aktiviert; ein bereits gespeicherter Stand bleibt erhalten. Sicherheitskopien und bekannte Manifestdateien werden erst nach erfolgreicher Gruppenprüfung bestätigt. Der zweite Manifestabruf muss zusätzlich denselben Datei-Hash liefern wie die vorangehende gebundene Dateiprüfung.

Identische physische Duplikate sind ein eindeutiger Inhalt, auch bei Nullmanifest-Epochen. Ein expliziter Manifestverweis bleibt maßgeblich; ohne Verweis wird unter geprüften identischen Restoremanifesten stabil nach ASCII-Datei-ID ausgewählt. Alle Gruppen liegen vor der Epochenzuordnung vollständig vor, daher ist die Dateireihenfolge unerheblich. Ungültige unabhängige Manifeste werden separat quarantänisiert; gültige unabhängige Änderungen werden weiterhin übertragen. Keine neue persistierte Form und keine Änderung des Datenvertrags erforderlich. Preis dieser begrenzten Korrektur sind erneute vollständige Manifest-/Teillesungen je Abruf; es wird kein neuer, ungeprüfter logischer Cache eingeführt.

RED vor der Produktänderung, Node 22.23.2:

```text
node --test --experimental-test-isolation=none --test-name-pattern='cached .*epoch rejects|identical physical snapshot|invalid independent snapshot' tests/trainer/restore.test.js
tests 5; pass 2; fail 3
cached referenced-manifest epoch: Missing expected rejection.
cached null-manifest epoch: Missing expected rejection.
identical duplicates, fresh null-manifest reader: Das Snapshot-Manifest fehlt oder ist nicht eindeutig.
```

GREEN desselben Befehls nach der Korrektur: **5 Tests, 5 bestanden, 0 fehlgeschlagen**. Die neuen Fälle nutzen `planSnapshotUploads`, `uploadVerified`, tatsächliche Commands-/Restore-/Syncinstanzen und persistierte Neustarts. Beide Kollisionsfälle prüfen zusätzlich einen neuen Leser mit umgekehrter Dateireihenfolge: Dieser bleibt in der Wurzelepoche; der bereits aktive Leser behält seinen gespeicherten Stand, meldet aber nicht `synced`. Die beiden Duplikatfälle prüfen sowohl warme Caches als auch neue Leser. Der fünfte Fall prüft nach einem beschädigten unabhängigen Manifest eine tatsächlich auf Drive vorhandene lokale Änderung und leere Pending-/Outboxlisten.

Gezielter Lauf nach Erweiterung um den frischen Leser und Reihenfolgeprüfung:

```text
node --test --experimental-test-isolation=none tests/trainer/backup.test.js tests/trainer/restore.test.js tests/trainer/sync.test.js
tests 52; pass 52; fail 0; cancelled 0; skipped 0; todo 0
```

Vollständiger Lauf auf dem Korrekturcode:

```text
npm test
tests 259; pass 259; fail 0; cancelled 0; skipped 0; todo 0
```

`git diff --check` und `git diff --cached --check` waren ohne Ausgabe. Selbstreview des vollständigen Korrekturdiffs durchgeführt. Keine UI-/Serveränderung, deshalb kein erneuter Browserlauf; der frühere 4/4-Nachweis bleibt ein früherer Nachweis und wird nicht als neuer Lauf ausgegeben. Kein Push, Merge, Google-/Gerätezugriff oder zusätzliche Implementierung. R1 ist aus Implementierungssicht korrigiert; die unabhängige Nachprüfung übernimmt der Controller.
