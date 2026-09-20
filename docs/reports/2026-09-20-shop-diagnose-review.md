# Unabhängige Review: Shop-Probe-Diagnoseversion 2

Stand: 20.09.2026. Geprüft wurde der uncommittete Diff auf `codex/vokabeltrainer-v1` bei Ausgangs-HEAD `76c4307a96bc49c90d3b9f35e071c703b5e973c4`. Diese Review hat keine Programmdateien geändert und keine echte Drive-Aktion ausgeführt.

## Befund

### [P2] Anzeige behauptet einen geänderten Dateistand, obwohl nur die Metadatenkennung gewechselt haben kann

`src/shop-probe/main.js:9` erklärt `changed-during-read` mit „Der Dateistand hat sich während der Leseprüfung geändert“. Der Transport erzeugt diesen Grund jedoch auch dann, wenn `versionChanged` falsch und ausschließlich `metadataEtagChanged` wahr ist (`src/shop-probe/transport.js:36-37`). Ein wechselndes oder unterschiedlich exponiertes ETag bei unveränderter Drive-`version` belegt keinen geänderten Dateiinhalt oder Dateistand. Gerade die neue Diagnose soll Beobachtung und Ursache trennen. Die Anzeige sollte deshalb nur die belegte Beobachtung nennen, etwa: „Dateiversion oder Metadaten-ETag waren zwischen zwei Lesezeitpunkten nicht stabil.“ Die anschließende Einschränkung, dass dies keinen abgelehnten Schreibzugriff belegt, ist korrekt.

**Nachprüfung: behoben.** `src/shop-probe/main.js:9` nennt jetzt ausschließlich die beobachtete Abweichung von Dateiversion oder technischer Versionskennung zwischen zwei Leseantworten und hält ausdrücklich fest, dass damit noch keine abgelehnte Schreibanfrage nachgewiesen ist. `shop-probe/index.html:3` spricht entsprechend neutral von „abweichenden Leseantworten“. Beide Texte decken sowohl `versionChanged` als auch den alleinigen Fall `metadataEtagChanged` ab, ohne eine Inhaltsänderung oder Ursache zu behaupten.

## Bestätigte Eigenschaften

- Der Download ist hinsichtlich der neuen Diagnosefelder leakfrei aufgebaut: `safeDiagnostic` lässt nur feste Enumwerte und Booleans durch; `actual`, `scenarioStage` und `httpStatus` bleiben ebenfalls auf bekannte Codes, feste Stufen beziehungsweise Zahlen begrenzt. Roh-ETags, Dateiversionswerte, Datei-IDs, Tokenwerte und Fehlermeldungen gelangen nicht in den Bericht.
- Die Diagnose sitzt an den fachlich richtigen Grenzen: ungültige oder fehlende Drive-`version` in der Metadatenantwort, Instabilität zwischen den beiden Metadatenlesungen, fehlendes/nicht starkes ausgewähltes ETag sowie eine ungültige Schreibkennung vor dem PATCH. `fixture-read`, `initialization-read` und der standardmäßige `post-write-read` unterscheiden die zuvor mehrdeutigen Szenarien. Interne Reads in `create` und `retryCreate` tragen weiterhin keine `scenarioStage`; ihr Transport-`phase` bleibt erhalten. Das ist eine dokumentierbare Restgrenze, kein Gate-Fehler.
- Medien- und Metadatenpfad sind im Fehlerbericht unterscheidbar: `etagSource`, `metadataEtagState` und `mediaEtagState` verwenden ausschließlich feste Zustände. Bei einer Stabilitätsabweichung wird nur der Zustand des zweiten Metadaten-GETs ausgegeben; `metadataEtagChanged` belegt die Abweichung, aber bewusst nicht deren Ursache oder Richtung.
- OAuth-/Dateizugriffsumfang ist unverändert. Es gibt keine Änderung an Anmeldung, `drive.file`, ID-Bindung oder den erlaubten Drive-Zielen.
- Die Schreibbedingung ist unverändert streng: Vor jedem PATCH wird weiterhin dieselbe starke-ETag-Form verlangt, und jeder PATCH führt `If-Match`. Es gibt keinen versionslosen Fallback, keinen Retry und keine Cloudautomatisierung. Die Diagnose verändert weder `passed`/`productReady` noch die Szenario-Gates.

## Frische Prüfung

`node --test --experimental-test-isolation=none tests/shop-probe/*.test.js tests/serve.test.js`: **21/21 bestanden**. Enthalten sind getrennte Tests für Versions-/ETag-Instabilität, fehlende/schwache/fehlgeformte Header, fehlende Dateiversion, Enum-/Boolean-Filterung, ausbleibende PATCHes ohne starke Kennung und unveränderte `If-Match`-Pflicht.

## Urteil

Die technische Diagnoseergänzung erfüllt den beabsichtigten engen Umfang und macht den vorliegenden Realbericht erheblich auswertbarer. Der einzige Reviewbefund ist nach gezielter Inhalts- und Diffprüfung geschlossen. In diesem Reviewumfang bestehen keine offenen oder blockierenden Befunde. Wegen der reinen Textkorrektur wurde die bereits bestandene Prüfung mit 21/21 Tests nicht erneut vollständig ausgeführt; `git diff --check` blieb ohne Befund.
