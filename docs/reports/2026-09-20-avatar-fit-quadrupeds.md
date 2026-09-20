# Quadrupeden: klassische Passform-Reparatur v3

Stand: 20.09.2026  
Figuren: `tiger`, `wolf-aurora`, `deer-mist`, `panther-shadow`  
Unveraenderliche Quelle: Git-Revision `24ce5a38b561c6012d7307603fc378ca339ab58c`

## Umfang und Verfahren

Die Reparaturen sind deterministische Pillow-/NumPy-Bearbeitungen der Original-PNGs aus der genannten Git-Revision. Das Skript [quadrupeds.py](../../scripts/avatar-fit/quadrupeds.py) liest seine Bildquellen mit `git show 24ce5a3:<pfad>` und verwendet keine bereits bearbeitete PNG erneut als Eingabe. Die Basisfiguren wurden weder ueberschrieben noch in eine Zubehoerebene kopiert.

Die vier Rezepte liegen unter [avatar-fit-recipes/quadrupeds](../design/avatar-fit-recipes/quadrupeds/). Bei den Beinornamenten wird jeweils nur die gravierte vordere Bandflaeche unter einer weich auslaufenden unteren Ellipse uebernommen. Dunkle Innenraeume, hintere Boegen und haengende Ansaetze werden entfernt. Breite, Mittelpunkt und Drehung sind fuer jedes Bein einzeln festgelegt.

Kopf- und Koerperzubehoer wurde ebenfalls figurbezogen getrennt: Ketten beziehungsweise Geweihschmuck erhalten eine hintere Ebene, waehrend nur kleine Anhaenger oder Kristallspitzen vorne liegen. Bei Geschirr, Umhang und Ruestung bleiben nur Teile erhalten, die an Kopf, Schulter, Ruecken oder Tasche plausibel anliegen.

## Dauerhafte Bildvergleiche

Jeder Bogen zeigt die drei Paare Kopf, Koerper und Beinschmuck mit jeweils einer echten 256-Pixel-Karte vor und nach der Reparatur auf hellem Hintergrund:

- [Tiger](../design/avatar-fit-v3/quadrupeds/tiger-pairs-256.png)
- [Aurora-Wolf](../design/avatar-fit-v3/quadrupeds/wolf-aurora-pairs-256.png)
- [Nebelhirsch](../design/avatar-fit-v3/quadrupeds/deer-mist-pairs-256.png)
- [Schattenpanther](../design/avatar-fit-v3/quadrupeds/panther-shadow-pairs-256.png)

Grosse Einzelansichten fuer die interne Kontrolle liegen nur im ignorierten Arbeitsordner `.superpowers/sdd/2026-09-20-avatar-fit-v3/quadrupeds/`.

## Sichtpruefung der zwoelf Paare

