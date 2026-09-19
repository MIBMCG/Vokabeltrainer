# Übergabe: Überarbeitung nach Praxistest

Stand: 19.09.2026. Branch: `codex/vokabeltrainer-v1`. Ausgangscommit des Entwurfs: `8948a3b`; veröffentlichter Entwurf: `e035093255fbf1b290223eef96a6e247a554e4f7`; überprüfter Planungsstand auf GitHub: `9f809493e6e082183126654f1b1ab2d7c5945ebd`. Die Umsetzung ist freigegeben und läuft. Der aktuelle Paketstand und seine Prüfbelege stehen unten; ältere Planungsprüfungen bleiben ausdrücklich historisch.

GitHub-Empfangsbeleg: Der geprüfte A1-Zwischenstand `b0e826c5b7e78d4aa5fa9727e317bf991c905a2c` wurde auf `codex/vokabeltrainer-v1` gepusht; `git ls-remote` bestätigte denselben vollständigen Hash. Auch der A2-Zwischenstand `7b109cfee381e6c4de849e8007b563408d57200a` einschließlich Review und Screenshots wurde danach gepusht und exakt bestätigt. Auch A3 wurde als `c695994fbf87ea65660ed03604217241ae830146` exakt auf GitHub bestätigt. Keine Änderung von `main`, Hosting oder persönlichen Browserdaten.

## Nutzerauftrag

Optik wesentlich näher an das freigegebene Inselkonzept bringen, Avatar und Reise als hochwertige Rasterillustrationen in passenden Auflösungen umsetzen, Einrichtung und Vokabelverwaltung vereinfachen, die Übungsmodi direkt erklären, einstellbare Wiederholungsregeln und grafische Lernstatistiken ergänzen.

## In diesem Gespräch bestätigt

1. Google Drive und automatischer Abgleich bleiben. Die vorhandene öffentliche Google-Konfiguration wird einmal in der App vorbereitet; Eltern brauchen weder eigenes Cloud-Projekt noch Client-ID-Eingabe. Kein Excel-Formatwechsel.
2. Lernregeln werden je Kind getrennt einstellbar, mit gemeinsamen Standardwerten als Ausgangspunkt.
3. Der gesamte schriftliche Entwurf einschließlich Zahlenbereichen, Wirkung ab nächster neuer Runde, Wiederaktivierung, Bedienabläufen und Bildwelt ist durch „Ja, Freigabe erteilt“ bestätigt.

Der [schriftliche Entwurf](../design/2026-09-19-ueberarbeitung.md) wird durch den [Umsetzungsplan](../superpowers/plans/2026-09-19-ueberarbeitung.md) mit drei Etappen und neun Aufgaben konkretisiert. Der Nutzer hat mit A die Planprüfung und Ausführung mit Aufgabenagenten/Einzelreviews bestätigt. Keine erneute Plan- oder Entwurfsfreigabe verlangen.

## Arbeit und Prüfung

- Using Superpowers und Brainstorming angewandt; Architekturpfad wegen neuer Lernregeln und Schnittstellenänderungen.
- Bestehendes Konzept und tatsächliche Übungs-/Avatarbilder verglichen, Cloudzugriff anhand offizieller Google-/MDN-Quellen geprüft.
- Lesende Bestandsanalyse mit GPT-5.6 Sol/high: Lernlogik, Runden, v1-Formatvalidierung, Erwachsenenansicht und Statistik. Keine Agenten-Codeänderungen.
- Anschließend lesende Vertragsprüfung durch GPT-6 Astra/high: alte Paket-/Snapshotprüfsummen, Versionsübergang, eingefrorene Runden und verspätete Altclientantworten. Keine Agenten-Codeänderungen.
- Writing Plans angewandt; Plan selbst gegen U01–U07 geprüft, Schnittstellen zwischen A/B/C vereinheitlicht, Platzhalterprüfung und fünf wesentliche Fehlerklassen je Teilplan den zugehörigen Prüfaufgaben zugeordnet. Keine ausgelagerte Planreview.
- Historische Dokumentprüfung des Entwurfs: 177 Dateien, 78 Markdown-Dateien, 356 lokale Links; 0 Fehler. Aktuelle Planungsprüfung: `npm run check:docs` mit 181 Dateien, 82 Markdown-Dateien, 374 lokalen Links und 0 Fehlern; `git diff --check` ohne Befund. Nur Dokumente geändert, deshalb keine Produkt-Suites erneut ausgeführt.
- Alte Testergebnisse aus dem v1-Abschluss wurden nicht als neue Prüfung wiederholt oder umetikettiert.

