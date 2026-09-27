# Dauerhafte Käufe – unabhängige Gesamtprüfung

Datum: 27.09.2026. Reviewer: GPT-6 Astra, Denktiefe high.

**Spec-Gate: NEEDS FIX.** Vier Important-Befunde verletzen die zugesagte aktuelle Sicherung, die gemeinsame wirtschaftliche Ansicht, den Erhalt berechtigter Auswahl oder die bedienbare Wiederaufnahme der Einrichtung.

**Qualitäts-Gate: NEEDS FIX.** Dieselben Integrationsfehler sind durch gezielte zusammengesetzte Reproduktionen belegt. Hinzu kommen ein bekannter Minor zur Tastaturbedienung und ein weiterhin roter Gesamtbrowser-Prüfnachweis. Es gibt keinen belegten Critical-Befund. Dies ist keine Abschluss-, Push- oder reale Gerätefreigabe.

## Prüfbereich und Belege

- BASE: `f54bd5d42762959c8c2dd8b2f746d417c0706706`.
- HEAD: `18e989c77b98e0f7394ca660ef7b0023dda6678c`, Zweig `codex/vokabeltrainer-v1`; sauberer Produktarbeitsbaum zu Beginn.
- Grundlage: vollständiges finales Diffpaket, finaler Brief und alle zwölf Crossmodule-Fokuspunkte, bestätigter Kaufentwurf/-plan, aktueller Abschlussbericht und Übergabe, die vierzehn dokumentierten Ausführungsentscheidungen sowie frühere Task-Reviews als Kontext. Die erneute Bewertung umfasst den Gesamtvertrag; frühere Teilfreigaben wurden nicht als Beweis für dessen Zusammenspiel verwendet.
- Vorliegende Controller-Nachweise: Node 499/499 auf `bdb65ad` bei danach unverändertem Produktcode; jüngster vollständiger Browserlauf 38/39 auf dem finalen Paket, I3 rot; Dokumentationsprüfung 1216 Dateien, 223 Markdown-Dateien, 830 lokale Links, keine Fehler. Diese Läufe wurden hier nicht wiederholt.
- Eigenständig ausgeführt: drei fokussierte Node-Reproduktionen für RF-2 bis RF-4; eine erfolgreiche fokussierte Edge-Reproduktion der tatsächlichen Backup-Bedienkette für RF-1; rein lesender Hash-/Längenabgleich aller 22 eingefrorenen v2-Quelldateien sowie Abgleich der neuen Kaufmodule mit Server-Allowlist und SW-Pflichtliste. Keine echten Google-Konten oder privaten Daten.
- Der bereits reproduzierte Fokusrest aus der Task-5-Nachprüfung gilt bei unverändertem Produktcode weiter. Die I3-Diagnose stammt vom UI-Implementierer und wurde anhand der tatsächlichen Assertion und Fixture semantisch geprüft; ihre Versuche werden nicht als eigene Läufe ausgegeben.

Die Reproduktionen verwendeten tatsächliche Commands, Kaufdienst und Integrationsfunktionen. Netzwerk und Speicher waren synthetisch. Für RF-1 wurden tatsächliche Shell, Erwachsenenansicht, Einstellungen, Backupansicht und Exportfunktion im Browser zusammengesetzt. Die Befunde beruhen somit nicht auf isolierten UI-Doubles, die das jeweilige fehlerhafte Verhalten bereits voraussetzen.

## Gemeinsame priorisierte Befundliste

### RF-1 — Important: Der Backupdownload sichert den alten Renderzustand

**Stellen:** `src/trainer/ui/backup.js:118–120,144–163`, insbesondere Zeile 150; Zusammenspiel mit `src/trainer/ui/shell.js:408–422` und `src/trainer/ui/adult.js:23–34`.

**Auslöser:** Die Erwachsenenansicht bleibt geöffnet, während Commands einen neueren Zustand speichert. Die Shell bewahrt diese Ansicht absichtlich, um Eingaben nicht zu verlieren. Anschließend wird „Sicherung herunterladen“ betätigt.

