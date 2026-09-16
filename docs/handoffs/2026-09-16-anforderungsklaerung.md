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

## Aktuelle Frage

**Q5a: Bewertung von Groß-/Kleinschreibung. Noch nicht beantwortet.**

Vorgesehene Optionen für die nächste Nutzerantwort:

- A: Groß-/Kleinschreibung ignorieren; beispielsweise „Apple“ für „apple“ akzeptieren und die korrekte Schreibweise trotzdem anzeigen. Empfehlung.
- B: Groß-/Kleinschreibung mitbewerten; beispielsweise „english“ statt „English“ als falsch markieren.

Bei beiden angebotenen Varianten äußere Leerzeichen ignorieren; echte Buchstabenfehler wie „appel“ statt „apple“ bleiben falsch. Diese gemeinsamen Bedingungen gehören zur angebotenen Entscheidung und sind noch nicht bestätigt.

Nach der Antwort die genaue Entscheidung festhalten und Q5b zu zulässigen Übersetzungen/Schreibvarianten vorbereiten. Die drei Auswahlmodi beibehalten; spätere Wiederholungen dürfen nicht stillschweigend als noch nie geübte „Neue Vokabeln“ behandelt werden. Keine vorgeschlagene Option ohne Antwort übernehmen. Diese laufende Übergabe und den Arbeitsstand bei weiteren Antworten kurz aktualisieren.
