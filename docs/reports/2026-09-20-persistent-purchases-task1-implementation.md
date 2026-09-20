> Historischer Implementierungsbericht von GPT-5.6 Sol/hoch. Die anschließende [unabhängige Prüfung](2026-09-20-persistent-purchases-task1-review.md) durch GPT-6 Astra/hoch hat vier wichtige offene Befunde ergeben. DONE beschreibt hier die Abgabe des Implementierers, keine Freigabe. Der Nutzer hat vor Korrekturen eine Pause beauftragt.
# Task-1-Bericht: Belegvertrag, echte Punkte und vollständige Historie

Stand: 20.09.2026

Basis: `f54bd5d42762959c8c2dd8b2f746d417c0706706`

Status: DONE

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
