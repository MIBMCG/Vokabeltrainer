# Bedingter Integrationskandidat: Datenvertrag 3 und unabhängige UI-Projektionen

Stand: 19.09.2026. **Bedingter Architekturvorschlag, noch kein ausführbarer Integrationsplan.** Der Nutzer hat die gesamte Erweiterung ausdrücklich zur Entwicklung freigegeben; eine weitere allgemeine Startfreigabe ist nicht erforderlich. Die isolierte Probe ist automatisiert geprüft, der reale Medien-/Metadaten-CAS-Nachweis fehlt weiterhin. Aussagen über den möglichen Transport gelten nur, falls diese technischen Nachweise gelingen. Danach diesen Kandidaten gegen die Ergebnisse prüfen und den detaillierten Implementierungsplan ergänzen. Kein neuer Anbieter, Backenddienst, Scope oder Kostenbestandteil. Siehe [aktuelle Übergabe](../handoffs/2026-09-19-avatar-shop.md).

## 1. Heute vorhandene Integrationsstellen

- `src/trainer/model/versions.js`: unterstützte Paare derzeit 1/1 und 2/2, CURRENT_VERSION 2/2. Enthaltene alte Objekte dürfen unverändert in neueren Umschlägen liegen.
- `src/trainer/model/schema.js`: `assertLedger` erwartet exakt `descriptor/events/epochs/snapshots/historicalEpochs`; `assertEvent` und Payloads sind streng. Die alte Datensatzbeschreibung bleibt unveränderlich; `sync/drive.js:download` lehnt einen geänderten Beschreibungshash ab.
- `src/trainer/model/epochs.js:resolveEpochs`: bestimmt derzeit aktive Epoche ausschließlich durch DAG-Köpfe. Alle Projektionen greifen darauf zu; ein nur außerhalb des Ledgers gespeicherter Shopstatus würde diese Aufrufer nicht zuverlässig schützen.
- `src/trainer/learning/progress.js:project`: einmalige Punkte aus richtigen Antworten und gültigen Rundenabschlüssen, daneben Level und altes Avatarformat. `learning/facts.js:uniqueAnswers` und `schema.js:validateRoundReferences` sind maßgeblich für Deduplizierung/Konflikte.
- `src/trainer/commands.js`: strenge STATE_KEYS; `assertProductState`, `productStateHash`, `commitExternal`, `createCommands`; Migration wird vor einer einzigen `store.save` durchgeführt. Der bestehende Avatarbefehl erzeugt `avatar.changed`.
- `src/trainer/storage/migrate.js:migrateProductStateV1`: prüft alte Snapshots/Sicherungen und legt eine Sicherheitskopie je Epochenkopf an. Der Produktspeicher speichert den gesamten Zustand atomar in einer IndexedDB-Transaktion und besitzt eine lokale Tab-Schreibsperre.
- `src/trainer/sync/drive.js`: `download`, `readBracketed`, `prepareDatasetSetup`, `resumeDatasetSetup`, `publishLocalEpochs`, `performSync`. `knownFiles` setzt bislang unveränderliche Inhalte voraus. Der veränderliche Koordinator darf dort nicht als normale unveränderliche Datei behandelt werden.
- `src/trainer/backup/format.js`: `backupLedger` erzeugt eine künstliche Ansichtsepoche; `snapshotHash` bindet bisher nur Lernereignisse. `exportBackup/previewBackup/validateBackup` benötigen einen zusätzlichen Commerce-Nachweis, nicht eine still geänderte alte Hashfunktion.
- `src/trainer/backup/restore.js:confirmInternal` und `sync/drive.js:publishLocalEpochs` veröffentlichen heute Epochen selbständig. Ein bereits laufender alter Restore kann den erneuten Versionscheck überspringen. Das ist für V3 ausdrücklich neu zu begrenzen.
- Vorbereitet vorhanden: `avatar/catalog.js` (`CATALOG_VERSION`, `FIGURES`, `ITEMS`, `figureById`, `itemById`, `isCompatible`, `levelEntitlements`) und `avatar/selection.js:normalizeSelection`. Keine Lernpunkte oder Besitzberechnung dorthin duplizieren.

## 2. Feste Invarianten des Kandidaten

