# Avatarbilder und Halskorrektur

**Folgebefund vom 20.09.2026:** Der Nutzer meldet falsch sitzende und verdeckte Ausrüstung. Der [erneute Sichtaudit](2026-09-20-avatar-fit-audit.md) bestätigt sechs betroffene Kombinationen. Die unten dokumentierte technische Vollständigkeit und frühere Sichtprüfung sind dafür keine Akzeptanz. Die Korrektur läuft nach dem [Passformplan](../superpowers/plans/2026-09-20-avatar-passform.md).

Stand: 19.09.2026. Teilpaket aus dem [freigegebenen Plan](../superpowers/plans/2026-09-19-avatar-shop.md); die gesamte Avatar-/Shop-Erweiterung ist noch nicht abgeschlossen.

## Bereits im Produkt

Die bestehende Entdeckerfigur verwendet korrigierte freigestellte Hemden. Hals und Unterhemd bleiben in allen sechs Farben sichtbar. Der Bildbau verwendet feste vollständige Leinwände und gemessene Registrierungen anstelle einer wechselnden Kontur-Normalisierung. Die vier Hautfarben und alle vorhandenen Zubehörteile bleiben erhalten. Namen, Pfade, Datenformat, Auswahlbefehle und Bildmanifest-Vertrag sind unverändert.

48 Avatar-WebPs wurden erneuert: insgesamt 958.810 Byte statt 958.388 Byte. Alle sechs Landschaftsdateien sind bytegleich. Produktcache `v20`, synthetischer Updateworker `v21`.

Der Fehler wurde zuerst mit den alten Produktbildern reproduziert: Das gelbe Hemd hatte am Halsanker Alpha 253. Nach der Korrektur sind alle 18 Hemdrenditionen dort transparent; die zwölf Hautrenditionen besitzen weiterhin deckende Halspixel. Unabhängige Review mit GPT-5.6 Sol/high ohne Befunde: 14/14 fokussierte Node-Tests und 5/5 Browserfälle für Hals, Avatar, Offlinefallback und Worker-Update bestanden. Die Vorher-/Nachher-Kompositionen wurden tatsächlich geöffnet.

## Vorbereitete Erweiterung

Die [Rasterquellen](../design/avatar-shop-sources/README.md) enthalten 13 Grundfiguren, vier Hautvarianten je menschlicher Figur, sechs Hemdfarben sowie den vereinbarten Ausrüstungsumfang. Der Katalog unterscheidet freie, über Level freigeschaltete und käufliche Artikel. Ausrüstung wird auf kompatible Körper ausgerichtet; dieselbe Artikel-ID kann körperbezogene Registrierungen haben.

Die neue Bildpipeline erzeugt drei WebP-Größen und ein eigenes Manifest. Sie prüft Quelltransparenz, sichtbare Bildteile nach Registrierung, Herkunftsdateien, Zielkoordinaten, echte Endauflösung und den kleinen Bildsatz. Fehlerhafte oder fehlende Quellen werden nicht als vollständige Katalogbelegung ausgegeben. Das neue Darstellungsmodul schichtet Rücklage, Körper, Hemd und Vorderlage auf derselben Leinwand und fällt bei fehlender großer Datei einmal auf die kleine Variante zurück.

62 zulässige Figur-/Ausrüstungspaare, vollständige Sets und 48 menschliche Haut-/Farbkombinationen wurden als echte Kompositionen geprüft. Dabei wurden unter anderem Halsöffnungen, Hutposition, Halsketten, Sättel, Rüstungen und körperabhängige Koordinaten korrigiert. Die Abdeckung ersetzt keine spätere persönliche visuelle Abnahme.

Die erzeugte [Gesamtvorschau](../design/avatar-shop-preview.png) zeigt alle 13 Figuren mit passender Ausstattung. Die [Mobilaufnahme](avatar-shop-evidence/catalogue-mobile.png) stammt aus einer 320-Pixel-Ansicht mit DPR 2. Die Halskorrektur ist durch [Vorher](avatar-shop-evidence/neck-before.png) und [Nachher](avatar-shop-evidence/neck-after.png) belegt. Das sind Browseraufnahmen der tatsächlichen Bildmodule mit synthetischen Auswahlen. Die neue Figurenübersicht ist eine Prüfansicht, keine bereits verfügbare Shopseite.

Der vollständige Build erzeugt **93 Bildlagen mit 279 WebP-Dateien**: 960.222 Byte für den kleinen Bildsatz und 8.786.364 Byte für alle drei Größen zusammen. Das Budget von 8 MiB gilt für den kleinen Satz; große Varianten werden später bedarfsweise geladen. `complete` und `ready` sind wahr, fehlende/ungültige/falsch zugeordnete Lagen jeweils null. Der [maschinenlesbare Buildbericht](../../trainer/assets/avatar-shop/build-report.json) enthält Quellen-, Metadaten-, Ableitungs- und Ausgabehashes sowie die Einzelgrößen.

