# Optionale Serveranmeldung – Prüfbericht

Stand: 27.09.2026. Branch `codex/vokabeltrainer-v1`. Ausgangspunkt:
`1c9e4975db93b1630792c65472d4e9fdcbb4f98d`.
[Entwurf](../superpowers/specs/2026-09-27-server-anmeldung-design.md) und
[Plan](../superpowers/plans/2026-09-27-server-anmeldung.md) betreffen die
ausdrücklich bestätigte lokale Vorbereitung, keine echte Bereitstellung.

## Serverkern

Der Google-Code-Ablauf verwendet PKCE, einen einmalig verbrauchten Zustand und
eine gesonderte Browserbindung. Eine erfolgreiche Freigabe erzeugt eine
30-Tage-Sitzung. Zufällige Sitzungscookies sind HttpOnly, Secure und SameSite=Lax;
im D1-Speicher stehen nur deren Hashes. Google-Tokens werden mit AES-GCM
verschlüsselt. Antworten an den Browser enthalten keine Tokens.

Der begrenzte Drive-Proxy erhält Statuscodes und ETags sowie If-Match bei
bedingten Schreibzugriffen. Fremde Ziele, Redirects und fremde Origins werden
abgewiesen. Ein unbekannter Schreibausgang führt nicht zur automatischen
Wiederholung. Abgelaufene Zugriffe werden serverseitig erneuert; vorübergehende
Netzfehler löschen keine dauerhafte Freigabe. Ein bestätigter externer Widerruf
beendet die betreffende Sitzung.

## Trainerintegration und Bereitstellungskopie

Der optionale Adapter nimmt eine Serversitzung nach dem lokalen Appstart ohne
Google-Klick wieder auf. Begrenzte Wiederholungen nach Netzfehlern sowie Online-
und Sichtbarkeitsereignisse ermöglichen spätere Wiederaufnahme. Ein Proxy-401
löst eine neue Sitzungsprüfung aus, keine Wiederholung einer Schreiboperation.
Abmelden wartet auf die Serverbestätigung; bei einem Netzfehler bleibt die
Verbindung wahrheitsgemäß erhalten. Zeitlimits schließen den JSON-Body ein.

Lern- und Kauftransport verwenden denselben Proxy. Ein lokaler, nichtgeheimer
Sitzungsmarker und ein serverseitig geprüfter Kontoheader verhindern, dass ein
alter Auftrag nach einem Kontowechsel gegen das andere Konto ausgeführt wird.
Veraltete Antworten können eine neuere Anmeldung nicht zurücksetzen.
Die manuellen Client-ID-Einstellungen entfallen im Servermodus. Cache v28
enthält den neuen Adapter, aber keine Sitzungs- oder Drive-Antworten.

`npm run prepare:cloudflare` erstellt eine ignorierte, getrennte Kopie aus der
öffentlichen Dateiliste und schaltet nur diese Kopie in den Servermodus.
Unbekannte Dateien, mehrdeutige Konfigurationen und Linkausbrüche brechen den
Lauf ab. Die Wrangler-Vorlage erzwingt diese Prüfung als Buildschritt und
deaktiviert automatische Worker-Logs. Keine private Datei oder Zugangsdaten
gehören in die statische Kopie. Der normale lokale Start bleibt Browsermodus.

Die Vorbereitung ist für die private Nutzung im Freundeskreis bestimmt,
nicht für eine öffentliche Produktveröffentlichung. Die notwendige echte
HTTPS-Einrichtung beschreibt die
[Cloudflare-Anleitung](../CLOUDFLARE-EINRICHTUNG.md).

## Unabhängige Prüfung und Korrekturen

Der erste Serverstand `eefc985` bestand 13 fokussierte Tests. Die unabhängige
Prüfung durch GPT-6 Astra / high fand drei P2-Befunde:

1. Eine verspätete Abmeldeantwort konnte den Cookie einer neueren Anmeldung
   löschen. Normales Abmelden entfernt jetzt ausschließlich den adressierten
   Serverdatensatz; der alte Cookie wird dadurch ungültig, ohne einen neueren
   Cookie zu überschreiben.
