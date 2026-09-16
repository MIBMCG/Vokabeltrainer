# Übergabe: laufende Anforderungsklärung

Stand: 16.09.2026. Diese Übergabe ersetzt den nächsten Gesprächsschritt der [ursprünglichen Projektübergabe](2026-09-16-projektstart.md). Die dort beschriebene fehlende App-Implementierung und die offenen technischen Nachweise gelten weiter.

## Ausgangsstand

- Initiale Dokumentation veröffentlicht: `main`, Commit `a646763`.
- Noch keine App, Google-Einrichtung oder Geräteabnahme.
- Aktuelle Änderungen und Remote-Abgleich mit den Befehlen in [START-HIER.md](../../START-HIER.md) beziehungsweise der ursprünglichen Übergabe prüfen.

## Neuer Nutzerauftrag

Alle offenen Punkte klären, jeweils **eine Frage** stellen, möglichst mehrere Optionen und eine Empfehlung anbieten. Jede Antwort parallel in [ANFORDERUNGEN.md](../ANFORDERUNGEN.md) dokumentieren. Nach vollständiger Klärung darf mit der Entwicklung begonnen werden. Diese bedingte Freigabe nicht vergessen und nicht erneut pauschal um Erlaubnis zum Entwicklungsbeginn bitten.

## Neu bestätigt

- Q1: „Letzte Vokabeln“ = zuletzt hinzugefügte Lektion.
- Q2: „Neue Vokabeln“ = Wörter, die das ausgewählte Kind noch nie geübt hat.
- Q3: Nutzer wählt A. Eine Runde umfasst standardmäßig 10 Antworten, wahlweise 20 oder 30. Wiederholungen zählen mit; Fortschrittsbalken, beispielsweise „7 von 10“.
- Q4a: Nutzer wählt A. Die Richtigserie bleibt je Wort und Kind über mehrere Runden erhalten. Ein Fehler bei diesem Wort setzt dessen Serie auf null; Antworten auf andere Wörter verändern sie nicht.
- Q4b: Nutzer wählt A. Nach drei richtigen Antworten für den Rest der Runde pausieren, erste Wiederholung frühestens am nächsten Tag. Nach richtigen Wiederholungen Abstände von 3, 7 und 14 Tagen, anschließend jeweils 14 Tage. Bei Fehler zurück ins häufigere Üben.
- Q4c: Nutzer wählt A. Nach einem Fehler zwei andere Aufgaben bearbeiten, dann das Wort erneut abfragen. Endet die Runde vorher, bleibt die Wiederholung für später vorgemerkt; die gewählte Rundengröße wird nicht verlängert.
- Q4d: Nutzer wählt B. Bei erschöpfter Auswahl entscheidet das Kind zwischen Beenden und Fortsetzen mit zusätzlichem Wortschatz außerhalb der bisherigen Auswahl. Die geplante Aufgabenzahl und Wiederholungspausen bleiben erhalten.
- Q5a: Nutzer wählt A. Groß-/Kleinschreibung und äußere Leerzeichen beeinflussen die Bewertung nicht; echte Buchstabenfehler bleiben falsch. Die korrekte Schreibweise wird trotzdem angezeigt.
- Q5b: Nutzer wählt A. Erwachsene können je Vokabel mehrere gültige englische Antworten hinterlegen, auch britische/amerikanische Schreibvarianten. Jede hinterlegte Variante zählt richtig.
- Q6a: Nutzer wählt A. Alle drei Elemente kommen in die erste Version: Lernreise/Landkarte, Punkte/Level/Abzeichen und ein einfacher gestaltbarer Avatar mit zunächst wenigen Farben und Zubehörteilen. Sie bilden ein gemeinsames Belohnungssystem, keine drei unabhängigen Spielmodi.
- Q6b: Nutzer wählt A. Insel-Abenteuer mit unterschiedlichen Landschaften, etwa Wäldern, Stränden und Bergen, als Thema. Modern und passend für 10–13-Jährige gestalten. Konkrete Grafiken und Umfang der Welt sind noch offen.

## Aktuelle Frage

**Q6c: Wofür soll es Punkte geben? Noch nicht entschieden.**

Vorgesehene Optionen für die nächste Nutzerantwort:

- A: 10 Punkte je richtiger Antwort plus 20 Punkte für eine abgeschlossene Runde. Auch bei einer späteren Wiederholung richtig beantwortete Fehlerwörter geben die vollen 10 Punkte. Empfehlung: richtige Antworten und das Abschließen einer Runde belohnen.
- B: Nur richtige Antworten bringen jeweils 10 Punkte; keine zusätzliche Rundenbelohnung.
- C: Nur abgeschlossene Runden bringen Punkte, unabhängig von der Fehlerzahl. Falls gewählt, die Höhe konkretisieren.

Alle drei Vorschläge verzichten auf Punktabzüge bei Fehlern. Noch keine Regel als beschlossen behandeln. Für das spätere Detaildesign offenhalten: Abschluss bei erschöpfter Auswahl gemäß R20, Abbruch/Fortsetzung einer Runde und Verhindern mehrfacher Belohnung desselben Abschlusses. Eine leere Auswahl darf keinen Abschlussbonus erzeugen.

Nach der Antwort die genaue Entscheidung festhalten und Q6d zur Verbindung von Punkten, Leveln, Insel-Fortschritt, Abzeichen und Avatar-Ausstattung vorbereiten. Die drei Auswahlmodi beibehalten; spätere Wiederholungen dürfen nicht stillschweigend als noch nie geübte „Neue Vokabeln“ behandelt werden. Keine vorgeschlagene Option ohne Antwort übernehmen. Diese laufende Übergabe und den Arbeitsstand bei weiteren Antworten kurz aktualisieren.
