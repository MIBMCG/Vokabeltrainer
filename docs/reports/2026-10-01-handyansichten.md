# Weitere Handyansichten und Tabellenprobe

Stand: 01.10.2026. Der Nutzer setzt nach der Pause ausdrücklich fort.
Beide lokalen/entfernten Zweige sind zu Beginn sauber und exakt auf
`e30792b854cd25c9cc6002fb3dc0c1a460460f8a`. Produkt `b440b5e`, Cache v43,
ist der Ausgang. Der vorhandene Arbeitsbaum `codex/purchase-batch-checks`
wird wiederverwendet; keine neue Bildgenerierung.

## Wiederaufnahme und Tabellenprobe

Der frühere Codex-Browsertab war geschlossen. Ein neuer Tab im selben
Codex-Browser stellt den gespeicherten Testbereich wieder dar: Kauftest,
2.040 Lernpunkte, Level 11, 40 verfügbare Punkte, gewählte Drachenstufe 4.
Die Avatarseite zeigt nach Wiederaufnahme keinen Aufruf zur neuen
Google-Anmeldung. Kein Einrichten, Import oder Kauf im bisherigen Bestand.
Dies ist eine sichtbare Wiederaufnahme nach längerer Pause; die genaue
serverseitige Token-Erneuerung wurde nicht protokolliert und bleibt getrennt
von einer kontrollierten Ablaufprüfung. Familien-Chrome blieb unangetastet.
Screenshot lokal: `.superpowers/diagnostics/resume-2026-10-01/existing-test-resumed.png`.

Der Nutzer hat derzeit keine Excel-Datei mit Vokabeln. Die weitere Probe
verwendet deshalb eine fiktive Tabelle in einem frischen lokalen Browserprofil:
zehn Wörter, zwei Ausgangswörter, Windows-Zeilenumbrüche, zwei bzw. drei
Tabellenspalten, Umlaute, Hinweise und zwei Lösungen für „Schüler“.
Die automatische Vorschau erscheint; eine neue Lektion „Beispiel – Schule und
Alltag“ wird Ada zugeordnet. Ein Speichern übernimmt alle zehn Wörter.
Nach Reload sind die zwölf Wörter, beide Antwortvarianten, alle Hinweise und
die Lektionszuordnung unverändert nachgewiesen. Im lokalen Durchgang rund
91 ms Vorschau und 76 ms Speicherung; das ist keine Google-Zeitmessung.

```powershell
$env:PLAYWRIGHT_MODULE='<Playwright-Modulpfad>'
$env:BROWSER_EXECUTABLE='<Edge-Programmpfad>'
node .superpowers/diagnostics/2026-10-01-sample-table.mjs
```

Die Tabelle wurde als ein `keyboard.insertText`-Ereignis in den lokalen
Browser eingebracht. Kein Lesen oder Ändern der Systemzwischenablage und
keine echte Excel-Bedienabnahme. Rohdaten und Screenshot unter
`.superpowers/diagnostics/sample-table-2026-10-01/`.

## Reproduzierte Layoutfehler

Die synthetische Edge-Prüfung betrachtet 45 Zustände: Profilwahl, Übungsstart,
Inselreise, Avatar, aktive Frage und Rückmeldung sowie Erwachsenenansichten
einschließlich der geöffneten Einstellungen. Drei Kombinationen:
320 × 568 normal, 390 × 844 bei 200 Prozent Schrift und 320 × 568 bei
200 Prozent. Die vergrößerte Schrift ist 32 px an der Dokumentwurzel;
kein echter mobiler Browserzoom, Touch- oder Tastaturtest.

| Ansicht | Breite / Schrift | Gemessene Seitenbreite vor Korrektur |
| --- | --- | --- |
| Übungsstart | 320 px / 200 Prozent | 356 px |
| Inselreise | 390 px / 200 Prozent | 452 px |
| Inselreise | 320 px / 200 Prozent | 444 px |
| Avatar | 390 px / 200 Prozent | 468 px |
| Avatar | 320 px / 200 Prozent | 460 px |

Alle normalen 320-px-Seiten passen. Aktive Frage und Rückmeldung sowie
Vokabeln, Lernstand, Lernregeln und Einstellungen passen auch bei großer
Schrift in die Dokumentbreite. Einzelne transformierte Porträtbilder innerhalb
ihrer beabsichtigten Bildausschnitte und das intern scrollbare Statistikdiagramm
haben außerhalb liegende Elementrechtecke, ohne die Seite zu verbreitern.
Diese Befunde werden nicht als Seitenüberlauf behandelt.

