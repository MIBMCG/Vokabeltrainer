# Große Wortlisten: Mengenprüfung und schnellerer Google-Abgleich

Stand: 30.09.2026, geprüfter Hauptzweig `32b00360dee25912cfb78a6da690b5c77f8d0740`.
Der Nutzer setzt nach dem Galerieabschluss die übrigen Optimierungen fort.
Vorrang bleibt die Übernahme vieler Wörter aus Excel oder einer anderen Tabelle.
Der Diagnoseabschnitt dokumentiert zunächst den unveränderten Stand v41.
Die anschließend bestätigte Optimierung ist inzwischen als Produkt `a530357`,
Cache v42, geprüft und privat bereitgestellt; Abschlussnachweise stehen unten.

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

## Kontrollierte Ausgangsmessung vor der Umsetzung

Auf unverändertem Produktcode in `62d60a4` wurde derselbe 500-Zeilen-Fall
zweimal wiederholt. Die Messhilfe protokolliert nun auch Start und Freigabe
jeder künstlich verzögerten Anfrage. Ergebnisse:

| Lauf | Vorschau | Lokal gespeichert | Warteschlange leer | Anfragen | Paketphase |
| --- | ---: | ---: | ---: | ---: | ---: |
| Vorher 1 | 91 ms | 227 ms | 22.512 ms | 41 | 13.766 ms |
| Vorher 2 | 91 ms | 221 ms | 22.393 ms | 41 | 13.624 ms |

Die Paketphase beginnt jeweils mit Anfrage 18, der ersten ID-Reservierung,
und endet mit der geleerten Warteschlange. Die vorgeschalteten 17 Anfragen
dauern rund 8,8 Sekunden. Die künstlichen 500-ms-Wartezeiten überschritten
in diesen Läufen nie 515 ms; beide Läufe stimmen eng überein. Alle 500 neuen
Wortereignisse bleiben nach Neuladen erhalten. Der Vergleich nach der Änderung
verwendet dieselbe Messhilfe und dieselben Einstellungen. Lokale Rohdaten:
`.superpowers/diagnostics/2026-09-30-large-import-controlled-before.json`.

## Vergleich mit vollständig beendetem Ausgangsabgleich

Die erste Nachmessung ergab 7.504/7.393 ms, jedoch nur 28 statt 41 Anfragen.
Sie wird **nicht als Vorher-/Nachhervergleich verwendet**: Die sichtbare
Abgleichanzeige erschien bereits, während der Anlege-/Abgleichvorgang noch
auslief. Der neue Import konnte dadurch in dessen spätere Uploadphase fallen.
Die Messhilfe wartet jetzt zusätzlich auf eine Sekunde ohne laufende oder
neue Google-Anfragen und prüft den sichtbaren Status `synced`, bevor der Import
beginnt. Anschließend wurden beide Codestände mit identischem Aufbau geprüft.

| Lauf | Lokal gespeichert | Warteschlange leer | Anfragen | Paketphase |
| --- | ---: | ---: | ---: | ---: |
| Vorher 1 | 256 ms | 22.417 ms | 41 | 13.669 ms |
| Vorher 2 | 244 ms | 22.327 ms | 41 | 13.584 ms |
| Nachher 1 | 234 ms | 13.963 ms | 41 | 5.236 ms |
| Nachher 2 | 228 ms | 13.816 ms | 41 | 5.167 ms |

Die mittlere Gesamtzeit sinkt in dieser Simulation von **22,372 auf 13,890
Sekunden (37,9 Prozent)**. Alle vier Läufe enthalten dieselben 17 vorbereitenden
Anfragen und sechs Pakete mit je vier Anfragen; im neuen Code laufen die
Pakete in zwei Dreiergruppen. Die künstlichen Verzögerungen liegen höchstens
bei 516 ms. Vorschauzeiten bleiben bei 90–91 ms.

