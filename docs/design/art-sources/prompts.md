# Bildquellen und Prompts vom 19.09.2026

Alle Dateien in diesem Verzeichnis wurden mit dem eingebauten Bildwerkzeug von Codex erzeugt. Als visuelle Referenz diente ausschließlich [`../2026-09-17-insel-konzept.png`](../2026-09-17-insel-konzept.png). Es wurden keine externen Bilder, Markenfiguren oder Schriften übernommen.

Die folgenden Prompts dokumentieren die bei der Erzeugung verwendeten Vorgaben in normalisierter Form. Wiederkehrender Stilzusatz: detailreiche, freundliche, handgemalte Abenteuerillustration für Kinder von 10 bis 13 Jahren; klare Formen, warme Beleuchtung, Türkiswasser, Sand, üppige Pflanzen, kein Text, keine UI und keine Logos.

## Landschaften

- `island-beach.png`: Breite tropische Bucht im Seitenverhältnis 3:2, türkisfarbenes Wasser, heller Sand, Trittsteine und dichter Pflanzenrahmen. Der ruhige mittlere Bereich bleibt für die Produktoberfläche frei. Keine Personen oder Markierungen.
- `island-journey.png`: Durchgehende hochformatige Inselreise. Unten Strand und Lagune, in der Mitte üppiger Wald, oben felsige Berge. Ein lesbarer gewundener Pfad verbindet fünfzehn natürlich integrierte, freie Haltepunkte. Keine eingebrannten Marker, Sperren oder Texte.

## Avatarbasis

Grundprompt für `avatar-skin-0.png`: vollständig bekleideter, frontal stehender Inselentdecker im Alter von etwa 11 bis 13 Jahren; freundlicher Ausdruck, neutrale symmetrische Haltung, freie Hände, türkisfarbenes T-Shirt, kurze Hose und Schuhe; transparenter Hintergrund im Verhältnis 3:4; keine Gegenstände und kein Bodenschatten.

Die drei weiteren Hautvarianten leiten sich von derselben Figur ab. Pose, Gesicht, Haare, Kleidung, Kontur und transparente Leinwand bleiben unverändert; nur der Hautton ändert sich:

- `avatar-skin-0.png`: heller Pfirsichton
- `avatar-skin-1.png`: mittlerer goldener Hautton
- `avatar-skin-2.png`: tiefer warmer Braunton
- `avatar-skin-3.png`: dunkler satter Braunton

## Kleidungsebenen

Für jede Datei wurde nur das T-Shirt der Basisfigur als transparente Überlagerung erzeugt. Ausschnitt, Ärmel, Falten, Licht, Haltung und Leinwand bleiben identisch; Körper, Gesicht, Haare, Hose, Schuhe und Hintergrund sind transparent.

- `avatar-clothing-0.png`: Türkis
- `avatar-clothing-1.png`: Waldgrün
- `avatar-clothing-2.png`: Sonnengelb
- `avatar-clothing-3.png`: Himmelblau
- `avatar-clothing-4.png`: Violett
- `avatar-clothing-5.png`: Koralle

## Ausrüstungsebenen

Jede Datei enthält nur das genannte Zubehör auf transparentem Hintergrund. Perspektive, Licht und Position beziehen sich auf dieselbe frontale Basisfigur; keine zusätzliche Person und keine weitere Kleidung.

- `avatar-head-cap.png`: schlichte türkisfarbene Kappe
- `avatar-head-sunhat.png`: heller breitkrempiger Sonnenhut
- `avatar-head-mountainhat.png`: kompakter grüner Berghut
- `avatar-back-backpack.png`: kleiner orangefarbener Rucksack hinter Schultern und Rumpf
- `avatar-hand-binoculars.png`: Fernglas neben der rechten Hand
- `avatar-hand-compass.png`: runder Kompass neben der rechten Hand

Das Bildwerkzeug lieferte geringfügig unterschiedliche Quellmaße. `scripts/build-art.mjs` erkennt deshalb die sichtbare Alphafläche und setzt alle Avatarequellen mit festen, für sämtliche Zielauflösungen gleichen Transformationen auf eine gemeinsame Leinwand von 1086 × 1448 Pixeln. Diese Normalisierung ändert keine Kombination abhängig von Bildschirmgröße oder Auswahl.
