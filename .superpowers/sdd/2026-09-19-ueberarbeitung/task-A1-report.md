# Task A1 report — Rasterwelt und responsiver Avatar

Status: umgesetzt und lokal verifiziert am 19.09.2026.

## Ergebnis

- Die getrennten Vektorinseln und der einfache Formen-Avatar wurden durch echte Rasterillustrationen ersetzt.
- Der endliche Bildsatz enthält Strand, durchgehende Reise, vier vollständig bekleidete Hautvarianten, sechs Kleidungsüberlagerungen sowie sechs Ausrüstungsebenen. Die bestehenden IDs `cap`, `sunhat`, `mountainhat`, `backpack`, `binoculars` und `compass` bleiben unverändert.
- `picture()` und `avatarPicture()` liefern responsive Bilder mit einem 256-/480-Pixel-Fallback. Jeder Bildwrapper trägt `data-art-key`; der Fehlerpfad entfernt `srcset`, bevor er den Fallback setzt.
- Alle Avatarebenen werden mit derselben Transformation auf eine 1086 × 1448-Pixel-Leinwand gesetzt. Die Reihenfolge ist Schatten, Rückenzubehör, bekleidete Basis, Kleidung, Kopfbedeckung und Handzubehör.
- Die Reise verwendet eine zusammenhängende gemalte Karte mit 15 DOM-Etappen und drei DOM-Inselbezeichnungen. Auf kleinen Ansichten scrollt nur der Kartenbereich; Überschrift, Fortschritt und Abzeichen bleiben innerhalb des Fensters.
- Der Worker hält alle 18 kleinen Grundbilder offline vor. Die 36 größeren Varianten werden nur bei Anfrage im eigenen Cache abgelegt. Ein fehlgeschlagener großer Download blockiert weder Installation noch Grundansicht.

## Bildquellen und Renditions

Die 18 PNG-Originale liegen in `docs/design/art-sources/`. Sie wurden mit dem eingebauten Bildwerkzeug anhand von `docs/design/2026-09-17-insel-konzept.png` erzeugt. Prompts, Maße und Zuordnung stehen in `docs/design/art-sources/prompts.md`; vollständige SHA-256-Werte und der visuelle Vergleich in `docs/reports/2026-09-19-illustrationen.md`. Es wurden keine externen Bildquellen verwendet.

Der Build wurde mit dem vorhandenen, nur lesend genutzten Playwright-Runtime und lokalem Edge ausgeführt:

```text
$env:PLAYWRIGHT_MODULE='.../browser-runtime/node_modules/playwright/index.mjs'
$env:BROWSER_EXECUTABLE='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
node scripts/build-art.mjs
Built 18 art assets with 54 renditions.
```

Die 54 WebP-Dateien belegen zusammen 2.578.384 Byte. Das initiale Offlinepaket aus 18 kleinen Varianten belegt 328.922 Byte und bleibt deutlich unter der Grenze von 5 MiB. Die Reisequelle ist 1086 Pixel breit; daher endet ihre Variantenliste ohne Hochskalierung bei 1086 statt 1440 Pixeln.

## RED/GREEN und Prüfungen

Vor der Produktänderung wurden Manifest-, Server- und Worker-Erwartungen ergänzt:

```text
node --test --experimental-test-isolation=none tests/trainer/art.test.js tests/serve.test.js tests/trainer/sw.test.js
RED: art-manifest.js fehlte; WebP lieferte 404; die Worker-Precacheliste enthielt die Grundbilder nicht.
```

Der erste Versuch, große Bilder schon vor der Workerinstallation mit Playwright-Routing zu blockieren, verhinderte in dieser Testumgebung die Cacheinstallation selbst. Das war eine Testaufbaukorrektur, kein Produktfehler. Der endgültige Browserfall wartet auf die echte Installation, weist alle 18 Fallbacks in Cache Storage nach, blockiert anschließend große Bildantworten mit 503 und schaltet erst danach Server und Netzwerk ab.

