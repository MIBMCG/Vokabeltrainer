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

Commit: `feat: expose safe sync conflict and restore workflows` (SHA in der Taskübergabe, da dieser Bericht Bestandteil desselben Commits ist).
