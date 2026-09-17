# Übergabe: vollständige Produktentwicklung

Stand: 17.09.2026. Arbeitszweig: `codex/vokabeltrainer-v1`, aus dem geprüften Probe-Zweig abgeleitet. `main` bleibt unverändert. Aktuellen Commit und Remote bei Übernahme frisch prüfen.

## Auftrag und Reihenfolge

Der Nutzer möchte zuerst die vollständige App nach dem bestätigten Gesamtentwurf fertigstellen und erst anschließend beim Freund auf iPhone/iPad testen. Die bisherige frühe Geräteprüfung blockiert die Entwicklung damit ausdrücklich nicht mehr. Sie bleibt eine offene Abnahme, keine angenommene Plattformgarantie. Keine erneute pauschale Design-/Startfreigabe verlangen. Hosting, Kontenänderungen, Kosten oder Repository-Sichtbarkeit werden durch diesen Auftrag nicht automatisch geändert.

## Ausgangspunkt

Die synthetische Probe bleibt am Web-Root erhalten, einschließlich ihrer getrennten Browserdaten. Automatisierte Basis: 74 Node-Tests und zwölf Browser-Szenarien. Vom Nutzer bestätigt: echte Google-Anmeldung, Abgleich zwischen zwei Browsern desselben Rechners in beide Richtungen, Offlineantwort mit späterem Upload, erneute Anmeldung, Sicherung/Rücksetzung sowie separat erhaltene alte Antwort auf beiden Seiten. Vollständiger Nachweis und Grenzen: [Probebericht](../reports/2026-09-17-google-drive-probe.md).

## Umsetzung

Der bestehende isolierte Worktree wird auf dem neuen Entwicklungszweig weiterverwendet. Die Produkt-App entsteht unter `trainer/`, mit getrennten Modulen, Datenbank, Cache und Drive-Kennungen. Keine automatische Übernahme von Probe-Daten. Maßgeblich bleiben [Anforderungen](../ANFORDERUNGEN.md) und [Gesamtentwurf](../superpowers/specs/2026-09-16-vokabeltrainer-design.md).

[Umsetzungsplan](../superpowers/plans/2026-09-17-vokabeltrainer-v1.md) und [Datenvertrag](../PRODUKT-DATENFORMAT.md) wurden ausgearbeitet mit GPT-6 Astra bei hoher Denktiefe. Für abgegrenzte Implementierung und Aufgabenprüfungen ist GPT-5.6 Sol bei hoher Denktiefe vorgesehen; die Gesamtprüfung erfolgt mit Astra. Noch keine Produktfunktion allein aufgrund des Plans als implementiert bezeichnen. Aktuelle Implementierungs- und Prüfbelege werden hier nach jedem Paket ergänzt.

## Noch offen

Vollständige Produktimplementierung, reale Apple-Geräteabnahme und abgestimmte HTTPS-Bereitstellung. Kein Freund wird ohne Auftrag kontaktiert. Keine echten Lernprofile oder Google-Zugangsdaten ins Repository übernehmen.
