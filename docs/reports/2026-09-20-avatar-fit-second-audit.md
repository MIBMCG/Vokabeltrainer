# Zweitaudit: anatomische Passform der Avatar-Ausrüstung

Stand: 20.09.2026.

Geprüfter Stand: `f870e53` auf `codex/vokabeltrainer-v1`.

Umfang: unabhängige visuelle Prüfung, keine Änderung an Produktcode, Katalog, Pipeline oder Bildquellen

## Urteil

**FAIL – die vorbereitete Avatar-Ausrüstung ist noch nicht zur visuellen Abnahme oder Shopintegration geeignet.**

Die erneute Nutzerkritik widerlegt die bisherigen PASS-Aussagen. Besonders deutlich sind die Fehler bei den Hufreifen der Pferdegruppe und den Pfotenreifen des Tigers: Die Bilder zeigen vollständige, von oben einsehbare Ringe beziehungsweise Becher auf einer einzigen Vorderlage. Damit bleibt auch der hinter dem Bein liegende Rand vor Fell oder Huf sichtbar. Das Bein läuft optisch nicht durch den Ring; der Ring liegt als opakes Objekt auf der Figur. Eine korrekte Position der Ringmitte oder genügend Pixelüberdeckung behebt diesen Tiefenfehler nicht.

Der gleiche Grundfehler erscheint schwächer bei weiterem Bein-, Hals-, Flügel- und Handzubehör. Mehrere Gegenstände sind zwar technisch transparent und überschneiden die Grundfigur, aber sie umgreifen den Körper nicht, folgen nicht zuverlässig seiner Perspektive oder besitzen keinen nachvollziehbaren Befestigungspunkt. Die letzte Korrektur schließt den früheren Fehler „vollständiger Umhang nur hinter der Figur“ teilweise, nicht die eigentliche Passformprüfung.

Frühere Aussagen wie „kein offener Passformbefund“ und Sidecar-Statuswerte wie `accepted-for-current-base` oder `verified-after-fit-repair` gelten nicht als unabhängige Abnahme. Der vorliegende Nutzerbefund hat diese Urteile fachlich überholt.

## Geprüfte Belege

Direkt angesehen wurden:

- die [Übersicht aller 13 Hauptkompositionen](../design/avatar-shop-preview.png),
- die [Sechser-Vorschau der letzten Korrektur](../design/2026-09-20-avatar-passform.png),
- die großen aktuellen Pferdekompositionen unter `.superpowers/sdd/2026-09-20-avatar-fit/equine/screens/*-new-full-1024.png`,
- `mystic/tiger-composite.png`, `wolf-composite.png` und `deer-composite.png` im selben Prüfverzeichnis,
- die vollständigen Drachen-, Panther-, Greif- und Phönixkompositionen in den vorhandenen lokalen Prüfnachweisen,
- die zugehörigen Grundkörper und einzelnen PNG-Ausrüstungslagen unter `docs/design/avatar-shop-sources/`,
- [Renderer](../../src/trainer/avatar/art.js), [Katalog](../../src/trainer/avatar/catalog.js), [Bildbau](../../scripts/build-avatar-art.mjs) sowie die JSON-Registrierungen.

Die großen Pferdebilder und die Tigerquelle zeigen die beanstandete Ringform besonders klar. Die 13er-Übersicht ist für die Hauptsets aussagekräftig, aber bei kleinen Karten allein nicht ausreichend: Dort verschwinden gerade fehlerhafte Überdeckungen, Anschlusslücken und falsche Tiefenreihenfolgen im Detail.

## Befunde an den 13 Hauptfiguren

Die Priorität beschreibt die nötige Korrektur vor Integration. „Hoch“ bedeutet einen klaren anatomischen oder räumlichen Sitzfehler. „Mittel“ bedeutet, dass der Gegenstand als Zubehör erkennbar bleibt, aber sichtbar aufgesetzt, unbefestigt oder in falscher Tiefe liegt. Kein Eintrag in dieser Tabelle ist eine globale Freigabe der übrigen Einzelartikel.

