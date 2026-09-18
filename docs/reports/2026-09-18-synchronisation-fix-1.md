# Task 9: Synchronisationskorrektur 1

Stand: 18.09.2026. Grundlage war Produktcommit `a1db93f` auf `codex/vokabeltrainer-v1` sowie die neun wichtigen Befunde der unabhängigen [Synchronisationsreview](2026-09-18-synchronisation-review.md). Während der Korrektur wurde zusätzlich ein reproduzierter Browserstartfehler aufgenommen: Der lokale Server lieferte das von `commands.js` benötigte Paketmodul nicht aus.

## Ergebnis

Die neun Reviewbefunde und der Serverbefund sind in dieser ersten Korrekturrunde behoben und durch fokussierte Regressionen abgedeckt:

1. Normale Datensatzordner dürfen den My-Drive-Wurzelordner als Parent besitzen. Der synthetische Adapter bildet das jetzt ab; Anlage, Abgleich und Beitritt laufen mit diesem realistischen Metadatenwert.
2. Der bestätigte Beitritt prüft Datensatzidentität und lokalen Leerstand innerhalb jedes CAS-Versuchs neu. Eine parallel gespeicherte Profiländerung bleibt erhalten und führt sichtbar zu `not-ready`.
3. Ein Version/Hash-Cacheeintrag entsteht nur, wenn beide Metadatenlesungen eine vorhandene identische Drive-Version liefern. Fehlt eine der Versionen, wird beim nächsten Lauf erneut gelesen.
4. Authentifizierungs-, Berechtigungs-, Netz-, Missing-, Stale- und Bindungsfehler werden nicht als dauerhafte Inhaltsquarantäne gespeichert. Ein erfolgreich erneut bestätigter Cachetreffer entfernt einen entsprechenden Alt-Quarantäneeintrag.
5. `packetIntegrity` speichert `{packetId,contentHash}` sortiert und eindeutig. Der Hash ist der kanonische SHA-256-Digest der vollständigen Pakethülle. Eine gleiche logische Paket-ID mit anderem Hash wird auch über getrennte Abgleichläufe und physische Drive-Dateien hinweg abgewiesen.
6. `datasetSetup` speichert `{accountId,name,folderId,descriptorFileId,epochFileId,datasetId,descriptor,rootEpoch}` nach der Reservierung aller drei Drive-IDs und vor der ersten schreibenden Drive-Operation. Wiederholung nutzt exakt diese Werte. Nach bestätigter Bindung wird der Auftrag auf `null` gesetzt; `restoreJobs` bleibt unverändert.
7. Commands bieten ein Änderungsabonnement. Der Synccontroller leitet daraus unmittelbar einen neuen, aus dem bestätigten Zustand berechneten Status ab; lokale Änderungen setzen `synced` sofort auf `pending`. `destroy()` löst das Abonnement für den späteren Main-Lebenszyklus.
8. Der Scheduler erhält die früheste vorhandene Frist. Wiederholte Änderungen und das Ende eines laufenden Abgleichs können die maximale Bündelzeit von zehn Sekunden nicht nach hinten verschieben.
9. Dateilokale Inhalts-, Versions-, Kollisions- und Referenzprobleme bleiben sichtbar, blockieren aber keine unabhängigen lokalen Pakete. Konto-/Ordnerbindung und Transportfehler stoppen weiterhin den gesamten Lauf. Ein Paket, dessen eigene reservierte Datei quarantänisiert ist, wird nicht blind überschrieben.
10. Der begrenzte lokale Server liefert die drei Task-9-Module `packets.js`, `drive.js` und `scheduler.js` als JavaScript aus. Die Traineroberfläche startet dadurch wieder im echten Browser.

Alte gültige Zustände der Speicherversion 1 ohne `datasetSetup` und/oder `packetIntegrity` werden beim Laden zu `null` beziehungsweise `[]` normalisiert. Der leere Altindex wird durch erneutes Lesen bekannter Dateien aufgebaut, weil ein Überspringen weiterhin eine in derselben Sitzung bestätigte Version/Hash-Zuordnung verlangt. Beide neuen Felder sind lokaler Transportzustand und werden nicht Bestandteil portabler Backups.

## RED/GREEN und Prüfungen

Vor den Produktänderungen schlugen die neuen Regressionen erwartungsgemäß fehl: Serverantwort `404` für `/src/trainer/sync/packets.js`, fehlende Legacy-Normalisierung, auf 19 Sekunden verschobene Änderungsfrist sowie die reproduzierten Join-, Versionscache-, Quarantäne-, Paketkollisions-, Setup-, Status- und Uploadpfade. Anschließend bestanden die fokussierten Dateien gemeinsam mit **49/49 Tests**:

