# Task 12 – Offline-PWA und kontrollierte Updates

## Ergebnis

Der Vokabeltrainer wird jetzt als eigenständige PWA unter seinem relativen `trainer/`-Pfad ausgeliefert. Manifest, Icon und Service Worker verwenden ausschließlich relative URLs und funktionieren deshalb sowohl unter `/trainer/` als auch unter einem Repository-Unterpfad wie `/repo/trainer/`. Der versionierte Cache gehört eindeutig zum jeweiligen Trainer-Scope. Er enthält nur die vollständige bekannte Programmoberfläche und ihre expliziten lokalen Modulabhängigkeiten, einschließlich `src/trainer/ui/preview.js` und der importierten Drive-Module. Google-Antworten, Tokens, JSON-Sicherungen und beliebige Laufzeit-URLs werden weder abgefangen noch gecacht.

Die Installation verwendet `cache.addAll` als atomaren Programmsatz. Eine fehlgeschlagene Installation löscht keinen bereits aktiven Cache. Bei der Aktivierung werden ausschließlich ältere Produktcaches desselben Scopes entfernt; Probe- und fremde Caches bleiben erhalten. Der Fetch-Handler beantwortet nur exakt benannte GET-Programmdateien aus dem eigenen Cache und verwendet sonst das Netz, ohne Antworten nachträglich einzulagern.

Neue Programmversionen bleiben zunächst wartend. Die App zeigt dafür eine eigene, außerhalb der jeweils gerenderten Übungsansicht liegende Meldung. Die Schaltfläche folgt dem aktuellen Rundenstatus und verlangt bei einer laufenden Runde ausdrücklich „Runde pausieren und aktualisieren“. Erst danach sendet der Update-Controller `ACTIVATE_UPDATE`; neu geladen wird ausschließlich nach `controllerchange`. Listener werden bei `pagehide` entfernt.

## Pause- und Speichergrenze

Ruling 24 wurde ohne neues Draft- oder Rundenschema umgesetzt. `shell.pauseForUpdate()` prüft die bereits vorhandenen Zustände:

- Nicht abgesendete, nicht leere Texteingabe blockiert die Aktivierung mit dem Hinweis, die Antwort zuerst abzusenden oder zu leeren. Die Eingabe wird weder gelöscht noch automatisch gewertet.
- Eine tatsächlich laufende Practice-Aktion aus dem vorhandenen `ui.busy`-Zustand blockiert die Aktivierung wiederholbar, bis ihr Commit abgeschlossen ist.
- Einrichtung und Erwachsenenansicht blockieren die Aktivierung, damit kein dort laufender oder noch nicht abgeschlossener Formularvorgang überladen wird.
- Eine leere Eingabe oder vollständig gespeichertes Feedback bildet eine sichere Grenze. Es wird kein `next`, `finish` oder `abandon` ausgelöst; deshalb entsteht weder ein Aufgabeereignis noch ein Rundenbonus. Die bestehende lokale Runde und der Shell-Pfad bleiben erhalten.

Der Update-Controller prüft zusätzlich, dass der aufrufende Appclient tatsächlich vom aktiven Worker derselben Registrierung gesteuert wird. Der wartende Worker akzeptiert nur `ACTIVATE_UPDATE` von einem Client innerhalb seines Scopes.

## Schnittstellen und Dateien

Die verlangte Schnittstelle `createUpdateController({registration,hasActiveRound,pauseAndSave,reload,onAvailable})` liefert unverändert `{check(),activate({pauseConfirmed=false}={}),destroy()}`. Es gibt keine Abweichung von diesem Vertrag.

Eng begrenzte Integrationsschnittstellen sind hinzugekommen:

- `practiceUpdateBlocker(root)` liest nur den vorhandenen Practice-UI-Zustand und die sichtbare Antwort; es verändert nichts.
- `shell.pauseForUpdate()` bestätigt oder verweigert die sichere lokale Update-Grenze.
- `createProbeServer({basePath})` kann denselben expliziten Dateisatz unter einem normalisierten Test-Unterpfad ausliefern.
- Der Browserharness kann einen eigenen persistenten synthetischen Profilordner starten, den eigenen Testserver schließen und testseitig dieselbe echte Workerquelle mit einer zweiten Cacheversion ausliefern. Dafür wurden keine Produkt-Testglobals und keine zusätzliche Produkt-HTTP-Schnittstelle eingeführt.

## RED/GREEN

Erster RED-Lauf:

