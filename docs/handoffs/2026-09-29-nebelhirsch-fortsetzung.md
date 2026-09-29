# Nebelhirsch-Fortsetzung

Stand: 29.09.2026. Entwicklungszweig: `codex/vokabeltrainer-v1`.

## Auftrag und bestätigter Entwurf

Der Nutzer hat die Pause nach Galerieabschluss ausdrücklich aufgehoben.
Zwischenzeitlich wurde laut Nutzer mit keinem anderen System am Projekt
gearbeitet. Hauptzweig und vorhandener isolierter Arbeitszweig waren beim
Einstieg sauber auf `c475a525079dd23987adb7696bdb9fc735678c7c`.

Als nächstes begrenztes Bildpaket entsteht die Nebelhirsch-Reihe
(`deer-mist`). Die Grundfigur existiert bereits und ist im getrennten
Testprofil vorhanden. Die konkreten vier Formen im
[Konzeptbogen v2](../design/avatar-evolution/deer-mist-stages-concept-v2.png)
sind vom Nutzer mit „Ja, genau so umsetzen“ für Einzelbilder und Einbindung
in die vorhandene Galerie bestätigt. Die [Erzeugungsnotiz](../design/avatar-evolution/deer-mist-stages-concept-v2.json)
enthält Prompt, Referenzrolle und Bestätigung.

1. Vorhandene silberweiße Grundform mit türkisen Geweihspitzen.
2. Waldhüter mit Blattmantel, Brustspange und ersten leuchtenden Markierungen.
3. Waldwächter mit Kristallgeweih, stärkerer Mähne und passender Blattrüstung.
4. Mythischer Waldgeist mit breiter gold-türkiser Blattkrone, fließender
   Nebelmähne und deutlich veränderter Silhouette.

Diese Beschreibungen sind keine neuen Produktnamen. Preise, Besitz und
bewusste Auswahl folgen den bereits bestätigten EV01–EV05.
Die ursprüngliche Grundillustration wird pixelgleich als Stufe 1 wiederverwendet.
Die erste Konzeptfassung berührte oben den Bildrand; v2 ergänzt den nötigen
Rand. Ein Konzeptbogen zählt noch nicht als vier ausgelieferte Bildmotive.

## Umsetzung und lokale Prüfung

Drei freigestellte höhere Formen wurden mit der eingebauten Bildgenerierung
erstellt und zusammen mit der unverändert übernommenen Grundform ausgewählt.
Die vorhandene Bildpipeline enthält die zweite Figurenreihe:
256/512/768 Pixel, kleine Offlinebilder, größere Varianten bei Bedarf.
Die zwölf Drachen-WebPs sind gegenüber dem Ausgangsstand bytegleich.
Kauf-, Konto-, Anmeldelogik und der gemeinsame Bildrenderer wurden nicht geändert.

Die vier Nebelhirsch-Quellen benötigen 6.985.192 Bytes. Die zwölf WebPs
benötigen zusammen 1.341.652 Bytes; davon entfallen nur 143.854 Bytes auf
die vier verpflichtenden Offlinebilder. Größen und Prüfsummen stehen im
[Buildbericht](../../trainer/assets/avatar-evolution/build-report.json).
Quellen und Prompts sind im [Quellenverzeichnis](../design/avatar-evolution-sources/README.md) dokumentiert.

| Prüfung am 29.09.2026 | Ergebnis |
| --- | --- |
| Gezielte Bild-, Kaufansicht-, Cache- und Auslieferungstests | 25/25 PASS |
| Vollständige Node-Suite | 646/646 PASS, 334.582 ms |
| Galerie: responsive Bilder, Offlinefallback, Auswahl, Desktop/Mobil | 2/2 PASS |
| Kontrolliertes Update, fehlgeschlagener Pflichtcache, Rücknahme alter Updatehinweise | 3/3 PASS |
| Unabhängige Bildprüfung | PASS, keine wesentlichen Befunde |
| Unabhängige Spec-/Codeprüfung einschließlich Manifest, Auslieferung und Drachenvergleich | PASS |

Die neuen Bildtests waren vor der Einbindung wegen fehlender Nebelhirsch-
Einträge rot; die Auslieferungsprüfung scheiterte passend mit 404.
Nach Umsetzung bestanden die Prüfungen. Desktop mit 1280 Pixeln und mobile
Ansicht mit 390 Pixeln zeigen alle vier Formen vollständig ohne horizontalen
Überlauf. Der vorhandene Bildstil verwendet `object-fit: contain`.
Einige Quellen haben weniger Rand als im Erzeugungsprompt gewünscht, aber
keine sichtbar abgeschnittenen Geweihe, Hufe oder Schweife.
Die persönliche Nutzerfreigabe betrifft Konzept v2; die Produktionsprüfung
ist davon getrennt. Die Tests verwenden synthetische Daten.

Ausgeführt:

```sh
npm test
node --test --experimental-test-isolation=none tests/trainer/evolution-art.test.js tests/trainer/purchases-view.test.js tests/trainer/sw.test.js tests/serve.test.js
node --test --experimental-test-isolation=none tests/browser/evolution-art.browser.mjs
node --test --experimental-test-isolation=none --test-name-pattern="C2 rejected required precache|trainer offline update UI|update notice follows" tests/browser/trainer.browser.mjs tests/browser/status-feedback.browser.mjs
node scripts/check-docs.mjs
git diff --check
```

Die Browserbefehle nutzten eine vorhandene Playwright-Installation über
`PLAYWRIGHT_MODULE` und lokales Edge über `BROWSER_EXECUTABLE`, jeweils mit
isolierten synthetischen Browserprofilen. Die Vollsuite lief unter Windows
über `npm.cmd test`.

Die Bildintegration ist für Cache v34 vorbereitet. Produktstand beim
Einstieg war `64539ff`, privat Cache v33. Tatsächliche neue Bereitstellung
und Browserbeobachtung werden im nächsten Abschlussschritt ergänzt.

## Erhaltene Grenzen

Den bestehenden Testbereich nicht neu einrichten oder importieren.
Zuletzt beobachtet: 40 verfügbare Testpunkte, 2.040 Lernpunkte, Level 11,
alle vier Drachenformen im Besitz und Drachenstufe 4 ausgewählt.
Familien-Chrome, echte Lernprofile und bestehende Drive-Bestände erhalten.
Kein weiterer echter Kauf ist für die Bildintegration erforderlich.

Natürliche Google-Token-Erneuerung, physisches Zweitgerät, iPhone/iPad,
Safari und Home-Bildschirm-App bleiben offen. Das Kauf-Wunschziel unter
zehn Sekunden ist noch nicht erreicht; ein beobachteter Durchgang lag bei
rund 17,1 Sekunden. Weitere Figuren folgen nach diesem Paket.

## Nächster Schritt

Den geprüften Umfang privat bereitstellen und im bestehenden Testbrowser
die neue Galerie kontrollieren. Anschließend GitHub und diese Übergabe abgleichen.
