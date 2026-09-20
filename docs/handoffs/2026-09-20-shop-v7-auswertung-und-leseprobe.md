# Übergabe: Bericht 7 ausgewertet, Lesekontrolle eingrenzen

**Historischer Zwischenstand:** Der hier angeforderte 8er-Lauf ist inzwischen ausgeführt und ausgewertet. Nächste Schritte ausschließlich aus der [aktuellen Übergabe](2026-09-20-shop-v8-auswertung-und-metadatenprobe.md) übernehmen; keinen unveränderten 8er-Lauf nochmals anfordern.

Stand: 20.09.2026. Branch `codex/vokabeltrainer-v1`, Ausgangspunkt `a802a0e512682891ff65e98a7085812986791f94`, Arbeitsbaum zu Beginn sauber. Nutzer hat `shop-probe-bericht7.json` zur Auswertung übergeben; Nutzerwahl C und die Entwicklungsfreigabe gelten fort.

**Gesicherter Code- und Dokumentationsstand:** `0800733e8cbb50d6a64a3c8193018d8ad543deda` ist auf `origin/codex/vokabeltrainer-v1` veröffentlicht. Nach dem Push stimmten lokales HEAD und der über `git ls-remote` gelesene Branch exakt überein; der Arbeitsbaum war sauber. Diese anschließende Dokumentation des Nachweises verändert keinen geprüften Programmcode.

## Gesicherte Erkenntnis

Der echte Diagnose-7-Lauf enthält **1 bestandenen und 1 fehlgeschlagenen Check**. Der Probeordner wurde angelegt. Die JSON-Testdatei scheitert bereits bei `create-verification`: nur die allgemeine Dateiversion unterscheidet sich zwischen zwei Metadatenantworten. Der bedingte Negativ-PUT wurde nicht erreicht; `actual:stale` ist keine beobachtete HTTP-412-Antwort. Rohdatei nicht committen. [Auswertung, Quellhash und Ursachenprüfung](../reports/2026-09-20-shop-v7-reallauf.md).

Unabhängige Codeanalyse bestätigt die strikt sequenzielle Requestfolge und identische Metadatenprojektion. Serverinterne Erstellungsnacharbeit ist plausibel, aber unbewiesen. Der Browsercache ist bisher nicht ausgeschlossen, erklärt den Unterschied nicht automatisch. Der abgekündigte GET-Parameter `updateViewedDate` ist laut Discovery-Schema bereits standardmäßig `false`; ihn explizit zu setzen ist kein begründeter Fix.

## Begrenzte Folgearbeit

Der [Diagnose-8-Plan](../superpowers/plans/2026-09-20-shop-probe-v8-read-observation.md) erweitert ausschließlich die getrennte Shop-Probe. Neue eigene synthetische Datei, vollständig validierter Erstellungsresponse, dann Metadaten M1 → M2 → Medieninhalt → M3. Die vier Diagnose-GETs umgehen den HTTP-Cache; keine Wartezeit, keine Wiederholung, kein bedingter PUT. Rohwerte werden nicht exportiert. Es werden nur die Richtung der Versionsunterschiede, Vergleichszustände und ein bereinigtes Medienergebnis erfasst.

Eine reine Versionsabweichung darf im Beobachtungspfad zu Ende gemessen werden, gibt aber keinen Snapshot zum Schreiben frei. Auth-, Binding-, HTTP-, Parse- oder Netzwerkfehler stoppen mit den bereits erhobenen bereinigten Beobachtungen. Die bisherigen `create`-/`read`-Snapshotprüfungen und Schreibpfade bleiben unverändert.

Die Umsetzung und lokalen Prüfungen sind abgeschlossen: **109/109 Shop-Node-Tests und 16/16 Shop-Browserfälle bestanden**. [Umsetzung und TDD-Nachweise](../reports/2026-09-20-shop-probe-v8-read-observation.md). Eine stabile Leseprobe wäre weiterhin kein Nachweis sicherer Käufe. Keine erneute unveränderte Diagnose-7-Probe oder vollständige 11er-Probe anfordern.

