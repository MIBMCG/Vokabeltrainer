# Task 1 – unabhängige Nachprüfung der Korrekturrunde 1

Stand: 21.09.2026. Bereich: `777b351..5904dec`, anhand des bereitgestellten `task-1-fix1-review.diff`. Der Produktstand an der Basis entspricht laut Übergabe dem ursprünglich geprüften `7ec80fd`; die Zwischenstände waren Dokumentation.

**Scoped Spec Compliance: erfüllt. Task quality: approved für die vier wichtigen Korrekturen.** Alle vier ursprünglichen Important-Befunde sind **ADDRESSED**. Keine neue relevante Beschädigung im Fix-Diff festgestellt. Task 2 kann auf diesem korrigierten Kern aufbauen. Die zwei ausdrücklich auf Task 3 verschobenen Minor-Befunde bleiben offen; dies ist keine Freigabe des gesamten Integrationspakets oder eines realen Gerätebetriebs.

## Befunde einzeln

### 1. Kauf aktiviert ohne Restore eine andere Epoche — ADDRESSED

- `src/trainer/purchases/history.js:322`: Kaufbelege müssen die Epoche ihres direkten Vorgängers beibehalten, bevor Faktenfortschreibung und Kontoprojektion stattfinden. Die bestehende Prüfung in `history.js:204` bindet die Belegepoche weiterhin an die aktive Epoche der geprüften Basis. Ein bloß umgehüllter Ledger kann deshalb keinen Epochenwechsel mehr über einen Kauf auslösen.
- `tests/trainer/purchases-contract.test.js:227`: Der neue Negativfall liefert vollständig gehashte Anfangs- und Kaufbasen mit identischen Fachfakten, aber `e0` beziehungsweise `e-new`, und erwartet `history`. Er trifft den ursprünglichen Befund unmittelbar.

### 2. Restore reaktiviert aktuelle oder frühere Epoche — ADDRESSED

- `src/trainer/purchases/history.js:307`, `:318`, `:373`: Die iterative Wiedergabe führt verwendete Epochen getrennt nach vollständiger Binding und nimmt jede verarbeitete Belegepoche auf. Ein Restore wird abgewiesen, sobald seine Zielepoche in dieser Binding bereits vorkam. Vorgänger werden vor abhängigen Belegen verarbeitet; dadurch sind sowohl die aktuelle als auch ältere Epochen bei der Prüfung bekannt.
- `tests/trainer/purchases-contract.test.js:542`: Beide ursprünglichen Fehlerklassen werden separat als Tabellenfälle geprüft: dieselbe aktuelle Epoche `e1` und die frühere Epoche `e0`.
- Der geänderte Langfall erzeugt tatsächlich 1000 neue Epochen samt eigenen gepackten Basen und vollständig gehashten Belegen. Er erwartet `e1000`, 1001 eindeutige Operations-IDs, echte Punkte und den vollständigen Cachepfad. Die alte unzulässige Zwei-Epochen-Reaktivierung wurde entfernt, ohne die Historienlänge nur vorzutäuschen.

### 3. A→B→C verliert verschachtelte portable Provenienz — ADDRESSED

- `src/trainer/purchases/history.js:139`, `:155`, `:185`: Die erwartete Quellclosure enthält zusätzlich jedes referenzierte ältere Proofmanifest und dessen physische Mappingobjekte. Der weiterhin iterative Gang über die Herkunftsbelege erreicht auch tiefer verschachtelte Proofs. Die exakte Mengenkontrolle und Hash-/Bindingkontrollen bleiben erhalten.
- `tests/trainer/purchases-contract.test.js:433`: Das äußere Proofpaket enthält das unveränderte innere Manifest und dessen Mappingwerte zusätzlich zu den ursprünglichen logischen Belegen/Basiswerten. Die C-Lesemenge enthält nur C-eigene Initialisierungs-/Restoreobjekte und die neu reservierten äußeren Proofdateien. Die früheren physischen A-/B-Dateien stehen dem Leser nicht zur Verfügung.
- `tests/trainer/purchases-contract.test.js:499`, `:505`: Die Wiedergabe von C prüft die neue aktive Epoche, 100 verbleibende Punkte und den übernommenen Besitz von Kind A sowie die vollständige Gleichheit des ursprünglichen Kaufbelegs einschließlich seiner Referenz und seines Hashes. Der bestehende erste Fremdrestore prüft zusätzlich das unberührte 300-Punkte-Konto des zweiten Kindes; die Kontoprojektion selbst wird im Fix nicht geändert. Der A→B→C-Teil enthält keine zusätzliche eigenständige Zweitkind-Assertion, was die behobene Portabilitätslücke nicht offen lässt.
- Zur Beurteilung wurden die unveränderten unmittelbaren Helfer `loadProof`, `verifyProofRecord` und `packProof` gezielt gelesen: Äußere Aliase liefern die alten Manifest-/Mappingwerte, während die Bodyhashes erneut geprüft werden. Es gibt keine Umschreibung ursprünglicher Bodies oder Hashes.

