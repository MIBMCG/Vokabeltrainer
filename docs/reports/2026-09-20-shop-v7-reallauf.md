# Echter Shop-Probelauf 7: Abbruch vor dem Negativtest

Stand: 20.09.2026. Auswertung auf `a802a0e512682891ff65e98a7085812986791f94`. Quelle ist der vom Nutzer übergebene Bericht `shop-probe-bericht7.json`, nicht eine erneute Ausführung durch die Agenten. Die Rohdatei bleibt außerhalb des Repositorys.

- SHA-256: `4b7da9e3f5a21b992c8a32b351882d514bd3eba433f2e481504d211e5167221f`.
- Diagnoseversion 7, `etagSource:v2-coherent`, `probeScope:invalid-token`.
- Laufzeit: 20.09.2026, 16:59:12.522–16:59:17.415 UTC; Windows/Edge 153, localhost:4173.
- Ergebnis: **1 bestanden, 1 fehlgeschlagen, 0 unsupported**, `productReady:false`.

## Was tatsächlich passiert ist

Der neue synthetische Probeordner wurde erstellt und kontrolliert. Anschließend brach das Anlegen der Negativtestdatei bei `create-verification` ab: zwischen den beiden v2-Metadatenlesungen rund um einen Medienabruf unterschieden sich die `version`-Werte.

| Beobachtung | Ergebnis |
| --- | --- |
| Allgemeine Dateiversion | unterschiedlich; Richtung und Abstand nicht exportiert |
| Starke JSON-ETag | unverändert |
| MD5-Inhaltsprüfsumme | gleich |
| Head-Revision | gleich |
| Änderungszeit | gleich |
| Dateigröße | gleich |
| Letzte Ansichtszeit | nicht verfügbar; nicht als gleich werten |

`actual:stale` ist hier die lokale Abbruchklasse der Lesestabilitätsprüfung. Sie ist **keine HTTP-412-Antwort auf einen Schreibversuch**. Der Bericht enthält weder `httpStatus` noch den Checkpoint `invalid-token-observation`, weil der Ablauf den bedingten PUT noch nicht erreicht hat. Der zusätzliche `fixture-read` nach erfolgreichem Anlegen und die anschließende Nachlese des Negativtests wurden ebenfalls nicht erreicht. Die davor notwendigen POST-Anlagen wurden ausgeführt; „keine Schreibanfrage“ wäre deshalb eine ungenaue Beschreibung.

Die drei möglichen Erklärungen des früheren v6-Negativfalls bleiben offen. Bericht 7 zeigt für seinen eigenen Lauf keine Annahme eines falschen Tokens, keine Ablehnung und keine Änderung durch diesen PUT. Der frühere sequentielle 412-Nachweis aus einem anderen v6-Fall bleibt davon getrennt erhalten.

## Ursachenprüfung

Die offizielle File-Referenz beschreibt `version` als Zähler auch für serverinterne, für den Nutzer nicht sichtbare Änderungen. Gleiche Inhaltsmerkmale widersprechen einer Versionsänderung daher nicht. Ob Erstellungsnacharbeit, Abrufnebenwirkungen oder eine andere Ursache den konkreten Unterschied ausgelöst hat, ist damit nicht nachgewiesen. [Google: File-Ressource](https://developers.google.com/workspace/drive/api/reference/rest/v2/files).

Ein explizites `updateViewedDate=false` ist kein begründeter Ursachenfix: Der alte GET-Parameter ist abgekündigt und laut aktuellem offiziellen Discovery-Schema bereits standardmäßig `false`. [Google: files.get](https://developers.google.com/workspace/drive/api/reference/rest/v2/files/get), [offizielles Discovery-Schema](https://www.googleapis.com/discovery/v1/apis/drive/v2/rest).

Der Probe-Transport nutzt bisher den Browser-Standardcache. Dieser kann gespeicherte Antworten verwenden; `no-store` umgeht den HTTP-Cache. Das ist eine mögliche Messverfälschung, aber keine aus Bericht 7 bewiesene Ursache. Eine neue Datei hat zunächst eine neue URL; ein identischer Cachetreffer beim zweiten Abruf könnte eine Änderung sogar verdecken. [WHATWG Fetch: Cachemodus](https://fetch.spec.whatwg.org/#concept-request-cache-mode).

## Konsequenz

Die Nutzerwahl C gilt weiter. Keine Änderung am Punktesystem, kein neuer Backenddienst, keine gelockerten Versions-/ETag-Prüfungen und keine Produktfreigabe. Ein unveränderter weiterer Negativtest oder vollständiger 11er-Lauf ist aktuell nicht der nächste Schritt.

Die nächste aussagekräftige Messung muss Metadaten-Kontrollabrufe ohne dazwischenliegenden Inhaltsabruf von Abrufen mit Inhalt unterscheiden und Versionsrichtung sowie Cachemodus offenlegen. Ein solcher Beobachtungslauf darf keinen instabilen Snapshot als Kaufgrundlage zurückgeben und keinen bedingten Kaufversuch starten. Er liefert Diagnose, keinen Koordinationsnachweis.
