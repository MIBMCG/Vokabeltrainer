# Architektur

## Aktueller Produktstand

Version 1 und die Überarbeitung A1–C2 bleiben die Produktbasis. Das bestätigte
Kaufpaket Tasks 1–6 ist implementiert, geprüft und auf dem Entwicklungszweig
gesichert. Der aktuelle Nachweis steht im
[Abschlussbericht](reports/2026-09-27-persistent-purchases-final.md).

Die lokale Anwendung bleibt eine statische PWA. Seit dem 27.09.2026 ist zusätzlich
die kostenlose Servervariante für automatische Anmeldung privat bereitgestellt.
Deren Grenzen stehen im
[Anmeldeentwurf](superpowers/specs/2026-09-27-server-anmeldung-design.md);
Google-Anmeldung, Verbindung nach F5 sowie der Abgleich mit dem bewusst
gewählten vorhandenen Drive-Bestand sind beobachtet. Die aktive Verbindung
nach vollständigem Chrome-Neustart ist vom Nutzer bestätigt. In einem
getrennten synthetischen Testbereich wurde ein echter Kauf über Google Drive
bestätigt; Besitz, Auswahl und Guthaben sind nach Neuladen erhalten. Der Nutzer
beanstandet die Bestätigungsdauer von über zwei Minuten; die Kaufgeschwindigkeit
ist nicht abgenommen. Der reguläre Tokenablauf und die Geräteprüfung bleiben offen;
Belege und Grenzen stehen in der
[aktuellen Laptop-Übergabe](handoffs/2026-09-28-laptop-fortsetzung.md).
Der Produktcode liegt unter `src/trainer/`; die historische Kaufprobe unter
`src/shop-probe/` ist kein Laufzeitimport. Die Laufzeit setzt die vorhandenen
Commands, ProductSync und RestoreService mit den Modulen unter
`src/trainer/purchases/` zusammen:

- `schema.js`, `value.js`, `basis.js`, `proof.js`, `projection.js` und
  `history.js` definieren und prüfen Belege, Basen, portable Proofs und die
  getrennten Profilkonten.
- `transport.js` bindet jeden Zugriff an Google-Konto, Datensatzordner,
  Descriptorhash, Koordinator und Inhaltsordner.
- `bootstrap.js` reserviert und speichert den vollständigen Einrichtungsauftrag,
  bevor Ordner, Config oder Pointer geschrieben werden.
- `service.js` hält Kauf-, Aktivierungs- und Restoreaufträge im atomaren
  Produktzustand. Sämtliche dauerhaften Änderungen laufen über Commands.
  Die lokal geprüfte Historie ist an Kopf, Binding und Config gekoppelt;
  ein externer Sync/Restore wird auch von derselben Serviceinstanz übernommen.
- `integration.js` stellt die schmalen Ports zwischen Kaufdienst, ProductSync
  und Restore bereit. Die Ports sind lazy und nicht rekursiv: Vorbereitung
  erzeugt nur einen vollständigen Publikationsentwurf; der aufrufende Dienst
  speichert ihn dauerhaft, bevor die erste abhängige Datei oder ein Marker
  veröffentlicht wird.

`main.js` reicht der Oberfläche einen schmalen Commerce-Port mit
`previewActivation()`, `activate(ticket)`, `getView()`, `refresh()`,
`preview(input)`, `confirm(preview)`, `resume(operationId)` und `select(input)`.
`previewActivation()` liefert `{ticket, previewState:{ledger}}`; Ticket und
sichtbares Modell stammen damit aus demselben aktuellen Commands-Stand. Die
Aktivierungsvorschau ist rein lokal. Für die
fachliche Bindung einer Vorschau wird `purchasePreviewStateHash` verwendet;
der vollständige dauerhafte Schreibschutz bleibt `productStateHash`. Die UI
führt weder eine zweite Kaufqueue noch eine zweite wirtschaftliche Autorität.
Der Restore-Vorschauweg bereitet mit `prepareRestorePreview` zuerst die frische
Restorebasis vor und berechnet danach aus dem aktuellen Zustand die
wirtschaftliche Ansicht. Die bestätigte Restoreauswahl wird erst nach
bestätigtem gemeinsamem Kopf und `authoritativeState` gegen dessen Konten
geprüft und vollständig ersetzt; eine leere Auswahl leert den Zielstand.