| Figur / Hauptset | Priorität | Konkreter Sichtbefund |
| --- | --- | --- |
| Entdeckerin · Runen-Set + Ritterrüstung | **Hoch** | Der Sternenumhang beginnt links und rechts erst hinter den Armen; am Hals und an beiden Schultern fehlt ein sichtbarer Anschluss. Er liest sich als zwei hinter die Figur gestellte Stofftafeln. Kristall-Kompass und Hand liegen vollständig nebeneinander; Finger, Griff oder Band erzeugen keine glaubwürdige Übergabe zwischen Hand und Objekt. Medaillon und Rüstung überlagern sich nur frontal, ohne gemeinsame Halsführung. |
| Entdecker · Runen-Set + Ritterrüstung | **Hoch** | Derselbe Umhang- und Handfehler wie bei der Entdeckerin. Der Kompass hängt seitlich außerhalb der Hand, und die Figur verdeckt keinen Teil des Griffs. Die Rüstung ist als Kleidung lesbar, repariert aber nicht die fehlenden Anschlüsse von Umhang und Zubehör. |
| Pferd · Mond-Set | **Hoch** | Alle vier Hufreifen sind vollständige, von oben sichtbare Metallbecher vor den Beinen. Ihre hinteren Ränder schneiden optisch über die Fessel; besonders der große vordere Reifen verdeckt den Beinkontakt. Breite, Höhe und Ellipsenwinkel folgen den vier unterschiedlichen Hufstellungen nicht. Der neue Umhang besitzt jetzt einen sichtbaren Verschluss, seine Vorderkante liegt jedoch als einteilige Frontgrafik über Hals und Brust, statt Mähne, Körper und Stoff örtlich wechselnd zu verdecken. |
| Tiger · Dschungel-Set | **Hoch** | Die vier goldenen Reifen treffen inzwischen ungefähr die vier Läufe, bleiben aber vollständige offene Becher vor dem Fell. Der obere hintere Ringrand ist jeweils über dem Lauf sichtbar. Die Reifen sind breiter als die zugehörigen Beine und folgen den verschiedenen Laufachsen nur unzureichend; besonders die beiden Hinterläufe verlangen unterschiedliche Winkel und Tiefen. Das Geschirr enthält zusätzlich starre Gurte, deren Linien vollständig vor Rumpf und Beinen verlaufen. |
| Einfacher Drache · Kristall-Set | **Mittel** | Brustpanzer und Amulett liegen als geschlossene Vordergrafik auf Hals und Brust; seitliche beziehungsweise hintere Befestigungen fehlen. Die Flügelspitzen übermalen den vorderen Flügelrand vollständig, ohne dass ein Teil hinter Membran oder Federkante verschwindet. Das Set ist erkennbar, wirkt aber eher aufgeklebt als angelegt. |
| Nebelhirsch · Waldgeist-Set | **Hoch** | Der neue Blattkragen ist als Frontteil sichtbar, liegt aber vollständig über dem dichten Halsfell; Fell oder Hals verdecken nirgends einen rückwärtigen Kragenanteil. Die vier Beinzierstücke sind komplette Anhänger vor den Läufen. Öffnungen und Hinterkanten bleiben sichtbar, einzelne Kristalle hängen zwischen den Beinen und wirken nicht am jeweiligen Lauf befestigt. Die Rückdrapierung und der Frontkragen teilen Farbe und Stil, besitzen aber keinen belastbaren gemeinsamen Schulterverlauf. |
| Polarlichtwolf · Aurora-Set | **Hoch** | Der Kragen liegt als vollständiges Joch vor dem Halsfell. Die vier stark leuchtenden Pfotenteile sitzen ebenfalls vollständig vor den Läufen; ihre Bögen umgreifen Fell und Gelenk nicht, sondern übermalen sie. Der Umhang ist nun als Stoff erkennbar, doch Vorderjoch, Rückstoff und Pfotenornamente zeigen weiterhin dieselbe fehlende lokale Vorder-/Hinterverdeckung. |
| Schattenpanther · Obsidian-Set | **Hoch** | Die vier Pfotenstücke sind geschlossene Vorderornamente mit sichtbarer Hinterkante vor jedem Lauf. Ihre unterschiedlichen Größen entsprechen der Perspektive nur grob. Rüstungsteile und Zierlinien laufen durchgehend vor Schulter, Brust und Hinterhand; Körperteile verdecken keine rückwärtigen Gurte oder Fassungen. Das Gesamtbild ist dekorativ geschlossen, anatomisch aber nicht geschichtet. |
| Mond-Einhorn · Mond-Set | **Hoch** | Derselbe Becherfehler wie beim Pferd, verstärkt durch die hellen Beine und die klar sichtbaren dunklen Ringinnenflächen. Die vier Reifen besitzen nahezu dieselbe horizontale Ausrichtung, obwohl Vorder- und Hinterhufe verschieden stehen. Der Umhang überdeckt Hals/Schulter großflächig; Mähne und Stoff wechseln nicht glaubwürdig zwischen Vorder- und Hinterlage. |
| Sturmgreif · Sturm-Set | **Hoch** | Goldene Federzier und Ketten liegen vollständig vor beiden Flügeln. Ketten und Kristalle kreuzen Federkanten, obwohl Teile davon hinter einzelnen Federn liegen müssten. Die Rüstung liegt zugleich vor Rumpf, Flügelansatz und naher Hinterhand; die ungeteilte Greifbasis erlaubt diese Tiefenfolge nicht. Das Set hat deshalb mehrere sichtbare Linien durch Körperteile statt klarer Befestigungen. |
| Kristalldrache · Kristall-Set | **Mittel** | Wie beim einfachen Drachen sitzen Amulett, Brustpanzer und beide Flügelaufsätze ausschließlich vorn. Die Aufsätze folgen der groben Flügelsilhouette, kapseln deren Kanten aber nicht; beide vollständigen Zierteile liegen vor der Membran. Farbähnlichkeit kaschiert den Ebenenfehler in der kleinen Karte, behebt ihn nicht. |
| Sternen-Pegasus · Sternen-Set | **Hoch** | Im Hauptset verschwinden Wolkensattel und Kometenschweif teilweise in Flügel und Mähne beziehungsweise verschmelzen mit ihnen; ein Sattelgurt oder ein klarer Schweifansatz ist nicht nachvollziehbar. Beim ebenfalls kompatiblen Mond-Set zeigt die große Vollkomposition zusätzlich denselben Hufbecherfehler wie Pferd und Einhorn. Die Vorderlage kann nicht zugleich vor dem Rumpf und hinter dem nahen Flügel liegen. |
| Phönix · Sonnen-Set | **Mittel** | Krone, Brustschmuck und Flügelzier verschmelzen als vollständige Vorderüberzeichnung mit den Feuerfedern. Es ist kaum erkennbar, wo Körper endet und abnehmbare Ausrüstung beginnt; verdeckte Rückseiten oder Befestigungen fehlen. Das ist kein bloßes Kontrastproblem, sondern eine Folge der einheitlichen Fronttiefe. |