Der erste Diagnoseablauf stoppte wegen eines zu breit gefassten Selektors für
verschachtelte Aufklappüberschriften. Nach Korrektur auf die unmittelbare
Überschrift lief der volle Ablauf erfolgreich. Das war ein Fehler der
Messhilfe, keine Produktkorrektur. Die schreibgeschützte Prozessabfrage mit
`Get-CimInstance` war in der Sandbox nicht verfügbar; `Get-Process` und die
Agentinventur wurden stattdessen verwendet, ohne Prozesse zu beenden.

Messhilfe: `.superpowers/diagnostics/2026-10-01-phone-flows.mjs`, Ergebnisse
und Vorherbilder: `.superpowers/diagnostics/phone-flows-2026-10-01/`.
Die unabhängige Wiederholung der 45 Zustände gegen die korrigierte CSS-Datei
im isolierten Arbeitsbaum findet keinen Dokumentüberlauf mehr: alle Seiten
haben exakt die Breite des jeweiligen Testfensters. Die anschließende
Sichtprüfung zeigt jedoch noch zu schmale Abzeichenspalten: Wörter brechen bei
320 px und 200 Prozent fast buchstabenweise um. Dieser Lesbarkeitsbefund geht
vor dem unabhängigen Review zur Korrektur zurück. Nachher-Rohdaten der ersten
CSS-Runde:
`.superpowers/diagnostics/phone-flows-after-2026-10-01/results.json`.

Die Bedienungsanleitung enthält außerdem fünf direkt kopierbare Wortpaare
mit Tabulatoren. Der vorhandene Tabellenweg ist damit auch ohne eine
vorbereitete Excel-Datei erklärt; es wurde keine neue Importfunktion eingeführt.

Der begrenzte Reparaturauftrag liegt unter
`.superpowers/sdd/2026-10-01-mobile-child-layout/`. Er erhält Schriftgrößen,
Bedienfunktionen, Bildausschnitte und alle Daten; keine weitere Produktlogik.
## Umsetzung und Sichtkorrektur

Die Kinderansichten verwenden begrenzte Rasterspalten und gezielte
Mindestbreiten. Lange Beschriftungen bleiben vollständig sichtbar; bei
320/390 px und 200 Prozent stehen Abzeichen in einer Spalte. Bei normaler
Schrift bleiben auf 320 px zwei Spalten erhalten. Der Galeriebutton
„Entwicklung“ passt nach leicht engerem Zeichenabstand auch bei 320 px und
200 Prozent auf eine Zeile. Schriftgrößen und Mindesthöhen bleiben erhalten.
Produkt-JavaScript, Datenformate, Punkte, Kaufregeln und Bilder ändern sich nicht.

Die unabhängige abschließende Nachprobe betrachtet 20 Zustände auf dem letzten
CSS-Stand: Profilwahl, Übungsstart, Inselreise und Avatar bei 320/390/1280 px
normal sowie 320/390 px mit 200 Prozent Schrift. Alle Dokumentbreiten stimmen
mit dem Testfenster überein. Die gescrollten Viewportbilder sind visuell geprüft:
Abzeichen sind lesbar, Galerie- und klassische Auswahl bleiben sichtbar.
Rohdaten: `.superpowers/diagnostics/phone-flows-final-2026-10-01/results.json`.

Zwei ältere Auswahltests erwarteten ein klassisches Aufklappelement, das der
unveränderte JavaScript-Ausgangsstand bei einer gewählten Entwicklungsfigur
absichtlich nicht rendert. Die Teststeuerung folgt jetzt der vorhandenen
bewussten Klassisch-Auswahl. Beide Fälle bestehen einzeln; dies ist eine
Testkorrektur und keine Änderung am Produktablauf.

Die feste untere Navigation verwendet schon im Ausgangsstand drei Spalten.
Bei 200 Prozent und 320 px bricht Edge dort einige längere Beschriftungen
zeichenweise um. Der begrenzte Reparaturschritt gestaltet diese Navigation
nicht neu. Echte Safari-/Handybedienung bleibt gesondert zu prüfen.

