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
| R09 | Drei Auswahlmodi | „Alle Vokabeln“: gesamter dem Kind zugeordneter Wortschatz. „Letzte Vokabeln“: zuletzt hinzugefügte Lektion innerhalb der diesem Kind zugeordneten Lektionen. „Neue Vokabeln“: zugeordnete Wörter, die das ausgewählte Kind noch nie geübt hat. Definitionen aus Q1/Q2, Zuordnungsgrenze aus Q7b/R26. |
| R10 | Fortschritt einsehbar | Übersicht darüber, welche Wörter wie gut und wie oft geübt wurden. |
| R11 | Ansprechende Gestaltung und Gamification | Bereits die erste Version verbindet Lernreise/Landkarte, Punkte/Level/Abzeichen und einen einfachen gestaltbaren Avatar zu einem gemeinsamen Belohnungssystem. Thema ist ein Insel-Abenteuer mit unterschiedlichen Landschaften, etwa Wäldern, Stränden und Bergen. Modern und passend für 10–13-Jährige gestalten. Der Avatar erhält zunächst eine kleine Auswahl an Farben und Zubehör. Punktevergabe gemäß R23, Freischaltprinzip gemäß R24; Umfang und Schwellenwerte gemäß bestätigtem E04; die tatsächlichen Grafiken entstehen bei der Umsetzung. |
| R12 | Automatischer Cloudaustausch | Google Drive wurde ausdrücklich ausgewählt. Erneutes Verbinden bei Bedarf ist gemäß R28 grundsätzlich akzeptiert; die tatsächliche Häufigkeit und Bedienbarkeit bleiben auf Zielgeräten zu prüfen. |
| R13 | Keine zusätzlichen kostenpflichtigen Cloudabos | Vorhandenes Google Drive nutzen. Kein stillschweigender Wechsel auf einen weiteren Dienst. |
| R14 | Gemeinsamer Google-Zugang | Die Eltern richten denselben Zugang auf beiden Geräten ein; eigene Lernprofile trennen die Lernstände der Kinder. |
| R15 | Privater Gebrauch | Keine öffentliche Schulplattform oder mandantenfähige Klassenverwaltung beauftragt. |
| R16 | Portable Dokumentation und GitHub | README, AGENTS.md und alle nötigen Übergabedokumente erstellen und pushen, sodass andere KIs/Systeme fortsetzen können. |
| R17 | Anforderungen im Dialog klären | Jeweils eine Frage mit mehreren Optionen und einer Empfehlung stellen. Jede Antwort direkt dokumentieren. Erst alle offenen Punkte klären; anschließend ist der Beginn der Entwicklung beauftragt. |
| R18 | Runden mit wählbarer Aufgabenzahl | Standardmäßig 10 Antworten, alternativ 20 oder 30. Wiederholungen zählen mit. Ein Fortschrittsbalken zeigt den Stand, beispielsweise „7 von 10“. Kein Zeitlimit als reguläres Rundenende. |
| R19 | Wiederholung mit wachsenden Abständen | Nach Erreichen der Dreierserie erste Wiederholung frühestens am nächsten Tag. Nach jeweils richtiger Wiederholung folgen Abstände von 3, 7 und 14 Tagen, danach weiterhin jeweils 14 Tage. Eine falsche Antwort führt zurück ins häufigere Üben und setzt gemäß R08 die Richtigserie auf null. |
| R20 | Wahl bei erschöpfter Aufgabenauswahl | Ist vor dem geplanten Rundenende keine passende Aufgabe mehr verfügbar, entscheidet das Kind zwischen Beenden und Fortsetzen mit zusätzlichem Wortschatz außerhalb der bisherigen Auswahl. Auch dieser Wortschatz muss dem Kind gemäß R26 zugeordnet sein. Die gewählte Gesamtzahl der Antworten und die Wiederholungspausen bleiben erhalten. |
| R21 | Bewertung der eingegebenen Schreibweise | Groß-/Kleinschreibung und überflüssige Leerzeichen am Anfang/Ende ignorieren. Echte Buchstabenfehler bleiben falsch. Die korrekte Schreibweise wird auch bei akzeptierter abweichender Großschreibung angezeigt. |
| R22 | Mehrere gültige Antworten | Eltern/Lehrkräfte können je Vokabel mehrere zulässige englische Antworten hinterlegen, etwa „bicycle“ und „bike“ für „Fahrrad“. Jede hinterlegte Antwort zählt richtig. Auch britische/amerikanische Schreibvarianten können so ausdrücklich zugelassen werden. Die Erwachsenen bestimmen die erlaubten Varianten. |
| R23 | Punkte für richtige Antworten und Rundenabschluss | Jede richtige Antwort gibt 10 Punkte. Auch ein bei einer späteren Wiederholung richtig beantwortetes Fehlerwort gibt die vollen 10 Punkte. Für eine abgeschlossene Runde gibt es zusätzlich 20 Punkte, unabhängig von der Fehlerzahl. Keine Punktabzüge bei Fehlern. |
| R24 | Gemeinsamer Fortschritt mit automatischen Freischaltungen | Gesammelte Punkte erhöhen das Level. An festgelegten Level-Meilensteinen werden Reiseabschnitte und bestimmte Avatar-Kleidungsstücke/Zubehör automatisch freigeschaltet. Das Kind kann aus seiner bereits freigeschalteten Ausstattung jederzeit frei wählen. Abzeichen belohnen erreichte Meilensteine. Kein zusätzlicher Münzladen. Konkrete Schwellen und Inhalte im Detaildesign vorschlagen. |
| R25 | Vokabeleingabe und Lektionen | Erwachsene können einzelne Vokabeln über ein Formular ergänzen oder mehrere Zeilen aus einer Tabelle, beispielsweise Excel, mit den Spalten Deutsch und Englisch kopieren und einfügen. Die Wörter werden einer vorhandenen oder neu angelegten benannten Lektion zugeordnet, etwa „Unit 3“. Direkter Excel-/CSV-Dateiimport gehört nicht zur gewählten ersten Version. |
| R26 | Lektionen gezielt Lernprofilen zuordnen | Erwachsene ordnen jede Lektion einem oder mehreren Kindern zu. Die drei Auswahlmodi berücksichtigen jeweils nur die dem ausgewählten Kind zugeordneten Lektionen. Eine gemeinsame Lektion muss dafür nicht mehrfach angelegt werden. Lernstände, Punkte und Avatar bleiben pro Kind getrennt. |
| R27 | Erwachsenenansicht mit PIN | Die Erwachsenenansicht wird über den Menüpunkt „Für Erwachsene“ und eine selbst festgelegte vierstellige PIN geöffnet. Die PIN dient als einfache Hürde gegen versehentliche Änderungen an Vokabeln oder Zuordnungen. Sie ersetzt keine getrennten Google-Konten oder serverseitigen Zugriffsrechte. Einrichtung, Änderung, Vergessen und Verhalten auf mehreren Geräten im Detaildesign klären. |
| R28 | Erneutes Google-Verbinden und Offlineüben | Eine bei Bedarf nötige erneute Bestätigung über „Mit Google verbinden“ ist grundsätzlich akzeptabel, auch beim erneuten Öffnen oder nach Ablauf des Zugriffs. Mit bereits vorhandenen Vokabeln kann währenddessen offline weitergeübt werden. Ergebnisse lokal erhalten und nach erneuter Verbindung bei geöffneter App und Internet automatisch abgleichen. Diese Zustimmung ersetzt keine Prüfung des tatsächlichen Dialogkomforts auf den Zielgeräten. |
| R29 | Widersprüchliche Vokabeländerungen gemeinsam klären | Werden dieselben Vokabeln auf zwei Geräten widersprüchlich geändert, bleiben beide Fassungen erhalten. In der Erwachsenenansicht wird der Unterschied angezeigt und die richtige Fassung ausgewählt. Keine automatische inhaltliche Auswahl nach der Übertragungsreihenfolge. Übungsergebnisse beider Geräte bleiben erhalten und werden ohne doppelte Wertung zusammengeführt. |
| R30 | Vollständige Sicherungsdatei und Wiederherstellung | Im Erwachsenenbereich eine vollständige JSON-Sicherung herunterladen und bei Bedarf wieder einlesen können. Sie enthält Vokabeln, Lektionen, Zuordnungen, Lernprofile, Lernstände und Belohnungsfortschritt einschließlich Punkten und Avatar-Ausstattung. Vor einer Wiederherstellung Vorschau und ausdrückliche Bestätigung anbieten. Rücksetzung und vorherige separate Sicherung gemäß R33; kein stilles Überschreiben. |
| R31 | Allgemeine Lizenzentscheidung zurückgestellt | Für den privaten Einsatz weiterentwickeln und vorerst keine allgemeine Open-Source-Freigabe hinzufügen. Die allgemeine Lizenzentscheidung wurde bewusst verschoben; sie blockiert die beauftragte private Entwicklung nicht. Keine Änderung der Repository-Sichtbarkeit damit beauftragt. |
| R32 | Unterbrochene Runden fortsetzen | Eine laufende Runde auf dem jeweiligen Gerät speichern. Beim nächsten Öffnen kann das Kind diese Runde fortsetzen, etwa bei „6 von 10“, oder eine neue beginnen. Bereits gewertete Antworten und verdiente Antwortpunkte bleiben erhalten. Das bloße Unterbrechen oder Aufgeben erzeugt keinen Abschlussbonus. Die Fortsetzung derselben laufenden Runde auf einem anderen Gerät gehört nicht zum bestätigten Umfang; die Synchronisation der gewerteten Antworten bleibt erhalten. |
| R33 | Wiederherstellung setzt den gemeinsamen Datenbestand zurück | Vor der Wiederherstellung den aktuellen Stand automatisch separat sichern. Nach Vorschau und ausdrücklicher Bestätigung ersetzt der ausgewählte Sicherungsstand die aktiven Daten und wird über Google Drive an verbundene Geräte übertragen. Der vorherige Stand bleibt zurückholbar. Sicherungsstand und aktuelle Ergebnisse nicht einfach zusammenzählen. Technische Durchführung und Behandlung noch nicht übertragener Änderungen im Gesamtentwurf konkretisieren. |

