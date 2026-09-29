# Tiger-Fortsetzung

Stand: 29.09.2026. Entwicklungszweig: `codex/vokabeltrainer-v1`.

**Abgeschlossen:** Produktcommit `05d21b9f155cebb09e6ba7be8754331c575ed8d5`
ist integriert und exakt mit GitHub abgeglichen. Cache v35 ist privat
bereitgestellt und die vier Tigerformen sind im bestehenden Testbrowser
beobachtet. Diese Abschlussdokumentation wird separat gesichert.

## Auftrag und Ausgangspunkt

Nach Abschluss der Nebelhirsch-Reihe beauftragt der Nutzer mit
„Dann mache nun weiter“ die Fortsetzung. Hauptzweig und wiederverwendeter
isolierter Arbeitszweig standen beim Einstieg sauber auf
`910ebcda644151cfdd2f0728071488afa3af3229`.
Beim Einstieg lief die private App mit Cache v34 und Produktcommit `6d3ee83`.
Der [Nebelhirsch-Abschluss](2026-09-29-nebelhirsch-fortsetzung.md)
enthält dessen Prüfungen, Bereitstellung und tatsächliche Browserbeobachtung.

Das bestätigte begrenzte Bildpaket ergänzt die Tiger-Reihe.
Die Grundfigur `tiger` ist ab Level 5 verfügbar und gehört bereits zum
bestehenden getrennten Testprofil. Ihre vorhandene Quelle
[tiger.png](../design/avatar-shop-sources/tiger.png) hat 1223 × 1286 Pixel
und die SHA-256-Prüfsumme
`888e90dd3f2a8d4c63222e34d9bb2be4984f6eb32fcebcc1a0a806f8239d334b`.
Sie wird unverändert als Stufe 1 übernommen.

## Konkreter Bildvorschlag

Die mit der eingebauten Bildgenerierung erstellte [Viereransicht v1](../design/avatar-evolution/tiger-stages-concept-v1.png)
überträgt die bestätigte malerische Stilrichtung und den deutlich mythischen
Sprung zur Endstufe auf den orange-schwarz gestreiften Tiger.
[Prompt, Referenzen und Status](../design/avatar-evolution/tiger-stages-concept-v1.json)
sind gespeichert.

1. Vorhandene Grundform mit weißer Brust und bernsteinfarbenen Augen.
2. Dschungelentdecker mit grün-braunem Reisegeschirr und kleiner Kartentasche.
3. Tempelwächter mit jadegrüner/goldener Rüstung und warmem Sonnenstein.
4. Mythische Sonnenform mit leuchtender Fellzeichnung, langen goldweißen
   Fellsträhnen und ausgeprägtem Schweif; deutlich weniger Rüstung als Stufe 3.

Die Stufenbeschreibungen sind Arbeitsbegriffe. Die Produktnamen bleiben
„Tiger – Stufe 1“ bis „Tiger – Stufe 4“. Das vollständige Tier mit
vier Pfoten und einem Schwanz bleibt in jeder Form erkennbar.

**Persönlich bestätigt:** Der Nutzer beantwortet die konkrete Frage, ob diese
vier Formen als einzelne App-Bilder umgesetzt und in die Galerie eingebunden
werden sollen, mit „Ja, genau so umsetzen“. Die Tiger-Bildrichtung und dieses
begrenzte Umsetzungspaket sind damit bestätigt.
Preise 200/400/800, Besitzfolge, bewusste Auswahl und EV01–EV05 werden nicht
erneut zur Entscheidung gestellt.

## Unabhängige Vorbereitung und Grenzen

Die gezielte Bestandsprüfung bestätigt vorhandene Figurenkennung,
Grundquelle und Stufenmodell. Die bestehende Bildpipeline unterstützt
weitere Figuren bereits. Ergänzt werden Quellenliste, Manifest und Derivate,
Auslieferungs-/Cachelisten und zugehörige Bild-/Browserprüfungen.
Aktuelle Fehlbildtests verwenden `explorer-girl`, nicht `tiger`.
Der Kaufkern und die Anmeldelogik benötigen für diese Bildreihe keine Änderung.

