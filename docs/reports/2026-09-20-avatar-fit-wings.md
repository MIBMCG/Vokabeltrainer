# Klassische Passformkorrektur: Drachen, Greif und Phönix

Stand: 20.09.2026. Ausgangsrevision: `24ce5a3`. Umfang: zwölf kompatible Figur-/Artikelpaare für `dragon`, `dragon-crystal`, `griffin-storm` und `phoenix`.

## Ergebnis und Methode

Die vorhandenen Ausrüstungsbilder wurden ausschließlich mit Pillow-/NumPy-Masken bearbeitet. Das Skript [wings.py](../../scripts/avatar-fit/wings.py) liest alle Originalbytes binär mit `git show 24ce5a3:<path>`, registriert die alten Ausrüstungslagen nach ihren damaligen Sidecars und teilt sie auf der unveränderten Grundcanvas in körperbezogene Vorder- und Hinterlagen. Es wurden keine neuen Bildinhalte generiert oder gemalt.

Die vier Grundfiguren blieben bytegleich. Sämtliche 24 neuen Vorder-/Hinterlagen besitzen die volle Canvas der jeweiligen Figur und Identitätsregistrierung. Die vier maschinenlesbaren Rezepte unter `docs/design/avatar-fit-recipes/wings/` nennen pro Artikel Originalpfad, Originalhash, alte Registrierung, Maskeneingriffe und beide Ausgabehashes.

## Einzelbefunde

| Figur | Artikel | Sichtbare Korrektur |
| --- | --- | --- |
| Einfacher Drache | Runen-Amulett | Die seitliche Kette verschwindet abschnittsweise hinter den Nackenschuppen; der Anhänger bleibt mittig auf der oberen Brust. |
| Einfacher Drache | Kristallrüstung | Beide Vorderläufe verdecken örtlich die unteren Schulterplatten. Brustplatte und dunkle Untergurte bleiben zusammenhängend am Körper. |
| Einfacher Drache | Flügelspitzen | Tief liegende Kristallteile verschwinden hinter der Membran; sichtbar bleiben Kappen und Kristalle entlang beider Außenkonturen. |
| Kristalldrache | Runen-Amulett | Die Kette folgt derselben Halsführung, wird aber gegen die eigene Kristallgrundfigur getrennt maskiert. |
| Kristalldrache | Kristallrüstung | Die Vorderläufe liegen örtlich vor den Platten; die identische Ausrüstung wird auf der eigenen Basis geprüft und ausgegeben. |
| Kristalldrache | Flügelspitzen | Vordere und hintere Kristallsegmente wechseln entlang der leuchtenden Membrankanten. Die geringe Farbtrennung zur Grundfigur bleibt als Eigenschaft der gewählten Palette sichtbar. |
| Sturmgreif | Runen-Amulett | Der ringartige Stirn-/Gesichtsverlauf ist entfernt. Die Kette beginnt am Halsgefieder und endet in einem Brustanhänger. |
| Sturmgreif | Blitzrüstung | Der nahe Flügel und seine Federkante liegen vor der oberen Flankenrüstung. Der mittlere Untergurt liegt nun als verdeckte Rücklage hinter dem Bauch; sein zuvor im Freiraum sichtbarer Abschnitt ist entfernt, während die angesetzte Hinterlaufschnalle erhalten bleibt. |
| Sturmgreif | Goldene Federzier | Ketten über Hinterleib und Beine sowie ein isoliertes goldenes Dreiecksfragment zwischen rechter Flügelkante und unterer Schmuckgruppe sind entfernt. Verbleibende Goldkappen, Ketten und blaue Schmucksteine folgen den äußeren Federgruppen; einzelne Schmucksteine dürfen frei unter einer Flügelkappe hängen. |
| Phönix | Sonnenkrone | Eine Crestfeder überdeckt den unteren Kronenrand örtlich; Gesicht und Auge bleiben frei. |
| Phönix | Brustschmuck | Seitliche Goldäste tauchen an Brust- und Flügelwurzelfedern örtlich unter; das mittlere Sonnenjuwel bleibt befestigt. |
| Phönix | Flügelreifen | Sechs federförmige Überdeckungen lassen die goldenen Spangen abwechselnd vor und hinter den ausgewählten Federbündeln verlaufen. |

