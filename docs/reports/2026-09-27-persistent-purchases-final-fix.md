# Dauerhafte Käufe – gemeinsame Abschluss-Fixwelle

Datum: 27.09.2026
FIX_BASE: `18e989c77b98e0f7394ca660ef7b0023dda6678c`
Produkt-/Testcommits:

- `7fe16e7` (`fix(purchases): close final integration findings`)
- `6b7e281` (`test(purchases): complete final integration evidence`)

## Ergebnis

Die sechs Abschlussverträge RF-1 bis RF-6 aus
[`2026-09-27-persistent-purchases-final-review.md`](2026-09-27-persistent-purchases-final-review.md)
sind in einer gemeinsamen Welle bearbeitet. Es wurden keine neuen Produktports,
Protokollobjekte oder Cloudoperationen eingeführt. Der Service Worker verwendet
wegen der geänderten Laufzeitmodule nun Produktcache `v25`; die synthetische
Updateversion der Browsertests ist `v26`.

Die zentrale Vollsuite auf `7fe16e7` ist unten als Controllerbeleg abgegrenzt.
Die einzige scoped Nachprüfung, reale Google-/Geräteprüfungen und der Push
bleiben beim Controller.

## RF-1 – aktueller Snapshot beim Backupdownload

**Ursache:** `renderBackup` schloss beim Rendern sowohl den Produktzustand als
auch die damalige Epochenauflösung ein. Die bewahrte Erwachsenen-DOM verwendete
beim späteren Klick deshalb den alten Stand.

**Korrektur:** Der Klick erfasst genau einen frischen Snapshot über den bereits
vorhandenen `getState`-Port. Epochenentscheidung und `exportBackup` verwenden
denselben Snapshot. Eine inzwischen neue oder veränderte Konfliktlage verlangt
eine neue Kopfauswahl. Das anschließende Rendern verwendet ebenfalls einen
frischen Zustand; die DOM-Erhaltung der Erwachsenenansicht bleibt bestehen.

**Regression:** Tatsächliche Commands-, Shell-, Einstellungen- und Backupkette:
Der verbundene ursprüngliche Button bleibt nach einer Hintergrundantwort
erhalten, der exportierte Stand enthält dennoch die neuen zehn Punkte.

**Vervollständigte Abschlussfälle:** Dieselbe echte Bedienkette aktiviert
Commerce und exportiert danach ein v3-Backup. Dessen portabler Checkpoint zeigt
mit `previous` auf den aktuellen bestätigten gemeinsamen Kaufkopf und enthält
die erst nach dem Rendern atomar gespeicherte Figurenauswahl. Eine zweite
Regression wählt bei zwei sichtbaren Restoreköpfen bewusst einen Kopf, fügt im
Hintergrund einen dritten Kopf hinzu und lässt den alten Kopf weiterhin in der
Menge. Der alte verbundene Button darf trotzdem nicht exportieren: Erst eine
neue Auswahl gegen genau die jetzt sichtbare Kopfmenge gibt den Download frei.
`renderBackup` hält dafür neben der ID einen kanonisch sortierten Schlüssel der
angezeigten Kopfmenge; dieser ist reine lokale UI-Zustandsbindung und kein neues
Protokollfeld.

## RF-2 – Historie des langlebigen Kaufdienstes

**Ursache:** `lastHistory` war nur an die Lebensdauer der Serviceinstanz
gekoppelt. Ein externer atomarer Commands-Commit konnte `commerce.head` und
Cache voranstellen, ohne den Instanzcache zu verwerfen.

**Korrektur:** Die geladene Historie ist nun an bestätigten Kopf, Binding,
Configreferenz und Configinhalt gekoppelt. `getView` und `select` laden bei
Abweichung die lokal verifizierte Historie aus dem aktuellen Commercecache.
Dies benötigt offline keinen Netzaufruf und schwächt den vollständigen CAS-
Schreibschutz nicht.

**Regression:** Eine fortbestehende Serviceinstanz übernimmt nach einem Kauf
des zweiten Clients den neuen Kopf über tatsächliches `integration.reconcile`
und `commands.commitExternal`; Ansicht und Auswahl sehen unmittelbar 200
ausgegebene Punkte und den Besitz.

**Vervollständigter Abschlussfall:** Dieselbe fortbestehende Serviceinstanz
übernimmt anschließend über einen vollständig verifizierten Restorebeleg einen
neuen Kopf mit niedrigeren Rechten. Ohne Reload, neues `refresh` oder Netzlesen
meldet `getView` wieder 0 ausgegebene Punkte und keinen bezahlten Besitz;
`select` lehnt die nicht mehr berechtigte Stufe ab.

