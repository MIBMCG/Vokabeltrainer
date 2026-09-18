import test from 'node:test';
import assert from 'node:assert/strict';

import {DriveError} from '../../src/drive/client.js';
import {createCommands} from '../../src/trainer/commands.js';
import {project} from '../../src/trainer/learning/progress.js';
import {buildPackets} from '../../src/trainer/sync/packets.js';
import {createProductSync} from '../../src/trainer/sync/drive.js';
import {createFixture} from './fixtures.js';

const VERSION = {format: 'vokabeltrainer-product', formatVersion: 1, ruleVersion: 1};

function sequenceIds(prefix = 'id') {
  let value = 0;
  return () => `${prefix}-${++value}`;
}

function memoryStore(initial) {
  let value = initial === null ? null : structuredClone(initial);
  return {
    async load() { return value === null ? null : structuredClone(value); },
    async save(next) { value = structuredClone(next); },
    snapshot() { return value === null ? null : structuredClone(value); },
  };
}

function productState(ledger, {deviceId = 'dev1', outbox = ledger.events.map(({id}) => id)} = {}) {
  return {
    storageVersion: 1,
    deviceId,
    clock: Math.max(0, ...ledger.events.map(({clock}) => clock), ...ledger.epochs.map(({clock}) => clock)),
    ledger: structuredClone(ledger),
    rounds: {},
    binding: null,
    outboxEventIds: [...outbox],
    pendingPackets: [],
    datasetSetup: null,
    packetIntegrity: [],
    knownFiles: [],
    quarantinedFiles: [],
    safetyCopies: [],
    restoreJobs: [],
    snapshotManifests: [],
    pinVerifier: null,
  };
}

