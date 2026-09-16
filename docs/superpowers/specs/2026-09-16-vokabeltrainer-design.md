# Vokabeltrainer: Gesamtentwurf für die erste Version

Stand: 16.09.2026. **Gesamtentwurf einschließlich E01–E10 vom Nutzer mit Option A bestätigt.** Implementierungs- und Prüfstatus stehen in [ARBEITSSTAND.md](../../../ARBEITSSTAND.md).

Die [Anforderungen R01–R33](../../ANFORDERUNGEN.md) sowie die Ergänzungen E01–E10 sind bestätigt. Die Einzelfragen Q1–Q14 sind beantwortet. Die nachfolgenden ursprünglichen Formulierungen „Vorschlag“ und „empfohlen“ beschreiben den am 16.09.2026 insgesamt angenommenen Entwurf. Die Umsetzung einschließlich früher Google-/iOS-Probe ist beauftragt; eine Zustimmung ersetzt keine technische Prüfung.

## 1. Produkt und Grenzen

Ein Deutsch-Englisch-Vokabeltrainer für 10–13-Jährige, Klassen 4–7, mit Schwerpunkt iPhone und iPad. Eine installierbare Web-App bietet Üben, Inselreise und Erwachsenenbereich. Lernstände gehören zu einzelnen Kinderprofilen; ein von Erwachsenen eingerichteter gemeinsamer Google-Zugang verbindet die Geräte desselben privaten Datenbestands. Daraus folgt keine gemeinsame Anmeldung zwischen dem Projektentwickler und allen Nutzern.

Bestätigt sind drei Auswahlmodi, adaptive Wiederholung, Runden mit 10/20/30 Antworten, Punkte, Level, Abzeichen, ein einfacher Avatar, Lektionen mit mehreren richtigen Lösungen, gezielte Zuordnung zu Kindern, vierstellige Erwachsenen-PIN, Google-Drive-Abgleich, Offlineüben und vollständige JSON-Sicherungen mit Wiederherstellung. Eine unterbrochene Runde bleibt auf ihrem Gerät fortsetzbar.

Keine native App-Store-Veröffentlichung, zusätzlichen kostenpflichtigen Cloudabos, Ranglisten, Käufe, KI-Übersetzung, Ausspracheprüfung oder weitere Lernrichtungen. Kein direkter Excel-/CSV-Dateiimport; Tabellenzeilen werden eingefügt. Die allgemeine Lizenzentscheidung bleibt zurückgestellt. Es gibt noch kein eingerichtetes Hosting, Google-Projekt oder nachgewiesenes Produktverhalten.

## 2. Neue Konkretisierungen im Überblick

| ID | Vorschlag | Praktische Bedeutung |
| --- | --- | --- |
| E01 | HTML/CSS/JavaScript in Modulen, IndexedDB und Service Worker; reine Lernlogik getrennt von Oberfläche und Drive | Kleine, nachvollziehbare Bausteine; kein zusätzlicher App-Server |
| E02 | Auswahl zu Rundenbeginn festhalten, Fälligkeiten und Fehlerabstand respektieren; 20 Abschluss-Punkte auch bei ausgeschöpfter Auswahl nach mindestens einer Antwort | Kleine Wortlisten bleiben nutzbar; keine Belohnung leerer oder bloß aufgegebener Runden |
| E03 | Enter zum Prüfen und danach zum Weitergehen; hilfreiche Textkorrektur, behutsame Animationen, keine Töne in Version 1 | Klarer Ablauf mit Bildschirmtastatur und ohne Zeitdruck |
| E04 | Drei Inseln mit zusammen 15 Etappen, je 200 Punkte ein Level; sechs freischaltbare Zubehörteile und sechs Abzeichen | Ein begrenzter, vollständig umsetzbarer erster Spielumfang |
| E05 | Tabellen-Vorschau, Archivieren statt endgültigem Löschen, Lernhistorie erhalten; bei inhaltlich geänderter Vokabel neue Übungsserie | Erwachsene können Material korrigieren, ohne alte Ergebnisse zu verlieren |
| E06 | PIN je Gerät, beim Verlassen des Erwachsenenbereichs wieder sperren; bewusstes Zurücksetzen ohne Datenlöschung | Eine einfache Bedienhürde, keine Kontentrennung |
| E07 | Ungeklärte Vokabelkonflikte aus neuen Aufgaben ausnehmen; übrige Wörter weiterüben | Eine unklare Lösung wird nicht zufällig bewertet |
| E08 | Gemeinsame Wiederherstellung online, mit bestätigter separater Drive-Sicherung; späte Offlineänderungen separat erhalten und sichtbar zur Entscheidung vorlegen | Ein alter Sicherungsstand überschreibt nicht unbemerkt noch unbekannte Antworten |
| E09 | Geräteprüfung in Safari und als Home-Bildschirm-App; Google-Probe früh vor umfangreicher Oberfläche | Die entscheidenden iOS-Annahmen werden praktisch geprüft |
| E10 | Unveränderliche Änderungsdateien mit eindeutigen IDs; daraus lokal Lernstand berechnen | Gleichzeitige Nutzung und erneute Übertragung zählen Ergebnisse nicht doppelt |

