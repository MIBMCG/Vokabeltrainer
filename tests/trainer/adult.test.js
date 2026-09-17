import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';

import {createPinGate} from '../../src/trainer/adult/pin.js';
import {applyRows, parseTable, validateRows} from '../../src/trainer/adult/import.js';

function verifierStore(initial = null) {
  let verifier = initial === null ? null : structuredClone(initial);
  return {
    async load() {
      return verifier === null ? null : structuredClone(verifier);
    },
    async save(next, expected) {
      assert.deepEqual(verifier, expected, 'stale verifier must not be overwritten');
      verifier = structuredClone(next);
    },
    value() {
      return verifier === null ? null : structuredClone(verifier);
    },
  };
}

test('table import preserves ambiguity until adult decision', () => {
  const parsed = parseTable('Fahrrad\tbicycle | bike\t\n\nBank\tbench\tSitzplatz\textra');
  assert.equal(parsed.rows.length, 2);
  assert.deepEqual(parsed.rows[0].answers, ['bicycle', 'bike']);
  assert.ok(parsed.issues.some((issue) => issue.code === 'columns'));
  assert.match(parsed.issues.find((issue) => issue.code === 'columns').message, /Sitzplatz.*extra/);
});

test('table import accepts CRLF, keeps markup literal and reports values it must not guess', () => {
  const parsed = parseTable('<img onerror=alert(1)>\timage\r\nWort ohne Lösung\t\r\n"mehr\tdeutig"\tanswer');

  assert.equal(parsed.rows[0].german, '<img onerror=alert(1)>');
  assert.deepEqual(parsed.rows[0].answers, ['image']);
  assert.ok(parsed.issues.some(({code}) => code === 'required'));
  assert.ok(parsed.issues.some(({code}) => code === 'quotes'));
  assert.match(parsed.issues.find(({code}) => code === 'quotes').message, /"mehr.*deutig".*answer/);
});

test('duplicate import remains blocked until the adult skips or separates it', () => {
  const [row] = parseTable('Hund\tdog').rows;
  const existing = [{german: 'Hund', answers: ['dog'], hint: ''}];

  const unresolved = validateRows([row], existing);
  assert.ok(unresolved.issues.some(({code}) => code === 'duplicate'));

  const separate = validateRows([{...row, decision: 'separate'}], existing);
  assert.deepEqual(separate.issues, []);
  assert.equal(separate.rows[0].decision, 'separate');

  const skipped = validateRows([{...row, decision: 'skip'}], existing);
  assert.deepEqual(skipped.issues, []);
});

test('validation rejects missing required values and repeated preview rows', () => {
  const rows = [
    {rowId: 'row-1', german: '', answers: ['dog'], hint: '', decision: 'include'},
    {rowId: 'row-2', german: 'Bank', answers: ['bench'], hint: 'Sitzplatz', decision: 'include'},
    {rowId: 'row-3', german: ' bank ', answers: ['BENCH'], hint: ' Sitzplatz ', decision: 'include'},
  ];
  const result = validateRows(rows, []);

  assert.ok(result.issues.some(({rowId, code}) => rowId === 'row-1' && code === 'required'));
  assert.ok(result.issues.some(({rowId, code}) => rowId === 'row-3' && code === 'duplicate'));
});

test('multi-row import retry keeps only rows not durably committed before a failure', async () => {
  const rows = parseTable('Hund\tdog\nKatze\tcat\nHaus\thouse').rows;
  const committed = [];
  let remaining = rows;

  await assert.rejects(applyRows(rows, async (row) => {
    if (row.german === 'Katze') throw new Error('synthetic save failure');
    committed.push(row.german);
  }, (openRows) => { remaining = openRows; }), /synthetic save failure/);

  assert.deepEqual(committed, ['Hund']);
  assert.deepEqual(remaining.map(({german}) => german), ['Katze', 'Haus']);

  await applyRows(remaining, async (row) => { committed.push(row.german); },
    (openRows) => { remaining = openRows; });
  assert.deepEqual(committed, ['Hund', 'Katze', 'Haus']);
  assert.deepEqual(remaining, []);
});

test('PIN reset requires exact confirmation and equal new entries', async () => {
  const store = verifierStore();
  const gate = createPinGate({
    loadVerifier: store.load,
    saveVerifier: store.save,
    cryptoImpl: webcrypto,
  });
  await gate.setup('1234', '1234');
  gate.lock();
  await assert.rejects(gate.reset('zurücksetzen', '5678', '5678'));
  assert.equal(gate.isUnlocked(), false);
  await gate.reset('PIN zurücksetzen', '5678', '5678');
  gate.lock();
  await gate.unlock('5678');
  assert.equal(gate.isUnlocked(), true);
});