R03–R11 stammen aus der ursprünglichen Produktbeschreibung. R12–R14 wurden in der anschließenden Technologie-/Kontenabstimmung konkretisiert. R01 und R16 wurden mit dem Dokumentationsauftrag ergänzt. Danach bestätigte der Nutzer die Definitionen in R09, den Ablauf in R17 und die Konkretisierung der Gamification in R11. Die weiteren Entscheidungen sind unten einzeln protokolliert.

## Besprochene technische Arbeitsbasis

Die folgenden Punkte bilden den Gesamtaufbau. Das ergänzende Detaildesign E01–E10 wurde am 16.09.2026 ausdrücklich mit Option A angenommen:

- PWA mit HTML, CSS und JavaScript; mehrere überschaubare Dateien statt einer erzwungenen einzelnen HTML-Datei.
- Lokales Speichern auf dem Gerät, voraussichtlich IndexedDB, und Offlineüben nach erfolgreicher Ersteinrichtung.
- JSON für strukturierte Austausch-/Sicherungsdaten; Inhalt und Lernfortschritt fachlich trennen.
- Schüler- und Erwachsenenansicht in derselben Anwendung.
- GitHub Pages als vorgeschlagener Hostingweg für den Programmcode.

Excel wurde als ursprüngliche Speicheridee genannt. Bestätigt sind das Kopieren und Einfügen von Tabellenzeilen gemäß R25 sowie vollständige JSON-Sicherungen mit Wiederherstellung gemäß R30. Ein direkter Excel-/CSV-Dateiimport gehört nicht zur gewählten ersten Version; ein Excel-/CSV-Export ist weiterhin nur eine mögliche Ergänzung. Markdown ist für Projektdokumentation vorgesehen, nicht als Laufzeitdatenbank.

