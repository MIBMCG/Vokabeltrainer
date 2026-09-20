# Architektur

## Ergänzung: Entwicklungsformen und isolierte Kaufprobe

Der [Grundlagenentwurf](superpowers/specs/2026-09-20-avatar-evolution-foundation.md) trennt Formkennungen und kostenlose menschliche Bildvarianten. Das reine Katalogmodul ist implementiert, wird aber noch nicht vom Produkt importiert. Die ersten vier Drachenquellen sind geprüft; Produktdatenmigration, Kaufbelege und Auswahlzustand bleiben ein eigenes Folgepaket.

Der [Shop-Probe-v5-Entwurf](superpowers/specs/2026-09-20-shop-probe-v5.md) prüft einen kohärenten Drive-v2-Schreibkandidaten ausschließlich mit eigenen synthetischen Daten. Der echte Diagnose-6-Bericht ergibt inzwischen 6 bestandene und 5 fehlgeschlagene Szenarien, weiterhin ohne Gesamtnachweis sicherer Kaufkoordination. [Auswertung](reports/2026-09-20-shop-v6-reallauf.md). Ein lokaler oder einzelner realer Probe-Erfolg aktiviert keine Produktkäufe. Klassische Gestaltung, Lernereignisse und bestehende Synchronisation bleiben davon getrennt.

Der Nutzer hat aus der [Architekturvorlage A/B/C](design/2026-09-20-kaufkoordination-nach-diagnose6.md) **C** gewählt: direkte Drive-Koordination gezielt weiter untersuchen. Ein Apps-Script-Backend und eine Änderung des Punktesystems sind damit nicht gewählt. Der [begrenzte Diagnose-7-Schritt](superpowers/plans/2026-09-20-shop-probe-v7-invalid-token.md) trennt Schreibausgang und Nachlese des Negativfalls; bestehende Snapshot-Guards bleiben erhalten. Maßgeblich ist die [aktuelle Übergabe](handoffs/2026-09-20-shop-v9-auswertung.md).
Der [echte Bericht 7](reports/2026-09-20-shop-v7-reallauf.md) erreicht den bedingten Schreibversuch wegen instabiler Erstellungsnachlese nicht. Die [Diagnose-8-Lesekontrolle](superpowers/plans/2026-09-20-shop-probe-v8-read-observation.md) darf deshalb ausschließlich Beobachtungen liefern, keine gültigen Snapshots oder Produktkaufgrundlage. Der normale Transportguard bleibt unverändert.

Der [echte Bericht 8](reports/2026-09-20-shop-v8-reallauf.md) grenzt die Versionsänderung auf das Medienfenster ein. Der [Diagnose-9-Metadatenversuch](superpowers/plans/2026-09-20-shop-probe-v9-metadata-coordination.md) lässt Medienzugriffe vollständig weg und prüft einen gebundenen, cachefreien v2-Ordner-Snapshot gegen falsche, verbrauchte und konkurrierende Schreibkennungen. Kleine private Marker dienen nur als synthetische Koordinationswerte, nicht als Produktguthaben. Ein Verweis auf unveränderliche Inhaltsdateien bleibt eine spätere Architekturhypothese; dieser Versuch implementiert sie nicht und belegt weder Wiederanlauf noch sichere Käufe.

**Befund vom 20.09.2026:** [Bericht 9](reports/2026-09-20-shop-v9-reallauf.md) enthält 3 bestandene und 1 fehlgeschlagenen Check. Die Ordner-Metadatenänderung mit verbrauchter Kennung wird abgewiesen; im Parallelfall gibt es genau einen bestätigten und nachgelesenen Gewinner. Der künstliche Token ergibt 500 statt 412 und bleibt ungeklärt. Das stützt die Weiterentwicklung des schmalen Kandidaten, beweist aber keinen gesamten Kaufvertrag. Nächste technische Aufgabe ist dessen Entwurf mit unveränderlichem Inhalt, eindeutiger gemeinsamer Initialisierung, dauerhafter Vorgangskennung und Belegkette sowie gemeinsamer Epochen-/Kaufgrenze. Der bestehende Produktadapter und seine Guards sind unverändert; kein zusätzlicher Dienst ist gewählt.

