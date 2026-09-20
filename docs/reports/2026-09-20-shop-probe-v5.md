# Lokaler Prüfbericht: Shop-Probe v5

Stand: 20.09.2026. Dieser Bericht belegt ausschließlich den lokalen, synthetischen Kandidaten `v2-coherent`. Es gab keinen Zugriff auf Google Drive und keinen REAL-Lauf. `productReady` bleibt `false`; Produkttrainer und Produktdatenformat wurden nicht geändert.

## Umgesetzter Kandidat

- Eine eigene Transportdatei verwendet Drive v3 nur zum Reservieren einer Datei-ID und zum Anlegen der synthetischen Ordner beziehungsweise JSON-Dateien.
- Alle koordinierten Metadaten- und Inhaltslesungen laufen über Drive v2. Vor und nach dem Inhaltsabruf werden sowohl die dezimale v2-Version als auch die starke v2-ETag verglichen.
- Bedingte Inhalts- und Ordnermetadaten-Schreibvorgänge verwenden v2-`PUT` und reichen die ETag des übergebenen Snapshots unverändert als `If-Match` weiter. Vor dem Schreiben wird kein neuer Token gelesen.
- Die Bindung prüft eigene Sitzungs-ID, Datei-ID, Titel, MIME-Typ, Papierkorbstatus, Elternbezug und ausschließlich private, eindeutige String-Properties. Der vom v3-Create automatisch gesetzte My-Drive-Parent wird beim ersten gültigen v2-Read gebunden; Kinddateien müssen exakt im eigenen Probeordner liegen.
- Diagnoseversion 5 nennt v3-Anlage und v2-Koordination getrennt. Der Download heißt `shop-probe-bericht5.json`. Die drei Legacy-Modi behalten ihre bisherigen v3-GET-/PATCH-Wege; `v2-json` liest weiterhin nur seine Versionskennung über v2.
- Der lokale Server liefert das neue Modul ausdrücklich aus. Die Produktoberfläche unter `trainer/` importiert oder verwendet den Probe-Code nicht.

## Testgetriebene Nachweise

Vor der Implementierung scheiterten die 21 neuen Transportfälle erwartungsgemäß am unbekannten Modus `v2-coherent`. Der neue Browservertrag scheiterte anschließend erwartungsgemäß an nur drei statt vier auswählbaren Modi; der Serververtrag meldete für das neue Modul erwartungsgemäß HTTP 404. Ein realistischer Standard-Parent im v2-Fixture deckte außerdem die unzulässige Annahme eines parentlosen My-Drive-Ordners auf. Die fokussierten Tests wurden erst nach den jeweiligen Korrekturen grün.

Die lokalen Gegenproben decken einzeln ab:

- ignoriertes Content-`If-Match` und ignoriertes Metadata-`If-Match` mit jeweils zwei angenommenen Konkurrenzschreibvorgängen;
- eine `412`-Antwort, die den Inhalt trotzdem verändert;
- Änderung nur der v2-Version beziehungsweise nur der v2-ETag während eines Snapshots;
- falsche ID, falschen Titel, falschen MIME-Typ, falschen Kind-Parent, v3-förmige Parents, Papierkorbstatus und fehlende Labels;
- fehlende, falsche oder öffentliche `app`- und `runId`-Properties sowie doppelte normale und besondere Property-Schlüssel;
- fehlende, schwache und fehlerhafte ETags einschließlich Leer- und Steuerzeichen;
- nicht-stringförmige Metadatenwerte, fremde IDs und das unveränderte Weiterreichen einer absichtlich falschen starken ETag.

Ein grüner Fake belegt nur, dass die Probe diese Fehler lokal erkennt. Bei erfolgreichen Konkurrenzszenarien exportiert der Bericht weiterhin keine zusätzlichen Zähler; der bestandene Szenariostatus belegt die vorhandenen unveränderten Assertions.

## Frische lokale Prüfung

Umgebung: Node.js 22.23.2, Playwright 1.62.1 und System-Edge 153.0.4234.48. Der Browserlauf verwendete ausschließlich frische synthetische Browserkontexte und simulierte Google Identity Services sowie Drive-HTTP.

- `node --test --experimental-test-isolation=none tests/shop-probe/v2-coherent-transport.test.js`: **31/31 bestanden**.
- `npm run test:shop-probe`: **56/56 bestanden**.
- `npm run test:shop-probe:browser`: **9/9 bestanden**, darunter der positive `v2-coherent`-Fall und getrennte negative Content-/Metadata-Ignore-Fälle; keine Seitenfehler, kein LocalStorage/IndexedDB-Eintrag und kein horizontaler Überlauf bei 320 Pixeln.
- `npm test`: **379/379 bestanden**.
- `npm run check:docs`: **1090 Dateien, 153 Markdown-Dateien und 765 lokale Links**, keine Fehler.
- `git diff --check`: ohne Befund.

Der erste Browserstart innerhalb der Prozess-Sandbox scheiterte mit `spawn EPERM`. Der danach erlaubte Lauf mit demselben isolierten Harness und lokalem Edge bestand vollständig; dies war eine Umgebungsgrenze, kein Produkttestergebnis.

## Grenzen und nächster Nachweis

Die Prüfung verwendet einen vertragstreuen lokalen Fake. Sie belegt keine Google-seitige Compare-and-swap-Garantie und ersetzt weder einen bewusst gestarteten REAL-Lauf noch echte Leitungsunterbrechung, zwei physische Geräte, iOS/iPadOS, Produktmigration, Altclient-Verhalten, Backup/Wiederherstellung oder Langzeitbetrieb. Erst ein gesondert ausgewerteter REAL-Lauf mit allen elf bestandenen Szenarien darf den Kandidaten für einen neuen Produktintegrationsentwurf öffnen. Produktcode und Produktshop bleiben unverändert.
