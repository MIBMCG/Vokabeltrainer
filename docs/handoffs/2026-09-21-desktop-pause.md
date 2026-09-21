# Desktop-Übergabe und Nutzerpause – 21.09.2026

**Die Entwicklung ist auf ausdrücklichen Nutzerwunsch pausiert. Keine weitere Entwicklung während der Pause.** Erst nach ausdrücklicher Fortsetzung weiterarbeiten. Diese Übergabe ersetzt die älteren Pausen- und Fortsetzungsnotizen als aktuelle Steuerung.

## 1. Wichtigster Einstieg

Der aktuelle Auftrag betrifft den bestätigten [Plan für dauerhafte Käufe](../superpowers/plans/2026-09-20-persistent-purchases.md) und den [Integrationsentwurf](../superpowers/specs/2026-09-20-persistent-purchases-design.md). **Tasks 1 und 2 sind unabhängig geprüft. Task 3 ist implementiert; Korrekturrunde 1 ist getestet, aber noch nicht unabhängig nachgeprüft. Tasks 4–6 wurden nicht begonnen.**

Der erste nächste Schritt ist daher eine **gezielte unabhängige Nachprüfung von R3-1 bis R3-4**, keine Neuimplementierung und keine erneute Anforderungsklärung. Den [Reviewbericht](../reports/2026-09-21-persistent-purchases-task3-review.md) vollständig lesen und mit dem [Umsetzungs-/Korrekturbericht](../reports/2026-09-21-persistent-purchases-task3-implementation.md) abgleichen.

Die alten neun Befunde zu Task 9 des v1-Plans vom 18.09. sind historische Vorgeschichte. Nicht diese alte Arbeit erneut aufnehmen. V1 und die Überarbeitung A1–C2 wurden auf dem zwischenzeitlich aktualisierten GitHub-Stand bereits abgeschlossen. Der aktuelle Kaufplan hat seine eigene Tasknummerierung.

## 2. Git- und Arbeitsstand

- Repository: `https://github.com/MIBMCG/Vokabeltrainer.git`.
- Arbeitsbranch: `codex/vokabeltrainer-v1`; kein Merge nach `main`, kein Force-Push.
- Am 21.09. wurden 113 neuere Commits bis `777b3511e280f37de7aa0a940ca86b6b16a5fdbf` übernommen. Die folgende Arbeit baut darauf auf.
- Letzter Codecheckpoint: **`1ecddd665d6d19978cf53c1fe58df1a0a819f69a`**, `wip: checkpoint purchase service fixes for desktop review`.
- Dieser Checkpoint enthält ausschließlich die jüngsten Änderungen an `src/trainer/purchases/service.js`, `tests/trainer/purchases-recovery.test.js` und `docs/KAUFPROTOKOLL.md`. Er ist zur Übergabe gesichert und ausdrücklich noch nicht unabhängig freigegeben.
- Die Übergabedokumentation folgt als eigener Commit. Der beim Abschluss bestätigte Remote-Stand ist der Commit, auf den `origin/codex/vokabeltrainer-v1` nach dem Push zeigt; lokale `HEAD` und `git ls-remote` müssen übereinstimmen. Der abschließende Vergleich wird im Antworttext genannt, damit kein selbstreferenzieller Commit-Hash in dieser Datei nötig ist.
- Vor dem Übergabepush wurde GitHub nach dem Internetabbruch erneut lesend erreicht; der Remote stand unverändert auf `777b351`. Der Sandbox-Proxy war nicht erreichbar, der zulässige direkte Zugriff funktionierte. Keine Proxy-/Sicherheitseinstellung wurde verändert.
- Alle Entwicklungsagenten sind gestoppt. Der letzte laufende Test wurde beendet und sein Ergebnis gesichert; es läuft kein Test aus diesem Arbeitspaket weiter. Persönliche Server oder Browserdaten wurden nicht beendet oder verändert.

Wichtige Commitfolge:

