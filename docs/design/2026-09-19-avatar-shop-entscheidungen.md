# Avatar-Erweiterung und Punkteshop: bestätigte Entscheidungen

Stand: 19.09.2026. Anforderungsklärung, noch keine Implementierung und noch kein vollständig freigegebener technischer Entwurf. Ausgangscode: `ce0cc344619e75700986cf04c69190d917f07b99` auf `codex/vokabeltrainer-v1`.

## Verbindliche Nutzerentscheidungen

| ID | Entscheidung | Bestätigung im Gespräch |
| --- | --- | --- |
| AV01 | Mädchen- und Jungenavatare von Anfang an anbieten. | Nutzer fordert ausdrücklich Mädchenavatare; kostenlose Startauswahl anschließend konkretisiert. |
| AV02 | Zusätzliche menschliche, Tier- und Fantasieavatare mit eigener gestaltbarer Ausstattung ergänzen. | B: Auch Tiere bekommen beispielsweise Rüstungen, Sättel und Schmuck. |
| AV03 | Kostenlose Levelbelohnungen und besondere kaufbare Avatare/Ausrüstung kombinieren. Bezahlt wird ausschließlich mit erspielten Punkten. | Eigene Nutzeroption C. Ersetzt die bisherige Einschränkung „kein zusätzlicher Münzladen“ in R24/Q6d für dieses neue Paket. |
| AV04 | Jede richtige Antwort bringt weiterhin 10 Punkte, eine gewertete abgeschlossene Runde zusätzlich 20. Diese Punkte zählen dauerhaft fürs Level und zusätzlich als ausgebbares Guthaben. | A: Bisherige Punkte zugleich als Guthaben. |
| AV05 | Einkäufe verringern ausschließlich das verfügbare Guthaben. Level, Lernfortschritt und bereits erworbene Belohnungen bleiben erhalten. Gekaufte Gegenstände sind dauerhaft nutzbar. | Bestandteil der gewählten Punktevariante und ihrer Konkretisierung. |
| AV06 | Alle bisher gesammelten Punkte werden vollständig als Startguthaben berücksichtigt. Kein Zurücksetzen auf null. | A: Vollständige Übernahme. |
| AV07 | Shop-Angebote haben kein zusätzliches Mindestlevel. Der Preis entscheidet; kostenlose Levelbelohnungen bleiben getrennt. | A: Nur der Preis entscheidet. |
| AV08 | Zubehör kostet ungefähr 120–360 Punkte; besondere Avatare 600–1.200 Punkte. | A: Gut erreichbare Preise. Einzelpreise werden im konkreten Katalog vorgeschlagen, nicht als bereits bestätigte Zahlen ausgegeben. |
| AV09 | Pferd, Tiger, Ritter/Ritterin und einfacher Drache werden Levelbelohnungen. Einhorn, Pegasus, Greif und besonders gestaltete Varianten kommen in den Shop. | A zur vorgeschlagenen Aufteilung, ergänzt um weitere mystische Figuren und besondere Ausrüstung. |
| AV10 | Magisch, detailreich und zur Inselwelt passend: Kristalle, Runen und gezielte Leuchteffekte, freundlich-abenteuerlich für 10–13-Jährige. Bewegungen bleiben abschaltbar. | A zur Stilwahl. |
| AV11 | Ausrüstung ist innerhalb einer kompatiblen Figurenart gemeinsam nutzbar. Drachen teilen Drachenausrüstung; Pferd, Einhorn und Pegasus bilden eine gemeinsame Gruppe. Wolf, Panther, Hirsch, Greif und Phönix haben jeweils passende Gruppen. Menschliche Figuren teilen geeignete Kleidung/Ausrüstung. | Letzte Nutzerantwort A. |

Profile bleiben getrennt: Guthaben, Käufe und gewählte Figur gehören jeweils zum Kind. Bereits bestätigte Google-, Kosten- und Kontenentscheidungen bleiben bestehen. Kein Echtgeld, kein neuer Cloudanbieter und kein kostenpflichtiges Abo sind beauftragt.

## Besprochene mystische Figuren und Ausstattung

Diese Motive konkretisieren den gewählten Stil; fertige Bilder liegen dafür noch nicht vor.

