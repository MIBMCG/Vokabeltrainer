# Übergabe: körperbezogene Bildkorrekturen und Shop-Diagnose 4

Stand: 20.09.2026. Branch `codex/vokabeltrainer-v1`, Ausgangscommit `24ce5a38b561c6012d7307603fc378ca339ab58c`. Im bestehenden isolierten Checkout gearbeitet; `main` blieb unverändert. Die Paket-SHA ergibt sich aus der Git-Historie. Vor einer Fortsetzung lokalen und Remote-Stand frisch prüfen.

## Auftrag und Freigaben

Die wiederholte Kritik an überstehenden Umhängen, vollständigen Ringöffnungen und unpassender Ausrüstung gilt weiterhin als Ausgangsbefund. Der Nutzer hat klassische Bildbearbeitung ausdrücklich erlaubt: „Ja, du darfst die Bildbearbeitung dafür verwenden“. Diese Methodenfreigabe nicht nochmals einholen. [Ausführungsplan](../superpowers/plans/2026-09-20-avatar-fit-v3.md). Alle 13 Figuren und 62 kompatiblen Artikelpaare gehören zum Umfang. Keine neuen Katalogartikel, Preise, Konten oder Anbieter.

## Bildstand

Die Originale aus `24ce5a3` bleiben über Git erhalten. Vier reproduzierbare Entwicklungswerkzeuge unter `scripts/avatar-fit/` bearbeiten vorhandene gemalte Rasterteile, Masken und Anker; die Grundfiguren bleiben erhalten. Quelle, Bearbeitungsrezept und WebP-Ableitung sind getrennt dokumentiert. Die klassische Bearbeitung benötigt nur auf dem Entwicklungsrechner Python, Pillow und NumPy; die App erhält keine neue Abhängigkeit.

- [Pferd, Einhorn, Pegasus](../reports/2026-09-20-avatar-fit-equines.md): individuelle schmale Vorderbänder, kürzere angeschlossene Umhänge, Mähnenverdeckung, ein sichtbarer Sattelbügel und freie Pferdeaugen.
- [Tiger, Wolf, Hirsch, Panther](../reports/2026-09-20-avatar-fit-quadrupeds.md): individuelle Beinzier, Hals-/Fellverdeckung und körperbezogenes Geschirr.
- [Drachen, Greif, Phönix](../reports/2026-09-20-avatar-fit-wings.md): örtliche Verdeckung durch Schuppen, Vorderläufe, Membranen und Federn.
- [Entdeckerin und Entdecker](../reports/2026-09-20-avatar-fit-humans.md): gemalte Rucksackriemen, verkleinerte Handgegenstände an Schlaufe/Ring, kürzerer Sternenumhang und freier innerer Halsrand. Vier Hauttöne und sechs Kleidungsfarben erhalten.

Quellen und gemeinsame Bildableitung sind abgeschlossen: **115 Ebenen, 345 WebPs**, alle 31 Basis-/Kleidungsquellen bytegleich. [Gesamtbericht](../reports/2026-09-20-avatar-fit-v3.md), [aktuelle Runtime-Vorschau](../design/avatar-fit-v3/runtime/all-13-sets.png) und [unabhängige Review](../reports/2026-09-20-avatar-fit-v3-review.md) trennen technische Nachweise und Sichtprüfung. Alle 62 Einzelpaare wurden geöffnet; konkrete Restfehler sind nachgeprüft. Keine offene P1/P2 in den intern geprüften Bildern.

Frisch bestanden: **372/372 allgemeine Node-Tests, 5/5 Avatar-Browserfälle**, vollständiger Bild-Build, Quell-/WebP-Prüfsummen, Dokumentations- und Diff-Prüfung. Browseraufnahmen aus den erzeugten WebPs: 13 Sets und 62 Paare, keine Seiten-/Ladefehler. Der pauschale Körperflächen-Test wurde durch feste Befestigungsregionen mit einer absichtlich falschen Ebenenfolge als Negativkontrolle ersetzt; die Bilder wurden dafür nicht geändert.

Persönliche Nutzerabnahme und reale iOS-Ansichten bleiben offen. Ein grüner Techniktest beweist keine ästhetische Passform. Die alten pauschalen Passformurteile bleiben zurückgenommen. Die neue Figurenwahl und der Punkteshop sind noch nicht in der Produktoberfläche aktiviert.

## Neue echte Google-Ergebnisse

Der Nutzer lieferte zunächst erneut einen Medienlauf und anschließend `shop-probe-bericht_v2.json` mit dem tatsächlich gewählten v2-JSON-Kandidaten. [Auswertung und bereinigte Belege](../reports/2026-09-20-shop-v2-reallauf.md): starke Versionskennung jetzt lesbar, **5 Fälle bestanden, 6 fehlgeschlagen, 0 unsupported**. Drei Fälle brechen schon beim Einlesen der frisch erzeugten Datei ab; bei Initialisierung, zwei Käufen und verworfener Antwort meldete Version 3 lediglich `assertion`. Daraus keine bestimmte Google-Schreibgarantie oder -Fehlwirkung ableiten.

Die neue **Diagnoseversion 4** schließt nur diese Informationslücke: konkrete Prüfstelle, maximal zwei klassifizierte Antworten und begrenzte Anzahlen angenommener/abgewiesener Schreibversuche. HTTP-Wege, Versionsklammer, Dateibindung, `If-Match` und alle Sperren bleiben unverändert. Keine Kontoänderung, kein alternativer Cloudanbieter, kein Produktkauf und kein automatischer Wiederholungsversuch.

Frisch bestanden: **29/29 Probe-/Server-Node-Tests und 6/6 isolierte Browserfälle**. Drei neue Node-Fälle waren vor Implementierung gezielt rot. [Unabhängige Codeprüfung](../reports/2026-09-20-shop-v4-review.md) ohne P1/P2. Die Browserfälle verwenden eine synthetische Google-Grenze; tatsächliche Google-Ergebnisse zu Diagnoseversion 4 stehen noch aus.

## Nächster konkreter Schritt

Bei der nächsten echten Shop-Probe unter `/shop-probe/` zuerst „Diagnoseversion 4“ kontrollieren. Dieselbe dritte Auswahl „Versionskennung aus Dateidaten (Drive v2)“ verwenden und `shop-probe-bericht4.json` auswerten. Keine weitere identische Diagnoseversion-3-Probe anfordern. Danach anhand der konkreten Fehlerstelle den Kaufvertrag weiter prüfen; nie Sperren lockern, um ein grünes Ergebnis zu erhalten.

## Start auf einem anderen Rechner

Branch `codex/vokabeltrainer-v1` frisch klonen, Node.js ab 22.8 verwenden, `npm start` ausführen. Trainer: `http://localhost:4173/trainer/`, synthetische Shop-Probe: `http://localhost:4173/shop-probe/`. Git überträgt Code, Bildquellen und Dokumentation, keine Browserdaten oder Google-Sitzungen. Vorhandene Lernstände nicht löschen oder in Tests übernehmen. Produktcache und bestehende Produktoberfläche bleiben von diesem isolierten Shop-Paket getrennt.