- `node --test tests/trainer/sw.test.js tests/trainer/updates.test.js` – in der Sandbox `spawn EPERM`; dies war ein Umgebungsfehler des isolierenden Node-Testprozesses.
- `node --test --experimental-test-isolation=none tests/trainer/sw.test.js tests/trainer/updates.test.js` – 0/5; `trainer/sw.js` und `src/trainer/updates.js` fehlten erwartungsgemäß.
- Nach der Minimalimplementierung: 7/7 bestanden.

Zweiter RED/GREEN-Zyklus:

- Fokussierte Update-/Servertests – 3 Fehler: fehlende Trainer-PWA-Routen, fehlender `/repo`-Unterpfad und noch nicht aufgerufene sichere UI-Grenze ohne aktive Runde.
- Nach Server- und Controllerintegration – 10/10 bestanden.
- Ergänzter Installationsfehler-Test – 1/5 rot, weil der vorhandene gleichnamige Produktcache gelöscht wurde; nach Entfernung dieses Löschpfads 5/5 grün.

Browser-RED:

- `node --test --test-name-pattern="trainer offline" tests/browser/trainer.browser.mjs` scheiterte in der Sandbox zunächst mit `spawn EPERM`.
- Außerhalb der Sandbox mit isolationsfreiem Runner zunächst 0/2: Es gab noch keinen kontrollierenden Produkt-Worker und keine Update-Meldung.
- Nach der ersten Integration erneut 0/2: Der neue Tab traf korrekt die vorhandene Ein-Tab-Schreibsperre, solange der erste Tab offen blieb; außerdem wurde `installed` vor der sichtbaren `waiting`-Eigenschaft gemeldet. Der Test schließt seitdem den alten Tab vor dem neuen kontrollierten Tab, und der Controller prüft den wartenden Worker im nächsten Task.
- Danach 2/2 bestanden. Ein zusätzlicher RED-Lauf zeigte die zunächst veraltete Beschriftung „Jetzt aktualisieren“, wenn das Update vor und die Runde nach der Meldung begann; nach Bindung an Zustandscommits bestand der fokussierte Fall.

Abschließende aktuelle Prüfungen:

- `node --test tests/trainer/sw.test.js tests/trainer/updates.test.js` – 9/9 bestanden, 0 fehlgeschlagen, 91 ms.
- `node --test --test-name-pattern="trainer offline" tests/browser/trainer.browser.mjs` – 2/2 bestanden, 0 fehlgeschlagen, 6,88 s.
- `node --test --experimental-test-isolation=none tests/browser/trainer.browser.mjs` – 10/10 bestanden, 0 fehlgeschlagen, 51,89 s.
- `npm test` – 270/270 bestanden, 0 fehlgeschlagen, 6,17 s.
- `git diff --check` – sauber vor dem Commit.

## Tatsächlicher Browsernachweis

Der Offlinefall verwendet System-Edge und pro Pfad einen neu angelegten, synthetischen persistenten Profilordner. Nach erfolgreicher Online-Erstladung wird der Worker kontrollierend, anschließend wird das Browsernetz auf offline gesetzt und der eigene HTTP-Testserver wirklich geschlossen. Der erste Tab wird wegen der vorgesehenen Ein-Tab-Schreibsperre geschlossen; ein neuer kontrollierter Tab startet die App ausschließlich aus dem Cache, öffnet das synthetische Profil und speichert eine richtige Antwort. Danach wird der gesamte persistente Browserkontext geschlossen und mit demselben Profilordner bei weiterhin geschlossenem Server und offline gesetztem Netz neu gestartet. Profil, Runde und gespeichertes Feedback bleiben verfügbar. Derselbe Ablauf bestand für `/trainer/` und `/repo/trainer/`.

Der Updatefall verwendet die echte Workerdatei. Der Testharness liefert nach dem aktiven v1-Worker testseitig dieselbe Quelle mit Cacheversion v2. `registration.update()` erzeugt einen echten wartenden Worker und beide Produktcaches sind vor der Freigabe vorhanden. Nicht abgesendete Eingabe und ein im selben Browser-Task begonnener Antwort-Commit lassen v2 warten. Nach gespeichertem Feedback erzeugt die bewusste Pause weder `round.completed` noch `round.abandoned`; `controllerchange` lädt die App neu, das Feedback bleibt sichtbar und nur der v2-Cache bleibt zurück.

## Selbstreview und Grenzen

