import test from 'node:test';
import assert from 'node:assert/strict';
import {createPurchaseTransport} from '../../src/trainer/purchases/transport.js';
import {prepareBootstrap, resumeBootstrap} from '../../src/trainer/purchases/bootstrap.js';
import {digest} from '../../src/trainer/purchases/value.js';
import {purchasesHttpFixture} from './purchases-http-fixture.js';

const binding = {
  accountId: 'account-a',
  folderId: 'dataset-folder',
  descriptorFileId: 'descriptor-file',
  datasetId: 'dataset-a',
};

async function setupFixture(options = {}) {
  const fixture = purchasesHttpFixture(options);
  const descriptor = {version: 2, datasetId: binding.datasetId, rootEpochId: 'epoch-a'};
  const descriptorHash = await digest(descriptor);
  fixture.seed({
    id: binding.folderId,
    name: 'Vokabeltrainer',
    mimeType: fixture.FOLDER,
    properties: {app: 'vokabeltrainer-product', kind: 'dataset-folder', datasetId: binding.datasetId, foreign: 'keep'},
  });
  fixture.seed({
    id: binding.descriptorFileId,
    name: 'dataset.json',
    parentId: binding.folderId,
    properties: {app: 'vokabeltrainer-product', kind: 'dataset', datasetId: binding.datasetId},
    value: descriptor,
  });
  const transport = createPurchaseTransport({
    fetchImpl: fixture.fetch,
    getToken: async () => 'synthetic-token',
    binding,
    descriptorHash,
  });
  return {fixture, descriptor, descriptorHash, transport};
}

function recorder() {
  const values = [];
  return {values, persist: async (value) => values.push(structuredClone(value))};
}

test('transport preserves opaque strong ETags and rejects incoherent folder metadata', async () => {
  const {fixture, transport} = await setupFixture();
  const snapshot = await transport.readFolder({id: binding.folderId, kind: 'dataset'});
  assert.equal(snapshot.etag, '"opaque/strong:token"');
  assert.equal(fixture.calls.filter(({url}) => url.includes(`/drive/v2/files/${binding.folderId}`)).length, 2);

  let reads = 0;
  fixture.files.get(binding.folderId).etag = '"first-opaque"';
  const originalFetch = fixture.fetch;
  const changing = createPurchaseTransport({
    fetchImpl: async (url, init) => {
      const result = await originalFetch(url, init);
      if (url.includes(`/drive/v2/files/${binding.folderId}`) && ++reads === 1) {
        fixture.files.get(binding.folderId).etag = '"second-opaque"';
      }
      return result;
    },
    getToken: async () => 'synthetic-token', binding,
    descriptorHash: transport.descriptorHash,
  });
  await assert.rejects(() => changing.readFolder({id: binding.folderId, kind: 'dataset'}), {code: 'stale'});
});

test('transport binds every operation to the configured account and unchanged descriptor hash', async () => {
  const {fixture, descriptorHash, transport} = await setupFixture();
  assert.equal(await transport.accountId(), binding.accountId);
  assert.deepEqual(await transport.readImmutable(
    {id: binding.descriptorFileId, sha256: descriptorHash},
    {kind: 'descriptor'},
  ), {version: 2, datasetId: binding.datasetId, rootEpochId: 'epoch-a'});

  fixture.setAccountId('account-b');
  await assert.rejects(() => transport.reserveId(), {code: 'binding'});
  fixture.setAccountId(binding.accountId);
  fixture.files.get(binding.descriptorFileId).value.rootEpochId = 'changed';
  await assert.rejects(() => transport.readImmutable(
    {id: binding.descriptorFileId, sha256: descriptorHash},
    {kind: 'descriptor'},
  ), {code: 'integrity'});
});

