# Hier mit der Weiterarbeit beginnen

Stand: **27.09.2026**.

**Pause nach dem erfolgreichen ersten Anmeldetest.** Der Nutzer hat die
bereitgestellte HTTPS-App eingerichtet, sich bei Google angemeldet und nach
F5 bestätigt: Die Verbindung ist weiterhin aktiv. Das ist ein realer, vom
Nutzer berichteter Nachweis für Anmeldung und Reload in diesem Browser;
Tokenablauf, Browserneustart, vorhandener Drive-Bestand und Zweitgerät sind
damit noch nicht geprüft. Keine weiteren Produktarbeiten bis zur ausdrücklichen
Fortsetzung. Beauftragt sind nur noch Sicherung und Laptop-Übergabe.

Zuerst die [aktuelle Laptop-Übergabe](docs/handoffs/2026-09-27-laptop-pause.md)
lesen. Sie enthält den Teststand, die Cloudflare-Einrichtung, Startschritte,
offene Aufgaben, Konzeptverweise und einen kopierbaren Wiedereinstieg.
Die [Test-App](https://vokabeltrainer.marco-civico.workers.dev/trainer/) ist
bereits bereitgestellt; am Laptop ist zum Öffnen kein lokaler Server nötig.
Die automatische Google-Anmeldung und danach kürzere Kaufwartezeiten bleiben
die Prioritäten. Vorgesehen ist ausschließlich private Nutzung im Freundeskreis.
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
zwei physischen Geräten, iPhone/iPad, Safari und Home-Bildschirm-App.
Die HTTPS-Bereitstellung sowie Anmeldung und Reload sind inzwischen separat belegt.
Der echte Google-Bericht 10 mit 6/6 Fällen bleibt ein historischer Probe-Nachweis
und muss nicht unverändert wiederholt werden.

## Lesereihenfolge

1. [AGENTS.md](AGENTS.md)
2. [ARBEITSSTAND.md](ARBEITSSTAND.md)
3. [Aktuelle Laptop-Übergabe](docs/handoffs/2026-09-27-laptop-pause.md)
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

> Setze die Arbeit am Vokabeltrainer auf meinem Laptop fort. Lies AGENTS.md,
> START-HIER.md, ARBEITSSTAND.md und docs/handoffs/2026-09-27-laptop-pause.md.
> Prüfe den aktuellen Zweig codex/vokabeltrainer-v1, Remote und lokale Änderungen.
> Die private HTTPS-App ist bereitgestellt. Der Nutzer hat Google-Anmeldung
> und weiterhin aktive Verbindung nach F5 bestätigt. Wiederhole weder die
> Cloudflare-Anlage noch die abgeschlossenen Kaufpakete. Prüfe zuerst gemeinsam
> den Laptop-Einstieg und den vorhandenen Drive-Bestand, ohne lokale Daten zu
> überschreiben. Tokenablauf und Browserneustart bleiben offen. Danach am
> dokumentierten Kauf-Tempo und am bestätigten Avatar-/Galerieumfang ansetzen.
> Bestätigte Entscheidungen erhalten; nur private kostenlose Nutzung. Keine
> echten Profile, Sicherungen, PINs oder Zugangsdaten in Git aufnehmen.

Der konkrete aktuelle Auftrag bestimmt, welche Änderungen, Pushes und
Veröffentlichungen autorisiert sind. Ein vorhandener grüner Teststand ist keine
Veröffentlichungs- oder Gerätefreigabe.