Die Produktdateien enthalten keine Testglobals, echte PIN, Client-ID, Token, Kontokennung oder Lerndaten. DOM-Ausgabe entsteht über erzeugte Knoten und `textContent`. Cachefilter und Server bleiben explizite Positivlisten. Der Probe-Service-Worker und fremde Caches werden weder gelesen noch gelöscht. Der bestehende `pagehide`-/BFCache-Lebenszyklus bleibt erhalten und schließt zusätzlich den Update-Controller.

Nicht nachgewiesen sind Installation und Darstellung auf echtem iPhone/iPad, Safari und Home-Bildschirm, die Gerätetastatur sowie eine echte bereitgestellte HTTPS-Umgebung. Das SVG-Appicon und die PWA-Installierbarkeit bleiben Teil dieser späteren realen Geräteabnahme. Es wurde kein Hosting geändert, keine App veröffentlicht, kein Google-Konto verwendet und kein echter Google-Datensatz angelegt. Die Cacheversion muss bei einer künftigen geänderten Programmauslieferung bewusst erhöht werden; der echte v1→v2-Test belegt diesen vorgesehenen Wechsel.

Codecommit: `8798dd2 feat: support isolated offline startup and safe updates`.

## Fixrunde 1 nach Review

Diese Fixrunde ersetzt für Cachebesitz und Update-Aktivierung die oben beschriebene Erstfassung. Der wartende Worker akzeptiert insbesondere keine direkte Aktivierungsnachricht eines Fenster-Clients mehr.

### Behobene Reviewbefunde

- **R1 – Cachegrenze:** Der Cachebesitz verwendet nun den vollständig mit `encodeURIComponent` kodierten Scope-Pfad und einen abschließenden Eigentümertrenner. Dadurch kollidieren etwa `/a/b/trainer/` und `/a-b/trainer/` nicht mehr. Beim Aktivieren wird nur eine ältere Version mit exakt demselben Eigentümerpräfix gelöscht. Ein Cache eines verschachtelten Scopes, Probe-Caches und fremde Caches bleiben erhalten. Die Produkt-Cacheversion ist `v2`.
- **R2 – kontrollierter Client:** Der Fenster-Client sendet eine eindeutige Request-ID ausschließlich an den aktiven Worker. Dieser verifiziert den Absender mit `clients.matchAll({type: 'window', includeUncontrolled: false})`, prüft Scope und Client-ID und leitet erst dann an den wartenden Worker weiter. Der wartende Worker akzeptiert `ACTIVATE_UPDATE` ausschließlich vom in seiner Registrierung eingetragenen aktiven Worker. Eine Ablehnung wird nur für die aktuelle Request-ID an den aufrufenden Client zurückgesendet; der Controller akzeptiert sie nur vom erwarteten aktiven Worker.
- **R3 – Bedienzeitlücke:** Nach der sicheren Speichergrenze setzt `shell.pauseForUpdate()` eine lokale Sperre, `#app.inert` und `aria-busy="true"`. Interne Navigation ist währenddessen ebenfalls gesperrt. Die Sperre bleibt bis zum echten `controllerchange` und damit bis zum Reload bestehen. Ein synchroner Relayfehler, eine aktive Ablehnung oder das Zeitlimit von zehn Sekunden gibt die Oberfläche wieder frei. Ein späteres `controllerchange` nach dieser Freigabe löst keinen automatischen Reload mehr aus.
- **M1 – weitere UI-Grenzen:** Der echte Browsertest prüft zusätzlich den Einrichtungsentwurf und die Erwachsenenansicht. Beide verweigern die Aktivierung, erhalten die sichtbare Eingabe beziehungsweise Ansicht und lassen den neuen Worker weiter warten.

`pauseAndSave()` darf jetzt eine idempotente Freigabefunktion zurückgeben. `destroy()` entfernt Update-, Nachrichten- und Controller-Listener, löscht den Timer und gibt eine noch gehaltene Sperre frei. Es wurde kein Draft-, Runden- oder Persistenzschema ergänzt.

### RED/GREEN der Fixrunde

