# Getrennter Kauftest und Sicherungsabgleich

Stand: 28.09.2026. Ausgangspunkt: `45ec0a8`, erneut exakt mit GitHub verglichen.
Der Nutzer hat die vorherige Pause ausdrücklich beendet.

## Tatsächlich beobachteter Versuch

- Die private HTTPS-App wurde in der zuvor leeren Browserumgebung von Codex
  geöffnet. Der normale Chrome-Lernstand wurde nicht verändert.
- Der Nutzer richtete die lokale Test-PIN selbst ein. Nach Vorschau wurde
  ausschließlich die synthetische Sicherung mit einem Profil, 60 Wörtern,
  150 richtigen Antworten und 1.600 Punkten importiert.
- Die App bestätigte die vollständig geprüfte und aktivierte Wiederherstellung;
  eine geprüfte lokale Sicherheitskopie des leeren Ausgangsstands ist sichtbar.
- Der Nutzer meldete sich selbst bei Google an. Die Oberfläche zeigte die
  aktive Verbindung und noch keinen gebundenen Lernbereich.
- Der neue Bereich heißt `Kauftest 28.09.2026 – 1600 Punkte`. Sein Anlegeversuch
  scheiterte mit „Eine Sicherungsdatei wurde während des Lesens geändert.“
- Nach Prüfung der gespeicherten Einrichtungsaufträge im Code wurde einmal
  mit exakt demselben Namen fortgesetzt. Die Fehlermeldung wiederholte sich.
  Der Programmweg verwendet dabei dieselben reservierten Ordner- und Datei-IDs;
  eine erfolgreiche vollständige Einrichtung wird dadurch nicht behauptet.

Bis hierhin wurde kein Kauf ausgelöst. Die reale Kaufwartezeit bleibt offen.
Die Beobachtung stammt aus dem echten Google-Zugriff auf synthetische Daten,
nicht aus der automatisierten Drive-Fixture. Sie ist kein Zwei-Geräte-Nachweis.

## Diagnose und begrenzte Korrektur

Die Meldung entsteht in `readVerifiedFile` beim Vergleich der vollständigen
Drive-Metadaten vor und nach dem Lesen einer Snapshot-Datei. Der bisherige
Client fordert unter anderem `version` an, aber keine Inhaltsrevision.
Ein Unterschied der beiden Metadatensätze ist durch die Meldung belegt; welches
Feld sich im echten Versuch änderte, wurde nicht aufgezeichnet.

