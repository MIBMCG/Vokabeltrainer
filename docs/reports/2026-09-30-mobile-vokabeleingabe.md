# Handybedienung und große Schrift bei der Vokabeleingabe

Stand: 30.09.2026. Nach Abschluss des schnelleren Wortlisten-Abgleichs setzt
der Nutzer die Arbeit fort. Haupt- und Arbeitszweig sind zu Beginn sauber auf
`27c22f55740a4e0caebe594b44f4a9d9fb10db34`, ebenso beide GitHub-Zweige.
Produkt `a530357`, Cache v42, ist der Ausgang dieser Prüfung.

## Begrenzter Prüfauftrag und Aufbau

Der nächste Praxischeck braucht noch eine typische echte Excel-Wortliste mit
gewünschter Lektions-/Kinderzuordnung. Währenddessen wird der vorhandene
Tabellenweg unabhängig mit synthetischen Daten auf wenig Bildschirmplatz,
lange Namen und vergrößerte Schrift untersucht. Kein Familienbestand und
kein bestehender Codex-Testbereich wird eingerichtet oder verändert.

Die lokale Edge-/Playwright-Fixture verwendet ein neues Testprofil mit zwei
Ausgangswörtern und eine Tabelle mit einem identischen Wort, einer fehlenden
englischen Übersetzung und zwei weiteren Wörtern. Der Ablauf umfasst:
identisches Wort bewusst überspringen, fehlende Übersetzung ergänzen, neue
Lektion mit langem Namen anlegen, einem Testkind zuordnen, gemeinsam speichern
und nach Reload fünf Wortereignisse einschließlich der zwei Ausgangswörter
nachweisen. Die Übernahme-Schaltfläche wird nach normalem Scrollen auf freie
Erreichbarkeit geprüft.

| Ansicht | Schrift | Ergebnis |
| --- | --- | --- |
| 320 × 568 CSS-Pixel | 16 px | Kein horizontaler Überlauf; Korrektur, Zuordnung, Speicherung und Reload erfolgreich |
| 320 × 360 CSS-Pixel | 16 px | Ebenfalls erfolgreich bei wenig sichtbarer Höhe |
| 390 × 844 CSS-Pixel | 32 px | Speicherung erfolgreich, aber Seite 463 px breit und seitlich verschoben |

Die dritte Variante setzt die Wurzelschrift auf 200 Prozent. Das ist eine
Schriftgrößenprüfung im Desktopbrowser, keine echte mobile Bildschirmtastatur,
Touch-, Safari- oder Betriebssystem-Zoomprüfung. Die geringere Höhe modelliert
nur wenig sichtbare Fläche und ersetzt ebenfalls keinen Tastaturtest.

## Reproduzierter Befund und Ursache

Der Überlauf besteht bereits vor Öffnen des Imports im Erwachsenenbereich.
Trotz 326 px verfügbarer Innenbreite werden Kopf, Navigation und Inhalt rund
400,47 px breit. Navigationstexte wie „Einstellungen“ vergrößern den Überlauf
weiter. Beim Scrollen zum Eingabefeld entsteht auch eine horizontale
Verschiebung von 32 px.

Die Kombination impliziter Rasterspalten, automatischer Mindestbreiten von
Raster-/Formularkindern und ungetrennter Navigationstexte erzeugt diese
inhaltliche Mindestbreite. Eine ausschließlich im lokalen Test geladene
CSS-Variante mit schrumpfbaren Rasterspalten, gezielten Mindestbreiten und
Textumbruch beseitigt den Überlauf: 390 px Seitenbreite und keine Elemente
außerhalb der Ansicht vor Import, bei Pflichtfeld-/Duplikatkorrekturen und bei
neuer Lektion. Der gleiche Speichervorgang bleibt erfolgreich.

Ein erster Diagnoseversuch mit einem eingefügten Inline-Stylesheet wurde von
der bestehenden Content Security Policy abgewiesen. Die nachfolgende Probe
lief über eine ersetzte lokale Stylesheet-Testantwort; die Sicherheitsrichtlinie
blieb unverändert. Es wurde keine Produktionsdatei für diese Probe geändert.

