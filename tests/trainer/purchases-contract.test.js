import test from 'node:test';
import assert from 'node:assert/strict';

import {project} from '../../src/trainer/learning/progress.js';
import {
  assertCommerce,
  assertIntent,
  assertReceipt,
  emptyCommerce,
} from '../../src/trainer/purchases/schema.js';
import {packBasis, readBasis} from '../../src/trainer/purchases/basis.js';
import {purchaseOffer} from '../../src/trainer/purchases/projection.js';
import {packProof} from '../../src/trainer/purchases/proof.js';
import {readHistory, replayHistory} from '../../src/trainer/purchases/history.js';
import {
  BINDING,
  earnedLedger,
  intent,
  memoryReader,
  receipt,
  referenced,
  rebindLedger,
} from './purchases-fixtures.js';

async function packed(ledger, prefix = 'basis') {
  let next = 0;
  return packBasis(ledger, async ({kind}) => `${prefix}-${kind}-${next += 1}`);
}

function basisEntry(bundle, ledger) {
  return {
    ref: structuredClone(bundle.ref),
    manifest: structuredClone(bundle.manifest),
    parts: structuredClone(bundle.parts),
    ledger: structuredClone(ledger),
  };
}

async function initialHistory({ledger = earnedLedger(), binding = BINDING, prefix = 'initial'} = {}) {
  const bundle = await packed(ledger, prefix);
  const value = receipt({
    datasetId: binding.datasetId,
    epochId: project(ledger).activeEpochId,
    basis: bundle.ref,
  });
  const entry = await referenced(value, `${prefix}-receipt`);
  return {
    bundle,
    entry,
    entries: {head: entry.ref, values: [entry], proofs: []},
    bases: [basisEntry(bundle, ledger)],
  };
}

async function portableProof({binding, head, values, bundles, prefix = 'proof'}) {
  const logicalValues = [
    ...values,
    ...bundles.flatMap((bundle) => [
      {ref: bundle.ref, value: bundle.manifest},
      ...bundle.parts,
    ]),
  ];
  let next = 0;
  return packProof(
    {binding, head, objects: logicalValues},
    async ({kind}) => `${prefix}-${kind}-${next += 1}`,
  );
}

test('purchase schemas reject unknown fields and emptyCommerce returns independent exact state', () => {
  assert.deepEqual(assertIntent(intent()), intent());
  assert.throws(() => assertIntent({...intent(), points: 300}), {code: 'invalid'});
  assert.throws(() => assertIntent({...intent(), operationId: 'space is invalid'}), {code: 'invalid'});
  assert.throws(() => assertReceipt(receipt({basis: {id: 'basis', sha256: '0'.repeat(64)}, points: 300})), {code: 'invalid'});

  const first = emptyCommerce();
  const second = emptyCommerce();
  assert.deepEqual(assertCommerce(first), first);
  assert.notStrictEqual(first, second);
  assert.notStrictEqual(first.cache, second.cache);
  first.selection.push({profileId: 'p1', figureId: 'explorer-girl', stage: 1});
  assert.deepEqual(second.selection, []);
});

test('a reserved attempt owns every immutable upload and cannot borrow write authority from cache', async () => {
  const ledger = earnedLedger();
  const bundle = await packed(ledger, 'attempt');
  const candidateValue = receipt({
    sequence: 1,
    previous: {id: 'previous-receipt', sha256: '1'.repeat(64)},
    operationId: 'purchase-1',
    operation: 'purchase',
    basis: bundle.ref,
    intent: intent(),
    economy: null,
  });
  const candidate = await referenced(candidateValue, 'attempt-receipt');
  const commerce = emptyCommerce();
  commerce.cache.values.push(candidate);
  commerce.jobs.push({
    version: 1,
    intent: intent(),
    status: 'open',
    attempts: [{
      version: 1,
      attemptId: 'attempt-1',
      phase: 'reserved',
      head: {id: 'previous-receipt', sha256: '1'.repeat(64)},
      etag: '"opaque-etag"',
      candidate: candidate.ref,
      uploads: [],
    }],
  });
  assert.throws(() => assertCommerce(commerce), {code: 'invalid'});

  commerce.jobs[0].attempts[0].uploads = [
    ...bundle.parts,
    {ref: bundle.ref, value: bundle.manifest},
    candidate,
  ];
  assert.deepEqual(assertCommerce(commerce), commerce);
});

