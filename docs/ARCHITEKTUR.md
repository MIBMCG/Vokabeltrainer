# Technischer Entwurf
## Aktuelle Umsetzung ab 17.09.2026

Der [v1-Umsetzungsplan](superpowers/plans/2026-09-17-vokabeltrainer-v1.md) und der [Produkt-Datenvertrag](PRODUKT-DATENFORMAT.md) konkretisieren den bestätigten Entwurf. Die Produkt-App ist getrennt von der Probe unter `trainer/` umgesetzt, mit eigenen Lernereignissen, Inhaltsfassungen, Datenepochen, Browserdaten und Drive-Kennungen. Die folgenden ursprünglichen Architekturüberlegungen bleiben als Begründung erhalten; Aussagen wie „noch kein Schema“ beschreiben den historischen Stand vor diesem Vertrag. Implementierungsnachweise stehen im [Abschlussbericht](reports/2026-09-18-vokabeltrainer-v1.md).

Der Nutzer bestätigte die echte Google-Anmeldung und den Probe-Abgleich zwischen zwei Browsern desselben Rechners. Physische Zwei-Geräte- und Apple-Abnahme folgen ausdrücklich erst nach der vollständigen Umsetzung. Eine bereitgestellte HTTPS-App und neue Cloudkontenänderungen sind damit nicht automatisch beauftragt.


Stand: 17.09.2026. **Bestätigte Architekturgrundlage; Implementierungs- und Prüfstatus im Arbeitsstand.** Die verbindlichen Nutzeranforderungen stehen in [ANFORDERUNGEN.md](ANFORDERUNGEN.md).

Die Ergänzungen E01–E10 sind im [bestätigten Gesamtentwurf](superpowers/specs/2026-09-16-vokabeltrainer-design.md) zusammengeführt. Er präzisiert diesen Architekturüberblick. Erste Umsetzung: [Plan der Google-Drive-Probe](superpowers/plans/2026-09-16-google-drive-probe.md), mit separatem synthetischem Datenformat und ohne fertige Produktfunktionen.

## Aufbau

Vorgesehen ist eine statisch bereitgestellte PWA aus HTML, CSS und JavaScript. Die gleiche Anwendung bietet eine Schüler- und eine Erwachsenenansicht. Die Geräte sprechen Google Drive direkt über dessen API an; ein eigener kostenpflichtiger Server ist nicht vorgesehen.

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

## Vorgeschlagene Verantwortlichkeiten

| Bereich | Aufgabe | Darf nicht übernehmen |
| --- | --- | --- |
| Lernlogik | Antworten bewerten, Wiederholungen auswählen, Runde beenden | DOM-Bedienung oder direkte Cloudzugriffe |
| Oberfläche | Profile, Übungsablauf, Rückmeldungen, Verwaltung, Verbindungsstatus | Verdeckte alternative Bewertung oder eigene Syncregeln |
| Lokaler Speicher | Vokabeln, Lernereignisse, Einstellungen und ausstehende Änderungen speichern | Erfolgreichen Cloudupload behaupten |
| Google-Anbindung | Zugriff anfordern, Drive-Dateien lesen/schreiben, Fehler klassifizieren | Datenverlust durch blindes Überschreiben akzeptieren |
| Synchronisation | Lokale und entfernte Änderungen zusammenführen, Wiederholungsversuche steuern | Ein Ereignis mehrfach zählen |
| PWA/Offlinefunktion | Programmdateien zwischenspeichern und Updates kontrolliert übernehmen | Dauerhafte Hintergrundausführung voraussetzen |

Probe und Produkt setzen E01 mit nativen JavaScript-Modulen ohne UI-Framework und ohne Buildschritt um. Node.js ab 22.8 führt Tests und lokalen Server aus; npm-Laufzeitabhängigkeiten gibt es nicht.

## Datenmodell als Diskussionsgrundlage

Noch kein JSON-Schema oder Migrationsvertrag ist freigegeben. Für den Entwurf werden folgende fachliche Objekte benötigt:

| Objekt | Vorgesehene Informationen | Grund |
| --- | --- | --- |
| Datensatz | Formatversion, stabile Datensatz-ID | Import, Wiederfinden und spätere Migration |
| Lernprofil | Stabile Profil-ID, Anzeigename, Einstellungen | Getrennte Fortschritte beim gemeinsamen Google-Zugang |
| Wortliste | Stabile Listen-ID, Titel, Erstell-/Änderungsinformationen | Auswahl von Lektionen und Verwaltung |
| Vokabel | Stabile Vokabel-ID, deutscher Text, erlaubte englische Antwort(en), Listenzuordnung, Bearbeitungsstand | Eindeutige Bewertung und Bearbeitung ohne Verwechslung |
| Lernereignis | Eindeutige Ereignis-ID, Profil-/Vokabel-ID, Sitzungs-/Gerätebezug, Zeit und Ergebnis, verwendeter Vokabelstand | Nachvollziehbare und nicht doppelt gezählte Versuche |
| Fortschrittsansicht | Versuchszahl, richtige/falsche Antworten, letzte Übung, aktuelle Serie und Wiederholungsstatus | Anzeige und Auswahl; möglichst aus Ereignissen ableitbar |
| Übertragungsstatus | Noch nicht bestätigte Änderungen und letzte erfolgreiche Synchronisation | Offlinebetrieb und verlässliche Rückmeldung |

E01/E10 schlagen vor, den getippten Text nur für die lokale Rückmeldung zu speichern; für synchronisierte Zähler und Wiederholungen genügt das bewertete Ergebnis mit Vokabelrevision. Das gemeinsame Belohnungssystem ist mit R11/R23/R24 gewählt; konkrete Schwellen und Inhalte stehen als E04 im Gesamtentwurf.

## Synchronisation

Vorgeschlagene Grundregeln, die vor Umsetzung in ein konkretes Protokoll überführt werden müssen:

1. Antworten zuerst lokal dauerhaft speichern; ein Netzfehler darf die Übung nicht verlieren lassen.
2. Uploads bündeln, statt nach jedem Tastendruck eine Datei zu übertragen.
3. Bei geöffneter App mit gültigem Zugriff Änderungen automatisch senden und neue Vokabeln übernehmen.
4. Fehlgeschlagene Übertragungen mit begrenzten Wiederholungen und Wartezeiten erneut versuchen.
5. Bereits übertragene Ereignisse anhand stabiler IDs erkennen; erneutes Senden darf keine Zusatzpunkte oder doppelten Versuche erzeugen.
6. Parallele Änderungen erkennen. Bei widersprüchlichen Vokabeländerungen gemäß R29 beide Fassungen erhalten, Unterschiede in der Erwachsenenansicht zeigen und dort die richtige Fassung auswählen lassen. Keine automatische Auswahl nach der Übertragungsreihenfolge. Zustand ungeklärter Vokabeln und Zusammenführung kompatibler Änderungen im Detaildesign festlegen.
7. Konto-/Datensatzwechsel darf keine ausstehenden Änderungen in ein anderes Konto hochladen.
8. Cloudlöschungen und beschädigte Dateien nicht als leeren, gültigen Ersatz über lokale Daten schreiben.

Ein einfaches „Datei laden, lokal ändern, vollständig hochladen“ ist ohne weiteren Schutz bei zwei Geräten nicht ausreichend. Das Produkt implementiert unveränderliche Ereignispakete, Deduplizierung, kausale Zusammenführung, getrennte Epochen sowie sichtbare Inhalts- und Wiederherstellungskonflikte. Die synthetische Probe bleibt ein begrenzter Prüfstand; ihr [Probe-Datenformat](PROBE-DATENFORMAT.md) ist kein Produkt- oder Sicherungsformat. Reales Drive mit dem Produktprotokoll auf zwei physischen Geräten ist noch nicht nachgewiesen.

Zähler lassen sich nicht immer sinnvoll addieren: Auch Serien richtiger Antworten und Reihenfolgen müssen bei parallelem Offlineüben definiert werden. Geräteuhren allein sind kein sicherer Konfliktentscheid.

## Google-Zugriff

