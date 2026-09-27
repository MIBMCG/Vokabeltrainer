# Bedienkorrekturen: Updates, Figuren und Verbindungsstatus

Stand: 27.09.2026. Ausgangspunkt: `93a684b` auf
`codex/vokabeltrainer-v1`. Der Nutzer meldete die Fehler beim tatsächlichen
Ausprobieren des integrierten Trainers.

## Auftrag und Ursachen

- Der Hinweis „Neue Programmversion verfügbar“ blieb bestehen, obwohl kein
  Service Worker mehr auf Aktivierung wartete. Der Controller meldete bisher
  ausschließlich verfügbare Updates, nicht deren Verschwinden.
- Die Entdeckerin wurde richtig ausgewählt, aber Übungsstart und Inselreise
  zeichneten ausschließlich den bisherigen klassischen Avatar. Außerdem
  waren dessen Farbeinstellungen nicht mit der menschlichen Grundfigur
  verbunden. „Klassisch“ hatte keine Rückwahlaktion.
- Die Erwachsenenansicht zeigte ein erneutes Google-Anmeldeangebot auch bei
  aktiver Sitzung. Die Erfolgsmeldung eines manuellen Abgleichs war unabhängig
  vom aktuellen Abgleichzustand und konnte einem laufenden Abgleich widersprechen.
- Kaufknöpfe prüften Guthaben und Internet, aber nicht die aktive Google-Sitzung.
  Ein Kauf nach Tokenablauf endete deshalb mit einer technischen Fehlermeldung.
  Ob im konkreten Nutzertest Zeitablauf oder ein früherer 401 ausschlaggebend
  war, ist im Nachhinein nicht belegt. Token bleiben flüchtig; der Kaufpfad
  erhält einen Weg zum ausdrücklichen Wiederverbinden hinter der Eltern-PIN.
- Die Einstellungen zeigten Kinder, PIN, Abgleich, Migration und Sicherung
  untereinander als lange Seite. Der ergänzende Nutzerauftrag verlangt eine
  kompakte, nach Alltagsaufgaben geordnete Erwachsenenansicht mit kurzen
  Erklärungen, sichtbarem Verbindungsstatus und aufklappbaren Details.

Die ergänzende Nutzeranweisung zur Kleidungswahl präzisiert EV03 für die
menschlichen **Grundformen**: Entdeckerin und Entdecker verwenden die
vorhandenen Haut- und Kleidungsfarben. Höhere Entwicklungsformen behalten
ihre festen Outfits; klassisches Zubehör wird weiterhin nicht auf diese Bilder
montiert. Es werden keine neuen Bilder erzeugt und keine Ausrüstungskäufe ergänzt.

## Grenzen

Die Korrekturen verwenden vorhandene Illustrationen und Auswahl-/Lernwerte.
Der gespeicherte Kauf-Auswahlvertrag `{profileId, figureId, stage}` bleibt
unverändert. Es gibt keine neue Datenmigration, kein neues Google-Konto und
keine Änderung an Preisen oder Punktevergabe.

Die kostenlose Entdeckerin ist im eingerichteten Figurenbereich vorhanden.
Die weitergehende Auswahl dieser Grundfiguren bereits vor der Einrichtung
des Kauf-/Drive-Bestands bleibt eine bekannte Lücke gegenüber AV01; sie wird
nicht durch ungeprüfte Kaufberechtigungen in der Darstellung überdeckt.

Persönliche Browserdaten, Tokens und Lernstände werden weder verändert noch
als Testdaten oder Git-Dateien übernommen. Browserprüfungen verwenden eigene
kurzlebige Profile und eine künstliche Google-Grenze.

## Prüfung und Übergabe

Umgesetzt wurden eine gemeinsame Figurendarstellung, explizite Klassisch-Rückwahl,
direkt erreichbare Farben für menschliche Grundformen und ein wahrheitsgemäßer
Update-/Verbindungsstatus. Kaufaktionen bieten bei fehlender Sitzung einen
PIN-geschützten Weg zu den Google-Einstellungen. Die fünf Einstellungsaufgaben
bleiben nach dem Speichern im gewählten Öffnungszustand. Die Google-Statuszeile
wird getrennt aktualisiert; andere offene Eingaben bleiben erhalten.

Der lokale Server und der Pflichtcache enthalten jetzt alle 20 kleinen
menschlichen Farbvarianten. Produktcache `v26`, synthetischer Updatekandidat
`v27`. Im Browserfall werden tatsächlich dekodierte Bilder geprüft, nicht
nur vorhandene Bild-Elemente.

