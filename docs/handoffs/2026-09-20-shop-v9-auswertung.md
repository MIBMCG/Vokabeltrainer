# Übergabe: Bericht 9 ausgewertet – Ordnerkoordination teilweise bestätigt

**Historische Übergabe:** Der Nutzer hat danach mit „Dann geht es nun weiter“ fortgesetzt. Entwurf, Implementierungsplan und Umsetzung des nächsten zusammenhängenden Kaufversuchs stehen in der [neueren Übergabe](2026-09-20-immutable-purchase-probe.md). Die folgenden Befunde zu Bericht9 bleiben erhalten; die damalige Aussage „noch kein ausführbarer Plan“ beschreibt nur diesen früheren Stand.

Stand: 20.09.2026. Branch `codex/vokabeltrainer-v1`, Ausgangspunkt `cc979f495f746f2a27b41c7422c136c9c34ee08c`, Arbeitsbaum zu Beginn sauber. Der Nutzer hat `shop-probe-bericht9.json` zur Auswertung übergeben. C gilt weiter; kein Backend- oder Punktewechsel.

## Ergebnis

Der echte Lauf hat **3 bestandene und 1 fehlgeschlagenen Check**:

- Ordner-Fixture erfolgreich.
- Künstlich veränderte ETag: **500** statt erwarteter 412; Properties anschließend vollständig gleich. Ursache des 500 offen; Fall bleibt fehlgeschlagen.
- Verbrauchte echte ETag: erster PUT **200**, zweiter PUT **412**; vollständiger Gewinner samt Erhaltungsmarker bestätigt.
- Parallelfall: Kandidat A **412**, Kandidat B **200**; vollständiger Gewinner B bestätigt.

Alle Zielchecks erreichen die Nachlese ohne Lesestabilitätsabbruch. Erster positiver Teilnachweis für den isolierten v2-Ordner-Metadatenpfad in diesem Lauf; keine allgemeine Garantie und kein Produktkaufnachweis. [Vollständige Auswertung mit Quellhash, Codevergleich und Quellen](../reports/2026-09-20-shop-v9-reallauf.md).

## Änderungen dieses Pakets

Auswertung und aktuelle Einstiegshinweise ergänzt. Der Diagnose-9-Code bleibt unverändert. Die **127/127 Shop-Node- und 20/20 Shop-Browserfälle** aus dem vorigen Paket sind historische Prüfbelege für denselben Code, keine in dieser Auswertung erneut ausgeführten Tests. [Implementierung](../reports/2026-09-20-shop-probe-v9-metadata-coordination.md), [Review](../reports/2026-09-20-shop-probe-v9-review.md).

Für dieses Dokumentationspaket: Datei und Hash geprüft, Ergebnisfelder maschinell ausgewertet, Schreib-/Vergleichslogik gelesen, öffentliche Referenzen geprüft. Dokument- und Diffprüfung vor Commit/Push. Keine Unteragenten, keine neuen Bilder, keine Runtimeänderungen und keine echten Google-Aufrufe. Rohbericht außerhalb des Repositorys erhalten.

Die Dokumentprüfung bestand mit **1115 Dateien, 178 Markdown-Dateien, 847 lokalen Links und 0 Fehlern**; `git diff --check` blieb ohne Befund. Der zugehörige Dokumentationscommit lässt sich portabel mit `git log -1 --format="%H %s" -- docs/handoffs/2026-09-20-shop-v9-auswertung.md` ermitteln. Nach dem Push ist dessen HEAD gegen `origin/codex/vokabeltrainer-v1` zu vergleichen; der Abschlussbericht an den Nutzer enthält den tatsächlich bestätigten Stand.

## Konkreter nächster Schritt

Den vollständigen Vertrag **Ordnerverweis auf unveränderlichen Kaufzustand** konkretisieren; die fünf offenen Nachweispunkte stehen am Ende der Auswertung. Es gibt dafür noch keinen ausführbaren Implementierungsplan. Besonders gemeinsame Initialisierung, sichere Belegkette nach verlorener Antwort und gemeinsame Epochen-/Kaufgrenze benötigen einen konsistenten Entwurf vor Produktintegration. Die bestehende allgemeine Entwicklungsfreigabe und Nutzerwahl C bleiben bestehen; nicht erneut A/B/C oder eine pauschale Startgenehmigung verlangen.

**Jetzt keine weitere Aktion des Nutzers nötig:** Den unveränderten 9er-Lauf nicht wiederholen lassen. Keine Diagnose 10 nur für ein grünes Negativergebnis; 500 nicht als 412 behandeln oder den fehlgeschlagenen Check umwerten. Erst ein neuer fachlich begründeter Versuch mit zusammenhängendem Kaufablauf wäre ein nächster Realtest.

EV01–EV05, Preise 200/400/800, Bildrichtung und klassische Alternative bleiben bestehen. Vier von 76 neuen Bildmotiven vorbereitet; neue Figurenwahl/Käufe nicht ins Produkt integriert. Reale Zwei-Geräte-, iPhone/iPad/Safari/Home-Bildschirm- und HTTPS-Nachweise bleiben offen. Git überträgt Code/Dokumentation, keine Browserdaten oder Anmeldesitzungen.