test('account check and dependent request use one runtime token snapshot', async () => {
  const fixture = purchasesHttpFixture();
  const descriptorHash = 'a'.repeat(64);
  let tokenCalls = 0;
  const tokens = ['token-account-a', 'token-account-b'];
  const transport = createPurchaseTransport({
    binding,
    descriptorHash,
    getToken: async () => tokens[Math.min(tokenCalls++, tokens.length - 1)],
    fetchImpl: async (url, init = {}) => {
      const parsed = new URL(url);
      if (parsed.pathname.endsWith('/drive/v3/about')) {
        const permissionId = init.headers?.Authorization === 'Bearer token-account-a'
          ? binding.accountId
          : 'account-b';
        return new Response(JSON.stringify({user: {permissionId}}), {
          status: 200,
          headers: {'Content-Type': 'application/json'},
        });
      }
      return fixture.fetch(url, init);
    },
  });
  assert.equal(await transport.reserveId(), 'reserved-1');
  assert.equal(tokenCalls, 1);
  const authorizations = fixture.calls
    .filter(({url}) => url.includes('/drive/v3/files/generateIds'))
    .map(({headers}) => headers.Authorization);
  assert.deepEqual(authorizations, ['Bearer token-account-a']);
});

test('bootstrap persists both folder IDs and config before its first write', async () => {
  const {fixture, descriptorHash, transport} = await setupFixture();
  const saved = recorder();
  const setup = await prepareBootstrap({
    transport, binding, descriptorHash, operationId: 'setup-a', persist: saved.persist,
  });
  assert.equal(setup.phase, 'reserved');
  assert.match(setup.coordinatorId, /^reserved-/);
  assert.match(setup.contentFolderId, /^reserved-/);
  assert.equal(setup.config.coordinatorId, setup.coordinatorId);
  assert.equal(setup.config.contentFolderId, setup.contentFolderId);
  assert.equal(setup.config.descriptorHash, descriptorHash);
  assert.deepEqual(saved.values, [setup]);
  assert.equal(fixture.calls.some(({method}) => method === 'POST' || method === 'PUT'), false);
});

test('bootstrap resumes lost creates and installs one immutable config while preserving foreign properties', async () => {
  const {fixture, descriptorHash, transport} = await setupFixture();
  const saved = recorder();
  const setup = await prepareBootstrap({transport, binding, descriptorHash, operationId: 'setup-a', persist: saved.persist});
  fixture.loseCreateResponse();
  await assert.rejects(() => resumeBootstrap({transport, setup, persist: saved.persist}), {code: 'network'});

  const confirmed = await resumeBootstrap({transport, setup: saved.values.at(-1), persist: saved.persist});
  assert.equal(confirmed.phase, 'confirmed');
  assert.equal(fixture.files.get(binding.folderId).properties.foreign, 'keep');
  assert.equal(fixture.files.get(binding.folderId).properties.purchaseApp, 'vokabeltrainer-purchases');
  assert.equal(fixture.files.get(binding.folderId).properties.purchaseConfigId, confirmed.configRef.id);
  assert.equal(fixture.files.get(binding.folderId).properties.purchaseConfigSha256, confirmed.configRef.sha256);
  assert.deepEqual(await transport.readImmutable(confirmed.configRef, {kind: 'config', config: confirmed.config}), confirmed.config);
});

test('concurrent bootstrap uses the exact winner and never replaces the installed config ref', async () => {
  const {fixture, descriptorHash, transport} = await setupFixture();
  const leftSaved = recorder();
  const rightSaved = recorder();
  const left = await prepareBootstrap({transport, binding, descriptorHash, operationId: 'setup-left', persist: leftSaved.persist});
  const right = await prepareBootstrap({transport, binding, descriptorHash, operationId: 'setup-right', persist: rightSaved.persist});

  const winner = await resumeBootstrap({transport, setup: left, persist: leftSaved.persist});
  const loser = await resumeBootstrap({transport, setup: right, persist: rightSaved.persist});
  assert.equal(loser.phase, 'confirmed');
  assert.deepEqual(loser.configRef, winner.configRef);
  assert.deepEqual(loser.config, winner.config);
  assert.equal(fixture.files.get(binding.folderId).properties.purchaseConfigId, winner.configRef.id);
});