## Aktuelle Umsetzung vom 19.09.2026

Der [Überarbeitungsplan](superpowers/plans/2026-09-19-ueberarbeitung.md) und der [Produkt-Datenvertrag v1/v2](PRODUKT-DATENFORMAT.md) konkretisieren den bestätigten Entwurf. Die Produkt-App ist getrennt von der Probe unter `trainer/` umgesetzt, mit eigenen Lernereignissen, Inhaltsfassungen, Datenepochen, Browserdaten und Drive-Kennungen. Die aktuelle Implementierung ergänzt Rasterbilder, vorbereiteten Google-Zugang, Regeln je Kind und gemeinsame Statistikprojektionen. Prüfbelege stehen im [Arbeitsstand](../ARBEITSSTAND.md); der [v1-Abschluss](reports/2026-09-18-vokabeltrainer-v1.md) bleibt historische Grundlage.

Der Nutzer bestätigte die echte Google-Anmeldung und den Probe-Abgleich zwischen zwei Browsern desselben Rechners. Physische Zwei-Geräte- und Apple-Abnahme folgen ausdrücklich erst nach der vollständigen Umsetzung. Eine bereitgestellte HTTPS-App und neue Cloudkontenänderungen sind damit nicht automatisch beauftragt.


Die verbindlichen Nutzeranforderungen stehen in [ANFORDERUNGEN.md](ANFORDERUNGEN.md). Implementierung, automatisierte Prüfung und physische Geräteabnahme bleiben getrennte Nachweisstufen.

Die Ergänzungen E01–E10 sind im [bestätigten Gesamtentwurf](superpowers/specs/2026-09-16-vokabeltrainer-design.md) zusammengeführt. Er präzisiert diesen Architekturüberblick. Erste Umsetzung: [Plan der Google-Drive-Probe](superpowers/plans/2026-09-16-google-drive-probe.md), mit separatem synthetischem Datenformat und ohne fertige Produktfunktionen.

## Aufbau

Die Anwendung ist eine statisch bereitstellbare PWA aus HTML, CSS und JavaScript. Die gleiche Anwendung bietet eine Schüler- und eine Erwachsenenansicht. Die Geräte sprechen Google Drive direkt über dessen API an; ein eigener kostenpflichtiger Server ist nicht vorgesehen.

```text
Elterngerät                          Schülergerät
  Web-App                             Web-App
  lokaler Speicher                    lokaler Speicher
        \                             /
         Google-Drive-API mit OAuth
          gemeinsames Google-Konto
       Vokabeldaten und Lernereignisse
```

Der Programmcode wird getrennt von den persönlichen Lerninhalten bereitgestellt. GitHub Pages ist dafür vorgeschlagen, aber noch nicht aktiviert. Google Drive ist Datenspeicher, nicht der Hostingort für die Web-App.

## Verantwortlichkeiten

| Bereich | Aufgabe | Darf nicht übernehmen |
| --- | --- | --- |
| Lernlogik | Antworten bewerten, Wiederholungen auswählen, Runde beenden | DOM-Bedienung oder direkte Cloudzugriffe |
| Oberfläche | Profile, Übungsablauf, Rückmeldungen, Verwaltung, Verbindungsstatus | Verdeckte alternative Bewertung oder eigene Syncregeln |
| Lokaler Speicher | Vokabeln, Lernereignisse, Einstellungen und ausstehende Änderungen speichern | Erfolgreichen Cloudupload behaupten |
| Google-Anbindung | Zugriff anfordern, Drive-Dateien lesen/schreiben, Fehler klassifizieren | Datenverlust durch blindes Überschreiben akzeptieren |
| Synchronisation | Lokale und entfernte Änderungen zusammenführen, Wiederholungsversuche steuern | Ein Ereignis mehrfach zählen |
| PWA/Offlinefunktion | Programmdateien zwischenspeichern und Updates kontrolliert übernehmen | Dauerhafte Hintergrundausführung voraussetzen |