| Figur / Paar | Geaenderte Quelldateien | Konkrete Reparatur | Bildbasierte Vorher-/Nachher-Beobachtung |
| --- | --- | --- | --- |
| Tiger / Kopf | `tiger-jungle-head-front.png`; neu: `tiger-jungle-head-rear.png` | Kette verkleinert und hinter das Halsfell gelegt; nur Blatt und kleine Fassung vorne | Vorher lag ein breiter gruener Ring sichtbar vor Wangen und Brustfell. Nachher bleibt am Hals eine schmale Befestigung mit frei lesbarem Blatt. Die persoenliche Stilabnahme bleibt offen. |
| Tiger / Koerper | `tiger-jungle-body-front.png` | Brustgeschirr und Rueckengurt beibehalten; grosse Unterbauchschlaufen entfernt; Tasche entlang ihres originalen geschwungenen unteren Saums maskiert | Vorher verlief ein geschlossener Riemenring durch Bauch und Hinterlaeufe. Nachher endet das Geschirr am Koerper. Die zuerst entstandene waagerechte Schnittkante durch die Tasche wurde beseitigt; der untere Rand folgt nun dem Originalsaum. |
| Tiger / Beinschmuck | `tiger-jungle-adornment-front.png` | Vier getrennte Vorderbaender auf 104/112/92/98 Pixel Breite gebracht und an die jeweilige Beinachse gedreht | Vorher standen vier offene Becher weit seitlich ab. Nachher liegen schmale gravierte Vorderbaender an den vier Beinen; dunkle Innenoeffnungen und Restboegen sind nicht mehr sichtbar. |
| Aurora-Wolf / Kopf | `wolf-aurora-aurora-head-front.png`; neu: `wolf-aurora-aurora-head-rear.png` | Halskette verkleinert, Kettenanteil hinter Fell, Kristallanhaenger vorne | Vorher bildete die Kette einen breiten Bogen ueber dem Brustfell. Nachher bleibt eine kleine zentrale Kristallfassung. Bei der gemeinsamen Grossansicht ist noch zu beurteilen, ob der verbleibende cyanfarbene Schein ausreichend zur Fellkante passt. |
| Aurora-Wolf / Koerper | `wolf-aurora-aurora-body-front.png`; `wolf-aurora-aurora-body-rear.png` kanonisch registriert | Umhang hinten beibehalten; vorne nur zentraler Verschluss und kleine Schulteransaetze | Vorher lag ein breites, halskrausenartiges Vorderteil ueber Hals und Schultern. Nachher ist die Brust frei; Umhang und Schweif bleiben getrennt lesbar. |
| Aurora-Wolf / Beinschmuck | `wolf-aurora-aurora-adornment-front.png` | Vier Sternornamente zu individuellen Vorderbaendern reduziert | Vorher sassen grosse sternfoermige Gebilde vor den Pfoten und zwischen den Beinen. Nachher erscheinen vier kleine Eisbaender unmittelbar an den Laeufen. Die sehr helle Kontur bleibt bei 256 Pixel sichtbar, ist aber bewusst deutlich zurueckgenommen. |
| Nebelhirsch / Kopf | `deer-mist-forest-head-front.png`; neu: `deer-mist-forest-head-rear.png` | Seitlichen Geweihschmuck nach hinten gelegt; zwei obere Kristallspitzen und zentralen Originalkristall vorne erhalten | Die erste Reparatur versteckte den Artikel zu stark. Der zentrale Originalkristall ist jetzt zwischen den Geweihansaetzen sichtbar, seine Fassung angeschlossen, die Augen frei. Grosse Ansicht und 256-Pixel-Karte wurden erneut geprueft. |
| Nebelhirsch / Koerper | `deer-mist-forest-body-front.png`; `deer-mist-forest-body-rear.png` kanonisch registriert | Umhang hinten beibehalten; vorderen Kragen auf drei kleine, koerpernahe Partien reduziert | Vorher lag ein grosser Blattkragen quer ueber Hals und Schulter. Nachher sind Brust und Vorderlaeufe frei, waehrend der Umhang am Ruecken beginnt. |
| Nebelhirsch / Beinschmuck | `deer-mist-forest-adornment-front.png` | Vier Rankenteile als kleine, einzeln ausgerichtete Vorderbaender erhalten | Vorher hingen Ranken und Kristalle in die Zwischenraeume zwischen den Laeufen. Nachher bleiben kleine Ansaetze direkt an jedem Lauf; keine dunklen Ringoeffnungen sind enthalten. |
| Schattenpanther / Kopf | `panther-shadow-obsidian-head-front.png`; neu: `panther-shadow-obsidian-head-rear.png` | Kette verkleinert, Kettenbogen hinter Hals/Fell, kleiner violetter Anhaenger vorne | Vorher lag der Halsbogen vollstaendig vor dem Tier. Nachher bleibt ein schmaler Schmuckpunkt unter dem Kinn. Seine dunkle Tonalitaet ist auf hellem Hintergrund lesbar; Dark-Mode- und In-App-Abnahme stehen noch aus. |
| Schattenpanther / Koerper | `panther-shadow-obsidian-body-front.png` | Riesigen Halsring und lange Brustschuerze entfernt; Schulter- und Rueckenplatten entlang des Koerpers beibehalten | Vorher bildete die Ruestung einen offenen Grossring um den Hals und ragte weit vor die Brust. Nachher bleibt eine kompakte Schulter-/Rueckenruestung. Die vordere Schulterplatte liegt weiterhin bewusst vor dem Koerper und muss im gemeinsamen Review als Stilentscheidung bewertet werden. |
| Schattenpanther / Beinschmuck | `panther-shadow-obsidian-adornment-front.png` | Vier Kristallmanschetten einzeln verschmaelert und gedreht; tiefe Kristallanhaenger entfernt | Vorher verdeckten grosse Kristallgruppen Pfoten und Beinzwischenraeume. Nachher liegen vier kompakte Vorderbaender an den Laeufen. Der vordere linke Kristall ist groesser als die hinteren, folgt aber der deutlich breiteren Vorderpfote. |

## Provenienz und Sidecars

Zu jeder geschriebenen PNG liegt eine JSON-Sidecar-Datei mit folgenden Angaben vor:

- voller Quell-Commit und SHA-256-Pruefsumme jeder Originalquelle,
- zugehoeriges Rezept und Reparaturskript,
- volle Canvasgroesse und Identitaetsregistrierung (`scale: 1`, `x: 0`, `y: 0`),
- SHA-256-Pruefsumme der erzeugten PNG,
- Verweis auf den dauerhaften Vergleichsbogen sowie die ignorierte grosse Arbeitsansicht.

Insgesamt werden 18 Zubehoerebenen geschrieben: je vier Kopf-Hinterebenen und Kopf-Vorderebenen, vier Koerper-Vorderebenen, zwei vorhandene Koerper-Hinterebenen sowie vier Beinschmuck-Vorderebenen.

## Ausgefuehrte Pruefungen und Grenzen

- `python -m py_compile scripts/avatar-fit/quadrupeds.py`
- `python scripts/avatar-fit/quadrupeds.py write`
- `python scripts/avatar-fit/quadrupeds.py verify` mit Ergebnis `18` erzeugte Ebenen, `22` Quellpruefungen und `4` Vergleichsboegen
- Pixelvergleich jeder kanonischen Ebene gegen die unmittelbar aus Git-Originalen neu berechnete Fassung
- Bytevergleich aller vier aktuellen Basisfiguren gegen Git-Revision `24ce5a3`
- Pruefung der Sidecar-Pruefsummen, Identitaetsregistrierung und Original-Provenienz
- Sichtung der vier beschrifteten 256-Pixel-Boegen sowie der grossen Vorher-/Nachher-Komposite auf hellem Hintergrund

Der gemeinsame Build und die WebP-/Manifestpruefung sind im [Gesamtbericht](2026-09-20-avatar-fit-v3.md) dokumentiert. Die benannten Grossansicht-Punkte bei Wolf und Panther wurden in der [unabhaengigen Review](2026-09-20-avatar-fit-v3-review.md) ohne offene P1/P2 beurteilt; der Hirsch-Kopfschmuck wurde wie oben beschrieben korrigiert und erneut geprueft. Dieser Bericht dokumentiert eine interne Bildkontrolle, keine persoenliche Nutzerabnahme.