**Ursache und Folge:** Der Exporthandler verwendet weiterhin das bei `renderBackup` eingefangene `state` und die damalige Epochenauflösung. Der vorhandene `getState`-Port wird hier nicht benutzt. Deshalb enthält die als vollständige Sicherung angebotene Datei unbemerkt einen älteren Lern- und Wirtschaftsstand. Auch das `finally` rendert denselben alten Zustand erneut. Das Problem betrifft die neu angebundene v3-Sicherung unmittelbar; ein manueller Hinweis auf Hintergrundänderungen ersetzt keine korrekte Sicherung.

**Eigener Nachweis:** Ein synthetischer aktiver Bestand mit 300 belegten Punkten wurde über tatsächliche Commands und Shell geöffnet. Nach Öffnen von Einstellungen/Backup wurden über `commands.start` und `commands.submit` weitere zehn Punkte korrekt erwirtschaftet. `onChange` rief die tatsächliche `shell.stateChanged` auf. Der ursprüngliche Exportbutton blieb verbunden; der Änderungshinweis erschien. Nach Klick wurde der heruntergeladene Blob mit `parseBackup` und `backupLedger` gelesen und projiziert:

```json
{"pointsBefore":300,"currentPoints":310,"sameButton":true,"notice":true,"formatVersion":3,"exportedPoints":300}
```

**Abschlussvertrag:** Beim Klick einen frischen Commands-Snapshot erfassen und sowohl Epochenentscheidung als auch Export aus genau diesem Snapshot ableiten. Eine inzwischen entstandene Konfliktlage darf nicht mit einer veralteten Kopfauswahl übergangen werden. Die Erwachsenen-DOM-Erhaltung bleibt bestehen. Regression über die echte Shell-/Backupkette: Hintergrundänderung, identischer weiterhin verbundener Button, Export enthält 310 Punkte; zusätzlich aktuelle wirtschaftliche Auswahl beziehungsweise aktuelle Kopfänderung berücksichtigen.

### RF-2 — Important: Der langlebige Kaufdienst verwendet nach gemeinsamem Sync eine alte Historie

**Stellen:** `src/trainer/purchases/service.js:40,269–277,630–635,648–668`; Zusammenspiel mit `src/trainer/main.js:274–292` und dem bestätigten Head-/Cache-Commit in `src/trainer/purchases/integration.js:399–404`.

**Auslöser:** Ein Kaufdienst hat bereits `lastHistory` geladen. Ein anderer Client bestätigt einen Kauf; der normale ProductSync-/Integrationspfad übernimmt dessen neueren Kopf und Cache über Commands. Die bestehende Dienstinstanz bleibt bei gleicher Bindung und Descriptor bestehen.

**Ursache und Folge:** `getView` lädt den Cache nur, wenn `lastHistory === null`. `selectInternal` verwendet ebenfalls die alte Instanzhistorie. `view` kombiniert deshalb den neuen `commerce.head` mit Ausgaben/Besitz aus dem alten Kopf. Ein normaler Hintergrundabgleich kann bestätigten Besitz und verfügbares Guthaben in der laufenden Ansicht falsch darstellen; eine neue Dienstinstanz korrigiert das Ergebnis. Eine explizite zusätzliche Kaufdienst-Aktualisierung wäre ein Umweg, kein erfüllter normaler Syncvertrag.

**Eigener Nachweis:** Erste reale Serviceinstanz lädt die Initialisierung. Zweite Instanz bestätigt `evolution:explorer-girl:2` für 200 Punkte. Die erste Seite übernimmt den neuen Kopf über die tatsächliche `integration.reconcile` und einen tatsächlichen atomaren `commands.commitExternal`. Danach Vergleich von bestehender und frischer Serviceinstanz auf demselben gespeicherten Zustand:

```json
{"head":"reserved-5","staleSpent":0,"staleOwned":[],"freshSpent":200,"freshOwned":["evolution:explorer-girl:2"]}
```

