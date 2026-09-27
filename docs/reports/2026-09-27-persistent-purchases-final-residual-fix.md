# Dauerhafte Käufe – enger Abschlussnachtrag RF-4 und RF-6

Datum: 27.09.2026

BASE: `f02781a6bc2701da10079a2960f710d5c0247a96`

## Umfang und Ergebnis

Dieser Nachtrag bearbeitet ausschließlich die zwei in der
[`scoped Abschluss-Nachprüfung`](2026-09-27-persistent-purchases-final-fix-review.md)
belegten Reste RF-4 und RF-6. RF-1, RF-2, RF-3 und RF-5 wurden nicht erneut
implementiert. Es gibt keine neue öffentliche Schnittstelle, kein neues
Protokollobjekt und keine neue Cloudoperation. Produktcache `v25` und die
synthetische Updateversion `v26` bleiben unverändert.

## RF-4 – Setupgrenze vor jeder Controlpublikation

### Ursache

`prepareControl` prüfte ein unbestätigtes Setup, der öffentliche
`resume(controlId)`-Pfad sprang bei einem bereits gespeicherten
`control.phase = reserved` jedoch direkt zu `sendControl` und `uploadControl`.
Damit konnte die Produktclosure vor dem Nachweis der installierten Config
publiziert werden. Erst der anschließende Kaufupload scheiterte korrekt mit
`binding`.

### Korrektur

`uploadControl` prüft unmittelbar vor jeder abhängigen Produkt- oder
Kaufpublikation das gespeicherte Setup. Bei einem unbestätigten Setup verwendet
es den bestehenden read-only `installSetup`-/`resumeBootstrap`-Weg:

- ist der Pointer bereits angenommen, bestätigt der Read die Installation;
- ist sein Ausgang weiter unbekannt, endet der Controlweg mit `pending`;
- der Setuppointer wird dabei nicht erneut gesendet;
- nur `resume(setup.operationId)` darf den gespeicherten Setuppointer bewusst
  und unverändert wiederholen.

Kandidat, Uploadclosure, Pointerbody und ETag des gespeicherten Controls bleiben
unverändert. Nach bestätigtem Setup setzt `resume(controlId)` genau denselben
Controlauftrag bis `confirmed` fort.

### Regression

`a direct reserved activation resume stays read-only until the same unclear
setup is confirmed` verwendet tatsächliche Commands, HTTP-Transport,
Bootstrap, CommerceIntegration, PurchaseService und Produktpublikation. Vor dem
direkten Control-Resume fehlen Configpointer und Produktuploads. Der erste
Resume liefert `pending`, sendet keinen Pointer und erzeugt weiterhin null
Produktdateien. Nach dem ausdrücklichen Setup-Resume wird derselbe gespeicherte
Control anhand Kandidat, Uploads, Pointerproperties und ETag bis `active`
fortgesetzt.

## RF-6 – vollständiger Pollabschluss statt About-Antwort

### Ursache

Der I3-Test zählte die Antwort von `/drive/v3/about` bereits als Abschluss der
Pollrunde. Danach folgen jedoch noch Dateisuche, Download, Commerceabgleich,
Epochenpublikation und Pendinguploads. Ein angehaltener nachfolgender
Drive-Dateiread ließ deshalb alle alten Assertions bestehen, obwohl die UI
weiter „Abgleich ausstehend“ zeigte.

### Korrektur des Prüfvertrags

Die synthetische Google-Grenze kann genau den nächsten GET auf
`/drive/v3/files` anhalten und gezielt freigeben. Der I3-Test:

1. startet die 61-Sekunden-Pollrunde;
2. wartet nach der About-Antwort auf den tatsächlich erreichten Dateiread;
3. weist während des Halts ausdrücklich „Abgleich ausstehend“ nach;
4. gibt den Read frei und wartet auf die Rückkehr zu „Abgeglichen“;
5. prüft erst danach leere Outbox, leere Pendingpakete, jede Remote-Ereignis-ID
   genau einmal und keine neuen Writes gegenüber der vorherigen Baseline.

Zulässige Same-ID-Retries werden weiterhin nicht mit doppelter fachlicher
Wertung gleichgesetzt. Es wurde keine Produktionsschnittstelle nur für den Test
eingeführt.

## RED-Beleg

```text
node --test --experimental-test-isolation=none \
  --test-name-pattern="direct reserved activation resume" \
  tests/trainer/purchases-recovery.test.js
```

Vor der Produktkorrektur: **1 Test, 0 bestanden, 1 fehlgeschlagen**. Erwartet
war `pending`, tatsächlich kam `binding`; der Stack führte über
`uploadControl` und `writeImmutable`, also nach Beginn der unerlaubten
Publikation.

Für RF-6 ist der RED-Nachweis die unabhängige scoped Reproduktion: Mit einem
angehaltenen Dateiread nach erfolgreicher About-Antwort bestanden die früheren
I3-Assertions vollständig, während die UI „Abgleich ausstehend“ zeigte. Der
Nachtrag macht genau diesen Halt zu einer verbindlichen Testphase.

## GREEN-Belege

### RF-4 und angrenzende Verlust-/Recoverypfade

```text
node --test --experimental-test-isolation=none \
  --test-name-pattern="unclear setup stays|accepted setup pointer|direct reserved activation resume|activation resumes its exact reserved" \
  tests/trainer/purchases-recovery.test.js
```

Ergebnis: **5 Tests, 5 bestanden, 0 fehlgeschlagen**, 2,295 s.

Enthalten sind der nicht angenommene Setup-Pointer, beide angenommenen
Antwortverlustfälle einschließlich frischer Objekte, der direkte gesperrte
Control-Resume und die unveränderte reservierte Closure nach Uploadfehler und
Neustart.

### RF-6 mit angehaltenem Dateiread

Mit vorhandener Playwright-Laufzeit und System-Edge:

```text
node --test --experimental-test-isolation=none \
  --test-name-pattern="final I3" tests/browser/trainer.browser.mjs
```

Ergebnis: **1 Test, 1 bestanden, 0 fehlgeschlagen**, 11,865 s.

Der Test erreicht den gehaltenen Dateiread genau einmal, weist davor den
unvollständigen UI-Zustand und erst nach Freigabe den vollständigen
Syncabschluss samt unveränderter Writezahl nach.

## Vorherige Gesamtbelege und Grenzen

Der Controller bestätigte vor diesem Nachtrag **506/506 Node-Tests** und
**43/43 Browserfälle**. Diese Zwischenbelege geben die zwei hier korrigierten
Restpfade nicht frei und wurden gemäß Auftrag nicht wiederholt. Die gezielte
Nachprüfung dieses festen Nachtrags bleibt beim Controller.

Nicht geprüft oder freigegeben wurden echte Google-Konten, reale Zwei-Geräte-
oder Apple-/Safari-/Home-Bildschirmtests, Hosting und die vollständige
72-Motive-Galerie. Es gab keinen Push und keine Änderung an eingefrorenen
v2-Quellen, Lernereignis-/Paketversion 2, Storageformat 3 oder
Commerce-/Backupformat 3.
