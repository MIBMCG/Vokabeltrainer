# Lokaler Prüfbericht: Shop-Probe Diagnose 6

Stand: 20.09.2026. Dieser Bericht belegt ausschließlich die lokal getestete Diagnoseerweiterung des isolierten Kandidaten `v2-coherent`. Es gab keinen Zugriff auf Google Drive und keinen neuen REAL-Lauf. `productReady` bleibt `false`; Produkttrainer, Produktdatenformat und Schreibalgorithmus wurden nicht geändert.

## Anlass und Ergebnis

Der bereitgestellte Diagnose-5-Bericht enthielt vier bestandene und sieben fehlgeschlagene Szenarien. Bei allen sieben Fehlern änderte sich die v2-Dateiversion zwischen zwei Metadatenantworten, während die starke v2-ETag gleich blieb. Sechs Abbrüche lagen in einer internen Create-Verifikation, einer in einem späteren Snapshot-Read. Diese Auswertung grenzt die Stelle ein, beweist aber keine Serverursache.

Diagnoseversion 6 ergänzt die beiden bereits vorhandenen v2-Metadaten-GETs um fünf optionale Beobachtungsfelder. Bei einem weiterhin strikt abgelehnten instabilen Snapshot meldet der Bericht nur die bereinigten Zustände `same`, `changed` oder `unavailable` für Inhaltsprüfsumme, Head-Revision, Änderungszeit, letzte Ansicht und Dateigröße. Rohwerte dieser Felder, Datei-IDs und Tokens werden nicht exportiert.

Der Fehlerblock unterscheidet außerdem die internen Lesekontexte `create-verification`, `snapshot-read` und `retry-create-verification` sowie Ordner- von JSON-Snapshots. Die drei Nachlesestellen des Antwortverlust-Szenarios sind als `response-loss-receipt`, `response-loss-after-second-write` und `response-loss-balance` getrennt. Die elf Szenarien, ihre Reihenfolge und ihre Erfolgskriterien bleiben unverändert.

## Unveränderte Schutzgrenzen

- Ein Snapshot gilt weiterhin nur dann als stabil, wenn sowohl v2-Version als auch starke v2-ETag zwischen den beiden Metadatenantworten gleich bleiben.
- Die Zusatzfelder beeinflussen keine Bindung, keine Schreibentscheidung und keine Bewertung eines Szenarios.
- Es gibt keine zusätzliche HTTP-Anfrage, keine Wiederholung, keine Wartezeit und keinen automatischen Moduswechsel.
- Bedingte v2-`PUT`-Anfragen verwenden weiterhin die ETag des übergebenen Snapshots unverändert als `If-Match`; vor dem Schreiben wird kein neuer Token gelesen.
- Das bestehende Antwortverlust-Szenario verwirft lokal eine Erfolgsantwort. Sein erster Schreibversuch beweist weiterhin keinen echten Leitungsabbruch und unterscheidet in diesem Szenario nicht zwischen einer empfangenen Erfolgsantwort und einem tatsächlichen Netzwerkfehler.

## Testgetriebene Nachweise

Vor der Implementierung scheiterten die neuen Transporterwartungen gezielt an den fehlenden Vergleichszuständen und Lesekontexten; 31 von 38 Transporttests bestanden, sieben schlugen erwartungsgemäß fehl. In den Szenariotests bestanden zunächst 10 von 15 Fällen; fünf neue Sanitizing- und Stufenanforderungen fehlten. Nach der Ergänzung wurden auch fehlende und falsch typisierte optionale Werte als `unavailable`, geänderte Inhalts- und Revisionskennungen, alle drei Lesekontexte, beide Lesetypen sowie das Verwerfen unbekannter Enumwerte geprüft.

Ein stabiler JSON-Snapshot benötigt weiterhin genau drei GETs: Metadaten, Medieninhalt, Metadaten. Ein Ordner-Snapshot benötigt zwei Metadaten-GETs. Der Browser-Negativfall mit absichtlich wechselnder Version bleibt fehlgeschlagen, exportiert ausschließlich freigegebene Klassen und lässt `productReady:false` unverändert. Die bestehenden positiven und negativen Browserfälle bleiben erhalten.

## Frische lokale Prüfung

Umgebung: Node.js 22.23.2, Playwright 1.62.1 und System-Edge 153.0.4234.48. Der Browserlauf verwendete ausschließlich frische synthetische Browserkontexte und simulierte Google Identity Services sowie Drive-HTTP.

- Fokussierter Transporttest: **39/39 bestanden**.
- Fokussierter Szenariotest: **15/15 bestanden**.
- Vollständige Shop-Node-Suite: **69/69 bestanden**.
- Shop-Browser-Harness: **10/10 bestanden**, einschließlich des neuen instabilen v2-Falls; keine Seitenfehler, kein LocalStorage-/IndexedDB-Eintrag und kein horizontaler Überlauf bei 320 Pixeln.
- Dokumentprüfung: **1095 Dateien, 158 Markdown-Dateien und 780 lokale Links**, keine Fehler.
- `git diff --check`: ohne Befund.

Der erste Browserstart innerhalb der Prozess-Sandbox scheiterte vollständig mit `spawn EPERM`. Derselbe lokale Harness bestand anschließend außerhalb dieser Prozessgrenze vollständig. Das ist eine Umgebungsgrenze und kein Produktergebnis.

## Grenzen und nächster Nachweis

Die Prüfung verwendet einen vertragstreuen lokalen Fake. Sie belegt weder die Ursache der im REAL-Bericht beobachteten Versionsänderungen noch eine Google-seitige Compare-and-swap-Garantie. Ein späterer REAL-Lauf muss ausdrücklich Diagnoseversion 6 verwenden. Auch dessen Muster darf ohne zusätzliche Evidenz nicht als sichere Konkurrenzkoordination oder als Begründung zum Abschwächen der Versions-/ETag-Prüfung ausgelegt werden.
