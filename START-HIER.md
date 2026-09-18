# Hier mit der Weiterarbeit beginnen

Die vollständige Version 1 ist am 18.09.2026 implementiert und automatisiert geprüft. Maßgeblich sind der [Abschlussbericht](docs/reports/2026-09-18-vokabeltrainer-v1.md), der [Arbeitsstand](ARBEITSSTAND.md) und die [aktuelle Übergabe](docs/handoffs/2026-09-18-vokabeltrainer-v1.md). Die unabhängige Gesamtprüfung und die einmalige Nachprüfung aller vier Abschlusskorrekturen sind bestanden; siehe [finale Review](docs/reports/2026-09-18-vokabeltrainer-v1-final-fix-review.md).

Reale Produktprüfungen mit Google Drive auf zwei physischen Geräten, Safari und Home-Bildschirm-App auf iPhone/iPad sowie eine HTTPS-Bereitstellung bleiben offen. Die automatisierten Tests verwenden ausschließlich synthetische Daten und eine simulierte Google-Grenze.

## Lesereihenfolge

1. [AGENTS.md](AGENTS.md)
2. [ARBEITSSTAND.md](ARBEITSSTAND.md)
3. [Aktuelle Übergabe](docs/handoffs/2026-09-18-vokabeltrainer-v1.md)
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

> Arbeite am Repository MIBMCG/Vokabeltrainer auf `codex/vokabeltrainer-v1` weiter. Lies zuerst AGENTS.md, ARBEITSSTAND.md und docs/handoffs/2026-09-18-vokabeltrainer-v1.md. Prüfe Branch, Remote und lokale Änderungen. Version 1 ist implementiert und automatisiert geprüft; die unabhängige Gesamtprüfung einschließlich aller Abschlusskorrekturen ist abgeschlossen. Produktcode cc079cb bestand 277 Node- und 15 Trainer-Browserprüfungen. Bereite als nächsten Schritt die dokumentierte reale Geräteabnahme vor; richte Hosting erst nach ausdrücklichem Auftrag ein. Reale Produkt-Google-, Zwei-Geräte-, iPhone-/iPad-, Safari-/Home-Screen- und HTTPS-Nachweise bleiben offen. Nutze nur synthetische Daten. Keine Veröffentlichung, Kontenänderung, Lizenzentscheidung oder gebührenpflichtige Einrichtung ohne Auftrag.

Der konkrete aktuelle Auftrag bestimmt, welche Änderungen, Pushes und Veröffentlichungen autorisiert sind. Bestätigte Entscheidungen nicht erneut pauschal abfragen.
