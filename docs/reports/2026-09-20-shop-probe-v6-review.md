# Unabhängige Review: Shop-Probe Diagnose 6

Stand: 20.09.2026. Prüfer: GPT-5.6 Sol mit hoher Denktiefe. Geprüft wurde der uncommittierte Diagnose-6-Diff auf `codex/vokabeltrainer-v1` gegenüber `2e98850b38588515eba0d70522dedc9aaacb44cc`. Maßstab war der [Diagnose-6-Plan](../superpowers/plans/2026-09-20-shop-probe-v6-diagnostics.md).

## Urteil

Spezifikations- und Codequalitätsprüfung bestanden. Es bestehen keine offenen relevanten Befunde. Die Änderung erweitert ausschließlich die Messdaten der isolierten Probe; sie behebt keine Google-seitige Ursache und belegt weiterhin keine Compare-and-swap-Garantie.

## Geprüfter Vertrag

- Der Snapshot wird weiterhin nur akzeptiert, wenn v2-Version und starke v2-ETag zwischen beiden Metadatenantworten unverändert sind. Die bestehende Abbruchbedingung wurde nicht abgeschwächt.
- Anzahl und Reihenfolge der Requests bleiben gleich: JSON-Snapshots verwenden Metadaten-, Medien- und Metadaten-GET; Ordner verwenden zwei Metadaten-GETs. Es gibt keine Wiederholung, Wartezeit oder zusätzliche Anfrage.
- Die Schreibwege bleiben unverändert. Inhalts- und Ordnermetadatenänderungen verwenden weiterhin v2-`PUT` mit der unverändert übernommenen Snapshot-ETag in `If-Match`; vor dem Schreiben wird kein neuer Token gelesen.
- Die fünf zusätzlichen Felder `md5Checksum`, `headRevisionId`, `modifiedDate`, `lastViewedByMeDate` und `fileSize` werden nur intern verglichen. Nur zwei vorhandene, nichtleere Strings ergeben `same` oder `changed`; alle fehlenden, leeren oder anders typisierten Werte ergeben `unavailable`.
- Rohwerte der fünf Felder gelangen weder in den zurückgegebenen Snapshot noch in den Bericht. `safeDiagnostic` übernimmt ausschließlich feste Kontext-, Lesetyp- und Zustandswerte sowie die bereits erlaubten booleschen Beobachtungen. Unbekannte Werte und zusätzliche Eigenschaften werden verworfen.
- Die internen Kontexte `create-verification`, `snapshot-read` und `retry-create-verification` sind an den richtigen Aufrufstellen gesetzt. `readKind` unterscheidet `metadata-metadata` und `metadata-media-metadata` anhand des gebundenen Dateityps.
- Die drei Nachlesungen des Antwortverlust-Szenarios sind korrekt als `response-loss-receipt`, `response-loss-after-second-write` und `response-loss-balance` markiert und durch die bestehende Berichtbereinigung zugelassen. Ablauf und Erfolgskriterien des Szenarios bleiben unverändert.
- Oberfläche und Bericht nennen Diagnoseversion 6, die fünf zusätzlichen Metadatenfelder und den Dateinamen `shop-probe-bericht6.json`. Die Moduswahl bleibt bewusst; `productReady:false` ist unverändert.

## Testabdeckung und Grenzen

Die ergänzten Tests decken alle drei internen Lesekontexte, beide Lesetypen, geänderte und unverfügbare optionale Werte, falsch typisierte Werte, Rohwertunterdrückung, unbekannte Enumwerte, die drei Antwortverlust-Stufen sowie die unveränderte GET-Anzahl ab. Bestehende Tests prüfen weiterhin v2-Schreibwege, unverändertes `If-Match`, Konkurrenz-Gegenproben und `productReady:false`.

Der lokale Umsetzungsbericht nennt frisch bestandene 39/39 Transporttests, 15/15 Szenariotests, 69/69 Shop-Node-Tests und 10/10 Browserfälle. Diese grünen Läufe wurden in der Review nicht wiederholt, weil die statische Prüfung keinen konkreten Gegenverdacht ergab und der Auftrag Wiederholungen unveränderter grüner Suiten ausschließt. `git diff --check` wurde in der Review ohne Befund ausgeführt.

Es erfolgten kein Google-Zugriff, kein Browsernutzerdatenzugriff, keine Produktänderung und keine Bewertung eines neuen REAL-Berichts. Ein späterer echter Lauf muss ausdrücklich Diagnoseversion 6 verwenden; auch dann bleiben Ursache der Versionsänderung und sichere Konkurrenzkoordination getrennt nachzuweisen.
