# Unabhängige Sichtprüfung: Passform der Avatar-Ausrüstung

Stand: 20.09.2026
Geprüfter Produktstand: `76c4307` auf `codex/vokabeltrainer-v1`
Modell: GPT-5.6 Sol/high
Umfang: visuelle Diagnose, keine Änderung an Produktcode, Katalog, Pipeline oder Bildquellen

Die folgenden Befunde beschreiben den Ausgangsstand. Ihre Korrektur ist im [Passformbericht](2026-09-20-avatar-passform.md) und der [unabhängigen Nachprüfung](2026-09-20-avatar-passform-review.md) dokumentiert.

## Urteil

Die bisherige Aussage, alle 13 Set-Kompositionen und 62 zulässigen Paare seien visuell passend, ist nicht haltbar. Die Dateien sind technisch vollständig und transparent, aber mindestens fünf der 13 Vorschau-Sets enthalten einen sichtbaren Passformfehler. Vier davon beruhen auf demselben Schichtproblem: Ein vollständiger Umhang einschließlich Kragen oder Schließe wird ausschließlich hinter der ganzen Figur gezeichnet. Dadurch verschwindet der tragende vordere Teil und es bleiben Stoffstücke ohne sichtbare Verbindung zur Figur. Beim Tiger sind zwei von vier Pfotenreifen räumlich von den Hinterpfoten getrennt.

Die im Bericht vom 19.09.2026 als Gestaltungsgrenze bezeichnete starke Verdeckung der Pferdeumhänge ist mit dem aktuellen Nutzerbefund ausdrücklich **nicht akzeptiert**. Ebenso werden die `qa.status`-Angaben `accepted-for-current-base` in den Sidecars hier nicht als Abnahme übernommen.

Die kleinste korrekte Reparatur ist begrenzt: die betroffenen Umhänge körperbezogen in Rück- und Vorderlage teilen und genau den Tiger-Pfotenlayer korrigieren. Eine globale Änderung der Ebenenreihenfolge oder eine automatische Kontur-/Boundingbox-Normalisierung würde funktionierende Figuren beschädigen.

## Gesehene Belege und Methode

Tatsächlich geöffnet wurden:

- `docs/design/avatar-shop-preview.png` und `test-results/avatar-art/catalogue-overview.png`,
- die 13 dort verwendeten Set-Kompositionen über die vollständigen Einzelbelege in `test-results/avatar-art/dragon-wolf-fit/`, `.superpowers/avatar-shop-equine-qa/screens/` und `.superpowers/sdd/2026-09-19-avatar-shop/mystic-gear-evidence/`,
- die Einzelansichten in `test-results/avatar-art/animal-gear.png` und `human-gear.png`,
- die problematischen PNG-Quellen sowie ihre JSON-Sidecars.

Die Vorschauauswahl wurde aus `tests/browser/avatar-art.browser.mjs` nachvollzogen: Menschen erhalten das Runen-Set plus Ritterrüstung, Pferd und Einhorn das Mond-Set, Pegasus das Sternen-Set, die übrigen Tiere ihr einziges kompatibles Set. Die Komposition verwendet den echten Renderer `src/trainer/avatar/art.js`.

Zusätzlich wurde für jeden reinen Rücklagen-Umhang bei Alphawert größer 16 gemessen, welcher Anteil seiner sichtbaren Quellpixel von der deckenden Basisfigur überlagert wird. Das ist kein ästhetischer Grenzwert, belegt aber die Ursache der extremen Verdeckung:

| Figur / Rücklage | Durch Basis verdeckt | Außerhalb der Basis sichtbar |
| --- | ---: | ---: |
| Pferd · Sternenumhang | 84,6 % | 15,4 % |
| Mond-Einhorn · Sternenumhang | 86,9 % | 13,1 % |
| Sternen-Pegasus · Sternenumhang | 77,0 % | 23,0 % |
| Polarlichtwolf · Nordlicht-Umhang | 87,0 % | 13,0 % |
| Nebelhirsch · Runenumhang | 66,2 % | 33,8 % |
| Entdecker/Entdeckerin · Sternenumhang | 57,7 % | 42,3 % |

Der Zahlenvergleich allein entscheidet nicht über die Qualität. Bei den Menschen bleibt ein zusammenhängender Mantel mit klarer Silhouette sichtbar. Bei Pferd, Einhorn und Wolf bleiben dagegen überwiegend vereinzelte Säume oder Stoffzipfel ohne sichtbaren Schulteranschluss.

## Prüfung der 13 Set-Kompositionen