**Abschlussvertrag:** Die ausgelesene Historie muss an den aktuellen bestätigten Kopf samt Bindung/Config gekoppelt sein. Bei externem Commit muss der Dienst die dazugehörige lokal verifizierte Historie verwenden; Offlinebesitz darf dafür keinen neuen Netzaufruf verlangen. Ansicht und Auswahlprüfung müssen dieselbe aktuelle Basis verwenden. Regression mit fortbestehender Serviceinstanz und tatsächlichem Sync-/Commands-Commit, anschließend `getView` und `select` ohne Reload oder manuelles `refresh`. Einen späteren bestätigten Restore ebenfalls gegen veraltete Besitzrechte absichern. Der Restore-Fall ist eine notwendige Regression der Korrektur, nicht ein zusätzlich behaupteter eigener Repro.

### RF-3 — Important: Ein gewöhnlicher Abgleich löscht eine neu erspielte gültige Figurenauswahl

**Stelle:** `src/trainer/purchases/integration.js:404–410`, insbesondere `const accounts = history.projection.accounts` in Zeile 405.

**Auslöser:** Seit dem letzten Kaufkopf werden weitere Punkte verdient, die eine kostenlose Level-Figur freischalten. Das Kind wählt diese Figur. Danach läuft ein normaler Abgleich, ohne neuen Kaufkopf.

**Ursache und Folge:** `service.select` prüft richtig gegen aktuelle Lernfakten plus bestätigte Ausgaben/Besitz. `reconcile` filtert dieselbe Auswahl hingegen gegen die Konten der letzten Receiptbasis. Eine gültige neue Level-Freischaltung fehlt dort und die gespeicherte Auswahl wird gelöscht, obwohl die aktuellen Lernpunkte erhalten bleiben. Das verletzt die automatische Freischaltung und den Erhalt der bewusst getroffenen Auswahl.

**Eigener Nachweis:** Initialer bestätigter Kopf mit 300 Punkten; zehn weitere gültige Antwortfakten derselben aktiven Epoche werden über einen tatsächlichen Commands-Commit hinzugefügt, sodass die tatsächliche Projektion 400 Punkte/Level 3 ergibt. Der tatsächliche Dienst akzeptiert `horse`, Stufe 1. Die tatsächliche Integration liest denselben unveränderten gemeinsamen Kopf und liefert:

```json
{"points":400,"before":[{"profileId":"p1","figureId":"horse","stage":1}],"after":[]}
```

**Abschlussvertrag:** Nach Übernahme der autoritativen Epoche die Auswahl anhand der aktuellen gültigen Lernprojektion zusammen mit den bestätigten Ausgaben und bezahlten Rechten prüfen, entsprechend `rebuildAccounts`. Dafür keinen neuen neutralen Cloudbeleg einführen. Regression: neue Level-Freischaltung nach letztem Kauf, Auswahl, normaler Sync mit unverändertem Kopf, Auswahl bleibt erhalten. Ein tatsächlicher späterer Restore mit niedrigeren Rechten muss weiterhin unberechtigte Auswahl entfernen beziehungsweise die bestätigte Restore-Auswahl übernehmen.

### RF-4 — Important: Ein unterbrochener Einrichtungs-Pointer ist über die tatsächliche Aktivierungsbedienung nicht wiederaufnehmbar

**Stellen:** `src/trainer/purchases/service.js:546–558` und abhängige Publikation `:512–513`; `src/trainer/ui/purchases.js:373–398`. Die vorhandene korrekte Installed-Config-Prüfung in `src/trainer/purchases/transport.js:487–500` begrenzt die Folge, heilt den Bedienpfad aber nicht.

**Auslöser:** Beim erstmaligen Einrichten geht die Antwort des Config-Pointers verloren, bevor der Server ihn übernommen hat. Der gespeicherte Setupauftrag steht anschließend auf `reconciling`; `commerce.mode` ist bereits `migrating`, `control` noch `null`. Die Aktivierungsansicht wird neu geöffnet und erneut bestätigt.

