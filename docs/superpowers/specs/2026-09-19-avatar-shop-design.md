# Entwurf: Figurenwelt, Ausstattung und Punkteshop

Stand: 19.09.2026. **Zur Gesamtfreigabe vorgelegt, noch nicht implementiert.** Die Produktentscheidungen AV01–AV12 sind bestätigt; konkrete Katalogwerte und technische Grenzen dieses Dokuments sind der daraus abgeleitete Vorschlag. Grundlage: [Entscheidungsprotokoll](../../design/2026-09-19-avatar-shop-entscheidungen.md), Produktstand `ce0cc34`, bestehender [Datenvertrag](../../PRODUKT-DATENFORMAT.md).

## 1. Ziel und Grenzen

Kinder können zwischen menschlichen, tierischen und mystischen Figuren wählen und passende Ausstattung kombinieren. Mädchen und Jungen sind gleichwertig von Beginn an verfügbar. Die Bilder bleiben magisch, detailreich und freundlich-abenteuerlich im Stil der Inselwelt. Neue Belohnungen entstehen aus Lernen, niemals aus Echtgeld.

Dieser Entwurf umfasst Figuren, Halskorrektur, Galerie/Anprobe, Levelbelohnungen, Punkteshop, Kaufhistorie, kompatible Ausrüstung und den dafür notwendigen Datenübergang. Bestehende Lernregeln, Punktevergabe, Profile, Google-Zugang und Kontenmodell bleiben bestehen. Kein zusätzlicher Cloudanbieter, kein Abo, keine öffentliche Bereitstellung, keine Änderung der Lizenz oder Repository-Sichtbarkeit. Die zuvor separat besprochene bessere Auffindbarkeit neuer Lektionen gehört nicht in dieses Paket.

## 2. Gesamte Lernpunkte und verfügbares Guthaben

- Eine richtige Antwort gibt 10 Punkte, ein gültiger Rundenabschluss 20 Punkte. Vorhandene Einmaligkeitsregeln bleiben maßgeblich.
- Gesamte Lernpunkte bestimmen Level, Inselreise und bisherige Meilensteine. Einkäufe ändern diese Summe nicht.
- Guthaben ist die für Einkäufe verfügbare Summe: einmalig gewertete Lernpunkte abzüglich tatsächlich bestätigter Ausgaben.
- Alle bisherigen Punkte zählen von Anfang an. Es gibt keine gesonderte wiederholbare Migrationsgutschrift.
- Beispiel: 1.200 Lernpunkte ergeben nach der bisherigen Regel Level 7. Ein Kauf für 800 Punkte lässt Level 7 und 400 Punkte Guthaben übrig.
- Besitz und Guthaben sind je Kind getrennt. Ein Profilwechsel übernimmt niemals das Konto eines anderen Kindes.
- Offline verdiente Punkte erscheinen als lokal gesammelt. Vor einem Kauf müssen sie erfolgreich abgeglichen und als ausgebbare Grundlage geprüft sein.
- Bereits gekaufte Gegenstände werden nicht erneut berechnet. Gekaufte Figuren und Ausstattung laufen nicht ab. Bewusste vollständige Wiederherstellung eines alten Sicherungsstands bleibt ein gesonderter, bestätigungspflichtiger Rücksetzvorgang.

## 3. Konkreter Startkatalog

Es gibt 13 Grundfiguren. Ritter/Ritterin entsteht durch die kostenlose Ritterausstattung für beide menschlichen Figuren, nicht durch zwei zusätzliche inkompatible Körper. Die freien Haut- und Kleidungsfarben bleiben bei menschlichen Figuren erhalten; tierische Figuren bekommen zum Motiv passende Grundfarben. Teure Spezialvarianten werden nicht durch eine kostenlose Farbwahl ersetzt.

