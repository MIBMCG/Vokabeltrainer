# Quellen der Avatar-Entwicklungsformen

Diese Dateien sind die unveränderten großen PNG-Quellen der Bildausgabe. Auswahl und Prüfung der ersten Drachenreihe:

| Formkennung | Ausgewählte Quelle |
| --- | --- |
| `dragon-stage-1` | [Stufe 1 v3](dragon-stage-1-v3.png) |
| `dragon-stage-2` | [Stufe 2 v3](dragon-stage-2-v3.png) |
| `dragon-stage-3` | [Stufe 3 v1](dragon-stage-3-v1.png) |
| `dragon-stage-4` | [Stufe 4 v2](dragon-stage-4-v2.png) |

Die gleichnamigen JSON-Dateien dokumentieren Prompt, Referenz, Prüfsumme und Auswahlstatus. Dateien mit `superseded-source-candidate` sind erhaltene frühere Versuche und dürfen nicht als ausgewählte Produktionsquelle verwendet werden.

Der [historische Grundlagenbericht](../../reports/2026-09-20-avatar-evolution-foundation.md) und die [unabhängige Bildprüfung](../../reports/2026-09-20-avatar-evolution-art-review.md) dokumentieren die bestätigte Stilrichtung. Vier von 76 geplanten Motiven liegen vor; die übrigen 72 bleiben offen.

Die vier Quellen wurden am 28.09.2026 in transparente WebPs mit 256, 512 und
768 Pixeln Breite abgeleitet, ohne Vergrößerung oder Motivänderung. Das
[Buildskript](../../../scripts/build-evolution-art.mjs) prüft den ausgewählten
Quellstatus und die Prüfsumme. Es benötigt Sharp nur beim Bauen; `SHARP_MODULE`
kann auf eine vorhandene Sharp-Installation zeigen. Danach erzeugt
`node scripts/build-evolution-art.mjs` die Bilder, das Laufzeitmanifest und den
[Größen-/Hashbericht](../../../trainer/assets/avatar-evolution/build-report.json).
Der [Galeriebericht](../../reports/2026-09-28-entwicklungsgalerie.md) hält
Integration, Tests und tatsächliche Bereitstellung getrennt fest.
