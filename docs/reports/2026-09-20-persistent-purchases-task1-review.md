# Task 1 Review: Spec und Qualität

**Spec Compliance: ❌ Nicht vollständig erfüllt.**
**Task quality: Needs fixes.**

Reviewbereich: `f54bd5d42762959c8c2dd8b2f746d417c0706706..7ec80fd1a0d67a423d8740603924f4d6df5ee3e2`, ausschließlich Task-1-Diff. Keine Implementierung, kein Commit, keine Suite wiederholt.

## Stärken

- `src/trainer/purchases/history.js:48`, `:114`, `:273`: iterative Graphprüfung, erneutes Hashen und kontextbezogene Operationsidentität sind klar getrennt.
- `src/trainer/purchases/history.js:213`: frühere aktive Fakten und Antwortpositionen werden gegen Veränderung beziehungsweise Verdrängung geschützt.
- `src/trainer/purchases/projection.js:40`, `:86`: Kaufberechtigung berücksichtigt direkte Vorgänger; Punkte kommen aus der Lernprojektion. `tests/trainer/purchases-contract.test.js:150` prüft getrennte 300-Punkte-Konten und den unveränderten Lernstand nach Ausgabe.
- `src/trainer/purchases/history.js:370`, `:381`: Cachewerte werden erneut gehasht, der Zielkopf muss die vorherige Zielkette erweitern.
- `tests/trainer/purchases-contract.test.js:294`: erster Fremdrestore wird mit neuen physischen IDs und ohne ursprüngliche Quelldateien geprüft.

## Important: vor Freigabe beheben

### 1. Kauf kann ohne Restore eine neue Epoche aktivieren

`src/trainer/purchases/history.js:308-319`: `assertExtends` entfernt Dataset-/Epochenhüllen beim Vergleich; anschließend wird `economic.activeEpochId` ausdrücklich auf die neue Basis gesetzt. Dadurch kann ein Kaufbeleg mit identischen aktiven Fakten in einer anderen Epoche erfolgreich replayen. Es fehlt die Bedingung, dass Kaufepoche und vorherige aktive Epoche identisch bleiben.

Enger Repro mit vollständig gehashten Basen und Belegen: Initialisierung in `e0`, Kauf in `e-new`, kein Restorebeleg. Replay akzeptiert und liefert `PURCHASE_WITHOUT_RESTORE_ACTIVATES e-new`.

Kauf muss die bisherige Epoche erhalten; nur ein zulässiger Restore darf wechseln. Negativtest für Kaufbasis mit anderer Epoche ergänzen.

### 2. Restore reaktiviert bereits verwendete Epochen

`src/trainer/purchases/history.js:336-343` prüft Herkunft/Fakten, aber keine frische Zielepoche. `tests/trainer/purchases-contract.test.js:443-451` erwartet ausdrücklich 1000 Restoretransaktionen abwechselnd auf `e1` und `e0`. Damit bestätigt der Langtest gerade die unzulässige Reaktivierung statt einer Historie mit neuen Restoreepochen.

Gemäß Controller-Rückmeldung bindet der bestätigte Entwurf Restore an eine neue Epoche. Wiederverwendung kann verspätete Offline-Ereignisse einer früheren Epoche erneut aktivieren. Replay muss verwendete Zielepochen innerhalb der jeweiligen Binding berücksichtigen und Wiederverwendung ablehnen. Langtest auf echte neue Epochen umstellen; Wiederverwendung einschließlich derselben aktuellen Epoche separat abweisen. Keine Suite zur erneuten Bestätigung dieses bereits sichtbaren Testvertrags ausgeführt.

### 3. Zweiter Fremdrestore verliert verschachtelte portable Provenienz

`src/trainer/purchases/history.js:139-154` zählt nur Belege, Basismanifeste und Basisteile zur Closure. Die in diesen Belegen referenzierten Proofmanifeste und deren physischen Mappingobjekte fehlen. `:178` verbietet zusätzliche Closureobjekte; `:435-448` und `:477` benötigen beim Lesen einer schon fremdrestaurierten Quelle trotzdem deren ursprüngliches Proofmanifest und Mappingdateien.

Enger Repro: Konto A initialisiert; B restauriert A mittels portabler Proofdateien; B wird nach C mit dem dokumentierten vollständigen Beleg-/Basisnachweis restauriert. Erster Restore funktioniert (`FIRST_FOREIGN_RESTORE_OK e-b`); zweiter scheitert mit `history: Ein unveränderlicher Historienwert fehlt: review-object-8.` Die fehlende ID ist das alte Proofmanifest aus B. A/B-Dateien waren absichtlich nicht im Lesespeicher von C.

Die portable Closure muss verschachtelte Proofabhängigkeiten vollständig abbilden oder eine gleichwertige überprüfbare Abflachung definieren. Alle ursprünglichen Belegbodies/Hashes müssen unverändert bleiben. Test A → B → C mit ausschließlich neuen C-Datei-IDs und unverändertem Besitz/Ausgaben ergänzen.

