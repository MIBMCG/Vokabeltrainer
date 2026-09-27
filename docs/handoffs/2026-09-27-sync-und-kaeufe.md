# Übergabe: Abgleich und Kaufkorrekturen

Stand: 27.09.2026, Branch `codex/vokabeltrainer-v1`, Ausgangscommit `87ac338`.
Das Paket baut auf den [Bedienkorrekturen](2026-09-27-bedienkorrekturen.md) auf.
Aktuellen Commit und Remote mit `git log -1` beziehungsweise
`git ls-remote origin refs/heads/codex/vokabeltrainer-v1` vergleichen.

## Inhalt

- Keine zehnsekündige Abgleichschleife durch interne Speicherung.
- Getrennte Rückmeldung für Prüfen, laufenden Abgleich und wartende Änderungen.
- Begrenzt parallele Lesezugriffe und unveränderliche Kaufuploads.
- Sofortige Kaufsperre und Fortschritt direkt im Dialog; nur eine Bestätigung.
- Kein Widerruf der Google-Freigabe beim Seitenende, keine Trennung durch PIN-Sperre.
- Neuere Google-Sitzungen gegen verspätete Fehler alter Anfragen geschützt.
- Inhaltsrevision statt falschem Alarm bei bloßen Drive-Metadatenänderungen;
  Hash-, Bindungs- und Kaufkopfprüfungen bleiben erhalten.
- Gemeinsamer laufender Einrichtungsvorgang: ein paralleler Hintergrundabgleich
  kann eine erfolgreiche Neuanlage nicht mehr nachträglich als Bindungsfehler melden.

Ursachen, Tests und Aussagegrenzen: [Prüfbericht](../reports/2026-09-27-sync-und-kaeufe.md).
Final geprüft: **543/543 Node-Tests, 54/54 Browserfälle**, Dokumentprüfung und
Diff ohne Fehler. Die unabhängigen Nachprüfungen haben keine offenen Befunde.

## Start

```sh
git clone --branch codex/vokabeltrainer-v1 https://github.com/MIBMCG/Vokabeltrainer.git
cd Vokabeltrainer
npm test
npm start
```

Node ab 22.8.0; Windows bei Bedarf `npm.cmd`. Trainer unter
`http://localhost:4173/trainer/` öffnen. Wer bisher `127.0.0.1` verwendet hat,
bleibt bei diesem Ursprung; beide haben getrennte Browserdaten. Für dieses
Paket sind keine neuen Laufzeitdateien in der Serverfreigabe erforderlich.
Programmcache: Trainer `v27`, technische Probe `v4`, synthetische nächste
Trainerversion `v28`. Browserdaten nicht löschen. Aktualisierung nach Speichern
offener Eingaben bzw. über den geschützten Aktualisierungsknopf aktivieren.

## Nächster Schritt

Nach Übernahme mit dem vorhandenen Nutzerbestand prüfen: verbinden, manueller
Abgleich, Shop öffnen, einmal kaufen und Status abwarten. Bei echter Inhalts-
oder Bindungsabweichung bleibt der Kauf gesperrt; keine Dateien manuell löschen
oder ersetzen. Der konkrete gemeldete Google-Lesefehler ist bislang nur mit
synthetischer Metadatenänderung reproduziert, nicht an echten Antwortdaten
diagnostiziert. Reale Dauer und mögliche weitere Abbrüche bleiben zu beobachten.

Nach Reload bleibt im bestehenden Browsermodell ein Nutzerklick zum erneuten
Google-Zugriff nötig. Keine dauerhafte automatische Anmeldung implementiert.
Git überträgt Code/Dokumentation, keine Lerndaten oder Google-Sitzungen.
Keine Änderung von Preisen, Punktevergabe, Datenformaten, Kontomodell oder Kosten.
Kein Merge nach `main`, keine Hostingveröffentlichung. Bisher offene
Grafik-/AV01- und iOS-Abnahmen bleiben unverändert offen.
