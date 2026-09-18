# Task 11 – Abgleich-, Konflikt- und Sicherungsoberflächen

## Ergebnis

Die Erwachsenenansicht bietet jetzt den vollständigen, bewusst bestätigten Ablauf für Google-Drive-Verbindung, Datensatzanlage/-suche/-beitritt, manuellen und geplanten Abgleich, Inhalts- und Wiederherstellungskonflikte, JSON-Sicherungen, sichere Wiederherstellung sowie die Übernahme getrennt erhaltener Altänderungen. Alle Texte der Hauptauswahl verwenden fachliche Angaben wie Kind, Wort, Lektion und Datum; technische Ereignis-, Epochen- und Snapshot-IDs werden nicht als Auswahlbeschriftung gezeigt.

`main.js` verbindet die vorhandenen Drive-, Sync-, Restore- und Scheduler-Dienste. Google Identity Services wird erst beim bewussten Verbinden geladen. Die öffentliche Client-ID wird erst nach erfolgreicher Verbindung lokal gespeichert; Zugriffstokens bleiben in der RAM-Sitzung. 401-Fehler aus Suchen, Anlegen, Beitreten und Abgleichen invalidieren diese Sitzung und verlangen eine neue bewusste Anmeldung. Scheduler, Abonnements und Ereignis-Listener werden bei `pagehide` geschlossen. Statusänderungen aktualisieren nur die Statusanzeige und rendern keine laufende Übung neu; der Browsertest belegt, dass nicht abgeschlossene Eingabe und Fokus den Hintergrundabgleich überstehen.

`sync.js` bildet die fünf vereinbarten Zustände exakt ab: „Auf diesem Gerät gespeichert“, „Abgleich ausstehend“, „Abgeglichen“, „Mit Google verbinden“ und „Abgleich fehlgeschlagen“. Der Datensatzbeitritt reicht `previewId` und `safetyCopyId` unverändert zur Bestätigung weiter. Inhaltskonflikte zeigen beide sicheren Textfassungen und erzeugen bei Auswahl eine gemeinsame Revision. Wiederherstellungskonflikte verlangen eine ausdrückliche Kopfauswahl anhand von Datum und Datenstand. Altänderungen bleiben sichtbar, können einzeln ausgewählt und erst nach Punkte-/Inhaltsvorschau übernommen werden.

`backup.js` exportiert die vollständige gültige JSON-Sicherung und meldet ausschließlich „Download gestartet“. Bei konkurrierenden Epochen ist der Download bis zur bewussten Kopfauswahl gesperrt. Import prüft Version und Grenzen vor jeder Änderung. Der modale Dialog ist scrollbar, fängt Tab/Escape ab, bricht ab, stellt den Fokus auch nach einem zwischenzeitlichen Zustands-Render am neu verbundenen Dateiauslöser wieder her und bestätigt nie eine stale Vorschau: Nach einer zwischenzeitlichen Änderung erzeugt der Dienst eine neue Vorschau, zeigt die neuen Unterschiede und verlangt eine zweite ausdrückliche Bestätigung. Persistierte Restorejobs in `uploading`/`published` werden nach Neustart mit derselben `previewId` fortgesetzt. Sicherheitskopien werden ausschließlich über die Service-IDs und -Datumswerte gelistet und heruntergeladen.

Die PIN wird vor und nach jedem asynchronen Erwachsenen-Vorgang geprüft. Ein Wechsel in den Hintergrund schließt offene Dialoge, sperrt die Erwachsenenansicht und macht ein währenddessen abgeschlossenes Google-Popup unbrauchbar; danach sind erneute PIN-Eingabe und bewusste Google-Verbindung erforderlich. Es gibt keinen globalen Resetknopf, keine echte PIN, kein Token und keine persönliche Client-ID in Code, Tests, Bildern oder Bericht.

Der übernommene Task-6-Befund ist behoben: `#app` bleibt das einzige `main`-Landmark; `#adult-content` ist nun ein beschrifteter `section`-Bereich. Der Browsertest prüft genau ein `main`. Beide neuen Browsermodule stehen in der expliziten Server-Whitelist.

## RED/GREEN und Regressionen

