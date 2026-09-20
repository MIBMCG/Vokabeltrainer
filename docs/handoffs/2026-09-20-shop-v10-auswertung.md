# Übergabe: echte Kaufprobe 10 vollständig bestanden

**Nachfolgende Fortsetzung:** Der Nutzer beauftragte danach die Weiterarbeit. Der daraus ausgearbeitete Integrationsentwurf und sein noch offener Abstimmungsstatus stehen in der [neueren Übergabe](2026-09-20-persistent-purchases-design.md). Die Ergebnisse dieses Google-Laufs bleiben unverändert.

Branch `codex/vokabeltrainer-v1`, isolierter Arbeitsbaum `drive-probe`. Ausgangspunkt `639556c99cdcb9aef9370b812f7822dbb0e8fbfa`; lokaler HEAD und GitHub-Branch wurden vor der Auswertung frisch verglichen und waren gleich. Arbeitsbaum war sauber. Die persönlichen Berichte im übergeordneten Clone bleiben unverändert und unversioniert.

## Ergebnis

Der Nutzer hat `shop-probe-bericht10.json` übergeben. **6/6 Checks bestanden**, keine Fehler oder unsupported-Fälle. Die [vollständige Auswertung](../reports/2026-09-20-shop-v10-reallauf.md) enthält Herkunft, Prüfsumme und konkrete Befunde. Initialisierung, konkurrierende Käufe, Wiederholung, lokal simulierter Antwortverlust und beide Kauf-/Reset-Reihenfolgen funktionieren in diesem echten Google-Lauf wie erwartet. Sowohl Client A als auch Client B kommen in den Konkurrenzfällen als korrekt nachgelesener Gewinner vor.

Der technische Probenumfang ist damit abgeschlossen. Keinen unveränderten Bericht 10 erneut anfordern. Bericht9s künstlicher ETag-/HTTP500-Fall bleibt ein eigener historischer Befund. Keine neue A/B/C-Frage; C, Google Drive ohne zusätzlichen Dienst, Onlinekäufe sowie EV01–EV05 sind weiterhin bestätigt.

## Konkrete Fortsetzung

Als nächstes den **Integrationsentwurf für dauerhafte Kaufaufträge und die Wiederaufnahme nach Browserneustart** anhand der bestehenden Produktmodule und des [Produkt-Datenvertrags](../PRODUKT-DATENFORMAT.md) ausarbeiten. Abdecken:

1. Eindeutiger gemeinsamer Anker pro Bestand/Profil und geprüfte Wiederanbindung in einer neuen Sitzung.
2. Dauerhafte Vorgangskennung und unveränderter Kaufauftrag vor dem ersten Netzschritt; keine Doppelabbuchung nach unklarer Antwort oder Neustart.
3. Verifizierte echte Lernpunkte und Produktpreise statt synthetischer 1000-Punkte-Initialisierung.
4. Gemeinsame Grenze für Kauf, Reset und Backup-Wiederherstellung sowie kompatibler Übergang und Verhalten alter App-Versionen.
5. Dauerhafte Belegaufbewahrung und Wachstum über die 64-Beleg-Schutzgrenze der Probe hinaus.

Das ist noch kein fertiger Implementierungsplan. Vor dem größeren Integrationspaket den konkreten Entwurf und seine Grenzen abstimmen; bestehende Entscheidungen nicht erneut öffnen und keine allgemeine Startgenehmigung verlangen. Weitere Bildproduktion ist fachlich unabhängig. Vier von 76 Motiven sind vorbereitet; der bestätigte Drachenstil und Preise 200/400/800 bleiben erhalten.

## Prüfstand und Grenzen

Dieses Paket enthält ausschließlich Auswertung und aktualisierte Projektdokumentation. Die JSON-Konsistenzprüfung ist mit Exit0 bestanden. `npm run check:docs` prüfte 185 Markdown-Dateien und 874 lokale Links ohne Fehler; `git diff --check` war ohne Befund. Die zuvor ausgeführten 172 Shop-Node-, 24 Browser- und 6 Serverprüfungen gehören zum Implementierungsstand `639556c`; sie wurden für diese Dokumentauswertung nicht wiederholt.

Kein eigener Google-Aufruf. Der übergebene Lauf nutzt zwei logische Clients in derselben Sitzung. Browserneustart, neue Transportinstanz, echte Produktpunkte, Backups/Altclients, physische Zwei-Geräte-/Apple-Abnahme und HTTPS-Bereitstellung bleiben offen. Der Produktshop bleibt nicht integriert; `productReady:false` ist weiterhin korrekt.

Veröffentlichungsziel dieses Dokumentationspakets ist derselbe GitHub-Branch. Der Auswertungscommit folgt auf `639556c`; bei Wiederaufnahme HEAD, Remote und lokale Änderungen frisch vergleichen. Git überträgt keine Browserdaten oder Google-Anmeldungen.