| Commit | Bedeutung |
| --- | --- |
| `5904dec` | Vier wichtige Task-1-Fehler korrigiert; unabhängig freigegeben |
| `ebe3914` | Task 2: Transport und Einrichtung |
| `c84b8bc` | Task 2: erste Korrekturrunde |
| `cd6ba45` | Task 2: zweite Korrekturrunde; danach unabhängig freigegeben |
| `a887b55` | Dauerhafte Task-2-Berichte und Übergabe |
| `5f73008` | Task 3: erste Implementierung von Migration, Journal und Service |
| `231d796` | Task-3-Review mit vier offenen Befunden dokumentiert |
| `1ecddd6` | Getestete Task-3-Korrektur als Übergabecheckpoint, Nachprüfung ausstehend |

## 3. Geprüft, implementiert und noch offen

### Task 1 – geprüft

Reine Schemata, gehashte Basen, Belegprüfung, Herkunft und wirtschaftliche Projektion sind vorhanden. Korrigiert wurden unerlaubter Epochenwechsel beim Kauf, Wiederverwendung alter Restoreepochen, unvollständige verschachtelte Fremdherkunft und unzureichend gebundene gespeicherte Versuche. [Korrekturbericht](../reports/2026-09-21-persistent-purchases-task1-fix.md), [Nachprüfung](../reports/2026-09-21-persistent-purchases-task1-review.md).

Die zwei früheren Minor-Befunde wurden in Task 3 bearbeitet und in dessen Erstreview als behoben bestätigt: echte Makrotask-Abgabe bei langen Historien und Erhaltung maschinenlesbarer Auth-/Netzfehler.

### Task 2 – geprüft

Gebundener Drive-Transport und dauerhaftes Bootstrap sind implementiert. Unbekannte Pointerausgänge werden standardmäßig nur nachgelesen. Ausdrückliche Wiederholung verwendet den ursprünglichen vollständigen Propertybody und die ursprüngliche opake ETag. Configref und Configbody werden gegen den tatsächlich installierten Anker geprüft; eine installierte andere Config darf auch über direkte Transportaufrufe nicht ersetzt werden. Kontoprüfung und abhängiger Request verwenden dasselbe einmal aufgenommene Laufzeittoken.

[Umsetzung und beide Korrekturen](../reports/2026-09-21-persistent-purchases-task2-implementation.md), [Erstreview](../reports/2026-09-21-persistent-purchases-task2-review.md), [Nachprüfung 1](../reports/2026-09-21-persistent-purchases-task2-fix1-review.md), [abschließende Nachprüfung 2](../reports/2026-09-21-persistent-purchases-task2-fix2-review.md).

### Task 3 – Korrektur getestet, Nachprüfung offen

Lokaler Speicher ist Version 3; Fachformat bleibt vorerst Version 2. Migration erzeugt zuerst validierte Sicherheitskopien und erhält alte Ledgerobjekte, IDs, PIN-Verifier und vorbereitete Uploads. Offene alte Restorejobs lassen den bisherigen Appstart zu und blockieren nur die Kaufmigration.

Die Erstreview fand vier relevante Fehler:

| ID | Erstbefund | Bearbeitung im Checkpoint, noch nachzuprüfen |
| --- | --- | --- |
| R3-1, P1 | Veralteter Ledger konnte einen ungültigen gemeinsamen Kaufkopf veröffentlichen | Verpflichtender Lernabgleich und vollständiges Abspielen des geplanten Belegs vor Upload/Pointer |
| R3-2, P1 | Operations-ID allein bestätigte einen abweichenden Auftrag | Exakter Intent/Kandidat/Controlvergleich ausschließlich auf der Zielkette; Herkunftsoperationen bestätigen keinen Zielauftrag |
| R3-3, P1 | Neue Lernpunkte blockierten weitere Käufe | Konten aus aktuellem geprüftem Ledger sowie bestätigtem Besitz/Ausgaben neu aufbauen |
| R3-4, P2 | Vollständige Neustart-/Speicherfehler-Matrix fehlte | Server und Client getrennt; gespeicherte Bytes in neue Store-, Transport-, Commands-, Service- und Syncobjekte laden |

