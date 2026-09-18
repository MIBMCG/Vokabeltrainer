# Dauerhafte Prüfhistorie Tasks 1–6

Stand: 18.09.2026. Dieser Auszug bewahrt die finalen Befehle, Zählungen und Reviewurteile aus den damaligen Implementierungs- und Reviewberichten. Er ersetzt keine neue Ausführung. Frühere `spawn EPERM`-Umgebungsabbrüche wurden in den Originalberichten getrennt von fachlichen RED-Ergebnissen behandelt. Alle Tests nutzten synthetische Daten.

## Task 1 – Produktformat und Integrität

Commits: `2e8b6a2`, Korrektur `cf99ed7`.

```text
node --test tests/trainer/schema.test.js
RED nach Exportgerüst: 3/14 bestanden; 11 fehlgeschlagen, darunter die verlangte ID-Kollision.
GREEN vor Review: 15/15 bestanden.

node --test tests/trainer/schema.test.js
Reviewfix-RED: 15/17 bestanden; ungültiger Zeitstempel nach Sekunde 59 und RangeError bei 12.005 Revisionen.
Reviewfix-GREEN: 17/17 bestanden.

npm test
Final: 91/91 bestanden.
```

Die Review fand zwei wichtige Fehler in Fixture-Zeitstempeln und rekursiver DAG-Prüfung. Die Korrekturreview bestätigte beide als behoben und fand keinen neuen kritischen oder wichtigen Fehler. Konkrete Fälle: [schema.test.js](../../../tests/trainer/schema.test.js) — `fixture events remain valid when the monotonic clock crosses a minute boundary` und `a deep valid revision chain is accepted independently of descendant-first serialization`.

## Task 2 – Inhaltsfassungen und Epochen

Commits: `5e991bf`, Korrektur `4527736`.

```text
node --test tests/trainer/revisions.test.js tests/trainer/epochs.test.js
Erstes fachliches RED: 0/2 Testdateien; Module fehlten.
GREEN vor Review: 15/15 bestanden.

node --test --experimental-test-isolation=none tests/trainer/schema.test.js
Offline-Restore-RED: 17/18 bestanden.
Offline-Restore-GREEN: 18/18 bestanden.

node --test --experimental-test-isolation=none tests/trainer/revisions.test.js
Reviewfix-RED: 8/9 bestanden; __proto__ war kein eigener Feldeintrag.
Reviewfix-GREEN: 9/9 bestanden.

node --test tests/trainer/revisions.test.js tests/trainer/epochs.test.js
Final gezielt: 16/16 bestanden.

npm test
Final gesamt: 108/108 bestanden.
```

Die Review trennte den notwendigen Stale-Head-Schutz korrekt vom reinen Payload-Builder ab und fand den Sonder-ID-Fehler. Der Schutz wurde in Task 5 am serialisierten Schreibpunkt umgesetzt; die Sonder-ID-Korrekturreview bestätigte den Task-2-Fix ohne neuen kritischen oder wichtigen Fehler. Konkrete Fälle: [revisions.test.js](../../../tests/trainer/revisions.test.js) — `accepted special-key entity IDs remain enumerable own fields in every bucket`; [epochs.test.js](../../../tests/trainer/epochs.test.js) — `parallel restore heads remain a conflict without a timestamp winner`.

## Task 3 – Lernprojektion und Belohnungen

Commits: `99920da`, Korrektur `1bbd80b`.

```text
node --test --experimental-test-isolation=none tests/trainer/schema.test.js
Integrations-RED: 13/19 bestanden; alter Validator verlangte synchronisierte Kandidaten.
Integrations-GREEN: 19/19 bestanden.

node --test --experimental-test-isolation=none tests/trainer/learning.test.js tests/trainer/rewards.test.js
Erstes fachliches RED: 0/2 Testdateien; Module fehlten.
GREEN vor Review: 18/18 bestanden.
Reviewfix-RED nach Stub: 17 bestanden, 7 fehlgeschlagen.
Reviewfix-GREEN final: 25/25 bestanden.

npm test
Final gesamt: 135/135 bestanden.
```

Vier Reviewkorrekturen betrafen aktuellen Wiederholungsbedarf, Abbruch-/Bonusprojektion, einmaligen Intervallfortschritt und dauerhafte Meilensteinabstimmung. Die Korrekturreview bestätigte alle als behoben und keinen neuen kritischen oder wichtigen Fehler. Konkrete Fälle: [learning.test.js](../../../tests/trainer/learning.test.js) — `pending milestone reconciliation combines devices and preserves an intermediate mastery`; [rewards.test.js](../../../tests/trainer/rewards.test.js) — `a support-only abandonment cannot suppress an effective completion bonus`.

