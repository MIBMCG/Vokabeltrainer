# Vollständige Avatar-Entwicklungsgalerie

Stand: 30.09.2026. Der Nutzer hat die Pause mit „arbeite nun weiter“ aufgehoben.
Alle zehn noch fehlenden Reihen einschließlich Sturmgreif und Phönix mit
Blitzen beziehungsweise Flammen in der Umgebung waren bereits persönlich
bestätigt. Die Quellen wurden bei dieser Fortsetzung nicht neu erzeugt.

## Umfang und unveränderte Grenzen

Die Galerie umfasst 13 Figuren mit je vier Formen. Die beiden menschlichen
Figuren besitzen zusätzlich je vier kostenlose Hauttöne: zusammen 52 Formen,
76 Bildmotive und 228 WebPs in den Größen 256/512/768. Neu hinzugekommen sind
64 Motive mit 192 WebPs. Die bisherigen 36 WebPs für Drache, Nebelhirsch und
Tiger sind bytegleich erhalten.

Die acht neuen Tier-Reihen sind Pferd, Mond-Einhorn, Sternen-Pegasus,
Kristalldrache, Polarlichtwolf, Schattenpanther, Sturmgreif und Phönix.
Entdeckerin und Entdecker behalten bei ihren Grundformen die freie
Kleidungsfarbwahl. Alle vier Hauttöne bleiben auch für höhere Formen wählbar;
deren Kleidung ist fest gestaltet. Klassischer Avatar und Zubehör bleiben
verfügbar. Kaufpreise 200/400/800, Guthaben, Besitz, Lernpunkte, Level,
Anmeldung und Synchronisation werden durch dieses Paket nicht verändert.

Die 64 neuen Ableitungssätze haben je Seite vier Prozent transparenten
Innenabstand. Die Rohquellen bleiben unverändert. Die 76 kleinen Varianten
benötigen zusammen 2.016.122 Byte und gehören zum Pflichtcache v41. Größere
Varianten laden bei Bedarf; alle WebPs zusammen benötigen 18.767.420 Byte.
Quell-PNGs und Konzeptbilder gehören nicht zur App-Auslieferung. Auch die
vier zuvor noch öffentlich erreichbaren großen Drachen-PNGs sind aus der
öffentlichen Liste entfernt; die Originaldateien im Repository bleiben erhalten.

Die fünf bestätigten Belohnungserweiterungen sind späterer Umfang: erst die
Entwicklungsstufen, dann übrige Optimierungen, anschließend Verwandlung,
Figurenbewegung, Lernreaktionen, Inselort und Steckbrief/Geschichte/Titel.
Die vorgeschlagene schnellere Lernbereichsübernahme bleibt zurückgestellt;
der konkrete Entwurf ist noch nicht bestätigt.

## Bildherkunft und Sichtprüfung

64 neue Produktionsquellen: 16 vorhandene Grundformen unverändert übernommen,
zwei persönlich bestätigte Endformen direkt übernommen und 46 weitere Motive
erzeugt. Alle zehn Reihen wurden auf hellem und dunklem Hintergrund geprüft.
Einhorn und Pegasus Stufe 2 wurden für eine klarere Staffelung vereinfacht;
sechs höhere menschliche Formen im dunkelsten Hautton an die Grundform
angeglichen. Diese Korrekturen wurden einzeln erneut gesichtet. Acht verworfene
Bearbeitungseingaben bleiben mit Herkunftsnachweisen im Repository.

PNG-Transparenz, 64 Quellhashes und 124 portable Referenzhashes wurden am
29.09.2026 geprüft. Build und Manifest enthalten Quellen, Größen und
Innenabstände. Am 30.09.2026 wurden außerdem die menschlichen Galerieansichten
auf 1280 und 390 Pixel Breite sowie Sturmgreif und Phönix gesichtet: vier
geladene Stufen, vollständige Endformen, erhaltene rote Grundformkleidung
und sichtbare Hautfarbwahl der höheren Menschenform.

## Tatsächlich ausgeführte Prüfungen

Vor der Pause bestanden 42/42 gezielte Node-Tests zu Manifest, Anzeige,
Galerie, Pflichtcache und öffentlicher Auslieferung. Die alten WebP-Dateien
wurden mit ihren Git-Blob-Hashes verglichen: 36/36 bytegleich.

Die vollständige Node-Suite lief am 30.09.2026 genau einmal mit `npm test`
über den vorhandenen Wachhaltehelfer: **658/659**, Dauer 83,8 Sekunden.
Der einzige Fehler in `tests/server/staging.test.js:110` wurde durch vier
veraltete, ignorierte Ausgabekopien von `dragon-stage-1..4.png` unter
`.cloudflare/public/trainer/assets/avatar-evolution/` verursacht. Die neue
explizite Auslieferungsliste lehnt diese Dateien zu Recht ab. Nach Prüfung
des absoluten Zielpfads wurden nur diese vier Ausgabekopien entfernt.
Der gezielte Nachlauf bestand **1/1**:

