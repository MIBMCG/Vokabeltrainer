# Task 10 – unabhängige Spezifikations- und Qualitätsprüfung

## Spec Compliance

- **❌ Ein wichtiger Befund offen:** Der Datenvertrag verlangt die Erkennung verschiedener Inhalte unter derselben Snapshot-ID (`docs/PRODUKT-DATENFORMAT.md:169`). Ein nachträglich hinzukommendes widersprüchliches Manifest umgeht diese Prüfung bei einer bereits gecachten Epoche (`src/trainer/sync/drive.js:711`, `:734`, `:747`). Details unter R1.
- Die übrigen im Taskdiff prüfbaren Kernanforderungen sind umgesetzt: vollständiger fachlicher Export ohne lokale Geheimnisse/Transportdaten (`src/trainer/backup/format.js:137`), geprüfte lokale Sicherheitskopie (`src/trainer/backup/transport.js:17`), gesicherte Vorschau und Aktualitätsprüfung (`src/trainer/backup/restore.js:49`, `:93`), persistierte Uploads mit atomarer Aktivierung (`:112`, `:130`), explizite Adoption (`:142`, `:178`) und bestätigter nichtleerer Join (`src/trainer/sync/drive.js:557`).
- **⚠️ Aufgabenübergreifende Grenzen:** Erwachsenenoberfläche, Datei-/Downloadfluss, Wiederanlaufangebote und verständliche Bestätigungen sind Task 11; PWA ist Task 12. Die Schnittstellen sind dokumentiert (`docs/PRODUKT-DATENFORMAT.md:188`–`:196`); ihre tatsächliche UI-Verwendung ist aus diesem Backenddiff nicht nachgewiesen. Reale Google-/iOS-/Zwei-Geräte-Abnahme bleibt offen (`docs/reports/2026-09-18-sicherung-wiederherstellung.md:90`).

## Stärken

- `src/trainer/backup/restore.js:56`, `:82`, `:106`: Sicherheitskopie und Vorschau sind an den Fachstand gebunden; die Prüfung liegt zusätzlich innerhalb des CAS-Transforms. Ein zwischenzeitlicher Lernschritt wird nicht durch einen veralteten vorbereiteten Zustand ersetzt.
- `src/trainer/backup/transport.js:27`, `:64`, `:74`: Ein gemeinsamer Transporthelfer begrenzt Teile einschließlich Hülle, prüft Metadaten/Hashes und liest Uploads zurück. `tests/trainer/backup.test.js:45` sowie `tests/trainer/restore.test.js:175` prüfen Teilverlust und beschädigte Inhalte.
- `src/trainer/backup/restore.js:112`, `:122`, `:130`: Persistierte IDs/Inhalte gehen dem jeweiligen Schreibversuch voraus; Aktivierung folgt erst nach Uploadprüfung. Die Neustartfälle in `tests/trainer/restore.test.js:111` und `:196` prüfen verlorene Antworten und einen echten Speicherabbruch vor der lokalen Aktivierung.
- `src/trainer/backup/restore.js:150`, `:152`: Abschlussadoption verlangt die vollständige ausgewählte/wirksame Antwortmenge; reine Referenzabhängigkeiten bleiben Support. `src/trainer/commands.js:777` beendet alte lokale Runden beim eindeutigen Epochenwechsel ohne Bonus.

## Befunde

### Critical

- Keine.

### Important

- **R1 – Neue widersprüchliche Snapshotmanifeste werden bei gecachter Epoche als vollständig abgeglichen angenommen.** `src/trainer/sync/drive.js:711` überspringt bei einem gültigen Dateicachetreffer den Epochenzweig vollständig. Der Vergleich aller Manifeste derselben Snapshot-ID liegt ausschließlich in diesem Zweig (`:734`). Ein neu hinzugekommenes Manifest wird separat bei `:747` zwar vollständig auf innere Konsistenz geprüft, aber nicht gegen den bereits akzeptierten Inhalt dieser logischen Snapshot-ID verglichen; `:752` nimmt es anschließend in die bekannten Dateien auf. **Fokussiert reproduziert:** Restore durchführen, einmal erfolgreich synchronisieren, dann mit den echten Transporthelfern ein zweites gültiges Restoremanifest samt Teilen veröffentlichen, das dieselbe Snapshot-ID, aber einen anderen Sicherungsstand/`totalHash` trägt. Der nächste `sync()` liefert `phase: 'synced'`, die Quarantäne bleibt leer. Damit hängt die vorgeschriebene Kollisionsprüfung vom Cachezustand ab; ein frischer Leser und ein laufender Client bewerten denselben Ordner unterschiedlich. Die Prüfung muss unabhängig vom Cache der referenzierenden Epoche gelten, beispielsweise über einen bestätigten logischen Snapshot-ID/Hash-Index oder einen Vergleich der vollständigen Manifestgruppen pro Abruf. Regression für ein nach erfolgreichem Cacheaufbau hinzukommendes widersprüchliches Manifest ergänzen; auch Nullmanifest-Epochen dürfen bei späterer Mehrdeutigkeit keinen vollständigen Abgleich melden.

