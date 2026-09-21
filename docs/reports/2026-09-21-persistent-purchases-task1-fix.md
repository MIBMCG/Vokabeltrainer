# Task-1-Bericht: Belegvertrag, echte Punkte und vollständige Historie

Stand: 21.09.2026

Basis: `f54bd5d42762959c8c2dd8b2f746d417c0706706`

Status: FIXRUNDE ABGESCHLOSSEN; anschließend unabhängig nachgeprüft, alle vier Important-Befunde behoben. [Nachprüfung](2026-09-21-persistent-purchases-task1-review.md). Die unten dokumentierten Ausführungsergebnisse stammen vom Implementierer.

Fixbasis: `777b3511e280f37de7aa0a940ca86b6b16a5fdbf`

## Umsetzung

- Strikte JSON-Schemata für Intent, Receipt, EconomicSnapshot, Config, Commerce,
  Setup, Kaufjobs, getrennte Versuche, Cache und Figurenauswahl.
- Persistierte Kaufversuche besitzen ab `reserved` exakt ihre unveränderliche
  Upload-Closure aus Receipt, Basismanifest und Basisteilen. Cachewerte geben
  keine Schreibberechtigung.
- Vollständige validierte Ledger-Basen werden kanonisch in höchstens 64-KiB-
  Teile zerlegt, gehasht, wieder zusammengesetzt und erneut mit `assertLedger`
  geprüft.
- `purchaseOffer` nutzt ausschließlich `project(ledger)` für echte Lernpunkte,
  hält Profile getrennt und prüft Katalogpreis, vorhandenen Besitz und direkte
  Vorgängerstufe.
- Replay prüft die vollständige Beleg-/Restore-DAG iterativ: Hashes, Bindings,
  Koordinator, Sequenz, Basen, Operationen, Faktenfortschreibung,
  Antwortidentitäten, Guthaben und Besitz.
- Restore unterstützt sowohl einen validierten alten v1/v2-Stand ohne
  Kaufhistorie als auch fremde v3-Sicherungen. Fremde Herkunft nutzt ein
  gehashtes Proofmanifest mit neuen physischen IDs und unveränderten logischen
  Refs/Bodies/Hashes. Ein leeres Folgegerät benötigt keine alten Drive-IDs.
- Der Lesecache wird bei jeder Verwendung neu gehasht. Ein neuer Kopf muss den
  zuletzt geprüften Zielkopf über `previous` erweitern; Herkunftskanten reichen
  dafür nicht.

## Öffentliche Schnittstellen

Die vollständigen exakten JSON-Formen, Callbackformen, Rückgaben und Fehlercodes
stehen in `docs/KAUFPROTOKOLL.md`. Die bindenden Funktionen sind:

- `value.js`: `canonical`, `digest`, `refFor`, `assertRef`, `assertBinding`,
  `sameRef`, `sameBinding`, `copy`.
- `schema.js`: `assertIntent`, `assertEconomicSnapshot`, `assertReceipt`,
  `assertConfig`, `assertCache`, `assertCommerce`, `emptyCommerce`.
- `basis.js`: `packBasis(ledger, reserve)`, `readBasis(ref, read)`;
  für Replay zusätzlich `readBasisRecord` und `verifyBasisRecord`.
- `proof.js`: `packProof({binding,head,objects}, reserve)`,
  `assertProofManifest`, `verifyProofRecord`.
- `projection.js`: `purchaseOffer({ledger,economic,profileId,articleId})`;
  interne Replayhilfen `catalogArticle`, `accountFrom`, `rebuildAccounts`.
- `history.js`: `replayHistory({entries,bases,binding})` und
  `readHistory({head,read,cache,binding,onProgress})`.

`replayHistory` ist asynchron, weil es sämtliche Beleg-, Basis- und Proofwerte
selbst kryptografisch prüft. `Entries` enthält `head`, die deduplizierten
`values` und die deduplizierten `proofs`. `EconomicProjection` enthält Binding,
Koordinator, Kopf, Sequenz, aktive Epoche/Basis, getrennte Konten und die
vollständigen Beleg-IDs. `readHistory` liefert zusätzlich die geprüften Entries,
Basisrecords und den aktualisierten Cache.

## RED/GREEN-Nachweise

Erster RED-Lauf:

```text
node --test --experimental-test-isolation=none tests/trainer/purchases-contract.test.js
1 fehlgeschlagen, 0 bestanden
ERR_MODULE_NOT_FOUND: src/trainer/purchases/schema.js
Dauer: 25.5264 ms
```

Gezielte nachträgliche RED-Fälle:

