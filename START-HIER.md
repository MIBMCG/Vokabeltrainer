# Hier mit der Weiterarbeit beginnen

**Neuer Auftrag vom 19.09.2026:** Die bisherige App wurde praktisch getestet. Der [Überarbeitungsentwurf](docs/design/2026-09-19-ueberarbeitung.md) für Gestaltung, Bedienung, Lernregeln und Diagramme ist ausdrücklich bestätigt. Der [Implementierungsplan](docs/superpowers/plans/2026-09-19-ueberarbeitung.md) ist mit Nutzerantwort A zur Umsetzung mit Aufgabenagenten und Einzelreviews bestätigt. Aktueller Fortschritt und Prüfbelege stehen im Arbeitsstand. Vor Weiterarbeit den aktuellen Arbeitsstand lesen. Der unten dokumentierte v1-Abschluss ist der Ausgangsstand, keine Abnahme des neuen Pakets.

Die vollständige Version 1 ist am 18.09.2026 implementiert und automatisiert geprüft. Maßgeblich sind der [Abschlussbericht](docs/reports/2026-09-18-vokabeltrainer-v1.md), der [Arbeitsstand](ARBEITSSTAND.md) und die [aktuelle Übergabe](docs/handoffs/2026-09-19-ueberarbeitung.md). Die unabhängige Gesamtprüfung und die einmalige Nachprüfung aller vier Abschlusskorrekturen sind bestanden; siehe [finale Review](docs/reports/2026-09-18-vokabeltrainer-v1-final-fix-review.md).

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

> Arbeite am Repository MIBMCG/Vokabeltrainer auf `codex/vokabeltrainer-v1` weiter. Lies zuerst AGENTS.md, ARBEITSSTAND.md und docs/handoffs/2026-09-19-ueberarbeitung.md. Prüfe Branch, Remote und lokale Änderungen. Der schriftliche Überarbeitungsentwurf ist mit „Ja, Freigabe erteilt“ bestätigt. Der Implementierungsplan steht unter docs/superpowers/plans/2026-09-19-ueberarbeitung.md. Die Ausführung A mit Aufgabenagenten und Einzelreviews ist bestätigt; setze beim ersten noch nicht abgeschlossenen Arbeitspaket A1–C2 fort. Google Drive mit vorbereiteter App-Konfiguration, Regeln je Kind und deren Wirkung ab nächster neuer Runde nicht erneut abstimmen. Echte Geräteabnahme und Hosting bleiben getrennt. Keine privaten Browserdaten verwenden oder löschen.

Der konkrete aktuelle Auftrag bestimmt, welche Änderungen, Pushes und Veröffentlichungen autorisiert sind. Bestätigte Entscheidungen nicht erneut pauschal abfragen.