| Avatar | Vorgesehene besondere Ausstattung |
| --- | --- |
| Kristalldrache | Kristallrüstung, Runen, leuchtende Flügelspitzen |
| Mond-Einhorn | Mondsichel-Kopfschmuck, Sternenumhang, silberne Hufreifen |
| Sternen-Pegasus | Sternbild-Flügelzier, Wolkensattel, Kometenschweif |
| Sturmgreif | Blitzrüstung, Runen-Amulett, goldene Federzier |
| Phönix | Sonnenkrone, glühende Flügelreifen, magischer Brustschmuck |
| Polarlichtwolf | Nordlicht-Umhang, Eiskristall-Amulett, leuchtende Pfotenreifen |
| Nebelhirsch | Kristallgeweih, Waldgeist-Schmuck, Runenumhang |
| Schattenpanther | Violette Runenrüstung, Obsidian-Amulett, Sternenpfoten |

Vorschau, Preis und kompatible Figuren müssen vor dem Kauf sichtbar sein. Freischaltung, Besitz, Anprobe und tatsächlich angelegte Ausrüstung sind getrennte Zustände. Ein gekaufter kompatibler Gegenstand wird beim Figurenwechsel nicht nochmals berechnet. Konkrete Slots und Bildlagen werden im Gesamtentwurf festgelegt.

## Gemeldeter Bildfehler

Der Nutzer zeigt den fehlenden Hals beim gelben Hemd. Die Grundfigur `docs/design/art-sources/avatar-skin-0.png` enthält bereits ein türkisfarbenes Hemd und einen sichtbaren Hals. Die darüber gerenderte gelbe Quelle `avatar-clothing-2.png` enthält eine deckende Fläche im Kragenausschnitt. `src/trainer/ui/art.js` zeichnet Kleidung nach der Grundfigur. Das erklärt den sichtbaren verdeckten Hals; ein bloßes Vertauschen der kompletten Ebenen würde die ursprüngliche türkisfarbene Kleidung wieder über die gelbe legen.

Zu korrigieren sind Ausschnitt, passgenaue Konturen und Schichten. Die spätere Bildprüfung muss alle Haut-/Kleidungsvarianten und kompatiblen Zubehörkombinationen umfassen. Noch keine Korrektur oder visuelle Abnahme behaupten.

## Technische Folgerungen und offene Klärung

Die Erweiterung ist ein Architekturpaket: neuer Figuren-/Ausrüstungskatalog, Besitz und Kaufhistorie, Guthabenprojektion, kompatible Avatar-Auswahl sowie versionierte Datenverträge und Synchronisation. Aktuell berechnet `src/trainer/learning/rewards.js` das Level aus den gesamten Punkten; diese Berechnung bleibt unabhängig von Ausgaben.

Die Übernahme der alten Punkte darf kein zusätzliches, auf jedem Gerät erneut ausgeführtes Guthabengeschenk erzeugen. Vorgesehene Grundlage ist dieselbe deduplizierte Belohnungssumme wie bisher, vermindert um gültige Käufe. Historische Ereignisse und Hashes dürfen nicht umgeschrieben werden. Käufe benötigen stabile IDs; wiederholte Klicks/Uploads dürfen weder zweimal abbuchen noch zweimal Besitz erzeugen. Bekannte Altformate, unbekannte zukünftige Formate, Backup/Wiederherstellung und verspätete alte Geräte bleiben ausdrücklich zu prüfen.

**O-AV01 – Offlinekauf noch offen:** Offline üben, Punkte verdienen und vorhandene Ausstattung nutzen bleiben möglich. Zu entscheiden ist, ob neue Einkäufe eine Verbindung mit erfolgreichem Abgleich benötigen (empfohlen) oder auch offline zunächst vorläufig gespeichert werden dürfen. Der Vorschlag für die Onlinevariante erlaubt offline Ansehen/Anprobieren bereits geladener Angebote. Eine Onlinepflicht allein löst gleichzeitige Käufe auf zwei Geräten noch nicht: Der technische Entwurf muss vor Umsetzung zusätzlich eine belastbare Strategie gegen doppelte Ausgabe desselben Guthabens festlegen und nachweisen. Keine unbewiesene Zusage endgültiger konfliktfreier Käufe aus bloßem Internetzugang ableiten.

Nach O-AV01: konkreten Gesamtentwurf mit überschaubarem Startkatalog, Einzelpreisen, Levelschwellen, kompatiblen Slots, Kauf-/Fehlerablauf, Bilderumfang, Datenübergang und Prüfplan erstellen und als Ganzes vorlegen. Bereits bestätigte Entscheidungen nicht erneut einzeln fragen. Erst danach den Implementierungsplan ableiten. Die alte Gesamtfreigabe A1–C2 ist keine Behauptung, dass dieser neue Shop schon implementiert oder sein Datenvertrag freigegeben sei.