## 3. Oberfläche und tägliche Nutzung — E03/E04

### Einstieg und Navigation

Nach der Einrichtung erscheint die Profilauswahl mit Anzeigenamen und Avataren. Ein echtes Geburtsdatum oder vollständiger Name ist nicht erforderlich. Für das ausgewählte Kind gibt es die Bereiche „Üben“, „Inselreise“ und „Mein Avatar“. „Für Erwachsene“ ist ein eigener Menüpunkt mit PIN-Abfrage.

„Üben“ zeigt drei klar beschriftete Moduskarten und die Rundengröße: 10 ist vorausgewählt, 20 und 30 sind Alternativen. Eine gespeicherte Runde bietet „Fortsetzen“ und „Neue Runde“. Der Verbindungsstatus ist klein, aber lesbar: „Auf diesem Gerät gespeichert“, „Abgleich ausstehend“, „Mit Google verbinden“, „Abgeglichen“ oder „Abgleich fehlgeschlagen“. Ein fehlender Google-Zugriff blockiert das Üben mit bereits vorhandenen Wörtern nicht.

### Übungskarte

Großes deutsches Wort, gegebenenfalls ein von Erwachsenen eingetragener Bedeutungshinweis, englisches Eingabefeld, Fortschritt „6 von 10“ und eine Hauptaktion. Das Wort bleibt bis „Weiter“ sichtbar. „Prüfen“ und Enter lösen dieselbe Wertung aus; anschließend werden Eingabe und Wertung gesperrt. Erst ein weiterer bewusster Tastendruck oder „Weiter“ öffnet die nächste Aufgabe. Gedrückthalten, Doppelklick oder Neuladen darf keine zweite Wertung erzeugen.

Leere Eingabe erhält eine freundliche Eingabeaufforderung und zählt nicht als Antwort. Es gibt in Version 1 keine Überspringen-, Tipp- oder Timer-Funktion. Nach einem Fehler steht „Noch nicht ganz“ mit der erwarteten Schreibweise; die eigene Eingabe bleibt zum Vergleichen sichtbar. Bei mehreren zulässigen Lösungen werden diese gezeigt. Richtige Antworten zeigen ebenfalls die hinterlegte Schreibweise. Kein automatisches Vorspringen und keine Pflicht, eine angezeigte Lösung sofort abzuschreiben.

Groß-/Kleinschreibung und äußere Leerzeichen werden wie beschlossen ignoriert. Zusätzlich werden Unicode-Schreibformen mit NFC vereinheitlicht und typografische Apostrophe wie in „don’t“ dem einfachen Apostroph gleichgesetzt. Innere Leerzeichen, Buchstaben, Bindestriche und andere Satzzeichen werden nicht pauschal entfernt. Die Vorlage zeigt weiterhin die von Erwachsenen hinterlegte Schreibweise.

Autokorrektur, Autovervollständigung, automatische Großschreibung und Rechtschreibmarkierungen soweit vom Browser erlaubt abschalten; `lang="en"` am Eingabefeld setzen. Die Wirkung auf echten iOS-Tastaturen prüfen. Eingabe, Rückmeldung und „Weiter“ müssen auch mit geöffneter Tastatur erreichbar bleiben.

### Gestaltung

Helle, ruhige Inselwelt mit sandfarbenem Grund, dunkler gut lesbarer Schrift und Türkis/Grün als Akzenten. Klare Flächen, große Touch-Ziele, mindestens 16 px Eingabeschrift und ungefähr 44 px hohe Hauptbedienelemente als Gestaltungsziele. Richtig/Falsch immer mit Text und Symbol, nicht allein mit Farbe. Vergrößerte Schrift, Hoch-/Querformat, Fokusführung und Screenreader berücksichtigen. Kurze Rückmeldungsanimationen respektieren reduzierte Bewegung; ein Schalter kann sie abschalten. Keine Geräusche oder Musik in der ersten Version.

Die Reise erscheint auf dem schmalen Bildschirm als senkrechter Weg, auf größeren Bildschirmen mit mehr Landschaft daneben. Während einer Antwort bleibt die Übungskarte im Mittelpunkt. Dies ist ein Gestaltungskonzept, noch kein abgenommener visueller Prototyp.

## 4. Lernlogik und Runden — E02/E03

### Auswahlmengen

Alle Modi betrachten nur aktive, dem Kind zugeordnete Lektionen und aktive Vokabeln ohne ungelösten Inhaltskonflikt. „Alle“ enthält diesen ganzen Wortschatz. „Letzte“ ist die unter diesen Lektionen zuletzt angelegte Lektion; Umbenennen, spätere Wortergänzungen oder nachträgliches Zuordnen ändern deren Anlegereihenfolge nicht. Gleichstände werden stabil über die Lektions-ID aufgelöst. „Neue“ enthält beim Rundenstart nur Vokabel-IDs, zu denen dieses Kind noch keinen gewerteten Versuch hat, auch nicht in einer früheren Wortfassung.