Zusätzlich bleiben bei den einzelnen menschlichen Levelartikeln ähnliche Probleme sichtbar: Fernglas und Kompass werden nicht von Fingern gehalten, Rucksackgurte erscheinen nur dort glaubwürdig, wo sie zufällig außerhalb der Vorderkontur bleiben, und Kopfbedeckungen besitzen je nach Haarform keine örtliche Vorder-/Hinterverdeckung. Diese Einzelartikel sind in den 13 Hauptsets nicht vollständig repräsentiert und dürfen deshalb nicht aus der Hauptübersicht abgeleitet freigegeben werden.

## Grundursache

### 1. Eine affine Registrierung pro mehrteiligem Bild

Der Bildbau erlaubt pro PNG nur `scale`, `x` und `y`. Rotation, Scherung, perspektivische Verzerrung und unabhängige Teiltransformationen fehlen. Enthält eine Datei vier Reifen, zwei Flügelaufsätze oder mehrere Gurte, teilen alle Teile dieselbe Transformation. Stimmen ihre Abstände, Winkel oder Größen nicht bereits exakt mit dem Grundkörper überein, kann eine globale Verschiebung nie alle Teilstücke korrigieren.

Die letzte Tigerkorrektur hat die Ringzentren verbessert, aber nicht diesen Konstruktionsfehler beseitigt. Dass vier Ringe je einen Lauf überdecken, beweist weder passenden Durchmesser noch passende Achse oder korrekte Verdeckung.

### 2. Unabhängig erzeugte Blickwinkel