## Paketstand und verbleibende Umsetzung

A1 ist mit `0eb4099` implementiert und mit `004392c` nach der unabhängigen Review korrigiert. Die Nachprüfung bestätigt alle drei Korrekturen, keine wesentlichen Befunde bleiben offen. Alle 18 Grundbilder benötigen zusammen rund 321 KiB; größere Bilder werden bei Bedarf geladen. Kappe/Bergmütze und textlicher Sperrstatus der Etappen wurden gezielt korrigiert. Der Desktop-Reisescreenshot wurde in A2 nach vollständigem Bildladen ersetzt. [Implementierung und aktuelle Prüfungen](../reports/2026-09-19-a1-rasterwelt.md), [Review](../reports/2026-09-19-a1-review.md), [Quellen und Ansichten](../reports/2026-09-19-illustrationen.md).

- A2 ist mit `10987b5` und Retrykorrektur `e0c237f` abgeschlossen und unabhängig nachgeprüft: 285/285 Node-, 15/15 Trainer- und 3/3 Überarbeitungs-Browsertests; danach je 1/1 Retry- und Worker-Updatefall. Cache v9 / synthetisch v10. [Bericht](../reports/2026-09-19-a2-rundenstart.md), [Review](../reports/2026-09-19-a2-review.md).
- A3 ist in `2d30c73` umgesetzt und unabhängig ohne Befunde geprüft. Vorbereitete Google-ID und bewusste Bestandsaktionen; 291/291 Node, 15/15 Trainer, 5/5 Überarbeitung, 1/1 Update. [Bericht](../reports/2026-09-19-a3-einrichtung.md), [Review](../reports/2026-09-19-a3-review.md).
- A4 ist mit `af5c095` und Fix `28287e7` abgeschlossen und unabhängig nachgeprüft: vier Bereiche, Wortverwaltung, sichere Importentwürfe und Tastatursuche sowie die geprüften Start-/Reisekorrekturen. Cache v12 / synthetisch v13. [Bericht](../reports/2026-09-19-a4-verwaltung.md), [Review](../reports/2026-09-19-a4-review.md).
- B1–B3: v1/v2-Leser erhalten alte Objekte und Hashwerte, atomare Migration mit lokaler Sicherung, eigene Wiederholungsprojektion, eingefrorene Policy und Wortgeneration, Regeln je Kind und „Wieder üben“.
- C1–C2: Statistik aus denselben effektiven deduplizierten Antworten, reale Screenshotprüfung gegen das Konzept, Offline-/Update-/Migrationsprüfung und portable Übergabe.
- Ein alter Offlineclient kann technisch weiterhin v1-Antworten hochladen. Diese werden übernommen; die neue App darf unbekannte Formate nicht als erfolgreich synchronisiert darstellen. Keine behauptete Fernsperre alter Programme.
- Subagentenvorschlag: Sol/high für Oberfläche/Statistik; Astra/high für Datenübergang, Scheduler und Vertrags-/Abschlussreview. Modelle vor tatsächlicher Delegation nennen. Umsetzung ein Schreiber gleichzeitig.

## Fortsetzung

Ausführung A ist bestätigt. A1–A4 sind abgeschlossen; mit B1 fortfahren und die Aufgaben nach jeweiligem Review ohne weitere pauschale Freigabepausen fortlaufend bearbeiten. Frischer Ausgangstest: 277/277 bestanden auf Planungscommit `9f80949`; A1 danach 280/280, nach Reviewkorrektur 13/13 betroffene Node-Tests sowie je ein Reise- und Worker-Updatefall bestanden. Bereits bestätigten Entwurf und Cloud-/Profilentscheidungen nicht erneut fragen. Persönliche Browserdaten und der Server auf 4173 werden nicht als Testumgebung verwendet.

Die vorangehende [v1-Übergabe](2026-09-18-vokabeltrainer-v1.md) dokumentiert den bestehenden Produktstand. Hosting, Kontenänderungen, Kosten und echte Apple-/Zwei-Geräte-Abnahme sind weiterhin getrennte Aufgaben.
