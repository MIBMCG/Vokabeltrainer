import {resolveEpochs} from '../model/epochs.js';
import {ProductError} from '../model/errors.js';
import {project} from '../learning/progress.js';
import {readBasisRecord, verifyBasisRecord} from './basis.js';
import {purchaseOffer, rebuildAccounts} from './projection.js';
import {assertProofManifest, verifyProofRecord} from './proof.js';
import {assertCache, assertReceipt} from './schema.js';
import {
  assertArray,
  assertBinding,
  assertExactKeys,
  assertRef,
  canonical,
  copy,
  digest,
  fail,
  sameBinding,
  sameRef,
} from './value.js';

function assertEntries(value) {
  assertExactKeys(value, ['head', 'values', 'proofs'], 'Die Belegmenge ist ungültig.');
  const head = assertRef(value.head);
  assertArray(value.values, 'Die Belegwerte sind ungültig.');
  const byId = new Map();
  for (const entry of value.values) {
    assertExactKeys(entry, ['ref', 'value'], 'Ein Belegeintrag ist ungültig.');
    const ref = assertRef(entry.ref);
    const receipt = assertReceipt(entry.value);
    if (byId.has(ref.id)) fail('collision', 'Eine Beleg-ID wird mehrfach geliefert.');
    byId.set(ref.id, {ref, value: receipt});
  }
  if (!byId.has(head.id) || !sameRef(head, byId.get(head.id).ref)) {
    fail('history', 'Der angegebene Belegkopf fehlt.');
  }
  assertArray(value.proofs, 'Die Herkunftsnachweise sind ungültig.');
  return {head, byId, proofs: value.proofs};
}

function dependencies(receipt) {
  const refs = [];
  if (receipt.previous !== null) refs.push(receipt.previous);
  if (receipt.economy?.source !== null && receipt.economy?.source !== undefined) {
    refs.push(receipt.economy.source.head);
  }
  return refs;
}

function reachableOrder(head, byId) {
  const color = new Map();
  const order = [];
  const stack = [{id: head.id, entered: false, next: 0, deps: null}];
  while (stack.length > 0) {
    const frame = stack.at(-1);
    const entry = byId.get(frame.id);
    if (!entry) fail('history', `Ein Vorgängerbeleg fehlt: ${frame.id}.`);
    if (!frame.entered) {
      const state = color.get(frame.id) ?? 0;
      if (state === 1) fail('cycle', 'Die Beleg- oder Herkunftskette enthält einen Kreis.');
      if (state === 2) {
        stack.pop();
        continue;
      }
      color.set(frame.id, 1);
      frame.entered = true;
      frame.deps = dependencies(entry.value);
    }
    if (frame.next < frame.deps.length) {
      const ref = frame.deps[frame.next];
      frame.next += 1;
      const target = byId.get(ref.id);
      if (!target) fail('history', `Ein Vorgängerbeleg fehlt: ${ref.id}.`);
      if (!sameRef(ref, target.ref)) fail('integrity', 'Ein Belegverweis hat einen abweichenden Hash.');
      const state = color.get(ref.id) ?? 0;
      if (state === 1) fail('cycle', 'Die Beleg- oder Herkunftskette enthält einen Kreis.');
      if (state === 0) stack.push({id: ref.id, entered: false, next: 0, deps: null});
      continue;
    }
    color.set(frame.id, 2);
    order.push(frame.id);
    stack.pop();
  }
  if (color.size !== byId.size) fail('history', 'Die Belegmenge enthält nicht erreichbare alternative Ketten.');
  return order;
}

function bindingContexts(head, byId, targetBinding) {
  const contexts = new Map();
  const coordinators = new Map();
  const queue = [{id: head.id, binding: targetBinding}];
  while (queue.length > 0) {
    const {id, binding} = queue.shift();
    const key = canonical(binding);
    const previous = contexts.get(id);
    if (previous && previous !== key) fail('binding', 'Ein Beleg wird aus widersprüchlichen Bindungen verwendet.');
    if (previous) continue;
    contexts.set(id, key);
    const receipt = byId.get(id).value;
    if (receipt.datasetId !== binding.datasetId) fail('binding', 'Ein Beleg gehört zu einem anderen Datensatz.');
    const coordinator = coordinators.get(key);
    if (coordinator && coordinator !== receipt.coordinatorId) {
      fail('binding', 'Eine Belegkette wechselt ihren Koordinationsordner.');
    }
    coordinators.set(key, receipt.coordinatorId);
    if (receipt.previous !== null) queue.push({id: receipt.previous.id, binding});
    if (receipt.economy?.source) {
      queue.push({id: receipt.economy.source.head.id, binding: receipt.economy.source.binding});
    }
  }
  return {contexts, coordinators};
}

