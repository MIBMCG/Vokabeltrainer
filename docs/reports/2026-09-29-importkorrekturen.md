# Tabellenkorrekturen ohne Fokusverlust

Stand: 29.09.2026. Der Nutzer hat den begrenzten Entwurf ausdrücklich bestätigt:
Cursor und geöffnete Zeile bleiben beim Feldwechsel erhalten; ergänzte
Pflichtfelder werden automatisch neu bewertet. Unklare Tabellenstrukturen
brauchen weiterhin eine bewusste Bestätigung.

## Ausgang und Ursache

Ausgangspunkt ist `10c785acd899c1a4be42eb3b8a61bccdc7ef8233`. Die vorherige
Version v38 startet den Google-Abgleich nach Wort-/Lektionsspeicherung sofort.
Diese Änderung bleibt erhalten.

Die Importvorschau baute nach jeder Zellkorrektur alle Eingabefelder neu auf.
Beim Wechsel mit Tab ging dadurch der Fokus verloren. Zusätzlich blieb der
ursprüngliche Pflichtfeldfehler aus dem eingefügten Text gespeichert, obwohl
die ergänzte Zelle inzwischen gültig war. Die aktuelle Prüfung und der alte
Hinweis konnten denselben Fehler doppelt anzeigen.

## Begrenzte Korrektur

Die Eingabefelder der Zeilen bleiben beim Bearbeiten erhalten. Die Ansicht
aktualisiert Zusammenfassung, Hinweise und Übernahmemöglichkeit, ohne die
bearbeitete Zeile aus dem Blick zu nehmen. Fehlende Pflichtwerte werden anhand
des aktuellen Zeileninhalts geprüft. Hinweise auf mehrdeutige Spalten oder
Anführungszeichen bleiben ausdrücklich bestätigungspflichtig.

Tabellenformat, Duplikatentscheidungen, gemeinsame lokale Speicherung,
Wiederholung nach Speicherfehlern und Google-Abgleich behalten ihre bisherigen
Verträge. Es kommen keine Abhängigkeiten, Konten oder neuen Datenformate hinzu.
Cache v39 und passende Update-Testdaten sind umgesetzt.

## Prüfstand

Die beiden neuen Browserregressionen scheiterten zunächst am bisherigen Code:
Tab erreichte das nächste Feld nicht; nach Ergänzen von „boat“ blieb eine Zeile
weiter als zu prüfen markiert. Nach der Korrektur bestanden beide Fälle.
| Prüfung | Tatsächliches Ergebnis |
| --- | --- |
| Import/PIN und Service Worker, gezielte Node-Fälle | 25/25 PASS |
| Import-Browserabläufe | 16/16 PASS |
| Angrenzende Browserfälle: Strukturprüfung, Offline-Neustart, Update und Cacheinstallation | 6/6 PASS |
| Nachprüfung nach Reviewkorrekturen | 4/4 PASS, darunter drei wiederholte Fokus-/Pflichtfeldfälle und ein neuer Lektionswechselfall |
| Frische vollständige Node-Suite am endgültigen Produktdiff | 655/655 PASS, Exit 0, keine übersprungenen oder abgebrochenen Fälle; 80,291 Sekunden |
| Taskreview einschließlich begrenzter Nachprüfung | Spec PASS, Qualität freigegeben; Befunde geschlossen |

Der abschließende Node-Lauf erfolgte am 29.09.2026 von 18:44:51 bis
18:46:12 MESZ. Der Laptop wurde nur für diesen Prozess wachgehalten; der
vorherige Zustand ist anschließend wiederhergestellt. Keine dauerhafte
Änderung der Energieeinstellungen.

Das erste Review fand einen kleinen Abstandsverlust zwischen mehreren
Problemzeilen. Der Abstand ist wiederhergestellt; leere Hinweiscontainer
verursachen keine zusätzlichen Lücken. Eine weitere gezielte Prüfung zeigte:
Wird eine zunächst gültige Zeile durch den Wechsel der Ziellektion zum
Duplikat, muss auch ihr geschlossener Elternbereich geöffnet werden. Dieser
Fall wurde zuerst mit einem fehlschlagenden Browsertest nachgewiesen und
anschließend ohne Versetzen der Eingabefelder korrigiert.

Schmale Ansichten bei 390 px wurden visuell geprüft: Die korrigierte Zeile
bleibt geöffnet, der Fokus liegt im Hinweisfeld, die Übernahme ist freigegeben;
zwei noch fehlerhafte Zeilen bleiben sichtbar getrennt. Auch die breite
Abschlussprüfung bewertet das Paket mit PASS ohne offene Befunde.

## Integration und Bereitstellung

Produktcommit `ee7e17454af04526715df58c4f3767259f47414e` wurde per
Fast-Forward vom Arbeitszweig `codex/purchase-batch-checks` in
`codex/vokabeltrainer-v1` übernommen. Der Commit-Diff entspricht exakt dem
abschließend geprüften Paket. Der tatsächliche GitHub-Branchkopf wurde nach
dem Push abgefragt und stimmt mit dem Produktcommit überein.

199 erlaubte öffentliche Dateien sind vorbereitet; bei der Bereitstellung
wurden drei geänderte Laufzeitdateien hochgeladen. Cache v39 läuft unter
Worker-Version `e9d853ea-92be-4bf8-b69b-7b74e7e2cd82`, seit
29.09.2026, 16:49:03.620 UTC zu 100 Prozent aktiv. Beim allerersten öffentlichen
Vergleich wich das Stylesheet noch ab. Eine anschließende Diagnose bestätigte
die drei geänderten Dateien; der erneute vollständige Vergleich bestätigte
am 29.09.2026 um 16:50:25.780 UTC alle zehn geprüften App-Dateien bytegleich
zum bereitgestellten Paket. Kein erneuter Upload war erforderlich.

Im bestehenden Codex-Testbrowser erschien das kontrollierte Update und wurde
mit **Jetzt aktualisieren** übernommen. 40 verfügbare Punkte, 2.040 Lernpunkte,
Level 11 und ausgewählte Drachenstufe 4 blieben erhalten. Die Familien-Chrome-
Sitzung wurde nicht verwendet. Es wurde kein echter Wortimport durchgeführt.
Der beim Laden kurz sichtbare Google-Hinweis verschwand selbstständig; im
abschließenden DOM sind weder Updatebanner noch erneute Verbindungsaufforderung
vorhanden. Es war keine neue Google-Anmeldung nötig. Das ist kein Nachweis
eines natürlichen Tokenablaufs.

Der Dokumentationsnachtrag wird separat auf demselben Entwicklungszweig
gesichert und nach Push mit dem tatsächlichen GitHub-Kopf verglichen.

## Grenzen

Die Browserfälle verwenden getrennte synthetische Daten. Eine schmale
Desktopbrowseransicht ersetzt keine Prüfung mit Bildschirmtastatur und Touch
auf einem echten iPhone oder Androidgerät. Ein Import in den Familienbestand
oder eine reale Zeitmessung mit einer Wortliste des Nutzers ist nicht Teil
dieses Pakets. Bestehender Testbereich und Familien-Chrome bleiben erhalten.