```text
Persistierte Upload-Closure + altes Restore ohne Kaufhistorie:
9 Fälle, 7 bestanden, 2 erwartungsgemäß fehlgeschlagen; 6190.1818 ms

Verdrängung einer vorhandenen Antwortposition durch neue Antwort-ID:
9 Fälle, 8 bestanden, 1 erwartungsgemäß fehlgeschlagen; 6233.6215 ms

Profil-ID __proto__:
1 Fall, 0 bestanden, 1 erwartungsgemäß fehlgeschlagen; 107.391 ms

Portables Proofmanifest:
1 Fall, 0 bestanden, fehlender Export packProof; 46.7598 ms
```

Finaler fokussierter GREEN-Lauf mit Lern-/Avatarregression:

```text
node --test --experimental-test-isolation=none \
  tests/trainer/purchases-contract.test.js \
  tests/trainer/learning.test.js \
  tests/trainer/avatar-catalog.test.js \
  tests/trainer/avatar-evolution.test.js
47/47 bestanden; 0 fehlgeschlagen; 6717.7502 ms
```

Der darin enthaltene Fall liest und replayt 1001 Belege (Initialisierung plus
1000 Restoretransaktionen), 1001 eindeutige Operations-IDs, zwei wechselnde
Epochen, vollständige Basen und Cache-Rehash. Dieser einzelne Fall benötigte
6155.1005 ms. Er prüft Endkopf, erste/letzte Operation, Eindeutigkeit sämtlicher
IDs, aktive Epoche, echtes Guthaben und Cacheverhalten; es ist keine reine
Längenassertion.

Vollständiger GREEN-Lauf vor Commit:

```text
npm test
389/389 Tests bestanden; 0 fehlgeschlagen; 20916.1815 ms
```

Dokumentationsprüfung vor dem Abschlussbericht:

```text
npm run check:docs
1141 Dateien, 190 Markdown-Dateien, 901 lokale Links, 0 Fehler
```

## Dateien

- `src/trainer/purchases/value.js`
- `src/trainer/purchases/schema.js`
- `src/trainer/purchases/basis.js`
- `src/trainer/purchases/projection.js`
- `src/trainer/purchases/history.js`
- `src/trainer/purchases/proof.js`
- `tests/trainer/purchases-contract.test.js`
- `tests/trainer/purchases-fixtures.js`
- `docs/KAUFPROTOKOLL.md`
- `.superpowers/sdd/2026-09-20-persistent-purchases/task-1-report.md`

## Selbstprüfung und Grenzen

- Keine Änderung an Store, HTTP, bestehendem Sync, Commands oder UI.
- Keine Importe aus `src/shop-probe`.
- Keine frei behaupteten Punktesummen: Kontostände entstehen nur aus geprüftem
  Ledger plus bestätigten Belegen.
- Öffentliche Rückgaben sind Kopien; prototype-sensitive gültige IDs bleiben
  eigene aufzählbare Konten.
- Fremde Wiederherstellung wurde mit absichtlich fehlenden alten physischen IDs
  und ausschließlich neuen Proof-IDs geprüft. Manipulierte Hashzuordnung und
  falsche Quellbindung werden abgewiesen.
- `assertCommerce` ist eine synchrone Strukturprüfung. Vor jedem späteren
  Transport muss Task 2/3 wie dokumentiert jeden persistierten Uploadbody mit
  `digest(value) === ref.sha256` erneut prüfen.
- Reale Drive-, Zwei-Geräte- und Apple-Abnahme bleiben außerhalb dieses reinen
  Task-1-Pakets offen.

## Korrekturrunde nach unabhängiger Review (21.09.2026)

Die vier als wichtig eingestuften Befunde aus
`docs/reports/2026-09-20-persistent-purchases-task1-review.md` wurden gegen den
Code geprüft, jeweils vor der Produktionsänderung als enger Negativfall
reproduziert und behoben:

1. Ein Kaufbeleg darf nur die aktive Epoche seines direkten Vorgängers
   fortsetzen. Ein Kauf mit identischen Fakten in einer neuen Epoche wird mit
   `history` abgewiesen.
2. Ein Restoreziel muss innerhalb seiner Binding eine neue, noch nie verwendete
   Epoche sein. Sowohl die aktuelle als auch eine frühere Zielepoche werden
   abgewiesen. Der Langtest verwendet deshalb 1000 echte neue Restoreepochen
   statt abwechselnd zwei alte Epochen zu reaktivieren.
3. Die portable Closure enthält bei verschachtelter Herkunft zusätzlich die
   unveränderten Proofmanifeste und deren physische Mappingobjekte. Der neue
   A→B→C-Fall liest auf C ausschließlich neu reservierte C-Datei-IDs; A- und
   B-Datei-IDs sind nicht im Leser vorhanden. Der ursprüngliche Kaufbelegbody
   und sein Hash bleiben unverändert, Besitz und Ausgaben bleiben je Kind
   getrennt erhalten.
