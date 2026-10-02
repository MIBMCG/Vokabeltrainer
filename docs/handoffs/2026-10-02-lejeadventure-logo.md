# LejeAdventure: bestätigtes Logo und Appname

Stand: 02.10.2026. Das begrenzte Logo-/Namenspaket ist integriert, unabhängig
geprüft und an der LejeAdventure-Adresse bereitgestellt. Keine neue Pause.
Produktcommit: `cd8d5168279cbc11c760b250283caa4e0112baa2`, Cache v49.
Die [Einrichtungsübergabe](2026-10-01-lejeadventure-einrichtung.md) bleibt für
Google-Zugang, Betreiberwechsel und die früheren Bestandsnachweise maßgeblich.

## Bestätigter Umfang

Der Nutzer bestätigt nach der finalen Vorschau: **„Das logo ist gut so und kann
verwendet werden“**. Gewählt ist die Milchtüte A mit dem gedruckten Frontmotiv
aus Litschi, Milchspritzer C, Blatt und goldenem Stern. Keine neue Gestaltung
oder Bildfreigabe erforderlich.

Die [unveränderte Quelle](../design/lejeadventure-logo-source.png) ist intern
gesichert: 1254 × 1254px, SHA-256
`84b3962e8efbadaff1144919efb9d211283fbfcb8783bf1687516253b37a1386`.
Der Generator verkleinert sie mit dem bereits vorhandenen Sharp; keine neue
Abhängigkeit und keine kreative Bildbearbeitung.

| PNG-Größe | Bytes | Verwendung |
| --- | ---: | --- |
| 32px | 1693 | Favicon |
| 64px | 3396 | Header, angezeigt mit 48 × 48px |
| 180px | 15743 | Apple-Touch-Icon |
| 192px | 17064 | Manifest, any/maskable |
| 512px | 133481 | Manifest, any/maskable |

Zusammen 171377 Bytes. Alle fünf Varianten sind quadratisch und deckend.
Milchtüte und Frontlogo liegen vollständig innerhalb des zentralen Maskenkreises
mit 80 Prozent Durchmesser; nur Hintergrund und weicher Schatten reichen darüber
hinaus. Erneute Erzeugung liefert dieselben Bytes.

Titel, Header, zugänglicher Bannername, Ladehinweis und Manifestname heißen
LejeAdventure. Der Name kann zwischen Leje und Adventure umbrechen; das
dekorative Headerbild hat leeren Alternativtext. HTML, Manifest und ServiceWorker
nutzen die neuen PNGs. Sie stehen in öffentlicher Liste und Pflichtcache;
die Rohquelle bleibt intern. Die alte SVG ist erhalten, wird dort nicht mehr
verwendet. Datenformate, Lernregeln, Anmeldung, Drive-Bindung, Käufe und
Google-Anbieterbranding haben keinen Produktdiff.

## Technische Prüfung und unabhängiges Review

Implementer-Nachweise auf dem Produktcommit:

- 666/666 gesamte Node-Tests und 39/39 gezielte Server-/Staging-/ServiceWorker-/
  Updatefälle PASS, keine Fehler oder Skips.
- Edge 154: fünf ausgewählte Offline-/Update-/Sitzungsfälle, 24
  Navigationsansichten und fünf Headeransichten PASS. Synthetische, getrennte
  Kontexte; kein Zugriff auf persönliche Browser- oder Google-Daten.
- Der kontrollierte synthetische Workerwechsel v49 → v50 erhält vollständigen
  Lernledger, commerce, Bindung und PIN-Prüfwert identisch. Gespeicherte richtige
  Antwort sichtbar; konkret 10 Lernpunkte, Level 1 und klassischer Avatar
  erhalten. Dieser Stand hat inaktive Käufe; kein realer Besitz-/Drive-Nachweis.

Das unabhängige Abschlussreview bewertet **Spec PASS und Qualität PASS**, ohne
konkreten offenen Befund im Logo-/Namensumfang. Frisch nachgeprüft wurden 31/31
Nodefälle, alle fünf Headeransichten und der kontrollierte Edge-Updatefall.
Quelle und PNGs, Deckkraft und 80-Prozent-Maskenkreis sind bestätigt. Staging
enthält exakt 396 erlaubte Dateien; HTML, CSS, Manifest, ServiceWorker und alle
fünf PNGs sind bytegleich zum Produktcommit. Rohquelle und private Berichte
sind nicht im öffentlichen Paket. Gesamtsuite und Navigationslauf stammen
aus den Implementer-Nachweisen und wurden im Review nicht nochmals wiederholt.