Die Menge der Vokabel-IDs wird beim Rundenstart festgehalten. Deshalb kann ein zunächst neues Wort innerhalb derselben „Neue“-Runde wiederholt werden, obwohl es nach der ersten Antwort nicht mehr neu ist. Währenddessen ergänzte Wörter kommen erst in eine neue Runde. Deaktivierte, entzogene, inhaltlich geänderte oder konflikthafte Wörter werden vor ihrer nächsten Aufgabe entfernt. Das bereits angezeigte Wort wird bei einer relevanten Änderung ohne Wertung ersetzt; bereits gespeicherte Antworten bleiben unverändert.

### Auswahl der nächsten Aufgabe

1. Zuerst erneut fällige Fehlerwörter, deren Abstand erfüllt ist.
2. Danach fällige Wiederholungen bereits beherrschter Wörter.
3. Danach noch nie geübte Wörter aus der Rundenauswahl.
4. Danach noch nicht beherrschte Wörter aus der Rundenauswahl.

Innerhalb einer Gruppe zuerst in dieser Runde seltener abgefragte Wörter, dann länger nicht geübte; letzte Gleichstände über eine aus der Runden-ID abgeleitete stabile Mischung lösen. Zufall ist keine versteckte Änderung der Zulässigkeit. Dasselbe Wort möglichst nicht direkt nacheinander zeigen, solange eine gleichrangige andere Aufgabe verfügbar ist. Ist nur ein korrekt beantwortetes, noch nicht beherrschtes Wort zulässig, darf es erneut erscheinen. Der Mindestabstand nach einem Fehler wird dadurch niemals verkürzt.

Nach einem Fehler müssen zwei andere gewertete Aufgaben folgen. Das können zwei Aufgaben zum gleichen anderen Wort sein; ungeprüfte Eingaben zählen nicht. Der verbleibende Abstand bleibt über Rundengrenzen erhalten und wird anhand der weiteren Antworten des Profils abgebaut. Mehrere gleichzeitig fällige Fehlerwörter können nicht alle die nächste Aufgabe sein; nach erfülltem Abstand gilt die genannte Reihenfolge. Das Wort verschwindet nicht, wenn die ursprüngliche Runde endet.

Die Richtigserie gilt je Profil und Vokabel-Lernfassung. Drei richtige Antworten pausieren das Wort für den Rest dieser Runde. Die nächste Wiederholung ist frühestens am nächsten Kalendertag möglich. Nach richtiger Wiederholung folgen 3, 7 und anschließend jeweils 14 Tage; nach einem Fehler beginnt die Dreierserie erneut bei null. Eine richtige geplante Wiederholung wird nicht nochmals in derselben Runde abgefragt. Fällige Wiederholungen werden nicht heimlich in den Modus „Neue“ aufgenommen.

Der Datensatz erhält bei Einrichtung eine gemeinsame Lernzeitzone, zunächst die ermittelte Zeitzone des Einrichtungsgeräts. Fälligkeiten verwenden Kalendertage in dieser Zeitzone; Datumswerte werden gespeichert. Für korrekte Tagesabstände wird ein korrekt eingestelltes Gerätedatum vorausgesetzt. Geräteuhren bestimmen nicht die Zusammenführung von Bearbeitungskonflikten. Zeitzonenwechsel und abweichende Geräteuhren gehören in die Prüfungen; gespeicherte Ergebnisse nicht nachträglich allein wegen ihrer Uhrzeit löschen.

### Rundenende, Bonus und Pause

Die gewählte Gesamtzahl 10/20/30 umfasst alle gewerteten Antworten einschließlich Wiederholungen. Bei voller Runde werden einmalig 20 Bonuspunkte vergeben. Ist die Auswahl vorher erschöpft, gilt die bestätigte Wahl: beenden oder verbleibende Aufgabenplätze mit anderem, ebenfalls zugeordnetem und aktuell zulässigem Wortschatz füllen. Gibt es auch dort keinen, bleibt nur Beenden.

Vorschlag: Auch ein Abschluss wegen ausgeschöpfter Auswahl gibt die 20 Punkte, wenn mindestens eine Antwort gewertet wurde. Eine leere Auswahl, bloßes Öffnen, Unterbrechen oder bewusstes Aufgeben gibt keinen Abschlussbonus. Richtige Antworten behalten ihre jeweils 10 Punkte in jedem Fall. Die Zusammenfassung zeigt beantwortete Aufgaben, richtige Antworten, Fehlerwörter, Antwortpunkte und separat einen gegebenenfalls vergebenen Abschlussbonus; ein früher Abschluss wird nicht als „10 von 10“ angezeigt.