| Figur oder Ausstattung | Erhalt | Preis |
| --- | --- | ---: |
| Entdeckerin und Entdecker | Von Anfang an | kostenlos |
| Pferd | Level 3 | kostenlos |
| Tiger | Level 5 | kostenlos |
| Ritterausstattung für Entdeckerin/Entdecker | Level 7 | kostenlos |
| Einfacher Drache | Level 9 | kostenlos |
| Nebelhirsch | Shop, ohne Mindestlevel | 600 |
| Polarlichtwolf | Shop, ohne Mindestlevel | 800 |
| Schattenpanther | Shop, ohne Mindestlevel | 800 |
| Mond-Einhorn | Shop, ohne Mindestlevel | 900 |
| Sturmgreif | Shop, ohne Mindestlevel | 1.000 |
| Kristalldrache | Shop, ohne Mindestlevel | 1.200 |
| Sternen-Pegasus | Shop, ohne Mindestlevel | 1.200 |
| Phönix | Shop, ohne Mindestlevel | 1.200 |

Vorhandene Level zählen sofort. Alte kostenlose Ausrüstung bleibt zu ihren bisherigen Schwellen erhalten: Kappe 2, Rucksack 4, Sonnenhut 6, Fernglas 8, Bergmütze 11, Kompass 14. Sie wird nicht nachträglich kostenpflichtig. Shop-Figuren und Level-Figuren sind gleichzeitig sichtbar, aber deutlich entsprechend beschriftet.

## 4. Ausstattung und Kompatibilität

Jeder Gegenstand gehört zu einer Kompatibilitätsgruppe und einem eindeutigen Platz. Menschen teilen passende Teile; Drachen teilen Drachenausrüstung. Pferd, Einhorn und Pegasus teilen eine gemeinsame Gruppe mit eigenen passgenauen Bildvarianten je Körper. Tiger, Panther, Wolf, Hirsch, Greif und Phönix erhalten jeweils passende Gruppen. Ein Gegenstand wird einmal je Kind gekauft, auch wenn er mehrere Körpervarianten unterstützt.

Menschliche Plätze bleiben Kleidung/Kopf/Rücken/Hand. Tierische Plätze sind Kopfschmuck, Körperausstattung und Zierde. Zierde umfasst je nach Figur beispielsweise Flügel-, Huf-, Pfoten- oder Schweifschmuck. Pro Platz wird höchstens ein Gegenstand angelegt; eine Krone kollidiert damit nicht mit einer zweiten Kopfbedeckung. Keine künstliche menschliche Hand-/Hemdwahl für Tiere.

| Set / Kompatibilität | Teil 1: 120 Punkte | Teil 2: 240 Punkte | Teil 3: 360 Punkte |
| --- | --- | --- | --- |
| Kristall / Drachen | Runen-Amulett | Kristallrüstung | Leuchtende Flügelspitzen |
| Mond / Pferdefamilie | Mondsichel-Kopfschmuck | Sternenumhang | Silberne Hufreifen |
| Sterne / Pferdefamilie | Sternbild-Kopfschmuck | Wolkensattel | Kometenschweif |
| Sturm / Greif | Runen-Amulett | Blitzrüstung | Goldene Federzier |
| Sonne / Phönix | Sonnenkrone | Magischer Brustschmuck | Glühende Flügelreifen |
| Nordlicht / Wolf | Eiskristall-Amulett | Nordlicht-Umhang | Leuchtende Pfotenreifen |
| Waldgeist / Hirsch | Kristallgeweih-Schmuck | Runenumhang | Waldgeist-Beinzier |
| Obsidian / Panther | Obsidian-Amulett | Violette Runenrüstung | Sternenpfoten |
| Dschungel / Tiger | Blatt-Amulett | Entdecker-Geschirr | Goldene Pfotenreifen |
| Runenreise / Menschen | Runenmedaillon | Sternenumhang | Kristall-Kompass |

Startumfang: 30 kaufbare Gegenstände in zehn Dreiersets, zusätzlich zum vorhandenen Zubehör und zur Level-Ritterausstattung. Bei Amuletten legt der Katalog den sichtbaren Platz eindeutig fest; die Namen allein definieren keinen Slot. Flügelzier bleibt für fliegende Drachen/Greif/Phönix geeignet; die gemeinsame Pferdefamilie erhält universell passende Sets, damit kein gekauftes Teil wegen fehlender Flügel unbrauchbar ist. Der besondere Pegasus-Look stammt bereits aus seinem Grundbild.