### 4. Persistierter Pointerversuch braucht weder gelesenen Kopf noch ETag

`src/trainer/purchases/schema.js:153-168` erlaubt in allen Phasen `head:null` und `etag:null`; ab `reserved` ist lediglich der Kandidat verlangt. Der Kandidat wird außerdem nicht mit `attempt.head` verknüpft. `:212-215` bindet einen Kandidaten nur dann an den Kaufauftrag, wenn der Kandidat überhaupt ein Intent enthält; ein Initialisierungs-/Restorebeleg kann daher die Prüfung umgehen.

Enger Repro mit echter gehashter Kauf-/Basisclosure: `assertCommerce` akzeptiert `phase:'pointer-pending', head:null, etag:null` (`POINTER_PENDING_WITHOUT_HEAD_ETAG_ACCEPTED pointer-pending`). Damit erfüllt der dauerhafte Vertrag nicht die Voraussetzung einer ausdrücklich wiederholbaren Pointeroperation mit identischem gespeichertem Kandidaten und ETag. Rehash allein in späteren Tasks behebt diese Strukturverletzung nicht.

Ab einer schreibfähigen Kaufphase Kopf und nichtleeren ETag verlangen, `candidate.previous === attempt.head` prüfen und einen zum Job identischen Kauf-Intent verpflichtend machen. Abweichende Bindings/Setupkonfigurationen zusätzlich an den Integrationsgrenzen prüfen.

## Minor

- `src/trainer/purchases/history.js:483`, `:498`: `await Promise.resolve()` gibt nur an die Microtask-Queue ab und garantiert keine Eventloop-/Rendering-Pause. Die dokumentierte Zusage einer Eventloop-Abgabe spätestens nach 32 Objekten ist so nicht erfüllt; insbesondere Proof- und Basisobjektschleifen sind zudem nicht in diese Zählung eingeschlossen. Echte kooperative Abgabe verwenden oder die Zusage passend spezifizieren.
- `src/trainer/purchases/history.js:415`: alle Leserfehler werden zu `history` umgewandelt. Bestehende maschinenlesbare Netzwerk-/Authentifizierungscodes gehen verloren, obwohl die Basislesung solche Codes durchreicht. Für Task 2/3 relevante ursprüngliche ProductError-Codes bewahren.

## Prüfung und Grenzen

- Das erste kombinierte Toolergebnis war abgeschnitten. Nur die dadurch nicht lesbaren Diffsegmente wurden in begrenzten Abschnitten nachgelesen; kein erneutes Git-Diff konstruiert. Für abschließende Zeilenreferenzen erfolgte eine gezielte Symbolsuche.
- Einziger Blick außerhalb des Diffs: `src/trainer/model/canonical.js`, um die konkrete Risikoannahme zu prüfen, ob die delegierten JSON-/Hash-Helfer gefährliche Schlüssel, nicht endliche Zahlen und Zyklen tatsächlich ablehnen. Sie tun dies.
- Ein enges schreibfreies Node-Skript führte ausschließlich die drei oben benannten offenen Vertragsfragen aus: Epochenwechsel beim Kauf, Pointerversuch ohne Kopf/ETag und wiederholter Fremdrestore. Es endete erfolgreich und lieferte die oben zitierten Ergebnisse. Keine Testsuite wiederholt, keine Testdatei angelegt.
- Berichtete RED/GREEN-Ergebnisse (47/47 fokussiert, 389/389 gesamt, Dokumentationscheck) wurden gelesen, aber nicht erneut ausgeführt. Sie decken die reproduzierten Lücken nicht ab.
- ⚠️ Cross-Task: Controller muss Task 2/3 an vollständige konfigurierte Binding einschließlich Descriptorhash/Koordinator sowie auf gespeicherte Uploadkandidaten und deren erneutes Hashen binden. Der reine Replayvertrag bekommt keine erwartete Konfiguration; reine Konstanz eines Koordinators ersetzt diesen Abgleich nicht.
- ⚠️ Cross-Task: Lokales Speichern vor Netzoperation, Neustart zuerst lesend, ausdrückliche Pointerwiederholung, Migrationssicherung, unveränderte V1/V2-Upload-IDs, nicht ausführbare Backupjobs und reale Drive-/Apple-/Zwei-Geräte-Abnahme sind in diesem reinen Kern-Diff nicht nachweisbar und bleiben Aufgaben späterer Tasks.

**Assessment:** Die Aufteilung und die Prüfung einfacher Kaufketten sind brauchbar. Epochengrenzen, wiederholt portable Herkunft und der persistierte Versuchsvertrag brauchen Korrekturen, bevor Task 1 als freigegebene Grundlage für Task 2 gelten kann. Auf Nutzerwunsch Pause; keine Fixes begonnen.
