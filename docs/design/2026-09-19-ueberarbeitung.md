# Überarbeitung nach dem Praxistest

Stand: 19.09.2026. **Schriftlicher Überarbeitungsentwurf vom Nutzer mit „Ja, Freigabe erteilt“ bestätigt. Die Freigabe umfasst die hier konkretisierten Vorschläge als Grundlage des Umsetzungsplans. Noch keine Produktänderung dieses Pakets.** Ausgangsstand: `8948a3b` auf `codex/vokabeltrainer-v1`. Bestehende Tests belegen die bisherige Funktion, nicht die vom Nutzer gewünschte gestalterische Qualität.

## Auftrag und Erfolgskriterien

Der Nutzer hat die App ausprobiert und beauftragt eine deutlich ansprechendere Gestaltung näher am [bestätigten Inselkonzept](2026-09-17-insel-konzept.md). Avatar und Inselreise sollen illustrierte Rasterbilder verwenden, die in passenden Auflösungen geladen werden. Die Einrichtung, der Übungsstart und die Erwachsenenverwaltung sollen ohne technische Erklärung verständlich sein. Eltern sollen Wiederholungsregeln anpassen können; der Lernstand soll auch durch Diagramme erfassbar sein.

Die Überarbeitung soll vorhandene Profile, Wortlisten, Lernereignisse, Punkte, Avatarfreischaltungen und Sicherungen erhalten. Zielgruppe, Lernrichtung, Rundengrößen und Punktevergabe bleiben erhalten. Eine verschlüsselte Excel-Datei wurde vom Nutzer als mögliche Ausweichlösung zur Vereinfachung der Cloud-Einrichtung vorgeschlagen, nicht als bereits beschlossener Formatwechsel.

| ID | Ausdrücklich beauftragt | Nachweis bei Umsetzung |
| --- | --- | --- |
| U01 | Deutlich näher an das Inselkonzept, hochwertigere Insel- und Avatarbilder | Tatsächliche Start-, Übungs-, Reise- und Avataransichten am Konzept vergleichen; keine reine Behauptung aufgrund bestandener Funktionstests |
| U02 | Bilder in mehreren Auflösungen passend zur Anzeige laden | Mobile und große Ansichten prüfen; richtige Ressourcenwahl, stabile Bildproportionen, Offlineverfügbarkeit |
| U03 | Einrichtung ohne Cloud-Console-Anleitung für jede Familie | Normaler Einrichtungsweg ohne Client-ID-Eingabefeld; verbleibende einmalige Betreiberaufgaben ehrlich dokumentieren |
| U04 | Bedeutung von Alle/Letzte/Neue direkt erklären | Auswahl vor Rundenstart verständlich; konkrete Lektion und verfügbare Wortanzahl anzeigen |
| U05 | Leicht zugängliche Einstellungen für selteneres und kein weiteres Abfragen | Eltern können Regeln finden, verstehen, ändern und rückgängig machen; bestehende Antworten und Punkte bleiben erhalten |
| U06 | Einfaches Hinzufügen und Verwalten der Vokabeln | Klare Hauptaktionen, bearbeitbare Importvorschau, Suche und Filter statt langer Formularseite |
| U07 | Grafisch aufbereitete Lernstatistiken | Diagramme mit nachvollziehbaren Definitionen, Zahlen und verständlichem Leerzustand |

## Gestaltungsentwurf

Die bestehende Vorschau bleibt die Stilreferenz: warme Papier-/Sandflächen, Türkis als Akzent, dunkelblaue lesbare Schrift, große helle Karten und eine zusammenhängende gemalte Inselwelt. Der gegenwärtige Screenshot zeigt gegenüber der Vorlage viel ungenutzte Farbfläche; die Reise und der Avatar verwenden einfache SVG-Formen. Diese Abweichung ist der Ausgangspunkt der Überarbeitung.

