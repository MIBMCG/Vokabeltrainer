# Dauerhafte Käufe – Task 4 umgesetzt

Stand: 26.09.2026

Die gemeinsame Kaufhistorie ist jetzt mit Produktabgleich, Restore und
portablen Sicherungen verbunden. Ein aktivierter Bestand verwendet eine neue
gemeinsame Epoche im Format 3, ohne die vorhandene Datensatzbeschreibung oder
alte v1/v2-Dateien umzuschreiben. Ein neues Gerät findet die installierte
Kaufkonfiguration und übernimmt ausschließlich den vollständig geprüften
gemeinsamen Kopf als aktive Autorität.

Aktivierung und koordinierter Restore speichern zuerst den vollständigen
Publikationsauftrag. Erst danach werden Marker, Epoche und Kaufbelege
hochgeladen. Nach einem unbekannten Uploadausgang werden dieselben reservierten
IDs und unveränderten Inhalte weiterverwendet. Ein Restore aktiviert den neuen
lokalen Stand erst nach bestätigtem gemeinsamen Kopf; ein Verbindungsfehler wird
nicht als Erlaubnis für einen lokalen Offline-Restore behandelt.

Format-3-Sicherungen enthalten die vollständige wirtschaftliche Herkunft,
Basen und Figurenwahl. Sie enthalten keine Anmeldung, Tokens, ETags,
Pointerbodies oder ausführbaren Kaufaufträge. Ein neutraler, ausschließlich im
Backup vorhandener Checkpoint nimmt auch Lernpunkte aus Offline-Antworten seit
dem letzten Kauf mit. Er kann nicht zum Cloudkopf werden. Beim Restore werden
alle checkpointlokalen und verschachtelten Herkunftsobjekte auf neue physische
IDs kopiert, auch wenn Quelle und Ziel dieselbe Bindung haben. So bleibt auch
eine Folge A→B→C ohne Zugriff auf das ursprüngliche Konto rekonstruierbar.

Die Kompatibilitätsprüfung enthält eine bytegenaue transitive v2-Closure aus
Commit `777b3511e280f37de7aa0a940ca86b6b16a5fdbf` mit eigenem Hash- und
Größenmanifest. Sie läuft ohne Git- oder Netzwerkzugriff und belegt die alte
Schreibbarriere auch bei einem bereits laufenden Restore.

Geprüft wurden:

- Task-4-Integration: 10/10;
- vollständige Kauf-Recovery einschließlich Restore: 59/59;
- Restore: 28/28;
- Sync: 35/35;
- Server- und Worker-Allowlist: 15/15;
- gesamte Produktsuite: 489/489;
- drei echte Edge-Browserfälle für Precache-Fehler, Offline-Neustart und
  kontrolliertes Workerupdate: 3/3;
- Dokumentprüfung: 0 Fehler bei 943 lokalen Links.

Die Bedienoberfläche für Kaufvorschau, Bestätigung und sichtbaren Status folgt
in Task 5. Echte Google-Drive-, Zwei-Geräte- sowie iPhone/iPad-Prüfungen wurden
nicht durchgeführt. Es wurden keine echten Cloudobjekte geschrieben und keine
Produktionsabhängigkeiten installiert.