**Nicht „Task 3 bestanden“ behaupten.** Der Implementierer meldet die vier Befunde als bearbeitet; die unabhängige Nachprüfung wurde wegen der Nutzerpause nicht mehr begonnen.

## 4. Tatsächlich ausgeführte Prüfungen

Alle Daten waren synthetisch. Node 26.8.2, Edge 153.0.4234.32, Playwright 1.62.1 auf dem ausführenden Rechner.

| Prüfstand | Ergebnis und Grenze |
| --- | --- |
| Ausgangsstand nach GitHub-Abgleich | `npm test`: 389/389 |
| Task-1-Korrektur | Fokus 49/49; Gesamt 391/391, einschließlich 1.000 Transaktionen |
| Task 2 vor Korrekturen | Fokus 12/12; Gesamt 403/403 |
| Task-2-Korrekturen | Runde 1: 32/32; Runde 2: 20/20; unabhängig nachgeprüft |
| Task 3 vor zusätzlicher 412-Selbstkorrektur | Fokus 92/92; Gesamt 431/431; danach Recovery 14/14 |
| Task-3-Browsernachweis | 4/4: v1→lokal-v3-Migration, fehlgeschlagenes Pflicht-Precache, Offline-Neustart, kontrollierter Workerwechsel |
| Task-3-Korrekturcheckpoint | Recovery 53/53; kombinierter Fokus 90/90; **Gesamt 471/471, Exit 0, 121,736 Sekunden** |

Die neue Matrix umfasst sechs Kauf-Speichergrenzen, vier Kauf-Netzgrenzen und 21 Initialisierungs-/Restorefälle. Zusätzliche Fälle prüfen geänderten Artikel, fremdes Profil, gleichnamige Herkunftsoperation und abweichenden Control-Kandidaten. Die drei Produktfehler wurden vorher als RED 0/3 reproduziert. Ein langsamer Fokuslauf dauerte 299,802 Sekunden; daraus keine allgemeine Drive-Geschwindigkeitszusage ableiten.

Die fertige Übergabedokumentation wurde mit `npm run check:docs` geprüft: 204 Markdown-Dateien, 931 lokale Verweise, 0 Fehler. `git diff --check` war ebenfalls ohne Befund.

Der Browsernachweis betrifft den unverändert ausgelieferten Migrations-/Cachepfad aus `5f73008`. Die jüngste Korrektur ändert Service, Recoverytests und Protokolldokumentation; der Kaufservice ist noch nicht aus der Produktoberfläche erreichbar. Kein neuer Browserlauf allein wegen der Pause.

Aktuelle Befehle:

```sh
npm test
npm run check:docs
node --test --experimental-test-isolation=none tests/trainer/purchases-recovery.test.js tests/trainer/purchases-contract.test.js tests/trainer/purchases-transport.test.js
```

Browserfokus:

```sh
node --test --experimental-test-isolation=none --test-name-pattern="B1 browser migrates|C2 rejected required precache|trainer offline" tests/browser/trainer.browser.mjs
```

Auf dem Desktop passende lokale Werte für `PLAYWRIGHT_MODULE` und `BROWSER_EXECUTABLE` setzen; keine Pfade des alten Rechners voraussetzen. In der bisherigen Sandbox brauchte der Browserstart einen zulässigen erweiterten Prozesszugriff. Synthetische isolierte Profile und freie Testports verwenden; einen persönlichen Server auf Port 4173 erhalten. `npm start` ist der vorhandene Entwicklungsserver, keine veröffentlichte App.

## 5. Verbindliche Schnittstellen und Entscheidungen

Die genauen Typen stehen in [KAUFPROTOKOLL.md](../KAUFPROTOKOLL.md). Wesentliche Ergänzungen gegenüber dem ursprünglichen Plan:

