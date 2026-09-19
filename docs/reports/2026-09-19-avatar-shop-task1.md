# Task 1: isolierte Shop-Koordinationsprobe

Stand: 19.09.2026. Implementiert, Node-/Serverchecks und isolierte Browserprüfung bestanden; echter Drive-Nachweis noch offen. Keine Produktintegration, kein Commit oder Push durch Aufgabenagent.

## Umfang

- Neue isolierte Seite `shop-probe/` mit expliziter GIS-Anmeldung, ausdrücklicher Checkbox/Startaktion, gleichem `drive.file`-Scope und vorbereiteter öffentlicher Client-ID.
- Alle Drive-Zugriffe sind auf in genau dieser Sitzung selbst reservierte/angelegte Probe-IDs beschränkt. Keine Suche, kein Öffnen bestehender Datensätze, kein Löschen. Die markierten synthetischen Dateien bleiben zur manuellen Nachprüfung erhalten.
- Tokens ausschließlich in vorhandener In-Memory-TokenSession; Bericht enthält weder Token noch Konto-/Datei-IDs oder Rohfehler. Report nennt Browser, Ursprung, Zeiten, API-Pfade und Ergebnisse/Grenzen.
- Separater Adapter für Create/Readback, starke browserlesbare ETags, bedingtes JSON-Medien-PATCH und bedingtes Ordner-Metadaten-PATCH. Fehlender Header ist unsupported, HTTP 412 eigener stale-Fehler. Nie versionsloser Schreibfallback.
- Ein gemeinsamer synthetischer Datensatzkoordinator prüft parallele Ausgaben und Rücksetzung über dieselbe Bedingung. Genesis-Bindung wird getrennt per Ordner-Metadaten-CAS geprüft. Vorbereitete zweite Kontodatei ist wirkungslos.
- 11 sichtbare Szenarien: Fixture, Versionsheader, ungültiger Token, verbrauchter Token, Initialisierung, parallele Käufe, verworfene Erfolgsantwort und später weitergeschriebener Stand, doppelte Vorgänge/Besitz, beide Reset-Reihenfolgen, Create-409/Inhaltsprüfung und konflikthafte Guthabengrundlage.

## Grenzen

- Zwei logische Clients im selben Browser, keine zwei physischen Geräte.
- Antwortverlust bedeutet absichtliches lokales Verwerfen der angenommenen Erfolgsantwort; kein echter Leitungsabbruch. Keine Behauptung über einen weiterhin serverseitig laufenden abgebrochenen Request.
- Synthetische Proberegeln, keine Produktledger-/Backup-/Altclient-/Epochenmigration. `productReady` bleibt stets false.
- Medien- und Metadaten-ETag sind explizite separate Kandidaten; UI wechselt niemals still. Ein erfolgreicher Lauf belegt seinen konkreten Browser-/HTTP-Pfad, keine allgemeine dokumentierte API-Garantie.
- Live-Drive wurde durch den Aufgabenagenten weder angemeldet noch beschrieben. Root koordiniert die autorisierte Echtprüfung.

## Nachweise

RED: `node --test --experimental-test-isolation=none tests/shop-probe/*.test.js` vor Implementierung: beide Testdateien fehlgeschlagen, da die neuen Zielmodule noch fehlten.

GREEN: `node --test --experimental-test-isolation=none tests/shop-probe/*.test.js tests/serve.test.js`: 17/17 bestanden. Darunter HTTP-Fakes, die If-Match ignorieren, nur Metadatenbedingungen ignorieren, ETags nicht freigeben oder trotz 412 Daten überschreiben. Keiner dieser unzureichenden Adapter passiert das Gate.

`node scripts/check-docs.mjs`: 365 Dateien, 109 Markdown, 548 lokale Links, keine Fehler. `git diff --check`: ohne Befund (Zwischenstand vor diesem Report).

