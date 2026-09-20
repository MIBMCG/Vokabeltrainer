# Anforderungen und Entscheidungen

## Bestätigter Richtungswechsel: Avatar-Entwicklungsstufen (20.09.2026)

**EV01–EV05 bestätigt:** Das Kind spart Guthaben an und schaltet die nächste Entwicklungsstufe mit einem bewussten Kauf vollständig frei. Keine Teilbeträge pro Avatar. Einheitliche Einzelpreise je Aufstieg: **200 / 400 / 800 Punkte**, insgesamt 1.400 ab vorhandener Grundform, zusätzlich zu einem etwaigen Kaufpreis der Grundfigur. Mädchen und Jungen behalten jeweils vier kostenlose Hauttöne; Kleidung/Rüstung ist je neuer Stufe fest gestaltet, ohne zusätzliche Kleidungsfarbwahl (EV03: Nutzerantwort a). Der bisherige menschliche Avatar bleibt zusätzlich als **„Klassisch“** mit seinen Farben, Zubehörteilen und bisherigen kostenlosen Freischaltungen nutzbar (EV04: Nutzerantwort B). Klassisches Zubehör wird nicht auf neue Stufenbilder montiert. [Laufende Entscheidungen](design/2026-09-20-avatar-entwicklungsstufen.md).

Der Nutzer hat die Empfehlung „vier vollständig gerenderte Entwicklungsformen je Figur einschließlich Grundform“ mit „so machen wir das“ bestätigt. Erspielte Punkte können in die Entwicklung des eigenen Avatars investiert werden; Level und Lernfortschritt bleiben unverändert. Ein sichtbarer Fortschrittsbalken kündigt die nächste Form an, und bereits freigeschaltete Formen bleiben dauerhaft auswählbar. Zuerst wird nur eine vierstufige Drachenreihe gemeinsam beurteilt. [Bestätigte Richtung und Grenzen](design/2026-09-20-avatar-entwicklungsstufen.md).

**EV05 mit ja bestätigt:** Die Oberfläche verwendet „Meine Figur“, „Entwicklung“ und „Shop“. Eigene Figuren einschließlich Klassisch werden in „Meine Figur“ ausgewählt; „Entwicklung“ zeigt die vier Formen, nächsten Preis und fehlende Punkte; der Shop zeigt weitere Grundfiguren. Vor einem Kauf stehen Preis und verbleibendes Guthaben in der Bestätigung. Nach dem Kauf wird die neue Form erst bewusst ausgewählt. Die Umsetzung ist von der bestätigten Bedienungsentscheidung getrennt nachzuweisen.

**Bestätigtes Bildkriterium vom 20.09.2026:** Der Unterschied von Stufe 3 zu Stufe 4 muss deutlich größer, epischer und mythischer wirken. Eine Endstufe, die hauptsächlich zusätzliche Rüstung trägt, genügt nicht. Konzeptbogen v1 wurde aus diesem Grund nicht abgenommen. Der Nutzer hat v2 mit „ja, viel besser“ persönlich bestätigt; diese Drachenbildrichtung mit klar epischer Finalstufe ist damit die Stilvorlage und nicht erneut zur Bildfreigabe vorzulegen. Datenvertrag, konkrete Oberflächengestaltung und die Produktion weiterer Figuren bleiben im Detaildesign offen; Kaufprinzip und Preise sind durch EV01/EV02 geklärt.

Für neue Entwicklungsformen ersetzt diese Entscheidung den modularen Ausrüstungsumfang aus AV02 und die Kompatibilitätsgruppen aus AV11; die bisherige menschliche Avataransicht bleibt nach EV04 als klassische Alternative nutzbar. Bisherige Bildquellen und Passformnachweise werden erhalten; die Produktoberfläche ist noch unverändert. Datenmodell, Shopintegration, endgültige Namen und die vollständige Bildproduktion sind im Detaildesign zu konkretisieren. EV03 ergibt bei den bisherigen 13 Figuren einschließlich menschlicher Hauttonvarianten 76 neue Bildmotive statt der zuvor vereinfacht genannten 52. Vorhandene klassische Bilder werden zusätzlich weiterverwendet. Die bereits bestätigte allgemeine Entwicklungsfreigabe und die übrigen Produktentscheidungen bleiben bestehen. Die alten AV01–AV12-Unterlagen bleiben als Entscheidungshistorie erhalten, soweit sie nicht durch diese Präzisierung ersetzt werden.

