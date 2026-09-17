# Prüfbericht: lokale Google-Drive-Verbindungsprobe

Stand: 17.09.2026. Geprüfte Codebasis: `92f044e` auf `codex/google-drive-probe`. Dieser Bericht beschreibt die technische Probe, keinen fertigen Vokabeltrainer und keine bestandene externe Machbarkeitsprüfung.

## Ergebnis

Die lokale Probe ist ausführbar und bildet den vereinbarten synthetischen Prüfablauf ab: öffentliche OAuth-Client-ID lokal erfassen, Verbindung bewusst auslösen, markierten Probeordner erstellen oder auswählen, künstliche Antworten lokal sichern, wiederholt ohne Doppelwertung übertragen sowie einen leeren Rücksetzversuch erst nach verifizierter Sicherung veröffentlichen.

Der lokale Zustand liegt in IndexedDB. Ein eigenes Service-Worker-Paket stellt die Programmdateien nach der Erstladung offline bereit. Google-Tokens werden nicht dauerhaft gespeichert. Ein Browserprofil bleibt nach der ersten Auswahl fest an Konto und Probeordner gebunden; für einen anderen unabhängigen Bestand ist ein separates Browserprofil nötig. Innerhalb eines Profils darf nur ein Tab aktiv schreiben, damit kein lokaler Stand still überschrieben wird.

Das genaue begrenzte Format steht in [PROBE-DATENFORMAT.md](../PROBE-DATENFORMAT.md). Es ist kein freigegebenes Produkt- oder Sicherungsformat.

## Automatisierte Prüfung

Auf `92f044e` wurde `npm test` mit Node.js 22.23.2 vollständig ausgeführt:

- 74 Tests bestanden.
- 0 Tests fehlgeschlagen.
- 0 Tests übersprungen.
- Exitcode 0.

Abgedeckt sind Anmeldeschicht, Drive-Dateiadapter, Pagination und Fehlerklassifikation, Ereignismodell, Deduplizierung, beschädigte Daten, stabile Datei-IDs, Konto-/Ordnerbindung, verlorene Uploadantworten, IndexedDB, Tab-Sperre, Rücksetzgraphen, eigener Service-Worker-Cache sowie die Grenzen des lokalen Servers.

Die Implementierung folgte RED/GREEN. Frühere gezielt fehlschlagende Läufe betrafen unter anderem fehlende Module, späte Antworten über mehrere Rücksetzungsgenerationen, unbekannte Persistenzfelder, fremde Origin-Caches, Ordnerwechsel, unvollständige Reset-Beziehungen und einen erst aus Snapshot plus vorbereitetem Reset sichtbaren Zyklus. Die abschließenden Fixes stehen in `e7424b5` und `230defb`.

## Browserprüfung

Der lokale Server lief über `npm start` auf `http://localhost:4173`. Das Browser-Skript nutzte Playwright 1.62.1 mit System-Edge 153.0.4234.32. Es bediente echte DOM-, IndexedDB- und Service-Worker-Pfade. Ausschließlich Google Identity Services und Drive-HTTP-Antworten wurden kontrolliert simuliert; die Live-Anwendung enthält keinen Simulationsmodus.

Zwölf Szenarien bestanden ohne Seitenfehler:

1. Anfangszustand ohne Client-ID und deaktivierte Folgeaktionen.
2. Probeordner erstellen, auf zweitem Kontext beitreten und Upload wiederholen.
3. Offlineantwort lokal speichern und nach Neuladen erhalten.
4. Verlorene Serverantwort mit derselben Datei-ID wiederholen.
5. Rücksetzen mit Sicherung und verspätete alte Antwort separat erhalten.
6. Falsches Konto abweisen.
7. Zweiten Tab desselben Browserprofils sperren.
8. Token nicht persistieren und keine Google-Antworten in den Programmcache aufnehmen.
9. Fremden App-Cache desselben Ursprungs erhalten.
10. Nach HTTP 401 eine frische Anmeldung anfordern und die erhaltene Warteschlange genau einmal übertragen.
11. Nach Tokenablauf die Verbindungsanzeige zurücksetzen und erneut anmelden.
12. Echte Browser-Zurücknavigation aus dem Seitencache: neu laden, Sperre eines inzwischen aktiven zweiten Tabs respektieren und dessen neueren Stand erhalten.

Die Ansichten bei 1280 × 900 und 390 × 844 Pixeln sowie der Zustand nach Rücksetzung wurden visuell auf Lesbarkeit und horizontalen Überlauf geprüft. Der Tastaturfokus war sichtbar. Gemessene Bedienelemente waren mindestens 44 Pixel hoch, das Eingabefeld verwendete mindestens 16 Pixel Schriftgröße.

Die Browserwerkzeuge sind keine Projekt-Laufzeitabhängigkeit. Eine portable optionale Einrichtung beschreibt [tests/browser/README.md](../../tests/browser/README.md); lokale Installationspfade oder persönliche Browserprofile sind nicht erforderlich.