- RED Browser: `node --test --test-name-pattern="trainer sync and restore" tests/browser/trainer.browser.mjs` – 0/1, Timeout auf der noch nicht vorhandenen Eingabe „Öffentliche Google-Web-Client-ID“ (31,1 s).
- RED O1: `node --test --experimental-test-isolation=none --test-name-pattern="unbound discovery" tests/trainer/sync.test.js` – 0/1; erwartet `connect`, tatsächlich `local`.
- GREEN O1: derselbe Node-Befehl – 1/1 bestanden. `getStatus()` erhält nun `connect`/`error` auch im ungebundenen und unterbrochenen Setupzustand.
- GREEN vollständig Node: `npm test` – 260/260 bestanden, 0 fehlgeschlagen (ca. 6,94 s).
- GREEN vollständig Browser vor der ergänzten reinen Sichtprüfung: `node --test tests/browser/trainer.browser.mjs` – 6/6 bestanden, 0 fehlgeschlagen (ca. 34,86 s).
- GREEN Task-11 fokussiert nach Main-Lifecycle- und Beschriftungskorrektur: `node --test --test-name-pattern="trainer sync and restore" tests/browser/trainer.browser.mjs` – 3/3 bestanden, 0 fehlgeschlagen (25,87 s).
- GREEN Fokusregression nach dem letzten Dialogfix: `node --test --test-name-pattern=deliberate tests/browser/trainer.browser.mjs` – 1/1 bestanden, 0 fehlgeschlagen (13,90 s).

Die Zweikontextprüfung deckt den bewussten Beitritt mit exakt weitergereichten Vorschau-/Sicherheitskopie-IDs, zwei Offline-Wortfassungen, Ausschluss des Konfliktworts aus Übungen, gemeinsame Erwachsenenrevision, Restore auf Gerät A, spätere Offline-Antwort auf Gerät B, getrennte Erhaltung, Punkte-Vorschau und bewusste Übernahme ab. Sie unterbricht zusätzlich den Restore-Upload, lädt Gerät A neu und setzt denselben persistierten Job fort; anschließend ist die über den Dienst geführte Drive-Sicherheitskopie in der Oberfläche verfügbar.

Die mobilen synthetischen Ansichten für zukünftige Importversion, stale Restorevorschau, Wortkonflikt, Altänderung, Epochenkonflikt und Epochenexport wurden bei 390 × 844 px angesehen. Dialog und Seiten bleiben vertikal scrollbar, Schaltflächen und Texte sind lesbar, beide Wortfassungen sowie die datierten Datenstände sind unterscheidbar und keine rohe ID erscheint als Hauptauswahl. Die horizontale Erwachsenen-Navigation bleibt per Wischen scrollbar. Die Bilder liegen nur im ignorierten `test-results/` und enthalten ausschließlich synthetische Daten.

## Selbstreview, Grenzen und Schnittstellen

`git diff --check` ist sauber. Neue UI-Ausgabe entsteht ausschließlich über DOM-Knoten und `textContent`; es gibt kein `innerHTML`, keine Test-Produktions-Globals und keine geheimen Werte. Der Selbstreview korrigierte außerdem das vorzeitige GIS-Laden, entfernbare Scheduler-Listener, nichtfachliche Epochenlabels, Abstand zwischen Auswahlknöpfen und die Fokuswiederherstellung nach einem durch Service-Commit ersetzten Dateielement.

Die geforderten öffentlichen Schnittstellen bleiben erhalten. `isUnlocked` und `onRefresh` sind optionale interne Integrationsparameter der Renderer; es gibt keine Abweichung am Drive-, Sync-, Backup- oder Restore-Servicevertrag. `src/trainer/sync/drive.js`, `tests/trainer/sync.test.js` und `tests/browser/google-fixture.mjs` wurden zusätzlich zu den ursprünglich benannten Taskdateien geändert, weil der ausdrücklich übernommene O1-Fix samt Node-Regression und die Popup-/PIN-Prüfung diese eng begrenzten Anpassungen verlangen.

Die Browserprüfung verwendet synthetische GIS-/Drive-Antworten und System-Edge. Eine echte Google-Anmeldung, echte iPhone-/iPad-Abnahme und die PWA-Installation bleiben spätere Nachweise. Task 12 kann an den dokumentierten Lebenszyklus anschließen: laufende Runden bleiben im Shellzustand erhalten; Commit-Abonnements melden Änderungen an den Scheduler, Rundenabschluss löst sofortigen Abgleich aus, Statusupdates ersetzen die Übungsoberfläche nicht, und `pagehide` schließt Scheduler, Sync, Auth, Store sowie Shell. Eine PWA oder Hostingänderung wurde nicht implementiert.