Der echte Drive-Probelauf mit Diagnoseversion 4 ergab 3 bestandene und 8 fehlgeschlagene Fälle. Zwei parallele Initialisierungen und zwei parallele Käufe wurden jeweils beide angenommen. Damit ist der bisherige gemischte v2-ETag-/v3-Schreibkandidat kein nachgewiesener exklusiver Kauf-Guard. [Auswertung](reports/2026-09-20-shop-v4-reallauf.md).

Der [echte Diagnose-5-Lauf](reports/2026-09-20-shop-v5-reallauf.md) ergibt vier bestandene und sieben abgebrochene Szenarien. Alle Abbrüche betreffen veränderte File-Versionen bei stabiler ETag während des Lesens. Das beweist weder exklusive noch doppelt angenommene Konkurrenzschreibvorgänge des v2-PUT-Kandidaten. Produktentscheidungen bleiben unverändert; eine begrenzte Diagnoseergänzung darf keine Schutzprüfung ersetzen.

**O-KO01 mit C beantwortet:** Der Nutzer wählt nach Diagnose 6 ausdrücklich die gezielte weitere Untersuchung des direkten Drive-Ansatzes. [Entscheidung](design/2026-09-20-kaufkoordination-nach-diagnose6.md). Kein Apps-Script-Backend und keine Umstellung auf Freischaltungen ohne Punktverbrauch. Der [echte Bericht](reports/2026-09-20-shop-v6-reallauf.md) bleibt bei 6 bestandenen und 5 fehlgeschlagenen Fällen; die sichere Parallelkoordination ist nicht belegt. Als begrenzter nächster Schritt werden Schreibantwort und Nachleseergebnis des bisher mehrdeutigen Negativfalls getrennt diagnostiziert, mit gezieltem Prüfumfang statt unveränderter Vollprobe. Keine aufgeweichten Schutzbedingungen, keine Produktaktivierung und keine Änderung von EV01–EV05. Bestehende Entwicklungs- und Dokumentationsaufträge bleiben im übrigen Umfang erhalten.

**Technischer Befund nach Bericht 7:** Die gezielte Negativprobe scheitert schon bei der Erstellungsnachlese. Es liegt kein neues Ergebnis der Schreibbedingung vor. [Auswertung](reports/2026-09-20-shop-v7-reallauf.md). Innerhalb von C folgt eine begrenzte Beobachtung mit Kontrollabruf vor dem Inhaltsabruf; weder Schutzbedingungen noch Produktentscheidungen werden daraus geändert.

**Technischer Befund nach Bericht 8:** Die vollständige Messung mit umgangenem HTTP-Cache zeigt stabile Kontrollabrufe vor dem Inhalt, aber eine gestiegene Version im Medienfenster; ETag und verfügbare Inhaltsmerkmale bleiben gleich. Das belegt keine Ursache. [Auswertung](reports/2026-09-20-shop-v8-reallauf.md). Der [begrenzte Metadatenversuch](superpowers/plans/2026-09-20-shop-probe-v9-metadata-coordination.md) innerhalb von C prüft ausschließlich neue synthetische Ordner ohne Inhaltsabruf. Produktentscheidungen, strenge Versions-/ETag-Guards und fehlende Shopfreigabe bleiben bestehen; eine hypothetische spätere Pointer-Architektur ist damit nicht umgesetzt.

## Neuer Auftrag: Avatare und Punkteshop (19.09.2026)

Die [bestätigten Entscheidungen AV01–AV12](design/2026-09-19-avatar-shop-entscheidungen.md) erweitern den bisherigen Umfang: Mädchen-/Jungenfiguren, Tiere und mystische Avatare, passende Ausstattung je Figurenart, kostenlose Levelbelohnungen und ein Shop mit erspieltem Guthaben. Der Nutzer hat R24/Q6d ausdrücklich geändert: Der frühere Ausschluss eines Münzladens gilt für diese Erweiterung nicht mehr. Gesamte Lernpunkte und ausgebbares Guthaben werden getrennt; bisherige Punkte zählen vollständig als Startguthaben. O-AV01 ist mit A beantwortet: Kaufen nur online nach erfolgreichem Abgleich, vorhandenen Besitz offline verwenden. Der [Gesamtentwurf](superpowers/specs/2026-09-19-avatar-shop-design.md) ist freigegeben. Bildpipeline und isolierte Kaufprobe sind vorbereitet, die Produktintegration steht aus; die abgeschlossene Überarbeitung U01–U07 bleibt davon getrennt.

