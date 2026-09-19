# Statistik und Abschluss Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verständliche, fachlich richtige Lernstatistiken anzeigen und die gesamte Überarbeitung am laufenden Programm prüfen und übergeben.

**Architecture:** Eine reine Statistikprojektion konsumiert die effektiven Antwortfakten und die gemeinsame Wiederholungsplanung aus B. Die Oberfläche zeigt beschriftete Diagramme und dieselben Zahlen als Tabelle. Zum Abschluss werden echte App-Ansichten mit dem Konzept verglichen; vorhandene Tests und neue Migrations-/Bedienungsfälle belegen Funktionen getrennt von der gestalterischen Qualität.

**Tech Stack:** Vorhandene ES-Module, Node-Test, CSS/zugängliches SVG für Diagramme, vorhandenes Playwright. Keine neue Grafikbibliothek oder externe Laufzeitabhängigkeit.

**Spec:** [Freigegebener Entwurf](../../design/2026-09-19-ueberarbeitung.md); [Gesamtplan](2026-09-19-ueberarbeitung.md). A und B sind Voraussetzungen.

## Global Constraints

- Statistik getrennt je Kind; keine Rohzählung ungefilterter Ledgerereignisse.
- Vier sich ausschließende Wortgruppen: „Noch neu / In Übung / Zur Auffrischung / Aus dem Üben genommen“; „Heute fällig“ separat.
- Aktuelle Wortverteilung und Antworten im ausgewählten Zeitraum ausdrücklich unterscheiden.
- Keine erfundene Lernzeit, keine Punktstrafe und keine Änderung erworbener Belohnungen.
- Zahlen, Legende und Tabelle ergänzen Diagramme; keine ausschließliche Farbcodierung.
- Tatsächliche App-Screenshots statt eines Mockups als Implementierungsnachweis.
- Eine Desktop-/WebKit-Simulation ersetzt keine physische iPhone-/iPad-Abnahme.
- Alle gemeinsamen Ausführungsregeln gelten, insbesondere synthetische Testdaten, unveränderte persönliche Browserdaten und kein Hostingauftrag.

## Review Focus

1. Wiederholter Upload und doppelte Antwortslots: Versuch und Balken zählen genau einmal, ebenso nach Wiederherstellung (C1).
2. Keine Antworten, archivierte Inhalte oder nicht mehr zugeordnetes Wort: kein irreführender 100-Prozent-Ring; historische Antworten bleiben im Zeitraum nachvollziehbar (C1).
3. Tagesgrenze, Sommerzeit und unterschiedliche Gerätezeitzonen: gespeicherter fachlicher Lerntag bestimmt den Balken, nicht die aktuelle Browserzeitzone (C1).
4. Schriftvergrößerung/kleines Display/Tastatur: Diagrammzahlen und Hauptaktion bleiben lesbar und bedienbar, hoher Bildbedarf verdrängt keine Texte (C2).
5. Offline-Neustart nach Wechsel von Bildgröße oder App-Version: kleine Bilder bleiben nutzbar und offene Runden/Entwürfe werden durch ein Update nicht verworfen (C2).

## C1: Gemeinsame Statistikprojektion und zugängliche Diagramme

**Files:** Neu `src/trainer/learning/statistics.js`, `src/trainer/ui/statistics.js`, `tests/trainer/statistics.test.js`. Ändern `src/trainer/ui/adult.js`, `src/trainer/commands.js`, `trainer/styles.css`, `tests/browser/overhaul.browser.mjs`, `scripts/serve.mjs`, `trainer/sw.js`, `docs/BENUTZUNG.md`.

**Interfaces:**

