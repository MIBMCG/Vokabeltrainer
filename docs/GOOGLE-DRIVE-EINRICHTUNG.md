# Google Drive: spätere Einrichtung und Prüfungen

Stand: 16.09.2026. **Vorbereitende Anleitung. Für dieses Projekt wurde noch kein Google-Cloud-Projekt, OAuth-Client oder Drive-Datensatz eingerichtet.** Die genauen Einstellungsnamen können sich ändern; maßgeblich sind die verlinkten offiziellen Anleitungen.

## Ziel und Voraussetzungen

- Ein gemeinsames Google-Konto wird durch die Eltern auf beiden Geräten für den Trainer verbunden.
- Die Anwendung wird als HTTPS-Web-App bereitgestellt; ein lokaler Entwicklungsserver ist zusätzlich möglich.
- Dieselbe OAuth-Anwendung und derselbe Trainerdatensatz werden auf beiden Geräten verwendet.
- Die vorhandene Drive-Kapazität reicht für die vorgesehenen kleinen Textdaten. Kein zusätzlicher kostenpflichtiger Dienst ist beauftragt.
- Die konkrete technische Probe wird vor der Einrichtung beschrieben; der Nutzer nimmt die notwendigen Anmeldungen und Kontobestätigungen selbst vor.

## Einmalige Vorbereitung durch Projektverantwortliche

1. In der Google Cloud Console ein Projekt für den Vokabeltrainer anlegen oder ein geeignetes bestehendes Projekt auswählen. Das registriert die App bei Google; es ist noch kein gemieteter Server.
2. Die **Google Drive API** aktivieren. Die **Google Picker API** nur zusätzlich aktivieren, wenn das bestätigte Dateiauswahlkonzept sie benötigt.
3. Die OAuth-Anwendung konfigurieren: Name, Supportkontakt, Zielgruppe und angeforderte Datenzugriffe. Für ein privates Google-Konto ist die Zielgruppe normalerweise „External“; „Internal“ setzt eine geeignete Google-Workspace-Organisation voraus.
4. Für die Entwicklungsphase das verwendete gemeinsame Konto als Testnutzer eintragen, soweit die aktuelle Konsole dies verlangt.
5. Einen OAuth-Client vom Typ **Web application** erstellen. Eine PWA auf dem iPhone bleibt für diesen Aufbau eine Webanwendung und benötigt keinen nativen iOS-OAuth-Client.
6. Die tatsächlich verwendeten JavaScript-Ursprünge eintragen. Beim vorgeschlagenen GitHub-Pages-Hosting wäre der Ursprung `https://mibmcg.github.io` — ohne den Projektpfad. Der Projektpfad für diese App wäre `/Vokabeltrainer/`; die Website existiert derzeit noch nicht.
7. Den später gewählten lokalen Entwicklungsursprung einschließlich Port separat registrieren. Keinen fiktiven Port oder Callback als bereits eingerichtet dokumentieren.
8. Redirect-URIs nur für den tatsächlich gewählten Ablauf einrichten und exakt mit der Implementierung abstimmen. Das vorgeschlagene GIS-Tokenmodell nutzt einen Browserdialog.
9. Die öffentliche OAuth-Client-ID in die spätere Anwendungskonfiguration übernehmen. Falls Picker einen Browser-API-Key benötigt, dessen API- und Websiteeinschränkungen passend setzen. **Kein Client-Secret, Passwort oder Service-Account-Schlüssel gehört in die statische App.**