Der Service Worker verwendet seit Produktcommit `ed36f4d` Cacheversion `v30`;
die Pflichtliste enthält die neuen Laufzeitmodule, vier Drachenbilder und alle
20 kleinen Haut-/Kleidungsbilder
der menschlichen Grundfiguren, aber keine Google-Antworten oder Tokens.
Ein gemeinsamer Darstellungsresolver verbindet die gespeicherte Figurenauswahl
mit den vorhandenen Profilfarben für Avataransicht, Übungsstart und Inselreise.
Der Kauf-Auswahlvertrag bleibt dabei unverändert.

Der Backupdownload erfasst beim Klick einen frischen Commands-Snapshot und
verwendet ihn gemeinsam für Epochenentscheidung und Export. Eine bewusste
Auswahl bei Konflikten ist an die sichtbare Kopfmenge gebunden; Änderungen
verlangen erneute Auswahl. Die bewahrte Erwachsenenansicht verliert dadurch
keine fremden Eingaben. Die Einrichtungsgrenze gilt unmittelbar vor jeder
abhängigen Controlpublikation, auch bei direktem Resume eines alten Auftrags.

Beim Rücklesen einer JSON-Sicherungsdatei fordert der Drive-v3-Client die
optionale `headRevisionId` an und liest Metadaten und Inhalt ohne Browsercache.
Nur wenn die gültige Inhaltsrevision vor und nach dem Lesen gleich ist, darf
die allgemeine Drive-`version` abweichen. Alle übrigen gelieferten
Metadatenfelder werden weiterhin verglichen; ohne gültige Inhaltsrevision gilt
der bisherige strenge Vergleich. Inhalts-Hashes und Bindungsprüfungen bleiben
erhalten. Der echte Anlegeversuch eines getrennten Google-Testbereichs war
zuvor zweimal mit einer Meldung über geänderte Sicherungsmetadaten gescheitert;
das tatsächlich abweichende Feld wurde nicht beobachtet. Unter Cache `v30`
meldete die Oberfläche bei Fortsetzung mit demselben Einrichtungsnamen
„Der Lernbereich wurde angelegt.“ und danach „Vollständig abgeglichen.“
Die Google-Verbindung blieb aktiv. Nach einmaliger Aktivierung wurde dort
„Drache Stufe 2“ für 200 Guthaben echt gekauft. Die Oberfläche zeigte
„Der Kauf ist bestätigt.“, 1.400 verfügbares Guthaben bei unverändert
1.600 Lernpunkten und Level 9. „Drache Stufe 3“ für 400 blieb offen.
Bewusste Auswahl, Besitz und Guthaben sind nach Neuladen bestätigt; dieser
Test ersetzt keine Abnahme mit einem zweiten Gerät.

## Gemeinsame Autorität

Jeder aktivierte Datensatz besitzt genau einen gemeinsamen wirtschaftlichen
Kopf. Derselbe Kopf bestimmt Belegfolge, Besitz, ausgebbares Guthaben und aktive
Produkt-Epoche. Ein lokal heruntergeladener Kandidat, eine alte v1/v2-Epoche
oder ein Cacheeintrag darf diese Autorität nicht ersetzen.

ProductSync führt bei einem gebundenen Kaufbestand zwei getrennte Schritte aus:

1. `commerce.discover` prüft Configref und unveränderliche Config und speichert
   diesen Anker über Commands dauerhaft **vor** dem Produktdownload.
2. `commerce.reconcile` liest anschließend Koordinator, Kopf und vollständige
   Historie. Erst der vollständig geprüfte gemeinsame Kopf wird zusammen mit
   seinem Fachstand atomar aktiviert.