## Bekannte Voraussetzungen für Gerätetests

Der Nutzer selbst besitzt weder iPhone noch iPad. Ein Freund, der den Trainer hauptsächlich verwenden möchte, besitzt beide Gerätetypen. Seine Geräte kommen für spätere Praxistests infrage; Modelle, Betriebssystemversionen, Zugang und zeitliche Verfügbarkeit sind noch nicht geklärt. Daraus folgt weder eine bereits zugesagte Testteilnahme noch eine bestandene Geräteabnahme. Mindestversionen später technisch begründet abstimmen.

## Vorgeschlagener Lernablauf

1. Lernprofil auswählen und Übungsmodus starten.
2. Deutsches Wort und Eingabefeld anzeigen.
3. Antwort über eine eindeutige Aktion prüfen.
4. Ergebnis mit Symbol und Text zeigen; bei Fehler die richtige Übersetzung lesbar darstellen.
5. Mit „Weiter“ fortfahren; die Antwort nicht mehrfach werten.
6. Am Ende eine kurze Zusammenfassung des Übens zeigen.

Die Schritte 1, 3 und 6 ergänzen den bestätigten Kernablauf. Die reguläre Rundengröße ist mit R18 festgelegt; bei erschöpfter Auswahl gilt R20. Bedienung über Enter und Abschlussansicht sind mit E02/E03 im Gesamtentwurf bestätigt.

