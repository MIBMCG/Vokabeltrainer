# Lesbare Hauptnavigation bei großer Schrift

Stand: 01.10.2026. Der Nutzer setzt nach kurzer Pause ausdrücklich fort.
Auf Basis `496f0c2e11759a486c353b1461cc895f52a41344` repariert Produktcommit
`fee42e9d3fe1688af2ca7bcfb6f519950d05c312` die verbliebene Wortzerlegung in
der unteren Hauptnavigation. Der vorherige Layoutabschluss bleibt erhalten.

## Fehler und Änderung

Bei 320 px und 200 Prozent Schrift hatte die Seite bereits keinen seitlichen
Überlauf, dennoch zerlegte das feste Dreispaltenraster „Inselreise“ und
„Avatar“ mitten im Wort. Die Zeichenmessung im Browser belegt jeweils zwei
unterschiedliche Zeilenhöhen. Der korrigierte Prüffall schlägt vor der
Produktänderung mit Exit 1 fehl. Der erste Testentwurf las die Zeichenpositionen
falsch aus; erst das korrigierte zweite RED-Protokoll ist ein Fehlernachweis.

Die vorhandenen drei Knöpfe wechseln nun bei Platzmangel in eine weitere
Zeile. Ihre Wörter, Schriftgrößen, Touchflächen und Auswahlmarkierung bleiben
erhalten. Der Seitenabstand unten erhöht sich von sechs auf acht rem plus
dem bestehenden Geräte-Randabstand. Bei 320/390 px mit 200 Prozent Schrift
ist die Navigation rund 202,4 px hoch; das Inhaltsende bleibt beim vollständigen
Scrollen je nach Ansicht 53,4 bis 54,1 px darüber. Normal passen die Knöpfe
weiterhin in eine Reihe. Es gibt keine Änderung an Produkt-JavaScript,
Beständen, Lernlogik, Kaufregeln, Abgleich oder Avatarbildern.

Cache v45 und der simulierte Testnachfolger v46 sind gemeinsam angepasst;
die verpflichtende Offline-Dateiliste bleibt vollständig und unverändert.

## Aktuelle Verifikation

Alle Browserfälle verwenden lokale synthetische Profile in Edge.
200 Prozent bedeutet eine Dokumentwurzel mit 32 px Schrift. Geprüft sind
320x568 und 390x844 normal/vergrößert, 640x360 vergrößert und 1280x900 normal.

- Neuer Navigationsfall: 1/1 PASS. Zeichen-Ranges jedes Wortes, alle drei
  Navigationsaktionen, genau eine aktuelle Auswahl, unveränderte Schriftgröße,
  Mindesthöhe 44 px, Seitenbreite und erreichbares Seitenende sind geprüft.
  Eine synthetische eingegebene Antwort bleibt nach Neuladen erhalten.
- Bestehende Kinderansichten: 1/1 PASS.
- Betroffene Cache-/Galerie-/Statusfälle nach Versionswechsel: 20/20 PASS.
- Abgelehnte Offlineinstallation und kontrolliertes Update: 2/2 PASS.
- Vollständige Node-Suite auf finalem Code: 662/662 PASS, Exit 0.
- Vorher-/Nachherbilder für 320/390 px und normale Desktopansicht visuell geprüft.

Die Browserbefehle nach Setzen der vorhandenen Playwright-/Edge-Pfade:

```powershell
node --test --experimental-test-isolation=none tests/browser/mobile-navigation.browser.mjs
node --test --experimental-test-isolation=none tests/browser/mobile-child-layout.browser.mjs
node --test --experimental-test-isolation=none tests/browser/status-feedback.browser.mjs tests/browser/evolution-art.browser.mjs
node --test --experimental-test-isolation=none --test-name-pattern='C2 rejected required precache|trainer offline update UI' tests/browser/trainer.browser.mjs
npm test
```

Genaues RED-Protokoll im erhaltenen Arbeitsbaum:
`test-results/mobile-navigation-red-2.log`. GREEN-Protokolle:
`mobile-navigation-green-1.log`, `mobile-child-layout-green.log`,
`navigation-cache-green.log`, `navigation-update-green.log`,
`mobile-navigation-node-final.log`, jeweils unter `test-results/`.
Viewportbilder liegen unter `test-results/mobile-navigation/`.
Aufgabenbrief, Bericht und unabhängige Prüfungen werden unter
`.superpowers/sdd/2026-10-01-bottom-navigation/` erhalten.

## Review, Bereitstellung und Grenzen

Das unabhängige Aufgabenreview bestätigt Anforderungsübereinstimmung und
Qualität ohne offene Befunde. Das gesamte Branchreview bewertet den geprüften
Bereich mit „Ready to merge: Yes“ und ohne Critical-/Important-/Minor-Befunde.
Die Prüfungen bestätigen den Code; die folgenden tatsächlichen Nachweise
bestätigen die private Bereitstellung separat.

Der Produktcommit ist per Fast-Forward in `codex/vokabeltrainer-v1`
integriert. 387 öffentliche Dateien sind vorbereitet, zwei geändert und
hochgeladen, 385 unverändert. Worker
`d86b43bd-6b39-4716-99af-1d3620580078` ist seit 01.10.2026,
16:18:46.988 UTC zu 100 Prozent aktiv. Um 16:20:13.331 UTC sind sieben
ausgelieferte Änderungs-/Integrationsdateien bytegleich mit dem geprüften
Paket bestätigt: Worker, CSS, HTML, main, shell, rewards und Konfiguration.
Für die Konfiguration gilt das vorbereitete Serverpaket.

Der erste Node-Dateivergleich scheiterte an der lokalen Zertifikatskette.
Die Wiederholung mit `node --use-system-ca` verwendet wie der bestehende
Upload den Windows-Zertifikatsspeicher und besteht mit Exit 0. Es wurden
keine Zertifikatsprüfungen abgeschaltet oder globalen Sicherheits-/Proxy-
einstellungen geändert.

Im vorhandenen Codex-Testbrowser wurde „Jetzt aktualisieren“ übernommen.
Die neue Navigation ist als flex und der neue Seitenabstand als 128 px bei
16 px Standardschrift sichtbar bestätigt. 40 verfügbare Punkte, 2.040
Lernpunkte, Level 11 und gewählte Drachenstufe 4 bleiben erhalten. Der
vorübergehende Google-Hinweis verschwindet ohne Anmeldung. Screenshot und
Provider-/Dateinachweise liegen lokal unter
`.superpowers/deployment-2026-10-01-mobile-navigation/`. Keine Einrichtung,
Bestandsimporte oder Käufe im vorhandenen Testbereich; Familienbestand
blieb unangetastet.

Beide GitHub-Zweige wurden exakt mit dem Produktcommit
`fee42e9d3fe1688af2ca7bcfb6f519950d05c312` verglichen. Der separate
Dokumentationsabschluss wird anschließend auf denselben Zweigen gesichert.

Nicht geprüft sind echte iPhone-/iPad-/Safari-Bedienung, native Vergrößerung,
Bildschirmtastatur und von null verschiedene Hardware-Randabstände. Die CSS-
Berücksichtigung dieser Ränder ist erhalten, aber kein physischer Nachweis.
Reale Google-Laufzeiten, natürlicher Tokenablauf und physische Zwei-Geräte-
Abnahme bleiben gesondert offen. Eine Excel-Datei ist zum Tabellenweg nicht
nötig; das kopierbare Beispiel steht in der [Anleitung](../BENUTZUNG.md).
