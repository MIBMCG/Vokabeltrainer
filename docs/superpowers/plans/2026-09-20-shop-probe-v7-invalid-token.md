# C: gezielte Negativfalldiagnose statt unveränderter Vollprobe

Stand: 20.09.2026. Ausgangscode `9106c60`. Nutzerwahl **C** autorisiert die weitere gezielte Untersuchung des direkten Drive-Ansatzes. Kein neuer Dienst, keine Änderung des Punktesystems und keine Shopfreigabe. Dieses Paket schließt die konkret identifizierte Diagnoselücke aus Bericht 6.

## Hypothesen und messbare Unterschiede

1. Der absichtlich falsche Token führt zu einer Ablehnung außerhalb der bisherigen Klasse `stale` (etwa HTTP 400 oder Netzwerkfehler). Der vorhandene Export verwirft diese Information mangels Checkpoint. Die genaue Klasse und gegebenenfalls der HTTP-Status müssen sichtbar werden. Dies ist eine zu prüfende Hypothese, kein behauptetes Google-Verhalten.
2. Der Token wird mit 412 abgewiesen, aber die anschließende strikte Inhaltsgleichheit scheitert. Zusätzlich unterscheiden: tatsächlich anderer JSON-Inhalt, ausschließlich andere Objektschlüsselreihenfolge oder nicht erfolgreich nachlesbar. Die strikte Erfolgskontrolle bleibt erhalten; Schlüsselreihenfolge allein macht den Test nicht nachträglich grün.
3. Die Schreibanfrage wird angenommen. Diese Antwort muss auch dann als Fehlverhalten erkennbar bleiben, wenn der Inhalt anschließend unverändert erscheint oder der Read instabil ist.

## Begrenzter Vertrag

- `runProbeScenarios` erhält optional `probeScope`, erlaubte Werte `full` (Standard, bisherige elf Szenarien) und `invalid-token` (nur Probeordner und dieses eine Szenario). Unbekannten Umfang vor jedem HTTP-Aufruf zurückweisen. Zielprüfung arbeitet ausschließlich mit neu erstellten synthetischen Daten; keine vorhandenen Dateien verwenden. Auch ein erfolgreicher Zieltest ist keine bestandene vollständige Kaufprüfung; `productReady:false` bleibt.
- Im Negativfall genau einen bedingten Schreibversuch mit dem bisherigen falschen starken Token ausführen. Das Ergebnis festhalten, ohne es sofort durch eine nackte Assertion zu verlieren. Danach genau einmal mit der unveränderten strikten Transportlesung nachlesen, auch bei unerwarteter Antwort. Keine weiteren Schreibversuche, Wiederholungen, Wartezeiten oder gelockerten Version-/ETag-Bedingungen.
- Neuer bereinigter Evidence-Checkpoint `invalid-token-observation`. Felder: `outcome` (bekannte Fehlerklasse oder `fulfilled`), optional `httpStatus` (nur ganze Zahl 100–599), `readback` (`unchanged`, `key-order-only`, `changed`, `unavailable`), `readbackOutcome` (`success` oder bekannte Fehlerklasse/unexpected), optional `readbackHttpStatus` (100–599). Kein raw error, URL, ETag, JSON-Inhalt oder ID im Export. Ergebnis bei Erfolg ebenfalls nur bereinigt zurückgeben.
- Der lokale Vergleich klassifiziert `key-order-only` nur bei rekursiv gleichen JSON-Werten: Reihenfolge von Objektschlüsseln darf für diese Zusatzdiagnose abweichen, Arrayreihenfolge nicht. Keine globale Änderung von `same`, Kaufregeln oder Erfolgskriterien. Der Negativfall gilt weiterhin nur bei `outcome:stale` und strikt `readback:unchanged` als bestanden; im v2-Schreibpfad entsteht `stale` nur aus HTTP 412.
- Bei nicht erfolgreicher Nachlese bleibt deren bereinigte vorhandene Diagnose erhalten; `scenarioStage:invalid-token-readback` fest zulassen. Der bereits beobachtete Schreibausgang darf durch einen Nachlesefehler nicht verloren gehen. Fixture-Fehler bleiben vor dem Schreibversuch sichtbar und erzeugen keinen PUT.
- `v2-coherent-transport.updateIfUnchanged` darf zusätzlich den tatsächlichen numerischen HTTP-Erfolgsstatus zurückgeben. Keine sonstige Transportänderung; vorhandene Endpunkte, Felder, Header, Bindung und Guards bleiben. Bei anderen Transporten fehlende Statuswerte niemals erfinden.
- Oberfläche: explizite Auswahl `Prüfumfang`, `full` bleibt Standard für Rückwärtskompatibilität; Option `invalid-token` heißt **Falsche Schreibkennung gezielt prüfen**. Der Start sperrt beide Auswahlen während des Laufs. Bericht enthält `probeScope`, Diagnoseversion 7, Download `shop-probe-bericht7.json`. Zieltest-Status erklärt ausdrücklich, dass keine vollständige Kaufkoordination geprüft wurde.
- Nur bestehende Dateien in `src/shop-probe/`, `shop-probe/index.html` und zugehörige Tests ändern. Kein neues Laufzeitmodul, kein Trainer-/Worker-/Serverumbau. Der zusätzliche Nachleseaufruf bei unerwarteter Schreibantwort ist bewusste Diagnose; ihn nicht als unveränderte Fehler-Requestfolge dokumentieren.

