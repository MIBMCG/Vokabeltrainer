# Avatar-Shop: Implementierungsplan und technische Freigabestufen

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Den bestätigten Figuren-/Ausrüstungsumfang einschließlich Halskorrektur, Galerie und sicherem Punkteshop umsetzen.

**Architecture:** Native Module, unveränderliche Lernfakten und getrennte Besitz-/Guthabenprojektion. Die unbekannte atomare Drive-Schreibfähigkeit wird zuerst in einer isolierten Probe nachgewiesen; unabhängig davon werden Katalog und echte Rasterbilder entwickelt. Ein nicht nachgewiesener Transport bleibt für Ausgaben gesperrt.

**Tech Stack:** JavaScript ES Modules, IndexedDB, Google Identity Services/Drive, Node >=22.8, Playwright/Edge, erzeugte PNG-Quellen und WebP-Ableitungen.

**Spec:** [Freigegebener Gesamtentwurf](../specs/2026-09-19-avatar-shop-design.md), Nutzer: „Ja, starte nun“ am 19.09.2026.

## Global Constraints

- 10 Punkte je richtiger Antwort, 20 je gültigem Rundenabschluss; Gesamtsumme bleibt unabhängig von Einkäufen.
- Startguthaben entspricht allen bisherigen deduplizierten Lernpunkten, ohne zusätzliches wiederholbares Geschenk.
- Neue Käufe nur online nach erfolgreichem Abgleich; keine Offline-Kaufvormerkung.
- 13 Grundfiguren, Levelbelohnungen 3/5/7/9; 30 Shop-Ausrüstungen zu 120/240/360 Punkten, acht Shop-Avatare zu 600–1.200.
- Gemeinsamer Google-Zugang und bestehender Scope bleiben. Keine neuen Anbieter, Kosten oder Änderungen am Google-Projekt.
- Kein Kauf ohne eindeutigen dauerhaften Abbuchungsbeleg; Doppelbuchung, konkurrierende Kontoerzeugung und Rücksetzung sind Pflichtfälle.
- Alte Ereignisse/Prüfsummen, Profile, Lernpunkte und Freischaltungen erhalten; kontrollierter versionierter Übergang.
- Nur Rasterillustrationen, ausgerichtete kompatible Ebenen, kleine Avatarbilder zusammen höchstens 8 MiB als Planungsbudget; größere Bilder bedarfsweise.
- Keine echten Lernstände oder Tokens in Tests/Berichten/Git. Produktserver 4173 und persönliche Browserdaten bleiben unberührt.
- Bestehender isolierter Worktree `drive-probe`, Branch `codex/vokabeltrainer-v1`; kein weiterer Checkout, kein main-Merge, keine Bereinigung alter Protokolle.

## Review Focus

1. Zwei Onlinegeräte haben Guthaben nur für einen von zwei unterschiedlichen Käufen: höchstens ein endgültiger Erfolg, kein negativer Saldo. Gehört zu Task 1 und anschließender Kaufvertrag-Integration.
2. Server nimmt Kauf an, Antwort geht verloren: dieselbe ID liefert denselben Beleg statt einer zweiten Ausgabe. Task 1.
3. Neues Gerät kennt bisherige Punkte, aber keine Käufe: niemals aus scheinbar vollem Startguthaben ausgeben, bevor das eindeutige gemeinsame Konto geprüft ist. Task 1 und Datenvertrag nach Gate.
4. Gleich benannte Ausrüstung oder Bildteile unterschiedlicher Körper: Katalogidentität und Kompatibilität entscheiden, nicht Anzeigename; Task 2/3.
5. Kleine Bilder oder Offlinefallback verlieren den Hals bzw. verdecken Gesicht/Hörner: passende freigestellte Konturen und Vorder-/Hinterlagen in tatsächlichen Kompositionen prüfen; Task 3.

## Ausführung ohne weitere pauschale Genehmigung

Der konkrete Entwurf ist jetzt ausdrücklich zur Umsetzung freigegeben. Plan erstellen, selbstprüfen und im bestätigten Umfang ausführen; keine erneute allgemeine Start- oder Methodenfrage. Die technische Unsicherheit aus Abschnitt 7/8 des Entwurfs ist ein vorgeschalteter Nachweis, kein still auszufüllender Datenvertrag. Daher werden zunächst die unabhängig ausführbaren Tasks 1–3 konkret umgesetzt. Erst der tatsächlich belegte Koordinationsmechanismus bestimmt den anschließenden detaillierten Daten-/Integrationsplan. Das ist eine fachliche Abhängigkeit, keine erneute Abstimmung bereits bestätigter Produktfragen.