Lokale Messhilfe und Rohdaten liegen unter
`.superpowers/diagnostics/2026-09-30-mobile-import.mjs` beziehungsweise
`.superpowers/diagnostics/mobile-import/`. Der begrenzte Reparaturauftrag liegt
unter `.superpowers/sdd/2026-09-30-mobile-import-layout/`: bestehendes Layout
korrigieren, ohne Eingabe-/Speicherlogik, Synchronisation oder Daten zu ändern.
## Begrenzte Korrektur und unabhängige Gegenprobe

Die Korrektur setzt die Rasterspalten im Erwachsenenbereich ausdrücklich auf
eine schrumpfbare Spalte. Gezielte Mindestbreiten und Textumbrüche halten
Beschriftungen innerhalb der verfügbaren Fläche. Auch der Markenname darf auf
sehr schmalen Ansichten umbrechen. Text wird nicht verkleinert oder abgeschnitten;
es gibt keine neue Eingabe-, Speicher- oder Abgleichlogik.

Die unabhängige Messhilfe prüft die tatsächliche Arbeitsbaum-Version ohne
ersetzte CSS-Antwort. Bei 320 × 568, 320 × 360, 390 × 844 mit 200 Prozent sowie
320 × 568 mit 200 Prozent sind keine Elemente außerhalb der Ansicht gemessen.
Korrektur, neue Lektion, Kinderzuordnung und fünf gespeicherte Wortereignisse
nach Reload bestehen in allen vier Varianten. Diese Gegenprobe liegt vor dem
abschließenden Feinschliff der Worttrennung; dessen genaue Prüfung folgt unten.

```powershell
$env:PLAYWRIGHT_MODULE='<Playwright-Modulpfad>'
$env:BROWSER_EXECUTABLE='<Edge-Programmpfad>'
$env:IMPORT_HARNESS_ROOT='<isolierter Arbeitsbaum>'
$env:MOBILE_LABEL='implemented'
node .superpowers/diagnostics/2026-09-30-mobile-import.mjs
```

Die Platzhalter bezeichnen lokale Laufzeit-/Arbeitsbaumpfade, keine nötige
Produktkonfiguration. Rohdaten: `mobile-import/implemented-results.json`.
Die Sichtprüfung zeigte dabei willkürliche Umbrüche langer deutscher Wörter.
Der abschließende CSS-Feinschliff passt die Mindestbreite der Menüpunkte an die
Schriftgröße an: bei normaler Schrift zwei Spalten, bei 200 Prozent eine.
Die Menütitel passen dadurch jeweils vollständig in eine Zeile. Automatische
Silbentrennung ist für den deutschen Erwachsenenbereich aktiviert. Edge
verwendet in dieser Umgebung bei einigen langen Überschriften trotzdem keine
Wörterbuchtrennung; dort bleibt ein sichtbarer Zeichenumbruch erhalten. Kein
Inhalt wird abgeschnitten. Die erneute unabhängige Probe bei 390 px/200 Prozent
nach diesem Feinschliff besteht einschließlich Speicherung und Reload.

## Umsetzung und Prüfungen

Produktcommit `b440b5e59c2f0ecca9e102384f7da38ecbdaf10c` enthält ausschließlich
die beschriebene Laufzeit-CSS-Korrektur, Cache v43 und passende Browserprüfungen
einschließlich des simulierten Update-Nachfolgers v44.

Der neue Browserfall wurde zuerst gegen die bisherige CSS ausgeführt und
belegte den Überlauf von 463 statt 390 px. Anschließend zeigte er bei 320 px
und 200 Prozent die noch überbreite Markenbeschriftung. Beide Ursachen wurden
gezielt behoben. Auch die zusätzliche Prüfung der vollständigen Menütitel
war vor dem Feinschliff rot und danach grün.

Final nach allen CSS-Änderungen:

```powershell
node --test --experimental-test-isolation=none --test-name-pattern 'adult vocabulary|trainer setup|trainer sync and restore exposes|trainer offline|C2 rejected|update notice' tests/browser/mobile-import-layout.browser.mjs tests/browser/trainer.browser.mjs tests/browser/status-feedback.browser.mjs
```

**7/7 Browserfälle bestanden.** Der neue Fall umfasst 390/320 px bei 200 Prozent
sowie 320/1280 px bei normaler Schrift. Die übrigen Fälle prüfen unter anderem
die vorhandene Erwachsenen-/Importbedienung, Offline-Neustart, abgewiesenen
Precache und kontrollierte Updateaktivierung. Die vollständige Node-Suite mit
`npm test` bestand mit **662/662** nach der ersten CSS- und Cachekorrektur.
Nach dem reinen CSS-Feinschliff wurden die direkt betroffenen Browser- und
Updateprüfungen frisch wiederholt; unveränderte Produkt-JavaScript-Module
rechtfertigten keine erneute vollständige Node-Suite.