```text
node --test --experimental-test-isolation=none --test-name-pattern="actual repository copy" tests/server/staging.test.js
```

Es gab dafür keine Produktcodeänderung und keine zweite Vollsuite. Der
ursprüngliche Lauf wird ausdrücklich als 658/659 ausgewiesen, zusammen mit
dem erfolgreichen Nachlauf des einzigen zuvor fehlgeschlagenen Tests.

**21 unterschiedliche Browserfälle bestanden:**

- 16/16 in `tests/browser/evolution-art.browser.mjs`: vollständige Bildmatrix,
  Offlinebestand, responsive Auswahl und Ladefehler-Fallback, menschliche
  Grundformkleidung, gespeicherter Hautton, vier Hauttöne höherer Formen,
  tatsächlich transparente Randpixel aller 64 neuen kleinen Bilder sowie
  alle elf Tiergalerien in Desktop- und Mobilansicht.
- 5/5 ausgewählte Fälle aus `status-feedback.browser.mjs` und
  `trainer.browser.mjs`: Updatehinweis, abgelehnte Pflichtcache-Installation,
  Profil-/Avatarwahl, Offline-Neustart und kontrollierte Updateaktivierung.

Für brauchbare Menschenaufnahmen wurde ausschließlich die synthetische
Screenshot-Fixture korrigiert: ungenutztes Einrichtungsformular ausgeblendet,
Viewport explizit gesetzt und alle Bilder vor der Aufnahme dekodiert. Danach
bestanden die zwei betroffenen Menschenfälle erneut **2/2**. Sie zählen nicht
als zwei zusätzliche unterschiedliche Fälle. Abschließende Syntaxprüfung
dieser Testdatei und `git diff --check` waren ohne Befund.

Die Browserläufe verwenden Playwright mit dem vorhandenen Edge unter Windows
und isolierten synthetischen Daten. Protokolle und Aufnahmen liegen im
ignorierten Arbeitsverzeichnis `test-results/avatar-rest/`; relevante Dateien
sind `final-node-awake.log`, `evolution-browser.log`,
`offline-update-browser.log`, `human-visual-browser.log` sowie die
Menschen-/Sturmgreif-/Phönix-Aufnahmen. Vorhandene Familien- oder Testprofile
wurden für diese Prüfungen nicht neu eingerichtet oder importiert.

## Review, Integration und Bereitstellung

Derzeitiger Prüfstand: `3036ec9e5bf29f183ddb246f54a78ef428aac503` enthält Quellen,
Derivate und Produktintegration; `c1d7650a54ca4966a201bfafd92f00b32e2f388b`
ergänzt Browserabdeckung und Screenshot-Fixtures. Der isolierte Zweig
`codex/purchase-batch-checks` war nach diesem Commit sauber. Die unabhängige
Taskprüfung bewertet Spec und Qualität mit PASS. Das anschließende
Abschlussreview findet einen zusätzlichen Integrationsfehler: Ein gespeicherter
menschlicher Hautton 1–3 wird auch an Tierbilder weitergegeben, deren Schlüssel
ausschließlich Hautton 0 erlauben. Dadurch fehlen Entwicklungsbilder oder eine
höhere ausgewählte Form fällt auf das Grundbild zurück. Drei neue Browserfälle
haben den Fehler reproduziert. Die begrenzte Korrektur läuft; Integration und
private Bereitstellung warten auf ihre Prüfung. Die laufende App bleibt bis
dahin auf `31fcf02`, Cache v40.

Die lesende Cloudflare-Prüfung am 30.09.2026 meldet `Authentication error`
(10000) und `Invalid access token` (9109). Das Dashboard bestätigt für den
bisherigen Upload-Schlüssel den Status `Expired`. Die vom Nutzer bestätigte
Verlängerung wurde vom Dashboard nicht gespeichert; nach Neuladen blieb der
alte Ablauf bestehen. Ein Ersatz mit denselben Konto-/Berechtigungsgrenzen und
Ablauf am 08.10.2026 ist vorbereitet. Erstellung und verdeckte lokale Eingabe
liegen beim Nutzer. Es wurde kein App-Upload versucht.

Der zuvor automatisch abgelehnte GitHub-Upload ist noch nicht wiederholt.
Die konkrete Zustimmung zum Upload von Code und Bildern in das bestehende
Repository `https://github.com/MIBMCG/Vokabeltrainer` steht noch aus.

## Nachweisgrenzen und Anschluss

Schmale Desktop-Browseransichten ersetzen keine Prüfung auf physischen
Handys. Echte Zwei-Geräte-Nutzung, iPhone/iPad, Safari und Home-Bildschirm-App,
natürlicher Google-Tokenablauf und eine reale Kaufdauer unter zehn Sekunden
bleiben gesondert offen. Der Tabellen-Praxistest benötigt eine typische
Wortliste mit gewünschter Lektions-/Kinderzuordnung.

Entwurf, bestätigte Reihenfolge und Quellenhistorie stehen in der
[Avatar-Übergabe](../handoffs/2026-09-29-avatar-restpaket.md).
