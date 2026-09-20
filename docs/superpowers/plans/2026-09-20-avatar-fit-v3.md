# Ausführung: klassische Passformkorrektur aller Ausrüstungen

Stand: 20.09.2026. Der Nutzer hat die klassische Bildbearbeitung ausdrücklich freigegeben: „Ja, du darfst die Bildbearbeitung dafür verwenden“. Der [körperbezogene Ansatz](../../design/2026-09-20-avatar-passform-v2.md) wird jetzt ausgeführt. Umfang sind alle 62 kompatiblen Paare, mit konkreten Korrekturen anhand des [Zweitaudits](../../reports/2026-09-20-avatar-fit-second-audit.md).

## Grenzen und gemeinsame Schnittstelle

Grundfiguren, Haut-/Kleidungsfarben, Artikel-IDs, Preise und Lernregeln bleiben erhalten. Vorhandene Rasterquellen werden klassisch transformiert und maskiert. Keine neue Generierungsserie. Originale bleiben in Commit `24ce5a3` reproduzierbar; Bearbeitungsskripte lesen dort die ursprünglichen Bytes. Fertige PNGs und Provenienz-Sidecars bilden weiter die Schnittstelle zum vorhandenen WebP-Bau. Keine Live-Google-Aufrufe durch Agenten.

Jede Gruppe bearbeitet nur ihre eigenen Quellen und ihr eigenes Skript. Root baut das gemeinsame Manifest und die WebPs erst nach dem Abschluss aller Quelländerungen. Der aktuelle Produkttrainer verwendet die neuen Figurenbilder noch nicht; Produktcache und Lernstände bleiben in diesem Paket unverändert.

## Aufgaben

1. Pferd, Einhorn und Pegasus: 18 Einzelpaare. Reifen als sichtbare Vorderbänder an eigenen Laufankern; Umhang anschließen und überstehende Spitzen korrigieren; Sattel, Kopf- und Schweifschmuck prüfen. Root.
2. Tiger, Wolf, Panther und Hirsch: 12 Einzelpaare. Alle Bein-/Pfotenverdeckungen sowie Hals-/Körperanschlüsse korrigieren. Aufgabenagent GPT-5.6 Sol/high.
3. Entdeckerin und Entdecker: 20 Einzelpaare. Umhanganschlüsse, gehaltene Requisiten, Rucksack und Kopfbedeckungen; menschliche Varianten erhalten. Aufgabenagent GPT-5.6 Sol/high.
4. Drache, Kristalldrache, Greif und Phönix: 12 Einzelpaare. Brust-/Halsanschlüsse und körperbezogene Flügelzier. Aufgabenagent GPT-5.6 Sol/high.
5. Gemeinsamer Bau, tatsächliche Browserkompositionen und unabhängige Sichtprüfung. Korrekturen konkreter Restbefunde, frische Tests, Dokumentation, Commit/Push und Remote-Abgleich. Root und unabhängige Review.

## Nachweise

Die Ausgangsbilder dokumentieren den Fehler bereits. Bearbeitungsrezepte müssen die ursprünglichen Quellprüfsummen und jeden Eingriff nachvollziehbar machen. Gegenüberstellungen zeigen große Befestigungsdetails sowie 256-Pixel-Karten. Keine rein numerische Alphaüberdeckung als Passformnachweis. Alle 62 Einzelpaare und vollständige Sets prüfen; Basen müssen bytegleich bleiben.

Nach Quellabschluss: `node scripts/build-avatar-art.mjs`, `npm test`, die drei gezielten Avatar-Browserdateien und `npm run check:docs`. Technische Vollständigkeit, interne Sichtprüfung und persönliche Nutzerabnahme bleiben verschiedene Aussagen. Der neue Google-Bericht wird separat ausgewertet; daraus folgt keine automatische Shopfreigabe.