Die erste Browserausführung scheiterte an Sandbox-`EPERM`; der zulässig
eskalierte lokale Test lieferte anschließend den fachlichen Fehlernachweis.
Zwei Fehler der neuen Test-Fixture (Annahme eines stets sichtbaren PIN-Dialogs
und einer festen Profil-ID) wurden vor dem erfolgreichen Lauf korrigiert.
Kein solcher Testfehler wurde als Produktfehler ausgegeben.

Vorher-/Nachher-Bilder bleiben lokal im Arbeitsbaum unter
`test-results/mobile-import-layout/`; Implementierungs- und Reviewbelege unter
`.superpowers/sdd/2026-09-30-mobile-import-layout/`. Die Prüfung verwendet
ausschließlich synthetische Bestände in getrennten lokalen Browserprofilen.

## Unabhängige Prüfung, Integration und private Bereitstellung

Taskreview und abschließende unabhängige Prüfung des vollständigen Bereichs
`27c22f5..b440b5e` bewerten Anforderungen und Qualität mit PASS, ohne Befunde.
Die dokumentierten Grenzen zu realen Geräten, echter Excel-Zwischenablage,
Google-Dauer und umfassender Typografie bleiben ausdrücklich offen. Es gibt
keinen neuen Befund, der eine Änderung weiterer Produktbereiche begründet.

Der geprüfte Commit wurde per Fast-Forward auf `codex/vokabeltrainer-v1`
integriert. `npm run prepare:cloudflare` bereitete 387 öffentliche Dateien vor.
Der vorhandene geschützte Deployment-Helfer mit Aktion `Deploy` übertrug zwei
geänderte Dateien (`trainer/styles.css`, `trainer/sw.js`); 385 waren unverändert.
Der Upload-Zugang wurde dafür nicht neu eingerichtet oder erweitert.

Worker-Version `8ec1b376-c0e7-4800-8a0e-24ea169d82a5` ist laut separater
Deployment-Abfrage seit **30.09.2026, 20:16:19.914 UTC zu 100 Prozent aktiv**.
Die Prüfung mit
`node .superpowers/deployment-2026-09-30-mobile-layout/verify-public.mjs`
bestätigt um 20:16:44.693 UTC alle sieben Dateien bytegleich zum vorbereiteten
Paket: Stylesheet, Service Worker, HTML, Main, Vokabeleingabe, Shell und
Server-Konfiguration. Cachekennung ist v43. Die Konfiguration wird mit der
vorbereiteten Servervariante verglichen, nicht fälschlich mit der lokalen
Browserkonfiguration. Keine Zugangsdaten werden dokumentiert.

Im bestehenden Codex-Testbrowser war vor dem Update die gewählte Drachenstufe 4
mit 40 verfügbaren Punkten, 2.040 Lernpunkten und Level 11 sichtbar. Der
Hinweis „Neue Programmversion verfügbar“ erschien nach Reload; nach Klick auf
„Jetzt aktualisieren“ blieb derselbe Bestand sichtbar erhalten. Der kurz beim
Start sichtbare Google-Hinweis verschwand selbstständig, ohne Anmeldung oder
Ansichtswechsel. Screenshot lokal:
`.superpowers/deployment-2026-09-30-mobile-layout/existing-test-after-update.png`.
Kein Kauf, Import, Zurücksetzen oder Neueinrichten; Familien-Chrome unverändert.
Diese Beobachtung belegt das kontrollierte Update, keinen natürlichen Tokenablauf.

Der autorisierte Push des Produktcommits auf `codex/vokabeltrainer-v1` und
`codex/purchase-batch-checks` war erfolgreich. Anschließend lieferten
`git ls-remote --heads origin codex/vokabeltrainer-v1 codex/purchase-batch-checks`
und `git rev-parse` für beide Zweige exakt
`b440b5e59c2f0ecca9e102384f7da38ecbdaf10c`. Dieser Bericht und die aktualisierten
Einstiegsdateien folgen als separater Dokumentationscommit. Fortsetzung und
noch benötigte Praxiseingaben stehen in der
[Übergabe](../handoffs/2026-09-30-mobile-vokabeleingabe.md).
