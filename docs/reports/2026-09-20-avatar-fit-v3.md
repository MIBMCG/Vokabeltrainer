# Körperbezogene Avatar-Bildkorrekturen: Nachweis v3

Stand: 20.09.2026. Bearbeitung auf `codex/vokabeltrainer-v1`, Originalrevision `24ce5a3`. Die Nutzerfreigabe gilt für die klassische Bildbearbeitung aller Figuren. Die frühere pauschale Passformfreigabe bleibt zurückgenommen.

## Vorgehen und tatsächlicher Umfang

62 kompatible Figur-/Artikelpaare wurden auf der jeweiligen unveränderten Basis beurteilt. Originalillustrationen wurden in passende Vorderflächen und örtlich verdeckte Teile zerlegt, individuell positioniert und mit transparenten Vollcanvas-Bildern ausgegeben. Keine neuen Grundfiguren und keine flächige Übermalung von Fell/Haut. Die Werkzeuge lesen Originalbytes aus der festgelegten Git-Revision; Sidecars und Rezepte nennen die Herkunft.

| Gruppe | Paare | Detailnachweis |
| --- | --- | --- |
| Pferd, Einhorn, Pegasus | 18 | [Equiden](2026-09-20-avatar-fit-equines.md) |
| Tiger, Wolf, Hirsch, Panther | 12 | [Quadrupeden](2026-09-20-avatar-fit-quadrupeds.md) |
| Drache, Kristalldrache, Greif, Phönix | 12 | [Flügelgruppe](2026-09-20-avatar-fit-wings.md) |
| Entdeckerin, Entdecker | 20 | [Menschen](2026-09-20-avatar-fit-humans.md) |

In der unabhängigen Sichtprüfung wurden der Stern vor dem Pferdeauge, ein zunächst zu harter Tiger-Taschenschnitt, Restpixel beim Greif sowie unpassende menschliche Befestigungen ausdrücklich als Nacharbeit geführt. Alle wurden korrigiert und an neu geöffneten Bildern nachgeprüft. Der [unabhängige Reviewbericht](2026-09-20-avatar-fit-v3-review.md) dokumentiert die tatsächlich gesichteten 62 Paare und anschließende Runtime-Stichproben; keine offenen P1/P2-Befunde. Solche Befunde werden nicht durch Datei-Vollständigkeit oder Alpha-Überdeckung geschlossen.

## Gebaute Bilder und Prüfungen

Die [Gesamtvorschau](../design/avatar-fit-v3/runtime/all-13-sets.png) zeigt 13 vollständige Sets aus dem tatsächlichen Renderer und den fertigen WebPs. Daneben liegen 13 Einzelartikelbögen für alle 62 Paare unter [runtime](../design/avatar-fit-v3/runtime/). Alle Bilder waren vor der Aufnahme geladen; [Capture-Nachweis](../design/avatar-fit-v3/runtime/capture.json): 13 Figuren, 62 Paare, keine Lade- oder Seitenfehler. Root öffnete Gesamtvorschau, Pferd und Entdeckerin; der unabhängige Prüfer zusätzlich den Sturmgreif.

- Gemeinsamer Bild-Build: **115 Ebenen, 345 WebPs** in 256/512/768 Pixel Breite; keine fehlenden, falsch registrierten oder ungültigen Quellen.
- [Paketprüfung](avatar-fit-v3-package-check.json): alle Quell- und Ausgabedatei-Prüfsummen stimmen; **31 Basis-/Kleidungsquellen bytegleich** zur Originalrevision. Neun obsolete Umhang-WebPs entfernt, keine verwaisten WebPs.
- Kleinste Varianten zusammen: **947.568 Bytes**; alle drei Größen zusammen: **8.529.122 Bytes**.
- `npm test`: **372/372** bestanden.
- Drei Avatar-Browserdateien: **5/5** bestanden, einschließlich aller 62 Paare, menschlicher Farben, fester Bildkoordinaten, Bild-Fallback und unverdecktem Produkthals.
- `npm run check:docs` und `git diff --check`: bestanden.

Eine ältere Prüfung verlangte pauschal 2,5 Prozent überdeckte Körperfläche. Der kleinere Wolf-Verschluss unterschritt diesen Wert, obwohl er sichtbar befestigt ist. Der Test prüft jetzt feste Hals-/Schulterregionen mit einer Negativkontrolle: Werden alle Umhangteile absichtlich hinter die Basis gezeichnet, verschwindet dort die Befestigung. Bei korrekter Reihenfolge bleibt sie sichtbar. Die Bilder wurden dafür nicht vergrößert oder verändert. Auch diese gezielte Prüfung bleibt ein Schichtungsnachweis, kein ästhetisches Urteil.

## Reproduzieren

Die Entwicklungswerkzeuge liegen unter [scripts/avatar-fit](../../scripts/avatar-fit/). Python mit Pillow/NumPy wird nur für die Bildproduktion gebraucht; die gruppenspezifischen Befehle stehen in den Detailberichten. Anschließend erzeugt `node scripts/build-avatar-art.mjs` aus den kanonischen Quellen die gemeinsamen WebP-Varianten und das Manifest. `python scripts/avatar-fit/verify-package.py` prüft die zusammengeführten Dateien. `node scripts/capture-avatar-fit.mjs` erzeugt die Runtime-Bögen über einen eigenen lokalen Testserver. Für diese beiden Browserwerkzeuge gelten die optionalen Variablen `PLAYWRIGHT_MODULE` und `BROWSER_EXECUTABLE` aus dem [Browser-Prüfleitfaden](../../tests/browser/README.md).

## Grenzen

Der Bildumfang ist Teil der vorbereiteten Avatar-Erweiterung. Neue Figurenwahl und Käufe sind weiterhin nicht im Produkt aktiviert. Der echte [Drive-v2-Bericht](2026-09-20-shop-v2-reallauf.md) belegt eine lesbare Kennung, aber keinen sicheren Kaufvertrag. Physische iOS-/iPadOS- und Zwei-Geräte-Prüfungen sowie die persönliche visuelle Abnahme bleiben offen.

Implementierungsagenten für Menschen, Quadrupeden und Flügelgruppe sowie unabhängiger Prüfer: jeweils **GPT-5.6 Sol, hohe Denktiefe**. Root bearbeitet Equiden, Zusammenführung, Diagnose, Prüfungen und Übergabe.
