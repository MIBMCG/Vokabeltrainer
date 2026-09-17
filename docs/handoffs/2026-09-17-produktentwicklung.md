# Historische Entwicklungsübergabe bis Task 6

Abgelöst durch die [Laptop-Pausenübergabe](2026-09-17-laptop-pause.md). Die nachfolgenden Angaben beschreiben den vorherigen Zwischenstand.

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

| Paket | Geprüfte Commits | Ergebnis |
| --- | --- | --- |
| 1: Format/Integrität | `2e8b6a2`, `cf99ed7` | Strikte Validierung, Referenzen und Kollisionen |
| 2: Fassungen/Epochen | `5e991bf`, `4527736` | Konfliktköpfe, Support und Altbestände getrennt |
| 3: Lernkern/Belohnungen | `99920da`, `1bbd80b` | Adaptive Projektion und dauerhafte Meilensteine |
| 4: Runden | `49fbfb2` | Feste Auswahl, adaptive Reihenfolge, Wiederaufnahme/Abschluss |
| 5: Speicherung | `43e956a` | Serielle atomare Befehle, Aktualitätsprüfung und Meilensteine |
| 6: Einrichtung/Verwaltung | `da6eb9b`, `86d7bb7` | Browseroberfläche, PIN, Profile/Lektionen/Wörter, Tabellenübernahme |

Alle sechs Pakete sind unabhängig geprüft. Der aktuelle Gesamtlauf bestand **187/187**, der gezielte Adult-Lauf **16/16**. Der echte Edge-Browserlauf bestand **1/1** einschließlich IndexedDB, exklusivem Writer, Neuladen/BFCache, Hintergrund-PIN-Rennen, erhaltenem Setup-Entwurf, expliziter Importklärung und langen Lösungsvarianten. Keine echte Google-Anmeldung oder Apple-Geräteprüfung für die Produkt-App wurde damit behauptet. Ein Minor zur `main`-Semantik ist für Task 11/Finalreview erfasst.

Task 7 setzt jetzt den vollständigen Übungsbildschirm um. Reise/Avatar, Produkt-Sync, vollständige Sicherung/Wiederherstellung und Offline-PWA folgen in den Tasks 8–12. Die vorhandenen Gerüste werden nicht als fertige Funktionen bezeichnet. [Technische Präzisierungen](../ENTWICKLUNGSENTSCHEIDUNGEN.md) erhalten die geklärten Schnittstellen für andere Assistenten.

Die [Benutzungsanleitung](../BENUTZUNG.md) beschreibt die bestätigten Abläufe und kennzeichnet die laufende Entwicklung ausdrücklich.

## Übertragener Zwischenstand

`6e44ce197a860e7adfd27c8bd322f2e528a30e06` wurde auf `origin/codex/vokabeltrainer-v1` übertragen und mit `git ls-remote` identisch bestätigt. Der Zweig enthält die geprüften Tasks 1–5 sowie Planung, Anleitung und das angeforderte [Konzeptbild](../design/2026-09-17-insel-konzept.md); noch keine vollständige Lernoberfläche. Der anschließende Dokumentationscommit hält diesen Nachweis fest. Weiterarbeit läuft, keine erneute Pause beauftragt.

## Noch offen

Vollständige Produktimplementierung, [reale Apple-Geräteabnahme](../GERAETE-ABNAHME.md) und abgestimmte HTTPS-Bereitstellung. Kein Freund wird ohne Auftrag kontaktiert. Keine echten Lernprofile oder Google-Zugangsdaten ins Repository übernehmen.
