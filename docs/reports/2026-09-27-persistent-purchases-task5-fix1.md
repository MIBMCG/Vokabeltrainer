# Dauerhafte Käufe – Task 5, Fixrunde 1

Datum: 27.09.2026. Fixbasis:
`8ed01f21052724a0ed0df50265d342a0bbf85a22`.
Fixcommit: `ae9ef27a940a341ce2b26bc2edb1124f4d2cc3c4`.

Grundlage ist die unabhängige Prüfung
`2026-09-27-persistent-purchases-task5-review.md`. Die Fixrunde ändert keine
Preise, Guthabenautorität, Kaufwarteschlange oder Bildauswahl.

## Behobene Befunde

### R5-1 – verbundener Root und Fokus

RED:

- Ein während `getView` ersetzter Root blieb bei „Figuren und Käufe werden
  geladen …“.
- Der echte Commands-/Select-Commit zeigte nach fünf Sekunden ohne weiteren
  Tabklick kein „Ausgewählt“.

`renderPurchases` speichert nun den aktuell verbundenen Renderport am stabilen
`#app`-Eigentümer. Der Abschluss von Laden, Auswahl und Kaufbestätigung rendert
den neuesten verbundenen Root. Nach einer Aktion erhält der aktive
Commerce-Tab den Fokus. Beim erfolgreichen Dialogabschluss wird ein entfernter
Auslöser nicht fokussiert; stattdessen erhält die neue verbundene Ansicht den
Fokus.

Der Shell-Fallback ist an `currentView === 'avatar'` gebunden. Verlässt das Kind
den Avatarbereich während eines laufenden Aufrufs, baut dessen später Callback
die inzwischen aktive Erwachsenenansicht nicht neu auf. Der Browserfall erhält
denselben Eingabeknoten und den offenen Text.

### R5-2 – Vorschau und bestätigter Stand

RED: Eine alte Settings-Closure zeigte Ada mit 0 Punkten, während das
zurückgegebene aktuelle Ticket bereits an 1.600 Punkte gebunden war.

Der Port lautet jetzt:

```text
previewActivation() -> {
  ticket:{stateHash,binding,descriptorHash},
  previewState:{ledger}
}
activate(ticket)
```

Ticket und sichtbares Modell stammen aus demselben aktuellen Commands-Stand.
`previewState` enthält nur das für die lokale Darstellung benötigte Ledger und
löst keine Netzoperation aus.

Die Backupoberfläche ruft zuerst `restore.prepare(backup)` auf. Erst danach
berechnet sie die wirtschaftlichen Vorher-/Nachherwerte aus `getState()`. Das
gilt auch für eine nach `stale` neu aufgebaute Vorschau. Ein enger Test lässt
`prepare` den Stand von `before` auf `after` wechseln und belegt die Reihenfolge
`prepare`, `economy:after`.

### R5-3 – tatsächliche Restoreauswahl

RED:

- Ein bestätigter Restore kündigte `explorer-girl` an, behielt tatsächlich aber
  die lokale Auswahl `explorer-boy`.
- Eine leere Backupauswahl wurde gegenüber einer vorhandenen Zielauswahl mit
  0 statt 1 Änderung gezählt.

`applyConfirmedControl` übernimmt die bereits durch `validateBackup` geprüfte
v3-Auswahl erst nach bestätigtem Kopf und `authoritativeState`. Sie wird gegen
`history.projection.accounts` des bestätigten Zielkopfs geprüft und vollständig
ersetzt; `[]` entfernt vorhandene Zielauswahlen. Vorbereitung, Upload und
Fehlerpfade ändern die Auswahl nicht.

Die Auswahl wird nur übernommen, wenn `history.projection.activeEpochId` der
Epoche der Restore-Control entspricht. Sie kann deshalb bei Wiederaufnahme
keinen inzwischen bestätigten späteren Restore überschreiben. Ein altes Backup
ohne Economy besitzt keine Auswahl und leert die lokale Auswahl am passenden
bestätigten Restoreabschluss.

Die UI vergleicht die Vereinigungsmenge der Profil-IDs beider Auswahllisten und
zählt damit Änderungen, Ergänzungen und Entfernungen symmetrisch.

### R5-4 und R5-5

Eine Grundform gilt nur dann als „Ausgewählt“, wenn Figur und Stufe 1
übereinstimmen. Bei ausgewählter Stufe 2 bleibt „Grundform auswählen“ nutzbar.

Der Implementierungsbericht und `docs/KAUFPROTOKOLL.md` nennen nun korrekt
`confirm(preview)`; `resume(operationId)` bleibt der getrennte
Wiederaufnahmeport.

## RED-/GREEN-Nachweise

```text
# RED, fokussierter Browser
purchase view follows a root replaced during its initial load
# sichtbar dauerhaft „werden geladen“

activation preview pairs its visible current state with the confirmed ticket
# sichtbar Ada: 0 statt 1600 Lernpunkte

earned points buy through the real service ...
# nach 5 s kein „Ausgewählt“ ohne zusätzlichen Tabklick

# RED, Integration
restore preparation binds ...
# explorer-boy blieb statt explorer-girl

v3 backup carries ...
# Auswahlentfernung: 0 statt 1
```

GREEN:

```text
node --test --experimental-test-isolation=none \
  tests/trainer/purchases-view.test.js \
  tests/trainer/purchases-integration.test.js \
  tests/trainer/purchases-recovery.test.js \
  tests/trainer/reward-view.test.js tests/trainer/backup.test.js \
  tests/trainer/restore.test.js tests/trainer/sw.test.js tests/serve.test.js
# 127 Tests, 0 Fehler, 45,064 s

PLAYWRIGHT_MODULE=<vorhandenes Playwright> BROWSER_EXECUTABLE=<Edge> \
node --test --experimental-test-isolation=none tests/browser/purchases.browser.mjs
# 6/6, 0 Fehler, 33,089 s

node --test --experimental-test-isolation=none \
  --test-name-pattern='C2 rejected required precache|trainer offline starts|trainer offline update UI' \
  tests/browser/trainer.browser.mjs
# 3/3, 0 Fehler, 10,722 s

node --check <alle geänderten JavaScript-Dateien>
git diff --check
# ohne Befund
```

Der echte Kaufbrowser prüft jetzt Kaufbestätigung und Auswahl mit tatsächlichem
Commands-Commit, Rootwechsel und verbundenem Fokus ohne maskierenden Tabklick.
Der Worker wurde wegen der Runtimeänderungen konsistent auf `v24`, das
synthetische Update auf `v25` erhöht.

## Grenzen

Keine vollständige `npm test`-Suite; sie läuft vereinbarungsgemäß einmal im
zentralen Task-6-Gate. Keine Live-Google-, Zwei-Geräte-, Hosting- oder echte
iPhone/iPad-Abnahme. Keine neuen Bilder oder responsive Varianten. Die
Bildschirmbelege aus der Implementierungsrunde bleiben unverändert gültig.
