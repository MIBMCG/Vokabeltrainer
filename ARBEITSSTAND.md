# Arbeitsstand

Stand: **27.09.2026**. Arbeitszweig:
`codex/vokabeltrainer-v1`.

Version 1 und die Überarbeitung A1–C2 bleiben die Produktbasis. Tasks 1–5 des bestätigten Kaufplans sind implementiert und unabhängig
geprüft. Aus Task 5 bleibt ein kleiner Tastaturfokusbefund für die
Abschlussprüfung offen. Task 6 läuft: 499/499 Node-Tests bestanden; im jüngsten
vollständigen Browserlauf bestanden 38/39 Fälle. Der Wiederanmeldetest I3
meldet einen wiederholten Upload und wird gezielt untersucht. Eine endgültige
Freigabe, der Abschlusscommit und der bestätigte Abschlusspush stehen noch aus.
Die ausführlichen Belege stehen im
[Abschlussbericht](docs/reports/2026-09-27-persistent-purchases-final.md).

## Kaufpaket Tasks 1–6

| Task | Stand | Ergebnis / Nachweis |
| --- | --- | --- |
| 1 – Vertrag und Historie | abgeschlossen und unabhängig freigegeben | Strikte Schemata, echte Lernpunkte, vollständige Beleg-/Basis-/Proofhistorie, portable Fremdherkunft. [Bericht](docs/reports/2026-09-21-persistent-purchases-task1-fix.md), [Review](docs/reports/2026-09-21-persistent-purchases-task1-review.md) |
| 2 – Transport und Einrichtung | abgeschlossen und unabhängig freigegeben | Gebundener Drive-Transport, persistierte Reservierungen und eindeutige Configinstallation. [Bericht](docs/reports/2026-09-21-persistent-purchases-task2-implementation.md), [Review](docs/reports/2026-09-21-persistent-purchases-task2-fix2-review.md) |
| 3 – Kaufdienst und Recovery | abgeschlossen und unabhängig freigegeben | `storageVersion:3`, atomare Migration, persistierte Aufträge, Wiederaufnahme und unveränderte Kandidaten/IDs. [Bericht](docs/reports/2026-09-21-persistent-purchases-task3-implementation.md), [letzte Nachprüfung](docs/reports/2026-09-26-persistent-purchases-task3-fix2-review.md) |
| 4 – Produktintegration, Restore und Backup | abgeschlossen und unabhängig freigegeben | Format-3-Aktivierung, dauerhafte Entdeckung vor Download, autoritativer Kopf nach Reconcile, v3-Sicherungsclosure und Offline-Quellcheckpoint. [Bericht](docs/reports/2026-09-26-persistent-purchases-task4-implementation.md), [letzte Nachprüfung](docs/reports/2026-09-26-persistent-purchases-task4-fix2-review.md) |
| 5 – Bedienoberfläche und Laufzeit | scoped PASS mit Minor | Implementierung `4eac721`, Fix `ae9ef27`, Bericht/Kopf `bdb65ad`; alle Important-Befunde geschlossen, Minor: Fokus nach „Stale → Abbrechen“ |
| 6 – Gesamtprüfung und Übergabe | läuft | 499/499 Node-Tests; Browser 38/39, I3-Wiederanmeldung in Diagnose; Gesamtprüfung und Abschlusspush offen |

Die historischen Testzahlen 379/389/403/471/489/492 gehören zu den jeweils
datierten Zwischenberichten. Sie sind kein Ersatz für den frischen finalen
Task-6-Gesamtlauf.

## Tatsächlicher Daten- und Kaufstand nach Task 5

- Neue Lernereignisse und Pakete bleiben im Fachformat v2. Unveränderte
  v1/v2-Objekte, Upload-IDs und Hashes werden nicht umgeschrieben.
- Der lokale Produktzustand verwendet `storageVersion:3`. Aktivierte
  Kaufepochen, wirtschaftliche Köpfe und portable wirtschaftliche Sicherungen
  verwenden Format 3.
- Lernpunkte bleiben unverändert: 10 pro richtiger Antwort und 20 pro
  abgeschlossener Runde. Ausgaben verringern weder Lernpunkte noch Level.
  Guthaben, Besitz und Auswahl werden je Profil aus der vollständigen
  bestätigten Historie abgeleitet.
- Kauf, Aktivierung und Restore speichern Intent, Kandidat, vollständige
  Uploadclosure, reservierte Datei-IDs und Pointerdaten vor der ersten davon
  abhängigen Netzoperation. Nach unbekanntem Ausgang wird zuerst gelesen;
  eine Pointerwiederholung erfolgt nur ausdrücklich mit identischem Auftrag.
- ProductSync verankert Configref und Config über `commerce.discover` dauerhaft
  vor dem Produktdownload. Erst `commerce.reconcile` darf nach Prüfung von
  Koordinator, Kopf und Historie die gemeinsame Epoche atomar aktivieren.
- Backups enthalten die vollständige wirtschaftliche Herkunft, aber keine
  Tokens, ETags, Pointerbodies oder ausführbaren Jobs. Ein neutraler Checkpoint
  darf ausschließlich im Offline-Backupexport und Quellreplay vorkommen. Die
  autoritative Zielkette lehnt ihn als Kopf oder Vorgänger ab. Auch bei gleicher
  Bindung werden checkpointlokale Objekte über reservierte physische IDs
  portabel abgebildet.
