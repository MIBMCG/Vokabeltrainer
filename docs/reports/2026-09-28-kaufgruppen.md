# Begrenzte Beschleunigung der Kaufuploads

Stand: 28.09.2026. Ausgangspunkt ist `c4996144afce6287457737bf84289c870cdad222`; geprüfter Produktcommit ist `b6b83a95346d2b2c71a3d3edba35abff88f43047`. Das Produktpaket ist unverändert per Fast-Forward in `codex/vokabeltrainer-v1` übernommen und mit Dokumentationsabschluss `939830c` exakt auf GitHub bestätigt. Die anschließende echte Bereitstellung ist unten getrennt vom Produkttest festgehalten.

## Problem und Änderung

Bei drei parallel gestarteten unveränderlichen Kaufuploads prüfte der Transport denselben installierten Konfigurationsanker dreimal. Jede Prüfung las zweimal Ordnermetadaten und dreimal die Konfigurationsdatei; jedem gebundenen Drive-Aufruf ging außerdem eine Kontoabfrage voraus.

`src/trainer/purchases/transport.js` bündelt nun höchstens drei Dateien **eines gespeicherten Kaufversuchs** in `writeImmutableBatch`. Eingaben und Laufzeit-Token beziehungsweise Server-Sitzungsmarker werden für diesen Aufruf erfasst. Der installierte Anker wird einmal pro Gruppe vollständig geprüft. `src/trainer/purchases/service.js` übergibt die bereits gespeicherten Dreiergruppen nacheinander; erst nach dem Erfolg einer Gruppe folgt die nächste. Gestartete Uploads werden auch im Fehlerfall zu Ende abgewartet. Der gespeicherte Auftrag und seine Datei-IDs bleiben für eine ausdrückliche Fortsetzung erhalten.

Jede Datei behält ihre eigene Prüfung von Auftragsberechtigung, Referenz, Inhaltshash, Metadaten und Nachlese, auch bei HTTP 409. Jede HTTP-Anfrage behält ihre Kontoabfrage und verwendet denselben Token für diese Prüfung und den abhängigen Zugriff. Ein Wechsel des Tokens oder Sitzungsmarkers bricht die Gruppe ab. Vor dem bedingten Schreiben des Kaufkopfs werden Anker und Pointer frisch geprüft; das gespeicherte ETag und `If-Match` bleiben maßgeblich. Einrichtung, Aktivierung, Wiederherstellung und der Einzeluploadweg wurden nicht auf Gruppen umgestellt. Datenformat, Preise und Punktevergabe ändern sich nicht.

Die versionierte Trainer-Cachekennung wurde von `v28` auf `v29` erhöht. Die Pflichtliste enthält die geänderten Laufzeitdateien; der kontrollierte Updatefall verwendet `v30` als synthetische Folgeversion. Es kamen weder Laufzeitmodule noch Produktionsabhängigkeiten hinzu.

## Entwicklung und Prüfungen

Die Änderung wurde testgetrieben entwickelt: Der erste Transporttest scheiterte an der noch fehlenden Batchmethode, der Diensttest zunächst an der fehlenden Gruppierung. Weitere zuerst fehlschlagende Fälle erfassten einen Markerwechsel während der asynchronen Vorprüfung und veränderte Aufrufobjekte. Nach den Korrekturen bestanden die gezielten Fälle.

Zwei gleich eingerichtete synthetische HTTP-Fixtures zählten für drei gespeicherte Einzeluploads **54** und für eine Dreiergruppe **34** HTTP-Aufrufe. Die Gruppe liest den fünfteiligen Anker einmal statt dreimal; dadurch entfallen zehn Anker-Lesezugriffe und deren zehn Kontoabfragen. Alle drei Upload-POSTs und alle neun Zugriffe der drei Datei-Nachlesen bleiben im Zähltest enthalten. Diese Messung belegt Anfragezahlen, keine reale Zeitersparnis.

Auf dem geprüften Produktstand wurden folgende Abschlussprüfungen berichtet und ihre Ergebnisse eingesehen:

| Prüfung | Ergebnis |
| --- | --- |
| Vollständige Node-Suite mit `npm test` (unter Windows `npm.cmd test`) | **591/591 bestanden**, 0 Fehler, 0 übersprungen; Exitcode 0 |
| Ausgewählte Produkt-Browserfälle | **12/12 bestanden**, 0 Fehler, 0 übersprungen; Exitcode 0 |
| `npm run prepare:cloudflare` (unter Windows `npm.cmd run prepare:cloudflare`) | **161 öffentliche Dateien** vorbereitet |
| Abschließende Diffprüfung | ohne Befund; Produktdiff identisch zum unabhängig geprüften Diff |

