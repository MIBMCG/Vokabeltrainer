# Übergabe: Überarbeitung nach Praxistest

Stand: 19.09.2026. Branch: `codex/vokabeltrainer-v1`. Ausgangscommit: `8948a3b`. Dieses Paket enthält ausschließlich Anforderungen und Entwurf; keine neue Produktfunktion und keine neuen Produktprüfungen.

## Nutzerauftrag

Optik wesentlich näher an das freigegebene Inselkonzept bringen, Avatar und Reise als hochwertige Rasterillustrationen in passenden Auflösungen umsetzen, Einrichtung und Vokabelverwaltung vereinfachen, die Übungsmodi direkt erklären, einstellbare Wiederholungsregeln und grafische Lernstatistiken ergänzen.

## In diesem Gespräch bestätigt

1. Google Drive und automatischer Abgleich bleiben. Die vorhandene öffentliche Google-Konfiguration wird einmal in der App vorbereitet; Eltern brauchen weder eigenes Cloud-Projekt noch Client-ID-Eingabe. Kein Excel-Formatwechsel.
2. Lernregeln werden je Kind getrennt einstellbar, mit gemeinsamen Standardwerten als Ausgangspunkt.

Der [schriftliche Entwurf](../design/2026-09-19-ueberarbeitung.md) enthält die weiteren Vorschläge, Zahlenbereiche, Bedienabläufe, Bildtechnik, Datenvertragsgrenzen und Abnahmekriterien. Diese Konkretisierungen sind noch nicht als vom Nutzer bestätigt auszugeben.

## Arbeit und Prüfung

- Using Superpowers und Brainstorming angewandt; Architekturpfad wegen neuer Lernregeln und Schnittstellenänderungen.
- Bestehendes Konzept und tatsächliche Übungs-/Avatarbilder verglichen, Cloudzugriff anhand offizieller Google-/MDN-Quellen geprüft.
- Lesende Bestandsanalyse mit GPT-5.6 Sol/high: Lernlogik, Runden, v1-Formatvalidierung, Erwachsenenansicht und Statistik. Keine Agenten-Codeänderungen.
- Dokumentprüfung: 177 Dateien, 78 Markdown-Dateien, 356 lokale Links; 0 Fehler. `git diff --check` ohne Befund.
- Alte Testergebnisse aus dem v1-Abschluss wurden nicht als neue Prüfung wiederholt oder umetikettiert.

## Fortsetzung

Zuerst den schriftlichen Entwurf durch den Nutzer prüfen lassen. Nach seiner Bestätigung den Implementierungsplan mit konkreter Formatmigration, Bildpaket und Prüfungen erstellen. Bereits bestätigte Cloud- und Profilentscheidungen nicht erneut fragen. Die laufende App und persönliche Browserdaten bleiben während der Entwurfsarbeit unverändert.

Die vorangehende [v1-Übergabe](2026-09-18-vokabeltrainer-v1.md) dokumentiert den bestehenden Produktstand. Hosting, Kontenänderungen, Kosten und echte Apple-/Zwei-Geräte-Abnahme sind weiterhin getrennte Aufgaben. Eine allgemeine neue Startgenehmigung ist nicht erforderlich; es geht um die konkrete Prüfung dieses größeren Entwurfs.