## Task 1: Isolierte Kaufkoordination prüfen

**Modell:** GPT-6 Astra/high; unabhängige Review ohne Produktmitwirkung.

**Dateien:** neue `src/shop-probe/transport.js`, `src/shop-probe/scenarios.js`, `shop-probe/index.html`, `src/shop-probe/main.js`, `tests/shop-probe/transport.test.js`, `tests/shop-probe/scenarios.test.js`; gezielte statische Routen in `scripts/serve.mjs`, eigener Testbefehl in `package.json`; Bericht `docs/reports/2026-09-19-shop-vorpruefung.md`. Keine Änderungen am Produktledger.

**Schnittstellen:** `createProbeTransport({fetch, token})` mit `create`, `read`, `updateIfUnchanged`; Transportergebnisse enthalten explizit Dateiversion und Inhalt oder einen klassifizierten Fehler. `runProbeScenarios({transport, emit})` liefert `{passed, failed, unsupported, checks}`; jeder Check nennt erwartete und tatsächliche Wirkung. Kein Token im Ergebnis. Exakte HTTP-Verträge werden anhand Primärquelle und realem Verhalten festgehalten.

- [ ] Tatsächliche Drive-Annahme isolieren: Versionsheader lesbar? Schreibbedingung vom konkreten JSON-Medienendpunkt erzwungen? Denselben ursprünglichen Stand zweimal ändern; zweite Änderung muss ablehnen und darf erste nicht überschreiben. Erfolgsantwort allein genügt nicht, Inhalt erneut lesen.
- [ ] RED-Tests mit adversarialem Fake erstellen: ignorierte If-Match-Bedingung, fehlender Header, erfolgreicher Upload mit verlorener Antwort, 409 mit fremdem Inhalt, zwei Initialisierer, zwei unterschiedliche Käufe und Epochenwechsel. Die Probe muss unzureichende Garantien ausdrücklich als `unsupported`/fehlgeschlagen ausweisen.

```js
test('unconditional overwrite cannot pass the purchase capability gate', async () => {
  const result = await runProbeScenarios({transport: ignoringVersionTransport(), emit() {}});
  assert.equal(result.passed, false);
  assert.ok(result.checks.some(check => check.id === 'stale-write' && !check.passed));
});
```

- [ ] Probeimplementierung ergänzen und mit `node --test --experimental-test-isolation=none tests/shop-probe/*.test.js` prüfen. Browserseite erzeugt ausschließlich klar bezeichnete synthetische Probe-Dateien nach bewusstem Start, mit vorbereiteter öffentlicher Google-ID und gleichem Scope. Tokens ausschließlich im Arbeitsspeicher, keine lokale Speicherung persönlicher Dateien. Keine automatische Kontenanmeldung oder private Datensatzänderung.
- [ ] Echte Prüfung im autorisierten Browserpfad durchführen, soweit Anmeldung verfügbar. Wenn Nutzeranmeldung erforderlich ist, nur diese fehlende Mitwirkung anfordern und Task 2/3 fortsetzen. Fake-Grün nicht als reale Drive-Garantie ausgeben.
- [ ] Ergebnis mit exakten Grenzen dokumentieren. Erst bei bewiesener Initialisierungs-, Kauf- und Epochenkoordination den produktiven Kaufvertrag festlegen; andernfalls die kaufende Integration sperren, unabhängige Arbeit fortsetzen. Keine ungeschützte Datei als Ersatz.
- [ ] Passende Server-/Probeprüfungen, `npm run check:docs`, `git diff --check`, eigene Dateien committen und unabhängig prüfen lassen.

## Task 2: Reiner Figuren-/Ausrüstungskatalog

**Modell:** GPT-5.6 Sol/high. Eigene Verantwortung: `src/trainer/avatar/catalog.js`, `src/trainer/avatar/selection.js`, `tests/trainer/avatar-catalog.test.js`. Noch keine Referenz aus produktiv ausgelieferten Modulen; dadurch keine halbfertige Benutzeroberfläche.