- Start: persönliche Begrüßung, kleines Avatarporträt, Levelkarte, kompakte Strandillustration und drei auswählbare Moduskarten; darunter Rundengröße und ein gemeinsamer Button „Runde starten“.
- Übung: ruhige helle Wortkarte mit klarer Eingabe/Rückmeldung. Landschaft außerhalb der Karte; auf kleiner Höhe oder mit Tastatur tritt sie zurück. Die Eingabe und Hauptaktion dürfen nicht aus dem sichtbaren Bereich verdrängt werden.
- Reise: durchgehende illustrierte Karte mit Strand, Wald und Bergen. Die 15 Etappen, Freischaltungen und der aktuelle Standort bleiben echte zugängliche Oberflächenelemente über dem Bild. Beschriftung, Punkte und Fortschritt werden nicht ins Bild eingebrannt.
- Avatar: detailreicher freundlicher Entdecker im Stil des Konzeptbildes, große Vorschau und kompakte Auswahlbereiche. Vorhandene vier Hauttöne, sechs Kleidungsfarben und sechs Ausrüstungsteile bleiben auswählbar und mit ihren bisherigen Freischaltungen verbunden. Passende transparente Rasterebenen müssen gemeinsam ausgerichtet sein; keine unabhängigen Figuren, die beim Umziehen Stil oder Haltung wechseln.
- Erwachsenenbereich: ruhiger und informationsorientierter als der Kinderbereich, mit vier klaren Zugängen „Vokabeln“, „Lernstand“, „Lernregeln“ und „Einstellungen“. Keine lange Folge aller Formulare auf einer Seite.

### Bestätigte Bildtechnik

Originalillustrationen werden mit der eingebauten Bildgenerierung erstellt. Zunächst ein zusammenpassender Satz aus Strand, Reise und Avatar als visueller Nachweis, erst danach weitere Teile. Keine zusätzlichen kostenpflichtigen Bilddienste und keine fremden Markenfiguren.

Rasterbilder werden lokal mitgeliefert. Landschaften erhalten beispielsweise 480/960/1440 Pixel Breite; Avatar-Ebenen beispielsweise 256/512/768 Pixel. Die endgültigen Größen richten sich nach tatsächlich benötigter Anzeige und Quelldateien. WebP mit Transparenz für passende Assets, PNG nur dort, wo technisch nötig; `srcset`/`sizes` und feste Seitenverhältnisse für die Darstellung. Keine getrennte Generierung jeder Auflösung: Auflösungsvarianten zeigen dasselbe Bild.

Eine kleine Grundauflösung muss offline immer verfügbar sein. Größere Fassungen werden bei Bedarf nachgeladen und zwischengespeichert, statt beim ersten Besuch alle Avatarvarianten in allen Auflösungen herunterzuladen. Niedrige Auflösungen bleiben als Rückfall verwendbar. Assetgrößen und geladene Ressourcen werden gemessen und berichtet. Icons und Diagramme dürfen weiterhin mit normalen Webmitteln gezeichnet werden; der gewünschte Bildwechsel betrifft die Illustrationen.

## Vereinfachte Einrichtung: geprüfte Möglichkeiten

**Bestätigt am 19.09.2026: vorhandenes Google Drive, zentral vorbereitete App.** Der Nutzer wählt ausdrücklich „Ja, automatische Synchronisation mit vorbereitetem Google-Zugang (empfohlen)“. Eine öffentliche OAuth-Client-ID wird einmal in der ausgelieferten App-Konfiguration hinterlegt. Familien sehen nur „Mit Google verbinden“, „Neuen Lernbereich anlegen“ oder „Vorhandenen Lernbereich verwenden“. Der bisherige lokale ID-Wert wird bei der Migration berücksichtigt; bestehende Datenbindungen dürfen nicht stillschweigend auf eine andere OAuth-Anwendung wechseln. Technische Angaben gehören in einen erweiterten Bereich für Projektverantwortliche.

Ein gemeinsames Google-Konto auf beiden Geräten und getrennte Kinderprofile bleiben das bisher beschlossene Kontenmodell. Der bestehende Abgleich mit unveränderlichen Paketen und Konflikterkennung bleibt erhalten. Für die konkrete App-Adresse und gegebenenfalls Testnutzer gibt es weiterhin eine einmalige Google-Einrichtung durch den Projektverantwortlichen. Die normale Familie benötigt kein eigenes Cloud-Projekt. Erneutes Verbinden kann weiterhin erforderlich sein; ein unbegrenzter stiller Zugriff wird nicht versprochen.