test('basis packing round-trips a validated ledger and detects changed manifest or part content', async () => {
  const ledger = earnedLedger();
  const bundle = await packed(ledger);
  assert.ok(bundle.parts.length >= 1);
  assert.equal(bundle.manifest.byteLength, new TextEncoder().encode(JSON.stringify(ledger)).byteLength);

  const reader = memoryReader([{ref: bundle.ref, value: bundle.manifest}, ...bundle.parts]);
  assert.deepEqual(await readBasis(bundle.ref, reader), ledger);

  const changedPart = structuredClone(bundle.parts[0]);
  changedPart.value.content += ' ';
  const changedReader = memoryReader([
    {ref: bundle.ref, value: bundle.manifest},
    changedPart,
    ...bundle.parts.slice(1),
  ]);
  await assert.rejects(readBasis(bundle.ref, changedReader), {code: 'integrity'});

  await assert.rejects(readBasis({...bundle.ref, sha256: 'f'.repeat(64)}, reader), {code: 'integrity'});
});

test('a purchase spends only the selected child real points and leaves learning projection and level unchanged', async () => {
  const ledger = earnedLedger();
  const initial = await initialHistory({ledger});
  const beforeLearning = project(ledger);
  const before = await replayHistory({...initial, binding: BINDING});
  assert.equal(before.accounts.p1.earnedPoints, 300);
  assert.equal(before.accounts.p2.earnedPoints, 300);

  const offer = purchaseOffer({
    ledger,
    economic: before,
    profileId: 'p1',
    articleId: 'evolution:explorer-girl:2',
  });
  assert.deepEqual(offer, {
    version: 1,
    datasetId: 'd1',
    epochId: 'e0',
    profileId: 'p1',
    articleId: 'evolution:explorer-girl:2',
    catalogVersion: 1,
    price: 200,
    earnedPoints: 300,
    spentPoints: 0,
    availablePoints: 300,
  });

  const purchase = receipt({
    sequence: 1,
    previous: initial.entry.ref,
    operationId: 'purchase-1',
    operation: 'purchase',
    basis: initial.bundle.ref,
    intent: intent(),
    economy: null,
  });
  const purchaseEntry = await referenced(purchase, 'purchase-receipt');
  const after = await replayHistory({
    entries: {head: purchaseEntry.ref, values: [initial.entry, purchaseEntry], proofs: []},
    bases: initial.bases,
    binding: BINDING,
  });
  assert.equal(after.accounts.p1.spentPoints, 200);
  assert.equal(after.accounts.p1.availablePoints, 100);
  assert.deepEqual(after.accounts.p1.purchasedArticleIds, ['evolution:explorer-girl:2']);
  assert.equal(after.accounts.p2.spentPoints, 0);
  assert.equal(after.accounts.p2.availablePoints, 300);
  assert.deepEqual(project(ledger), beforeLearning);
  assert.equal(project(ledger).profiles.p1.level, beforeLearning.profiles.p1.level);
});

test('economic accounts preserve a profile whose valid ID is prototype-sensitive', async () => {
  const ledger = earnedLedger();
  for (const event of ledger.events) {
    if (event.type === 'entity.revised' && event.payload.entityType === 'profile'
      && event.payload.entityId === 'p1') event.payload.entityId = '__proto__';
    if (event.type === 'entity.revised' && event.payload.entityType === 'lesson') {
      event.payload.value.profileIds = event.payload.value.profileIds
        .map((profileId) => profileId === 'p1' ? '__proto__' : profileId)
        .sort();
    }
    if (event.payload?.profileId === 'p1') event.payload.profileId = '__proto__';
  }
  const initial = await initialHistory({ledger, prefix: 'prototype-safe'});
  const result = await replayHistory({...initial, binding: BINDING});
  assert.equal(Object.hasOwn(result.accounts, '__proto__'), true);
  assert.equal(result.accounts.__proto__.availablePoints, 300);
});

