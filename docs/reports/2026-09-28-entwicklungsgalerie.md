# Entwicklungsgalerie und kleinere Drachenbilder

Stand: 28.09.2026. Ausgangspunkt `351e219`, Entwicklungszweig
`codex/vokabeltrainer-v1`; Umsetzung in der vorhandenen isolierten Arbeitskopie.

## Auftrag und Grenzen

Nach dem bestätigten Echtkauf mit rund 17,1 Sekunden Gesamtwartezeit beauftragt
der Nutzer die Fortsetzung. Der nächste begrenzte Block vervollständigt die
bereits bestätigte EV05-Bedienung mit den vier vorhandenen Drachenformen.
Der [Plan](../superpowers/plans/2026-09-28-evolution-gallery.md) konkretisiert
die [bestätigte Gestaltung](../design/2026-09-20-avatar-entwicklungsstufen.md).

Umgesetzt sind die Vorschau zur nächsten Stufe, Preis, Guthaben, fehlende
Punkte und Fortschritt, klare Besitzanzeigen, ein Kaufbild und eine gesonderte
Auswahl nach bestätigtem Kauf. Auf der höchsten Stufe erscheint ausdrücklich
„Höchste Stufe erreicht“. „Meine Figur“ enthält die besessenen Formen; eine
Figur kann betrachtet werden, ohne dadurch die Auswahl zu ändern.

Klassische Gestaltung erscheint bei klassischer Auswahl. Farben menschlicher
Grundformen und bisherige Ausrüstung bleiben erhalten. Das gemeinsame
responsive Bildmodul versorgt auch die Lernanzeige und die große Figurenansicht.
Der Auswahlabschluss funktioniert per Tastatur; eine fehlgeschlagene Auswahl
meldet sich unmittelbar im Dialog und kann erneut versucht werden.

Die vier großen Drachen-PNGs umfassen 6.898.398 Bytes. Daraus sind transparente
WebP-Ausgaben in 256, 512 und 768 Pixeln Breite entstanden, ohne Vergrößerung
oder kreative Veränderung der genehmigten Motive. Originale und Herkunftsdateien
sind unverändert. Die kleinen Varianten werden offline vorgehalten; größere
Varianten werden bei Bedarf geladen und gespeichert.

| Breite | Größe für alle vier Formen |
| --- | ---: |
| 256 Pixel | 139.420 Bytes |
| 512 Pixel | 395.874 Bytes |
| 768 Pixel | 744.726 Bytes |
| Alle zwölf Ausgaben | 1.280.020 Bytes |

Der erforderliche Offlineanteil dieser Bilder sinkt damit um rund 98 %;
selbst alle Varianten zusammen benötigen rund 81 % weniger als die Originale.
Dies ist eine Dateigrößenmessung, keine neue Messung der Kaufdauer.
Das [Buildskript](../../scripts/build-evolution-art.mjs) prüft Quellenstatus,
SHA-256, Maße und Transparenz. Ein zweiter Build liefert für zwölf Bilder,
Manifest und Größenbericht 14 identische Hashes. Sharp wird ausschließlich
beim Bauen benötigt, nicht in der App. Einzelbelege:
[Buildbericht](../../trainer/assets/avatar-evolution/build-report.json).

## Lokale Prüfungen

Vor der Implementierung scheiterte der neue Bildtest am fehlenden Manifest,
der neue Modelltest am fehlenden Fortschrittsangebot und die Auslieferungsprüfung
mit 404 auf dem noch nicht registrierten Bildmodul. Danach:

- `npm test`: 646/646 bestanden, etwa 85 Sekunden.
- Nach den letzten Dialog- und Farbkorrekturen erneut
  `node --test --experimental-test-isolation=none tests/trainer/purchases-view.test.js tests/trainer/reward-view.test.js`:
  8/8 bestanden.
- Vollständige Datei `tests/browser/purchases.browser.mjs`: 8/8 bestanden,
  etwa 29 Sekunden, mit Einrichtung, tatsächlichem synthetischem Kaufdienst,
  verzögertem Laden, bewusster Auswahl, Fokus, Wiederaufnahme, Offlineauswahl,
  Profilwechsel, Escape und fehlgeschlagener Auswahl.
- Sechs ergänzende Browserfälle bestanden: responsive Bildwahl und endgültiger
  Bildausfall, Updatehinweis, abgelehnter Precache, Belohnungsansicht,
  Offline-Neustart und kontrolliertes Update während einer Übung.
- Desktop- und 390-Pixel-Ansichten wurden als Screenshots geprüft;
  Figuren, Fortschritt und Schaltflächen sind vollständig sichtbar und ohne
  horizontalen Überlauf. Die 512-Pixel-Ausgaben der Stufen 1 und 4 sind zusätzlich
  direkt visuell geprüft.
- `node scripts/prepare-cloudflare.mjs`: 175 ausdrücklich freigegebene Dateien
  vorbereitet. Cache v33 enthält beide neuen Module und die vier kleinen
  Drachenbilder; acht größere Varianten stehen in der Liste zum Nachladen.

Ein unabhängiges Bildreview verlangte einen verständlichen Hinweis, falls auch
das kleine Ersatzbild fehlt. Die Korrektur ist unabhängig nachgeprüft (PASS)
und im Browser belegt: keine defekte Grafik; der zugehörige Kauf bleibt bei
endgültig fehlender Vorschau gesperrt. Die unabhängige Spec-/Qualitätsprüfung
von Task 2 und Gesamtintegration ist PASS, ohne wichtige oder blockierende
Befunde. Commit, echte Bereitstellung und Remoteabgleich werden separat ergänzt.

Die Browserfälle verwenden ausschließlich synthetische Daten und einen lokalen
Google-Ersatz. Die vollständige historische Browsergesamtsuite wurde nicht neu
ausgeführt. Keine künstlichen Punkte wurden einem echten Familienprofil gutgeschrieben.

## Weiter offen

72 weitere vollständige Entwicklungs-Motive bleiben ein eigenes Bildpaket.
Die vorhandenen klassischen Grundfiguren sind keine neu erzeugten Stufenbilder.
Kaufprotokoll, Preise, Google-Anmeldung und Speicherung erhalten ihren bisherigen
Vertrag. Das Wunschziel unter zehn Sekunden, regulärer Tokenablauf sowie die
physische Zwei-Geräte- und Apple-Abnahme sind damit nicht neu geprüft.