Das ist ein interner, begründeter Fit-Pass und keine persönliche Nutzerabnahme. Beim Kristalldrachen und Phönix bleibt die Ausrüstung durch die bewusst ähnliche Grundpalette in der 256-Pixel-Karte dichter als beim grünen Drachen beziehungsweise Greif; die großen Detailbilder zeigen deshalb zusätzlich die tatsächlichen Überdeckungen.

Eine unabhängige Detailprüfung meldete beim Sturmgreif genau zwei Restartefakte. Die gezielten Nachkorrekturen am Untergurt und am isolierten Goldfragment sind im Rezept als `rearOccluded` beziehungsweise `discardHard` dokumentiert und in sämtlichen Einzel- und Sammelnachweisen neu gerendert.

## Bildnachweise

Alle Nachweise liegen unter `.superpowers/sdd/2026-09-20-avatar-fit-v3/wings/`:

- `wings-before-after-contact.png`: alle zwölf Einzelpaare und vier Vollsets, jeweils vorher/nachher.
- `wings-detail-before-after-contact.png`: die zwölf Befestigungsbereiche in einer gemeinsamen Großübersicht.
- `<figur>-<artikel>-before-light.png` und `...-after-light.png`: native Großkomposition jedes einzelnen Paares auf hellem Hintergrund.
- `<figur>-<artikel>-before-256.png` und `...-after-256.png`: tatsächliche 256-Pixel-Kartenkomposition jedes einzelnen Paares.
- `<figur>-<artikel>-detail-before-after.png`: zugeschnittener Befestigungsbereich in nativer Auflösung.
- `<figur>-before-full-light.png`, `...-after-full-light.png` und `...-after-256.png`: vollständige Dreier-Sets groß und als Karte.

Dauerhaft im Repository liegen vier beschriftete Figurenseiten mit den jeweils drei Einzelpaaren sowie die tatsächliche 256-Pixel-Ansicht aller zwölf Nachher-Kompositionen:

- [Einfacher Drache](../design/avatar-fit-v3/wings/dragon-before-after.png)
- [Kristalldrache](../design/avatar-fit-v3/wings/dragon-crystal-before-after.png)
- [Sturmgreif](../design/avatar-fit-v3/wings/griffin-storm-before-after.png)
- [Phönix](../design/avatar-fit-v3/wings/phoenix-before-after.png)
- [Alle zwölf Paare bei 256 Pixeln](../design/avatar-fit-v3/wings/all-pairs-after-256.png)

Die Nachweise werden aus denselben unveränderlichen Eingaben und denselben Masken wie die ausgelieferten PNG-Quellen erzeugt.

## Originale und Verifikation

| Grundfigur | Canvas | SHA-256 aus `24ce5a3` und aktuellem Arbeitsbaum |
| --- | --- | --- |
| `dragon.png` | 1199 × 1312 | `305f541b09a1a7da241491056697cadeaf1e8677b1943618580f9287d2abc9fb` |
| `dragon-crystal.png` | 1199 × 1312 | `21650fcf744d1b000d17d21036ce895f8aad610f69789719d48bb44821bfb862` |
| `griffin-storm.png` | 1225 × 1284 | `9824b0ed7141d278a057f48d22620a5c2239027855f3b980d2d4105ecad7fd63` |
| `phoenix.png` | 1024 × 1536 | `5bf95178a98bb9c8f0b79f2d1d9c98c1be186b0cdd9562fae40da13563055b3c` |

Frisch ausgeführt:

```text
python scripts/avatar-fit/wings.py verify
{
  "sourceRevision": "24ce5a3",
  "figures": 4,
  "pairs": 12,
  "outputLayers": 24,
  "basesByteIdentical": true,
  "deterministicPngs": true,
  "identityRegistration": true,
  "evidenceFilesChecked": 51
}
```

Die Prüfung rendert alle 24 PNGs erneut im Speicher und vergleicht die Bytes mit den gespeicherten Dateien. Zusätzlich prüft sie Originalhashes, Canvas, RGBA-Modus, nichtleere Alphaebenen, Sidecar-Hashes, Rezept-Hashes, Identitätsregistrierung und die 51 zentralen Bildnachweise.

Der gemeinsame WebP-/Manifestbau, Browserkompositionen und Produkttests gehören laut Ausführungsplan zum anschließenden Root-Schritt und wurden in diesem Teilpaket bewusst nicht ausgeführt. Produktcode, Katalog-IDs, Preise, Lernlogik und Grundfiguren wurden nicht geändert.