Aus R18–R20 folgt für das Detaildesign: Zusätzlicher Wortschatz füllt nur die noch übrigen Aufgabenplätze. Auch dort pausierte Wörter bleiben pausiert. Sind insgesamt keine passenden weiteren Aufgaben vorhanden, ist nur der Abschluss möglich; keine Aufgaben oder Erfolge erfinden. Eine leere Auswahl am Start darf nicht als bereits erfolgreich absolvierte Runde erscheinen.

E02 ergänzt R23: Auch der vorzeitige Abschluss wegen erschöpfter Auswahl gemäß R20 erhält den Bonus, sofern mindestens eine Antwort gewertet wurde. Diese Ergänzung ist bestätigt. Unterbrechungen und Aufgeben sind mit R32 geregelt: Antworten und Antwortpunkte bleiben erhalten, kein Abschlussbonus allein dafür. Derselbe Antwortversuch oder Rundenabschluss darf nicht mehrfach belohnt werden; eine leere Auswahl erzeugt keinen Abschlussbonus. Diese Schutzregeln konkretisieren die einmalige Wertung und erlauben keine Abweichung von den bestätigten 10 beziehungsweise 20 Punkten.

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
| Q6c | 10 Punkte je richtiger Antwort, auch für später richtig beantwortete Fehlerwörter, plus 20 Punkte für eine abgeschlossene Runde. Keine Punktabzüge bei Fehlern. | 16.09.2026: Nutzer wählt Option A der Frage zur Punktevergabe. |
| Q6d | Automatische Freischaltungen durch Level-Meilensteine: Reiseabschnitte und festgelegte Avatar-Ausstattung; bereits freigeschaltete Ausstattung frei auswählbar. Abzeichen für Meilensteine, kein zusätzlicher Münzladen. | 16.09.2026: Nutzer wählt Option A der Frage zu Freischaltungen. |
| Q7a | Einzeleingabe plus Kopieren/Einfügen mehrerer Tabellenzeilen mit den Spalten Deutsch und Englisch. Zuordnung zu einer vorhandenen oder neu angelegten benannten Lektion; kein direkter Excel-/CSV-Dateiimport in der ersten Version. | 16.09.2026: Nutzer wählt Option A der Frage zur Vokabeleingabe. |
| Q7b | Erwachsene ordnen Lektionen einem oder mehreren Kindern zu. „Alle“, „Letzte“ und „Neue“ berücksichtigen jeweils nur die diesem Kind zugeordneten Lektionen. Lernstände, Punkte und Avatar pro Kind getrennt. | 16.09.2026: Nutzer wählt Option A der Frage zur Verfügbarkeit von Lektionen. |
| Q8 | Erwachsenenansicht über den Menüpunkt „Für Erwachsene“ und eine selbst festgelegte vierstellige PIN öffnen; Hürde gegen versehentliche Änderungen. | 16.09.2026: Nutzer wählt Option A der Frage zum Zugang zur Erwachsenenansicht. |
| Q9 | Der Nutzer hat keine eigenen Apple-Testgeräte. Sein Freund als künftiger Hauptnutzer besitzt iPhone und iPad. Konkrete Geräteangaben und Testverfügbarkeit bleiben offen. | 16.09.2026: ausdrückliche Nutzerangabe zu den Geräten des Freundes. |
| Q10 | Erneutes Google-Verbinden bei Bedarf grundsätzlich akzeptabel. Mit vorhandenen Vokabeln offline weiterüben und Änderungen nach erneuter Verbindung automatisch abgleichen. Tatsächliche Dialoghäufigkeit und Bedienbarkeit noch auf Zielgeräten prüfen. | 16.09.2026: Nutzer wählt Option A der Frage zum erneuten Verbinden. |
| Q11a | Bei widersprüchlichen Vokabeländerungen beide Fassungen aufbewahren und Erwachsene anhand der angezeigten Unterschiede die richtige auswählen lassen. Übungsergebnisse beider Geräte erhalten und ohne doppelte Wertung zusammenführen. | 16.09.2026: Nutzer wählt Option A der Frage zu widersprüchlichen Änderungen. |
| Q11b | Vollständige JSON-Sicherung im Erwachsenenbereich herunterladen und wieder einlesen; umfasst Wortschatz, Lektionen, Zuordnungen, Profile, Lernstände und Belohnungsfortschritt. Vor Wiederherstellung Vorschau und Bestätigung. | 16.09.2026: Nutzer wählt Option A der Frage zur zusätzlichen Sicherungsdatei. |
| Q12 | Allgemeine Lizenzentscheidung zunächst zurückstellen, für den privaten Einsatz weiterentwickeln und vorerst keine allgemeine Open-Source-Freigabe hinzufügen. | 16.09.2026: Nutzer wählt Option A der Frage zur Weiterverwendung des Programmcodes. |
| Q13 | Laufende Runde auf demselben Gerät speichern und beim nächsten Öffnen Fortsetzen oder eine neue Runde anbieten. Gewertete Antworten und Antwortpunkte erhalten; kein Abschlussbonus allein für Unterbrechen/Aufgeben. | 16.09.2026: Nutzer wählt Option A der Frage zu unterbrochenen Runden. |
| Q14 | Aktuellen Stand automatisch separat sichern und danach den aktiven Bestand mit Vorschau/Bestätigung auf den ausgewählten Sicherungsstand zurücksetzen; auch über Google Drive an verbundene Geräte übertragen. | 16.09.2026: Nutzer wählt Option A der Frage zur Wiederherstellung. |