Dadurch bleiben unbestätigte und späte Epochen über Netzwerkfehler,
Metadatencache, Neustart und Datensatzbeitritt hinweg historische Herkunft. Ein
reiner Legacybestand ohne installierten Configanker und ohne v3-Kandidat behält
seinen bisherigen Syncpfad.

## Dauerhafte Veröffentlichung und Recovery

Kauf, Initialisierung und koordinierter Restore speichern zuerst Intent,
Ausgangskopf, opake ETag, Kandidatenref, unveränderliche Uploadclosure,
reservierte Datei-IDs und den späteren Pointerbody. Erst danach beginnt eine
abhängige Netzoperation. Nach einer verlorenen Antwort oder einem Neustart wird
zuerst nachgelesen. Eine Pointerwiederholung erfolgt nur ausdrücklich mit dem
identischen gespeicherten Kandidaten und derselben ETag. Aktivierte Journale
bleiben als Historie erhalten; nur tatsächlich offene fremde Aufträge sperren
eine neue Operation.

Ein Restore hängt genau einen neuen Beleg an und aktiviert erst dessen
bestätigten gemeinsamen Kopf. V1/V2-Dateien und ihre Upload-IDs bleiben
unverändert. Vor der lokalen Migration wird eine validierte Sicherheitskopie
angelegt; lokale Migration und Cloudaktivierung sind getrennte Schritte.

## Versionen und portable Sicherungen

Neue Lernereignisse und Pakete behalten das fachliche Versionspaar `(2,2)`.
`storageVersion:3` bezeichnet ausschließlich den lokalen Produktzustand. Nur
aktivierte Kaufepochen, wirtschaftliche Köpfe und die wirtschaftliche
Sicherungsclosure verwenden Format 3. Die bestehende Datensatzbeschreibung wird
nicht blind auf Version 3 umgeschrieben.

Eine v3-Sicherung enthält die vollständige Lern- und Wirtschaftshistorie,
Basen, Besitz und Figurenauswahl, aber keine Tokens, ETags, Pointerbodies oder
ausführbaren Jobs. Neu offline erworbene Lernpunkte können durch einen neutralen
Provenienzcheckpoint belegt werden. Dieser Checkpoint ist ausschließlich im
Backupexport und im von einer Restore-Quellkante erreichten Quellreplay zulässig.
Die normale Zielhistorie, Discovery, Join und `readHistory` lehnen ihn als Kopf
oder Vorgänger der autoritativen Kette ab. Checkpointlokale und verschachtelte
Objekte werden auch bei gleicher Bindung über reservierte physische IDs
portabel abgebildet; fehlender oder abweichender Proof blockiert den Export.

Es gibt keine feste 64-Belege-Lebenszeitgrenze und keine automatische Löschung.
Die Historie wird vollständig gehasht und iterativ geprüft. Historische
Diagnoseberichte 2–10 erklären die Herleitung, sind aber keine aktuelle
Architektur oder Produktabnahme. Reale Drive-, Zwei-Geräte- und Apple-Nachweise
bleiben offen.

## Aufbau

Die Anwendung ist eine PWA aus HTML, CSS und JavaScript. Die gleiche Anwendung
bietet eine Schüler- und eine Erwachsenenansicht. Im lokalen Browsermodus
sprechen die Geräte Google Drive direkt an. Die optionale Servervariante
vermittelt diese Anfragen unter derselben Herkunft über Cloudflare Workers Free;
D1 hält ausschließlich verschlüsselte Anmeldedaten und Sitzungsmetadaten.
Vokabeln, Lernstände und Käufe bleiben in Google Drive. Kostenpflichtige Dienste
sind nicht vorgesehen.

```text
Elterngerät                          Schülergerät
  Web-App                             Web-App
  lokaler Speicher                    lokaler Speicher
        \                             /
         Google-Drive-API mit OAuth
          gemeinsames Google-Konto
       Vokabeldaten und Lernereignisse
```

