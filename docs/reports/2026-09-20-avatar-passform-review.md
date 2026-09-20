# Unabhängige Nachprüfung der Avatar-Passform

**Urteil zurückgenommen:** Die erneute Nutzerkritik und der [unabhängige Zweitaudit](2026-09-20-avatar-fit-second-audit.md) widerlegen die nachfolgende positive Passformbewertung. Insbesondere verdecken die vollständigen Ringbilder die Beine, statt sie räumlich zu umgreifen. Die frühere Review war zu großzügig; sie ist keine gültige visuelle Freigabe des aktuellen Bildstands.

Stand: 20.09.2026

## Ergebnis

Die sechs beanstandeten Ausrüstungskombinationen sind im tatsächlich gebauten WebP-Laufzeitstand visuell korrigiert. In den großen Gesamtansichten und den sechs mobilen Einzelkarten ist **kein offener Passformbefund** verblieben. Die Übersicht aller 13 Figuren zeigt außerdem keine sichtbare Verschlechterung der übrigen Figuren.

Der [Hauptbericht](2026-09-20-avatar-passform.md) beschreibt Ursache, Umsetzung und Gesamtprüfung. Öffentliche Bildbelege sind die [sechs korrigierten Sets](../design/2026-09-20-avatar-passform.png) und die [Übersicht aller 13 Figuren](../design/avatar-shop-preview.png).

## Prüfung der sechs Korrekturen

| Figur und Set | Unabhängiger Laufzeitbefund |
| --- | --- |
| Pferd · Mond-Umhang | Halsjoch und Brustschließe liegen sichtbar auf der Figur. Vorder- und Hinterstoff bilden eine zusammenhängende Drapierung; Gesicht, Beine und Hufe bleiben frei. |
| Mond-Einhorn · Mond-Umhang | Das Joch sitzt unter Mähne und Horn, die Schließe ist klar mit dem Stoff verbunden. Die Rücken- und Flankenlage geht ohne losen Zipfel in die Schleppe über. |
| Sternen-Pegasus · Mond-Umhang | Joch und Schließe liegen unterhalb der Flügelwurzeln. Beide Flügelsilhouetten und alle sichtbaren Federspitzen bleiben frei; Vorder- und Hinterlage schließen an der Flanke an. |
| Polarlichtwolf · Polarlichtumhang | Das kompakte Hals-/Schulterjoch macht den zuvor fast vollständig verdeckten Umhang als getragenes Kleidungsstück lesbar. Es ist genau eine zusammenhängende Schließe sichtbar; Stoff und Säume wirken weder lose noch abgeschnitten. |
| Nebelhirsch · Runenumhang | Nur das neue mittige Joch mit einer Schließe ist sichtbar. Das frühere zweite Joch links am Kopf bleibt verdeckt; die Rückendrapierung beginnt hinter der Schulter und endet innerhalb der Leinwand. |
| Tiger · Pfotenreifen | Vier Reifen sitzen jeweils um einen eigenen Lauf. Insbesondere der früher seitlich abstehende zweite Vorderreifen kreuzt jetzt die Laufmitte; auch beide Hinterreifen folgen den unterschiedlichen Laufwinkeln. Keine Pfote und kein Nachbarlauf wird sichtbar angeschnitten. |

Die mobile Darstellung bestätigt dieselben Befunde. Schließen, Joche und Reifen bleiben bei Kartenbreite erkennbar; kein korrigierter Gegenstand zerfällt in scheinbar schwebende Einzelteile.

## Struktur- und Build-Nachweis

Die Laufzeitmessung verändert durch die fünf Umhänge 48,53 % (Pferd), 43,76 % (Einhorn), 20,30 % (Pegasus), 3,26 % (Wolf) und 6,72 % (Hirsch) der nahezu deckenden Körperpixel. Alle Werte liegen über dem bewusst kleinen Grenzwert von 2,5 %. Der Test verhindert damit zuverlässig die frühere reine Hinterlage, ist aber kein Ästhetiktest; die Passform wurde deshalb zusätzlich an den gerenderten Bildern beurteilt.

Der [Build-Bericht](../../trainer/assets/avatar-shop/build-report.json) weist 98 Lagen und daraus 294 WebP-Dateien aus. `missing`, `misaligned` und `invalid` sind leer; die kleinen Varianten belegen 1.005.120 Byte bei einem Budget von 8.388.608 Byte. Im zugehörigen Abschlusslauf waren 372 Node-Tests und fünf gezielte Browsertests grün. Diese unabhängige Nachprüfung hat die vollständige Testsuite auftragsgemäß nicht erneut ausgeführt, sondern den Build-Bericht, die Laufzeitmessung und die gerenderten WebP-Ansichten geprüft.

## Kontrolle der übrigen Figuren

Die 13er-Laufzeitübersicht zeigt alle Figuren vollständig und innerhalb ihrer Karten. Bei Entdeckerin, Entdecker, einfachem Drachen, Schattenpanther, Sturmgreif, Kristalldrachen und Phönix sind keine neu fehlenden, versetzten oder abgeschnittenen Ausrüstungsteile erkennbar. Auch der dort gezeigte Sternen-Pegasus bleibt vollständig; der separat korrigierte Mond-Pegasus ist im Sechserbeleg vollständig. Die bereits bekannte hohe Detaildichte einzelner Fantasie-Sets ist keine durch diese Korrektur entstandene Verschlechterung.

## Grenze

Die Review belegt die Rasterpassform der geprüften WebP-Laufzeitkompositionen in Desktop- und mobiler Browsergröße. Eine persönliche Abnahme auf echtem iPhone oder iPad bleibt offen. Ebenso sind Shopbedienung, Freischaltung, Kauf, Speicherung und Synchronisation nicht Gegenstand dieser Bildprüfung.
