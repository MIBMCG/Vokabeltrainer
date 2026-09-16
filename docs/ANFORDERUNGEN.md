# Anforderungen und Entscheidungen

Stand: 16.09.2026. Dieses Dokument ist die zentrale Quelle für den Produktumfang. „Bestätigt“ bedeutet eine ausdrückliche Nutzerangabe oder Auswahl im bisherigen Gespräch. Vorschläge müssen als solche erhalten bleiben, bis sie abgestimmt wurden.

## Bestätigte Anforderungen

| ID | Anforderung | Konkretisierung / Grenze |
| --- | --- | --- |
| R01 | Zielgruppe 10–13 Jahre, Klasse 4–7 | Die Angabe stammt vom Nutzer. Gestaltung auf diese Zielgruppe abstimmen. |
| R02 | Plattformübergreifend, vor allem iOS | iPhone und iPad priorisieren; weitere aktuelle Browser berücksichtigen. Noch keine Mindestversion beschlossen. |
| R03 | Deutsch nach Englisch | Deutsches Wort anzeigen, englische Übersetzung als Texteingabe. |
| R04 | Direkte Rückmeldung | Richtig: ✅. Falsch: ❌ und richtige Schreibweise. |
| R05 | Bewusster Wechsel | Ein „Weiter“-Button führt zur nächsten Vokabel. |
| R06 | Vokabelbestand erweiterbar | Verwaltung durch Eltern/Lehrkraft; kein manuelles Bearbeiten einer JSON-Datei als notwendiger Alltagsschritt. |
| R07 | Adaptive Wiederholung | Falsche Wörter häufiger wiederholen. |
| R08 | Drei richtige Antworten in Folge | Danach in dieser Übung selten oder gar nicht mehr abfragen. Die konkrete Variante ist offen. |
| R09 | Auswahlmodi gewünscht | Wenn möglich „Alle Vokabeln“, „Letzte Vokabeln“, „Neue Vokabeln“. Die beiden letzten Begriffe sind noch nicht definiert. |
| R10 | Fortschritt einsehbar | Übersicht darüber, welche Wörter wie gut und wie oft geübt wurden. |
| R11 | Ansprechende Gestaltung und Gamification | Art der Belohnungen und visuelles Thema noch nicht ausgewählt. |
| R12 | Automatischer Cloudaustausch | Google Drive wurde ausdrücklich ausgewählt. Komfortgrenzen des Browserlogins sind zu prüfen. |
| R13 | Keine zusätzlichen kostenpflichtigen Cloudabos | Vorhandenes Google Drive nutzen. Kein stillschweigender Wechsel auf einen weiteren Dienst. |
| R14 | Gemeinsamer Google-Zugang | Die Eltern richten denselben Zugang auf beiden Geräten ein; eigene Lernprofile trennen die Lernstände der Kinder. |
| R15 | Privater Gebrauch | Keine öffentliche Schulplattform oder mandantenfähige Klassenverwaltung beauftragt. |
| R16 | Portable Dokumentation und GitHub | README, AGENTS.md und alle nötigen Übergabedokumente erstellen und pushen, sodass andere KIs/Systeme fortsetzen können. |

R03–R11 stammen aus der ursprünglichen Produktbeschreibung. R12–R14 wurden in der anschließenden Technologie-/Kontenabstimmung konkretisiert. R01 und R16 wurden im letzten Auftrag ergänzt.

## Besprochene technische Arbeitsbasis

Die folgenden Punkte bilden den vorgeschlagenen Gesamtaufbau, auf dessen Grundlage Google Drive gewählt wurde. Ein vollständiges Detaildesign ist damit noch nicht freigegeben:

- PWA mit HTML, CSS und JavaScript; mehrere überschaubare Dateien statt einer erzwungenen einzelnen HTML-Datei.
- Lokales Speichern auf dem Gerät, voraussichtlich IndexedDB, und Offlineüben nach erfolgreicher Ersteinrichtung.
- JSON für strukturierte Austausch-/Sicherungsdaten; Inhalt und Lernfortschritt fachlich trennen.
- Schüler- und Erwachsenenansicht in derselben Anwendung.
- GitHub Pages als vorgeschlagener Hostingweg für den Programmcode.

Excel wurde als ursprüngliche Speicheridee genannt. In der Diskussion wurde Import/Export als mögliche Ergänzung vorgeschlagen; ein Excel-Import ist **noch kein zugesagter Umfang der ersten Version**. Markdown ist für Projektdokumentation vorgesehen, nicht als Laufzeitdatenbank.