test('catalog order, frozen price, claimed points, changed intents and answer collisions are rejected', async () => {
  const ledger = earnedLedger();
  const initial = await initialHistory({ledger});
  const economic = await replayHistory({...initial, binding: BINDING});

  assert.throws(() => purchaseOffer({
    ledger, economic, profileId: 'p1', articleId: 'evolution:explorer-girl:3',
  }), {code: 'entitlement'});

  const wrongPrice = receipt({
    sequence: 1,
    previous: initial.entry.ref,
    operationId: 'purchase-wrong-price',
    operation: 'purchase',
    basis: initial.bundle.ref,
    intent: intent({operationId: 'purchase-wrong-price', price: 199}),
    economy: null,
  });
  const wrongPriceEntry = await referenced(wrongPrice, 'wrong-price');
  await assert.rejects(replayHistory({
    entries: {head: wrongPriceEntry.ref, values: [initial.entry, wrongPriceEntry], proofs: []},
    bases: initial.bases,
    binding: BINDING,
  }), {code: 'price'});

  assert.throws(() => assertReceipt(receipt({
    basis: initial.bundle.ref,
    economy: {version: 1, kind: 'economic-snapshot', source: null, points: 600},
  })), {code: 'invalid'});

  const first = receipt({
    sequence: 1, previous: initial.entry.ref, operationId: 'same-operation', operation: 'purchase',
    basis: initial.bundle.ref, intent: intent({operationId: 'same-operation'}), economy: null,
  });
  const firstEntry = await referenced(first, 'same-first');
  const changed = receipt({
    sequence: 2, previous: firstEntry.ref, operationId: 'same-operation', operation: 'purchase',
    basis: initial.bundle.ref,
    intent: intent({operationId: 'same-operation', articleId: 'deer-mist', price: 600}),
    economy: null,
  });
  const changedEntry = await referenced(changed, 'same-changed');
  await assert.rejects(replayHistory({
    entries: {head: changedEntry.ref, values: [initial.entry, firstEntry, changedEntry], proofs: []},
    bases: initial.bases,
    binding: BINDING,
  }), {code: 'collision'});

  const collidingLedger = structuredClone(ledger);
  collidingLedger.events.find(({id}) => id === 'answer-p1-1').payload.correct = false;
  const collidingBundle = await packed(collidingLedger, 'colliding');
  const collisionPurchase = receipt({
    sequence: 1, previous: initial.entry.ref, operationId: 'collision-purchase', operation: 'purchase',
    basis: collidingBundle.ref,
    intent: intent({operationId: 'collision-purchase'}), economy: null,
  });
  const collisionEntry = await referenced(collisionPurchase, 'collision-receipt');
  await assert.rejects(replayHistory({
    entries: {head: collisionEntry.ref, values: [initial.entry, collisionEntry], proofs: []},
    bases: [...initial.bases, basisEntry(collidingBundle, collidingLedger)],
    binding: BINDING,
  }), {code: 'collision'});

  const displacedLedger = structuredClone(ledger);
  const originalAnswer = displacedLedger.events.find(({id}) => id === 'answer-p1-1');
  displacedLedger.events.push({...structuredClone(originalAnswer), id: 'answer-replacement'});
  const displacedBundle = await packed(displacedLedger, 'displaced');
  const displacedPurchase = receipt({
    sequence: 1, previous: initial.entry.ref, operationId: 'displaced-purchase', operation: 'purchase',
    basis: displacedBundle.ref,
    intent: intent({operationId: 'displaced-purchase'}), economy: null,
  });
  const displacedEntry = await referenced(displacedPurchase, 'displaced-receipt');
  await assert.rejects(replayHistory({
    entries: {head: displacedEntry.ref, values: [initial.entry, displacedEntry], proofs: []},
    bases: [...initial.bases, basisEntry(displacedBundle, displacedLedger)],
    binding: BINDING,
  }), {code: 'collision'});
});

