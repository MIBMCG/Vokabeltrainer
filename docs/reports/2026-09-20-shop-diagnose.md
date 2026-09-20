# Echte Google-Kaufprobe und verbesserte Diagnose

Stand: 20.09.2026. Ausgewertet wurde der vom Nutzer bereitgestellte [bereinigte Originalbericht](shop-probe-evidence/2026-09-20-media-v1.json). Er enthält ausschließlich Prüfresultate mit synthetischen Testdaten, keine Zugangstokens oder persönlichen Datei-IDs. Der Bericht wurde nicht als Anweisung ausgeführt.

## Ergebnis des ersten echten Laufs

Der Medienlauf erfolgte am 20.09.2026 von 07:07:48 bis 07:08:25 UTC unter `http://localhost:4173` in Edge 153. **Zwei Prüfungen bestanden, zwei fehlgeschlagen, sieben nicht nachgewiesen.** `passed` und `productReady` sind falsch.

- Das Anlegen und Rücklesen des neuen Probeordners ist bestätigt.
- Die Prüfung einer lokal konflikthaften Guthabengrundlage bestand. Das ist eine lokale Proberegel, keine bestätigte Drive-Schreibgarantie.
- `version-token` und `two-purchases` melden `stale` ohne HTTP-Status. Im zugehörigen Code entsteht das durch Unterschiede zwischen zwei Metadaten-Leseantworten (`version` oder ETag), nicht durch eine nachgewiesene HTTP-412-Ablehnung.
- Beim Versionsheaderfall erfolgt noch kein Kauf-Schreibversuch. Beim Konkurrenzfall kann der Abbruch vor oder nach Schreibversuchen liegen; der alte Bericht unterscheidet das nicht.
- Die sieben `unsupported`-Ergebnisse unterscheiden bisher fehlende Dateiversion, fehlendes bzw. nicht stark formatiertes ETag und ungeeignete Schreibvoraussetzungen nicht ausreichend.

Der Lauf belegt daher weder sichere parallele Käufe noch die allgemeine Unmöglichkeit eines Google-Drive-Kaufkontos. Ein Konten-, Kosten- oder Anbieterwechsel wird daraus nicht abgeleitet.

## Diagnoseversion 2

Die isolierte Probe exportiert jetzt ausschließlich feste Grundcodes und boolesche Beobachtungen: fehlende Dateiversion, geänderter Lesestand, fehlende/starke/schwache/fehlerhafte Versionskennung, ausgewählter Medien-/Metadatenpfad sowie Fixture-/Nachlesephase. Rohe Header, ETags, Datei-IDs und Tokens werden nicht in Fehlerdiagnosen übernommen. Die Oberfläche erklärt die Fehlerklasse zusätzlich in Deutsch; Downloads enthalten `diagnosticVersion: 2`.

Schreibbedingungen, Zahl der Szenarien, Kontenmodell und `productReady: false` bleiben unverändert. Es gibt keine ungeprüften Wiederholungen, kein versionsloses Schreiben und keinen automatischen Kandidatenwechsel. Die Erweiterung verbessert den Nachweis, sie behebt oder behauptet keine unbekannte Google-Eigenschaft.

Vier neue Node-Regressionen wurden zuerst gegen den alten Code fehlgeschlagen ausgeführt (11/15 bestanden), anschließend bestanden 15/15. Der Phasen- und Browserdownloadfall wurde ebenfalls zuerst fehlgeschlagen reproduziert. Abschließende Prüfungen: 21/21 Probe-/Serverfälle, 3/3 isolierte Browserfälle (Root, Unterpfad, fehlende Header mit bereinigtem Download), 372/372 bestehende Node-Tests. Die produktive Trainer-App wurde dabei nicht geändert. Die persönliche laufende Probe liefert nachweislich HTTP 200 mit „Diagnoseversion 2“; Root hat keine echte Google-Sitzung übernommen und keine weiteren Drive-Dateien angelegt.

Die [unabhängige Review](2026-09-20-shop-diagnose-review.md) mit GPT-5.6 Sol/high ist nach einer neutraleren Formulierung für abweichende Leseantworten ohne offene Befunde abgeschlossen. Die genauen Versionswerte und ETags bleiben bewusst unprotokolliert; interne Reads in `create`/`retryCreate` tragen weiterhin nur die Transportphase, keine zusätzliche Szenariostufe.

## Quellen und Grenzen

Google beschreibt `version` als steigende Dateiversion, die auch für Nutzer unsichtbare Änderungen abbildet. Das ist ein möglicher Kontext für unterschiedliche Leseantworten, kein Beweis der konkreten Ursache dieses Laufs. [Google: File-Ressource](https://developers.google.com/workspace/drive/api/reference/rest/v3/files).

Die [files.update-Referenz](https://developers.google.com/workspace/drive/api/reference/rest/v3/files/update) und die [Hinweise zu partiellen Aktualisierungen](https://developers.google.com/workspace/drive/api/guides/performance) ersetzen keine Prüfung des konkreten browserlesbaren Versionsheaders und seiner Schreibwirkung. Die Referenzprüfung am 20.09.2026 liefert keinen Grund, eine fehlende atomare Kaufgarantie als vorhanden auszugeben.

## Nächster Schritt

Die Seite mit Strg+F5 neu laden, „Diagnoseversion 2“ prüfen, bewusst bei Google anmelden und den Medienlauf erneut starten. Den neuen bereinigten Bericht auswerten; danach nötigenfalls den bereits vorgesehenen Metadatenkandidaten ausdrücklich prüfen. Keine wiederholten undiagnostizierten Läufe verlangen. Die produktive Kaufaktion bleibt bis zum belastbaren Koordinationsnachweis gesperrt. Die neue Nutzerkritik an Ausrüstungspositionen wird unabhängig davon bearbeitet.