Zusätzlich wird für jede lokale Wortereignis-ID genau ein Vorkommen in den
hochgeladenen Fixturepaketen geprüft: 500 neue und zwei Ausgangswörter.
Jeweils 500 neue Wortereignisse bleiben nach Neuladen erhalten; keine
unerwarteten Netzaufrufe und kein Überlauf bei 320/390/768 Pixel. Beide
Messprogramme enden mit Exit 0. Rohdaten:
`.superpowers/diagnostics/2026-09-30-large-import-settled-before.json` und
`-settled-after.json`. Nachher-Code ist der stabile Arbeitsstand des
begrenzten Uploadpakets; unabhängige Reviews und Bereitstellung folgen separat.
Dies bleibt eine lokale Simulation mit 500 ms Zusatzlatenz je Anfrage;
die tatsächliche Google-Dauer und echte Excel-/Handybedienung sind offen.

## Implementierung und lokale Prüfungen

Implementierungscommit `a5303575ca2703e1aeac115226210f76f772f535` auf
`codex/purchase-batch-checks`, Basis `62d60a4`. `uploadPending` arbeitet jetzt
in Gruppen von höchstens drei Vorgängen. Die Grenze umfasst ID-Erzeugung,
dauerhafte Reservierung, überprüften Upload und lokale Bestätigung. Jede
Gruppe wird vollständig beendet; ein Fehler verhindert die nächste Gruppe.
Erfolgreiche Dateien bleiben bestätigt, fehlerhafte mit ihrer ID wiederholbar.
Vor jeder weiteren Gruppe werden Zustand und Quarantäneliste frisch gelesen.
Paketformat, 100-Ereignis-/64-KiB-Grenzen, Prüfschritte und Reihenfolge des
übergeordneten Abgleichs bleiben unverändert. Cache v42 und die Browser-
Updatefixture v43 berücksichtigen die neue Laufzeitdatei.

Die zwei neuen deterministischen Parallelitäts-/Teilfehlertests scheiterten
zuerst am seriellen Ausgangscode mit einem statt drei gestarteten Uploads.
Anschließend bestehen sie; ein dritter Test prüft die Quarantäneänderung vor
der nächsten Gruppe. Die Tests prüfen außerdem vor Upload gespeicherte IDs,
vollständiges Warten bei Fehlern und Wiederholung ohne fehlende oder doppelte
Ereignisse. Der zunächst zu kurze Wartewächter dieses neuen Tests wurde nach
einem 661/662-Gesamtlauf korrigiert; die Produktlogik brauchte dafür keine
weitere Änderung.

- Gezielte Sync-/Paket-/Drive-Prüfung: **113/113 PASS**.
- Finaler `npm test` nach allen Änderungen: **662/662 PASS**, Exit 0.
- Sechs ausgewählte Browserfälle: **6/6 PASS**; direkter Tabellenimport mit
  sofortigem Abgleich, allgemeiner Sync-/Restore-Flow, Offline-Neustart,
  abgewiesene Pflicht-Precache-Installation, kontrollierte Aktualisierung und
  Updatehinweis.
- `git diff --check` und Indexprüfung ohne Befund, Arbeitszweig sauber.

Lokale Logs im Arbeitsbaum unter `test-results/learning-upload-*`; genauer
Task-Bericht und unabhängige Reviewunterlagen unter
`.superpowers/sdd/2026-09-30-learning-upload-concurrency/` im Hauptarbeitsplatz.
Die beiden 500-Zeilen-Nachmessungen verwenden exakt denselben Produktcode.
Review, Integration und Bereitstellung sind nachfolgend gesondert belegt.

Ausgeführte Prüfkommandos (Browserläufe mit den lokal vorhandenen
`PLAYWRIGHT_MODULE`- und `BROWSER_EXECUTABLE`-Werkzeugen):