## Prüfung

- [x] RED/GREEN: gezielte Auswahl, falscher Umfang vor Transportaufruf, Annahme trotz falscher Kennung (mit und ohne Inhaltsänderung), HTTP 400, Netzwerkfehler, korrekte 412-Ablehnung, Mutation trotz 412, reine Schlüsselreihenfolge und geänderte Arrayreihenfolge.
- [x] Nachlesefehler erhält Schreibausgang und Diagnose; fehlgeschlagene Fixture erzeugt keinen Schreibversuch. Nur erlaubte Enums/Zahlen werden exportiert, private Marker und Rohobjekte werden verworfen.
- [x] Browser: vollständige Probe weiterhin elf Checks; gezielte Probe nur zwei. Explizite Wahl, ehrliche Erfolgs-/Fehlertexte, Berichtsumfang/Version/Dateiname, Ergebnis 400/angenommener PUT, keine persistenten Token-/Nutzerdaten.
- [x] Komplette Shop-Node-Suite und Shop-Browser-Harness einmal auf finalem Code ausführen; bei späteren Fixes nur begründet betroffene Prüfungen. Docs-/Diff-Prüfung. Keine unveränderte Trainerregression.
- [x] Unabhängige Spezifikations-/Codeprüfung ohne offene relevante Befunde; Umsetzungsergebnis und Grenzen dokumentiert.
- [x] Root-Commit/Push mit Remotevergleich: `f5f76cdfc1c5ead65ba3734b583691c8aaa214e6`, lokales HEAD und GitHub-Branch identisch, sauberer Arbeitsbaum. Nachträgliche Dokumentation dieses Nachweises ändert keinen getesteten Code.

## Nächster echter Nachweis

Nach lokalem Abschluss einmal bewusst **Drive v2 kohärent (Koordination)** und **Falsche Schreibkennung gezielt prüfen** auswählen. Ein vollständiger 11er-Lauf ist hierfür nicht erforderlich. Die Probe kann bei weiterhin instabiler Fixture schon vor dem PUT enden; das ist kein Beweis für die Schreibbedingung und kein Anlass, Schutzbedingungen zu entfernen.

Den neuen Befund anhand der drei Hypothesen auswerten. Eine 400-/andere Ablehnung darf nicht automatisch als gleichwertiger 412-Erfolg gelten; erst den konkreten Serververtrag klären. Bleibt die Vorbedingung instabil, ist der gezielte Schreibtest nicht durchgeführt. Keine automatischen Wiederholungsschleifen bis zu einem zufällig grünen Ergebnis.
