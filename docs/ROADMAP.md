# Roadmap zur ersten nutzbaren Version

Stand: 16.09.2026. **Vorgeschlagene Arbeitsreihenfolge, kein freigegebener Implementierungsplan.** Die Punkte beschreiben überprüfbare Ergebnisse, ohne offene Nutzerentscheidungen vorwegzunehmen.

## 0. Projektwissen übergabefähig machen

Ergebnis dieses Arbeitspakets: README, AGENTS.md, Anforderungen, Entwurf, Einrichtungshinweise, Abnahmeplan und Übergabe im Repository. Prüfung: [Dokumentationsbericht](reports/2026-09-16-dokumentation.md).

## 1. Produktdesign konkret abstimmen

- Erledigt: „Letzte“ = zuletzt hinzugefügte Lektion, „Neue“ = vom ausgewählten Kind noch nie geübte Wörter.
- Erledigt: standardmäßig 10 Antworten pro Runde, wahlweise 20 oder 30; Wiederholungen zählen mit, Fortschrittsbalken.
- Erledigt: Richtigserie je Wort und Kind über Runden hinweg speichern; ein Fehler bei diesem Wort setzt dessen Serie auf null.
- Erledigt: Nach drei richtigen Antworten das Wort für den Rest der laufenden Runde pausieren; Wiederholung frühestens am nächsten Tag, nach richtigen Wiederholungen mit Abständen von 3, 7 und danach jeweils 14 Tagen.
- Erledigt: Nach einem Fehler zwei andere Aufgaben bearbeiten, dann erneut abfragen. Bei vorherigem Rundenende Wiederholungsbedarf vormerken; keine Verlängerung der gewählten Rundengröße.
- Erledigt: Bei erschöpfter Auswahl entscheidet das Kind zwischen Beenden und Fortsetzen mit zusätzlichem Wortschatz; Aufgabenzahl und Wiederholungspausen bleiben erhalten.
- Erledigt: Groß-/Kleinschreibung und äußere Leerzeichen ignorieren, echte Buchstabenfehler als falsch werten, korrekte Schreibweise anzeigen.
- Erledigt: Mehrere von Erwachsenen hinterlegte Übersetzungen/Schreibvarianten je Vokabel zulassen; jede hinterlegte Variante zählt richtig.
- Erledigt: Lernreise/Landkarte, Punkte/Level/Abzeichen und einfachen gestaltbaren Avatar mit wenigen Farben und Zubehörteilen für die erste Version als gemeinsames System vorsehen.
- Erledigt: Insel-Abenteuer mit unterschiedlichen Landschaften als Thema wählen; modern und passend für 10–13-Jährige gestalten.
- Erledigt: 10 Punkte je richtiger Antwort, auch für später richtig beantwortete Fehlerwörter, plus 20 Punkte je abgeschlossener Runde. Keine Punktabzüge bei Fehlern.
- Erledigt: Level-Meilensteine schalten Reiseabschnitte und festgelegte Avatar-Ausstattung automatisch frei; freigeschaltete Ausstattung frei auswählbar, Abzeichen für Meilensteine, kein zusätzlicher Münzladen.
- Konkrete Grafiken, Umfang der Welt, Schwellenwerte und Abschluss-Sonderfälle festlegen.
- Umfang der Erwachsenenansicht und Wortlistenverwaltung bestimmen.
- Erledigt: Einzeleingabe und Kopieren/Einfügen mehrerer Tabellenzeilen; Wörter vorhandenen oder neuen benannten Lektionen zuordnen. Kein direkter Excel-/CSV-Dateiimport in der ersten Version.
- Erledigt: Erwachsene ordnen jede Lektion einem oder mehreren Kindern zu. Übungsmodi berücksichtigen nur die jeweils zugeordneten Lektionen; Lernstände, Punkte und Avatar bleiben pro Kind getrennt.
- Erledigt: Erwachsenenansicht über „Für Erwachsene“ mit selbst festgelegter vierstelliger PIN öffnen. Einrichtungs- und Wiederherstellungsablauf im Detaildesign festlegen.
- Erledigt: Erneutes Verbinden mit Google bei Bedarf grundsätzlich akzeptiert; mit vorhandenem Wortschatz offline weiterüben und später automatisch abgleichen. Die reale Bedienbarkeit bleibt nachzuweisen.
- Erledigt: Bei widersprüchlichen Vokabeländerungen beide Fassungen erhalten und die richtige Fassung in der Erwachsenenansicht auswählen lassen. Übungsergebnisse beider Geräte ohne doppelte Wertung erhalten.