- Konsumiert `effectiveAnswers(ledger)`, `currentPolicy(ledger,profileId)`, `projectSchedule({ledger,profileId,policy,day})` aus B2 sowie `project(ledger)` und `addDays(day,amount)`.
- Konsumiert die in A2 exportierten gemeinsamen Helfer `activeWords(projection,profileId)` und `previewModes({projection,profileId,day,schedule})`. Keine zweite Interpretation von archivierten, zugeordneten oder konfliktbehafteten Wörtern.
- Produziert `learningStatistics({ledger,profileId,day,days=14}) -> {summary,buckets,daily,dueCount,wordCount,epochConflict}`. `days` ist 14 oder 30, andere Werte erzeugen `ProductError('invalid', ...)`. `summary` enthält `{attempts,correct,wrong,accuracy}`; accuracy ist null ohne Antworten, sonst Prozentzahl 0–100. `buckets` enthält `{new,learning,review,excluded}` als nichtnegative ganze Zahlen. `daily` enthält genau days Objekte `{day,correct,wrong}`, aufsteigend einschließlich heute, auch bei null Antworten.
- Produziert `renderStatistics({root,state,commands,profileId,onRefresh})`. Der Renderer nutzt die Datensatzzeitzone und dieselbe injizierte Tagesquelle wie `practiceChoices`; dazu ergänzt Commands `statistics({profileId,days})` als reinen Aufruf der Statistikprojektion. Kein Ereignis beim Ändern des Zeitraums.

**Zählvertrag:** Die Wortgruppen beziehen sich auf die aktuell zugeordneten, aktiven, konfliktfrei lesbaren Wörter des Kindes. Priorität: excluded; sonst niemals beantwortet=new; sonst aktueller Schedule mit intervalIndex>=0=review; sonst learning. Reaktivierung macht ein früher beantwortetes Wort damit zu learning, nicht new. Fehlende Schedulingzustände werden mit dem gleichen Standard wie im Scheduler behandelt. Die Summe der Gruppen entspricht wordCount. dueCount stammt aus availableCount der all-Vorschau, zählt ausgeschlossene Wörter nicht nochmals und wird als „Jetzt zum Üben verfügbar“ erklärt.

Antwortsummen und Tagesbalken beziehen sich dagegen auf alle effektiven, deduplizierten Antworten dieses Kindes innerhalb `[addDays(day,1-days), day]`, einschließlich inzwischen archivierter/nicht mehr zugeordneter Wörter. Diese Abweichung vom aktuellen Wortbestand direkt erklären. Unterstützende und nicht übernommene alte Epochenereignisse zählen nicht. Bei Epochenkonflikt keine scheinbar gültige Gesamtstatistik anzeigen, sondern dieselbe Konfliktklärung wie im Produkt. Bei konfliktbehafteten Wortfassungen erklären, dass sie nicht im aktuellen Wortbestand enthalten sind.

- [ ] **1. RED der Null-/Zählfälle schreiben.** Neue Tests verwenden `createFixture` und neue imports, darunter:

```js
const f = createFixture();
const empty = learningStatistics({ledger:f.base,profileId:'p1',day:'2026-09-17',days:14});
assert.deepEqual(empty.summary,{attempts:0,correct:0,wrong:0,accuracy:null});
assert.deepEqual(empty.buckets,{new:3,learning:0,review:0,excluded:0});
assert.equal(empty.daily.length,14);
assert.equal(empty.daily.at(-1).day,'2026-09-17');
const ledger = f.withEvents(f.roundStarted,
  f.answer({id:'a1',ordinal:1}), f.answer({id:'a2',ordinal:2,correct:false}));
const result = learningStatistics({ledger,profileId:'p1',day:'2026-09-17',days:14});
assert.deepEqual(result.summary,{attempts:2,correct:1,wrong:1,accuracy:50});
assert.deepEqual(result.daily.at(-1),{day:'2026-09-17',correct:1,wrong:1});
assert.equal(Object.values(result.buckets).reduce((a,b)=>a+b,0),result.wordCount);
```

`node --test tests/trainer/statistics.test.js` ausführen und fachlich fehlende Implementierung als RED festhalten.
- [ ] **2. Reine Projektion implementieren.** Aktuellen Wortbestand aus gemeinsamen Helfern, Scheduling aus aktueller Policy und Antwortdaten aus effectiveAnswers bilden. Tagesreihe vorab mit addDays füllen und über Map nach Lerntag zuordnen. Kein `new Date(event.occurredAt).getDate()` zur Balkenzuordnung. Kern der Aggregation:

```js
for (const event of effectiveAnswers(ledger)) {
  if (event.payload.profileId !== profileId) continue;
  const bucket = byDay.get(event.day);
  if (!bucket) continue;
  bucket[event.payload.correct ? 'correct' : 'wrong'] += 1;
}
const attempts = correct + wrong;
const accuracy = attempts === 0 ? null : 100 * correct / attempts;
```

