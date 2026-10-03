import test from 'node:test';
import assert from 'node:assert/strict';
import {createGoogleFixture} from '../browser/google-fixture.mjs';
import {createDriveClient} from '../../src/drive/client.js';
import {createCommands, productStateHash} from '../../src/trainer/commands.js';
import {createProductSync} from '../../src/trainer/sync/drive.js';
import {createCommerceIntegration} from '../../src/trainer/purchases/integration.js';
import {createPurchaseTransport} from '../../src/trainer/purchases/transport.js';
import {createPurchaseService} from '../../src/trainer/purchases/service.js';
import {createRestoreService} from '../../src/trainer/backup/restore.js';
import {exportBackup} from '../../src/trainer/backup/format.js';
import {digest} from '../../src/trainer/model/canonical.js';
import {project} from '../../src/trainer/learning/progress.js';
import {earnedLedger, rebindLedger} from './purchases-fixtures.js';
import {createFixture} from './fixtures.js';
import {memoryStore, productState, sequenceIds} from './backup-fixtures.js';

const now = () => new Date('2026-10-03T10:00:00.000Z');

// Real sync, commerce replay and transports; only the Google HTTP boundary is synthetic.
async function adoptionFixture() {
  const google = createGoogleFixture(), routes = new Map(), requests = [];
  await google.attach({async exposeFunction() {}, async route(pattern, handler) {routes.set(pattern, handler);}});
  const handler = routes.get('https://www.googleapis.com/**');
  let failure = null, afterRead = null;
  const fetchImpl = async (url, init = {}) => {
    const parsed = new URL(url);
    assert.equal(parsed.origin, 'https://www.googleapis.com', 'real network is forbidden');
    const row = {id: parsed.pathname.split('/').at(-1), method: init.method ?? 'GET',
      media: parsed.searchParams.get('alt') === 'media', path: parsed.pathname};
    requests.push(row);
    if (failure?.(row)) throw new Error('synthetic network failure');
    let response;
    const body = typeof init.body === 'string' ? init.body : undefined;
    await handler({
      request: () => ({url: () => parsed.href, method: () => row.method,
        headers: () => Object.fromEntries(new Headers(init.headers).entries()),
        postData: () => body, postDataJSON: () => JSON.parse(body)}),
      fulfill: async ({status = 200, headers, body}) => {response = new Response(body, {status, headers});},
      abort: async () => {throw new Error('synthetic abort');},
    });
    if (afterRead) await afterRead(row);
    return response;
  };
  const getToken = async () => 'synthetic-browser-token-1';
  const drive = createDriveClient({fetchImpl, getToken});
  const transportFor = input => createPurchaseTransport({fetchImpl, getToken, ...input});
  async function device(ledger, prefix) {
    const store = memoryStore(productState(ledger, {deviceId: prefix}));
    const commands = await createCommands({store, now, id: sequenceIds(`${prefix}-cmd`), deviceId: prefix, onChange() {}});
    let sync;
    const commerce = createCommerceIntegration({commands, drive, transportFor,
      learningSync: () => sync.syncLearning(), now, id: sequenceIds(`${prefix}-commerce`)});
    sync = createProductSync({drive, store, commands, commerce, now, id: sequenceIds(`${prefix}-sync`), onStatus() {}});
    return {store, commands, sync, commerce};
  }
  const remote = await device(earnedLedger(), 'adoption-remote');
  await remote.sync.createDataset('Synthetic adoption area');
  const bound = remote.commands.getState(), descriptorHash = await digest(bound.ledger.descriptor);
  const service = createPurchaseService({commands: remote.commands,
    transport: transportFor({binding: bound.binding, descriptorHash}), sync: remote.commerce,
    now, id: sequenceIds('adoption-purchase'), onStatus() {}});
  const activation = await service.prepareActivation({binding: bound.binding, descriptorHash});
  assert.equal((await service.confirmActivation(activation.operationId)).phase, 'confirmed');
  await remote.sync.sync();
  const local = await device(rebindLedger(createFixture().base, {datasetId: 'local', epochId: 'local-root'}), 'adoption-local');
  const [selection] = await local.sync.discover();
  requests.length = 0;
  const preview = await local.sync.joinDataset(selection, 'preview');
  const previewRequests = requests.splice(0);
  const confirm = () => local.sync.joinDataset({...selection, previewId: preview.previewId,
    safetyCopyId: preview.safetyCopyId}, 'confirm');
  const restore = createRestoreService({commands: remote.commands, store: remote.store,
    sync: remote.sync, drive, commerce: () => service, now, id: sequenceIds('adoption-restore')});
  return {google, requests, previewRequests, remote, local, selection, preview, confirm, service, restore,
    setFailure: value => {failure = value;}, setAfterRead: value => {afterRead = value;},
    close() {local.sync.destroy(); remote.sync.destroy();}};
}