Grundkörper und Ausrüstung wurden teilweise als getrennte Illustrationen erzeugt. Die Ausrüstung bringt dabei ihre eigene Kamera, Ellipsenform, Beleuchtung und Körperannahme mit. Ein von oben sichtbarer Ring kann nicht durch Skalieren zu einem seitlich um einen schrägen Lauf sitzenden Band werden. Dasselbe gilt für Halsjoche, Flügelzier, Sattel und Handobjekte.

### 3. Zu grobe Tiefenreihenfolge

Der Renderer kennt im Wesentlichen `rear → vollständige Basis → clothing → front`. Das genügt für einen Gegenstand vollständig hinter oder vor der Figur. Getragene Teile brauchen aber örtlich wechselnde Tiefe:

- der hintere Reifenbogen liegt hinter dem Bein, der vordere davor,
- ein Kragen liegt hinten unter Mähne/Fell und vorn über der Brust,
- ein Gurt verschwindet hinter Rumpf oder Bein und erscheint an anderer Stelle wieder,
- ein Flügelaufsatz kann vor einer Feder und hinter der nächsten liegen,
- Finger müssen einen Griff teilweise verdecken.

Die ungeteilte Basis enthält Körper, Fell, Mähne, Hände und Flügel bereits in einer Ebene. Ein einziges Frontbild kann diese Beziehungen nicht herstellen. Der neue Rear/Front-Split der Umhänge löst nur Fälle, in denen eine Trennung an der gesamten Basisgrenze optisch genügt.

### 4. Die bisherigen Tests messen die falsche Eigenschaft

Dateiabdeckung, Transparenz, Canvas-Grenzen und erfolgreiche WebP-Erzeugung sind technische Voraussetzungen. Auch der aktuelle Grenzwert von 2,5 % veränderten Körperpixeln prüft nur, dass eine Vorderlage den Körper übermalt. Bei einem vollständig vor das Bein gesetzten Becher steigt genau dieser Wert, obwohl die Passform schlechter ist. Pixelüberdeckung, Alphaanteil und Mittelpunktnähe dürfen deshalb nicht mehr als visuelle Passformfreigabe bezeichnet werden.

## Begrenzte Reparaturstrategie

Die beste begrenzte Lösung ist kein weiterer Durchlauf mit globalem Verschieben, sondern ein **körperbezogener Fit-Pass für den bestehenden Katalog**. Die 13 Grundkörper, Preise, Artikel-IDs und Produktlogik können dabei unverändert bleiben.

1. **Verbindliche Passformvorlage je Grundkörper erstellen.** Auf der exakten 768er-Zielleinwand werden Hals, Schulter, Rumpf, jede einzelne Gliedmaße, Hufe/Pfoten, Hände, Flügel und Schweif mit Achse, sichtbarer Breite und Vorder-/Hinterkante markiert. Diese Vorlage wird nicht ausgeliefert, sondern dient als Produktions- und Prüfhilfe.
2. **Jedes Mehrteilbild intern zerlegen.** Vier Reifen werden zunächst als vier unabhängige Teile an vier unabhängigen Ankern ausgerichtet. Gleiches gilt für paarige Flügelzier, Gurte und Beinanhänger. Erst nach erfolgreicher Einzelpassung werden die Teile auf körperbezogene Vollcanvas-Dateien konsolidiert. Eine gemeinsame affine Nachkorrektur darf nicht mehr die Einzelpassung ersetzen.
3. **Umschließende Gegenstände in sichtbare Tiefenteile teilen.** Bei Huf-/Pfotenreifen enthält `rear` ausschließlich die hinteren Halbbögen, `front` ausschließlich Vorderbogen und Seiten. Das Bein muss dazwischen sichtbar bleiben. Kragen und Umhänge erhalten ebenso einen hinteren Hals-/Schulterteil und einen vorderen Verschluss. Vollständige offene Becher oder komplette Halsringe gehören nicht auf eine einzige Frontlage.
4. **Für Hände, Mähnen und Flügel eine kleine Occluder-Lösung vorsehen.** Wo `rear/base/front` nicht genügt, ist für diesen endlichen Katalog ein artikel- und figurenspezifischer Vordergrundausschnitt die kleinste robuste Erweiterung: zum Beispiel Finger über einem Griff oder eine nahe Feder über einem Gurt. Alternativ muss das betreffende Design so vereinfacht werden, dass es keine solche Tiefenbeziehung verlangt. Ein allgemeines Skelett-, 3D- oder Verformungssystem ist dafür nicht nötig.
5. **Zuerst die wiederkehrenden Fehlerfamilien reparieren.** Reihenfolge: (a) alle Huf-/Pfoten-/Beinreifen einschließlich Pferd, Einhorn, Mond-Pegasus, Tiger, Wolf, Hirsch und Panther; (b) Umhänge/Kragen der Menschen, Pferdegruppe, Wolf und Hirsch; (c) Handobjekte; (d) Flügelzier und Gurte bei Drachen, Greif und Phönix; (e) Sattel/Schweif des Sternen-Pegasus. So wird nicht jede der 98 Lagen ungeprüft neu erzeugt, aber auch kein bekannter Fehlertyp nur an einem Beispiel repariert.
6. **Quellen gegen den exakten Grundkörper erzeugen oder zeichnen.** Der Grundkörper muss Referenz und Zielpose sein. Item-only-Bilder mit angenommener Tierpose sind für tragende oder umschließende Ausrüstung nicht mehr geeignet.