## Finale automatisierte Prüfung

Erster lokaler Produktcommit: `89dd33a94925ed4665db39cfb19d2f421f35eb1f`.
Die neue Browserregression scheitert zuerst an der ursprünglichen 356-px-Seite
bei 320 px und 200 Prozent. Nach Korrektur besteht sie auf dem finalen CSS-Stand
bei 320/390 px mit großer Schrift sowie 320/390/1280 px normal. Sie prüft
Dokument- und Bediengrenzen, Abzeichenspalten/Lesebreite, „Entwicklung“ auf
einer Zeile, Navigation, Antworten und Erhalt nach Neuladen.

Elf gezielte Browserfälle bestehen abschließend, einschließlich
Erwachsenenimport, sichtbarer menschlicher Farbwahl, Klassisch-Wechsel,
Kauffokus, Rundenfortsetzung, Inselreise, Offline-Neustart, abgewiesenem
Cacheaufbau und kontrolliertem Update. Die vollständige Node-Suite besteht
frisch mit 662/662; der Prozess endet mit 0. Dieser Lauf liegt vor der
nachfolgend beschriebenen reinen CSS-Korrektur am verbundenen Commerce-Bereich.
Die Diff-Prüfung ist sauber.

```powershell
node --test --experimental-test-isolation=none --test-name-pattern='child practice|adult vocabulary import|selected human colours|selected girl appearance|purchase UI stays|trainer practice is resumable|trainer rewards render|trainer offline starts|trainer offline update|C2 rejected|required|update notice follows' tests/browser/mobile-child-layout.browser.mjs tests/browser/mobile-import-layout.browser.mjs tests/browser/avatar-selection.browser.mjs tests/browser/purchases.browser.mjs tests/browser/status-feedback.browser.mjs tests/browser/trainer.browser.mjs
npm test
```

Beide Befehle laufen im Arbeitsbaum `codex/purchase-batch-checks` mit den oben
genannten Runtimevariablen. Rohprotokolle dort:
`test-results-child-targeted-final.log` und `test-results-child-node-final.log`.
Umsetzungsbericht und unabhängige Reviews lokal unter
`.superpowers/sdd/2026-10-01-mobile-child-layout/`.

## Reviewhinweis und verbundener Commerce-Bereich

Das erste Aufgabenreview bewertet Spezifikation und Qualität als bestanden,
ohne blockierenden Befund, weist jedoch auf eine Nachweislücke bei Shop und
Kaufvorschau mit 200 Prozent Schrift hin. Die gezielte Zusatzprüfung findet
tatsächliche Fehler, die in den unverbundenen Standardansichten nicht sichtbar
waren:

| Verbundener Zustand | Schrift / Breite | Befund vor Zusatzkorrektur |
| --- | --- | --- |
| Entwicklung | 200 Prozent / 320 px | 333 px Dokumentbreite; nächste Entwicklung zu breit |
| Shop | 200 Prozent / 320 px | 344 px Dokumentbreite; Freischaltbutton zu breit |
| Kaufvorschau | 200 Prozent / 320 und 390 px | Punkteangaben außerhalb des sichtbaren Dialogs, rechts bis 486 px |

390-px-Entwicklung und Shop haben keinen Dokumentüberlauf. Der Dialogbefund
zeigt, weshalb eine passende Seitenbreite allein keine vollständige
Bedienabnahme ersetzt. Alle acht angefragten Zustände sind in einem
synthetischen verbundenen Fixture erhoben, ohne Kaufbestätigung.

Der diagnostische Lauf endet nach den Messungen durch Timeout. Seine
Geometriedaten belegen die Fehler; der Lauf ist kein bestandener Test und
keine Kaufzeitmessung. Rohprotokoll:
`test-results-child-connected-commerce.log` im Arbeitsbaum; JSON und Bilder
unter `test-results/purchases-task5/`. Der gezielte minimale CSS-Nachschliff
und eine regulär abgeschlossene Nachprüfung folgen im selben Cache-v44-Paket.
Das ursprüngliche TDD-Fehlerprotokoll wurde nicht als Datei gespeichert; die
unabhängige Vorhermessung und Vorherbilder liegen dauerhaft lokal vor.