test('restore imports a foreign binding through a flat proof DAG and rejects wrong source binding', async () => {
  const sourceBinding = {...BINDING, accountId: 'source-account', folderId: 'source-folder'};
  const source = await initialHistory({binding: sourceBinding, prefix: 'source'});
  const sourcePurchase = receipt({
    sequence: 1, previous: source.entry.ref, operationId: 'source-purchase', operation: 'purchase',
    basis: source.bundle.ref, intent: intent({operationId: 'source-purchase'}), economy: null,
  });
  const sourcePurchaseEntry = await referenced(sourcePurchase, 'source-purchase-receipt');
  const proof = await portableProof({
    binding: sourceBinding,
    head: sourcePurchaseEntry.ref,
    values: [source.entry, sourcePurchaseEntry],
    bundles: [source.bundle],
    prefix: 'foreign-proof',
  });

  const targetBinding = {
    accountId: 'target-account', folderId: 'target-folder',
    descriptorFileId: 'target-descriptor', datasetId: 'target-dataset',
  };
  const targetInitialLedger = rebindLedger(earnedLedger(), {datasetId: 'target-dataset', epochId: 'target-old'});
  const target = await initialHistory({
    ledger: targetInitialLedger, binding: targetBinding, prefix: 'target',
  });
  const restoredLedger = rebindLedger(earnedLedger(), {datasetId: 'target-dataset', epochId: 'target-restored'});
  const restoredBundle = await packed(restoredLedger, 'restored');
  const restore = receipt({
    datasetId: 'target-dataset',
    sequence: 1,
    previous: target.entry.ref,
    operationId: 'restore-foreign',
    operation: 'restore',
    epochId: 'target-restored',
    basis: restoredBundle.ref,
    intent: null,
    economy: {
      version: 1,
      kind: 'economic-snapshot',
      source: {binding: sourceBinding, head: sourcePurchaseEntry.ref, proof: proof.ref},
    },
  });
  const restoreEntry = await referenced(restore, 'target-restore');
  const values = [target.entry, source.entry, sourcePurchaseEntry, restoreEntry];
  const bases = [
    ...target.bases,
    ...source.bases,
    basisEntry(restoredBundle, restoredLedger),
  ];
  const result = await replayHistory({
    entries: {head: restoreEntry.ref, values, proofs: [proof]}, bases, binding: targetBinding,
  });
  assert.equal(result.binding.datasetId, 'target-dataset');
  assert.equal(result.activeEpochId, 'target-restored');
  assert.equal(result.accounts.p1.availablePoints, 100);
  assert.deepEqual(result.accounts.p1.purchasedArticleIds, ['evolution:explorer-girl:2']);
  assert.equal(result.accounts.p2.availablePoints, 300);
  assert.equal(result.receipts.filter(({operationId}) => operationId === 'source-purchase').length, 1);

  const wrongSource = structuredClone(restore);
  wrongSource.economy.source.binding.datasetId = 'wrong-source-dataset';
  const wrongEntry = await referenced(wrongSource, 'target-restore-wrong-source');
  await assert.rejects(replayHistory({
    entries: {head: wrongEntry.ref, values: [target.entry, source.entry, sourcePurchaseEntry, wrongEntry], proofs: [proof]},
    bases,
    binding: targetBinding,
  }), {code: 'binding'});

  const portableStored = [
    target.entry,
    {ref: target.bundle.ref, value: target.bundle.manifest}, ...target.bundle.parts,
    restoreEntry,
    {ref: restoredBundle.ref, value: restoredBundle.manifest}, ...restoredBundle.parts,
    {ref: proof.ref, value: proof.manifest},
    ...proof.objects.map(({stored, value}) => ({ref: stored, value})),
  ];
  const portable = await readHistory({
    head: restoreEntry.ref,
    read: memoryReader(portableStored),
    cache: {version: 1, head: null, values: []},
    binding: targetBinding,
    onProgress: () => {},
  });
  assert.equal(portable.projection.accounts.p1.availablePoints, 100);
  assert.deepEqual(portable.projection.accounts.p1.purchasedArticleIds, ['evolution:explorer-girl:2']);

  const tamperedProof = structuredClone(proof);
  tamperedProof.objects[0].stored.sha256 = '9'.repeat(64);
  await assert.rejects(replayHistory({
    entries: {head: restoreEntry.ref, values, proofs: [tamperedProof]}, bases, binding: targetBinding,
  }), {code: 'integrity'});
});

test('restore of a validated legacy backup without purchase history starts with zero spending', async () => {
  const initial = await initialHistory({prefix: 'legacy-before'});
  const restoredLedger = earnedLedger({epochId: 'legacy-restored'});
  const restoredBundle = await packed(restoredLedger, 'legacy-after');
  const restoreValue = receipt({
    sequence: 1,
    previous: initial.entry.ref,
    operationId: 'restore-legacy',
    operation: 'restore',
    epochId: 'legacy-restored',
    basis: restoredBundle.ref,
    intent: null,
    economy: {version: 1, kind: 'economic-snapshot', source: null},
  });
  const restoreEntry = await referenced(restoreValue, 'legacy-restore-receipt');
  const result = await replayHistory({
    entries: {head: restoreEntry.ref, values: [initial.entry, restoreEntry], proofs: []},
    bases: [...initial.bases, basisEntry(restoredBundle, restoredLedger)],
    binding: BINDING,
  });
  assert.equal(result.activeEpochId, 'legacy-restored');
  assert.equal(result.accounts.p1.earnedPoints, 300);
  assert.equal(result.accounts.p1.spentPoints, 0);
  assert.deepEqual(result.accounts.p1.purchasedArticleIds, []);
});

