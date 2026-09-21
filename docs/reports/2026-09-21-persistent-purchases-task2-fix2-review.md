# Task 2 – Nachprüfung Korrekturrunde 2

Stand: 21.09.2026. Fixbasis `c84b8bc`, geprüfter Fix `cd6ba45a7b3cbdb5d852ddc8c1e58250cc547a8d`.

**Spezifikationsurteil: bestanden für diesen Task-2-Fix. Qualitätsurteil: bestanden für diesen Task-2-Fix.** Der einzige offene Important-Befund aus der Fix-1-Nachprüfung ist **ADDRESSED**. Keine neuen Critical-, Important- oder Minor-Befunde im geprüften Fixdiff.

## Geprüfte Korrektur

Der snapshotfreie Setup-PUT kann eine installierte Configref nicht mehr ersetzen. In `src/trainer/purchases/transport.js:557` liest der Transport den Bestandsordner unabhängig vom optionalen Caller-Snapshot selbst frisch und gebunden. Ein vorhandener anderer Config-ID-/Hash-Verweis wird vor dem PUT mit `binding` abgewiesen. Eine identische vollständige Referenz liefert ebenfalls vor dem PUT `{id,status:null,unchanged:true}`.

Diese Entscheidung folgt auf die Prüfung des gespeicherten Configbodyhashs, des vollständigen gebundenen unveränderlichen Configinhalts und der gespeicherten Pointerproperties einschließlich ihrer Größen-/Anzahlgrenzen. Die vorhandene gebundene Ordnerlesung weist Teilanker und fremde Appmarker ab. Es entsteht keine Autorität aus einem lokalen Cache oder einem optionalen Caller-Snapshot.

Die frische Rootlesung wird ausschließlich zur Prüfung verwendet: Der weiterhin mögliche PUT behält unverändert `If-Match: setup.etag` und den aus `setup.pointerProperties` erzeugten Body. Damit ist die Vorgabe zur ausdrücklichen identischen Wiederholung erhalten. Eine konkurrierende Installation nach dem Lesen wird weiterhin durch die ursprüngliche bedingte Schreibkennung abgefangen; der Fix übernimmt keine neue ETag.

## Test- und Berichtabgleich

Der neue Fall `snapshot-free setup pointer cannot replace an installed config ref` in `tests/trainer/purchases-transport.test.js:321` bildet den konkreten Reviewbefund ab: Config A ist installiert, Config B und deren Ordner sind gültig hochgeladen, der B-Auftrag trägt aktuelle Root-ETag und einen formal gültigen Pointerbody, der Aufruf enthält keinen Snapshot. Die Assertions verlangen:

- `binding` für B;
- keine zusätzliche PUT-Anfrage;
- unveränderte installierte A-Config-ID;
- bei identischer A-Referenz `unchanged:true` und ebenfalls keinen zusätzlichen PUT, selbst bei einer absichtlich veralteten gespeicherten ETag.

Die im Implementierungsbericht angegebenen **RED 19/20** mit `Missing expected rejection` und anschließenden **GREEN 20/20** entsprechen diesem Testaufbau und dem zuvor nachgewiesenen Fehler. Berichteter Befehl:

```text
node --test --experimental-test-isolation=none tests/trainer/purchases-transport.test.js
```

Die vorhandenen Assertions für den ausdrücklich wiederholten unbekannten Pointer kontrollieren weiterhin den ursprünglichen Body und die ursprüngliche ETag. Der kleine Produktionsdiff ändert diese Datenherkunft nicht. Dokumentation und Implementierungsbericht beschreiben die neue Prüfung sowie die zusätzlichen Reads zutreffend.

## Eigene Prüfung und Grenzen

Der bereitgestellte `task-2-fix2-review.diff` einschließlich Log/Stat/U10 wurde einmal gelesen; außerdem der Task-2-Brief und der angehängte Fix-2-Bericht. Code, Testassertionen und Berichtsbehauptungen wurden direkt abgeglichen. **Kein erneuter Test- oder Suitelauf und keine zusätzliche Probe**, da nach der statischen Prüfung kein konkreter ungeklärter Zweifel blieb. Die Laufresultate sind ausdrücklich die Nachweise des Implementierers, keine von diesem Reviewer wiederholten Ergebnisse.

Die vier ursprünglichen Important-Befunde bleiben nach der Fix-1-Prüfung ADDRESSED; diese Korrektur betrifft ausschließlich den dort neu gefundenen Setup-Ankerschutz. Produktintegration, Initialisierungs-/Restore-Steueraufträge und die übrigen Task-3/4-Verträge werden dadurch nicht als implementiert oder geprüft behauptet. Reale Google-, Zwei-Geräte- und Apple-Abnahmen bleiben offen.

Nur dieser Bericht wurde angelegt. Keine Produkt-/Testdatei, kein Index und keine vorhandene Übergabe verändert.
