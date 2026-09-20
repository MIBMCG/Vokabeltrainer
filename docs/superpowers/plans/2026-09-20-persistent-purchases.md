# Dauerhafte Käufe: Implementierungsplan

> Ausführung mit `subagent-driven-development`; konkrete Zustimmung des Nutzers: „ja“ nach Vorlage des Integrationsentwurfs. Keine weitere Startfreigabe erforderlich.

**Goal:** Bestätigte Käufe dauerhaft und geräteübergreifend erhalten, echte Lernpunkte getrennt je Kind verwenden und Wiederherstellung über denselben Bestätigungspunkt ordnen.

**Architecture:** Unveränderliche, gehashte Belegfolge mit bedingtem Drive-Metadatenkopf; dauerhafte lokale Aufträge im vorhandenen atomaren Produktzustand. Produktmodule bleiben unabhängig von der synthetischen Shop-Probe. Pure Validierung/Projektion, HTTP-Transport, persistenter Ablauf und UI bleiben getrennt.

**Tech Stack:** Vorhandenes JavaScript ES modules, IndexedDB, Google Drive HTTP, Node test runner, Playwright/Edge mit synthetischer Google-Grenze. Keine neue Produktionsabhängigkeit.

**Spec:** [Bestätigter Integrationsentwurf](../specs/2026-09-20-persistent-purchases-design.md).

## Global Constraints

- Arbeiten im bestehenden isolierten Arbeitsbaum `drive-probe`, Branch `codex/vokabeltrainer-v1`; persönliche Berichte und Browserdaten erhalten. Keine Probeimporte aus `src/shop-probe` im Produkt.
- Lernpunkte unverändert: 10 pro richtiger Antwort, 20 pro abgeschlossener Runde. Ausgaben ändern keine Lernpunkte/Level. Getrennte Konten je Profil, ein gemeinsamer Kopf je Datensatz.
- Ausschließlich vollständige, geprüfte Fachstände liefern Guthaben. Kein synthetisches Startguthaben, keine frei übermittelten Punktesummen als Autorität.
- Erst lokal speichern, dann abhängige Netzoperation. Unbekannter Ausgang bleibt unbekannt. Neustart liest zuerst; Pointerwiederholung ausschließlich ausdrücklich und mit identischem gespeichertem Kandidaten und ETag.
- Vollständige gehashte Historie erhalten; keine feste 64-Belege-Lebenszeitgrenze, keine automatische Löschung. Fehlende/abweichende Historie sperrt Käufe.
- Restore hängt einen Beleg an; nur dieser gemeinsame Kopf aktiviert im neuen Modus die Epoche. Alte isolierte Epochen-Dateien dürfen dort keine Aktivierung auslösen.
- V1/V2-Objekte und Upload-IDs bleiben unverändert. Vor lokaler Migration validierte Sicherheitskopie; Cloudaktivierung separat. Konto, Ordner, Descriptor und Protokollkonfiguration exakt binden.
- Kein Token, privater Schlüssel, echtes Profil oder ausführbarer fremder Kaufauftrag in Backups/Berichten/Git. Nur synthetische automatisierte Tests; echte Apple-/Zwei-Geräte-Abnahme bleibt offen.
- Keine neue Cloud-/Kosten-/Kontenentscheidung. Vollständige neue Galerie und verbleibende Bildproduktion gehören nicht zu diesem Datenintegrationspaket.

## Gemeinsame Schnittstellen

Die Typen sind JSON-Daten; IDs und Hashes werden strikt validiert. Zusätzliche unbekannte Felder sind Fehler. `Ref = {id, sha256}`. `Binding = {accountId, folderId, descriptorFileId, datasetId}` ist die bestehende Produktbindung. Die unveränderliche Konfiguration ergänzt `descriptorHash`, `coordinatorId`, `contentFolderId`; ihre vollständige Referenz wird einmal am Bestandsordner installiert.

`Intent = {version:1, operationId, datasetId, profileId, epochId, articleId, catalogVersion:1, price, confirmed:true}` ist unveränderlich. Artikel sind Figur-IDs für bezahlte Grundfiguren oder `evolution:<figureId>:<stage>` für Entwicklungsformen. Die abgelösten bezahlten modularen Ausrüstungsstücke werden nicht neu angeboten.

