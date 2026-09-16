# Qualität und Abnahme

Stand: 16.09.2026. **Prüfplan, keine Liste bereits bestandener Produkttests.** Es existiert noch keine ausführbare Anwendung oder Testumgebung.

## Nachweisstufen

1. Dokumentiert: Eine Anforderung oder ein Vorschlag ist beschrieben.
2. Implementiert: Die Funktion existiert im überprüften Code.
3. Automatisiert geprüft: Passende Tests liefen für den genannten Commit erfolgreich.
4. Im Browser geprüft: Der konkrete Ablauf wurde mit synthetischen Daten bedient.
5. Auf Zielgerät abgenommen: Der Ablauf funktioniert auf dem benannten echten iPhone/iPad.

Eine Stufe ersetzt nicht automatisch die nächste. Für jeden Bericht Datum, Commit, Umgebung, Vorgehen, Ergebnis und offene Grenzen festhalten.

## Geplante Prüfmatrix

Alle folgenden Produktprüfungen sind **offen**.

| Bereich | Relevante Fälle | Bezug |
| --- | --- | --- |
| Grundablauf | Wort anzeigen, Antwort eingeben, prüfen, Korrektur lesen, bewusst weitergehen | R03–R05 |
| Mehrfachbedienung | Doppelklick und Enter werten dieselbe Antwort nicht mehrfach | R04/R10 |
| Bewertung | Richtige/falsche Eingabe, leer, Leerzeichen, Großschreibung und erlaubte Varianten gemäß abgestimmter Regel | Q5 |
| Wiederholung | Fehler werden häufiger eingeplant; drei richtige Antworten verändern die Auswahl wie beschlossen | R07/R08, Q3/Q4 |
| Kleine Wortlisten | Ein Wort, wenige Wörter, leere Auswahl, alle Wörter bereits beherrscht | R07–R09 |
| Auswahlmodi | „Alle“, „Letzte“, „Neue“ liefern die vereinbarten Mengen je Profil | R09, Q1/Q2 |
| Profile | Ergebnisse, Serien und Belohnungen bleiben dem richtigen Kind zugeordnet | R14 |
| Verwaltung | Hinzufügen, Bearbeiten, Löschen/Archivieren und leere Listen nach bestätigtem Konzept | R06, Q7 |
| Vokabeländerung | Bearbeitung eines bereits geübten Wortes erhält eine nachvollziehbare Zuordnung zu bisherigen Ergebnissen | R06/R10, Q11 |
| Offline | Start nach Erstladung, Üben, Neustart und späterer Abgleich ohne Netzverlust der Antworten | Arbeitsbasis |
| Zwei Geräte | Gleicher Datensatz, Änderungen in beide Richtungen, parallele Bearbeitung | R12/R14 |
| Wiederholter Upload | Netzabbruch nach möglichem Servererfolg; erneuter Upload ohne doppelte Wertung | R10/R12 |
| Konto/Datensatz | Falsches Konto, Wechsel mit ausstehenden Änderungen, versehentliche Doppelanlage | R12/R14 |
| Cloudfehler | Anmeldung abgebrochen, Zugriff abgelaufen/entzogen, Datei entfernt/beschädigt, Rate-Limit oder Serverfehler | R12 |
| Gamification | Belohnungen nur nach festgelegten Regeln, keine Verdopplung beim erneuten Laden/Sync | R11, Q6 |
| Updates | Neue App-Version während einer Übung; keine verlorenen Ergebnisse oder gemischten Datenformate | PWA-Entwurf |
| Sicherung | Export/Import und Migration, falls in den ersten Umfang aufgenommen, ohne vorhandene Daten still zu verlieren | Q11 |

## Echte Geräte und Oberfläche

- iPhone/Safari und installierte Home-Bildschirm-App separat testen; iPad nach Möglichkeit ebenfalls.
- Tastatur verdeckt weder Eingabe noch Prüfung/Weiter. Fokus bleibt nachvollziehbar; schnelle Mehrfachbedienung erzeugt keine Doppelantworten.
- Für das Rechtschreibtraining Verhalten von Autokorrektur, Großschreibung, Vorschlägen und Rechtschreibmarkierungen prüfen. Browserattribute sind keine Garantie für das Verhalten jeder iOS-Tastatur.
- Hoch-/Querformat, kleine Displays und größere Schrift prüfen. Bedienelemente müssen mit Fingern sicher erreichbar sein.
- Richtig/Falsch nicht nur durch Farbe darstellen; Text und Symbole verwenden. Rückmeldungen auch mit Screenreader und Tastatur nachvollziehbar halten.
- Bewegung und Töne sollen abschaltbar beziehungsweise zurückhaltend sein; genaue Gestaltung noch abstimmen.
- Verbindungshinweise müssen zwischen lokalem Speichern und bestätigtem Cloudabgleich unterscheiden.
- Android sowie mindestens ein Desktopbrowser in die spätere Matrix aufnehmen. Konkrete Mindestversionen vor der Releasefreigabe nennen.

## Testwerkzeuge

Werkzeuge sind noch nicht festgelegt. Nach ihrer Einführung exakte, ausführbare Befehle in README und Arbeitsstand dokumentieren. Geeignet sind reine Logiktests, Speicher-/Syncintegrationstests und Browserprüfungen; die Auswahl muss zum tatsächlichen Stack passen.

Keine Erfolgsaussage aus einer bloßen Codeinspektion ableiten. Keine echten Kinderprofile oder Google-Tokens als Testfixture verwenden. Für Fehler- und Konfliktfälle reproduzierbare synthetische Daten verwenden.

## Dokumentationsprüfung

Für dieses anfängliche Paket sind zu prüfen:

- Alle internen Datei- und Abschnittsverweise lösen sich auf, einschließlich korrekter Groß-/Kleinschreibung.
- README, AGENTS.md, Arbeitsstand und Übergabe stimmen bei Zielgruppe, Cloudanbieter, Kontenmodell und Status überein.
- Bestätigte Anforderungen und offene Vorschläge sind sichtbar getrennt.
- Keine tatsächliche App, eingerichtete Google-Verbindung oder bestandene Produktabnahme wird vorgetäuscht.
- Nur beabsichtigte Dateien werden committed; Git-Whitespaceprüfung ist sauber.
- Nach dem autorisierten Push stimmt der Commit auf `origin/main` mit dem lokalen Commit überein.

Das Ergebnis dieses Dokumentationspakets steht in [Prüfbericht](reports/2026-09-16-dokumentation.md).
