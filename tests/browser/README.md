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

Ergebnisbilder entstehen unter `test-results/` und bleiben außerhalb von Git, sofern ein Abschlussbericht nicht ausdrücklich ausgewählte synthetische Ansichten unter `docs/reports/assets/` übernimmt. Die Testskripte verändern keine persönlichen Browserprofile und kennen kein echtes Google-Konto. Der Server liefert die Testdateien nicht aus; die Anwendung enthält keinen Simulationsmodus.

Ein bestandener Trainer- oder Probelauf ersetzt weder die echte Google-Prüfung des Produktformats noch die Abnahme auf zwei physischen Geräten, in Safari oder als Home-Bildschirm-App. Der aktuelle Ergebnisstand und diese Grenzen stehen im [v1-Abschlussbericht](../../docs/reports/2026-09-18-vokabeltrainer-v1.md).