test('lost pointer response is reconciled from the original persisted job', async () => {
  const {fixture, descriptorHash, transport} = await setupFixture();
  const saved = recorder();
  const setup = await prepareBootstrap({transport, binding, descriptorHash, operationId: 'setup-a', persist: saved.persist});
  fixture.losePointerResponse();
  const confirmed = await resumeBootstrap({transport, setup, persist: saved.persist});
  assert.equal(confirmed.phase, 'confirmed');
  assert.equal(saved.values.some(({phase}) => phase === 'pointer-pending'), true);
  assert.equal(saved.values.some(({phase}) => phase === 'reconciling'), true);
  assert.equal(confirmed.configRef.id, setup.configRef.id);
});

test('unclear bootstrap resume stays read-only until an explicit identical pointer repeat', async () => {
  const {fixture, descriptorHash, transport} = await setupFixture();
  const saved = recorder();
  const setup = await prepareBootstrap({transport, binding, descriptorHash, operationId: 'setup-a', persist: saved.persist});
  fixture.dropPointerResponse();
  await assert.rejects(() => resumeBootstrap({transport, setup, persist: saved.persist}), {code: 'network'});
  const unclear = saved.values.at(-1);
  assert.equal(unclear.phase, 'reconciling');
  assert.equal(unclear.etag, '"opaque/strong:token"');
  assert.deepEqual(unclear.pointerProperties, {
    app: 'vokabeltrainer-product',
    kind: 'dataset-folder',
    datasetId: binding.datasetId,
    foreign: 'keep',
    purchaseApp: 'vokabeltrainer-purchases',
    purchaseConfigId: setup.configRef.id,
    purchaseConfigSha256: setup.configRef.sha256,
  });

  const root = fixture.files.get(binding.folderId);
  root.properties.unrelated = 'changed-after-unknown-outcome';
  root.version += 1;
  root.etag = '"changed-between-restarts"';
  const before = fixture.calls.filter(({method}) => method === 'PUT').length;
  const stillUnclear = await resumeBootstrap({transport, setup: unclear, persist: saved.persist});
  assert.equal(stillUnclear.phase, 'reconciling');
  assert.equal(fixture.calls.filter(({method}) => method === 'PUT').length, before);

  const repeated = await resumeBootstrap({
    transport,
    setup: stillUnclear,
    persist: saved.persist,
    repeatPointer: true,
  });
  assert.equal(repeated.phase, 'reconciling');
  const pointerCalls = fixture.calls.filter(({method}) => method === 'PUT');
  assert.equal(pointerCalls.length, before + 1);
  assert.equal(pointerCalls.at(-1).headers['If-Match'], '"opaque/strong:token"');
  assert.deepEqual(
    Object.fromEntries(JSON.parse(pointerCalls.at(-1).body).properties.map(({key, value}) => [key, value])),
    unclear.pointerProperties,
  );
});

test('immutable 409 is accepted only for exact config binding and content hash', async () => {
  const {fixture, descriptorHash, transport} = await setupFixture();
  const saved = recorder();
  const setup = await prepareBootstrap({transport, binding, descriptorHash, operationId: 'setup-a', persist: saved.persist});
  await resumeBootstrap({transport, setup, persist: saved.persist});
  fixture.files.get(setup.configRef.id).value = {...setup.config, contentFolderId: 'foreign-folder'};
  await assert.rejects(() => transport.writeImmutable({
    ref: setup.configRef,
    value: setup.config,
    kind: 'config',
    config: setup.config,
    authorization: {kind: 'setup', setup},
  }), {code: 'integrity'});
});

