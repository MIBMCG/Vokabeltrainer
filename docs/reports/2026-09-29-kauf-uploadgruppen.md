# Kauf: größere Uploadgruppen

Stand: 29.09.2026. Der Nutzer hat den begrenzten Entwurf aus der
[Restlatenzdiagnose](2026-09-29-restwartezeiten.md) mit „ja, Teste das“ bestätigt.
Ausgangspunkt ist `7deb699`; das Paket erhöht die Kaufgruppe von drei auf
höchstens sechs gleichzeitig übertragenen und nachgelesenen Dateien.

## Änderung und Grenzen

Der Kaufdienst gruppiert ausschließlich die bereits dauerhaft gespeicherten
Uploads neu. Der Transport akzeptiert dieselbe Obergrenze. Der normale
Fünf-Dateien-Kauf benötigt dadurch eine statt zwei Uploadgruppen. Größere
Käufe beginnen die nächste Gruppe erst nach vollständiger Prüfung der ersten.

Konten- und Konfigurationsprüfung, Inhaltsnachweis, gespeicherter Auftrag,
reservierte IDs, bedingter Pointerwechsel und Wiederaufnahme bleiben erhalten.
Bei einem Fehler wartet die Gruppe auf bereits gestartete Prüfungen und
veröffentlicht keinen Kaufkopf. Die Wiederaufnahme verwendet dieselben IDs
und berechnet den Kauf genau einmal. Kein Datenformat, Anbieter oder
Kontenmodell wird verändert. Die Lernbereichsübernahme gehört nicht zu diesem
Paket. Der Service Worker wird auf Cache v40 erhöht, Updateprüfungen verwenden
v41 als nächste Testversion.

## Vergleich mit gleicher künstlicher Netzverzögerung

Die Messung verwendet den tatsächlichen Kaufdienst, Server-Anmeldeadapter und
Proxy gegen eine lokale Google-Nachbildung. Alle Daten sind synthetisch;
echte Netzwerkzugriffe sind im Diagnosehelfer gesperrt. Je Google-Anfrage
werden 500 ms ergänzt. Browser-, IndexedDB-, D1- und reale Google-Latenzen
sind nicht enthalten. Das ist keine reale Geräte- oder Kaufabnahme.

| Messgröße | Vorher | Nachher |
|---|---:|---:|
| Vorschau | 20 ms | 21 ms |
| Bestätigung | 10.887 ms | 8.761 ms |
| Vorschau und Bestätigung insgesamt | 10.907 ms | 8.782 ms |
| HTTP-Anfragen der Bestätigung | 31 | 31 |
| Gleichzeitig laufende Anfragen | 3 | 5 |
| Uploadgruppen beim Fünf-Dateien-Kauf | 2 | 1 |
| Synthetische Abhängigkeitsstufen | 19 | 15 |

Die gesamte gemessene Wartezeit sinkt um 2.125 ms beziehungsweise 19,5 %.
Alle 31 Anfragen bleiben erhalten: 18 Metadatenabrufe, eine ID-Reservierung,
sechs Inhaltsabrufe, fünf Uploads und ein Pointerwechsel. Der bestätigte Kauf
kostet 200 Punkte; 1.600 Lernpunkte und 1.400 verfügbare Punkte sind geprüft.
Ein vorheriger fokussierter Testlauf ergab 20 ms plus 8.614 ms und bestätigt
die Größenordnung. Eine verlässliche Zusage unter zehn Sekunden im echten
Betrieb lässt sich daraus noch nicht ableiten.

## Prüfbelege

Vor der Implementierung scheiterten die neuen Tests gezielt an der alten
Gruppierung `[3, 2]` beziehungsweise der Ablehnung von sechs Dateien.
Nachher bestehen 147/147 gezielte Kauf-, Transport-, Wiederaufnahme- und
Performancetests. Die neuen Fälle prüfen eine Fünfergruppe, die Sechsergrenze
mit Folgerunde, sieben abgewiesene Dateien, einen Fehler an später Stelle
während noch laufender Inhaltsprüfung sowie Wiederaufnahme nach Teilverlust
und verlorener Antwort mit unveränderten IDs und genau einer Abbuchung.

Die finale Gesamtprüfung `npm.cmd test` besteht mit 659/659 Tests, null
Fehlern und 83.531,978 ms Laufzeit. Alle 13 ausgewählten Browserfälle bestehen
ebenfalls: acht Kaufoberflächenfälle einschließlich Kauf, Wiederöffnung,
Offlinebetrieb, veralteter Vorschau und verlorener Antwort, dazu Updatehinweis,
fehlgeschlagene Cacheinstallation, Offline-Browserneustart, kontrollierte
Updateübernahme und Offlinebilder. Laufzeit: 60.898,4837 ms. Das sind getrennte
synthetische Browserprofile, keine Prüfung echter Familienbestände.

Unabhängige Aufgaben- und Abschlussprüfung ohne Befunde; die Bedingungen
der Abschlussprüfung sind durch Gesamt- und Browserlauf erfüllt. Der geprüfte
Diff ist unverändert als `31fcf02229eee8e866d607b9d23cdaa601677680`
integriert und per tatsächlichem Remotevergleich auf GitHub bestätigt.
Cache v40 ist privat bereitgestellt. Worker-Version
`670e5476-ab52-4d62-9112-1f38c66cb475` ist seit
29.09.2026, 18:28:31.123 UTC zu 100 % aktiv. Die Vorbereitung umfasst 199
öffentliche Dateien; neu hochgeladen wurden Kaufdienst, Kauftransport und
Service Worker. Am 29.09.2026 um 18:30:12.200 UTC wurden zwölf ausgelieferte
Dateien bytegenau mit dem vorbereiteten Paket verglichen, einschließlich
beider Kaufmodule und Service Worker. Alle stimmen überein.

Im vorhandenen Codex-Testbrowser wurde das angebotene Update über „Jetzt
aktualisieren“ übernommen. Danach sind 40 verfügbare Punkte, 2.040 Lernpunkte,
Level 11 und Drachenstufe 4 als ausgewählte Figur im DOM bestätigt; der
Updatehinweis ist verschwunden. Der unmittelbar nach dem vorbereitenden
Neuladen sichtbare Google-Hinweis verschwand beim Abschluss der Sitzungsprüfung
ohne neue Anmeldung. Auch nach der Updateübernahme ist kein Verbindungshinweis
sichtbar. Daraus folgt kein Nachweis einer natürlichen Token-Erneuerung.
Der Familien-Chrome wurde nicht verwendet.

## Nachweisgrenzen und nächster Schritt

Der letzte echte Kaufnachweis bleibt die vom Nutzer gemeldete Bestätigung in
17 Sekunden zuzüglich 113 ms Vorschau auf dem damaligen Stand. Für dieses
Paket wurde kein echter Kauf ausgelöst. Testpunkte, Drive-Bindung und
vorhandene Familienbestände werden nicht verändert oder neu eingerichtet.
Natürlicher Tokenablauf sowie physische Zweitgerät-, iPhone-/iPad-, Safari-
und Home-Bildschirm-Abnahmen bleiben offen. Für den separaten Praxistest des
Tabellenimports fehlen weiterhin typische Wörter samt Kinder-/Lektionszuordnung.