**Ursache und Folge:** Die UI bietet Wiederaufnahme nur für `commerce.control`, nicht für `commerce.setup`. Bei erneutem `prepareActivation` überspringt der Dienst `installSetup`, weil der Modus nicht mehr `inactive` ist. Er bereitet einen neuen Initialize-Control vor und veröffentlicht bereits abhängige Produkt-Snapshot-/Markerobjekte. Die Kauftransportgrenze weist die danach versuchten Kaufuploads wegen der nicht installierten Config mit `binding` ab. Nun existiert ein `reserved`-Control, dessen sichtbarer Fortsetzenknopf wieder in denselben Fehler führt. Der ursprüngliche Setupauftrag bleibt über die UI unerreichbar. Es ist kein unberechtigt aktivierter wirtschaftlicher Kopf nachgewiesen: die Transportgrenze verhindert diesen gerade.

**Eigener Nachweis:** Tatsächliche Commands, `createPurchaseTransport`, Bootstrap, Kaufdienst und `createCommerceIntegration`; synthetische HTTP-Fixture mit `dropPointerResponse()` vor Annahme des Dataset-Pointers sowie tatsächliche Produktpublikation über `SyntheticDrive`. Nach dem ersten Fehler wurde eine frische Serviceinstanz auf demselben gespeicherten Zustand erstellt und der von der UI verwendete `prepareActivation`-Pfad erneut aufgerufen:

```json
{"firstError":"network","setupPhase":"reconciling","firstControl":null,"retryError":"binding","afterSetup":"reconciling","afterControl":"reserved","installedConfig":null,"datasetPointerAttempts":1,"publicationUploads":3}
```

**Abschlussvertrag für die gemeinsame Fixwelle:**

1. Einen unklaren gespeicherten Setupauftrag zuerst nachlesen. Automatische Aktualisierung, Neustart oder ein erneutes `prepareActivation` dürfen keinen stillen neuen Pointerversuch senden. Sie dürfen lesend rekonstruieren oder auf die ausdrückliche Wiederaufnahme verweisen.
2. Die UI muss den vorhandenen Setupauftrag mit seiner gespeicherten `operationId` ausdrücklich fortsetzen können. Nur dieser bewusste Resume darf den identischen gespeicherten Pointer mit ursprünglichem Body, IDs und ETag wiederholen.
3. Vor bestätigter Configinstallation keine davon abhängige Marker-/Controlpublikation. Die vollständige abhängige Closure muss weiterhin vor ihrem ersten Upload dauerhaft gespeichert sein.
4. Bereits durch den fehlerhaften Pfad gespeicherte `reserved`-Controls samt offenem Setup dürfen nicht dauerhaft unerreichbar bleiben. Nach bestätigter Einrichtung muss der konsistente vorhandene Auftrag wieder aufgenommen oder nachvollziehbar in einen korrekt fortsetzbaren Zustand überführt werden; keine zweite ungebundene Aktivierung erzeugen.
5. Die Abnahme muss beide verlorenen Antwortfälle umfassen: nicht angenommen und angenommen, aber Antwort verloren. Frische Commands/Service/Transportobjekte, lesender Einstieg ohne Pointerwrite, sichtbares UI-Fortsetzen und identische Auftragsdaten prüfen. Zusätzlich den oben belegten `setup=reconciling` plus `control=reserved`-Altzwischenstand prüfen.

Dies verlangt keine neue Konten- oder Protokollarchitektur, sondern die bereits beschlossene Unknown-/Resume-Grenze in der vollständigen Aktivierungsbedienung.

### RF-5 — Minor: Fokusverlust nach veralteter Kaufvorschau und Abbrechen

**Stelle:** `src/trainer/ui/purchases.js:196–198`, Zusammenspiel mit dem Neuaufbau in `run` und `rerenderCurrentPurchase`.

Der aus Task 5 aufgeschobene R5-1-Rest bleibt offen: Nach einem `stale`-Fehler wurde der Kaufbereich neu aufgebaut, während der Dialog offen bleibt. „Abbrechen“ fokussiert anschließend den nicht mehr verbundenen ursprünglichen Trigger. Der Erfolgsweg hat bereits einen Rückfall auf die aktuelle Ansicht; Abbrechen nicht.

Der frühere tatsächliche Browsernachweis auf dem seither unveränderten Produktcode ergab:

```json
{"dialogCount":0,"activeTag":"BODY","activeInTabs":false,"activeConnected":true}
```