Rundenstand, Antwortstatus und noch offene Fehlerabstände werden nach jeder Wertung dauerhaft gespeichert. Ein Neuladen auf dem Ergebnisbildschirm zeigt wieder genau dieses Ergebnis. Fortsetzen bleibt auch nach einem Tageswechsel möglich; geänderte Inhalte/Zuordnungen werden geprüft, bereits für diese Runde pausierte Wörter bleiben pausiert. Gibt es dadurch keine Aufgaben mehr, gilt die Regel für ausgeschöpfte Auswahl. Ein Profilwechsel pausiert die bisherige Runde. Nach einer vollständigen Datenwiederherstellung werden alte laufende Runden nicht fortgesetzt.

## 5. Inselreise und Belohnungen — E04

Es gibt einen gemeinsamen Punktestand je Kind. Start ist Level 1; alle weiteren 200 Punkte steigt das Level um eins: `Level = 1 + floor(Punkte / 200)`. Abzeichen oder das Anlegen von Vokabeln geben keine zusätzlichen Punkte. Eine Runde mit zehn richtigen Antworten bringt die bestätigten 120 Punkte.

| Insel | Freischaltung | Reiseabschnitte |
| --- | --- | --- |
| Strandinsel | Von Beginn an, 0 Punkte | Die ersten fünf Etappen zu jeweils 200 Punkten |
| Waldinsel | 1.000 Punkte, Level 6 | Die nächsten fünf Etappen |
| Berginsel | 2.000 Punkte, Level 11 | Die letzten fünf Etappen |

Bei 3.000 Punkten sind die 15 Etappen abgeschlossen. Danach bleiben alle Übungsmodi nutzbar und Punkte/Level steigen weiter; die App verspricht keine weiteren noch nicht vorhandenen Inseln. Die Reise begrenzt niemals den von Erwachsenen freigegebenen Lernstoff.

Der einfache Entdecker-Avatar hat vier frei verfügbare Hauttöne und sechs Kleidungsfarben. Sechs feste Zubehörteile werden freigeschaltet: Kappe auf Level 2, Rucksack auf Level 4, Sonnenhut auf Level 6, Fernglas auf Level 8, Bergmütze auf Level 11 und Kompass auf Level 14. Kopfbedeckung, Rucksack und Handzubehör bilden getrennte Plätze; pro Platz wird ein verfügbares Teil ausgewählt oder keines. Keine Münzen und kein Laden.

Sechs Abzeichen: erste abgeschlossene Runde, zehn abgeschlossene Runden, zehn verschiedene Vokabeln erstmals mit Dreierserie, zehn verschiedene zunächst falsche Vokabeln später richtig beantwortet, Waldinsel erreicht, gesamte Reise abgeschlossen. Ein Abzeichen wird je Profil und Typ genau einmal erworben und bei späteren Fehlern oder Archivierung nicht weggenommen. Eine bewusst gewählte Sicherungswiederherstellung kann den Fortschritt auf ihren älteren Stand zurücksetzen.

## 6. Erwachsene, Inhalte und PIN — E05/E06

Der Erwachsenenbereich enthält „Kinder“, „Lektionen“, „Lernstand“, „Abgleich“ und „Sicherung“. Anzeigenamen, Zuordnungen und Wortlisten lassen sich bearbeiten. Lernstände zeigen je Kind/Vokabel Versuche, richtig/falsch, aktuelle Serie, letzte Übung und nächsten Wiederholungstag. Keine Schulnoten und kein Vergleich zwischen Kindern.

Bei Vokabeln sind deutscher Text und mindestens eine englische Lösung erforderlich. Ein kurzer deutscher Bedeutungshinweis ist optional, um gleiche Wörter wie „Bank“ auseinanderzuhalten. Jede Vokabel gehört in Version 1 genau einer Lektion. Eine Lektion kann mehreren Kindern zugeordnet sein; der Inhalt wird nur einmal gehalten. Eine reine Änderung der Zuordnung löscht keinen Lernstand.

Tabellenübernahme verwendet eingefügte Zeilen mit zwei Spalten Deutsch/Englisch, optional einer dritten Spalte für den Hinweis. In der Englischspalte trennt `|` mehrere erlaubte Antworten, beispielsweise `bicycle | bike`. Vor dem Übernehmen erscheint eine editierbare Vorschau. Leere Zeilen werden entfernt; fehlende Pflichtwerte, zusätzliche Spalten und mehrdeutige Zeilen werden angezeigt und müssen geklärt werden. Identische Einträge innerhalb derselben Lektion werden als mögliche Dubletten markiert, nicht still angelegt oder zusammengeführt. Gleiches deutsches Wort mit anderer Bedeutung kann ausdrücklich getrennt übernommen werden.