`Receipt = {version:1, kind:'receipt', datasetId, coordinatorId, sequence, previous:Ref|null, operationId, operation:'initialize'|'purchase'|'restore', epochId, basis:Ref, intent:Intent|null, economy:null|EconomicSnapshot}`. Initialisierung/Restore setzen einen geprüften wirtschaftlichen Zielstand; Kauf trägt genau einen Intent. `EconomicSnapshot` enthält die überprüfbare Herkunft für übertragenen Besitz/Ausgaben, keine bloßen behaupteten Guthaben. Die konkrete portable Darstellung wird in Task 1 zusammen mit Replay definiert und dokumentiert; sie muss vollständige Herkunftsbelege samt Basen prüfen und zyklische Herkunft ablehnen.

`Basis` ist ein unveränderlicher Manifestverweis auf in begrenzte Stücke zerlegtes kanonisches JSON eines vollständigen validierten Ledgers. Manifest bindet Länge, Hash und geordnete Teilreferenzen. Keine einzelne große Metadateneigenschaft. Serialisierung/Lesung werden in eigenen `value.js`/`basis.js`-Modulen gehalten.

`Commerce = {version:1, mode, binding, configRef, config, head, cache, setup, jobs, selection}`. `mode` ist `inactive|migrating|active|blocked`; `cache` enthält Referenzen und geprüfte Inhalte, `selection` die Figur/Form je Profil. `jobs` enthält Intent und davon getrennte Versuche mit gespeichertem Kopf, ETag, Kandidat und Phasen `intent|reserved|uploaded|pointer-pending|reconciling|confirmed|rejected|superseded`. Setup ist ebenfalls dauerhaft. Fehlende Konfiguration ist nur im inaktiven/noch vorbereitenden Zustand erlaubt.

Netzwerkfehler und Integritätsfehler tragen maschinenlesbare `code`-Werte über den vorhandenen `ProductError`. Alle veröffentlichten API-Rückgaben sind Kopien; kein aufrufender Code erhält veränderliche interne Zustände.

### Task 1: Belegvertrag, echte Punkte und vollständige Historie

**Files:** neue `src/trainer/purchases/{value,schema,basis,projection,history}.js`; neue `tests/trainer/purchases-contract.test.js`, `purchases-fixtures.js`; Schnittstellen-Dokument `docs/KAUFPROTOKOLL.md`.

**Interfaces consumed:** `assertLedger`, `resolveEpochs`, `project`, `canonical`/`digest`, Figuren-/Stufenkatalog. Keine Speicherung/HTTP.

**Interfaces produced:** `assertIntent`, `assertReceipt`, `assertCommerce`, `emptyCommerce`; `purchaseOffer({ledger, economic, profileId, articleId})`; `replayHistory({entries, bases, binding})`; `readHistory({head, read, cache, binding, onProgress})`; `packBasis(ledger, reserve)` und `readBasis(ref, read)`; kanonischer JSON-/Hash-Helfer. Genaue Rückgabeformen im Schnittstellendokument festhalten und spätere Tasks daran binden.

- [ ] RED: erst Schema-/Kauf-/Kettenfälle schreiben. Zentrale Assertion: Zwei Kinder mit je 300 echten Lernpunkten; Kind A kauft Stufe 2 für 200, A verbleiben 100, B 300; `project(ledger)` und Level unverändert. Ohne Vorgängerstufe, falscher Preis, Punktbehauptung, geänderte Intent-ID und kollidierende Antwort bleiben abgewiesen.
- [ ] `node --test --experimental-test-isolation=none tests/trainer/purchases-contract.test.js` ausführen, erwarteten fehlenden Vertrag belegen.
- [ ] GREEN: exakte Datenvalidierung, Basismanifest/Teile, reine Katalogberechtigung, Kauf-/Restore-Replay und Historienlesung implementieren. Erwerbe nur aus Belegen; freie Grundfiguren aus Level. Frühere aktive Fakten müssen in späteren Kaufbasen erhalten bleiben. Neue Fakten dürfen bestehende Antwortidentität nicht verdrängen. Provenienz einer Wiederherstellung unabhängig prüfen, bevor Ausgaben/Besitz übernommen werden.
- [ ] Kette iterativ und in Arbeitsabschnitten lesen. Cacheinhalt bei Verwendung erneut hashen; Kopf muss geprüfte Vorgängerkette erweitern. Kreise, abgeschnittene/alternative Ketten, falsche Bindungen und Belege blockieren. Mindestens 1000 synthetische gültige Transaktionen und >64 Käufe/Restores über mehrere Epochen mit vollständigen IDs prüfen; keine reine Längen-Mockassertion.
- [ ] Fokuslauf grün, vorhandene Lern-/Avatarfälle unverändert grün; Diff selbst prüfen, committen, Bericht mit RED/GREEN und konkreten Schnittstellen ablegen. Review vor Task 2.

