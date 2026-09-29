# Übergabe: Sofortiger Vokabelabgleich

Stand: 29.09.2026. Der Nutzer hat nach der Unterbrechungsprüfung erneut
Fortsetzung beauftragt und den sofortigen Google-Abgleich nach Wort-/
Lektionsspeicherung ausdrücklich bestätigt. Keine neue Pause angeordnet.

## Ergebnis und Stand

- Ausgang `c39a4ba`, Produktcommit
  `0c3720ad33dc43f52d74b4278b6df79fa2d728cb`, Arbeitszweig
  `codex/purchase-batch-checks`, Zielzweig `codex/vokabeltrainer-v1`.
- Neue Wörter und Lektionen stoßen den Google-Abgleich sofort an. Ein Stapel
  ergibt einen Auslöser; laufende Abgleiche erhalten einen Folgelauf.
  Lernantworten bleiben gebündelt, Offline-/Wiederaufnahmewege erhalten.
- 116 gezielte Node-Tests, 20 Browserfälle und frische vollständige Node-Suite
  mit 655/655 PASS. Taskreview PASS; finaler Commit-Diff unverändert zum
  geprüften Zwischenstand. Cache v38 vorbereitet.
- Breite Abschlussprüfung: Spec/Qualität PASS, keine offenen Befunde.
  Produktcommit per Fast-Forward integriert und exakt mit GitHub verglichen.
- Cache v38 privat aktiv; Worker `6724d8c7-ae22-48f4-8379-2fd449f10135`
  seit 29.09.2026, 15:58:23.258 UTC zu 100 Prozent. Zehn öffentliche Dateien
  bytegleich geprüft. Kontrolliertes Update im bestehenden Testbrowser
  übernommen; Punkte, Level und ausgewählte Figur erhalten, kein bleibender
  Google-Hinweis und keine neue Anmeldung.

Die Abschlussdokumentation wird separat auf `codex/vokabeltrainer-v1`
gesichert; nach Push lokalen Commit und tatsächlichen Remote-Branchkopf
vergleichen. Der Produktstand ändert sich durch diesen Nachtrag nicht.

Details, Messgrenzen und tatsächliche Befunde:
[Bericht](../reports/2026-09-29-sofortiger-vokabelabgleich.md).
Die synthetisch gemessenen 4,482 Sekunden Abgleich bei 250 Wörtern und
100 ms je HTTP-Anfrage enthalten weder die frühere vorgeschaltete Wartezeit
noch reale Geräte-/Drive-Bedingungen. Keine Zusage für eine reale Gesamtdauer.

## Nächster konkreter Schritt

Zwei bereits reproduzierte Bedienfehler bei Importkorrekturen gezielt beheben:
Fokusverlust nach Tab und ein stehenbleibender Pflichtfeldhinweis trotz
ergänzter Zelle. Dazu einen kurzen Entwurf bestätigen lassen, der stabile
Fokusführung und automatische Neubewertung von Pflichtfeldern vorsieht;
echte Strukturmehrdeutigkeiten weiter bewusst prüfen. Beleg im Bericht.

Danach typische echte Wortliste praktisch beurteilen: Die Spalten sowie
Lektions-/Kinderzuordnung werden vom Nutzer benötigt. Keine erfundene Testliste
in den Familienbestand schreiben. Physische iPhone-/Safari-/Zweitgeräteabnahme,
natürlicher Tokenablauf, 64 weitere Entwicklungsbilder und Kaufziel unter
zehn Sekunden bleiben offen.

## Bestände erhalten

Bestehenden Codex-Testbereich und Familien-Chrome nicht neu einrichten,
importieren oder ersetzen. Bekannter Teststand: 40 verfügbare Punkte,
2.040 Lernpunkte, Level 11, ausgewählte Drachenstufe 4. Keine echte PIN oder
Google-Zugangsdaten dokumentieren. Der vorhandene verwaltete Arbeitsbaum
bleibt für weitere autorisierte Arbeit erhalten.
