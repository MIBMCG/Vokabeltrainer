# Hier mit der Weiterarbeit beginnen

Stand: **27.09.2026**.

Die aktuelle Fortsetzung priorisiert die automatische Google-Anmeldung und
weitere Beschleunigung der Käufe. Der Nutzer bestätigt, dass der Kauf auf dem
korrigierten Produktstand funktioniert, aber weiterhin zu lange dauert.
Die optionale Serveranmeldung ist lokal umgesetzt. Der Nutzer führt jetzt den
gemeinsamen schrittweisen Anbietertest durch: Worker, D1 und Konfiguration sind
vorbereitet. Wrangler-Probelauf, Anmeldung und privater App-Upload sind
erfolgreich. Die HTTPS-App und ihr unangemeldeter Sitzungsstatus sind geprüft;
als Nächstes folgt der gemeinsame Google-Anmeldetest. Echte Google-Anmeldung
und Zielgeräteprüfung sind noch nicht belegt.
Vorgesehen ist ausschließlich die private Nutzung im Freundeskreis.
Zuerst die [aktuelle Übergabe](docs/handoffs/2026-09-27-anmeldung-und-tempo.md) lesen.
Das vorherige Korrekturpaket ist im
[Prüfbericht](docs/reports/2026-09-27-sync-und-kaeufe.md) dokumentiert. Die vorherigen
Bedienkorrekturen (Avatar/Farben, Updatehinweis, Erwachsenenansicht) bleiben erhalten.
Die folgenden Zahlen dokumentieren den vorherigen Kaufpaket-Abschluss.

Version 1 und die Überarbeitung A1–C2 bleiben die Produktbasis. Das bestätigte Kaufpaket (Tasks 1–6) ist umgesetzt und unabhängig geprüft.
Alle sechs Abschlussbefunde sind geschlossen. Auf Produktstand `1e29ac3`
bestanden frisch 506/506 Node-Tests und 43/43 Browserfälle; die abschließende
Nachprüfung bewertet Spec und Qualität mit PASS. Der Produktcommit ist auf
GitHub exakt bestätigt. Die nachfolgende Dokumentation ergänzt Prüfbelege,
Bedienungsanleitung und portable Übergabe auf demselben Entwicklungszweig.
Prüfbelege, Commitgrenzen und Reviewurteile stehen zentral im
[Abschlussbericht](docs/reports/2026-09-27-persistent-purchases-final.md).

Die vier bestätigten Drachenquellen decken nur die erste Reihe ab. **72 weitere
Motive**, deren responsive Produktionsvarianten, die vollständige
Galeriegestaltung mit weiter ausgebautem Klassisch-/Entwicklungswechsel und
zusätzlicher Fortschrittsdarstellung sowie die visuelle Abnahme bleiben offen.
Ebenfalls offen sind reale Produktprüfungen mit Google Drive auf
zwei physischen Geräten, iPhone/iPad, Safari, Home-Bildschirm-App und HTTPS.
Der echte Google-Bericht 10 mit 6/6 Fällen bleibt ein historischer Probe-Nachweis
und muss nicht unverändert wiederholt werden.

## Lesereihenfolge

1. [AGENTS.md](AGENTS.md)
2. [ARBEITSSTAND.md](ARBEITSSTAND.md)
3. [Aktuelle Übergabe](docs/handoffs/2026-09-27-anmeldung-und-tempo.md)
4. [Anforderungen und Entscheidungen](docs/ANFORDERUNGEN.md)
5. [Architektur](docs/ARCHITEKTUR.md),
   [Produkt-Datenvertrag](docs/PRODUKT-DATENFORMAT.md) und
   [Kaufprotokoll](docs/KAUFPROTOKOLL.md)
6. Bei Detailbedarf der
   [bestätigte Kaufentwurf](docs/superpowers/specs/2026-09-20-persistent-purchases-design.md)
   und der
   [Kaufplan](docs/superpowers/plans/2026-09-20-persistent-purchases.md)

Datierte Übergaben vom 16.–21.09.2026 sowie Diagnoseberichte 2–10 sind
historische Herleitung. Aus ihnen keine alte Pause, keinen alten Teststand und
keinen früheren nächsten Schritt als aktuellen Auftrag übernehmen.

## Vor dem Arbeiten

```sh
git status --short --branch
git remote -v
git log -5 --oneline
```