async function verifyReceiptHashes(byId) {
  for (const {ref, value} of byId.values()) {
    if (await digest(value) !== ref.sha256) fail('integrity', `Der Beleg ${ref.id} hat einen falschen Hash.`);
  }
}

async function basisMap(values) {
  assertArray(values, 'Die Basismodellmenge ist ungültig.');
  const byId = new Map();
  for (const value of values) {
    const checked = await verifyBasisRecord(value);
    if (byId.has(checked.ref.id)) fail('collision', 'Ein Basismodell wird mehrfach geliefert.');
    byId.set(checked.ref.id, checked);
  }
  return byId;
}

async function proofMap(values) {
  const byId = new Map();
  for (const value of values) {
    const checked = await verifyProofRecord(value);
    if (byId.has(checked.ref.id)) fail('collision', 'Ein Herkunftsmanifest wird mehrfach geliefert.');
    byId.set(checked.ref.id, checked);
  }
  return byId;
}

function closureObjectRefs(head, receipts, bases, proofs) {
  const refs = new Map();
  const seen = new Set();
  const queue = [head];
  while (queue.length > 0) {
    const ref = queue.pop();
    if (seen.has(ref.id)) continue;
    seen.add(ref.id);
    refs.set(ref.id, ref);
    const receipt = receipts.get(ref.id)?.value;
    if (!receipt) fail('history', 'Ein Herkunftsbeleg fehlt in seiner Closure.');
    const basis = bases.get(receipt.basis.id);
    if (!basis) fail('history', 'Eine Herkunftsbasis fehlt in ihrer Closure.');
    refs.set(basis.ref.id, basis.ref);
    for (const part of basis.parts) refs.set(part.ref.id, part.ref);
    const proofRef = receipt.economy?.source?.proof;
    if (proofRef !== null && proofRef !== undefined) {
      const proof = proofs.get(proofRef.id);
      if (!proof || !sameRef(proof.ref, proofRef)) {
        fail('history', 'Ein verschachteltes Herkunftsmanifest fehlt in seiner Closure.');
      }
      refs.set(proof.ref.id, proof.ref);
      for (const object of proof.objects) refs.set(object.stored.id, object.stored);
    }
    for (const dependency of dependencies(receipt)) queue.push(dependency);
  }
  return refs;
}

function verifySourceProofs(order, receipts, bases, contexts, proofs) {
  const used = new Set();
  for (const id of order) {
    const receipt = receipts.get(id).value;
    const source = receipt.economy?.source;
    if (!source) continue;
    const sourceDiffers = canonical(source.binding) !== contexts.get(id);
    if (source.proof === null) {
      if (sourceDiffers) fail('history', 'Eine fremde Herkunft hat kein portables Herkunftsmanifest.');
      continue;
    }
    const proof = proofs.get(source.proof.id);
    if (!proof || !sameRef(proof.ref, source.proof)) fail('history', 'Das Herkunftsmanifest fehlt.');
    if (!sameBinding(proof.manifest.binding, source.binding)
      || !sameRef(proof.manifest.head, source.head)) {
      fail('binding', 'Das Herkunftsmanifest gehört zu einer anderen Quelle.');
    }
    const expected = closureObjectRefs(source.head, receipts, bases, proofs);
    const actual = new Map(proof.objects.map(({logical}) => [logical.id, logical]));
    if (expected.size !== actual.size) fail('history', 'Das Herkunftsmanifest bildet nicht exakt die Quellclosure ab.');
    for (const [logicalId, ref] of expected) {
      if (!actual.has(logicalId) || !sameRef(actual.get(logicalId), ref)) {
        fail('integrity', 'Das Herkunftsmanifest verändert einen logischen Quellverweis.');
      }
    }
    used.add(proof.ref.id);
  }
  if (used.size !== proofs.size) fail('history', 'Es wurde ein nicht erreichbares Herkunftsmanifest geliefert.');
}

function checkedLearning(ledger, receipt) {
  if (ledger.descriptor.datasetId !== receipt.datasetId) fail('binding', 'Beleg und Basismodell gehören nicht zusammen.');
  const learning = project(ledger);
  if (learning.epochConflict || learning.activeEpochId === null || learning.integrityProblems.length > 0) {
    fail('incomplete', 'Das Basismodell hat keinen eindeutigen vollständigen Stand.');
  }
  if (learning.activeEpochId !== receipt.epochId) fail('binding', 'Der Beleg aktiviert eine andere Epoche als seine Basis.');
  return learning;
}

