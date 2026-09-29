# Quellen der Avatar-Entwicklungsformen

Diese Dateien sind die unveränderten großen PNG-Quellen der Bildausgabe. Ausgewählte Drachen- und Nebelhirschreihe:

| Formkennung | Ausgewählte Quelle |
| --- | --- |
| `dragon-stage-1` | [Stufe 1 v3](dragon-stage-1-v3.png) |
| `dragon-stage-2` | [Stufe 2 v3](dragon-stage-2-v3.png) |
| `dragon-stage-3` | [Stufe 3 v1](dragon-stage-3-v1.png) |
| `dragon-stage-4` | [Stufe 4 v2](dragon-stage-4-v2.png) |
| `deer-mist-stage-1` | [Stufe 1 v1](deer-mist-stage-1-v1.png) |
| `deer-mist-stage-2` | [Stufe 2 v1](deer-mist-stage-2-v1.png) |
| `deer-mist-stage-3` | [Stufe 3 v1](deer-mist-stage-3-v1.png) |
| `deer-mist-stage-4` | [Stufe 4 v1](deer-mist-stage-4-v1.png) |

Die gleichnamigen JSON-Dateien dokumentieren Prompt, Referenz, Prüfsumme und Auswahlstatus. Dateien mit `superseded-source-candidate` sind erhaltene frühere Versuche und dürfen nicht als ausgewählte Produktionsquelle verwendet werden.

Der [historische Grundlagenbericht](../../reports/2026-09-20-avatar-evolution-foundation.md) und die [unabhängige Bildprüfung](../../reports/2026-09-20-avatar-evolution-art-review.md) dokumentieren die bestätigte Drachenrichtung.

Am 29.09.2026 bestätigt der Nutzer die Übertragung auf den Nebelhirsch anhand
des [Konzeptbogens v2](../avatar-evolution/deer-mist-stages-concept-v2.png).
Die Grundform ist bytegleich mit der vorhandenen Grundillustration; drei höhere
Formen wurden mit der eingebauten Bildgenerierung erzeugt. Acht von 76 geplanten
Motiven besitzen damit ausgewählte Quellen; 68 weitere Motive bleiben offen.
Die unabhängige Produktionsprüfung auf hellen und dunklen kleinen Karten ist
bestanden. Der [aktuelle Nachweisstand](../../handoffs/2026-09-29-nebelhirsch-fortsetzung.md)
unterscheidet Quellenprüfung, Integration und tatsächliche Bereitstellung.

Die vier Quellen wurden am 28.09.2026 in transparente WebPs mit 256, 512 und
768 Pixeln Breite abgeleitet, ohne Vergrößerung oder Motivänderung. Das
[Buildskript](../../../scripts/build-evolution-art.mjs) prüft den ausgewählten
Quellstatus, Figurenkennung, Stufe und die Prüfsumme. Es benötigt Sharp nur beim Bauen; `SHARP_MODULE`
kann auf eine vorhandene Sharp-Installation zeigen. Danach erzeugt
`node scripts/build-evolution-art.mjs` die Bilder, das Laufzeitmanifest und den
[Größen-/Hashbericht](../../../trainer/assets/avatar-evolution/build-report.json).
Der [Galeriebericht](../../reports/2026-09-28-entwicklungsgalerie.md) hält
Integration, Tests und tatsächliche Bereitstellung getrennt fest.