```text
node --test --experimental-test-isolation=none \
  tests/trainer/sync.test.js tests/trainer/scheduler.test.js \
  tests/trainer/commands.test.js tests/serve.test.js
```

Der vollständige Node-Lauf bestand unter Node 22.23.2 mit **225 Tests, 225 bestanden, 0 fehlgeschlagen**:

```text
npm test
```

Der erste Browserstart innerhalb der eingeschränkten Sandbox scheiterte erwartungsgemäß an `spawn EPERM`. Der anschließend freigegebene Lauf mit Playwright 1.62.1 und System-Edge bestand vollständig mit **4/4 Szenarien**:

```text
node --test --experimental-test-isolation=none tests/browser/trainer.browser.mjs
```

Damit sind die echten Modulabrufe, Setup, Übungsablauf, Hintergrundentwertung, Erwachsenenverwaltung, Persistenz, BFCache, Inselreise und Avatar mit synthetischen Browserdaten geprüft. Der Lauf nutzt weder echtes Google Drive noch persönliche Browserdaten.

## Integrationspflichten und Grenzen

- Task 10 muss `datasetSetup` und `packetIntegrity` ausdrücklich aus portablen Backups ausschließen; `restoreJobs` erhält keine Setup-Zweitbedeutung.
- Task 11 erstellt genau einen Synccontroller, verwendet dessen `onStatus`- und bestehende Authentifizierungsgrenze und ruft beim Abbau `destroy()` auf. Das Commands-Abonnement ersetzt keine zweite Main- oder Tokenlogik.
- Der Server führt die Task-9-Module nur als statische, ausdrücklich erlaubte Produktdateien. Die eigentliche Main-Integration von Drive und Scheduler bleibt Task 11.
- Reales Google Drive, zwei physische Geräte, Safari sowie iPhone/iPad wurden in dieser Runde nicht geprüft und bleiben offen.

## Korrekturrunde 2

Die unabhängige Nachprüfung der ersten Runde bestätigte die ursprünglichen zehn Befunde als behoben und fand zwei neue wichtige Wechselwirkungen. Beide wurden am 18.09.2026 mit neuen Regressionen zuerst reproduziert:

- Zwei physische Dateien desselben referenzunvollständigen Kindpakets schrieben den logischen Paketindex bereits vor erfolgreicher Übernahme. RED: Der fokussierte Test fand `duplicate-child-packet` fälschlich in `packetIntegrity`, bevor die Elternrevision vorlag.
- Ein 401-/403-Fehler wurde korrekt als `connect` beziehungsweise `error` gemeldet, aber `getStatus()` setzte die Phase wegen lokaler Pending-Ereignisse sofort wieder auf `pending`. RED: Erwartet war `connect`, geliefert wurde `pending`.

Der Download gruppiert nun identische physische Dateien eines noch nicht übernommenen logischen Pakets. Erst ein erfolgreicher Ledger-Merge schreibt `packetIntegrity`; dann werden alle geprüften physischen Kopien gemeinsam als bekannt bestätigt. Bei fehlender Referenz bleiben alle Kopien quarantänisiert und nach einem Neustart erneut mergefähig. Bereits dauerhaft übernommene Paket-IDs dürfen weiterhin identische weitere physische Kopien ohne erneute Wertung bestätigen.

Die Statusableitung erhält `connect` und `error` einschließlich aktualisierter Pending-Zähler über nachfolgende lokale Commits hinweg. Erst eine ausdrücklich gestartete neue Operation (`retry()` oder `sync()`) setzt die Arbeitsphase wieder auf `pending`; ein erfolgreicher Lauf endet anschließend wieder in `synced`.

Fokussierte GREEN-Prüfung:

```text
node --test --experimental-test-isolation=none tests/trainer/sync.test.js
20 Tests, 20 bestanden, 0 fehlgeschlagen
```

Vollständige GREEN-Prüfung unter Node 22.23.2:

```text
npm test
227 Tests, 227 bestanden, 0 fehlgeschlagen
```

Die UI- und Serverdateien blieben in Runde 2 unverändert; deshalb wurde der bereits bestandene 4/4-Browserlauf nicht unnötig wiederholt. Reale Google-/Geräteabnahmen bleiben weiterhin offen.
