# Hier mit der Weiterarbeit beginnen

**Pause nach Abschluss am 28.09.2026:** Die beauftragte private Bereitstellung
und der Chrome-Updateweg sind abgeschlossen. Für den nächsten Kaufversuch
ist ein separater Teststand mit 1.600 Punkten geprüft vorbereitet;
[Anleitung](docs/KAUFTEST-MIT-TESTPUNKTEN.md). Er wurde noch nicht importiert.
Der Nutzer verlangt anschließend Pause. Nach Sicherung keine weitere Arbeit
ohne ausdrückliche Fortsetzung.
Aktueller Einstieg: [Laptop-Fortsetzung](docs/handoffs/2026-09-28-laptop-fortsetzung.md).

Stand: **28.09.2026**.

Der Laptop ist eingerichtet, der vom Nutzer gewählte vorhandene Drive-Bestand
ist übernommen und „Vollständig abgeglichen“ wurde beobachtet. Der Nutzer
bestätigt die weiterhin aktive Google-Verbindung nach vollständigem
Chrome-Neustart ohne neuen Anmeldeklick. Regulärer Tokenablauf und vollständige
Zwei-Geräte-/Apple-Abnahme bleiben offen.

Die begrenzte Kaufbeschleunigung ist auf dem Entwicklungszweig integriert:
Produktcommit `b6b83a9`, 591/591 Node-Tests, 12/12 ausgewählte Browserfälle,
unabhängige Prüfung PASS. Der [Prüfbericht](docs/reports/2026-09-28-kaufgruppen.md)
trennt synthetisch eingesparte Anfragen von noch nicht gemessener realer
Kaufwartezeit. Nach erneuter Fortsetzung ist dieses Paket auf der privaten
HTTPS-App bereitgestellt: Cache v29, aktive Worker-Version
`494388ba-6838-4604-9369-788a6e60962d`; beide Kaufmodule sind per Inhaltsvergleich
bestätigt. Der kontrollierte Updatehinweis in Chrome wurde angenommen und die
Profilauswahl erschien wieder. Aktive Google-Verbindung und vollständiger
Abgleich sind nach dem Update bestätigt. Ein echter Kauf war mangels
bezahlbarem freigegebenem Angebot noch nicht möglich; günstigere
Entwicklungsbilder fehlen. Reale Kaufwartezeit bleibt gesondert zu prüfen.

Zuerst die [aktuelle Laptop-Übergabe](docs/handoffs/2026-09-28-laptop-fortsetzung.md)
lesen. Die [vorherige Pausenübergabe](docs/handoffs/2026-09-27-laptop-pause.md)
enthält weiterhin Cloudflare-Einrichtung, Startschritte und Konzeptverweise.
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
3. [Aktuelle Laptop-Übergabe](docs/handoffs/2026-09-28-laptop-fortsetzung.md)
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
> START-HIER.md, ARBEITSSTAND.md und docs/handoffs/2026-09-28-laptop-fortsetzung.md.
> Damit beende ich die Pause vom 28.09. ausdrücklich. Verwende für den nächsten
> Kaufversuch den vorbereiteten synthetischen Stand mit 1.600 Punkten gemäß
> docs/KAUFTEST-MIT-TESTPUNKTEN.md in einer getrennten Testumgebung. Den
> vorhandenen Familienlernstand nicht durch diese Sicherung ersetzen.
> Prüfe den aktuellen Zweig codex/vokabeltrainer-v1, Remote und lokale Änderungen.
> Die private HTTPS-App ist bereitgestellt. Der vorhandene Drive-Bestand wurde
> am Laptop übernommen; vollständiger Abgleich ist beobachtet und Google bleibt
> laut Nutzer nach Chrome-Neustart verbunden. Regulärer Tokenablauf bleibt offen.
> Die Kaufgruppen-Optimierung in b6b83a9 ist geprüft und als Cache v29 privat
> bereitgestellt. Der kontrollierte Updateweg in Chrome ist beobachtet.
> Wiederhole weder Cloudflare-Anlage noch abgeschlossene Kaufpakete. Reale
> Kaufwartezeit und Geräteabnahmen getrennt nachweisen; danach am bestätigten
> Avatar-/Galerieumfang ansetzen.
> Bestätigte Entscheidungen erhalten; nur private kostenlose Nutzung. Keine
> echten Profile, Sicherungen, PINs oder Zugangsdaten in Git aufnehmen.

Der konkrete aktuelle Auftrag bestimmt, welche Änderungen, Pushes und
Veröffentlichungen autorisiert sind. Ein vorhandener grüner Teststand ist keine
Veröffentlichungs- oder Gerätefreigabe.
