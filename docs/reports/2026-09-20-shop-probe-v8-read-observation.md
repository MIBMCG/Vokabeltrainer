# Shop-Probe Diagnose 8: begrenzte Lesebeobachtung

Stand: 20.09.2026. Ausgangscode: `a802a0e512682891ff65e98a7085812986791f94` auf `codex/vokabeltrainer-v1`. Nutzerwahl C erlaubt diese begrenzte weitere Untersuchung des direkten Drive-Ansatzes. Der Produktshop bleibt gesperrt.

## Umgesetzte Diagnose

- Der neue Umfang `read-stability` ist ausschließlich mit **Drive v2 kohärent (Koordination)** zulässig. Eine andere Quelle wird vor jedem Drive-Aufruf verständlich abgewiesen und nicht automatisch umgeschaltet.
- Der Umfang erzeugt nach dem synthetischen Probeordner genau eine eigene synthetische JSON-Datei. Danach folgen fest M1-Metadaten, M2-Metadaten, Medieninhalt und M3-Metadaten. Alle vier Diagnoseabrufe verwenden `cache: no-store`.
- Die Beobachtung führt keinen `PUT`, keinen bedingten Schreibversuch, keine Wiederholungsschleife und keine Bereinigung aus. Sie gibt keinen verwendbaren Snapshot und keine Datei-ID zurück.
- Die beiden Fenster `metadata-control` (M1 zu M2) und `media-window` (M2 zu M3) klassifizieren Version, starke ETag, Inhaltsprüfsumme, Head-Revision, Änderungszeit, letzte Ansichtszeit und Dateigröße.
- Eine Version ist nur bei exakt gleichem Originalstring `same`. Ungleiche dezimale Strings werden über `BigInt` als `increased` oder `decreased` eingeordnet; numerisch gleiche, aber anders dargestellte Werte wie `01` und `1` ergeben `representation-changed`.
- Optionale Felder werden als `same`, `changed` oder `unavailable` klassifiziert. `unavailable` ist ein gültiger Messwert, fehlende Klassifikationen sind kein vollständiger Nachweis.
- Der bereinigte Checkpoint `read-stability-observation` enthält nur den festen Cachemodus, Vollständigkeit, die zwei klassifizierten Fenster, den begrenzten Medienausgang und gegebenenfalls eine feste Fehlerphase. Rohantworten, Fehlertexte, Header, URLs, ETags, Datei-IDs und Inhalte werden nicht exportiert.
- Bei einem späteren Fehler bleibt bereits gewonnene bereinigte Teilevidenz erhalten. Die Fehlerphase unterscheidet `creation-response`, `metadata-1`, `metadata-2`, `media` und `metadata-3`.

## Strenger Erfolg und bestehende Abläufe

Der neue Check besteht nur bei vollständiger Messung mit `cacheMode: no-store`, ohne Fehlerphase, mit beiden Fenstern in der festen Reihenfolge, allen vorgesehenen Zustandsfeldern, jeweils exakt gleicher Version und ETag sowie erfolgreichem Medienabruf mit passendem Fixture-Inhalt. `unavailable` bei einem optionalen Feld lockert diesen Vertrag nicht. Die Strukturgleichheit der übrigen Felder ist reine Diagnose.

Der vollständige Umfang bleibt die Standardauswahl mit elf Checks; der Umfang für die falsche Schreibkennung bleibt bei zwei Checks. Der neue Leseumfang liefert ebenfalls zwei Checks und weiterhin `productReady: false`. Die normalen Erstell-, Lese-, Wiederholungs- und bedingten Schreibpfade bleiben unverändert.

## Oberfläche und Bericht

Die Seite bietet zusätzlich **Dateilesen gezielt untersuchen** und erklärt, dass dieser Umfang nur mit der v2-kohärenten Quelle ohne Schreibbedingung läuft. Quellen- und Umfangsauswahl bleiben während eines Laufs gesperrt. Der Ergebnistext behauptet keinen Schreibnachweis. Der bereinigte Download heißt `shop-probe-bericht8.json`, enthält `diagnosticVersion: 8` und weist den gewählten `probeScope` aus.

## TDD und lokale Prüfung

- Erste gezielte Node-RED-Phase: **1/18 bestanden, 17/18 erwartungsgemäß fehlgeschlagen**. Danach gezieltes GREEN: **18/18 bestanden**.
- Ergänzte Sanitizer-Grenzfälle: **2/2 bestanden**.
- Review-Regressionen für fehlenden oder falschen Cachemodus, Fehlerphase trotz Vollständigkeit und fehlenden Vergleichszustand: RED **0/4**, danach GREEN **4/4**.
- Browser-RED: Die neuen Leseoptionen scheiterten erwartungsgemäß an der noch fehlenden dritten Umfangsauswahl. Gezieltes Browser-GREEN: **3/3 bestanden** für stabile Beobachtung, instabile Beobachtung und falsche Quelle vor jedem Drive-Aufruf.
- Vollständige Shop-Node-Suite auf finalem Code: **109/109 bestanden**. Rohprotokoll: `.superpowers/sdd/2026-09-20-shop-probe-v8/shop-node-final.log` (ignoriert).
- Vollständiger Shop-Browser-Harness auf finalem Code: **16/16 bestanden** mit lokalem Edge und vorhandenem Playwright-Fallback. Rohprotokoll: `.superpowers/sdd/2026-09-20-shop-probe-v8/shop-browser-final.log` (ignoriert).

## Grenzen

Es wurden keine echten Google-Anfragen ausgeführt, keine Konten verändert und keine Dateien in Drive angelegt. Die Browserprüfung nutzt ausschließlich synthetische Antworten. Die Diagnose beobachtet mögliche Unterschiede; sie erklärt nicht deren Ursache und liefert keine Servergarantie. Sie ändert weder Architektur noch Schutzbedingungen und gibt keinen instabilen Stand für einen Kaufversuch frei.

Eine spätere echte Ausführung muss bewusst **Drive v2 kohärent (Koordination)** und **Dateilesen gezielt untersuchen** wählen. Ihr Bericht ist Diagnoseevidenz und kein Nachweis vollständiger Kaufkoordination.