Ergebnis: ein prüfbares Design mit klaren Grenzen der ersten Version. Die Gerätefrage Q9 ist als Bestandsaufnahme beantwortet: Der Nutzer hat keine eigenen Apple-Geräte, sein Freund als künftiger Hauptnutzer besitzt iPhone und iPad. Offene Gesprächspunkte beginnen bei [Q11b](ANFORDERUNGEN.md#offene-entscheidungen) zur zusätzlichen Sicherungsdatei. Der Nutzer hat festgelegt, alle offenen Punkte einzeln mit Optionen und Empfehlung zu klären und Antworten fortlaufend zu dokumentieren. Nach vollständiger Klärung ist der Entwicklungsbeginn beauftragt. Eine visuelle Vorschau kann helfen; sie wurde noch nicht erstellt oder ausgewählt.

## 2. Google Drive auf iOS früh nachweisen

Nach Abstimmung einer eng begrenzten Probe die Anmeldung, den Zugriff auf synthetische Dateien, das Wiederfinden auf zwei Geräten und erneutes Verbinden testen. Safari-Tab und Home-Bildschirm-App separat prüfen.

Für echte Apple-Gerätetests kommen die Geräte des Freundes infrage. Modelle, Betriebssystemversionen und Testverfügbarkeit noch klären; vorhandene Geräte nicht mit zugesagter Testteilnahme verwechseln.

Ergebnis: technischer Prüfbericht und eine konkrete Aussage zum Anmeldekomfort. Wenn die geforderte Bedienung mit der vorgeschlagenen direkten Browseranbindung nicht ausreichend erreichbar ist, die Abweichung mit dem Nutzer klären, bevor umfangreiche Produktarbeit davon abhängig gemacht wird.

## 3. Detaildesign und Implementierungsplan

Mit den Produktentscheidungen und den Ergebnissen der technischen Probe das Datenschema, Syncverfahren, Fehlerverhalten und die Modulgrenzen festlegen. Danach einen ausführbaren Plan mit konkreten Dateien, Schnittstellen und passenden Tests schreiben.

Ergebnis: abgestimmtes Detaildesign und umsetzbarer Plan. Dieses Dokument ersetzt beides nicht. Falls Superpowers verwendet wird, ist an dieser Stelle der Skill `writing-plans` passend; andere KIs können gleichwertig vorgehen.

## 4. Lokaler Trainer

Lernprofile, Vokabelverwaltung, Übungsablauf, Antwortprüfung, Wiederholungssteuerung und Fortschrittsanzeige umsetzen. Danach die gewählte Gamification integrieren. Lokal gespeicherte Daten müssen Neustarts überstehen.

Ergebnis: offline bedienbare Kernfunktionen mit geprüfter Lernlogik und synthetischen Beispielvokabeln.

## 5. Synchronisation, Offlinefunktion und Updates

Die nachgewiesene Google-Anbindung produktfähig integrieren, ausstehende Änderungen erhalten und Konflikte nachvollziehbar behandeln. PWA-Installation, Offlinebereitstellung und Aktualisierungen prüfen.

Ergebnis: Eltern- und Schülergerät tauschen Vokabeln und Lernstände im definierten Umfang ohne manuelle Dateiübertragung aus. Abgelaufene Zugriffe werden verständlich behandelt.

## 6. Geräteabnahme und Bereitstellung

Die [Prüfmatrix](QUALITAET-UND-ABNAHME.md) durchführen, offene Befunde beheben, Einrichtungs- und Nutzungsanleitung auf die echte App aktualisieren. Eine Veröffentlichung der laufenden App mit dem Nutzer abstimmen; der bisherige Pushauftrag bezieht sich auf die Dokumentation.

Ergebnis: nachvollziehbar geprüfte erste Version, klare Geräte-/Versionsgrenzen und ein dokumentierter Weg zur Wiederaufnahme auf einem anderen System.
