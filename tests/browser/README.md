# Browserprüfungen mit synthetischem Google-Zugriff

Die Browserprüfungen bedienen die echte Oberfläche, IndexedDB und Service Worker. Nur Google Identity Services und die Drive-HTTP-Antworten werden ersetzt. Getrennte Browserkontexte simulieren Geräte, sind aber kein Nachweis für echtes Google, Safari, iPhone oder iPad.

`npm test` benötigt keine Zusatzpakete. Für die Browserprüfungen wird Playwright 1.62.1 als Entwicklungswerkzeug verwendet. Es bleibt außerhalb der Produktionsabhängigkeiten:

```sh
npm install --no-save --package-lock=false playwright@1.62.1
npx playwright install chromium
```

## Vollständiger Trainer

Der Trainerlauf startet einen eigenen lokalen Server auf einem freien Port und beendet ihn anschließend wieder. `npm start` ist dafür nicht nötig:

```sh
node --test tests/browser/trainer.browser.mjs
```

Playwright wird standardmäßig aus dem Projekt importiert und startet sein installiertes Chromium. `PLAYWRIGHT_MODULE` kann ein vorhandenes Playwright-Modul angeben; `BROWSER_EXECUTABLE` kann einen vorhandenen Chromium-/Edge-Browser wählen. Diese Variablen sind optionale Anpassungen für Entwicklungsrechner.

Der Lauf prüft unter anderem Einrichtung, Üben und Fortsetzen, Inselreise und Avatar, Erwachsenenbereich, Abgleich, Konflikte, Sicherung/Wiederherstellung, isolierten Offline-Start unter `/trainer/` und einem Repository-Unterpfad sowie einen kontrollierten Service-Worker-Wechsel. Seine eigenen persistenten Testprofile liegen ausschließlich unter `test-results/` und werden wieder entfernt. Ein laufender persönlicher Server auf Port 4173 wird nicht verwendet, beendet oder umgeschaltet.

Die Abschlussprüfung der Überarbeitung verteilt ihre Browserfälle auf `trainer.browser.mjs` und `overhaul.browser.mjs`. Sie verwendet echte isolierte IndexedDB-Zustände und getrennte Browserkontexte für simulierte Geräte. Das Harness kann außerdem je Kontext einen tatsächlichen `deviceScaleFactor` setzen und genau einen angeforderten Pflicht-Precache-Download fehlschlagen lassen. Damit werden hochauflösende Darstellung und ein fehlgeschlagener Workerwechsel geprüft, ohne Testschalter in die Anwendung einzubauen.

```sh
node --test tests/browser/trainer.browser.mjs
node --test tests/browser/overhaul.browser.mjs
```

Normale Läufe schreiben die 13 C2-Ansichten ausschließlich nach `test-results/overhaul-c2/`; dieser Ordner ist ignoriert und verändert den Checkout nicht. Die bewusst ausgewählten und geprüften Nachweise liegen versioniert unter [`docs/design/2026-09-19-ueberarbeitung-app/`](../../docs/design/2026-09-19-ueberarbeitung-app/). Nur für eine neue Veröffentlichung werden die gewünschten Laufzeitbilder nach Sichtprüfung ausdrücklich in diesen Dokumentationsordner übernommen. Die Matrix umfasst 1280×900, 390×844, 320×568 und 844×390, eine Schriftgröße von 200 Prozent sowie einen getrennten DPR-2-Kontext. Die Browserfälle prüfen dabei auch alle vier Hauttöne, sechs Kleidungsfarben und sechs sichtbaren Ausrüstungsoptionen samt verständlicher Sperren.

## Technische Google-Drive-Probe

Die ältere Probe bleibt separat erhalten. Dafür in einem Terminal den lokalen Server starten:

```sh
npm start
```

In einem zweiten Terminal im selben Checkout:

```sh
node tests/browser/probe.browser.mjs
```

Der Standard ist `http://localhost:4173`. `PROBE_BASE_URL` kann einen anderen lokalen Testserver angeben; entfernte Website-Adressen werden abgewiesen. `PLAYWRIGHT_MODULE` und `BROWSER_EXECUTABLE` haben dieselbe optionale Bedeutung wie beim Trainerlauf.

Die Probe prüft Erstellen/Beitreten, einmalige Wertung, Offline-Neuladen, verlorene Uploadantwort, Rücksetzung mit verspäteten Antworten, Kontobindung, Schutz gegen parallele Tabs sowie die Trennung von Tokens und Programmcache.

## Ergebnisgrenzen

Zwischenergebnisbilder entstehen unter `test-results/` und bleiben außerhalb von Git. Die oben verlinkten finalen C2-Bilder sind ausdrücklich ausgewählte synthetische Ansichten. Die Testskripte verändern keine persönlichen Browserprofile und kennen kein echtes Google-Konto. Der Server liefert weder Testdateien noch die C2-Bildnachweise aus; die Anwendung enthält keinen Simulationsmodus.

Ein bestandener Trainer- oder Probelauf ersetzt weder die echte Google-Prüfung des Produktformats noch die Abnahme auf zwei physischen Geräten, in Safari oder als Home-Bildschirm-App. Der aktuelle Ergebnisstand und diese Grenzen stehen im [Abschlussbericht zur Überarbeitung](../../docs/reports/2026-09-19-ueberarbeitung.md); der [v1-Abschlussbericht](../../docs/reports/2026-09-18-vokabeltrainer-v1.md) bleibt der historische Ausgangsstand.
