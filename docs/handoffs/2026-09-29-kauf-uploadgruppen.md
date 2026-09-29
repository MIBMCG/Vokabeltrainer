# Übergabe: größere Kauf-Uploadgruppen

Stand: 29.09.2026. Der Nutzer bestätigt den begrenzten Entwurf mit
„ja, Teste das“. Keine neue Pause. Die vorherige Diagnose braucht keine
erneute Freigabe; das Paket ist umgesetzt.

## Ergebnis

- Produktcommit `31fcf02229eee8e866d607b9d23cdaa601677680` ist in
  `codex/vokabeltrainer-v1` integriert und exakt mit dem GitHub-Zweig verglichen.
- Kaufdateien werden in Gruppen bis sechs statt drei übertragen. Beim
  normalen Fünf-Dateien-Kauf entfällt die zweite Uploadrunde. Alle bestehenden
  Prüfungen, gespeicherten Aufträge und Wiederaufnahmepfade bleiben erhalten.
- Bei 500 ms künstlicher Verzögerung je Google-Anfrage sinkt die gesamte
  Wartezeit von 10,907 auf 8,782 Sekunden: 2,125 Sekunden bzw. 19,5 % weniger.
  Unverändert 31 Anfragen; dies ist keine reale Kaufzeitabnahme.
- 147 gezielte Node-Tests, finale 659/659 Gesamttests, 13/13 Browserfälle und
  unabhängige Aufgaben-/Abschlussreviews PASS. Produktdiff seit Prüfungen
  unverändert; Dokumentation wird anschließend separat gesichert.
- Cache v40 ist privat aktiv. Worker
  `670e5476-ab52-4d62-9112-1f38c66cb475`, seit 18:28:31.123 UTC zu 100 %
  aktiv; zwölf ausgelieferte Dateien sind bytegleich geprüft.
- Kontrolliertes Update im bestehenden Codex-Testbrowser übernommen. Danach
  40 verfügbare Punkte, 2.040 Lernpunkte, Level 11 und Drachenstufe 4 erhalten;
  kein Update- oder Verbindungshinweis. Keine neue Google-Anmeldung nötig.
  Familien-Chrome unberührt, kein echter Kauf ausgelöst.

Messaufbau, Werte und Grenzen: [Bericht](../reports/2026-09-29-kauf-uploadgruppen.md).

## Nächster Schritt

Den echten Kauf bei einer passenden Gelegenheit erneut messen. Im bestehenden
Codex-Testbereich sind weiterhin nur 40 verfügbare Testpunkte vorhanden;
keinen Bestand neu einrichten, importieren, ersetzen oder Guthaben ohne
konkreten Auftrag verändern. Dieses Paket hat keinen echten Kauf ausgelöst.

Die angefragte typische Wortliste mit gewünschter Lektions-/Kinderzuordnung
für den Praxistest des Tabellenimports fehlt weiterhin. Synthetische Wörter
nicht in den Familienbestand übernehmen. Die abgeschlossenen Importkorrekturen
und Kauf-Uploadgruppen nicht erneut implementieren.

Eine Beschleunigung der Lernbereichsübernahme ist nur diagnostiziert und
benötigt einen eigenen begrenzten Entwurf. Natürliche Token-Erneuerung,
physische Zweitgerät-/Apple-Abnahmen, das reale Kaufziel unter zehn Sekunden
und 64 Entwicklungsbilder bleiben offen.