Der Programmcode wird getrennt von den persönlichen Lerninhalten bereitgestellt.
Für die Servervariante ist Cloudflare vorgesehen; der historische Vorschlag
GitHub Pages betrifft nur den Browsermodus. Google Drive ist Datenspeicher,
nicht der Hostingort für die Web-App. Die private Testbereitstellung ist unter
`https://vokabeltrainer.marco-civico.workers.dev/trainer/` erreichbar.

## Verantwortlichkeiten

| Bereich | Aufgabe | Darf nicht übernehmen |
| --- | --- | --- |
| Lernlogik | Antworten bewerten, Wiederholungen auswählen, Runde beenden | DOM-Bedienung oder direkte Cloudzugriffe |
| Oberfläche | Profile, Übungsablauf, Rückmeldungen, Verwaltung, Verbindungsstatus | Verdeckte alternative Bewertung oder eigene Syncregeln |
| Lokaler Speicher | Vokabeln, Lernereignisse, Einstellungen und ausstehende Änderungen speichern | Erfolgreichen Cloudupload behaupten |
| Google-Anbindung | Zugriff anfordern, Drive-Dateien lesen/schreiben, Fehler klassifizieren | Datenverlust durch blindes Überschreiben akzeptieren |
| Synchronisation | Lokale und entfernte Änderungen zusammenführen, Wiederholungsversuche steuern | Ein Ereignis mehrfach zählen |
| Kaufprojektion | Guthaben und Besitz je Profil aus vollständigen Lern- und Belegfakten ableiten | Punkte frei übernehmen oder Ausgaben von Lernpunkten abziehen |
| Kaufdienst | Durable Intents, Kandidaten und Wiederaufnahme über Commands steuern | Eine zweite Zustandskopie, Queue oder versteckte Pointerwiederholung führen |
| Kaufintegration | Vollständige Publikationsentwürfe und schmale Sync-/Restoreports liefern | Vor dauerhafter Speicherung Cloudobjekte veröffentlichen |
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

Neue Lernereignisse und Pakete verwenden weiterhin das Versionspaar `(2,2)`.
Unveränderte v1/v2-Objekte behalten ihre IDs, Hüllen und Hashes; vorbereitete
Uploadkörper werden nicht umgeschrieben. `storageVersion:3` ist die lokale
Produktzustandsversion. Aktivierte Kaufepochen und wirtschaftliche
Backupobjekte verwenden das Paar `(3,3)`. Der lokale Übergang validiert zuerst
den vollständigen Originalzustand, erzeugt eine lesbare v1/v2-Sicherung und
speichert Migration und Sicherung gemeinsam atomar. Ein Fehler erhält den
Originalzustand. Unbekannte wohlgeformte Versionspaare stoppen den Abgleich vor
einem Upload; gewöhnlich beschädigte Dateien werden gesondert behandelt.
Datenbank und exklusive Schreibsperre behalten ihre Namen, sodass alte und neue
Tabs nicht gleichzeitig in denselben lokalen Bestand schreiben.

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
9. Bei installiertem Kaufprotokoll Configref und Config vor dem Download dauerhaft entdecken; unbestätigte Epochen nur als Herkunft speichern.
10. Erst den vollständig geprüften gemeinsamen Kaufkopf samt Historie atomar als aktive Epoche übernehmen.
11. Kauf-, Aktivierungs- und Restorekandidaten einschließlich reservierter IDs vor jeder abhängigen Netzoperation speichern; nach unbekanntem Ausgang zuerst lesen.