## Bestätigter Gesamtentwurf und offene Nachweise

Die Einzelfragen Q1–Q14 sind beantwortet. Der [Gesamtentwurf](superpowers/specs/2026-09-16-vokabeltrainer-design.md) einschließlich E01–E10 wurde am 16.09.2026 durch Nutzerantwort A angenommen. Der [erste Implementierungsplan](superpowers/plans/2026-09-16-google-drive-probe.md) setzt die frühe Google-/iOS-Probe um. Tatsächliche Google-/Geräteprüfungen bleiben Prüfaufgaben.

Die Liste wird auf ausdrücklichen Wunsch des Nutzers Frage für Frage mit Optionen und Empfehlung abgearbeitet. Jede Antwort wird sofort festgehalten; neu erkannte Produktfragen werden ergänzt. Technische Detailentscheidungen sollen verständlich begründet werden, ohne den Nutzer unnötig mit Implementierungsdetails zu belasten. Nach vollständiger Klärung den konsolidierten Umfang dokumentieren, einen konkreten Implementierungsplan erstellen und mit der beauftragten Entwicklung beginnen. Reale technische Nachweise bleiben als Prüfaufgaben sichtbar und dürfen nicht durch bloße Zustimmung als bestanden gelten.

Das technische Speicher-/Konfliktmodell E07/E08/E10 ist mit der Gesamtbestätigung ebenfalls angenommen: stabile IDs, getrennte Inhalte/Ergebnisse, Reihenfolge paralleler Lernereignisse, Datei-Aufteilung, Wiederholbarkeit von Übertragungen und Erkennen echter Bearbeitungskonflikte. Die [synthetische Verbindungsprobe](reports/2026-09-17-google-drive-probe.md) weist lokale Modell-, Speicher- und Browsergrundlagen mit simulierter Google-Grenze nach. Reales Drive, zwei Geräte und das vollständige Produktprotokoll sind weiterhin nachzuweisen.

## Einrichtung: bestätigter Ausgangsstand

17.09.2026, Nutzerantwort A: Noch kein Google-Cloud-Projekt und keine öffentliche OAuth-Client-ID für den Vokabeltrainer vorhanden. Die Einrichtung wird gemeinsam Schritt für Schritt angeleitet. Projektanlage, Anmeldung und reale Tests sind dadurch noch nicht als durchgeführt bestätigt. Kostenrahmen und Kontenmodell bleiben unverändert.

## Nicht beauftragt

- Native App-Store-App, App-Store-Veröffentlichung oder kostenpflichtiger Backenddienst.
- Getrennte Google-Konten für jedes Kind als aktuelles Kontenmodell.
- KI-generierte Vokabeln, automatische Übersetzung oder ein kostenpflichtiger KI-Dienst.
- Ranglisten zwischen Kindern, Werbung, Käufe oder soziale Funktionen.
- Zusätzliche Lernrichtungen, Aussprachebewertung oder weitere Sprachen.

Diese Punkte dürfen später besprochen werden; sie sind nicht Bestandteil des bisherigen Auftrags.