Konzept und Vorprüfung wurden zunächst als Dokumentationscommit
`89730de575bebf273bc166cdff75575c13e59b19` gesichert und exakt mit GitHub
abgeglichen. Nach persönlicher Bestätigung wurden Einzelbilder und Integration
als Produktcommit `05d21b9` abgeschlossen.
Kein Kauf, keine Guthabenänderung, kein Import und keine neue
Google-/Drive-Einrichtung wurden vorgenommen. Nach Bereitstellung der neuen
Reihe sind zwölf von 76 Motiven produktiv ausgeliefert; 64 bleiben offen.
Die bisherigen Token-/Geräteabnahmen bleiben eigenständige offene Nachweise.

## Nächster Schritt

Der nächste konkrete technische Punkt ist die Diagnose des erneut sichtbaren
Google-Verbindungshinweises im getrennten Testbrowser, ohne erneuten Import
oder Einrichtungsreset. Den vorhandenen Testbereich und Familienbestände
erhalten. Weitere Figuren brauchen jeweils einen konkreten Bildentwurf und
persönliche Bestätigung vor ihrer Produktion. Für das Tigerpaket bleibt kein
weiterer Umsetzungsschritt offen.

## Gewählte Produktionsquellen

Die [Quellenübersicht](../design/avatar-evolution-sources/README.md) verlinkt
die vier unveränderten PNGs. Stufe 1 ist die bytegleiche Bestandsquelle;
Stufen 2–4 sind einzelne neue Ausgaben der eingebauten Bildgenerierung anhand
des bestätigten Konzeptbogens und der ursprünglichen Tigeridentität.
Die gleichnamigen JSON-Dateien bewahren Prompts, Referenzen, Auswahlstatus
und Prüfsummen. Der Benutzer hat das Konzept und seine Umsetzung persönlich
bestätigt; die Prüfung der daraus erzeugten Einzelbilder ist eine gesonderte
technische und visuelle Prüfung.

| Stufe | Pixel | Bytes | SHA-256 |
| --- | --- | --- | --- |
| 1 | 1223 × 1286 | 1.795.176 | `888e90dd3f2a8d4c63222e34d9bb2be4984f6eb32fcebcc1a0a806f8239d334b` |
| 2 | 1254 × 1254 | 1.775.422 | `10d4b96944cc0d71d0d41024ed6a4ca1170d42438ab8d7e65db1a1c494551c33` |
| 3 | 1254 × 1254 | 1.814.998 | `10996315058fbcc448bb619efee12f216669b8164f7680f5312b4a8f7c3eee76` |
| 4 | 1254 × 1254 | 2.088.922 | `c130b937c9eb961868327aa3bfcd79573ae2299a6cc242f8009bb883b03050f8` |

Alle vier Quellen sind RGBA-PNGs mit echtem Alphakanal. Die Erstprüfung
umfasst ganze Quellen sowie kleine Darstellungen auf hellen und dunklen
Karten; Figuren, vier Pfoten, Ohren und Schwanz bleiben vollständig sichtbar.
Die tatsächliche Alphakomposition ist maßgeblich, nicht unsichtbare RGB-Werte
vollständig transparenter Pixel.

Die unabhängige Bildprüfung bewertet diese Quellen mit **PASS**: Identität,
Fortschritt der Formen, Anatomie, Alphakanal und sämtliche Quellen-/Referenzhashes
sind geprüft. Bei Stufe 4 liegt der Schweif dicht am rechten Quellrand, ohne
sichtbare Beschneidung; der Innenabstand wurde zusätzlich in der Galerie geprüft.

## Umsetzung und Bildgrößen