## RF-3 – Auswahl aus aktuellen Lernfakten

**Ursache:** `integration.reconcile` filterte die Auswahl mit den Konten der
letzten Receiptbasis. Neu erspielte, zusammengeführte Lernfakten fehlten dort.

**Korrektur:** Nach `authoritativeState` werden die Konten mit
`rebuildAccounts(project(next.ledger), history.projection.accounts)` aufgebaut.
Damit stammen Lernpunkte und Level aus der aktuellen gültigen Lernprojektion,
während Ausgaben und bezahlte Rechte weiterhin aus der bestätigten Historie
kommen.

**Regression:** Zehn neue Antworten erhöhen 300 auf 400 Punkte, `horse` wird
ausgewählt, und ein normaler Abgleich mit unverändertem Kaufkopf erhält diese
Auswahl.

**Vervollständigter Abschlussfall:** Der in RF-2 ergänzte bestätigte Restore
beginnt mit ausgewählter bezahlter Stufe, stellt einen wirtschaftlichen Stand
ohne diesen Besitz her und entfernt die dadurch unberechtigte Auswahl bei
`integration.reconcile`. Damit sind sowohl der Erhalt einer weiterhin gültigen
Auswahl als auch das Entfernen nach tatsächlich niedrigeren Rechten belegt.

## RF-4 – explizite Wiederaufnahme der Einrichtung

**Ursache:** `prepareActivation` prüfte einen gespeicherten unklaren
Setupauftrag nur im Modus `inactive`. Im bereits gespeicherten Modus
`migrating` begann es einen abhängigen Controlauftrag. Die UI bot nur
`commerce.control`, nicht `commerce.setup`, zur Wiederaufnahme an.

**Korrektur:** Ein nicht bestätigtes Setup wird vor Restorejournalen,
Kaufaufträgen und jeder Control-/Markerpublikation lesend nachgeprüft. Bleibt
der Ausgang unklar, liefert `prepareActivation` `pending`; es sendet keinen
Pointer erneut. Die Erwachsenenansicht bietet den gespeicherten Setupauftrag
über den bestehenden Port `commerce.resume(setup.operationId)` ausdrücklich
als „Datenaktualisierung fortsetzen“ an. Nur dieser bewusste Resume wiederholt
den identischen gespeicherten Pointer. Danach bleibt auch ein älterer
`control=reserved`-Auftrag erreichbar und wird mit seiner gespeicherten Closure
fortgesetzt.

**Regressionen mit tatsächlichem HTTP-Transport, Bootstrap,
CommerceIntegration, PurchaseService, Commands und Produktpublikation:**

- vor Anwendung verlorene Pointerantwort: Neustart und erneutes
  `prepareActivation` bleiben ohne PUT, Control oder Produktupload;
- expliziter Setup-Resume verwendet die gespeicherte Operation und führt danach
  die Aktivierung bis `active` fort;
- nach Anwendung verlorene Antwort wird durch Lesen bestätigt, ohne zweiten
  Setuppointer;
- derselbe angenommene Antwortverlust bleibt auch nach einem simulierten
  lokalen Speicherabbruch vor der Bestätigung und einem vollständigen Neustart
  von Store, Commands, Service und HTTP-Transport heilbar; der Test vergleicht
  den tatsächlich gesendeten Pointerbody, alle reservierten IDs und das
  ursprüngliche `If-Match`-ETag mit dem dauerhaft gespeicherten Auftrag;
- alter Zustand `setup=reconciling` plus `control=reserved` bleibt zunächst
  read-only und danach ohne neue Kandidatur vollständig fortsetzbar;
- die UI priorisiert bei gleichzeitig offenem Setup und Control die Setup-ID.

## RF-5 – Fokus nach stale und Abbrechen

**Ursache:** „Abbrechen“ fokussierte immer den ursprünglichen Kaufbutton, auch
wenn der stale-Pfad dessen Ansicht bereits ersetzt hatte.

**Korrektur:** Der Dialog verwendet den ursprünglichen Trigger nur, solange er
verbunden ist. Andernfalls nutzt er denselben aktuellen, routensicheren
Fokusrückfall wie der Erfolgsweg. Verspätete Callbacks bauen keine verlassene
Route wieder auf.