### Minor

- Keine zusätzlichen belastbaren Befunde.

## Prüfungen und Grenzen

- Prüfbasis **37c459f → e05e8a5420bac1639008fd8301dd909b9a9a50ba**, Codecommit **ee506629d027e51cb4ff59253945ae77ff6c9447**; der Zwischencommit 62dc0dc betrifft Dokumentation. Aufgabenbrief, Implementierungsbericht, Datenvertrag, Entscheidungen 17–21 und bereitgestelltes Diff geprüft. Keine Gitbefehle, keine Produktänderungen. Die erste kombinierte Ausgabe wurde abgeschnitten; danach wurde das Diff in begrenzten Abschnitten vervollständigt.
- Benannte zusätzliche Kontextprüfungen: (1) Cache-/Quarantänewechselwirkung bei neuen Manifesten – bestehende `readIfNeeded`- und Downloadfortsetzung gelesen und R1 reproduziert; (2) Referenz-/Supportsemantik bei Export/Adoption – bestehende Epochenprojektion und konkrete Schema-Prüfstellen gelesen; (3) Fortsetzung und atomare Aktivierung – abgeschnittenen CAS-/Clock-/Commitkontext gelesen. Keine breite Repositorysuche oder erneute Gesamtprüfung.
- Den gemeldeten vollständigen Lauf **254/254 Node-Tests** und **4/4 Browserfälle** anhand Bericht und Testdiff eingeordnet, nicht wiederholt (`docs/reports/2026-09-18-sicherung-wiederherstellung.md:57`, `:69`). Der dokumentierte erste Browserstart mit `spawn EPERM` ist durch den separat erlaubten erfolgreichen Lauf erklärt (`:78`), kein als grün umgedeuteter Produktfehler.
- Genau **ein fokussierter In-Memory-Lauf** über `node --input-type=module` mit tatsächlichen Commands-/Restore-/Sync-/Transportmodulen und synthetischem Drive; Exit 0. Assertions bestätigten ausdrücklich den fehlerhaften `synced`-Status und eine leere Quarantäne. Ausgabe: `CONFIRMED: conflicting valid manifest added for cached epoch snapshot ID is accepted and status is synced.` Keine Suite oder wiederholte Testschleife.
- Offene Verbraucherpflichten: Task 11 muss Join-IDs, ausgewählten Konfliktexport, `stale` mit erneuter Bestätigung, bestätigte persistierte Restorephasen und Downloads anschließen (`docs/PRODUKT-DATENFORMAT.md:188`–`:196`). Task-9-Beobachtung O1 bleibt dessen eigener UI-/Authintegrationspunkt. Außer R1 wurde kein zusätzlich fehlender Task-10-Produzentenvertrag festgestellt.
- Ausschließlich dieser Reviewbericht wurde geschrieben; Controlleränderungen an Entscheidungen und Task-11-Brief bleiben erhalten. Kein Netzwerkzugriff, kein echtes Google, keine Browserdaten oder Geräteabnahme.

## Assessment

**Task quality: Needs fixes.** Ein wichtiger Integritätsbefund (R1) ist reproduziert. Die übrigen überprüften Restore-/Sicherungsgrenzen sind sorgfältig umgesetzt und durch passende Fehlerszenarien abgesichert; die Freigabe verlangt noch eine vom Epochen-Dateicache unabhängige Erkennung widersprüchlicher Snapshotidentitäten.
