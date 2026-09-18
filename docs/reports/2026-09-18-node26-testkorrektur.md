# Laufzeitfix: Web-Lock-Negativtests unter Node 26

Datum: 2026-09-18  
Branch: `codex/vokabeltrainer-v1`  
Node: `v26.8.2`  
Betroffene Dateien: `tests/probe/store.test.js`, `tests/trainer/store.test.js`

## Auftrag und Grenze

Die beiden Negativtests sollten das Fehlen der Web-Lock-API simulieren. Es wurden ausschließlich die Test-Injektionen angepasst. Produktionscode, Umgebungskonfiguration und sonstige Dateien wurden nicht verändert.

## Reproduktion (RED)

Ausgeführt:

```text
node --test --experimental-test-isolation=none tests/probe/store.test.js tests/trainer/store.test.js
```

Ergebnis vor der Änderung: **5/7 bestanden, 2/7 fehlgeschlagen**.

- `tests/probe/store.test.js` – `requires browser lock support for explicit exclusive-tab mode`: erwartete Ablehnung fehlte.
- `tests/trainer/store.test.js` – `missing Web Lock support never opens an unprotected product writer`: statt `{code: 'locked'}` wurde ein späterer `TypeError` beim unvollständigen IndexedDB-Testdouble ausgelöst.

## Root Cause

Beide Produktionsfunktionen deklarieren den Parameter mit einem Default:

```js
locks = globalThis.navigator?.locks
```

Bei einem Aufruf mit `locks: undefined` greift deshalb der Default. Node `v26.8.2` stellt inzwischen `globalThis.navigator?.locks` bereit; die Tests injizierten damit keine fehlende API mehr, sondern verwendeten unbeabsichtigt die Node-Web-Lock-Implementierung. Das erklärt beide unterschiedlichen Symptome.

## Minimaler Fix

Die Negativtests übergeben jetzt `locks: null`. Damit wird der Default nicht aktiviert und die Produktionsprüfung erhält tatsächlich einen fehlenden Lock-Anbieter:

- `tests/probe/store.test.js`: `locks: undefined` → `locks: null`
- `tests/trainer/store.test.js`: `locks: undefined` → `locks: null`

Es gab keine Produktionsänderung.

## Verifikation (GREEN)

Fokussierter Lauf nach der Änderung:

```text
node --test --experimental-test-isolation=none tests/probe/store.test.js tests/trainer/store.test.js
```

Ergebnis: **7/7 bestanden, 0 fehlgeschlagen**.

Vollständiger Lauf:

```text
npm test
```

Ergebnis: **191/191 bestanden, 0 fehlgeschlagen**.

Zusätzlich ausgeführt:

```text
git diff --check
```

Ergebnis: Exit-Code 0, keine Beanstandungen.

## Git-Nachweis

Commit `8b961ad` umfasst genau die zwei beauftragten Teständerungen und wurde unabhängig ohne Befund geprüft. Dieser portable Bericht wurde anschließend separat in die Dokumentation übernommen. Der Codecommit enthält ausschließlich:

- `tests/probe/store.test.js`
- `tests/trainer/store.test.js`

Kein Push wurde ausgeführt.