Für den Shop-Kauf von Ausstattung muss mindestens eine passende Figur besessen werden. Dies ist keine Levelvoraussetzung: Der passende Shop-Avatar kann jederzeit mit genügend Guthaben erworben werden. Die Oberfläche zeigt vorher, welche Figur benötigt wird. Käufe legen Zubehör nicht ungefragt an; anschließend gibt es „Jetzt anlegen“.

## 5. Galerie, Anprobe und Kaufablauf

Der vorhandene Avatarbereich erhält die Bereiche „Meine Figur“, „Ausrüstung“ und „Shop“. Die Auswahl zeigt Bildkarten, Namen, Besitz und eindeutige Angaben „Ab Level …“, „… Punkte“ oder „Gehört dir“. Kein ausschließlicher Farbcode für Sperren.

„Meine Figur“ zeigt die aktuelle Auswahl groß. Ein Wechsel erhält je Figur die zuletzt verwendete kompatible Ausstattung; bei fehlender/inkompatibler Auswahl wird ein neutraler gültiger Zustand dargestellt, ohne Besitz zu löschen. Ein Avatarname ersetzt das ausschließlich männliche „Entdecker“-Label, wenn eine andere Figur gewählt ist.

Im Shop stehen Guthaben und getrennt davon Level/Lernpunkte. Ein Filter zeigt Figuren oder Ausstattung; Ausstattung lässt sich nach passenden Figuren filtern. Eine Anprobe ist kostenlos, klar als Vorschau markiert und verändert die gespeicherte Auswahl nicht. Sie kann auf einer passenden, noch nicht besessenen Figur gezeigt werden; dabei bleibt die Kaufvoraussetzung sichtbar.

Beim Kauf zeigt ein Bestätigungsdialog Figur/Gegenstand, Preis, aktuelles Guthaben und Restguthaben. Erst „Für … Punkte kaufen“ löst den Vorgang aus. Bei Erfolg folgen Besitzbestätigung und „Jetzt auswählen/anlegen“. Doppelklicks sind gesperrt; ein fehlgeschlagener oder unklarer Netzwerkaufruf wird nicht als erfolgreicher Kauf ausgegeben.

Offline bleiben Üben, Sammeln, Auswählen eigener Figuren und eigener Ausstattung möglich. Bereits geladene Shop-Angebote können angesehen und anprobiert werden; fehlende Bilder erhalten einen klaren Platzhalter. Kaufen ist gesperrt mit „Zum Kaufen bitte verbinden und abgleichen“. Es gibt keine automatisch später ausgeführte Kaufvormerkung.

## 6. Bildaufbau und Halskorrektur

Der vorhandene Hemdausschnitt überdeckt den Hals; bloßes Umordnen der ganzen Grundfigur und des Hemds würde das alte türkise Hemd nach vorne holen. Die Bildkorrektur muss Ausschnitt und Konturen sowie die Renderreihenfolge gemeinsam berücksichtigen.

Menschen verwenden ausgerichtete Körper-/Kopf- und Kleidungsbilder; Hals und Hände müssen sichtbar vor den passenden Kleidungskanten liegen. Mädchen- und Jungenbilder erhalten dieselbe Qualität und jeweils passende Bildvarianten der gemeinsamen Ausrüstung. Bei Tieren dürfen Mähne, Hörner, Geweih und Flügel nicht durch fremde Körperformen zugeschnitten werden. Katalogslots und hintere/vordere Bildlagen sind getrennt, damit beispielsweise ein Umhang hinter dem Körper, sein Verschluss jedoch davor liegen kann.

Alle Quellen sind Rasterbilder mit Transparenz und nachvollziehbarer Herkunft; gemeinsame Koordinaten je Körperform, keine zufällig skalierten freistehenden Teile. Responsive WebP-Ableitungen, eindeutige Asset-IDs und ein einmaliger Fallback bleiben vorgesehen. Kleine Grundvarianten werden offline vorgehalten; größere Ansichten werden bedarfsweise geladen. Das gesamte kleine Avatarpaket hat ein Planungsbudget von 8 MiB. Falls es bei hinreichender Bildqualität nicht erreichbar ist, den Umfang der Offlinebilder gezielt überarbeiten und dokumentieren, nicht still die Qualität verschlechtern. Große Varianten gehören nicht in den Pflichtdownload. Bildgrößen und tatsächliche Ladezeiten werden vor Abschluss gemessen.