Probe und Produkt setzen E01 mit nativen JavaScript-Modulen ohne UI-Framework und ohne Buildschritt um. Node.js ab 22.8 führt Tests und lokalen Server aus; npm-Laufzeitabhängigkeiten gibt es nicht.

## Datenmodell und Versionsübergang

Die strikte Validierung und der Migrationsvertrag sind in [PRODUKT-DATENFORMAT.md](PRODUKT-DATENFORMAT.md) festgelegt und implementiert. Die fachlichen Objekte sind:

| Objekt | Informationen | Grund |
| --- | --- | --- |
| Datensatz | Formatversion, stabile Datensatz-ID | Import, Wiederfinden und spätere Migration |
| Lernprofil | Stabile Profil-ID, Anzeigename, Einstellungen | Getrennte Fortschritte beim gemeinsamen Google-Zugang |
| Wortliste | Stabile Listen-ID, Titel, Erstell-/Änderungsinformationen | Auswahl von Lektionen und Verwaltung |
| Vokabel | Stabile Vokabel-ID, deutscher Text, erlaubte englische Antwort(en), Listenzuordnung, Bearbeitungsstand | Eindeutige Bewertung und Bearbeitung ohne Verwechslung |
| Lernereignis | Eindeutige Ereignis-ID, Profil-/Vokabel-ID, Sitzungs-/Gerätebezug, Zeit und Ergebnis, verwendeter Vokabelstand | Nachvollziehbare und nicht doppelt gezählte Versuche |
| Fortschrittsansicht | Versuchszahl, richtige/falsche Antworten, letzte Übung, aktuelle Serie und Wiederholungsstatus | Anzeige und Auswahl; möglichst aus Ereignissen ableitbar |
| Übertragungsstatus | Noch nicht bestätigte Änderungen und letzte erfolgreiche Synchronisation | Offlinebetrieb und verlässliche Rückmeldung |

Getippter Antworttext bleibt in der lokalen Runde; synchronisiert werden bewertetes Ergebnis und Vokabelrevision. Das gemeinsame Belohnungssystem ist mit R11/R23/R24 gewählt; Schwellen und Inhalte stehen als E04 im Gesamtentwurf.

Neue Austauschobjekte verwenden das Versionspaar `(2,2)`. Unveränderte v1-Objekte behalten ihre IDs, Hüllen und Hashes; vorbereitete Uploadkörper werden nicht umgeschrieben. Der lokale Übergang validiert zuerst den vollständigen Originalzustand, erzeugt eine lesbare v1-Sicherung (bei mehreren Epochenköpfen je Kopf) und speichert Migration und Sicherungen gemeinsam atomar. Ein Fehler erhält den Originalzustand. Unbekannte wohlgeformte Versionspaare stoppen den Abgleich vor einem Upload; gewöhnlich beschädigte Dateien werden gesondert behandelt. Datenbank und exklusive Schreibsperre behalten ihre Namen, sodass alte und neue Tabs nicht gleichzeitig in denselben lokalen Bestand schreiben.

Lernregeln und Wiederaktivierungen sind eigene v2-Ereignisse. Die deterministische Wiederholungsprojektion ist von der unveränderten Belohnungsprojektion getrennt. Neue Runden frieren Regelwerte und Wortgenerationen ein; bereits offene v1-Runden behalten ihre Legacy-Planung. Späte Antworten einer früheren Generation bleiben einmalig für Versuche und Punkte erhalten, verändern aber nicht die neue Wiederholungsserie. Sicherung und Übernahme schließen notwendige Regel-/Generationsreferenzen transitiv ein; reine Unterstützung wird nicht zum aktuellen Gewinner.

Statistik, Punkte und Wiederholungsplanung nutzen dieselben deduplizierten effektiven Antwortfakten. Tagesstatistiken verwenden den gespeicherten fachlichen Lerntag. Aktuelle Wortgruppen und historische Zeitraumantworten bleiben fachlich und sichtbar getrennt. Der Browserrenderer berechnet weder eine zweite Wiederholungslogik noch eigene Konfliktgewinner.

## Synchronisation

Das implementierte Protokoll folgt diesen Grundregeln:

1. Antworten zuerst lokal dauerhaft speichern; ein Netzfehler darf die Übung nicht verlieren lassen.
2. Uploads bündeln, statt nach jedem Tastendruck eine Datei zu übertragen.
3. Bei geöffneter App mit gültigem Zugriff Änderungen automatisch senden und neue Vokabeln übernehmen.
4. Fehlgeschlagene Übertragungen mit begrenzten Wiederholungen und Wartezeiten erneut versuchen.
5. Bereits übertragene Ereignisse anhand stabiler IDs erkennen; erneutes Senden darf keine Zusatzpunkte oder doppelten Versuche erzeugen.
6. Parallele Änderungen erkennen. Bei widersprüchlichen Vokabeländerungen gemäß R29 beide Fassungen erhalten, Unterschiede in der Erwachsenenansicht zeigen und dort die richtige Fassung auswählen lassen. Keine automatische Auswahl nach der Übertragungsreihenfolge. Konfliktbehaftete Wörter bleiben bis zur Klärung außerhalb der normalen Wortauswahl.
7. Konto-/Datensatzwechsel darf keine ausstehenden Änderungen in ein anderes Konto hochladen.
8. Cloudlöschungen und beschädigte Dateien nicht als leeren, gültigen Ersatz über lokale Daten schreiben.

Ein einfaches „Datei laden, lokal ändern, vollständig hochladen“ ist ohne weiteren Schutz bei zwei Geräten nicht ausreichend. Das Produkt implementiert unveränderliche Ereignispakete, Deduplizierung, kausale Zusammenführung, getrennte Epochen sowie sichtbare Inhalts- und Wiederherstellungskonflikte. Die synthetische Probe bleibt ein begrenzter Prüfstand; ihr [Probe-Datenformat](PROBE-DATENFORMAT.md) ist kein Produkt- oder Sicherungsformat. Reales Drive mit dem Produktprotokoll auf zwei physischen Geräten ist noch nicht nachgewiesen.

Zähler lassen sich nicht immer sinnvoll addieren: Auch Serien richtiger Antworten und Reihenfolgen müssen bei parallelem Offlineüben definiert werden. Geräteuhren allein sind kein sicherer Konfliktentscheid.

## Google-Zugriff