1. Alte v1/v2-Ereignisse, Pakete, Snapshots, Sicherheitskopien und Deskriptoren bleiben in ihren ursprünglichen Bytes/fachlich kanonischen Werten samt IDs/Hashes erhalten. Nur neue Umschläge und neue Objekte tragen 3/3. Kein Umschreiben eines alten Avatarereignisses auf ein neues Payloadschema.
2. Lernpunkte bleiben Ergebnis derselben effektiven Lernfakten. Keine Startgutschrift, kein separat wiederholbar erhöhbarer Punktezähler. Nur bestätigte gültige Belege verringern das ausgebbare Guthaben; Punkte/Level selbst bleiben unverändert.
3. Ein gemeinsamer Datensatzkoordinator serialisiert Kaufbestätigungen und Epochenwechsel. Kinderbesitz/-ausgaben bleiben fachlich getrennt. Die einmalige Genesis-Bindung hängt an einem bereits eindeutig gebundenen Anker; ein Suchtreffer nach Dateiname ist keine Bindung.
4. Vorbereitete/hochgeladene Belege sind bis zur Aufnahme in den bestätigten Koordinatorkopf wirkungslos. Ein später als bestätigt nachgewiesener Vorgang gilt einmal, auch nach Antwortverlust, Absturz und weiteren Käufen.
5. Nach Aktivierung von V3 kann kein freistehendes Epochendokument die autoritative Epoche ändern. Fehlende Kettenglieder oder widersprüchliche Autorität sperren neue Käufe und Resetaktivierung. Bereits geprüfte lokale Daten werden nicht gelöscht.
6. Anprobe ist flüchtiger UI-Zustand. Auswahl eigener Dinge darf offline gespeichert werden. Fehlende/inkompatible Sichtauswahl wird neutral dargestellt, ohne gespeicherte Auswahl anderer Figuren oder Besitzdaten umzuschreiben.

## 3. Versionierte Fachobjekte: konkreter Vorschlag

### 3.1 Version und lokales Aggregat

`CURRENT_VERSION={format:'vokabeltrainer-product',formatVersion:3,ruleVersion:3}`; explizite Konstante `VERSION_V2` neben `LEGACY_VERSION`, damit Bestandsmigrationen nicht plötzlich V3 ausgeben. `assertSupportedVersion` unterstützt genau 1/1, 2/2, 3/3. Alle bisherigen Vergleiche `storageVersion===2` und `formatVersion===2` müssen auf ihre tatsächliche Absicht geprüft werden: v2-und-neuer versus ausschließlich eingefrorenes v2-Schema. Kein globales Suchen/Ersetzen.

Lokales `storageVersion:3` ergänzt:

- `shopBinding:null|{coordinatorFileId,activationId,activationHash}`; vorhandenes `binding` bleibt mit accountId/folderId/descriptorFileId/datasetId bestehen. Kombination beider Bindungen ist maßgeblich, nicht nur profileId oder datasetId.
- `shopJobs:[]` als dauerhafte vorbereitete Vorgänge mit stabiler operationId, intentHash, erwartetem Kopf/Epoche, reservierten Datei-IDs, Versuchszustand und optional nachgewiesenem Beleg. Keine Tokens/ETags in Exporten; ETag ist kurzlebiger Transportzustand, kein dauerhafter Beleg.
- `ledger.coordination` als verpflichtendes Feld der neuen lokalen Ledgerform, damit `resolveEpochs(ledger)` die Autoritätsgrenze selbst kennt. Legacy-Ledger mit exakt fünf Schlüsseln bleiben validierbar. V3-State verlangt den Zusatz; damit darf kein V3-Konsumaufrufer ihn versehentlich weglassen und auf freie DAG-Köpfe zurückfallen.

Kandidat für `ledger.coordination`:

`{format,formatVersion:3,ruleVersion:3,kind:'coordination-view',activation:null|Activation,head:null|ConfirmedHead,operations:Operation[],evidence:EvidenceBundle[],uncoordinatedEpochs:Epoch[]}`.

`activation:null` bedeutet lokale Formatmigration ohne Cloudaktivierung. Dann gelten die bisherigen Epochenregeln und Käufe bleiben gesperrt. Bereits aktive, inzwischen unvollständig geladene Koordination ist ein eigener Fehlerzustand und darf niemals als activation:null erscheinen. Unkoordinierte neue Epochen werden separat erhalten und können den alten gültigen Ledger nicht durch zusätzliche DAG-Köpfe verdrängen.

### 3.2 Figurenwahl und Ausstattung

