# Qualität und Abnahme

Stand: 19.09.2026. **Prüfmatrix für die überarbeitete App.** Frische vollständige C2-Läufe: 343/343 Node-, 18/18 Trainer- und 15/15 Überarbeitungs-Browserprüfungen bestanden. Unabhängige Gesamtprüfung und Nachprüfung sind ohne offene Befunde abgeschlossen; [aktuelle Gesamtbelege](reports/2026-09-19-ueberarbeitung.md). Der frühere [v1-Abschluss](reports/2026-09-18-vokabeltrainer-v1.md) mit Produktcode `cc079cb` (277/277 Node, 15/15 Browser) bleibt historische Grundlage. Reale Produkt-Google-, Zwei-Geräte- und iOS-/iPadOS-Abnahme fehlen weiterhin.

## Nachweisstufen

1. Dokumentiert: Eine Anforderung oder ein Vorschlag ist beschrieben.
2. Implementiert: Die Funktion existiert im überprüften Code.
3. Automatisiert geprüft: Passende Tests liefen für den genannten Commit erfolgreich.
4. Im Browser geprüft: Der konkrete Ablauf wurde mit synthetischen Daten bedient.
5. Auf Zielgerät abgenommen: Der Ablauf funktioniert auf dem benannten echten iPhone/iPad.

Eine Stufe ersetzt nicht automatisch die nächste. Für jeden Bericht Datum, Commit, Umgebung, Vorgehen, Ergebnis und offene Grenzen festhalten.

## Prüfmatrix

Die folgenden Bereiche sind automatisiert mit synthetischen Daten geprüft, soweit die im [Arbeitsstand](../ARBEITSSTAND.md) verlinkten Berichte sie belegen. Fälle mit realem Google Drive, zwei physischen Geräten oder Apple-Hardware bleiben offen; ein automatisierter Browsernachweis ersetzt diese Abnahme nicht.

| Bereich | Relevante Fälle | Bezug |
| --- | --- | --- |
| Grundablauf | Wort anzeigen, Antwort eingeben, prüfen, Korrektur lesen, bewusst weitergehen | R03–R05 |
| Mehrfachbedienung | Doppelklick und Enter werten dieselbe Antwort nicht mehrfach | R04/R10 |
| Unterbrochene Runde | Nach Schließen/Neuladen auf demselben Gerät Fortsetzen oder neue Runde; bereits gewertete Antworten und Antwortpunkte erhalten, keine Doppelwertung und kein Abschlussbonus allein für Unterbrechen/Aufgeben | R32, Q13 |
| Bewertung | Richtige/falsche Eingabe, leer, Leerzeichen, Großschreibung und erlaubte Varianten gemäß abgestimmter Regel | Q5 |
| Wiederholung | Fehler werden häufiger eingeplant; drei richtige Antworten verändern die Auswahl wie beschlossen | R07/R08, Q3/Q4 |
| Kleine Wortlisten | Ein Wort, wenige Wörter, leere Auswahl, alle Wörter bereits beherrscht | R07–R09 |
| Auswahlmodi | „Alle“, „Letzte“, „Neue“ liefern die vereinbarten Mengen je Profil | R09, Q1/Q2 |
| Profile | Ergebnisse, Serien und Belohnungen bleiben dem richtigen Kind zugeordnet | R14 |
| Verwaltung | Hinzufügen, Bearbeiten, Löschen/Archivieren und leere Listen nach bestätigtem Konzept | R06, Q7 |
| Vokabeländerung | Bearbeitung eines bereits geübten Wortes erhält eine nachvollziehbare Zuordnung zu bisherigen Ergebnissen | R06/R10, Q11 |
| Offline | Start nach Erstladung, Üben, Neustart und späterer Abgleich ohne Netzverlust der Antworten | Arbeitsbasis |
| Zwei Geräte | Gleicher Datensatz, Änderungen in beide Richtungen, parallele Bearbeitung | R12/R14 |
| Widersprüchliche Vokabeländerungen | Beide Fassungen erhalten, Unterschiede in Erwachsenenansicht anzeigen, Auswahl der richtigen Fassung synchronisieren; Übungsergebnisse dabei erhalten | R29, Q11a |
| Wiederholter Upload | Netzabbruch nach möglichem Servererfolg; erneuter Upload ohne doppelte Wertung | R10/R12 |
| Konto/Datensatz | Falsches Konto, Wechsel mit ausstehenden Änderungen, versehentliche Doppelanlage | R12/R14 |
| Cloudfehler | Anmeldung abgebrochen, Zugriff abgelaufen/entzogen, Datei entfernt/beschädigt, Rate-Limit oder Serverfehler | R12 |
| Gamification | Belohnungen nur nach festgelegten Regeln, keine Verdopplung beim erneuten Laden/Sync | R11, Q6 |
| Updates | Neue App-Version während einer Übung; keine verlorenen Ergebnisse oder gemischten Datenformate | PWA-Entwurf |
| Sicherung | Vollständige JSON-Sicherung; Format-/Versionsprüfung, Vorschau und Bestätigung; automatische separate Sicherheitskopie vor Rücksetzung, Übernahme auf verbundenen Geräten und Rückweg zum vorherigen Stand; keine doppelte Wertung | R30/R33, Q11b/Q14 |
| Rasterbilder | Alle Varianten, ausgerichtete Avatarteile, Offlinegrundlage, große Bilder auf Abruf, einmaliger Fallback und fremde Caches | U01/U02 |
| Einfache Einrichtung | Vorbereitete ID, bewusste Bestandswahl, Alt-ID/Bindung erhalten, Abbruch und Wiederverbinden | U03 |
| Moduserklärung | Gemeinsame Verfügbarkeitszahlen, leere Zustände, eine Startaktion, Wiederholen nach Speicherfehler | U04 |
| Regeln je Kind | Entwurf/Originalkopf erhalten, reine Vorschau, eingefrorene Runden, Wiederaktivierung ohne Punktverlust | U05 |
| Versionsübergang | Echter v1-Reader, unveränderte Hashes/Uploadkörper, atomare Sicherung/Migration, Fehler erhält Original, frühe Versionsbarriere | U05/B1 |
| Verwaltung | Suche mit Fokus, vier Bereiche, Importziel und korrigierbarer Entwurf, ursprüngliche Bearbeitungsbasis erhalten | U06 |
| Statistiken | Effektive Antwortslots, fachlicher Lerntag, 14/30 Tage, getrennte Gruppen, Nullwerte, historische Antworten, Tabellen/Wortdetails | U07 |

