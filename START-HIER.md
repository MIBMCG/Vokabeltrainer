# Hier mit der Weiterarbeit beginnen

Fortsetzung am Desktop am 18.09.2026 ausdrücklich beauftragt. GitHub-Stand c60ced1 wurde in die saubere bestehende Arbeitskopie übernommen; die Pause ist beendet. Task 9 ist nach zwei Korrekturrunden unabhängig geprüft (37c459f, 227 Node-Tests). Task 10 Sicherung/Wiederherstellung läuft; danach Tasks 11–13. Aktuelle [Desktop-Fortsetzung](docs/handoffs/2026-09-18-desktop-fortsetzung.md); die nachfolgende Pausenübergabe bleibt historische Ausgangsevidenz.

Pause am 18.09.2026 auf Nutzerwunsch. Code, Prüfberichte und offene Befunde werden für den Desktop gesichert. Das Insel-Konzept bleibt bestätigt. Maßgeblich ist die [Desktop-Übergabe](docs/handoffs/2026-09-18-desktop-pause.md); bis zur ausdrücklichen Fortsetzung keine weitere Entwicklung.

Dieses Projekt kann mit beliebigen Entwicklungswerkzeugen und KI-Systemen fortgesetzt werden. Der Gesprächsverlauf ist dafür nicht erforderlich.

## Lesereihenfolge

1. [AGENTS.md](AGENTS.md)
2. [ARBEITSSTAND.md](ARBEITSSTAND.md)
3. Die dort verlinkte aktuelle Übergabe.
4. [Anforderungen und Entscheidungen](docs/ANFORDERUNGEN.md)
5. [Architektur](docs/ARCHITEKTUR.md) und [Roadmap](docs/ROADMAP.md)
6. [Bestätigter Gesamtentwurf](docs/superpowers/specs/2026-09-16-vokabeltrainer-design.md) einschließlich E01–E10 und [aktueller Umsetzungsplan](docs/superpowers/plans/2026-09-17-vokabeltrainer-v1.md).

Aktuelle Übergabe: [Desktop-Pause vom 18.09.2026](docs/handoffs/2026-09-18-desktop-pause.md). Nach Fortsetzung zuerst Task 9 korrigieren und unabhängig nachprüfen, danach Tasks 10–13. Die vollständige Umsetzung bleibt vor der Apple-Geräteabnahme beauftragt.

## Vor dem Arbeiten

Im Repository ausführen:

```sh
git status --short --branch
git remote -v
git log -5 --oneline
```

Bei einem bestehenden Checkout lokale Änderungen vor dem Aktualisieren prüfen. Nicht blind pullen oder zurücksetzen. Bei einem frischen Start die Clone-Anleitung in [README.md](README.md) verwenden.

## Kopierbarer Wiedereinstieg

> Beende die Pause und arbeite am Repository MIBMCG/Vokabeltrainer auf `codex/vokabeltrainer-v1` weiter. Lies zuerst AGENTS.md, ARBEITSSTAND.md und docs/handoffs/2026-09-18-desktop-pause.md. Prüfe Branch, Remote und lokale Änderungen. Tasks 1–8 sind geprüft; Task 9 ist in a1db93f implementiert, hat aber neun wichtige offene Reviewbefunde in docs/reports/2026-09-18-synchronisation-review.md. Korrigiere diese mit gezielten Regressionstests und unabhängiger Nachprüfung; danach führe Tasks 10–13 vollständig aus. Beachte die technischen Entscheidungen und Integrationshinweise der Übergabe. Gesamtentwurf und Insel-Konzept sind bestätigt; keine erneute pauschale Startfreigabe nötig. Reale Produkt-Google-, Zwei-Geräte-, iPhone/iPad- und Hostingabnahmen bleiben offen. Kein zusätzliches kostenpflichtiges Cloudabo und keine Veröffentlichung ohne Auftrag.

Der Wiedereinstieg gibt Orientierung. Der konkrete aktuelle Auftrag bestimmt, welche Änderungen, Pushes und Veröffentlichungen autorisiert sind.