## Vorgeschlagener Lernablauf

1. Lernprofil auswählen und Übungsmodus starten.
2. Deutsches Wort und Eingabefeld anzeigen.
3. Antwort über eine eindeutige Aktion prüfen.
4. Ergebnis mit Symbol und Text zeigen; bei Fehler die richtige Übersetzung lesbar darstellen.
5. Mit „Weiter“ fortfahren; die Antwort nicht mehrfach werten.
6. Am Ende eine kurze Zusammenfassung des Übens zeigen.

Die Schritte 1, 3 und 6 ergänzen den bestätigten Kernablauf als Vorschlag. Ob Enter zusätzlich auslöst, wie groß eine Runde ist und wann sie endet, wird im Detaildesign entschieden.

## Offene Entscheidungen

| ID | Frage | Vorschlag zur Besprechung | Vor welchem Paket klären? |
| --- | --- | --- | --- |
| Q1 | Was heißt „Letzte Vokabeln“? | Zuletzt hinzugefügte Lektion oder zuletzt bearbeiteter Wortschatz? Nicht stillschweigend gleichsetzen. | Auswahlmodi |
| Q2 | Was heißt „Neue Vokabeln“? | Noch nie geübte Wörter dieses Lernprofils; alternativ kürzlich hinzugefügte Wörter. | Auswahlmodi |
| Q3 | Wie lange ist eine Übung? | Kurze Runde mit sichtbarem Ende; Zahl der Wörter/Aufgaben noch wählen. | Lernlogik |
| Q4 | Was passiert nach drei richtigen Antworten? | Für die aktuelle Runde pausieren, später gelegentlich wiederholen. Gilt die Serie nur innerhalb einer Runde oder über mehrere Sitzungen? | Lernlogik |
| Q5 | Wie wird die Schreibweise bewertet? | Leerzeichen außen entfernen; Regeln zu Großschreibung, Apostrophen, mehreren Übersetzungen und britisch/amerikanisch festlegen. | Antwortprüfung |
| Q6 | Welche Gamification und welche Optik? | Zum Beispiel Sammelobjekte, eine Lernreise oder ein gestaltbarer Avatar. Noch keine Variante gewählt. | UI-/Belohnungsdesign |
| Q7 | Wie werden Vokabeln organisiert und eingegeben? | Lektionen/Wortlisten, Einzeleingabe; Tabellenimport als mögliche spätere Erweiterung. | Verwaltung |
| Q8 | Wie wird zur Erwachsenenansicht gewechselt? | Ein klarer Bereich; optional PIN als Bedienhürde. Noch keine PIN beschlossen. | Verwaltung |
| Q9 | Welche Geräte und iOS-Versionen müssen konkret unterstützt werden? | Echtes iPhone und nach Möglichkeit iPad benennen; Mindestversion aus den Tests ableiten und abstimmen. | Technische Probe |
| Q10 | Ist die reale Häufigkeit von Google-Verbindungsdialogen akzeptabel? | Auf iOS testen und Verhalten zeigen. Offline weiterüben muss bei fehlender Verbindung möglich bleiben. | Technische Probe |
| Q11 | Welches endgültige Speicher- und Konfliktmodell? | Stabile IDs, getrennte Inhalte/Ergebnisse, wiederholbare Übertragung ohne Datenverlust. | Datenschema/Sync |
| Q12 | Welche Lizenz soll gelten? | Keine Lizenz eigenmächtig auswählen. | Lizenzierte Weitergabe |

Die Liste ist kein Fragebogen, der in einer Nachricht abgearbeitet werden muss. Im Gespräch jeweils die nächste sachlich abhängige Entscheidung klären. Für die aktuelle Dokumentationsübergabe müssen diese Fragen nicht vorzeitig entschieden werden.

## Nicht beauftragt

- Native App-Store-App, App-Store-Veröffentlichung oder kostenpflichtiger Backenddienst.
- Getrennte Google-Konten für jedes Kind als aktuelles Kontenmodell.
- KI-generierte Vokabeln, automatische Übersetzung oder ein kostenpflichtiger KI-Dienst.
- Ranglisten zwischen Kindern, Werbung, Käufe oder soziale Funktionen.
- Zusätzliche Lernrichtungen, Aussprachebewertung oder weitere Sprachen.

Diese Punkte dürfen später besprochen werden; sie sind nicht Bestandteil des bisherigen Auftrags.
