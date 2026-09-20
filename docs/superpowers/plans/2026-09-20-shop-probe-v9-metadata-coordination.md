# Diagnose 9: Metadatenkoordination ohne Inhaltsabruf

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Ein begrenztes Diagnosepaket innerhalb der bestätigten Richtung C; keine neue Produktarchitektur.

**Goal:** Falsche, verbrauchte und konkurrierende Schreibkennungen ausschließlich an synthetischen Ordner-Metadaten prüfen.

**Architecture:** Explizite neue Methoden am isolierten v2-Probe-Transport; bestehende Transportpfade und Snapshot-Guards bleiben unverändert. Neuer Umfang `metadata-coordination` mit vier Checks, nur bei `v2-coherent`.

**Tech Stack:** JavaScript-Module, vorhandener Node-Test-Runner und synthetische Browser-Fixtures; keine neue Abhängigkeit.

**Spec:** [Befund und begründete Folgeuntersuchung](../../reports/2026-09-20-shop-v8-reallauf.md), [bestätigte Richtung C](../../design/2026-09-20-kaufkoordination-nach-diagnose6.md). Der folgende Messvertrag präzisiert das Diagnosepaket.

## Global Constraints

- Nur eigene neue synthetische Ordner, keine JSON-Datei, kein Medienabruf, kein Produktbestand, kein DELETE.
- Keine Retries oder Wartezeiten; exakte Versions- UND ETag-Stabilität bleibt Pflicht.
- Bestehende drei Umfänge, Quellen, normale Lese-/Schreibmethoden und Standardauswahl `full` unverändert.
- Nur bereinigte Klassen/Statuswerte/Booleans exportieren, niemals IDs, ETags, Propertywerte, Header oder rohe Fehler.
- `productReady:false` immer; weder Produktshop noch Backend-/Punktewechsel.
- Keine Agentenaufrufe gegen echtes Google; der Nutzer führt die neue Probe bewusst aus.

## Messvertrag und Schnittstellen

Nur am v2-Transport:

```js
createMetadataFolder({parentId = null, name = 'SYNTHETISCH'} = {}) // Promise<{id}>
readMetadataSnapshot(id) // zwei gebundene v2-Metadaten-GETs, cache:'no-store'
updateMetadataIfUnchanged(before, properties) // gebundener v2-Metadaten-PUT mit originalem If-Match
```

Interne vorhandene Helfer dürfen gemeinsame Bindungs-/Bodylogik kapseln; normale öffentliche Methoden behalten ihr Verhalten. Ordneranlage reserviert eine neue ID, sendet v3-POST, konsumiert die Erfolgsantwort vollständig und prüft deren ID. Ihre Nachlese und alle späteren Snapshots bestehen aus exakt zwei v2-Metadaten-GETs mit `no-store`; keine Medienanfrage. Jeder GET prüft eigene ID, Name, MIME, Eltern, app/run-Bindung, Trashed-Status, gültige Version und starke ETag. Version oder ETag verschieden: fail closed, kein Snapshot.

Metadaten-PUT übernimmt unveränderte Properties und app/run-Bindung. Er liest den Erfolgsbody vollständig und bindet die zurückgegebene ID; danach folgt im Szenario trotzdem eine unabhängige strikte Nachlese. Fehlerbody wird vollständig konsumiert und anschließend verworfen, nicht exportiert. HTTP-Status bleibt auch bei einem späteren Parse-/Binding-/Nachlesefehler erhalten. Ein Status 2xx allein gilt bei fehlerhaftem Body nicht als erfolgreich bestätigter Schreibvorgang. Kein Antwort-ETag ersetzt die Nachlese, kein erneutes Token vor dem PUT.

Vier Checks, erster Rootordner, danach je eigener Unterordner, damit frühere Fehlschläge spätere Messungen nicht verfälschen. Nur eine fehlende Root-Fixture beendet den Umfang; nach einzelnen fehlgeschlagenen Zielchecks werden die übrigen unabhängig durchgeführt:

1. `fixture`: Rootordner erzeugen/streng nachlesen. Bei fehlender Fixture stoppen.
2. `metadata-invalid-token`: Snapshot; aus dessen starker ETag durch Einfügen eines `x` vor dem abschließenden Anführungszeichen eine garantiert verschiedene starke ETag bilden. PUT setzt kleinen synthetischen `coordinator`-Marker. Unabhängig vom Schreibausgang streng nachlesen. Erfolg nur bei `stale` UND HTTP 412 UND vollständig gleichen Properties (unabhängig von Schlüsselreihenfolge).
3. `metadata-stale-write`: aktueller Snapshot setzt `coordinator:'first'` plus `sentinel:'preserve-me'`; Nachlese muss exakt den gemergten Properties entsprechen. Erst dann denselben alten Snapshot mit `coordinator:'stale'` wiederverwenden. Erfolg nur bei bestätigtem erstem 2xx, zweitem HTTP 412 und weiter unverändertem Gewinner samt Sentinel. Bei fehlerhaftem erstem Ergebnis/Nachlese keinen zweiten PUT, bisherige Beobachtungen erhalten.
4. `metadata-concurrent`: eigener Ordner, Sentinel zunächst setzen und streng bestätigen. Zwei gleichzeitige PUTs aus demselben frischen Snapshot mit verschiedenen `coordinator`-Markern. Erfolg nur bei exakt einem bestätigten 2xx und einem `stale`/HTTP 412; streng nachgelesener kompletter Properties-Stand muss dem angenommenen Gewinner entsprechen und den Sentinel erhalten. Nachlese auch bei unerwarteten Schreibausgängen versuchen; dann trotzdem kein Erfolg.

