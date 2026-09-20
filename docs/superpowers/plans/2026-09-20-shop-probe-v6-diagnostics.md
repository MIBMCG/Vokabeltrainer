# Diagnose 6: Ursache instabiler Lesevorgänge eingrenzen

Stand: 20.09.2026. Ein begrenzter Diagnoseschritt auf dem unveränderten v5-Kandidaten; keine Produktfunktion und kein neuer Schreibalgorithmus.

## Befund und Hypothese

Der gelieferte Diagnose-5-Bericht enthält vier bestandene und sieben gescheiterte Szenarien. Alle Fehler sind lokale Snapshot-Abbrüche: `versionChanged:true`, `jsonEtagChanged:false`. Die Serverursache ist unbekannt. Googles File-Version umfasst alle serverseitigen Änderungen, auch für den anfragenden Nutzer unsichtbare. Das aktuelle Discovery-Dokument setzt `files.get.updateViewedDate` bereits standardmäßig auf `false`; das bloße Ergänzen dieses Parameters ist daher keine belegte Lösung.

Vor einem weiteren echten Lauf muss der Bericht unterscheiden können, ob Änderungen an Inhalt/Revision oder an Zeitangaben sichtbar sind. Aus stabilen Zusatzfeldern darf keine Entwarnung abgeleitet werden. Die Schutzbedingung bleibt strikt: Version UND ETag müssen zwischen beiden Metadatenantworten gleich sein.

## Genaues Paket

- `src/shop-probe/v2-coherent-transport.js`: Die vorhandenen zwei Metadaten-GETs zusätzlich um `md5Checksum,headRevisionId,modifiedDate,lastViewedByMeDate,fileSize` erweitern. Keine weiteren Requests, Wiederholungen oder Wartezeiten. Diese Felder ausschließlich intern vergleichen, niemals Rohwerte exportieren.
- Ein interner `readSnapshot(id, readContext)` trägt bei Instabilität einen festen Kontext: `create-verification`, `snapshot-read` oder `retry-create-verification`. Die öffentliche Schnittstelle `read(id)` bleibt unverändert. `create` und `retryCreate` verwenden jeweils ihren internen Kontext.
- Der Fehlerblock nennt außerdem `readKind`: `metadata-metadata` für Ordner oder `metadata-media-metadata` für JSON-Dateien.
- Der Vergleich liefert `same`, `changed` oder `unavailable`. Nur wenn beide Werte nichtleere Strings sind, darf Gleichheit/Ungleichheit behauptet werden. Fehlende oder falsch typisierte Werte ergeben `unavailable`.
- Fest definierte Ergebnisfelder: `contentChecksumState`, `headRevisionState`, `modifiedDateState`, `viewedDateState`, `fileSizeState`. Sie ergänzen ausschließlich den bestehenden Fehlerdiagnoseblock. Zusatzdaten beeinflussen weder Bindung noch Kauf-/Schreibentscheidungen.
- `src/shop-probe/scenarios.js`: Die festen Kontext-, Lesetyp- und Vergleichsauflistungen in `safeDiagnostic` ergänzen. Die drei vorhandenen Nachlesungen im Antwortverlust-Szenario erhalten unterscheidbare, bereinigte `scenarioStage`-Werte: `response-loss-receipt`, `response-loss-after-second-write`, `response-loss-balance`. Elf Szenarien, Aufrufreihenfolge und Erfolgskriterien unverändert lassen.
- `src/shop-probe/main.js` und `shop-probe/index.html`: Diagnoseversion 6 und Download `shop-probe-bericht6.json`. Die API-Pfadangabe muss die zusätzlichen Metadatenfelder wahrheitsgemäß nennen. Keine automatische Wahl eines anderen Modus; weiterhin `v2-coherent` bewusst auswählen.
- `tests/shop-probe/v2-coherent-transport.test.js`, `scenarios.test.js` und `browser.mjs`: Zieltests, Bereinigung und tatsächlichen Download ergänzen. Fixture nur wenn zur Fehlerdarstellung nötig anpassen. Keine Trainer-, Anbieter-, Konto- oder Service-Worker-Änderung.

Vergleichslogik:

```js
function observationState(before, after) {
  if (typeof before !== 'string' || before.length === 0 ||
      typeof after !== 'string' || after.length === 0) return 'unavailable';
  return before === after ? 'same' : 'changed';
}
```

## Eine Aufgabe: Diagnose testgetrieben ergänzen

- [x] RED: Ein Fixture bildet Versionsänderung bei unveränderter starker ETag ab. Erwartungen an neuen Lesekontext und die fünf Vergleichszustände scheitern zunächst am fehlenden Diagnoseinhalt.
- [x] RED: Fehlende Zusatzfelder dürfen nicht als `same` gemeldet werden. Alle drei internen Lesekontexte, geänderte Inhaltskennung trotz stabiler ETag sowie private Marker in Zeit-/Prüfsummen-/Revisionsfeldern prüfen. Bereinigung muss Rohfelder und ungültige Enumwerte verwerfen.
- [x] GREEN: Zusatzfelder intern vergleichen und bekannte Ergebnisse ergänzen. Bestehende Versions-/ETag-Prüfungen, Fehlerklassen, If-Match-Wege und `productReady:false` bleiben unverändert.
- [x] Browser: Version/Dateiname 6 prüfen; ein instabiler Fall zeigt und exportiert die bereinigten Zustände, bleibt aber fehlgeschlagen. Alle bestehenden positiven und negativen Fälle bestehen weiterhin.
- [x] Verifikation: Zieltests, komplette Shop-Node-Suite und Shop-Browser-Harness ausführen. Dokument- und Diff-Prüfung. Keine unveränderte Produktsuite ohne neue Produkt-/Serveränderung wiederholen.
- [x] Unabhängige Prüfung von unverändertem Schutzverhalten, Diagnosewahrheit und Datenbereinigung; anschließend Umsetzung und tatsächliche Grenzen dokumentieren.
- [x] Root sichert nur die betroffenen Dateien und aktualisiert Arbeitsstand/Übergabe; kein automatischer echter Google-Lauf. Ein späterer Nutzerbericht muss ausdrücklich Diagnose 6 sein.

Abschluss: 39/39 Transport-, 15/15 Szenario-, 69/69 Shop-Node- und 10/10 Browserprüfungen bestanden. Unabhängige Review ohne offene relevante Befunde. Diagnosepaket `ac8bf43` ist gepusht und per identischer Remote-SHA bestätigt; `c857196` führt die Einstiegspunkte nach. Der echte Lauf liegt inzwischen vor: [6 bestanden, 5 fehlgeschlagen](../../reports/2026-09-20-shop-v6-reallauf.md). Der Gesamtnachweis ist nicht erreicht. Keine weitere unveränderte Probe anfordern; [Koordinationsrichtung auswählen](../../design/2026-09-20-kaufkoordination-nach-diagnose6.md).

## Auswertung des nächsten Berichts

Geänderte Inhalt-/Revisionsfelder unterscheiden sich von unveränderten sichtbaren Feldern bei trotzdem erhöhter File-Version. Keines dieser Muster beweist allein die Serverursache oder sichere Konkurrenzschreibvorgänge. Bleibt die Ursache unbestimmt, Architektur und Messstrategie neu bewerten; keine Schutzbedingung streichen und keine weiteren identischen Proben anfordern.

Primärquellen: [File v2](https://developers.google.com/workspace/drive/api/reference/rest/v2/files), [files.get](https://developers.google.com/workspace/drive/api/reference/rest/v2/files/get), [aktuelles Discovery-Dokument](https://www.googleapis.com/discovery/v1/apis/drive/v2/rest).