```text
node --test --experimental-test-isolation=none tests/trainer/sync.test.js tests/trainer/packets.test.js tests/drive/*.test.js
npm test
node --test --experimental-test-isolation=none --test-name-pattern="trainer sync and restore exposes deliberate Google|trainer offline starts|trainer offline update UI|C2 rejected required precache|update notice follows actual waiting version" tests/browser/trainer.browser.mjs tests/browser/status-feedback.browser.mjs
node --test --experimental-test-isolation=none --test-name-pattern="import starts its bound Google sync before the old ten-second delay and drains the batch" tests/browser/vocabulary-entry.browser.mjs
```

## Unabhängige Prüfung, Bereitstellung und bestehender Testbereich

Taskreview: Spec PASS und Qualität Approved, keine Befunde. Breites
Abschlussreview: Ready to merge Yes, keine Befunde. Gesondert geprüft wurden
die Zusammensetzung gleichzeitiger Zustandsänderungen, verifizierte Drive-
Schreiboperationen, Single-flight, Abhängigkeiten zwischen Paketen und die
Cacheintegration. Unvollständige entfernte Paketabhängigkeiten verwenden
weiterhin die bestehende Quarantäne und spätere Wiederaufnahme; eine neue
Garantie stiller automatischer Fehlerbehebung ist nicht Teil dieses Pakets.

Der Hauptzweig `codex/vokabeltrainer-v1` wurde per Fast-Forward exakt auf den
geprüften Commit `a5303575ca2703e1aeac115226210f76f772f535` gebracht. Kein
zusätzlicher Produktdiff; deshalb keine Wiederholung derselben Gesamtsuite.
`npm run prepare:cloudflare` bereitete 387 öffentliche Dateien vor. Wrangler
4.142.0 lud genau zwei geänderte Dateien hoch: `trainer/sw.js` und
`src/trainer/sync/drive.js`; 385 waren bereits vorhanden. Der bestehende
geschützte Upload-Zugang funktionierte ohne neue Anmeldung.

Worker `2b88c625-3eab-4607-a7ce-969c9c4cdd68` ist laut anschließendem
`deployments list` seit 30.09.2026, 19:40:28.622 UTC zu 100 Prozent aktiv.
Um 19:40:59.409 UTC wurden die beiden geänderten Dateien sowie sieben direkte
Integrationsdateien von der HTTPS-App abgerufen und bytegenau mit dem
bereitgestellten Paket verglichen: **9/9 gleich**, Cachekennung v42 bestätigt.
Lokale Nachweise: `.superpowers/deployment-2026-09-30-learning-upload/` mit
`deploy.log`, `deployments.log` und `public-verification.json`.

Im bestehenden Codex-Testbrowser wurde nach Reload der Hinweis „Jetzt
aktualisieren“ angezeigt und bewusst übernommen. Danach sind 40 verfügbare
Punkte, 2.040 Lernpunkte, Level 11 und „Einfacher Drache – Stufe 4“ als gewählte
Figur erhalten. Kein neuer Import, Kauf, PIN-Schritt oder Google-Login.
Ein kurzer Verbindungshinweis direkt nach dem ersten Reload verschwand bereits
vor der Updateübernahme beim Abschluss der Sitzungswiederaufnahme. Dies ist
keine gesonderte Abnahme des natürlichen Tokenablaufs. Screenshot:
`.superpowers/deployment-2026-09-30-learning-upload/existing-test-after-update.png`.
Der Familien-Chrome blieb unberührt.

Nach dem autorisierten Push bestätigt `git ls-remote --heads` auf beiden Zweigen
`codex/vokabeltrainer-v1` und `codex/purchase-batch-checks` exakt den vollständigen
Produktcommit `a5303575ca2703e1aeac115226210f76f772f535`. Die abschließende
Dokumentation wird als nachfolgender Commit auf beiden Zweigen gesichert;
Schlüssel, echte Lernbestände und lokale Testartefakte sind nicht Teil des Pushs.