Browserprüfung vorbereitet: `tests/shop-probe/browser.mjs`, eigener freier Port, frische Edge-Kontexte, simulierte GIS-/Drive-Grenze, Root/Unterpfad, 320px, expliziter Start, Berichtdownload, keine Browserpersistenz, Screenshots nur unter `test-results/shop-probe/`.

Browserlauf zunächst durch Umgebung blockiert: Standard-Node-Testisolation stößt auf `spawn EPERM`; der vom Dependencytool vermutete Playwright-Pfad existiert dort nicht. Root lieferte den vorhandenen lokalen Browserruntime-Pfad. Existenz von Playwright und Edge geprüft; Start in Sandbox scheiterte ebenfalls an `spawn EPERM`. Derselbe begrenzte Test außerhalb der Sandbox lief erfolgreich: **2/2 bestanden**, Root und Unterpfad, 320px, ausdrücklicher Start, 11 Probeszenarien mit synthetischer Google-Grenze, bereinigter Download, kein LocalStorage/IndexedDB, keine Seitenfehler. Screenshots unter `test-results/shop-probe/root.png` und `subpath.png`. Keine Zusatzinstallation.

Ausgeführter Browserbefehl: `node --test --experimental-test-isolation=none tests/shop-probe/browser.mjs`, mit `PLAYWRIGHT_MODULE` aus `.superpowers/sdd/2026-09-16-google-drive-probe/browser-runtime/node_modules/playwright/index.mjs` und vorhandenem Edge über `BROWSER_EXECUTABLE`. Beide Umgebungsvariablen sind reine lokale Testvoraussetzungen und werden nicht in der App benötigt.

## Reale Probe: nächste Schritte

1. `/shop-probe/` über einen bereits im Google-Projekt erlaubten App-Ursprung öffnen. Kein Wechsel des Origins/Ports ohne Prüfung; ein beliebiger Testport kann von Google abgewiesen werden. Persönlichen Produktserver auf 4173 nicht ersetzen.
2. „Mit Google verbinden“ bewusst betätigen und den bestehenden gemeinsamen Google-Zugang auswählen. Bis hier entstehen keine Probe-Dateien.
3. Kandidat zunächst „Medienantwort (alt=media)“ lassen. Checkbox für neue synthetische Dateien setzen und „Probe-Dateien anlegen und prüfen“ starten.
4. Alle elf Resultate abwarten. Erwartung: ungültige/veraltete Bedingungen werden mit 412 abgelehnt und Gewinnerinhalte bleiben nach erneutem Lesen erhalten; nur ein Initialisierer und einer von zwei 800-Punkte-Käufen gewinnen; Wiederholung bleibt einmalig; Reset teilt die Schreibgrenze.
5. Bereinigten Bericht herunterladen. Bei unsupported oder Fehlschlag keine Shopfreigabe. Ein zweiter expliziter Lauf mit „Metadatenantwort“ prüft einen anderen Tokenkandidaten und legt einen neuen markierten Probeordner an. Kein automatischer Fallback.
6. „Sitzung hier beenden“ verwirft nur das lokale Token; die Probe-Dateien bleiben unverändert in Drive. Kein automatisches Löschen und keine Änderung der Google-Projektkonfiguration.

Auch elf reale Erfolge bedeuten nur den konkret geprüften Browser-/HTTP-Pfad. Tatsächlicher Leitungsabbruch, getrennte physische Geräte, Produktmigration, alte weiterlaufende Clients, echte Backup-Rücksetzung und iPhone/iPad bleiben offen. Produktshop bleibt bis zum abgestimmten vollständigen Koordinationsnachweis gesperrt.

## Geänderte eigene Pfade

`src/shop-probe/`, `shop-probe/`, `tests/shop-probe/`, `scripts/serve.mjs` (nur explizite Routen), `package.json` (zwei gezielte Prüfbefehle), `tests/serve.test.js` (Routenmatrix). Root bearbeitet Dokumentation separat.