Jeder Zielcheck exportiert einen eigenen festen Checkpoint, `cacheMode:no-store`, eine feste Phase, maximal drei Schreibbeobachtungen (feste Rollen, Ergebnisklasse, optional HTTP-Status 100–599) und maximal zwei Nachlesebeobachtungen (feste Rollen, Ergebnis-/Gleichheitsklasse, optional HTTP-Status). Keine rohen Objekte. Alle Eingänge werden whitelist-bereinigt. Ein späterer Fehler darf bereits gemessene Schreibantworten nicht verdrängen. Erst erfüllte vollständige Checks dürfen grün werden; fehlender Status, fehlende Nachlese, falsche Klasse oder widersprüchliche 412/2xx-Kombination bleibt fehlgeschlagen.

## Aufgabe 1: Begrenzte Implementierung mit Tests

Dateien: `src/shop-probe/v2-coherent-transport.js`, `src/shop-probe/scenarios.js`, `src/shop-probe/main.js`, `shop-probe/index.html`, vorhandene Tests/Fixtures unter `tests/shop-probe/`. Keine neuen Runtime-Module. Implementierungsbericht: `docs/reports/2026-09-20-shop-probe-v9-metadata-coordination.md`. Root besitzt Realbericht, Plan und Einstiegs-/Übergabedokumentation.

- [x] **RED:** Transporttests gegen die vorhandene v2-Fixture: Metadaten-only-Anlage/-lesen/-PUT, exakte no-store-GETs, ursprüngliche If-Match-Übernahme, vollständig konsumierte Antwort und ID-Bindung, erhaltene Properties. Reine Versionsänderung zwischen Metadatenlesungen muss weiter vor jedem PUT scheitern; ungültige/fremde Bindung und MIME ebenso.
- [x] **RED:** Szenariomodell im gesunden Fall vier grüne Checks; ignoriertes `If-Match` muss alle drei Zielchecks rot machen. Nachlesefehler nach PUT muss HTTP-Ergebnis im Bericht erhalten. Zusätzlich 2xx mit falscher Create-/PUT-ID, Bodyfehler, 412 mit verändertem Inhalt, fehlender Status, unbekannte Quelle vor HTTP und geheime Marker in Fehlerobjekten prüfen.

Beispiel des Kernvertrags (in bestehende Test-Fixture integrieren):

```js
const result = await runProbeScenarios({ transport, probeScope:'metadata-coordination' });
assert.equal(result.checks.length, 4);
assert.equal(result.productReady, false);
assert.equal(result.passed, true); // nur gesunde Fixture
assert.equal(requests.some(({url}) => url.includes('alt=media') || url.includes('/upload/')), false);
```

- [x] **GREEN:** Obigen Vertrag minimal umsetzen. Strukturierte Beobachtungen vor jeder späteren Abbruchstelle bewahren; Statuscode und Ergebnis getrennt speichern. Keine bestehenden Guards abschwächen.
- [x] **Browser:** Auswahl **Ordner-Koordination gezielt prüfen**, benötigt `v2-coherent`. Falsche Kombination vor Dateianlage erklären, keine automatische Quellenänderung. Sichtbar Diagnose 9, Export `shop-probe-bericht9.json`, `diagnosticVersion:9`. Ergebnistext und Berichtslimits benennen reine Metadatenprobe und weiterhin fehlende Kauf-/Zwei-Geräte-Garantie. Alter vollständiger Lauf 11, alte Teilumfänge jeweils 2 Checks. Während Lauf alle Auswahlen gesperrt.
- [x] **GREEN-Verifikation:** `npm run test:shop-probe`, `npm run test:shop-probe:browser` auf finalem Code, Rohlogs ignoriert. `npm run check:docs`, `git diff --check`. Keine unveränderte Trainer-Gesamtregression.
- [x] **Review:** Unabhängige Spezifikations-/Codeprüfung anhand Diff, Plan und Testbericht; gezielte Fixes erneut prüfen.
- [ ] **Abschluss:** Root aktualisiert Einstieg/Übergabe, commit/push im beauftragten Umfang, Remotevergleich. Bericht 8 abgeschlossen; keinen identischen 8er-Lauf erneut anfordern.

## Grenzen und nächster echter Lauf

Kein belastbarer Nachweis aus automatisierten Fixtures für Googles Verhalten. Ein grüner echter 9er-Lauf stützt allein Ordner-Metadaten-CAS in einem Browser. Pointer auf unveränderlichen Inhalt, Wiederanlauf nach Antwortverlust, zurückgebliebene Kandidaten, Epochen und Zwei-Geräte-Verhalten benötigen danach einen gesonderten Entwurf/Nachweis. Scheitert ein tatsächlich erreichter verbrauchter Token oder Parallelversuch, ist dies negative Evidenz gegen diesen direkten Koordinationskandidaten; nicht mit Wiederholungen bis zu einem grünen Ergebnis verdecken.