test('provenance cycles are rejected before an untrusted circular graph is replayed', async () => {
  const hashA = 'a'.repeat(64);
  const hashB = 'b'.repeat(64);
  const refA = {id: 'restore-a', sha256: hashA};
  const refB = {id: 'restore-b', sha256: hashB};
  const a = receipt({
    sequence: 1, previous: refB, operationId: 'restore-a', operation: 'restore',
    basis: {id: 'basis-a', sha256: 'c'.repeat(64)}, intent: null,
    economy: {version: 1, kind: 'economic-snapshot', source: {binding: BINDING, head: refB, proof: null}},
  });
  const b = receipt({
    sequence: 2, previous: refA, operationId: 'restore-b', operation: 'restore',
    basis: {id: 'basis-b', sha256: 'd'.repeat(64)}, intent: null,
    economy: {version: 1, kind: 'economic-snapshot', source: {binding: BINDING, head: refA, proof: null}},
  });
  await assert.rejects(replayHistory({
    entries: {head: refA, values: [{ref: refA, value: a}, {ref: refB, value: b}], proofs: []},
    bases: [],
    binding: BINDING,
  }), {code: 'cycle'});
});

test('iterative history reading verifies 1000 transactions, all IDs, multiple epochs and cache hashes', async () => {
  const ledger0 = earnedLedger({epochId: 'e0'});
  const ledger1 = earnedLedger({epochId: 'e1'});
  const basis0 = await packed(ledger0, 'long-0');
  const basis1 = await packed(ledger1, 'long-1');
  const firstValue = receipt({basis: basis0.ref});
  const first = await referenced(firstValue, 'receipt-0000');
  const entries = [first];
  let previous = first.ref;
  for (let sequence = 1; sequence <= 1000; sequence += 1) {
    const useSecond = sequence % 2 === 1;
    const value = receipt({
      sequence,
      previous,
      operationId: `restore-${String(sequence).padStart(4, '0')}`,
      operation: 'restore',
      epochId: useSecond ? 'e1' : 'e0',
      basis: useSecond ? basis1.ref : basis0.ref,
      intent: null,
      economy: {
        version: 1,
        kind: 'economic-snapshot',
        source: {binding: BINDING, head: previous, proof: null},
      },
    });
    const entry = await referenced(value, `receipt-${String(sequence).padStart(4, '0')}`);
    entries.push(entry);
    previous = entry.ref;
  }
  const stored = [
    ...entries,
    {ref: basis0.ref, value: basis0.manifest}, ...basis0.parts,
    {ref: basis1.ref, value: basis1.manifest}, ...basis1.parts,
  ];
  let reads = 0;
  let progress = 0;
  const read = memoryReader(stored);
  const result = await readHistory({
    head: previous,
    read: async (id) => { reads += 1; return read(id); },
    cache: {version: 1, head: null, values: []},
    binding: BINDING,
    onProgress: ({verified}) => { progress = verified; },
  });
  assert.equal(result.projection.sequence, 1000);
  assert.equal(result.projection.receipts.length, 1001);
  assert.equal(result.projection.receipts[0].operationId, 'initialize-1');
  assert.equal(result.projection.receipts.at(-1).operationId, 'restore-1000');
  assert.equal(new Set(result.projection.receipts.map(({operationId}) => operationId)).size, 1001);
  assert.equal(result.projection.activeEpochId, 'e0');
  assert.equal(result.projection.accounts.p1.availablePoints, 300);
  assert.ok(progress >= 1001);
  assert.ok(reads >= 1001);

  let cachedReads = 0;
  const cached = await readHistory({
    head: previous,
    read: async (id) => { cachedReads += 1; return read(id); },
    cache: result.cache,
    binding: BINDING,
    onProgress: () => {},
  });
  assert.equal(cached.projection.receipts.length, 1001);
  assert.equal(cachedReads, 0);

  const badCache = structuredClone(result.cache);
  const cachedHead = badCache.values.find(({ref}) => ref.id === previous.id);
  cachedHead.value.operationId = 'changed-after-cache';
  await assert.rejects(readHistory({
    head: previous, read, cache: badCache, binding: BINDING, onProgress: () => {},
  }), {code: 'integrity'});

  const alternative = await referenced(receipt({basis: basis0.ref}), 'alternative-head');
  const alternativeRead = memoryReader([
    alternative,
    {ref: basis0.ref, value: basis0.manifest}, ...basis0.parts,
  ]);
  await assert.rejects(readHistory({
    head: alternative.ref,
    read: alternativeRead,
    cache: result.cache,
    binding: BINDING,
    onProgress: () => {},
  }), {code: 'history'});
});
