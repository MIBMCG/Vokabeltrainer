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
| R07 | Adaptive Wiederholung nach Fehlern | Eine falsch beantwortete Vokabel erneut abfragen, nachdem zwei andere Aufgaben bearbeitet wurden. Endet die Runde vorher, bleibt der Wiederholungsbedarf für später vorgemerkt; die gewählte Rundengröße wird nicht verlängert. Fehlt eine passende weitere Aufgabe, gilt R20. |
| R08 | Drei richtige Antworten in Folge | Die Serie zählt je Wort und Kind über mehrere Runden hinweg. Eine falsche Antwort auf dieses Wort setzt dessen Serie auf null; Antworten auf andere Wörter verändern sie nicht. Nach drei richtigen Antworten pausiert das Wort für den Rest der laufenden Runde. Spätere Wiederholung gemäß R19. |
| R09 | Drei Auswahlmodi | „Alle Vokabeln“: gesamter verfügbarer Wortschatz. „Letzte Vokabeln“: zuletzt hinzugefügte Lektion. „Neue Vokabeln“: Wörter, die das ausgewählte Kind noch nie geübt hat. Q1/Q2 ausdrücklich bestätigt. |
| R10 | Fortschritt einsehbar | Übersicht darüber, welche Wörter wie gut und wie oft geübt wurden. |
| R11 | Ansprechende Gestaltung und Gamification | Bereits die erste Version verbindet Lernreise/Landkarte, Punkte/Level/Abzeichen und einen einfachen gestaltbaren Avatar zu einem gemeinsamen Belohnungssystem. Thema ist ein Insel-Abenteuer mit unterschiedlichen Landschaften, etwa Wäldern, Stränden und Bergen. Modern und passend für 10–13-Jährige gestalten. Der Avatar erhält zunächst eine kleine Auswahl an Farben und Zubehör. Konkrete Grafiken, Umfang der Welt und Belohnungsregeln sind noch offen. |
| R12 | Automatischer Cloudaustausch | Google Drive wurde ausdrücklich ausgewählt. Komfortgrenzen des Browserlogins sind zu prüfen. |
| R13 | Keine zusätzlichen kostenpflichtigen Cloudabos | Vorhandenes Google Drive nutzen. Kein stillschweigender Wechsel auf einen weiteren Dienst. |
| R14 | Gemeinsamer Google-Zugang | Die Eltern richten denselben Zugang auf beiden Geräten ein; eigene Lernprofile trennen die Lernstände der Kinder. |
| R15 | Privater Gebrauch | Keine öffentliche Schulplattform oder mandantenfähige Klassenverwaltung beauftragt. |
| R16 | Portable Dokumentation und GitHub | README, AGENTS.md und alle nötigen Übergabedokumente erstellen und pushen, sodass andere KIs/Systeme fortsetzen können. |
| R17 | Anforderungen im Dialog klären | Jeweils eine Frage mit mehreren Optionen und einer Empfehlung stellen. Jede Antwort direkt dokumentieren. Erst alle offenen Punkte klären; anschließend ist der Beginn der Entwicklung beauftragt. |
| R18 | Runden mit wählbarer Aufgabenzahl | Standardmäßig 10 Antworten, alternativ 20 oder 30. Wiederholungen zählen mit. Ein Fortschrittsbalken zeigt den Stand, beispielsweise „7 von 10“. Kein Zeitlimit als reguläres Rundenende. |
| R19 | Wiederholung mit wachsenden Abständen | Nach Erreichen der Dreierserie erste Wiederholung frühestens am nächsten Tag. Nach jeweils richtiger Wiederholung folgen Abstände von 3, 7 und 14 Tagen, danach weiterhin jeweils 14 Tage. Eine falsche Antwort führt zurück ins häufigere Üben und setzt gemäß R08 die Richtigserie auf null. |
| R20 | Wahl bei erschöpfter Aufgabenauswahl | Ist vor dem geplanten Rundenende keine passende Aufgabe mehr verfügbar, entscheidet das Kind zwischen Beenden und Fortsetzen mit zusätzlichem Wortschatz außerhalb der bisherigen Auswahl. Die gewählte Gesamtzahl der Antworten und die Wiederholungspausen bleiben erhalten. |
| R21 | Bewertung der eingegebenen Schreibweise | Groß-/Kleinschreibung und überflüssige Leerzeichen am Anfang/Ende ignorieren. Echte Buchstabenfehler bleiben falsch. Die korrekte Schreibweise wird auch bei akzeptierter abweichender Großschreibung angezeigt. |
| R22 | Mehrere gültige Antworten | Eltern/Lehrkräfte können je Vokabel mehrere zulässige englische Antworten hinterlegen, etwa „bicycle“ und „bike“ für „Fahrrad“. Jede hinterlegte Antwort zählt richtig. Auch britische/amerikanische Schreibvarianten können so ausdrücklich zugelassen werden. Die Erwachsenen bestimmen die erlaubten Varianten. |

