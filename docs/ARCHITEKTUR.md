# Technischer Entwurf

Stand: 16.09.2026. **Entwurf, noch keine Implementierung und kein vollständig freigegebenes Detaildesign.** Die verbindlichen Nutzeranforderungen stehen in [ANFORDERUNGEN.md](ANFORDERUNGEN.md).

Die konkreten Ergänzungsvorschläge E01–E10 sind im [Gesamtentwurf](superpowers/specs/2026-09-16-vokabeltrainer-design.md) zusammengeführt. Er präzisiert diesen Architekturüberblick; sein Status bleibt bis zur Nutzerprüfung „vorgeschlagen“.

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

E01 schlägt JavaScript-Module ohne UI-Framework vor. Build-/Testwerkzeuge, konkrete Versionen und Ordnernamen im anschließenden Implementierungsplan festlegen. Die fachlichen Grenzen bleiben erhalten.

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

Ein einfaches „Datei laden, lokal ändern, vollständig hochladen“ ist ohne weiteren Schutz bei zwei Geräten nicht ausreichend. E10 schlägt unveränderliche JSON-Ereignispakete mit stabilen Datei-/Ereignis-IDs und getrennten Wiederherstellungsgenerationen vor. Konflikte werden über bekannte Vorversionen erkannt. Der Ablauf ist im Gesamtentwurf beschrieben, aber noch nicht bestätigt oder technisch nachgewiesen.

Zähler lassen sich nicht immer sinnvoll addieren: Auch Serien richtiger Antworten und Reihenfolgen müssen bei parallelem Offlineüben definiert werden. Geräteuhren allein sind kein sicherer Konfliktentscheid.

## Google-Zugriff

Als erster Ansatz sind Google Identity Services für den Browser und die Drive-API mit `drive.file` vorgesehen. Damit bearbeitet die Anwendung von ihr angelegte oder vom Nutzer ausdrücklich ausgewählte Dateien. Der Zugriff gilt nicht pauschal für beliebige vorhandene Dateien in einem ausgewählten Ordner. [Google: Berechtigungen](https://developers.google.com/workspace/drive/api/guides/api-specific-auth)

Ein sichtbarer Trainerordner mit normalen JSON-Dateien ist vorgeschlagen. Ein versteckter `appDataFolder` wäre technisch eine andere Variante, dessen Inhalte nicht über die normale Drive-Oberfläche erreichbar und nicht zwischen Konten teilbar sind. Das ist keine umgesetzte Entscheidung. [Google: App-Daten](https://developers.google.com/workspace/drive/api/guides/appdata)

Beide Geräte benötigen dieselbe Anwendungskonfiguration und die Zuordnung zum selben Trainerdatensatz. Ein Dateiname allein ist dafür ungeeignet, weil Drive gleichnamige Dateien zulässt. Stabile Drive-Datei-IDs und Wiederfinden des Datensatzes müssen in der technischen Probe verifiziert werden.

## Anmeldung und Offlinebetrieb

Google Identity Services liefert in seinem Browser-Tokenmodell kurzlebige Zugriffstokens. Nach Ablauf kann eine neue Nutzeraktion erforderlich sein. Das Modell bietet der reinen statischen App keinen zugesagten unbegrenzten stillen Zugriff. Client-Secrets oder Service-Account-Schlüssel werden nicht in Browsercode eingebettet. [Google: Tokenmodell](https://developers.google.com/identity/oauth2/web/guides/use-token-model)

Ohne Verbindung oder gültigen Google-Zugriff sollen bereits gespeicherte Vokabeln weiter nutzbar bleiben. In der Oberfläche sind mindestens die fachlichen Zustände „auf diesem Gerät gespeichert“, „Abgleich ausstehend“, „mit Google verbinden“, „abgeglichen“ und „Abgleich fehlgeschlagen“ zu berücksichtigen; die exakte Formulierung ist noch Teil des UI-Designs.

Ein Service Worker kann Programmdateien für Offlinebetrieb vorhalten. Dafür werden eine geeignete Webbereitstellung und zusätzliche Dateien benötigt. iOS-Hintergrundausführung ist kein verlässlicher Ersatz für den Abgleich bei geöffneter App. Browserdaten können gelöscht werden; lokaler Speicher ist keine unabhängige Sicherung. [MDN: Offlinebetrieb](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation), [WebKit: Speicherverhalten](https://webkit.org/blog/14403/updates-to-storage-policy/)

R30/R33 ergänzen den Abgleich um eine vollständige JSON-Sicherung zum Herunterladen und Wiederherstellen im Erwachsenenbereich. Vor dem Einlesen Datenformat und Version prüfen, eine Vorschau zeigen und die Wiederherstellung bestätigen lassen. Vor der Rücksetzung den aktuellen Stand automatisch separat sichern; danach den Sicherungsstand auch über Google Drive übernehmen. Google-Tokens und Zugangsdaten gehören nicht in die Datei. Abschnitt 9 des Gesamtentwurfs schlägt den Online-Ablauf mit überprüfter Sicherheitskopie sowie den separaten Erhalt verspäteter Offlineänderungen vor; diese technische Konkretisierung ist noch nicht bestätigt.

## Frühe Machbarkeitsprüfung

Vor umfangreicher UI-Implementierung nachweisen:

- Google verbinden, synthetische Datei anlegen, auf dem zweiten Gerät wiederfinden und ändern.
- Safari-Tab und installierte Home-Bildschirm-App getrennt testen.
- Abgelaufenen Zugriff, abgebrochenen Dialog, verweigerte Berechtigung und fehlendes Netz behandeln.
- Nach Offlineübung lokale Änderungen erhalten und nach erneutem Verbinden genau einmal übertragen.
- Ein Neustart der App darf nicht versehentlich einen zweiten unabhängigen Trainerdatensatz anlegen.

Ein negativer Befund führt zu einer konkreten Rücksprache über die betroffene technische Entscheidung. Er rechtfertigt weder heimliche Zusatzkosten noch eine stillschweigende Umstellung auf manuellen Dateiaustausch.
