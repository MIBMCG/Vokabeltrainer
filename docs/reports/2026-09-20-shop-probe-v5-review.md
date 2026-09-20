# Unabhängige Review: Shop-Probe v5

Stand: 20.09.2026. Prüfer: GPT-6 Astra mit hoher Denktiefe. Geprüft wurde das isolierte v5-Paket im Arbeitsbaum von `codex/vokabeltrainer-v1` gegenüber `650cee75d6a652aee5f000df8b7cfdc66752179b`. Avatarbilder, Katalog und weitere Einstiegspunktdokumentation waren nicht Teil dieser Codeprüfung.

## Urteil

Spezifikations- und Qualitätsprüfung bestanden. Keine offenen P1-/P2-Befunde und keine sonstigen handlungsrelevanten Befunde im geprüften Paket. Die Freigabe gilt ausschließlich für die lokale technische Probe und ihre gesonderte REAL-Prüfung; sie aktiviert keinen Produktshop und behauptet keine Google-seitige Compare-and-swap-Garantie.

## Geprüfter Vertrag

- Der eigene Transport verwendet v3 ausschließlich zur ID-Reservierung und Anlage. Gebundene Metadaten, Medieninhalt und beide bedingten PUT-Wege verwenden v2. Die Oberfläche und Diagnose 5 nennen diese Grenze korrekt.
- Der Snapshot prüft vor und nach dem Medienabruf die eigene Datei-/Sitzungsbindung sowie unveränderte v2-Version und ETag. Ordner erhalten zwei Metadatenlesungen ohne Medienabruf. Die vom Aufrufer gelieferte starke ETag erreicht unverändert `If-Match`; es gibt keine Auffrischung vor dem Schreiben und keinen automatischen Retry.
- Titel, MIME-Typ, Papierkorbstatus, Elternbezug sowie private eindeutige String-Properties werden geprüft. Der automatisch gesetzte My-Drive-Parent wird intern gebunden; Kinddateien behalten ihren exakten Probeordner. Map-basierte Normalisierung erhält auch besondere Schlüssel wie `__proto__` ohne Prototypänderung und erkennt doppelte Schlüssel. Metadatenupdates erhalten zusätzliche gültige Properties.
- Nur HTTP 412 wird transportseitig `stale`. Die Konkurrenzszenarien verlangen unverändert einen angenommenen und einen veralteten Versuch sowie unabhängige Nachlese. Erfolgreiche Szenarien exportieren weiterhin keine zusätzlichen Konkurrenzzähler; der Bericht erfindet keine fehlenden Einzelwerte.
- Der Fake bildet die v2-Metadatenform ab und kann Medien- und Ordnerbedingungen unabhängig ignorieren. Die Negativkontrollen, Stabilitäts- und Bindungstests passen zum erwarteten Fehlervertrag.
- Die Legacy-Implementierung ist bis auf Import und frühe Delegation unverändert. Die Szenariologik ergänzt ausschließlich den freigegebenen Diagnosewert. Bereinigung, bewusste Startaktion und `productReady:false` bleiben erhalten.
- Serverfreigabe und HTTP-Inhaltstest enthalten das neue Modul. Die Suche in `src/trainer/` und `trainer/` fand weder Probeimporte noch Nutzung von `v2-coherent`.

Die Vorabprüfung hatte die API-Formen anhand der aktuellen Google-Primärdokumentation gegengeprüft: [v2 files.get](https://developers.google.com/workspace/drive/api/reference/rest/v2/files/get), [v2 files.update](https://developers.google.com/workspace/drive/api/reference/rest/v2/files/update) und [v2/v3-Vergleich](https://developers.google.com/workspace/drive/api/guides/v2-to-v3-reference). Diese Quellen bestätigen Endpunkte und Datenformen, nicht die noch zu prüfende exklusive Serverwirkung.

## Prüfbelege und Herkunft

Die Review hat den tatsächlichen Diff, die neue Transport-/Fixture-/Testdatei, den Browser-Harness und den [lokalen Prüfbericht](2026-09-20-shop-probe-v5.md) gelesen. Der Implementierungsbericht dokumentiert frisch bestandene 31/31 fokussierte Transporttests, 56/56 Shop-Node-Tests, 9/9 Shop-Browserfälle, 379/379 vollständige Node-Tests sowie die fehlerfreie Dokumentprüfung mit 1090 Dateien, 153 Markdown-Dateien und 765 lokalen Links. Diese Gesamtläufe wurden in der Review nicht erneut ausgeführt; ihre Zahlen stammen aus dem Implementierungsnachweis.

Unabhängig in dieser Review ausgeführt:

1. Gezielte lokale Gegenprüfung mit synthetischem Fixture: Nach erfolgreicher Anlage wurde ausschließlich der gespeicherte Parent des obersten Probeordners verändert. Die nächste Lesung wurde als `binding` abgewiesen; kein PUT erfolgte.
2. Gezielte lokale Gegenprüfung mit zusätzlicher Fehlereinblendung: Ein Metadaten-PUT veränderte trotz HTTP 412 die Koordinatorbindung. Das Initialisierungsszenario scheiterte ausdrücklich an `initialization-readback`, das Gesamtgate blieb negativ.
3. `git diff --check`: ohne Befund. Git-Status und Abgrenzung gegenüber dem Basiscommit wurden geprüft.

Beide zusätzlichen Gegenprüfungen bestanden. Sie ergänzen die vorhandene Inhaltsgegenprobe für mutierendes HTTP 412 und prüfen die neue Bindung des automatisch gesetzten Parents. Es wurden weder Produktcode noch Tests geändert; einzig dieses Reviewdokument wurde angelegt.

## Verbleibende Grenze

Kein echter Drive-Datenaufruf, keine Kontenänderung und kein REAL-Lauf durch die Review. Der konkrete Google-Browserpfad muss weiterhin gesondert alle elf Szenarien bestehen. Echte Leitungsunterbrechung, zwei physische Geräte, iOS/iPadOS, Produktmigration, Altclient-Verhalten, Backup/Wiederherstellung und Langzeitverhalten bleiben eigenständige offene Nachweise. Ein positives REAL-Ergebnis eröffnet erst einen gesonderten Produktintegrationsentwurf.
