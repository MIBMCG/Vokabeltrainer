# Rasterquellen für Figuren und Ausrüstung

Diese Quellen gehören zum [freigegebenen Avatar-Shop-Entwurf](../../superpowers/specs/2026-09-19-avatar-shop-design.md). Sie wurden mit dem eingebauten Bildwerkzeug erzeugt; bestehende menschliche Ausgangsbilder und sechs alte Ausrüstungen stammen aus [art-sources](../art-sources/prompts.md). Die zugehörigen JSON-Dateien halten Prompts, Bildreferenzen, feste Registrierungen und die jeweilige Sichtprüfung fest. Es werden keine Fotos oder persönlichen Lerninhalte verwendet.

## Ableitung und Koordinaten

`node scripts/build-avatar-art.mjs` erzeugt WebP-Bilder und `src/trainer/avatar/art-manifest.js`. Erforderlich sind Playwright und ein Chromium-Browser; `PLAYWRIGHT_MODULE` und `BROWSER_EXECUTABLE` können auf eine vorhandene Installation verweisen. Diese Variablen gehören zur lokalen Werkzeugkonfiguration und sind keine Voraussetzung für die App-Nutzung.

Jede Figur besitzt eine feste transparente Leinwand. Eine optionale Registrierung bezieht sich auf die gesamte PNG-Quelle: `Ziel = Quelle × scale + (x,y)`. Ein optionales `canvas` bezeichnet die unveränderliche Zielleinwand. Es gibt keine automatische Kontur-Normalisierung einzelner Kleidungsstücke. Quellen dürfen minimal andere Pixelmaße haben, wenn die Registrierung auf der Zielkomposition tatsächlich geprüft wurde.

Die Varianten 256/512/768 Pixel werden nur ohne effektive Hochskalierung erzeugt. Alle Bildlagen behalten dieselben Anker. Der kleine Bildsatz hat ein Budget von 8 MiB; der Buildbericht nennt tatsächliche Bytes, SHA-256-Werte, fehlende Belegungen und ungültige Quellen. Eine vollständige Dateiabdeckung beweist keine korrekte Kauf- oder Speicherfunktion.

Das Cutout-Mindestkriterium wird vor jeder Registrierung auf der dekodierten Quelle geprüft: mindestens ein vollständig transparenter Pixel (Alpha 0). Bloßes Verkleinern auf eine größere transparente Leinwand oder eine gleichmäßig fast deckende Alpha-254-Fläche genügt nicht. Sichtbare Pixel müssen außerdem nach der Registrierung innerhalb der Zielleinwand verbleiben. Die anschließende Sichtprüfung kontrolliert die tatsächlichen Konturen und die Passform.

## Dateinamen

- Tiere: `<figureId>.png`.
- Menschen: `<figureId>-skin-0..3.png` und `<figureId>-clothing-0..5.png`.
- Ausrüstung: `<figureId>-<itemId>-rear.png` oder `-front.png`.
- Gleicher Gegenstand auf verschiedenen Körpern: dieselbe Artikel-ID, eigene körperbezogene Quelle/Registrierung.
- `*-cropped-draft.png` und `*-margin.png` sind nachvollziehbare Vorstufen; der Build ignoriert sie. Nur der kanonische Name wird ausgeliefert.

## Sichtprüfung und Grenzen

Die Kontaktbögen prüfen echte Kompositionen mit sichtbarem Hals, freien Augen und passend befestigter Ausrüstung. Die menschlichen Hautvarianten unterscheiden sich durch die Bildgenerierung geringfügig in der Silhouette; feste Registrierungen gleichen die Kleidungslage an. Leuchtsäume gehören zum illustrierten Stil. Eine schwarze oder farbige Werkzeugvorschau allein beweist keinen deckenden Hintergrund: maßgeblich sind tatsächliche Alphawerte und die Komposition.

Die neue Figurenwahl und Käufe benötigen noch die versionierte Produktintegration. Die vorhandene Entdeckerfigur kann die korrigierten Bilder unabhängig davon verwenden. Aktuelle Umsetzung, Prüfstände und noch offene Google-/Gerätebelege stehen in der [Übergabe](../../handoffs/2026-09-19-avatar-shop.md).