## Reviewkorrekturen und Grenzen

Die Pipelineprüfung erfolgte zunächst durch GPT-6 Astra/high und anschließend unabhängig durch GPT-5.6 Sol/high. Behoben wurden leere oder außerhalb der Leinwand liegende Bilder, beschädigte PNGs, ein falscher Skalierungsmaßstab bei abweichender Quellgröße sowie die Verwechslung echter Quelltransparenz mit erst durch Verkleinerung entstehenden transparenten Rändern. Für kanonische Quellen werden nachvollziehbare Sidecars verlangt. Die falschen Fälle wurden gezielt reproduziert und erneut geprüft.

Eine weitere Nachprüfung reproduzierte eine vollflächige, nahezu undurchsichtige Alpha-254-Quelle, die zuvor ebenfalls durchgelassen wurde. Das Mindestkriterium verlangt nun mindestens einen echten Alpha-0-Quellpixel. Der reale Browserencoder weist sowohl Alpha-255- als auch Alpha-254-Rechtecke ab. Die bisherigen Rasterquellen und ausgegebenen Bytegrößen bleiben unverändert.

## Frische Abschlussprüfungen

Nach dieser letzten Pipelinekorrektur und erneutem vollständigem Bildbau:

Die [unabhängige Abschlussnachprüfung](2026-09-19-avatar-shop-task3-review.md) ist ohne offene Befunde im geprüften Bild-/Halsumfang abgeschlossen.

- `npm test`: **372/372 bestanden**, Node.js 22.23.2. Die separaten unveränderten Shop-Probetests gehören nicht zu dieser Zählung; ihre Belege stehen im [ersten Reviewbericht](2026-09-19-avatar-shop-review-1.md).
- `node --test --experimental-test-isolation=none tests/browser/avatar-art.browser.mjs tests/browser/avatar-art-pipeline.browser.mjs tests/browser/avatar-neck.browser.mjs`: **4/4 bestanden** im frischen Edge-Testprofil. Abgedeckt sind vollständiger Katalog bei 320px/DPR2, feste Bildkoordinaten, fehlende große Bildvariante, echte Encoder-Transparenzfälle und alle sechs produktiven Halsöffnungen.
- Die unabhängige Halsprüfung bestand zusätzlich die betroffenen Offline-/Updatefälle; der genaue Umfang steht oben. Diese Läufe werden nicht als zusätzliche vollständige App-Regression ausgegeben.

Für die Gesamtübersicht wartet die Aufnahme nach dem Größenwechsel ausdrücklich auf die Bilddekodierung und vollständiges Zeichnen. Alle 13 Figuren sind in der veröffentlichten Aufnahme sichtbar; eine zunächst unvollständig gezeichnete Aufnahme wurde verworfen.

## Verbleibende Grenzen

Die Grafiken sind stilisierte Illustrationen. Hautvarianten unterscheiden sich geringfügig in der Silhouette; manche Schmucksets sind optisch dicht. Der Pferdeumhang erscheint überwiegend hinter Schweif und Rumpf, da die Körperlage seine Mitte verdeckt. Die Phönixzier ist als breite ornamentale Flügelmanschette gestaltet. Das sind dokumentierte Gestaltungsgrenzen, keine nachgewiesene Freigabe auf einem echten iPhone.

**Figurenwahl, Besitz, Guthaben, Käufe und Datenmigration sind noch nicht produktiv integriert.** Das technische `coverage.ready` des Bildmanifests bezeichnet ausschließlich vollständige gültige Bilddateien. Es bestätigt weder die Kaufkoordination noch den fertigen Shop. Der reale Google-Nachweis fehlt weiterhin; die laufende alte lokale Serverinstanz lieferte für `/shop-probe/` bei der Sichtprüfung „Nicht gefunden“. Der Nutzer wurde um Serverneustart und Anmeldung gebeten.

## Fortsetzung

Die [Übergabe](../handoffs/2026-09-19-avatar-shop.md) nennt den aktuellen Git- und Prüfstand. Nach der echten Google-Probe wird der [bedingte Integrationskandidat](../design/2026-09-19-avatar-shop-integration-kandidat.md) gegen die Ergebnisse geprüft und in einen ausführbaren Daten-/UI-Plan überführt. Eine neue allgemeine Startfreigabe ist nicht nötig. Keine ungeschützte Cloud-Datei oder stillschweigende Änderung des Kosten-/Kontenmodells als Ersatz verwenden.