Codecommit: `41c3404 feat: expose safe sync conflict and restore workflows`.

## Fixrunde 1 nach unabhängiger Prüfung

Ausgangspunkt war die vollständige unabhängige Prüfung in `docs/reports/2026-09-18-abgleich-sicherung-oberflaeche-review.md` gegen `41c3404`. Die drei als Important eingestuften Befunde R1–R3 wurden korrigiert. M1 und M2 bleiben entsprechend der Reviewsteuerung für Task 13 dokumentiert und wurden in dieser Fixrunde nicht vorgezogen.

### Korrekturen

- **R1 – unmittelbare Auswahlreaktion:** Epochenwahl und Abwahl setzen den Zustand von „Sicherung herunterladen“ direkt im `change`-Handler. Der Browser wählt, wählt wieder ab, wählt den anderen Kopf und lädt anschließend eine echte konfliktbehaftete JSON-Sicherung herunter. Altänderungs-Checkboxen aktivieren beziehungsweise sperren „Auswahl prüfen“ ebenfalls unmittelbar. Auswahl, Abwahl und erneute Auswahl werden in derselben DOM-Instanz vor einem möglichen Scheduler- oder Hintergrund-Render geprüft.
- **R2 – prüfbare Vorschau:** Der neue reine Präsentationshelfer `src/trainer/ui/preview.js` erhält ausschließlich bereits vorliegende Zustands-, Summary- und Ereignisdaten. Er zeigt benannte Kinder und Vokabeln, Punkte, geänderten Wortlernstand, vollständige Vorher-/Nachher-Inhalte, Konfliktfassungen und ihre Felder. `preview.eventIds` erscheint unter „Ausgewählte Änderungen“; `preview.supportEventIds` erscheint getrennt unter „Nur benötigte Grundlagen“ mit dem ausdrücklichen Hinweis, dass diese Belege keine zusätzliche Wertung geben. Der Zweikontextfall verwendet dafür eine bewusst neue Offline-Runde, sodass die ausgewählte richtige Antwort eine echte `round.started`-Supportabhängigkeit besitzt.
- **R3 – unterscheidbare Konfliktentscheidungen:** Profilfassungen nennen Kind und Aktiv-/Archivstatus. Lektionsfassungen nennen Name, Status und die freigegebenen Kinder. Wortfassungen nennen Lektion, deutsches Wort, Lösungen, Hinweis, Status und die Lernstand-Zuordnung; unterschiedliche Lern-IDs werden als getrennte, nummerierte Lernentwicklung beschrieben, nie als rohe ID. Der Browser prüft echte Konflikte „Ada aktiv/archiviert“, „Hund in Unit 1/Unit 2“ und „Unit 1 für Ada/kein Kind“.

Der Helper greift auf keinen Dienst zu und verändert keinen Zustand. `backup.js` und `sync.js` bleiben für Ablauf, PIN-Prüfung und Bestätigung verantwortlich. Es gab keine Änderung an Datenformat, Backup-/Restore-Service oder Sync-Vertrag. `preview.js` wurde in die explizite Server-Whitelist und den zugehörigen Servertest aufgenommen.

### RED/GREEN der Fixrunde

- RED Assetvertrag: `node --test --experimental-test-isolation=none --test-name-pattern="serves only named" tests/serve.test.js` – 0/1; `/src/trainer/ui/preview.js` lieferte erwartungsgemäß zunächst 404 statt 200 (99 ms).
- RED R1–R3: `node --test --test-name-pattern="trainer sync and restore" tests/browser/trainer.browser.mjs` – 0/4. Die vier fachlich erwarteten Fehler waren: fehlende stale Vorher-/Nachher-Darstellung, fehlende Fassungen in der Restore-Konfliktvorschau, nach Epochenwahl weiterhin deaktivierter Download und fehlende Archivierungs-/Zuordnungsangaben (117,97 s wegen der absichtlich fehlenden Elemente).
- RED ergänztes R3-Feld: `node --test --test-name-pattern="archive and assignment" tests/browser/trainer.browser.mjs` – 0/1; „Lernstand: bleibt bei allen Fassungen gleich“ fehlte (31,46 s).
- GREEN Assetvertrag: derselbe fokussierte Servertest – 1/1 bestanden (156 ms).
- GREEN einzeln: Epochenwahl/-download 1/1 (1,56 s), stale Inhaltsvorschau 1/1 (13,95 s), Archivierungs-/Zuordnungskonflikte einschließlich Lernstand 1/1 (1,39 s), Zweikontext-Konflikt-/Support-/Altänderungsablauf 1/1 (4,89 s).
- GREEN gemeinsam betroffen: `node --test --test-name-pattern="trainer sync and restore" tests/browser/trainer.browser.mjs` – 4/4 bestanden, 0 fehlgeschlagen (20,62 s).
- GREEN Node vollständig: `npm test` – 260/260 bestanden, 0 fehlgeschlagen (6,60 s).

