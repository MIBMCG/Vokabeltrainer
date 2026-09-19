# Ausführungsentscheidungen der Überarbeitung

Diese Entscheidungen betreffen den Arbeitsablauf, nicht neue Produktfunktionen oder Nutzerfreigaben.

| Entscheidung | Grund und Grenze | Verbleibender Aufwand oder Nachteil |
| --- | --- | --- |
| Native PowerShell-/Node-Werkzeuge für Aufgabenprotokoll und Reviewpakete | Der Bash-Helfer startete in dieser Umgebung nicht; sein Nummernparser passte zudem nicht zu A1–C2. Briefinhalte wurden gegen die genehmigten Originalpläne geprüft. | Zusätzliche Prüfung des Aufgabenprotokolls; kein geändertes Produktverhalten. |
| Lesende Vorbereitung der nächsten Aufgabe parallel zur aktuellen Umsetzung | Ein unabhängiger Agent kann Schnittstellen vorbereiten, ohne Dateien oder Tests zu verändern. Änderungen beginnen ausschließlich nach ausdrücklichem internen GO. | Vorbereitung muss bei einer später geänderten Schnittstelle aktualisiert werden. Ein Produktschreiber bleibt verbindlich. |
| Bei widersprüchlichen v1-Ständen eine Migrationssicherung je Kopf | Der vorhandene Export verlangt in diesem Fall einen ausgewählten Kopf. Jede Kopie stammt aus demselben vollständig validierten Originalzustand; Migration wählt keinen aktiven Kopf und entfernt keine Historie. | Zusätzlicher lokaler Sicherungsspeicher. Hashprüfung, atomarer Save und ausdrückliche Konfliktauflösung sind geprüft. |
| Vorhandene Implementierungs- und Reviewagenten wiederverwenden | Das Laufzeitsystem verweigerte weitere Agenten und den Zugriff auf ruhende Agenten wegen seines Threadlimits. | Mehr Kontext im selben Agenten. Exakte Aufgabenbriefe, feste Diffgrenzen und ein vom jeweiligen Implementierer unabhängiger Reviewer begrenzen dieses Risiko. |
| GPT-5.6 Sol / high für unabhängige B1/B2- und Gesamtprüfung | Der verfügbare Sol-Reviewer hat keinen Produktcode geschrieben und ist von allen Implementierern unabhängig; ein zusätzlicher Agent konnte nicht gestartet werden. | Abweichung vom Modellvorschlag für Vertrags- und Abschlussreview, keine ausgelassene Prüfaufgabe. |
| C2-Prüfung und öffentliche Dokumentation parallel bearbeiten | Der Implementierer besitzt Produkt, Tests, Bildnachweise und Browseranleitung; der Controller besitzt die übrigen öffentlichen Dokumente und den zusammengeführten Bericht. | Abschließender gemeinsamer Verweis- und Konsistenzcheck erforderlich; weiterhin nur ein Produktschreiber. |

Die Oberflächenaufgaben verwenden GPT-5.6 Sol mit hoher Denktiefe; B1/B2 GPT-6 Astra mit hoher Denktiefe. Die begrenzte A2-Korrekturreview verwendete Sol mit mittlerer Denktiefe. Tatsächlich ausgeführte spätere Aufgaben und Reviews werden in ihren jeweiligen Berichten ausgewiesen. Nicht beauftragte Konten-, Hosting-, Kosten-, Lizenz- oder Hauptbranchänderungen entstehen aus diesen Entscheidungen nicht.