Zwei neue Ereignisse mit unverändertem gemeinsamen Ereigniskopf und ausschließlich v3-Payload:

- `avatar.figure-selected`: `{profileId,figureId}`. Ändert nur die aktive Figur.
- `avatar.outfit-set`: `{profileId,figureId,skin,clothing,equipment}`. Vollständiger Ausstattungsstand genau einer Figur. Menschen: clothing/head/back/hand; Tiere: head/body/adornment. `equipment` enthält alle für diese Gruppe vorgesehenen Slots, jeweils Artikel-ID oder null. Haut-/Kleidungsfarbwerte bleiben 0..3/0..5; sie können gespeichert bleiben, ohne bei Tieren gerendert zu werden.

Beide Befehle prüfen Existenz, Eigentum/Levelrechte und Kompatibilität. Schema prüft strukturell bekannte, zulässige Werte; Entitlementprüfung geschieht gegen den Zustand zum Befehlszeitpunkt und nochmals in der Projektion. Ein während Konflikt/Reset vorübergehend ungültiger Blick löscht keine Rohereignisse.

Projektion faltet Ausstattungsereignisse deterministisch getrennt nach `(profileId,figureId)`. `avatar.changed` bleibt Legacyereignis und setzt nur die boy-Ausstattung über `LEGACY_ITEM_IDS`; vor dem ersten neuen Auswahlereignis ist explorer-boy aktiv. Ein später synchronisiertes altes Avatarereignis darf eine ausdrücklich gewählte Tierfigur nicht auf explorer-boy zurückschalten. Paralleländerungen an verschiedenen Figuren verdrängen sich nicht. Für dieselbe Figur bleibt die bestehende deterministische Ereignisordnung maßgeblich.

### 3.3 Aktivierung und Koordinator

Nur nach erfolgreicher realer Transportprobe:

`Activation` ist unveränderlich: Versionskopf, kind `commerce-activation`, id, datasetId, descriptorHash, rootEpochId, acceptedEpochId, acceptedEpochHistoryHash, coordinatorFileId, initialHeadHash, occurredAt. Sie bindet einen vollständigen geprüften Vor-V3-Stand; keine offenen Quarantänen, Epochenkonflikte, fremden Vorbereitungsjobs oder unbekannten Belege werden still übernommen.

Der bekannte Datensatzordner erhält über nachgewiesenes bedingtes Metadaten-PATCH einen einzigen Aktivierungsverweis. Die Bindung muss descriptorFileId/descriptorHash berücksichtigen, nicht nur einen Ordnernamen. Zwei Initialisierer können Dateien vorbereiten, aber nur die erfolgreiche Bindung ist autoritativ. Verlierer übernimmt die identische bestätigte Bindung; er aktiviert seine eigene Kandidatendatei nicht. Externe Entfernung/Abänderung eines Ankers ist ein sperrender Fehler, kein Anlass zur Neuerzeugung eines Kontos.

Veränderliches Koordinator-JSON: Versionskopf, kind `commerce-head`, datasetId, activationId/hash, sequence, operationId, operationFileId, operationHash, activeEpochId. Der Kopf enthält höchstens abgeleitete Prüfsummen, keine unabhängig autoritativen Guthabenzähler. Direktes Lesen genau dieser gebundenen ID ist Pflicht; `files.list` dient der Entdeckung unveränderlicher Historie, nicht der Bestimmung des neuesten Kopfes.

`ConfirmedHead` ist ein geprüfter lokaler Nachweis dieses Inhalts einschließlich contentHash, nicht ein frei setzbares paid-Flag. Lokaler Zustand speichert nur vollständig nachvollziehbare Kettenpräfixe. Download eines alten Kopfes darf einen neueren bekannten Präfix nicht zurückrollen; ein neuer Kopf muss lückenlos auf den bekannten Vorgänger zurückführen. Die Cloud-Nebenläufigkeit hängt weiterhin an der unbewiesenen Schreibbedingung, nicht an der Sequenznummer selbst.

### 3.4 Unveränderliche Operationen und Guthabenbelege

Gemeinsamer Operationskopf: Versionskopf, kind `commerce-operation`, id, datasetId, activationId, sequence, previous `{operationId,operationHash}`, epochId, occurredAt, deviceId, operationType, payload. Strikte Größen-/Zählergrenzen, SHA-256 über kanonischen Gesamtinhalt; selbstreferenzierende Hashfelder vermeiden. Externer Index hält den Hash.

