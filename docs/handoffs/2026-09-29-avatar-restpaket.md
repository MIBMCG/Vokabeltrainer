# Übergabe: verbleibende Avatar-Entwicklungen

Stand: 29.09.2026. Entwicklungszweig: `codex/vokabeltrainer-v1`.
Ausgangsstand: `c1ecf2a58ed9951aa3a568eeda0f551f3a5f9974`.

## Aktueller Auftrag

Der Nutzer möchte zuerst alle fehlenden Avatar-Entwicklungen fertigstellen,
um sich danach auf die Optimierung zu konzentrieren. Die vorgeschlagene
[schnellere Lernbereichsübernahme](2026-09-29-lernbereich-vorschau.md) ist
damit zurückgestellt; ihre Umsetzung wurde nicht bestätigt.
Keine Pause angeordnet. Bestehende Familien- und Testbestände erhalten.

Drei vollständige Reihen mit zwölf Motiven sind bereits ausgeliefert:
Einfacher Drache, Nebelhirsch und Tiger. Diese werden nicht neu erzeugt.
Von insgesamt 76 Motiven fehlen 64 in der Entwicklungsbild-Auslieferung.

| Noch fehlende Reihe | Stufen | Hauttöne | Motive |
| --- | ---: | ---: | ---: |
| Pferd | 4 | – | 4 |
| Mond-Einhorn | 4 | – | 4 |
| Sternen-Pegasus | 4 | – | 4 |
| Kristalldrache | 4 | – | 4 |
| Polarlichtwolf | 4 | – | 4 |
| Schattenpanther | 4 | – | 4 |
| Sturmgreif | 4 | – | 4 |
| Phönix | 4 | – | 4 |
| Entdeckerin | 4 | 4 | 16 |
| Entdecker | 4 | 4 | 16 |
| **Gesamt** | | | **64** |

Die acht tierischen Grundformen und acht menschlichen Grundform-/Hauttonquellen
liegen bereits unter `docs/design/avatar-shop-sources/`. Sie sind bei passender
Übernahme unverändert wiederverwendbar. Damit benötigen höchstens 48 höhere
Form-/Hauttonvarianten neue Einzelbilder; die 64 beziehen sich auf die noch
fehlenden Motive in der Entwicklungsgalerie, nicht auf 64 zwingende Neugenerierungen.

## Konkrete Entwürfe

Erstellt mit der eingebauten Bildgenerierung, ohne CLI/API-Ausweichweg.
Die JSON-Begleitdateien enthalten vollständige Prompts, Referenzrollen,
Quellprüfsummen und den tatsächlichen Freigabestatus.

- [Pferd, Mond-Einhorn, Sternen-Pegasus und Kristalldrache](../design/avatar-evolution/remaining-equines-crystal-concept-v1.png)
  mit [Prompt und Quellen](../design/avatar-evolution/remaining-equines-crystal-concept-v1.json).
- [Polarlichtwolf, Schattenpanther, Sturmgreif und Phönix](../design/avatar-evolution/remaining-mythical-animals-concept-v1.png)
  mit [Prompt und Quellen](../design/avatar-evolution/remaining-mythical-animals-concept-v1.json).
- [Entdeckerin und Entdecker](../design/avatar-evolution/remaining-explorers-concept-v1.png)
  mit [Prompt und Quellen](../design/avatar-evolution/remaining-explorers-concept-v1.json).

Alle Reihen behalten die vorhandene Grundidentität und zeigen Reiseausrüstung,
eine Wächterform und einen deutlich mythischen Abschluss. Die menschlichen
Grundformen behalten ihre vorhandene freie Kleidungsfarbauswahl. Höhere Formen
haben feste Kleidung; alle vier bestehenden Hauttöne bleiben ohne Zusatzkosten.
Die Vorschau zeigt bei Menschen nur einen exemplarischen Hautton.

**Konkrete Nutzerrückmeldung:** „ich finde beim Phönix und beim Greifen sind
die letzten Formen nicht imposant genug“. Die beiden Endstufen aus dem ersten
Bogen sind daher nicht als Produktionsrichtung ausgewählt. Ihre Überarbeitung
verstärkt Flügelspannweite, Kronen/Mähnen und magische Verwandlung. Die anderen
gezeigten Formen werden durch diese Korrektur nicht geändert.

Die einzeln gezeigten stärkeren Entwürfe
[Sturmgreif v2](../design/avatar-evolution/griffin-storm-stage-4-concept-v2.png)
und [Phönix v2](../design/avatar-evolution/phoenix-stage-4-concept-v2.png)
gefallen dem Nutzer besser. Er ergänzt konkret: Beim Greifen sollen zuckende,
knisternde Blitze die elektrostatisch aufgeladene Luft zeigen; beim Phönix sollen
Feuer und Flammen wirken, als entzünde er die Luft in seiner Nähe. Die Antwort
auf die Umsetzungsauswahl lautet „Die beiden Endformen noch ändern“.
Die Körpergestaltung bleibt dafür erhalten; nur die umgebenden Effekte werden
ergänzt. Kein Animations- oder Laufzeit-Effektpaket ist damit bereits umgesetzt.
Vollständige Bearbeitungsprompts:
[Sturmgreif v2](../design/avatar-evolution/griffin-storm-stage-4-concept-v2.json),
[Phönix v2](../design/avatar-evolution/phoenix-stage-4-concept-v2.json).

