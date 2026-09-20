# Echter Drive-Probelauf mit Diagnoseversion 4

Stand: 20.09.2026. Ausgewertet wurde die vom Nutzer bereitgestellte Ergebnisdatei `shop-probe-bericht4.json`. Sie wurde ausschließlich als Datenquelle gelesen. Es werden keine Datei-IDs, Zugangsdaten oder Rohkennungen in das Repository übernommen.

## Ergebnis

Der Lauf verwendete weiterhin die Auswahl `v2-json`: Die starke ETag-Kennung war im Browser lesbar. Insgesamt bestanden **3 Fälle**, **8 Fälle schlugen fehl**, **0 Fälle waren unsupported**; `productReady` blieb `false`.

Die neue Diagnose trennt zwei Befunde:

- Bei mehreren Nachlesefällen änderte sich die v3-Dateiversion bereits während der Stabilitätsprüfung, obwohl das starke v2-JSON-ETag unverändert blieb. Dadurch brachen Versionskennung, Antwortverlust, Reset-Rennen und Create-Konflikt vor ihrer eigentlichen Szenarioprüfung mit `changed-during-read` ab.
- Bei Initialisierung und zwei parallelen Käufen wurden jeweils **2 Schreibversuche angenommen, 0 als veraltet abgewiesen und 0 anders abgewiesen**. Damit akzeptierte der verwendete HTTP-Schreibweg beide Versuche mit derselben `If-Match`-Grundlage.

Bestanden haben das Anlegen und Rücklesen des Probeordners, der Schutz vor einer doppelten synthetischen Ausgabe bei bereits vorhandenem Vorgang sowie die lokale Regel, aus einer konfliktbehafteten Grundlage kein Guthaben abzuleiten. Diese Einzelergebnisse belegen keine sichere parallele Kaufkoordination.

## Belastbare Einordnung

Der Kandidat kombiniert eine starke, über Drive v2 gelesene JSON-ETag-Kennung mit Schreibvorgängen über Drive v3. Der reale Lauf zeigt für Initialisierung und zwei Käufe, dass beide konkurrierenden HTTP-Anfragen angenommen wurden. Deshalb ist nicht nachgewiesen, dass diese gemischte v2-/v3-Klammer genau einen Gewinner erzwingt. Sie darf nicht als exklusiver Kauf-Guard in das Produkt übernommen werden.

Das Ergebnis beweist weder, dass alle Google-Drive-Verfahren ungeeignet sind, noch allein einen dauerhaft gespeicherten doppelten Geldabzug im Produkt. Die Probe verwendet synthetische Kaufdaten, zwei logische Clients im selben Browser und keinen echten Leitungsabbruch. Produktdaten, Altgeräte, Backups und zwei physische Geräte wurden nicht geprüft.

Ein weiterer unveränderter Wiederholungslauf ist nicht erforderlich. Falls die Shoptechnik später fortgesetzt wird, braucht sie einen ausdrücklich benannten neuen Synchronisations- oder Schreibkandidaten mit eigener Begründung und Realprüfung. Die neue Avatar-Entwicklungsrichtung kann unabhängig als Bildkonzept beurteilt werden; Preise, Kaufdatenmodell und Produktintegration bleiben offen.