4. Jeder Versuch ab `reserved` verlangt den gespeicherten Ausgangskopf und
   einen nichtleeren ETag. Der Kandidat muss diesen Kopf direkt erweitern und
   ein Kaufbeleg mit exakt dem unveränderlichen Job-Intent sein. Initialisierungs-
   oder Restorebelege können den Intentabgleich nicht mehr umgehen.

### Schnittstellenänderungen

Die öffentlichen Funktionssignaturen bleiben unverändert. Präzisiert wurden
die validierten Verträge von `replayHistory`/`readHistory` und
`assertCommerce`: Restoreepochen sind je Binding einmalig, Käufe wechseln keine
Epoche, portable Proofclosures dürfen und müssen ältere Proofartefakte
vollständig einschließen, und persistierte Schreibversuche sind an Kopf, ETag,
Kandidatenvorgänger und Kauf-Intent gebunden. `docs/KAUFPROTOKOLL.md` beschreibt
diese Regeln jetzt ausdrücklich.

### RED-Nachweise

Alle folgenden Befehle liefen vor der jeweiligen Produktionsänderung und
scheiterten aus dem erwarteten Grund:

```text
node --test --experimental-test-isolation=none --test-name-pattern "purchase cannot activate" tests/trainer/purchases-contract.test.js
0/1 bestanden; fehlende erwartete Ablehnung; 174.8755 ms

node --test --experimental-test-isolation=none --test-name-pattern "restore requires a fresh" tests/trainer/purchases-contract.test.js
0/1 bestanden; fehlende erwartete Ablehnung; 200.223 ms

node --test --experimental-test-isolation=none --test-name-pattern "reserved attempt owns" tests/trainer/purchases-contract.test.js
Pointer ohne Kopf/ETag: fehlende erwartete Ausnahme; 123.8707 ms
abweichender Kandidatenvorgänger: fehlende erwartete Ausnahme; 184.6743 ms
Restorekandidat im Kaufjob: fehlende erwartete Ausnahme; 130.1915 ms

node --test --experimental-test-isolation=none --test-name-pattern "restore imports a foreign" tests/trainer/purchases-contract.test.js
0/1 bestanden; A→B→C wegen zu flacher Closure mit code=history abgewiesen; 464.0394 ms
```

Nach Einführung der frischen Restoreepoche deckte der bisherige Langtest seine
eigene unzulässige Epochenreaktivierung auf:

```text
node --test --experimental-test-isolation=none --test-name-pattern "iterative history reading" tests/trainer/purchases-contract.test.js
0/1 bestanden; code=history: Restore muss neue Zielepoche aktivieren; 709.8586 ms
```

### GREEN- und Abschlussnachweise

```text
node --test --experimental-test-isolation=none tests/trainer/purchases-contract.test.js tests/trainer/learning.test.js tests/trainer/avatar-catalog.test.js tests/trainer/avatar-evolution.test.js
49/49 bestanden; 0 fehlgeschlagen; 46367.2793 ms
```

Der enthaltene Langfall prüft Initialisierung plus 1000 Restoretransaktionen,
1000 frische Zielepochen, 1001 eindeutige Operations-IDs, vollständige
Basisrecords, Endkopf, echtes Guthaben und Cache-Rehash. Laufzeit des Falls:
45351.5793 ms.

```text
npm test
391/391 bestanden; 0 fehlgeschlagen; 81440.6359 ms

npm run check:docs
1142 Dateien; 195 Markdown-Dateien; 914 lokale Links; 0 Fehler

git diff --check
Exit 0; keine Whitespacefehler
```

### Selbstprüfung, Commit und verbleibende Punkte

- Geänderte Taskdateien: `src/trainer/purchases/history.js`,
  `src/trainer/purchases/schema.js`, `tests/trainer/purchases-contract.test.js`,
  `docs/KAUFPROTOKOLL.md` und dieser Bericht. `proof.js` und die Fixtures
  benötigten keine Vertragsänderung.
- Keine Speicherung, HTTP-/Drive-Anbindung, bestehende Synchronisation,
  Commands, UI oder Task-2-Integration geändert.
- Fixcommit: der lokale Commit, der diese Korrekturrunde und diesen Bericht
  gemeinsam enthält; kein Push durch Task 1.
- Die beiden Minor-Befunde der Review sind nicht verloren: echte kooperative
  Eventloop-Abgabe einschließlich Proof-/Basisobjekten sowie das Bewahren
  bestehender maschinenlesbarer Leserfehlercodes bleiben ausdrücklich bei
  Task 3. Sie ändern keinen der vier hier korrigierten Integritätsverträge.
- Reale Drive-, Zwei-Geräte- und Apple-Abnahme bleiben offen.