**Regression:** Der zusammengesetzte Kaufbrowserpfad prüft nach
`stale → Abbrechen` ein verbundenes aktives Element innerhalb der aktuellen
Figurenregister.

## RF-6 – fachlich präziser I3-Vertrag

**Ursache des Prüfdefekts:** Die alte Assertion verbot rückwirkend jedes
`duplicate:true`, obwohl ein identischer Same-ID-Retry nach verlorener Antwort
zulässige Idempotenz ist. Zugleich bewies eine leere Outbox noch nicht den
Abschluss aller Pendingpakete.

**Korrektur:** I3 wartet auf „Abgeglichen“, leere `outboxEventIds` und leere
`pendingPackets`, weist jedes zuvor ausstehende Ereignis remote fachlich genau
einmal nach, setzt erst danach die Write-Baseline und wartet nach 61 Sekunden
auf Start und Abschluss eines About-Polls. Anschließend darf kein weiterer
Write entstanden sein. Die Fixture protokolliert zusätzlich Dateiart, Name und
Paket-ID. Es gab keinen Produktfix aus dem ungesicherten ursprünglichen
Boolean.

## RED-Belege

1. `node --test --experimental-test-isolation=none --test-name-pattern="running service|normal reconcile keeps" tests/trainer/purchases-recovery.test.js`
   - RF-2: erwartet 200 ausgegebene Punkte, tatsächlich 0.
   - Der erste RF-3-Entwurf traf zunächst eine ungültige Rundenzähler-Fixture;
     nach Korrektur der Reproduktionsdaten zeigte der Einzellauf den erwarteten
     Produktfehler: Auswahl erwartet, tatsächlich `[]`.
2. `node --test --experimental-test-isolation=none --test-name-pattern="unclear setup stays|accepted setup pointer|reserved activation left" tests/trainer/purchases-recovery.test.js`
   - 2 bestanden, 1 fehlgeschlagen: beim read-only Wiedereinstieg wurde
     `pending` erwartet, tatsächlich entstand `binding` nach vorzeitiger
     Publikation.
3. Edge, `--test-name-pattern="final RF1" tests/browser/trainer.browser.mjs`
   - aktueller Stand 10 Punkte, exportierter Stand 0.
4. Edge, `--test-name-pattern="unclear setup is" tests/browser/purchases.browser.mjs`
   - erwartete Resume-ID `setup-recovery`, tatsächlich `old-control`.
5. Edge, `--test-name-pattern="earned points buy" tests/browser/purchases.browser.mjs`
   - Fokusassertion nach stale/Abbrechen: erwartet `true`, tatsächlich `false`.
6. Für RF-6 war der dokumentierte vollständige Ausgangslauf 38/39 mit der
   pauschalen Duplicate-Assertion rot. Die Diagnose konnte die konkrete alte
   Datei nicht nachträglich bestimmen und begründet deshalb keine weitergehende
   Ursachenbehauptung.
7. Der neue kombinierte RF-1-Abschlusslauf war zunächst 0/2. Der Kopfmengefall
   lief in den Timeout, weil der Download mit der alten weiterhin enthaltenen
   Kopf-ID fortfuhr. Der v3-Fall traf zunächst eine zu enge Testannahme: Das
   Backup muss als Kopf den lokalen Checkpoint tragen; der aktuelle gemeinsame
   Kopf steht verbindlich in `checkpoint.previous`. Nach dieser fachlichen
   Präzisierung blieb nur die echte Kopfmenge-Lücke als Produktfehler.

## GREEN-Belege

### Node – Kaufkern, Integration, Backup und Service Worker

```text
node --test --experimental-test-isolation=none \
  tests/trainer/purchases-recovery.test.js \
  tests/trainer/purchases-integration.test.js \
  tests/trainer/backup.test.js \
  tests/trainer/sw.test.js
```

Ergebnis: **91 Tests, 91 bestanden, 0 fehlgeschlagen**, 33,869 s.

### Servergrenze

```text
node --test --experimental-test-isolation=none tests/serve.test.js
```

Ergebnis: **6 Tests, 6 bestanden, 0 fehlgeschlagen**, 0,342 s.

### Gemeinsamer fokussierter Edge-Lauf

Mit der vorhandenen Playwright-Laufzeit und System-Edge:

```text
node --test --experimental-test-isolation=none \
  --test-name-pattern="final RF1|final I3|unclear setup is|earned points buy|C2 rejected required|trainer offline update UI" \
  tests/browser/trainer.browser.mjs tests/browser/purchases.browser.mjs
```

