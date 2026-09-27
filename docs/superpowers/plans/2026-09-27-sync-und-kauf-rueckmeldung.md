# Abgleich und Kaufrückmeldung: Korrekturplan

> Umsetzung mit systematischer Fehlersuche, fokussierten Regressionstests und unabhängiger Review. Ausgangspunkt: `87ac338` auf `codex/vokabeltrainer-v1`.

## Auftrag und Grenzen

Nutzerberichte vom 27.09.2026: Ein manueller Abgleich dauert lange und springt ohne neue Eingabe wieder auf „ausstehend“. Avatar-Käufe dauern ebenfalls lange; wiederholtes Klicken kann mehrere Bestätigungsabfragen öffnen. Die bestehenden Anforderungen an verlustfreien Abgleich, bestätigte Punkte und genau einen wirksamen Kauf bleiben maßgeblich ([Anforderungen](../../ANFORDERUNGEN.md), [Kaufprotokoll](../../KAUFPROTOKOLL.md)). Dies ist eine Fehlerkorrektur im beauftragten Umfang, keine neue Konto- oder Kaufarchitektur.

## Vorgehen

- [x] **Auslöser korrigieren:** `main.js`, `sync/scheduler.js` und Scheduler-Tests. Nur neue lokale Outbox-Ereignisse lösen einen Änderungsabgleich aus; interne Speicherung und importierte Runden nicht. Lokale Runden und Änderungen während eines laufenden Abgleichs bleiben erhalten. Reproduktion: interner Commit darf weder nach zehn Sekunden noch nach Abschluss eines langsamen Laufs einen weiteren Lauf erzeugen.
- [x] **Status und Lesezugriffe:** `sync/drive.js`, `ui/status.js`, Sync-Tests. Laufende Prüfung ohne Uploadbedarf von tatsächlich laufendem Abgleich und wartenden Änderungen unterscheiden. Dateilesevorgänge begrenzt parallel vorbereiten, danach in bisheriger Reihenfolge prüfen/anwenden. Bei Fehlern alle gestarteten Zugriffe abwarten. Versions-, Konto-, Bindungs-, Hash- und Quarantäneprüfungen erhalten.
- [x] **Kaufübertragung beschleunigen:** `purchases/service.js` und gezielte Kaufprüfungen. Bis zu drei bereits persistent geplante, unveränderliche Uploads gleichzeitig übertragen und verifizieren. Erst nach vollständigem Erfolg den gemeinsamen Kaufkopf ändern. Teilfehler müssen wiederholbar bleiben; keine abgeschwächten Transportprüfungen.
- [x] **Sofortige Kaufrückmeldung:** `ui/purchases.js` und isolierter Browsertest. Bereits vor der Angebotsprüfung sichtbar sperren; höchstens eine Bestätigung je Bedienvorgang. Nach Zustimmung klar „Kauf wird abgeschlossen …“ anzeigen, ohne vorweggenommene Freischaltung, Prozentwerte oder Zeitversprechen. Fehler und unbekannter Ausgang bleiben unterscheidbar und fortsetzbar.
- [x] **Abschluss:** Änderungen unabhängig prüfen; relevante Tests, komplette Node-Suite, betroffene Browserfälle und Dokumentverweise prüfen. Service-Worker-Version erhöhen, Übergabe/Arbeitsstand aktualisieren; Commit und autorisierten Entwicklungsbranch pushen, Remote-SHA vergleichen.
- [x] **Zusätzliche Authberichte:** Verbindung nach Reload und teilweise nach wenigen Minuten verloren. Seitenende darf nur die lokale Sitzung löschen; explizites Trennen behält den Widerruf. Verspätete Authfehler dürfen keine neuere Sitzung löschen, PIN-Sperre keine Google-Sitzung beenden. Tokens weiterhin nur im Arbeitsspeicher, Zugriffsanfrage durch bewussten Nutzerklick, keine automatischen Popups oder Backendwechsel. Bearbeitung: GPT-6 Sol/high.
- [x] **Zusätzlicher Kaufbefund:** Meldung „Die unveränderliche Drive-Datei hat sich während des Lesens geändert.“ separat reproduzieren; Änderungen an der Transportprüfung nur mit belegter Ursache und erhaltener Inhalts-/Bindungsprüfung. Bearbeitung: GPT-6 Sol/high. Unabhängige Review des gesamten Korrekturpakets: GPT-6 Astra/high.

- [x] **Zusätzlicher Integrationsbefund:** Gleichzeitige Neuanlage und Hintergrundabgleich dürfen denselben gespeicherten Einrichtungsauftrag nur einmal ausführen. Gemeinsamen laufenden Versuch bei Erfolg und Fehler wieder freigeben; gespeicherte IDs und Wiederaufnahme erhalten. Deterministischer Konkurrenztest sowie gezielte Browserfälle. Diagnose und Nachprüfung: GPT-6 Astra/high; Korrektur: GPT-6 Sol/high.

## Zusammenarbeit und Prüfgrenzen

Scheduler: GPT-6 Sol/high. Kaufübertragung: GPT-6 Sol/high. Kaufoberfläche: GPT-6 Sol/medium. Hauptagent: Status, Lesezugriffe und Integration. Die Zuständigkeiten teilen keine Produktionsdateien; Statusmodell und UI-Beschriftungen werden gemeinsam geprüft. Kauf- und Sync-Transport dürfen gleichzeitig laufen, aber keine bisherige lokale Schreibserialisierung umgehen. Synthetische Parallelitäts- und Anfragezahlen belegen den Mechanismus, keine garantierte Dauer bei echtem Google Drive. Ein persönlicher Google-Abgleich und iOS bleiben Praxisnachweise.