**Schnittstellen:** `FIGURES`, `ITEMS`, `CATALOG_VERSION`; `figureById(id)`, `itemById(id)`, `isCompatible(itemId, figureId)`, `levelEntitlements(level)`; `normalizeSelection({figureId, skin, clothing, equipment}, {ownedFigureIds, ownedItemIds})` liefert ausschließlich gültige kompatible Auswahl. Kein Zugriff auf DOM, Drive oder gespeichertes Guthaben.

**Feste Figuren-IDs:** `explorer-girl`, `explorer-boy`, `horse`, `tiger`, `dragon`, `deer-mist`, `wolf-aurora`, `panther-shadow`, `unicorn-moon`, `griffin-storm`, `dragon-crystal`, `pegasus-star`, `phoenix`. Gruppen `human`, `equine`, `tiger`, `dragon`, `deer`, `wolf`, `panther`, `griffin`, `phoenix`. Namen, Preise und Level exakt aus dem Entwurf; keine zusätzliche Tierart.

**Katalogform:** Figuren `{id,name,group,unlock:{kind:'start'|'level'|'shop',level?,price?}}`; Gegenstände `{id,name,group,slot,unlock}`. IDs stabil und unabhängig vom deutschen Namen. Menschliche Slots `clothing/head/back/hand`, Tiere `head/body/adornment`. Menschliches Runenmedaillon belegt `head`, Sternenumhang `back`, Kristall-Kompass `hand`; Ritterrüstung `clothing`. Alte IDs werden durch eindeutige Adapterabbildung erhalten. Besitzprüfung erfolgt gegen IDs, nie nur gegen genug Punkte.

- [ ] RED: 13 eindeutige Figuren, genau acht käuflich, 30 käufliche Gegenstände, Ritter/alte Gegenstände kostenlos und alle exakten Schwellen/Preise prüfen. Unbekannte IDs oder manipulierte Felder nicht als freie Figur akzeptieren.

```js
test('shared equine equipment is portable, dragon equipment is not', () => {
  assert.equal(isCompatible('moon-head', 'horse'), true);
  assert.equal(isCompatible('moon-head', 'pegasus-star'), true);
  assert.equal(isCompatible('crystal-body', 'horse'), false);
});
```

- [ ] Minimalen Katalog und Normalisierung schreiben; keine doppelte Eigentums-/Lernprojektion. Unbekannte Figur fällt auf `explorer-boy` zurück; bekannte aber nicht besessene Figur ebenso. Unbekannte oder nicht besessene Ausrüstung wird neutral entfernt, ohne Eigentumsdaten zu verändern.
- [ ] Getrennte Körperauswahl und Ausrüstung sicherstellen: Figurwechsel soll später je Figur erinnerte Ausrüstung nutzen können, ohne hier Persistenz zu erfinden. Alte Haut-/Kleidungsbereiche 0..3/0..5 für Menschen beibehalten. Tierauswahl ignoriert menschliche Kleidungsfelder in der Darstellung, löscht aber keine gespeicherte menschliche Variante.
- [ ] `node --test --experimental-test-isolation=none tests/trainer/avatar-catalog.test.js` RED/GREEN; unabhängige Review, committen. Keine Bilder erfinden oder CSS-Platzhalter als fertige Illustration deklarieren.

## Task 3: Rasterquellen, Halskorrektur und passgenaue Ableitung

**Modell:** GPT-5.6 Sol/high für Pipeline/Darstellung; eingebautes Bildwerkzeug für die Rasterkunst. Quelle/Prompts unter `docs/design/avatar-shop-sources/`; Laufzeitbilder unter `trainer/assets/avatar-shop/`. Neue `scripts/build-avatar-art.mjs`, `src/trainer/avatar/art-manifest.js`, `src/trainer/avatar/art.js`; Tests `tests/trainer/avatar-art.test.js` und `tests/browser/avatar-art.browser.mjs`. `scripts/build-art.mjs` und Legacybilder nur gezielt für nachvollziehbare Halskorrektur verändern.

**Schnittstellen:** Manifest bildet Figur und kompatiblen Gegenstand auf ausgerichtete hintere/vordere Lagen und drei Breiten 256/512/768 ohne Hochskalieren ab. `figureLayers(selection)` liefert geordnete Bildschlüssel; `figurePicture(selection, {sizes, animations})` rendert die Auswahl ohne Datenänderung. Kleine Fallbacks explizit auflisten, alle tatsächlichen Bytegrößen berichten.