R03–R11 stammen aus der ursprünglichen Produktbeschreibung. R12–R14 wurden in der anschließenden Technologie-/Kontenabstimmung konkretisiert. R01 und R16 wurden mit dem Dokumentationsauftrag ergänzt. Danach bestätigte der Nutzer die Definitionen in R09, den Ablauf in R17 und die Konkretisierung der Gamification in R11. Die weiteren Entscheidungen sind unten einzeln protokolliert.

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

Die Schritte 1, 3 und 6 ergänzen den bestätigten Kernablauf als Vorschlag. Die reguläre Rundengröße ist mit R18 festgelegt; bei erschöpfter Auswahl gilt R20. Die Bedienung über Enter und die konkrete Abschlussansicht sind noch offen.

Aus R18–R20 folgt für das Detaildesign: Zusätzlicher Wortschatz füllt nur die noch übrigen Aufgabenplätze. Auch dort pausierte Wörter bleiben pausiert. Sind insgesamt keine passenden weiteren Aufgaben vorhanden, ist nur der Abschluss möglich; keine Aufgaben oder Erfolge erfinden. Eine leere Auswahl am Start darf nicht als bereits erfolgreich absolvierte Runde erscheinen.

## Geklärte Entscheidungen

| ID | Entscheidung | Bestätigung |
| --- | --- | --- |
| Q1 | „Letzte Vokabeln“ bezeichnet die zuletzt hinzugefügte Lektion. | 16.09.2026: Nutzer bestätigt den konkreten Definitionsvorschlag mit „Ja genau“. |
| Q2 | „Neue Vokabeln“ bezeichnet die Wörter, die das ausgewählte Kind noch nie geübt hat. Der Status ist pro Lernprofil getrennt. | 16.09.2026: dieselbe ausdrückliche Bestätigung. |
| Q3 | Eine Runde umfasst standardmäßig 10 Antworten, wahlweise 20 oder 30; Wiederholungen zählen mit. Ein Fortschrittsbalken zeigt den Stand. | 16.09.2026: Nutzer wählt Option A der Frage zum Rundenende. |
| Q4a | Die Richtigserie bleibt je Wort und Kind über mehrere Runden erhalten. Ein Fehler bei diesem Wort setzt dessen Serie auf null; Antworten auf andere Wörter verändern sie nicht. | 16.09.2026: Nutzer wählt Option A der Frage zum Zählzeitraum. |
| Q4b | Nach drei richtigen Antworten für den Rest der Runde pausieren. Erste Wiederholung frühestens am nächsten Tag; nach richtigen Wiederholungen Abstände von 3, 7, 14 Tagen, anschließend jeweils 14 Tage. Bei Fehler zurück ins häufigere Üben. | 16.09.2026: Nutzer wählt Option A der Frage zur späteren Wiederholung. |
| Q4c | Nach einer falschen Antwort zwei andere Aufgaben bearbeiten, dann das Wort erneut abfragen. Bei vorherigem Rundenende den Wiederholungsbedarf vormerken, ohne die gewählte Rundengröße zu verlängern. | 16.09.2026: Nutzer wählt Option A der Frage zum Fehlerabstand. |
| Q4d | Bei erschöpfter Auswahl entscheidet das Kind zwischen Beenden und Fortsetzen mit zusätzlichem Wortschatz außerhalb der bisherigen Auswahl. | 16.09.2026: Nutzer wählt Option B der Frage zum vorzeitigen Rundenende. |
| Q5a | Groß-/Kleinschreibung und äußere Leerzeichen nicht als Fehler werten; echte Buchstabenfehler bleiben falsch. Die korrekte Schreibweise trotzdem anzeigen. | 16.09.2026: Nutzer wählt Option A der Frage zur Groß-/Kleinschreibung. |
| Q5b | Mehrere von Erwachsenen hinterlegte englische Lösungen pro Vokabel zulassen; jede hinterlegte Übersetzung oder Schreibvariante wird akzeptiert. | 16.09.2026: Nutzer wählt Option A der Frage zu mehreren gültigen Antworten. |
| Q6a | In der ersten Version Lernreise/Landkarte, Punkte/Level/Abzeichen und einen einfachen gestaltbaren Avatar als gemeinsames Belohnungssystem umsetzen. Für den Avatar zunächst wenige Farben und Zubehörteile vorsehen. | 16.09.2026: Nutzer wählt Option A der konkretisierten Frage zur Kombination aller drei Elemente. |
| Q6b | Insel-Abenteuer mit unterschiedlichen Landschaften wie Wäldern, Stränden und Bergen als Thema der Lernwelt. Gestaltung modern und passend für 10–13-Jährige. | 16.09.2026: Nutzer wählt Option A der Frage zum Thema der Lernwelt. |

