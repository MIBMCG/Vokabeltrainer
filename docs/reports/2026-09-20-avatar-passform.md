# Korrektur der Avatar-Ausrüstung

Stand: 20.09.2026. Die Nutzerkritik an falsch sitzender und verdeckter Ausrüstung wurde an sechs Kombinationen nachvollzogen und korrigiert. Der [ursprüngliche Sichtaudit](2026-09-20-avatar-fit-audit.md) berichtigt die zu großzügige Passformbewertung vom Vortag. [Aktuelle Vorschau der sechs Sets](../design/2026-09-20-avatar-passform.png), [Gesamtvorschau aller 13 Figuren](../design/avatar-shop-preview.png).

## Ursache und Änderung

Bei fünf Umhangkombinationen lag der gesamte Gegenstand hinter der ganzen Figur. Dadurch verschwanden auch Kragen und Schließen. Erhalten blieben einzelne Säume ohne erkennbare Befestigung. Beim Tiger passten die Abstände der vier Pfotenreifen nicht zu den Beinen. Technisch vollständige und transparente Dateien waren deshalb kein ausreichender Passformnachweis.

| Kombination | Korrektur und Sichtbefund |
| --- | --- |
| Pferd, Mond-Einhorn und Sternen-Pegasus mit Mond-Umhang | Jede Figur hat eine eigene vordere Lage mit Halsjoch, Brustschließe und Flankenstoff. Die bisherige Rücklage bleibt erhalten. Beim Pegasus verlaufen die Stoffteile unter den Flügelansätzen; Gesicht, Flügel und Hufe bleiben frei. |
| Polarlichtwolf mit Nordlicht-Umhang | Sichtbarer Kragen und Schulteranschluss verbinden den hinteren Stoff mit der Figur. Die neue Vorderlage bleibt kompakt; Gesicht und Pfoten bleiben frei. |
| Nebelhirsch mit Runenumhang | Neues Blattjoch mit mittiger Schließe. Die Hinterlage wird insgesamt mit `scale 0.85, x 130, y 70` registriert: So verschwindet ihre alte zweite Schließe hinter dem Hals, und die Säume bleiben innerhalb der Leinwand. |
| Tiger mit goldenen Pfotenreifen | Vier körperbezogene Ringe ersetzen die falsch angeordneten Reifen. Alle vier kreuzen den zugehörigen Lauf. Zwischenstände mit einem seitlich abstehenden Vorderreifen wurden verworfen. |

Die fünf Vorderlagen und die neue Tigerquelle wurden mit dem eingebauten Bildwerkzeug erzeugt. Prompts, Referenzen, Prüfsummen und Registrierungen stehen in den [PNG-/JSON-Quelldateien](../design/avatar-shop-sources/README.md); öffentliche Sichtbelege sind von den betroffenen Sidecars aus referenziert. Die Hirsch-Rücklage benötigte nur eine Gesamtregistrierung, kein neues Bild. Alle 13 Grundfiguren blieben bytegleich. Katalog, Preise, Level und Lernregeln wurden nicht geändert.

## Verifikation

Der neue Browserfall `animal cloaks remain visibly worn over the body instead of disappearing behind it` wurde zuerst gegen die alten Bilder fehlgeschlagen ausgeführt: Bei allen fünf Umhängen waren null deckende Körperpixel sichtbar durch Stoff oder Befestigung verändert. [Vorherbild](../design/2026-09-20-avatar-umhaenge-vorher.png), [Vorhermessung](avatar-fit-evidence/2026-09-20-before.json).

Nach dem tatsächlichen WebP-Bau besteht der Fall. Die [Nachhermessung](avatar-fit-evidence/2026-09-20-after.json) ergibt 48,53 % beim Pferd, 43,76 % beim Einhorn, 20,30 % beim Pegasus, 3,26 % beim Wolf und 6,72 % beim Hirsch. Das Mindestkriterium von 2,5 % erkennt den früheren vollständigen Verdeckungsfehler. Es bewertet weder Anatomie noch Ästhetik; hierfür wurden die großen Source-Kompositionen, 320-Pixel-Ansichten und tatsächlichen Runtime-Vollsets angesehen und [unabhängig nachgeprüft](2026-09-20-avatar-passform-review.md).

Frisch ausgeführt:

- `node scripts/build-avatar-art.mjs`: 98 Bildlagen, 294 WebP-Dateien, keine fehlenden, ungültigen oder falsch zugeordneten Quellen. Kleine Bilder zusammen 1.005.120 Byte bei 8-MiB-Budget; alle Größen 9.184.038 Byte.
- `npm test`: **372/372 bestanden**.
- `node --test --experimental-test-isolation=none tests/browser/avatar-art.browser.mjs tests/browser/avatar-art-pipeline.browser.mjs tests/browser/avatar-neck.browser.mjs`: **5/5 bestanden**. Enthalten sind der Verdeckungsschutz, alle 13 Figuren / 62 kompatiblen Paare / 48 menschlichen Farbkombinationen bei mobiler Breite, Rückfall bei fehlender großer Bilddatei, Transparenzprüfung und die bestehende Halskorrektur.
- Lokale Vollset-Kompositionen und die neue Gesamtvorschau wurden nach dem Laden aller Bildlagen geöffnet. Die veröffentlichte Sechseransicht verwendet den tatsächlichen Renderer und dessen WebP-Bilder.

Umsetzung der getrennten Bildgruppen und unabhängige Sichtprüfung: GPT-5.6 Sol mit hoher Denktiefe. Root verantwortete Gesamtbau, Regression, Integration der Nachweise und Git. Keine zusätzliche API oder kostenpflichtige Cloud wurde eingesetzt.

## Grenzen und Fortsetzung

Die Korrektur betrifft die vorbereiteten Bilder der neuen Figurenwelt. Neue Figurenwahl, Besitzverwaltung und Punkteshop sind weiterhin nicht in der Produktoberfläche aktiviert. Die bisherigen Produktbilder und der Produktcache v20 bleiben unverändert; die neuen Avatar-Shop-Bilder werden noch nicht vom Produktworker verwendet. Ein Neuladen der bisherigen Traineransicht zeigt deshalb noch keine neue Figurenwahl.

Die [echte Google-Kaufprobe](2026-09-20-shop-diagnose.md) ist weiterhin nicht bestanden. Der nächste technische Eingang ist ein Bericht aus Diagnoseversion 2. Persönliche visuelle Abnahme, echte iPhone-/iPad- und Zwei-Geräte-Prüfungen bleiben offen. Die automatisierten und unabhängigen Prüfungen ersetzen sie nicht. [Korrekturplan](../superpowers/plans/2026-09-20-avatar-passform.md), [Übergabe](../handoffs/2026-09-19-avatar-shop.md).
