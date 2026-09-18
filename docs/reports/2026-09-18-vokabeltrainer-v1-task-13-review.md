# Task 13 – unabhängige Spezifikations- und Qualitätsprüfung

## Spec Compliance

- **❌ Issues found.** Die ausdrücklich geforderte prüfbare Abschlussmatrix ordnet mehreren Anforderungen und Entwurfsergänzungen andere Inhalte zu. Die portable Prüfhistorie enthält außerdem eine falsche abschließende Testzahl und lässt vorgeschriebene Nachweisdetails weg (`docs/reports/2026-09-18-vokabeltrainer-v1.md:42`, `:63`, `:79`; Auftrag: `docs/superpowers/tasks/task-13-brief.md:52`, `:57`).
- **⚠️ Nicht aus diesem Diff vollständig verifizierbar:** Die fachliche Vollständigkeit aller unveränderten Tasks 1–12. Dafür bleibt die nachfolgende Gesamtbranchprüfung zuständig. Ein falscher Matrixeintrag ist hier ein Dokumentationsbefund, kein Nachweis einer fehlenden Produktfunktion. Reale Google-/Zwei-Geräte-/Apple-/HTTPS-Nachweise bleiben ausdrücklich offen (`docs/reports/2026-09-18-vokabeltrainer-v1.md:12`, `:119`).
- **Prüfbereich:** `8aaed7b4977e53c0a5d6a2405c50748c4b3d0592` bis `6deba7e74c85bf7ef291c559999fc4c75aabc1c4`, einschließlich Produktkorrektur `3b1d16d`, Abschlussdokumentation `18a5722` und intervenierender Dokumentation. Keine umfassende erneute Codeprüfung der früheren Arbeitspakete.

## Strengths

- Die Textkorrektur für eine ausgeschöpfte Runde verwendet die bestehende `canExpand`-Entscheidung und besitzt eine konkrete Browserassertion gegen das bisher falsche Versprechen (`src/trainer/ui/practice.js:280`, `tests/browser/trainer.browser.mjs:407`).
- Die gemeinsame Statusfunktion erhält die bisherigen fünf Bezeichnungen und ersetzt beide Implementierungen. Neues Modul, Serverfreigabe und Workerasset wurden gemeinsam ergänzt; die Cacheversion wurde erhöht (`src/trainer/ui/status.js:1`, `src/trainer/ui/shell.js:386`, `src/trainer/ui/sync.js:65`, `scripts/serve.mjs:42`, `trainer/sw.js:3`, `:26`).
- Die neuen Authentifizierungsfälle durchlaufen die echte Oberfläche für Suche, Anlage und Beitrittsvorschau, injizieren 401-Antworten und verlangen einen ausdrücklichen Wiederverbindungsweg. Export und synthetischer Browserspeicher werden zusätzlich auf unerlaubte Token-/PIN-Verifier-Mitnahme geprüft (`tests/browser/trainer.browser.mjs:1121`, `:1238`, `:1245`).
- Das Trainerharness hängt standardmäßig weder von einem ignorierten Scratchverzeichnis noch einem Windows-Browserpfad ab. Projekt-Playwright und dessen Chromium sind die Standardwerte; dokumentierte Overrides bleiben möglich. Trainer und Probe besitzen getrennte Startanleitungen (`tests/browser/trainer-harness.mjs:7`, `:57`, `:85`; `tests/browser/README.md:5`, `:12`, `:24`).
- Tatsächliche synthetische Screenshots sind dauerhaft unter `docs/reports/assets/` enthalten. Der Bericht trennt sie von realer Apple-Abnahme und behauptet keine öffentliche Bereitstellung oder abgeschlossene Gesamtprüfung (`docs/reports/2026-09-18-vokabeltrainer-v1.md:106`, `:110`, `:119`; `docs/handoffs/2026-09-18-vokabeltrainer-v1.md:13`). Die sechs Bilder wurden bereits von Implementierer und Controller angesehen; diese Review führt keine zusätzliche visuelle Abnahme ein.

## Issues

### Critical (Must Fix)

- Keine im geprüften Task-13-Diff festgestellt.

### Important (Should Fix)

**I1 – Abschlussmatrix an die tatsächlichen R-/E-Definitionen binden.**

`docs/reports/2026-09-18-vokabeltrainer-v1.md:42`–`:72` ist keine verlässliche Zuordnung des bestätigten Umfangs. Der vollständige Vergleich mit den Definitionstabellen ergab insbesondere:

- **R10** ist die einsehbare Wort-Lernstandsübersicht, nicht ID-Stabilität/Deduplizierung. **R21/R22** sind Schreibweisenbewertung und erlaubte Antwortvarianten, nicht Touch/Fokus. Quellen: `docs/ANFORDERUNGEN.md:20`, `:31`, `:32`; fehlerhafte Berichtseinträge `:45`, `:50`.
- Die Gruppen **R12–R15**, **R16–R17**, **R18–R20** und **R28–R29** weisen einzelne Anforderungen nicht zu: Kosten-/Privatgebrauchsgrenzen, abgeschlossene dialogische Klärung, 10/20/30 Antworten mit Fortschrittsanzeige, bewusste Erweiterung einer erschöpften Auswahl und erneutes Google-Verbinden/offline Weiterüben benötigen jeweils ihren eigenen passenden Beleg. Quellen: `docs/ANFORDERUNGEN.md:22`–`:30`, `:38`; Bericht `:47`–`:49`, `:53`.
- **E02** beschreibt festgehaltene Rundenauswahl, Fälligkeit/Fehlerabstand und den zulässigen vorzeitigen Abschlussbonus. **E03** umfasst Enter, Textkorrektur, behutsame Animation und keine Töne. **E05** umfasst Tabellenvorschau, Archivierung und neue Lernserie bei Inhaltsänderung. Die jeweiligen Berichtseinträge beschreiben stattdessen nur andere technische Teilaspekte. Quelle: `docs/superpowers/specs/2026-09-16-vokabeltrainer-design.md:22`, `:23`, `:25`; Bericht `:64`, `:65`, `:67`.
- **E06** ist der PIN-Ablauf je Gerät einschließlich Sperren und bewusstem Zurücksetzen, nicht serialisierte Commands/CAS. **E07** ist das Ausnehmen ungeklärter Konfliktwörter bei weiter nutzbarem Restwortschatz, nicht Konto-/Ordnerbindung. **E09** enthält echte Safari-/Home-Bildschirm-Prüfung und die frühe Probe; ein PWA-Worker-Test kann den ausdrücklich zurückgestellten Realnachweis nicht ersetzen. Quelle: `docs/superpowers/specs/2026-09-16-vokabeltrainer-design.md:26`–`:29`; Bericht `:68`, `:69`, `:71`.

Die übrigen Zeilen wurden ebenfalls mit der Definitionstabelle verglichen; dort wurde kein vergleichbar eindeutiger falscher Referent gefunden. Unabhängig davon nennt die Matrix überwiegend allgemeine Testarten statt auffindbarer Testfälle oder versionierter Detailberichte. Dadurch kann ein Übernehmer nicht nachvollziehen, welcher tatsächlich gelaufene Fall die jeweilige Aussage trägt. Das verfehlt die explizite Task-13-Abnahme aus `docs/superpowers/tasks/task-13-brief.md:52`.

**Korrektur:** Alle R01–R33 und E01–E10 anhand ihrer Originaldefinition einzeln oder eindeutig aufgeschlüsselt zuordnen, konkrete bestehende Testfälle/Reportabschnitte verlinken und Dokumentations-/Umfangsentscheidungen sowie offene Realprüfungen als solche kennzeichnen. E09 muss trotz synthetischer PWA-Erfolge einen offenen Realteil behalten. Keine fehlende Produktimplementierung aus dieser Review ableiten und keine bereits vorhandenen Tests nur zur Neubegründung wiederholen.

**I2 – Prüfnachweise vor dem Entfernen der Arbeitsberichte korrekt und dauerhaft erhalten.**

`docs/reports/2026-09-18-vokabeltrainer-v1.md:79` nennt für Task 2 einschließlich Fixcommit `4527736` **15 gezielte/107 gesamte Tests**. Das sind die Zahlen vor der Korrektur; der erhaltene Originalbericht nennt für den abschließenden Fix **16 gezielte/108 gesamte Tests** (`task-2-report.md:110`–`:121` im noch vorhandenen Arbeitsmaterial). Außerdem fehlen der Task-1–13-Tabelle die im Preflight ausdrücklich verlangten ausgeführten Prüfkommandos; für Tasks 7/8 fehlen selbst konkrete Zählungen. Die Behauptung in `:92`, die prüfbaren Kerndaten seien dauerhaft erhalten, ist daher noch nicht ausreichend eingelöst. `ARBEITSSTAND.md:29` verweist zudem pauschal auf versionierte Detailberichte für Tasks 1–12, obwohl die frühen Detailberichte gerade noch Arbeitsmaterial sind.

Für Task 13 beschreibt `docs/reports/2026-09-18-vokabeltrainer-v1.md:16` die RED-Phase nur erzählerisch. Die konkreten fokussierten RED-/GREEN-Kommandos, Ergebnisse und Zuordnung zu den einzelnen Korrekturen fehlen; sie sind im Ausführungsvertrag ausdrücklich verlangt (`docs/superpowers/tasks/task-13-brief.md:57`). Die frischen Gesamtergebnisse 277/11/12 sind vorhanden und werden durch diesen Befund nicht als fehlgeschlagen bewertet (`docs/reports/2026-09-18-vokabeltrainer-v1.md:24`–`:32`).