Keine verlorenen Daten und keine blockierte Mausbedienung; deshalb Minor, keine separate reine Minor-Fixrunde. In der gemeinsamen Welle Abbrechen nach `stale` auf ein sinnvolles verbundenes Element der aktuellen Ansicht zurückführen; verspätete Callbacks nach Navigation dürfen keine alte Route zurückholen.

### RF-6 — Important, Prüf-Gate: I3 ist im Gesamtbrowserlauf weiterhin rot; die pauschale Duplicate-Assertion misst mehr als den Idempotenzvertrag

**Stellen:** `tests/browser/trainer.browser.mjs:263–273`; `tests/browser/google-fixture.mjs:115–118`.

Der aktuelle Gesamtlauf ist 38/39. I3 wartet nach Reconnect 1200 ms, prüft nur die leere Ereignis-Outbox und verbietet anschließend rückwirkend jeden als `duplicate` markierten Schreibversuch der gesamten Fixturehistorie. Die Fixture markiert einen POST mit bereits existierender Datei-ID bereits vor ihrer korrekten 409-Antwort als Duplicate. Ein erwarteter identischer Retry nach verlorener Uploadantwort verletzt damit die Assertion, obwohl er den Idempotenzvertrag erfüllt. Leere Outbox allein bedeutet zudem nicht, dass alle `pendingPackets` einschließlich Metadatenabschluss abgearbeitet sind.

**Evidenzgrenze:** Der ursprüngliche rote Lauf enthielt nur den Boolean, keine konkrete betroffene Datei. Seine Ursache bleibt ungesichert. Laut eng dokumentierter Diagnose bestanden der unveränderte Einzellauf und vier parallele Läufe. Ein angehaltener Metadatenabschluss bei Outbox 0/Pending 1 plus 61 Sekunden erzeugte keinen Duplicate; dieses Zeitfenster ist daher nicht als bewiesene Ursache auszugeben. Ein gezielt verlorener Uploadresponse erzeugte dagegen einen legitimen identischen Retry mit genau einem physischen und fachlichen Ereignis und anschließend leeren Queues. Das belegt die zu breite Assertion, nicht die Erklärung des ursprünglichen roten Laufs.

**Geeigneter Abschlussvertrag:** Nach Reconnect auf Outbox 0, `pendingPackets` 0 und abgeschlossenen Zustand „Abgeglichen“ warten. Jede zuvor ausstehende Ereignis-ID weiterhin genau einmal physisch und fachlich nachweisen. Erst dann die Zahl der Writes als Baseline erfassen. Für den anschließenden 61-Sekunden-Leerlauf tatsächlichen Pollstart und dessen Abschluss abwarten und keine zusätzlichen Writes zulassen. Aussagekräftige Fehlerdaten zu Dateiart/Name/Paket-ID aufbewahren. Die gesamte Historie darf idempotente Wiederholungen enthalten; dies darf nicht durch bloßes Entfernen jeder Einmaligkeits-/Leerlaufprüfung ersetzt werden.

Bis die korrigierte, fachlich gleich starke Prüfung und der abschließende Gesamtbrowserlauf belegt sind, bleibt das Qualitätsgate offen. Kein Produktfix und keine bewiesene Produktregression aus dem alten Boolean ableiten.

## Zwölf Crossmodule-Fokuspunkte