**Präzisierung vom 20.09.2026:** Alle Figuren und kompatiblen Ausrüstungsteile körperbezogen nacharbeiten. Vollständig sichtbare Ringöffnungen vor Beinen, überstehende Umhänge und unplausible Verdeckungen sind ausdrücklich beanstandet. Klassische Bildbearbeitung ist mit „Ja, du darfst die Bildbearbeitung dafür verwenden“ erlaubt. [Bildnacharbeit v3](reports/2026-09-20-avatar-fit-v3.md). Die Methodenfreigabe ist keine persönliche visuelle Abnahme.

## Neuer Auftrag vom 19.09.2026

Nach eigenem Test beauftragt der Nutzer eine größere Überarbeitung: bessere Nähe zum Inselkonzept, illustrierte Rasterbilder für Avatar und Reise in passenden Auflösungen, einfachere Cloud-Einrichtung, verständlich erklärte Übungsmodi, leicht zugängliche Wiederholungseinstellungen einschließlich Ausschluss gelernter Wörter, einfachere Vokabelverwaltung und grafische Lernstatistiken. Diese Anforderungen sind im [bestätigten Entwurf U01–U07](design/2026-09-19-ueberarbeitung.md) vollständig festgehalten.

Der Nutzer hat den gesamten schriftlichen Überarbeitungsentwurf mit „Ja, Freigabe erteilt“ bestätigt. Der [Implementierungsplan](superpowers/plans/2026-09-19-ueberarbeitung.md) ist erstellt, selbstgeprüft und mit Nutzerantwort A zur Umsetzung mit Aufgabenagenten und Einzelreviews bestätigt. Die folgenden v1-Entscheidungen bleiben als Ausgangspunkt erhalten; insbesondere R08/R19 beschreiben die bisherigen Standardwerte. Die optische Qualität der bisherigen Umsetzung ist durch den Praxistest ausdrücklich als unzureichend zurückgemeldet, unabhängig von bestandenen Funktionstests.

**Bestätigte Einrichtungsentscheidung vom 19.09.2026:** Automatischer Abgleich bleibt bei Google Drive. Die vorhandene Google-Konfiguration wird einmal zentral in der App vorbereitet; Eltern melden sich nur noch bei Google an und wählen den gemeinsamen Bestand. Keine eigene Cloud-Console-/Client-ID-Einrichtung für jede Familie. Die zuvor erwogene Excel-Alternative wird nicht als Synchronisationsspeicher umgesetzt. Neue App-Ursprünge und gegebenenfalls Testnutzer bleiben einmalige Einrichtungsaufgaben der Projektverantwortlichen.

**Bestätigte Lernregelentscheidung vom 19.09.2026:** Wiederholungsregeln sind je Kind getrennt einstellbar, mit gemeinsamen Standardwerten als Ausgangspunkt. Änderungen an einem Kind verändern nicht die Regeln anderer Profile. Die Freigabe umfasst die Zahlenbereiche, Gültigkeit ab nächster neuer Runde und manuelle Wiederaktivierung des schriftlichen Entwurfs. Bestehende Runden behalten ihre Regeln; bisher erworbene Punkte und Antworten bleiben erhalten.

### Umsetzung und Nachweis getrennt von der Entscheidung

Die Einzelpakete A1–C1 sind unabhängig geprüft. C2 ist implementiert und vollständig automatisiert geprüft; unabhängige Gesamtprüfung und Nachprüfung sind ohne offene Befunde abgeschlossen. [Aktuelle Gesamtbelege](reports/2026-09-19-ueberarbeitung.md). Physische Apple-Abnahme, reale Produkt-Synchronisation auf zwei Geräten und öffentliche Bereitstellung bleiben offen.

| Anforderung | Implementierung und Einzelbeleg |
| --- | --- |
| U01/U02: Konzeptnähe und Rasterbilder | [Illustrationen und Bildableitung](reports/2026-09-19-illustrationen.md), [Start-/Reiseansichten](reports/2026-09-19-a4-verwaltung.md) |
| U03: Vorbereiteter Google-Zugang | [Einrichtung und Erhalt bestehender Bindungen](reports/2026-09-19-a3-einrichtung.md) |
| U04: Erklärte Modi | [Gemeinsame Vorschau und einzelner Start](reports/2026-09-19-a2-rundenstart.md) |
| U05: Regeln je Kind | [Migration](reports/2026-09-19-b1-datenuebergang.md), [Planung](reports/2026-09-19-b2-lernplanung.md), [Elternregler](reports/2026-09-19-b3-elternregler.md) |
| U06: Einfache Wortverwaltung | [Vier Bereiche, Suche, Import und Entwurfsschutz](reports/2026-09-19-a4-verwaltung.md) |
| U07: Grafischer Lernstand | [Statistik und erhaltene Wortdetails](reports/2026-09-19-c1-statistik.md) |

