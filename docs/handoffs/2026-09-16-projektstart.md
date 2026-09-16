# Übergabe: dokumentierter Projektstart

Datum: 16.09.2026

## Auftrag und Ergebnis

Der Nutzer möchte einen privaten Deutsch-Englisch-Vokabeltrainer entwickeln und zunächst die Technologie abstimmen. Nach der Wahl von Google Drive und einem gemeinsamen Google-Zugang wurde die Zielgruppe auf **10–13 Jahre, Klasse 4–7** konkretisiert. Anschließend wurden vollständige Projektdokumentation, AGENTS.md und README sowie deren Push nach GitHub ausdrücklich beauftragt.

Dieses Paket enthält diese Dokumentation. Es enthält noch keinen Trainer, keine eingerichtete Google-Anbindung und keine veröffentlichte Web-App.

## Entscheidungen nicht erneut aufrollen

- Google Drive wurde gewählt; ein zusätzlicher kostenpflichtiger Cloudanbieter ist unerwünscht.
- Die Eltern richten einen gemeinsamen Google-Zugang auf Eltern- und Schülergerät ein.
- Lernprofile innerhalb der App sollen Fortschritte der Kinder getrennt halten.
- Deutsch vorgeben, Englisch eintippen, sofort prüfen, Fehler korrigiert anzeigen, mit „Weiter“ fortfahren.
- Falsche Wörter häufiger wiederholen; nach drei richtigen Antworten in Folge selten oder nicht mehr in dieser Übung.
- Gewünscht sind die Modi „Alle“, „Letzte“, „Neue“, Fortschrittsübersicht und Gamification.
- PWA, HTML/CSS/JavaScript, Offlinebetrieb und JSON bilden die besprochene technische Richtung. Ein Detaildesign ist noch offen.

Die vollständige Liste und die Statusunterscheidung stehen in [ANFORDERUNGEN.md](../ANFORDERUNGEN.md).

## Repository und Einstieg

- Remote: `https://github.com/MIBMCG/Vokabeltrainer.git`
- Branch des initialen Dokumentationspakets: `main`
- Das Repository war beim Start leer; keine alte Anwendung wurde übernommen.
- Aktuellen Commit mit `git log -1 --oneline` feststellen. Diese Übergabe enthält absichtlich nicht den Hash ihres eigenen Commits.
- Für ein anderes System [START-HIER.md](../../START-HIER.md) verwenden. Kein lokaler Codex-Kontext oder bestimmter Laufwerkspfad ist erforderlich.

Prüfbefehle im Checkout:

```sh
git status --short --branch
git log -1 --oneline
git rev-parse HEAD
git ls-remote origin refs/heads/main
```

Die beiden letzten Commit-IDs müssen für einen unveränderten, vollständig veröffentlichten Stand übereinstimmen. Bei späteren Änderungen den Unterschied untersuchen und nichts blind zurücksetzen.

## Technischer Befund, den die nächste KI kennen muss

Die Google-Anbindung wird direkt aus der Web-App vorgeschlagen. Googles Browser-Tokenmodell kann nach Ablauf des Zugriffs eine Nutzeraktion zum erneuten Verbinden verlangen. Ein gemeinsames Konto beseitigt diese Grenze nicht. Die tatsächliche Bedienung auf Safari und als Home-Bildschirm-App muss früh mit einem echten iPhone geprüft werden.

Es wurden weder ein Google-Cloud-Projekt noch OAuth-Zugangsdaten eingerichtet. GitHub Pages ist ein vorgeschlagener kostenloser Hostingweg und noch nicht aktiviert. Die frühere Diskussion über OneDrive und iCloud ist abgeschlossen, soweit keine neuen technischen Befunde eine erneute Entscheidung nötig machen.

## Nächster Gesprächsschritt

Mit dem Nutzer zuerst die Bedeutung von „Letzte Vokabeln“ und „Neue Vokabeln“ klären. Vorschlag für eine einzelne Einstiegsfrage:

> Sollen „Letzte Vokabeln“ die zuletzt hinzugefügte Lektion sein und „Neue Vokabeln“ alle Wörter, die das ausgewählte Kind noch nie geübt hat?

Das ist ein Vorschlag, keine bereits bestätigte Definition. Danach Rundengröße, Drei-richtig-Regel, Schreibweisenbewertung und konkrete Gestaltung/Gamification besprechen. Nicht sämtliche offenen Fragen auf einmal stellen.

## Weiterarbeit

Die Reihenfolge ist in [ROADMAP.md](../ROADMAP.md) beschrieben. Nach Produktabstimmung und einer begrenzten technischen Probe einen konkreten Implementierungsplan erstellen. Die bloße Existenz dieses Pakets ist keine Genehmigung, alle vorgeschlagenen Details zu implementieren.

Keine Produktprüfungen sind abgeschlossen. Die Dokumentationsprüfungen werden im [Prüfbericht](../reports/2026-09-16-dokumentation.md) festgehalten. Für spätere Geräteprüfungen gilt [QUALITAET-UND-ABNAHME.md](../QUALITAET-UND-ABNAHME.md).
