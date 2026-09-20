# Übergabe: echter v5-Befund und gezielte Diagnose 6

Stand: 20.09.2026. Branch `codex/vokabeltrainer-v1`, Ausgangspunkt `2e98850b38588515eba0d70522dedc9aaacb44cc`. Die [Avatar-Grundlagen](2026-09-20-avatar-evolution-foundation-und-probe-v5.md) bleiben erhalten: 52 Formkennungen, 76 Bildkennungen, erste vier Drachenquellen; keine neuen Produktkäufe aktiviert.

## Neuer Nutzerbericht

Die Datei `shop-probe-bericht5.json` wurde ausgewertet: **4 bestanden, 7 fehlgeschlagen, 0 unsupported**. Alle sieben Fehler entstehen durch veränderte Dateiversionen während eines Lesevorgangs bei stabiler starker ETag. [Vollständige bereinigte Auswertung](../reports/2026-09-20-shop-v5-reallauf.md).

Sechs Abbrüche entstehen bei der internen Nachlese einer neuen Datei; der Antwortverlustfall scheitert in einer von drei bisher gleich bezeichneten Nachlesungen. Nicht behaupten, dass dieser Bericht zwei angenommene Konkurrenzschreibvorgänge oder eine bestätigte erste PUT-Antwort belegt. Insbesondere die erste Anfrage im Antwortverlustfall kann auch mit einer echten Netzwerkexception einen unklaren Ausgang haben. Im Resetfall bleibt offen, welcher der beiden Durchläufe die Anlageprüfung nicht abschloss.

Die File-Version umfasst laut Google auch unsichtbare serverseitige Änderungen. Deren konkrete Ursache ist unbekannt. `files.get.updateViewedDate` ist im aktuellen Discovery-Dokument bereits standardmäßig `false`; keine vermeintliche Behebung durch ein zusätzliches `false` behaupten.

## Diagnose 6

Der [begrenzte Plan](../superpowers/plans/2026-09-20-shop-probe-v6-diagnostics.md) ergänzt in den ohnehin vorhandenen Metadatenantworten ausschließlich Vergleiche von Inhaltssumme, Revision, Größe und Zeitangaben. Exportiert werden bekannte Zustände `same`, `changed`, `unavailable` sowie feste Lesekontexte. Rohwerte wie IDs, Hashes und Zeitangaben werden nicht exportiert. Fehlende Felder sind nicht mit unveränderten Feldern gleichzusetzen.

Schreibwege, Anzahl der Requests, Versions-/ETag-Stabilität, elf Szenarien und `productReady:false` bleiben erhalten. Keine Wiederholungen, Wartezeiten, ungeschützten Ersatzschreibvorgänge oder automatischen Moduswechsel. Die Diagnose ist keine behauptete Ursachenbehebung.

Die Diagnoseergänzung ist lokal implementiert: 39/39 Transport-, 15/15 Szenario-, 69/69 vollständige Shop-Node- und 10/10 Shop-Browserprüfungen bestanden. Der [Prüfbericht](../reports/2026-09-20-shop-probe-v6-diagnostics.md) trennt die lokalen Simulationen vom weiterhin offenen echten Nachweis. Die [unabhängige Abschlussprüfung](../reports/2026-09-20-shop-probe-v6-review.md) ist ohne offene relevante Befunde abgeschlossen. Es wurde durch die Agenten kein neuer echter Google-Lauf ausgeführt.

Der laufende lokale Server liefert die neue Probeseite und das Modul jeweils mit HTTP 200 aus; sichtbare Diagnoseversion, Berichtskennung und Downloadname sind auf 6 geprüft. Für diesen Schritt war kein Serverneustart notwendig. Es wurde kein Zugriff auf bestehende Browserprofile benötigt.

## Fortsetzung

**Git-Prüfpunkt:** Diagnosecode, Tests, Plan und bereinigte Berichte liegen in `ac8bf43080ca46e512d459fb5302e4d6be980e4e`. Der Push auf `origin/codex/vokabeltrainer-v1` ist erfolgt; lokaler Commit und Remote-SHA wurden danach identisch bestätigt. Die Einstiegspunkte und diese Übergabe folgen in einem reinen Dokumentationscommit. Vor einer Fortsetzung den dann aktuellen Branch-HEAD frisch mit dem Remote vergleichen.

Nach Zusammenführen der Review und Übergabe bestanden die Dokumentprüfung mit 1096 Dateien / 159 Markdown-Dateien / 783 lokalen Links und die Diff-Prüfung ohne Befund. Die unveränderte Produktsuite wurde für diese isolierte Diagnose nicht erneut ausgeführt.

1. Den nächsten Nutzerbericht auswerten: `/shop-probe/` neu laden, sichtbare **Diagnoseversion 6** prüfen, **Drive v2 kohärent (Koordination)** auswählen, mit Google verbinden und die Probe bewusst starten. Anschließend **Bereinigten Bericht herunterladen**; Dateiname `shop-probe-bericht6.json`. Keinen unveränderten v5-Lauf anfordern.
2. Falls die Ursache weiter unbestimmt bleibt, Messstrategie und Architektur bewerten; keine immer neuen identischen Wiederholungen oder gelockerten Bedingungen.
3. Produktmigration und Shopintegration bleiben von belastbarer Kaufkoordination abhängig. Unabhängige Bildproduktion kann weitergehen; bestätigte EV01–EV05 nicht neu zur Abstimmung stellen.

Die Probe liegt unter `http://localhost:4173/shop-probe/`, der Trainer unter `http://localhost:4173/trainer/`. Bei Bedarf im aktuellen Checkout `npm start` ausführen. Browserdaten und Anmeldung werden nicht mit Git übertragen. Reale Zwei-Geräte-/Apple-Abnahmen bleiben offen.

## Rollen

Ursachenrecherche, begrenzte Umsetzung und davon unabhängige Abschlussreview mit GPT‑5.6 Sol / high. Root führt Eingangsprüfung, Auswertung und Übergabe zusammen. Die Rohdatei des Nutzers bleibt außerhalb des Arbeitsbaums; nur die bereinigte Auswertung wird gesichert.