Kaufpayload:

`{profileId,article:{kind:'figure'|'item',id},catalogVersion,price,evidenceId,evidenceHash,earnedPoints,spentBefore,balanceBefore,balanceAfter}`.

Die Zahlen sind Prüfbehauptungen, keine unabhängigen Guthabenquellen. Validator berechnet sie erneut aus Evidence und vorherigen effektiven Kaufbelegen. Artikelart verhindert Namespace-Verwechslungen. Preis/Katalogversion bleiben historisch fest. Ein altes Angebot wird mit seinem damaligen Preis nachgewiesen, nicht rückwirkend mit dem heutigen Katalogpreis verrechnet. Für kommende Katalogversionen muss entweder die historische Katalogdefinition archiviert oder ihr vertrauenswürdiger Hash samt relevanter Artikeldefinition Teil des Belegs sein.

`EvidenceBundle` bindet mindestens datasetId, epochId, exakten effektiven/unterstützenden Lernfaktensatz, die benötigten unveränderten Ereignisse und deren Hash/Transportbelege. Möglichst vorhandene Snapshot-/Packet-Nachweise wiederverwenden. `project` über diesen gültigen Faktensatz muss genau earnedPoints liefern. Veraltete Evidenz darf keine früher bestätigte Ausgabe vergessen; alle Ausgaben kommen zwingend aus dem Koordinatorpräfix. Bereits bestätigte Evidenz wird bei späteren Käufen vereinigt/erneut validiert, nicht durch eine beliebige kleinere Sicht ersetzt. Konflikt/Quarantäne gibt kein neues Guthaben.

Belegwirkung nur bei Erreichbarkeit vom bestätigten Kopf. Gleiche operationId + gleicher intentHash ergibt bestehenden Ausgang; abweichender Inhalt sperrt. Bereits vorhandener Artikel bedeutet keine erneute Ausgabe. Nach bestätigtem vollständigem Restore kann ein alter Kauf auditierbar, aber im aktuellen Besitzstand absichtlich unwirksam sein; Retry meldet dann den früheren, durch Reset abgelösten Ausgang und kauft den Artikel nicht automatisch erneut.

## 4. Pure APIs für unabhängige Oberfläche

Die folgenden Module dürfen zuerst mit synthetischen, ausdrücklich validierten Eingaben gebaut werden. Sie führen keine Cloudschreibzugriffe aus und aktivieren keinen Produktkauf.

| Datei / Export | Eingang und Ergebnis |
| --- | --- |
| neu `src/trainer/shop/contracts.js` | `assertActivation`, `assertCommerceOperation`, `assertEvidenceBundle`, `assertCoordinationView`; strikt und versionsbewusst, keine IO. |
| neu `src/trainer/shop/integrity.js` | `verifyCoordination({ledger,coordination})` → asynchron vollständig geprüfte Ansicht; berechnet Hashes, prüft die lückenlose Kette und Lernbelege vor Zustandsübernahme. Strukturelles assert oder persistiertes `verified:true` ersetzt diese Prüfung nach Laden/Import nicht. |
| neu `src/trainer/shop/projection.js` | `projectCommerce({ledger,learningProjection})` → je Kind `{lifetimePoints,spentPoints,displayBalance,confirmedSpendable,ownedFigureIds,ownedItemIds,receipts,problems}` sowie globale `{activeEpochId,head,authorityStatus}`. `confirmedSpendable:null` bei fehlender gesicherter Grundlage; null niemals zu 0 oder frei verfügbarem Guthaben umdeuten. |
| neu `src/trainer/avatar/projection.js` | `projectAvatar({ledger,profileId,ownership})` → `{figureId,selectionsByFigure,selection,problems}`; `selection` ist mit vorhandener `normalizeSelection` normalisiert. Nutzt `levelEntitlements`, keine eigene Levelrechnung. |
| neu `src/trainer/shop/quote.js` | `quotePurchase({commerce,profileId,article,catalog,readiness})` → `{status:'available'|'owned'|'blocked',reason,price,balanceBefore,balanceAfter,requiredFigureIds,basis}`. `basis` bindet Profil/Epoche/Kopf/Katalog. Keine side effects. |
| neu `src/trainer/shop/view.js` | `shopViewModel({learning,commerce,avatar,connection,profileId,catalog})` → reine Karten-/Filter-/Dialogdaten. Connection darf displayBalance zeigen, macht daraus aber keine Ausgabefreigabe. |
| erweitert `src/trainer/commands.js` | `selectFigure({profileId,figureId})`, `setFigureOutfit({profileId,figureId,selection})`; speichert ausschließlich neue Auswahlereignisse atomar. Kein `buy()` mit lokalem Boolean. |
| später neu `src/trainer/shop/purchases.js` | `createPurchaseService({commands,store,sync,coordinator,now,id})`; `prepare({profileId,article})` → bindende Vorschau; `confirm({previewId})` → `confirmed/owned/checking/stale/blocked`; `resolve({operationId})` nur Statusklärung, keine neue Kaufabsicht. |