### 4. Schreibversuch ohne gespeicherten Kopf/ETag/identischen Intent — ADDRESSED

- `src/trainer/purchases/schema.js:171`: Jede Phase außerhalb `intent` verlangt einen gespeicherten Kopf und ETag. Der bereits vorhandene Textvalidator (`src/trainer/purchases/value.js:59`) weist den leeren String ab; die neue Nullprüfung schließt die bisherige Lücke.
- `src/trainer/purchases/schema.js:178`: Der Kandidat muss den gespeicherten Kopf exakt über `previous` erweitern, einschließlich Hash.
- `src/trainer/purchases/schema.js:222`: Jeder vorhandene Kandidat muss ein Kaufbeleg sein und ein mit dem Job kanonisch identisches Intent tragen. Restore-/Initialisierungsbelege können den Vergleich nicht mehr durch ein fehlendes Intent umgehen.
- `tests/trainer/purchases-contract.test.js:123`: Die neuen Fälle prüfen einen Pointerversuch ohne Bedingung, einen anders gebundenen Kandidatenvorgänger und einen Restorekandidaten innerhalb eines Kaufjobs. Der gültige gespeicherte Kaufversuch bleibt als Positivfall erhalten.

## Neue Beschädigungen im Fix-Diff

Keine Critical-, Important- oder zusätzlichen Minor-Befunde festgestellt. Die Änderungen beschränken sich im Produktcode auf Replay-/Closureprüfung und den gespeicherten Versuchsvertrag. Signaturen, Punkteberechnung, Profiltrennung und die ursprünglichen JSON-Bodies/Hashes bleiben erhalten. Es kommen keine HTTP-, Speicher- oder UI-Zugriffe in den reinen Kern.

## Unverändert offen, ausdrücklich Task 3 zugeordnet

- **Minor: kooperative Eventloop-Abgabe.** `src/trainer/purchases/history.js:502`: `await Promise.resolve()` garantiert weiterhin keine Rendering-/Eventloop-Pause; Proof- und Basisobjekte müssen bei einer tatsächlichen Arbeitsportionierung berücksichtigt werden. Die entsprechende Zusage in `docs/KAUFPROTOKOLL.md` ist bis zur Task-3-Korrektur nicht vollständig eingelöst.
- **Minor: ursprüngliche Leserfehlercodes.** `src/trainer/purchases/history.js:434`: Der allgemeine Catch ersetzt maschinenlesbare Leserfehler weiterhin durch `history`. Auth-/Netzfehlercodes sind in Task 3 zu bewahren.

Diese beiden Punkte waren bereits Bestandteil der ursprünglichen Review und der ausdrücklich begrenzten Korrekturrunde; sie sind keine neuen Fixbefunde.

## Nachweise und Grenzen

- Brief, ursprüngliche vollständige Review, angehängter Fixbericht und bereitgestellten Fix-Diff geprüft. Das erste kombinierte Toolergebnis war abgeschnitten; nur nicht lesbare relevante Diffabschnitte wurden anschließend separat ausgegeben. Kein Git-Diff neu konstruiert, kein breiter Repository-Crawler und keine Testsuite erneut ausgeführt.
- Berichtete Nachweise: gezielte RED-Fälle für alle vier Fehlerklassen, anschließend **49/49** fokussierte Tests, **391/391** vollständige Tests, Dokumentationsprüfung ohne Fehler und `git diff --check` ohne Fehler. Die neuen Assertions wurden gegen die Produktionsänderungen geprüft. Diese Ausführungsergebnisse stammen aus dem Implementierungsbericht und sind keine von dieser Review erneut ausgeführten Läufe. Es blieb keine konkrete ungeklärte Fehlerhypothese, die einen zusätzlichen Probeaufruf erforderlich machte.
- Read-only-Gitprüfung zeigte `5904dec` als aktuellen Fixcommit auf `codex/vokabeltrainer-v1`, zwei lokale Commits vor dem konfigurierten Origin-Trackingstand. Kein Push oder frischer Remote-SHA-Abgleich durch diese Review.
- Außerhalb des Fixumfangs: Transport/Service müssen weiterhin vollständige konfigurierte Binding, erneutes Hashen persistierter Uploads, lokales Speichern vor Netzoperation, lesenden Neustart und ausdrückliche identische Pointerwiederholung durchsetzen. Migration/Backups und unveränderte V1/V2-Upload-IDs sind spätere Integrationsnachweise. Keine neuen blockierenden Beobachtungen außerhalb des Scopes.
- Ausschließlich diese Reviewdatei angelegt; keine Produktänderung, kein Commit. Reale Google-, Zwei-Geräte-, Apple- und HTTPS-Nachweise bleiben offen.
