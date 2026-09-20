### Spec Compliance

- ✅ Pass: Der Katalog enthält für alle 13 bestehenden Figuren genau vier Formen mit den Preisen 0 / 200 / 400 / 800. Die 52 Formkennungen sind eindeutig; die zwei menschlichen Figuren erhalten je vier kostenlose Hautvarianten, sodass genau 76 eindeutige Bildkennungen entstehen (`src/trainer/avatar/evolution.js:33`).
- ✅ Pass: `evolutionFormId()` bindet Besitz ausschließlich an Figur und Stufe. `evolutionAssetKey()` variiert bei Menschen nur das Bild nach Hautton und akzeptiert bei nichtmenschlichen Figuren ausschließlich Hautwert 0; ein Hautton erzeugt damit keine eigene Kaufkennung (`src/trainer/avatar/evolution.js:19`, `src/trainer/avatar/evolution.js:25`).
- ✅ Pass: `evolutionOffer()` bietet aus Stufe 1–3 ausschließlich die unmittelbar folgende Stufe an, verwendet deren Einzelpreis, begrenzt den Fortschritt auf 1 und gibt für gesperrte Grundfiguren beziehungsweise Stufe 4 kein Kaufangebot zurück (`src/trainer/avatar/evolution.js:45`).
- ✅ Pass: Unbekannte Figuren sowie ungültige, gebrochene, unsichere oder außerhalb des Bereichs liegende Zahlen werden mit `TypeError` abgewiesen. Die Vorschaufunktion verändert ihre Eingabe nicht und enthält weder Abbuchung noch Besitz- oder Netzwerkautorisierung (`src/trainer/avatar/evolution.js:7`, `src/trainer/avatar/evolution.js:13`).
- ✅ Pass: Das neue Modul wird außerhalb seines eigenen Tests von keiner Produkt-, UI-, Service-Worker-, Synchronisations- oder Kaufdatei importiert. Es aktiviert daher keine neue Produktoberfläche und vergibt keine Rechte.

### Code Quality

- ✅ Approved: Das Modul ist klein und rein, verwendet den bestehenden Figurenkatalog als einzige Figurenquelle und trennt stabile Formkennungen sauber von hauttonabhängigen Bildkennungen.
- ✅ Approved: `EVOLUTION_FORMS`, jeder Formeintrag und jede `assetKeys`-Liste sind eingefroren. Die privaten Preiswerte sind ebenfalls eingefroren; Aufrufer können den Katalog nicht nachträglich verändern.
- ✅ Approved: Die Tests decken Mengen und Eindeutigkeit, beide menschlichen Variantenregeln über den generierten Katalog, Preisgrenzen, nächste Stufe, gesperrte/abgeschlossene Zustände, hohe Guthaben, Eingabeunverändertheit und ungültige Werte ab. Bestehende Grundfreischaltungen werden zusätzlich festgehalten.

### Findings

#### Critical (Must Fix)

- Keine.

#### Important (Should Fix)

- Keine.

#### Minor (Nice to Have)

- Keine.

### Checks

- Task-Brief, technischer Entwurf, Task-Bericht und vollständiges Reviewpaket gelesen; die tatsächlichen neuen Dateien stimmen mit dem Reviewpaket überein.
- Implementer-Nachweise gelesen: fokussiert 7/7, historischer Katalog 12/12 und Gesamtsuite 379/379 bestanden; diese Läufe gemäß Reviewauftrag nicht wiederholt.
- Unabhängig per Quellensuche bestätigt, dass `evolution.js` ausschließlich von `tests/trainer/avatar-evolution.test.js` importiert wird.
- `git diff --check` war bei der unabhängigen Sichtung ohne Ausgabe. Bereits vorhandene Dokumentations- und Bildquellenänderungen wurden nicht verändert und gehören nicht zum geprüften Task-1-Codepaket.

### Assessment

**Spec verdict:** Pass

**Code-quality verdict:** Approved

**Reasoning:** Task 1 setzt den bestätigten reinen Katalogvertrag vollständig und ohne Produktaktivierung um. Die Trennung von Formbesitz und kostenlosen menschlichen Bildvarianten ist korrekt, die Angebotsfunktion bleibt reine Darstellung und alle festgestellten Eingabe- und Unveränderlichkeitsgrenzen sind angemessen abgedeckt.