test('PIN verifier is salted, persists without the PIN and unlocks a new gate', async () => {
  const store = verifierStore();
  const first = createPinGate({
    loadVerifier: store.load, saveVerifier: store.save, cryptoImpl: webcrypto,
  });

  await first.setup('2468', '2468');
  const verifier = store.value();
  assert.deepEqual(Object.keys(verifier).sort(), ['hash', 'iterations', 'salt']);
  assert.doesNotMatch(JSON.stringify(verifier), /2468/);
  assert.ok(verifier.iterations >= 100_000);

  const reloaded = createPinGate({
    loadVerifier: store.load, saveVerifier: store.save, cryptoImpl: webcrypto,
  });
  await assert.rejects(reloaded.unlock('0000'));
  assert.equal(reloaded.isUnlocked(), false);
  await reloaded.unlock('2468');
  assert.equal(reloaded.isUnlocked(), true);
});

test('PIN setup and change require four digits, matching entries and the current PIN', async () => {
  const store = verifierStore();
  const gate = createPinGate({
    loadVerifier: store.load,
    saveVerifier: store.save,
    cryptoImpl: webcrypto,
  });

  await assert.rejects(gate.setup('123', '123'));
  await assert.rejects(gate.setup('1234', '4321'));
  await gate.setup('1234', '1234');
  await assert.rejects(gate.change('9999', '5678', '5678'));
  await assert.rejects(gate.change('1234', '5678', '8765'));
  await gate.change('1234', '5678', '5678');
  gate.lock();
  await assert.rejects(gate.unlock('1234'));
  await gate.unlock('5678');
  assert.equal(gate.isUnlocked(), true);
});

test('lock invalidates setup, unlock, change and reset permission already in flight', async (t) => {
  await t.test('setup', async () => {
    const store = verifierStore();
    const gate = createPinGate({loadVerifier: store.load, saveVerifier: store.save, cryptoImpl: webcrypto});
    const pending = gate.setup('1234', '1234');
    gate.lock();
    await pending;
    assert.equal(gate.isUnlocked(), false);
    await gate.unlock('1234');
    assert.equal(gate.isUnlocked(), true);
  });

  for (const operation of ['unlock', 'change', 'reset']) {
    await t.test(operation, async () => {
      const store = verifierStore();
      const gate = createPinGate({loadVerifier: store.load, saveVerifier: store.save, cryptoImpl: webcrypto});
      await gate.setup('1234', '1234');
      gate.lock();
      const pending = operation === 'unlock'
        ? gate.unlock('1234')
        : operation === 'change'
          ? gate.change('1234', '5678', '5678')
          : gate.reset('PIN zurücksetzen', '5678', '5678');
      gate.lock();
      await pending;
      assert.equal(gate.isUnlocked(), false);
      await gate.unlock(operation === 'unlock' ? '1234' : '5678');
      assert.equal(gate.isUnlocked(), true);
    });
  }
});

test('parallel setup attempts serialize and only the original verifier can be replaced', async () => {
  const store = verifierStore();
  const gate = createPinGate({loadVerifier: store.load, saveVerifier: store.save, cryptoImpl: webcrypto});

  const outcomes = await Promise.allSettled([
    gate.setup('1234', '1234'),
    gate.setup('5678', '5678'),
  ]);

  assert.deepEqual(outcomes.map(({status}) => status), ['fulfilled', 'rejected']);
  gate.lock();
  await gate.unlock('1234');
  await assert.rejects(gate.unlock('5678'));
});

test('parallel PIN mutations share their original verifier and a stale second save is rejected', async () => {
  const store = verifierStore();
  const gate = createPinGate({loadVerifier: store.load, saveVerifier: store.save, cryptoImpl: webcrypto});
  await gate.setup('1234', '1234');

  const outcomes = await Promise.allSettled([
    gate.change('1234', '5678', '5678'),
    gate.reset('PIN zurücksetzen', '9012', '9012'),
  ]);

  assert.deepEqual(outcomes.map(({status}) => status), ['fulfilled', 'rejected']);
  gate.lock();
  await gate.unlock('5678');
  await assert.rejects(gate.unlock('9012'));
});

test('lock invalidates every unlock attempt that was already queued', async () => {
  const store = verifierStore();
  const gate = createPinGate({loadVerifier: store.load, saveVerifier: store.save, cryptoImpl: webcrypto});
  await gate.setup('1234', '1234');
  gate.lock();

  const queued = [gate.unlock('1234'), gate.unlock('1234')];
  gate.lock();
  await Promise.all(queued);

  assert.equal(gate.isUnlocked(), false);
});
