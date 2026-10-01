# Verständlicher Level-Fortschritt

Stand: 01.10.2026. Der Nutzer meldet die Kombination aus Level 12,
2.260 Punkten, einem zu 30 Prozent gefüllten Balken und 140 fehlenden
Punkten als verwirrend. Der kurze Anzeigeentwurf ist mit „ja“ bestätigt.
Produktcommit: `1049550ed6f455ac07dd01e17afafa79bf2211a1`.

## Ursache und Änderung

Die Rechnung war korrekt: Level 12 beginnt bei 2.200 Lernpunkten,
Level 13 bei 2.400. Der Balken zeigte die 60 bereits gesammelten Punkte
innerhalb dieser 200-Punkte-Spanne. Die Gesamtzahl war jedoch nur mit
„Punkte“ beschriftet und die Bezugsgröße des Balkens blieb unsichtbar.

Die gemeinsame Levelkarte auf Übungsstart und Inselreise zeigt nun:

- „2.260 Lernpunkte insgesamt“ neben Level 12;
- „Zum nächsten Level: 60 von 200 Punkten“ über dem Balken;
- „Noch 140 Punkte bis Level 13“ unter dem Balken.

Der Screenreader erhält Fortschritt und Restpunkte als Wertbeschreibung.
Nach Abschluss der Inselreise bleibt der weitere Level-Fortschritt sichtbar;
der Reiseabschluss wird zusätzlich angezeigt. Punktvergabe, Levelschwellen,
Guthaben, Besitz, Abgleich und Bestandsformat ändern sich nicht.

Die erste Bildprüfung und das unabhängige Review entdeckten Wortfragmente
bei 320 px mit 200 Prozent Schrift. Ein gezielter Test reproduziert diesen
Befund. Die Levelkarte stellt bei wenig Platz die Texte unter die Figur
über die gesamte Kartenbreite; ihr seitlicher Innenabstand passt sich an.
Die Nachprüfung misst Zeichenpositionen innerhalb jedes Wortes und bestätigt
vollständige Wörter statt nur fehlenden Seitenüberlauf.

## Verifikation

- Unveränderter Ausgangsstand: 662/662 Node-Tests PASS.
- Neuer Darstellungstest: vor Änderung RED wegen fehlender eindeutiger
  Beschriftung; nach Änderung GREEN. Punktefälle 0, 2.260, 2.390, 2.400,
  3.000 und 3.060; Balkenwert, Breite, Restpunkte und Reiseabschluss geprüft.
- Verfeinerter Wortumbruchtest: RED vor CSS-Korrektur, danach GREEN;
  320/390/1280 px jeweils mit 16/32 px Wurzelschrift im App-Container.
- Betroffene Browser-/Galerie-/Statusfälle: 22/22 PASS.
- Finale Darstellung, Kinderansichten und Navigation nach CSS-Korrektur:
  3/3 PASS. Bilder visuell geprüft.
- Finale Offlineinstallation und kontrollierter Updatepfad: 2/2 PASS.
- Vollständige Node-Suite nach JavaScript-/Cachekorrektur: 662/662 PASS;
  danach nur reines CSS und der Browserprüffall angepasst.
- Unabhängiges Review: erster P2-Wortumbruchbefund korrigiert;
  Abschlussnachprüfung „Ready to integrate: Yes“, keine offenen Befunde.

Browserbefehle nach Setzen der vorhandenen Playwright-/Edge-Pfade:

```powershell
node --test --experimental-test-isolation=none tests/browser/level-progress.browser.mjs tests/browser/mobile-child-layout.browser.mjs tests/browser/status-feedback.browser.mjs tests/browser/evolution-art.browser.mjs
node --test --experimental-test-isolation=none tests/browser/level-progress.browser.mjs tests/browser/mobile-child-layout.browser.mjs tests/browser/mobile-navigation.browser.mjs
node --test --experimental-test-isolation=none --test-name-pattern='C2 rejected required precache|trainer offline update UI' tests/browser/trainer.browser.mjs
npm test
```

Prüflogs liegen im erhaltenen isolierten Arbeitsbaum unter
`.superpowers/level-clarity-*.log`, Bilder unter `test-results/level-progress/`.
Cache v46 und simulierter Testnachfolger v47 sind konsistent angepasst.

## Private Bereitstellung und Erhalt

387 öffentliche Dateien vorbereitet, drei geänderte Dateien hochgeladen:
Levelrenderer, CSS und Service Worker. Worker-Version
`5667b42d-6cda-4ed8-9189-71a511a09d15` ist seit 01.10.2026,
18:44:52.842 UTC zu 100 Prozent aktiv. Sieben ausgelieferte Änderungs- und
Integrationsdateien sind um 18:46:10.781 UTC bytegleich mit dem geprüften
Serverpaket bestätigt. Der geschützte vorhandene Upload-Zugang wurde verwendet.

Vor „Jetzt aktualisieren“ zeigt der bestehende Testbereich 450 verfügbare
Punkte, 2.450 Lernpunkte, Level 13 und Drachenstufe 4. Nach kontrollierter
Aktualisierung sind diese Werte erhalten. Die Karte zeigt 50 von 200 Punkten
und 150 bis Level 14. Die Übungsauswahl zeigt vor und nach Update dieselben
Wortzahlen. Keine Einrichtung, Importe oder Käufe für die Prüfung ausgeführt.
Ein anfänglich sichtbarer Google-Hinweis verschwindet ohne neue Anmeldung;
dies ist keine Abnahme des natürlichen Tokenablaufs.

Provider-/Dateinachweise und Screenshot liegen lokal unter
`.superpowers/deployment-2026-10-01-level-progress/`. Beide Entwicklungszweige
werden mit diesem Dokumentationsabschluss gesichert; den aktuellen lokalen
und entfernten SHA vor weiterer Arbeit frisch vergleichen.

Echte iPhone-/iPad-/Safari-Bedienung, native Vergrößerung, Google-Zeiten und
physischer Zwei-Geräte-Abgleich bleiben offene Nachweise.
