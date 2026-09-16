# Arbeitsstand

Stand: **16.09.2026**

## Ergebnis dieses Arbeitspakets

Das Projekt ist als Dokumentationsgrundlage angelegt. README, AGENTS.md, Anforderungen, technischer Entwurf, Google-Einrichtung, Roadmap, Abnahmeplan und eine portable Übergabe sind vorhanden.

Repository: [MIBMCG/Vokabeltrainer](https://github.com/MIBMCG/Vokabeltrainer)

Arbeitsbranch für den Projektstart: `main`. Den aktuellen Commit mit `git log -1 --oneline` feststellen; den aktuellen Remote-Stand bei Wiederaufnahme prüfen.

Aktuelle Übergabe: [2026-09-16-anforderungsklaerung.md](docs/handoffs/2026-09-16-anforderungsklaerung.md)

Das erste Dokumentationspaket wurde als Commit `a646763` auf `main` veröffentlicht und gegen GitHub geprüft. Die laufende Anforderungsklärung ergänzt diesen Ausgangsstand; lokale Änderungen und weitere Commits bei Wiederaufnahme prüfen.

Prüfbericht: [2026-09-16-dokumentation.md](docs/reports/2026-09-16-dokumentation.md)

## Festgelegt

- Zielgruppe: 10–13 Jahre, Klassen 4–7.
- Deutsch anzeigen, Englisch schreiben, ✅/❌ mit Korrektur und „Weiter“.
- Häufigere Wiederholung falscher Wörter. Nach drei richtigen Antworten pausiert das Wort für den Rest der laufenden Runde.
- Die Richtigserie gilt je Wort und Kind über mehrere Runden hinweg. Ein Fehler bei diesem Wort setzt dessen Serie auf null; Antworten auf andere Wörter haben darauf keinen Einfluss.
- Nach der Dreierserie Wiederholung frühestens am nächsten Tag. Bei richtigen Wiederholungen danach Abstände von 3, 7 und 14 Tagen, anschließend jeweils 14 Tage; bei Fehler zurück ins häufigere Üben.
- Nach einem Fehler zwei andere Aufgaben bearbeiten, dann das Wort erneut abfragen. Endet die Runde vorher, bleibt die Wiederholung vorgemerkt; die gewählte Rundengröße wird nicht verlängert.
- Fehlt vor dem geplanten Rundenende eine passende Aufgabe, wählt das Kind zwischen Beenden und Fortsetzen mit zusätzlichem Wortschatz außerhalb der bisherigen Auswahl. Aufgabenzahl und Wiederholungspausen bleiben erhalten.
- Groß-/Kleinschreibung und äußere Leerzeichen beeinflussen die Bewertung nicht; echte Buchstabenfehler bleiben falsch. Die korrekte Schreibweise wird angezeigt.
- Erwachsene können pro Vokabel mehrere gültige englische Antworten hinterlegen. Jede eingetragene Übersetzung oder britische/amerikanische Schreibvariante zählt richtig.
- Vokabeln einzeln eingeben oder mehrere Tabellenzeilen mit den Spalten Deutsch und Englisch kopieren/einfügen. Zuordnung zu vorhandenen oder neu angelegten benannten Lektionen. Kein direkter Excel-/CSV-Dateiimport in der ersten Version.
- Erwachsene ordnen jede Lektion einem oder mehreren Lernprofilen zu. Die drei Übungsmodi und zusätzlicher Wortschatz bei erschöpfter Auswahl nutzen nur die jeweils zugeordneten Lektionen. Lernstände, Punkte und Avatar bleiben pro Kind getrennt.
- Google Drive als gemeinsamer Speicher, keine zusätzlichen kostenpflichtigen Cloudabos.
- Ein gemeinsamer Google-Zugang, eingerichtet durch die Eltern, mit getrennten Lernprofilen in der App.
- Gewünscht: Vokabelverwaltung, Fortschrittsübersicht, die drei genannten Auswahlmodi und Gamification.
- Gamification der ersten Version: Lernreise/Landkarte, Punkte/Level/Abzeichen und ein einfacher gestaltbarer Avatar mit wenigen Farben und Zubehörteilen bilden ein gemeinsames System. Thema: Insel-Abenteuer mit unterschiedlichen Landschaften wie Wäldern, Stränden und Bergen. Konkrete Grafiken, Umfang der Welt und Schwellenwerte sind noch offen.
- Punktevergabe: 10 Punkte je richtiger Antwort, auch für später richtig beantwortete Fehlerwörter. Zusätzlich 20 Punkte für eine abgeschlossene Runde. Keine Punktabzüge bei Fehlern.
- Level-Meilensteine schalten Reiseabschnitte und festgelegte Avatar-Ausstattung automatisch frei. Bereits freigeschaltete Ausstattung bleibt frei auswählbar. Abzeichen für Meilensteine; kein zusätzlicher Münzladen.
- „Letzte Vokabeln“ = zuletzt hinzugefügte Lektion; „Neue Vokabeln“ = vom ausgewählten Kind noch nie geübte Wörter. Beide Definitionen ausdrücklich bestätigt.
- Runden: standardmäßig 10 Antworten, wahlweise 20 oder 30; Wiederholungen zählen mit. Fortschrittsbalken, beispielsweise „7 von 10“.
- Plattformübergreifende Web-App mit besonderem Augenmerk auf iOS; PWA, Offlinebetrieb und JSON bilden die besprochene Arbeitsbasis.

## Noch nicht vorhanden

- Ausführbarer Trainer, Benutzeroberfläche oder visuelle Vorschau.
- Endgültiges Produktdesign, freigegebener Implementierungsplan oder festes Datenschema.
- Google-Cloud-Projekt, OAuth-Client oder echte Synchronisationsprobe für dieses Projekt.
- Aktiviertes GitHub Pages oder eine laufende Web-App.
- Produkt-, Browser- oder Geräteprüfungen.

## Nächster sinnvoller Schritt

Die Produktabstimmung fortsetzen: als Nächstes [Q8 in den Anforderungen](docs/ANFORDERUNGEN.md#offene-entscheidungen) zum Zugang zur Erwachsenenansicht klären. Empfehlung: Menüpunkt mit einer von Erwachsenen festgelegten vierstelligen PIN als Hürde gegen versehentliche Änderungen. Alternative: direkter Zugang ohne PIN. Noch keine Auswahl. Danach konkrete Testgeräte und weitere offene Punkte behandeln; Spielschwellen, Abschluss-Sonderfälle und Details geänderter Lektionszuordnungen im Detaildesign erhalten. Der Nutzer wünscht jeweils eine Frage mit Optionen und Empfehlung; Antworten sofort dokumentieren.

Vor umfangreicher Umsetzung muss eine frühe technische Probe den Google-Zugang und erneuten Verbindungsaufbau auf echtem iPhone/Safari sowie als Home-Bildschirm-App prüfen. Dafür sind später die nutzerseitige Google-App-Registrierung und Zugang zum Testgerät nötig. Diese Probe ist noch nicht durchgeführt.

## Grenzen des Auftrags

Der Nutzer hat nach dem veröffentlichten Dokumentationspaket die vollständige Klärung der offenen Punkte beauftragt. Nach Abschluss dieser Klärung darf die Entwicklung des abgestimmten Umfangs beginnen. Bis dahin Anforderungen fortlaufend ergänzen. Vorgeschlagene Details nicht als Zustimmung behandeln; keine kostenpflichtigen Dienste oder eigenmächtigen Kontoeinrichtungen/Deployments daraus ableiten.