Die Browserauswahl enthält den durchgängigen Kauf mit erspielten Punkten, Wiederöffnung, Offlinebesitz, veralteter Vorschau und verlorener Antwort sowie die Server-Sitzung nach Reload, einen abgewiesenen Precache-Wechsel, Offline-Neustart bei gestopptem Testserver und das kontrollierte Cacheupdate. Die fokussierten Transport- und Recoveryprüfungen decken unter anderem Folgegruppen, neue Versuche, Anker- und Kontofehler, Hash- und Konfigurationsabweichungen, Markerwechsel, HTTP 409, fehlgeschlagene Nachlese und den frischen Pointerweg ab.

Die portablen Befehle für die wesentlichen lokalen Prüfungen lauten:

```sh
npm test
npm run prepare:cloudflare
node --experimental-sqlite --test --experimental-test-isolation=none tests/trainer/purchases-transport.test.js tests/trainer/purchases-recovery.test.js
```

Der ausgewählte Browserlauf lässt sich mit den betreffenden Dateien und Testnamen reproduzieren:

```sh
node --test --experimental-test-isolation=none --test-name-pattern='^(C2 rejected required precache|trainer offline|parent sees a local|purchase UI|purchase view|late purchase|activation preview|an unclear setup|earned points|one purchase|server session appears)' tests/browser/trainer.browser.mjs tests/browser/purchases.browser.mjs tests/browser/purchase-progress.browser.mjs tests/browser/server-auth.browser.mjs
```

Die Browserprüfungen benötigen Playwright als Entwicklungswerkzeug und Chromium oder Edge. [Die Browser-Testanleitung](../../tests/browser/README.md) beschreibt Einrichtung und die optionalen Umgebungsvariablen `PLAYWRIGHT_MODULE` und `BROWSER_EXECUTABLE` für vorhandene Installationen; persönliche absolute Pfade sind nicht Teil dieses Berichts.

Die unabhängige Prüfung des eingefrorenen Produktdiffs ergab **Spec PASS und Qualität PASS**, ohne offene Codebefunde. Nach dem vollständigen Node-Abschlusslauf wurde der committed Produktdiff mit demselben Reviewpaket verglichen; beide haben SHA-256 `DEFADBABE45BF5F2D3C1D44A77BFAF8F011B77EF9E065CF3C441FCCEC894ACBD`.

## Nachweisgrenzen

Die HTTP- und Browserprüfungen verwenden synthetische Google-Antworten und isolierte Browserdaten. Eine tatsächliche Verkürzung der Kaufwartezeit bei Google Drive wurde weder gemessen noch durch diesen Bericht behauptet. Ein echter Kauf auf der HTTPS-Adresse, regulärer Tokenablauf und die Abnahme auf zwei physischen Geräten sowie iPhone/iPad und Safari bleiben getrennte Nachweise. Der zuvor bestätigte Laptop-Einstieg belegt nicht die Wirkung der Änderung.

## Anschließende private Bereitstellung

Nach erneuter ausdrücklicher Fortsetzung am selben Tag wurde der unveränderte
Produktstand mit Wrangler 4.142.0 auf die bestehende private App übertragen.
Probelauf und Upload aus `server/` behielten den Build-Hook und `--keep-vars`.
Von 161 öffentlichen Dateien wurden genau drei neu hochgeladen:
`trainer/sw.js` und die beiden Kaufmodule; 158 Dateien wurden wiederverwendet.
Der Anbieter bestätigt die neue Version
`494388ba-6838-4604-9369-788a6e60962d` mit 100 Prozent Anteil.

Die Nachprüfung über HTTPS bestätigte für HTML, Serverkonfiguration, Service
Worker v29, Kaufservice und Kauftransport jeweils HTTP 200 und bytegleiche
Inhalte zum vorbereiteten Paket. Der unangemeldete Sitzungsabruf liefert
weiter `connected:false` mit `no-store`; interne Pfade liefern 404.
Im vorhandenen Chrome-Profil erschien danach der kontrollierte Updatehinweis.
„Jetzt aktualisieren“ führte wieder zur Profilauswahl. Der Nutzer bestätigt
die aktive Google-Verbindung ohne neue Anmeldung; anschließend wurden aktive
Verbindung und vollständiger Abgleich auch direkt in der App beobachtet.
Ein Kauf wurde mangels bezahlbarem freigegebenem Angebot nicht ausgelöst;
die günstigere Entwicklungsform benötigt noch ihr Bild. Diese Beobachtungen
ersetzen weder den echten Kaufversuch noch die getrennte Tokenablaufprüfung.
Zugang, Grenzen und Fortsetzung stehen in der
[Laptop-Übergabe](../handoffs/2026-09-28-laptop-fortsetzung.md#bereitstellungsfortsetzung-am-28092026).
