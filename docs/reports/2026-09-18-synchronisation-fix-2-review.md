# Task 9 – unabhängige Nachprüfung der Korrekturrunde 2

Prüfbasis: `ef9bec0` → `37c459f8768774a1d20804749a83dcbc30274af3`. Umfang: N1/N2 der ersten Nachprüfung und neue Fehler im Korrekturdiff. Die dazwischenliegenden Änderungen des Controllers in `a50ffeb` betreffen Dokumentation und Git-Textattribute.

## Befundverdicts

- **N1 – Paketduplikate überspringen später auflösbare Ereignisse — ADDRESSED.** `src/trainer/sync/drive.js:646` unterscheidet dauerhaft bestätigte Paket-IDs von noch offenen Kandidaten. Identische physische Dateien eines offenen Kandidaten werden als Duplikate gesammelt. Die vorzeitige Übernahme von `verifiedPackets` in den persistenten Index ist entfernt; erst nach erfolgreichem Ledger-Merge werden alle physischen Dateien bestätigt und der Paketindex geschrieben. Referenzfehler hinterlassen alle Kopien in Quarantäne. Die neue Regression `tests/trainer/sync.test.js:350` prüft den noch leeren Integritätsindex, das spätere Elternpaket, einen echten Neustart von Commands und Sync aus dem gespeicherten Zustand und anschließend das tatsächlich übernommene Kindereignis samt `synced`.
- **N2 – Pending-Zähler verdecken Auth-/Fehlerstatus — ADDRESSED.** `src/trainer/sync/drive.js:188` erhält `connect` und `error` vor der Ableitung von Konflikt-/Pending-Phasen. Die Zähler werden weiterhin aus dem neuesten bestätigten Zustand berechnet. Die neue Regression `tests/trainer/sync.test.js:555` prüft sowohl 401/`connect` als auch 403/`error`, den unmittelbaren Statusabruf, einen weiteren lokalen Commit mit aktualisiertem Pending-Zähler und die erfolgreiche explizite Wiederholung bis `synced`. Damit ist der konkrete reproduzierte Befund aus Runde 1 behoben.

## Neue Fehler im Korrekturdiff

**None.** Keine neuen Critical-/Important-/Minor-Befunde in den geprüften Änderungen.

## Out-of-Scope Observations

- **O1 – Nichtblockierende Beobachtung für die spätere Gesamtintegration:** Die unveränderten frühen Statuszweige `src/trainer/sync/drive.js:179`–`:186` behandeln einen ungebundenen Zustand zuerst als `local` beziehungsweise einen offenen `datasetSetup` zuerst als `pending`. Ein bei Discovery oder Einrichtung publizierter Auth-/Fehlerstatus kann dort weiterhin vor dem neuen Erhaltungszweig überschrieben werden. Dieses Verhalten bestand schon vor Runde 2 und gehört nicht zu deren neuem Diff oder der konkret korrigierten N2-Reproduktion am gebundenen Datensatz. Beim Task-11-Vertrag für Authfehler aus Discovery/Create/Join mitprüfen und in der Gesamtprüfung nachverfolgen.

## Prüfungen und Grenzen

- Korrekturdiff, neue Regressionen und Abschnitt „Korrekturrunde 2“ des Implementierungsberichts gelesen; keine erneute Gesamtprüfung und keine Gitbefehle.
- Bericht benennt den fokussierten Befehl `node --test --experimental-test-isolation=none tests/trainer/sync.test.js` mit **20/20** bestandenen Tests sowie `npm test` unter Node 22.23.2 mit **227/227** bestandenen Tests. Ergebniszusammenfassungen und abgedeckte Fehlerpfade mit dem Diff abgeglichen; Läufe nicht erneut ausgeführt.
- Keine verbleibende konkrete Unsicherheit im Korrekturdiff erforderte eine weitere Reproduktion. UI-/Serverdateien wurden durch diese Korrektur nicht verändert; keine Browserwiederholung. Reale Google-/Geräteprüfungen bleiben offen.
- Ausschließlich diesen Reviewbericht geschrieben; keine Produkt-, Index- oder HEAD-Änderungen.

## Rundenverdict

**All findings addressed, no new Critical/Important breakage.** N1 und N2 sind behoben; Korrekturrunde 2 bestanden. O1 bleibt als separate Beobachtung für die spätere Gesamtintegration dokumentiert.