- Die Beleggeschichte wird vollständig erhalten. Es gibt keine feste
  64-Belege-Lebenszeitgrenze und keine automatische Löschung.
- Die Laufzeit bindet den Kaufdienst über schmale Commerce-Ports ein. Erwachsene
  sehen vor der Aktivierung eine rein lokale Vorschau; erst die ausdrückliche
  Bestätigung startet die dauerhaft vorbereitete Veröffentlichung.
- Im Avatarbereich stehen „Meine Figur“, „Entwicklung“ und „Shop“ oben. Der
  klassische Avatar folgt darunter im aufklappbaren Bereich „Klassischen Avatar
  gestalten“. Verfügbares Guthaben, Besitz und Auswahl werden je Profil aus dem
  bestätigten Ledger angezeigt; unklare Kaufantworten lassen sich mit „Kauf
  fortsetzen“ wiederaufnehmen.
- Der Service Worker verwendet Cacheversion `v24`. Server-Allowlist und
  Pflicht-Precache enthalten die neuen Laufzeitmodule und vier Drachenbilder;
  Google-Antworten und Tokens werden nicht gecacht.

## Bestätigter Produktumfang

Die Anforderungen R01–R33, E01–E10 und U01–U07 bleiben bestätigt. Für die
Avatar-/Shop-Erweiterung gelten AV01–AV12, O-AV01 und EV01–EV05: Käufe nur
online nach erfolgreichem Abgleich, getrennte Konten je Profil, ein gemeinsamer
Kopf je Datensatz und vollständige Entwicklungsstufenkäufe für 200/400/800
Punkte. Die Bereiche heißen „Meine Figur“, „Entwicklung“ und „Shop“.

Vier vom Nutzer bestätigte freigestellte Drachenquellen werden unverändert als
erste kaufbare Entwicklungsreihe verwendet und im Offlinecache vorgehalten.
Sie belegen zusammen 6.898.398 Bytes; kleinere responsive Varianten wurden
nicht erzeugt. **72 weitere Motive** einschließlich responsiver
Produktionsvarianten bleiben ein getrenntes Bildpaket. Die vollständige
Galeriegestaltung mit weiter ausgebautem Klassisch-/Entwicklungswechsel und
zusätzlicher Fortschrittsdarstellung bleibt Folgeumfang. Daraus darf keine
vollständige EV05-Galerie oder visuelle Abnahme abgeleitet werden.

## Noch offen

- I3-Wiederanmeldetest diagnostizieren und gegebenenfalls korrigieren;
- unabhängige Gesamtprüfung einschließlich Minor-Fokusrest, Dokumentations-
  und Diffprüfung;
- Abschlusscommit und bestätigter Push auf den bestehenden Entwicklungszweig;

- realer Produktabgleich mit Google Drive auf zwei physischen Geräten;
- iPhone-/iPad-, Safari- und Home-Bildschirm-Abnahme einschließlich
  Wiederaufnahme nach App-/Browserneustart;
- Produktion und persönliche Sichtprüfung der 72 übrigen Bildmotive;
- HTTPS-Bereitstellung und Hostingfreigabe;
- allgemeine Lizenzentscheidung.

Automatisierte Tests verwenden synthetische Daten und eine simulierte
Google-Grenze. Der historische echte Bericht 10 bestätigt 6/6 Szenarien der
damaligen isolierten Probe; er wird nicht unverändert wiederholt und ersetzt
keine reale Abnahme des integrierten Produkts.

## Historische Nachweise

- [v1-Abschluss](docs/reports/2026-09-18-vokabeltrainer-v1.md)
- [Überarbeitung A1–C2](docs/reports/2026-09-19-ueberarbeitung.md)
- [Avatar-/Shop-Entscheidungen](docs/design/2026-09-19-avatar-shop-entscheidungen.md)
- [Entwicklungsstufen EV01–EV05](docs/design/2026-09-20-avatar-entwicklungsstufen.md)
- [echte isolierte Kaufprobe 10](docs/reports/2026-09-20-shop-v10-reallauf.md)
- [Kaufplan und Taskberichte](docs/superpowers/plans/2026-09-20-persistent-purchases.md)

Ältere Pausenübergaben und Diagnoseberichte bleiben Belege ihres Datums. Ihre
damaligen nächsten Schritte gelten nicht als aktuelle Arbeitsanweisung.

## Nächster Schritt

1. I3-Diagnose abschließen und das vollständige Paket unabhängig prüfen lassen.
2. Relevante Befunde in einer gemeinsamen Fixwelle beheben und gezielt nachprüfen.
3. Finale Prüfbelege und Übergabe aktualisieren, committen und den bestehenden
   Zweig pushen; lokalen HEAD und Remote-SHA exakt vergleichen.

Keine weitere allgemeine Startfreigabe verlangen. Merge nach `main`, Hosting,
Cloudkontenänderungen und die reale Geräteabnahme sind durch diesen Ablauf nicht
automatisch autorisiert.
