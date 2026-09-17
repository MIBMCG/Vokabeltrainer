# Browserprüfung mit synthetischem Google-Zugriff

Die Tests bedienen die echte Probeoberfläche mit IndexedDB und Service Worker. Nur Google Identity Services und die Drive-HTTP-Antworten werden ersetzt. Zwei getrennte Browserkontexte vertreten zwei Geräte. Das ist kein Nachweis für echtes Google, Safari oder iOS.

`npm test` benötigt keine Zusatzpakete. Für diese zusätzliche Browserprüfung wurde Playwright 1.62.1 verwendet. Wer es noch nicht lokal verfügbar hat, kann die Entwicklungswerkzeuge ohne Änderung der Projektabhängigkeiten installieren:

```sh
npm install --no-save --package-lock=false playwright@1.62.1
npx playwright install chromium
```

In einem Terminal den Server starten:

```sh
npm start
```

In einem zweiten Terminal im selben Checkout:

```sh
node tests/browser/probe.browser.mjs
```

Der Standard ist `http://localhost:4173`. `PROBE_BASE_URL` kann einen anderen lokalen Testserver angeben; entfernte Website-Adressen werden abgewiesen. `BROWSER_EXECUTABLE` kann auf einen vorhandenen Chromium-/Edge-Browser zeigen. `PLAYWRIGHT_MODULE` kann ein bereits installiertes Playwright-Modul außerhalb des Projekts bezeichnen. Diese Variablen sind optionale Anpassungen an die lokale Entwicklungsumgebung.

Ergebnisbilder entstehen unter `test-results/` und bleiben außerhalb von Git. Alle Browserkontexte werden nach dem Test geschlossen. Das Testskript verändert keine persönlichen Browserprofile und kennt kein echtes Google-Konto. Der lokale Server liefert diese Testdateien nicht aus; die Live-Anwendung hat keinen eingebauten Simulationsmodus.

Die Szenarien prüfen Erstellen/Beitreten, einmalige Wertung, Offline-Neuladen, verlorene Uploadantwort, Rücksetzung mit verspäteten Antworten, Kontobindung, Schutz gegen parallele Tabs sowie die Trennung von Tokens und Programmcache. Der zusätzliche Cachetest muss auch fremde App-Caches auf demselben Ursprung erhalten. Den aktuellen Ergebnisstand dokumentiert der Prüfbericht; ein vorhandenes Skript allein bedeutet keinen bestandenen Test.
