# Vokabeltrainer benutzen

**Stand vom 27.09.2026:** Die Anleitung beschreibt Lernen, Verwaltung,
Google-Abgleich, Sicherungen sowie „Meine Figur“, „Entwicklung“ und „Shop“.
Den aktuellen Prüfstand und offene Arbeiten dokumentieren der
[Arbeitsstand](../ARBEITSSTAND.md), der
[Abschlussbericht](reports/2026-09-27-persistent-purchases-final.md) und die
[Übergabe](handoffs/2026-09-27-persistent-purchases-abschluss.md).
Reale Produktprüfungen mit Google Drive auf zwei physischen Geräten sowie
iPhone/iPad folgen getrennt.

## Lokal starten

Auf dem Entwicklungszweig `codex/vokabeltrainer-v1` im Projektordner `npm start` ausführen (Node.js ab 22.8). Danach `http://localhost:4173/trainer/` öffnen. Die Adresse ohne `/trainer/` führt zur technischen Verbindungsprobe. Einrichtung auf einem neuen Rechner: [README](../README.md#repository-auf-einem-neuen-system-öffnen).

## Einrichten

Erwachsene legen den gemeinsamen Datenbestand und auf jedem Gerät eine vierstellige PIN an. Die PIN schützt vor versehentlichen Änderungen; sie ist keine getrennte Benutzeranmeldung. Anschließend ein oder mehrere Kinderprofile mit Anzeigenamen anlegen. Vollständige Namen und Geburtstage sind nicht nötig.

Eine Lektion erhält einen Namen, zum Beispiel „Unit 1“, und wird den gewünschten Kindern zugeordnet. Vokabeln bestehen aus deutschem Wort und mindestens einer englischen Lösung. Ein Hinweis hilft bei Mehrdeutigkeiten, etwa „Bank — Sitzplatz“. Mehrere Lösungen wie `bicycle` und `bike` sind möglich.

Unter **Für Erwachsene** stehen vier Bereiche bereit: **Vokabeln**, **Lernstand**, **Lernregeln** und **Einstellungen**. Vokabeln lassen sich nach Kind und Lektion filtern, suchen und zwischen aktiven und archivierten Einträgen umschalten. Neue Wörter, Lektionen und Tabellenimport öffnen gezielte Formulare. Kinder, PIN, Google-Abgleich und Sicherung liegen unter **Einstellungen**. Ungespeicherte Wort-/Importentwürfe werden beim Verlassen ausdrücklich behandelt.

## Wörter aus einer Tabelle übernehmen

1. In Excel oder einer anderen Tabelle die Spalten Deutsch und Englisch markieren; optional folgt eine dritte Spalte mit dem Bedeutungshinweis.
2. Zeilen kopieren und in der Erwachsenenansicht bei der passenden Lektion einfügen. Mehrere englische Lösungen innerhalb einer Zelle mit `|` trennen.
3. Die Vorschau prüfen und bei Bedarf bearbeiten. Fehlende Angaben oder zusätzliche Spalten zuerst korrigieren.
4. Bei möglichen Dopplungen bewusst entscheiden. Gleiche deutsche Wörter mit unterschiedlichen Bedeutungen dürfen getrennte Einträge sein.
5. Erst die geprüften Zeilen übernehmen.

Ein direkter Excel-Dateiimport gehört nicht zur ersten Version. Wörter, Lektionen und Kinderprofile lassen sich archivieren und wieder aktivieren. Die bisherige Lernhistorie bleibt dabei erhalten.

## Üben

Nach der Auswahl eines Kinderprofils stehen drei Modi bereit:

| Modus | Auswahl |
| --- | --- |
| Alle Vokabeln | Alle aktiven Wörter aus zugeordneten Lektionen |
| Letzte Vokabeln | Die zuletzt angelegte zugeordnete Lektion |
| Neue Vokabeln | Wörter, die dieses Kind noch nie geübt hat |

Die Auswahlkarten erklären jeden Modus und zeigen den aktuell verfügbaren Wortumfang. Eine leere Auswahl erklärt ihren Grund, etwa fehlende Zuordnung oder derzeit pausierte Wörter. Modus wählen, zehn, zwanzig oder dreißig Antworten auswählen und **Runde starten** drücken. Das deutsche Wort lesen, die englische Übersetzung eingeben und „Prüfen“ wählen. Enter funktioniert ebenfalls. Die Rückmeldung zeigt die richtige Schreibweise. Erst mit „Weiter“ oder einem weiteren bewussten Enter geht es zur nächsten Aufgabe.

Leere Eingaben zählen nicht. Groß-/Kleinschreibung und Leerzeichen am Anfang oder Ende werden ignoriert. Echte Schreibfehler zählen als falsch. Es gibt keinen Zeitdruck und keine Punktabzüge.

Fehlerwörter werden nach zwei anderen Antworten erneut angeboten. Standardmäßig pausieren drei richtige Antworten in Folge das Wort für den Rest der Runde; die nächsten Wiederholungen folgen standardmäßig nach einem, drei, sieben und danach jeweils vierzehn Tagen. Eltern können diese Standardwerte für jedes Kind unter „Lernregeln“ ändern. Die Serie bleibt über Runden hinweg erhalten. Eine falsche Antwort startet den Aufbau neu.

Falls die passende Auswahl vorzeitig erschöpft ist, kann das Kind beenden oder mit weiterem zugeordnetem Wortschatz fortsetzen. Die gewählte Rundengröße wird dabei nicht erhöht. Eine begonnene Runde lässt sich auf demselben Gerät fortsetzen, auch nach dem Schließen der App.

## Inselreise und Avatar

Jede richtige Antwort gibt zehn Punkte. Eine volle Runde oder eine nach mindestens einer Antwort erschöpfte Runde bringt zusätzlich zwanzig Punkte. Für bloßes Öffnen, Unterbrechen oder Aufgeben gibt es keinen Abschlussbonus.

Alle zweihundert Punkte steigt das Level. Die Reise führt über fünfzehn Etappen: zunächst am Strand, ab tausend Punkten durch den Wald, ab zweitausend in die Berge. Bei dreitausend Punkten ist die Reise abgeschlossen; weiterüben und weitere Level sind trotzdem möglich.

Der bisherige Avatar bleibt vollständig erhalten. Unter den neuen Registern
öffnet **Klassischen Avatar gestalten** den aufklappbaren Bereich mit vier
Hauttönen, sechs Kleidungsfarben, freigeschalteter Ausrüstung und der
Einstellung für kurze Bewegungen. Käufe verändern diese Auswahl nicht und
ziehen keine Lernpunkte oder Level ab.

### Figuren und Käufe einmalig vorbereiten

Nur Erwachsene dürfen den gemeinsamen Lernbereich auf das Kaufprotokoll
aktualisieren:

1. Zuerst unter **Für Erwachsene → Einstellungen → Abgleich** denselben
   gemeinsamen Lernbereich mit Google Drive verbinden.
2. Im Abschnitt **Figuren und Käufe** auf
   **Daten für Figuren und Käufe aktualisieren** drücken. Dieser erste Schritt
   zeigt nur eine Vorschau und verändert noch keine Cloudobjekte.
3. Lernbereich, Kinder, Lernpunkte und Level prüfen. Die Vorschau erinnert
   daran, dass andere Geräte vor dem nächsten gemeinsamen Abgleich ebenfalls
   das Appupdate benötigen.
4. Erst mit **Aktualisierung jetzt durchführen** die Aktualisierung bestätigen.
   Hat sich der Datenstand seit der Vorschau geändert, eine neue Vorschau öffnen
   und erneut prüfen.

Bleibt der Ausgang wegen Netzunterbrechung unbekannt, zeigt die App
**Datenaktualisierung fortsetzen**. Diesen Weg verwenden, statt eine zweite
Aktualisierung zu beginnen. Die App liest den gespeicherten Auftrag zuerst nach
und setzt ihn mit denselben Daten fort. Die klassische Figur und das Lernen
bleiben währenddessen verfügbar.

### Meine Figur, Entwicklung und Shop

Nach bestätigter Aktualisierung zuerst das Kinderprofil wählen und in der
Hauptnavigation **Mein Avatar** öffnen. Oben im Avatarbereich stehen drei
Register; darunter lässt sich der klassische Avatar mit **Klassischen Avatar
gestalten** aufklappen:

- **Meine Figur** zeigt die gewählte gekaufte Figur groß sowie „Klassisch“ und
  bereits freigeschaltete Grundfiguren. Mit **Grundform auswählen** wird die
  Grundform der aktuellen Reihe aktiv.
- **Entwicklung** zeigt die vier Stufen der aktuell gewählten Figur. Stufe 1 ist
  die Grundform; weitere Stufen kosten nacheinander 200, 400 und 800 Punkte.
  Eine gehörende Stufe wird mit **Diese Form auswählen** aktiv. Eine spätere
  Stufe wird erst angeboten, wenn die vorherige gehört.
- **Shop** zeigt weitere Grundfiguren und ihren Preis. Bereits gekaufte Figuren
  sind als **Ausgewählt** oder auswählbar gekennzeichnet.

Oben stehen zwei getrennte Werte: **Verfügbare Punkte** können ausgegeben
werden; **Lernpunkte** bestimmen weiterhin Level und Reise. Ausgeben verändert
das Level nicht. Besitz, Guthaben und Figurenauswahl gelten jeweils nur für das
ausgewählte Kinderprofil.

Nur Formen mit einem tatsächlich vorhandenen Bild können gekauft werden.
Fehlende Motive bleiben sichtbar als **Bild folgt** und sind nicht kaufbar.
Neben den vorhandenen Grundfiguren sind die vier bestätigten Drachenbilder
als erste vollständige Entwicklungsreihe eingebunden. Die übrigen 72 Motive,
kleinere responsive Bildvarianten und die
vollständige Galeriegestaltung gehören zum Folgeumfang. Dazu zählen ein weiter
ausgebauter Wechsel zwischen Klassisch und Entwicklung und zusätzliche
Fortschrittsdarstellung; aus dem aktuellen Paket keine vollständige
EV05-Galerie ableiten.

### Kaufen und fortsetzen

Neue Käufe benötigen Internet und einen erfolgreichen Abgleich. Je nach Stand
zeigt die Karte:

- **Noch … Punkte sammeln**, wenn das verfügbare Guthaben nicht reicht;
- **Vorherige Stufe fehlt**, wenn die Entwicklungsreihenfolge nicht erfüllt ist;
- **Offline – Kauf nicht möglich**, wenn keine Verbindung besteht;
- **Bild noch nicht verfügbar**, solange das Motiv fehlt;
- **Kauf fortsetzen**, wenn ein bereits gespeicherter Kauf noch geprüft wird.

Bei **Für … Punkte freischalten** öffnet sich zuerst **Kauf prüfen**. Dort stehen
Preis und danach verbleibendes Guthaben. Erst
**Kauf verbindlich bestätigen** startet den Kauf; **Abbrechen** verändert
nichts. Nach erfolgreicher Bestätigung gehört die Figur oder Form dem Kind,
wird aber erst durch eine eigene Auswahl aktiv.

Bei Netzfehler oder unbekanntem Ausgang nicht erneut von vorn kaufen. Die App
zeigt, dass der Kauf geprüft wird, und bietet **Kauf fortsetzen** für genau den
gespeicherten Auftrag an. Vorhandener bestätigter Besitz bleibt offline
auswählbar; neue Käufe sind offline gesperrt.

## Lernstand und Änderungen

Unter **Lernstand** wählen Erwachsene ein Kind sowie 14 oder 30 Tage. Die Ansicht zeigt Antworten, richtige Antworten und Trefferquote, die vier aktuellen Wortgruppen „Noch neu“, „In Übung“, „Zur Auffrischung“ und „Aus dem Üben genommen“ sowie die jetzt verfügbaren Wörter. Das Tagesdiagramm nennt richtige und falsche Antworten; dieselben Werte stehen zusätzlich in einer aufklappbaren Tabelle. Die aktuelle Wortverteilung zählt nur aktive, zugeordnete Wörter. Die Zeitraumwerte behalten dagegen auch frühere Antworten auf inzwischen archivierte oder nicht mehr zugeordnete Wörter.

Die aufklappbaren Wortdetails erhalten die bisherige Übersicht: Versuche, richtige und falsche Antworten, aktuelle Serie nach den geltenden Lernregeln, Status oder Fälligkeit und letzte Übung. Ausgenommene Wörter bleiben einzeln sichtbar; **Wieder üben** steht weiterhin unter **Vokabeln** bereit. Punkte und Antworten anderer Kinder bleiben getrennt.

Eine inhaltliche Änderung von Wort, Hinweis oder erlaubten Lösungen beginnt eine neue Übungsserie für dieses Wort. Die Oberfläche kündigt das an; bisherige Antworten und Punkte bleiben erhalten. Eine reine Änderung der Zuordnung oder Groß-/Kleinschreibung löscht den Lernstand nicht.

Unter **Lernregeln** wählen Erwachsene zuerst ein Kind. Für jedes Kind lassen sich getrennt festlegen:

- nach wie vielen richtigen Antworten ein Wort seltener kommt (2 bis 10, Standard 3),
- ob gelernte Wörter weiter aufgefrischt oder ab einer wählbaren Serie nicht mehr automatisch abgefragt werden,
- die vier Wiederholungsabstände in Tagen (Standard 1, 3, 7 und 14).

**Auswirkung prüfen** zeigt die gemeinsame Vorschau der Lernplanung. Änderungen werden erst mit **Lernregeln speichern** übernommen und gelten ab der nächsten neuen Runde; eine bereits begonnene Runde behält ihre bisherigen Regeln. **Standardwerte einsetzen** füllt das Formular nur aus und speichert noch nichts. Falls zwischenzeitlich auf einem anderen Gerät Regeln geändert wurden, bleibt der eigene Entwurf stehen und muss nach bewusstem Neuladen erneut geprüft werden.

Wörter, die für das ausgewählte Kind nicht mehr automatisch abgefragt werden, bleiben unter **Vokabeln** sichtbar. **Wieder üben** beginnt nur deren Wiederholungsplanung für dieses Kind neu. Bisherige Antworten, Punkte und Abzeichen bleiben erhalten.

Die Erwachsenenansicht sperrt beim Verlassen, Neuladen und Wechsel in den Hintergrund. „PIN vergessen“ setzt nur die lokale PIN zurück: den Bestätigungstext „PIN zurücksetzen“ ausschreiben und die neue PIN zweimal eingeben. Lernstände werden dabei nicht gelöscht.

## Google Drive und Offlinebetrieb

Für beide Geräte denselben von Erwachsenen eingerichteten Google-Zugang verwenden. Familien müssen im normalen Ablauf keine technische Client-ID eintragen:

1. In der Erwachsenenansicht **Einstellungen** öffnen, dann im Abschnitt **Abgleich** auf **Mit Google verbinden** klicken.
2. Auf dem ersten Gerät **Neuen Lernbereich anlegen** wählen.
3. Auf dem zweiten Gerät **Vorhandenen Lernbereich verwenden**, den richtigen Eintrag prüfen und bewusst bestätigen.

Die Google-Anmeldung allein erstellt oder verbindet noch keinen Lernbereich. Gleichnamige Ordner sind nicht automatisch derselbe Bestand. Wird der Anmeldedialog abgebrochen, bleiben die lokalen Daten und das Offlineüben erhalten.

Die [Google-Einrichtung](GOOGLE-DRIVE-EINRICHTUNG.md) trennt diesen Familienablauf von der einmaligen Vorbereitung durch Projektverantwortliche. Technische Angaben und eine abweichende Betreiber-Client-ID liegen nur unter **Erweiterte Einstellungen**. Eine bestehende Verbindung wird bei einer abweichenden alten Browserkonfiguration nicht still umgestellt. Die Probe ist ein separater Testbestand und wird nicht automatisch in den Trainer übernommen. Es ist kein zusätzliches kostenpflichtiges Cloudabo vorgesehen.

Die Anzeige unterscheidet:

| Anzeige | Bedeutung |
| --- | --- |
| Auf diesem Gerät gespeichert | Lokal vorhanden; noch kein bestätigter Cloudabgleich |
| Abgleich ausstehend | Änderungen warten auf Übertragung |
| Mit Google verbinden | Eine bewusste erneute Anmeldung ist nötig |
| Abgeglichen | Übertragung und Empfang wurden bestätigt |
| Abgleich fehlgeschlagen | Daten bleiben lokal; Ursache prüfen und erneut versuchen |

Bei geöffneter App und gültiger Verbindung geschieht der Abgleich automatisch. Ohne Internet kann mit vorhandenen Wörtern weitergeübt werden. Beim nächsten Verbinden werden ausstehende Antworten übertragen. Eine geschlossene App garantiert keinen Hintergrundabgleich. Für den ersten Offline-Start müssen die Programmdateien vorher erfolgreich online geladen worden sein.

Widersprüchliche Änderungen bleiben in der Erwachsenenansicht sichtbar. Die passende Wortfassung bewusst wählen; ungeklärte Wörter werden bis dahin nicht neu abgefragt. Andere Wörter bleiben nutzbar.

## Sichern und wiederherstellen

Unter „Sicherung“ eine vollständige JSON-Datei herunterladen. Sie enthält den fachlichen Datenbestand einschließlich noch nicht übertragener Ergebnisse. Bei einem aktivierten Kaufbestand enthält sie zusätzlich die vollständig geprüfte Herkunft von Guthaben, Besitz und Figurenauswahl. Google-Zugriff, PIN, persönliche Anmeldesitzungen, offene Kaufaufträge und technische Pointerdaten gehören nicht hinein. „Download gestartet“ bedeutet, dass der Browser die Datei entgegengenommen hat; den tatsächlichen Ablageort im Browser prüfen.

Vor einer Wiederherstellung zeigt die App die Unterschiede und verlangt eine ausdrückliche Bestätigung. Für eine aktuelle Sicherung nennt die Vorschau zusätzlich Änderungen an verfügbaren Punkten, Anzahl der Käufe und Figurenauswahl. Eine ältere Sicherung ohne bestätigte Kaufhistorie wird ausdrücklich so gekennzeichnet. Die App legt vorher eine separate Sicherheitskopie an. Bei verbundenem Drive-Bestand sind dafür Internet und gültiger Zugriff erforderlich; die vorherige Sicherung wird auch in Drive geprüft. Scheitert die Sicherung, wird nicht zurückgesetzt.

Eine Wiederherstellung setzt den gemeinsamen Fortschritt auf den gewählten Sicherungsstand. Alte laufende Runden werden beendet, ohne zusätzlichen Bonus. Später eintreffende Antworten eines bislang offline gebliebenen Geräts gehen nicht verloren: Sie bleiben separat sichtbar. Erwachsene entscheiden, welche übernommen werden. Nicht gewählte Ereignisse bleiben sicherbar.

Gleichzeitige Wiederherstellungen auf zwei Geräten erfordern eine bewusste Auswahl. Die App entscheidet das nicht nach der Geräteuhr. Vorhandene Sicherheitskopien bleiben herunterladbar.

## Geräteprüfung

Die [Geräte-Prüfliste](GERAETE-ABNAHME.md) führt durch die spätere Abnahme. Safari und eine zum Home-Bildschirm hinzugefügte App werden auf echtem iPhone und iPad getrennt geprüft. Bildschirmtastatur, Offline-Neustart, erneute Google-Anmeldung und Abgleich zwischen den Geräten gehören dazu. Automatisierte Browserprüfungen ersetzen diese Abnahme nicht. Eine öffentliche App-Adresse ist erst nach abgestimmter Bereitstellung verfügbar.