`lifetimePoints` meint die gesamte wirksame Lernpunktesumme dieser bewusst gewählten Datenepoche (bestehendes Produktverhalten). Ein bestätigter vollständiger Restore darf sie wie bisher auf den gesicherten Stand zurücksetzen; ein normaler Kauf darf es nie.

Jeder V3-State verlangt `ledger.coordination`; jeder Ledger mit v3-Ereignissen ohne diesen Zusatz wird abgewiesen. Alle heutigen Konstruktionen eines neuen Ledgerobjekts aus fünf Feldern müssen explizit geprüft werden, besonders Join, Backupansicht und Restore. Die Legacyform bleibt nur für tatsächliche Legacyinputs erlaubt. UI-ViewModels erhalten aus dem zentral validierten Produktzustand abgeleitete Projektionen; ein frei eingespeistes Objekt mit `confirmed:true` ist kein Vertrauensbeweis.

Readiness mit festen Reason-IDs: `capability-unproven`, `offline`, `auth-required`, `sync-pending`, `authority-missing`, `authority-incomplete`, `epoch-conflict`, `data-conflict`, `restore-pending`, `purchase-checking`, `insufficient-funds`, `compatible-figure-required`. Die UI übersetzt sie zentral. Weniger spezifische Meldungen dürfen nicht ungeprüft `available` ergeben.

## 5. Koordination, Epochen und Wiederherstellung

Neue Datei `src/trainer/shop/coordinator.js` kapselt später `readConfirmed(binding)`, `prepareOperation(intent)`, `commitPrepared({operationId,expectedHead})`, `resolveOperation(operationId)` sowie `activate(binding)`. `commitPrepared` benutzt ausschließlich den im realen Probebericht belegten Transport; jeder 412-Konflikt liest neu und verlangt eine neue Prüfung. Das Zustimmungspreview wird nicht heimlich auf ein anderes Profil, eine andere Epoche oder einen anderen Preis übertragen.

`src/drive/client.js` erhält getrennte `readVersionedJson`, `updateJsonIfUnchanged`, `readVersionedMetadata`, `updateMetadataIfUnchanged`; die bestehende `putJson`-Create-Semantik bleibt unverändert. Transportdetails bleiben aus der UI entfernt. Nach Timeout ist dieselbe Operation unklar; kein automatischer erneuter Kauf mit neuer ID.

`resolveEpochs` bekommt einen strikt getrennten V3-Zweig: bei aktivierter Koordination ist nur deren vollständig belegte activeEpochId wirksam. Die alten DAG-Objekte bleiben erhalten; ihre Köpfe entscheiden dann nicht mehr allein. Ein fehlender Beleg darf keine freie Wahl aus mehreren Köpfen auslösen. `project`, `currentPolicy`, `currentGenerations`, Scheduling, Statistik, Adoption und Backup müssen denselben Resolver nutzen.

Reset ist eine Operation derselben Kette. Sein Payload bindet die vorherige Autorität, den Ziel-Lernsnapshot mit Hash, den Ziel-Commerce-Snapshot mit expliziten `effectiveReceiptIds`/Besitzgrundlagen und die unveränderliche neue Epoche/Manifestreferenz. Alle Zielobjekte werden vollständig hochgeladen/geprüft, bevor ein CAS den Wechsel aktiviert. Auditkette/Originalbelege werden nie abgeschnitten; ein Restore wählt deren aktuelle Wirkung ausdrücklich neu.

