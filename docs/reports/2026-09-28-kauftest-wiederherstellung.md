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

Der erneute reale Einrichtungsversuch und der Kauf stehen noch aus. Die
synthetisch belegte Korrektur allein beweist weder das konkrete geänderte
Metadatenfeld des ursprünglichen Fehlers noch seine Behebung im echten Ablauf.
