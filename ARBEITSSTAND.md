# Arbeitsstand

Stand: **17.09.2026**

## Bestätigt und beauftragt

Der Nutzer hat den [Gesamtentwurf](docs/superpowers/specs/2026-09-16-vokabeltrainer-design.md) einschließlich E01–E10 mit Option A angenommen. Die Einzelfragen Q1–Q14 sind abgeschlossen; die [Anforderungen R01–R33](docs/ANFORDERUNGEN.md) bleiben verbindlich. Entwicklung und portable Projektdokumentation einschließlich GitHub-Übertragung sind beauftragt.

Ziel: Deutsch-Englisch-Vokabeltrainer für 10–13-Jährige, Klassen 4–7, mit Schwerpunkt iPhone/iPad. Gemeinsames Google Drive mit durch Erwachsene eingerichtetem Google-Zugang, getrennte Lernprofile, kein zusätzliches kostenpflichtiges Cloudabo. Drei Lernmodi, adaptive Wiederholung, Erwachsenenansicht und Inselreise gehören zur späteren ersten Trainerversion.

## Aktuelles Entwicklungspaket

Der [Plan der Google-Drive-Probe](docs/superpowers/plans/2026-09-16-google-drive-probe.md) beschreibt die begrenzte technische Probe vor umfangreicher Lernoberfläche. Sie nutzt ausschließlich synthetische Antworten und einen gekennzeichneten Drive-Testbestand. Der eigentliche Trainer ist noch nicht implementiert.

Die Anmelde-/Drive-Schicht entstand in `7a5a108` und `1745d66`. Die persistente mobile Probe wurde in `0f3f03e` umgesetzt und nach unabhängiger Review in `e7424b5` sowie `230defb` korrigiert. Sie umfasst synthetische Ereignisse, IndexedDB, feste Konto-/Ordnerbindung je Browserprofil, wiederholbare Uploads, leere Rücksetzung mit verifizierter Sicherung, mobile Oberfläche, lokalen Server und eigenen Offline-Service-Worker. Das begrenzte Format ist in [PROBE-DATENFORMAT.md](docs/PROBE-DATENFORMAT.md) beschrieben.

Auf `230defb` liefen `npm test` mit **73/73 bestandenen Tests** und neun Browser-Szenarien mit Playwright 1.62.1, System-Edge 153.0.4234.32 und Node 22.23.2 ohne Seitenfehler. Die Browserprüfung bediente echte DOM-, IndexedDB- und Service-Worker-Pfade; nur Google Identity Services und Drive-HTTP wurden simuliert. Desktop 1280×900 und Mobil 390×844 wurden visuell geprüft; Bedienelemente waren mindestens 44 Pixel hoch, das Eingabefeld mindestens 16 Pixel groß. Details: [Prüfbericht](docs/reports/2026-09-17-google-drive-probe.md).

Die unabhängige Task-2-Review ist nach zwei Fixrunden ohne offenen Befund abgeschlossen. Für die Umsetzung arbeiteten GPT-5.6 Sol mit hoher Denktiefe, für diese Dokumentation GPT-5.6 Sol mit mittlerer Denktiefe; eine abschließende unabhängige Prüfung mit GPT-6 Astra und hoher Denktiefe ist als nächster interner Schritt vorgesehen. Keine Integration nach `main`, kein Push und keine öffentliche Bereitstellung wurden in diesem Arbeitspaket durchgeführt.

Arbeitszweig: `codex/google-drive-probe`. Getrennte Arbeitskopie im ursprünglichen Checkout unter `.worktrees/drive-probe/`. Ausgangspunkt ist `707d504` auf `main`; aktuelle Commits und Remote frisch prüfen. Die Arbeitskopie erfordert keinen bestimmten Rechnerpfad auf einem anderen System.

Aktuelle Übergabe: [Verbindungsprobe und externer Prüfschritt](docs/handoffs/2026-09-17-verbindungsprobe.md). Vorgeschichte: [Pause und Wiedereinstieg](docs/handoffs/2026-09-16-pause.md).
Einrichtung und Prüfablauf: [Google-Drive-Probe](docs/GOOGLE-DRIVE-PROBE.md).

## Äußere Voraussetzungen und nächste Schritte

Die Frage nach einer bereits vorhandenen Google-Cloud-Registrierung und öffentlichen OAuth-Client-ID wurde gestellt, aber noch nicht beantwortet. Bisher ist keine Registrierung für dieses Projekt nachgewiesen. Der lokale Entwicklungsursprung ist `http://localhost:4173`; die öffentliche Client-ID wird nur lokal in der Probe eingegeben. Keine Passwörter oder Client-Secrets anfordern oder speichern.

Für reale iOS-Prüfungen fehlen Geräte-/Versionsangaben, Testverfügbarkeit und eine abgestimmte HTTPS-Bereitstellung. Der Nutzer besitzt keine Apple-Geräte; sein Freund als künftiger Hauptnutzer besitzt iPhone und iPad. Niemand wird ohne Auftrag kontaktiert.

Nächster fachlicher Schritt ist die [Google-Einrichtung](docs/GOOGLE-DRIVE-PROBE.md#google-einmalig-vorbereiten) durch die projektverantwortliche erwachsene Person und danach der reale Test mit demselben OAuth-Client, Google-Konto und Probeordner auf zwei Geräten. Für iPhone/iPad ist zusätzlich eine abgestimmte HTTPS-Bereitstellung nötig; Safari und Home-Bildschirm-App werden getrennt geprüft. Bis diese Nachweise vorliegen, ist die frühe Machbarkeitsprüfung nicht bestanden und umfangreiche Lernoberfläche nicht freigegeben.

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
- [Drive-Adapter](docs/reports/2026-09-16-drive-adapter.md).
- [Lokale Verbindungsprobe](docs/reports/2026-09-17-google-drive-probe.md).

Keine erneute pauschale Entwicklungs- oder Entwurfsfreigabe verlangen. Neue Produktabweichungen anhand konkreter Befunde klären; technische Nachweise nicht durch Zustimmung ersetzen.