test('pointer PUT enforces 30 private properties and 124 UTF-8 bytes without losing existing properties', async () => {
  const {fixture, descriptorHash, transport} = await setupFixture();
  const saved = recorder();
  const setup = await prepareBootstrap({transport, binding, descriptorHash, operationId: 'setup-a', persist: saved.persist});
  const record = fixture.files.get(binding.folderId);
  for (let index = 0; index < 27; index += 1) record.properties[`foreign${index}`] = 'v';
  const writes = () => fixture.calls.filter(({method}) => method === 'PUT').length;
  const before = writes();
  await assert.rejects(() => resumeBootstrap({transport, setup, persist: saved.persist}), {code: 'limit'});
  assert.equal(writes(), before);

  for (const key of Object.keys(record.properties)) if (key.startsWith('foreign')) delete record.properties[key];
  record.properties.foreign = 'ä'.repeat(61);
  const second = await prepareBootstrap({transport, binding, descriptorHash, operationId: 'setup-b', persist: saved.persist});
  await assert.rejects(() => resumeBootstrap({transport, setup: second, persist: saved.persist}), {code: 'limit'});
  assert.equal(writes(), before);
});

test('remote refs and mutable caller copies never grant write authority', async () => {
  const {descriptorHash, transport} = await setupFixture();
  const saved = recorder();
  const setup = await prepareBootstrap({transport, binding, descriptorHash, operationId: 'setup-a', persist: saved.persist});
  const forged = structuredClone(setup);
  forged.configRef = {id: 'free-id', sha256: await digest(forged.config)};
  await assert.rejects(() => transport.writeImmutable({
    ref: forged.configRef,
    value: forged.config,
    kind: 'config',
    config: forged.config,
    authorization: {kind: 'setup', setup},
  }), {code: 'binding'});
  const snapshot = await transport.readFolder({id: binding.folderId, kind: 'dataset'});
  snapshot.properties.foreign = 'caller-change';
  const fresh = await transport.readFolder({id: binding.folderId, kind: 'dataset'});
  assert.equal(fresh.properties.foreign, 'keep');
});

test('pointer authority requires the exact persisted ETag and cannot replace an installed config ref', async () => {
  const {fixture, descriptorHash, transport} = await setupFixture();
  const firstSaved = recorder();
  const first = await prepareBootstrap({transport, binding, descriptorHash, operationId: 'setup-first', persist: firstSaved.persist});
  const root = await transport.readFolder({id: binding.folderId, kind: 'dataset'});
  const wrongEtag = {
    ...first,
    phase: 'pointer-pending',
    etag: '"different-opaque"',
    pointerProperties: {
      ...root.properties,
      purchaseApp: 'vokabeltrainer-purchases',
      purchaseConfigId: first.configRef.id,
      purchaseConfigSha256: first.configRef.sha256,
    },
  };
  const before = fixture.calls.filter(({method}) => method === 'PUT').length;
  await assert.rejects(() => transport.putPointer({
    snapshot: root,
    configRef: first.configRef,
    authorization: {kind: 'setup', setup: wrongEtag},
  }), {code: 'binding'});
  assert.equal(fixture.calls.filter(({method}) => method === 'PUT').length, before);

  const winner = await resumeBootstrap({transport, setup: first, persist: firstSaved.persist});
  const secondSaved = recorder();
  const second = await prepareBootstrap({transport, binding, descriptorHash, operationId: 'setup-second', persist: secondSaved.persist});
  const installed = await transport.readFolder({id: binding.folderId, kind: 'dataset'});
  const pending = {
    ...second,
    phase: 'pointer-pending',
    etag: installed.etag,
    pointerProperties: {
      ...installed.properties,
      purchaseApp: 'vokabeltrainer-purchases',
      purchaseConfigId: second.configRef.id,
      purchaseConfigSha256: second.configRef.sha256,
    },
  };
  await assert.rejects(() => transport.putPointer({
    snapshot: installed,
    configRef: second.configRef,
    authorization: {kind: 'setup', setup: pending},
  }), {code: 'binding'});
  assert.equal(fixture.files.get(binding.folderId).properties.purchaseConfigId, winner.configRef.id);
});

