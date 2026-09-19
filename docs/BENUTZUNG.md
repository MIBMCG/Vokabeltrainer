# Vokabeltrainer benutzen

**Entwicklungsstand:** Diese Anleitung beschreibt die implementierte und automatisiert geprüfte Version einschließlich des vorbereiteten Google-Zugangs. Der [Abschlussbericht der Version 1](reports/2026-09-18-vokabeltrainer-v1.md) nennt die bisherigen Nachweise und Grenzen. Reale Produktprüfungen mit Google Drive auf zwei physischen Geräten sowie iPhone/iPad folgen getrennt.

## Einrichten

Erwachsene legen den gemeinsamen Datenbestand und auf jedem Gerät eine vierstellige PIN an. Die PIN schützt vor versehentlichen Änderungen; sie ist keine getrennte Benutzeranmeldung. Anschließend ein oder mehrere Kinderprofile mit Anzeigenamen anlegen. Vollständige Namen und Geburtstage sind nicht nötig.

Eine Lektion erhält einen Namen, zum Beispiel „Unit 1“, und wird den gewünschten Kindern zugeordnet. Vokabeln bestehen aus deutschem Wort und mindestens einer englischen Lösung. Ein Hinweis hilft bei Mehrdeutigkeiten, etwa „Bank — Sitzplatz“. Mehrere Lösungen wie `bicycle` und `bike` sind möglich.

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

Eine Runde enthält normalerweise zehn Antworten; zwanzig oder dreißig sind ebenfalls möglich. Das deutsche Wort lesen, die englische Übersetzung eingeben und „Prüfen“ wählen. Enter funktioniert ebenfalls. Die Rückmeldung zeigt die richtige Schreibweise. Erst mit „Weiter“ oder einem weiteren bewussten Enter geht es zur nächsten Aufgabe.

Leere Eingaben zählen nicht. Groß-/Kleinschreibung und Leerzeichen am Anfang oder Ende werden ignoriert. Echte Schreibfehler zählen als falsch. Es gibt keinen Zeitdruck und keine Punktabzüge.

Fehlerwörter werden nach zwei anderen Antworten erneut angeboten. Standardmäßig pausieren drei richtige Antworten in Folge das Wort für den Rest der Runde; die nächsten Wiederholungen folgen standardmäßig nach einem, drei, sieben und danach jeweils vierzehn Tagen. Eltern können diese Standardwerte für jedes Kind unter „Lernregeln“ ändern. Die Serie bleibt über Runden hinweg erhalten. Eine falsche Antwort startet den Aufbau neu.

Falls die passende Auswahl vorzeitig erschöpft ist, kann das Kind beenden oder mit weiterem zugeordnetem Wortschatz fortsetzen. Die gewählte Rundengröße wird dabei nicht erhöht. Eine begonnene Runde lässt sich auf demselben Gerät fortsetzen, auch nach dem Schließen der App.

## Inselreise und Avatar

Jede richtige Antwort gibt zehn Punkte. Eine volle Runde oder eine nach mindestens einer Antwort erschöpfte Runde bringt zusätzlich zwanzig Punkte. Für bloßes Öffnen, Unterbrechen oder Aufgeben gibt es keinen Abschlussbonus.

Alle zweihundert Punkte steigt das Level. Die Reise führt über fünfzehn Etappen: zunächst am Strand, ab tausend Punkten durch den Wald, ab zweitausend in die Berge. Bei dreitausend Punkten ist die Reise abgeschlossen; weiterüben und weitere Level sind trotzdem möglich.

Im Avatarbereich stehen vier Hauttöne und sechs Kleidungsfarben zur Wahl. Mit höheren Leveln werden Kappe, Rucksack, Sonnenhut, Fernglas, Bergmütze und Kompass freigeschaltet. Sechs Abzeichen würdigen Lernmeilensteine. Es gibt keinen Münzladen und keine Käufe. Animationen können abgeschaltet werden.

## Lernstand und Änderungen

Die Erwachsenenansicht zeigt je Kind und Wort Versuche, richtige und falsche Antworten, aktuelle Serie, letzte Übung und Fälligkeit. Punkte und Antworten anderer Kinder bleiben getrennt.

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

1. In der Erwachsenenansicht **Abgleich** und danach **Mit Google verbinden** wählen.
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

Unter „Sicherung“ eine vollständige JSON-Datei herunterladen. Sie enthält den fachlichen Datenbestand einschließlich noch nicht übertragener Ergebnisse. Google-Zugriff, PIN und persönliche Anmeldesitzungen gehören nicht hinein. „Download gestartet“ bedeutet, dass der Browser die Datei entgegengenommen hat; den tatsächlichen Ablageort im Browser prüfen.

Vor einer Wiederherstellung zeigt die App die Unterschiede und verlangt eine ausdrückliche Bestätigung. Sie legt vorher eine separate Sicherheitskopie an. Bei verbundenem Drive-Bestand sind dafür Internet und gültiger Zugriff erforderlich; die vorherige Sicherung wird auch in Drive geprüft. Scheitert die Sicherung, wird nicht zurückgesetzt.

Eine Wiederherstellung setzt den gemeinsamen Fortschritt auf den gewählten Sicherungsstand. Alte laufende Runden werden beendet, ohne zusätzlichen Bonus. Später eintreffende Antworten eines bislang offline gebliebenen Geräts gehen nicht verloren: Sie bleiben separat sichtbar. Erwachsene entscheiden, welche übernommen werden. Nicht gewählte Ereignisse bleiben sicherbar.

Gleichzeitige Wiederherstellungen auf zwei Geräten erfordern eine bewusste Auswahl. Die App entscheidet das nicht nach der Geräteuhr. Vorhandene Sicherheitskopien bleiben herunterladbar.

## Geräteprüfung

Die [Geräte-Prüfliste](GERAETE-ABNAHME.md) führt durch die spätere Abnahme. Safari und eine zum Home-Bildschirm hinzugefügte App werden auf echtem iPhone und iPad getrennt geprüft. Bildschirmtastatur, Offline-Neustart, erneute Google-Anmeldung und Abgleich zwischen den Geräten gehören dazu. Automatisierte Browserprüfungen ersetzen diese Abnahme nicht. Eine öffentliche App-Adresse ist erst nach abgestimmter Bereitstellung verfügbar.