Jede Bearbeitung erzeugt eine neue Inhaltsfassung. Ändern sich nach der beschriebenen Textnormalisierung deutscher Text, Bedeutungshinweis oder die Menge der erlaubten Lösungen, beginnt die Übungsserie für diese Lernfassung neu; bisherige Antworten, Punkte und Abzeichen bleiben als Historie erhalten. Eine automatische Erkennung gleicher Wortbedeutung ist nicht vorgesehen. Reine Anpassungen der Schreibweise ohne Änderung der normalisierten Texte setzen die Serie nicht zurück. Ein schon geübter Eintrag wird durch Bearbeiten nicht wieder zu einem „noch nie geübten“ Wort. Die Verwaltung kündigt einen nötigen Neustart der Serie beim Speichern an.

Wörter, Lektionen und Profile können archiviert und wieder aktiviert werden. Archivieren entfernt sie aus der aktuellen Auswahl, erhält aber IDs und Historie. In Version 1 gibt es dafür keine unwiderrufliche Löschfunktion und keinen globalen Lernstand-Reset außerhalb der ausdrücklich bestätigten Sicherungswiederherstellung.

Die vierstellige PIN wird bei der Einrichtung auf jedem Gerät zweimal eingegeben; Erwachsene können auf mehreren Geräten dieselbe wählen. Sie bleibt gerätelokal und wird weder synchronisiert noch in der JSON-Sicherung exportiert. Der Bereich sperrt beim Wechsel zurück zum Üben, beim Neuladen und beim Verlassen in den Hintergrund. Ändern erfordert die aktuelle PIN. „PIN vergessen“ öffnet einen bewusst längeren lokalen Rücksetzablauf mit dem ausgeschriebenen Bestätigungstext „PIN zurücksetzen“ und zweimaliger Eingabe der neuen PIN. Das verhindert versehentliche Bedienung, nicht absichtliches Umgehen; keine zusätzliche Google-Anmeldung oder Datenlöschung dafür. Dieser einfache Rücksetzweg ist Teil des hier zu prüfenden Vorschlags.

## 7. Daten und Module — E01/E10

Empfohlen ist JavaScript ohne UI-Framework, mit nativen ES-Modulen, HTML und CSS. Alternative wäre ein Framework mit zusätzlichem Build-/Abhängigkeitsaufwand; für diesen begrenzten Ablauf ist sein Nutzen aktuell klein. Eine native Mehrplattform-App würde Bereitstellung und Wartung erweitern und ist nicht Bestandteil der gewählten Richtung. Entwicklerwerkzeuge können Node.js verwenden; zum Benutzen reichen Browser und die bereitgestellte HTTPS-App.

| Baustein | Vertrag | Abhängigkeiten |
| --- | --- | --- |
| Antwortprüfung | Eingabe und Wortfassung hinein, nachvollziehbares richtig/falsch hinaus | Reine Funktionen, keine Speicherung |
| Lernplanung | Profilzustand, Runde und Datum hinein, nächste zulässige Aufgabe oder Abschlussgrund hinaus | Reine Funktionen, übergebene Zeit/Mischung |
| Fortschritt/Belohnungen | Eindeutige Ereignisse hinein, reproduzierbare Serien, Fälligkeiten und Punkte hinaus | Gemeinsame Sortier- und Regelversion |
| IndexedDB-Speicher | Transaktionen für Ereignis, Rundenstand und ausstehenden Upload | Browserdatenbank; Fehler werden an Oberfläche gemeldet |
| Abgleich | Lokale und entfernte Ereignismengen abgleichen, bestätigte Übertragungen markieren | Speicher, validierende Importlogik, Drive-Adapter |
| Drive-Adapter | Verbinden, Datensatz finden/anlegen, unveränderliche Dateien senden/lesen | Google Identity Services und Drive REST API |
| Sicherung | Vollständigen Stand exportieren, Eingabe prüfen, Vorschau und Wiederherstellung ausführen | Speicher, Abgleich, Wiederherstellungsprotokoll |
| Oberfläche/PWA | Zustände darstellen und Aktionen auslösen, eigene Programmdateien offline bereitstellen | Obige Verträge; keine zweite Lernlogik |

Der Service Worker verwaltet ausschließlich versionierte Programmdateien im eigenen App-Pfad. Keine Google-Antworten, Tokens oder persönlichen Sicherungen im Programmcache. Offline-Start setzt eine vorherige erfolgreiche Online-Erstladung voraus. Eine neue Programmversion wird zwischen Runden oder nach ausdrücklich gewählter, bereits gespeicherter Pause aktiviert; keine erzwungene Aktualisierung während der Eingabe. Cachewechsel und Datenmigrationen müssen zusammenpassen; eine gescheiterte Migration darf den bisherigen Bestand nicht beschädigen.

Datensatz, Profil, Lektion, Vokabel, Inhaltsfassung, Runde und Ereignis erhalten stabile IDs. Ein Ereignis trägt Format-/Regelversion, Datensatz und Datenepoche, Geräte-/Profilbezug, eine monotone logische Reihenfolge und Zeitangaben. Antwortereignisse referenzieren den konkreten Wortstand; Rundenabschlüsse enthalten Runden-ID, Abschlussgrund und eindeutigen Bonusanspruch. Der tatsächlich getippte Text bleibt nur für die aktuelle lokale Rückmeldung gespeichert; für synchronisierte Statistik genügen Ergebnis und bewertete Wortfassung.

