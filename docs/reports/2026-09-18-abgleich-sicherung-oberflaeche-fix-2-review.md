# Task 11 – unabhängige Nachprüfung der Korrekturrunde 2

Prüfbasis: **7d65db1 → 659cc139e9ab46be538092a658ed59f285362f1d**; Korrekturcode **2a37a25**. Die weiteren enthaltenen Commits betreffen Dokumentation. Umfang: verbleibender R2-Teilfall und neue Fehler im Korrekturdiff; keine erneute Gesamtprüfung.

## Finding Verdicts

- **R2 – Konfliktbehaftete Vorher-Seite bleibt bei eindeutigem Sicherungsziel unvollständig — ADDRESSED.** `src/trainer/ui/preview.js:135` löst sämtliche `before.heads` über den Ereigniskontext auf und erzeugt je Fassung eine eigene Überschrift sowie alle Felder der vorhandenen Fassungsdarstellung, ausdrücklich mit „Vorher“ gekennzeichnet. `:209` fügt diese Fassungen in die jeweilige Inhaltsänderung ein; die Nachher-Seite bleibt getrennt sichtbar. Der neue Browserabschnitt prüft beide konkreten bisherigen Schreibweisen und das eindeutige Ziel (`tests/browser/trainer.browser.mjs:1268`–`:1272`). Damit ist der reproduzierte Restfall behoben.
- **R2 – zur Vorschau passender aktueller Ereignisstand einschließlich stale-Neuvorschau — ADDRESSED.** Die Erwachsenenansicht injiziert den aktuellen Commands-Zustandszugriff (`src/trainer/ui/adult.js:519`). `src/trainer/ui/backup.js:168` wertet ihn bei jedem Aufruf von `openPreview` neu aus, also auch im bestehenden Pfad nach erneuter Vorbereitung einer stale Vorschau. Die drei lokalen Renderer-Wiederholungen erhalten diesen Zugriff (`:142`, `:197`, `:250`); sie fallen nicht auf den früher eingefangenen Zustand zurück. Vorschau-/Bestätigungs-IDs, Sicherheitskopien und Serviceverträge bleiben unverändert.

## New Breakage in the Fix Diff

**None.** Keine neuen Critical-/Important-/Minor-Befunde. Die neue Ausgabe verwendet ausschließlich DOM-/Textknoten. Optionale Detaillisten werden vor direktem `append` auf Vorhandensein geprüft (`src/trainer/ui/preview.js:212`); die Korrektur verändert weder Lernstände noch Restoreentscheidungen.

## Out-of-Scope Observations

**Keine neuen.** R1/R3 waren bereits in Korrekturrunde 1 geschlossen. M1/M2 bleiben ausdrücklich Task 13 zugeordnet. Reale Google-/Apple-Geräteprüfung und PWA-Abnahme werden durch diese Nachprüfung nicht behauptet.

## Prüfungen und Grenzen

- Verbleibenden R2-Befund aus der vorherigen Nachprüfung, angehängten Korrekturbericht und den vollständigen Korrekturdiff mit Kontext in zwei begrenzten Abschnitten gelesen. Anschließend ausschließlich Zeilenverweise aus den Diffhunks abgeleitet. Keine breite Suche und keine unveränderten Module erneut geprüft.
- Der Bericht dokumentiert den passenden Zweikontextfall mit **RED 0/1**, danach **GREEN 1/1** und abschließend **4/4 betroffene Browserfälle**, jeweils mit Befehl und Ergebnis (`docs/reports/2026-09-18-abgleich-sicherung-oberflaeche.md:75`–`:77`). Die Behauptungen wurden mit den tatsächlichen neuen Assertions abgeglichen. Keine Suite und kein zusätzlicher Test wiederholt; der kleine Fixdiff hinterließ keine konkrete unbeantwortete Reproduktionsfrage.
- Ausschließlich diesen Bericht geschrieben. Keine Änderungen an Produktcode, Index oder HEAD, keine Gitbefehle, keine Subagents und kein echter Google-/Gerätezugriff.

## Verdict

**Fix round: All findings addressed, no new Critical/Important breakage.** Der verbleibende R2-Teilfall ist geschlossen; Korrekturrunde 2 bestanden.