Die bestehende Bildpipeline enthält jetzt die Tiger-Quellen und erzeugt zwölf
transparente WebPs mit 256, 512 und 768 Pixeln Breite. Manifest und
[Buildbericht](../../trainer/assets/avatar-evolution/build-report.json) sind
generiert; die 24 vorhandenen Drachen-/Nebelhirschvarianten bleiben unverändert.
Die explizite Auslieferungsliste enthält die zwölf neuen Bilder. Große
PNG-Quellen und Entwurfsdateien werden nicht mit ausgeliefert.

Cache v35 nimmt die vier kleinen Tigerbilder verpflichtend auf; größere
Varianten werden bei Bedarf nachgeladen. Offline greift dieselbe Darstellung
auf die kleine Form zurück. Der kontrollierte Updatefall prüft v35 → v36
synthetisch. Gemeinsame Galeriedarstellung, Käufe, Anmeldung, Guthabenregeln
und Preise ändern sich durch dieses Bildpaket nicht.

| Tiger-Bilder | Bytes insgesamt |
| --- | ---: |
| Vier PNG-Quellen | 7.474.518 |
| Vier kleine WebPs, 256 px | 115.260 |
| Vier mittlere WebPs, 512 px | 332.448 |
| Vier große WebPs, 768 px | 629.840 |
| Alle zwölf WebPs | 1.077.548 |

Alle zwölf kleinen Offlinebilder der drei Reihen benötigen zusammen
398.534 Bytes. Die größeren Varianten aller drei Reihen werden weiterhin
nur passend zur Anzeige angefordert.

## Tatsächlich ausgeführte Prüfungen

Der Ausgangstest vor Integration schlug wegen fehlender Tigerpfade,
Manifest-/Berichtseinträge und Rückfallbilder in vier von zehn Fällen fehl.
Nach Integration bestanden:

- 25/25 gezielte Node-Tests für Bilder, Galeriemodell, Service Worker und
  explizite Auslieferung, 2,047 Sekunden.
- 646/646 Node-Tests der vollständigen Suite (`npm test`), Exit 0,
  217,028 Sekunden; kein übersprungener oder abgebrochener Fall.
- 6/6 Browserfälle im lokalen Edge, 27,319 Sekunden: responsive Darstellung,
  Offline-Rückfallbild, Auswahl und vollständige Galerie für Nebelhirsch und
  Tiger sowie drei bestehende Updatefälle. Die Updatefälle prüfen auch
  fehlgeschlagene Installation, aktive Eingabe und mehrere offene Appfenster.
- Die Galerie wurde bei 1280 und 390 Pixeln Breite als Screenshot geprüft.
  Alle vier Tigerbilder einschließlich Schweif der Sonnenform passen
  vollständig in die Karten; kein horizontaler Überlauf. Diese lokalen
  Screenshots verwenden ausschließlich synthetische 600-Punkte-Testdaten.

Die gezielten Befehle waren:

```sh
node --experimental-sqlite --test --experimental-test-isolation=none tests/trainer/evolution-art.test.js tests/trainer/purchases-view.test.js tests/trainer/sw.test.js tests/serve.test.js
node --test --experimental-test-isolation=none --test-name-pattern='evolution pictures|owned|C2 rejected required precache|trainer offline update UI|update notice follows' tests/browser/evolution-art.browser.mjs tests/browser/trainer.browser.mjs tests/browser/status-feedback.browser.mjs
```

Der Browserlauf nutzt die vorhandene Playwright-Installation und den
lokalen Edge über `PLAYWRIGHT_MODULE` und `BROWSER_EXECUTABLE`.
Die unabhängige Code-/Specprüfung ist **PASS** ohne kritischen oder wichtigen
Befund. Sie vergleicht alle 24 bisherigen Bilddateien mit den Git-Blobhashes
des Ausgangscommits und alle 36 Varianten mit Manifest und Buildbericht.
Ein kleiner Hinweis zur Fehlermeldung in der Testhilfe ist geschlossen:
Sie nennt wieder zutreffend die tatsächlich erlaubte Mindestversion v34;
das Prüfverhalten bleibt unverändert, Syntaxprüfung Exit 0.
Eine lokale Browserprüfung ist kein Nachweis auf einem physischen iPhone/iPad.

