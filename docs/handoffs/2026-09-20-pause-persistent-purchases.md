# Pause und systemunabhängige Übergabe: dauerhafte Käufe

**Der Nutzer hat ausdrücklich eine Pause und die Übergabe an ein anderes System beauftragt.** Nach dem Sicherungspush nicht automatisch weiterarbeiten. Bei einer neuen ausdrücklichen Fortsetzung am ersten offenen Reviewbefund ansetzen, keine bereits bestätigte Grundsatzentscheidung erneut abfragen.

## Einstieg auf einem anderen Rechner

Repository: `https://github.com/MIBMCG/Vokabeltrainer.git`, Entwicklungszweig **`codex/vokabeltrainer-v1`**. Nicht vom älteren `main` weiterarbeiten. Neue Arbeitskopie:

```sh
git clone --branch codex/vokabeltrainer-v1 https://github.com/MIBMCG/Vokabeltrainer.git
cd Vokabeltrainer
node --version
npm test
npm start
```

Node.js mindestens 22.8.0. Der bestehende Trainer ist anschließend unter `http://localhost:4173/trainer/` erreichbar; die isolierte technische Kaufprobe unter `/shop-probe/`. Die Startseite `/` ist weiterhin die ältere Verbindungsprobe. Browserdaten, Lernstände und Google-Anmeldungen werden durch Git nicht übertragen. Persönliche Sicherungen werden bei Bedarf getrennt in der App importiert.

Zuerst `AGENTS.md`, `START-HIER.md`, `ARBEITSSTAND.md` und diese Übergabe lesen, danach Git-Status/letzte Commits/Remote prüfen. Vorhandene lokale Änderungen erhalten. Auf dem bisherigen Rechner wurde ausschließlich im isolierten Arbeitsbaum `drive-probe` gearbeitet; dieser lokale Pfad ist keine Voraussetzung für andere Systeme.

## Bestätigt und weiterhin verbindlich

- Der [Integrationsentwurf](../superpowers/specs/2026-09-20-persistent-purchases-design.md) wurde mit „ja“ bestätigt. Der [Implementierungsplan](../superpowers/plans/2026-09-20-persistent-purchases.md) ist ausführbar; keine neue allgemeine Start-, Cloud- oder Modellfrage nötig.
- Google Drive, vorbereiteter Zugang, getrennte Konten je Kind und ein gemeinsamer Bestätigungspunkt je Lernbestand.
- 10 Lernpunkte pro richtiger Antwort, 20 pro abgeschlossener Runde. Käufe verändern Level/Lernpunkte nicht; Stufenpreise 200/400/800. Richtung C und EV01–EV05 bleiben gültig.
- Dauerhafte Kaufaufträge, zunächst lesende Wiederaufnahme nach Neustart, gemeinsamer Kauf-/Restorekopf, gesicherte v1/v2-Umstellung und v3-Produktmodus sind das freigegebene Paket.
- Alle neuen Käufe nur online nach vollständigem Abgleich. Kein Echtgeld, zusätzliches Cloudabo oder neuer Anbieter.
- Push in den Entwicklungszweig ist beauftragt. Kein Merge nach `main`, keine öffentliche Hosting-/Kontenänderung.

## Tatsächlich vorhandener Code

| Commit | Inhalt |
| --- | --- |
| `9cbd38304fc23305d3ae68c21cd9f4f73a400915` | Ausgangspunkt: konkreter Integrationsentwurf |
| `f54bd5d42762959c8c2dd8b2f746d417c0706706` | dokumentierte Zustimmung und detaillierter Implementierungsplan |
| `a476056d91a2e7869dde385edb798410f2acd974` | laufende Implementierungsübergabe |
| `7ec80fd1a0d67a423d8740603924f4d6df5ee3e2` | neuer reiner Kaufkern, noch nicht in die App integriert |

Der abschließende Pausencommit ist der Commit, der diese Übergabe und die Reviewbefunde veröffentlicht; seine SHA über `git log` beziehungsweise den Remotezweig prüfen.

Neue Module: `src/trainer/purchases/value.js`, `schema.js`, `basis.js`, `proof.js`, `projection.js`, `history.js`. Sie enthalten strikte Formate, gehashte Ledgerteile, Punkte-/Besitzprojektion, vollständige Historienlesung und portable Herkunftszuordnung. Schnittstellen: [KAUFPROTOKOLL.md](../KAUFPROTOKOLL.md). Tests: `tests/trainer/purchases-contract.test.js` und `purchases-fixtures.js`.

**Aufgabe 1 ist implementiert, aber wegen offener Reviewbefunde noch nicht abgeschlossen.** Aufgaben 2–5 (HTTP/Einrichtung, dauerhafter Service/Speicher, v3-Sync/Restore/Backup, Oberfläche) sind nicht implementiert. Aufgabe 6 ist ebenfalls nicht abgeschlossen; diese Pause ist eine Zwischenübergabe, keine Gesamtfreigabe. Bestehende App und Probe importieren den neuen Kern nicht. Es wurden keine echten Produktkäufe ausgeführt, keine Google-Daten umgestellt und keine neuen Bilder erzeugt.

## Offene Befunde und nächster Arbeitsschritt

Die unabhängige Prüfung durch GPT-6 Astra/hoch hat im neuen Kern eine Lücke bei Epochenwechseln gefunden: Kauf-Replay darf nicht ohne Restore die aktive Epoche wechseln; ein Restore darf eine früher verwendete Epoche nicht erneut aktivieren. Der bisherige 1000-Transaktionen-Test wechselt nur zwischen zwei Epochen und muss auf tatsächlich neue Restoreepochen korrigiert werden.

