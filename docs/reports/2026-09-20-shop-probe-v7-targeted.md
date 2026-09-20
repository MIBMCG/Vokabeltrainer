# Shop-Probe Diagnose 7: gezielte falsche Schreibkennung

Stand: 20.09.2026. Ausgangscode: `9106c60` auf `codex/vokabeltrainer-v1`. Nutzerwahl C erlaubt diese begrenzte Weiteruntersuchung des direkten Drive-Ansatzes. Der Produktshop bleibt gesperrt.

## Umgesetzte Diagnose

- Die Probe bietet den expliziten Umfang `full` oder `invalid-token`. Ohne Auswahländerung läuft weiterhin die vollständige Probe mit elf Checks. Die Zielprüfung legt nur einen neuen synthetischen Probeordner und die Datei für die falsche Schreibkennung an; sie liefert zwei Checks.
- Ein unbekannter Umfang wird vor jedem Transportaufruf abgewiesen. Vorhandene Drive-Dateien werden nicht geöffnet.
- Der falsche starke Token bleibt unverändert `"deliberately-invalid-probe-token"`. Der Zielpfad führt genau einen bedingten Schreibversuch und danach genau eine strikte Nachlesung aus.
- Der bereinigte Checkpoint `invalid-token-observation` trennt Schreibausgang, optionalen echten HTTP-Status, Nachleseklasse und Nachleseausgang. Er exportiert keine Fehlerobjekte, Nachrichten, Header, URLs, ETags, IDs oder JSON-Inhalte.
- Die Zusatzklasse `key-order-only` verlangt rekursiv gleiche JSON-Werte und ignoriert nur die Reihenfolge von Objektschlüsseln. Arrayreihenfolgen bleiben relevant. Diese Klasse ändert weder den globalen Vergleich noch das Erfolgskriterium.
- Der Negativfall besteht weiterhin ausschließlich bei `outcome: stale` und strikt `readback: unchanged`. HTTP 400, Netzwerkfehler, ein angenommener PUT, veränderter Inhalt, reine Schlüsselreihenfolge und nicht verfügbare Nachlesung bleiben fehlgeschlagene Nachweise.
- Bei einem Nachlesefehler bleiben der vorher beobachtete Schreibausgang und sein Status erhalten. Die bestehende bereinigte Read-Stability-Diagnose wird daneben mit `scenarioStage: invalid-token-readback` ausgegeben.
- Nur der v2-kohärente Transport liefert zusätzlich den tatsächlich empfangenen numerischen Erfolgsstatus. Fehlende Statuswerte anderer Transporte werden nicht ergänzt.

## Oberfläche und Bericht

Die Seite enthält die Auswahl **Prüfumfang** mit der Option **Falsche Schreibkennung gezielt prüfen**. Quellen- und Umfangsauswahl sind während des Laufs gesperrt. Der Zielstatus erklärt unabhängig vom Ergebnis ausdrücklich, dass keine vollständige Kaufkoordination geprüft wurde. Der bereinigte Download heißt `shop-probe-bericht7.json` und enthält `diagnosticVersion: 7`, `probeScope` und weiterhin `productReady: false`.

## TDD und lokale Prüfung

- RED, gezielte Node-Fälle: **0/13 bestanden, 13/13 erwartungsgemäß fehlgeschlagen**. Fehlend waren Umfangsbegrenzung, Beobachtungscheckpoint und v2-Erfolgsstatus.
- GREEN, gezielte Node-Fälle: **13/13 bestanden**; zwei ergänzte Grenzfälle zu fehlendem Erfolgsstatus und Read-Stability-Diagnose bestanden anschließend **2/2**.
- RED, Browser: **0/13 bestanden**, weil die neue Umfangsauswahl noch fehlte. Zwei erste Startversuche davor betrafen ausschließlich den lokalen Playwright-Pfad beziehungsweise die Sandbox-Browserfreigabe.
- GREEN, gezielte Browserfälle: **3/3 bestanden** für 412, HTTP 400 und angenommenen PUT.
- Vollständige Shop-Node-Suite auf finalem Code: **84/84 bestanden**. Rohprotokoll: `.superpowers/sdd/2026-09-20-shop-probe-v7/shop-node-final.log` (ignoriert).
- Vollständiger Shop-Browser-Harness auf finalem Code: **13/13 bestanden** mit Playwright 1.62.1 und lokalem Edge. Rohprotokoll: `.superpowers/sdd/2026-09-20-shop-probe-v7/shop-browser-final.log` (ignoriert).

## Grenzen und nächster echter Nachweis

Es wurden keine echten Google-Anfragen ausgeführt, keine Konten geändert und keine Probe-Dateien in Drive angelegt. Die lokalen Browserfälle verwenden ausschließlich synthetische Antworten. HTTP 400 ist eine unterscheidbare mögliche Beobachtung, keine festgestellte Google-Ursache. Auch ein bestandener Zieltest beweist keine vollständige Kaufkoordination und keine Servergarantie.

Für den nächsten echten Nachweis bewusst **Drive v2 kohärent (Koordination)** und **Falsche Schreibkennung gezielt prüfen** auswählen. Eine instabile Fixture vor dem PUT belegt die Schreibbedingung nicht. Schutzbedingungen, Tokenform und strikte Inhaltsprüfung bleiben unverändert; automatische Wiederholungsschleifen sind nicht Teil dieses Pakets.

Unabhängige Spezifikations- und Codeprüfung, Commit, Push und Remotevergleich übernimmt die Hauptaufgabe.