Kristalle und Runen wirken bereits als statische Illustration. Optionale kurze Bewegungen dürfen keine Dauerblitze oder notwendige Animation zur Zustandsvermittlung erzeugen. Bewegungspräferenz und reduzierte Bewegung gelten für alle neuen Figuren.

## 7. Datenmodell und Kaufkoordination

Neue Verantwortlichkeiten werden fachlich getrennt: versionierter Katalog, Besitz-/Guthabenprojektion, Kaufkoordination, Figurenauswahl und Darstellung. Die Lernprojektion bleibt einzige Quelle für einmalig verdiente Punkte. Preise werden beim bestätigten Kauf mit Katalogversion festgehalten; spätere Katalogänderungen berechnen alte Käufe nicht neu. Alte Inhalte und ihre Prüfsummen bleiben unverändert.

Ein Kauf enthält mindestens stabile Vorgangs-ID, Kind, Datensatz, gültige Datenepoche, Artikel-ID, Katalogversion, festen Preis, geprüfte Guthabengrundlage und nachvollziehbaren Bestätigungsbeleg. Ein Beleg muss genau einer Abbuchung und einer Besitzübertragung entsprechen. Ein lokales „bereits bezahlt“-Flag genügt nicht. Wiederholung nach Timeout prüft denselben Vorgang, statt eine neue Zahlung anzulegen.

**Technischer Prüfpunkt vor Aktivierung des Shops:** Internetzugang und vorheriges Synchronisieren allein verhindern parallele Ausgaben nicht. Die Umsetzung benötigt einen serialisierten Bestätigungspunkt in Google Drive. Bevorzugt wird ein versionsgeprüfter Kaufkontostand je Kind mit unveränderlicher Beleggeschichte: Eine Aktualisierung gelingt nur für genau die zuvor gelesene Version. Ein konkurrierendes Gerät muss neu lesen und das Guthaben erneut prüfen. Ein nicht eindeutig gebundenes oder widersprüchliches Kaufkonto sperrt Einkäufe; es wird kein zweites Konto mit frischem Guthaben angelegt.

Die benötigte atomare Schreibbedingung ist im vorhandenen Adapter noch nicht implementiert und für den konkret verwendeten Drive-/Browserpfad noch nicht nachgewiesen. Sie ist ein vorgeschalteter technischer Prüfauftrag, keine behauptete API-Eigenschaft. Initialisierung desselben Kontos, parallele Käufe, bereits vorhandener Besitz, abgebrochene Antwort und erneuter Abruf müssen dabei gemeinsam geprüft werden. Gibt es keinen belastbaren Weg, bleibt die Kaufaktion gesperrt und der technische Entwurf wird vor Produktintegration korrigiert. Kein stiller zusätzlicher Backenddienst und kein „letzter Upload gewinnt“ als Ersatz. Unabhängige Bild-/Galeriearbeit kann während dieser Prüfung fortgesetzt werden.