Beim abschließenden Difflesen zeigte eine verschärfte Workerprüfung anschließend, dass die Installation zunächst versehentlich alle 54 statt nur 18 Bildvarianten an `cache.addAll` übergab (`54 !== 18`). Die Installation verwendet nun ausschließlich `PRECACHE_URLS`; der betroffene Worker- und Offline-Browserfall lief danach erneut grün.

Ausgeführte erfolgreiche Prüfungen:

```text
node --test --experimental-test-isolation=none tests/trainer/art.test.js tests/serve.test.js tests/trainer/sw.test.js tests/trainer/reward-view.test.js tests/trainer/practice.test.js
23 Tests, 23 bestanden

node --test --test-reporter spec tests/browser/overhaul.browser.mjs
2 Tests, 2 bestanden, 0 fehlgeschlagen

node --test --test-reporter spec --test-name-pattern='trainer offline update UI blocks typing' tests/browser/trainer.browser.mjs
1 Test, 1 bestanden, 0 fehlgeschlagen

node --test --experimental-test-isolation=none tests/trainer/sw.test.js
9 Tests, 9 bestanden, 0 fehlgeschlagen (nach gezieltem RED 54 !== 18; einschließlich Cacheablage einer angeforderten Großvariante)

node --test --test-reporter spec --test-name-pattern='precache keeps unseen avatar fallbacks' tests/browser/overhaul.browser.mjs
1 Test, 1 bestanden, 0 fehlgeschlagen (nach Precache-Korrektur)

npm test
Erster Gesamtlauf: 279 Tests, 279 bestanden, 0 fehlgeschlagen
Aktueller Gesamtlauf nach zusätzlicher On-Demand-Cacheprüfung: 280 Tests, 280 bestanden, 0 fehlgeschlagen
```

Der Browsertest erfasst echte Appansichten bei 390 und 1024 Pixeln, prüft 15 Etappen und drei Inselzonen, rendert sechs gemischte Avatar-Kombinationen mit jeweils allen fünf Ebenen und lädt eine zuvor ungesehene Kombination nach abgeschaltetem Server offline. Der explizit blockierte große Download fällt auf die bereits vorgehaltene kleine Variante zurück.

## Sichtnachweise

- `docs/reports/assets/2026-09-19-a1-start-mobile.png`
- `docs/reports/assets/2026-09-19-a1-journey-mobile.png`
- `docs/reports/assets/2026-09-19-a1-journey-desktop.png`
- `docs/reports/assets/2026-09-19-a1-avatar-mobile.png`
- `docs/reports/assets/2026-09-19-a1-avatar-desktop.png`
- `docs/reports/assets/2026-09-19-a1-avatar-composite-diagnostic.png`

Die Diagnoseaufnahme zeigt sechs bewusst testweise eingefügte Figuren und ist keine Produktansicht. Die übrigen Avataraufnahmen enthalten nur die echte Vorschau. Die mobile Vollseitenaufnahme wird von der fixierten Navigation durchschnitten; dies ist eine Eigenschaft der synthetischen Vollseitenaufnahme, während die reale Ansicht normal scrollt.

## Dateien

Neu sind die Bildquellen und -renditions, `scripts/build-art.mjs`, `src/trainer/ui/art.js`, das generierte `art-manifest.js`, der Bildbericht, die Sichtnachweise sowie die A1-Unit- und Browsertests. Angepasst wurden `practice.js`, `rewards.js`, `trainer/styles.css`, `trainer/sw.js`, der begrenzte lokale Server und die betroffenen Worker-/Server-/Browserprüfungen.

## Grenzen

Die Sichtprüfung lief mit synthetischen Daten in Edge/Chromium. Sie ersetzt keine Abnahme auf einem echten iPhone oder iPad. Es wurden keine persönliche Browsersitzung, Google-Daten, Cloudänderung oder Veröffentlichung verwendet.
