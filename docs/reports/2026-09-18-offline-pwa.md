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
