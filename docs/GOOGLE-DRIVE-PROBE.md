# Verbindungsprobe: starten, einrichten und prüfen

Diese kleine Oberfläche prüft technische Grundlagen vor dem eigentlichen Trainer. Sie erzeugt ausschließlich künstliche Antworten und einen ausdrücklich markierten Testordner. Vokabelverwaltung, Kinderprofile, Erwachsenen-PIN und Inselreise folgen später. Produktanforderungen stehen unverändert im [bestätigten Entwurf](superpowers/specs/2026-09-16-vokabeltrainer-design.md).

**Stand 17.09.2026:** Die Probe ist lokal ausführbar. 74 automatisierte Tests und zwölf Browser-Szenarien mit simulierter Google-Grenze waren erfolgreich. Echte Google-Anmeldung, reales Drive, zwei physische Geräte sowie Safari/Home-Bildschirm-App sind noch nicht geprüft. [Prüfbericht](reports/2026-09-17-google-drive-probe.md)

## Lokal starten

Voraussetzung für Entwicklung: Node.js ab Version 22.8.0. Im Checkout des Entwicklungszweigs:

```sh
npm test
npm start
```

Dann `http://localhost:4173` im Browser öffnen. Es gibt keine npm-Laufzeitabhängigkeiten und keinen Buildschritt. Die öffentliche Client-ID wird später im Eingabefeld der Probe hinterlegt. Den Server beenden, indem im Terminal Strg+C gedrückt wird.

`localhost` bezeichnet immer das gerade benutzte Gerät. Die lokale Adresse des Entwicklungsrechners öffnet deshalb auf einem fremden iPhone nicht dieselbe App. Für den echten Zwei-Geräte-/Home-Bildschirm-Test wird eine abgestimmte HTTPS-Bereitstellung benötigt. Diese Anleitung richtet kein Hosting ein und ändert keine Repository-Sichtbarkeit.

## Google einmalig vorbereiten

Die Registrierung erledigt die projektverantwortliche erwachsene Person in ihrem Google-Konto. Keine Zugangsdaten an eine KI senden.