function normalizedFacts(ledger) {
  const resolved = resolveEpochs(ledger);
  if (resolved.epochConflict || resolved.activeEpochId === null) {
    fail('incomplete', 'Die aktiven Fakten sind nicht eindeutig.');
  }
  const normalize = (event) => {
    const value = copy(event);
    delete value.datasetId;
    delete value.epochId;
    return value;
  };
  return new Map(resolved.effectiveEvents.map((event) => [event.id, normalize(event)]));
}

function assertExtends(previousLedger, nextLedger) {
  const before = normalizedFacts(previousLedger);
  const after = normalizedFacts(nextLedger);
  for (const [id, event] of before) {
    if (!after.has(id)) fail('history', 'Eine spätere Kaufbasis entfernt frühere aktive Fakten.');
    if (canonical(after.get(id)) !== canonical(event)) {
      fail('collision', 'Eine spätere Kaufbasis verändert eine bestehende Fakten-ID.');
    }
  }
  const answerSlots = new Map();
  for (const event of before.values()) {
    if (event.type !== 'answer.recorded') continue;
    const {profileId, roundId, ordinal} = event.payload;
    answerSlots.set(`${profileId}\u0000${roundId}\u0000${ordinal}`, event.id);
  }
  for (const event of after.values()) {
    if (event.type !== 'answer.recorded') continue;
    const {profileId, roundId, ordinal} = event.payload;
    const previousId = answerSlots.get(`${profileId}\u0000${roundId}\u0000${ordinal}`);
    if (previousId && previousId !== event.id) {
      fail('collision', 'Eine spätere Kaufbasis verdrängt die Identität einer bestehenden Antwort.');
    }
  }
}

function assertEquivalentFacts(sourceLedger, targetLedger) {
  const source = normalizedFacts(sourceLedger);
  const target = normalizedFacts(targetLedger);
  if (source.size !== target.size) fail('history', 'Die Restorebasis enthält einen anderen Fachstand als ihre Herkunft.');
  for (const [id, event] of source) {
    if (!target.has(id) || canonical(target.get(id)) !== canonical(event)) {
      fail('collision', 'Die Restorebasis verändert die Identität eines Herkunftsfakts.');
    }
  }
}

function operationUniqueness(order, byId, contexts) {
  const operations = new Map();
  for (const id of order) {
    const receipt = byId.get(id).value;
    const operationKey = `${contexts.get(id)}\u0000${receipt.operationId}`;
    const previous = operations.get(operationKey);
    if (previous) fail('collision', 'Eine Operations-ID wird von mehreren Belegen verwendet.');
    operations.set(operationKey, receipt);
  }
}

function stateResult({binding, coordinatorId, head, receipt, basis, accounts, receipts}) {
  return {
    version: 1,
    binding: copy(binding),
    coordinatorId,
    head: copy(head),
    sequence: receipt.sequence,
    activeEpochId: receipt.epochId,
    basis: copy(receipt.basis),
    accounts: copy(accounts),
    receipts: copy(receipts),
  };
}