| Fokus | Ergebnis und Grenze |
| --- | --- |
| 1. Dauerhaft vor Netz / unbekannter Pointer | Purchase-/Control-Closure, gespeicherte ETags und explizite Resume-Tests sind nachvollziehbar. Vollständige Bootstrap-Bedienkette verletzt die Reihenfolge/Wiederaufnahme: RF-4. |
| 2. Identitäten über Neustart | Recoverytests prüfen frische Store-/Commands-/Transport-/Serviceobjekte, Teiluploadpräfixe vor/nach Annahme, gespeicherte Kandidaten und tatsächlich empfangene Snapshot-ETags. Remote-Leserefs gewähren keine beliebige Schreibautorität. Keine weitere belegte Lücke neben RF-4. |
| 3. Tatsächliche Einnahmen / Voraussetzungen | Belege projizieren validierte eindeutige Antworten und Rundenabschlüsse mit 10/20, profilgetrennte Ausgaben und Katalogvoraussetzungen. Tests prüfen falsche Preise, Kollisionen und einen zweiten Kauf aus späteren Einnahmen. Die aktuelle Auswahlfilterung fällt dennoch hinter die Lernbasis zurück: RF-3. |
| 4. Alleiniger gemeinsamer Kopf | `discover` speichert den validierten Configanker vor Download; `reconcile` übernimmt erst verifizierte Historie. Tests enthalten wiederholten fehlgeschlagenen Sync, Cache, Neustart, echten Join und späte eingefrorene v2-Restorepublikation. Fehlender Initialize-Kopf erzeugt keine neue wirtschaftliche Autorität. RF-4 bleibt eine eigenständige Einrichtungslücke, keine Widerlegung dieser Schutzgrenze. |
| 5. Portable wirtschaftliche Closure | Gehashte logische/physische Proofabbildung, Originalkörper, verschachteltes A→B→C und gleicher Bindingfall sind abgedeckt. Backups enthalten keine ausführbaren Jobs, Tokens oder ETags. RF-1 exportiert jedoch einen zu alten Snapshot. |
| 6. v1/v2-Guards / offene alte Restores | Originalpayloads und IDs bleiben erhalten; alte Restorejobs verhindern vorzeitige Migration und haben den vorgesehenen Fortsetzungspfad. Version-, Rundengenerations- und Hashprüfungen bleiben aktiv. Ein bereits laufender alter Client darf unveränderliche Herkunft noch hochladen; diese aktiviert keinen v3-Zielkopf. |
| 7. Serving / SW / Offline | Alle zehn neuen Kaufkernmodule plus `ui/purchases.js` stehen in Allowlist und SW-Liste; eigener Abgleich ohne fehlenden Eintrag. Vorhandene Offlinebesitz-/Neustarttests prüfen Auswahl ohne Netz. SW bleibt auf Appassets beschränkt. Vier große PNGs sind die ausdrücklich zugelassene Zwischenlösung. |
| 8. Kinderansicht / ehrliche Zustände | Getrennte Lernpunkte, verfügbares Guthaben, Besitz und Pendingzustände sind in der UI angebunden; echte Browserkette mit erspielten Punkten, Reload und leerem Zweitgerät ist vorhanden. RF-2 verfälscht eine bereits laufende Instanz nach externem Kopfwechsel; RF-5 betrifft Tastaturfokus. Vollständige Galerie ist Folgeumfang. |
| 9. Mandatory syncLearning / Vorschautickets / Restore | Vor Kauf obligatorischer Lernabgleich, semantischer Vorschauhash getrennt vom vollständigen CAS, gespeicherte Restoreziele und public Resume sind nachvollziehbar. Bestätigte leere/Legacy-Auswahl und Vorrang einer späteren Epoche werden geprüft. Aktuelle sichtbare Aktivierungsvorschau und Ticket stammen aus derselben Basis. RF-2/RF-4 betreffen angrenzende reale Orchestrierung. |
| 10. Portabilität / Versionsgrenzen | `*.webmanifest` ist LF-fixiert. Alle 22 v2-Dateien erfüllen aktuell Länge und SHA-256 des historischen Manifests. Sie sind JavaScript und fallen unter die vorhandene LF-Regel; ein fehlendes v2-`-text` ist hier kein belegter Checkoutfehler. Neue Lernereignisse/Pakete bleiben bewusst `(2,2)`; storage 3 und aktivierte Commerce-Epochen/Backups sind davon getrennt. Kein unbegründeter Format-Rollback-Befund. |
| 11. Quellcheckpoint | Autoritative Ziel-Head-/Previousketten lehnen `checkpoint` ab; nur Restorequellreplay darf ihn verwenden. Snapshotgleichheit, monotone Fakten, Identitäts-/Kollisionsprüfungen, unveränderte Ausgaben/Bezahlrechte, deterministischer Offlineexport und portable Abbildung sind im Code und konkreten Assertions vorhanden. Kein Cloud-Pointer-API für Checkpoints nötig. |
| 12. Bewahrte Erwachsenenansicht | Die frische Restore-/Aktivierungsvorschau ist korrigiert. Der Download verwendet weiterhin die Renderclosure: RF-1, über tatsächliche Shellkette bestätigt. |

