# Unabhängige Review: Shop-Probe Diagnose 7

Stand: 20.09.2026. Prüfer: GPT-5.6 Sol mit hoher Denktiefe. Geprüft wurde der eingefrorene, uncommittierte Diagnose-7-Diff auf `codex/vokabeltrainer-v1` gegenüber `9106c6091bfc42b067262160e722804e50ed264a`. Maßstab war der [begrenzte Diagnose-7-Plan](../superpowers/plans/2026-09-20-shop-probe-v7-invalid-token.md).

## Urteil

Spezifikations- und Codequalitätsprüfung bestanden. Es bestehen keine offenen relevanten Befunde. Die Änderung schließt die konkrete Diagnoselücke des mehrdeutigen `invalid-token`-Ergebnisses, ohne den direkten Drive-Kandidaten, seine Schutzprüfungen oder die Produktarchitektur freizugeben.

## Geprüfter Vertrag

- `full` bleibt der Standard mit elf Checks. `invalid-token` führt ausschließlich Probeordner und Zielprüfung aus und liefert zwei Checks. Ein unbekannter Umfang wird vor jedem Transportaufruf zurückgewiesen.
- Die Zielprüfung verwendet weiterhin exakt `"deliberately-invalid-probe-token"`. Nach der synthetischen Fixture erfolgen genau ein bedingter Schreibversuch und genau ein Aufruf der unveränderten strikten Transportlesung. Es gibt keine Wiederholung, Wartezeit oder zusätzliche Schreibanfrage.
- Schreibausgang und Nachlese werden getrennt als feste Klassen erfasst. Numerische HTTP-Statuswerte werden nur im Bereich 100 bis 599 übernommen. Fehlende Erfolgsstatus anderer Transporte werden nicht erfunden.
- Ein Nachlesefehler erhält den bereits beobachteten Schreibausgang. Die vorhandene bereinigte Lesediagnose und `scenarioStage: invalid-token-readback` bleiben daneben sichtbar. Ein Fixture-Fehler beendet den Fall vor dem bedingten PUT.
- Der Negativfall besteht weiterhin nur bei `outcome: stale` und dem strikten bisherigen Vergleichsergebnis `readback: unchanged`. `fulfilled`, andere Fehlerklassen, `changed`, `key-order-only` und `unavailable` bleiben fehlgeschlagen. Der rekursive JSON-Vergleich ignoriert nur Objektschlüsselreihenfolge, behält Arrayreihenfolge und dient ausschließlich der Zusatzdiagnose.
- `safeEvidence` und `safeDiagnostic` übernehmen nur bekannte Enums, begrenzte Zähler, gültige Statuszahlen und freigegebene Diagnosefelder. Fehlerobjekte, Meldungen, Header, URLs, ETags, Datei-IDs und JSON-Inhalte gelangen nicht in den Bericht.
- Der v2-kohärente Transport gibt zusätzlich den tatsächlich empfangenen Erfolgsstatus zurück. Endpunkte, `If-Match`, Request-Body, Bindungsprüfung, starke ETag-Prüfung und strikte Snapshotprüfung sind unverändert. Kein Trainer-, Produkt-, Worker- oder Produktdatenpfad wurde geändert.
- Die Oberfläche sperrt Quellen- und Umfangsauswahl während des Laufs. Diagnoseversion 7, `probeScope`, Downloadname und die scopeabhängigen Statusmeldungen sind konsistent. Auch ein bestandener Zieltest erklärt ausdrücklich, dass keine vollständige Kaufkoordination geprüft wurde; `productReady:false` bleibt erhalten.

## Prüfbelege und Grenzen

Die bereitgestellten finalen Rohprotokolle wurden gelesen: Die Shop-Node-Suite bestand mit **84/84**, der Shop-Browser-Harness mit **13/13**. Die neuen Fälle decken Umfangsbegrenzung, unbekannten Umfang, angenommene Schreibanfrage, HTTP 400, Netzwerkfehler, 412 mit unverändertem oder verändertem Inhalt, reine Schlüsselreihenfolge, Arrayreihenfolge, Nachlesefehler, Lesestabilitätsdiagnose, Fixture-Abbruch, Datenbereinigung sowie die drei scopeabhängigen Browserausgänge ab. `git diff --check` blieb ohne Befund.

Die bereits grünen Suiten wurden in dieser Review nicht erneut ausgeführt, weil die statische Prüfung keinen konkreten Gegenverdacht ergab. Es erfolgten kein Google-Zugriff, keine Änderung von Konten oder Browserdaten und keine Bewertung eines neuen REAL-Berichts. Diagnose 7 verbessert ausschließlich die Aussagekraft des gezielten Negativfalls; sie belegt weder eine Google-seitige Compare-and-swap-Garantie noch sichere parallele Käufe.