Die App verwendet Google Identity Services für den Browser und die Drive-API mit `drive.file`. Damit bearbeitet die Anwendung von ihr angelegte oder vom Nutzer ausdrücklich ausgewählte Dateien. Der Zugriff gilt nicht pauschal für beliebige vorhandene Dateien in einem ausgewählten Ordner. [Google: Berechtigungen](https://developers.google.com/workspace/drive/api/guides/api-specific-auth)

`src/trainer/config.js` enthält die vorbereitete öffentliche Web-Client-ID. Eine reine Auswahlfunktion verbindet diese Vorgabe mit der vorhandenen lokalen Konfiguration: gespeicherte IDs und Bindungen bleiben erhalten, Abweichungen werden ausdrücklich erklärt. Der normale Familienablauf benötigt kein technisches ID-Feld. Externe OAuth-Ursprünge, Testnutzer und Hosting sind Betreiberaufgaben, keine automatisch durch einen Code-Push erledigte Einrichtung.

Das Produkt verwendet einen sichtbaren, markierten Trainerordner mit normalen JSON-Dateien. Ein versteckter `appDataFolder` wäre technisch eine andere Variante, dessen Inhalte nicht über die normale Drive-Oberfläche erreichbar und nicht zwischen Konten teilbar sind. Das ist keine umgesetzte Entscheidung. [Google: App-Daten](https://developers.google.com/workspace/drive/api/guides/appdata)

Beide Geräte benötigen dieselbe Anwendungskonfiguration und die Zuordnung zum selben Trainerdatensatz. Ein Dateiname allein ist dafür ungeeignet, weil Drive gleichnamige Dateien zulässt. Die Probe verwendet stabile Drive-Datei-IDs und markierte Ordner; Wiederfinden und Abgleich wurden gegen simulierte Drive-Antworten geprüft. Der Nachweis mit realem Google Drive und zwei Geräten bleibt offen.

## Anmeldung und Offlinebetrieb

Google Identity Services liefert in seinem Browser-Tokenmodell kurzlebige Zugriffstokens. Nach Ablauf kann eine neue Nutzeraktion erforderlich sein. Das Modell bietet der reinen statischen App keinen zugesagten unbegrenzten stillen Zugriff. Client-Secrets oder Service-Account-Schlüssel werden nicht in Browsercode eingebettet. [Google: Tokenmodell](https://developers.google.com/identity/oauth2/web/guides/use-token-model)

Ohne Verbindung oder gültigen Google-Zugriff bleiben bereits gespeicherte Vokabeln nutzbar. Die Oberfläche unterscheidet die fachlichen Zustände „Auf diesem Gerät gespeichert“, „Abgleich ausstehend“, „Mit Google verbinden“, „Abgeglichen“ und „Abgleich fehlgeschlagen“.

Probe und Produkt halten ihre explizit aufgeführten Programmdateien mit getrennten Service Workern offline vor. Der Produktcache ist versioniert und auf seinen Scope begrenzt; Updates berücksichtigen laufende Runden, offenen Antworttext, Rückmeldung, Verwaltungsentwürfe und PIN-Zustand. Automatisiert sind Offline-Neustarts mit geschlossenem Testserver unter Wurzel- und Unterpfad sowie ein verzögerter Workerwechsel geprüft. iOS-Hintergrundausführung ersetzt nicht den Abgleich bei geöffneter App. Browserdaten können gelöscht werden; lokaler Speicher ist keine unabhängige Sicherung. [MDN: Offlinebetrieb](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation), [WebKit: Speicherverhalten](https://webkit.org/blog/14403/updates-to-storage-policy/)

18 Raster-Grundbilder werden in jeweils drei WebP-Größen ausgeliefert. Nur die kleinen Grundvarianten sind Pflichtbestandteil des Offlinepakets (im finalen Bildsatz zusammen rund 319 KiB); größere Varianten werden bedarfsweise geladen. Bei einem Ladefehler wechselt die Darstellung einmalig auf die Grundauflösung und entfernt konkurrierende Größenquellen. Alle Avatarteile verwenden dieselbe ausgerichtete transparente Leinwand. [Quellen und Ableitungen](reports/2026-09-19-illustrationen.md) halten Prompts, Herkunft, Größen und Prüfsummen fest; neue Bildvarianten dürfen diese Ausrichtung nicht still ändern.

R30/R33 ergänzen den Abgleich um eine vollständige JSON-Sicherung zum Herunterladen und Wiederherstellen im Erwachsenenbereich. Die Umsetzung prüft Datenformat und Version vollständig, zeigt eine Vorschau und verlangt Bestätigung. Vor der Rücksetzung wird der aktuelle Stand separat gesichert; danach übernimmt eine neue Epoche den Sicherungsstand auch über Google Drive. Google-Tokens und Zugangsdaten gehören nicht in die Datei. Verspätete Offlineänderungen bleiben separat erhalten und können bewusst übernommen werden.

## Frühe Machbarkeitsprüfung

Lokal und mit simulierter Google-Grenze sind die vollständige Produktoberfläche, IndexedDB, Offline-Start, wiederholte Übertragung, Kontobindung, Konfliktlösung und Rücksetzpfade geprüft. Extern noch nachweisen:

- Google verbinden, synthetische Datei anlegen, auf dem zweiten Gerät wiederfinden und ändern.
- Safari-Tab und installierte Home-Bildschirm-App getrennt testen.
- Abgelaufenen Zugriff, abgebrochenen Dialog, verweigerte Berechtigung und fehlendes Netz behandeln.
- Nach Offlineübung lokale Änderungen erhalten und nach erneutem Verbinden genau einmal übertragen.
- Ein Neustart der App darf nicht versehentlich einen zweiten unabhängigen Trainerdatensatz anlegen.

Ein negativer Befund führt zu einer konkreten Rücksprache über die betroffene technische Entscheidung. Er rechtfertigt weder heimliche Zusatzkosten noch eine stillschweigende Umstellung auf manuellen Dateiaustausch.