## Einordnung aller vierzehn Ausführungsentscheidungen

Nummerierung entsprechend dem [versionierten Entscheidungsbericht](2026-09-27-persistent-purchases-entscheidungen.md).

| Nr. | Reviewurteil |
| --- | --- |
| 1 | PowerShell-Äquivalente sind ein vertretbarer Werkzeugersatz; kein Produktvertrag wird daraus abgeleitet. |
| 2 | Sol/hoch für Umsetzung und Astra/hoch für unabhängige Prüfung entspricht der autorisierten Aufgabenverteilung. |
| 3 | Das gehashte Proofmanifest ist für portable Herkunft begründet; verschachtelte und gleich gebundene Abbildung sind konkret prüfbar. |
| 4 | Bezahlte Formen nur mit vorhandener Illustration ist umgesetzt und eine zulässige Begrenzung dieses Teilpakets. |
| 5 | Rekonstruktion aus portablen Septemberberichten ist nachvollziehbar; alte Berichtsurteile ersetzen die hier geprüften aktuellen Integrationspfade nicht. |
| 6 | Bestehenden isolierten Checkout weiterzuverwenden war angemessen; exakte Basis und Kopf wurden festgehalten. |
| 7 | Frischer Sol-Kontext für Task-3-Fixrunde 2 ist eine Prozessentscheidung ohne zusätzliche Produktbefugnis. |
| 8 | Vier bestätigte PNGs unverändert als Zwischenbestand ist autorisiert; etwa 6,9 MB Precache bleiben dokumentierte Kosten, kein neuer Finding. |
| 9 | Das separate Integrationsmodul erhält Commands als Schreiber und vermeidet rekursiven Sync. RF-2/RF-3/RF-4 verlangen eng begrenzte Korrekturen dieser Zusammensetzung, keine zweite Autorität. |
| 10 | Versionierten Scratch nicht pauschal löschen ist richtig. Eine Repositorybereinigung ist kein Bestandteil dieser Review. |
| 11 | Quellcheckpoint statt neuer Cloudoperation ist innerhalb der strikten Quellgrenze tragfähig. RF-1 liegt im aktuellen UI-Snapshot, nicht im bestätigten Checkpointkonzept. |
| 12 | Wiederverwendung des Reviewers wegen Agentenlimit ist transparent. Neues vollständiges Paket wurde unabhängig bewertet; frühere Beratungen sind keine Freigabe. |
| 13 | Verifizierter Push nur des Entwicklungszweigs entspricht dem Auftrag. Seine Voraussetzung einer abgeschlossenen grünen Gesamtprüfung ist aktuell nicht erfüllt. Kein PR, Merge oder Hosting aus dieser Review ableiten. |
| 14 | Die minimale Restore-Auswahlkorrektur gehörte zur neu zugesagten Bedienintegration. Die geprüften Leer-/Legacy-/Spätere-Epoche-Fälle bleiben gültig; RF-3 ist die zusätzlich belegte normale Syncfilterung. |

Keine dieser Entscheidungen erfordert eine neue Produktfrage. Die gemeinsame Fixwelle soll die vorhandenen Verträge herstellen und den beschriebenen Folgeumfang unangetastet lassen.

## Reproduktionsmethode und Grenzen

Die drei Node-Probes liefen als einmalige Inlineprogramme über `node --input-type=module`. Sie luden nur den Helperpräfix vor dem ersten `test(` aus `tests/trainer/purchases-recovery.test.js` als Data-URL-Modul; keine registrierte Testsuite wurde dabei ausgeführt. Relative Imports wurden auf absolute File-URLs aufgelöst. Für den Integrationsfall wurde der synthetische Placeholder-Descriptorhash durch den Digest des tatsächlichen Fixtureledgers ersetzt. Bestehende Helfer: `openHarness`, `PurchaseRemote`, `byteStore`, `createFixture`, `productState`, `SyntheticDrive`, `purchasesHttpFixture`. Die obigen JSON-Ausgaben sind die tatsächlich beobachteten Resultate.

