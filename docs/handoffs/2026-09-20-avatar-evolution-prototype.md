# Übergabe: Avatar-Entwicklungsstufen und erster Drachen-Prototyp

Stand: 20.09.2026. Branch `codex/vokabeltrainer-v1`, dokumentierter Ausgangscommit `33c7274`. Diese Übergabe beschreibt zunächst eine bestätigte Gestaltungsrichtung und die Auswertung des echten Drive-Probelaufs. Produktcode, Laufzeitbilder und Datenformat wurden dabei nicht geändert.

## Bestätigte Entscheidung

Der Nutzer hat die empfohlene Umstellung auf vier vollständig gerenderte Entwicklungsformen je Figur mit „so machen wir das“ bestätigt. Erspielte Punkte sollen in die Entwicklung des eigenen Avatars fließen; Level und Lernfortschritt bleiben unverändert. Ein Fortschrittsbalken zeigt die nächste Form. Freigeschaltete Formen bleiben dauerhaft erhalten und frei auswählbar.

Für den Bildprototyp hat der Nutzer anschließend präzisiert: Der Unterschied von Stufe 3 zu Stufe 4 muss deutlicher, epischer und mythischer sein. Eine Endstufe, die hauptsächlich mehr Rüstung trägt, erfüllt dieses Kriterium nicht.

Für die künftige Erweiterung ersetzt dies die modulare Ausrüstung nach AV02/AV11. Bestehende Bildquellen und Passformnachweise bleiben als historische Artefakte erhalten. Die Produktoberfläche verwendet weiterhin den bisherigen Stand.

Verbindliche Grenzen und offene Details stehen im [Entscheidungsdokument](../design/2026-09-20-avatar-entwicklungsstufen.md). Insbesondere sind konkrete Preise, technische Speicherung, Shopintegration, endgültige Namen und die Produktion aller 52 Stufenbilder nicht Teil dieser Prototypentscheidung; dafür fehlt noch das Detaildesign. Die bereits bestätigte allgemeine Entwicklungsfreigabe und die übrigen Produktentscheidungen bleiben bestehen.

## Erster Prüfgegenstand

Der [Konzeptbogen v1](../design/avatar-evolution/dragon-stages-concept-v1.png) ist als historischer Zwischenstand erhalten. Der Nutzer nahm ihn nicht ab, weil Stufe 4 gegenüber Stufe 3 noch nicht deutlich genug als epische, mythische Endverwandlung lesbar war.

Der [überarbeitete Konzeptbogen v2](../design/avatar-evolution/dragon-stages-concept-v2.png) behält die visuelle Entwicklung der ersten drei Stufen bei und verstärkt die Endstufe mit großer goldener Geweih-Hornkrone, türkis-goldener Energiemähne, kosmischen Sternbildflügeln, Runensternum und ausgeprägterem Federschweif. Der Nutzer hat v2 mit „ja, viel besser“ persönlich bestätigt. Diese Drachenbildrichtung mit klar epischer Finalstufe dient damit als Stilvorlage und braucht keine erneute Bildfreigabe. Die Arbeitsnamen Abenteuerdrache, Runendrache, Kristallwächter und Runenlegende bleiben Gestaltungsvorschläge. [Prompt, Referenzrolle und Erzeugungsnotiz zu v2](../design/avatar-evolution/dragon-stages-concept-v2.json) sind dokumentiert.

Der bestätigte Stand ist eine vierteilige Gesamtvorschau, kein Produktions-Sprite-Sheet. Vier freigestellte Einzelgrafiken, Transparenz, Handy-Einzelkarten und die Darstellung in der App wurden noch nicht erzeugt oder geprüft. Die persönliche Bestätigung gilt für die Stilrichtung, nicht als Produktionsnachweis für diese noch fehlenden Ausgaben oder für weitere Figuren.

## Technischer Shopstand

Der [echte Lauf mit Diagnoseversion 4](../reports/2026-09-20-shop-v4-reallauf.md) ergab **3 bestanden, 8 fehlgeschlagen, 0 unsupported**. Zwar war das starke v2-JSON-ETag lesbar, doch bei Initialisierung und zwei parallelen Käufen wurden jeweils beide konkurrierenden Schreibversuche angenommen (`accepted: 2`, `stale: 0`). Der gemischte Kandidat aus v2-Kennung und v3-Schreibweg belegt daher keinen exklusiven Kauf-Guard. Das ist kein Nachweis eines dauerhaft doppelten Produktkaufs und kein Nachweis, dass jeder Google-Ansatz ungeeignet wäre.

Keine weitere unveränderte Wiederholung derselben Probe anfordern. Ein späterer Technikschritt muss einen neuen Kandidaten ausdrücklich benennen und getrennt prüfen. Der Bildprototyp kann unabhängig davon beurteilt werden.

## Nächster Schritt

1. Preisfrage EV02 klären. EV01 ist mit Nutzerantwort a bestätigt: ansparen und die nächste Stufe mit einem bewussten Kauf vollständig freischalten; keine Teilbeträge.
2. Danach Datenvertrag und Oberfläche konkretisieren; die bestätigte Vier-Stufen- und Bildrichtung nicht erneut abstimmen.
3. Die Produktion weiterer Figuren erst im daraus abgeleiteten Umfang planen; kein unbestätigter 52-Bilder-Gesamtlauf.

Beide PNGs wurden erfolgreich gelesen (je 1942 × 809 Pixel, RGB); die SHA-256-Prüfsummen sind in den jeweiligen Sidecars festgehalten. Root hat v2 tatsächlich visuell geprüft; Stufen 1–3 sind visuell erhalten, aber nicht pixelidentisch. Dokumentationslinks und Diff sind geprüft. Keine Produktdateien geändert, deshalb keine neuen Funktionstests ausgeführt. Implementierungsstand weiterhin `33c7274`; der erste Prototypstand liegt in `89f0260`, v2 und Bestätigung im Folgecommit dieser Übergabe. Lokalen und entfernten Branch vor einer Fortsetzung frisch vergleichen. EV01 ist inzwischen mit a beantwortet und in Anforderungen sowie Entscheidungsdokument festgehalten. Preisfrage EV02 bleibt offen. Diese Fortschreibung ändert nur Dokumentation; vor Sicherung Verweise und Diff prüfen.