Der Controller klärte diese Lücke während der Review mit dem Implementierer: Es existieren keine separaten TAP-Logs oder ein zusätzlicher Task-13-Bericht. Der Preview-/Workerlauf und seine Ergebnisse sind rekonstruierbar; das lange historische Browser-Testnamensmuster ist nicht dauerhaft erhalten. Diese Grenze ausdrücklich dokumentieren, keine exakte Befehlsfolge erfinden.

**Korrektur:** Vor der geplanten Scratchbereinigung die tatsächlich vorhandenen finalen Kommandos, Zählungen, wesentlichen Reviewkorrekturen und abschließenden Urteile knapp in versionierte Dokumentation übernehmen oder passende Detailberichte dauerhaft ablegen und verlinken. Task 2 auf 16/108 berichtigen. Vorhandene Task-13-RED-/GREEN-Evidenz aus den ausgeführten Läufen ergänzen; fehlende historische Evidenz offen kennzeichnen, statt nachträgliche Läufe als ursprünglichen RED-Nachweis auszugeben. Aktuelle Hauptdokumente müssen den tatsächlichen Ablageort korrekt nennen.

### Minor (Nice to Have)

**M1 – Gewünschte Ansicht nach der Profilauswahl wieder aufnehmen.** `src/trainer/ui/shell.js:233`–`:246` kündigt bei profilfreier Reise-/Avatar-Navigation die jeweilige persönliche Ansicht nach der Auswahl an. Der Profilbutton führt jedoch unverändert immer zu `show('practice')` (`src/trainer/ui/shell.js:212`–`:216`). Das bleibt bedienbar, erfordert aber einen zusätzlichen Navigationsschritt und erfüllt die im Preflight beschriebene Weiterleitung zur angeforderten Ansicht nur teilweise. Der neue Browserfall endet bereits wieder an der Profilauswahl (`tests/browser/trainer.browser.mjs:727`–`:733`). Optional die gewünschte Zielansicht bis zur Profilauswahl merken und einen Fall bis zum tatsächlichen Ziel durchspielen.

## Prüfungen und Grenzen

- Das bereitgestellte Diffpaket wurde in begrenzten Abschnitten gelesen. Wegen gekürzter Werkzeugausgaben wurden betroffene Dokumentationsabschnitte nachgelesen. Kein zweiter Git-Diff und keine Gitmutation.
- Benanntes externes Risiko „falsche Abschlusszuordnung“: Originaltabellen in `docs/ANFORDERUNGEN.md:11`–`:43` und im bestätigten Entwurf `:21`–`:30` verglichen. Benanntes Risiko „Verlust früher Prüfevidenz“: vorhandenes Fortschrittsprotokoll und gezielte Abschnitte der frühen Implementierungs-/Reviewberichte geprüft; daraus stammt die konkrete Task-2-Korrektur.
- Benanntes Risiko „Avatarprüfung akzeptiert alten Knoten“: gezielt `src/trainer/ui/rewards.js:247`–`:266` geprüft. Der Handler deaktiviert die alten Eingaben synchron vor der asynchronen Speicherung und fokussiert anschließend die aktuelle Eingabe. Der geänderte Test verlangt aktiven Fokus/checked und bestätigt die Trennung des alten Knotens (`tests/browser/trainer.browser.mjs:1010`–`:1016`); daraus kein belastbarer neuer Fehlerbefund.
- Der Diffhunk schnitt `renderProfiles` vor der Profilaktion ab. Ausschließlich zur Beurteilung der neuen profilfreien Navigation wurde der unmittelbare Funktionskontext `src/trainer/ui/shell.js:195`–`:225` zusätzlich gelesen; Ergebnis M1.
- Die gemeldeten frischen 277 Node-/11 Trainer-/12 Probe-Ergebnisse sowie Umgebungsdaten sind im Abschlussbericht vorhanden. Keine Suite wiederholt und kein neuer Test gestartet: Die verbleibenden wichtigen Befunde sind mit den Originaldefinitionen und erhaltenen Berichten bereits konkret belegbar. Der Standardlauf ohne Browser-/Moduloverride wurde in dieser Review nicht ausgeführt; der dokumentierte Abschlusslauf nutzte ausdrücklich Overrides.
- Nur dieser Reviewbericht wurde geschrieben. Keine Änderung an Produktdateien, Index, HEAD, Browserkonten oder persönlichem Server auf Port 4173; kein Commit, Push oder Merge.

## Assessment

**Task quality: Needs fixes.**

Die begrenzten Produktkorrekturen und ihre Einbindung in Server/Offlinecache sind nachvollziehbar; ein neuer blockierender Produktcodefehler wurde nicht festgestellt. Vor Abschluss dieses Dokumentations- und Prüfpakets müssen die falsche Anforderungszuordnung und die nicht ausreichend dauerhaft erhaltene Prüfhistorie korrigiert werden. Die anschließende Gesamtbranchprüfung und reale Geräteabnahme bleiben eigene Schritte.