Bewertung: **hoher visueller Prioritätsbefund** bedeutet, dass die gezeigte Kombination vor Galerie-/Shopintegration korrigiert werden muss. **Mittlerer visueller Prioritätsbefund** ist ebenfalls vor Integration zu korrigieren, beeinträchtigt aber nicht die Erkennbarkeit des gesamten Artikels. **Begrenzte Auffälligkeit** bezeichnet eine gestalterische Dichte ohne klaren Sitzfehler. **OK** zeigt in den vorhandenen Belegen keinen relevanten Passformfehler. Diese Begriffe bewerten die Bildqualität und behaupten keinen globalen Produktausfall.

| Figur und tatsächlich gezeigtes Set | Urteil | Konkreter Bildbefund | Wahrscheinliche Ursache | Kleinste korrekte Reparatur |
| --- | --- | --- | --- | --- |
| Entdeckerin · Runen-Set + Ritterrüstung | OK | Mantel, Rüstung, Medaillon und Kristall-Kompass bilden eine lesbare Komposition; keine schwebenden Teile. | Rücklage wird zwar teilweise verdeckt, bleibt aber beidseitig und unterhalb des Körpers zusammenhängend sichtbar. | Keine Änderung aus diesem Befund. Bei späterer Feinarbeit kann eine kleine vordere Schließe ergänzt werden, ohne den Mantel nach vorn zu ziehen. |
| Entdecker · Runen-Set + Ritterrüstung | OK | Wie bei der Entdeckerin; der Mantel liest sich als zusammenhängende Rücklage. | Wie oben. | Keine Änderung aus diesem Befund. |
| Pferd · Mond-Set | **Hoher visueller Prioritätsbefund** | Vom Sternenumhang bleiben im vollständigen Set nur ein Saum links hinter dem Schweif und ein kleines Dreieck unter dem Bauch. Ein Schulter-, Hals- oder Rückenansatz ist nicht sichtbar; der Artikel liest sich als loses Banner. | `horse-moon-body-rear.png` enthält den ganzen Umhang einschließlich vorderer Öffnung, wird aber in `art.js` fast vollständig hinter der Basis versteckt, weil nur `rear` registriert ist. 84,6 % der Ausrüstungspixel liegen unter der Basis. | Körperbezogene `rear`-Drapierung hinter Rumpf/Schweif plus kleine `front`-Lage für Joch, Schließe und nahen Schulterrand. Kopfteil und Hufreifen unverändert lassen. |
| Tiger · Dschungel-Set | **Hoher visueller Prioritätsbefund** | Die beiden vorderen goldenen Reifen sitzen ungefähr an den Vorderpfoten, die zwei hinteren schweben deutlich zu hoch beziehungsweise rechts neben den Hinterläufen. Alle vier wirken zudem größer als die Beinbreite. | Vier räumlich getrennte Ringe liegen in einer einzigen PNG und teilen eine affine Registrierung. Die erzeugten Relativabstände entsprechen nicht den vier Pfoten der Basis; ein globales Verschieben kann nicht alle vier zugleich korrigieren. | Nur `tiger-jungle-adornment-front.png` körperbezogen korrigieren: vier Pfotenanker einzeln messen und die vier Teile anschließend auf **eine** feste Vollcanvas-PNG setzen oder neu exakt gegen `tiger.png` erzeugen. Keine globale Boundingboxanpassung. |
| Einfacher Drache · Kristall-Set | OK | Amulett, Brustpanzer und Flügelspitzen liegen auf Hals/Brust beziehungsweise an beiden Flügelrändern; keine losen oder verdeckten Hauptteile. | Die drei Teile sind Vorderlagen mit eigenen körperbezogenen Registrierungen. | Keine Änderung aus diesem Befund. |
| Nebelhirsch · Waldgeist-Set | **Mittlerer visueller Prioritätsbefund** | Der Umhang ist großflächig hinter Rumpf und Schweif sichtbar, aber der in der Quelle deutlich vorhandene Kragen mit Kristallschließe verschwindet vollständig. Der sichtbare Stoff beginnt links hinter dem Hals und zieht rechts als separate Fahnenmasse heraus; die Befestigung ist nicht nachvollziehbar. | Der vollständige Mantel einschließlich Kragen/Schließe ist ausschließlich `rear`; 66,2 % liegen unter der Basis. Die Sidecar-Grenze „rear clasp mostly hidden“ beschreibt genau den nun beanstandeten Fehler. | Bestehende drapierte Rücklage beibehalten, aber Kragen, Schließe und einen kurzen vorderen Schulterrand als körperbezogene `front`-Lage bereitstellen. Kopf- und Beinzier unverändert lassen. |
| Polarlichtwolf · Aurora-Set | **Hoher visueller Prioritätsbefund** | Der Nordlicht-Umhang erscheint nur als dunkle Stoffstücke links hinter der Schulter sowie unter Bauch, Hinterläufen und Schweif. Halsöffnung und Schließe fehlen; das Ergebnis sieht wie mehrere Boden-/Hintergrundfragmente aus. | Der vollständige Umhang liegt bei Identitätsregistrierung ausschließlich `rear`; 87,0 % werden von der Wolfsbasis verdeckt. Das Sidecar erklärt die Halsöffnung ausdrücklich als absichtlich versteckt, was visuell nicht trägt. | Körperbezogener Split: Rückseite/Schleppe `rear`, sichtbare Halsöffnung, Schließe und nahe Schulterkante `front`. Keine Änderung an Amulett oder Pfotenreifen. |
| Schattenpanther · Obsidian-Set | OK | Amulett, Rüstung und vier Pfotenteile sitzen zusammenhängend auf der Figur. Keine deutliche Ablösung oder ungewollte Verdeckung. | Alle relevanten Teile sind Vorderlagen; die Pfotenzier ist gegen diese konkrete Pose passend verteilt. | Keine Änderung aus diesem Befund. |
| Mond-Einhorn · Mond-Set | **Hoher visueller Prioritätsbefund** | Wie beim Pferd bleibt fast nur der linke Saum am Schweif sichtbar; der Umhang hat keinen erkennbaren Kontakt zu Hals, Schulter oder Rücken. | Dasselbe Pferde-Quellbild wurde bytegleich kopiert und nur affin transformiert; 86,9 % liegen hinter der Einhornbasis. Die eigene Silhouette und das Horn ändern die notwendige Passform, die ein einziger Gesamttransform nicht herstellt. | Eigenes Einhornpaar aus `rear`-Drapierung und `front`-Joch/Schließe. Kopfschmuck und Hufreifen unverändert lassen. |
| Sturmgreif · Sturm-Set | Begrenzte Auffälligkeit | Die Ausrüstung sitzt insgesamt an Hals, Rumpf und Flügeln. Die goldene Federzier ist sehr dicht und zieht sich am nahen Flügel bis an Federkranz/Schulter, wirkt aber nicht losgelöst. | Ein einziges `front`-Bild kann Schmuck nicht abwechselnd vor und hinter einzelne Federn führen; das Sidecar nennt diese Grenze bereits. | Für die Passform kein Blocker. Nur falls die Gestaltung vereinfacht wird: körperbezogene, schmalere Vorderlage an den äußeren Federspitzen; keine globale Ebenenänderung. |
| Kristalldrache · Kristall-Set | OK | Amulett, Panzer und Flügelspitzen folgen der Figur; trotz geringer Farbkontraste keine räumliche Ablösung. | Körperbezogene Vorderregistrierungen; die gleichen Quellen wurden auf dieser Basis separat geprüft. | Keine Änderung aus diesem Befund. |
| Sternen-Pegasus · Sternen-Set | OK | Kopfschmuck, Wolkensattel und Kometenschweif sind sichtbar und an Kopf, Rücken/Flanke und Schweifansatz gebunden. Die Flügel bleiben lesbar. | Das Vorschau-Set verwendet Vorderlagen; die beanstandete reine Rücklagenproblematik betrifft hier nicht das gezeigte Sternen-Set. | Keine Änderung am Sternen-Set aus diesem Befund. |
| Phönix · Sonnen-Set | Begrenzte Auffälligkeit | Krone, Brustschmuck und Flügelzier liegen auf der Figur. Die Flügelzier ist großflächig und verschmilzt optisch mit den Feuerfedern, sitzt aber nicht erkennbar neben oder hinter der Figur. | Ein dichtes, ausschließlich vorderes Ornament und geringer Farbkontrast; kein geometrischer Versatz. | Kein Passform-Blocker. Bei späterer Gestaltung die Flügelzier schlanker/kontrastreicher erzeugen, ohne Ebenenlogik zu ändern. |