## Unabhängige Review

Task 2 wurde mit GPT-5.6 Sol bei hoher Denktiefe implementiert und unabhängig geprüft. Die erste Review fand drei wesentliche Gruppen: verlustbehafteten Scope-Wechsel, originweite Cacheeingriffe und unvollständige Reset-/Graphvalidierung. Nach Fixrunde 1 blieb ein kombinierter Snapshot-/Reset-Graphfall offen; Fixrunde 2 schloss ihn. Die letzte Fixreview meldete alle Befunde behoben und keine neue wesentliche Regression.

Die Dokumentation und Browserprüfungen wurden mit GPT-5.6 Sol bei mittlerer Denktiefe unabhängig freigegeben. Die anschließende Gesamtprüfung mit GPT-6 Astra bei hoher Denktiefe bestätigte zwei zusätzliche Integrationsfehler: Nach Browser-Zurücknavigation blieb der lokale Speicher geschlossen; nach HTTP 401 wurde ein abgewiesenes Token beim erneuten Verbinden wiederverwendet. Beide Fälle wurden im isolierten Browser mit simulierter Google-Grenze reproduziert. Die gemeinsame Korrektur mit GPT-5.6 Sol bei hoher Denktiefe steht in `92f044e`: lokales Tokenverwerfen ohne Entzug der Google-Berechtigung, kontrolliertes Neuladen nach Rückkehr aus dem Seitencache und Offline-Paket v3. Die neuen Regressionstests bestätigten zuvor die Fehler; anschließend bestanden 74 Node-Tests und zwölf Browser-Szenarien. Die gezielte Nachprüfung mit Astra bestätigte beide Befunde als behoben und fand keine neue Regression. Damit ist der lokale testbare Entwicklungsstand freigegeben. Der Abschlussstand `970a0de2b6c8101cec86164fd354291bcc4957c1` wurde auf GitHub übertragen; `git ls-remote` bestätigte denselben SHA. Der folgende Dokumentationscommit hält diesen Nachweis fest. Main blieb unverändert.

## Offene Grenzen

- Erste echte Google-Anmeldung nach manueller Einrichtung ist durch Nutzerscreenshot bestätigt; Details im folgenden Praxisnachtrag.
- Reales Drive zwischen zwei Browsern desselben Rechners ist durch Nutzerrückmeldungen bestätigt, einschließlich verspäteter Antwort nach Rücksetzung. Isolierter Offline-Start ohne Server, zwei physische Geräte und iOS bleiben offen.
- Safari auf iPhone/iPad und die Home-Bildschirm-App wurden nicht geprüft. Dafür fehlen noch HTTPS-Bereitstellung, konkrete Geräte-/Versionsangaben und Testverfügbarkeit.
- Die frühe Machbarkeitsprüfung ist deshalb noch nicht bestanden.
- Trainer, Vokabeln, Lernprofile, adaptive Wiederholung, Erwachsenen-PIN, Inselreise, vollständiger Sicherungsimport und Produkt-Konfliktlösung sind nicht implementiert.
- Es wurden kein Hosting, keine Abrechnung, keine Repository-Sichtbarkeit und kein `main` geändert.

## Nächster Nachweis

Die Einrichtung ist inzwischen erfolgt. Als Nächstes werden Offline-Neuladen und die reale Zwei-Geräte-Matrix nach [GOOGLE-DRIVE-PROBE.md](../GOOGLE-DRIVE-PROBE.md) mit derselben öffentlichen Client-ID, demselben Google-Konto und demselben Probeordner ausgeführt. Zugangsdaten, Client-Secret, Tokens und echte Lernprofile werden weder angefordert noch dokumentiert.

## Praxisnachtrag: erste echte Anmeldung

Praxisstand 17.09.2026: Projekt und Web-OAuth-Client wurden vom Nutzer angelegt; der Klick zur Aktivierung der Drive API wurde bestätigt. Nach einem zunächst gemeldeten 401 invalid_client und anschließendem 403 access_denied wurde das Konto als Testnutzer eingetragen. Der aktuelle Nutzerscreenshot zeigt die echte Google-Einwilligung für drive.file und danach in der lokalen Probe eine verbundene Sitzung. Die genaue Ursache des ersten Client-ID-Fehlers ist nicht abschließend belegt. Noch kein Nachweis für Ordneranlage, Dateiübertragung, zwei Geräte oder iOS. Nächster Schritt: einen neuen synthetischen Probeordner erstellen. Keine Konto-Adresse, Client-ID oder Tokens im Prüfbericht speichern.

Nachweis: vom Nutzer bereitgestellte Screenshots der Google-Einwilligung und des verbundenen App-Zustands auf localhost. Kein eigenständig ausgeführter Live-Test durch den Assistenten; Browser-/Betriebssystemversion und tatsächlich geladener Codecommit wurden bei diesem Handtest nicht gesondert erhoben.

