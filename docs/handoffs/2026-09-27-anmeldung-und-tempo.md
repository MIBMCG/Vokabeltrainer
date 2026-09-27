# Fortsetzung: automatische Anmeldung und Kaufgeschwindigkeit

**Aktualisierung nach dem Nutzertest:** Google-Anmeldung und weiterhin aktive
Verbindung nach F5 sind am 27.09.2026 vom Nutzer bestätigt. Anschließend ist
Pause beauftragt. Der aktuelle Einstieg mit vollständigem Laptop-Ablauf steht
in der [Laptop-Pausenübergabe](2026-09-27-laptop-pause.md). Die folgenden
datierten Zwischenstände erklären die technische Herleitung; frühere nächste
Schritte sind durch den aktuellen Einstieg ersetzt.

Stand: 27.09.2026. Branch `codex/vokabeltrainer-v1`.
Ausgangscommit: `1c9e4975db93b1630792c65472d4e9fdcbb4f98d`.
Geprüfter Produktcommit: `e270ae727c2da5e3b1ca7db71b28f014c3fb7de9`,
auf `origin/codex/vokabeltrainer-v1` gepusht und per `git ls-remote` exakt
bestätigt. Der Dokumentationsabschluss folgt auf demselben Zweig; Programmcode
und Tests bleiben dabei unverändert. Vor dem Weiterarbeiten den dann aktuellen
HEAD und Remote erneut vergleichen.
Vorheriges Paket: [Abgleich und Käufe](2026-09-27-sync-und-kaeufe.md).

## Auftrag und offene Arbeit

Der Nutzer bestätigt, dass der Kauf inzwischen funktioniert, aber weiterhin
zu lange dauert. Er beauftragt die Fortsetzung und priorisiert die automatische
Google-Anmeldung. Die Bestätigung betrifft seinen gemeldeten Versuch; sie ist
kein vollständiger Nachweis über Geräte, Wiederholungen oder Laufzeiten.

1. Automatische Wiederaufnahme nach Neuladen und Ablauf des Google-Zugriffs.
2. Weitere Beschleunigung von Kauf und Abgleich; reale Laufzeit anschließend prüfen.
3. 72 übrige Avatar-Entwicklungsmotive, responsive Varianten, vollständige Galerie
   und Fortschrittsdarstellung gemäß bestehendem Bildkonzept.
4. Persönliche Nachprüfung von Figurenfarben, Auswahl und Erwachsenen-Einstellungen.
5. Reale Zwei-Geräte-, iPhone/iPad-, Safari-/Home-Bildschirm-Prüfung und HTTPS-Hosting.
6. Allgemeine Lizenzentscheidung bleibt zurückgestellt; eine öffentliche
   Produktveröffentlichung ist ausdrücklich nicht geplant.

Aktuelle Klarstellung des Nutzers: Nutzung voraussichtlich nur im Freundeskreis.
Die lokale Servervorbereitung wird fortgesetzt. Eine erreichbare HTTPS-Adresse
ist auch für diesen privaten Betrieb nötig; öffentliche Vermarktung,
Repository-Sichtbarkeit oder allgemeine Open-Source-Freigabe gehören nicht dazu.

## Ergebnis der Anmeldeanalyse

`src/drive/auth.js` verwendet Googles Browser-Tokenmodell mit `drive.file`.
Das Zugriffstoken liegt nur im Arbeitsspeicher. Beim vollständigen Neuladen
geht es verloren; seine Ablaufzeit wird mit 30 Sekunden Reserve beachtet.
`prompt: ''` vermeidet eine erzwungene erneute Kontowahl. Die vorherigen
Korrekturen verhindern Widerruf beim Seitenende und das Löschen einer neueren
Sitzung durch einen verspäteten Fehler. Das ist keine dauerhafte Anmeldung.

