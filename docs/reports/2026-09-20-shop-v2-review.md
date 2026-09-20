# Unabhängige Review: Drive-v2-ETag-Kandidat

Stand: 20.09.2026. Geprüft wurde die uncommittete, isolierte Erweiterung der Shop-Probe auf `codex/vokabeltrainer-v1` bei `f870e53c8526e62d0a21c5f6710bcf8346414283`. Modell der Review: GPT-5.6 Sol mit hoher Denktiefe. Es wurden keine Produktdateien verändert, keine echten Google-Aufrufe ausgeführt und keine Commits angelegt.

## Urteil

Im geprüften Umfang bestehen **keine offenen wichtigen Befunde**. Der neue Weg bleibt korrekt als unbewiesener technischer Kandidat abgegrenzt. Er aktiviert keinen Kauf, verändert weder OAuth-Berechtigung noch Produktabgleich und setzt `productReady` auch bei vollständig grünen Probeszenarien immer auf `false`.

## Geprüfte Sicherheits- und Kopplungseigenschaften

- Der Lesevorgang ist an denselben eigenen Dateieintrag gebunden. Für JSON-Dateien lautet die Reihenfolge: vollständige v3-Metadaten vor dem Lesen, v2-Dateidaten vor dem Body, v3-Medienbody, v2-Dateidaten nach dem Body und vollständige v3-Metadaten nach dem Lesen. Damit umschließen die beiden v2-ETags den gelesenen Body; die beiden v3-Versionen umschließen den gesamten Vorgang.
- Abweichende v3-Dateiversion, abweichender v3-Metadaten-ETag oder abweichendes v2-JSON-ETag beendet den Lesevorgang als `stale`, bevor daraus eine Schreibbedingung entsteht. Fehlende, schwache oder als solche erkannte fehlerhafte v2-Werte bleiben `unsupported`.
- Die bestehende v3-Bindung blieb erhalten: erzeugte ID, App- und Laufkennung, MIME-Typ, Papierkorbzustand, Elternordner und dezimale Dateiversion werden weiter geprüft. Der zusätzliche v2-Abruf akzeptiert nur dieselbe ID und denselben MIME-Typ. Ordner werden ebenfalls durch zwei v2-Abrufe sowie die vorhandenen v3-Prüfungen geklammert.
- Schreiben erfolgt weiterhin ausschließlich über die bisherigen v3-Pfade. Sowohl der Medien-PATCH als auch der Ordner-Metadaten-PATCH erhalten den ausdrücklich ausgewählten starken Wert in `If-Match`. Es gibt keinen automatischen Quellenwechsel, keinen aus `version` erzeugten Ersatzwert und keinen bedingungslosen Schreibweg.
- Fremde IDs werden vor jedem Netzaufruf abgewiesen. Ignorierte Bedingungen, verbrauchte Kennungen und ein trotz HTTP 412 veränderter Inhalt können die Szenarien weiterhin nicht bestehen.
- Die Diagnoseausgabe verwendet eine feste Positivliste. Neu freigegeben sind nur `v2-json`, die Klassifikation des JSON-ETags und ein boolescher Änderungswert. Rohe ETags, Tokens und Datei-IDs gelangen weder über Fehlerdiagnosen noch über Erfolgsbeobachtungen in den Bericht.
- Oberfläche und Download benennen Diagnoseversion 3, den zusätzlichen v2-Lesepfad und die unveränderten v3-Lese-/Schreibpfade wahrheitsgemäß. Die Oberfläche bezeichnet die Cross-Version-Wirkung ausdrücklich als erst noch nachzuweisende Kompatibilität.

Die offiziellen Drive-Unterlagen stützen genau diese begrenzte Aussage: Die v2-Dateiressource enthält ein ausgabeseitiges Feld `etag`; die v2/v3-Zuordnung führt `Files.etag` für v3 als `n/a`. Keine der beiden Referenzen verspricht, dass dieser v2-Wert eine v3-Aktualisierung mit `If-Match` schützt. Der echte Lauf bleibt daher zwingend.

## Frische Prüfungen dieser Review

- `npm run test:shop-probe`: 20/20 bestanden.
- `git diff --check` für die geprüften Probe-, Test- und Kandidatenberichtsdateien: ohne Befund.
- Zusätzliche adversariale Ausführung mit einem stabilen, stark formatierten, aber vom simulierten v3-Schreibpfad nicht akzeptierten v2-Wert: Gesamtergebnis `passed: false`; die schreibabhängigen Szenarien blieben rot. Damit wird ein bloß lesbarer v2-Wert nicht als Koordinationsnachweis gewertet.

Die bereits dokumentierten fünf Browserfälle und die vollständige 372er-Regression wurden in dieser Review nicht erneut ausgeführt. Ihr geänderter Code und ihre Aussagen wurden geprüft; die vom Hauptlauf frisch bestätigten Ergebnisse bleiben ein getrennter Prüfbeleg.

## Restgrenzen

Der positive synthetische Fixture-Fall verwendet absichtlich denselben Wert als v2-JSON-ETag und als vom simulierten v3-PATCH akzeptierte Bedingung. Er prüft dadurch den Ablauf unter der zu untersuchenden Annahme, beweist diese Annahme aber nicht selbst. Der Kandidatenbericht benennt diese Grenze korrekt. Die Test-Suite erzwingt außerdem noch nicht mit einer eigenen Reihenfolgen-Assertion, dass jeder v2-Abruf unmittelbar auf der jeweils richtigen Seite des v3-Body-Abrufs liegt; diese Kopplung wurde hier direkt am aktuellen Code geprüft.

Ein bewusst gestarteter echter Lauf mit `v2-json` muss weiterhin falsche und verbrauchte Kennungen, parallele Medien- und Ordneränderungen sowie alle Nachlesekontrollen bestehen. Selbst dann folgen Produktdatenvertrag, Migration, Wiederherstellung und Zwei-Geräte-Verhalten als gesonderte Nachweise. Bis dahin bleiben Produktintegration und Käufe gesperrt.