function metadata({id, name, mimeType = 'application/json', parents = [], appProperties, version = '1'}) {
  return {id, name, mimeType, parents, appProperties, trashed: false, version};
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

class SyntheticDrive {
  constructor() {
    this.account = 'account-a';
    this.files = new Map();
    this.calls = [];
    this.createdPacketIds = [];
    this.loseNextUploadResponse = false;
    this.loseUploadKind = null;
    this.onRead = null;
    this.onMetadata = null;
    this.sequence = 0;
  }

  async accountId() { this.calls.push(['accountId']); return this.account; }
  async generateId() { const value = `drive-${++this.sequence}`; this.calls.push(['generateId', value]); return value; }

  async listFiles(query) {
    this.calls.push(['listFiles', query]);
    const parent = /'([A-Za-z0-9_-]+)' in parents/.exec(query)?.[1];
    const required = [...query.matchAll(/appProperties has \{ key='([^']+)' and value='([^']+)' \}/g)];
    return [...this.files.values()].map(({meta}) => meta).filter((entry) => (
      !entry.trashed
      && (!parent || entry.parents.includes(parent))
      && required.every(([, key, value]) => entry.appProperties[key] === value)
    )).map((entry) => structuredClone(entry));
  }

  async metadata(id) {
    this.calls.push(['metadata', id]);
    const file = this.files.get(id);
    if (!file) throw new DriveError('missing', 'synthetic missing', 404);
    if (this.onMetadata) {
      const replacement = await this.onMetadata(id, structuredClone(file.meta));
      if (replacement !== undefined) return replacement;
    }
    return structuredClone(file.meta);
  }

  async readJson(id) {
    this.calls.push(['readJson', id]);
    const file = this.files.get(id);
    if (!file) throw new DriveError('missing', 'synthetic missing', 404);
    if (this.onRead) await this.onRead(id);
    return structuredClone(file.value);
  }

  async createFolder({id, name, appProperties}) {
    this.calls.push(['createFolder', {id, name, appProperties}]);
    const existing = this.files.get(id);
    const meta = metadata({
      id, name, mimeType: 'application/vnd.google-apps.folder', parents: ['my-drive-root'], appProperties,
    });
    if (existing && !sameJson(existing.meta, meta)) throw new DriveError('conflict', 'synthetic conflict', 409);
    if (!existing) this.files.set(id, {meta, value: null});
    return structuredClone(meta);
  }

  async putJson(request) {
    this.calls.push(['putJson', structuredClone(request)]);
    const existing = this.files.get(request.id);
    if (existing && (!sameJson(existing.value, request.value)
      || existing.meta.name !== request.name
      || existing.meta.parents[0] !== request.parentId
      || !sameJson(existing.meta.appProperties, request.appProperties))) {
      throw new DriveError('conflict', 'synthetic conflict', 409);
    }
    if (!existing) {
      const meta = metadata({
        id: request.id, name: request.name, parents: [request.parentId],
        appProperties: structuredClone(request.appProperties),
      });
      this.files.set(request.id, {meta, value: structuredClone(request.value)});
      if (request.appProperties.kind === 'packet') this.createdPacketIds.push(request.id);
    }
    if (this.loseNextUploadResponse || this.loseUploadKind === request.appProperties.kind) {
      this.loseNextUploadResponse = false;
      this.loseUploadKind = null;
      throw new DriveError('network', 'synthetic lost response');
    }
    return structuredClone(this.files.get(request.id).meta);
  }

  addJson({id, name = `${id}.json`, parentId, appProperties, value, version = '1'}) {
    this.files.set(id, {
      meta: metadata({id, name, parents: [parentId], appProperties, version}),
      value: structuredClone(value),
    });
  }
}

async function makeCommands(state, {deviceId = state.deviceId, ids = sequenceIds(deviceId)} = {}) {
  return createCommands({
    store: memoryStore(state),
    now: () => new Date('2026-09-18T10:00:00.000Z'),
    id: ids,
    deviceId,
    onChange: () => {},
  });
}

async function setupSyntheticSync({drive = new SyntheticDrive(), ledger = createFixture().base, outbox} = {}) {
  const commands = await makeCommands(productState(ledger, {
    outbox: outbox ?? ledger.events.map(({id}) => id),
  }));
  const statuses = [];
  const sync = createProductSync({
    drive, store: {}, commands,
    now: () => new Date('2026-09-18T10:00:00.000Z'),
    id: sequenceIds('sync'),
    onStatus: (status) => statuses.push(status),
  });
  await sync.createDataset('Familienwortschatz');
  return {sync, drive, commands, statuses};
}

test('createDataset publishes the real root epoch and immutable descriptor before binding', async () => {
  const {drive, commands} = await setupSyntheticSync({outbox: []});
  const binding = commands.getState().binding;
  const rootFiles = [...drive.files.values()].filter(({meta}) => meta.appProperties.kind === 'epoch');

  assert.equal(rootFiles.length, 1);
  assert.deepEqual(rootFiles[0].value, commands.getState().ledger.epochs[0]);
  assert.equal(binding.datasetId, 'd1');
  assert.equal(drive.files.get(binding.descriptorFileId).value.rootEpochId, 'e0');
});

test('lost upload response retries the same file and counts one answer', async () => {
  const {sync, drive, commands} = await setupSyntheticSync({outbox: []});
  await commands.start({profileId: 'p1', mode: 'all', size: 10});
  const roundId = commands.getState().rounds.p1.id;
  await commands.submit({roundId, typed: 'dog'});
  drive.loseNextUploadResponse = true;

  await assert.rejects(sync.sync(), (error) => error.code === 'network');
  const pending = commands.getState().pendingPackets[0];
  const originalId = pending.driveFileId;
  await sync.retry();

  assert.equal(drive.createdPacketIds.filter((fileId) => fileId === originalId).length, 1);
  assert.equal(sync.getStatus().pendingCount, 0);
  assert.equal(project(commands.getState().ledger).profiles.p1.words.w1.correct, 1);
});

test('never imports changed content under a preallocated pending file ID', async () => {
  const {sync, drive, commands} = await setupSyntheticSync({outbox: []});
  await commands.start({profileId: 'p1', mode: 'all', size: 10});
  drive.loseNextUploadResponse = true;
  await assert.rejects(sync.sync(), (error) => error.code === 'network');
  const pending = commands.getState().pendingPackets[0];
  const f = createFixture();
  const foreign = f.event('preference.changed', {profileId: 'p1', animations: false}, {
    id: 'changed-under-pending-id', deviceId: 'dev2', clock: 200,
  });
  drive.files.get(pending.driveFileId).value = {
    ...pending.packet,
    events: [foreign],
  };
  drive.files.get(pending.driveFileId).meta.version = '2';

  await assert.rejects(sync.retry(), (error) => error.code === 'collision');
  assert.equal(commands.getState().ledger.events.some(({id}) => id === foreign.id), false);
  assert.equal(commands.getState().pendingPackets.length, 1);
});

test('two offline devices merge packets by event ID without double counting', async () => {
  const drive = new SyntheticDrive();
  const first = await setupSyntheticSync({drive});
  const secondStore = memoryStore(null);
  const secondCommands = await createCommands({
    store: secondStore, now: () => new Date('2026-09-18T10:00:00.000Z'),
    id: sequenceIds('second'), deviceId: 'dev2', onChange: () => {},
  });
  await secondCommands.setup({name: 'Leer', timeZone: 'Europe/Berlin'});
  const secondSync = createProductSync({
    drive, store: secondStore, commands: secondCommands,
    now: () => new Date('2026-09-18T10:00:00.000Z'), id: sequenceIds('sync2'), onStatus: () => {},
  });
  const [selection] = await secondSync.discover();
  await secondSync.joinDataset(selection, 'confirm');
  await secondSync.sync();
  await first.sync.sync();

  assert.equal(secondCommands.getState().ledger.events.length, first.commands.getState().ledger.events.length);
  assert.equal(new Set(secondCommands.getState().ledger.events.map(({id}) => id)).size,
    secondCommands.getState().ledger.events.length);
});

test('join rechecks local emptiness after a concurrent commit and preserves that local change', async () => {
  const drive = new SyntheticDrive();
  await setupSyntheticSync({drive, outbox: []});
  const store = memoryStore(null);
  const commands = await createCommands({
    store, now: () => new Date('2026-09-18T10:00:00.000Z'),
    id: sequenceIds('joining'), deviceId: 'joining-device', onChange: () => {},
  });
  await commands.setup({name: 'Lokal leer', timeZone: 'Europe/Berlin'});
  const sync = createProductSync({
    drive, store, commands, now: () => new Date('2026-09-18T10:00:00.000Z'),
    id: sequenceIds('joining-sync'), onStatus: () => {},
  });
  const [selection] = await sync.discover();
  const rootFileId = [...drive.files.values()]
    .find(({meta}) => meta.appProperties.kind === 'epoch').meta.id;
  drive.onRead = async (fileId) => {
    if (fileId !== rootFileId) return;
    drive.onRead = null;
    await commands.revise({
      entityType: 'profile', entityId: 'local-profile', expectedHeads: [],
      value: {name: 'Bleibt lokal', archived: false},
    });
  };

  await assert.rejects(sync.joinDataset(selection, 'confirm'), {code: 'not-ready'});
  assert.equal(project(commands.getState().ledger).entities.profiles['local-profile'].value.name, 'Bleibt lokal');
  assert.equal(commands.getState().binding, null);
  assert.ok(commands.getState().outboxEventIds.length > 0);
});

test('nonempty local collection requires the explicit Task 10 safety and preview IDs before joining', async () => {
  const drive = new SyntheticDrive();
  const remote = await setupSyntheticSync({drive, outbox: []});
  const localStore=memoryStore(productState(createFixture().base, {deviceId:'dev2',outbox:[]}));
  const localCommands=await createCommands({store:localStore,now:()=>new Date(),id:sequenceIds('local-command'),deviceId:'dev2',onChange:()=>{}});
  const localSync = createProductSync({
    drive, store: localStore, commands: localCommands, now: () => new Date(), id: sequenceIds('local'), onStatus: () => {},
  });
  const [selection] = await localSync.discover();
  const local = localCommands.getState();
  local.ledger.descriptor.datasetId = 'local-dataset';
  local.ledger.descriptor.rootEpochId = 'local-root';
  local.ledger.events = [];
  local.ledger.epochs = [{...local.ledger.epochs[0], id: 'local-root', datasetId: 'local-dataset'}];
  await localCommands.commitExternal(local, await import('../../src/trainer/commands.js').then(({productStateHash}) => productStateHash(localCommands.getState())));
  await localCommands.revise({entityType: 'profile', entityId: 'local-profile', expectedHeads: [], value: {name: 'Lokal', archived: false}});

  const preview = await localSync.joinDataset(selection, 'preview');
  assert.equal(preview.requiresSafetyCopy, true);
  await assert.rejects(localSync.joinDataset(selection, 'confirm'), (error) => error.code === 'not-ready');
  assert.equal(localCommands.getState().binding, null);
  assert.equal(remote.commands.getState().binding.datasetId, 'd1');
});

test('download CAS preserves a local change made while a remote packet is read', async () => {
  const {sync, drive, commands} = await setupSyntheticSync({outbox: []});
  const binding = commands.getState().binding;
  const f = createFixture();
  const remoteEvent = f.event('entity.revised', {
    entityType: 'profile', entityId: 'remote-profile', parents: [], value: {name: 'Remote', archived: false},
  }, {id: 'remote-profile-rev', deviceId: 'dev2', clock: 100});
  const [packet] = buildPackets({events: [remoteEvent], datasetId: 'd1', epochId: 'e0', id: () => 'remote-packet'});
  drive.addJson({
    id: 'remote-file', parentId: binding.folderId, value: packet,
    appProperties: {app: 'vokabeltrainer-product', kind: 'packet', datasetId: 'd1', epochId: 'e0', packetId: 'remote-packet'},
  });
  drive.onRead = async (fileId) => {
    if (fileId !== 'remote-file') return;
    drive.onRead = null;
    await commands.revise({
      entityType: 'profile', entityId: 'local-profile', expectedHeads: [], value: {name: 'Lokal', archived: false},
    });
  };

  await sync.sync();
  const profileIds = Object.keys(project(commands.getState().ledger).entities.profiles).sort();
  assert.deepEqual(profileIds, ['local-profile', 'p1', 'remote-profile']);
});

test('dependency quarantine recovers when a later packet supplies its parent', async () => {
  const {sync, drive, commands} = await setupSyntheticSync({outbox: []});
  const binding = commands.getState().binding;
  const f = createFixture();
  const parent = f.event('entity.revised', {
    entityType: 'word', entityId: 'w1', parents: ['rev-w1'],
    value: {lessonId: 'l1', german: 'Hund!', hint: '', answers: ['dog'], archived: false, learningId: 'learn-parent'},
  }, {id: 'word-parent', deviceId: 'dev2', clock: 100});
  const child = f.event('entity.revised', {
    entityType: 'word', entityId: 'w1', parents: ['word-parent'],
    value: {lessonId: 'l1', german: 'Hund!!', hint: '', answers: ['dog'], archived: false, learningId: 'learn-child'},
  }, {id: 'word-child', deviceId: 'dev2', clock: 101});
  const addPacket = (fileId, packetId, event) => drive.addJson({
    id: fileId, parentId: binding.folderId,
    appProperties: {app: 'vokabeltrainer-product', kind: 'packet', datasetId: 'd1', epochId: 'e0', packetId},
    value: buildPackets({events: [event], datasetId: 'd1', epochId: 'e0', id: () => packetId})[0],
  });
  addPacket('child-file', 'child-packet', child);

  await assert.rejects(sync.sync(), (error) => error.code === 'reference');
  assert.equal(commands.getState().quarantinedFiles.length, 1);
  addPacket('parent-file', 'parent-packet', parent);
  await sync.retry();

  assert.equal(commands.getState().quarantinedFiles.length, 0);
  assert.equal(commands.getState().ledger.events.some(({id}) => id === 'word-child'), true);
});

test('duplicate unresolved packet stays mergeable after its dependency arrives and the session restarts', async () => {
  const {sync, drive, commands} = await setupSyntheticSync({outbox: []});
  const binding = commands.getState().binding;
  const f = createFixture();
  const parent = f.event('entity.revised', {
    entityType: 'word', entityId: 'w1', parents: ['rev-w1'],
    value: {lessonId: 'l1', german: 'Hund!', hint: '', answers: ['dog'], archived: false, learningId: 'duplicate-parent'},
  }, {id: 'duplicate-parent-event', deviceId: 'dev2', clock: 100});
  const child = f.event('entity.revised', {
    entityType: 'word', entityId: 'w1', parents: ['duplicate-parent-event'],
    value: {lessonId: 'l1', german: 'Hund!!', hint: '', answers: ['dog'], archived: false, learningId: 'duplicate-child'},
  }, {id: 'duplicate-child-event', deviceId: 'dev2', clock: 101});
  const childPacket = buildPackets({
    events: [child], datasetId: 'd1', epochId: 'e0', id: () => 'duplicate-child-packet',
  })[0];
  const childProperties = {
    app: 'vokabeltrainer-product', kind: 'packet', datasetId: 'd1',
    epochId: 'e0', packetId: 'duplicate-child-packet',
  };
  drive.addJson({id: 'duplicate-child-a', parentId: binding.folderId, appProperties: childProperties, value: childPacket});
  drive.addJson({id: 'duplicate-child-b', parentId: binding.folderId, appProperties: childProperties, value: childPacket});

  await assert.rejects(sync.sync(), {code: 'reference'});
  assert.equal(commands.getState().packetIntegrity.some(({packetId}) => packetId === 'duplicate-child-packet'), false);
  drive.addJson({
    id: 'duplicate-parent-file', parentId: binding.folderId,
    appProperties: {
      app: 'vokabeltrainer-product', kind: 'packet', datasetId: 'd1',
      epochId: 'e0', packetId: 'duplicate-parent-packet',
    },
    value: buildPackets({events: [parent], datasetId: 'd1', epochId: 'e0', id: () => 'duplicate-parent-packet'})[0],
  });
  sync.destroy();

  const reloadedStore = memoryStore(commands.getState());
  const reloadedCommands = await createCommands({
    store: reloadedStore, now: () => new Date('2026-09-18T10:01:00.000Z'),
    id: sequenceIds('reloaded'), deviceId: 'dev1', onChange: () => {},
  });
  const reloadedSync = createProductSync({
    drive, store: reloadedStore, commands: reloadedCommands,
    now: () => new Date('2026-09-18T10:01:00.000Z'), id: sequenceIds('reloaded-sync'), onStatus: () => {},
  });

  await reloadedSync.sync();
  assert.equal(reloadedCommands.getState().ledger.events.some(({id}) => id === 'duplicate-child-event'), true);
  assert.equal(reloadedSync.getStatus().phase, 'synced');
  reloadedSync.destroy();
});

test('changed known content and missing known files remain visible without deleting history', async () => {
  const {sync, drive, commands} = await setupSyntheticSync({outbox: []});
  const binding = commands.getState().binding;
  const f = createFixture();
  const event = f.event('preference.changed', {profileId: 'p1', animations: false}, {id: 'remote-pref', deviceId: 'dev2', clock: 100});
  const [packet] = buildPackets({events: [event], datasetId: 'd1', epochId: 'e0', id: () => 'known-packet'});
  drive.addJson({
    id: 'known-file', parentId: binding.folderId, value: packet,
    appProperties: {app: 'vokabeltrainer-product', kind: 'packet', datasetId: 'd1', epochId: 'e0', packetId: 'known-packet'},
  });
  await sync.sync();
  const count = commands.getState().ledger.events.length;

  drive.files.get('known-file').value.events[0].payload.animations = true;
  drive.files.get('known-file').meta.version = '2';
  await assert.rejects(sync.sync(), (error) => error.code === 'collision');
  assert.equal(commands.getState().ledger.events.length, count);
  drive.files.delete('known-file');
  await assert.rejects(sync.retry(), (error) => error.code === 'missing');
  assert.equal(commands.getState().ledger.events.length, count);
});

test('does not cache a post-read version when the pre-read metadata had no version', async () => {
  const {sync, drive, commands} = await setupSyntheticSync({outbox: []});
  const binding = commands.getState().binding;
  const f = createFixture();
  const firstEvent = f.event('preference.changed', {profileId: 'p1', animations: false}, {
    id: 'version-old', deviceId: 'dev2', clock: 100,
  });
  const secondEvent = f.event('preference.changed', {profileId: 'p1', animations: true}, {
    id: 'version-new', deviceId: 'dev2', clock: 101,
  });
  const [firstPacket] = buildPackets({events: [firstEvent], datasetId: 'd1', epochId: 'e0', id: () => 'version-packet'});
  const [secondPacket] = buildPackets({events: [secondEvent], datasetId: 'd1', epochId: 'e0', id: () => 'version-packet'});
  drive.addJson({
    id: 'version-file', parentId: binding.folderId, value: firstPacket,
    appProperties: {app: 'vokabeltrainer-product', kind: 'packet', datasetId: 'd1', epochId: 'e0', packetId: 'version-packet'},
  });
  let metadataReads = 0;
  drive.onMetadata = async (fileId, meta) => {
    if (fileId !== 'version-file') return undefined;
    metadataReads += 1;
    if (metadataReads === 1) {
      const withoutVersion = structuredClone(meta);
      delete withoutVersion.version;
      return withoutVersion;
    }
    if (metadataReads === 2) {
      drive.files.get(fileId).value = structuredClone(secondPacket);
      drive.files.get(fileId).meta.version = '2';
      return structuredClone(drive.files.get(fileId).meta);
    }
    return undefined;
  };

  await sync.sync();
  drive.onMetadata = null;
  await assert.rejects(sync.sync(), {code: 'collision'});
  assert.equal(commands.getState().ledger.events.some(({id}) => id === 'version-new'), false);
});

test('transient cached-file metadata failure is not quarantined and an old transport quarantine clears', async () => {
  const {sync, drive, commands} = await setupSyntheticSync({outbox: []});
  const binding = commands.getState().binding;
  const f = createFixture();
  const event = f.event('preference.changed', {profileId: 'p1', animations: false}, {
    id: 'cached-event', deviceId: 'dev2', clock: 100,
  });
  const [packet] = buildPackets({events: [event], datasetId: 'd1', epochId: 'e0', id: () => 'cached-packet'});
  drive.addJson({
    id: 'cached-file', parentId: binding.folderId, value: packet,
    appProperties: {app: 'vokabeltrainer-product', kind: 'packet', datasetId: 'd1', epochId: 'e0', packetId: 'cached-packet'},
  });
  await sync.sync();
  let failed = false;
  drive.onMetadata = async (fileId) => {
    if (fileId === 'cached-file' && !failed) {
      failed = true;
      throw new DriveError('network', 'temporary');
    }
    return undefined;
  };
  await assert.rejects(sync.sync(), {code: 'network'});
  assert.equal(commands.getState().quarantinedFiles.some(({fileId}) => fileId === 'cached-file'), false);

  drive.onMetadata = null;
  const before = commands.getState();
  const withLegacyTransportQuarantine = structuredClone(before);
  withLegacyTransportQuarantine.quarantinedFiles.push({
    fileId: 'cached-file', code: 'network', message: 'Altbestand', value: null,
  });
  const {productStateHash} = await import('../../src/trainer/commands.js');
  await commands.commitExternal(withLegacyTransportQuarantine, await productStateHash(before));
  await sync.retry();
  assert.equal(commands.getState().quarantinedFiles.some(({fileId}) => fileId === 'cached-file'), false);
});

test('rejects the same logical packet ID with different contents across sync runs', async () => {
  const {sync, drive, commands} = await setupSyntheticSync({outbox: []});
  const binding = commands.getState().binding;
  const f = createFixture();
  const first = f.event('preference.changed', {profileId: 'p1', animations: false}, {id: 'packet-a', deviceId: 'dev2', clock: 100});
  const second = f.event('preference.changed', {profileId: 'p1', animations: true}, {id: 'packet-b', deviceId: 'dev2', clock: 101});
  const make = (event) => buildPackets({events: [event], datasetId: 'd1', epochId: 'e0', id: () => 'shared-packet'})[0];
  const appProperties = {app: 'vokabeltrainer-product', kind: 'packet', datasetId: 'd1', epochId: 'e0', packetId: 'shared-packet'};
  drive.addJson({id: 'shared-a', parentId: binding.folderId, appProperties, value: make(first)});
  await sync.sync();
  drive.addJson({id: 'shared-b', parentId: binding.folderId, appProperties, value: make(second)});

  await assert.rejects(sync.sync(), {code: 'collision'});
  assert.equal(commands.getState().ledger.events.some(({id}) => id === 'packet-b'), false);
});

test('interrupted initial publication resumes the persisted setup IDs without a second folder', async () => {
  const drive = new SyntheticDrive();
  const commands = await makeCommands(productState(createFixture().base, {outbox: []}));
  const statuses = [];
  const sync = createProductSync({
    drive, store: {}, commands, now: () => new Date('2026-09-18T10:00:00.000Z'),
    id: sequenceIds('setup'), onStatus: (value) => statuses.push(value),
  });
  drive.loseUploadKind = 'dataset';
  await assert.rejects(sync.createDataset('Familienwortschatz'), {code: 'network'});
  const interrupted = commands.getState().datasetSetup;
  assert.ok(interrupted);
  assert.equal((await sync.discover()).length, 1);

  await sync.retry();
  assert.equal(commands.getState().datasetSetup, null);
  assert.equal(commands.getState().binding.folderId, interrupted.folderId);
  assert.equal([...drive.files.values()].filter(({meta}) => meta.appProperties.kind === 'dataset-folder').length, 1);
  assert.equal((await sync.discover()).length, 1);
});

test('local commits immediately invalidate synced status and notify the consumer', async () => {
  const {sync, commands, statuses} = await setupSyntheticSync({outbox: []});
  assert.equal(sync.getStatus().phase, 'synced');
  const beforeNotifications = statuses.length;

  await commands.revise({
    entityType: 'profile', entityId: 'p1', expectedHeads: ['rev-p1'],
    value: {name: 'Ada lokal', archived: false},
  });

  assert.equal(sync.getStatus().phase, 'pending');
  assert.equal(sync.getStatus().pendingCount, 1);
  assert.ok(statuses.length > beforeNotifications);
  assert.equal(statuses.at(-1).phase, 'pending');

  sync.destroy();
  const afterDestroy = statuses.length;
  await commands.setAnimations({profileId: 'p1', animations: false});
  assert.equal(statuses.length, afterDestroy);
});

test('pending counters do not hide connect or error until an explicit sync operation starts', async () => {
  for (const [code, expectedPhase] of [['auth', 'connect'], ['permission', 'error']]) {
    const {sync, drive, commands, statuses} = await setupSyntheticSync({outbox: []});
    await commands.revise({
      entityType: 'profile', entityId: 'p1', expectedHeads: ['rev-p1'],
      value: {name: `Ada ${code}`, archived: false},
    });
    drive.accountId = async () => { throw new DriveError(code, `synthetic ${code}`, code === 'auth' ? 401 : 403); };

    await assert.rejects(sync.sync(), {code});
    assert.equal(sync.getStatus().phase, expectedPhase);
    assert.equal(sync.getStatus().pendingCount, 1);
    await commands.setAnimations({profileId: 'p1', animations: false});
    assert.equal(statuses.at(-1).phase, expectedPhase);
    assert.equal(statuses.at(-1).pendingCount, 2);
    drive.accountId = async () => 'account-a';
    await sync.retry();
    assert.equal(sync.getStatus().phase, 'synced');
    assert.equal(sync.getStatus().pendingCount, 0);
    sync.destroy();
  }
});

test('unbound discovery and interrupted setup retain actionable auth status after local commits', async () => {
  for (const interruptedSetup of [false, true]) {
    const drive = new SyntheticDrive();
    const commands = await makeCommands(productState(createFixture().base, {outbox: []}));
    const statuses = [];
    const sync = createProductSync({
      drive, store: {}, commands, now: () => new Date('2026-09-18T10:00:00.000Z'),
      id: sequenceIds(interruptedSetup ? 'setup-auth' : 'discover-auth'),
      onStatus: (status) => statuses.push(status),
    });
    if (interruptedSetup) {
      drive.loseUploadKind = 'dataset';
      await assert.rejects(sync.createDataset('Familienwortschatz'), {code: 'network'});
      assert.ok(commands.getState().datasetSetup);
    }
    drive.accountId = async () => { throw new DriveError('auth', 'synthetic auth', 401); };
    await assert.rejects(interruptedSetup ? sync.retry() : sync.discover(), {code: 'auth'});
    assert.equal(sync.getStatus().phase, 'connect');

    await commands.setAnimations({profileId: 'p1', animations: false});
    assert.equal(statuses.at(-1).phase, 'connect');
    assert.equal(sync.getStatus().phase, 'connect');
    sync.destroy();
  }
});

test('uploads independent local packets before reporting a malformed remote packet', async () => {
  const {sync, drive, commands} = await setupSyntheticSync({outbox: []});
  const binding = commands.getState().binding;
  await commands.revise({
    entityType: 'profile', entityId: 'p1', expectedHeads: ['rev-p1'],
    value: {name: 'Ada lokal', archived: false},
  });
  const broken = {...VERSION, kind: 'packet', datasetId: 'd1', epochId: 'e0', packetId: 'broken-independent', events: 'wrong'};
  drive.addJson({
    id: 'broken-independent-file', parentId: binding.folderId, value: broken,
    appProperties: {app: 'vokabeltrainer-product', kind: 'packet', datasetId: 'd1', epochId: 'e0', packetId: 'broken-independent'},
  });

  await assert.rejects(sync.sync(), {code: 'invalid'});
  assert.equal(commands.getState().outboxEventIds.length, 0);
  assert.equal(commands.getState().pendingPackets.length, 0);
  assert.ok(drive.createdPacketIds.length > 0);
  assert.equal(sync.getStatus().phase, 'error');
});

test('quarantines a broken packet with its inspectable synthetic value', async () => {
  const {sync, drive, commands} = await setupSyntheticSync({outbox: []});
  const binding = commands.getState().binding;
  const broken = {...VERSION, kind: 'packet', datasetId: 'd1', epochId: 'e0', packetId: 'broken', events: 'wrong'};
  drive.addJson({
    id: 'broken-file', parentId: binding.folderId, value: broken,
    appProperties: {app: 'vokabeltrainer-product', kind: 'packet', datasetId: 'd1', epochId: 'e0', packetId: 'broken'},
  });

  await assert.rejects(sync.sync(), (error) => error.code === 'invalid');
  const quarantine = commands.getState().quarantinedFiles.find(({fileId}) => fileId === 'broken-file');
  assert.deepEqual(quarantine.value, broken);
  assert.equal(sync.getStatus().phase, 'error');
});

test('wrong account, foreign pending data, 401 and 403 stop safely with truthful status', async () => {
  const fixture = await setupSyntheticSync({outbox: []});
  fixture.drive.account = 'account-b';
  await assert.rejects(fixture.sync.sync(), (error) => error.code === 'binding');
  assert.equal(fixture.sync.getStatus().phase, 'error');

  fixture.drive.account = 'account-a';
  fixture.drive.accountId = async () => { throw new DriveError('auth', 'renew', 401); };
  await assert.rejects(fixture.sync.retry(), (error) => error.code === 'auth');
  assert.equal(fixture.sync.getStatus().phase, 'connect');
  assert.equal(fixture.statuses.at(-1).phase, 'connect');

  fixture.drive.accountId = async () => { throw new DriveError('permission', 'denied', 403); };
  await assert.rejects(fixture.sync.retry(), (error) => error.code === 'permission');
  assert.equal(fixture.sync.getStatus().phase, 'error');
});

test('pending packets are never uploaded into a different binding', async () => {
  const {sync, commands, drive} = await setupSyntheticSync({outbox: []});
  const before = commands.getState();
  const event = before.ledger.events[0];
  const foreignPacket = buildPackets({events: [{...event, datasetId: 'foreign'}], datasetId: 'foreign', epochId: 'e0', id: () => 'foreign-packet'})[0];
  const next = structuredClone(before);
  next.pendingPackets.push({packet: foreignPacket, driveFileId: null, confirmed: false});
  const {productStateHash} = await import('../../src/trainer/commands.js');
  await commands.commitExternal(next, await productStateHash(before));
  const uploads = drive.calls.filter(([name]) => name === 'putJson').length;

  await assert.rejects(sync.sync(), (error) => error.code === 'binding');
  assert.equal(drive.calls.filter(([name]) => name === 'putJson').length, uploads);
  assert.equal(commands.getState().pendingPackets.length, 1);
});