### Task 2: Gebundener Produkttransport und eindeutige Einrichtung

**Files:** neue `src/trainer/purchases/{transport,bootstrap}.js`; neue `tests/trainer/purchases-transport.test.js`, `purchases-http-fixture.js`; `docs/KAUFPROTOKOLL.md` ergänzen.

**Interfaces consumed:** Task-1-Refs/Kanonisierung/Schemata; vorhandener `createDriveClient` nur als read-only Vorbild. Tokenfunktion ausschließlich zur Laufzeit.

**Interfaces produced:** `createPurchaseTransport({fetchImpl,getToken,binding,descriptorHash})` mit `accountId`, `reserveId`, `readFolder`, `createFolder`, `readImmutable`, `writeImmutable`, `putPointer`; `prepareBootstrap`/`resumeBootstrap` arbeiten über injizierten `persist`-Callback und aktuelle gespeicherte Setupdaten. Transport erzeugt keine Kaufabsichten.

- [ ] RED: synthetische HTTP-Fälle für starke opake ETags, zwei kohärente Metadatenreads, genaue Eltern/App/Datensatz/Konfigurationsbindung, verändertes Konto, Properties-Erhaltung und -Grenzen schreiben.
- [ ] Fokuslauf `node --test --experimental-test-isolation=none tests/trainer/purchases-transport.test.js` vor Implementierung dokumentieren.
- [ ] GREEN: neues Markerpräfix `vokabeltrainer-purchases`; V2-Metadaten-GET/PUT und reservierte V3-Erstellung. HTTP200 allein bestätigt keinen Kauf. 409 nach verlorenem Create akzeptiert nur vollständige Bindung plus Inhaltshash. Persistierte Kandidaten müssen aus validiertem Auftrag registriert werden; entfernte Referenz erlaubt nur Lesen. Keine freien Write-IDs.
- [ ] Bootstrapjob speichert reservierte zwei Ordner und Config vor Upload/Pointer; bestehenden Deskriptor unverändert prüfen. Ein einmaliger bedingter Bestandsordner-PUT installiert vollständige Configref; zwei Konkurrenten wählen exakt den Gewinner, ungewisser Ausgang wird mit ursprünglichem Job nachgelesen. Configref darf niemals ersetzt werden. Spätere Kopfwechsel nur im Koordinationsordner.
- [ ] Grenzen 30 private Properties und 124 UTF-8-Bytes je Schlüssel+Wert testen; fremde Properties erhalten. Alte Produktmetadatenwächter und Shop-Probe unverändert lassen. Fokus grün, Review/Commit.

### Task 3: Atomarer Speicher und wiederaufnehmbare Kaufaufträge

**Files:** neue `src/trainer/purchases/service.js`, ggf. `journal.js` für Übergangslogik; Änderungen `commands.js`, `storage/migrate.js`; neue `tests/trainer/purchases-recovery.test.js`, Änderungen Migration-/Commandtests.

**Interfaces consumed:** Tasks 1–2; vorhandener serialisierter `commands.commitExternal(next, expectedHash)` und `productStateHash`.

**Interfaces produced:** `createPurchaseService({commands,transport,sync,now,id,onStatus})` mit `prepareActivation`, `confirmActivation`, `refresh`, `preview`, `confirm`, `resume`, `getStatus`, `getView`, `select`, sowie koordiniertem `prepareRestore`/`confirmRestore` als von Task 4 benutzter Operationsport. Preview ist zustandsgebunden; veraltete Bestätigung schreibt nicht.