Das Prozentformat wird erst in der Ansicht gerundet. Summen müssen mit der zugänglichen Tabelle exakt übereinstimmen.
- [ ] **3. Randfälle GREEN prüfen.** Gleiche IDs/wiederholte Übertragung und konkurrierende gleiche Antwortslots mit unterschiedlichem correct, anderes Profil, gestern/heute/außerhalb des Zeitraums, gespeicherter Lerntag abweichend vom UTC-Datum, Archivierung, Entzug der Zuordnung, neue Lernfassung, Reaktivierung, Support-only-Snapshot und nicht übernommene alte Antworten. Bestehende Restorefixtures verwenden, keine handgebauten ungültigen Ledgerobjekte als scheinbaren Erfolgsfall. Regeln speichern verändert keine Versuchs-/Punktsumme. Alle vier Statusgruppen in einem synthetischen Bestand prüfen; nicht endlos kreisende 0/0-Werte.
- [ ] **4. Ansicht implementieren.** Kind/Zeitraum sichtbar, drei Kennzahlen „Antworten“, „Richtig“, „Trefferquote“, Ring mit direkt beschrifteten Gruppen und gestapelte Tagesbalken richtig/falsch. SVG darf Diagramme zeichnen; keine Diagrammbibliothek. Jeder Balken erhält textliche Werte, darunter aufklappbare echte Tabelle mit th/caption. Leere Statistik erklärt „Noch keine Antworten in diesem Zeitraum“; 0 wird nicht versteckt. Profil-/Lektionstexte ausschließlich als textContent einsetzen. Keine Lernzeit-Kennzahl. Ein fester Bildbereich verhindert Layoutsprünge, lange Beschriftungen umbrechen.
- [ ] **5. Browserprüfung und Commit.** Neuer Browserfall wechselt Kind und 14/30 Tage, vergleicht Kennzahlen/Legende/Tabelle mit synthetischen Antworten, bedient per Tastatur und prüft schmale Ansicht. `node --test tests/trainer/statistics.test.js` und passende Fälle aus `tests/browser/overhaul.browser.mjs` GREEN. Route/Offlineassets ergänzen. Commit `feat: add accessible learning statistics from effective answers`.

## C2: Tatsächliche Gesamtprüfung, visuelle Korrektur und portable Übergabe

**Files:** `tests/browser/overhaul.browser.mjs`, betroffene bestehende Tests; neue tatsächliche Bildnachweise unter `docs/design/2026-09-19-ueberarbeitung-app/`, neuer Bericht `docs/reports/2026-09-19-ueberarbeitung.md`. Aktualisieren `AGENTS.md`, `START-HIER.md`, `ARBEITSSTAND.md`, `docs/handoffs/2026-09-19-ueberarbeitung.md`, `docs/BENUTZUNG.md`, `docs/PRODUKT-DATENFORMAT.md`, `docs/GOOGLE-DRIVE-EINRICHTUNG.md`, `docs/QUALITAET-UND-ABNAHME.md`, `tests/browser/README.md`. Produktkorrekturen nur für konkrete Befunde des freigegebenen Umfangs.

**Interfaces:** Verwendet das bestehende `createTrainerHarness()` mit `newDevice`, `newPersistentDevice`, `stopServer`, `setServiceWorkerVersion`, `close`; keine persönlichen Browserprofile. Diagramme aus C1, Rundenverträge aus B und Bilder aus A werden gemeinsam geprüft.