function assertReadOnly(h) {
  assert.ok(h.requests.every(row => row.method === 'GET'), 'staging must never write to Google');
  assert.equal(h.local.commands.getState().commerce.jobs.length, 0, 'staging must not create award claims');
  assert.deepEqual(h.google.unexpected, []);
}

function assertJoinedLearning(h) {
  const joined = h.local.commands.getState().ledger, remote = h.remote.commands.getState().ledger;
  for (const key of ['descriptor', 'events', 'epochs', 'snapshots']) assert.deepEqual(joined[key], remote[key], key);
  // Read-only discovery additionally records the v3 marker as historical provenance.
  assert.deepEqual(joined.historicalEpochs.map(row => row.id).sort(), ['adoption-remote-commerce-2', 'e0']);
}

test('adoption confirmation reuses verified immutable commerce history but freshly reads every learning file', async () => {
  const h = await adoptionFixture();
  try {
    const historyIds = new Set(h.google.files.keys());
    for (const [id, file] of h.google.files) if (file.metadata.appProperties?.app !== 'vokabeltrainer-purchases'
      || file.metadata.appProperties?.kind === 'config') historyIds.delete(id);
    const previewReads = h.previewRequests.filter(row => row.media && historyIds.has(row.id));
    assert.ok(previewReads.length > 0, 'preview verifies an actual commerce history');
    await h.confirm();
    const confirmReads = h.requests.filter(row => row.media && historyIds.has(row.id));
    assert.ok(confirmReads.length < previewReads.length,
      `confirmation reread ${confirmReads.length} immutable objects; preview read ${previewReads.length}`);
    const state = h.local.commands.getState();
    assertJoinedLearning(h);
    assert.deepEqual(state.commerce.head, h.remote.commands.getState().commerce.head);
    assert.equal(project(state.ledger).profiles.p1.points, 300);
    for (const known of state.knownFiles) assert.ok(h.requests.some(row => row.media && row.id === known.fileId),
      `known learning file ${known.fileId} must be freshly read`);
    assert.ok(h.requests.some(row => row.path.endsWith('/about')), 'account is fresh');
    assert.ok(h.requests.some(row => row.path === '/drive/v3/files'), 'listing is fresh');
    assert.ok(h.requests.some(row => row.media && row.id === state.commerce.configRef.id), 'config is fresh');
    assert.ok(h.requests.some(row => !row.media && row.id === state.commerce.config.coordinatorId), 'head is fresh');
    assertReadOnly(h);
  } finally {h.close();}
});

for (const change of ['learning event', 'reset']) test(`adoption refuses a stale preview after a remote ${change}`, async () => {
  const h = await adoptionFixture();
  try {
    if (change === 'learning event') {
      await h.remote.commands.revise({entityType: 'profile', entityId: 'remote-new-profile', expectedHeads: [],
        value: {name: 'Synthetic new profile', archived: false}});
      await h.remote.sync.sync();
    } else {
      const target = earnedLedger();
      target.events = target.events.filter(event => event.type !== 'answer.recorded' || event.payload.ordinal <= 10);
      const backup = await exportBackup(productState(target), now().toISOString());
      const preview = await h.restore.prepare(backup);
      await h.restore.confirm(preview.previewId);
    }
    h.requests.length = 0;
    const before = h.local.commands.getState();
    await assert.rejects(h.confirm(), {code: 'stale'});
    assert.deepEqual(h.local.commands.getState(), before);
    assertReadOnly(h);
  } finally {h.close();}
});

