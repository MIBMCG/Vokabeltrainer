# Hier mit der Weiterarbeit beginnen

**Aktive Umsetzung, aktualisiert 20.09.2026:** Der Avatar-Shop-Entwurf und AV01–AV12 bleiben freigegeben. Der zweite echte Google-Bericht ist ausgewertet: weder Medien- noch Metadatenheader liefern eine browserlesbare Versionskennung. Ein ausdrücklich wählbarer v2-JSON-Kandidat ist als Diagnoseversion 3 vorbereitet; seine Wirkung bei echten v3-Schreibaufrufen ist noch nicht belegt. [Auswertung](docs/reports/2026-09-20-shop-zweiter-reallauf.md). Die erneute Nutzerkritik an der Ausrüstung ist berechtigt: [Zweitaudit aller 13 Figuren](docs/reports/2026-09-20-avatar-fit-second-audit.md). Frühere positive Passformurteile sind zurückgenommen. Keine weiteren blinden Neugenerierungen; zunächst körperbezogene Einzelteile und korrekte Verdeckung an Pferd und Tiger erproben. Neue Figurenwahl und Käufe sind weiterhin nicht im Produkt aktiviert. [Aktuelle Übergabe](docs/handoffs/2026-09-20-avatar-fit-und-drive-v2.md).

**Aktuell in Umsetzung:** [Avatar-Erweiterung und Punkteshop](docs/design/2026-09-19-avatar-shop-entscheidungen.md), AV01–AV12 bestätigt, Offlinekauf ausgeschlossen. Der [Gesamtentwurf](docs/superpowers/specs/2026-09-19-avatar-shop-design.md) ist freigegeben; keine bereits bestätigten Einzelentscheidungen wiederholen. Produktshop noch nicht integriert. Die Google-Kaufprobe unter `/shop-probe/` läuft inzwischen; der erste Medienlauf ist ausgewertet. Nächster technischer Nachweis: echter Bericht des ausdrücklich ausgewählten v2-JSON-Kandidaten aus Diagnoseversion 3.

**Neuer Auftrag vom 19.09.2026:** Die bisherige App wurde praktisch getestet. Der [Überarbeitungsentwurf](docs/design/2026-09-19-ueberarbeitung.md) für Gestaltung, Bedienung, Lernregeln und Diagramme ist ausdrücklich bestätigt. Der [Implementierungsplan](docs/superpowers/plans/2026-09-19-ueberarbeitung.md) ist mit Nutzerantwort A zur Umsetzung mit Aufgabenagenten und Einzelreviews bestätigt. A1–C1 sind unabhängig geprüft; C2 ist implementiert und vollständig automatisiert geprüft. Die unabhängige Gesamtprüfung samt Korrekturen ist abgeschlossen. Aktueller Fortschritt und Prüfbelege stehen im [zusammengeführten Bericht](docs/reports/2026-09-19-ueberarbeitung.md) und im Arbeitsstand. Vor Weiterarbeit den aktuellen Arbeitsstand lesen. Der unten dokumentierte v1-Abschluss ist der Ausgangsstand, keine Abnahme des neuen Pakets.

Maßgeblich sind der [aktuelle Prüfbericht](docs/reports/2026-09-19-ueberarbeitung.md), der [Arbeitsstand](ARBEITSSTAND.md) und die [aktuelle Übergabe](docs/handoffs/2026-09-19-ueberarbeitung.md). Der [v1-Abschluss vom 18.09.2026](docs/reports/2026-09-18-vokabeltrainer-v1.md) bleibt als historische Grundlage erhalten; seine Tests und Screenshots nicht als Nachweis für spätere Änderungen ausgeben.

Reale Produktprüfungen mit Google Drive auf zwei physischen Geräten, Safari und Home-Bildschirm-App auf iPhone/iPad sowie eine HTTPS-Bereitstellung bleiben offen. Die automatisierten Tests verwenden ausschließlich synthetische Daten und eine simulierte Google-Grenze.

## Lesereihenfolge

1. [AGENTS.md](AGENTS.md)
2. [ARBEITSSTAND.md](ARBEITSSTAND.md)
3. [Aktuelle Avatar-Shop-Übergabe](docs/handoffs/2026-09-19-avatar-shop.md); [A1–C2-Übergabe](docs/handoffs/2026-09-19-ueberarbeitung.md) als Vorgeschichte
4. [Anforderungen und Entscheidungen](docs/ANFORDERUNGEN.md)
5. [Architektur](docs/ARCHITEKTUR.md) und [Produkt-Datenvertrag](docs/PRODUKT-DATENFORMAT.md)
6. [Bestätigter Überarbeitungsentwurf](docs/design/2026-09-19-ueberarbeitung.md) und [Umsetzungsplan A1–C2](docs/superpowers/plans/2026-09-19-ueberarbeitung.md); als Grundlage [Gesamtentwurf](docs/superpowers/specs/2026-09-16-vokabeltrainer-design.md) einschließlich E01–E10

## Vor dem Arbeiten

```sh
git status --short --branch
git remote -v
git log -5 --oneline
npm test
npm run check:docs
```

Die Browserprüfungen und ihre optionalen Umgebungsvariablen stehen in [tests/browser/README.md](tests/browser/README.md). `npm start` stellt Probe und Trainer lokal bereit; der Trainer liegt unter `http://localhost:4173/trainer/`.

Code und Dokumente liegen auf `codex/vokabeltrainer-v1`. Auf einem anderen Rechner einen frischen Clone dieses Zweigs verwenden. Git überträgt keine Browserdaten oder Google-Anmeldungen; bestehende Lernbereiche bewusst über die vorbereitete Google-Verbindung auswählen. Eigene Daten nicht in Testprofile kopieren und keine Browserdaten zum Reparieren löschen.

## Kopierbarer Wiedereinstieg

> Arbeite am Repository MIBMCG/Vokabeltrainer auf `codex/vokabeltrainer-v1` weiter. Lies zuerst AGENTS.md, ARBEITSSTAND.md und docs/handoffs/2026-09-19-ueberarbeitung.md. Prüfe Branch, Remote und lokale Änderungen. Der schriftliche Überarbeitungsentwurf ist mit „Ja, Freigabe erteilt“ bestätigt. Der Implementierungsplan steht unter docs/superpowers/plans/2026-09-19-ueberarbeitung.md. A1–C2 sind einschließlich unabhängiger Gesamtprüfung und Nachprüfung abgeschlossen. Beginne sie nicht erneut; lies die aktuelle Übergabe und bearbeite den konkreten neuen Nutzerauftrag. Nächste offene Nachweise sind echte Geräte-/Google-Prüfungen; HTTPS-Bereitstellung benötigt einen eigenen Auftrag. Google Drive mit vorbereiteter App-Konfiguration, Regeln je Kind und deren Wirkung ab nächster neuer Runde nicht erneut abstimmen. Echte Geräteabnahme und Hosting bleiben getrennt. Keine privaten Browserdaten verwenden oder löschen.

Der konkrete aktuelle Auftrag bestimmt, welche Änderungen, Pushes und Veröffentlichungen autorisiert sind. Bestätigte Entscheidungen nicht erneut pauschal abfragen.
