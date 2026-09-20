# Passformkorrektur der menschlichen Avatare

Stand: 20.09.2026  
Figuren: `explorer-girl`, `explorer-boy`  
Umfang: zehn kompatible Ausrüstungsartikel je Figur, insgesamt 20 Paare

## Ergebnis

Die Ausrüstung wurde mit einem reproduzierbaren Pillow-Rezept aus den
Originaldateien des Git-Stands `24ce5a3` neu gesetzt. Die vom Nutzer am
20.09.2026 ausdrücklich freigegebene klassische Rasterbearbeitung verwendet
keine Bildgenerierung und kopiert keine Hautpixel in Ausrüstungsebenen.

- Kappe, Sonnenhut, Bergmütze, Ritterrüstung und Runenmedaillon behalten ihre
  bereits passende Geometrie. Ihre Ebenen wurden auf die volle Leinwand und
  Identitätsregistrierung normalisiert.
- Der Rucksack bleibt eine Hinterlage. Vordergurte und Schnallen stammen aus
  Ausschnitten der gemalten Originalriemen des Rucksacks.
- Das Fernglas wurde aus seinem vollständigen Original auf 60 Prozent
  verkleinert und unter der Hand angeordnet; seine gemalte Schlaufe liegt am
  Fingerbereich.
- Der Kompass wurde auf rund 62 Prozent verkleinert und so verschoben, dass
  der vorhandene Ring am Finger liegt und das Gehäuse darunter hängt.
- Der Kristall-Kompass wurde zehn Pixel nach links verschoben. Seine vorhandene
  Lederschlaufe überlappt die Hand.
- Der Sternenumhang wurde auf 78 Prozent der bisherigen Breite und 80 Prozent
  der Höhe gebracht. Er bleibt hinter dem Körper. Kragenkanten und Verschluss
  stammen aus der Originalmalerei; die innere goldene Fläche ist als
  Halsöffnung ausgespart.

Das ausführbare Rezept liegt in
`docs/design/avatar-fit-recipes/humans/recipes.json`, die Umsetzung in
`scripts/avatar-fit/humans.py`. Beide lesen ihre Eingaben mit `git show` direkt
aus `24ce5a3`; wiederholtes Ausführen hängt daher nicht von bereits erzeugten
Arbeitsbaumdateien ab.

## Prüfbilder

Unter `docs/design/avatar-fit-v3/humans/` liegen genau acht kuratierte Bögen:

- zwei beschriftete Vorher/Nachher-Seiten je Figur, zusammen alle 20 Paare mit
  echten 256-Pixel-Karten;
- je Figur ein Farbkombinationsbogen für Fernglas, Kompass und
  Kristall-Kompass mit vier Hauttönen und sechs Kleidungsfarben;
- je Figur ein großer Abschlussbogen für Rucksack, Umhang und die drei
  Handgegenstände.

Weitere Einzelbilder, große Ausschnitte und Arbeitsstände verbleiben nur im
ignorierten Prüfverzeichnis `.superpowers/sdd/2026-09-20-avatar-fit-v3/humans/`.

## Technische Prüfung

- alle erzeugten Ausrüstungsebenen: 1086 × 1448 Pixel, RGBA;
- alle Sidecars: Identitätsregistrierung `scale: 1, x: 0, y: 0`, passender
  SHA-256-Wert und dokumentierte klassische Provenienz;
- alle vier Hautbasen und alle sechs Kleidungsfarbbasen je Figur bytegleich zu
  `24ce5a3`;
- alle 20 Paare auf hellem Hintergrund als große Ansicht und als 256-Pixel-Karte
  gerendert;
- die drei Handgegenstände zusätzlich in allen 24 Haut-/Farbkombinationen je
  Figur gerendert;
- Root und unabhängige Review öffneten die v3-Abschlussbögen. Für diese Fassung
  meldeten sie keine offenen P1/P2-Passformfehler.

## Grenzen

Die Prüfung belegt die Quellbilder und die gerenderten Prüfbögen. Der gemeinsame
Produkt-Build, WebP-Ausgaben und die Prüfung im tatsächlichen Shop-Renderer
gehören nicht zu diesem Teilauftrag und werden von Root erzeugt. Eine Abnahme
auf realen Mobilgeräten ist damit ebenfalls nicht ersetzt.
