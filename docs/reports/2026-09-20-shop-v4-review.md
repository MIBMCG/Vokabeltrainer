# Unabhängige Review der Shop-Diagnose v4

Stand: 20.09.2026
Gegenstand: ausschließlich die Diagnoseerweiterung in `src/shop-probe/scenarios.js`, `src/shop-probe/main.js`, `shop-probe/index.html` sowie den zugehörigen Tests.

## Ergebnis

Keine P1- oder P2-Befunde.

Die Änderung bleibt auf die Fehlerlokalisierung begrenzt: Bei fehlgeschlagenen Prüfungen werden nur feste Prüfpunkte, auf 0–2 begrenzte Zähler und bekannte Antwortklassen ausgegeben. Rohfehler, Meldungstexte, Datei-IDs, ETags und Token werden nicht in den Bericht übernommen. Die HTTP-Transportlogik, die bedingten Schreibzugriffe und die Produktfreigabegrenze wurden nicht geändert.

Die neue Browserdarstellung gibt dieselbe begrenzte Struktur wieder. Der negative Lauf mit ignorierten Bedingungen bleibt fehlgeschlagen und weist für Initialisierung und Kaufkonkurrenz jeweils zwei angenommene Schreibzugriffe aus; daraus entsteht keine Produktfreigabe.

## Geprüfte Grenzen

- Diff der vier beauftragten Bereiche einschließlich neuer Tests
- Positiv- und Negativpfade für parallele Datei- und Ordnerschreibzugriffe
- Klassifikation unbekannter Fehler als `unexpected`
- Filterung manipulierter Fehlermeldungen und Datei-IDs
- unveränderte `productReady: false`-Grenze
- unveränderte `If-Match`-Prüfung im Browserharness
- saubere Diff-Formatprüfung

## Tatsächliche Prüfungen

- `npm run test:shop-probe`: 23/23 Node-Tests bestanden.
- `npm run test:shop-probe:browser`: 6/6 isolierte Browserprüfungen mit der dokumentierten lokalen Playwright-Laufzeit und System-Edge bestanden. Ein erster Sandboxlauf scheiterte ausschließlich am Prozessstart mit `spawn EPERM`; derselbe Lauf außerhalb dieser Prozessbeschränkung war vollständig grün.
- `git diff --check -- src/shop-probe/scenarios.js src/shop-probe/main.js shop-probe/index.html tests/shop-probe/`: ohne Befund.

## Aussagegrenze

Die Review bestätigt die Begrenzung und Leckfreiheit der zusätzlichen Diagnosedaten in den geprüften synthetischen Pfaden. Sie ersetzt weder den realen Google-Drive-Lauf noch eine Servergarantie für bedingte Schreibzugriffe.
