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
- Q6c: Nutzer wählt A. 10 Punkte je richtiger Antwort, auch für später richtig beantwortete Fehlerwörter, plus 20 Punkte je abgeschlossener Runde. Keine Punktabzüge bei Fehlern.
- Q6d: Nutzer wählt A. Level-Meilensteine schalten Reiseabschnitte und festgelegte Avatar-Ausstattung automatisch frei. Aus bereits freigeschalteter Ausstattung kann das Kind jederzeit frei wählen. Abzeichen für Meilensteine; kein zusätzlicher Münzladen.
- Q7a: Nutzer wählt A. Einzeleingabe und Kopieren/Einfügen mehrerer Tabellenzeilen mit den Spalten Deutsch und Englisch. Zuordnung zu vorhandenen oder neu angelegten benannten Lektionen. Kein direkter Excel-/CSV-Dateiimport in der ersten Version.
- Q7b: Nutzer wählt A. Erwachsene ordnen jede Lektion einem oder mehreren Kindern zu. Alle drei Übungsmodi berücksichtigen nur die dem jeweiligen Kind zugeordneten Lektionen. Lernstände, Punkte und Avatar bleiben pro Kind getrennt. Die Zuordnungsgrenze gilt auch bei zusätzlichem Wortschatz gemäß R20.

## Aktuelle Frage

**Q8: Wie soll sich die Erwachsenenansicht öffnen lassen? Noch nicht entschieden.**

Vorgesehene Optionen für die nächste Nutzerantwort:

- A: Über den Menüpunkt „Für Erwachsene“ und eine selbst festgelegte vierstellige PIN. Empfehlung: einfache Hürde gegen versehentliche Änderungen an Vokabeln oder Zuordnungen.
- B: Über denselben Menüpunkt direkt, ohne PIN; einfacherer Wechsel zur Verwaltung.

Noch keine Zugangslösung als gewählt behandeln. Eine PIN ist in der gemeinsamen Browser-/Google-Umgebung eine Bedienhürde; keine eigenständige Konten- oder Berechtigungsgrenze zusagen. Bei Auswahl einer PIN deren Einrichtung, Änderung, Vergessen und Verhalten auf mehreren Geräten im Detaildesign klären.

Nach der Antwort die genaue Entscheidung festhalten und Q9 zu konkreten Testgeräten vorbereiten. Für Lektionszuordnungen die Reihenfolge von „Letzte“ bei nachträglich zugeordneten älteren Lektionen und den Erhalt von Lernständen bei geänderter Zuordnung im Detaildesign klären. Für Tabellenübernahme Vorschau, Fehlerhinweise, mehrere gültige Antworten und doppelte Einträge berücksichtigen. Konkrete Level-Schwellen, Abzeichen, Ausstattung und Umfang der ersten Inselwelt vorschlagen. Abschluss bei erschöpfter Auswahl gemäß R20, Abbruch/Fortsetzung und einmalige Bonusvergabe bleiben ebenfalls zu klären; siehe R23 und Lernablauf in den Anforderungen. Spätere Wiederholungen dürfen nicht stillschweigend als noch nie geübte „Neue Vokabeln“ behandelt werden. Keine vorgeschlagene Option ohne Antwort übernehmen. Diese laufende Übergabe und den Arbeitsstand bei weiteren Antworten kurz aktualisieren.
