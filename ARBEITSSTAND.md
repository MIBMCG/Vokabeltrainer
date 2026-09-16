# Arbeitsstand

Stand: **16.09.2026**

## Bestätigt und beauftragt

Der Nutzer hat den [Gesamtentwurf](docs/superpowers/specs/2026-09-16-vokabeltrainer-design.md) einschließlich E01–E10 mit Option A angenommen. Die Einzelfragen Q1–Q14 sind abgeschlossen; die [Anforderungen R01–R33](docs/ANFORDERUNGEN.md) bleiben verbindlich. Entwicklung und portable Projektdokumentation einschließlich GitHub-Übertragung sind beauftragt.

Ziel: Deutsch-Englisch-Vokabeltrainer für 10–13-Jährige, Klassen 4–7, mit Schwerpunkt iPhone/iPad. Gemeinsames Google Drive mit durch Erwachsene eingerichtetem Google-Zugang, getrennte Lernprofile, kein zusätzliches kostenpflichtiges Cloudabo. Drei Lernmodi, adaptive Wiederholung, Erwachsenenansicht und Inselreise gehören zur späteren ersten Trainerversion.

## Aktuelles Entwicklungspaket

Der [Plan der Google-Drive-Probe](docs/superpowers/plans/2026-09-16-google-drive-probe.md) beschreibt die begrenzte technische Probe vor umfangreicher Lernoberfläche. Sie nutzt ausschließlich synthetische Antworten und einen gekennzeichneten Drive-Testbestand. Der eigentliche Trainer ist noch nicht implementiert.

Die Anmeldeschicht und der Drive-Dateiadapter sind in `7a5a108` implementiert, die Reviewkorrektur zur begrenzten Pagination in `1745d66`. `npm test` besteht **34 Prüfungen** gegen kontrollierte HTTP-/GIS-Antworten; [Bericht](docs/reports/2026-09-16-drive-adapter.md). Die unabhängige Taskprüfung ist abgeschlossen; beide Befunde sind behoben. Die kleine mobile Probeoberfläche und deren Browserprüfungen stehen noch aus. Es gibt noch kein `npm start`.

**Pause für heute auf ausdrücklichen Nutzerwunsch.** Den geprüften Zwischenstand einschließlich Startanleitung und Übergabe nach GitHub übertragen; danach keine weitere Entwicklung oder automatische Fortsetzung. Task 2 wurde vor der ersten Dateiänderung angehalten.

Arbeitszweig: `codex/google-drive-probe`. Getrennte Arbeitskopie im ursprünglichen Checkout unter `.worktrees/drive-probe/`. Ausgangspunkt ist `707d504` auf `main`; aktuelle Commits und Remote frisch prüfen. Die Arbeitskopie erfordert keinen bestimmten Rechnerpfad auf einem anderen System.

Aktuelle Übergabe: [Pause und Wiedereinstieg](docs/handoffs/2026-09-16-pause.md). Vorgeschichte: [Entwicklungsstart](docs/handoffs/2026-09-16-entwicklungsstart.md).
Einrichtung und Prüfablauf: [Google-Drive-Probe](docs/GOOGLE-DRIVE-PROBE.md).

## Äußere Voraussetzungen und nächste Schritte

Die Frage nach einer bereits vorhandenen Google-Cloud-Registrierung und öffentlichen OAuth-Client-ID wurde gestellt. Bisher ist keine Registrierung für dieses Projekt nachgewiesen. Der lokale Entwicklungsursprung wird `http://localhost:4173`; die öffentliche Client-ID wird in der Probe eingegeben. Keine Passwörter oder Client-Secrets erforderlich.

Für reale iOS-Prüfungen fehlen Geräte-/Versionsangaben, Testverfügbarkeit und eine abgestimmte HTTPS-Bereitstellung. Der Nutzer besitzt keine Apple-Geräte; sein Freund als künftiger Hauptnutzer besitzt iPhone und iPad. Niemand wird ohne Auftrag kontaktiert.

Bei ausdrücklicher Wiederaufnahme zuerst `npm test` ausführen, dann Task 2 des Plans beginnen: Modelltests für Deduplizierung, späte Offlineantworten und konkurrierende Rücksetzungen schreiben, erwartetes Fehlschlagen belegen und danach das Modell implementieren. Es folgen IndexedDB, Controller und Probeoberfläche. Anschließend mit echtem Google-Zugriff auf zwei Geräten testen. Vor umfangreicher Lernoberfläche muss insbesondere die Anmeldung in Safari und als Home-Bildschirm-App praktisch nachgewiesen werden.

## Noch nicht vorhanden oder nachgewiesen

- Vollständiger Trainer mit Lernprofilen, Wortverwaltung, adaptiver Auswahl, Erwachsenen-PIN und Inselreise.
- Produktfähige Synchronisation einschließlich vollständigem Sicherungsimport und Erwachsenen-Konfliktlösung.
- Echte Google-Anmeldung oder Zwei-Geräte-Abgleich für dieses Projekt.
- Reale iPhone-/iPad-Abnahme und festgelegte Mindestversionen.
- Eingerichtetes Hosting oder veröffentlichte Trainer-URL.

Die allgemeine Lizenzentscheidung bleibt bewusst zurückgestellt. Keine öffentliche Freigabe, Repository-Sichtbarkeitsänderung, gebührenpflichtige Einrichtung oder Veröffentlichung einer laufenden App ist durchgeführt.

## Bisherige Berichte

- [Gesamtentwurf und Anforderungsklärung](docs/reports/2026-09-16-gesamtentwurf.md), historischer Stand vor Entwurfsbestätigung.
- [Ursprüngliches Dokumentationspaket](docs/reports/2026-09-16-dokumentation.md).

Keine erneute pauschale Entwicklungs- oder Entwurfsfreigabe verlangen. Neue Produktabweichungen anhand konkreter Befunde klären; technische Nachweise nicht durch Zustimmung ersetzen.
