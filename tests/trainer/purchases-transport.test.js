import test from 'node:test';
import assert from 'node:assert/strict';
import {createPurchaseTransport} from '../../src/trainer/purchases/transport.js';
import {prepareBootstrap, resumeBootstrap} from '../../src/trainer/purchases/bootstrap.js';
import {digest} from '../../src/trainer/purchases/value.js';
import {purchasesHttpFixture} from './purchases-http-fixture.js';
import {createServerAuth} from '../../src/drive/server-auth.js';

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

async function descriptorReadWithMetadataDrift(mutate) {
  const {fixture, descriptorHash} = await setupFixture();
  const record = fixture.files.get(binding.descriptorFileId);
  let metadataReads = 0;
  const transport = createPurchaseTransport({
    fetchImpl: async (url, init) => {
      const result = await fixture.fetch(url, init);
      const parsed = new URL(url);
      if (parsed.pathname.endsWith(`/drive/v2/files/${binding.descriptorFileId}`)
        && parsed.searchParams.has('fields') && ++metadataReads === 1) mutate(record);
      return result;
    },
    getToken: async () => 'synthetic-token', binding, descriptorHash,
  });
  return {transport, fixture, ref: {id: binding.descriptorFileId, sha256: descriptorHash}};
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

test('immutable read accepts unrelated metadata drift when its content revision and binding stay fixed', async () => {
  const {transport, ref} = await descriptorReadWithMetadataDrift(record => {
    record.version += 1;
    record.etag = '"metadata-only-change"';
  });
  assert.deepEqual(await transport.readImmutable(ref, {kind: 'descriptor'}), {
    version: 2, datasetId: binding.datasetId, rootEpochId: 'epoch-a',
  });
});

test('immutable read rejects a changed content revision even when the body has the expected hash', async () => {
  const {transport, ref} = await descriptorReadWithMetadataDrift(record => {
    record.headRevisionId = 'another-content-revision';
  });
  await assert.rejects(() => transport.readImmutable(ref, {kind: 'descriptor'}), {code: 'stale'});
});

test('immutable read rejects changed bytes despite a stable content revision', async () => {
  const {transport, ref} = await descriptorReadWithMetadataDrift(record => {
    record.value.rootEpochId = 'changed';
  });
  await assert.rejects(() => transport.readImmutable(ref, {kind: 'descriptor'}), {code: 'integrity'});
});

test('immutable read rejects changed bound metadata despite a stable content revision', async t => {
  for (const [name, mutate] of [
    ['name', record => { record.title = 'changed.json'; }],
    ['parent', record => { record.parentId = 'other-folder'; }],
    ['MIME type', record => { record.mimeType = 'text/plain'; }],
    ['private property', record => { record.properties.datasetId = 'other-dataset'; }],
  ]) await t.test(name, async () => {
    const {transport, ref} = await descriptorReadWithMetadataDrift(mutate);
    await assert.rejects(() => transport.readImmutable(ref, {kind: 'descriptor'}), {code: 'binding'});
  });
});

test('immutable read retains strict version and ETag comparison without a content revision', async t => {
  for (const [name, missingRevision] of [['omitted', undefined], ['null', null]]) {
    await t.test(name, async () => {
      const {transport, ref, fixture} = await descriptorReadWithMetadataDrift(record => {
        record.version += 1;
        record.etag = '"metadata-only-change"';
      });
      fixture.files.get(binding.descriptorFileId).headRevisionId = missingRevision;
      await assert.rejects(() => transport.readImmutable(ref, {kind: 'descriptor'}), {code: 'stale'});
    });
  }
});

test('immutable read rejects a malformed content revision', async () => {
  const {fixture, descriptorHash, transport} = await setupFixture();
  fixture.files.get(binding.descriptorFileId).headRevisionId = 42;
  await assert.rejects(() => transport.readImmutable(
    {id: binding.descriptorFileId, sha256: descriptorHash}, {kind: 'descriptor'},
  ), {code: 'binding'});
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

test('server identity hook replaces about while binding the account to one marker', async () => {
  const fixture = purchasesHttpFixture();
  let marker = 'server-marker-a';
  const seen = [];
  const transport = createPurchaseTransport({binding, descriptorHash: 'a'.repeat(64),
    fetchImpl: fixture.fetch, getToken: async () => marker,
    getAccountId: async captured => {seen.push(captured); return binding.accountId;},
  });
  assert.equal(await transport.reserveId(), 'reserved-1');
  assert.deepEqual(seen, ['server-marker-a']);
  assert.equal(fixture.calls.filter(({url}) => url.includes('/drive/v3/about')).length, 0);

  const changed = createPurchaseTransport({binding, descriptorHash: 'a'.repeat(64),
    fetchImpl: fixture.fetch, getToken: async () => marker,
    getAccountId: async () => {marker = 'server-marker-b'; return binding.accountId;},
  });
  fixture.calls.length = 0;
  await assert.rejects(() => changed.reserveId(), {code: 'auth'});
  assert.equal(fixture.calls.length, 0);
  const foreign = createPurchaseTransport({binding, descriptorHash: 'a'.repeat(64),
    fetchImpl: fixture.fetch, getToken: async () => marker,
    getAccountId: async () => 'other-account',
  });
  await assert.rejects(() => foreign.reserveId(), {code: 'binding'});
  assert.equal(fixture.calls.length, 0);
});

test('transport reserves a validated unique group of file IDs in one request', async () => {
  const {fixture, transport} = await setupFixture();
  assert.deepEqual(await transport.reserveIds(5), [
    'reserved-1','reserved-2','reserved-3','reserved-4','reserved-5',
  ]);
  const requests = fixture.calls.filter(({url}) => url.includes('/drive/v3/files/generateIds'));
  assert.equal(requests.length, 1);
  assert.equal(new URL(requests[0].url).searchParams.get('count'), '5');
});

test('transport rejects malformed or duplicate generated IDs before use', async t => {
  for (const ids of [['same','same'], ['valid'], ['valid','bad id']]) {
    await t.test(JSON.stringify(ids), async () => {
      const {transport, fixture, descriptorHash} = await setupFixture();
      const malformed = createPurchaseTransport({
        binding, descriptorHash, getToken: async () => 'synthetic-token',
        fetchImpl: async (url, init) => url.includes('/drive/v3/files/generateIds')
          ? new Response(JSON.stringify({ids}), {status:200,headers:{'Content-Type':'application/json'}})
          : fixture.fetch(url, init),
      });
      await assert.rejects(() => malformed.reserveIds(2), {code: ids[1] === 'bad id' ? 'invalid' : ids.length === 1 ? 'invalid' : 'collision'});
    });
  }
  const {transport} = await setupFixture();
  await assert.rejects(() => transport.reserveIds(0), {code:'invalid'});
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

async function pointerCommerce(configRef, config, etag, partCount=1) {
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
  const parts = await Promise.all(Array.from({length: partCount}, async (_,index) => {
    const value = {version: 1, kind: 'basis-part', index, count: partCount, content: '{}'};
    return {ref: {id: index===0?'basis-part-a':`basis-part-${index}`, sha256: await digest(value)}, value};
  }));
  const manifest = {
    version: 1,
    kind: 'basis',
    datasetId: binding.datasetId,
    byteLength: 2,
    ledgerHash: '2'.repeat(64),
    parts: parts.map(({ref}) => ref),
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
    pointerProperties: {
      app: 'vokabeltrainer-purchases',
      kind: 'coordinator',
      datasetId: binding.datasetId,
      descriptorFileId: binding.descriptorFileId,
      descriptorHash: config.descriptorHash,
      coordinatorId: config.coordinatorId,
      contentFolderId: config.contentFolderId,
      purchaseHeadId: candidate.id,
      purchaseHeadSha256: candidate.sha256,
    },
    uploads: [
      {ref: candidate, value: receipt},
      {ref: basisRef, value: manifest},
      ...parts,
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
      control: null,
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

test('purchase pointer sends the exact persisted property body instead of reconstructing it from a caller snapshot', async () => {
  const {fixture, transport, coordinator, prepared} = await configuredPointerCase();
  prepared.attempt.pointerProperties.foreign = 'persisted-before-send';
  const callerSnapshot = structuredClone(coordinator);
  callerSnapshot.properties.foreign = 'changed-in-caller';
  await transport.putPointer({
    snapshot: callerSnapshot,
    head: prepared.candidate,
    headValue: prepared.receipt,
    authorization: {
      kind: 'attempt', commerce: prepared.commerce,
      operationId: 'purchase-a', attemptId: 'attempt-a',
    },
  });
  const body = JSON.parse(fixture.calls.filter(({method}) => method === 'PUT').at(-1).body);
  const properties = Object.fromEntries(body.properties.map(({key,value}) => [key,value]));
  assert.equal(properties.foreign, 'persisted-before-send');
  assert.equal(properties.purchaseHeadId, prepared.candidate.id);
});

async function initializationControl(confirmed,coordinator,{coordinatorId=confirmed.coordinatorId}={}) {
  const part={version:1,kind:'basis-part',index:0,count:1,content:'{}'};
  const partRef={id:'control-part',sha256:await digest(part)};
  const manifest={version:1,kind:'basis',datasetId:binding.datasetId,byteLength:2,ledgerHash:'2'.repeat(64),parts:[partRef]};
  const basisRef={id:'control-basis',sha256:await digest(manifest)};
  const value={
    version:1,kind:'receipt',datasetId:binding.datasetId,coordinatorId,sequence:0,previous:null,
    operationId:'activation-a',operation:'initialize',epochId:'epoch-a',basis:basisRef,intent:null,
    economy:{version:1,kind:'economic-snapshot',source:null},
  };
  const candidate={id:'control-receipt',sha256:await digest(value)};
  const pointerProperties={...coordinator.properties,purchaseHeadId:candidate.id,purchaseHeadSha256:candidate.sha256};
  return {
    version:1,mode:'migrating',binding,configRef:confirmed.configRef,config:confirmed.config,head:null,
    cache:{version:1,head:null,values:[]},setup:confirmed,
    control:{
      version:1,operationId:'activation-a',operation:'initialize',phase:'pointer-pending',epochId:'epoch-a',
      head:null,etag:coordinator.etag,candidate,pointerProperties,
      uploads:[{ref:partRef,value:part},{ref:basisRef,value:manifest},{ref:candidate,value}],
    },
    jobs:[],selection:[],
  };
}

test('control uploads and pointer require the exact persisted operation and configured coordinator', async()=>{
  const {fixture,transport,descriptorHash}=await setupFixture();
  const saved=recorder();
  const setup=await prepareBootstrap({transport,binding,descriptorHash,operationId:'setup-a',persist:saved.persist});
  const confirmed=await resumeBootstrap({transport,setup,persist:saved.persist});
  const coordinator=await transport.readFolder({id:confirmed.coordinatorId,kind:'coordinator',config:confirmed.config});
  const commerce=await initializationControl(confirmed,coordinator);
  const receiptUpload=commerce.control.uploads.at(-1);
  await assert.rejects(()=>transport.writeImmutable({
    ...receiptUpload,kind:'content',config:commerce.config,
    authorization:{kind:'control',commerce,operationId:'different-operation'},
  }),{code:'binding'});
  const foreign=await initializationControl(confirmed,coordinator,{coordinatorId:'foreign-coordinator'});
  await assert.rejects(()=>transport.writeImmutable({
    ...foreign.control.uploads.at(-1),kind:'content',config:foreign.config,
    authorization:{kind:'control',commerce:foreign,operationId:'activation-a'},
  }),{code:'binding'});
  await transport.writeImmutable({
    ...receiptUpload,kind:'content',config:commerce.config,
    authorization:{kind:'control',commerce,operationId:'activation-a'},
  });
  await transport.putPointer({
    snapshot:coordinator,head:commerce.control.candidate,headValue:receiptUpload.value,
    authorization:{kind:'control',commerce,operationId:'activation-a'},
  });
  assert.equal(fixture.files.get(confirmed.coordinatorId).properties.purchaseHeadId,commerce.control.candidate.id);
});

async function configuredPointerCase(partCount=1) {
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
    prepared: await pointerCommerce(confirmed.configRef, confirmed.config, coordinator.etag, partCount),
  };
}

test('purchase head uses one fresh checked metadata response', async () => {
  const {fixture, transport, confirmed, coordinator} = await configuredPointerCase();
  fixture.calls.length = 0;
  const head = await transport.readPurchaseHead({id: confirmed.coordinatorId, config: confirmed.config});
  assert.deepEqual(head, coordinator);
  assert.equal(fixture.calls.filter(({url}) => url.includes(`/drive/v2/files/${confirmed.coordinatorId}`)).length, 1);
  fixture.files.get(confirmed.coordinatorId).properties.kind = 'other';
  await assert.rejects(() => transport.readPurchaseHead({id: confirmed.coordinatorId, config: confirmed.config}), {code: 'binding'});
});

test('one purchase context checks its installed config once across batch and pointer', async () => {
  const {fixture, transport, coordinator, prepared} = await configuredPointerCase();
  prepared.attempt.phase = 'reserved';
  fixture.calls.length = 0;
  const context = await transport.createPurchaseContext({commerce: prepared.commerce,
    operationId: 'purchase-a', attemptId: 'attempt-a'});
  assert.equal(fixture.calls.filter(({url}) => url.includes(`/drive/v2/files/${binding.folderId}`)).length, 2);
  assert.equal(fixture.calls.filter(({url}) => url.includes(`/drive/v2/files/${prepared.commerce.configRef.id}`)).length, 3);
  fixture.calls.length = 0;
  await transport.writeImmutableBatch(savedPurchaseBatch(prepared), context);
  assert.equal(fixture.calls.filter(({url}) => url.includes(`/drive/v2/files/${binding.folderId}`)).length, 0);
  assert.equal(fixture.calls.filter(({url}) => url.includes(`/drive/v2/files/${prepared.commerce.configRef.id}`)).length, 0);
  prepared.attempt.phase = 'pointer-pending';
  fixture.calls.length = 0;
  await transport.putPointer({snapshot: coordinator, head: prepared.candidate, headValue: prepared.receipt,
    authorization: {kind: 'attempt', commerce: prepared.commerce, operationId: 'purchase-a', attemptId: 'attempt-a'}}, context);
  assert.equal(fixture.calls.filter(({url}) => url.includes(`/drive/v2/files/${binding.folderId}`)).length, 0);
  assert.equal(fixture.calls.filter(({url}) => url.includes(`/drive/v2/files/${prepared.commerce.configRef.id}`)).length, 0);
  fixture.calls.length = 0;
  await assert.rejects(() => transport.writeImmutableBatch(savedPurchaseBatch(prepared), context), {code: 'binding'});
  assert.equal(fixture.calls.length, 0);
  transport.releasePurchaseContext(context);
  transport.releasePurchaseContext(context);
});

test('purchase context rejects foreign transport and changed marker before writes', async () => {
  const {fixture, descriptorHash, prepared, transport} = await configuredPointerCase();
  prepared.attempt.phase = 'reserved';
  const context = await transport.createPurchaseContext({commerce: prepared.commerce,
    operationId: 'purchase-a', attemptId: 'attempt-a'});
  const foreign = createPurchaseTransport({binding, descriptorHash,
    fetchImpl: fixture.fetch, getToken: async () => 'synthetic-token'});
  fixture.calls.length = 0;
  await assert.rejects(() => foreign.writeImmutableBatch(savedPurchaseBatch(prepared), context), {code: 'binding'});
  assert.equal(fixture.calls.length, 0);
  let marker = 'first';
  const changing = createPurchaseTransport({binding, descriptorHash,
    fetchImpl: fixture.fetch, getToken: async () => marker});
  const own = await changing.createPurchaseContext({commerce: prepared.commerce,
    operationId: 'purchase-a', attemptId: 'attempt-a'});
  marker = 'second';
  fixture.calls.length = 0;
  await assert.rejects(() => changing.writeImmutableBatch(savedPurchaseBatch(prepared), own), {code: 'auth'});
  assert.equal(fixture.calls.length, 0);
  marker = 'first';
  await assert.rejects(() => changing.writeImmutableBatch(savedPurchaseBatch(prepared), own), {code: 'binding'});
  assert.equal(fixture.calls.length, 0);
});

test('purchase context cannot authorize another saved attempt', async () => {
  const {fixture, transport, prepared} = await configuredPointerCase();
  prepared.attempt.phase = 'reserved';
  const context = await transport.createPurchaseContext({commerce: prepared.commerce,
    operationId: 'purchase-a', attemptId: 'attempt-a'});
  const other = structuredClone(prepared.commerce);
  other.jobs[0].attempts.push({...structuredClone(other.jobs[0].attempts[0]), attemptId: 'attempt-b'});
  const uploads = other.jobs[0].attempts.at(-1).uploads.map(upload => ({...upload,
    kind: 'content', config: other.config,
    authorization: {kind: 'attempt', commerce: other, operationId: 'purchase-a', attemptId: 'attempt-b'},
  }));
  fixture.calls.length = 0;
  await assert.rejects(() => transport.writeImmutableBatch(uploads, context), {code: 'binding'});
  assert.equal(fixture.calls.filter(({method}) => method === 'POST').length, 0);
  await assert.rejects(() => transport.writeImmutableBatch(savedPurchaseBatch(prepared), context), {code: 'binding'});
  assert.equal(fixture.calls.filter(({method}) => method === 'POST').length, 0);
});

test('a partially failed purchase batch consumes its ephemeral context', async () => {
  const {fixture, transport, prepared} = await configuredPointerCase();
  prepared.attempt.phase = 'reserved';
  const context = await transport.createPurchaseContext({commerce: prepared.commerce,
    operationId: 'purchase-a', attemptId: 'attempt-a'});
  fixture.loseCreateResponse();
  await assert.rejects(() => transport.writeImmutableBatch(savedPurchaseBatch(prepared), context), {code: 'network'});
  fixture.calls.length = 0;
  await assert.rejects(() => transport.writeImmutableBatch(savedPurchaseBatch(prepared), context), {code: 'binding'});
  assert.equal(fixture.calls.length, 0);
});

test('one reserved three-file purchase batch checks its installed config once while reading every upload', async () => {
  const single = await configuredPointerCase();
  const singleAuthorization = {
    kind: 'attempt', commerce: single.prepared.commerce,
    operationId: 'purchase-a', attemptId: 'attempt-a',
  };
  single.fixture.calls.length = 0;
  for (const upload of single.prepared.attempt.uploads) {
    await single.transport.writeImmutable({
      ...upload, kind: 'content', config: single.prepared.commerce.config,
      authorization: singleAuthorization,
    });
  }
  assert.equal(single.fixture.calls.length, 54);

  const {fixture, transport, prepared} = await configuredPointerCase();
  const authorization = {
    kind: 'attempt', commerce: prepared.commerce,
    operationId: 'purchase-a', attemptId: 'attempt-a',
  };
  const requests = prepared.attempt.uploads.map(upload => ({
    ...upload, kind: 'content', config: prepared.commerce.config, authorization,
  }));
  fixture.calls.length = 0;
  const values = await transport.writeImmutableBatch(requests);
  assert.deepEqual(values, requests.map(request => request.value));
  assert.equal(fixture.calls.length, 34);
  assert.equal(fixture.calls.filter(({url}) => url.includes('/drive/v3/about')).length, 17);
  assert.equal(fixture.calls.filter(({url}) => url.includes(`/drive/v2/files/${binding.folderId}`)).length, 2);
  assert.equal(fixture.calls.filter(({url}) => url.includes(`/drive/v2/files/${prepared.commerce.configRef.id}`)).length, 3);
  assert.equal(fixture.calls.filter(({method}) => method === 'POST').length, 3);
  for (const {ref} of requests) {
    assert.equal(fixture.calls.filter(({url}) => url.includes(`/drive/v2/files/${ref.id}`)).length, 3);
  }
});

function savedPurchaseBatch(prepared) {
  const authorization = {
    kind: 'attempt', commerce: prepared.commerce,
    operationId: 'purchase-a', attemptId: prepared.attempt.attemptId,
  };
  return prepared.attempt.uploads.map(upload => ({
    ...upload, kind: 'content', config: prepared.commerce.config, authorization,
  }));
}

test('one saved six-file purchase group uploads and verifies every distinct authorized file', async () => {
  const {fixture, transport, prepared} = await configuredPointerCase(4);
  const requests = savedPurchaseBatch(prepared);
  assert.equal(requests.length, 6);
  assert.equal(new Set(requests.map(({ref}) => ref.id)).size, 6);
  fixture.calls.length = 0;
  const values = await transport.writeImmutableBatch(requests);
  assert.deepEqual(values, requests.map(({value}) => value));
  assert.equal(fixture.calls.filter(({method}) => method === 'POST').length, 6);
  for (const {ref, value} of requests) assert.deepEqual(fixture.files.get(ref.id).value, value);
});

test('seven saved purchase files are rejected before any upload', async () => {
  const {fixture, transport, prepared} = await configuredPointerCase(5);
  const requests = savedPurchaseBatch(prepared);
  assert.equal(requests.length, 7);
  fixture.calls.length = 0;
  await assert.rejects(() => transport.writeImmutableBatch(requests), {code: 'limit'});
  assert.equal(fixture.calls.filter(({method}) => method === 'POST').length, 0);
});

test('a second batch and a new saved attempt recheck the installed anchor', async () => {
  const {fixture, transport, prepared} = await configuredPointerCase();
  fixture.calls.length = 0;
  await transport.writeImmutableBatch(savedPurchaseBatch(prepared));
  assert.equal(fixture.calls.length, 34);
  fixture.calls.length = 0;
  await transport.writeImmutableBatch(savedPurchaseBatch(prepared));
  assert.equal(fixture.calls.length, 34);
  assert.equal(fixture.calls.filter(({method}) => method === 'POST').length, 3);

  prepared.attempt = {...structuredClone(prepared.attempt), attemptId: 'attempt-b'};
  prepared.commerce.jobs[0].attempts.push(prepared.attempt);
  fixture.calls.length = 0;
  await transport.writeImmutableBatch(savedPurchaseBatch(prepared));
  assert.equal(fixture.calls.length, 34);

  fixture.files.get(binding.folderId).properties.purchaseConfigSha256 = 'f'.repeat(64);
  fixture.calls.length = 0;
  await assert.rejects(() => transport.writeImmutableBatch(savedPurchaseBatch(prepared)), {code: 'binding'});
  assert.equal(fixture.calls.filter(({method}) => method === 'POST').length, 0);
});

test('batch rejects foreign account, changed saved contents, and mismatched config before upload', async () => {
  const {fixture, transport, prepared} = await configuredPointerCase();
  const requests = savedPurchaseBatch(prepared);
  fixture.setAccountId('account-b');
  fixture.calls.length = 0;
  await assert.rejects(() => transport.writeImmutableBatch(requests), {code: 'binding'});
  assert.equal(fixture.calls.filter(({method}) => method === 'POST').length, 0);
  fixture.setAccountId(binding.accountId);

  const forged = structuredClone(requests);
  forged[1].value = {...forged[1].value, byteLength: 3};
  fixture.calls.length = 0;
  await assert.rejects(() => transport.writeImmutableBatch(forged), {code: 'binding'});
  assert.equal(fixture.calls.length, 0);

  const wrongConfig = structuredClone(requests);
  wrongConfig[2].config = {
    ...wrongConfig[2].config,
    contentFolderId: prepared.commerce.config.coordinatorId,
  };
  fixture.calls.length = 0;
  await assert.rejects(() => transport.writeImmutableBatch(wrongConfig), {code: 'binding'});
  assert.equal(fixture.calls.length, 0);
});

test('batch token change stops anchor reading and post-upload dependent reads', async () => {
  for (const changeAt of ['before-anchor', 'during-anchor', 'after-post']) {
    const {fixture, descriptorHash, prepared} = await configuredPointerCase();
    let token = 'first';
    let reads = 0;
    const transport = createPurchaseTransport({
      binding, descriptorHash,
      getToken: async () => {
        if (changeAt === 'before-anchor' && ++reads === 2) token = 'second';
        return token;
      },
      fetchImpl: async (url, init) => {
        const response = await fixture.fetch(url, init);
        if (changeAt === 'during-anchor' && url.includes(`/drive/v2/files/${binding.folderId}`)) token = 'second';
        if (changeAt === 'after-post' && init?.method === 'POST') token = 'second';
        return response;
      },
    });
    fixture.calls.length = 0;
    await assert.rejects(() => transport.writeImmutableBatch(savedPurchaseBatch(prepared)), {code: 'auth'});
    if (changeAt !== 'after-post') assert.equal(fixture.calls.filter(({method}) => method === 'POST').length, 0);
    if (changeAt === 'after-post') {
      for (const {ref} of prepared.attempt.uploads) {
        assert.equal(fixture.calls.filter(({url}) => url.includes(`/drive/v2/files/${ref.id}`)).length, 0);
      }
    }
  }
});

test('batch captures its runtime token before asynchronous upload validation', async () => {
  const {fixture, descriptorHash, prepared} = await configuredPointerCase();
  let token = 'first';
  const transport = createPurchaseTransport({
    binding, descriptorHash, getToken: async () => token, fetchImpl: fixture.fetch,
  });
  fixture.calls.length = 0;
  const batch = transport.writeImmutableBatch(savedPurchaseBatch(prepared));
  queueMicrotask(() => { token = 'second'; });
  await assert.rejects(batch, {code: 'auth'});
  assert.equal(fixture.calls.filter(({method}) => method === 'POST').length, 0);
});

test('batch snapshots requested files before an asynchronous token lookup settles', async () => {
  const {fixture, descriptorHash, prepared} = await configuredPointerCase();
  const requests = savedPurchaseBatch(prepared);
  const original = structuredClone(requests[1]);
  let releaseToken;
  let first = true;
  const transport = createPurchaseTransport({
    binding, descriptorHash, fetchImpl: fixture.fetch,
    getToken: () => {
      if (!first) return 'first';
      first = false;
      return new Promise(resolve => { releaseToken = resolve; });
    },
  });
  const batch = transport.writeImmutableBatch(requests);
  requests[1].ref = {id: 'foreign-file', sha256: 'f'.repeat(64)};
  requests[1].value = {version: 1, kind: 'foreign'};
  releaseToken('first');
  await batch;
  assert.deepEqual(fixture.files.get(original.ref.id).value, original.value);
  assert.equal(fixture.files.has('foreign-file'), false);
});

test('server session marker may survive same-account refresh but stops a resumed session during batch', async () => {
  for (const restartSession of [false, true]) {
    const {fixture, descriptorHash, prepared} = await configuredPointerCase();
    let auth;
    let rootReads = 0;
    const authFetch = async (url, init) => {
      if (url === '/api/auth/session') return Response.json({connected: true, accountId: binding.accountId});
      const driveUrl = `https://www.googleapis.com${url.slice('/api/drive'.length)}`;
      const response = await fixture.fetch(driveUrl, init);
      if (driveUrl.includes(`/drive/v2/files/${binding.folderId}`) && ++rootReads === 1) {
        if (restartSession) auth.clearLocal();
        await auth.resume();
      }
      return response;
    };
    auth = createServerAuth({fetchImpl: authFetch});
    await auth.resume();
    const transport = createPurchaseTransport({
      fetchImpl: auth.fetchDrive, getToken: auth.getToken, binding, descriptorHash,
    });
    fixture.calls.length = 0;
    if (restartSession) {
      await assert.rejects(() => transport.writeImmutableBatch(savedPurchaseBatch(prepared)), {code: 'auth'});
      assert.equal(fixture.calls.filter(({method}) => method === 'POST').length, 0);
    } else {
      await transport.writeImmutableBatch(savedPurchaseBatch(prepared));
      assert.equal(fixture.calls.length, 34);
    }
  }
});

test('purchase pointer checks its anchor again after an uploaded batch', async () => {
  const {fixture, transport, coordinator, prepared} = await configuredPointerCase();
  await transport.writeImmutableBatch(savedPurchaseBatch(prepared));
  fixture.files.get(binding.folderId).properties.purchaseConfigId = 'other-config';
  fixture.calls.length = 0;
  await assert.rejects(() => transport.putPointer({
    snapshot: coordinator,
    head: prepared.candidate,
    headValue: prepared.receipt,
    authorization: {
      kind: 'attempt', commerce: prepared.commerce,
      operationId: 'purchase-a', attemptId: 'attempt-a',
    },
  }), {code: 'binding'});
  assert.equal(fixture.calls.filter(({method}) => method === 'PUT').length, 0);
  assert.equal(fixture.calls.filter(({url}) => url.includes(`/drive/v2/files/${binding.folderId}`)).length, 2);
});

test('batch snapshots caller objects before anchor reads and rejects a divergent 409 body', async () => {
  const {fixture, descriptorHash, prepared} = await configuredPointerCase();
  const requests = savedPurchaseBatch(prepared);
  const original = structuredClone(requests[1]);
  let changed = false;
  const transport = createPurchaseTransport({
    binding, descriptorHash, getToken: async () => 'synthetic-token',
    fetchImpl: async (url, init) => {
      const response = await fixture.fetch(url, init);
      if (!changed && url.includes(`/drive/v2/files/${binding.folderId}`)) {
        changed = true;
        requests[1].ref = {id: 'foreign-file', sha256: 'f'.repeat(64)};
        requests[1].value = {version: 1, kind: 'foreign'};
        requests[1].config = {...requests[1].config, contentFolderId: 'foreign-folder'};
      }
      return response;
    },
  });
  await transport.writeImmutableBatch(requests);
  assert.deepEqual(fixture.files.get(original.ref.id).value, original.value);
  assert.equal(fixture.files.has('foreign-file'), false);

  fixture.files.get(original.ref.id).value = {changed: true};
  fixture.calls.length = 0;
  await assert.rejects(() => transport.writeImmutableBatch(savedPurchaseBatch(prepared)), {code: 'integrity'});
  assert.equal(fixture.calls.filter(({method}) => method === 'POST').length, 3);
});

test('batch waits for an already started read after another upload fails', async () => {
  const {fixture, descriptorHash, prepared} = await configuredPointerCase();
  let releaseRead;
  const readGate = new Promise(resolve => { releaseRead = resolve; });
  let signalRead;
  const readStarted = new Promise(resolve => { signalRead = resolve; });
  const transport = createPurchaseTransport({
    binding, descriptorHash, getToken: async () => 'synthetic-token',
    fetchImpl: async (url, init) => {
      if (init?.method === 'POST' && init.body.includes('"id":"basis-a","name"')) {
        return new Response('{}', {status: 500});
      }
      if (url.includes('/drive/v2/files/receipt-a?alt=media')) {
        signalRead();
        await readGate;
      }
      return fixture.fetch(url, init);
    },
  });
  let settled = false;
  const result = transport.writeImmutableBatch(savedPurchaseBatch(prepared)).then(
    () => { settled = true; return null; },
    error => { settled = true; return error; },
  );
  await readStarted;
  assert.equal(settled, false);
  releaseRead();
  const failure = await result;
  assert.equal(failure.code, 'retryable');
  assert.equal(fixture.files.has('receipt-a'), true);
  assert.equal(fixture.files.has('basis-part-a'), true);
});

test('a later failed slot waits for another six-file upload readback before settling', async () => {
  const {fixture, descriptorHash, prepared} = await configuredPointerCase(4);
  let releaseRead;
  const readGate = new Promise(resolve => { releaseRead = resolve; });
  let signalRead;
  const readStarted = new Promise(resolve => { signalRead = resolve; });
  const transport = createPurchaseTransport({
    binding, descriptorHash, getToken: async () => 'synthetic-token',
    fetchImpl: async (url, init) => {
      if (init?.method === 'POST' && init.body.includes('"id":"basis-part-2","name"')) {
        return new Response('{}', {status: 500});
      }
      if (url.includes('/drive/v2/files/basis-part-3?alt=media')) {
        signalRead();
        await readGate;
      }
      return fixture.fetch(url, init);
    },
  });
  let settled = false;
  const result = transport.writeImmutableBatch(savedPurchaseBatch(prepared)).then(
    () => { settled = true; return null; },
    error => { settled = true; return error; },
  );
  assert.equal(await Promise.race([readStarted.then(() => 'read'), result.then(() => 'settled')]), 'read');
  assert.equal(settled, false);
  releaseRead();
  const failure = await result;
  assert.equal(failure.code, 'retryable');
  assert.equal(fixture.files.has('basis-part-3'), true);
  assert.equal(fixture.files.has('basis-part-2'), false);
});

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
