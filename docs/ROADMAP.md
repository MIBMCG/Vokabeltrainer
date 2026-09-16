# Roadmap zur ersten nutzbaren Version

Stand: 16.09.2026. **Vorgeschlagene Arbeitsreihenfolge, kein freigegebener Implementierungsplan.** Die Punkte beschreiben überprüfbare Ergebnisse, ohne offene Nutzerentscheidungen vorwegzunehmen.

## 0. Projektwissen übergabefähig machen

Ergebnis dieses Arbeitspakets: README, AGENTS.md, Anforderungen, Entwurf, Einrichtungshinweise, Abnahmeplan und Übergabe im Repository. Prüfung: [Dokumentationsbericht](reports/2026-09-16-dokumentation.md).

## 1. Produktdesign konkret abstimmen

- „Letzte“ und „Neue“ Vokabeln eindeutig definieren.
- Rundengröße, Wiederholungsserie, Schreibweisenbewertung und Ende einer Runde festlegen.
- Ein konkretes Gestaltungskonzept für 10–13-Jährige und die erste Gamification auswählen.
- Umfang der Erwachsenenansicht und Wortlistenverwaltung bestimmen.

Ergebnis: ein prüfbares Design mit klaren Grenzen der ersten Version. Offene Punkte: [Q1–Q8](ANFORDERUNGEN.md#offene-entscheidungen). Eine visuelle Vorschau kann helfen; sie wurde noch nicht erstellt oder ausgewählt.

## 2. Google Drive auf iOS früh nachweisen

Nach Abstimmung einer eng begrenzten Probe die Anmeldung, den Zugriff auf synthetische Dateien, das Wiederfinden auf zwei Geräten und erneutes Verbinden testen. Safari-Tab und Home-Bildschirm-App separat prüfen.

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
