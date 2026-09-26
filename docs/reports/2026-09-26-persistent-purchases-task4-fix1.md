# Dauerhafte Käufe – Task 4, Korrekturrunde 1

Stand: 26.09.2026

Die drei Findings der unabhängigen Task-4-Prüfung sind gezielt korrigiert.

- Der Produktdownload bewahrt neu gelesene Commerce-Kandidaten und verspätete
  Altclient-Epochen zunächst als inaktive Herkunft. Ein fehlender oder nicht
  lesbarer gemeinsamer Kopf ändert weder aktive Epoche noch laufende Runde oder
  Punkte. Erst die vollständig geprüfte Kaufhistorie aktiviert ihren Fachstand
  atomar über Commands.
- Die öffentliche Restore-Bestätigung erzeugt bei `uploading` oder `published`
  keinen neuen Kandidaten. Sie ruft `resume(job.id)` auf und verwendet die
  gespeicherten IDs, Bodies, Pointerproperties und die ursprüngliche ETag. Vor
  einer ausdrücklichen Pointerwiederholung wird der gemeinsame Kopf gelesen.
- Erhaltene `activated`-Journale sind abgeschlossene Historie. Sie blockieren
  spätere Restores nicht; offene fremde Restoreaufträge blockieren weiterhin.

Die eingefrorene v2-Laufzeit wurde bis nach einem verlorenen Restoreupload
weitergeführt. Nach dem v3-Marker konnte sie den bereits begonnenen Restore noch
veröffentlichen. Ein aktueller Client behielt diese Dateien und ordnete deren
Epoche als inaktive Herkunft ein; aktiv blieb ausschließlich die vom gemeinsamen
v3-Kopf bestätigte Epoche.

## Testgetriebene Belege

Die neuen Regressionen schlugen vor der Produktkorrektur mit den erwarteten
Fehlern fehl:

```text
node --test --experimental-test-isolation=none \
  --test-name-pattern="commerce epochs remain inactive" \
  tests/trainer/sync.test.js
# 0/1; aktive Epoche authority-5 statt e0

node --test --experimental-test-isolation=none \
  --test-name-pattern="public restore confirmation resumes" \
  tests/trainer/purchases-recovery.test.js
# 0/1; stale: koordinierte Wiederherstellungsvorschau nicht mehr verfügbar

node --test --experimental-test-isolation=none \
  --test-name-pattern="activated initialization and restore journals" \
  tests/trainer/purchases-recovery.test.js
# 0/1; restore-pending trotz ausschließlich abgeschlossenem Vorgängerjournal
```

Nach der Korrektur:

```text
node --test --experimental-test-isolation=none \
  --test-name-pattern="commerce epochs remain inactive" \
  tests/trainer/sync.test.js
# 1/1

node --test --experimental-test-isolation=none \
  --test-name-pattern="public restore confirmation resumes|activated initialization and restore journals" \
  tests/trainer/purchases-recovery.test.js
# 2/2

node --test --experimental-test-isolation=none \
  --test-name-pattern="frozen v2 commands" \
  tests/trainer/purchases-integration.test.js
# 1/1

node --test --experimental-test-isolation=none \
  tests/trainer/purchases-integration.test.js \
  tests/trainer/purchases-recovery.test.js \
  tests/trainer/restore.test.js tests/trainer/sync.test.js
# 135/135, 0 Fehler, 50.820 s

npm test
# 492/492, 0 Fehler, 83.597 s

npm run check:docs
# 1194 Dateien, 212 Markdown, 945 lokale Links, 0 Fehler
```

Die Regressionen verwenden echte `ProductSync`-, `RestoreService`-,
`PurchaseService`- und `CommerceIntegration`-Zusammensetzungen. Synthetisch sind
nur dauerhafter Speicher sowie Drive- und Netzfehler. Es wurden keine echten
Cloudobjekte geschrieben und keine Produktionsabhängigkeiten installiert.