- [ ] **1. Tatsächliche Ansichten erzeugen.** Gleicher synthetischer Lernstand bei Start, richtiger/falscher Antwort, Reise, Avatar, Vokabelverwaltung, Lernregeln und Statistik. Desktop 1280×900, Telefon 390×844, eng 320×568 und Querformat 844×390; 200 Prozent Schriftgröße und hoher Pixelquotient als gesonderte Browserkonfiguration. Bilder mit view_image öffnen, gegen das freigegebene Konzept vergleichen und konkrete Differenzen dokumentieren. Keine Behauptung „wie Konzept“ allein aus einem DOM-Test ableiten.
- [ ] **2. Visuelle Befunde beheben.** Schwerpunkt: zusammenhängender Malstil, Avatarteile ohne sichtbare Sprünge/weiße Ränder, Proportionen und Textkontrast, klarer erster Schritt, keine verdeckte Eingabe/Hauptaktion, genügend Touchfläche. Alle vier Hauttöne, sechs Kleidungsfarben und sechs Ausrüstungsteile sichtbar kombinieren; gesperrte Teile bleiben verständlich. Nach betroffenen Korrekturen die jeweilige echte Ansicht neu erzeugen. Keine Erweiterung um neue Inseln, Gegenstände oder Belohnungen.
- [ ] **3. Integration an realem Browserzustand prüfen.** V1-IndexedDB mit offener Runde und ausstehendem Paket über die vorhandene Testharness kontrolliert anlegen; Appwechsel nach v2, Neustart und fortgesetzte Antwort prüfen. Versionsfehler/Savefehler erhält den Originalstand. Zwei simulierte Geräte: Regeländerung bei aktiver Runde, Reset mit später alter Antwort, wiederholter Abgleich, Restore mit Supportreferenzen und gleiche Projektionen nach beiden Ankunftsreihenfolgen. Nur synthetische Daten und simulierte Google-Grenzen.
- [ ] **4. Offline-/Bild-/Updatefälle prüfen.** Eine Größe online laden, danach Netz sperren und größere Ansichtsgröße wählen: hochauflösender Fehler fällt einmalig auf vorab gecachte Basis zurück. Testkern nach normalem Einrichten des Gerätefixtures:

```js
await context.setOffline(true);
await page.setViewportSize({width:1280,height:900});
await page.reload();
const images = page.locator('[data-art-key] img');
for (let index=0;index<await images.count();index+=1) {
  await images.nth(index).evaluate(image => image.decode());
  assert.ok(await images.nth(index).evaluate(image => image.naturalWidth > 0));
}
```

Das Bild-DOM aus A1 erhält den stabilen data-art-key-Marker. Prüfen: kein Endlosfehler, kein Löschen fremder Caches, Unterpfad `/repo/trainer/` bleibt offline nutzbar. Update während Antworttext, Rückmeldung, Elternentwurf und PIN-Sperre bewahrt jeweils den bestehenden Schutz; Installationsfehler des neuen Grundpakets lässt alten Worker nutzbar. Basisdownloadbytes und bedarfsweise große Dateien im Bericht messen.
- [ ] **5. Frische vollständige Prüfung nach letztem Produktfix.** `npm test`, `node --test tests/browser/trainer.browser.mjs`, `node --test tests/browser/overhaul.browser.mjs`, `npm run check:docs`, `git diff --check`. Laufumgebung und tatsächliche Ergebnisse dokumentieren. Die unveränderte technische Probe nur bei geänderten gemeinsam verwendeten Abhängigkeiten wiederholen. Eine echte Anmeldung oder physische iOS-Abnahme nicht aus den Mocks ableiten.
- [ ] **6. Unabhängige Abschlussreview gemäß gewählter Ausführung.** Review gegen Gesamtentwurf, U01–U07, drei Teilpläne, tatsächlichen Diff und Prüfbelege. Schwerpunkt Hash-/Versionskonstanz, Runden-Snapshots, Restoreabhängigkeiten, Entwurfsschutz, Bildfallback und wahrheitsgemäße Cloudanzeige. Befunde nachvollziehbar beheben und genau die dadurch betroffenen Prüfungen erneut ausführen; erforderliche Gesamtverifikation nach Produktfix aktualisieren.
- [ ] **7. Bedienung und Übergabe aktualisieren.** Anleitungen zeigen die neue Google-Verbindung ohne normale Client-ID-Eingabe, erklärte Modi, Wortverwaltung, Regeln je Kind und Statistiken. Betreiberaufgaben/Altclientgrenzen, Mindestversion, Quelldateien/Bildableitung, tatsächliche Prüfungen und offene echte Geräteabnahme getrennt dokumentieren. Kein „fertig“ für ausstehende Apple-/Drive-Realmatrix und kein neuer Hostingauftrag.
- [ ] **8. Commit, Push und Remote-Nachweis.** Exakte eigene Dateien stagen, Abschlusscommit anlegen, ausschließlich `codex/vokabeltrainer-v1` pushen. Anschließend `git rev-parse HEAD` und `git ls-remote origin refs/heads/codex/vokabeltrainer-v1` vergleichen. Branch, überprüfte SHA und verbleibende Grenzen in der Abschlussantwort nennen. Kein Merge nach main, kein Force-Push.