| Frischer Nachweis | Ergebnis |
| --- | --- |
| `npm test` | 519/519 bestanden, 83,504 s |
| vollständiger Lauf der acht Browserdateien | 46/49 bestanden, drei überholte Testschritte für aufklappbare Gruppen, 198,072 s |
| korrigierte Kinder-/Statistik-Testselektoren | 2/2 bestanden, 3,225 s |
| korrigierter Sicherungs-/Fortsetzungs-Testschritt | 1/1 bestanden, 6,338 s |
| Avatar-Nachprüfung einschließlich zusätzlicher Reviewregression | 2/2 bestanden, 3,784 s |
| aktueller abgedeckter Browserumfang | alle 50 Fälle erfolgreich geprüft; keine offenen Testfehler |
| Dokumentation und `git diff --check` | ohne Fehler |

Der Gesamtlauf hatte die beiden alten Kinder-Selektoren bereits geladen,
während deren präzisierte Fassungen abgeschlossen wurden. Der dritte Fehler
war ein nach Neuladen noch nicht aufgeklappter Sicherungsbereich im Test.
Die drei Nachläufe ändern keine fachlichen Erwartungen und umgehen keine
Bedienelemente mit erzwungenen Klicks. Frühere 506/43-Testzahlen gehören zum
vorherigen Kaufpaket und sind kein Nachweis dieser Änderungen.

Die neuen Browserfälle prüfen Update-Aktivierung aus einem zweiten Tab ohne
Entwurfsverlust, Farben und Auswahl samt Offline-Neustart/Profiltrennung,
wechselnde Abgleichzustände, Einstellungen bei 390 Pixeln und mit Tastatur
sowie Anmeldung vor und während einer Kaufprüfung. Der echte Produktweg
Shop → PIN → Google-Einstellungen → erneute Anmeldung → Kaufvorschau wurde
ebenfalls an der simulierten Google-Grenze geprüft. Synthetische Sichtbilder
der Einstellungen bei 390 und 1280 Pixeln wurden kontrolliert.

Während der unabhängigen Prüfung fiel noch auf, dass das klassische Farbformular
nach dem Speichern zuklappte und den Fokus zum anderen Farbformular verschob.
Eine gezielte Browserregression reproduzierte dies zunächst rot. Formgebundener
Fokus, erhaltene Öffnung und Fehlerhinweise direkt am betroffenen Formular
wurden anschließend grün nachgeprüft.

Ein zweiter kleiner Reviewbefund betraf schnelle Farbwechsel zwischen beiden
Formularen während eines noch offenen Speichervorgangs. Beide Formulare werden
nun gemeinsam kurz gesperrt und bei Speicherfehler mit ihren vorherigen
Freischaltungen wieder freigegeben. Ein verzögertes synthetisches `setAvatar`
reproduzierte den Fehler zunächst rot; anschließend bestanden beide
Avatarbrowserfälle. Die unabhängige Nachprüfung hat beide Befunde geschlossen;
im vereinbarten Prüfumfang gibt es keine offenen Findings.

Der persönliche lokale Server wurde nach eindeutiger Prozess- und
Quelltextzuordnung aus dem bestehenden Checkout neu gestartet. Trainerseite,
neues Darstellungsmodul und eine zusätzliche weibliche Kleidungsvariante
antworteten danach mit HTTP 200. Die persönliche Browserseite wurde nicht
automatisch neu geladen; offene Eingaben und Browserdaten bleiben erhalten.

Ausführung der Browserdateien und Laufzeitvoraussetzungen:
[Browseranleitung](../../tests/browser/README.md). Die gezielten Nachläufe
verwenden `--test-name-pattern` mit `learning rules stay separate|learning
statistics stay per child` beziehungsweise `trainer sync and restore keeps
concurrent word versions`. Rohprotokolle und synthetische Sichtbilder liegen
lokal unter `.superpowers/sdd/2026-09-27-bedienkorrekturen/`; persönliche Daten
sind nicht Bestandteil der Nachweise.

Portable Fortsetzung: [aktuelle Übergabe](../handoffs/2026-09-27-bedienkorrekturen.md).

Umsetzung: GPT-5.6 Sol mit mittlerer Denktiefe für Update-/Statuskorrekturen;
GPT-5.6 Sol mit hoher Denktiefe für die gemeinsame Figurendarstellung.
Unabhängige begrenzte Codeprüfung: GPT-6 Sol mit hoher Denktiefe.