## Offene Entscheidungen

| ID | Frage | Vorschlag zur Besprechung | Vor welchem Paket klären? |
| --- | --- | --- | --- |
| Q6c | Wofür soll es Punkte geben? | A: 10 Punkte je richtiger Antwort, auch bei einer späteren Wiederholung eines Fehlerwortes, plus 20 Punkte für eine abgeschlossene Runde (Empfehlung). B: Nur 10 Punkte je richtiger Antwort. C: Nur für abgeschlossene Runden, unabhängig von der Fehlerzahl; Höhe dann festlegen. In allen Vorschlägen keine Punktabzüge bei Fehlern. Noch keine Auswahl. | Belohnungsdesign |
| Q6d | Wie führen Punkte zu Leveln, Insel-Fortschritt, Abzeichen und Avatar-Ausstattung? | Nach Q6c einen einfachen gemeinsamen Fortschritt vorschlagen. Freischaltregeln und Umfang der ersten Inselwelt sind noch offen. | Belohnungsdesign |
| Q7 | Wie werden Vokabeln organisiert und eingegeben? | Lektionen/Wortlisten, Einzeleingabe; Tabellenimport als mögliche spätere Erweiterung. | Verwaltung |
| Q8 | Wie wird zur Erwachsenenansicht gewechselt? | Ein klarer Bereich; optional PIN als Bedienhürde. Noch keine PIN beschlossen. | Verwaltung |
| Q9 | Welche Geräte und iOS-Versionen müssen konkret unterstützt werden? | Echtes iPhone und nach Möglichkeit iPad benennen; Mindestversion aus den Tests ableiten und abstimmen. | Technische Probe |
| Q10 | Ist die reale Häufigkeit von Google-Verbindungsdialogen akzeptabel? | Auf iOS testen und Verhalten zeigen. Offline weiterüben muss bei fehlender Verbindung möglich bleiben. | Technische Probe |
| Q11 | Welches endgültige Speicher- und Konfliktmodell? | Stabile IDs, getrennte Inhalte/Ergebnisse, wiederholbare Übertragung ohne Datenverlust. | Datenschema/Sync |
| Q12 | Welche Lizenz soll gelten? | Keine Lizenz eigenmächtig auswählen. | Lizenzierte Weitergabe |

Die Liste wird auf ausdrücklichen Wunsch des Nutzers Frage für Frage mit Optionen und Empfehlung abgearbeitet. Jede Antwort wird sofort festgehalten; neu erkannte Produktfragen werden ergänzt. Technische Detailentscheidungen sollen verständlich begründet werden, ohne den Nutzer unnötig mit Implementierungsdetails zu belasten. Nach vollständiger Klärung den konsolidierten Umfang dokumentieren, einen konkreten Implementierungsplan erstellen und mit der beauftragten Entwicklung beginnen. Reale technische Nachweise bleiben als Prüfaufgaben sichtbar und dürfen nicht durch bloße Zustimmung als bestanden gelten.

## Nicht beauftragt

- Native App-Store-App, App-Store-Veröffentlichung oder kostenpflichtiger Backenddienst.
- Getrennte Google-Konten für jedes Kind als aktuelles Kontenmodell.
- KI-generierte Vokabeln, automatische Übersetzung oder ein kostenpflichtiger KI-Dienst.
- Ranglisten zwischen Kindern, Werbung, Käufe oder soziale Funktionen.
- Zusätzliche Lernrichtungen, Aussprachebewertung oder weitere Sprachen.

Diese Punkte dürfen später besprochen werden; sie sind nicht Bestandteil des bisherigen Auftrags.