## Bereitstellung und öffentliche Nachprüfung

Ziel: [LejeAdventure](https://app.lejeadventure.workers.dev/trainer/), Worker `app`.
Die alte App bleibt auf Cache v47.

- Aktive Worker-Version: `b8bfa45c-2b69-4c8d-88e8-6975cbbab01d`, 100 Prozent.
- Erstellt am 02.10.2026 um 17:17:33.719 UTC; Deployment um 17:17:34.717 UTC.
- Dry-run und Upload Exit 0; neun Assets neu, 387 bereits vorhanden.
- Öffentliche Nachprüfung am 02.10.2026 um 17:19:09.351 UTC: 396/396 Dateien
  bytegleich, drei Informationsseiten HTTP 200, sechs interne Pfade einschließlich
  Logoquelle HTTP 404. Anonyme Sitzungsantwort false mit no-store.

Bei einer ersten Probe unmittelbar nach dem Deployment antwortete die 64px-PNG
mit HTTP 404. Die gezielte Folgeprobe liefert HTTP 200; anschließend besteht
die vollständige öffentliche Prüfung. Dazwischen gab es keine Produkt- oder
Anbieteränderung. Die genaue Ursache und Dauer sind nicht belegt.

## Beobachtung im bestehenden Chrome

Vor dem Update sind bereits zwei vom Nutzer zwischenzeitlich geänderte Profile
mit Level 1 und null Punkten sowie der v48-Inselheader sichtbar. Nach Neuladen
erscheint das echte Updateangebot; **„Jetzt aktualisieren“** wird angeklickt.
Danach sind LejeAdventure-Banner, neues Logo und Titel geladen. Dieselben zwei
Profile mit Level 1/null Punkten bleiben sichtbar, ohne erneute Google-Anmeldung.

Die PIN wurde in diesem Schritt nicht geöffnet. Google-Aktivstatus und
vollständiger Abgleich wurden nach diesem Update nicht erneut direkt geprüft.
Die früheren Nachweise aus der Einrichtungsübergabe bleiben Beobachtungen ihres
jeweiligen Stands. Die Chrome-Beobachtung belegt den tatsächlichen Logo-/
Namenswechsel und die sichtbare Profilauswahl; sie belegt keinen vollständigen
Bestands-/Besitzvergleich oder physische Apple-Abnahme. Der private Screenshot
bleibt ignoriert und ist kein Bestandteil der Git-Sicherung.

Die allgemeine Nutzerrückmeldung **„alles funktioniert“** ist kein spezifischer
PASS für Apple-/Safari-/Home-Bildschirm-Verhalten, natürlichen Tokenablauf oder
Zweitgeräteabgleich.

## Git-Sicherung und nächste Schritte

Das Hauptcheckout ist auf den Produktcommit vorgezogen. Vorheriger Checkpoint
`ea33d55aa5aada53701b84d6f0c36e1c02bc6e68` ist auf beiden bestehenden
GitHub-Zweigen exakt bestätigt. Die Sicherung des neuen Produktcommits und
dieser Abschlussdokumentation steht zum Dokumentationszeitpunkt noch aus.
Keine Secrets, privaten Browserbilder oder ignorierten Helfer mit aufnehmen.

1. Laufende separate Firefox-Offlinediagnose abschließen und ihren eigenen
   Befund dokumentieren. Hier liegt noch kein Ergebnis und kein Firefox-Fix vor.
2. Vorhandenen Überlauf bei der ersten Einrichtung mit 320px und 200 Prozent
   Schrift gesondert bearbeiten: scrollWidth 525 auf unveränderter Basis
   `ea33d55` und mit Logo gleichermaßen; der Header liegt innerhalb 320px.
   Kein Logo-Regressionsbefund und keine Korrektur im abgeschlossenen Paket.
3. Offene Praxisnachweise gezielt ergänzen: echte Freundes-Erstanmeldung,
   physisches iPad/Safari/Home-Bildschirm, natürlicher Tokenablauf und
   Zweitgeräteabgleich. Bestehende Lernbereiche und Bestände weiterverwenden.
4. Danach die fünf bestätigten Belohnungsideen: Verwandlung, Figurenbewegung,
   Lernreaktionen, eigener Inselort und Steckbrief/Geschichte/Titel.

Keine abgeschlossenen Galerie-/Layoutpakete wiederholen und keine Lernbestände
neu anlegen, ersetzen oder in das Betreiberkonto verschieben.
