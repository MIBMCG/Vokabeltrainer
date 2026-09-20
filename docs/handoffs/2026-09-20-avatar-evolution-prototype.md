# Übergabe: Avatar-Entwicklungsstufen und erster Drachen-Prototyp

Stand: 20.09.2026. Branch `codex/vokabeltrainer-v1`, dokumentierter Ausgangscommit `33c7274`. Diese Übergabe beschreibt zunächst eine bestätigte Gestaltungsrichtung und die Auswertung des echten Drive-Probelaufs. Produktcode, Laufzeitbilder und Datenformat wurden dabei nicht geändert.

## Bestätigte Entscheidung

Der Nutzer hat die empfohlene Umstellung auf vier vollständig gerenderte Entwicklungsformen je Figur mit „so machen wir das“ bestätigt. Erspielte Punkte sollen in die Entwicklung des eigenen Avatars fließen; Level und Lernfortschritt bleiben unverändert. Ein Fortschrittsbalken zeigt die nächste Form. Freigeschaltete Formen bleiben dauerhaft erhalten und frei auswählbar.

Für die künftige Erweiterung ersetzt dies die modulare Ausrüstung nach AV02/AV11. Bestehende Bildquellen und Passformnachweise bleiben als historische Artefakte erhalten. Die Produktoberfläche verwendet weiterhin den bisherigen Stand.

Verbindliche Grenzen und offene Details stehen im [Entscheidungsdokument](../design/2026-09-20-avatar-entwicklungsstufen.md). Insbesondere sind konkrete Preise, technische Speicherung, Shopintegration, endgültige Namen und die Produktion aller 52 Stufenbilder nicht Teil dieser Prototypentscheidung; dafür fehlt noch das Detaildesign. Die bereits bestätigte allgemeine Entwicklungsfreigabe und die übrigen Produktentscheidungen bleiben bestehen.

## Erster Prüfgegenstand

Der [Konzeptbogen mit vier Drachenformen](../design/avatar-evolution/dragon-stages-concept-v1.png) ist erstellt. Er erhält die grün-goldene Identität derselben Figur und steigert Rüstung, Kristallformen und Leuchteffekte von Stufe zu Stufe; sichtbare Ausstattung ist körpergerecht in die vollständigen Figuren gemalt. Die Arbeitsnamen Abenteuerdrache, Runendrache, Kristallwächter und Runenlegende sind weiterhin nur ein Gestaltungsvorschlag. [Prompt, Referenzrolle und vollständige Erzeugungsnotiz](../design/avatar-evolution/dragon-stages-concept-v1.json) sind dokumentiert.

Der aktuelle Stand ist eine vierteilige Gesamtvorschau mit 1942 × 809 Pixeln im RGB-Farbraum, kein Produktions-Sprite-Sheet. Vier freigestellte Einzelgrafiken, Transparenz, Handy-Einzelkarten und die Darstellung in der App wurden noch nicht erzeugt oder geprüft. Die persönliche Nutzerabnahme ist offen. Erst danach darf der Prototyp als Vorlage für weitere Figuren dienen.

## Technischer Shopstand

Der [echte Lauf mit Diagnoseversion 4](../reports/2026-09-20-shop-v4-reallauf.md) ergab **3 bestanden, 8 fehlgeschlagen, 0 unsupported**. Zwar war das starke v2-JSON-ETag lesbar, doch bei Initialisierung und zwei parallelen Käufen wurden jeweils beide konkurrierenden Schreibversuche angenommen (`accepted: 2`, `stale: 0`). Der gemischte Kandidat aus v2-Kennung und v3-Schreibweg belegt daher keinen exklusiven Kauf-Guard. Das ist kein Nachweis eines dauerhaft doppelten Produktkaufs und kein Nachweis, dass jeder Google-Ansatz ungeeignet wäre.

Keine weitere unveränderte Wiederholung derselben Probe anfordern. Ein späterer Technikschritt muss einen neuen Kandidaten ausdrücklich benennen und getrennt prüfen. Der Bildprototyp kann unabhängig davon beurteilt werden.

## Nächster Schritt

1. Persönliche Beurteilung des gezeigten Drachenbogens aufnehmen. Root hat den generierten Bogen tatsächlich geöffnet und Stufenfolge, vollständige Figuren, Beschriftungen und zusammenhängende Ausrüstung geprüft; das ersetzt die persönliche Stilentscheidung nicht.
2. Erst nach dieser Beurteilung Detailentscheidungen und gegebenenfalls einen Implementierungsplan für Daten, Preise, Oberfläche und weitere Figuren ausarbeiten.

Prüfung dieses Dokumentations-/Konzeptpakets: PNG erfolgreich gelesen (1942 × 809, RGB), SHA-256 im Sidecar festgehalten; Dokumentationslinks und Diff geprüft. Keine Produktdateien geändert, deshalb keine neuen Funktionstests ausgeführt. Implementierungsstand weiterhin `33c7274`; die Paket-SHA ist über den Commit dieser Übergabe auffindbar. Lokalen und entfernten Branch vor einer Fortsetzung frisch vergleichen.
