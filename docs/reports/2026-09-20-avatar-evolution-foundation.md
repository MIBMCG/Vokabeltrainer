# Avatar-Entwicklung: Katalog und erste Produktionsreihe

Stand: 20.09.2026. Ausgangspunkt `1a9f818` auf `codex/vokabeltrainer-v1`. [Entwurf](../superpowers/specs/2026-09-20-avatar-evolution-foundation.md), [Plan](../superpowers/plans/2026-09-20-avatar-evolution-foundation.md), [bestätigte EV01–EV05](../design/2026-09-20-avatar-entwicklungsstufen.md).

## Implementierter Katalog

`src/trainer/avatar/evolution.js` ergänzt 52 unveränderliche Formkennungen und 76 Bildkennungen. Die bisherigen 13 Grundfiguren, deren Preise und Levelschwellen bleiben unverändert. Hauttonvarianten haben dieselbe Formkennung und kosten keinen zusätzlichen Kauf. Eine reine Angebotsfunktion beschreibt jeweils die nächste Stufe und die fehlenden Punkte; sie autorisiert und verbucht keinen Kauf.

GPT-5.6 Luna / medium hat Task 1 umgesetzt. GPT-5.6 Sol / medium hat den tatsächlichen Code unabhängig auf Spezifikation und Qualität geprüft: **Pass / Approved**, keine Befunde. [Review](2026-09-20-avatar-evolution-catalog-review.md).

Tatsächliche Prüfungen des Implementierers:

- RED: `node --test --experimental-test-isolation=none tests/trainer/avatar-evolution.test.js` scheiterte zunächst am fehlenden neuen Modul.
- GREEN: danach 7/7 neue Tests bestanden.
- Historische Katalogtests: 12/12 bestanden.
- `npm test`: 379/379 bestanden.
- `git diff --check`: ohne Befund.

Die Produkt-App importiert das neue Modul noch nicht. Kein Service-Worker-Update und keine Produktmigration waren Teil dieses isolierten Schrittes.

## Erste Drachenreihe

Vier vollständige Einzelillustrationen liegen unter `docs/design/avatar-evolution-sources/` vor. Ausgewählte Quellen:

| Stufe | Quelle | Größe |
| --- | --- | --- |
| 1 | `dragon-stage-1-v3.png` | 1145 × 1374 |
| 2 | `dragon-stage-2-v3.png` | 1145 × 1374 |
| 3 | `dragon-stage-3-v1.png` | 1145 × 1374 |
| 4 | `dragon-stage-4-v2.png` | 1254 × 1254 |

Alle ausgewählten Quellen sind RGBA mit transparenten und deckenden Pixeln. Die Hintergrundscheine der ersten Versuche für Stufe 1/2 erfüllten den Produktionsvertrag nicht. Sie wurden durch neue, aus der sauberen Stufe-3-Quelle abgeleitete frühere Formen ersetzt. Stufe 4 erhielt einen breiteren Ausschnitt für vollständige Flügel. Nicht ausgewählte Quellen sind als überholt gekennzeichnet; keine stille Überschreibung vorhandener Bilder.

Root hat die Einzelbilder und die [256px-Gegenüberstellung auf hellen und dunklen Flächen](assets/avatar-evolution/dragon-light-dark-256.png) tatsächlich angesehen. Rüstungen bilden einen Teil der jeweiligen Gesamtillustration, keine nachträglich schwebenden Ebenen. Stufe 4 zeigt die deutlich andere Hornkrone, Energiemähne, Sternbildflügel und den Federschweif. Der Konzeptstil war persönlich bestätigt; für diese Produktionsquellen wird keine neue persönliche Nutzerabnahme behauptet.

Technische Bildprüfung mit Python/Pillow: `python scripts/avatar-evolution/check-dragon-sources.py`. Tatsächliche Maße, Alphawerte und SHA-256-Prüfsummen stehen im [Quellenprüfbericht](assets/avatar-evolution/source-check.json). Die Prüfung erzeugt ausschließlich den Nachweis, keine veränderten Produktionsquellen. Prompts, Referenzen und Hashes stehen zusätzlich in den jeweiligen JSON-Dateien. Erzeugung durch eingebautes Imagegen; die Backend-Modellkennung ist nicht offengelegt.

GPT-5.6 Sol / medium hat die Referenz, die kleine Gegenüberstellung und die Endform unabhängig tatsächlich angesehen: **kein blockierender Sichtbefund**, Freigabe für die erste technische Produktionsreihe. Die etwas kompaktere Endform bleibt ein gezielter Prüfpunkt der späteren echten Kartenansicht. [Bildreview](2026-09-20-avatar-evolution-art-review.md).

## Grenzen und Weiterarbeit

Das sind **4 von 76** geplanten neuen Motiven. Die übrigen 72, WebP-Ableitungen und Laufzeitmanifest folgen als eigene Bildproduktion. Die klassische Avataransicht bleibt unverändert. Neue Figurenwahl, Stufenkäufe, Datenvertrag, Migration, Backup/Wiederherstellung sowie Offline-/Updateintegration sind noch nicht im Produkt aktiv.

Der neue Drive-Schreibkandidat wird gesondert vorbereitet. Weder Bildprüfung noch Katalogtests belegen dessen reale Exklusivität. Physische iOS-/Zwei-Geräte-Prüfungen bleiben offen.
