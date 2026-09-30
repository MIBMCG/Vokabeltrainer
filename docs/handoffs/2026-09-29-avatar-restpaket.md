# Übergabe: verbleibende Avatar-Entwicklungen

Stand: 29.09.2026. Entwicklungszweig: `codex/vokabeltrainer-v1`.
Ausgangsstand: `c1ecf2a58ed9951aa3a568eeda0f551f3a5f9974`.

## Aktuelle Fortsetzung am 30.09.2026

Der Nutzer setzt mit „arbeite nun weiter“ ausdrücklich fort; die Pause ist
aufgehoben. Hauptzweig `0643d25` und Arbeitszweig `3036ec9` sind sauber erhalten.
Die noch offenen Tests und Reviews werden nachgeholt. Es gibt keine neue
Bildproduktion oder neue Entwurfsfreigabe. Vor dem GitHub-Upload bleibt die
konkrete Zielbestätigung aus der automatischen Ablehnung zu klären.

## Historische Pause nach gesichertem Zwischenstand

Der Nutzer wählt am 29.09.2026 ausdrücklich „In etwa 5–10 Minuten nach
Sicherung des Zwischenstands“. Nach dieser Sicherung pausieren; keine weitere
Produktarbeit, Bilderzeugung, Testsitzung oder Bereitstellung ohne erneute
ausdrückliche Fortsetzung. Die unten beschriebene Bildrichtung bleibt bestätigt.

Alle 64 fehlenden Produktionsquellen sind fertig: 16 vorhandene Grundformen
unverändert übernommen, zwei bestätigte Endformen direkt übernommen und
46 weitere Motive erzeugt. Alle zehn Reihen auf hellem und dunklem Hintergrund
gesichtet; Einhorn/Pegasus Stufe 2 zur klaren Staffelung vereinfacht und sechs
höhere Menschenformen im dunkelsten Hautton an ihre Grundform angeglichen.
Die Korrekturen wurden erneut einzeln geprüft. PNG-Transparenz, Quellhashes
und 124 portable Referenzhashes sind geprüft. Acht verworfene Bearbeitungseingaben
bleiben mit Herkunftsnachweis erhalten; sie werden nicht ausgeliefert.

Der vorbereitete Einbau liegt ausschließlich auf `codex/purchase-batch-checks`.
Lokaler Sicherungscommit: `3036ec9e5bf29f183ddb246f54a78ef428aac503`.
Alle 228 WebPs sind gebaut, 42 gezielte Node-Tests bestanden und die 36
bisherigen WebPs bytegleich. GitHub-Upload noch nicht bestätigt: Die automatische
Freigabe verlangt eine ausdrückliche Bestätigung des konkreten Repository-Ziels.
Dies ist ein Sicherungsstand, keine geprüfte Produktfreigabe. Die laufende App
und der Hauptentwicklungszweig behalten Produkt `31fcf02`, Cache v40. Vollsuite,
Browserabnahme, unabhängige Reviews, Produktintegration und App-Update stehen
noch aus. Der [Zwischenstandsbericht](../reports/2026-09-29-avatar-restpaket-zwischenstand.md)
hält Bildbau, gezielte Prüfungen und den exakt gesicherten Commit fest.

Bei Fortsetzung die vorhandenen Quellen und Änderungen auf diesem Zweig
verwenden; nichts neu erzeugen, keine Profile importieren oder neu einrichten.
Nach Abschluss der Galerie folgen die anderen Optimierungen, danach die fünf
bestätigten Belohnungserweiterungen am Ende dieser Übergabe.

## Aktueller Auftrag

Der Nutzer möchte zuerst alle fehlenden Avatar-Entwicklungen fertigstellen,
um sich danach auf die Optimierung zu konzentrieren. Die vorgeschlagene
[schnellere Lernbereichsübernahme](2026-09-29-lernbereich-vorschau.md) ist
damit zurückgestellt; ihre Umsetzung wurde nicht bestätigt.
Dieser Produktionsauftrag ist seit der Fortsetzung am 30.09.2026 wieder aktiv.
Familien- und Testbestände erhalten.

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

Die 64 Produktionsquellen und der vorbereitete Einbau sind inzwischen vorhanden;
die abschließende Produktabnahme fehlt noch. Produktcommit `31fcf02`, Cache v40
und bestehende Bereitstellung bleiben unverändert. Die genauen bereits gelaufenen
und noch offenen Prüfungen stehen im Zwischenstandsbericht.
Natürliche Token-Erneuerung, echte Kaufzeit unter zehn Sekunden und physische
Geräteabnahmen bleiben eigenständige offene Nachweise.

Als Nächstes nach ausdrücklicher Fortsetzung den gesicherten Einbau fertig prüfen,
unabhängig reviewen, integrieren und privat bereitstellen. Die Quellen sind fertig
und die Bildrichtungen freigegeben; keine erneute Bilderzeugung oder Freigabe.

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