## Weitere sichtbare Problemgruppe außerhalb der gewählten 13 Sets

Der Katalog erlaubt beide Pferde-Sets auf Pferd, Einhorn und Pegasus. Deshalb reicht die 13er Vorschau allein nicht.

### Mond-Umhang auf Sternen-Pegasus — hoher visueller Prioritätsbefund

In `pegasus-star-set-moon.png` ist der Umhang zwar mit 23,0 % stärker sichtbar als bei Pferd und Einhorn, liegt aber weiterhin nur hinter Schweif und linkem Flügel/Rumpf. Er hat keinen sichtbaren Hals- oder Schulteranschluss. Das ist derselbe Fehler, nicht eine eigene akzeptable Gestaltung.

Für den Pegasus genügt ein gedankenloser Zweiebenen-Split nur dann, wenn das vordere Joch den Flügel nicht übermalen muss. Soll der Stoff anatomisch zwischen Rumpf und Flügelwurzel verlaufen, kann die ungeteilte Basisfigur diese Tiefenreihenfolge nicht ausdrücken: `rear` liegt hinter Körper **und** Flügel, `front` vor beiden. Die kleinste stabile Variante ist daher ein Joch, das im sichtbaren Brust-/Schulterbereich vor der Basis liegt und räumlich außerhalb der Flügelfläche bleibt. Nur wenn das gewünschte Design zwingend unter einer Vorderflügelkante hindurchläuft, muss der Pegasus-Grundkörper selbst in Körper-/Flügellagen getrennt werden.

