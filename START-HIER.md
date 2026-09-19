# Hier mit der Weiterarbeit beginnen

**Neuer Auftrag vom 19.09.2026:** Die bisherige App wurde praktisch getestet. Gestaltung und Bedienung werden gemäß [Überarbeitungsentwurf](docs/design/2026-09-19-ueberarbeitung.md) verbessert; auch einstellbare Lernregeln und Diagramme sind beauftragt. Vor Weiterarbeit den aktuellen Arbeitsstand lesen. Der unten dokumentierte v1-Abschluss ist der Ausgangsstand, keine Abnahme des neuen Pakets.

Die vollständige Version 1 ist am 18.09.2026 implementiert und automatisiert geprüft. Maßgeblich sind der [Abschlussbericht](docs/reports/2026-09-18-vokabeltrainer-v1.md), der [Arbeitsstand](ARBEITSSTAND.md) und die [aktuelle Übergabe](docs/handoffs/2026-09-18-vokabeltrainer-v1.md). Die unabhängige Gesamtprüfung und die einmalige Nachprüfung aller vier Abschlusskorrekturen sind bestanden; siehe [finale Review](docs/reports/2026-09-18-vokabeltrainer-v1-final-fix-review.md).

Reale Produktprüfungen mit Google Drive auf zwei physischen Geräten, Safari und Home-Bildschirm-App auf iPhone/iPad sowie eine HTTPS-Bereitstellung bleiben offen. Die automatisierten Tests verwenden ausschließlich synthetische Daten und eine simulierte Google-Grenze.

## Lesereihenfolge

1. [AGENTS.md](AGENTS.md)
2. [ARBEITSSTAND.md](ARBEITSSTAND.md)
3. [Aktuelle Übergabe](docs/handoffs/2026-09-19-ueberarbeitung.md)
4. [Anforderungen und Entscheidungen](docs/ANFORDERUNGEN.md)
5. [Architektur](docs/ARCHITEKTUR.md) und [Produkt-Datenvertrag](docs/PRODUKT-DATENFORMAT.md)
6. [Bestätigter Gesamtentwurf](docs/superpowers/specs/2026-09-16-vokabeltrainer-design.md) einschließlich E01–E10 und [v1-Umsetzungsplan](docs/superpowers/plans/2026-09-17-vokabeltrainer-v1.md)

## Vor dem Arbeiten

```sh
git status --short --branch
git remote -v
git log -5 --oneline
npm test
npm run check:docs
```

Die Browserprüfungen und ihre optionalen Umgebungsvariablen stehen in [tests/browser/README.md](tests/browser/README.md). `npm start` stellt Probe und Trainer lokal bereit; der Trainer liegt unter `http://localhost:4173/trainer/`.

## Kopierbarer Wiedereinstieg

> Arbeite am Repository MIBMCG/Vokabeltrainer auf `codex/vokabeltrainer-v1` weiter. Lies zuerst AGENTS.md, ARBEITSSTAND.md und docs/handoffs/2026-09-19-ueberarbeitung.md. Prüfe Branch, Remote und lokale Änderungen. Nach dem Praxistest sind bessere Konzeptnähe mit Rasterillustrationen, einfachere Einrichtung/Verwaltung, erklärte Modi, einstellbare Lernregeln und Diagramme beauftragt. Google Drive mit zentral vorbereiteter App-Konfiguration und Regeln je Kind sind bestätigt. Prüfe den Status der Entwurfsfreigabe; nach deren Bestätigung den Implementierungsplan erstellen. Echte Geräteabnahme und Hosting bleiben getrennt. Keine privaten Browserdaten verwenden oder löschen.

Der konkrete aktuelle Auftrag bestimmt, welche Änderungen, Pushes und Veröffentlichungen autorisiert sind. Bestätigte Entscheidungen nicht erneut pauschal abfragen.