Google dokumentiert vorab erzeugte Datei-IDs und `409 Conflict` bei wiederholtem Anlegen derselben Datei. Das ist eine Grundlage für idempotente Belegdateien, allein jedoch kein Beweis für atomare Abbuchungen mehrerer verschiedener Käufe. [Google: Dateien anlegen und IDs vorab erzeugen](https://developers.google.com/workspace/drive/api/guides/create-file). Die offizielle [files.update-Referenz](https://developers.google.com/workspace/drive/api/reference/rest/v3/files/update) wird für den Prüfauftrag herangezogen; eine nicht belegte Schreibbedingung wird nicht aus der Google-Calendar-API abgeleitet.

Vor der Aktivierung werden Datenformat und Regelversion ausdrücklich weiterentwickelt; alte Avatarereignisse bleiben lesbar und behalten ihre ursprüngliche Bedeutung. Altdaten starten mit dem bisherigen menschlichen Avatar, vorhandenen Farben und Zubehör sowie allen verdienten Punkten. Neue Felder werden nicht in bereits gehashte alte Objekte geschrieben. Die vollständige Migration ist atomar, vorher gesichert und gegen v1/v2-Testdaten geprüft. Alte Programme dürfen neue Käufe weder überschreiben noch ignorierte neue Daten als vollständig abgeglichen ausgeben.

## 8. Sicherung, Rücksetzung und Fehler

Sicherungen umfassen Kaufbelege, Besitz, Figurenwahl und alle Grundlagen des Guthabens. Vor einer Wiederherstellung nennt die Vorschau ausdrücklich die Auswirkungen auf Einkaufsguthaben und Käufe. Wiederherstellung muss zusammen mit dem Kaufkontostand und der aktiven Epoche geplant werden; ein verspäteter Kauf aus einer alten Epoche darf nicht nachträglich das aktuelle Konto belasten. Kauf und Epochenwechsel benötigen deshalb dieselbe Koordinationsgrenze oder einen nachgewiesenen gleichwertigen Schutz. Während ungeklärter Rücksetzung oder widersprüchlicher Epoche bleiben Käufe gesperrt.

Bei Authentifizierungs-, Netz-, Speicher- oder Versionsfehler bleiben Übungsdaten und vorhandener Besitz erhalten. Ein unklarer Kaufstatus zeigt „Kauf wird geprüft“ und lässt keinen zweiten identischen Kauf zu. Abbruch vor einem Kauf ist ohne Ausgabe möglich; nach gesendeter Abbuchung muss zunächst der tatsächliche Ausgang festgestellt werden. Offline speichern oder erneut übertragen darf niemals Startguthaben erneut erzeugen.

## 9. Prüfplan und Reihenfolge

1. Technischen Kaufnachweis getrennt von persönlichen Daten vorbereiten: zwei konkurrierende Clients, zwei Artikel bei Guthaben für nur einen, doppelte Vorgangs-ID, parallele Kontoinitialisierung, Netzabbruch nach angenommener Anfrage und Rücksetzung während eines Kaufs. Echte Drive-Prüfung ausdrücklich als eigener Nachweis kennzeichnen; Mocks genügen nicht zum Nachweis unbekannter Servergarantien.
2. Halskorrektur und Figuren-/Ausstattungskatalog entwickeln. Jede ausgelieferte kompatible Kombination auf Konturen, Hals, Hände, Hörner, Flügel und Verdecken prüfen. Nicht passende Kombinationen können weder ausgewählt noch durch alte gespeicherte Werte erzwungen werden.
3. Neue Datenverträge und Migration mit echten eingefrorenen v1/v2-Grundlagen prüfen: alte Hashes/IDs, Antworten, Punkte, Level, Besitz, Konflikte, späte Daten und Sicherungen erhalten. Gleiches Guthaben unabhängig von Downloadreihenfolge und Wiederholungen.
4. Shop und Galerie mit Kaufvorschau, Preisen, Profilwechsel, Tastatur, 320px-Breite, 200%-Schrift, Touch und reduzierter Bewegung umsetzen. Keine Ausgaben durch bloße Anprobe, Doppelklick oder gescheitertes Speichern.
5. Offline- und Updatefälle unter Wurzel/Unterpfad, fehlende Bilder und begrenzte Downloads prüfen. Den Produktcache bei geänderten Laufzeitdateien kontrolliert versionieren.
6. Vollständige betroffene Regression, unabhängige Review, echte Screenshots, aktualisierte Bedienung/Übergabe und autorisierter Push auf `codex/vokabeltrainer-v1`. Physische iPhone-/iPad-Abnahme weiterhin separat nachweisen.

Noch kein Implementierungsplan und keine Produktänderung. Nach Gesamtfreigabe dieses Entwurfs wird die technische Vorprüfung zuerst konkret geplant, danach die ausführbaren Pakete. Es ist keine weitere Abstimmung der bereits beantworteten Produktfragen nötig; neue technische Evidenz, die einen zugesagten Vertrag unmöglich macht, wird gezielt zurückgemeldet.
