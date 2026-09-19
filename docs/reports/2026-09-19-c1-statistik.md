# C1: Nachvollziehbare Lernstatistik

Stand: 19.09.2026. Umsetzung GPT-5.6 Sol / high. Basis `d30f11c16bc22630efe72329d0d04e91ccd0b80a`, Produktcommit `9457cedad31bab7e96410e87ffa20958f23c9bb2`. Die [unabhängige Review](2026-09-19-c1-review.md) durch einen separaten GPT-5.6 Sol / high ist ohne Befunde abgeschlossen: C1 ist freigegeben.

## Umsetzung

Die neue reine Statistikprojektion verwendet die gemeinsamen effektiven Antworten, Wortauswahl und Wiederholungsplanung. Antwortslots zählen genau einmal, der gespeicherte Lerntag bestimmt den Tagesbalken. 14 oder 30 Tage werden einschließlich Nulltagen dargestellt. Historische Antworten archivierter oder nicht mehr zugeordneter Wörter bleiben im gewählten Zeitraum enthalten; die vier getrennten Wortgruppen beziehen sich dagegen auf den aktuellen Bestand. Die Oberfläche erklärt diese Unterscheidung. Bei einem Epochenkonflikt erscheinen keine scheinbar gültigen Kennzahlen.

Kindwahl, Antworten, richtige Antworten, Trefferquote, beschrifteter Ring und gestapelte Tagesbalken ergänzen die Tabellen. Ohne Antworten bleibt die Quote leer statt irreführend 100 Prozent. Die aufklappbaren Wortdetails erhalten Versuche, richtig/falsch und letzte Übung; aktuelle Serie, Fälligkeit und Ausschlussstatus stammen aus derselben Wiederholungsplanung wie die nächste neue Runde. Ausgenommene Wörter bleiben einzeln sichtbar. Regelentwürfe werden beim Statistikwechsel erhalten; die Ansicht schreibt keine Lernereignisse.

Produktcache v18 / synthetischer Updateworker v19. Beide neuen Module sind in Serverroute und Offlinepaket enthalten.

## Tatsächliche Prüfungen

Die Browserfälle liefen mit isolierten synthetischen Daten, simuliertem Google-Zugang und freien Ports. Lokale Runtime-Overrides werden entsprechend der [Browseranleitung](../../tests/browser/README.md) gesetzt; unten stehen die tatsächlich ausgeführten Prüfkommandos ohne die lokalen Pfade und zusammengefasste Exitcode-Behandlung.

```sh
node --test --experimental-test-isolation=none tests/trainer/statistics.test.js
node --test --experimental-test-isolation=none --test-name-pattern='learning statistics stay per child' tests/browser/overhaul.browser.mjs
node --test --experimental-test-isolation=none --test-name-pattern='compact vocabulary management|learning rules stay separate|excluded current word generations|learning statistics stay per child' tests/browser/overhaul.browser.mjs
node --test --experimental-test-isolation=none --test-name-pattern='trainer setup, adult decisions|trainer offline update UI' tests/browser/trainer.browser.mjs
node --test --experimental-test-isolation=none tests/trainer/statistics.test.js tests/serve.test.js tests/trainer/sw.test.js
npm test
npm run check:docs
git diff --check
git diff --cached --check
```

| Prüfung | Ergebnis |
| --- | --- |
| Neue Statistikfälle | zuerst fehlendes Modul (RED), anschließend 4/4 bestanden |
| Betroffene C1-/Verwaltungs-/Regel-Browserfälle | 4/4 bestanden |
| Bestehende Erwachsenen-/Update-Browserfälle | 2/2 bestanden |
| Statistik, Server und Worker | 19/19 bestanden |
| Vollständige Node-Suite | 343/343 bestanden |
| Dokumentprüfung vor Produktcommit | 327 Dateien, 100 Markdown-Dateien, 442 lokale Links, keine Fehler |
| Git-Prüfungen | keine Ausgabe/Fehler |

Abgedeckt sind Tagesgrenzen und ein vom UTC-Datum abweichender Lerntag, Profil-/Zeitraumfilter, Deduplizierung, archivierte Historie, neue Lernfassung, Support und alte Ereignisse, vier disjunkte Gruppen, Regeländerung, Reaktivierung, gemeinsame Verfügbarkeitszahl und Epochenkonflikt. Der erste Browserlauf scheiterte an der fehlenden Modulroute; ein Sandbox-Startfehler wird ausdrücklich nicht als Produkt-RED gewertet.

## Echte Ansichten und korrigierter Sichtbefund

Die erste Aufnahme öffnete das Tagesdiagramm bei den ältesten Tagen. Dadurch lagen die vorhandenen Antworten außerhalb des sichtbaren Ausschnitts. Jetzt sind die neuesten Tage initial sichtbar, mit einer Erklärung zur seitlichen Bewegung. Der Browserfall prüft die Ausgangsposition und den jüngsten Balken mit einer richtigen und einer falschen Antwort.

Die danach frisch erzeugten [Mobilansicht 390 × 844](assets/2026-09-19-c1-statistics-390.png) und [Desktopansicht 1280 × 900](assets/2026-09-19-c1-statistics-1280.png) wurden vom Implementierer und Controller tatsächlich geöffnet. Kennzahlen, Legende, jüngster Balken und aufgeklappte Wortdetails sind sichtbar. Die Gesamtseite läuft mobil nicht horizontal über; breite Tabellen und ältere Tage besitzen eigene Scrollbereiche.

Der bekannte Offline-Diagnosefall aus B3 bleibt für C2 offen. C1 behauptet weder eine vollständige neue Browserregression noch reale Google-/iOS-Abnahme. Persönliche Browserdaten und der Server auf Port 4173 wurden nicht verwendet.