Der zusätzliche Produktcommit `ef17de83ade47b5d4259fe4d96787a9d847f126f`
korrigiert diese Ursachen mit begrenzten Rasterspalten, lesbarem Umbruch
langer Kartenüberschriften/Buttons und einer einspaltigen Dialogübersicht.
Der schmale Dialog überschreibt die Standard-Maximalbreite des Browsers
und erhält gezielt kleinere Außen-/Innenabstände, damit seine vorhandenen
Schaltflächen genug Platz haben. Schrift und Mindesthöhe bleiben erhalten.

Die Nachprüfung kontrolliert zusätzlich Text- und Dialoginnenbreiten sowie
beide fokussierten, gescrollten Dialogaktionen. Alle acht verbundenen Zustände
bei 320/390 px und 200 Prozent bestehen ohne äußeren oder inneren Überlauf.
Der finale Lauf mit fünf betroffenen Browser-/Updatefällen endet regulär
mit 5/5 PASS und Exit 0. Log: `test-results-child-commerce-final.log` im
Arbeitsbaum. Vollständig sichtbare Preise und Dialogaktionen sind in den
Viewportbildern unter `test-results/purchases-task5/` nachgewiesen.

Ein Aussetzer vor dem Commerce-Ablauf ist als Race der Teststeuerung geklärt:
Nach Reload war die Avataransicht noch nicht montiert, als der Test sofort
per `count()` den Profilwechsel abfragte. Er wartete dadurch auf das falsche
Erwachsene-Element. Jetzt wartet er auf den tatsächlich wiederhergestellten
Profilwechsel-Button. Es gab keine entsprechende Änderung im Produkt-JavaScript.
Zwei Patchversuche stoppten wegen Timeout der automatischen Berechtigungsprüfung,
ohne Ablehnung oder Dateiveränderung; ein einzelner freigegebener Dateibefehl
führte die begrenzte CSS-Änderung aus. Globale Einstellungen wurden nicht geändert.

## Unabhängiger Abschluss und Bereitstellung

Die frische, auf den Commerce-Nachschliff begrenzte Nachprüfung bestätigt alle
Korrekturen. Das anschließende Gesamtbranchreview betrachtet den vollständigen
Bereich `e30792b..ef17de8`: keine kritischen oder wichtigen Befunde,
Freigabe zur Integration. Das fehlende ursprüngliche RED-Textprotokoll und die
physische Geräteabnahme bleiben ausdrücklich begrenzte Nachweise. Die bestehende
Navigation mit Zeichenumbrüchen wird als nicht blockierende Lesbarkeitsgrenze
bewertet. Keine unveränderten Tests im Review erneut ausgeführt.

Produkt `ef17de83ade47b5d4259fe4d96787a9d847f126f` ist per Fast-Forward in
den Entwicklungszweig integriert. 387 öffentliche Dateien vorbereitet,
zwei hochgeladen. Worker `c8223625-5a08-4718-9bf5-ae0952c8855c` ist laut
Anbieter seit 01.10.2026, 10:30:29.253 UTC zu 100 Prozent aktiv. Die sieben
ausgelieferten Dateien `trainer/sw.js`, `trainer/styles.css`,
`trainer/index.html`, `src/trainer/main.js`, `src/trainer/ui/rewards.js`,
`src/trainer/ui/practice.js` und `src/trainer/config.js` stimmen um
10:32:32.061 UTC bytegleich mit dem geprüften Bereitstellungspaket überein.
Der Vergleich berücksichtigt die bekannte Serverkonfiguration im Paket.
Provider-, Upload- und Hashprotokolle lokal unter
`.superpowers/deployment-2026-10-01-mobile-child/`.

Im vorhandenen Codex-Testbrowser ist das kontrollierte Update übernommen.
40 verfügbare Punkte, 2.040 Lernpunkte, Level 11 und gewählte Drachenstufe 4
sind erhalten. Der kurz angezeigte Google-Hinweis verschwindet ohne neue
Anmeldung. Keine Bestandsübernahme, Einrichtung oder Käufe; Familien-Chrome
unangetastet. Screenshot: `existing-test-updated.png` im Bereitstellungsordner.

Beide lokalen und entfernten Zweige sind nach Push exakt auf `ef17de8`
bestätigt. Der abschließende Dokumentationscommit folgt separat auf beiden
Zweigen. [Aktuelle Übergabe](../handoffs/2026-10-01-handyansichten.md).