export async function replayHistory({entries, bases, binding}) {
  const targetBinding = assertBinding(binding);
  const {head, byId, proofs} = assertEntries(entries);
  const order = reachableOrder(head, byId);
  const {contexts, coordinators} = bindingContexts(head, byId, targetBinding);
  await verifyReceiptHashes(byId);
  const basisById = await basisMap(bases);
  const proofById = await proofMap(proofs);
  verifySourceProofs(order, byId, basisById, contexts, proofById);
  operationUniqueness(order, byId, contexts);

  const states = new Map();
  const receiptSummaries = [];
  const usedBases = new Set();
  const usedEpochs = new Map();
  for (const id of order) {
    const entry = byId.get(id);
    const receipt = entry.value;
    const contextKey = contexts.get(id);
    const contextBinding = JSON.parse(contextKey);
    const basis = basisById.get(receipt.basis.id);
    if (!basis || !sameRef(basis.ref, receipt.basis)) fail('history', 'Die geprüfte Belegbasis fehlt.');
    usedBases.add(basis.ref.id);
    const learning = checkedLearning(basis.ledger, receipt);
    const contextEpochs = usedEpochs.get(contextKey) ?? new Set();
    let accounts;

    if (receipt.operation === 'initialize') {
      accounts = rebuildAccounts(learning);
    } else {
      const previous = states.get(receipt.previous.id);
      if (!previous) fail('history', 'Der vorherige wirtschaftliche Stand fehlt.');
      if (receipt.sequence !== previous.receipt.sequence + 1) {
        fail('history', 'Die Belegsequenz ist nicht lückenlos.');
      }
      if (receipt.operation === 'restore' && contextEpochs.has(receipt.epochId)) {
        fail('history', 'Eine Wiederherstellung muss eine neue Zielepoche aktivieren.');
      }
      if (receipt.operation === 'purchase') {
        if (receipt.epochId !== previous.receipt.epochId) {
          fail('history', 'Ein Kauf darf die aktive Epoche nicht wechseln.');
        }
        assertExtends(previous.basis.ledger, basis.ledger);
        accounts = rebuildAccounts(learning, previous.accounts);
        const economic = stateResult({
          binding: contextBinding,
          coordinatorId: coordinators.get(contextKey),
          head: receipt.previous,
          receipt: previous.receipt,
          basis: previous.basis,
          accounts,
          receipts: [],
        });
        economic.activeEpochId = learning.activeEpochId;
        const offer = purchaseOffer({
          ledger: basis.ledger,
          economic,
          profileId: receipt.intent.profileId,
          articleId: receipt.intent.articleId,
        });
        if (receipt.intent.catalogVersion !== offer.catalogVersion || receipt.intent.price !== offer.price) {
          fail('price', 'Der eingefrorene Kaufpreis stimmt nicht mit dem Katalog überein.');
        }
        const account = accounts[receipt.intent.profileId];
        account.spentPoints += offer.price;
        account.availablePoints -= offer.price;
        account.purchasedArticleIds.push(receipt.intent.articleId);
        account.purchasedArticleIds.sort();
        const rebuilt = rebuildAccounts(learning, accounts);
        accounts = rebuilt;
      } else if (receipt.economy.source === null) {
        accounts = rebuildAccounts(learning);
      } else {
        const source = states.get(receipt.economy.source.head.id);
        if (!source) fail('history', 'Der wirtschaftliche Herkunftsstand fehlt.');
        assertEquivalentFacts(source.basis.ledger, basis.ledger);
        accounts = rebuildAccounts(learning, source.accounts);
      }
    }

    const summary = {
      ref: copy(entry.ref),
      operationId: receipt.operationId,
      operation: receipt.operation,
      sequence: receipt.sequence,
      datasetId: receipt.datasetId,
      epochId: receipt.epochId,
    };
    receiptSummaries.push(summary);
    states.set(id, {receipt, basis, accounts, binding: contextBinding});
    contextEpochs.add(receipt.epochId);
    usedEpochs.set(contextKey, contextEpochs);
  }
  if (usedBases.size !== basisById.size) fail('history', 'Die Basismodellmenge enthält nicht verwendete alternative Inhalte.');
  const current = states.get(head.id);
  const targetKey = canonical(targetBinding);
  return stateResult({
    binding: targetBinding,
    coordinatorId: coordinators.get(targetKey),
    head,
    receipt: current.receipt,
    basis: current.basis,
    accounts: current.accounts,
    receipts: receiptSummaries,
  });
}

async function verifyCachedValues(cache, onWork) {
  const byId = new Map();
  for (const entry of cache.values) {
    const actual = await digest(entry.value);
    if (actual !== entry.ref.sha256) fail('integrity', `Der Cachewert ${entry.ref.id} hat einen falschen Hash.`);
    byId.set(entry.ref.id, copy(entry));
    await onWork();
  }
  return byId;
}

function assertExtendsCachedHead(head, cachedHead, receipts) {
  if (cachedHead === null || sameRef(head, cachedHead)) return;
  let cursor = head;
  const seen = new Set();
  while (cursor !== null) {
    if (sameRef(cursor, cachedHead)) return;
    if (seen.has(cursor.id)) fail('cycle', 'Die Zielbelegkette enthält einen Kreis.');
    seen.add(cursor.id);
    const entry = receipts.get(cursor.id);
    if (!entry) break;
    cursor = entry.value.previous;
  }
  fail('history', 'Der neue Kopf erweitert den zuletzt geprüften Kopf nicht.');
}