test('adoption accepts a new verified purchase on the unchanged learning ledger', async () => {
  const h = await adoptionFixture();
  try {
    const buy = await h.service.preview({profileId: 'p1', articleId: 'evolution:explorer-girl:2'});
    assert.equal((await h.service.confirm(buy)).status, 'confirmed');
    const remote = h.remote.commands.getState();
    h.requests.length = 0;
    await h.confirm();
    const joined = h.local.commands.getState();
    assertJoinedLearning(h);
    assert.deepEqual(joined.commerce.head, remote.commerce.head);
    const view = await h.local.commerce.reconcile({state: joined, binding: joined.binding,
      descriptorHash: await digest(joined.ledger.descriptor)});
    assert.deepEqual(view.commerce.head, remote.commerce.head);
    assertReadOnly(h);
  } finally {h.close();}
});

for (const change of ['altered', 'missing']) test(`adoption refuses a ${change} previously verified learning packet`, async () => {
  const h = await adoptionFixture();
  try {
    const [id, packet] = [...h.google.files].find(([, file]) => file.metadata.appProperties?.kind === 'packet');
    if (change === 'missing') h.google.files.delete(id);
    else packet.value.events[0].payload.value.name = 'Synthetic alteration with unchanged metadata version';
    const before = h.local.commands.getState();
    await assert.rejects(h.confirm(), {code: change === 'missing' ? 'missing' : 'collision'});
    assert.deepEqual(h.local.commands.getState(), before);
    assertReadOnly(h);
  } finally {h.close();}
});

test('adoption retries from an unmodified preview after a failed confirmation probe', async () => {
  const h = await adoptionFixture();
  try {
    // Reconcile has already changed its disposable staging state when the head read fails.
    const configId = h.remote.commands.getState().commerce.config.coordinatorId;
    h.setFailure(row => row.id === configId);
    const before = h.local.commands.getState();
    await assert.rejects(h.confirm(), {code: 'network'});
    assert.deepEqual(h.local.commands.getState(), before);
    h.setFailure(null); h.requests.length = 0;
    await h.confirm();
    assertJoinedLearning(h);
    assertReadOnly(h);
  } finally {h.close();}
});

for (const invalid of ['preview ID', 'safety ID', 'safety backup', 'local change']) test(`adoption checks ${invalid} before reusing the preview`, async () => {
  const h = await adoptionFixture();
  try {
    let confirm = h.confirm;
    if (invalid === 'preview ID') confirm = () => h.local.sync.joinDataset({...h.selection,
      previewId: 'wrong-preview', safetyCopyId: h.preview.safetyCopyId}, 'confirm');
    if (invalid === 'safety ID') confirm = () => h.local.sync.joinDataset({...h.selection,
      previewId: h.preview.previewId, safetyCopyId: 'wrong-safety'}, 'confirm');
    if (invalid === 'local change') await h.local.commands.revise({entityType: 'profile', entityId: 'local-extra',
      expectedHeads: [], value: {name: 'Synthetic local change', archived: false}});
    if (invalid === 'safety backup') {
      const state = h.local.commands.getState();
      state.safetyCopies.find(copy => copy.id === h.preview.safetyCopyId).verified = false;
      await h.local.commands.commitExternal(state, await productStateHash(h.local.commands.getState()));
    }
    const before = h.local.commands.getState();
    await assert.rejects(confirm(), error => ['stale', 'storage'].includes(error.code));
    assert.deepEqual(h.local.commands.getState(), before);
    assert.equal(h.requests.filter(row => row.path === '/drive/v3/files').length, 1,
      'only the required fresh root lookup may run before rejecting invalid approval');
    assertReadOnly(h);
  } finally {h.close();}
});

test('adoption preserves a local commit racing the final confirmation inspection', async () => {
  const h = await adoptionFixture();
  try {
    let changed = false;
    const coordinatorId = h.remote.commands.getState().commerce.config.coordinatorId;
    h.setAfterRead(async row => {
      if (changed || row.id !== coordinatorId) return;
      changed = true;
      await h.local.commands.revise({entityType: 'profile', entityId: 'local-race', expectedHeads: [],
        value: {name: 'Synthetic race', archived: false}});
    });
    await assert.rejects(h.confirm(), {code: 'stale'});
    assert.equal(h.local.commands.getState().binding, null);
    assert.equal(project(h.local.commands.getState().ledger).entities.profiles['local-race'].value.name, 'Synthetic race');
    assertReadOnly(h);
  } finally {h.close();}
});