Fortschritt ist aus dem gesicherten Grundstand und eindeutigen Ereignissen ableitbar. Vorberechnete Zähler sind ein erneuerbarer Cache. Innerhalb eines Geräts und nach bereits beobachteten fremden Ereignissen bleibt die kausale Reihenfolge erhalten. Gleichzeitig offline erzeugte Lernereignisse werden auf allen Geräten stabil nach logischem Zähler, Geräte-ID und Ereignis-ID geordnet. Das ist eine eindeutige Zusammenführungsregel, keine Behauptung über die minutengenaue tatsächliche Reihenfolge auf unabhängigen Geräten. Serien und Fälligkeiten können sich nach dem Empfang bislang unbekannter Antworten entsprechend korrigieren; keine Antwort wird dafür gelöscht.

## 8. Google-Abgleich und Bearbeitungskonflikte — E07/E10

Die App erstellt nach Erwachsenenbestätigung einen sichtbaren Trainerordner und eine Datensatzbeschreibung mit stabiler ID. Auf dem zweiten Gerät werden mit derselben App und demselben Google-Konto die zugehörigen von der App angelegten Datensätze gesucht und bewusst ausgewählt. Ein Name allein ist keine Identität. Keine beliebigen Dateien des Google-Kontos durchsuchen oder eine Ordnerauswahl mit Vollzugriff verwechseln. Die vorgesehene Berechtigung bleibt `drive.file`.

Für Version 1 werden neue Änderungen als unveränderliche JSON-Pakete angelegt, nicht durch konkurrierendes Überschreiben einer gemeinsamen Komplettdatei. Metadaten enthalten Datensatz-ID, Datenepoche und Paket-ID. Ein Paket wird lokal festgeschrieben, bevor ein Upload beginnt. Vorab erzeugte Drive-Datei-IDs bleiben für Wiederholungsversuche identisch; nach unklarem Erfolg oder einem Konfliktstatus wird die vorhandene Datei geprüft. Zusätzlich werden Ereignisse anhand ihrer fachlichen ID dedupliziert. Gleiche ID mit unterschiedlichem Inhalt ist ein Datenfehler, keine neue gültige Antwort.

Beim Öffnen, Zurückkehren zur App, Wiedererlangen des Netzes und nach einer Runde abgleichen. Während aktiver Nutzung Änderungen nach höchstens zehn Sekunden bündeln; ohne Änderungen spätestens alle 60 Sekunden nach neuen Paketen suchen. Upload-Pakete enthalten höchstens 100 Ereignisse oder 64 KiB; größere Daten werden aufgeteilt. Bei Fehlern begrenzt mit wachsendem Abstand wiederholen, danach klaren Wiederholungsweg anbieten. Kein Polling bei versteckter App, kein Versprechen geschlossener Hintergrundsynchronisation. Alle Suchergebnisse vollständig paginieren; bekannte Dateien nur bei Bedarf erneut herunterladen. Eine spätere verlustfreie Verdichtung ist eine Optimierung, kein Löschen der Historie in Version 1.

Erst eine bestätigte lokale Transaktion erlaubt den Wechsel nach einer Antwort. Bei Speicherfehler bleibt die aktuelle Eingabe erhalten und die App meldet, dass noch nicht gespeichert wurde. Fehlende Clouddateien, beschädigte Pakete, unbekannte Formatversionen oder falsche Konto-/Datensatzzuordnung ersetzen keine vorhandenen Daten durch Leere. Ausstehende Änderungen werden nie in einen anderen ausgewählten Datenbestand hochgeladen.

Inhaltsänderungen verweisen auf die bearbeiteten Vorgängerversionen. Zwei unterschiedliche Nachfolger desselben Stands werden als Konflikt erhalten; identische normalisierte Nachfolger dürfen zusammengeführt werden. Erwachsene sehen die Fassungen und erzeugen mit ihrer Auswahl eine neue Fassung, die beide Vorgänger kennt. Das Verfahren gilt auch für konkurrierende Archivierung/Bearbeitung oder unterschiedliche Lektionszuordnungen. Nicht betroffene Inhalte werden weiter abgeglichen.

Eine Vokabel mit ungeklärter inhaltlicher Bedeutung wird nicht neu abgefragt. Wird ein Konflikt erkannt, während sie angezeigt wird, wird sie ohne Wertung ausgetauscht. Bereits gespeicherte Antworten behalten ihren referenzierten Wortstand. Konflikte bei Avatar-Auswahl oder Darstellungspräferenzen dürfen deterministisch aufgelöst werden, weil dadurch keine Antworten oder Wortinhalte verloren gehen.

Google-Zugriffstokens bleiben außerhalb von Backups und Repository; kein Client-Secret im Browser. Bei abgelaufenem Zugriff die beauftragte Wiederverbindung anbieten. Der echte Ablauf und das Wiederfinden mit demselben Konto auf iPhone/iPad sind zu prüfen.