export async function readHistory({head, read, cache, binding, onProgress}) {
  const checkedHead = assertRef(head);
  const checkedBinding = assertBinding(binding);
  const checkedCache = assertCache(cache);
  if (typeof read !== 'function') fail('invalid', 'Die Lesefunktion für die Historie fehlt.');
  if (typeof onProgress !== 'function') fail('invalid', 'Die Fortschrittsfunktion für die Historie fehlt.');
  const yieldToEventLoop = () => new Promise((resolve) => setTimeout(resolve, 0));
  let work = 0;
  const recordWork = async () => {
    work += 1;
    if (work % 32 === 0) await yieldToEventLoop();
  };
  const values = await verifyCachedValues(checkedCache, recordWork);
  const aliases = new Map();
  const proofs = new Map();
  let verified = 0;

  async function getById(id, ref = null) {
    const cached = values.get(id);
    if (cached) {
      return copy(cached.value);
    }
    let value;
    try {
      value = await read(id, ref === null ? null : copy(ref));
    } catch (error) {
      if (error instanceof ProductError) throw error;
      fail('history', `Ein unveränderlicher Historienwert fehlt: ${id}.`);
    }
    const sha256 = await digest(value);
    values.set(id, {ref: {id, sha256}, value: copy(value)});
    await recordWork();
    return copy(value);
  }

  async function get(ref) {
    const alias = aliases.get(ref.id);
    if (alias) {
      if (!sameRef(alias.logical, ref)) fail('integrity', 'Ein logischer Herkunftsverweis hat einen anderen Hash.');
      return copy(alias.value);
    }
    const value = await getById(ref.id, ref);
    const cached = values.get(ref.id);
    if (!sameRef(cached.ref, ref)) fail('integrity', 'Eine bekannte Datei-ID wird mit anderem Hash referenziert.');
    return value;
  }

  async function loadProof(ref, source) {
    if (proofs.has(ref.id)) {
      const known = proofs.get(ref.id);
      if (!sameRef(known.ref, ref)) fail('integrity', 'Ein Herkunftsmanifest wird mit anderem Hash referenziert.');
      return;
    }
    const manifest = assertProofManifest(await get(ref));
    if (!sameBinding(manifest.binding, source.binding) || !sameRef(manifest.head, source.head)) {
      fail('binding', 'Das Herkunftsmanifest gehört zu einer anderen Quelle.');
    }
    const objects = [];
    for (const mapping of manifest.objects) {
      const value = await get(mapping.stored);
      objects.push({logical: copy(mapping.logical), stored: copy(mapping.stored), value});
    }
    const record = await verifyProofRecord({ref, manifest, objects});
    for (const object of record.objects) {
      const previous = aliases.get(object.logical.id);
      if (previous && (!sameRef(previous.logical, object.logical)
        || canonical(previous.value) !== canonical(object.value))) {
        fail('collision', 'Ein logischer Herkunftsverweis wird widersprüchlich abgebildet.');
      }
      aliases.set(object.logical.id, copy(object));
    }
    proofs.set(ref.id, record);
  }

  const receipts = new Map();
  const queue = [{ref: checkedHead, binding: checkedBinding}];
  while (queue.length > 0) {
    const {ref, binding: contextBinding} = queue.pop();
    if (receipts.has(ref.id)) {
      if (!sameRef(receipts.get(ref.id).ref, ref)) fail('integrity', 'Eine Beleg-ID wird mit anderem Hash referenziert.');
      continue;
    }
    const value = assertReceipt(await get(ref));
    receipts.set(ref.id, {ref: copy(ref), value});
    verified += 1;
    onProgress({phase: 'receipts', verified, total: null});
    if (value.previous !== null) queue.push({ref: value.previous, binding: contextBinding});
    if (value.economy?.source) {
      const source = value.economy.source;
      if (source.proof !== null) await loadProof(source.proof, source);
      else if (!sameBinding(source.binding, contextBinding)) {
        fail('history', 'Eine fremde Herkunft hat kein portables Herkunftsmanifest.');
      }
      queue.push({ref: source.head, binding: source.binding});
    }
    if (verified % 32 === 0) await yieldToEventLoop();
  }
  assertExtendsCachedHead(checkedHead, checkedCache.head, receipts);

  const basisRefs = new Map();
  for (const {value} of receipts.values()) basisRefs.set(value.basis.id, value.basis);
  const bases = [];
  for (const ref of basisRefs.values()) {
    const record = await readBasisRecord(ref, async (id, expectedRef) => {
      const alias = aliases.get(id);
      return alias ? copy(alias.value) : getById(id, expectedRef);
    });
    bases.push(record);
    verified += 1;
    onProgress({phase: 'bases', verified, total: receipts.size + basisRefs.size});
    if (verified % 32 === 0) await yieldToEventLoop();
  }
  const entries = {
    head: copy(checkedHead),
    values: [...receipts.values()].map(copy),
    proofs: [...proofs.values()].map(copy),
  };
  const projection = await replayHistory({entries, bases, binding: checkedBinding});
  return {
    entries,
    bases: copy(bases),
    projection,
    cache: {
      version: 1,
      head: copy(checkedHead),
      values: [...values.values()].sort((left, right) => left.ref.id.localeCompare(right.ref.id)),
    },
  };
}
