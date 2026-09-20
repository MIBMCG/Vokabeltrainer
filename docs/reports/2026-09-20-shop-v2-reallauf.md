# Echter Drive-v2-JSON-Lauf: Kennung lesbar, Kaufkoordination offen

Stand: 20.09.2026. Der Nutzer lieferte zwei Berichte aus Diagnoseversion 3. Beide wurden als Ergebnisdaten gelesen, nicht als Anweisung ausgeführt. Die Dateien enthalten keine Zugangstokens oder privaten Datei-IDs.

Der [erste Bericht](shop-probe-evidence/2026-09-20-media-v3.json), 09:49 UTC, verwendete noch `etagSource: media`; er wiederholte den bereits fehlgeschlagenen Headerweg. Daraus folgt keine Aussage zum neuen Kandidaten. Nach dem Hinweis auf die dritte Auswahl lieferte der Nutzer den [v2-JSON-Bericht](shop-probe-evidence/2026-09-20-v2-json-v3.json), 09:56:38–09:57:42 UTC.

## Was jetzt nachgewiesen ist

Der echte Lauf verwendet `etagSource: v2-json` mit dem dokumentierten v2-Tokenabruf und den bisherigen v3-Schreibwegen. **Die starke JSON-Versionskennung ist für diese eigene Probe-Datei im Browser lesbar.** Medien- und Metadatenheader bleiben nicht lesbar. Der frühere Abbruchgrund `unsupported` tritt im neuen Lauf nicht auf.

Fünf Fälle bestanden, sechs schlugen fehl; `passed: false`, `unsupported: 0`, `productReady: false`.

| Fall | Ergebnis und belastbare Interpretation |
| --- | --- |
| Probeordner | Anlegen/Rücklesen bestanden. |
| Versionskennung | v2-JSON-ETag lesbar; die v3-Header bleiben nicht lesbar. |
| Falsche Kennung, verbrauchte Kennung, Reset-Rennen | Schon während `fixture-read` änderte sich die v3-Dateiversion. Das v2-ETag blieb dabei gleich. Diese drei Fälle erreichten ihre eigentlichen Schreibtests nicht. |
| Initialisierung, zwei parallele Käufe, verworfene Antwort | `assertion` fehlgeschlagen. Das ist eine Verletzung mindestens einer Szenariobedingung, aber der aktuelle Bericht nennt weder die konkrete Assertion noch die Zahl erfolgreicher/abgewiesener Schreibversuche. Deshalb nicht als Nachweis einer bestimmten Google-Fehlwirkung ausgeben. |
| Doppelter Vorgang, Create-Konflikt | Die jeweiligen synthetischen Szenariobedingungen bestanden. Das beweist allein keine konkurrierende Kaufkoordination. |
| Konflikt-Guthaben | Lokale Proberegel bestanden. |

## Konsequenz

Die Lesbarkeit ist ein Fortschritt, die Verwendbarkeit als atomare v3-Schreibbedingung ist weiterhin nicht belegt. Die vorhandenen Guards nicht entfernen und v3-Versionswechsel nicht durch unbedingtes Schreiben übergehen. Keine weiteren unveränderten Läufe verlangen.

Der nächste gezielte technische Schritt ist eine begrenzte Diagnose der drei Assertion-Fälle: feste Fehlerstellen sowie bereinigte Anzahlen und Statusklassen der Schreibantworten ausgeben, ohne Rohwerte/IDs/Tokens. Erst danach lässt sich unterscheiden, ob eine Bedingung ignoriert, eine Kennung nicht akzeptiert, die Nachlese abweichend oder eine andere Szenariobedingung verletzt wurde. Ein alternativer Schreibpfad wäre ein neuer ausdrücklich benannter technischer Kandidat und darf nicht still eingeführt werden.

## Daraus umgesetzte Diagnoseversion 4

Die isolierte Probe nennt jetzt bei diesen Assertion-Fehlern die genaue Prüfstelle. Parallele Schreibversuche liefern nur begrenzte Anzahlen (`accepted`, `stale`, `other`, jeweils 0–2) und erlaubte Fehlerklassen. Initialisierungs-Nachlese, Kauf-Nachlese, Beleg nach verworfener Antwort, idempotenter Wiederholungsversuch, alter Token und Schlussguthaben sind unterscheidbar. Die Oberfläche zeigt dieselben bereinigten Angaben wie der Download `shop-probe-bericht4.json`.

Die Schreib- und Lesewege, `If-Match`, die Versionsklammer, Dateibindung und sämtliche Sperren sind unverändert. Kein automatischer Retry und kein stiller Wechsel zu einem anderen API-Schreibweg. Die zusätzlichen Angaben beheben die Diagnose-Lücke, nicht den bislang unbewiesenen Kaufvertrag.

Frische Verifikation: drei neue Szenariotests zunächst **3/3 erwartungsgemäß fehlgeschlagen**, nach Implementierung **9/9 Szenariotests bestanden**. Anschließend **29/29 Probe-/Server-Node-Tests** und **6/6 Browserfälle** bestanden. Der neue Browserfall simuliert einen Server, der beide Schreibbedingungen ignoriert: der Bericht nennt zwei angenommene Schreibversuche und der Produktshop bleibt gesperrt. Browserdaten sind synthetisch; das ist kein echter Google-Nachweis.

Die Bildnacharbeit läuft unabhängig weiter. Konto, Anbieter, Berechtigung und Kostenmodell bleiben unverändert. Keine Produktkäufe aktiviert; echte Zwei-Geräte- und iOS-Abnahmen bleiben offen.