Änderung der Prüfungsreihenfolge am 17.09.2026: Der Nutzer beauftragt ausdrücklich, zuerst die vollständige App gemäß bestätigtem Gesamtentwurf umzusetzen und erst danach beim Freund auf iPhone/iPad zu testen. Die bisherige Geräteprüfung vor umfangreicher Lernoberfläche ist damit als Entwicklungssperre aufgehoben. Reale Geräteabnahme bleibt offen und darf nicht als bestanden gelten. Bereits bestätigte manuelle Google-/Drive-Tests in zwei Browsern gelten weiter. Keine neue pauschale Startfreigabe verlangen; Hosting/Veröffentlichung und Kostenmodell werden dadurch nicht automatisch geändert.

Grundentscheidungen vom 16.09.2026, ergänzt bis 19.09.2026. R08/R19 gelten als Standardwerte, soweit keine bestätigte Regeländerung je Kind vorliegt. Dieses Dokument ist die zentrale Quelle für den Produktumfang. „Bestätigt“ bedeutet eine ausdrückliche Nutzerangabe oder Auswahl im bisherigen Gespräch. Vorschläge müssen als solche erhalten bleiben, bis sie abgestimmt wurden.

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

Fortschritt am 17.09.2026: Der Nutzer bestätigt anschließend die erfolgreiche Erstellung des Google-Cloud-Projekts nach Anleitung. Nächster Schritt ist die Aktivierung der Google Drive API; OAuth-Client und reale Verbindungsprüfung bleiben offen.

Weitere Einrichtung am 17.09.2026: Web-OAuth-Client vorhanden, Testkonto eingetragen und erste echte Anmeldung durch Nutzerscreenshot bestätigt. Reales Speichern/Abgleichen sowie Geräteabnahme bleiben offen.

Praxisprüfung am 17.09.2026: Nutzer bestätigt realen Drive-Abgleich, Uploadwiederholung ohne Doppelwertung, lokalen Erhalt nach Neuladen, erneute Anmeldung, Offlineantwort mit anschließendem Upload und Rücksetzung mit Sicherungsbestätigung. Offline-Neuladen und Mehrgeräte-/iOS-Prüfung bleiben offen. Details und Nachweisgrenzen stehen im [Prüfbericht](reports/2026-09-17-google-drive-probe.md).

17.09.2026: Nutzer bestätigt vollständiges Neuladen bei getrennter Internetverbindung mit allen Zählern auf 0. Der lokale Server lief weiter; damit ist die Bedienbarkeit ohne Internet bestätigt, aber der alleinige Start aus dem Service-Worker-Cache ohne erreichbaren Ursprung nicht isoliert nachgewiesen. Nächster Schritt: zweites getrenntes Browserprofil bzw. anderer Browser für den realen Drive-Abgleich; ein zweiter Tab genügt wegen gemeinsamer lokaler Daten und Tabsperre nicht. Physische Zwei-Geräte-/iOS-Abnahme bleibt offen.

Aktueller Praxisstand am 17.09.2026: Realer Drive-Abgleich zwischen zwei Browsern desselben Rechners in beide Richtungen bestätigt. Nach Rücksetzung bleibt eine verspätet übertragene alte Antwort auf beiden Seiten separat erhalten (0 Antworten/0 Punkte/0 ausstehend/1 alte Generation). Physische Zwei-Geräte- und iOS-Nachweise bleiben offen; Produktanforderungen unverändert.

## Nicht beauftragt

- Native App-Store-App, App-Store-Veröffentlichung oder kostenpflichtiger Backenddienst.
- Getrennte Google-Konten für jedes Kind als aktuelles Kontenmodell.
- KI-generierte Vokabeln, automatische Übersetzung oder ein kostenpflichtiger KI-Dienst.
- Ranglisten zwischen Kindern, Werbung, Käufe oder soziale Funktionen.
- Zusätzliche Lernrichtungen, Aussprachebewertung oder weitere Sprachen.

Diese Punkte dürfen später besprochen werden; sie sind nicht Bestandteil des bisherigen Auftrags.
