# Dauerhafte Käufe – gemeinsame Abschluss-Fixwelle

Datum: 27.09.2026
FIX_BASE: `18e989c77b98e0f7394ca660ef7b0023dda6678c`
Produkt-/Testcommit: `7fe16e7` (`fix(purchases): close final integration findings`)

## Ergebnis

Die sechs Abschlussverträge RF-1 bis RF-6 aus
[`2026-09-27-persistent-purchases-final-review.md`](2026-09-27-persistent-purchases-final-review.md)
sind in einer gemeinsamen Welle bearbeitet. Es wurden keine neuen Produktports,
Protokollobjekte oder Cloudoperationen eingeführt. Der Service Worker verwendet
wegen der geänderten Laufzeitmodule nun Produktcache `v25`; die synthetische
Updateversion der Browsertests ist `v26`.

Die zentrale Vollsuite, die einzige scoped Nachprüfung, reale Google-/Geräteprüfungen
und der Push bleiben beim Controller.

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

## Schnittstellen und Grenzen

- Keine neue öffentliche Produkt- oder Commerce-Schnittstelle.
- Vorhandene Ports jetzt verbindlich genutzt:
  `renderBackup.getState()`, `commerce.resume(operationId)`,
  `PurchaseService.getView()` und `PurchaseService.select()`.
- Keine Änderung an eingefrorenen v2-Quelldateien, Lernereignis-/Paketversion 2,
  Storageformat 3 oder Commerce-/Backupformat 3.
- Keine echten Google-Konten, privaten Daten, Geräte-, Safari-/iOS-, Hosting-
  oder vollständigen 72-Motive-Galerieprüfungen.
- Keine vollständige Node-/Browser-Gesamtsuite in dieser Welle; sie folgt
  zentral, ebenso die genau eine scoped Nachprüfung.