Ergebnis: **6 Tests, 6 bestanden, 0 fehlgeschlagen**, 40,463 s. Der Lauf
umfasst den aktuellen Backupdownload, die sichtbare Setupfortsetzung, den
stale-Fokuspfad, den präzisen I3-Vertrag, fehlgeschlagene Precacheinstallation
und kontrollierte Offlineaktualisierung.

### Vervollständigte Node-Abschlussfälle

```text
node --test --experimental-test-isolation=none \
  --test-name-pattern="running service adopts|normal reconcile keeps|accepted setup pointer" \
  tests/trainer/purchases-recovery.test.js
```

Ergebnis auf `6b7e281`: **5 Tests, 5 bestanden, 0 fehlgeschlagen**, 2,272 s.
Enthalten sind ursprünglicher und späterer Restorekopf derselben
Serviceinstanz, Erhalt und Entzug von Auswahlrechten sowie angenommener
Setup-Pointerverlust mit und ohne vollständigen Objektneustart.

### Vervollständigte RF-1-Edge-Abschlussfälle

Mit derselben vorhandenen Playwright-Laufzeit und System-Edge:

```text
node --test --experimental-test-isolation=none \
  --test-name-pattern="final RF1" tests/browser/trainer.browser.mjs
```

Ergebnis auf `6b7e281`: **3 Tests, 3 bestanden, 0 fehlgeschlagen**, 4,533 s.
Enthalten sind der ursprüngliche frische Lernsnapshot, der v3-Checkpoint mit
aktueller wirtschaftlicher Auswahl und die erneute bewusste Auswahl nach einer
geänderten sichtbaren Kopfmenge.

### Zentrale Gesamtläufe vor der Belegvervollständigung

Der Controller hat auf dem festen Produktstand `7fe16e7` **504/504 Node-Tests**
und **41/41 Browserfälle** bestätigt. Diese Vollsuiten wurden nach dem eng
begrenzten Commit `6b7e281` gemäß Auftrag nicht doppelt ausgeführt; die
abschließende scoped Nachprüfung und ihre Einordnung bleiben zentral.

## Abgleich der sechs Abschlussverträge mit konkreten Tests

- **RF-1:** `final RF1 connected backup action exports the current Commands
  snapshot`, `final RF1 v3 backup exports the current economy selection through
  the preserved shell action`, `final RF1 changed visible head set requires a
  new deliberate backup choice`.
- **RF-2:** `a running service adopts an externally reconciled purchase head
  without reload or network refresh`, `a running service adopts a later
  confirmed restore that removes ownership and invalid selection`.
- **RF-3:** `normal reconcile keeps a selection unlocked by learning earned
  after the last purchase head` sowie der vorgenannte Restoretest mit
  niedrigeren Rechten und entfernter Auswahl.
- **RF-4:** `an unclear setup stays read-only until its saved operation is
  explicitly resumed`, beide Tests mit `an accepted setup pointer ...`, `a
  reserved activation left beside an unclear setup remains resumable after
  setup confirmation` und der Browserfall `an unclear setup is the activation
  operation offered for explicit continuation`.
- **RF-5:** `earned points buy through the real service and survive reopen,
  offline use, stale preview and lost response` prüft insbesondere den Fokus
  nach `stale → Abbrechen`.
- **RF-6:** `final I3 deliberate reconnect wakes pending bound sync without
  another lifecycle event` prüft Outbox, Pendingpakete, fachliche Einmaligkeit
  sowie begonnenen und abgeschlossenen Leerlaufpoll.

## Schnittstellen und Grenzen

- Keine neue öffentliche Produkt- oder Commerce-Schnittstelle.
- Vorhandene Ports jetzt verbindlich genutzt:
  `renderBackup.getState()`, `commerce.resume(operationId)`,
  `PurchaseService.getView()` und `PurchaseService.select()`.
- Keine Änderung an eingefrorenen v2-Quelldateien, Lernereignis-/Paketversion 2,
  Storageformat 3 oder Commerce-/Backupformat 3.
- Keine echten Google-Konten, privaten Daten, Geräte-, Safari-/iOS-, Hosting-
  oder vollständigen 72-Motive-Galerieprüfungen.
- Nach dem eng begrenzten Ergänzungscommit keine doppelte vollständige
  Node-/Browser-Gesamtsuite; die genau eine scoped Nachprüfung folgt zentral.