## Visuelle Abnahmekriterien

Eine Kombination darf erst als passend gelten, wenn die folgenden Kriterien sowohl in großer Ansicht als auch in der tatsächlichen 256er-Karte erfüllt sind:

- Jeder Gegenstand besitzt einen sichtbaren, anatomisch plausiblen Befestigungspunkt. Keine Stofftafel, Schließe, Kette oder Handrequisite schwebt ohne Verbindung.
- Jeder Reifen ist genau einem Lauf zugeordnet. Seine Mittelachse folgt der lokalen Laufachse; Innendurchmesser und Perspektivellipse passen zur sichtbaren Beinbreite.
- Bei einem umschließenden Teil verdeckt der Körper den rückwärtigen Abschnitt und das Vorderteil verdeckt den Körper. Ein vollständiger oberer Ringrand darf nicht opak über Fell oder Bein laufen.
- Hufe, Pfoten, Augen, Gesicht, Finger, Flügelkanten und Gelenke werden nicht durch unmotivierte Vorderflächen oder Leuchthöfe abgeschnitten.
- Kragen und Umhang bilden an beiden Schultern eine nachvollziehbare Verbindung. Vorder- und Hinterstoff dürfen weder doppelte Kanten noch unverbundene Ornamentfragmente erzeugen.
- Gurte, Ketten und Flügelzier wechseln die Tiefe dort, wo Körperteile vor ihnen liegen. Linien dürfen nicht ungeachtet der Anatomie durch Beine, Federn oder Fell laufen.
- Ein einzelner Artikel bleibt als abnehmbare Ausrüstung lesbar; er darf nicht nur durch farbliche Verschmelzung mit der Basis „passen“.
- Geprüft werden alle **62 kompatiblen Figur-/Artikelpaare**, nicht nur ein Hauptset je Figur. Zusätzlich braucht jede Figur eine vollständige Drei-Slot-Komposition, damit Kollisionen zwischen Kopf-, Körper- und Zierteil sichtbar werden.
- Der Sichtbeleg zeigt pro problematischem Artikel Grundkörper, `rear`, `front`/Occluder und Vollkomposition auf hellem sowie kariertem Hintergrund. Enge Ausschnitte der Befestigungspunkte ergänzen die Übersicht.
- Die visuelle Freigabe wird als menschliches Urteil mit benanntem Bildstand festgehalten. Technische Messwerte unterstützen dieses Urteil, ersetzen es nicht. Eine erneute positive Aussage vor der persönlichen Nutzerprüfung muss ausdrücklich als interne Vorprüfung bezeichnet werden.

## Freigabegate

Der aktuelle Stand bleibt visuell gesperrt. Er kann technisch weiterhin als vorbereiteter Bildkatalog dienen, darf aber nicht mehr als „passend“, „ohne offenen Befund“ oder „visuell korrigiert“ beschrieben werden. Eine neue PASS-Entscheidung ist erst nach dem körperbezogenen Fit-Pass, einer frischen 13er-Hauptübersicht, den 62 Einzelpaaren, den problembezogenen Nahansichten und der persönlichen Sichtprüfung belastbar.