Kauf gewinnt vor Reset → Reset-Preview stale, Wirkung erneut anzeigen und bestätigen. Reset gewinnt → alter Kaufversuch stale, kein Übersetzen der Absicht in die neue Epoche. Offline-Reset bei bereits aktivierter Cloudkoordination darf lokal vorbereiten und sicher sichern, aber keine definitive neue gemeinsame Autorität behaupten. Notwendige UI-Darstellung/Erhalt des bisherigen lokalen Restore-Verhaltens ist vor Produktintegration gezielt festzulegen; der Entwurf erlaubt keinen stillen Produktsemantikwechsel.

`restore.js:confirmInternal` und `drive.js:publishLocalEpochs` dürfen unter V3 nur vorbereitete Ziele übertragen, keine unabhängige Epochenschaltung. Bei später auftauchenden alten v1/v2-Epochen: getrennt erhalten, als unkoordiniert/verspätet ausweisen, neue Käufe bis zur Einordnung sperren; keinesfalls automatisch auf die neueste clock wechseln. Alte Pakete im akzeptierten aktiven Epochensatz bleiben lesbar, wenn ihre bisherigen Schema-/Hashregeln passen; Daten anderer Epochen bleiben explizit spät.

Aktivierungsmarker mit Version 3 stoppt bei v2 den normalen Sync vor Upload. Er ersetzt nicht den V3-Autoritätsschutz: ein schon zuvor laufender alter Restore oder bereits gestarteter Request kann noch schreiben. Ein sichtbarer alter Client darf außerdem nicht als garantiert sofort abgeschaltet behauptet werden. Abnahmetest mit einer eingefrorenen v2-App ist Pflicht.

## 6. Migration und Sicherung

Neue `storage/migrate-v3.js:migrateProductStateToV3(state,{now})` arbeitet rein und baut vollständigen Zielzustand plus validierte Original-Sicherheitskopie. Alte v1-Zustände können über die weiterhin explizit auf v2 festgelegte vorhandene Migration vorbereitet werden; am Ende nur eine atomare Speicherung der geprüften Zielstruktur mit allen Originalkopien. Kein Zwischenschreiben eines halb migrierten Zustands. Speicherausfall lässt das Original aktuell. Wiederholte Migration darf keine doppelte Kopie oder Gutschrift erzeugen.

Vorher/nachher prüfen: alle alten canonical hashes, event IDs, prepared packet contents/IDs, Snapshot-/Beleghashes, outbox, restoreJobs, aktive Runden, Punkte, Profiltrennung, bisherige Farben/Zubehör. Keine neue cloudseitige Aktivierung während der lokalen Migration; `activation:null` und gesperrte Kaufaktion sind der sichere Start.

V3-Backup ergänzt einen ausdrücklich versionierten `commerce`-Abschnitt mit Aktivierung, vollständigem benötigtem Auditpräfix, Originalbelegen/Evidenz und Commerce-Snapshot. `snapshotHash` für alte Snapshots bleibt exakt gleich; neue Funktion `commerceSnapshotHash` und neuer Envelope-Gesamthash binden beide Bereiche. Legacybackup-Validatoren behalten ihre exakten Schlüssellisten. Neue Sicherungen dürfen unklare Kaufjobs als Transportinformation erhalten, aber nie als bestätigten Besitz ausweisen. Fehlende Belege verhindern eine als vollständig bezeichnete Sicherung.

`backupLedger` braucht für V3 einen ausdrücklich als Offlineansicht markierten, aus validierten Backupnachweisen abgeleiteten Autoritätskontext. Die heute künstlich erzeugte view-Epoche darf nicht als echter Koordinatorreset oder neu bestätigter Kauf erscheinen. `previewBackup` zeigt je Kind Lernpunkte, Ausgaben, Guthaben, entfernte/erhaltene Käufe und geänderte Figur/Ausstattung. Restore übernimmt nie alte lokale Shop-ETags oder Cloudkopf-IDs als neu autoritativ.

**Offener Sonderfall:** Fremddatensatz-Restore schreibt heute datasetId in Kopien um. Eine V3-Kaufkette darf nicht auf diese Weise umetikettiert und als original bestätigt behandelt werden. Vor Umsetzung entweder provenance-erhaltenden Import mit unveränderten Originalbelegen und expliziter neuer Reset-/Importabbildung spezifizieren oder diesen konkreten Fall vorübergehend als nicht unterstützt anzeigen. Diese Auswahl ist kein hier freigegebener Produktwechsel und darf nicht beiläufig in Migration/Backupcode entschieden werden. Same-dataset-Restore ist zuerst vollständig spezifizierbar.

## 7. Fünf wesentliche Risiken und verpflichtende Tests