- [ ] RED: Neustart durch vollständig neue Store-/Command-/Service-/Transportobjekte nach jedem Speicher-/Netzschritt testen. Speicherfehler verhindert nächsten Netzschritt; Pointer-200 ohne Abschluss, verlorene Antwort mit späterem Kauf und exakte Wiederaufnahme prüfen.
- [ ] Fokuslauf `node --test --experimental-test-isolation=none tests/trainer/purchases-recovery.test.js` erwartetes Fehlen belegen.
- [ ] GREEN: storageVersion3 mit exaktem `commerce`, atomarer und validierter v1/v2-Sicherungs-/Migrationspfad, keine Umschreibung alter Objekte/IDs/PIN/Pakete. Offene alte Restorejobs blockieren Umstellung. Lokale Migration allein aktiviert kein Cloudkonto. Fachformat bleibt bis Task 4 getrennt von lokaler Version.
- [ ] Auftragsübergänge einzeln speichern. `refresh` liest nur und gleicht ursprüngliche IDs mit vollständiger Historie ab. Kein automatischer Pointerretry bei `pointer-pending`/`reconciling`. Nur explizites `resume(operationId)` wiederholt identischen Kandidaten/ETag nach Identitätsprüfung. 412 oder bewiesene Weiterentwicklung ohne Intent verlangt neue Vorschau. Doppelklick/Kauf eines besessenen Artikels erzeugt keine neue Belastung.
- [ ] Kaufbasis ausschließlich nach erfolgreichem Abgleich; offline neue Käufe blockieren, vorhandenen Besitz lesbar lassen. Sperren je gemeinsamem Kopf, getrennte Profile, keine Parallelmutation am serialisierten Writer vorbei. Tests für geänderten Intent, falsches Profil, Konto-/Ordnerwechsel, Speicher voll. Fokus und bestehende Commands/Migration grün; Review/Commit.

### Task 4: Gemeinsame Epoche, v3-Sicherungen und alte Geräte

**Files:** `model/versions.js`, `model/schema.js` soweit Versionsgrenzen betroffen; `sync/drive.js`; `backup/{format,restore,transport}.js`; Kaufmodule gezielt für Integration; neue `tests/trainer/purchases-integration.test.js`; betroffene Restore-/Backup-/Sync-/Versionstests und eingefrorene Legacy-Fixtures.

**Interfaces consumed:** Serviceoperationsport und validierte wirtschaftliche Provenienz. Bisherige Restorevorschau, Snapshotteile, Sicherheitskopien und Outbox bleiben Grundlage.

**Interfaces produced:** neuer Format-/Regelmodus3, portable v3-Economy mit vollständigen Belegen/Basen/Auswahl ohne Journal/ETags/Token, `createProductSync` und `createRestoreService` mit optionalem Commerceport; kein Kreis durch Import gegenseitiger Serviceimplementierungen (Ports injizieren).

- [ ] RED: gleichzeitiger Kauf/Restore in beiden Reihenfolgen, leeres zweites Gerät, bestehende v1/v2-Historie, alter Client und verspätete Epochen-/Antwortdateien prüfen.
- [ ] `node --test --experimental-test-isolation=none tests/trainer/purchases-integration.test.js` ausführen.
- [ ] GREEN: v3-Marker vor Aktivierung, ursprünglicher Descriptor unverändert; Aktivierung durch neuen gemeinsamen Initializebeleg samt vollständig gebundener neuer Epoche. Neue App entdeckt die gespeicherte Config auch mit leerem Cache. Unkoordinierte alte Epochen/Snapshots erhalten, aber niemals aktive neue Epoche auswählen. Späte Lernereignisse als ausdrücklich übernehmbare Alt-Ereignisse behandeln.
- [ ] Restore: erst Sicherheitskopie, Besitz-/Guthabenvorschau und offene Aufträge klären; Kandidaten hochladen; dann gemeinsamen Kopf bestätigen. Nur bestätigten Restore lokal atomar aktivieren, alte Runden ohne Bonus beenden. 412 verlangt neue Vorschau. Verbindungsausfall darf nicht in Offline-Restore fallen. Rein unverbundener Offline-Restore bleibt.
- [ ] Backup v3 genau validieren, vollständige wirtschaftliche Herkunft einschließlich Restoreimport prüfen. Fremde Sicherung liefert wirtschaftliches Ziel ohne fremde Drivekontrolle/ausführbare Jobs. Fehlende Belege, manipulierter Besitz, zirkuläre Herkunft, >25MiB und voller Store müssen bisherigen Zustand erhalten.
- [ ] Legacy-Schreibbarriere mit eingefrorenen v1/v2-Fällen beweisen, einschließlich vor Marker bereits laufender Uploads/Restores. Fokus plus bestehende Sync/Backup/Restore/Migrationtests grün; Review/Commit.

### Task 5: Anbindung, Status und nutzbare Kaufaktionen

