# Arbeitsstand

Änderung der Prüfungsreihenfolge am 17.09.2026: Der Nutzer beauftragt ausdrücklich, zuerst die vollständige App gemäß bestätigtem Gesamtentwurf umzusetzen und erst danach beim Freund auf iPhone/iPad zu testen. Die bisherige Geräteprüfung vor umfangreicher Lernoberfläche ist damit als Entwicklungssperre aufgehoben. Reale Geräteabnahme bleibt offen und darf nicht als bestanden gelten. Bereits bestätigte manuelle Google-/Drive-Tests in zwei Browsern gelten weiter. Keine neue pauschale Startfreigabe verlangen; Hosting/Veröffentlichung und Kostenmodell werden dadurch nicht automatisch geändert.

Stand: **17.09.2026**

## Bestätigt und beauftragt

Der Nutzer hat den [Gesamtentwurf](docs/superpowers/specs/2026-09-16-vokabeltrainer-design.md) einschließlich E01–E10 mit Option A angenommen. Die Einzelfragen Q1–Q14 sind abgeschlossen; die [Anforderungen R01–R33](docs/ANFORDERUNGEN.md) bleiben verbindlich. Entwicklung und portable Projektdokumentation einschließlich GitHub-Übertragung sind beauftragt.

Ziel: Deutsch-Englisch-Vokabeltrainer für 10–13-Jährige, Klassen 4–7, mit Schwerpunkt iPhone/iPad. Gemeinsames Google Drive mit durch Erwachsene eingerichtetem Google-Zugang, getrennte Lernprofile, kein zusätzliches kostenpflichtiges Cloudabo. Drei Lernmodi, adaptive Wiederholung, Erwachsenenansicht und Inselreise gehören zur späteren ersten Trainerversion.

## Aktuelles Entwicklungspaket

### Vollständige App: Umsetzung läuft

Die Umsetzung folgt dem [v1-Plan](docs/superpowers/plans/2026-09-17-vokabeltrainer-v1.md) und [Produkt-Datenvertrag](docs/PRODUKT-DATENFORMAT.md). Task 1 ist in `2e8b6a2` und `cf99ed7` umgesetzt und unabhängig geprüft: striktes Ereignisformat, sichere Referenzen, Kollisionsschutz und Testbasis. Ein Zeitüberlauf in Testdaten und eine Stapelgrenze bei langen Bearbeitungsketten wurden mit Regressionstests korrigiert. Aktueller belegter Lauf: **91/91 Node-Tests**, davon 17 Formatprüfungen. Die Lernoberfläche ist noch nicht implementiert. Task 2 ist in `5e991bf`/`4527736` implementiert und unabhängig freigegeben (Gesamtlauf inzwischen **108/108**); Details in der aktuellen Übergabe. Task 3 setzt jetzt den Lernkern um. Zwischenstand `2e4ca2b92db2be43163fb26dc248ad68a8902bcb` ist mit identischem Remote-Nachweis auf `origin/codex/vokabeltrainer-v1` gesichert; die Entwicklung läuft weiter.

Der [Benutzungsleitfaden](docs/BENUTZUNG.md) beschreibt die bestätigten Abläufe mit ausdrücklicher Kennzeichnung des Entwicklungsstands. Keine Produkt-Geräteabnahme oder Bereitstellung ist damit behauptet.
Der [Plan der Google-Drive-Probe](docs/superpowers/plans/2026-09-16-google-drive-probe.md) beschreibt die begrenzte technische Probe vor umfangreicher Lernoberfläche. Sie nutzt ausschließlich synthetische Antworten und einen gekennzeichneten Drive-Testbestand. Der eigentliche Trainer ist noch nicht implementiert.

Die Anmelde-/Drive-Schicht entstand in `7a5a108` und `1745d66`. Die persistente mobile Probe wurde in `0f3f03e` umgesetzt und nach unabhängiger Review in `e7424b5` sowie `230defb` korrigiert. Sie umfasst synthetische Ereignisse, IndexedDB, feste Konto-/Ordnerbindung je Browserprofil, wiederholbare Uploads, leere Rücksetzung mit verifizierter Sicherung, mobile Oberfläche, lokalen Server und eigenen Offline-Service-Worker. Das begrenzte Format ist in [PROBE-DATENFORMAT.md](docs/PROBE-DATENFORMAT.md) beschrieben.

Auf `92f044e` liefen `npm test` mit **74/74 bestandenen Tests** und zwölf Browser-Szenarien mit Playwright 1.62.1, System-Edge 153.0.4234.32 und Node 22.23.2 ohne Seitenfehler. Die Browserprüfung bediente echte DOM-, IndexedDB- und Service-Worker-Pfade; nur Google Identity Services und Drive-HTTP wurden simuliert. Desktop 1280×900 und Mobil 390×844 wurden visuell geprüft; Bedienelemente waren mindestens 44 Pixel hoch, das Eingabefeld mindestens 16 Pixel groß. Details: [Prüfbericht](docs/reports/2026-09-17-google-drive-probe.md).