Die [Google-Referenz für Drive-v3-Dateien](https://developers.google.com/workspace/drive/api/reference/rest/v3/files)
unterscheidet die allgemeine `version`, die auch interne Änderungen umfasst,
von `headRevisionId` für die aktuelle Revision einer Inhaltsdatei.
Der Kauftransport verwendet bereits ein entsprechendes Revisionsmuster.

Begrenztes Vorgehen: den Fehlerfall zuerst synthetisch reproduzieren, die
Inhaltsrevision zusätzlich anfordern und validieren, beim Snapshot-Lesen nur
einen Wechsel der allgemeinen Version bei identischer gültiger Inhaltsrevision
zulassen. Alle übrigen Metadatenvergleiche und Inhalts-Hashes bleiben erhalten;
ohne Revisionsanker gilt der bisherige strenge Vergleich. Echte Änderungen an
Inhalt, Revision oder Ordnerbindung müssen weiterhin abgewiesen werden.

## Umgesetzte Korrektur und Prüfung

Produktcommit `ed36f4d` ergänzt `headRevisionId` im Drive-Client und prüft den
optionalen Wert als nicht leere Zeichenkette. Metadaten- und Inhaltsabrufe
verwenden `cache: no-store`. Der Sicherungstransport toleriert ausschließlich
einen `version`-Unterschied bei identischer gültiger Inhaltsrevision. Andere,
auch unbekannte Metadatenfelder bleiben streng verglichen. Ohne gültigen
Revisionsanker bleibt der vollständige bisherige Vergleich erhalten.
Inhalts-Hashes und Bindungsprüfungen bleiben unverändert wirksam.

Der Implementierer führte die Regressionen vor der Korrektur aus:

```text
node --test --experimental-test-isolation=none tests/drive/client.test.js tests/trainer/backup.test.js
```

Ergebnis: 31/34 bestanden, Exitcode 1. Die erwarteten Fehler betrafen eine leere
Inhaltsrevision und den Versionswechsel bei stabiler Inhaltsrevision. Ein
dritter Fehler war eine fehlerhafte neue Testanlage; sie wurde vor der
Implementierung korrigiert. Danach:

```text
node --test --experimental-test-isolation=none tests/drive/client.test.js tests/trainer/backup.test.js tests/trainer/restore.test.js tests/trainer/sync.test.js
npm test
```

- 105/105 gezielte Tests bestanden, Exitcode 0.
- 601/601 Tests der Gesamtsuite bestanden, Exitcode 0.
- Unabhängige Codeprüfung: keine kritischen oder wichtigen Befunde.
- `git diff --check` und die Prüfung des vorgemerkten Diffs: ohne Fehler.

Der Hauptagent prüfte zusätzlich die Browserfälle mit vorhandenem Playwright
und Edge; die Umgebungsvariablen `PLAYWRIGHT_MODULE` und `BROWSER_EXECUTABLE`
zeigten auf die installierten Werkzeuge:

```text
node --test --experimental-test-isolation=none --test-name-pattern='^(C2 rejected required precache|trainer sync and restore exposes|trainer unbound discovery|trainer offline starts|trainer offline update|earned points|server session appears)' tests/browser/trainer.browser.mjs tests/browser/purchases.browser.mjs tests/browser/server-auth.browser.mjs
```

7/7 bestanden, keine Fehler oder übersprungenen Fälle, Exitcode 0. Abgedeckt
sind Kauf/Wiederöffnung/unklare Antwort, Sitzung nach Reload, abgewiesener
Precache, Sicherungsimport, ungebundene Einrichtung, Offline-Neustart und
kontrolliertes Update. Diese Browserfälle verwenden synthetische Daten und
ersetzen keine reale Google- oder Geräteabnahme.

## Private Bereitstellung

Cache v30 ist seit `2026-09-28T16:52:37.311Z` mit Worker-Version
`6d687e33-66b1-4f26-9ab9-99771d809809` zu 100 Prozent aktiv. Die bestehende
lokale Betreiberkonfiguration und der bereits eingerichtete geschützte
Uploadzugang wurden verwendet. Drei Assets wurden hochgeladen, 158 erneut
verwendet; Vorbereitung und Upload endeten mit Exitcode 0.

Um `2026-09-28T16:52:50.684Z` wurden HTML, Service Worker, Laufzeitkonfiguration,
Drive-Client und Sicherungstransport öffentlich mit HTTP 200 abgerufen und
bytegenau mit dem geprüften Paket verglichen. Im getrennten Codex-Browser
erschien das Updateangebot. Nach „Jetzt aktualisieren“ erschien das Profil
weiterhin mit Level 9 und 1.600 Punkten. Die Erwachsenenansicht verlangt nach
dem Reload erwartungsgemäß erneut die lokale Test-PIN.

## Erneuter realer Einrichtungsversuch

Nach der vom Nutzer bestätigten Entsperrung war die Google-Verbindung ohne
erneute Anmeldung aktiv. Mit exakt demselben Namen wurde der gespeicherte
Einrichtungsauftrag fortgesetzt. Die Oberfläche meldete anschließend
„Der Lernbereich wurde angelegt.“ und „Vollständig abgeglichen.“ Vier alte
Ereignisse der leeren Ersteinrichtung bleiben getrennt erhalten; sie wurden
nicht zur Übernahme ausgewählt. Der Testimport wurde nicht wiederholt.

Damit gelingt der zuvor gescheiterte Ablauf mit v30 auch beim echten
Google-Zugriff. Das konkret geänderte Metadatenfeld der früheren Versuche ist
weiterhin nicht aufgezeichnet; aus dem erfolgreichen Ablauf wird keine
rückwirkende feldgenaue Diagnose abgeleitet.

Die anschließende Vorschau zur Aktivierung von Figuren und Käufen zeigte
den synthetischen Lernbereich mit „Kauftest: 1600 Lernpunkte, Level 9“.
Die Aktivierung wurde einmal bestätigt. Nach 82,259 Sekunden stand noch
die Vorschau; spätestens nach 110,577 Sekunden war „Figuren und Käufe sind
bereit.“ sichtbar.

Bei der Aktivierung blieb die Vorschau mindestens 82 Sekunden unverändert.
Die lesende Codeprüfung erklärt die fehlende Zwischenanzeige: Der Handler
aktualisiert erst nach Abschluss oder Fehler, ohne den Bestätigungsbutton
zwischenzeitlich zu sperren. Der Auftrag wurde deshalb nur einmal ausgelöst.
Die Aktivierung veröffentlicht unter anderem Sicherungsteile und die
wirtschaftliche Ausgangsbasis mit anschließender Nachprüfung. Die frühere
Reduktion auf 34 Anfragen je Kauf-Dreiergruppe betrifft diese einmalige
Einrichtung nicht. Die Browser-Drive-Abrufe besitzen keinen eigenen Zeitabbruch;
der Server begrenzt seine einzelnen Google-Abrufe jedoch mit
`AbortSignal.timeout(10_000)`. Ein Gesamtabbruch für den vollständigen Kauf
ist daraus nicht abzuleiten. Die Wartezeit allein belegt weder einen Hänger
noch Erfolg.

## Echter Kauf, Auswahl und Neuladen

Im Testprofil erschien die Drachenreihe mit 1.600 verfügbaren Punkten und
1.600 Lernpunkten. Für „Einfacher Drache – Stufe 2“ wurde einmal die Vorschau
angefordert. Der Dialog war nach 26,927 Sekunden sichtbar und zeigte
200 Punkte Preis sowie 1.400 Punkte danach. Die Bestätigung wurde genau einmal
betätigt. Nach 98,722 Sekunden stand noch „Kauf wird bestätigt …“; spätestens
nach 118,821 Sekunden waren „Der Kauf ist bestätigt.“, der Besitz von Stufe 2
und 1.400 verfügbare Punkte sichtbar. Die Lernpunkte blieben bei 1.600,
das Level bei 9. Stufe 3 wurde für 400 Punkte angeboten.

Diese Zeitpunkte wurden außerhalb der Seite an UI-Beobachtungen gemessen.
Sie begrenzen den beobachteten Ablauf, sind keine genaue Messung einzelner
HTTP-Anfragen und kein Vorher-nachher-Vergleich. Der Nutzer berichtet selbst
eine Kaufbestätigung von **über zwei Minuten** und beanstandet genau diese
Wartezeit. Der funktionale Erfolg bedeutet ausdrücklich **keine Abnahme des
Tempos**.

Anschließend wurde Stufe 2 bewusst gewählt; die App bestätigte
„Die Entwicklungsform wurde ausgewählt.“ Nach echtem Neuladen der Seite
zeigte „Meine Figur“ weiterhin Stufe 2 als ausgewählte Figur sowie
1.400 verfügbare Punkte, 1.600 Lernpunkte und Level 9. Der getrennte Teststand
bleibt geöffnet. Das übrige Guthaben reicht für Stufe 3 und 4; im normalen
Chrome-Familienstand wurden keine Punkte oder Käufe geändert.

## Vorrangiger Folgeauftrag: Kaufwartezeit

Der Nutzer benennt die Wartezeit als weiterhin ungelöstes Hauptproblem.
Die bisherige Optimierung eines Uploadteils von 54 auf 34 Anfragen ist kein
Nachweis für einen schnellen Gesamtkauf. Die aktuelle Untersuchung verfolgt
deshalb den vollständigen Bestätigungsweg einschließlich Lernabgleich,
wiederholter Kopfprüfung, Upload, Veröffentlichung und abschließender Ansicht.
Noch keine weitere Tempoänderung bereitgestellt. Natürlicher Tokenablauf,
Zweitgerät und Apple-Abnahme bleiben gesondert offen.

### Vollständige synthetische Ablaufmessung

Der Diagnosehelfer `scripts/measure-purchase-requests.mjs` verwendet dieselbe
1.600-Punkte-Sicherung und die echten Laufzeitmodule für ProductSync,
Kaufintegration, Kaufdienst und Drive-Transport. Nur die Google-HTTP-Grenze
wird durch das vorhandene Testdouble im eigenen Prozess ersetzt; reales
`fetch` ist ausdrücklich gesperrt. Es werden keine Browser oder Zugangsdaten
verwendet. Die Vorbereitung nutzt `backupLedger` und die echte Aktivierung;
sie rekonstruiert nicht jede historische Datei des realen Testbereichs.

Erste ausgeführte Messungen über den danach portabilisierten Diagnosehelfer:

| Vorgang | HTTP-Anfragen | Lokal ohne Netzwartezeit | Mit angeforderten 10 ms je Anfrage |
| --- | ---: | ---: | ---: |
| Kaufvorschau | 63 | 437 ms | 1.267 ms |
| Kaufbestätigung | 234 | 1.465 ms | 4.867 ms |
| Ansicht vorher / nachher | 0 / 0 | 6 / 9 ms | 9 / 9 ms |

Beide Läufe bestätigen den Kauf und 1.400 verfügbare bei 1.600 Lernpunkten;
maximal drei HTTP-Anfragen liefen parallel. Die Windows-Timer halten
angeforderte 10 ms nicht exakt ein. Diese Zeiten enthalten keine echte
Google-, Cloudflare-, D1-, Browser- oder IndexedDB-Latenz. Sie sind keine
sekundengenaue Erklärung des Nutzerversuchs.

Die vollständige Bestätigung zerfällt im gemessenen Szenario so:

| Abschnitt | HTTP-Anfragen |
| --- | ---: |
| Erster vollständiger Lernabgleich | 51 |
| Kaufkopfprüfung danach | 4 |
| Zweiter vollständiger Lernabgleich bei der Reservierung | 51 |
| Kaufkopfprüfung danach | 4 |
| Koordinatorprüfung für den Kandidaten | 4 |
| Fünf einzelne ID-Reservierungen | 10 |
| Uploadgruppe mit drei Dateien | 34 |
| Uploadgruppe mit zwei Dateien | 26 |
| Koordinatorprüfung vor Veröffentlichung | 4 |
| Geschützte Pointer-Veröffentlichung | 12 |
| Abschließende Koordinatorprüfung | 4 |
| Nachlesen der fünf neuen Kaufobjekte | 30 |
| **Summe** | **234** |

Nach Anfrageart sind es 92 Kontoabfragen, 100 Metadatenabrufe, 29
Inhaltsabrufe, zwei Dateilisten, fünf ID-Reservierungen, fünf Uploads und
ein Pointer-Schreibzugriff. `getView` verwendet anschließend die lokale
geprüfte Historie und erzeugt hier keine Netzabrufe. Jeder Lernabgleich
enthält selbst 27 gewöhnliche Drive-Abfragen, zehn zur Kaufentdeckung und
14 zur gemeinsamen Kaufprüfung. Die alte Zahl 34 beschreibt allein die
erste der beiden Uploadgruppen.

Die unabhängige Codeanalyse bestätigt die Abfolge in
[`confirmInternal` und `reservePurchase`](../../src/trainer/purchases/service.js),
die zusätzliche Kontoabfrage vor jedem gebundenen Kaufabruf im
[Transport](../../src/trainer/purchases/transport.js) sowie das erneute Lesen
eines schon gelesenen Snapshot-Manifests in
[ProductSync](../../src/trainer/sync/drive.js) und
[Sicherungstransport](../../src/trainer/backup/transport.js).
Gecachte Kaufhistorie wird erneut lokal geprüft; nicht alle alten Kaufobjekte
werden bei jeder Prüfung erneut aus Drive geladen.

### Begrenzter Verbesserungsvorschlag, noch nicht umgesetzt

Der frisch geprüfte Stand einer Bestätigung könnte innerhalb desselben
Auftrags bis zur Reservierung weitergereicht werden, sofern Zustand und
Bindung nachweislich unverändert sind. Bei Wiederaufnahme oder Abweichung
wäre weiterhin vollständig abzugleichen. Aktueller Koordinatorkopf, ETag,
`If-Match`, persistierter Auftrag und abschließende Bestätigung bleiben
erforderlich. Im gemessenen Ablauf könnten dadurch 55 doppelte Anfragen
entfallen: 234 → 179.

Gemeinsame Reservierung der fünf benötigten IDs könnte weitere acht Anfragen
sparen; Wiederverwendung des bereits vollständig geprüften Manifests innerhalb
eines einzigen Abgleichs weitere drei. Das ergibt einen **ungeprüften Zielwert
von 168 statt 234 Anfragen** für dieses Szenario, rund 28 Prozent weniger.
Hash-, Inhalts-, Revisions- und Bindungsprüfungen bleiben Bedingungen des
Vorschlags. Das ist weder implementiert noch ein Versprechen einer bestimmten
realen Dauer. Konto-/Sicherheitsgrenzen des Serverzugangs werden dadurch nicht
geändert. Eine weitergehende Umstellung auf serverseitige Kaufkoordination
wäre eine eigene Architekturentscheidung.

Reproduktion der lokalen Diagnose aus der Repositorywurzel:

```powershell
node scripts/measure-purchase-requests.mjs
$env:SYNTHETIC_HTTP_DELAY_MS='10'
node scripts/measure-purchase-requests.mjs
Remove-Item Env:SYNTHETIC_HTTP_DELAY_MS
```

Die detaillierte Ausgabe liegt ausschließlich im ignorierten Ordner
`.superpowers`; sie enthält synthetische IDs. Echte Request-Zeiten der
Produktionssitzung sind bislang nicht aufgezeichnet.

Der abschließende Lauf über den portablen Skriptpfad bestand ebenfalls:
63 Anfragen/438 ms für die Vorschau, 234 Anfragen/1.488 ms für die Bestätigung,
korrekter Kauf und keine unerwarteten Testdouble-Anfragen. Eine unzulässige
Verzögerung von 26 ms wurde mit Exitcode 1 vor dem Ablauf zurückgewiesen.
Die Dokumentationsprüfung und `git diff --check` bestanden. Produktcode und
bereitgestellter Stand bleiben durch diese Diagnose unverändert bei v30.