Die aktualisierten mobilen Ansichten der stale Vorschau, Altänderung und des Epochenexports wurden erneut angesehen. Die Vorschau bleibt scrollbar; Hund, Ada, Unit 1/2, konkrete Lösungen und Lernwerte sind lesbar. Die angezeigten Informationen enthalten keine rohen Ereignis-, Epochen-, Snapshot-, Profil-, Lektions-, Wort- oder Lern-IDs. Ausgabe entsteht weiterhin ausschließlich über DOM-/Textknoten; `git diff --check` war vor dem Commit sauber.

Fixcommit: `d026a4b fix: make sync and restore choices reviewable`.

## Fixrunde 2 nach der fokussierten Nachprüfung

Ausgangspunkt war R2 der unabhängigen Nachprüfung in `docs/reports/2026-09-18-abgleich-sicherung-oberflaeche-fix-1-review.md`. Wenn der aktuelle Stand einer Vokabel zwei sichere Fassungen enthielt, das gewählte Sicherungsziel aber eindeutig war, zeigte die Wiederherstellungsvorschau bislang nur den Platzhalter „mehrere sichere Fassungen“. Die beiden zu ersetzenden Inhalte blieben unsichtbar.

Der gemeinsame Präsentationshelfer löst nun jeden Kopf der konfliktbehafteten Vorher-Seite über die Ereignisse des aktuellen Zustands auf. Jede Fassung erhält eine eigene Überschrift und zeigt alle entscheidungsrelevanten Felder; beim geprüften Wort „Hund“ sind damit beide bisherigen englischen Lösungen `dog / hound / pooch` und `dog / hound / canine` sichtbar, getrennt vom eindeutigen Ziel `dog / hound`. Der Backup-Renderer erhält einen aktuellen Zustandszugriff aus der Erwachsenenansicht. Dieser Zugriff wird beim Öffnen jeder Vorschau erneut ausgewertet, daher verwendet auch eine nach einer stale-Ablehnung neu vorbereitete Vorschau die dazu passende aktuelle Ereignismenge.

### RED/GREEN der Fixrunde 2

- RED: `node --test --test-name-pattern="concurrent word versions" tests/browser/trainer.browser.mjs` – 0/1; Timeout auf der erwarteten Überschrift „Vorherige Fassung 1“, weil die konfliktbehaftete Vorher-Seite noch nur als Platzhalter erschien (41,85 s).
- GREEN gezielt: derselbe Befehl – 1/1 bestanden; beide bisherigen Schreibweisen und das eindeutige Ziel wurden im echten Zweikontext-Restoreablauf unterschieden (15,06 s).
- GREEN gemeinsam betroffen nach der abschließenden DOM-Selbstreviewkorrektur: `node --test --test-name-pattern="trainer sync and restore" tests/browser/trainer.browser.mjs` – 4/4 bestanden, 0 fehlgeschlagen (20,96 s).

`git diff --check` war sauber. Die Darstellung erzeugt weiterhin ausschließlich DOM- und Textknoten und zeigt keine technischen Kopf- oder Ereignis-IDs. Es gab keine Änderung am Datenformat, Backup-/Restore-Servicevertrag oder Synchronisationsvertrag. Entsprechend der Fixrundensteuerung wurde die vollständige Node-Suite nicht erneut ausgeführt; die Änderung betrifft nur den UI-Helfer, dessen Backup-Aufrufer und den abdeckenden Browserfall. R1 und R3 blieben in den vier betroffenen Abläufen grün. M1 und M2 bleiben für Task 13 vorgemerkt.

Fixcommit: `2a37a25 fix: show replaced conflict versions in restore preview`.