Die unabhängigen Aufgabenprüfungen sind abgeschlossen. GPT-5.6 Sol mit hoher Denktiefe übernahm Implementierung und Funktionsprüfung, Sol mit mittlerer Denktiefe Dokumentation und deren Prüfung. GPT-6 Astra mit hoher Denktiefe fand in der Gesamtprüfung zwei zusätzliche Browser-/Anmeldefehler; Sol korrigierte beide in `92f044e`. Astra bestätigte anschließend beide als behoben, ohne neuen Befund. Der testbare Entwicklungsstand ist freigegeben. Der Abschlussstand `970a0de2b6c8101cec86164fd354291bcc4957c1` wurde auf `origin/codex/google-drive-probe` übertragen und mit `git ls-remote` identisch bestätigt; der anschließende Dokumentationscommit hält diesen Nachweis fest. Keine Integration nach `main` oder öffentliche Bereitstellung wurde durchgeführt.

Aktueller Arbeitszweig: `codex/vokabeltrainer-v1` (von `codex/google-drive-probe` abgeleitet). Getrennte Arbeitskopie im ursprünglichen Checkout unter `.worktrees/drive-probe/`. Ausgangspunkt ist `707d504` auf `main`; aktuelle Commits und Remote frisch prüfen. Die Arbeitskopie erfordert keinen bestimmten Rechnerpfad auf einem anderen System.

Aktuelle Übergabe: [Vollständige Produktentwicklung](docs/handoffs/2026-09-17-produktentwicklung.md). Die [Probe-Übergabe](docs/handoffs/2026-09-17-verbindungsprobe.md) dokumentiert den geprüften Ausgangspunkt. Vorgeschichte: [Pause und Wiedereinstieg](docs/handoffs/2026-09-16-pause.md).
Einrichtung und Prüfablauf: [Google-Drive-Probe](docs/GOOGLE-DRIVE-PROBE.md).

## Äußere Voraussetzungen und nächste Schritte

Praxisstand 17.09.2026, durch Nutzerrückmeldungen und Screenshots: Echte Anmeldung, Probeordner, Upload, Wiederholung ohne Doppelwertung, lokales Neuladen, erneute Anmeldung, Offlineantwort mit späterem Upload und gesicherte Rücksetzung bestätigt. Zusätzlich bestätigte der Nutzer das Neuladen ohne Internet bei weiterlaufendem lokalen Server sowie den realen Drive-Abgleich zwischen zwei getrennten Browsern auf demselben Rechner in beide Richtungen. Eine zunächst ungesendete Antwort aus der alten Generation blieb nach Rücksetzung separat erhalten; am Ende zeigten beide Browser Antworten 0, Punkte 0, Ausstehend 0 und Alte Generation 1. Noch offen: isolierter Start ohne erreichbaren lokalen Server, zwei physische Geräte sowie iPhone/iPad in Safari und als Home-Bildschirm-App. Browser-/OS-Versionen und geladener Codecommit des Handtests wurden nicht gesondert erhoben. Nächster Schritt: den vollständigen Trainer nach dem v1-Plan implementieren; Geräte- und Hostingklärung folgt danach. Keine persönlichen Kennungen dokumentieren.

Für reale iOS-Prüfungen fehlen Geräte-/Versionsangaben, Testverfügbarkeit und eine abgestimmte HTTPS-Bereitstellung. Der Nutzer besitzt keine Apple-Geräte; sein Freund als künftiger Hauptnutzer besitzt iPhone und iPad. Niemand wird ohne Auftrag kontaktiert.

Die erste Anmeldung, Drive-Übertragung und Rücksetzung sind bestätigt. Nach der vollständigen Umsetzung folgen die Geräte- und Hostingklärung sowie die weiteren Prüfungen nach der [Prüfanleitung](docs/GOOGLE-DRIVE-PROBE.md), später mit demselben OAuth-Client, Google-Konto und Probeordner auf zwei Geräten. Für iPhone/iPad ist zusätzlich eine abgestimmte HTTPS-Bereitstellung nötig; Safari und Home-Bildschirm-App werden getrennt geprüft. Bis diese Nachweise vorliegen, bleibt die Geräteabnahme offen. Die vollständige Produktumsetzung ist durch die geänderte Reihenfolge ausdrücklich freigegeben.

## Noch nicht vorhanden oder nachgewiesen

- Vollständiger Trainer mit Lernprofilen, Wortverwaltung, adaptiver Auswahl, Erwachsenen-PIN und Inselreise.
- Produktfähige Synchronisation einschließlich vollständigem Sicherungsimport und Erwachsenen-Konfliktlösung.
- Isolierter Offline-Start ohne erreichbaren Server und realer Zwei-Geräte-Abgleich; der Abgleich zwischen zwei Browsern desselben Rechners ist bestätigt.
- Reale iPhone-/iPad-Abnahme und festgelegte Mindestversionen.
- Eingerichtetes Hosting oder veröffentlichte Trainer-URL.

Die allgemeine Lizenzentscheidung bleibt bewusst zurückgestellt. Keine öffentliche Freigabe, Repository-Sichtbarkeitsänderung, gebührenpflichtige Einrichtung oder Veröffentlichung einer laufenden App ist durchgeführt.

## Bisherige Berichte

- [Gesamtentwurf und Anforderungsklärung](docs/reports/2026-09-16-gesamtentwurf.md), historischer Stand vor Entwurfsbestätigung.
- [Ursprüngliches Dokumentationspaket](docs/reports/2026-09-16-dokumentation.md).
- [Drive-Adapter](docs/reports/2026-09-16-drive-adapter.md).
- [Lokale Verbindungsprobe](docs/reports/2026-09-17-google-drive-probe.md).

Keine erneute pauschale Entwicklungs- oder Entwurfsfreigabe verlangen. Neue Produktabweichungen anhand konkreter Befunde klären; technische Nachweise nicht durch Zustimmung ersetzen.
