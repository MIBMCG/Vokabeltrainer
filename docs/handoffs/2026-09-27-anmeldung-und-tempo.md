# Fortsetzung: automatische Anmeldung und Kaufgeschwindigkeit

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