- `SetupJob.pointerProperties` speichert den vollständigen ursprünglichen Pointerbody; `etag` bleibt unverändert. `resumeBootstrap({…,repeatPointer:true})` ist der ausdrückliche Wiederholungsweg, der Standard liest bei unklarem Ausgang nur nach.
- `Commerce.control:null|ControlJob` ist getrennt von Kaufjobs. Der Control speichert `version`, `operationId`, `operation`, `phase`, `epochId`, `head`, `etag`, `candidate`, `pointerProperties`, `uploads`. Ein offener Control sperrt Käufe. Nur `initialize` hat keinen Vorgängerkopf.
- Kaufversuche speichern ebenfalls `pointerProperties`. Kandidat, Body und Bedingung bleiben nach möglichem Versand unverändert.
- `createPurchaseService({commands,transport,sync,now,id,onStatus})` bietet Aktivierung, Vorschau/Bestätigung, `refresh`, `resume`, Status/Ansicht, Auswahl sowie Restorevorbereitung/-bestätigung. `commands.commitExternal` bleibt der serialisierte Schreibweg.
- Neu vorgeschrieben: `sync.syncLearning() -> {phase:'synced',…}`. Danach überprüft der Service den aktuellen Commands-Zustand erneut. Der Task-4-Adapter darf nur den Lernabgleich ausführen und nicht in die laufende PurchaseService-Warteschlange zurückrufen. Fehlender oder unvollständiger Abgleich sperrt neue Käufe.
- `sync.prepareActivationCandidate({state,control,input,history,reserve})` und `sync.prepareRestoreCandidate(…)` liefern `{epochId,candidate,uploads}`. Sie dürfen noch keinen ungespeicherten Marker oder eine Epoche veröffentlichen.
- `sync.applyConfirmedControl({state,control,history})` liefert den atomar zu speichernden Produktzustand; die vollständige geprüfte Historie enthält Basen und Cache. Keine flüchtige Marker-/Zielautorität verwenden.
- Worker ist **v21**, synthetischer Updateworker **v22**. Aktuell erreichbar und gecacht sind `purchases/schema.js`, `value.js`, `proof.js`. Weitere neue Runtimeimporte müssen im selben Task in Serverfreigabe und Cache aufgenommen und mit echtem Offline-/Updatebrowserfall geprüft werden.

Ausführungsentscheidungen und ihre Kosten:

1. Den vorhandenen sauberen Featurecheckout statt eines verschachtelten Worktrees verwenden. Bei späterem Isolationsbedarf ist ein Umzug nötig.
2. Den fehlenden lokalen Aufgabenstand aus versionierten Berichten rekonstruieren; PowerShell statt hier gescheiterter Bash-Helfer nutzen. Temporäre Artefakte müssen gegebenenfalls neu erzeugt werden.
3. Abschließende Gesamtpaketreview ab `f54bd5d`, vor dem Kaufkern, statt ab historischem `main`. Bei zusätzlichem Querschnittsrisiko ist eine weitere gezielte Prüfung nötig.
4. Runtimefreigabe, Cache und Offline-/Updateprüfung schon beim ersten erreichbaren neuen Import ergänzen. Das kostet zusätzliche Browserprüfung, erweitert aber nicht den Produktumfang.
5. Vollständigen Setup-PUT persistieren und installierte Configautorität frisch prüfen. Kosten: Schema-/API-Nacharbeit sowie zusätzliche Drive-Reads. Pro Schreibgrenze fallen derzeit fünf gebundene Reads samt Kontoprüfungen an; echte Latenz nicht gemessen.
6. Einen eigenen dauerhaften Initialize-/Restore-Control und entsprechende Task-4-Ports einführen. Kosten: lokale Schema-/Portanpassung und zusätzliche Wiederaufnahmetests vor Auslieferung.
7. Einen gesonderten verpflichtenden Lernabgleich und Kandidatenprüfung vor Veröffentlichung einführen. Kosten: weiterer Abgleich und Adapterarbeit; verhindert eine neue frei behauptete Punktequelle und rekursive Serviceaufrufe.

