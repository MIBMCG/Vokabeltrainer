# Hier mit der Weiterarbeit beginnen

Dieses Projekt kann mit beliebigen Entwicklungswerkzeugen und KI-Systemen fortgesetzt werden. Der Gesprächsverlauf ist dafür nicht erforderlich.

## Lesereihenfolge

1. [AGENTS.md](AGENTS.md)
2. [ARBEITSSTAND.md](ARBEITSSTAND.md)
3. Die dort verlinkte aktuelle Übergabe.
4. [Anforderungen und Entscheidungen](docs/ANFORDERUNGEN.md)
5. [Architektur](docs/ARCHITEKTUR.md) und [Roadmap](docs/ROADMAP.md)
6. [Bestätigter Gesamtentwurf](docs/superpowers/specs/2026-09-16-vokabeltrainer-design.md) einschließlich E01–E10 und [aktueller Umsetzungsplan](docs/superpowers/plans/2026-09-17-vokabeltrainer-v1.md).

Aktuelle Übergabe: [Produktentwicklung vom 17.09.2026](docs/handoffs/2026-09-17-produktentwicklung.md). Der Nutzer hat die vollständige Umsetzung vor den Apple-Gerätetest gezogen; Entwicklung auf `codex/vokabeltrainer-v1` fortsetzen.

## Vor dem Arbeiten

Im Repository ausführen:

```sh
git status --short --branch
git remote -v
git log -5 --oneline
```

Bei einem bestehenden Checkout lokale Änderungen vor dem Aktualisieren prüfen. Nicht blind pullen oder zurücksetzen. Bei einem frischen Start die Clone-Anleitung in [README.md](README.md) verwenden.

## Kopierbarer Wiedereinstieg

> Arbeite am Repository MIBMCG/Vokabeltrainer auf `codex/vokabeltrainer-v1` weiter. Lies zuerst AGENTS.md, ARBEITSSTAND.md und die dort verlinkte Übergabe vom 17.09.2026. Prüfe Branch, Remote und lokale Änderungen. Die synthetische Verbindungsprobe ist lokal implementiert und automatisiert geprüft; die echte Google-Anmeldung und der Drive-Abgleich zwischen zwei Browsern wurden durch den Nutzer bestätigt. Physischer Zwei-Geräte-Abgleich und iPhone/iPad-Abnahme bleiben offen. Der eigentliche Trainer für 10–13-Jährige ist noch nicht implementiert. Zusätzliche kostenpflichtige Cloudabos sind ausgeschlossen. Setze an der dokumentierten Produktentwicklung an; die Geräteabnahme wurde ausdrücklich bis nach der Umsetzung verschoben. Erfinde keine bestandene Google-, Geräte- oder Hostingabnahme.

Der Wiedereinstieg gibt Orientierung. Der konkrete aktuelle Auftrag bestimmt, welche Änderungen, Pushes und Veröffentlichungen autorisiert sind.
