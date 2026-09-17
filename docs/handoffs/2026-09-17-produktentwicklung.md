# Übergabe: vollständige Produktentwicklung

Stand: 17.09.2026. Arbeitszweig: `codex/vokabeltrainer-v1`, aus dem geprüften Probe-Zweig abgeleitet. `main` bleibt unverändert. Aktuellen Commit und Remote bei Übernahme frisch prüfen.

## Auftrag und Reihenfolge

Der Nutzer möchte zuerst die vollständige App nach dem bestätigten Gesamtentwurf fertigstellen und erst anschließend beim Freund auf iPhone/iPad testen. Die bisherige frühe Geräteprüfung blockiert die Entwicklung damit ausdrücklich nicht mehr. Sie bleibt eine offene Abnahme, keine angenommene Plattformgarantie. Keine erneute pauschale Design-/Startfreigabe verlangen. Hosting, Kontenänderungen, Kosten oder Repository-Sichtbarkeit werden durch diesen Auftrag nicht automatisch geändert.

## Ausgangspunkt

Die synthetische Probe bleibt am Web-Root erhalten, einschließlich ihrer getrennten Browserdaten. Automatisierte Basis: 74 Node-Tests und zwölf Browser-Szenarien. Vom Nutzer bestätigt: echte Google-Anmeldung, Abgleich zwischen zwei Browsern desselben Rechners in beide Richtungen, Offlineantwort mit späterem Upload, erneute Anmeldung, Sicherung/Rücksetzung sowie separat erhaltene alte Antwort auf beiden Seiten. Vollständiger Nachweis und Grenzen: [Probebericht](../reports/2026-09-17-google-drive-probe.md).

## Umsetzung

Der bestehende isolierte Worktree wird auf dem neuen Entwicklungszweig weiterverwendet. Die Produkt-App entsteht unter `trainer/`, mit getrennten Modulen, Datenbank, Cache und Drive-Kennungen. Keine automatische Übernahme von Probe-Daten. Maßgeblich bleiben [Anforderungen](../ANFORDERUNGEN.md) und [Gesamtentwurf](../superpowers/specs/2026-09-16-vokabeltrainer-design.md).

[Umsetzungsplan](../superpowers/plans/2026-09-17-vokabeltrainer-v1.md) und [Datenvertrag](../PRODUKT-DATENFORMAT.md) wurden ausgearbeitet mit GPT-6 Astra bei hoher Denktiefe. Für abgegrenzte Implementierung und Aufgabenprüfungen ist GPT-5.6 Sol bei hoher Denktiefe vorgesehen; die Gesamtprüfung erfolgt mit Astra. Noch keine Produktfunktion allein aufgrund des Plans als implementiert bezeichnen. Aktuelle Implementierungs- und Prüfbelege werden hier nach jedem Paket ergänzt.

## Implementierung bisher

Task 1 wurde in `2e8b6a2` und `cf99ed7` implementiert: versioniertes Ereignisformat, strikte Validierung, Referenz-/Kollisionsprüfung und synthetische Testbasis. Gezielte Prüfung: 17/17; gesamter Node-Lauf: 91/91 bestanden. Die unabhängige Aufgabenreview ist nach zwei korrigierten Befunden und sauberer Nachprüfung abgeschlossen. Task 2 ist in `5e991bf` und `4527736` implementiert: Inhaltsfassungen, Konfliktköpfe, ursprüngliche Anlegereihenfolge, getrennte Support-/Altbestände und Epochen. Gezielte Prüfung 16/16, Gesamtlauf 108/108. Die Nachprüfung des behobenen Spezialkennungsfehlers ist ohne neuen Befund abgeschlossen. Task 3 ist in `99920da`/`1bbd80b` implementiert und nach vier behobenen Befunden unabhängig freigegeben: Antwortprüfung, Kalenderabstände, Lernprojektion, Punkte/Belohnungen und Erkennung zusammengeführter Lernmeilensteine. Gezielte Prüfung 25/25, Gesamtlauf **135/135**. Task 4 ist in `49fbfb2` implementiert und unabhängig freigegeben: feste Auswahl, adaptive Reihenfolge, Wiederaufnahme und Abschluss. Gezielte Prüfung 14/14, Gesamtlauf **149/149**. Task 5 ergänzt jetzt die atomare Speicherung. Die atomare Speicherung erkannter Meilensteine folgt planmäßig in Task 5. Das ist eine interne Grundlage, noch keine fertige Lernoberfläche.

Die [Benutzungsanleitung](../BENUTZUNG.md) beschreibt die bestätigten Abläufe und kennzeichnet die laufende Entwicklung ausdrücklich.

## Übertragener Zwischenstand

`4c70a89f85176e5594e15faca6b2d886fddd53a3` wurde auf `origin/codex/vokabeltrainer-v1` übertragen und mit `git ls-remote` identisch bestätigt. Der Zweig enthält die geprüften Tasks 1–4 sowie Planung, Anleitung und das angeforderte [Konzeptbild](../design/2026-09-17-insel-konzept.md); noch keine vollständige Lernoberfläche. Der anschließende Dokumentationscommit hält diesen Nachweis fest. Weiterarbeit läuft, keine erneute Pause beauftragt.

## Noch offen

Vollständige Produktimplementierung, [reale Apple-Geräteabnahme](../GERAETE-ABNAHME.md) und abgestimmte HTTPS-Bereitstellung. Kein Freund wird ohne Auftrag kontaktiert. Keine echten Lernprofile oder Google-Zugangsdaten ins Repository übernehmen.