test('snapshot-free setup pointer cannot replace an installed config ref', async () => {
  const {fixture, descriptorHash, transport} = await setupFixture();
  const firstSaved = recorder();
  const first = await prepareBootstrap({
    transport, binding, descriptorHash, operationId: 'setup-first', persist: firstSaved.persist,
  });
  const winner = await resumeBootstrap({transport, setup: first, persist: firstSaved.persist});

  const secondSaved = recorder();
  const second = await prepareBootstrap({
    transport, binding, descriptorHash, operationId: 'setup-second', persist: secondSaved.persist,
  });
  await transport.createFolder({kind: 'coordinator', setup: second});
  await transport.createFolder({kind: 'content', setup: second});
  await transport.writeImmutable({
    ref: second.configRef,
    value: second.config,
    kind: 'config',
    config: second.config,
    authorization: {kind: 'setup', setup: second},
  });
  const installed = await transport.readFolder({id: binding.folderId, kind: 'dataset'});
  const pending = {
    ...second,
    phase: 'pointer-pending',
    etag: installed.etag,
    pointerProperties: {
      ...installed.properties,
      purchaseApp: 'vokabeltrainer-purchases',
      purchaseConfigId: second.configRef.id,
      purchaseConfigSha256: second.configRef.sha256,
    },
  };
  const writes = () => fixture.calls.filter(({method}) => method === 'PUT').length;
  const before = writes();

  await assert.rejects(() => transport.putPointer({
    configRef: second.configRef,
    authorization: {kind: 'setup', setup: pending},
  }), {code: 'binding'});
  assert.equal(writes(), before);
  assert.equal(fixture.files.get(binding.folderId).properties.purchaseConfigId, winner.configRef.id);

  const unchanged = await transport.putPointer({
    configRef: winner.configRef,
    authorization: {
      kind: 'setup',
      setup: {
        ...winner,
        phase: 'pointer-pending',
        etag: '"stale-condition-must-not-be-used"',
      },
    },
  });
  assert.deepEqual(unchanged, {id: binding.folderId, status: null, unchanged: true});
  assert.equal(writes(), before);
});

test('immutable reads enforce exact parent, app, dataset and full configured folder IDs', async () => {
  for (const mutate of [
    (record) => { record.parentId = 'foreign-parent'; },
    (record) => { record.properties.app = 'foreign-app'; },
    (record) => { record.properties.datasetId = 'foreign-dataset'; },
    (record) => { record.properties.coordinatorId = 'foreign-coordinator'; },
    (record) => { record.properties.contentFolderId = 'foreign-content'; },
  ]) {
    const {fixture, descriptorHash, transport} = await setupFixture();
    const saved = recorder();
    const setup = await prepareBootstrap({transport, binding, descriptorHash, operationId: 'setup-a', persist: saved.persist});
    const confirmed = await resumeBootstrap({transport, setup, persist: saved.persist});
    mutate(fixture.files.get(confirmed.configRef.id));
    await assert.rejects(() => transport.readImmutable(
      confirmed.configRef,
      {kind: 'config', config: confirmed.config},
    ), {code: 'binding'});
  }
});

async function pointerCommerce(configRef, config, etag) {
  const previous = {id: 'previous-receipt', sha256: '1'.repeat(64)};
  const intent = {
    version: 1,
    operationId: 'purchase-a',
    datasetId: binding.datasetId,
    profileId: 'profile-a',
    epochId: 'epoch-a',
    articleId: 'dragon',
    catalogVersion: 1,
    price: 200,
    confirmed: true,
  };
  const part = {version: 1, kind: 'basis-part', index: 0, count: 1, content: '{}'};
  const partRef = {id: 'basis-part-a', sha256: await digest(part)};
  const manifest = {
    version: 1,
    kind: 'basis',
    datasetId: binding.datasetId,
    byteLength: 2,
    ledgerHash: '2'.repeat(64),
    parts: [partRef],
  };
  const basisRef = {id: 'basis-a', sha256: await digest(manifest)};
  const receipt = {
    version: 1,
    kind: 'receipt',
    datasetId: binding.datasetId,
    coordinatorId: config.coordinatorId,
    sequence: 1,
    previous,
    operationId: intent.operationId,
    operation: 'purchase',
    epochId: intent.epochId,
    basis: basisRef,
    intent,
    economy: null,
  };
  const candidate = {id: 'receipt-a', sha256: await digest(receipt)};
  const attempt = {
    version: 1,
    attemptId: 'attempt-a',
    phase: 'pointer-pending',
    head: previous,
    etag,
    candidate,
    uploads: [
      {ref: candidate, value: receipt},
      {ref: basisRef, value: manifest},
      {ref: partRef, value: part},
    ],
  };
  return {
    commerce: {
      version: 1,
      mode: 'active',
      binding,
      configRef,
      config,
      head: previous,
      cache: {version: 1, head: previous, values: []},
      setup: null,
      jobs: [{version: 1, intent, status: 'open', attempts: [attempt]}],
      selection: [],
    },
    attempt,
    candidate,
    receipt,
    basisRef,
    manifest,
  };
}

