# Isolierter Kandidat: Drive-v2-ETag aus Dateidaten

Stand: 20.09.2026. Dieser Bericht beschreibt ausschließlich eine technische Erweiterung der getrennten Shop-Probe. Die Trainer-App, ihr Produktabgleich und Kaufaktionen wurden nicht verändert oder freigeschaltet. Es gab keine echten Google-Aufrufe, keine Übernahme einer persönlichen Sitzung und keine Veröffentlichung.

## Anlass und Quellenlage

Der reale bereinigte Bericht der Diagnoseversion 2 meldete für den ausgewählten Medienpfad ein fehlendes v3-ETag in Metadaten- und Medienantworten. Acht Prüfungen blieben deshalb nicht nachgewiesen; der Antwortverlustfall brach bereits bei zwei unterschiedlichen v3-Dateiversionen vor dem vorgesehenen Schreiben ab. Der Bericht belegt damit weiterhin keine atomare Kaufkoordination.

Die offizielle [Drive-v2-Dateireferenz](https://developers.google.com/workspace/drive/api/reference/rest/v2/files) führt `etag` als JSON-Feld der Dateiressource. Die offizielle [Zuordnung von Drive v2 zu v3](https://developers.google.com/workspace/drive/api/guides/v2-to-v3-reference) weist für `Files.etag` in v3 keine Entsprechung aus; `labels.trashed` wird zu `trashed`, private v2-Eigenschaften werden in v3 als `appProperties` geführt. Diese Dokumentation belegt nicht, dass ein aus v2 gelesenes ETag als `If-Match` für einen v3-Schreibaufruf gilt. Genau diese unbekannte Kompatibilität bleibt Gegenstand der Probe.

## Abgegrenzte Umsetzung

Die Oberfläche bietet jetzt ausdrücklich eine dritte Auswahl „Versionskennung aus Dateidaten (Drive v2)“. Es gibt keinen automatischen Rückfall von den bisherigen Medien- oder Metadatenvarianten auf diesen Kandidaten.

Bei der neuen Auswahl bleibt die vorhandene v3-Bindungsprüfung vollständig erhalten: eigene vorab erzeugte ID, Laufkennung, App-Kennung, MIME-Typ, Elternordner, Papierkorbzustand und dezimale v3-Dateiversion. Um den v3-Medienabruf liegen zusätzlich zwei v2-Metadatenabrufe derselben gebundenen ID mit den Feldern `id,mimeType,etag`. Ordner werden ebenfalls zweimal über diese v2-Dateidaten geklammert. Nur ein stark formatiertes und in beiden v2-Antworten identisches JSON-ETag darf als Schreibbedingung weitergereicht werden. Die v3-Dateiversion und ein gegebenenfalls vorhandenes v3-Metadaten-ETag müssen zwischen den bestehenden v3-Metadatenabrufen ebenfalls unverändert bleiben.

Die Schreibwege wurden nicht ersetzt:

- JSON-Inhalt: `PATCH /upload/drive/v3/files/{probeFileId}?uploadType=media`
- Ordnerbindung: `PATCH /drive/v3/files/{probeFolderId}` mit `appProperties`
- Bedingung: `If-Match` mit dem ausdrücklich ausgewählten Kandidaten

Fehlendes, schwaches, fehlerhaft formatiertes oder wechselndes v2-JSON-ETag sperrt den jeweiligen Schreibversuch. Abweichende ID oder abweichender MIME-Typ wird als Bindungsfehler abgewiesen. Ignorierte Bedingungen, verbrauchte Kennungen und ein trotz HTTP 412 veränderter Inhalt können die Szenarien weiterhin nicht bestehen. Es wird weder eine Kennung aus `version` erzeugt noch eine Kennung einer fremden Ressource übernommen.

## Bericht und Datenschutz

Downloads verwenden `diagnosticVersion: 3` und den Dateinamen `shop-probe-bericht3.json`. `apiPaths` nennt bei der neuen Auswahl den v2-Tokenabruf und die unveränderten v3-Lese- und Schreibwege getrennt. Die bereinigte Diagnose kann `etagSource: "v2-json"`, `jsonEtagState` und den booleschen Wert `jsonEtagChanged` enthalten. Rohe ETags, Tokens und Datei-IDs bleiben ausgeschlossen. `productReady` bleibt unabhängig vom Szenarioergebnis immer `false`.

## RED/GREEN und Prüfstand

Die neuen Node-Prüfungen wurden zuerst gegen Diagnoseversion 2 ausgeführt: 15 von 20 bestanden, fünf scheiterten erwartungsgemäß an der fehlenden Auswahl und Diagnosefreigabe. Nach der minimalen Umsetzung bestanden 20 von 20 Probe-Node-Tests.

Frische Abschlussläufe nach der Umsetzung:

- `npm run test:shop-probe`: 20/20 bestanden.
- synthetische Browserprüfung in headless Edge: 5/5 bestanden, darunter erfolgreicher v2-Kandidat bei fehlenden v3-Headern, gesperrter v2-Kandidat bei fehlendem JSON-ETag, Downloadversion/-name und wahrheitsgemäße API-Pfade.
- `npm test`: 372/372 bestehende Node-Tests bestanden.

Alle Google-Grenzen dieser automatisierten Prüfungen waren vollständig synthetisch. Ein grüner Browserfall beweist nur, dass die Probe einen Server mit der angenommenen übergreifenden Bedingungswirkung erkennen kann.

## Verbleibende Grenze

Die [unabhängige Codeprüfung](2026-09-20-shop-v2-review.md) durch GPT-5.6 Sol/high ist ohne offene wesentliche Befunde abgeschlossen. Root bestätigte anschließend frisch 372/372 bestehende Node-, 26/26 Probe-/Server- und 5/5 isolierte Browserfälle. Eine zusätzliche Gegenprobe der Review mit v3-inkompatiblem v2-ETag blieb gesperrt.

Die Kompatibilität eines v2-JSON-ETags mit v3-`If-Match` ist weiterhin **nicht nachgewiesen**. Dafür ist ein bewusst gestarteter echter Lauf mit der dritten Auswahl erforderlich. Erst wenn auch ungültige und verbrauchte Kennung, konkurrierende Medien- und Metadatenänderungen sowie sämtliche Nachlesekontrollen im echten Lauf bestehen, liegt ein Kandidat für den späteren Kaufvertrag vor. Bis dahin bleiben neue Käufe und die Produktintegration gesperrt.