## Praxisnachtrag: Drive-Abgleich und Rücksetzung

Praxisstand 17.09.2026 (Nutzerrückmeldungen und Screenshots): Echte Google-Anmeldung mit drive.file, Probeordnerauswahl, erste Antwort (1/10/1), Drive-Abgleich (1/10/0), Uploadwiederholung ohne Doppelwertung, Neuladen mit erhaltenem Stand und erneutes Verbinden bestätigt. Eine zweite Antwort wurde bei getrennter Internetverbindung gespeichert (2/20/1) und nach Wiederverbindung übertragen (2/20/0). Rücksetzung auf 0/0/0 und Statusmeldung zur bestätigten Sicherung wurden ebenfalls bestätigt. Reihenfolge der Zahlen: Antworten/Punkte/Ausstehend. Offline-Neuladen, zweiter Browser bzw. physisches Zweitgerät und iOS bleiben offen. Die genaue Browser-/OS-Version und der tatsächlich geladene Codecommit wurden nicht erhoben; kein vom Assistenten selbst ausgeführter Live-Test. Nächster Schritt: Seite ohne Internet neu laden. Keine persönlichen Konto-, Client- oder Ordnerkennungen dokumentieren.

Die Bestätigung der Rücksetzung war erst nach Scrollen zur Statuszeile sichtbar. Das ist ein beobachteter Bedienhinweis; für die spätere Schüleroberfläche Rückmeldungen unmittelbar am Handlungspunkt berücksichtigen. Eine unabhängige Prüfung der konkreten Backup-Datei in Drive wurde nicht durchgeführt; bestätigt wurde die App-Statusmeldung nach ihrem implementierten Sicherungsablauf.

## Praxisnachtrag: Neuladen ohne Internet

17.09.2026: Nutzer bestätigt vollständiges Neuladen bei getrennter Internetverbindung mit allen Zählern auf 0. Der lokale Server lief weiter; damit ist die Bedienbarkeit ohne Internet bestätigt, aber der alleinige Start aus dem Service-Worker-Cache ohne erreichbaren Ursprung nicht isoliert nachgewiesen. Nächster Schritt: zweites getrenntes Browserprofil bzw. anderer Browser für den realen Drive-Abgleich; ein zweiter Tab genügt wegen gemeinsamer lokaler Daten und Tabsperre nicht. Physische Zwei-Geräte-/iOS-Abnahme bleibt offen.

## Praxisnachtrag: zwei Browser und verspätete Antwort

Praxisstand 17.09.2026, durch Nutzerrückmeldungen und Screenshots: Echte Anmeldung, Probeordner, Upload, Wiederholung ohne Doppelwertung, lokales Neuladen, erneute Anmeldung, Offlineantwort mit späterem Upload und gesicherte Rücksetzung bestätigt. Zusätzlich bestätigte der Nutzer das Neuladen ohne Internet bei weiterlaufendem lokalen Server sowie den realen Drive-Abgleich zwischen zwei getrennten Browsern auf demselben Rechner in beide Richtungen. Eine zunächst ungesendete Antwort aus der alten Generation blieb nach Rücksetzung separat erhalten; am Ende zeigten beide Browser Antworten 0, Punkte 0, Ausstehend 0 und Alte Generation 1. Noch offen: isolierter Start ohne erreichbaren lokalen Server, zwei physische Geräte sowie iPhone/iPad in Safari und als Home-Bildschirm-App. Browser-/OS-Versionen und geladener Codecommit des Handtests wurden nicht gesondert erhoben. Nächster Schritt: Verfügbarkeit der Apple-Testgeräte und HTTPS-Bereitstellung klären. Keine persönlichen Kennungen dokumentieren.

| Handtest | Vom Nutzer bestätigtes Ergebnis |
| --- | --- |
| Browser B meldet sich an und sucht vorhandenen Ordner | Gleiche Ordnerkennung wie Browser A |
| B übernimmt Rücksetzung, speichert eine Antwort und gleicht ab; A gleicht ab | Beide 1 Antwort, 10 Punkte, 0 ausstehend |
| A ergänzt eine Antwort und gleicht ab; B gleicht ab | Beide 2 Antworten, 20 Punkte, 0 ausstehend |
| B hält dritte Antwort lokal zurück; A setzt gesichert zurück | A 0 Antworten/0 Punkte, B noch 3 Antworten/30 Punkte/1 ausstehend |
| B gleicht ab, anschließend A | Beide 0 Antworten, 0 Punkte, 0 ausstehend, 1 alte Generation |

Diese Ergebnisse sind geführte manuelle Nutzernachweise mit echtem Google Drive, keine neuen automatisierten Tests und keine Zwei-Geräte-Abnahme. Die vorigen Praxisnachträge bilden frühere Zwischenstände ab; dieser Nachtrag ist der aktuelle Stand.