Ein einfaches „Datei laden, lokal ändern, vollständig hochladen“ ist ohne weiteren Schutz bei zwei Geräten nicht ausreichend. Das Produkt implementiert unveränderliche Ereignispakete, Deduplizierung, kausale Zusammenführung, getrennte Epochen sowie sichtbare Inhalts- und Wiederherstellungskonflikte. Die synthetische Probe bleibt ein begrenzter Prüfstand; ihr [Probe-Datenformat](PROBE-DATENFORMAT.md) ist kein Produkt- oder Sicherungsformat. Reales Drive mit dem Produktprotokoll auf zwei physischen Geräten ist noch nicht nachgewiesen.

Zähler lassen sich nicht immer sinnvoll addieren: Auch Serien richtiger Antworten und Reihenfolgen müssen bei parallelem Offlineüben definiert werden. Geräteuhren allein sind kein sicherer Konfliktentscheid.

## Google-Zugriff

Der Browsermodus verwendet Google Identity Services; die optionale
Serveranmeldung den OAuth-Code-Ablauf. Beide verwenden ausschließlich
`drive.file`. Damit bearbeitet die Anwendung von ihr angelegte oder vom Nutzer
ausdrücklich ausgewählte Dateien. Der Zugriff gilt nicht pauschal für beliebige
vorhandene Dateien in einem ausgewählten Ordner.
[Google: Berechtigungen](https://developers.google.com/workspace/drive/api/guides/api-specific-auth)

`src/trainer/config.js` enthält die vorbereitete öffentliche Web-Client-ID. Eine reine Auswahlfunktion verbindet diese Vorgabe mit der vorhandenen lokalen Konfiguration: gespeicherte IDs und Bindungen bleiben erhalten, Abweichungen werden ausdrücklich erklärt. Der normale Familienablauf benötigt kein technisches ID-Feld. Externe OAuth-Ursprünge, Testnutzer und Hosting sind Betreiberaufgaben, keine automatisch durch einen Code-Push erledigte Einrichtung.

Das Produkt verwendet einen sichtbaren, markierten Trainerordner mit normalen JSON-Dateien. Ein versteckter `appDataFolder` wäre technisch eine andere Variante, dessen Inhalte nicht über die normale Drive-Oberfläche erreichbar und nicht zwischen Konten teilbar sind. Das ist keine umgesetzte Entscheidung. [Google: App-Daten](https://developers.google.com/workspace/drive/api/guides/appdata)

Beide Geräte benötigen dieselbe Anwendungskonfiguration und die Zuordnung zum selben Trainerdatensatz. Ein Dateiname allein ist dafür ungeeignet, weil Drive gleichnamige Dateien zulässt. Die Probe verwendet stabile Drive-Datei-IDs und markierte Ordner; Wiederfinden und Abgleich wurden gegen simulierte Drive-Antworten geprüft. Der Nachweis mit realem Google Drive und zwei Geräten bleibt offen.

## Anmeldung und Offlinebetrieb

Google Identity Services liefert in seinem Browser-Tokenmodell kurzlebige Zugriffstokens. Nach Ablauf kann eine neue Nutzeraktion erforderlich sein. Das Modell bietet der reinen statischen App keinen zugesagten unbegrenzten stillen Zugriff. Client-Secrets oder Service-Account-Schlüssel werden nicht in Browsercode eingebettet. [Google: Tokenmodell](https://developers.google.com/identity/oauth2/web/guides/use-token-model)

Die optionale Servervariante verwendet einen HttpOnly-/Secure-Cookie und
verschlüsselt gespeicherte Refresh-Tokens. Die Sitzung wird beim Start geprüft;
abgelaufene Zugriffstokens werden serverseitig erneuert. Der Browser erhält
keinen Google-Bearer. Proxyziele und Methoden sind begrenzt, Konto-/Datensatz-,
Hash- und ETag-Prüfungen bleiben bestehen. Schreibaufrufe werden nach unklarem
Ausgang nicht blind wiederholt. Normales Abmelden entfernt nur die betreffende
Serversitzung, ein externer Google-Widerruf wird separat erkannt. Der
[Plan](superpowers/plans/2026-09-27-server-anmeldung.md) enthält die konkreten
Schnittstellen und Prüfgrenzen.

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