Ausgeführt wurden `npm run test:shop-probe` und `npm run test:shop-probe:browser` einmal auf finalem Code; die Rohprotokolle in `.superpowers/sdd/2026-09-20-shop-probe-v8/` wurden vom Root gelesen und bleiben ignoriert. Die unveränderten Trainer-Gesamtsuiten wurden nicht wiederholt. Die vorab durchgeführte unabhängige Kernreview fand eine zu großzügige Vollständigkeitsbewertung; der enge Guard-Fix wurde mit RED 0/4 und GREEN 4/4 belegt und ist in beiden finalen Suiten enthalten.

Die [unabhängige Abschlussreview](../reports/2026-09-20-shop-probe-v8-review.md) ist ohne offene relevante Befunde abgeschlossen. Die mögliche zusätzliche Suche nach der zweiten synthetischen ID im Browserbericht bleibt eine optionale Testhärtung, kein Befund im geprüften Exportpfad. Die abschließende Dokumentprüfung umfasst 1108 Dateien, 171 Markdown-Dateien und 820 lokale Links ohne Fehler; `git diff --check` ist ohne Befund.

Der laufende Server lieferte die Shop-Seite und `src/shop-probe/main.js` jeweils mit HTTP 200: sichtbare Diagnoseversion 8, neue Leseauswahl, Diagnoseversion und Downloadname 8 im Modul. Keine neuen Module und kein Serverneustart waren erforderlich. Die vorhandenen Service Worker behandeln fremde Origins nicht; die Googleabrufe werden dadurch nicht aus einem eigenen Appcache geliefert.

## Nächster echter Lauf nach technischem Abschluss

1. Im richtigen Checkout bei Bedarf `npm start` starten. `http://localhost:4173/shop-probe/` neu laden; oben muss **Diagnoseversion 8** stehen.
2. Quelle **Drive v2 kohärent (Koordination)** und Prüfumfang **Dateilesen gezielt untersuchen** wählen. Keine andere Quelle wird automatisch ausgewählt.
3. Mit Google verbinden, der Anlage neuer synthetischer Dateien zustimmen und die Probe einmal starten. Die Leseprobe erstellt Testdateien, führt aber keinen bedingten Kauf-Schreibversuch aus.
4. Den bereinigten Bericht **shop-probe-bericht8.json** herunterladen und zur Auswertung übergeben. Die zwei Checks bewerten Ordneranlage und Lesemessung, keine Kaufkoordination.

Bei einem Abbruch die vorhandene Teilevidenz auswerten. Keine weitere unveränderte Wiederholung anfordern, um lediglich ein grünes Ergebnis zu erhalten.

## Weiterarbeit und Grenzen

- O-KO01 ist mit **C** beantwortet; keine erneute Richtungsfrage, kein Backend-/Cloudwechsel, keine Umstellung auf Punkte ohne Verbrauch.
- EV01–EV05, Preise, Bildstil und klassische Alternative bleiben bestehen. Vier von 76 neuen Bildmotiven sind vorbereitet; keine Produktshop-Freigabe aus einer Probe ableiten.
- Codeanalyse und Umsetzung: getrennte Agenten **GPT-5.6 Sol, Denktiefe hoch**. Root dokumentiert, prüft die Ergebnisse und sichert Git. Keine echten Google-Aufrufe durch Agenten; offizielle Referenzen sind öffentlich recherchiert.
- Später genau einen ausdrücklich gewählten Diagnose-8-Leseumfang auswerten. Unterschied bereits M1→M2 widerlegt Medienabruf als notwendigen Auslöser dieses Unterschieds. Unterschied nur M2→M3 belegt zunächst lediglich das Zeitfenster, keine Kausalität. Allein ein stabiler Lauf erklärt Bericht 7 nicht rückwirkend.
- Physische Zwei-Geräte-Prüfung, Apple/Safari/Home-Bildschirm und HTTPS-Bereitstellung bleiben offen. Git überträgt keine Browserdaten oder Anmeldesitzungen.
