# Laptop-Übergabe nach echtem Google-Anmeldetest

Stand: **27.09.2026**. Zweig: `codex/vokabeltrainer-v1`.

## Auftrag und Pause

Der Nutzer hat die Google-Verbindung nach Neuladen bestätigt und anschließend
beauftragt: alles auf GitHub sichern, eine vollständige Übergabe für den Laptop
vorbereiten und danach pausieren. Diese Runde ändert ausschließlich
Dokumentation. Keine weiteren Produktarbeiten, Bildaufträge, Cloudänderungen
oder Testsitzungen bis zu einer ausdrücklichen Fortsetzung beginnen.

Die Nutzung ist privat im Freundeskreis. Kein kostenpflichtiger Tarif, keine
öffentliche Produktveröffentlichung, kein Merge nach `main` und keine Änderung
von Repository-Sichtbarkeit oder Lizenz sind durch diese Übergabe freigegeben.

## Gesicherter Ausgangspunkt

| Gegenstand | Stand |
| --- | --- |
| Repository | `https://github.com/MIBMCG/Vokabeltrainer.git` |
| Entwicklungszweig | `codex/vokabeltrainer-v1` |
| HEAD vor dieser Dokumentationsrunde | `6493590ede5189dd10f61503387caf041365f2b8`, sauberer Checkout |
| Implementierter Anmeldestand | `e270ae727c2da5e3b1ca7db71b28f014c3fb7de9`; danach Dokumentation |
| Testadresse | [Vokabeltrainer öffnen](https://vokabeltrainer.marco-civico.workers.dev/trainer/) |
| Zuletzt tatsächlich bereitgestellte Worker-Version | `45b6cb48-486f-45c1-8afc-4425206af8b6` |
| Produktcache | `v28`; während der Pause kein Produkt-/Cachewechsel |
| Lokaler Start | `npm start`, `http://localhost:4173/trainer/`, weiterhin Browsermodus |

Der Abschlusscommit dieser Übergabe folgt auf `6493590`. Seine tatsächliche
Kennung mit `git log -1 --format=fuller -- docs/handoffs/2026-09-27-laptop-pause.md`
ermitteln. Vor der nächsten Arbeit HEAD und Remote wie unten vergleichen;
ein dokumentierter älterer Commit ist kein Ersatz für den aktuellen Abgleich.
Vor dem Abschluss war auch der echte GitHub-Remote exakt auf
`6493590ede5189dd10f61503387caf041365f2b8`; dieser Vergleich wurde in der
Übergaberunde erneut ausgeführt.

## Was der Nutzer jetzt tatsächlich getestet hat

An der oben genannten HTTPS-Adresse, nach der echten Bereitstellung:

1. Die neue Ansicht „Vokabeltrainer einrichten“ erschien. Der Nutzer richtete
   den Trainer mit selbst gewählten Namen und einer lokalen PIN ein. Diese
   Werte sind nicht bekannt und gehören nicht in Git.
2. Über „Für Erwachsene“ → „Einstellungen“ → „Google-Verbindung“ →
   „Mit Google verbinden“ meldete er sich bei Google an.
3. Nutzerbericht: Rückkehr zum Trainer ohne Meldung.
4. Nach der Aufforderung, F5 zu drücken und den Verbindungsstatus erneut zu
   öffnen, bestätigte er: Die Verbindung ist noch aktiv.

**Belegt durch Nutzerbeobachtung:** erfolgreiche Anmeldung und erhaltene
Google-Verbindung nach einem Reload in diesem Browser. Das ist kein direkter
Einblick in Cookies, Tokens oder Browserdaten und kein Langzeittest.

**Nicht bestätigt:** Browser-/Betriebssystemversion, vollständiges Schließen
des Browsers, Zugriffstokenablauf, Wiederaufnahme am nächsten Tag, vorhandener
Drive-Lernbereich, echte Datenübernahme, Kauf über diese HTTPS-Adresse und ein
zweites physisches Gerät. Der Kauf funktionierte laut früherer Nutzerrückmeldung
im damaligen Versuch, blieb aber zu langsam; das ist kein neuer Kaufnachweis.

## Am Laptop die vorhandene App testen

Zum Benutzen genügt die **Testadresse mit `/trainer/`** im normalen Browser.
Kein lokaler Server und keine erneute Cloudflare-Anlage sind dafür erforderlich.
Die nackte Ursprungsadresse `/` liefert absichtlich 404. Google-Anmeldung im
normalen Chrome/Edge/Safari durchführen, nicht im eingebetteten KI-Browser.

Ein Laptop bzw. ein anderes Browserprofil hat eigene lokale Daten und eine
eigene Sitzung. Dort kann eine erste Anmeldung erforderlich sein; der heutige
F5-Test belegt keine automatische Übertragung einer Sitzung zwischen Geräten.
Eine erneute Erwachsenen-PIN-Abfrage ist von einer Google-Trennung zu unterscheiden.

Die erste Einrichtung verlangt derzeit ein lokales Profil, eine Lektion und
zwei Wörter, bevor die Google-Verbindung im Erwachsenenbereich erreichbar ist.
Falls die Einrichtungsmaske erscheint, gemeinsam Schritt für Schritt vorgehen
und für einen reinen Funktionstest synthetische Angaben verwenden. Diese
lokale Einrichtung legt für sich noch keinen neuen Drive-Lernbereich an.

**Nächster gemeinsamer Schritt nach der Pause:** Status auf dem Laptop prüfen
und klären, ob der bisherige gemeinsame Drive-Bestand übernommen werden soll.
Wenn ja, dasselbe Google-Konto und denselben OAuth-Client verwenden und unter
Google-Verbindung „Vorhandenen Lernbereich verwenden“ wählen. Gefundenen Bestand
erst prüfen; die angebotene Vorschau und eine gegebenenfalls verlangte
Übernahmebestätigung gemeinsam ansehen. Keinen zweiten Familienbestand aus
Bequemlichkeit anlegen und keinen Restore zur Umgehung der Auswahl verwenden.

Vor einer Übernahme lokale ungesicherte Änderungen im bisherigen Browser
berücksichtigen. Git überträgt **keine** Vokabeln, Lernstände, Käufe, lokale PINs
oder Google-Sitzungen. Google-Verbindung allein beweist noch keinen bestätigten
Lernabgleich. Falls Daten bisher ausschließlich lokal vorliegen, vor einer
Übernahme eine App-Sicherung getrennt und vertraulich aufbewahren. App-Sicherungen
sind JSON; eine Verschlüsselung der Exportdatei wird nicht zugesagt. Keine
Browserdaten löschen und keine persönlichen Backups in das Repository aufnehmen.

## Am Laptop mit einer KI weiterentwickeln

Frischer Checkout in einen selbst gewählten Entwicklungsordner:

```sh
git clone --branch codex/vokabeltrainer-v1 https://github.com/MIBMCG/Vokabeltrainer.git
cd Vokabeltrainer
git status --short --branch
git remote -v
git log -5 --oneline
git rev-parse HEAD
git ls-remote origin refs/heads/codex/vokabeltrainer-v1
node --version
```

HEAD und Remote müssen übereinstimmen. Bei einem vorhandenen Clone zunächst
Status, Branch und lokale Änderungen prüfen; nichts zurücksetzen. Nur bei
sauberem, passendem Checkout `git fetch origin` und `git pull --ff-only`
ausführen. Bei abweichendem Zweig oder divergierenden Commits erst die
vorhandene Arbeit zuordnen, keinen Force-Push und keinen Hard-Reset verwenden.

Node.js ab **22.8.0** ist erforderlich. Produkt und normale Node-Tests haben
keine npm-Paketabhängigkeiten; für den App-Start ist kein `npm install` nötig.
Unter Windows bei blockiertem `npm.ps1` die Variante `npm.cmd` verwenden.

```sh
npm start
```

Dann `http://localhost:4173/trainer/` öffnen. Der lokale Standardstart bleibt
absichtlich im Browsermodus; die dauerhafte Serveranmeldung wird über die
bereitgestellte HTTPS-Adresse geprüft. `localhost`, `127.0.0.1` und die
Workers-Adresse besitzen jeweils getrennten Browserspeicher.

Vor Änderungen lesen: [AGENTS](../../AGENTS.md), [Arbeitsstand](../../ARBEITSSTAND.md),
[Anforderungen](../ANFORDERUNGEN.md), [Architektur](../ARCHITEKTUR.md),
[Datenformat](../PRODUKT-DATENFORMAT.md), [Kaufprotokoll](../KAUFPROTOKOLL.md).
Bei späteren Codeänderungen die passenden vorhandenen Prüfungen ausführen:
`npm test`, `npm run test:server`, `npm run check:docs` und bei Oberflächenarbeit
die dokumentierten [Browserprüfungen](../../tests/browser/README.md).
Playwright ist nur dafür ein zusätzliches Entwicklungswerkzeug.

## Bestehende Servereinrichtung erhalten

Die private Bereitstellung ist vorhanden. Für Entwicklung und Benutzung muss
sie nicht neu angelegt oder neu hochgeladen werden. Die ignorierte lokale Datei
`server/wrangler.local.jsonc` und CLI-Anmeldungen werden nicht mitgeklont.
Bei einer später ausdrücklich beauftragten Bereitstellung lässt sich die
Konfiguration aus [Vorlage](../../server/wrangler.example.jsonc) und
[Anleitung](../CLOUDFLARE-EINRICHTUNG.md) wiederherstellen. Öffentliche Werte
aus dem geprüften Einrichtungsstand:

| Einstellung | Wert |
| --- | --- |
| Worker-Name | `vokabeltrainer` |
| `APP_ORIGIN` | `https://vokabeltrainer.marco-civico.workers.dev` |
| Öffentliche `GOOGLE_CLIENT_ID` | `329410329467-s8nevn4sqi7m3fmtq2tkbpj76b8osvhs.apps.googleusercontent.com` |
| Google-Redirect-URI | `https://vokabeltrainer.marco-civico.workers.dev/api/auth/callback` |
| D1-Name / Bindung | `vokabeltrainer-sessions` / `SESSIONS` |
| D1-ID | `734c9303-0d71-486e-8419-627785ce0502` |
| Asset-Bindung | `ASSETS`; nur `.cloudflare/public/` |
| Vorschauadressen / Logs | `preview_urls: false`, `observability.enabled: false` |
| Pflicht-Secrets, nur Namen | `GOOGLE_CLIENT_SECRET`, `SESSION_ENCRYPTION_KEY` |

Die Secrets liegen bereits beim Worker. Werte nicht auslesen, kopieren oder
erneut erzeugen; ein anderer Verschlüsselungsschlüssel kann bestehende Sitzungen
unlesbar machen. D1 enthält `oauth_states`, `sessions` und zwei Ablauf-Indizes
gemäß [Schema](../../server/schema.sql). Hier liegt die Sitzungsverwaltung;
Vokabeln und Kaufdaten bleiben in Drive.

Wrangler **4.142.0** ist das tatsächlich verwendete Werkzeug. Bei späterem
Deployment aus `server/` starten: `build.cwd: ".."` bezieht sich auf das
Prozessverzeichnis. Der in der Anleitung dokumentierte Dry-run erhält den
Build-Hook; `--keep-vars` gehört zum geprüften Deploy. Geheimnisse bleiben
außerhalb von Konfiguration und Git. Auf dem Laptop ist eine eigene lokale
Cloudflare-CLI-Anmeldung erforderlich, falls dort deployt werden soll.
Die Desktop-Anmeldung verwendet den Windows-Anmeldeinformationsspeicher;
diese Zugangsdaten nicht zwischen Geräten kopieren.

Beim Desktop gab es einen npm-Zertifikatsfehler, der mit `--use-system-ca`
nur für den betroffenen Node-Prozess behoben wurde. Das ist kein pauschaler
Laptop-Startschritt. TLS-Prüfung nicht deaktivieren und keine globalen
Proxy-/Sicherheitsregeln ändern. Details sind in der älteren
[Anmeldeübergabe](2026-09-27-anmeldung-und-tempo.md) dokumentiert.

## Prüfbelege und Grenzen

| Nachweis | Einordnung |
| --- | --- |
| 580/580 Node-Tests, 58/58 Browserfälle | Früherer lokaler Gesamtstand der Servervariante, synthetische Google-Grenze; [Bericht](../reports/2026-09-27-server-anmeldung.md) |
| 24/24 Servertests und echter Wrangler-Dry-run | Beim vorherigen Bereitstellungspaket ausgeführt; nicht während dieser Pause erneut getestet |
| 161 öffentliche Dateien, echter Upload, HTTPS-/Pfadsperrprüfungen, D1-Schema und Bindungen | Vorheriger realer Bereitstellungsnachweis; [Einrichtung](../CLOUDFLARE-EINRICHTUNG.md) |
| Google-Anmeldung und F5 | Jetzt vom Nutzer bestätigt, nur für den berichteten Browserversuch |
| Übergabeabschluss | Nur Dokumentations-, Verweis-, Diff- und Git-Prüfungen; keine neuen Produkttests |

Der Dokumentationslauf dieser Übergaberunde prüfte **239 Markdown-Dateien und
929 lokale Verweise ohne Fehler**; `git diff --check` blieb sauber. Die hier
aufgeführten öffentlichen Betreiberwerte wurden zusätzlich mit der vorhandenen
lokalen Konfiguration verglichen; Geheimniswerte wurden nicht gelesen.
Eine unabhängige lesende Prüfung bestätigte die Vollständigkeit der Übergabe,
die portablen Startschritte und die Trennung der Nachweisgrenzen. Dabei gefundene
veraltete Offen-Markierung zur HTTPS-Bereitstellung und ein Tippfehler wurden
in den Einstiegstexten korrigiert.

Vor dem Commit `npm run check:docs` und `git diff --check` ausführen. Nach dem
autorisierten Push `git rev-parse HEAD`,
`git ls-remote origin refs/heads/codex/vokabeltrainer-v1` und
`git status --short --branch` vergleichen.
Die abschließende Chatmeldung nennt den tatsächlich gesicherten Commit.

## Offene Arbeit in Reihenfolge

1. Laptop-Einstieg und bewusste Auswahl des vorhandenen Drive-Bestands gemeinsam
   prüfen. Danach Wiederaufnahme nach Browserneustart und regulärem
   Zugriffstokenablauf nachweisen. Den tatsächlichen Google-Teststatus und
   Refresh-Token-Lebensdauer beachten; heutiger F5-Erfolg ist keine Zusage
   unbegrenzter Anmeldung. Keine produktiven Sessions zum Test manipulieren.
2. Käufe weiter beschleunigen. Der begrenzte Vorschlag in der
   [Anmelde-/Tempoübergabe](2026-09-27-anmeldung-und-tempo.md#kaufgeschwindigkeit-befund-und-begrenzter-vorschlag)
   fasst wiederholte Anker-/Kontoprüfungen ausschließlich innerhalb eines
   Upload-Batches zusammen. Konto-/Token-/Datensatzbindung, Hashes, Nachlesen,
   gespeicherte Aufträge und ETag-Bedingungen erhalten. Noch keine gemessene
   Zeitersparnis und noch keine Umsetzung dieses zusätzlichen Vorschlags.
3. Mit dem Nutzer Figurenfarben, Auswahl in Übung/Startseite,
   Erwachsenen-Einstellungen, Abgleichanzeige und Kaufwartezeit nachprüfen.
   Bisherige Korrekturen stehen im [Bedienbericht](../reports/2026-09-27-bedienkorrekturen.md)
   und im [Abgleichbericht](../reports/2026-09-27-sync-und-kaeufe.md).
4. **72 weitere Avatar-Motive**, responsive Produktionsvarianten und komplette
   Galerie samt Fortschrittsdarstellung fertigstellen. Vier Drachenbilder sind
   bereits in Laufzeit und Offlinecache eingebunden. Kein Neustart des früheren
   modularen Ausrüstungsprojekts: neue Entwicklungsformen sind fertige Gesamtbilder.
5. Echten Drive-Abgleich auf zwei physischen Geräten, iPhone/iPad, Safari,
   Home-Bildschirm-App, Offlineübung und Wiederaufnahme nachweisen. Historische
   Probe 10 nicht unverändert wiederholen. Private Nutzung ist keine öffentliche
   Freigabe; allgemeine Lizenzentscheidung bleibt zurückgestellt.

## Konzepte, Bilder und erhaltene Entscheidungen

- [Avatar-/Shop-Entscheidungen](../design/2026-09-19-avatar-shop-entscheidungen.md)
  und [Entwicklungsstufen EV01–EV05](../design/2026-09-20-avatar-entwicklungsstufen.md):
  vier fertige Formen je Figur, dauerhaft wählbarer Besitz, klassischer Avatar
  zusätzlich erhalten. Letzte Form deutlich epischer und mythischer als Stufe 3.
- [Bestätigter Drachen-Konzeptbogen v2](../design/avatar-evolution/dragon-stages-concept-v2.png),
  [Quellenübersicht](../design/avatar-evolution-sources/README.md) und
  [Bildvertrag](../superpowers/specs/2026-09-20-avatar-evolution-foundation.md).
  Ältere Aussagen über noch fehlende Kauf-/Produktintegration sind historisch;
  der [Kaufabschluss](../reports/2026-09-27-persistent-purchases-final.md) ist maßgeblich.
- [Serverentwurf](../superpowers/specs/2026-09-27-server-anmeldung-design.md)
  und [Serverplan](../superpowers/plans/2026-09-27-server-anmeldung.md) sind
  bereits umgesetzt. Nicht erneut brainstormen oder eine pauschale Startfreigabe
  verlangen, wenn der Nutzer die Arbeit wieder aufnimmt.
- R-/E-/U-/AV-/EV-Entscheidungen erhalten. Lernfakten bleiben v2,
  lokaler Speicher Version 3, aktivierte Kaufepochen/wirtschaftliche Sicherungen v3.
  Käufe verringern verfügbares Guthaben, nicht Lernpunkte oder Level.
  10 Punkte pro richtiger Antwort, 20 pro Rundenabschluss bleiben unverändert.

## Kopierbarer Auftrag für die nächste KI

> Setze die Arbeit am Vokabeltrainer auf meinem Laptop fort. Lies AGENTS.md,
> START-HIER.md, ARBEITSSTAND.md und docs/handoffs/2026-09-27-laptop-pause.md.
> Prüfe codex/vokabeltrainer-v1, GitHub-Stand und lokale Änderungen; erhalte
> vorhandene Arbeit. Cloudflare ist eingerichtet, die private HTTPS-App läuft.
> Google-Anmeldung und aktive Verbindung nach F5 sind vom Nutzer bestätigt.
> Gehe zunächst mit mir schrittweise durch den Laptop-Einstieg und die Auswahl
> des vorhandenen Drive-Bestands. Browserneustart und Tokenablauf sind noch offen.
> Danach Kaufgeschwindigkeit und das bestätigte Avatar-/Galeriepaket fortsetzen.
> Keine bereits abgeschlossene Einrichtung oder Kaufimplementierung neu beginnen.
> Nur private kostenlose Nutzung, keine öffentliche Freigabe. Keine echten
> Profile, Backups, PINs, Cookies oder Zugangsdaten in Git aufnehmen.
