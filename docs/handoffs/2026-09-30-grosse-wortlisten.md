# Übergabe: große Wortlisten und Google-Abgleich

Stand: 30.09.2026. Nach vollständiger Galerie und GitHub-Sicherung hat der
Nutzer die übrigen Optimierungen beauftragt. Aktueller Produktstand bleibt
`d0fefdf`, Cache v41; Ausgang des neuen Prüfschritts ist Hauptzweig `32b0036`.
Keine Produktänderung oder neue Bereitstellung in diesem Schritt.

Die isolierte Mengenprüfung ist abgeschlossen. Bei einem einzelnen simulierten
Einfügeereignis benötigen 500 Zeilen rund 90 ms Vorschau und 253 ms lokale
Speicherung. Nach Reload bleiben 500 zusätzliche Wortereignisse erhalten;
bei 320/390/768 Pixel kein horizontaler Überlauf. Die zunächst gemessenen
26,6 Sekunden stammen aus einem `fill()`-Lauf mit sehr vielen Eingabeereignissen
und sind keine belegte reale Einfügezeit. Details und Grenzen im
[Mengenbericht](../reports/2026-09-30-grosse-wortlisten.md).

Der nachfolgende vollständig simulierte Google-Abgleich benötigt für 500
Zeilen bei 500 ms Zusatzlatenz pro Anfrage rund 22,4 Sekunden und 41 Anfragen.
Sechs Pakete werden seriell übertragen. Der längere 100-Zeilen-Lauf bleibt
mit seiner Zeitabweichung dokumentiert; daraus keine Skalierungsbehauptung
oder zugesagte reale Dauer ableiten.

## Nächster konkreter Schritt

Der Nutzer bestätigt mit „Ja, so umsetzen“ den kurzen Entwurf: **bis zu drei vorbereitete Lernpakete
gleichzeitig übertragen, alle Dateiprüfungen und die Wiederaufnahme erhalten**.
Den begrenzten Uploadpfad jetzt ändern und Fehler-/Wiederholungsfälle sowie dieselbe 500-Zeilen-
Messung vergleichen. Kein neuer großer Implementierungsplan nötig; dies ist
eine begrenzte Änderung am bestehenden Pakettransport.

Der vorhandene Arbeitsbaum `codex/purchase-batch-checks` ist sauber und kann
nach Fast-Forward auf den Hauptzweig wiederverwendet werden. Keine Bilder neu
erzeugen, keine vorhandenen Test- oder Familienbestände ersetzen. Aktueller
Codex-Teststand bleibt 40 verfügbare Punkte, 2.040 Lernpunkte, Level 11 und
Drachenstufe 4; in dieser Prüfung wurde er nicht benutzt.

Echte Wortliste samt gewünschter Zuordnung, physische Geräteprüfung und
natürlicher Google-Tokenablauf bleiben offen. Lernbereichsübernahme bleibt
zurückgestellt. Fünf Belohnungserweiterungen erst nach den übrigen Optimierungen.