2. Der automatische Google-Widerruf beim Abmelden hätte auch andere Geräte
   desselben Familienkontos getrennt. Er wurde entfernt. Diese Präzisierung
   des Entwurfs entspricht der angekündigten Trennung dieser Sitzung.
   [Google: Reichweite des Widerrufs](https://developers.google.com/identity/protocols/oauth2/web-server#tokenrevoke)
3. Der neue SQLite-Test benötigt für die unterstützte Node-Version 22.8 den
   Schalter `--experimental-sqlite`. Der dokumentierte Aufruf wurde korrigiert.

Die beiden neuen Verhaltensfälle waren zunächst rot. Nach Korrektur in
`29f3526` bestanden **15/15 Servertests**. Die gezielte Nachprüfung durch
GPT-6 Sol / high bewertet alle drei Befunde als behoben; kein neuer Befund im
Korrekturumfang. Ein zusätzlicher Reviewversuch verwendete getrennte
Serviceinstanzen am selben tatsächlichen SQLite-Speicher und bestätigte,
dass ein verspäteter Refresh eine gelöschte Sitzung nicht wiederherstellt.

Die anschließende unabhängige Gesamtprüfung durch GPT-6 Astra / high fand
genau einen weiteren P2-Befund (RF-01): Bei einem bereits gebundenen Lernbereich
konnte der Scheduler starten, bevor die Sitzungsabfrage antwortete. Nach
erfolgreicher Wiederaufnahme unterblieb der erneute Abgleich, solange die
Erwachsenen-PIN gesperrt war. Der isolierte Browserversuch zeigte null
Proxyaufrufe nach Wiederaufnahme und erst nach einem zusätzlichen Online-
Ereignis zwei Aufrufe. Die Prüfung verlangt deshalb einen von der PIN
unabhängigen Anstoß und einen Browserregressionstest für diesen Startablauf.
Sonst wurden keine weiteren konkreten Befunde festgestellt.

RF-01 wurde in einer begrenzten Fixwelle behoben: Der bestehende Scheduler
wird nach erfolgreicher Wiederaufnahme bei vorhandener Bindung unabhängig
von der PIN angestoßen; der Schließzustand bleibt geschützt. Der neue
Browserfall war vor der Korrektur rot (0/1, null Proxyaufrufe) und danach grün
(1/1). Er prüft die verzögerte Sitzung ohne zusätzliches Onlineereignis und
bestätigt anschließend die weiterhin gesperrte Erwachsenenansicht. Die
gezielte Nachprüfung durch GPT-6 Astra / high bewertet **RF-01 als behoben,
Spec PASS und Qualität PASS**. Es verbleiben keine Reviewbefunde im lokalen
Umfang; echte Provider-/Gerätenachweise sind davon getrennt.

## Aktueller Gesamtprüfstand

Nach Zusammenführung der optionalen Trainerintegration, des Stagers und der
abschließenden RF-01-Korrektur wurden
folgende Prüfungen frisch ausgeführt:

- `npm test`: **580/580 Tests bestanden**, 0 Fehler, 0 übersprungen;
  Node 22.23.3 mit `--experimental-sqlite`.
- Vollständige Trainer-Browserregression einschließlich
  `server-auth.browser.mjs`: **58/58 Fälle bestanden**, 0 übersprungen,
  isolierter Edge und synthetische Sitzungen. Aufruf und Umgebung stehen in
  [tests/browser/README.md](../../tests/browser/README.md).
- `npm run prepare:cloudflare`: **161 öffentliche Dateien** erstellt;
  die Quellkonfiguration bleibt im Browsermodus.
- Ein gesonderter Shellversuch mit einer synthetischen unbekannten Datei im
  Ausgabeordner ließ denselben npm-Build-Hook mit Exitcode 1 abbrechen. Die
  Datei blieb erhalten. Nach Entfernen ausschließlich dieser Testdatei war
  der normale Vorbereitungslauf erneut erfolgreich. Kein Wrangler-Deploy.
- `npm run check:docs`: keine fehlerhaften lokalen Verweise;
  `git diff --check`: keine Formatfehler.

Die Gesamt-Browserfälle umfassen Reload ohne Google-Klick, zunächst fehlerhafte
Sitzungsabfrage bei weiterhin nutzbarer Oberfläche, fehlgeschlagenes Logout
und den automatischen Abgleichsanstoß bei verzögerter Sitzung und gesperrter PIN.
Die Server-/Adaptertests decken außerdem Ablauf, Widerruf, alte Antworten,
Kontowechsel, die Wiederaufnahme nach Proxy-401 und das Zeitlimit einschließlich
Antwortbody ab. Das ist kein echter Anbieter- oder Gerätetest.

Umsetzung: GPT-6 Sol / high für Serverkern, Trainerintegration und Staging.
Die unabhängige Gesamtprüfung und gezielte Nachprüfung erfolgten durch
GPT-6 Astra / high. Geprüfter und exakt auf GitHub bestätigter Produktcommit:
`e270ae727c2da5e3b1ca7db71b28f014c3fb7de9`. Der nachfolgende Dokumentationscommit
ändert keinen getesteten Programmcode.

## Prüfgrenzen

Die Tests verwenden synthetische Google-Antworten und lokale Datenbanken.
Sie sind kein Nachweis für echtes Cloudflare D1, ein eingerichtetes Google-
Projekt, die kostenlose HTTPS-Adresse, Safari oder eine Home-Bildschirm-App.
Es wurden weder Konten eingerichtet noch Secrets übertragen oder Tarife
aktiviert. Der SQLite-Lauf erfolgte auf Node 22.23.3; ein tatsächlicher Lauf
unter Node 22.8 wurde nicht behauptet.

Die bestehende Browservariante bleibt für `npm start` maßgeblich. Die
Servervariante benötigt vor echtem Betrieb eine ausdrückliche Einrichtung.
Der Google-Teststatus mit begrenzter Refresh-Token-Lebensdauer, zwei Geräte
und die Übernahme bestehender Daten auf den neuen Ursprung müssen dabei
gesondert geprüft werden.