Die zusätzlichen Abnahmefälle aus Abschnitt 10 des [Gesamtentwurfs](superpowers/specs/2026-09-16-vokabeltrainer-design.md) sind Bestandteil der automatisierten Matrix. Ausgeschöpfte Aufgabenmenge, Lernrevisionen, konkurrierende Wiederherstellungen und verspätete Offlineereignisse sind synthetisch geprüft; ihre geräteübergreifende Realabnahme bleibt offen.

## Echte Geräte und Oberfläche

Bekannter Stand: Der Nutzer besitzt selbst weder iPhone noch iPad. Sein Freund als künftiger Hauptnutzer besitzt beide Gerätetypen. Modelle, Betriebssystemversionen und seine Verfügbarkeit für Tests sind noch offen. Die folgenden Prüfungen bleiben vollständig offen; einen Browser-Simulator nicht als Prüfung auf seinen Geräten ausgeben.

- iPhone/Safari und installierte Home-Bildschirm-App separat testen; iPad nach Möglichkeit ebenfalls.
- Tastatur verdeckt weder Eingabe noch Prüfung/Weiter. Fokus bleibt nachvollziehbar; schnelle Mehrfachbedienung erzeugt keine Doppelantworten.
- Für das Rechtschreibtraining Verhalten von Autokorrektur, Großschreibung, Vorschlägen und Rechtschreibmarkierungen prüfen. Browserattribute sind keine Garantie für das Verhalten jeder iOS-Tastatur.
- Hoch-/Querformat, kleine Displays und größere Schrift prüfen. Bedienelemente müssen mit Fingern sicher erreichbar sein.
- Richtig/Falsch nicht nur durch Farbe darstellen; Text und Symbole verwenden. Rückmeldungen auch mit Screenreader und Tastatur nachvollziehbar halten.
- Bewegung und Töne sollen abschaltbar beziehungsweise zurückhaltend sein; genaue Gestaltung noch abstimmen.
- Verbindungshinweise müssen zwischen lokalem Speichern und bestätigtem Cloudabgleich unterscheiden.
- Android sowie mindestens ein Desktopbrowser in die spätere Matrix aufnehmen. Konkrete Mindestversionen vor der Releasefreigabe nennen.

## Testwerkzeuge

Die automatisierten Tests laufen mit Node.js ab Version 22.8.0 und dessen eingebautem Testrunner: `npm test`. Externe Google-Antworten werden kontrolliert simuliert; eigener Adapter, Modell, Controller und Speicherlogik laufen unverändert. Keine npm-Laufzeitpakete sind erforderlich.

Die zusätzliche Browserprüfung bedient echte Oberfläche, IndexedDB und Service Worker in zwei getrennten Browserkontexten; nur GIS und Drive-HTTP werden simuliert. Einrichtung und Grenzen stehen in [tests/browser/README.md](../tests/browser/README.md). Sie ersetzt keine echte Google-, Safari- oder Geräteabnahme.

Keine Erfolgsaussage aus einer bloßen Codeinspektion ableiten. Keine echten Kinderprofile oder Google-Tokens als Testfixture verwenden. Für Fehler- und Konfliktfälle reproduzierbare synthetische Daten verwenden.

## Dokumentationsprüfung

Für jeden Abschlussstand sind zu prüfen:

- Alle internen Datei- und Abschnittsverweise lösen sich auf, einschließlich korrekter Groß-/Kleinschreibung.
- README, AGENTS.md, Arbeitsstand und Übergabe stimmen bei Zielgruppe, Cloudanbieter, Kontenmodell und Status überein.
- Bestätigte Anforderungen und offene Vorschläge sind sichtbar getrennt.
- Implementierte App, eingerichtete Google-Probe und noch offene Produkt-/Geräteabnahmen werden klar getrennt.
- Nur beabsichtigte Dateien werden committed; Git-Whitespaceprüfung ist sauber.
- Nach einem autorisierten Push stimmt der dokumentierte Remote-Branch mit dem lokalen Commit überein; eine Integration nach `main` ist separat zu beauftragen.

Die aktuellen Ergebnisse stehen im [Gesamtbericht](reports/2026-09-19-ueberarbeitung.md). Der [v1-Abschlussbericht](reports/2026-09-18-vokabeltrainer-v1.md) ist die historische Grundlage. Historische Grundlagen stehen im [ursprünglichen Dokumentationsbericht](reports/2026-09-16-dokumentation.md), im [Prüfbericht zum Gesamtentwurf](reports/2026-09-16-gesamtentwurf.md) und im [Prüfbericht der lokalen Verbindungsprobe](reports/2026-09-17-google-drive-probe.md).
