# Arbeitsstand

Fortsetzung am Desktop am 18.09.2026 ausdrücklich beauftragt. GitHub-Stand c60ced1 wurde in die saubere bestehende Arbeitskopie übernommen; die Pause ist beendet. Task 9 ist nach zwei Korrekturrunden unabhängig geprüft (37c459f, 227 Node-Tests). Task 10 ist nach Korrektur und unabhängiger Nachprüfung abgeschlossen (49fde90, 259 Node-Tests). Task 11 ist nach zwei Korrekturrunden unabhängig geprüft (2a37a25). Task 12 Offline-PWA ist nach Korrektur und unabhängiger Nachprüfung abgeschlossen (2b369e3, 276 Node-Tests). Task 13 Abschlussprüfung und portable Übergabe läuft. Aktuelle [Desktop-Fortsetzung](docs/handoffs/2026-09-18-desktop-fortsetzung.md); die nachfolgende Pausenübergabe bleibt historische Ausgangsevidenz.

**Historischer Ausgangsstand (durch die Fortsetzung aufgehoben):** Pause am 18.09.2026 ausdrücklich beauftragt. Entwicklung damals angehalten; der Nutzer hat die Sicherung aller Projektänderungen nach GitHub und eine Übergabe für den Desktop beauftragt. Maßgeblich ist die [Desktop-Übergabe](docs/handoffs/2026-09-18-desktop-pause.md). Erst nach ausdrücklicher Fortsetzung weiterarbeiten.

Änderung der Prüfungsreihenfolge am 17.09.2026: Der Nutzer beauftragt ausdrücklich, zuerst die vollständige App gemäß bestätigtem Gesamtentwurf umzusetzen und erst danach beim Freund auf iPhone/iPad zu testen. Die bisherige Geräteprüfung vor umfangreicher Lernoberfläche ist damit als Entwicklungssperre aufgehoben. Reale Geräteabnahme bleibt offen und darf nicht als bestanden gelten. Bereits bestätigte manuelle Google-/Drive-Tests in zwei Browsern gelten weiter. Keine neue pauschale Startfreigabe verlangen; Hosting/Veröffentlichung und Kostenmodell werden dadurch nicht automatisch geändert.

Stand: **18.09.2026**

## Bestätigt und beauftragt

Der Nutzer hat den [Gesamtentwurf](docs/superpowers/specs/2026-09-16-vokabeltrainer-design.md) einschließlich E01–E10 mit Option A angenommen. Die Einzelfragen Q1–Q14 sind abgeschlossen; die [Anforderungen R01–R33](docs/ANFORDERUNGEN.md) bleiben verbindlich. Entwicklung und portable Projektdokumentation einschließlich GitHub-Übertragung sind beauftragt.

Ziel: Deutsch-Englisch-Vokabeltrainer für 10–13-Jährige, Klassen 4–7, mit Schwerpunkt iPhone/iPad. Gemeinsames Google Drive mit durch Erwachsene eingerichtetem Google-Zugang, getrennte Lernprofile, kein zusätzliches kostenpflichtiges Cloudabo. Drei Lernmodi, adaptive Wiederholung, Erwachsenenansicht und Inselreise gehören zur späteren ersten Trainerversion.

## Aktuelles Entwicklungspaket

### Vollständige App: Umsetzung wieder aufgenommen

Die Umsetzung folgt dem [v1-Plan](docs/superpowers/plans/2026-09-17-vokabeltrainer-v1.md) und [Produkt-Datenvertrag](docs/PRODUKT-DATENFORMAT.md). Tasks 1–9 sind implementiert und unabhängig geprüft: Ereignisformat, Inhaltsfassungen/Epochen, adaptive Lern- und Belohnungslogik, fortsetzbare Runden, atomare Speicherung, Einrichtung/Erwachsenenverwaltung, Übungsbildschirm sowie Inselreise und Avatar. Die Produktoberfläche liegt unter `/trainer/`. Kleine vorgemerkte Befunde sind in der Desktop-Übergabe einzelnen Folgeaufgaben zugeordnet.

Task 9 ist nach zwei Korrekturrunden abgeschlossen: `37c459f`, **227/227 Node-Tests**, unabhängige Nachprüfung ohne neue Fehler im Korrekturdiff. Details und ältere Laptop-Belege bleiben in der [Desktop-Fortsetzung](docs/handoffs/2026-09-18-desktop-fortsetzung.md) erhalten.

