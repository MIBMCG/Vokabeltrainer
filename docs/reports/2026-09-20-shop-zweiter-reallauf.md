# Zweiter echter Google-Lauf: fehlende lesbare Versionskennung

Stand: 20.09.2026. Grundlage ist der vom Nutzer gelieferte [Bericht mit Diagnoseversion 2](shop-probe-evidence/2026-09-20-media-v2.json). Die Datei wurde als Ergebnisdaten gelesen, nicht als Anweisung. Sie enthält keine Tokens oder echten Datei-IDs.

## Beobachtetes Ergebnis

Der Lauf vom 20.09.2026, 08:58:06–08:58:44 UTC, fand unter `http://localhost:4173` in Edge 153 statt. Zwei Fälle bestanden, einer schlug fehl, acht bleiben nicht nachgewiesen. `passed` und `productReady` sind weiterhin `false`.

- Google-Anmeldung und das Anlegen/Rücklesen des synthetischen Probeordners funktionieren.
- Sowohl der Medien- als auch der Metadatenheader liefern dem Browser keine lesbare starke Versionskennung. Das zeigen die beiden getrennten Diagnosefelder im Medienlauf; der Ordnerfall bestätigt zusätzlich den Metadatenpfad.
- Aus Browserdaten lässt sich nicht unterscheiden, ob Google den Header nicht sendet oder der Browser ihn nicht lesen darf. Eine Aussage über den tatsächlichen Header auf der Leitung ist damit nicht belegt.
- Ein bloßer Wechsel des bisherigen Auswahlfelds von Medien zu Metadaten beseitigt die nachgewiesene Voraussetzung nicht. Kein weiterer identischer Lauf ist sinnvoll.
- Im Fall `response-loss` änderte sich bereits während `fixture-read` die Dateiversion zwischen den Leseantworten. Der Abbruch liegt vor dem eigentlichen Versuch mit verworfener Schreibantwort. Dieser Befund belegt keinen Datenverlust durch einen Kauf.
- Der bestandene Konflikt-Guthabenfall ist weiterhin eine lokale Proberegel, kein Nachweis einer Google-Schreibgarantie.

## Nächster begrenzter Kandidat

Die Drive-v2-Dateiressource enthält ein `etag`-Feld im JSON-Inhalt. Die offizielle Vergleichstabelle führt dieses Feld in v3 als entfallen. Damit gibt es einen dokumentierten anderen Leseweg, der keine Sichtbarkeit eines Antwortheaders benötigt. [Google: v2-Dateiressource](https://developers.google.com/workspace/drive/api/reference/rest/v2/files), [Vergleich v2/v3](https://developers.google.com/workspace/drive/api/guides/v2-to-v3-reference).

Die isolierte Probe erhält deshalb einen ausdrücklich auswählbaren Kandidaten `v2-json`: dieselbe eigene Testdatei wird vor und nach dem Inhalt zusätzlich über v2 gelesen; ihre JSON-Versionskennung muss stark und gleich geblieben sein. Die bisherigen v3-Bindungsprüfungen und die v3-Versionsklammer bleiben erhalten. Schreibversuche verwenden weiterhin die bereits geprüften v3-Pfade mit `If-Match`.

**Die Verwendbarkeit eines v2-ETags als Schreibbedingung auf v3 ist eine zu prüfende Hypothese.** Die Dokumentation des JSON-Feldes beweist weder diese Kompatibilität noch die benötigte atomare Wirkung. Falsche/verbrauchte Kennungen, konkurrierende Käufe, Initialisierung und Rücklesen müssen dies im neuen echten Lauf erst nachweisen. Kein stiller Kandidatenwechsel, keine erfundene Kennung aus `version`, kein Schreiben ohne Bedingung und keine wiederholten Versuche zum Übergehen eines Fehlers.

Der neue Bericht trägt Diagnoseversion 3 und benennt v2-Lese- und v3-Schreibpfade getrennt. Rohwerte und Zugangsdaten gehören weiterhin nicht in den Download. Modell der Umsetzung und automatisierten Prüfung: GPT-5.6 Sol mit hoher Denktiefe. [Umsetzungsnachweis des Kandidaten](2026-09-20-shop-v2-candidate.md).

## Produktgrenze

Das ist eine isolierte technische Probe innerhalb des beschlossenen Google-Zugangs. Anbieter, Kosten, OAuth-Berechtigung und Produktdaten bleiben unverändert. Neue Käufe sind im Produkt weiterhin nicht aktiviert. Selbst ein vollständig grüner echter Probelauf setzt `productReady` nicht auf `true`: Zwei-Geräte-Verhalten, Migration, Wiederherstellung und der konkrete Produktvertrag bleiben anschließend gesondert zu prüfen.