**Endgültig persönlich bestätigt:** Die Korrekturen
[Sturmgreif v3](../design/avatar-evolution/griffin-storm-stage-4-concept-v3.png)
und [Phönix v3](../design/avatar-evolution/phoenix-stage-4-concept-v3.png)
zeigen die gewünschten Entladungen beziehungsweise Flammen in der Umgebung.
Die Frage nach Umsetzung aller zehn Reihen mit diesen Endformen beantwortet
der Nutzer mit „Ja, so umsetzen“. Produktion, technische Bildprüfung und
Galerieintegration sind damit beauftragt; keine weitere Bildrichtungsfreigabe nötig.
Prompts und unveränderte Quellen:
[Sturmgreif v3](../design/avatar-evolution/griffin-storm-stage-4-concept-v3.json),
[Phönix v3](../design/avatar-evolution/phoenix-stage-4-concept-v3.json).

Die visuelle Eigenprüfung bestätigt vollständige Reihen und lesbare Figuren;
sie ersetzt keine persönliche Entwurfsbestätigung. Insbesondere dürfen die
vergleichsweise engen Ränder einzelner Konzeptzellen nicht als Vorgabe für
die endgültigen freigestellten Einzelbilder übernommen werden.

## Umsetzung nach Bildbestätigung

Die bestehenden Preise 200/400/800, Kaufbelege, Besitzfolge, bewusste Auswahl,
Guthaben, Lernpunkte und Level bleiben erhalten. Das Paket ergänzt die vorhandene
Galerie mit transparenten Einzelbildern und den bestehenden drei WebP-Größen
256/512/768. Kleine Varianten werden offline bereitgestellt, größere bei Bedarf.
Keine neue Google-Anmeldung, kein Import und keine synthetischen Punkte nötig.

Die Bildpipeline muss für die menschlichen Quellen deren Hautton im Schlüssel
und in den Metadaten berücksichtigen; die Laufzeitauswahl kennt diesen bereits.
Freie Grundform-Kleidungsfarben und der Klassisch-Wechsel müssen erhalten bleiben.
Vorhandene 36 ausgelieferte WebPs bleiben bytegleich. Nach Integration sind
Assetlisten, Cacheversion, Offline-/Updatepfad und Galerie auf kleinen Ansichten
zu prüfen. Eine Desktopsimulation ersetzt keine physische Geräteabnahme.

## Nachweisgrenzen und nächster Schritt

Dieser Schritt liefert Bildentwürfe, keine bereits eingebauten 64 App-Motive.
Produktcommit `31fcf02`, Cache v40 und bestehende Bereitstellung bleiben unverändert.
Keine neue Produkt- oder Browserprüfung ist für die Entwurfsdateien erforderlich.
Natürliche Token-Erneuerung, echte Kaufzeit unter zehn Sekunden und physische
Geräteabnahmen bleiben eigenständige offene Nachweise.

Als Nächstes die bestätigten Einzelquellen erstellen, prüfen, integrieren und
das vollständige Bildpaket privat bereitstellen. Die Bildrichtungen sind freigegeben.

Die sieben Entwurfsdateien und ihre Referenzhashes sind am 29.09.2026 um
19:47:22 UTC technisch geprüft. Alle vier Einzelentwürfe besitzen echte
Transparenz und teiltransparente Effekte. Beim Greifen v3 erreichen 37 Randpixel
mindestens Alpha 16; vor Auslieferung sind Darstellung und transparenter
Innenabstand zu prüfen. Das ist kein bereits geprüfter Produktionssatz.

## Bestätigter Folgeumfang: fünf Belohnungserweiterungen

Der Nutzer bestätigt alle fünf Vorschläge ausdrücklich als Folgeumfang:
„ich finde alle 5 Vorschläge gut. Behalte sie, wir setzten diese dann nach der
Umsetzung der Entwicklungsstufen und der anderen Optimierungen um“.

1. Kurze, überspringbare Verwandlung nach bestätigtem Freischalten.
2. Dezente Bewegung der Figur und gelegentliche charaktertypische Effekte.
3. Reaktionen auf abgeschlossene Lernrunden und überwundene schwierige Wörter.
4. Ein eigener Ort der entwickelten Figur auf der Lerninsel mit sichtbarer Sammlung.
5. Kurzer Steckbrief, Geschichte und passende freigeschaltete Titel.

**Bestätigte Reihenfolge:** erst Entwicklungsstufen fertigstellen, dann die
anderen Optimierungen, danach alle fünf Belohnungserweiterungen. Sie gehören
nicht zur jetzigen Bildintegration. Die konkrete Gestaltung wird vor ihrer
Umsetzung ausgearbeitet. Effekte müssen auf Handys sparsam sein; Ton/Bewegung
sind abschaltbar. Die Kaufbestätigung darf dadurch nicht länger dauern und
erworbene Lernstände bleiben unverändert.