**Files:** `src/trainer/main.js`, `ui/rewards.js`, neue `ui/purchases.js`, passende Shell/Settings/Backup-Ansichten, CSS unter `trainer/`, `trainer/sw.js`, `scripts/serve.mjs` falls Allowlist nötig; neue UI-/Browsertests `tests/trainer/purchases-view.test.js`, `tests/browser/purchases.browser.mjs`; Fixture/harness erweitern.

**Interfaces consumed:** Task-3-Service und Task-4-Sync-/Restoreports; bestehende Figuren-/Entwicklungsbilder, keine neue Bildproduktion.

**Interfaces produced:** Einrichtung der Datenaktualisierung im Erwachsenenbereich mit Vorschau und bewusster Bestätigung; Guthaben, Kaufvorschau/Bestätigung, Besitz und „Kauf wird geprüft“/„Kauf fortsetzen“ in Avatarbereich; sichtbare Fehlermeldung ohne technische Journalfelder.

- [ ] RED: Browserfall nach Kauf echter synthetisch erspielter Punkte, Seite schließen/neu öffnen, Besitz und Guthaben unverändert; offline Besitz sichtbar, Kauf gesperrt. Getrennte Kinder unverändert.
- [ ] `node --test --experimental-test-isolation=none tests/browser/purchases.browser.mjs` mit vorhandenem Playwright/Edge ausführen.
- [ ] GREEN: echte Serviceanbindung, Anmeldungstoken nur flüchtig, Status aus bestätigter Historie. Erklären, dass Lernpunkte/Level erhalten bleiben. Bei fehlendem Produktionsbild keine fertige Entwicklungsillustration vortäuschen; verfügbare Drachenformen einsetzen, übrige Produktionsbilder als ausstehend behandeln. Vollständige Galeriegestaltung bleibt Folgeumfang.
- [ ] Backupvorschau um wirtschaftliche Änderungen ergänzen. Konkrete Datenaktualisierung statt Client-ID-Neueinrichtung; alte Geräte brauchen Appupdate. Ungewisser Kauf bleibt nach Reload mit gezielter Fortsetzenaktion erkennbar.
- [ ] Cachekennung erhöhen und alle neuen Runtime-Dateien explizit precachen; kein Token/Googleantworten im Cache. Schmale/mobile Ansicht, Tastaturbedienung, Offline-Neustart und Workerupdate prüfen. Fokus, Produktbrowser-/Offlinefälle grün; Review/Commit.

### Task 6: Gesamtprüfung und portable Übergabe

**Files:** `ARBEITSSTAND.md`, `START-HIER.md`, `AGENTS.md`, `README.md`, `docs/{ANFORDERUNGEN,ARCHITEKTUR,PRODUKT-DATENFORMAT,KAUFPROTOKOLL}.md`, neuer Bericht und Übergabe unter `docs/reports/` und `docs/handoffs/`.

- [ ] Gesamte geänderte Funktion mit `npm test`, Produkt-/Kaufbrowserfällen und `npm run check:docs`, `git diff --check` frisch prüfen. Unveränderte reale Probe nicht erneut anfordern.
- [ ] Unabhängige Gesamtprüfung des vollständigen Paketdiffs durch GPT-6 Astra/hoch; relevante Befunde korrigieren und gezielt nachprüfen.
- [ ] Umgesetzte Bedienung, Testergebnisse, offene Bildproduktion und reale Geräte-/Wiederaufnahmeabnahme getrennt dokumentieren. Kein grüner Unit-Test ersetzt Drive-/Apple-Nachweis.
- [ ] Explizit eigene Dateien committen und im bestehenden beauftragten Entwicklungszweig pushen; anschließend Remote-SHA mit lokalem HEAD vergleichen. Kurze Anleitung und überprüfbaren Stand an den Nutzer zurückgeben, keine weitere Startfrage.

## Selbstprüfung des Plans

Alle drei freigegebenen Integrationsschritte sind enthalten. Taskreihenfolge verhindert Paralleländerungen am Writer; genaue Task-1-Rückgaben werden vor abhängigen Briefs übernommen. Tasks 3 und 4 trennen lokale Speicher- von Cloudformatmigration, deshalb dürfen Zwischencommits vor Task 5 keinen aktivierten Shop ausliefern. Alter Probevertrag bleibt unverändert. Vollständige Bilderproduktion und reale spätere Abnahmen bleiben sichtbar außerhalb dieses Pakets.