Minimaler Aufbau für dauerhaft versionierte Regressionen:

```text
RF-2: A.service.refresh(); B auf gleicher Remote bestätigt Kauf;
      next = integration.reconcile({state: A.commands.getState(), ...binding/hash});
      A.commands.commitExternal(next, productStateHash(alterStand));
      A.service.getView() muss dem neuen bestätigten Kopf entsprechen.

RF-3: aktivierter Kopf mit 300 Punkten; 10 gültige neue Antworten -> 400;
      service.select({profileId:'p1', figureId:'horse', stage:1});
      integration.reconcile bei unverändertem Kopf -> Auswahl muss bleiben.

RF-4: tatsächlicher HTTP-Transport + Integration; dropPointerResponse();
      service.prepareActivation(...) -> network, setup reconciling/control null;
      frische Serviceinstanz; erneutes prepareActivation -> heute binding,
      control reserved, drei Produktuploads vor Configinstallation.
      Künftig: nur lesen/verweisen; ausdrückliche UI-Wiederaufnahme des Setup.
```

Die Browserprobe RF-1 verwendete `createTrainerHarness` mit lokalem Server und gerouteter synthetischer Google-Grenze, Edge und das vorhandene Playwright-Modul. Sie montierte tatsächliche Commands/Shell mit offenem synthetischem Erwachsenen-Gate. Ein vorheriger Harnessaufbau blieb irrtümlich in der PIN-Einrichtung hängen; ein zweiter hatte unvollständige Anzeigeports. Diese zwei Aufbauten erreichten den untersuchten Export nicht und wurden nicht als Produktfehler gewertet. Der abschließende Aufbau erreichte und belegte den tatsächlichen Download wie oben beschrieben.

Zusätzlich ausgeführt: reiner Node-Dateiabgleich gegen `tests/compat/v2/source-manifest.json` und Stringabgleich der neuen Runtimepfade in `scripts/serve.mjs`/`trainer/sw.js`:

```json
{"frozenV2Files":22,"missingFromSW":[],"missingFromServe":[]}
```

Unveränderte Nachbarpfade wurden nur für konkrete Zusammensetzungsrisiken gelesen: erwachsene DOM-Erhaltung, bestehender Downloadhandler, Commands-Ereignis-/Packetversion, Scheduler-/Fixtureabschluss in I3 und öffentlicher Restore-/Syncanschluss. Historische eingefrorene Quellen wurden über Manifest und einschlägige End-to-End-Assertions beurteilt; es wurde kein neuer Umbau dieser Quellen verlangt. Die Task-6-Teständerung für klassische Bilder behält `loadedArt` und sämtliche Bild-/Bedienassertions bei und bringt die Lazy-Bilder zuvor in den Viewport. Die Inhaltskonfliktprüfung bleibt bestehen; die zusätzliche Abgleichwartebedingung verhindert lediglich einen unvollständigen Ausgangsstand.

Nicht nachgewiesen: Ursache des ursprünglichen roten I3-Gesamtlaufs, echte Google-Produktoperationen auf getrennten physischen Geräten, Safari/iPhone/iPad/Home-Bildschirm-App, Hosting sowie die vollständige Galerie mit 72 weiteren Motiven und responsiven Produktionsvarianten. Diese Grenzen werden nicht durch synthetische Tests oder bestehende Screenshots geschlossen.

## Übergabe an die eine gemeinsame Fixwelle

RF-1 bis RF-4 beheben; RF-5 im selben begrenzten UI-Schritt erledigen; RF-6 mit fachlich starken Assertions und brauchbaren Fehlerdaten schließen. Keine parallelen Produktimplementierer erforderlich. Danach genau eine gezielte Nachprüfung der vier Produktrepros, des Fokuswegs und des korrigierten I3-Vertrags einschließlich unmittelbarer Folgerisiken. Erst aktuelle passende Gesamtprüfungen plus geschlossene Spec-/Qualitätsgates können den beauftragten Abschluss tragen.