Google verlangt im Tokenmodell eine Nutzeraktion für die Anforderung eines
neuen Zugriffstokens. Im Code-Modell kann ein vertrauenswürdiger Server
Refresh-Tokens halten und den Zugriff ohne erneute Aktion erneuern.
Quellen: [Modellvergleich](https://developers.google.com/identity/oauth2/web/guides/choose-authorization-model),
[Tokenmodell](https://developers.google.com/identity/oauth2/web/guides/use-token-model),
[Code-Modell](https://developers.google.com/identity/oauth2/web/guides/use-code-model).

Die frühere Komfortannahme Q10/R28 ist durch den neuen Nutzerauftrag ersetzt.
Die kostenlose Cloudflare-Vorbereitung ist inzwischen ausdrücklich bestätigt.
Kontoanlage und Veröffentlichung sind damit noch nicht durchgeführt; Kosten
sind nicht freigegeben.
Ein gespeichertes kurzlebiges Browser-Token würde nur manche Reloads überbrücken
und den regulären Ablauf nicht lösen. Google One Tap liefert eine Anmeldung,
aber ersetzt keine Drive-Autorisierung; siehe
[Google-Integration](https://developers.google.com/identity/gsi/web/guides/integrate).

## Bestätigte Vorbereitung: Cloudflare Workers Free

**Nutzerantwort A:** kostenlose Serverlösung lokal vorbereiten. Ein zusätzliches
Cloudflare-Konto wird für diesen Weg akzeptiert; kostenpflichtige Angebote
werden nicht aktiviert. [Entwurf](../superpowers/specs/2026-09-27-server-anmeldung-design.md)
und [Umsetzungsplan](../superpowers/plans/2026-09-27-server-anmeldung.md) konkretisieren
die Vorbereitung und optionale Traineranbindung.

Ein zusätzlicher **Cloudflare Workers Free**-Dienst soll App und Anmeldedienst
unter derselben HTTPS-Adresse bereitstellen. Bestätigter Aufbau: Google-Code-Ablauf mit
serverseitig verschlüsselt gespeichertem Refresh-Token, geschützter Sitzung im
Browser und automatischer Erneuerung. Die Vokabel- und Kaufdaten bleiben in
Google Drive; der Server übernimmt autorisierte Drive-Aufrufe. Geheimnisse
gehören ausschließlich in die Serverkonfiguration, nicht in Browsercode/Git.
Ein bewusstes Trennen beendet nur die betreffende Serversitzung. Ein bei Google
ausgeführter Widerruf wird weiterhin erkannt; er kann andere Geräte mitbetreffen.

Der kostenlose Einstieg wird ohne Kreditkarte angeboten. Workers und der
vorgeschlagene Sitzungsspeicher D1 haben Freikontingente. Eine kostenlose
Bereitstellung für alle zukünftigen Nutzungsumfänge ist damit nicht zugesagt.
Quellen: [Workers-Angebot](https://www.cloudflare.com/products/workers/),
[Workers-Preise](https://developers.cloudflare.com/workers/platform/pricing/),
[D1-Preise](https://developers.cloudflare.com/d1/platform/pricing/),
[statische App-Dateien](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/).

Vor einer Umstellung prüfen: kostenlose Adresse und Google-OAuth-Einrichtung,
Test-/Produktionsstatus und Refresh-Token-Lebensdauer, Widerruf und Sessionablauf,
erlaubte Drive-Ziele sowie iOS-Verhalten. Ein neuer Ursprung hat eigene lokale
Browserdaten; vorhandene Daten und ausstehende Änderungen müssen vor einem
Wechsel über einen ausdrücklichen Übernahmeweg erhalten bleiben. Keine echte
Familie oder bestehende Installation für einen Prototyp umstellen.

Die Bestätigung beinhaltet weder ein kostenpflichtiges Angebot noch bereits
erfolgte Kontoanlage oder Veröffentlichung. Zunächst lokal mit synthetischen
Daten prüfen; echte Einrichtung und Geräteabnahme getrennt belegen.

## Kaufgeschwindigkeit: Befund und begrenzter Vorschlag

`src/trainer/purchases/transport.js` prüft vor jedem gebundenen Drive-Aufruf das
Konto über `about`. Jeder unveränderliche Upload prüft zusätzlich denselben
installierten Konfigurationsanker erneut: zweimal Ordnermetadaten und dreimal
Konfigurationsdaten. Bei drei parallel gestarteten Uploads wiederholt sich
dieser Ablauf dreimal.

Eine gemeinsame, nur während dieses Upload-Batches laufende Prüfung könnte
bei einer einteiligen Basis zehn Drive-Lesezugriffe und zehn vorgeschaltete
Kontoabfragen sparen. Es handelt sich um eine Codepfad-Zählung, nicht um eine
gemessene Zeitersparnis bei Google. Weitere Lernabgleiche und Wiederholungen
sind darin nicht enthalten.

Grenzen des Vorschlags: exakte Konto-/Token-, Datensatz- und Konfigurationsbindung;
keine Wiederverwendung über Kaufversuche, Batches oder Tokenwechsel hinweg;
neue Prüfung vor dem bedingten Schreiben des Kaufkopfs. Hashprüfung,
Upload-Nachlesen, gespeicherte Aufträge und ETag-Bedingungen bleiben erhalten.
Eine Zusammenlegung vollständiger Lernabgleiche braucht eine weitergehende
Prüfung der Kaufaktualität und ist nicht durch diesen kleinen Vorschlag gedeckt.

## Umsetzungs- und Prüfgrenze

Die Arbeiten verändern keine persönlichen Browserdaten, Google-Konfiguration
oder echten Tokens. Der Serverkern ist in `eefc985` implementiert; `29f3526`
behebt die Abmeldebefunde der unabhängigen Prüfung. Alle 15 fokussierten
Servertests sind grün, die gezielte Nachprüfung ist ohne offenen Befund. Details:
[Anmeldebericht](../reports/2026-09-27-server-anmeldung.md).

Der aktuelle Gesamtprüfstand umfasst **580/580 Node-Tests und 58/58 Browserfälle**,
jeweils ohne Fehler oder übersprungene Fälle. Die getrennte Bereitstellungskopie
enthält 161 öffentliche Dateien; ein zusätzlicher Shellversuch bestätigt den
Abbruch bei einer unbekannten Ausgabedatei. Diese Nachweise belegen keine echte
automatische Anmeldung auf Cloudflare oder iOS. Details und vollständige
Grenzen stehen im Anmeldebericht.

Arbeitsagenten: Anmeldeanalyse GPT-6 Sol / high; Kaufanalyse GPT-6 Sol / medium.
Umsetzung und begrenzte Nachprüfung GPT-6 Sol / high; unabhängige erste
Serverprüfung GPT-6 Astra / high. Ausschließlich synthetische Zugriffe.

## Lokale Umsetzung und Weiterarbeit

Die optionale Traineranbindung ist implementiert: `src/drive/server-auth.js`
nimmt die Sitzung ohne Popup wieder auf; Lern- und Kauftransport verwenden
im Servermodus denselben kontogebundenen Proxy. Die Oberfläche bleibt bei
Netzproblemen lokal bedienbar. Ein bewusstes Abmelden wird erst nach
Serverbestätigung als erfolgreich angezeigt. Cacheversion ist `v28`.

`npm run prepare:cloudflare` erstellt ausschließlich die getrennte ignorierte
App-Kopie `.cloudflare/public/` mit `authMode: 'server'`. Es legt keine Konten
oder Datenbanken an. Die Vorlage `server/wrangler.example.jsonc` erzwingt
diesen Kopierschritt vor der Bereitstellung und deaktiviert automatische
Worker-Logs. Unbekannte Ausgabedateien und Linkausbrüche stoppen den Vorgang.

Die unabhängige Gesamtprüfung und gezielte Nachprüfung sind mit Spec/Qualität
PASS abgeschlossen. Ein dabei reproduzierter Stillstand des Autoabgleichs
bei verzögerter Sitzung und gesperrter Erwachsenen-PIN wurde behoben und mit
einem zusätzlichen Browsertest abgesichert. Der konkrete nächste Schritt ist die
einmalige private Einrichtung nach
[Cloudflare-Anleitung](../CLOUDFLARE-EINRICHTUNG.md): kostenloses Konto,
HTTPS-Adresse, D1-Sitzungsspeicher und bestehender Google-OAuth-Client mit
passender Rücksprungadresse. Secrets ausschließlich beim Anbieter eintragen.
Zunächst synthetisch mit dem echten Anbieter prüfen, dann bestehende Daten
über den dokumentierten Sicherungs-/Bestandsweg übernehmen. Google-Teststatus,
Reload, Ablauf, Widerruf und zwei echte Geräte bleiben gesonderte Nachweise.

Für den unveränderten Produktstart gelten die Anweisungen der vorherigen
Übergabe (`npm start`, `/trainer/`, Trainercache `v28`). Den bisherigen
Browserursprung beibehalten; `localhost` und `127.0.0.1` haben getrennte Daten.
Keine Browserdaten löschen. Git überträgt keine Lernstände oder Google-Sitzungen.
Kein Merge nach `main` und keine Hostingbereitstellung vorgenommen.

## Fortsetzung der geführten privaten Einrichtung am 27.09.2026

Dieser spätere Abschnitt aktualisiert die oben dokumentierte lokale
Vorbereitungsphase. Der Nutzer hat inzwischen die geführte kostenlose
Einrichtung für einen privaten Test im Freundeskreis beauftragt und die
Einzelschritte durchgeführt. Eine öffentliche Produktvermarktung, eine Änderung
der Repository-Sichtbarkeit und eine Lizenzentscheidung gehören weiterhin
nicht dazu. Die App ist inzwischen unter
[Vokabeltrainer](https://vokabeltrainer.marco-civico.workers.dev/trainer/)
bereitgestellt; die echte Google-Anmeldung ist noch nicht geprüft.

**Anhand der Einrichtungsansichten zunächst geprüft:** Ein Worker lieferte „Hello World“;
die D1-Datenbank enthält die Tabellen und Indizes aus `server/schema.sql` und ist
als `SESSIONS` gebunden. **Vom Nutzer zunächst bestätigt:** Worker-Logs sind aus,
`APP_ORIGIN` und `GOOGLE_CLIENT_ID` sind eingerichtet, `GOOGLE_CLIENT_SECRET` und
der getrennt erzeugte `SESSION_ENCRYPTION_KEY` sind als Secrets gespeichert.
Beim bisherigen Google-Web-Client sind der HTTPS-JavaScript-Ursprung und die
exakte Rücksprungadresse mit `/api/auth/callback` bestätigt. Die Secret-Werte
wurden nicht zur Kontrolle ausgelesen und sind nicht Bestandteil der
Dokumentation oder der lokalen Wrangler-Konfiguration.

Die ignorierte `server/wrangler.local.jsonc` ist mit den tatsächlichen
öffentlichen Konfigurationswerten vorbereitet. Ein echter lokaler Dry-run mit
**Wrangler 4.142.0** endet aus dem Arbeitsverzeichnis `server/` mit Exitcode 0.
Der Build-Hook bleibt aktiv und erstellt **161 öffentliche Dateien** unter den
beiden Wurzeln `src/` und `trainer/`, insgesamt 10.982.871 Bytes; die größte
Datei umfasst 2.052.566 Bytes. Der frische Lauf
`npm run test:server` besteht mit **24/24 Fällen**. Diese Prüfungen verwenden
keine echten Lernprofile und belegen noch keine Anmeldung bei Google.

Zwei konkrete Einrichtungsfehler wurden eingegrenzt:

- Der erste Dry-run aus der Repositorywurzel startete den Build wegen
  `build.cwd: ".."` eine Ebene zu hoch und fand dort keine `package.json`.
  Das installierte Wrangler bestätigt: `build.cwd` bezieht sich auf das
  Prozess-Startverzeichnis; `main` und `assets.directory` beziehen sich dagegen
  auf die Konfiguration. Die Wiederholung aus `server/` war erfolgreich.
  Die [Einrichtungsanleitung](../CLOUDFLARE-EINRICHTUNG.md) enthält jetzt die
  eindeutigen, auf Wrangler 4.142.0 festgelegten Aufrufe. Der frühere lokale
  Test zur Konfigurationsauflösung ersetzte diesen echten CLI-Nachweis nicht.
- Der erste npm-Zugriff scheiterte mit `UNABLE_TO_VERIFY_LEAF_SIGNATURE`.
  Der betroffene Node-Prozess konnte mit `--use-system-ca` und dem vorhandenen
  System-Zertifikatsspeicher erfolgreich zugreifen. TLS-Prüfung blieb aktiv;
  keine globalen Zertifikats-, npm-, Proxy- oder Sicherheitsregeln wurden
  geändert.

Anschließend war die ausdrücklich bestätigte lokale Wrangler-Anmeldung
erfolgreich; `whoami` bestätigt das vorgesehene Cloudflare-Konto. Freigegeben sind
`account:read`, `user:read`, `workers_scripts:write` und `d1:write`, ergänzt um
das von Wrangler benötigte `offline_access`. Die CLI speichert ihre Zugangsdaten
verschlüsselt außerhalb des Repositorys; der Schlüssel liegt im
Windows-Anmeldeinformationsspeicher. Das dafür interaktiv eingerichtete
`@napi-rs/keyring` 1.3.0 ist Werkzeugunterstützung für Wrangler und keine
Produktabhängigkeit. Zugangsdaten wurden nicht ausgelesen oder dokumentiert.

Der anschließende echte Deploy mit `--keep-vars` war mit Exitcode 0 erfolgreich.
Aktive Worker-Version: `45b6cb48-486f-45c1-8afc-4425206af8b6`. Von 161 öffentlichen
Dateien wurden 155 hochgeladen und sechs inhaltsgleiche Dateien wiederverwendet.
Die CLI-Zählung von 178 Einträgen umfasst 161 Dateien und 17 Verzeichnisse.
Der Build-Hook blieb aktiv. Die lokale Konfiguration ergänzt
`preview_urls: false`, um die bereits deaktivierten Vorschauadressen zu
erhalten. Beim Konfigurationsvergleich zeigte Cloudflare die Protokollierung
trotz der vorherigen Nutzerbestätigung noch als aktiv. Die ausdrücklich
bestätigte Übernahme der lokalen Konfiguration setzte Observability und Logs
auf `false`; bis dahin hatte keine Google-Anmeldung über die App stattgefunden.

Die aktive Version bestätigt die Bindungen `ASSETS`, `SESSIONS`, zwei Variablen
und zwei Secrets vom Typ `secret_text`. Eine zusätzliche Secret-Liste bestätigt
die beiden vorgesehenen Namen; es wurden keine Werte ausgelesen. Eine lesende
D1-Abfrage von `sqlite_master` bestätigt die zwei Tabellen und zwei Indizes aus
`server/schema.sql`, bei null Änderungen. Die Remote-Prüfungen ersetzen keine
Prüfung persönlicher Lernstände.

Lesende HTTP-Prüfungen an der echten Adresse bestätigen:

- `/trainer/`: 200 und HTML;
- `/src/trainer/config.js`: 200 und `authMode: 'server'`;
- `/api/auth/session`: 200, `{"connected":false}` und `Cache-Control: no-store`;
- `/server/worker.js`, `/docs/ANFORDERUNGEN.md`, `/.git/config` und `/`: jeweils 404.

Der Dokumentationscheck erfasste nach den echten Wrangler-Aufrufen auch
ignorierte erzeugte Dateien: eine Dry-run-README unter `.cloudflare/` und den
Account-Cache unter `server/.wrangler/`, jeweils ohne Schlusszeilenumbruch.
`scripts/check-docs.mjs` schließt deshalb jetzt `.cloudflare` und `.wrangler`
wie andere Werkzeugausgaben aus. Die Projektquellen bleiben im Prüfbereich;
erzeugte Wrangler-Dateien müssen nicht für den Dokumentationsstil umgeschrieben
werden. Diese begrenzte Prüftool-Korrektur verändert keinen Produktcode.
Der abschließende Dokumentationscheck prüft 238 Markdown-Dateien und 901
lokale Links ohne Fehler; auch `git diff --check` ist sauber. Die begrenzte
Prüftool-Änderung und die Einrichtungsnachträge wurden unabhängig nachgelesen.

**Nächster Schritt:** Der Nutzer öffnet die App unter `/trainer/`, meldet sich
bei Google an und lädt anschließend neu, um die Wiederaufnahme zu prüfen.
Erst dieser reale Versuch kann die Google-Anmeldung bestätigen. Der alte lokale
Browserursprung und seine Daten bleiben erhalten. Google-Teststatus,
Refresh-Token-Lebensdauer, bestehender Drive-Bestand, Reload, Tokenablauf und
die Zwei-Geräte-/Apple-Abnahme bleiben offene Nachweise.

Zu Beginn dieser Einrichtung war `codex/vokabeltrainer-v1` auf `449aa2a` sauber
und mit dem lokal bekannten Remote-Trackingstand synchron. Diese Ergänzung ist
zunächst eine lokale Dokumentationsänderung. Die Worker-Versions-ID und die
HTTP-Prüfungen belegen die Bereitstellung; Git-Commit und Remote-Abgleich des
Dokumentationsabschlusses sind davon getrennt nachzuweisen. Kein Merge nach
`main` wurde vorgenommen.
