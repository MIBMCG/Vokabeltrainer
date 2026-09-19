# Bildbericht: Inselwelt und Avatar

Stand: 19.09.2026

## Ausgangslage und Ergebnis

Der vorherige Appstand zeigte voneinander getrennte, flache Vektorkarten und einen aus einfachen Formen aufgebauten Avatar. Gegenüber dem bestätigten Konzept fehlten räumliche Tiefe, eine zusammenhängende Reise und eine erkennbare Entdeckerfigur. Der neue Bildsatz bildet eine durchgehende gemalte Insel vom Strand über den Wald bis zu den Bergen, eine eigene Strandansicht und einen geschichteten Avatar. Texte, Fortschritt, Etappen und Sperren bleiben im DOM und sind nicht in Bilder eingebrannt.

Die Darstellung wurde in der echten synthetischen App bei 390 und 1024 Pixeln geprüft. Auf 390 Pixeln bleiben Überschrift, Fortschritt und Abzeichen innerhalb des Fensters; nur die bewusst größere Karte liegt in einem eigenen horizontalen Scrollbereich. Die Avataraufnahme zeigt die echte Vorschau mit einer Figur. Eine getrennt benannte Diagnoseaufnahme prüft alle Ausrüstungsslots zusammen.

## Erzeugung und Ableitung

Die Originale wurden mit dem eingebauten Bildwerkzeug erzeugt. Referenz, Prompts und Varianten sind unter [`../design/art-sources/prompts.md`](../design/art-sources/prompts.md) dokumentiert. Es wurden keine externen Bildquellen verwendet.

`scripts/build-art.mjs` liest die 18 explizit aufgeführten PNG-Quellen. Eine leere Playwright-Seite normalisiert transparente Avatarteile auf dieselbe 1086 × 1448-Pixel-Leinwand und erzeugt WebP mit Qualitätswert 0,86. Landschaften werden in Breiten 480/960/1440, Avatare in 256/512/768 abgeleitet, jeweils ohne Hochskalierung. Insgesamt entstanden 54 Renditions mit 2.578.384 Byte. Das beim ersten Laden vorgehaltene Paket umfasst 18 kleine Varianten mit 328.922 Byte und liegt damit deutlich unter 5 MiB.

## Quellen und Prüfsummen

| Datei | Maße | SHA-256 |
| --- | ---: | --- |
| `avatar-back-backpack.png` | 1086×1448 | `6b9bbe7512cfbb586b5cf88b7fab4fe8d4bfbed83df0bc4fb622aec7befc4843` |
| `avatar-clothing-0.png` | 1086×1448 | `cb55ea06ad119febc52ed5a4ac16bbce0beeac918200419a46a570cc3197d41b` |
| `avatar-clothing-1.png` | 1086×1448 | `0bee1e81d47f546244fe79d3c6a1d6127c2a3fddd7e416429454bcb905ce64b5` |
| `avatar-clothing-2.png` | 1086×1448 | `78e13261bfec88a6a2f350017d036dbb085f6252f24b6f1c20f24f057c717c95` |
| `avatar-clothing-3.png` | 1086×1448 | `4909aafae08dbcb4dded45621ab3daa0974a5aaae8efa2cb08bdf417a856b7f3` |
| `avatar-clothing-4.png` | 1086×1448 | `c8a86e1abde8d42cd2921af2b17ddc89d679777bbda0f3e2c341ffb2a2a378ba` |
| `avatar-clothing-5.png` | 1087×1447 | `36dbaa333be83e7c87a8193941709b450596200fc9143df4bea09d4cd41a40c1` |
| `avatar-hand-binoculars.png` | 1086×1449 | `5da75c3f6ef178e38b64f02c8c8ee520b11cc3e76e85ddc57fcb31001bcab4fc` |
| `avatar-hand-compass.png` | 1086×1448 | `204be858011536743528a908cf0827bcc05c8a89eeba94cf602075d6a0eef0ba` |
| `avatar-head-cap.png` | 1086×1448 | `3630bb444115296cc61ad914ec118754ca35ccc226b8e8487d6ff37f59448462` |
| `avatar-head-mountainhat.png` | 1087×1447 | `82b3df329900ca5fb9d15f32766641cbcb7c3fc6be851a4da820c462b5424f1b` |
| `avatar-head-sunhat.png` | 1086×1448 | `0ace139465638c1f4d3811083870200bf5bd6100a9c3c24aa3a26ae5f9066732` |
| `avatar-skin-0.png` | 1086×1448 | `e168a0142b21b92effb5984b475102637a12c1bbf74f54704ec646cf1f08b477` |
| `avatar-skin-1.png` | 1086×1448 | `00b7c68fa08da982e3e3733c753a22f848c1c706661c4471cccc727f07465ec8` |
| `avatar-skin-2.png` | 1086×1448 | `62566227b97dbab7346bc9ab91729409e0c90acdf246f472fa0558b460300011` |
| `avatar-skin-3.png` | 1086×1448 | `809709e35a96f0664211f56fe4451fc138fef22a08e6108e9d4d623230056f06` |
| `island-beach.png` | 1536×1024 | `5354841c6cef293daa6e22f66cb7dbae27e712aeddb88777db3887ef40014ec6` |
| `island-journey.png` | 1086×1448 | `cd0f929158ca17201276f132aa04801a254d2a26d27e901b2f9adbfa66a410a3` |

## Sichtnachweise

- [Startansicht, 390 Pixel](assets/2026-09-19-a1-start-mobile.png)
- [Reise, 390 Pixel](assets/2026-09-19-a1-journey-mobile.png)
- [Reise, 1024 Pixel](assets/2026-09-19-a1-journey-desktop.png)
- [Avatar, 390 Pixel](assets/2026-09-19-a1-avatar-mobile.png)
- [Avatar, 1024 Pixel](assets/2026-09-19-a1-avatar-desktop.png)
- [Diagnose mit Rück-, Basis-, Kleidungs-, Kopf- und Handebene](assets/2026-09-19-a1-avatar-composite-diagnostic.png)

Die Aufnahmen stammen aus Edge/Chromium mit synthetischen Daten. Sie sind keine Abnahme auf einem echten iPhone oder iPad. Die Diagnoseaufnahme ist keine Produktansicht und fügt ausschließlich zur Ebenenprüfung eine zweite Figur ein.
