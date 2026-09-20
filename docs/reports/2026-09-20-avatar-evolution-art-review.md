# Unabhängige Bildprüfung: erste Drachen-Entwicklungsreihe

Stand: 20.09.2026. Geprüft wurden der helle/dunkle 256-Pixel-QA-Bogen, die bestätigte Stilreferenz `dragon-stages-concept-v2.png`, `source-check.json` und die vier ausgewählten transparenten Quellen:

- `dragon-stage-1-v3.png`
- `dragon-stage-2-v3.png`
- `dragon-stage-3-v1.png`
- `dragon-stage-4-v2.png`

## Sichtbefund

Die Reihe ist als zusammengehörige Entwicklung klar lesbar. Stufen 1 bis 3 behalten Körperbau, Blickrichtung, Grün-Gold-Farbwelt und Grundsilhouette bei; Rüstung, Runen und Kristalle steigern sich nachvollziehbar. Stufe 4 bleibt durch Kopf, Farbwelt, Brustpanzer und Flügelform als derselbe Drache erkennbar, wechselt aber deutlich in eine mythische Endform.

Der Sprung von Stufe 3 zu 4 ist stark genug: Geweihartige Goldhörner, leuchtende Mähne, Sternbildflügel, Runenleuchten, veränderte aufrechte Silhouette und der große magische Schweif sind bereits bei 256 Pixeln unmittelbar sichtbar. Die Endform wirkt nicht wie eine weitere aufgesetzte Rüstungsschicht.

Bei keiner Stufe sind schwebende Kleidungs- oder Rüstungslagen erkennbar. Brust-, Schulter- und Beinteile folgen Körperhaltung und Gelenken. Figuren, Füße, Schwanz und beide Flügel sind in den QA-Ansichten vollständig erkennbar; keine wichtige Gliedmaße oder Flügelspitze wirkt abgeschnitten.

Auf hellem und dunklem Grund bleiben Außenkonturen, Flügelmembranen und feine Gold-/Türkisdetails gut lesbar. Es sind keine rechteckigen Hintergründe oder groben Freistellungsreste sichtbar. In der Originalansicht zeigen einzelne Kanten eine sehr schmale farbige Antialias-Zone; bei der geprüften Zielgröße 256 Pixel fällt sie nicht störend auf. `source-check.json` bestätigt RGBA, Alpha 0 bis 255 und große vollständig transparente Bereiche bei allen vier Quellen. Bei Stufe 4 reichen einzelne teiltransparente Randpixel bis an linken und unteren Leinwandrand, während die deckenden Bildanteile innerhalb der Leinwand bleiben; im QA-Bogen ist dadurch keine sichtbare Abschneidung entstanden.

Stufe 4 wirkt im gleich großen QA-Feld etwas kompakter als Stufen 1 bis 3, weil ihre Quelle quadratisch und ihre Pose breiter ist. Die stärkere Silhouette und Magie gleichen das in der 256-Pixel-Prüfung aus. Bei der späteren echten Kartenansicht sollte die relative Skalierung dennoch bewusst geprüft werden, ohne Flügel oder Schweif zu beschneiden.

## Urteil und Grenzen

**Bildurteil: für die erste technische Produktionsreihe freigegeben, kein blockierender Sichtbefund.** Die vier Quellen erfüllen die geprüften Anforderungen an vollständige Gesamtbilder, klare Entwicklung, Wiedererkennbarkeit und eine deutlich epischere vierte Stufe.

Diese Prüfung ist eine unabhängige interne Sichtprüfung, keine persönliche Nutzerabnahme. Die Bilder sind noch nicht in der Produktoberfläche eingebunden; tatsächliche Kartengrößen, Browser-Fallback, Service-Worker-Verhalten, iPhone/iPad-Darstellung und die übrigen 72 Motive wurden hier nicht geprüft.