test('purchase pointer accepts only the persisted receipt candidate with its persisted ETag', async () => {
  const {descriptorHash, transport} = await setupFixture();
  const saved = recorder();
  const setup = await prepareBootstrap({transport, binding, descriptorHash, operationId: 'setup-a', persist: saved.persist});
  const confirmed = await resumeBootstrap({transport, setup, persist: saved.persist});
  const coordinator = await transport.readFolder({
    id: confirmed.coordinatorId,
    kind: 'coordinator',
    config: confirmed.config,
  });
  const prepared = await pointerCommerce(confirmed.configRef, confirmed.config, coordinator.etag);
  const authorization = {
    kind: 'attempt',
    commerce: prepared.commerce,
    operationId: 'purchase-a',
    attemptId: 'attempt-a',
  };
  await assert.rejects(() => transport.putPointer({
    snapshot: coordinator,
    head: prepared.basisRef,
    headValue: prepared.manifest,
    authorization,
  }), {code: 'binding'});

  const wrongEtag = structuredClone(prepared.commerce);
  wrongEtag.jobs[0].attempts[0].etag = '"other-condition"';
  await assert.rejects(() => transport.putPointer({
    snapshot: coordinator,
    head: prepared.candidate,
    headValue: prepared.receipt,
    authorization: {...authorization, commerce: wrongEtag},
  }), {code: 'binding'});

  assert.deepEqual(await transport.putPointer({
    snapshot: coordinator,
    head: prepared.candidate,
    headValue: prepared.receipt,
    authorization,
  }), {id: confirmed.coordinatorId, status: 200});
});

async function configuredPointerCase() {
  const ready = await setupFixture();
  const saved = recorder();
  const setup = await prepareBootstrap({
    transport: ready.transport,
    binding,
    descriptorHash: ready.descriptorHash,
    operationId: 'setup-a',
    persist: saved.persist,
  });
  const confirmed = await resumeBootstrap({transport: ready.transport, setup, persist: saved.persist});
  const coordinator = await ready.transport.readFolder({
    id: confirmed.coordinatorId,
    kind: 'coordinator',
    config: confirmed.config,
  });
  return {
    ...ready,
    confirmed,
    coordinator,
    prepared: await pointerCommerce(confirmed.configRef, confirmed.config, coordinator.etag),
  };
}

test('purchase authority requires config body hash and the exact installed anchor ref', async () => {
  for (const changedRef of [
    {id: null, sha256: 'f'.repeat(64)},
    {id: 'uninstalled-config', sha256: null},
  ]) {
    const {transport, confirmed, coordinator, prepared} = await configuredPointerCase();
    prepared.commerce.configRef = {
      id: changedRef.id ?? confirmed.configRef.id,
      sha256: changedRef.sha256 ?? await digest(prepared.commerce.config),
    };
    await assert.rejects(() => transport.putPointer({
      snapshot: coordinator,
      head: prepared.candidate,
      headValue: prepared.receipt,
      authorization: {
        kind: 'attempt',
        commerce: prepared.commerce,
        operationId: 'purchase-a',
        attemptId: 'attempt-a',
      },
    }), {code: 'binding'});
  }
});

