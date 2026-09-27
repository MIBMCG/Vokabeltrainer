# Arbeitsstand

Stand: **27.09.2026**. Arbeitszweig:
`codex/vokabeltrainer-v1`.

## Aktuelle Nachbesserung aus dem Nutzertest

Das neue Korrekturpaket behandelt Abgleichschleifen, langsame bzw. wiederholt
bestätigte Käufe, unerwartete Google-Trennungen und eine parallele Neuanlage.
Der aktuelle Einstieg steht in der
[Übergabe zu Abgleich und Käufen](docs/handoffs/2026-09-27-sync-und-kaeufe.md),
Ursachen und Prüfgrenzen im [Prüfbericht](docs/reports/2026-09-27-sync-und-kaeufe.md).
Finaler Prüfstand dieses Pakets: **543/543 Node-Tests und 54/54 Browserfälle**,
unabhängige Nachprüfungen ohne verbleibenden Befund. Echte Drive-Laufzeit und
iOS-/Zwei-Geräte-Abnahme bleiben offen; nach Reload bleibt ein Google-Klick nötig.

Die Bedienkorrekturen vom 27.09. umfassen den Updatehinweis, die einheitliche
Figurendarstellung mit direkt erreichbaren Farben, den Google-Wiederverbindenweg
im Shop und kompakte Erwachsenen-Einstellungen. Prüfstand und Ursachen stehen
im [Bedienbericht](docs/reports/2026-09-27-bedienkorrekturen.md), Einstieg und
Grenzen in der [vorherigen Übergabe](docs/handoffs/2026-09-27-bedienkorrekturen.md).

## Vorheriger Abschlussstand

Version 1 und die Überarbeitung A1–C2 bleiben die Produktbasis. Das bestätigte Kaufpaket (Tasks 1–6) ist umgesetzt und unabhängig geprüft.
Alle sechs Abschlussbefunde sind geschlossen. Auf Produktstand `1e29ac3`
bestanden frisch 506/506 Node-Tests und 43/43 Browserfälle; die abschließende
Nachprüfung bewertet Spec und Qualität mit PASS. Der Produktcommit ist auf
GitHub exakt bestätigt. Die nachfolgende Dokumentation ergänzt Prüfbelege,
Bedienungsanleitung und portable Übergabe auf demselben Entwicklungszweig.
Die ausführlichen Belege stehen im
[Abschlussbericht](docs/reports/2026-09-27-persistent-purchases-final.md).

## Kaufpaket Tasks 1–6

| Task | Stand | Ergebnis / Nachweis |
| --- | --- | --- |
| 1 – Vertrag und Historie | abgeschlossen und unabhängig freigegeben | Strikte Schemata, echte Lernpunkte, vollständige Beleg-/Basis-/Proofhistorie, portable Fremdherkunft. [Bericht](docs/reports/2026-09-21-persistent-purchases-task1-fix.md), [Review](docs/reports/2026-09-21-persistent-purchases-task1-review.md) |
| 2 – Transport und Einrichtung | abgeschlossen und unabhängig freigegeben | Gebundener Drive-Transport, persistierte Reservierungen und eindeutige Configinstallation. [Bericht](docs/reports/2026-09-21-persistent-purchases-task2-implementation.md), [Review](docs/reports/2026-09-21-persistent-purchases-task2-fix2-review.md) |
| 3 – Kaufdienst und Recovery | abgeschlossen und unabhängig freigegeben | `storageVersion:3`, atomare Migration, persistierte Aufträge, Wiederaufnahme und unveränderte Kandidaten/IDs. [Bericht](docs/reports/2026-09-21-persistent-purchases-task3-implementation.md), [letzte Nachprüfung](docs/reports/2026-09-26-persistent-purchases-task3-fix2-review.md) |
| 4 – Produktintegration, Restore und Backup | abgeschlossen und unabhängig freigegeben | Format-3-Aktivierung, dauerhafte Entdeckung vor Download, autoritativer Kopf nach Reconcile, v3-Sicherungsclosure und Offline-Quellcheckpoint. [Bericht](docs/reports/2026-09-26-persistent-purchases-task4-implementation.md), [letzte Nachprüfung](docs/reports/2026-09-26-persistent-purchases-task4-fix2-review.md) |
| 5 – Bedienoberfläche und Laufzeit | abgeschlossen und unabhängig geprüft | Drei Figurenbereiche, echte Kaufaktionen, aktuelle Sicherung und profilgetrennte Auswahl; sämtliche Important- und Minor-Befunde geschlossen |
| 6 – Gesamtprüfung und Übergabe | abgeschlossen | 506/506 Node, 43/43 Browser auf 1e29ac3; alle RF-Befunde geschlossen; Produktstand exakt auf GitHub bestätigt, Dokumentationsabschluss folgt auf demselben Zweig |

Die historischen Testzahlen 379/389/403/471/489/492 gehören zu den jeweils
datierten Zwischenberichten. Sie sind kein Ersatz für den frischen finalen
Task-6-Gesamtlauf.

## Tatsächlicher Daten- und Kaufstand

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
- Der Service Worker verwendet Cacheversion `v26`. Server-Allowlist und
  Pflicht-Precache enthalten die neuen Laufzeitmodule, vier Drachenbilder und
  alle 20 kleinen Haut-/Kleidungsbilder der menschlichen Grundfiguren;
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

1. Die korrigierten Bedienwege mit dem Nutzer nachtesten; besonders
   Figurenfarben, Wiederverbinden im Shop und die Erwachsenen-Einstellungen.
2. Am bestätigten Bild- und Galeriekonzept ansetzen: 72 übrige Motive und
   responsive Varianten produzieren, anschließend vollständige EV05-Galerie
   integrieren und visuell prüfen.
3. Das integrierte Produkt auf zwei realen Geräten einschließlich iPhone/iPad
   prüfen; die historische Probe 10 nicht unverändert wiederholen.
4. Hosting/HTTPS und allgemeine Lizenz nur im dafür bestätigten Umfang angehen.

Keine weitere allgemeine Startfreigabe verlangen. Merge nach `main`, Hosting,
Cloudkontenänderungen und reale Geräteabnahme sind durch den Abschluss dieses
Kaufpakets nicht automatisch autorisiert. Einstieg über die
[aktuelle Übergabe](docs/handoffs/2026-09-27-bedienkorrekturen.md).