Als erster Ansatz sind Google Identity Services für den Browser und die Drive-API mit `drive.file` vorgesehen. Damit bearbeitet die Anwendung von ihr angelegte oder vom Nutzer ausdrücklich ausgewählte Dateien. Der Zugriff gilt nicht pauschal für beliebige vorhandene Dateien in einem ausgewählten Ordner. [Google: Berechtigungen](https://developers.google.com/workspace/drive/api/guides/api-specific-auth)

Das Produkt verwendet einen sichtbaren, markierten Trainerordner mit normalen JSON-Dateien. Ein versteckter `appDataFolder` wäre technisch eine andere Variante, dessen Inhalte nicht über die normale Drive-Oberfläche erreichbar und nicht zwischen Konten teilbar sind. Das ist keine umgesetzte Entscheidung. [Google: App-Daten](https://developers.google.com/workspace/drive/api/guides/appdata)

Beide Geräte benötigen dieselbe Anwendungskonfiguration und die Zuordnung zum selben Trainerdatensatz. Ein Dateiname allein ist dafür ungeeignet, weil Drive gleichnamige Dateien zulässt. Die Probe verwendet stabile Drive-Datei-IDs und markierte Ordner; Wiederfinden und Abgleich wurden gegen simulierte Drive-Antworten geprüft. Der Nachweis mit realem Google Drive und zwei Geräten bleibt offen.

## Anmeldung und Offlinebetrieb

Google Identity Services liefert in seinem Browser-Tokenmodell kurzlebige Zugriffstokens. Nach Ablauf kann eine neue Nutzeraktion erforderlich sein. Das Modell bietet der reinen statischen App keinen zugesagten unbegrenzten stillen Zugriff. Client-Secrets oder Service-Account-Schlüssel werden nicht in Browsercode eingebettet. [Google: Tokenmodell](https://developers.google.com/identity/oauth2/web/guides/use-token-model)

Ohne Verbindung oder gültigen Google-Zugriff bleiben bereits gespeicherte Vokabeln nutzbar. Die Oberfläche unterscheidet die fachlichen Zustände „Auf diesem Gerät gespeichert“, „Abgleich ausstehend“, „Mit Google verbinden“, „Abgeglichen“ und „Abgleich fehlgeschlagen“.

Probe und Produkt halten ihre jeweils explizit aufgeführten Programmdateien mit getrennten Service Workern offline vor. Der Produktcache ist versioniert und auf seinen Scope begrenzt; Updates werden erst nach gesicherter Pause einer laufenden Runde aktiviert. Automatisiert sind Offline-Neustarts mit geschlossenem Testserver unter Wurzel- und Unterpfad sowie ein verzögerter Workerwechsel geprüft. iOS-Hintergrundausführung ist kein verlässlicher Ersatz für den Abgleich bei geöffneter App. Browserdaten können gelöscht werden; lokaler Speicher ist keine unabhängige Sicherung. [MDN: Offlinebetrieb](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation), [WebKit: Speicherverhalten](https://webkit.org/blog/14403/updates-to-storage-policy/)

R30/R33 ergänzen den Abgleich um eine vollständige JSON-Sicherung zum Herunterladen und Wiederherstellen im Erwachsenenbereich. Die Umsetzung prüft Datenformat und Version vollständig, zeigt eine Vorschau und verlangt Bestätigung. Vor der Rücksetzung wird der aktuelle Stand separat gesichert; danach übernimmt eine neue Epoche den Sicherungsstand auch über Google Drive. Google-Tokens und Zugangsdaten gehören nicht in die Datei. Verspätete Offlineänderungen bleiben separat erhalten und können bewusst übernommen werden.

## Frühe Machbarkeitsprüfung

Lokal und mit simulierter Google-Grenze sind die vollständige Produktoberfläche, IndexedDB, Offline-Start, wiederholte Übertragung, Kontobindung, Konfliktlösung und Rücksetzpfade geprüft. Extern noch nachweisen:

- Google verbinden, synthetische Datei anlegen, auf dem zweiten Gerät wiederfinden und ändern.
- Safari-Tab und installierte Home-Bildschirm-App getrennt testen.
- Abgelaufenen Zugriff, abgebrochenen Dialog, verweigerte Berechtigung und fehlendes Netz behandeln.
- Nach Offlineübung lokale Änderungen erhalten und nach erneutem Verbinden genau einmal übertragen.
- Ein Neustart der App darf nicht versehentlich einen zweiten unabhängigen Trainerdatensatz anlegen.

Ein negativer Befund führt zu einer konkreten Rücksprache über die betroffene technische Entscheidung. Er rechtfertigt weder heimliche Zusatzkosten noch eine stillschweigende Umstellung auf manuellen Dateiaustausch.
