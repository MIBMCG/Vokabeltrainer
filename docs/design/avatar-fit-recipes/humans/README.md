# Rasterrezept für die beiden menschlichen Avatare

Dieses Rezept repariert die zehn kompatiblen Ausrüstungsartikel für
`explorer-girl` und `explorer-boy`. Eingaben sind ausschließlich die PNG- und
JSON-Dateien aus Git-Stand `24ce5a3`. `scripts/avatar-fit/humans.py` registriert
die alten Quellen einmalig auf der 1086×1448-Leinwand, entfernt schwache
Alpha-Reste und schreibt alle Ergebnisse mit Identitätsregistrierung.

Die drei Kopfbedeckungen, Ritterrüstung und Medaillon saßen in der großen
Einzelansicht bereits nachvollziehbar am Kopf beziehungsweise Körper. Ihre
Geometrie bleibt deshalb erhalten; nur Registrierung und schwache Alpha-Reste
werden auf die gemeinsame Vollcanvas-Darstellung normalisiert. Fernglas und
Kompass werden aus ihrem vollständigen gemalten Original auf 60 beziehungsweise
62 Prozent verkleinert und so unter der Hand angeordnet, dass der vorhandene
Ring am Fingerbereich liegt. Der Kristall-Kompass wird geringfügig versetzt.
Es werden weder Hautpixel in Ausrüstung kopiert noch Ersatzfinger gezeichnet.

Der Rucksack erhält als Vordergurte verkleinerte Ausschnitte seiner beiden
bereits gemalten Lederriemen einschließlich Schnallen. Der Sternenumhang wird
auf 78 Prozent der bisherigen Breite und 80 Prozent der Höhe gebracht. Seine
gemalten Kragenteile und der runde Metallverschluss bilden die Vorderlage; die
innere goldene Fläche wird als Halsöffnung ausgespart. Die Polygone dienen dabei
ausschließlich als weiche Freistellmasken für vorhandene Malerei; es werden
keine flachen Ersatzformen gezeichnet. Die
exakten Ausschnitte und Zielpositionen stehen in `recipes.json`; damit sind die
Eingriffe unabhängig vom aktuellen Arbeitsbaum reproduzierbar.

Die klassische Rasterbearbeitung wurde vom Nutzer am 20.09.2026 ausdrücklich
genehmigt. Sie ist kein neuer Bildgenerierungsdurchlauf und keine persönliche
visuelle Abnahme.