Task 10 (Sicherung/Wiederherstellung) ist in `ee50662` erstmals implementiert: **254/254 Node-Tests**, **4/4 Trainer-Browserfälle**. Die [unabhängige Review](docs/reports/2026-09-18-sicherung-wiederherstellung-review.md) fand eine wichtige Lücke bei nachträglich widersprüchlichen Snapshotmanifesten und bereits gecachten Epochen. Korrekturrunde 1 ist mit `49fde90` abgeschlossen: **259/259 Node-Tests**, [Nachprüfung ohne offene Befunde](docs/reports/2026-09-18-sicherung-wiederherstellung-fix-1-review.md). Task 10 ist freigegeben. Task 11 Oberflächenintegration ist abgeschlossen: [Implementierungsbericht](docs/reports/2026-09-18-abgleich-sicherung-oberflaeche.md), [abschließende Nachprüfung](docs/reports/2026-09-18-abgleich-sicherung-oberflaeche-fix-2-review.md). Gesamtlauf auf dem Implementierungsstand: 260 Node-Tests; nach den UI-Korrekturen vier betroffene Browserfälle grün. Task 12 Offline-PWA ist nach Korrektur 2b369e3 unabhängig geprüft: 276/276 Node-Tests, echte Offline-Neustarts und kontrollierter Versionswechsel. Task 13 Abschlussprüfung läuft. Reale Apple-Geräte sind weiterhin nicht abgenommen.
Auf Wunsch entstand ein [visuelles Konzept mit drei Ansichten](docs/design/2026-09-17-insel-konzept.md). Es bleibt eine Gestaltungsvorschau. Zusätzlich liegen jetzt [tatsächliche Browseransichten der implementierten Inselreise und des Avatars](docs/reports/2026-09-18-inselreise-avatar.md) vor.

Der [Benutzungsleitfaden](docs/BENUTZUNG.md) beschreibt die bestätigten Abläufe mit ausdrücklicher Kennzeichnung des Entwicklungsstands. Keine Produkt-Geräteabnahme oder Bereitstellung ist damit behauptet.
Der [Plan der Google-Drive-Probe](docs/superpowers/plans/2026-09-16-google-drive-probe.md) beschreibt die begrenzte technische Probe vor umfangreicher Lernoberfläche. Sie nutzt ausschließlich synthetische Antworten und einen gekennzeichneten Drive-Testbestand. Die Produkt-App wird getrennt aufgebaut; die Probe bleibt als eigenständiger Prüfstand erhalten.

Die Anmelde-/Drive-Schicht entstand in `7a5a108` und `1745d66`. Die persistente mobile Probe wurde in `0f3f03e` umgesetzt und nach unabhängiger Review in `e7424b5` sowie `230defb` korrigiert. Sie umfasst synthetische Ereignisse, IndexedDB, feste Konto-/Ordnerbindung je Browserprofil, wiederholbare Uploads, leere Rücksetzung mit verifizierter Sicherung, mobile Oberfläche, lokalen Server und eigenen Offline-Service-Worker. Das begrenzte Format ist in [PROBE-DATENFORMAT.md](docs/PROBE-DATENFORMAT.md) beschrieben.

Auf `92f044e` liefen `npm test` mit **74/74 bestandenen Tests** und zwölf Browser-Szenarien mit Playwright 1.62.1, System-Edge 153.0.4234.32 und Node 22.23.2 ohne Seitenfehler. Die Browserprüfung bediente echte DOM-, IndexedDB- und Service-Worker-Pfade; nur Google Identity Services und Drive-HTTP wurden simuliert. Desktop 1280×900 und Mobil 390×844 wurden visuell geprüft; Bedienelemente waren mindestens 44 Pixel hoch, das Eingabefeld mindestens 16 Pixel groß. Details: [Prüfbericht](docs/reports/2026-09-17-google-drive-probe.md).

Die unabhängigen Aufgabenprüfungen sind abgeschlossen. GPT-5.6 Sol mit hoher Denktiefe übernahm Implementierung und Funktionsprüfung, Sol mit mittlerer Denktiefe Dokumentation und deren Prüfung. GPT-6 Astra mit hoher Denktiefe fand in der Gesamtprüfung zwei zusätzliche Browser-/Anmeldefehler; Sol korrigierte beide in `92f044e`. Astra bestätigte anschließend beide als behoben, ohne neuen Befund. Der testbare Entwicklungsstand ist freigegeben. Der Abschlussstand `970a0de2b6c8101cec86164fd354291bcc4957c1` wurde auf `origin/codex/google-drive-probe` übertragen und mit `git ls-remote` identisch bestätigt; der anschließende Dokumentationscommit hält diesen Nachweis fest. Keine Integration nach `main` oder öffentliche Bereitstellung wurde durchgeführt.

Aktueller Arbeitszweig: `codex/vokabeltrainer-v1` (von `codex/google-drive-probe` abgeleitet). Am Laptop wurde am 18.09. ein frischer regulärer Checkout auf diesem Branch angelegt; die ältere Worktree-Angabe gehört zum vorherigen Rechner. Aktuelle Commits und Remote bei Übernahme frisch prüfen. Kein bestimmter Rechnerpfad ist erforderlich.