Der Entwicklungszweig ist `codex/vokabeltrainer-v1`, nicht ein alter
`main`-Stand. Vorhandene lokale Änderungen erhalten. Danach mit Node.js ab
22.8.0 die für den konkreten Auftrag passenden Prüfungen ausführen. Für den
vollständigen Stand gelten:

```sh
npm test
npm run check:docs
npm start
```

`npm start` stellt den Trainer lokal unter
`http://localhost:4173/trainer/` bereit. Browserprüfungen und ihre optionalen
Umgebungsvariablen stehen in [tests/browser/README.md](tests/browser/README.md).
Ein Buildschritt oder Produktionsabhängigkeiten sind nicht erforderlich.

Auf einem anderen Rechner einen frischen Clone dieses Zweigs verwenden. Git
überträgt Programmcode und Dokumentation, aber keine Browserdaten, Google-
Anmeldungen oder privaten Lernstände. Einen bestehenden Familienbestand über
die vorbereitete Google-Verbindung bewusst auswählen; Browserdaten nicht zur
vermeintlichen Reparatur löschen.

## Technische Orientierung

- Neue Lernereignisse und Pakete bleiben Format v2.
- `storageVersion:3` bezeichnet ausschließlich den lokalen Produktzustand.
- Aktivierte Kaufepochen und portable wirtschaftliche Sicherungen verwenden
  Format 3.
- `commerce.discover` verankert die installierte Kaufkonfiguration dauerhaft
  vor dem Produktdownload; `commerce.reconcile` übernimmt danach nur den
  vollständig geprüften gemeinsamen Kopf als Autorität.
- Ein Offline-Provenienzcheckpoint existiert nur innerhalb des Backupexports
  und des Quellreplays. Die normale Zielhistorie lehnt ihn als Kopf oder
  Vorgänger ab.
- Käufe ändern weder Lernpunkte noch Level. Ausgegeben wird getrenntes Guthaben
  je Profil; Punkte entstehen weiter ausschließlich aus vollständigen
  Lernfakten mit 10 Punkten pro richtiger Antwort und 20 pro Rundenabschluss.

## Kopierbarer Wiedereinstieg

> Arbeite im Repository MIBMCG/Vokabeltrainer auf codex/vokabeltrainer-v1
> weiter. Lies AGENTS.md, ARBEITSSTAND.md und die dort verlinkte aktuelle
> Übergabe. Prüfe Branch, Remote und lokale Änderungen; erhalte fremde Arbeit.
> Das Kaufpaket Tasks 1–6 ist abgeschlossen und auf dem Entwicklungszweig gesichert.
> Produktstand 1c9e497 behebt Abgleich- und Kaufprobleme. Der Nutzer bestätigt
> den funktionierenden Kauf, verlangt aber kürzere Wartezeit und priorisiert
> automatische Google-Anmeldung. Die aktuelle Untersuchung steht in
> docs/handoffs/2026-09-27-anmeldung-und-tempo.md. Nutzerantwort A bestätigt die
> lokale Vorbereitung von Cloudflare Workers Free. Danach hat der Nutzer den
> gemeinsamen schrittweisen Anbietertest beauftragt. Worker und D1 sind angelegt,
> Providerkonfiguration und Wrangler-Dry-run sind geprüft. Der private App-Upload
> ist erfolgt, App-Erreichbarkeit und unangemeldeter Sitzungsstatus sind belegt.
> Der gemeinsame echte Google-Anmeldetest und Geräteprüfung stehen noch aus.
> Nur private Nutzung im Freundeskreis, keine öffentliche Produktveröffentlichung.
> Den aktuellen Prüfbericht und docs/CLOUDFLARE-EINRICHTUNG.md beachten.
> Bestätigte R-/E-/U-/AV-/EV-Entscheidungen nicht erneut aufrollen.
> Neue Lernfakten bleiben v2, lokaler Speicher ist Version 3, aktivierte
> Kaufepochen und wirtschaftliche Sicherungen sind v3. Vier Drachenquellen
> sind vorhanden; 72 weitere Motive, responsive Varianten und vollständige
> Galeriegestaltung sowie reale Drive-/Apple-/HTTPS-Nachweise bleiben offen.
> Historische Probe 10 nicht unverändert wiederholen. Keine echten PINs,
> Tokens, Profile oder Backups in Git aufnehmen.

Der konkrete aktuelle Auftrag bestimmt, welche Änderungen, Pushes und
Veröffentlichungen autorisiert sind. Ein vorhandener grüner Teststand ist keine
Veröffentlichungs- oder Gerätefreigabe.
