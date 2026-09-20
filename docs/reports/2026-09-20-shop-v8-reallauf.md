# Echter Shop-Probelauf 8: Versionsanstieg im Medienfenster

Stand: 20.09.2026. Auswertung auf `85ee32a9edcaa4bdd97653945161fb5556053ff9`. Quelle ist der vom Nutzer übergebene Bericht `shop-probe-bericht8.json`; kein erneuter Google-Lauf durch die Agenten. Die Rohdatei bleibt außerhalb des Repositorys.

- SHA-256: `0d571e5b89d7f21a128f336ee1952910feff1a4ea59dfd538e719fb54992f1ce`.
- Diagnoseversion 8, `etagSource:v2-coherent`, `probeScope:read-stability`.
- Laufzeit: 20.09.2026, 17:33:20.894–17:33:25.928 UTC; Windows/Edge 153, localhost:4173.
- Ergebnis: **1 bestanden, 1 fehlgeschlagen, 0 unsupported**, `productReady:false`.

## Beobachtungen

Die Ordner-Fixture wurde erfolgreich angelegt. Die anschließende Lesemessung lief vollständig durch (`complete:true`); alle vier Diagnose-GETs verwendeten `cache:no-store`.

| Merkmal | M1 → M2, vor Inhaltsabruf | M2 → M3, mit Inhaltsabruf dazwischen |
| --- | --- | --- |
| Dateiversion | gleich | gestiegen |
| Starke ETag | gleich | gleich |
| Inhaltsprüfsumme | gleich | gleich |
| Head-Revision | gleich | gleich |
| Änderungszeit | gleich | gleich |
| Dateigröße | gleich | gleich |
| Letzte Ansichtszeit | nicht verfügbar | nicht verfügbar |

Der Medienabruf lieferte HTTP 200 ohne Weiterleitung; der gelesene Inhalt entsprach exakt dem synthetischen Ausgangswert. Der Check scheitert mit `actual:assertion`, weil seine vollständige Messung eine gestiegene Version enthält. Es handelt sich weder um einen Transportabbruch noch um eine HTTP-412-Ablehnung. Dieser Prüfumfang führt nach der Anlage keine bedingten PUTs aus. Der allgemeine API-Pfadkatalog im Bericht ist kein Protokoll tatsächlich ausgeführter Requests.

## Schlussfolgerung und Grenzen

Die Änderung ist erstmals dem Medienfenster zugeordnet. **Nicht nachgewiesen ist, dass der Inhaltsabruf die Versionsänderung verursacht.** Auch die längere Zeitspanne oder unabhängige Nacharbeiten nach dem Erstellen bleiben mögliche Erklärungen. Gleiche Inhaltsmerkmale und gestiegene `version` sind vereinbar: Google zählt damit auch serverseitige, nicht direkt sichtbare Änderungen. [Google: File-Ressource](https://developers.google.com/workspace/drive/api/reference/rest/v2/files).

`no-store` umgeht den HTTP-Cache, verspricht jedoch keine linearen Serverlesungen. Der verfügbare Befund rechtfertigt weder das Weglassen des Versionsguards noch eine Annahme sicherer paralleler Käufe. [WHATWG Fetch: Cachemodus](https://fetch.spec.whatwg.org/#concept-request-cache-mode).

## Nächste unterscheidende Untersuchung

Die gewählte Richtung C bleibt bestehen. Eine gezielte Probe soll kleine private Koordinationsmerkmale ausschließlich an neuen synthetischen Ordnern ändern. Dafür sind keine JSON-Datei und kein Medienabruf nötig. Die frühere Initialisierungsprobe erreichte diese Grenze im Diagnose-6-Lauf nicht: Zuerst angelegte JSON-Kandidaten scheiterten bereits an ihrer Erstellungsnachlese. Die gemischten v2-Lese-/v3-Schreibversuche sind ebenfalls kein Test des nun isolierten v2-Metadaten-PUTs.

Google unterstützt Metadatenänderungen über v2 `files.update` und private Eigenschaften. Die Dokumentation nennt dafür jedoch keine konkrete `If-Match`-Garantie; diese Grenze muss ausdrücklich als experimenteller Kandidat behandelt werden. Kleine Marker bleiben weit unter den Grenzen von 30 privaten Eigenschaften je App und Datei und 124 UTF-8-Bytes je Schlüssel plus Wert. [Google: files.update](https://developers.google.com/workspace/drive/api/reference/rest/v2/files/update), [Google: benutzerdefinierte Eigenschaften](https://developers.google.com/workspace/drive/api/guides/properties).

Der [Diagnose-9-Plan](../superpowers/plans/2026-09-20-shop-probe-v9-metadata-coordination.md) prüft einen falschen Token, einen verbrauchten Token und zwei konkurrierende Änderungen. Keine Wiederholung der unveränderten Diagnose 8, kein Backendwechsel, keine Produktmigration. Selbst ein Erfolg wäre nur ein Nachweis dieses schmalen Versuchs; ein späterer Entwurf mit Verweis auf unveränderlichen Inhalt müsste Antwortverlust, Epochen, verwaiste Inhalte und zwei Geräte zusätzlich behandeln.