test('purchase uploads reject a rehashed configuration with an exchanged content folder', async () => {
  const {transport, confirmed, prepared} = await configuredPointerCase();
  prepared.commerce.config = {
    ...prepared.commerce.config,
    contentFolderId: prepared.commerce.config.coordinatorId,
  };
  prepared.commerce.configRef = {
    id: confirmed.configRef.id,
    sha256: await digest(prepared.commerce.config),
  };
  const partUpload = prepared.attempt.uploads.at(-1);
  await assert.rejects(() => transport.writeImmutable({
    ref: partUpload.ref,
    value: partUpload.value,
    kind: 'content',
    config: prepared.commerce.config,
    authorization: {
      kind: 'attempt',
      commerce: prepared.commerce,
      operationId: 'purchase-a',
      attemptId: 'attempt-a',
    },
  }), {code: 'binding'});
});

async function replaceCandidate(prepared, receipt) {
  const candidate = {id: prepared.candidate.id, sha256: await digest(receipt)};
  prepared.receipt = receipt;
  prepared.candidate = candidate;
  prepared.attempt.candidate = candidate;
  prepared.attempt.uploads[0] = {ref: candidate, value: receipt};
}

test('purchase pointer rejects a correctly rehashed receipt for a foreign coordinator', async () => {
  const {fixture, transport, coordinator, prepared} = await configuredPointerCase();
  await replaceCandidate(prepared, {...prepared.receipt, coordinatorId: 'foreign-coordinator'});
  const before = fixture.calls.filter(({method}) => method === 'PUT').length;
  await assert.rejects(() => transport.putPointer({
    snapshot: coordinator,
    head: prepared.candidate,
    headValue: prepared.receipt,
    authorization: {
      kind: 'attempt',
      commerce: prepared.commerce,
      operationId: 'purchase-a',
      attemptId: 'attempt-a',
    },
  }), {code: 'binding'});
  assert.equal(fixture.calls.filter(({method}) => method === 'PUT').length, before);
});

test('immutable writes reject correctly rehashed foreign intent and receipt dataset binding', async () => {
  const {fixture, transport, prepared} = await configuredPointerCase();
  const foreignIntent = {
    ...prepared.receipt.intent,
    datasetId: 'foreign-dataset',
  };
  prepared.commerce.jobs[0].intent = foreignIntent;
  await replaceCandidate(prepared, {
    ...prepared.receipt,
    datasetId: 'foreign-dataset',
    intent: foreignIntent,
  });
  const before = fixture.calls.filter(({method}) => method === 'POST').length;
  await assert.rejects(() => transport.writeImmutable({
    ref: prepared.candidate,
    value: prepared.receipt,
    kind: 'content',
    config: prepared.commerce.config,
    authorization: {
      kind: 'attempt',
      commerce: prepared.commerce,
      operationId: 'purchase-a',
      attemptId: 'attempt-a',
    },
  }), {code: 'binding'});
  assert.equal(fixture.calls.filter(({method}) => method === 'POST').length, before);
});

test('immutable writes reject a correctly rehashed basis manifest for a foreign dataset', async () => {
  const {fixture, transport, prepared} = await configuredPointerCase();
  const manifest = {...prepared.manifest, datasetId: 'foreign-dataset'};
  const basisRef = {id: prepared.basisRef.id, sha256: await digest(manifest)};
  prepared.manifest = manifest;
  prepared.basisRef = basisRef;
  prepared.attempt.uploads[1] = {ref: basisRef, value: manifest};
  await replaceCandidate(prepared, {...prepared.receipt, basis: basisRef});
  const before = fixture.calls.filter(({method}) => method === 'POST').length;
  await assert.rejects(() => transport.writeImmutable({
    ref: basisRef,
    value: manifest,
    kind: 'content',
    config: prepared.commerce.config,
    authorization: {
      kind: 'attempt',
      commerce: prepared.commerce,
      operationId: 'purchase-a',
      attemptId: 'attempt-a',
    },
  }), {code: 'binding'});
  assert.equal(fixture.calls.filter(({method}) => method === 'POST').length, before);
});
