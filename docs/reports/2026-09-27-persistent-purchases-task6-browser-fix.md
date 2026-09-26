# Task 6: Korrektur der abschließenden Browserprüfung

Stand: 27.09.2026
Fixbasis: `bdb65ad548e3133637d169efccadf32ee11a6f6d`

## Ausgangsbefund (RED)

Der zentrale Node-Lauf war mit **499/499** Tests grün. Der vollständige
Browserlauf in
`test-results/final-purchases-2026-09-27/browser-full.log` endete nach
221,667 Sekunden mit **37/39** bestandenen Fällen:

1. `C2 final views cover the responsive matrix, readable zoom and all avatar options`
   lief in `loadedArt()` nach 30 Sekunden aus.
2. `trainer sync and restore keeps concurrent word versions until an adult resolves them`
   wartete nach 30 Sekunden vergeblich auf `Inhaltskonflikte`.

## Ursache und Korrektur

### Mobile Avatarbilder

Die Diagnose auf 390 × 844 CSS-Pixeln bei DPR 2 zeigte einen geöffneten
Klassikbereich und eine 2.798 Pixel hohe Seite. Die beiden Bilder der großen
Vorschau waren vollständig geladen. Vier weiter unten liegende Zubehörbilder
bei ungefähr 2.158 bis 2.502 Pixeln hatten erwartungsgemäß noch keinen
`currentSrc` und `naturalWidth === 0`, weil sie `loading="lazy"` verwenden und
nie in den sichtbaren Bereich gelangt waren. Es gab keine fehlgeschlagenen
Bildanfragen.

Der C2-Test durchläuft nun die klassischen Avatarbilder mit
`scrollIntoViewIfNeeded()`, bevor die bestehende Vollständigkeitsprüfung für
**alle** `[data-art-key] img` läuft. Die Prüfung wurde weder entfernt noch auf
eine Teilmenge reduziert. Ein erzwungenes Eager-Laden versteckter oder weit
unterhalb des Viewports liegender Produktbilder ist nicht nötig.

### Reihenfolge der beiden Abgleiche

Der Konflikttest startete den Abgleich des zweiten Geräts unmittelbar nach dem
Klick auf den Abgleich des ersten Geräts. Der Klick wartet nicht auf die
asynchrone Drive-Operation. Unter geringer Last war der Upload zufällig schon
fertig; der einzeln ausgeführte unveränderte Fall bestand in 6,144 Sekunden.
Unter der Last des Gesamtlaufs konnte Gerät 2 dagegen vor der Veröffentlichung
von Gerät 1 fertig werden und hatte dann wahrheitsgemäß noch keine beiden
Konfliktfassungen.

Eine Diagnose mit genau einer um drei Sekunden verzögerten synthetischen
Drive-Anfrage bestätigte die Reihenfolge: Gerät 2 erreichte bereits
`Abgeglichen`, während Gerät 1 noch nicht abgeschlossen war. Damit fehlten auf
Gerät 2 zu diesem Zeitpunkt die Konfliktfakten; der Fehler lag nicht an einem
ausbleibenden Neurender der geöffneten Erwachsenenansicht.

Der Test wartet nun nach dem ersten manuellen Abgleich auf dessen neu
gerenderten Status `Abgeglichen`. Erst danach startet Gerät 2 seinen Abgleich.
Die fachlichen Prüfungen auf beide Wortfassungen, Restorevorschau und bewusste
Konfliktauflösung bleiben vollständig erhalten.

## GREEN

Ausgeführt mit Node.js 22.23.3, der vorhandenen Playwright-Laufzeit und
System-Edge in isolierten synthetischen Browserkontexten auf dynamisch
vergebenen lokalen Ports:

```text
node --test --experimental-test-isolation=none \
  --test-name-pattern='C2 final views|trainer sync and restore keeps concurrent word versions' \
  tests/browser/overhaul.browser.mjs tests/browser/trainer.browser.mjs
```

Ergebnis: **2/2 bestanden**, 0 fehlgeschlagen, 9,959 Sekunden. Der persönliche
Server auf Port 4173 wurde nicht verwendet oder verändert. Es gab keine echten
Google-Konten, keine echten Lernprofile und keine Veröffentlichung.

## Grenzen

Diese Korrektur betrifft ausschließlich die Ablaufsteuerung zweier bestehender
Browserprüfungen. Produktcode, Service Worker und Assets wurden nicht geändert;
deshalb wurde weder die Node-Gesamtsuite noch der vollständige Browserlauf hier
erneut ausgeführt. Der zentrale vollständige Browserlauf erfolgt anschließend
einmal durch Task 6. Die vorgemerkte Minor-Fokusfrage nach
`stale` und anschließendem `Abbrechen` gehört zur abschließenden Review und ist
nicht Teil dieser Korrektur.
