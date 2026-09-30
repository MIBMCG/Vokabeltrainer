# Mengenprüfung der Tabellenübernahme

Stand: 30.09.2026, geprüfter Hauptzweig `32b00360dee25912cfb78a6da690b5c77f8d0740`.
Der Nutzer setzt nach dem Galerieabschluss die übrigen Optimierungen fort.
Vorrang bleibt die Übernahme vieler Wörter aus Excel oder einer anderen Tabelle.
Dieser Schritt untersucht den bestehenden Ablauf; Produktcode und Cache v41
wurden nicht verändert oder erneut bereitgestellt.

## Aufbau und Prüfgrenzen

Der vorhandene `createTrainerHarness` startet Edge im Headless-Modus mit
isolierten synthetischen Browserkontexten. Je Fall werden ein Testprofil,
eine zugeordnete Lektion und zwei Ausgangswörter angelegt. Hinzu kommen
100 beziehungsweise 500 eindeutige synthetische Deutsch-/Englisch-Zeilen.
Familienbestand, vorhandener Codex-Testbereich, echte PIN und Google-Anmeldung
werden nicht verwendet. Alle Google-Anfragen im Abgleichfall beantwortet
die vorhandene lokale Test-Fixture; es findet kein echter Drive-Upload statt.

Die temporäre Messhilfe samt JSON-Ergebnissen und CPU-Profil liegt lokal unter
`.superpowers/diagnostics/2026-09-30-large-import*`. Sie ist kein Produktmodul.
Der erste Browserstart scheiterte an `spawn EPERM` im Sandboxkontext; danach
lief dieselbe isolierte Prüfung über den erlaubten erweiterten Ausführungsweg.

## Eingabeereignisse richtig unterscheiden

Die erste Messung mit Playwright `fill()` ergab 957 ms Vorschau für 100 und
26.605 ms für 500 Zeilen. Eine gezielte Wiederholung mit CPU-Profil zeigte
bei 500 Zeilen **999 Eingabeereignisse**, zusammen rund 26.207 ms in deren
Handlern; der gesamte Vorschauaufruf benötigte 27.398 ms. Wiederholtes Erzeugen
und Entfernen der Formularelemente dominiert diesen Lauf.

Diese Zeiten sind **kein belegter echter Excel-Einfügevorgang**. Zur Trennung
des App-Aufwands von der Eingabesteuerung wurde der komplette Tabellenwert
gesetzt und genau ein synthetisches `input`-Ereignis mit `insertFromPaste`
ausgelöst. Zwei Animationsframes nach der fertigen Zusammenfassung sind in
der Vorschauzeit enthalten. Auch diese Variante ist eine Ereignissimulation,
keine Prüfung einer echten Zwischenablage oder eines physischen Handys.

| Zeilen | Vorschau inklusive Frames | Eingabehandler | Lokales Speichern | Nach Reload vorhanden |
| --- | ---: | ---: | ---: | ---: |
| 100 | 64 ms | 6 ms | 87 ms | 100 zusätzliche Wortereignisse |
| 500 | 90 ms | 23 ms | 253 ms | 500 zusätzliche Wortereignisse |

In beiden Fällen war die Übernahme freigegeben. Bei 320, 390 und 768 Pixel
Breite wurde kein horizontaler Überlauf gemessen. Gezählt wurden die neuen
Wortereignisse vor und nach einem Neuladen; dies ist kein vollständiger
inhaltlicher Vergleich einer echten Nutzerliste. Die vorhandenen Prüfungen
für Mehrdeutigkeiten, Duplikate und Korrekturfokus wurden nicht neu ausgeführt.

## Simulierter Google-Abgleich

Anschließend wurden frische synthetische Lernbereiche verbunden und vor der
jeweiligen Übernahme vollständig abgeglichen. Nur für den folgenden Import
verzögert eine vorgeschaltete lokale Route jede Google-Anfrage um 500 ms.
Gemessen wird vom Speicherklick bis zur Leerung von Outbox und Paketwarteschlange.

| Zeilen | Lokales Speichern | Bis Warteschlange leer | Google-Anfragen |
| --- | ---: | ---: | ---: |
| 100 | 87 ms | 30.399 ms | 25 |
| 500 | 220 ms | 22.352 ms | 41 |

Beide Läufe leerten die Warteschlange und erhielten die erwartete Anzahl
gespeicherter Wörter nach Neuladen. Die Zeit für 100 Zeilen liegt trotz weniger
Anfragen höher; die Messung enthält weitere Laufzeit-/Schedulinganteile und
belegt keine lineare Skalierung. Sie wird nicht als kontrollierter Vergleich
zwischen den beiden Mengengrößen verwendet. Auch 22,4 Sekunden für 500 Zeilen
sind ein einzelner synthetischer Lauf, keine reale Google- oder Handyabnahme.

## Herleitung des nächsten begrenzten Vorschlags

`src/trainer/sync/packets.js` begrenzt Pakete auf 100 Ereignisse und 64 KiB.
`uploadPending` in `src/trainer/sync/drive.js` bearbeitet jeweils nur ein Paket:
Datei-ID erhalten, lokal sichern, hochladen und nachprüfen, lokal bestätigen.
Der 500-Zeilen-Lauf überträgt sechs Pakete mit je vier Google-Anfragen, also
24 seiner 41 Anfragen in dieser seriellen Phase. Die vorbereitenden Prüfungen
bleiben davon getrennt.

Vorgelegter kurzer Entwurf: bis zu drei bereits vorbereitete Lernpakete zugleich
übertragen, jede ID vor ihrem Upload dauerhaft speichern und jede Datei wie
bisher nachprüfen. Bestätigte Teilübertragungen bleiben erhalten; Fehler dürfen
keine unbestätigten Pakete verschwinden lassen oder Folgeversuche überholen.
Die Paketgrenzen und -inhalte bleiben identisch. Konto-/Lernbereichsprüfung,
Download, Epochenveröffentlichung und Kaufabgleich behalten ihre Reihenfolge.

Der Nutzer bestätigt diesen konkreten Entwurf mit „Ja, so umsetzen“. Nun
gezielt Teilfehler, verlorene Antworten, Wiederholung, Paketabhängigkeiten und
Erhalt der Wörter prüfen; dieselbe 500-Zeilen-Messung vor und nach der Änderung
vergleichen. Keine Laufzeitzusage aus der theoretischen Parallelität ableiten.

Für die Praxisabnahme fehlen weiterhin eine typische echte Wortliste mit
Lektions-/Kinderzuordnung sowie Tests auf physischen Smartphones. Die getrennte
Optimierung der Lernbereichsübernahme bleibt zurückgestellt und unfreigegeben.