## Private Bereitstellung und tatsächliche Browserbeobachtung

Das geprüfte Paket wurde ohne Inhaltsänderung per Fast-Forward in
`codex/vokabeltrainer-v1` übernommen. Der Vergleich beider Git-Bäume war leer.
Die bestehende Cloudflare-Vorbereitung erzeugte 199 ausdrücklich freigegebene
öffentliche Dateien. Der Upload ersetzte/ergänzte 14 Dateien, 185 waren
bereits vorhanden. Private Entwurfs-/Quell- und Zugangsdaten wurden nicht
in dieses öffentliche Paket aufgenommen.

- Cachekennung: v35.
- Aktive Worker-Version: `7647cf4d-ca75-4917-9cf1-13b8fe99afc3`.
- Version erstellt: 29.09.2026, 09:21:20.237 UTC.
- Bereitstellung seit 09:21:21.425 UTC zu 100 Prozent aktiv, beim Anbieter gelesen.
- Um 09:21:45.316 UTC sind 44 HTTP-Antworten mit dem geprüften Paket bytegleich
  verglichen: acht App-/Kauf-/Bildmodule und alle 36 Bildvarianten der drei Reihen.

Im vorhandenen Codex-Testbrowser wurde der kontrollierte Hinweis „Jetzt
aktualisieren“ übernommen. Die vorhandene Avataransicht blieb erreichbar.
„Meine Figur“ zeigt Drachenstufe 4 weiterhin als gewählte Figur. Anschließend
wurde beim bereits besessenen Tiger nur „Entwicklung ansehen“ geöffnet:

- Stufe 1 gehört dem Testprofil; Stufen 2–4 bleiben gesperrt.
- Nächste Form: Stufe 2 für 200 Punkte; verfügbar 40, fehlend 160 Punkte.
- 2.040 Lernpunkte und Level 11 bleiben erhalten.
- Alle vier Tigerformen und das Fortschrittsbild sind sichtbar und tatsächlich
  geladen (`complete`, positive Bildbreite, erwartete 256px-WebP-Adresse).
- Die vollständige Galerie einschließlich Schweif der Sonnenform wurde im
  echten Appfenster visuell geprüft. Kein Kauf oder Auswahlwechsel vorgenommen.

**Offener Google-Befund:** Nach dem vorbereitenden Neuladen, noch mit v34 und
sichtbarem Updateangebot, erschien „Für neue Käufe muss Google erneut verbunden
werden. Freigeschaltete Figuren bleiben verfügbar.“ Nach Übernahme von v35
erschien derselbe Hinweis. Eine neue Anmeldung wurde für diese Bildprüfung
nicht gestartet. Der zeitliche Befund belegt keinen Zusammenhang mit den
Tigerbildern und keine bestimmte Ursache; eine erfolgreiche automatische
Token-Erneuerung ist damit weiterhin nicht nachgewiesen. Der Familien-Chrome
blieb unangetastet. Vor einer weiteren Kaufsitzung ist dieser Befund zu klären.

## Git-Sicherung und Grenzen

Produktcommit `05d21b9f155cebb09e6ba7be8754331c575ed8d5` wurde auf
`origin/codex/vokabeltrainer-v1` gepusht. `git rev-parse HEAD` und
`git ls-remote --heads origin refs/heads/codex/vokabeltrainer-v1` lieferten
danach exakt denselben Hash. Dieser Nachtrag enthält nur Dokumentation,
ändert das bereitgestellte Produkt nicht und wird ebenfalls auf demselben
Zweig gesichert; sein Commit ist über die Git-Historie nachvollziehbar.

Die Browserprüfungen sind keine neue reale Kaufzeitmessung und keine
Zweitgeräte-/Apple-Abnahme. Das Wunschziel unter zehn Sekunden beim Kauf,
natürliche Token-Erneuerung, physisches iPhone/iPad, Safari und Home-Bildschirm-App
bleiben separat offen. 64 weitere Motive sind Folgeumfang.