1. [Google Cloud Console](https://console.cloud.google.com/) öffnen und ein Projekt für den Vokabeltrainer auswählen oder neu anlegen.
2. In der API-Bibliothek **Google Drive API** suchen und für dieses Projekt aktivieren.
3. In **Google Auth Platform** die App-Informationen eintragen. Bei einem privaten Konto die externe Zielgruppe verwenden und das gemeinsame Testkonto unter Testnutzern ergänzen, sofern die Konsole das verlangt. Name beispielsweise „Vokabeltrainer Test“; Kontaktangaben direkt in Google eintragen.
4. Unter **Clients** einen Client vom Typ **Webanwendung** erstellen. Die Browser-App bleibt auch auf iOS eine Webanwendung.
5. Unter **Autorisierte JavaScript-Quellen** `http://localhost` und `http://localhost:4173` eintragen, wie von Google für lokale Tests beschrieben. Die Probe unter `http://localhost:4173` öffnen. Bei späterem HTTPS-Hosting dessen tatsächlichen Ursprung ergänzen, ohne Unterpfad. Für diesen Dialogablauf keine erfundene Weiterleitungsadresse ergänzen. [Google: lokale Ursprünge](https://developers.google.com/identity/oauth2/web/guides/get-google-api-clientid)
6. Die öffentliche **Client-ID** kopieren; sie endet auf `.apps.googleusercontent.com`. Im Eingabefeld der Probe eintragen. Ein Client-Secret, API-Key oder Dienstkontoschlüssel wird nicht benötigt.

Googles aktuelle Oberfläche und Vorgaben sind maßgeblich: [OAuth-Client anlegen](https://developers.google.com/workspace/guides/create-credentials), [Zielgruppe und Einwilligung](https://developers.google.com/workspace/guides/configure-oauth-consent). Die Probe verlangt nur [drive.file](https://developers.google.com/workspace/drive/api/guides/api-specific-auth), nicht vollen Zugriff auf sämtliche Dateien. Kein zusätzlicher kostenpflichtiger Dienst oder Abrechnungskonto ist Teil dieser Vorbereitung; [Nutzungslimits](https://developers.google.com/workspace/drive/api/guides/limits) vor Einrichtung prüfen.

## Erste Verbindung

Die Anmeldung zunächst vorbereiten, damit die Google-Bibliothek geladen ist. Anschließend den bereitgestellten Verbindungsbutton selbst antippen. Beide Schritte sind getrennt, damit der Google-Dialog unmittelbar durch eine bewusste Bedienung geöffnet werden kann.

Auf beiden Geräten dieselbe Client-ID und dasselbe Google-Konto verwenden. Auf dem ersten Gerät bewusst einen Testbestand erstellen. Auf dem zweiten Gerät bestehende Testbestände suchen und denselben auswählen. Beim Neustart keinen zusätzlichen Bestand anlegen. Wenn Google einen anderen Zugang anbietet, zunächst das richtige Konto auswählen; lokale ausstehende Antworten gehören weiterhin zu ihrem bisherigen Bestand.

Erneutes Verbinden nach Neustart oder Ablauf der Zugriffszeit ist vorgesehen. Die Probe speichert Tokens nicht dauerhaft; künstliche Antworten bleiben dagegen lokal erhalten. [Google: Tokenmodell](https://developers.google.com/identity/oauth2/web/guides/use-token-model)

## Reale Prüfung auf zwei Geräten

| Schritt | Erwartetes Ergebnis |
| --- | --- |
| Gerät A verbindet und erstellt einen Testbestand; B sucht ihn | Gleiche Bestandskennung auf beiden Geräten |
| A speichert eine Testantwort und gleicht ab | Eine Antwort, 10 Testpunkte; B sieht nach Abgleich denselben Stand |
| Dieselbe Übertragung erneut auslösen | Weiterhin eine Antwort, kein zweiter Punktegewinn |
| B geht offline, speichert eine Antwort, lädt neu | Lokale Antwort bleibt vorhanden; keine falsche Erfolgsmeldung zum Cloudabgleich |
| B verbindet wieder und gleicht ab; danach A | Zwei Antworten, 20 Testpunkte auf beiden Geräten |
| Anmeldung abbrechen oder Zugriff ablaufen lassen | Lokale Daten bleiben; erneute Verbindung ist möglich |
| A öffnet Rücksetzvorschau und bestätigt | Sicherheitskopie wird vor Rücksetzung überprüft; aktiver Teststand anschließend leer |
| B hatte noch eine nicht übertragene Antwort aus der alten Generation | Antwort bleibt nach Abgleich separat erhalten und wird nicht unbemerkt in den neuen Stand eingerechnet |
| Auf beiden Geräten parallel zurücksetzen | Konflikt sichtbar; kein zufälliger Gewinner und keine gelöschte Historie |

Die Probe demonstriert die leere Rücksetzung und den Erhalt alter Generationen. Die spätere allgemeine JSON-Wiederherstellung mit Auswahl und Erwachsenen-Konfliktlösung wird erst im Trainer umgesetzt. Testdateien werden nicht automatisch gelöscht; die Probe überschreibt keine vorhandenen Vokabeltrainer-Produktdaten.

Ein Browserprofil wird nach der ersten Auswahl fest an genau ein Konto und einen Probeordner gebunden. Ein Wechsel wird abgewiesen, damit lokale Ereignisse nicht in einen anderen Bestand gelangen. Für einen weiteren unabhängigen Probeversuch ein separates Browserprofil verwenden. Gleichzeitig darf nur ein Tab desselben Profils die Probe aktiv nutzen; ein zweiter Tab zeigt eine verständliche Sperrmeldung. Dabei werden keine Daten still verworfen.

## iPhone und iPad

Safari und die zum Home-Bildschirm hinzugefügte App getrennt prüfen: Anmeldung, Tastatur, Neuladen, Offline-Start nach erfolgreicher Erstladung und Wiederverbindung. Ein zunächst geöffnetes Safari-Fenster beweist nicht, dass derselbe Ablauf als installierte Web-App funktioniert. Gerätetyp, Modell, iOS/iPadOS-Version, Datum und getesteten Commit im Prüfbericht notieren.

Die Geräte des Freundes kommen infrage; eine Testzusage oder Mindestversion ist noch nicht bekannt. Browserprüfungen am Entwicklungsrechner und simulierte Google-Antworten werden gesondert dokumentiert. Aktuellen Prüfstatus immer im [Arbeitsstand](../ARBEITSSTAND.md) nachlesen.
