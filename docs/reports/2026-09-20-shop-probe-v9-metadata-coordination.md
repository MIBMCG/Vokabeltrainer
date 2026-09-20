# Umsetzung: Shop-Probe Diagnose 9 – Metadatenkoordination

Stand: 20.09.2026. Ausgangspunkt `85ee32a9edcaa4bdd97653945161fb5556053ff9` auf `codex/vokabeltrainer-v1`.

## Ergebnis

Der neue Prüfumfang `metadata-coordination` ist ausschließlich im getrennten Shop-Probewerkzeug umgesetzt. Er erzeugt einen neuen synthetischen Rootordner und je einen eigenen Unterordner für falsche, verbrauchte und konkurrierende Schreibkennungen. Es werden keine JSON-Dateien erzeugt, keine Medien geladen, keine Produktdaten gelesen und keine Löschungen ausgeführt. `productReady` bleibt immer `false`.

Der v2-Transport besitzt dafür drei ausdrücklich begrenzte Methoden:

- `createMetadataFolder` reserviert eine ID, legt einen Ordner über Drive v3 an, konsumiert und bindet die Erfolgsantwort und bestätigt die Anlage mit einem strikten Metadatensnapshot.
- `readMetadataSnapshot` führt exakt zwei gebundene Drive-v2-Metadatenabrufe mit `cache: 'no-store'` aus. Unterschiedliche Version oder ETag geben keinen schreibfähigen Snapshot frei.
- `updateMetadataIfUnchanged` erhält vorhandene private Properties und die App-/Laufbindung, verwendet die ursprüngliche starke ETag als `If-Match`, konsumiert jede Antwort vollständig und bindet einen 2xx-Erfolgsbody an die erwartete ID. HTTP-Statuswerte bleiben auch bei nachgelagerten Parse-, Binding- und Nachlesefehlern als bereinigte Beobachtung erhalten.

Nicht erfolgreiche Antwortkörper werden vollständig konsumiert und danach verworfen. Berichtsdaten enthalten nur feste Checkpoints, Phasen, Rollen, Ergebnisklassen, Vergleichsklassen und gültige HTTP-Statuswerte. IDs, ETags, Propertywerte, Header, Antwortkörper und rohe Fehler werden nicht exportiert.

## Vier Checks

1. `fixture`: Rootordner anlegen und mit zwei stabilen Metadatenantworten bestätigen. Nur ein Fehlschlag dieser Fixture stoppt den Umfang.
2. `metadata-invalid-token`: eine garantiert verschiedene starke ETag senden und nur bei HTTP 412 sowie vollständig unveränderten Properties bestehen.
3. `metadata-stale-write`: Gewinner samt Sentinel bestätigen, danach denselben alten Snapshot erneut verwenden und nur bei HTTP 412 sowie unverändertem Gewinner bestehen. Ohne bestätigten ersten 2xx-Stand wird kein zweiter PUT gesendet.
4. `metadata-concurrent`: Sentinel bestätigen, anschließend zwei PUTs aus demselben frischen Snapshot gleichzeitig senden und nur bei genau einem bestätigten 2xx, genau einem HTTP 412 und vollständigem Gewinner-Readback bestehen.

Ein fehlgeschlagener Zielcheck verhindert die beiden späteren Zielchecks nicht. Jeder Zielcheck verwendet einen eigenen Unterordner. Ein Nachlesefehler verdrängt bereits gemessene Schreibantworten nicht.

## Oberfläche und Bericht

Die Oberfläche zeigt Diagnoseversion 9 und die Auswahl **„Ordner-Koordination gezielt prüfen“**. Dieser Umfang verlangt ausdrücklich `Drive v2 kohärent (Koordination)`; eine falsche Kombination wird vor jedem Drive-Aufruf erklärt und nicht automatisch geändert. Während eines Laufs bleiben Quelle und Umfang gesperrt.

Der Download heißt `shop-probe-bericht9.json`. Sein Pfadkatalog enthält für `metadata-coordination` nur tatsächlich mögliche Ordner-Anlage-, Metadatenlese- und Metadaten-PUT-Pfade. Ergebnistext und umfangsspezifische Grenzen sagen ausdrücklich, dass diese reine Metadatenprobe weder einen Kaufvertrag noch eine Zwei-Geräte-Garantie nachweist und keinen Antwortverlust prüft.

## TDD- und Prüfnachweise

Die Rohlogs liegen ignoriert unter `.superpowers/sdd/2026-09-20-shop-probe-v9-metadata-coordination/`.

- Transport RED: 7/7 neue Fälle scheiterten an den noch fehlenden V9-Methoden (`red-transport.log`).
- Transport GREEN: zunächst 7/7, nach Reviewhärtung zusätzlich der zuvor rote `null`-Body-Fall für POST und PUT 2/2 grün (`green-transport.log`, `red-null-body.log`, `green-null-body.log`).
- Szenarien RED: fünf neue Verhaltensfälle scheiterten am noch unbekannten Umfang; der separate Unsupported-Guard war bereits grün (`red-scenarios.log`).
- Szenarien GREEN: 8/8 fokussierte V9-Fälle bestanden (`green-scenarios.log`). Dazu gehören ignoriertes `If-Match`, reine Versionsdrift, 412 mit veränderten Properties, fehlender Erfolgsstatus, Nachlesefehler nach beobachteter 412, unabhängige Folgechecks und fehlende Root-Fixture.
- Browser RED: nach Verwendung der dokumentierten portablen Werkzeugpfade scheiterten 4/4 Fälle am fehlenden vierten Scope-Eintrag (`red-browser.log`).
- Browser GREEN: 4/4 fokussierte V9-Fälle bestanden (`green-browser.log`).
- Vorabregression der direkt betroffenen Node-Dateien: 112/112 bestanden (`prefinal-focused-node.log`).
- Die unabhängige Abschlussreview ist [ohne offene relevante Befunde](2026-09-20-shop-probe-v9-review.md) abgeschlossen. Der dabei gefundene `null`-Body-Fall war zuvor bereits mit eigenem RED/GREEN geschlossen worden.
- `npm run test:shop-probe`: **127/127 bestanden**, Exitcode 0 (`final-node.log`).
- `npm run test:shop-probe:browser`: **20/20 bestanden**, Exitcode 0 (`final-browser.log`). Verwendet wurden Node.js 22.23.2, Playwright 1.62.1 aus dem dokumentierten portablen Werkzeugpfad und System-Edge 153.0.4234.48 mit isolierten temporären Testprofilen.

Beide vollständigen Shop-Suiten liefen nach der Review genau einmal auf dem eingefrorenen Code. Die unveränderte Trainer-Gesamtregression wurde entsprechend dem begrenzten Diagnoseplan nicht wiederholt.

## Grenzen

Alle automatisierten Prüfungen verwenden synthetische Fixtures und einen isolierten Browserkontext. Es gab keinen echten Google-Aufruf durch die Agenten. Ein späterer echter grüner Lauf kann nur die Ordner-Metadaten-CAS-Beobachtung in einem Browser stützen. Unveränderliche Inhaltsverweise, Wiederanlauf nach Antwortverlust, verwaiste Kandidaten, Epochen, Produktkäufe und Verhalten auf zwei physischen Geräten bleiben außerhalb dieses Pakets.