## Task 4 – Deterministische Runden

Commit: `49fbfb2`.

```text
node --test tests/trainer/rounds.test.js
Fachliches RED nach Platzhaltern: 0/14 bestanden.
Zusätzlicher Grenzfall-RED: 13/14 bestanden; erwartete Ausnahme fehlte.
Final gezielt: 14/14 bestanden.

npm test
Final gesamt: 149/149 bestanden.
```

Die unabhängige Review fand keinen kritischen oder wichtigen Fehler und reproduzierte zusätzlich den Übergang der zehnten Antwort bis zum vollständigen Abschluss erfolgreich. Konkrete Fälle: [rounds.test.js](../../../tests/trainer/rounds.test.js) — `new selection stays frozen and failed single word cannot bypass gap`, `expansion adds only currently assigned eligible words and keeps the chosen size` und `completion requires a full or genuinely exhausted answered round and abandonment has no payload`.

## Task 5 – Atomare Speicherung und Commands

Commit: `43e956a`.

```text
node --test --experimental-test-isolation=none tests/trainer/store.test.js tests/trainer/commands.test.js
Fachliches RED: Module commands.js und storage/store.js fehlten.
Erster GREEN-Zyklus: 17 gezielte Tests bestanden.

node --test --experimental-test-isolation=none --test-name-pattern="revision head comparison" tests/trainer/commands.test.js
Selbstreview-RED: 0/1; ProductError stale bei kompatiblen Köpfen.
Selbstreview-GREEN: 1/1 bestanden.

npm test
Final gesamt: 171/171 bestanden; 22 neue Task-5-Tests.
```

Die unabhängige Review bestätigte atomaren Fachzustand, Commit-/Lock-Grenzen, Stale-Schutz und Meilensteinabgleich ohne kritischen oder wichtigen Fehler. Konkrete Fälle: [commands.test.js](../../../tests/trainer/commands.test.js) — `serialized revisions compare expected heads after an earlier queued revision commits`, `answer, local feedback, pending ID and milestone claim share one successful save`; [store.test.js](../../../tests/trainer/store.test.js) — `a successful put request followed by transaction abort rejects and retains old state`.

## Task 6 – Einrichtung und Erwachsenenbereich

Commits: `da6eb9b`, Korrektur `86d7bb7`.

```text
node --test --experimental-test-isolation=none tests/trainer/adult.test.js tests/serve.test.js
GREEN vor Review: 13/13 bestanden.

npm test
Vor Review: 179/179 bestanden.

node --test --experimental-test-isolation=none --test-name-pattern="trainer setup" tests/browser/trainer.browser.mjs
Vor Review: 1/1 bestanden.

node --test --experimental-test-isolation=none tests/trainer/adult.test.js
Reviewfix-RED: 3/15 bestanden; 12 fehlgeschlagen.
Reviewfix-GREEN: 16/16 bestanden.

node --test --experimental-test-isolation=none --test-name-pattern="trainer setup" tests/browser/trainer.browser.mjs
Reviewfix-RED: 0/1; gültige lange Lösungsmenge scheiterte an 420 Zeichen.
Reviewfix-GREEN: 1/1 bestanden.

npm test
Final gesamt: 187/187 bestanden.
```

Die Review fand fünf wichtige Fehler bei asynchronem PIN-Sperren/Serialisieren, Setupentwurf, strukturellen Importhinweisen und Antwortlänge. Die Korrekturreview bestätigte alle als behoben und keinen neuen kritischen oder wichtigen Fehler. Der einzige kleine Semantikbefund zum verschachtelten `main` wurde später in Task 11 beseitigt. Konkrete Fälle: [adult.test.js](../../../tests/trainer/adult.test.js) — `lock invalidates setup, unlock, change and reset permission already in flight`, `parallel setup attempts serialize and only the original verifier can be replaced`; Browserfall [trainer.browser.mjs](../../../tests/browser/trainer.browser.mjs) — `trainer setup, adult decisions, persistence and BFCache lifecycle`.

## Aussagegrenze

Diese Historie belegt die damaligen automatisierten Aufgaben-Gates. Sie ersetzt weder die spätere Gesamtbranchprüfung noch reales Google Drive mit dem Produktprotokoll, zwei physische Geräte oder die Apple-Abnahme.