| Risiko | Konkreter vorgeschlagener Test / Nachweis |
| --- | --- |
| 1. Zwei Konten oder ungeschützte Medienupdates geben dieselben Punkte zweimal aus. | Reale Medien- und Ordner-Metadaten-CAS-Nachweise separat; zwei Kandidateninitialisierer derselben bekannten Bindung; nur Gewinneranker verwenden. Zwei 800-Punkte-Käufe auf 1000 Punkte, hundert deterministische Mock-Interleavings plus mehrere reale Rennen. Fehlender ETag/ignorierter Header/412 mit Schreibwirkung muss sperren. Ohne reale Gates kein Produkttransport. |
| 2. Antwortverlust/Absturz verdoppelt Besitz oder verliert einen bestätigten Kauf. | Crash nach jedem Übergang: IDs reserviert, Job gespeichert, Beleg hochgeladen, CAS angenommen, Antwort verloren, lokaler Commit fehlgeschlagen. Mit gleicher operationId nach neuerem fremdem Kopf neu starten: einmalige Ausgabe/Beleg, Besitz wiederhergestellt. Gleiche ID mit anderem intentHash sperrt. Historischer vor Reset liegender Kauf wird nicht neu ausgeführt. |
| 3. Alter Client oder paralleler Restore aktiviert eine unkoordinierte Epoche. | Eingefrorene v2-App mit bereits vorbereitetem Restore; V3 aktiviert/verkauft; v2 veröffentlicht später. V3 behält bestätigte Epoche und Historie, zeigt späte Kontrolle, sperrt Käufe bis Auflösung. Zusätzlich beide Gewinnerreihenfolgen Kauf/Reset und zwei Resets; veraltete Vorschau darf nicht automatisch fortgesetzt werden. |
| 4. Migration oder Backup verändert Altbytes, dupliziert Punkte oder verliert Kaufbeweise. | Eingefrorene v1/v2-Fixtures inkl. pendingPackets, mehreren Köpfen, alter Sicherheitskopie, laufender Runde/Restorejob. Alle alten Objekt-Hashes vor/nach identisch; simuliertes IndexedDB-Abort lässt ursprünglichen state bestehen. V3 Export/Import-Reihenfolgen, fehlender Beleg, falscher Kettenhash und fremde datasetId abweisen. Keine wiederholbare Startgutschrift. |
| 5. Projektion/UI bezahlt aus ungeprüften Punkten oder überschreibt eine andere Figur/ein anderes Kind. | Permutierte Downloads/duplizierte Ereignisse ergeben identische Punkte, Belege und Guthaben. Widersprüchlicher Antwortslot/früherer Rundenabbruch landet nach bestehendem Schema in Konflikt, erhöht niemals spendable. Profilwechsel während Kaufpreview invalidiert die UI-Aktion. Mensch→Tier→Mensch erhält beide Outfits; spätes legacy avatar.changed schaltet Tier nicht zurück. Anprobe schreibt nichts; unbekanntes/unbesessenes/inkompatibles Teil wird nur in der Ansicht neutralisiert. |

## 8. Reihenfolge des Kandidaten

1. Pure Vertrag-/Avatar-/Commerceprojektionen und synthetische UI-ViewModels mit den vorhandenen Katalog-APIs entwickeln; Shopbestätigung bleibt capability-unproven. Keine produktive Migration auslösen, nur Fixtures.
2. Reale Probe auswerten. Falls Medien- oder Genesis-CAS scheitert: Transportabschnitt verwerfen/überarbeiten; Pure-Katalog-/Galeriearbeit bleibt verwendbar. Keine Create/409-Kette als Ersatz behaupten, solange deren erste eindeutige Bindung unbewiesen ist.
3. Nach belastbarem Nachweis Koordinator-, Altclient-/Reset- und Backup-Vertrag unabhängig reviewen; Offline-/Fremddatensatz-Restore-Sonderfälle konkret entscheiden, ohne bestätigte Fragen neu aufzunehmen.
4. Erst dann atomare V3-Migration, Transport und produktive UI-Verkabelung mit realem Freigabegate. Cacheversion/Assetliste erhöhen und kontrollierten Update-/Offlinepfad prüfen.

Das Dokument beschreibt mögliche Modulgrenzen und Prüffälle, keine abgeschlossene Implementierung und keine Zusage unbekannter Google-Servergarantien.