Quellen: [Zugangsdaten erstellen](https://developers.google.com/workspace/guides/create-credentials), [OAuth-Konfiguration](https://developers.google.com/workspace/guides/configure-oauth-consent), [OAuth-Clienttypen](https://developers.google.com/identity/protocols/oauth2).

## Berechtigungen und Trainerdateien

Vorgeschlagen ist `https://www.googleapis.com/auth/drive.file`. Dieser Zugriff ist auf von der App erstellte oder vom Nutzer ausdrücklich mit der App geöffnete/ausgewählte Dateien begrenzt. Eine Ordnerauswahl erteilt keinen pauschalen Vollzugriff auf alle beliebigen Bestandsdateien darin.

Für den Erststart wird ein sichtbarer Trainerordner mit normalen JSON-Dateien vorgeschlagen. Das genaue Dateischema und das Wiederfinden auf dem zweiten Gerät müssen erst bestätigt und geprüft werden. Der versteckte `appDataFolder` darf nicht mit einem normalen Drive-Ordner verwechselt werden.

Quelle: [Drive-Berechtigungen](https://developers.google.com/workspace/drive/api/guides/api-specific-auth).

## „Einmal einrichten“ und erneutes Verbinden

Die App-Registrierung und Zuordnung zum Trainerdatensatz sind eine einmalige Einrichtung. Eine Google-Anmeldesitzung ist dagegen zeitlich begrenzt.

Im hier vorgeschlagenen Browser-Tokenmodell wird nach Ablauf des Zugriffstokens ein neuer Zugriff über eine Nutzeraktion angefordert. Ein verständlicher „Mit Google verbinden“-Ablauf ist deshalb Teil des Entwurfs. Währenddessen bleiben Offlineübungen und noch nicht übertragene Ergebnisse erhalten. Wie häufig der Dialog auf den Zielgeräten tatsächlich erscheint, ist ein **offener Akzeptanzpunkt**.

Ein Wechsel des OAuth-Veröffentlichungsstatus auf „Production“ hebt die begrenzte Lebensdauer der Zugriffstokens nicht auf. Googles zusätzlich dokumentierte Sieben-Tage-Regel betrifft Refresh-Tokens bestimmter externer Apps im Teststatus; der vorgeschlagene Browserablauf verwendet kein eigenes serverseitiges Refresh-Token-Lager. Diese Sachverhalte nicht miteinander verwechseln.

Quellen: [Browser-Tokenmodell](https://developers.google.com/identity/oauth2/web/guides/use-token-model), [Refresh-Token-Grenzen](https://developers.google.com/identity/protocols/oauth2).

## Teststatus und spätere Nutzung

Den Teststatus nicht ungeprüft als dauerhafte Einrichtung ausgeben. Vor Alltagseinsatz den erforderlichen Veröffentlichungs-/Verifizierungsstatus anhand der tatsächlichen Zielgruppe, Scopes und Google-Vorgaben prüfen. `drive.file` ist als nicht sensitiver Scope dokumentiert; daraus folgt weder eine pauschale Befreiung von allen Anforderungen noch die Notwendigkeit einer aufwendigen Vollzugriffsprüfung.

Ein Statuswechsel, ein neues Konto oder eine Freigabe der laufenden App ist durch den bisherigen Dokumentationsauftrag noch nicht durchgeführt oder zugesagt.

## Kostenrahmen

Der erwartete private Einsatz mit kleinen Vokabel- und Ergebnisdateien soll innerhalb der kostenlosen Drive-API-Limits und des vorhandenen Speichers bleiben. Gebührenpflichtige Zusatzdienste oder Abrechnung oberhalb der kostenlosen Grenzen werden nicht als Voraussetzung eingeplant. Falls die tatsächliche Einrichtung eine Zahlungsfreigabe verlangen sollte, die Ursache prüfen und mit dem Nutzer klären; nichts buchen.

Die API-Regeln können sich ändern. Vor Einrichtung die [aktuellen Drive-Limits](https://developers.google.com/workspace/drive/api/guides/limits) erneut prüfen. Das ist eine technische Kostenprüfung für die konkrete Einrichtung, keine Aufforderung zum Abschluss eines weiteren Abos.

## Nachweis vor Alltagseinsatz

In einem Prüfbericht ohne Zugangsdaten dokumentieren:

- Gerät, Browser/iOS-Version, Datum und getesteter Programmcommit.
- Safari-Tab und Home-Bildschirm-App: Verbindung, Neustart und erneutes Verbinden.
- Erstes Gerät legt synthetische Vokabeln an; zweites Gerät sieht denselben Datensatz.
- Ergebnis auf dem zweiten Gerät erscheint nach dem Abgleich auf dem ersten.
- Offlineantworten, Netzwechsel, abgebrochene Anmeldung und abgelaufener Zugriff verursachen keinen Verlust.
- Wiederholtes Hochladen zählt keine Antwort doppelt.
- Parallel bearbeitete Inhalte und paralleles Üben werden nach der noch festzulegenden Konfliktregel erhalten.

Die vollständige Matrix steht in [QUALITAET-UND-ABNAHME.md](QUALITAET-UND-ABNAHME.md).