**Alternative B: manueller Austausch einer Datei.** Eine Datei kann bewusst geöffnet, importiert und wieder gespeichert werden. Das reduziert die Anbieteranbindung, erfüllt aber keinen automatischen Abgleich. Wenn dieser Weg gewählt wird, müssen Format, Verschlüsselung/Passwortwiederherstellung und Zusammenführung separat entworfen werden.

**Excel als automatisch bearbeitete Cloud-Datei:** Die Verschlüsselung einer Tabelle ersetzt weder Cloudanmeldung noch Schreibberechtigung. Eine Browser-App kann insbesondere auf iOS nicht einfach einen dauerhaften Cloudordnerpfad verwenden. Auch eine über eine Cloud-API geladene Excel-Datei benötigt Autorisierung; konkurrierende vollständige Uploads müssten zusätzlich vor Datenverlust geschützt werden. Daher ist dies keine einfachere Ersatzarchitektur für die aktuelle automatische Synchronisation.

Quellen, am 19.09.2026 geprüft: [Google: Client-ID und Ursprünge](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid), [Google: Tokenmodell](https://developers.google.com/identity/oauth2/web/guides/use-token-model), [Google: Drive-Berechtigungen](https://developers.google.com/workspace/drive/api/guides/api-specific-auth), [MDN: Grenzen des Dateiauswahldialogs](https://developer.mozilla.org/en-US/docs/Web/API/Window/showOpenFilePicker). Die Bewertung der Excel-Alternative ist eine technische Schlussfolgerung aus diesen Zugriffsvoraussetzungen und dem bestehenden Konfliktmodell.

Die Cloudfrage ist entschieden: A. Kein Wechsel zu Excel als Synchronisationsspeicher und kein zusätzlicher Cloudanbieter. Die Alternativen bleiben oben als Begründung der Entscheidung dokumentiert.

## Verständlicher Rundenstart

| Angezeigter Modus | Erklärung unmittelbar darunter |
| --- | --- |
| Alle Vokabeln | „Aus allen deinen Lektionen – wir wählen die Wörter, die jetzt zum Üben dran sind.“ |
| Letzte Vokabeln · Neueste Lektion | „Aus deiner zuletzt hinzugefügten Lektion“, ergänzt um deren konkreten Namen, zum Beispiel „Farben“ |
| Neue Vokabeln · Noch nie geübt | „Wörter, die du mit diesem Profil noch nicht beantwortet hast.“ |

Die Auswahl startet noch keine Runde. Eine Zusammenfassung nennt den gewählten Modus und 10/20/30 Antworten. Angezeigte Wortanzahlen müssen Zuordnung, Archivierung, Fälligkeit, Lernregeln und Konflikte berücksichtigen. Unterschied zwischen verschiedenen Wörtern und Antworten einer Runde erklären: Wiederholungen zählen als Antworten mit. Leere oder aktuell ausgeschöpfte Auswahl erklären und eine passende Alternative anbieten.

## Lernregeln: bestätigte Bedienung und Grenzen

Ein direkt sichtbarer Zugang „Lernregeln“ im Erwachsenenbereich. **Bestätigt am 19.09.2026:** „Je Kind getrennt, mit gemeinsamen Standardwerten als Ausgangspunkt (empfohlen)“. Neue und bestehende Profile ohne eigene Einstellung verwenden die bisherigen Standardregeln. Das Bearbeiten eines Kindes verändert keine anderen Profile. Die Oberfläche zeigt einen lesbaren Ergebnissatz, beispielsweise: „Nach 3 richtigen Antworten hintereinander kommt ein Wort seltener. Gelernte Wörter werden weiterhin zur Auffrischung angeboten.“

1. „Ab wie vielen richtigen Antworten hintereinander seltener?“ – Auswahl von 2 bis 10, Standard 3. Die Serie gilt über Runden hinweg; ein Fehler im Wort setzt sie zurück. Bei Erreichen der Schwelle pausiert das Wort für den Rest der Runde, danach gilt der erste Tagesabstand.
2. „Gelernte Wörter weiter auffrischen“ oder „Nach X richtigen Antworten hintereinander nicht mehr automatisch abfragen“. Die zweite Option ist zunächst ausgeschaltet, damit keine vorhandenen Wörter überraschend verschwinden. Bei Aktivierung wird 6 vorgeschlagen, mindestens jedoch die gewählte Seltener-Schwelle; zulässig sind Werte bis 20. Diese Schwelle steuert die automatische Auswahl und darf nicht kleiner als die Seltener-Schwelle sein.
3. „Wiederholungsabstände“ – vier ganze Tageswerte, Standard 1/3/7/14, im aufklappbaren Detailbereich. Werte müssen positiv, nicht absteigend und höchstens 365 sein; der letzte Abstand wiederholt sich. Bei einem Fehler greifen erneut die bestehenden zwei anderen Aufgaben bis zur nächsten Fehlerwiederholung.
4. Ausgenommene Wörter bleiben im Lernstand sichtbar und lassen sich für das jeweilige Kind wieder ins Üben aufnehmen. Kein Löschen von Vokabeln, Antworten oder Punkten.

Die konkreten Zahlenbereiche und zeitlichen Regeln sind mit der Entwurfsfreigabe bestätigt. „Nicht mehr“ meint Ausschluss aus automatischer Auswahl, nicht Löschung. Einstellungen werden erst beim Start der nächsten Runde übernommen; eine angefangene oder fortgesetzte Runde behält ihren Regelstand. Vor dem Speichern zeigt die App, wie viele Wörter künftig aus der automatischen Auswahl fallen. Neue Regeln verändern keine alte Antwortwertung und vergeben keine zusätzlichen Punkte oder Abzeichen.

Die Drei-Richtig-Meilensteine für bereits festgelegte Abzeichen bleiben ein eigener Belohnungsvertrag. Eine erhöhte Einstellungsschwelle darf erworbene Abzeichen nicht entfernen; eine abgesenkte Schwelle darf solche Abzeichen nicht automatisch neu vergeben. Der bisher bei 3 gedeckelte Lernserienzähler reicht für die neue Einstellung nicht: die Scheduling-Serie wird getrennt aus den wirksamen Antworten der aktuellen Wortfassung ermittelt.

„Wieder üben“ setzt nur die Auswahl-/Wiederholungsplanung dieses Wortes für dieses Kind neu an. Gesamtversuche, bisherige Antworten, Punkte und erworbene Abzeichen bleiben bestehen. Inhaltliche Wortänderungen behalten die bisherige Trennung der Lernfassungen. Sicherung und Geräteabgleich müssen Regeln und bewusste Reaktivierung einschließen. Noch nicht abgeglichene Antworten anderer Geräte werden weiterhin verlustfrei und genau einmal gewertet; sie werden nicht deshalb abgelehnt, weil inzwischen eine Regel geändert wurde.

Die Bestandsanalyse zeigt eine echte Schnittstellenänderung: `learning/progress.js` enthält feste Abstände, `learning/rounds.js` hält den Kandidatenbestand einer Runde fest, und `model/schema.js`, `sync/packets.js` sowie `backup/format.js` validieren strikt Version 1. Neue Regeln dürfen nicht als unversionierte Zusatzfelder eingeschoben werden. Das Detaildesign muss Altgeräte und v1-Sicherungen, neue Regelereignisse, rückkehrende Offlinegeräte und regelabhängige Fälligkeit gemeinsam behandeln. Die Analyse wurde mit GPT-5.6 Sol/high durchgeführt; sie ist kein Implementierungsnachweis.

## Vokabelverwaltung und Statistik

Vokabeln: Suche, Lektionsfilter, zugeordnete Kinder und klare Aktionen „Wort hinzufügen“/„Mehrere Wörter einfügen“. Neue Lektion und Kinderzuordnung direkt im Hinzufügen-Ablauf anbieten. Mehrere erlaubte englische Antworten bleiben erhalten. Importvorschau mit direkt korrigierbaren Zeilen und sichtbaren Dopplungen; keine stillen Übernahmen. Archivierung und Wiederaktivierung behalten den bisherigen Verlauf.

Lernstand: Kind und Zeitraum auswählen, dann drei Kennzahlen und zwei Diagramme. Bestätigt sind ein Ringdiagramm für „Noch neu / In Übung / Zur Auffrischung / Aus dem Üben genommen“ und ein Säulendiagramm für richtige/falsche Antworten je Lerntag. Ein beschrifteter Balken kann die Trefferquote ergänzen. Alle Diagramme erhalten Zahlen/Legende und eine lesbare Tabelle; Bedeutung wird nicht allein über Farbe vermittelt.

Statusgruppen müssen sich gegenseitig ausschließen. „Heute fällig“ ist ein zusätzlicher Wert, keine fünfte Ringkategorie, die dieselben Wörter erneut mitzählt. Die Wortverteilung beschreibt den aktuellen Stand; das Tagesdiagramm beschreibt Antworten im ausgewählten Zeitraum. Keine erfundene Lernzeit, da bisher keine verlässliche Zeitmessung vorgesehen ist. Fehler sind Lernhinweise, keine Punktstrafe.

Zeitreihen verwenden ausschließlich effektive, bereits deduplizierte Antwort-/Rundenereignisse der gewählten Datenepoche. Ein ungefiltertes Zählen aller Ledgerereignisse würde bei wiederholtem Abgleich oder Wiederherstellungen falsche Diagramme erzeugen.

## Reihenfolge und Prüfung

1. Der vorliegende Entwurf einschließlich konkreter Schwellen, Gültigkeit ab nächster Runde und Wiederaktivierung ist bestätigt. Der [Implementierungsplan in drei Etappen](../superpowers/plans/2026-09-19-ueberarbeitung.md) konkretisiert Umsetzung und Prüfungen; er ist noch nicht ausgeführt.
2. Visuelle Referenz in tatsächlichen App-Ansichten nachweisen, einschließlich Mobilansicht, Reise und kombinierbarem Avatar; keine Freigabe allein anhand eines generierten Mockups.
3. Einrichtung, Rundenstart und Erwachsenenverwaltung umsetzen; bestehende Formulareingaben und Schutz bei Hintergrundabgleich erhalten.
4. Lernregelvertrag, Migration und Statistik ergänzen; gezielte Tests für Grenzwerte, Änderungen während Runden und Geräteabgleich.
5. Browserprüfung für kleine/weite Ansichten, Schriftvergrößerung, Tastaturbedienung, Offlinebilder und kontrolliertes Update. Visuellen Vergleich mit dem Konzept dokumentieren.

Kein Hosting, kein neues Abo, keine Änderung von Google-Konten, Repository-Sichtbarkeit oder Lizenz ohne entsprechenden Auftrag. Physische iPhone-/iPad-Prüfungen bleiben getrennte Nachweise. Vorhandene persönliche Browserdaten und der laufende lokale Testserver werden für die Entwurfsarbeit nicht verändert.

## Selbstprüfung und verbleibende Implementierungsdetails

- Keine Änderung von Punktwerten, Kontenmodell oder Lizenz vorgeschlagen.
- Einstellungen je Kind, zentral vorbereiteter Google-Zugang, Zahlenbereiche und Layout sind bestätigt. Bildrenditionen werden innerhalb des bestätigten Konzepts an tatsächliche Quellgröße und Darstellung angepasst.
- Die normale Elterneinrichtung darf kein Client-ID-Feld verlangen. Ein alter lokaler Wert oder Datenbestand wird nicht still überschrieben. Vor der tatsächlichen Auslieferung wird die existierende öffentliche Client-ID verifiziert; kein Secret wird benötigt.
- Neue Lernregeln benötigen ein versioniertes Format und neue Leser für ältere Sicherungen. Alte Ereignisse/Hashes bleiben unverändert. Ein altes Programm, das neue Regeln nicht versteht, darf nicht als erfolgreich synchronisiert dargestellt werden. Die konkrete Versionierung, Synchronisationssperre beziehungsweise Updateanforderung und Ereignisabhängigkeiten müssen vor dem Lernkernpaket im Implementierungsplan feststehen.
- Wortanzahlen der Moduskarten und Diagramme verwenden dieselben effektiven Daten und dieselbe Auswahlregel wie die Übung; keine getrennte vereinfachte Nebenrechnung.
- Layoutabnahme erfolgt am laufenden Programm, Bildqualität zusätzlich am Konzeptvergleich. Die Grafikbibliothek und neue Cloudanbieter sind kein Bestandteil dieses Entwurfs.