Außerdem scheitert die erneut portable Sicherung einer bereits fremdrestaurierten Historie im reproduzierten Fall A → B → C ohne alte Datei-IDs. Herkunftsmanifeste und deren physische Zuordnungen müssen vollständig mitgenommen werden; ein einfach importierter Fremdstand genügt als Nachweis noch nicht. Der vierte wichtige Befund betrifft gespeicherte Pointerversuche ohne Kopf/ETag beziehungsweise ohne verpflichtend passenden Kauf-Intent. Der [vollständige Reviewbericht](../reports/2026-09-20-persistent-purchases-task1-review.md) enthält Codebelege und Reproduktionsstand aller vier Befunde sowie zwei kleinere Hinweise.

**Bei Fortsetzung zuerst diese Task-1-Befunde reproduzieren und beheben, gezielt nachprüfen und unabhängig nachprüfen lassen. Erst danach Task 2 beginnen.** Den vorhandenen Kern nicht neu schreiben und den erfolgreichen Bericht10 nicht unverändert wiederholen. Die Detailtests, Befunde und ihre Grenzen stehen im [Pausenbericht](../reports/2026-09-20-persistent-purchases-pause.md).

## Für die folgenden Aufgaben bewahren

- `commands.js` ist der einzige serialisierte lokale Writer. Bei storageVersion3 müssen sämtliche bisherigen v2-Runden-/Policyprüfungen weiter gelten; mehrere Stellen benutzen derzeit ausdrücklich `===2`.
- Eine offene ältere Wiederherstellung muss vor Migration abschließbar bleiben. Nicht die gesamte App durch einen fatalen Migrationsfehler so blockieren, dass die alte Wiederherstellung unerreichbar wird.
- `backup/transport.js` prüft exakte Manifestmetadaten/Hashes. Wirtschaftliche Sicherungsdaten müssen auch durch Snapshotupload und Rücklesen gelangen, nicht nur in `exportBackup` auftauchen.
- `sync/drive.js` aktiviert bisher einzeln veröffentlichte Epochen. Im neuen Modus entscheidet ausschließlich die bestätigte Kauf-/Restorehistorie; dies gilt für normalen Abgleich, Erstbeitritt, Wiederaufnahme und alte bereits laufende Anfragen. Alte Daten erhalten, aber nicht still aktivieren.
- Konfiguration vorhanden und Kopf noch leer bedeutet unvollständige Einrichtung, keine neue Guthabenquelle. Der neue Modus darf nicht in einen alten Schreibpfad zurückfallen.
- Lazy/injizierte Ports zwischen Sync und Kaufservice verwenden; kein rekursives `service.refresh → sync → service.refresh`.
- Persistierte Uploadkandidaten müssen vor Netzaufrufen erneut auf Body/Hash/Bindung geprüft werden. Ein Lesecache gibt niemals Schreibberechtigung.
- Fremde Herkunft behält ursprüngliche Bodies/Hashes; ein gehashtes Manifest bildet logische auf neue physische Referenzen ab. Eine leere neue Installation muss ohne Quellkonto auskommen, auch nach mehreren Fremdrestores.
- `trainer/sw.js` steht vor diesem Paket auf Cachekennung `v20`. Neue Runtime-Dateien brauchen explizite Server-Allowlist und Cacheliste sowie Offline-/Updateprüfungen.

## Getroffene technische Entscheidungen

1. Die lokale Aufgabenkoordination wurde mit PowerShell statt nicht funktionierender Bash-Hilfsskripte erzeugt. Das betrifft nur Entwicklungsartefakte; kein Produktvertrag hängt daran.
2. Die bereits bestätigte Modellauswahl wurde ohne erneute Nachfrage verwendet: Implementierung GPT-5.6 Sol/hoch, unabhängige Datenprüfung GPT-6 Astra/hoch.
3. Für fremde Sicherungen kam ein gehashtes Zuordnungsmanifest hinzu. Kosten: zusätzlicher Manifest-/Leseaufwand je importierter Herkunft; notwendig, weil ursprüngliche Drive-IDs im Zielkonto nicht neu angelegt werden können. Verschachtelte Herkunft muss noch vollständig nachgeprüft werden.
4. Für die spätere Oberfläche sind bezahlte Formen nur mit vorhandenem tatsächlichem Bild vorgesehen. Noch fehlende Formen bleiben sichtbar als ausstehend; dies bedeutet vorübergehend weniger Kaufknöpfe. Katalogpreise/Regeln werden dadurch nicht geändert. Diese Anbindung ist noch nicht implementiert.

## Weiterhin offene separate Umfänge

Die 72 übrigen Entwicklungsbilder und die vollständige Gestaltung von „Meine Figur“, „Entwicklung“, „Shop“ bleiben Folgearbeit. Vorbereitet sind vier Drachenquellen, noch keine ausgelieferten auflösungsabhängigen Varianten. Reale Produktwiederaufnahme, zwei physische Geräte, iPhone/iPad und HTTPS bleiben offen. Der echte Bericht10 belegt weiterhin nur das zugrunde liegende synthetische Koordinationsverfahren.

## Kopierbarer Wiedereinstieg

> Arbeite im Repository Vokabeltrainer auf `codex/vokabeltrainer-v1`. Lies AGENTS.md, START-HIER.md, ARBEITSSTAND.md und docs/handoffs/2026-09-20-pause-persistent-purchases.md samt verlinktem Review. Die Pause ist hiermit beendet; setze die bereits freigegebene Umsetzung fort. Task 1 ist implementiert, hat aber offene Reviewbefunde bei Epochenwechseln und erneutem Fremdrestore. Behebe und prüfe diese zuerst, dann führe Tasks 2–6 des Plans aus. Erhalte bestehende Daten/Änderungen. Nutze passende Modelle mit benannter Denktiefe; keine erneute allgemeine Startfreigabe, kein identischer Bericht10-Lauf.