Diese Entscheidungen sind technische Konkretisierungen des bestätigten Entwurfs, keine neue Cloud-, Kosten- oder Produktentscheidung.

## 6. Konkrete Weiterarbeit nach ausdrücklicher Fortsetzung

1. `AGENTS.md`, `START-HIER.md`, `ARBEITSSTAND.md` und diese Übergabe lesen. Branch, Remote und lokale Änderungen prüfen und erhalten. GitHub abrufen; einen bestehenden sauberen passenden Branch nur per Fast-Forward aktualisieren. Keine fremden Änderungen zurücksetzen.
2. Task-3-Review und den vollständigen Korrekturbericht lesen. Reviewbasis **`5f73008`**, Fixcheckpoint **`1ecddd6`**. Den Bereich einmal als Log/Stat/Diff mit Kontext bereitstellen. Die enthaltene Controllerdokumentation ist keine weitere Produktänderung.
3. R3-1 bis R3-4 unabhängig nachprüfen, zusätzlich nur neue Fehler des Fixdiffs untersuchen. Spezifikations- und Qualitätsurteil verlangen. Gemeldete Tests anhand der Assertions prüfen; bestehende Läufe nicht ohne konkreten Zweifel wiederholen. Bei neuen Befunden fokussiert korrigieren und nachprüfen. Dies ist Korrekturrunde 1, nicht eine abgeschlossene Task-3-Freigabe.
4. Erst nach bestandenem Task-3-Gate Task 4 beginnen. Danach Tasks 5 und 6 gemäß bestätigtem Plan; keine erneute pauschale Startfreigabe verlangen, sobald der Nutzer die Pause ausdrücklich beendet.

Bestätigte Ausführung: GPT-5.6 Sol/hoch für Implementierung, GPT-6 Astra/hoch für unabhängige Datenreviews. Nur ein Produktimplementierer gleichzeitig; keine zusätzlichen Reviewer durch Implementierer. Der neue Rechner benötigt keine alten Agentensitzungen. Die ignorierten Dateien unter `.superpowers/sdd/2026-09-20-persistent-purchases/` waren nur lokale Koordination; Anforderungen, Befunde, Entscheidungen und Belege stehen portabel in diesem Repository. Scratch nicht force-adden und keine fremden Scratchverzeichnisse löschen.

## 7. Bereits erkannte Grenzen für Tasks 4–6

### Task 4: gemeinsamer Produktvertrag

- Format-/Regelversion 3 gezielt pro aktiviertem Bestand einführen; nicht versehentlich alle unverbundenen/offline Bestände durch einen globalen Versionswechsel von einem Kaufkopf abhängig machen. Ursprünglichen Descriptor und alte v1/v2-Objektbytes erhalten.
- Dauerhafte Marker-/Epochenabsicht und deren Veröffentlichung **vor** dem gemeinsamen Aktivierungspointer platzieren. Die bisherigen Prepare-Ports dürfen nicht unbemerkt publizieren; der Apply-Port kommt erst nach bestätigtem Kopf. Bei Bedarf einen klaren zusätzlichen Publikationsport oder einen gespeicherten Outboxpfad konkretisieren.
- Restoreziel/Vorschau schon vor der Control-Closure dauerhaft sichern. Aktuelle alte-Restore-Sperre unterscheidbar erweitern, damit der eigene neue koordinierte Restorejob erlaubt bleibt, offene Legacyjobs aber weiterhin zugänglich sind und die Migration blockieren.
- Wird ein älterer lokaler Control erst nach einem späteren Restore wiedergefunden, die Epoche des neuesten verifizierten Kopfes anwenden; nicht blind `control.epochId` reaktivieren.
- Leeres zweites Gerät muss installierte Config, vollständige Belege und aktive Epoche entdecken. Unkoordinierte alte Epochen dürfen keinen neuen Kopf aktivieren. Verspätete Lernereignisse erhalten und ausdrücklich übernehmen lassen.
- Fremdimport braucht eine eigene überprüfte Herkunftsclosure. Normale Kaufautorität nicht für fremde Datensätze aufweichen. Verschachteltes A→B→C muss auf C allein aus neuen physischen IDs und unveränderten Originalbodies rekonstruierbar sein.
- V3-Backups enthalten vollständige Belege/Basen/Herkunft/Auswahl, aber keine Tokens, lokalen ETags oder ausführbaren Jobs. Fehlende/manipulierte Herkunft, Zyklen, mehr als 25 MiB und voller Speicher müssen den bisherigen Zustand erhalten.
- Unveränderte v1-Testquellen existieren unter `tests/compat/v1`. Für echte eingefrorene v2-Clients den historischen Ausgangscommit **`777b3511e280f37de7aa0a940ca86b6b16a5fdbf`** verwenden, nicht die inzwischen geänderten Commands. Transitive Importmenge von Commands/Sync/Restore bytegetreu sichern, Hash-/Größenmanifest prüfen; Tests ohne Git/Netz zur Laufzeit. Unter Windows historische Bytes nicht durch PowerShell-Textpipelines verändern. Bestehende v1-`-text`-Regel erhalten.