## 9. Sicherung und gemeinsame Wiederherstellung — E08

Der manuelle JSON-Export enthält Format-/Regelversion, Datensatzidentität, Exportzeit, Lernzeitzone, Inhalte und Fassungen, Profile/Zuordnungen, Lernhistorie, Belohnungen und Avatar-Auswahl sowie noch nicht übertragene fachliche Ereignisse. Keine Google-Tokens, PIN-Prüfwerte oder flüchtigen Gerätesitzungen. Die Datei wird als Benutzerdatei heruntergeladen; ein gestarteter Download wird nicht als nachgewiesene Sicherung an einem konkreten Speicherort bezeichnet.

Import validiert das komplette Format vor jeder Änderung. Unbekannte zukünftige Versionen und kaputte Referenzen werden zurückgewiesen; unterstützte ältere Versionen nur über ausdrücklich getestete Migrationen übernommen. Die Vorschau nennt Sicherungsdatum, Profile, Wortzahl, Unterschiede der Fortschrittsstände und die Wirkung auf verbundene Geräte. Kein Importcode wird ausgeführt, keine Texte als HTML interpretiert.

Für einen mit Drive verbundenen Bestand ist die gemeinsame Wiederherstellung nur mit Netz und gültigem Zugriff möglich. Zuerst bekannte aktuelle Cloudänderungen und lokale Änderungen abgleichen, anschließend eine vollständige separate Sicherheitskopie erstellen: lokal und als unveränderliche JSON-Datei im Trainerordner. Inhalt und Rücklesbarkeit prüfen. Die abschließende Vorschau und Bestätigung beziehen sich auf diesen abgeglichenen Stand; hat er sich seit der ersten Vorschau geändert, die Unterschiede erneut anzeigen. Schlägt die Sicherung fehl, findet keine Rücksetzung statt. Sicherheitskopien erhalten Datum und Zweck, sind im Erwachsenenbereich sichtbar und herunterladbar und werden in Version 1 nicht automatisch gelöscht.

Nach der ausdrücklichen Bestätigung wird der ausgewählte Sicherungsstand als neue Datenepoche veröffentlicht. Die Wiederherstellung ist ein neues Steuerereignis mit Bezug auf den bisherigen aktiven Stand und den vollständig hochgeladenen Sicherungsinhalt. Erst bei vollständiger Prüfung aktiviert ein Gerät den neuen Stand in einer lokalen Transaktion. Die feste Datensatzidentität bleibt erhalten; die alte Historie und Sicherheitskopie bleiben getrennt verfügbar. Die neue aktive Historie entspricht dem Backup und wird nicht zum vorherigen Punktestand addiert.

Auf einem noch nicht mit Drive verbundenen lokalen Bestand ist Wiederherstellung ohne Netz möglich, ebenfalls erst nach erfolgreicher lokaler Sicherheitskopie. Die spätere Verknüpfung mit einem schon existierenden Cloudbestand darf diesen nicht automatisch ersetzen; sie verwendet erneut Vorschau und ausdrückliche Entscheidung. Damit bleibt eine Sicherungsdatei auch zur lokalen Wiederaufnahme verwendbar.

Ein später zurückkehrendes Gerät kann noch Antworten oder Bearbeitungen aus der alten Datenepoche besitzen. Diese werden als separate nachträgliche Änderungen aufbewahrt und im Erwachsenenbereich gemeldet. Sie werden weder verworfen noch automatisch gegen den gewählten Rücksetzungsstand verrechnet. Erwachsene können fachliche Ereignisse gezielt übernehmen; vorhandene Ereignis-IDs zählen dabei nicht erneut. Nicht übernommene Ereignisse bleiben einsehbar und sicherbar. Alte laufende Runden werden beendet, ohne einen neuen Abschlussbonus zu erzeugen.

Zwei gleichzeitig ausgelöste Wiederherstellungen bilden getrennte Nachfolger. Keine Auswahl anhand der Geräteuhr: beide bleiben erhalten und erfordern eine Entscheidung im Erwachsenenbereich. Bis dahin kein als vollständig abgeglichen dargestellter neuer gemeinsamer Stand. Lokal bereits erfasste Antworten bleiben ihrer Datenepoche zugeordnet und können nach der Klärung übernommen werden.

## 10. Prüfung, Bereitstellung und Übergabe — E09

Die [Prüfmatrix](../../QUALITAET-UND-ABNAHME.md) gilt weiter. Ergänzend prüft der Implementierungsplan insbesondere:

- Lernlogik: Fehlerabstand über Rundengrenzen, genau drei richtige Antworten, fällige Tagesabstände, kleine/leere Wortlisten, feste Neue-Auswahl, Entzug einer Lektion und Fortsetzen nach Tageswechsel.
- Wertung: Tippfehler, erlaubte Varianten, äußere Leerzeichen, Apostrophe, leere Eingaben, wiederholtes Enter und Neuladen auf dem Ergebnisbildschirm.
- Belohnungen: einmalige Antwort-/Rundenwertung, früher gültiger Abschluss, kein Bonus bei leerer/aufgegebener Runde, Levelgrenzen und einmalige Abzeichen.
- Speicherung/Abgleich: Abbruch vor/nach lokaler Transaktion, Upload erfolgreich aber Antwort verloren, doppelte Pakete, vertauschte Reihenfolge, zwei Offlinegeräte, falscher Datensatz, beschädigte Dateien und erschöpfter Gerätespeicher.
- Wiederherstellung: ungültige Datei, gescheiterte Sicherheitskopie, unvollständiger Upload, Rückkehr eines alten Offlinegeräts, zwei konkurrierende Rücksetzungen, lokale Wiederherstellung vor erster Drive-Verknüpfung.
- Oberfläche: Bedienung per Touch/Tastatur, vergrößerte Schrift, kleine Bildschirme, reduzierte Bewegung und Erreichbarkeit der Hauptaktion bei offener Tastatur.

Reine Logiktests und Integrationstests werden unabhängig vom UI ausgeführt; Browserprüfungen ergänzen sie. Konkrete Werkzeuge, Versionen und ausführbare Befehle werden erst im Implementierungsplan beziehungsweise beim tatsächlichen Einrichten festgehalten. Es existieren noch keine Produkttest-Ergebnisse.

Nach Bestätigung des Entwurfs folgt der Implementierungsplan. Das erste Entwicklungspaket ist eine begrenzte technische Probe mit synthetischen Daten: Google verbinden, Datensatz auf zwei Geräten wiederfinden, eindeutig wiederholbare Übertragung und Rücksetzung prüfen. Vor umfangreicher Oberfläche wird die reale iPhone-Nutzung in Safari und als Home-Bildschirm-App geprüft; iPad ebenfalls einplanen. Der Nutzer besitzt keine Apple-Geräte, sein Freund als künftiger Hauptnutzer beide Typen. Modelle, Versionen und Verfügbarkeit werden dafür noch benötigt; niemand wird ohne Auftrag kontaktiert. Fehlender Gerätezugang lässt die Geräteabnahme offen, nicht fiktiv bestanden.

Danach folgen lokaler Trainer, Erwachsenenbereich und Spielumfang in getrennten überschaubaren Paketen sowie die nachgewiesene Drive-Anbindung. Der Programmcode soll über GitHub Pages bereitgestellt werden; eine tatsächliche Einrichtung/Veröffentlichung ist noch nicht erfolgt. Mindestversionen werden nach der Probe und Geräteprüfung nachvollziehbar festgelegt. Bei nicht erfüllbarer Plattform-/Kostenanforderung den konkreten Befund melden und die betroffene Entscheidung klären.

Für andere KIs/Systeme bleiben README, AGENTS.md, Arbeitsstand, Architektur, Anforderungen, Datenschema-/Migrationsvertrag, Google-Einrichtung, Tests und Geräteberichte im Repository maßgeblich. Keine geheimen Konfigurationswerte, persönlichen Daten oder Browserdaten als Übergabemittel committen. Nach jedem Umsetzungspaket tatsächlichen Zustand und nächste Schritte aktualisieren.

## 11. Quellen und noch ausstehende Nachweise

Die technische Empfehlung verwendet die in [QUELLEN.md](../../QUELLEN.md) dokumentierten offiziellen Quellen. Für das vorgeschlagene Dateiprotokoll zusätzlich geprüft am 16.09.2026:

- [Google: Uploads mit vorab erzeugten IDs](https://developers.google.com/workspace/drive/api/guides/manage-uploads#use_a_pre-generated_id_to_upload_files): Grundlage für wiederholbare Dateianlage. Die fachliche Deduplizierung bleibt Aufgabe der App.
- [Google: Dateieigenschaften](https://developers.google.com/workspace/drive/api/guides/properties) und [Dateisuche](https://developers.google.com/workspace/drive/api/guides/search-files): Grundlage für die Zuordnung und Suche der von der App angelegten Pakete.
- [Google: Nutzungslimits](https://developers.google.com/workspace/drive/api/guides/limits): Privaten Einsatz innerhalb der kostenlosen Grenzen planen; vor tatsächlicher Einrichtung erneut prüfen, keine kostenpflichtige Abrechnung aktivieren.
- [MDN: Service Worker verwenden](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers): Sichere Bereitstellung, begrenzter Geltungsbereich und kontrollierter Wechsel des Programmcaches.

Unveränderliche Pakete, Datenepochen und die beschriebenen Konfliktregeln sind unser Entwurf, keine von Google zugesagte App-Funktion. Die vorgeschlagenen Schnittstellen benötigen automatisierte Prüfungen und die frühe echte Drive-Probe. Dieser Entwurf bestätigt weder die spätere Bedienbarkeit auf Geräten noch eine bereits laufende App.
