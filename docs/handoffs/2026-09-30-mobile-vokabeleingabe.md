# Übergabe: Vokabeleingabe auf schmalen Bildschirmen

Stand: 30.09.2026. Der Nutzer setzt die übrigen Optimierungen fort. Eine
typische echte Excel-Liste mit Lektions-/Kinderzuordnung ist angefragt und
weiterhin offen. Unabhängig davon wurde ein reproduzierter Layoutfehler bei
vergrößerter Schrift im vorhandenen Erwachsenenbereich behoben.

## Änderung und Prüfstand

- Produktcommit `b440b5e59c2f0ecca9e102384f7da38ecbdaf10c`, Cache v43.
- Schrumpfbare Rasterspalten beseitigen den seitlichen Überlauf. Die Navigation
  verwendet bei großer Schrift eine Spalte; der Markenname darf umbrechen.
  Schriftgröße und Mindesthöhen bleiben erhalten.
- Neue Browserprüfung zuerst rot auf Original-CSS (463 statt 390 px), danach
  grün. Vier Größen: 390/320 px bei 200 Prozent, 320/1280 px normal.
- Nach dem letzten CSS-Feinschliff **7/7 betroffene Browserfälle PASS**, inklusive
  Import, Speichern, Reload, Offlinebetrieb und kontrolliertem Update. Die
  vollständige Node-Suite bestand zuvor mit **662/662**; anschließend nur CSS
  verfeinert und direkt betroffene Browserfälle erneut ausgeführt.
- Root-Gegenprobe bei vier mobilen Konstellationen bestätigt erreichbares
  Speichern und erhaltene Wortereignisse. Der finale 390-px-/200-Prozent-Zustand
  ist zusätzlich gemessen und visuell geprüft.
- Task- und Abschlussreview: Spec und Qualität PASS, keine Befunde.

Kein Produkt-JavaScript, Abgleichprotokoll, Datenformat, Kauf oder Login wurde
geändert. Die synthetischen Browserprofile sind vom bestehenden Codex-Testbereich
und Familienbestand getrennt. Ausführliche Belege und Befehle:
[Bericht](../reports/2026-09-30-mobile-vokabeleingabe.md).

## Bereitstellung und Git-Sicherung

Das geprüfte Produkt ist per Fast-Forward in `codex/vokabeltrainer-v1`
integriert; der Arbeitszweig heißt weiterhin `codex/purchase-batch-checks`.
Beide lokalen und entfernten Zweige wurden nach Push exakt auf den obigen
Produktcommit abgeglichen. Dieser Dokumentationsnachtrag folgt separat auf
beiden Zweigen. Den jeweiligen aktuellen SHA mit `git rev-parse HEAD` und
`git ls-remote --heads origin codex/vokabeltrainer-v1 codex/purchase-batch-checks`
prüfen; keinen historischen `main` als Fortsetzungsbasis verwenden.

387 öffentliche Dateien vorbereitet, zwei geändert. Worker-Version
`8ec1b376-c0e7-4800-8a0e-24ea169d82a5` ist seit 30.09.2026, 20:16:19.914 UTC
zu 100 Prozent aktiv. Sieben Änderungs-/Integrationsdateien wurden um
20:16:44.693 UTC bytegleich mit dem geprüften Paket bestätigt.

Im vorhandenen Codex-Testbrowser wurde „Jetzt aktualisieren“ übernommen.
40 verfügbare Punkte, 2.040 Lernpunkte, Level 11 und gewählte Drachenstufe 4
sind danach sichtbar erhalten. Der kurz beim Start angezeigte Google-Hinweis
verschwindet ohne erneute Anmeldung. Kein Import, Kauf oder Einrichten im
vorhandenen Bestand; Familien-Chrome unangetastet. Dies ist keine neue
Abnahme des natürlichen Tokenablaufs.

## Grenzen und nächster Schritt

Die Prüfungen sind Desktop-Edge-Simulationen, keine physische Handyabnahme.
Safari/iPhone/iPad, Touch und echte Bildschirmtastatur bleiben offen. Edge
trennt einige sehr lange Texte bei 200 Prozent trotz aktivierter automatischer
Silbentrennung zeichenweise; alle Inhalte bleiben sichtbar.

Als Nächstes den bestehenden Tabellenweg mit einer typischen echten Excel-Liste
und gewünschter Lektion/Kinderzuordnung gemeinsam prüfen. Die entsprechende
Nutzerfrage ist gestellt. Ohne diese Eingaben keine erfundenen Wörter in den
Familienbestand oder vorhandenen Codex-Testbereich übernehmen.

Reale Google-Laufzeit, natürlicher Tokenablauf und Zwei-Geräte-Abnahme bleiben
offene Nachweise. Die Lernbereichsübernahme ist weiterhin zurückgestellt und
nicht freigegeben. Alle Entwicklungsbilder sind fertig; nichts neu erzeugen.
Die fünf bestätigten Belohnungserweiterungen folgen nach den übrigen Optimierungen.
Keine neue Pause angeordnet. Arbeitsbaum und lokale Mess-/Reviewbelege erhalten.
