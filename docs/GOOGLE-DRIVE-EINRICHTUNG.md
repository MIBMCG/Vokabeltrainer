# Google Drive: Einrichtung und Prüfungen

Stand: 19.09.2026. **Einrichtung für die lokale Probe erfolgt: Projekt, Web-OAuth-Client, Testnutzer und echter Drive-Abgleich sind durch Nutzerangaben/Screenshots bestätigt.** Die öffentliche Web-Client-ID ist jetzt in der Produkt-App vorbereitet. Die Produkt-App ist mit simulierter Google-Grenze automatisiert geprüft. Realer Produktabgleich über zwei physische Geräte und die Apple-Geräteabnahme bleiben offen. Die genauen Google-Einstellungsnamen können sich ändern; maßgeblich sind die verlinkten offiziellen Anleitungen.

Die historischen Start-/Registrierungsschritte und der Prüfablauf der bestätigten lokalen Probe stehen in [GOOGLE-DRIVE-PROBE.md](GOOGLE-DRIVE-PROBE.md). Ihr Entwicklungsursprung ist `http://localhost:4173`. Die damalige Registrierung ist bestätigt; daraus folgt keine bereits registrierte oder bereitgestellte öffentliche HTTPS-Adresse für die Produkt-App.

## Ziel und Voraussetzungen

- Ein gemeinsames Google-Konto wird durch die Eltern auf beiden Geräten für den Trainer verbunden.
- Für den späteren Gerätebetrieb wird eine HTTPS-Web-App benötigt; derzeit ist ein lokaler Entwicklungsserver vorhanden, keine veröffentlichte Trainer-URL.
- Dieselbe OAuth-Anwendung und derselbe Trainerdatensatz werden auf beiden Geräten verwendet.
- Die vorhandene Drive-Kapazität reicht für die vorgesehenen kleinen Textdaten. Kein zusätzlicher kostenpflichtiger Dienst ist beauftragt.
- Die notwendige Anmeldung und Kontobestätigungen nimmt der Nutzer selbst vor; die technische Probe ist bereits dokumentiert.

## Einrichtung durch Familien

Familien benötigen kein eigenes Google-Cloud-Projekt und tragen im normalen Ablauf keine Client-ID ein.

1. In der Erwachsenenansicht **Einstellungen** öffnen und im Abschnitt **Abgleich** auf **Mit Google verbinden** klicken.
2. Das gemeinsame Google-Konto der Familie bewusst bestätigen.
3. Auf dem ersten Gerät **Neuen Lernbereich anlegen** wählen. Auf weiteren Geräten **Vorhandenen Lernbereich verwenden**, den passenden Eintrag prüfen und erst danach bestätigen.

Die Anmeldung allein legt keinen Lernbereich an und verbindet keinen vorhandenen Bestand automatisch. Wird der Google-Dialog abgebrochen, bleiben die lokalen Lerndaten unverändert nutzbar. Nach Ablauf des Zugriffs erneut **Mit Google verbinden** wählen; ausstehende Änderungen werden bei geöffnetem Trainer anschließend automatisch abgeglichen.

Eine früher in diesem Browser gespeicherte gültige Client-ID bleibt zunächst erhalten. Weicht sie von der vorbereiteten App-Konfiguration ab, erklärt der erweiterte Bereich die Abweichung. Ohne verbundene Drive-Daten kann dort bewusst auf den vorbereiteten Zugang gewechselt werden. Ein bereits verbundener Lernbereich behält seine bisherige Client-ID; die Oberfläche bietet dafür keinen schnellen Wechsel an.

## Einmalige Vorbereitung durch Projektverantwortliche

1. In der Google Cloud Console ein Projekt für den Vokabeltrainer anlegen oder ein geeignetes bestehendes Projekt auswählen. Das registriert die App bei Google; es ist noch kein gemieteter Server.
2. Die **Google Drive API** aktivieren. Die **Google Picker API** nur zusätzlich aktivieren, wenn das bestätigte Dateiauswahlkonzept sie benötigt.
3. Die OAuth-Anwendung konfigurieren: Name, Supportkontakt, Zielgruppe und angeforderte Datenzugriffe. Für ein privates Google-Konto ist die Zielgruppe normalerweise „External“; „Internal“ setzt eine geeignete Google-Workspace-Organisation voraus.
4. Für die Entwicklungsphase das verwendete gemeinsame Konto als Testnutzer eintragen, soweit die aktuelle Konsole dies verlangt.
5. Einen OAuth-Client vom Typ **Web application** erstellen. Eine PWA auf dem iPhone bleibt für diesen Aufbau eine Webanwendung und benötigt keinen nativen iOS-OAuth-Client.
6. Die tatsächlich verwendeten JavaScript-Ursprünge eintragen. Beim vorgeschlagenen GitHub-Pages-Hosting wäre der Ursprung `https://mibmcg.github.io` — ohne den Projektpfad. Der Projektpfad für diese App wäre `/Vokabeltrainer/`; die Website existiert derzeit noch nicht.
7. Für die lokale Probe `http://localhost` und `http://localhost:4173` als autorisierte JavaScript-Ursprünge eintragen. Die Probe selbst unter `http://localhost:4173` öffnen. Keinen fiktiven Callback als bereits eingerichtet dokumentieren.
8. Redirect-URIs nur für den tatsächlich gewählten Ablauf einrichten und exakt mit der Implementierung abstimmen. Das implementierte GIS-Tokenmodell nutzt einen Browserdialog.
9. Die öffentliche OAuth-Web-Client-ID in `src/trainer/config.js` für die ausgelieferte App hinterlegen. Die verifizierte ID ist öffentlich und kein Geheimnis. Für abweichende lokale Betreiberkonfigurationen steht die manuelle Eingabe ausschließlich unter **Erweiterte Einstellungen** bereit. Falls Picker einen Browser-API-Key benötigt, dessen API- und Websiteeinschränkungen passend setzen. **Kein Client-Secret, Passwort oder Service-Account-Schlüssel gehört in die statische App.**