### Sternen-Set auf Pferd und Einhorn — kein Befund

Die zusätzlichen vollständigen Belege `horse-set-stars.png` und `unicorn-moon-set-stars.png` zeigen Sattel, Kopfschmuck und Kometenschweif zusammenhängend. Hier ist keine Reparatur durch diesen Auftrag begründet.

## Technische Ursache

`src/trainer/avatar/art.js` rendert in fester Reihenfolge:

1. alle vorhandenen `rear`-Lagen,
2. die vollständige Basisfigur,
3. Standardkleidung bei Menschen,
4. alle vorhandenen `front`-Lagen.

Diese Reihenfolge ist für Rucksäcke, offene menschliche Mäntel und viele Tieraccessoires sinnvoll. Sie kann einen Gegenstand, der den Körper räumlich umschließt, aber nur dann korrekt darstellen, wenn der Gegenstand selbst in Rück- und Vorderteile getrennt ist. Die Pipeline und das Manifest unterstützen bereits gleichzeitig `rear` und `front` je Artikel. Für die beanstandeten Umhänge fehlt also keine globale Rendererfunktion; es fehlen die passenden körperbezogenen Vorderbilder.

`scripts/build-avatar-art.mjs` wendet je Quell-PNG genau eine feste affine Registrierung auf die ganze Quelle an und zeichnet auf die feste Figurenleinwand. Das ist richtig und soll erhalten bleiben. Es erklärt zugleich den Tigerfehler: vier falsch zueinander erzeugte Ringe lassen sich nicht durch einen einzigen `(scale, x, y)`-Satz reparieren. Sie müssen innerhalb der kanonischen Quelle relativ zueinander korrigiert werden.

Die bisherigen automatischen Prüfungen belegen Dateiabdeckung, Transparenz, Leinwandgrenzen und Laden der Komposition. `tests/browser/avatar-art.browser.mjs` zählt 13 Figuren, 62 Paare und 48 menschliche Varianten, prüft aber nicht semantisch, ob ein Mantel sichtbar befestigt ist oder ein Reifen tatsächlich eine Pfote umschließt. Die Kontaktbögen waren Sichtbelege; die alten positiven Freitexte in Berichten und Sidecars ersetzen keine erneute Abnahme.

## Begrenzter Reparaturauftrag

Die Reparatur sollte zunächst ausschließlich diese Quellen betreffen:

1. `horse-moon-body-rear` ergänzen/ersetzen durch ein körperbezogenes Rear/Front-Paar.
2. `unicorn-moon-moon-body-rear` nicht weiter als bytegleiche Pferdekopie behandeln, sondern eigenes Rear/Front-Paar verwenden.
3. `pegasus-star-moon-body-rear` als eigenes Rear/Front-Paar korrigieren; Flügelüberdeckung ausdrücklich prüfen.
4. `wolf-aurora-aurora-body-rear` in Rear-Drapierung und Front-Kragen/Schließe teilen.
5. `deer-mist-forest-body-rear` in Rear-Drapierung und Front-Kragen/Schließe teilen.
6. `tiger-jungle-adornment-front` mit vier einzeln geprüften Pfotenankern neu zusammensetzen.

Nicht begründet sind eine Neugenerierung aller 93 Bildlagen, eine pauschale `z-index`-Änderung, eine Änderung der 13 Basisfiguren oder eine Lockerung der festen Leinwand-/Registrierungsprüfung.

## Nachweis für die spätere Korrektur

Vor erneuter Freigabe sind nötig:

- RED-Belege der sechs oben genannten Fälle auf den aktuellen Quellen,
- je Umhang Einzelbilder für `rear`, Basis, `front` und vollständiges Set; Kragen/Schließe müssen sichtbar verbunden sein, ohne Augen, Gesicht, Beine oder Flügel ungewollt zu überdecken,
- beim Tiger vier enge Ausschnitte oder markierte Anker, die jeden Reifen um genau die zugehörige Pfote zeigen,
- vollständige 13er Vorschau plus die sechs Pferde-/Einhorn-/Pegasus-Kombinationen,
- Sichtprüfung in Galeriegröße und in der 320-Pixel-Mobilansicht,
- unveränderte technische Transparenz-, Leinwand-, Budget- und Fallbackprüfungen.

Erst diese korrigierten Bilder dürfen eine neue visuelle Passformfreigabe begründen. Die bestehende Dateivollständigkeit und die alte Freitextakzeptanz tun das nicht.