- [ ] Bestehende Hemd-/Grundbilder visuell prüfen; Fehlerdiagnose als Vorherbild festhalten. Bildwerkzeug für neue/geänderte Rasterbilder verwenden. Niemals einen Hals durch SVG/CSS-Ersatz überdecken. Jedes lokale Zielbild vor einer Bearbeitung ansehen.
- [ ] Zuerst Körpergeometrie und zwei menschliche Grundlagen auf einheitlicher transparenter Leinwand festlegen. Vier Hautfarben und sechs Kleidungsfarben bleiben unterscheidbar; Ausschnitt bleibt transparent zum passenden Hals. Kleidung darf nicht pauschal vor dem Hals liegen.
- [ ] Danach 11 tierische/mystische Grundlagen und Ausrüstung nach kompatiblen Gruppen erstellen. Für gemeinsame Pferde-/Drachenteile pro Körper passende Bildvarianten desselben Gegenstands speichern. Ein Bildtool-Aufruf je Asset/Variante; keine ungefragte kostenpflichtige API-Ausweichlösung. Herkunft und Prompts dauerhaft sichern.
- [ ] Deterministische Größenableitung erhält Alpha und Koordinaten. Keine automatische enge Bounding-Box-Normalisierung einzelner Teile, die Kopf/Körper gegeneinander verschiebt. Kein beliebiger Größenabgleich unpassender Kleidung. Paketbudget gegen reale Bytes testen.

```js
test('every allowed equipment layer has a small offline fallback', async () => {
  for (const figure of FIGURES) {
    for (const item of ITEMS.filter(item => isCompatible(item.id, figure.id))) {
      const layers = figureLayers(validOwnedSelection(figure.id, item.id));
      assert.ok(layers.length > 0);
      for (const layer of layers) assert.ok(layer.variants.some(v => v.width === 256));
    }
  }
});
```

- [ ] Kontaktbögen aller ausgelieferten kompatiblen Kombinationen erzeugen, tatsächliche Bilder öffnen und Konturen/Hals/Gesicht/Hörner/Flügel prüfen. Browserbilder nur nach `test-results/`; bewusst ausgewählte Nachweise anschließend nach Dokumentation kopieren. Handybreite, DPR2 und fehlende große Variante prüfen.
- [ ] Nachweisbericht mit Quellen-Hashes, Größen, bewusst verbleibenden Grenzen und Katalogabdeckung erstellen. Neue Galeriequellen noch nicht als produktiv ausgewählte Figuren ausgeben, bis der versionierte Auswahlvertrag integriert ist. Gezielte Pipeline-/Browserprüfungen, Review und Commit.

## Danach: produktive Integration aus belegten Verträgen

Die folgenden Lieferziele sind Teil des freigegebenen Auftrags. Ihre ausführbaren Daten-/Transport-Schritte werden aus Task 1 ergänzt; kein nicht nachgewiesener Synchronisationsmechanismus wird als bereits vorhandene Schnittstelle vorausgesetzt:

- kompatibler Formatübergang, Guthaben-/Besitzprojektion, Auswahl je Figur sowie Altclient-/Backup-/Restore-Schutz;
- bestätigte Onlinekäufe mit idempotentem Beleg und gemeinsamer Epochenkoordination;
- drei UI-Bereiche, Anprobe, Preis/Restguthaben, klare Offline-/Fehlerzustände, Darstellung auf Startkarte;
- vollständige Regression, unabhängige Gesamtreview, echte Bildschirmnachweise, Bedienung, Übergabe und GitHub-Abgleich.

Plan-Selbstprüfung: Tasks 1–3 decken technische Vorprüfung und unabhängige Katalog-/Bildarbeit aus Abschnitten 3/4/6/7/9 ab. Produktive Kaufintegration bleibt bewusst vom realen Transportnachweis abhängig. Die noch auszuarbeitenden Integrationsschritte werden nicht als ausführbarer oder abgeschlossener Plan ausgegeben. Diese Aufteilung erhält die explizite Sperre des Entwurfs und erlaubt währenddessen sinnvolle Bildarbeit.