### Task 5: Anbindung

Erst nach Datenfreigaben Einrichtung, Status, Kaufaktionen und Auswahl anbinden. Echte Lernpunkte verwenden, Konten je Kind trennen, Offlinebesitz erhalten, neue Offlinekäufe sperren. Unklarer Ausgang und ausdrückliche Fortsetzung müssen sichtbar sein. Keine neue Bildproduktion in diesem Paket.

Die vier bestätigten transparenten Quellen sind `docs/design/avatar-evolution-sources/dragon-stage-1-v3.png`, `dragon-stage-2-v3.png`, `dragon-stage-3-v1.png` und `dragon-stage-4-v2.png`. **4 von 76 Motiven** sind vorbereitet; die restlichen 72 nicht als fertig ausgeben. Fehlende Bildformen bleiben erkennbar ausstehend und werden nicht als fertige Kaufartikel angeboten. Die vollständige Galeriegestaltung bleibt eigener Umfang. Aktuelle Cachekennung zu Taskbeginn erneut lesen, nicht auf eine ältere v20-Notiz zurücksetzen.

### Task 6: Abschluss

Gesamtregression, relevante Produkt-/Kaufbrowserfälle, Dokument- und Diffprüfungen sowie unabhängige Gesamtpaketreview ab `f54bd5d`. Alle noch offenen Entscheidungen und Reviewbefunde nachvollziehbar abgleichen. Kleiner vorgemerkter Portabilitätsbefund: `.gitattributes` fehlt `*.webmanifest text eol=lf`, obwohl der Dokumentchecker LF erwartet. Gezielte Attributregel und Verifikation genügen; keine künstlichen Unit-Tests dafür. Historische Kompatibilitätsbytes erhalten.

## 8. Grenzen der Übergabe

Kein echter Produktkauf, keine Cloudmigration und keine Veröffentlichung wurden ausgeführt. Probe10 bleibt der bereits vorhandene Realbeleg für das Grundverfahren; keinen identischen Lauf erneut verlangen. Reale Produktwiederaufnahme, zwei physische Geräte, iPhone/iPad und HTTPS bleiben gesondert offen. Der Produktshop ist noch nicht freigegeben oder in der App aktiviert.

Git überträgt Code, Dokumentation und synthetische Tests. Es überträgt keine Browserdaten, lokalen Lernprofile, Google-Tokens, Anmeldesitzungen oder persönlichen Backups. Für die Fortsetzung sind keine neuen Produktentscheidungen nötig; nur die ausdrückliche Beendigung dieser Pause und später die separat vorgesehenen echten Geräteprüfungen.