- Cache-RED: `node --test --experimental-test-isolation=none tests/trainer/sw.test.js` – 4/6 bestanden; der verschachtelte Fremdscope wurde gelöscht und zwei verschieden segmentierte Scopes öffneten denselben Cache. Nach der Eigentümergrenze: 6/6 grün.
- Relay-RED: derselbe Befehl – 5/7 bestanden; ein Fenster-Client konnte `ACTIVATE_UPDATE` noch direkt auslösen und es gab keinen Active-Worker-Relay. Nach dem Relay: 7/7 grün. Der anschließende Ablehnungstest war 7/8 rot und nach der requestgebundenen Antwort 8/8 grün.
- Controller-RED: `node --test --experimental-test-isolation=none tests/trainer/updates.test.js` – 2/7 bestanden; Request-ID, wartendes Promise, Fehlerfreigabe und Schutz vor spätem `controllerchange` fehlten. Nach der Controlleränderung: 7/7 grün. Ein zusätzlicher RED/GREEN-Zyklus präzisierte den Timeout-Hinweis auf bewusstes Neuöffnen.
- Browser-RED: Nach zwei Korrekturen ausschließlich am Testaufbau erreichte der echte Updatefall die erwartete rote Produktgrenze: `page.waitForFunction(() => document.querySelector('#app')?.inert === true)` lief nach 30 Sekunden ab. Nach der Shell-Sperre bestand derselbe gezielte Test 1/1 in 3,40 Sekunden.

Aktuelle Nachweise der Fixrunde:

- `node --test --experimental-test-isolation=none tests/trainer/sw.test.js tests/trainer/updates.test.js` – 15/15 bestanden, 0 fehlgeschlagen, 46 ms.
- `node --test --experimental-test-isolation=none --test-name-pattern "trainer offline update UI" tests/browser/trainer.browser.mjs` – 1/1 bestanden, 0 fehlgeschlagen, 3,44 s.
- `node --test --experimental-test-isolation=none --test-name-pattern "trainer offline starts" tests/browser/trainer.browser.mjs` – 1/1 bestanden, 0 fehlgeschlagen, 4,68 s. Darin liefen weiterhin sowohl `/trainer/` als auch `/repo/trainer/` nach geschlossenem Server in neuem Tab und nach persistentem Browserneustart.
- `npm test` – 276/276 bestanden, 0 fehlgeschlagen, 7,19 s.
- `git diff --check` – sauber vor dem Fixcommit.

### Reale Workergrenze und Fehlerbedienung

Der Update-Browsertest startet mit dem echten Produktworker `v2`. Der Testserver ersetzt ausschließlich dessen Cacheversionszeile durch `v3` und fügt testseitig vor dem echten `skipWaiting()` eine Verzögerung von 750 ms ein. Eine direkte Seitennachricht an den wartenden `v3`-Worker bleibt wirkungslos. Der anschließende erfolgreiche Wechsel belegt damit den Weg Fenster-Client → aktiver `v2`-Worker → wartender `v3`-Worker. Während der Verzögerung ist die App inert, die Antwort nicht editierbar und eine programmgesteuerte interne Navigation wirkungslos. Erst `controllerchange` lädt neu; gespeichertes Feedback bleibt sichtbar und nur der eigene `v3`-Cache bleibt zurück.

Nach Timeout, Ablehnung oder synchronem Fehler wird die App wieder bedienbar. Wechselt der Worker danach verspätet, wird nicht automatisch neu geladen, damit inzwischen neu eingegebener Text erhalten bleibt. Der sichtbare Timeout-Hinweis fordert dazu auf, offene Eingaben zu sichern und die App bewusst neu zu öffnen. Ist kein Worker mehr wartend, lehnt ein weiterer Aktivierungsversuch mit „Es wartet noch keine neue Programmversion“ ab; es wird keine automatische Wiederholung behauptet.

### Selbstreview und verbleibende Grenze

Das alte, mehrdeutige Cacheformat aus der Erstfassung (`vokabeltrainer-product-…`) wird beim Wechsel bewusst nicht gelöscht: Wegen der nachgewiesenen Kollision kann kein Worker sicher erkennen, welchem Scope ein solcher Cache gehört. Es kann daher als ungenutzter Altcache bis zur Browserbereinigung bestehen bleiben. Diese Speicherrestgrenze ist sicherer als das Löschen eines möglicherweise fremden Scopes; neue Caches sind eindeutig getrennt und werden versionsweise korrekt bereinigt.

Die gesamte Browser-Suite wurde in dieser Fixrunde nicht erneut ausgeführt; die beiden von Cache- und Updateänderung betroffenen realen Browserfälle wurden frisch geprüft. Die vollständige Node-Suite ist frisch grün. Echte iPhone-/iPad-/Safari- und HTTPS-Installationsabnahme bleibt weiterhin offen.

Fixcommit: `2b369e3 fix: harden scoped offline update activation`.