Aktuelle Übergabe: [Desktop-Pause](docs/handoffs/2026-09-18-desktop-pause.md). Historische Zwischenstände: [Produktentwicklung](docs/handoffs/2026-09-17-produktentwicklung.md) und [Fortsetzung am Laptop](docs/handoffs/2026-09-18-fortsetzung.md). Die [Probe-Übergabe](docs/handoffs/2026-09-17-verbindungsprobe.md) dokumentiert den geprüften Ausgangspunkt.
Einrichtung und Prüfablauf: [Google-Drive-Probe](docs/GOOGLE-DRIVE-PROBE.md).

## Äußere Voraussetzungen und nächste Schritte

Praxisstand 17.09.2026, durch Nutzerrückmeldungen und Screenshots: Echte Anmeldung, Probeordner, Upload, Wiederholung ohne Doppelwertung, lokales Neuladen, erneute Anmeldung, Offlineantwort mit späterem Upload und gesicherte Rücksetzung bestätigt. Zusätzlich bestätigte der Nutzer das Neuladen ohne Internet bei weiterlaufendem lokalen Server sowie den realen Drive-Abgleich zwischen zwei getrennten Browsern auf demselben Rechner in beide Richtungen. Eine zunächst ungesendete Antwort aus der alten Generation blieb nach Rücksetzung separat erhalten; am Ende zeigten beide Browser Antworten 0, Punkte 0, Ausstehend 0 und Alte Generation 1. Noch offen: isolierter Start ohne erreichbaren lokalen Server, zwei physische Geräte sowie iPhone/iPad in Safari und als Home-Bildschirm-App. Browser-/OS-Versionen und geladener Codecommit des Handtests wurden nicht gesondert erhoben. Nächster Schritt: den vollständigen Trainer nach dem v1-Plan implementieren; Geräte- und Hostingklärung folgt danach. Keine persönlichen Kennungen dokumentieren.

Für reale iOS-Prüfungen fehlen Geräte-/Versionsangaben, Testverfügbarkeit und eine abgestimmte HTTPS-Bereitstellung. Der Nutzer besitzt keine Apple-Geräte; sein Freund als künftiger Hauptnutzer besitzt iPhone und iPad. Niemand wird ohne Auftrag kontaktiert.

Die erste Anmeldung, Drive-Übertragung und Rücksetzung sind bestätigt. Nach der vollständigen Umsetzung folgen die Geräte- und Hostingklärung sowie die weiteren Prüfungen nach der [Prüfanleitung](docs/GOOGLE-DRIVE-PROBE.md), später mit demselben OAuth-Client, Google-Konto und Probeordner auf zwei Geräten. Für iPhone/iPad ist zusätzlich eine abgestimmte HTTPS-Bereitstellung nötig; Safari und Home-Bildschirm-App werden getrennt geprüft. Bis diese Nachweise vorliegen, bleibt die Geräteabnahme offen. Die vollständige Produktumsetzung ist durch die geänderte Reihenfolge ausdrücklich freigegeben.

## Noch nicht vorhanden oder nachgewiesen

- Fertige Produkt-Offline-PWA fehlt; Übungsbildschirm, Inselreise und Avatar sind bereits geprüft.
- Freigabe der Produktsynchronisation: neun wichtige Reviewbefunde offen. Vollständiger Sicherungsimport und Erwachsenen-Konfliktlösung noch nicht implementiert.
- Isolierter Offline-Start ohne erreichbaren Server und realer Zwei-Geräte-Abgleich; der Abgleich zwischen zwei Browsern desselben Rechners ist bestätigt.
- Reale iPhone-/iPad-Abnahme und festgelegte Mindestversionen.
- Eingerichtetes Hosting oder veröffentlichte Trainer-URL.

Die allgemeine Lizenzentscheidung bleibt bewusst zurückgestellt. Keine öffentliche Freigabe, Repository-Sichtbarkeitsänderung, gebührenpflichtige Einrichtung oder Veröffentlichung einer laufenden App ist durchgeführt.

## Bisherige Berichte

- [Übungsbildschirm-Korrektur](docs/reports/2026-09-18-uebungsbildschirm-korrektur.md).
- [Inselreise/Avatar mit echten Screenshots](docs/reports/2026-09-18-inselreise-avatar.md).
- [Synchronisation: Implementierungszwischenstand](docs/reports/2026-09-18-synchronisation-zwischenstand.md) und [offene unabhängige Review](docs/reports/2026-09-18-synchronisation-review.md).
- [Gesamtentwurf und Anforderungsklärung](docs/reports/2026-09-16-gesamtentwurf.md), historischer Stand vor Entwurfsbestätigung.
- [Ursprüngliches Dokumentationspaket](docs/reports/2026-09-16-dokumentation.md).
- [Drive-Adapter](docs/reports/2026-09-16-drive-adapter.md).
- [Lokale Verbindungsprobe](docs/reports/2026-09-17-google-drive-probe.md).

Keine erneute pauschale Entwicklungs- oder Entwurfsfreigabe verlangen. Neue Produktabweichungen anhand konkreter Befunde klären; technische Nachweise nicht durch Zustimmung ersetzen.