Die vorbereitete ID ersetzt diese Betreiberaufgaben nicht: Jeder tatsächlich verwendete Ursprung, beispielsweise eine spätere HTTPS-Adresse, muss in der Google-Konfiguration zugelassen sein. Testnutzer- und Veröffentlichungsstatus müssen zur konkreten Nutzung passen. In dieser Überarbeitung wurden weder Google-Konto noch Projekt, Ursprünge oder Testnutzer verändert.

Quellen: [Zugangsdaten erstellen](https://developers.google.com/workspace/guides/create-credentials), [OAuth-Konfiguration](https://developers.google.com/workspace/guides/configure-oauth-consent), [OAuth-Clienttypen](https://developers.google.com/identity/protocols/oauth2).

## Berechtigungen und Trainerdateien

Implementiert ist `https://www.googleapis.com/auth/drive.file`. Dieser Zugriff ist auf von der App erstellte oder vom Nutzer ausdrücklich mit der App geöffnete/ausgewählte Dateien begrenzt. Eine Ordnerauswahl erteilt keinen pauschalen Vollzugriff auf alle beliebigen Bestandsdateien darin.

Die technische Probe verwendet einen sichtbaren, ausdrücklich markierten Probeordner mit unveränderlichen synthetischen JSON-Dateien. Das begrenzte Schema steht in [PROBE-DATENFORMAT.md](PROBE-DATENFORMAT.md). Das Produkt verwendet sein getrenntes [Produkt-Datenformat](PRODUKT-DATENFORMAT.md). Wiederfinden und Abgleich des Produktbestands auf einem zweiten realen Gerät müssen noch geprüft werden. Der versteckte `appDataFolder` darf nicht mit einem normalen Drive-Ordner verwechselt werden.

Quelle: [Drive-Berechtigungen](https://developers.google.com/workspace/drive/api/guides/api-specific-auth).

## „Einmal einrichten“ und erneutes Verbinden

Die App-Registrierung und Zuordnung zum Trainerdatensatz sind eine einmalige Einrichtung. Eine Google-Anmeldesitzung ist dagegen zeitlich begrenzt.

Im implementierten Browser-Tokenmodell wird nach Ablauf des Zugriffstokens ein neuer Zugriff über eine Nutzeraktion angefordert. Die App zeigt dafür „Mit Google verbinden“; Offlineübungen und noch nicht übertragene Ergebnisse bleiben erhalten. Wie häufig der Dialog auf den Zielgeräten tatsächlich erscheint, ist ein **offener Akzeptanzpunkt**.

Produktentscheidung Q10 vom 16.09.2026: Der Nutzer akzeptiert dieses erneute Verbinden grundsätzlich, einschließlich einer möglichen erneuten Bestätigung beim Öffnen der App. Mit vorhandenen Vokabeln soll offline weitergeübt und nach erneuter Verbindung automatisch abgeglichen werden. Die reale Dialoghäufigkeit und Bedienbarkeit auf iPhone/iPad sind damit noch nicht nachgewiesen oder abgenommen.

Ein Wechsel des OAuth-Veröffentlichungsstatus auf „Production“ hebt die begrenzte Lebensdauer der Zugriffstokens nicht auf. Googles zusätzlich dokumentierte Sieben-Tage-Regel betrifft Refresh-Tokens bestimmter externer Apps im Teststatus; der implementierte Browserablauf verwendet kein eigenes serverseitiges Refresh-Token-Lager. Diese Sachverhalte nicht miteinander verwechseln.

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
- Parallel bearbeitete Inhalte bleiben nach dem implementierten unveränderlichen Ereignisprotokoll erhalten; widersprüchliche Wortfassungen werden bewusst ausgewählt, Antwortslots nur einmal gewertet.

Die vollständige Matrix steht in [QUALITAET-UND-ABNAHME.md](QUALITAET-UND-ABNAHME.md).

## Gemeinsame App-Version

Alle Geräte sollten den aktuellen v2-fähigen Trainer verwenden. Die neue App liest unveränderte v1-Historie; neue Regel- und Wiederaktivierungsereignisse erfordern v2. Ein altes offline gebliebenes Programm lässt sich nicht aus der Ferne sperren und kann weiterhin alte Antworten hochladen. Die neue App erhält sie einmalig, ohne dadurch eine zurückgesetzte Wiederholungsserie wiederherzustellen. Alte Reader lehnen das neue Format ab; es wird keine vollständige Vorwärtskompatibilität behauptet. Der [Datenvertrag](PRODUKT-DATENFORMAT.md) und die [B1-Prüfung](reports/2026-09-19-b1-datenuebergang.md) beschreiben Migration, Sicherung und Versionsbarriere.
