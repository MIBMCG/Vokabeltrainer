import test from 'node:test';
import assert from 'node:assert/strict';

import {DriveError} from '../../src/drive/client.js';
import {createCommands, productStateHash} from '../../src/trainer/commands.js';
import {project} from '../../src/trainer/learning/progress.js';
import {buildPackets} from '../../src/trainer/sync/packets.js';
import {createProductSync} from '../../src/trainer/sync/drive.js';
import {createFixture} from './fixtures.js';
import {projectSchedule} from '../../src/trainer/learning/schedule.js';
import {DEFAULT_POLICY} from '../../src/trainer/model/policies.js';
import {buildPackets as oldPackets} from '../compat/v1/src/trainer/sync/packets.js';
import {createCommerceIntegration} from '../../src/trainer/purchases/integration.js';
import {emptyCommerce} from '../../src/trainer/purchases/schema.js';
import {digest} from '../../src/trainer/model/canonical.js';
import {planSnapshotUploads, uploadVerified} from '../../src/trainer/backup/transport.js';
import {exportBackup} from '../../src/trainer/backup/format.js';
import {resolveEpochs} from '../../src/trainer/model/epochs.js';
import {syncStatusLabel} from '../../src/trainer/ui/status.js';

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

async function setupSyntheticSync({drive = new SyntheticDrive(), ledger = createFixture().base, outbox, commerce = null} = {}) {
  const commands = await makeCommands(productState(ledger, {
    outbox: outbox ?? ledger.events.map(({id}) => id),
  }));
  const statuses = [];
  const sync = createProductSync({
    drive, store: {}, commands,
    now: () => new Date('2026-09-18T10:00:00.000Z'),
    id: sequenceIds('sync'),
    onStatus: (status) => statuses.push(status),
    commerce,
  });
  await sync.createDataset('Familienwortschatz');
  return {sync, drive, commands, statuses};
}

async function addRemoteSnapshot(drive, binding, ledger) {
  const backup = await exportBackup({ledger, safetyCopies: []}, '2026-09-18T10:00:00.000Z');
  const uploads = await planSnapshotUploads(backup, 'safety', drive);
  for (const upload of uploads) drive.addJson({
    id: upload.fileId, parentId: binding.folderId, value: upload.value,
    appProperties: {
      app: 'vokabeltrainer-product', kind: upload.kind, datasetId: binding.datasetId,
      snapshotId: upload.value.snapshotId,
    },
  });
  return uploads;
}

function listManifestBeforePart(drive, uploads) {
  const manifestId = uploads.at(-1).fileId;
  const partId = uploads[0].fileId;
  const manifest = drive.files.get(manifestId);
  const part = drive.files.get(partId);
  drive.files.delete(manifestId);
  drive.files.delete(partId);
  drive.files.set(manifestId, manifest);
  drive.files.set(partId, part);
}

test('one download reads each freshly checked snapshot file only once', async () => {
  const ledger = createFixture().base;
  const {sync, drive, commands} = await setupSyntheticSync({ledger, outbox: []});
  const uploads = await addRemoteSnapshot(drive, commands.getState().binding, ledger);
  const start = drive.calls.length;

  await sync.sync();

  const reads = drive.calls.slice(start).filter(([method]) => method === 'readJson');
  for (const upload of uploads) {
    assert.equal(reads.filter(([, fileId]) => fileId === upload.fileId).length, 1, upload.kind);
  }
  assert.equal(sync.getStatus().phase, 'synced');

  const warmStart = drive.calls.length;
  await sync.sync();
  const warmCalls = drive.calls.slice(warmStart);
  for (const upload of uploads) {
    assert.equal(warmCalls.filter(([method, fileId]) => method === 'readJson' && fileId === upload.fileId).length,
      1, `${upload.kind} warm`);
    assert.ok(warmCalls.filter(([method, fileId]) => method === 'metadata' && fileId === upload.fileId).length <= 3,
      `${upload.kind} warm metadata`);
  }
});

test('manifest before its part uses one content read per snapshot file', async () => {
  const ledger = createFixture().base;
  const {sync, drive, commands} = await setupSyntheticSync({ledger, outbox: []});
  const uploads = await addRemoteSnapshot(drive, commands.getState().binding, ledger);
  listManifestBeforePart(drive, uploads);
  const start = drive.calls.length;

  await sync.sync();

  for (const upload of uploads) {
    assert.equal(drive.calls.slice(start).filter(([method, id]) => method === 'readJson' && id === upload.fileId).length,
      1, upload.kind);
  }
  assert.equal(sync.getStatus().phase, 'synced');
});

test('manifest at a download batch edge does not cause the next batch to reread its part', async () => {
  const ledger = createFixture().base;
  const {sync, drive, commands} = await setupSyntheticSync({ledger, outbox: []});
  const binding = commands.getState().binding;
  const [packet] = buildPackets({events: [ledger.events[0]], datasetId: 'd1', epochId: 'e0', id: () => 'padding-packet'});
  drive.addJson({id: 'padding-file', parentId: binding.folderId, value: packet,
    appProperties: {app: 'vokabeltrainer-product', kind: 'packet', datasetId: 'd1', epochId: 'e0', packetId: packet.packetId}});
  const uploads = await addRemoteSnapshot(drive, binding, ledger);
  listManifestBeforePart(drive, uploads);
  const listed = await drive.listFiles(`'${binding.folderId}' in parents`);
  assert.equal(listed.findIndex(({id}) => id === uploads.at(-1).fileId), 3);
  assert.equal(listed.findIndex(({id}) => id === uploads[0].fileId), 4);
  const start = drive.calls.length;

  await sync.sync();

  for (const upload of uploads) {
    assert.equal(drive.calls.slice(start).filter(([method, id]) => method === 'readJson' && id === upload.fileId).length,
      1, upload.kind);
  }
  assert.equal(sync.getStatus().phase, 'synced');
});

test('snapshot download rejects an unrelated metadata change during a reused read', async () => {
  const ledger = createFixture().base;
  const {sync, drive, commands} = await setupSyntheticSync({ledger, outbox: []});
  const uploads = await addRemoteSnapshot(drive, commands.getState().binding, ledger);
  const manifestId = uploads.at(-1).fileId;
  drive.onRead = async (fileId) => {
    if (fileId !== manifestId) return;
    drive.files.get(fileId).meta.description = 'changed during read';
    drive.onRead = null;
  };

  await assert.rejects(sync.sync(), {code: 'stale'});
  assert.equal(commands.getState().knownFiles.some(({fileId}) => fileId === manifestId), false);
});

test('snapshot download rejects a part revised after its first read', async () => {
  const ledger = createFixture().base;
  const {sync, drive, commands} = await setupSyntheticSync({ledger, outbox: []});
  const uploads = await addRemoteSnapshot(drive, commands.getState().binding, ledger);
  const partId = uploads[0].fileId;
  const manifestId = uploads.at(-1).fileId;
  drive.onRead = async (fileId) => {
    if (fileId !== manifestId) return;
    drive.files.get(partId).meta.headRevisionId = 'foreign-revision';
    drive.files.get(partId).value.events.push({id: 'foreign-event'});
    drive.onRead = null;
  };

  await assert.rejects(sync.sync(), {code: 'stale'});
  assert.equal(commands.getState().knownFiles.some(({fileId}) => fileId === manifestId), false);
});

test('snapshot download accepts a version-only change with the same content revision', async () => {
  const ledger = createFixture().base;
  const {sync, drive, commands} = await setupSyntheticSync({ledger, outbox: []});
  const uploads = await addRemoteSnapshot(drive, commands.getState().binding, ledger);
  for (const upload of uploads) drive.files.get(upload.fileId).meta.headRevisionId = 'same-content-revision';
  const partId = uploads[0].fileId;
  const manifestId = uploads.at(-1).fileId;
  drive.onRead = async (fileId) => {
    if (fileId === partId) drive.files.get(partId).meta.version = '2';
    if (fileId === manifestId) drive.files.get(partId).meta.version = '3';
  };

  await sync.sync();

  assert.equal(sync.getStatus().phase, 'synced');
  assert.equal(commands.getState().knownFiles.some(({fileId}) => fileId === manifestId), true);
});

test('snapshot download does not let a warm session cache hide new metadata', async () => {
  const ledger = createFixture().base;
  const {sync, drive, commands} = await setupSyntheticSync({ledger, outbox: []});
  const uploads = await addRemoteSnapshot(drive, commands.getState().binding, ledger);
  const partId = uploads[0].fileId;
  await sync.sync();
  let changed = false;
  drive.onMetadata = async (fileId) => {
    if (fileId !== partId || changed) return;
    changed = true;
    drive.files.get(partId).meta.description = 'foreign metadata';
    return structuredClone(drive.files.get(partId).meta);
  };

  await assert.rejects(sync.sync(), {code: 'stale'});
  assert.equal(changed, true);
});

test('optional commerce port reconciles after learning download and syncLearning uses the same non-recursive path', async () => {
  const calls = [];
  const commerce = {
    async discover(input) { return structuredClone(input.state); },
    async reconcile(input) {
      calls.push(input);
      return structuredClone(input.state);
    },
  };
  const {sync, commands} = await setupSyntheticSync({outbox: [], commerce});
  const before = calls.length;
  const result = await sync.syncLearning();
  assert.equal(result.phase, 'synced');
  assert.equal(calls.length, before + 1);
  assert.deepEqual(calls.at(-1).binding, commands.getState().binding);
  assert.equal(calls.at(-1).descriptorHash.length, 64);
});

test('commerce epochs remain inactive until the shared head is durably verified', async () => {
  const {sync, drive, commands} = await setupSyntheticSync({outbox: []});
  await commands.start({profileId: 'p1', mode: 'all', size: 10});
  const before = commands.getState();
  const binding = before.binding;
  const descriptorHash = await digest(before.ledger.descriptor);
  const config = {
    version: 1, kind: 'purchase-config', binding, descriptorHash,
    coordinatorId: 'commerce-coordinator', contentFolderId: 'commerce-content',
  };
  const configRef = {id: 'commerce-config', sha256: await digest(config)};
  const source = structuredClone(before);
  source.commerce = emptyCommerce();
  source.commerce.mode = 'migrating';
  source.commerce.binding = structuredClone(binding);
  source.commerce.config = structuredClone(config);
  source.commerce.configRef = structuredClone(configRef);
  source.commerce.control = {
    version: 1, operationId: 'activate-authority', operation: 'initialize', phase: 'intent',
    epochId: null, head: null, etag: null, candidate: null, pointerProperties: null, uploads: [],
  };
  const prepare = createCommerceIntegration({
    now: () => new Date('2026-09-26T10:00:00.000Z'), id: sequenceIds('authority'),
  });
  const activation = await prepare.prepareActivationCandidate({
    state: source, control: source.commerce.control, reserve: sequenceIds('commerce-file'),
  });
  for (const upload of activation.publication.uploads) await uploadVerified(drive, binding, upload);
  const values = new Map([
    [configRef.id, config],
    ...activation.uploads.map(({ref, value}) => [ref.id, value]),
  ]);
  let coordinatorHead = null;
  let offline = false;
  const transport = {
    binding, descriptorHash,
    async readFolder({kind}) {
      if (kind === 'dataset') return {properties: {
        purchaseApp: 'vokabeltrainer-purchases', purchaseConfigId: configRef.id,
        purchaseConfigSha256: configRef.sha256,
      }};
      if (offline) throw Object.assign(new Error('synthetic coordinator unavailable'), {code: 'network'});
      return {properties: coordinatorHead === null ? {} : {
        purchaseHeadId: coordinatorHead.id, purchaseHeadSha256: coordinatorHead.sha256,
      }};
    },
    async readImmutable(ref) { return structuredClone(values.get(ref.id)); },
  };
  const commerce = createCommerceIntegration({
    transportFor: async () => transport,
    now: () => new Date('2026-09-26T10:05:00.000Z'), id: sequenceIds('discover'),
  });
  const guarded = createProductSync({
    drive, store: {}, commands, commerce,
    now: () => new Date('2026-09-26T10:05:00.000Z'), id: sequenceIds('guarded-sync'), onStatus() {},
  });

  offline = true;
  await assert.rejects(guarded.sync(), {code: 'network'});
  let staged = commands.getState();
  assert.equal(resolveEpochs(staged.ledger).activeEpochId, resolveEpochs(before.ledger).activeEpochId);
  assert.deepEqual(staged.rounds, before.rounds);
  assert.equal(staged.ledger.historicalEpochs.some(({id}) => id === activation.epochId), true);

  const late = {
    ...structuredClone(activation.publication.epoch),
    formatVersion: 2, ruleVersion: 2, id: 'late-v2', deviceId: 'old-client', clock: 2000,
  };
  drive.addJson({
    id: 'late-v2-file', parentId: binding.folderId,
    appProperties: {app: 'vokabeltrainer-product', kind: 'epoch', datasetId: binding.datasetId, epochId: late.id},
    value: late,
  });
  await assert.rejects(guarded.sync(), {code: 'network'});
  staged = commands.getState();
  assert.equal(resolveEpochs(staged.ledger).activeEpochId, resolveEpochs(before.ledger).activeEpochId);
  assert.deepEqual(staged.rounds, before.rounds);
  assert.notEqual(staged.commerce.config, null);
  assert.equal(staged.ledger.historicalEpochs.some(({id}) => id === late.id), true);

  guarded.destroy();
  const restartedStore = memoryStore(staged);
  const restartedCommands = await createCommands({
    store: restartedStore, now: () => new Date('2026-09-26T10:06:00.000Z'),
    id: sequenceIds('restarted-command'), deviceId: before.deviceId, onChange() {},
  });
  const restartedCommerce = createCommerceIntegration({
    transportFor: async () => transport,
    now: () => new Date('2026-09-26T10:06:00.000Z'), id: sequenceIds('restarted-discover'),
  });
  const restarted = createProductSync({
    drive, store: restartedStore, commands: restartedCommands, commerce: restartedCommerce,
    now: () => new Date('2026-09-26T10:06:00.000Z'), id: sequenceIds('restarted-sync'), onStatus() {},
  });
  const lateAfterRestart = {...late, id: 'late-v2-after-restart', clock: 2001};
  drive.addJson({
    id: 'late-v2-after-restart-file', parentId: binding.folderId,
    appProperties: {
      app: 'vokabeltrainer-product', kind: 'epoch', datasetId: binding.datasetId, epochId: lateAfterRestart.id,
    },
    value: lateAfterRestart,
  });
  await assert.rejects(restarted.sync(), {code: 'network'});
  assert.equal(resolveEpochs(restartedCommands.getState().ledger).activeEpochId,
    resolveEpochs(before.ledger).activeEpochId);
  assert.deepEqual(restartedCommands.getState().rounds, before.rounds);

  offline = false;
  coordinatorHead = activation.candidate;
  await restarted.sync();
  const confirmed = restartedCommands.getState();
  assert.equal(resolveEpochs(confirmed.ledger).activeEpochId, activation.epochId);
  assert.equal(confirmed.rounds.p1.status, 'abandoned');
  assert.equal(project(confirmed.ledger).profiles.p1.points, project(before.ledger).profiles.p1.points);
  restarted.destroy();
  sync.destroy();
});

test('join staging transfers the commerce anchor before a late legacy epoch can activate', async () => {
  const drive = new SyntheticDrive();
  const remote = await setupSyntheticSync({drive, outbox: []});
  const remoteState = remote.commands.getState();
  const binding = remoteState.binding;
  const descriptorHash = await digest(remoteState.ledger.descriptor);
  const config = {
    version: 1, kind: 'purchase-config', binding, descriptorHash,
    coordinatorId: 'join-coordinator', contentFolderId: 'join-content',
  };
  const configRef = {id: 'join-config', sha256: await digest(config)};
  const activationState = structuredClone(remoteState);
  activationState.commerce = emptyCommerce();
  activationState.commerce.mode = 'migrating';
  activationState.commerce.binding = structuredClone(binding);
  activationState.commerce.config = structuredClone(config);
  activationState.commerce.configRef = structuredClone(configRef);
  activationState.commerce.control = {
    version: 1, operationId: 'join-activation', operation: 'initialize', phase: 'intent',
    epochId: null, head: null, etag: null, candidate: null, pointerProperties: null, uploads: [],
  };
  const prepare = createCommerceIntegration({
    now: () => new Date('2026-09-26T12:00:00.000Z'), id: sequenceIds('join-authority'),
  });
  const activation = await prepare.prepareActivationCandidate({
    state: activationState, control: activationState.commerce.control, reserve: sequenceIds('join-file'),
  });
  for (const upload of activation.publication.uploads) await uploadVerified(drive, binding, upload);
  const values = new Map([
    [configRef.id, config],
    ...activation.uploads.map(({ref, value}) => [ref.id, value]),
  ]);
  const commerce = createCommerceIntegration({
    transportFor: async () => ({
      binding, descriptorHash,
      async readFolder({kind}) {
        if (kind === 'dataset') return {properties: {
          purchaseApp: 'vokabeltrainer-purchases', purchaseConfigId: configRef.id,
          purchaseConfigSha256: configRef.sha256,
        }};
        return {properties: {}};
      },
      async readImmutable(ref) { return structuredClone(values.get(ref.id)); },
    }),
    now: () => new Date('2026-09-26T12:00:00.000Z'), id: sequenceIds('join-discover'),
  });
  const localStore = memoryStore(productState(createFixture().base, {deviceId: 'join-device', outbox: []}));
  const localCommands = await createCommands({
    store: localStore, now: () => new Date('2026-09-26T12:00:00.000Z'),
    id: sequenceIds('join-command'), deviceId: 'join-device', onChange() {},
  });
  const local = localCommands.getState();
  local.ledger.descriptor.datasetId = 'local-before-join';
  local.ledger.descriptor.rootEpochId = 'local-root';
  local.ledger.events = [];
  local.ledger.epochs = [{...local.ledger.epochs[0], id: 'local-root', datasetId: 'local-before-join'}];
  await localCommands.commitExternal(local, await productStateHash(localCommands.getState()));
  await localCommands.revise({
    entityType: 'profile', entityId: 'local-profile', expectedHeads: [], value: {name: 'Lokal', archived: false},
  });
  const joining = createProductSync({
    drive, store: localStore, commands: localCommands, commerce,
    now: () => new Date('2026-09-26T12:00:00.000Z'), id: sequenceIds('joining-sync'), onStatus() {},
  });
  const [selection] = await joining.discover();
  const preview = await joining.joinDataset(selection, 'preview');
  await joining.joinDataset({...selection, previewId: preview.previewId, safetyCopyId: preview.safetyCopyId}, 'confirm');
  const joined = localCommands.getState();
  assert.deepEqual(joined.commerce.configRef, configRef);
  assert.equal(resolveEpochs(joined.ledger).activeEpochId, joined.ledger.descriptor.rootEpochId);
  assert.equal(joined.ledger.historicalEpochs.some(({id}) => id === activation.epochId), true);

  const late = {
    ...structuredClone(activation.publication.epoch),
    formatVersion: 2, ruleVersion: 2, id: 'join-late-v2', deviceId: 'old-client', clock: 3000,
  };
  drive.addJson({
    id: 'join-late-v2-file', parentId: binding.folderId,
    appProperties: {app: 'vokabeltrainer-product', kind: 'epoch', datasetId: binding.datasetId, epochId: late.id},
    value: late,
  });
  await joining.sync();
  const afterLate = localCommands.getState();
  assert.equal(resolveEpochs(afterLate.ledger).activeEpochId, afterLate.ledger.descriptor.rootEpochId);
  assert.equal(afterLate.ledger.historicalEpochs.some(({id}) => id === late.id), true);
  joining.destroy();
  remote.sync.destroy();
});

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

test('a scheduler sync during dataset creation shares the in-flight setup', async () => {
  const drive = new SyntheticDrive();
  const originalCreateFolder = drive.createFolder.bind(drive);
  let releaseFirstFolder;
  let firstFolderStarted;
  const folderStarted = new Promise((resolve) => { firstFolderStarted = resolve; });
  const firstFolderGate = new Promise((resolve) => { releaseFirstFolder = resolve; });
  let folderCalls = 0;
  drive.createFolder = async (request) => {
    folderCalls += 1;
    if (folderCalls === 1) {
      firstFolderStarted();
      await firstFolderGate;
    }
    return originalCreateFolder(request);
  };
  const commands = await makeCommands(productState(createFixture().base));
  const sync = createProductSync({
    drive, store: {}, commands, now: () => new Date('2026-09-18T10:00:00.000Z'),
    id: sequenceIds('concurrent-setup'), onStatus: () => {},
  });
  const creation = sync.createDataset('Familienwortschatz');
  const settledCreation = creation.then((value) => ({value}), (error) => ({error}));
  await folderStarted;
  const scheduled = sync.sync();
  releaseFirstFolder();
  const [creationResult, scheduledResult] = await Promise.all([settledCreation, scheduled]);
  assert.equal(creationResult.error, undefined);
  assert.ok(creationResult.value?.folderId);
  assert.equal(scheduledResult.phase, 'synced');
  assert.equal(sync.getStatus().phase, 'synced');
  assert.equal(commands.getState().outboxEventIds.length, 0);
  assert.equal(folderCalls, 1, 'the saved setup must be published by one operation');
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

test('an idle poll reports checking, while a running upload is distinct from queued changes', async () => {
  const {sync, drive, commands, statuses} = await setupSyntheticSync({outbox: []});
  const accountId = drive.accountId.bind(drive);
  let release;
  drive.accountId = () => new Promise((resolve) => { release = () => resolve(accountId()); });
  const poll = sync.retry();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(sync.getStatus().phase, 'checking');
  assert.equal(sync.getStatus().pendingCount, 0);
  assert.equal(syncStatusLabel(sync.getStatus()), 'Auf Änderungen prüfen …');
  await commands.setAnimations({profileId: 'p1', animations: false});
  assert.equal(sync.getStatus().phase, 'syncing');
  assert.equal(sync.getStatus().pendingCount, 1);
  assert.equal(syncStatusLabel(sync.getStatus()), 'Abgleich läuft …');
  drive.accountId = accountId;
  release();
  await poll;
  assert.equal(sync.getStatus().phase, 'synced');
  statuses.length = 0;
  await sync.retry();
  assert.ok(statuses.some(({phase}) => phase === 'checking'));
  assert.equal(statuses.some(({phase}) => phase === 'pending'), false);
  sync.destroy();
});

test('independent Drive files are checked concurrently within a small bound', async () => {
  const {sync, drive, commands} = await setupSyntheticSync();
  const packetFile = [...drive.files.values()].find(({meta}) => meta.appProperties.kind === 'packet');
  for (let index = 0; index < 8; index += 1) {
    const copy = structuredClone(packetFile);
    copy.meta.id = `parallel-copy-${index}`;
    drive.files.set(copy.meta.id, copy);
  }
  await sync.sync(); // Populate verified session versions, as in repeated real polls.
  const beforeLedger = commands.getState().ledger;
  const fileIds = new Set(commands.getState().knownFiles.filter(({kind}) => kind !== 'dataset').map(({fileId}) => fileId));
  let activeReads = 0;
  let maxReads = 0;
  drive.onMetadata = async (fileId) => {
    if (!fileIds.has(fileId)) return;
    activeReads += 1;
    maxReads = Math.max(maxReads, activeReads);
    await new Promise((resolve) => setTimeout(resolve, 5));
    activeReads -= 1;
  };
  await sync.sync();
  assert.ok(maxReads > 1, 'independent requests should overlap');
  assert.ok(maxReads <= 4, 'Drive must not receive an unbounded request fanout');
  assert.equal(activeReads, 0);
  assert.equal(sync.getStatus().phase, 'synced');
  assert.deepEqual(commands.getState().ledger, beforeLedger);
  sync.destroy();
});

test('a failed parallel read waits for its started siblings before returning the error', async () => {
  const {sync, drive, commands} = await setupSyntheticSync();
  const files = commands.getState().knownFiles.filter(({kind}) => kind !== 'dataset');
  assert.ok(files.length >= 2);
  let release;
  let firstStarted;
  const started = new Promise((resolve) => { firstStarted = resolve; });
  let settled = false;
  let authFailureObserved = false;
  drive.onMetadata = async (fileId) => {
    if (fileId === files[0].fileId) {
      firstStarted();
      await new Promise((resolve) => { release = resolve; });
    }
    if (fileId === files[1].fileId) {
      authFailureObserved = true;
      throw new DriveError('auth', 'synthetic expired session', 401);
    }
  };
  const operation = sync.sync();
  const rejected = assert.rejects(operation, {code: 'auth'});
  operation.then(() => { settled = true; }, () => { settled = true; });
  await started;
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(authFailureObserved, true, 'the sibling has already failed while the other read is held');
  assert.equal(settled, false);
  release();
  await rejected;
  assert.equal(sync.getStatus().phase, 'connect');
  sync.destroy();
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

test('late v1 answers after a reset sync exactly once without changing the new generation', async () => {
  const f=createFixture({words:[['w1','Hund',['dog']]]});
  const ledger=f.withEvents(f.roundStarted,...[1,2,3].map(ordinal=>f.answer({id:`old-${ordinal}`,ordinal})));
  const {commands,sync,drive}=await setupSyntheticSync({ledger});
  await commands.reactivateWord({profileId:'p1',wordId:'w1',learningId:'learn-w1',expectedGenerationId:null});
  await commands.start({profileId:'p1',mode:'all',size:10});
  await commands.submit({roundId:commands.getState().rounds.p1.id,typed:'dog'});
  const before=projectSchedule({ledger:commands.getState().ledger,profileId:'p1',policy:DEFAULT_POLICY,day:'2026-09-18'});
  const late=f.answer({id:'late-v1',ordinal:4,clock:100,correct:false});
  const packet=oldPackets({events:[late],datasetId:'d1',epochId:'e0',id:()=> 'late-v1-packet'})[0];
  drive.addJson({id:'late-v1-file',parentId:commands.getState().binding.folderId,value:packet,
    appProperties:{app:'vokabeltrainer-product',kind:'packet',datasetId:'d1',epochId:'e0',packetId:packet.packetId}});
  await sync.sync();await sync.sync();
  const state=commands.getState(),facts=project(state.ledger).profiles.p1;
  assert.equal(state.ledger.events.filter(e=>e.id===late.id).length,1);
  assert.equal(facts.points,40);assert.equal(facts.words.w1.attempts,5);
  assert.deepEqual(projectSchedule({ledger:state.ledger,profileId:'p1',policy:DEFAULT_POLICY,day:'2026-09-18'}),before);
  assert.equal(sync.getStatus().phase,'synced');sync.destroy();
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

test('malformed version headers quarantine as invalid and allow independent local upload', async (t) => {
  const malformed = [null, {}, [], 'wrong', {...VERSION, format: 'other'},
    {format: VERSION.format, formatVersion: 2}, {...VERSION, formatVersion: '2'},
    {...VERSION, formatVersion: 0}, {...VERSION, ruleVersion: null},
    {...VERSION, ruleVersion: 1.5}];
  for (const [index, value] of malformed.entries()) await t.test(`header ${index}`, async () => {
    const {sync, drive, commands} = await setupSyntheticSync({outbox: []});
    await commands.setAnimations({profileId: 'p1', animations: false});
    const eventId = commands.getState().outboxEventIds.at(-1);
    drive.addJson({id: 'broken-header', parentId: commands.getState().binding.folderId, value,
      appProperties: {app: 'vokabeltrainer-product', kind: 'packet', datasetId: 'd1', epochId: 'e0', packetId: 'broken-header'}});
    const offset = drive.calls.length;
    await assert.rejects(sync.sync(), {code: 'invalid'});
    const after = commands.getState();
    const quarantine = after.quarantinedFiles.find(q => q.fileId === 'broken-header');
    assert.equal(quarantine.code, 'invalid');
    assert.deepEqual(quarantine.value, value);
    assert.equal(after.outboxEventIds.length, 0);
    assert.equal(after.pendingPackets.length, 0);
    assert.ok(drive.calls.slice(offset).some(([method]) => method === 'putJson'));
    assert.ok([...drive.files.values()].some(file => file.value?.events?.some?.(event => event.id === eventId)));
    assert.notEqual(sync.getStatus().phase, 'synced');
    sync.destroy();
  });
});

test('later future files block writes even after an ordinary malformed remote file', async () => {
  const {sync, drive, commands} = await setupSyntheticSync({outbox: []});
  await commands.setAnimations({profileId: 'p1', animations: false});
  for (const [id, value] of [['broken-first', {}], ['future-later', {
    format: VERSION.format, formatVersion: 4, ruleVersion: 4, futureField: {newSchema: true},
  }]]) drive.addJson({id, parentId: commands.getState().binding.folderId, value,
    appProperties: {app: 'vokabeltrainer-product', kind: 'packet', datasetId: 'd1', epochId: 'e0', packetId: id}});
  const offset = drive.calls.length;
  const pending = commands.getState().outboxEventIds;
  await assert.rejects(sync.sync(), {code: 'version'});
  assert.equal(drive.calls.slice(offset).some(([method]) => ['putJson', 'generateId', 'createFolder'].includes(method)), false);
  assert.deepEqual(commands.getState().outboxEventIds, pending);
  assert.equal(commands.getState().quarantinedFiles.find(q => q.fileId === 'broken-first').code, 'invalid');
  assert.equal(commands.getState().quarantinedFiles.find(q => q.fileId === 'future-later').code, 'version');
  sync.destroy();
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

function uploadGate() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return {promise, resolve, reject};
}

async function waitForUploadCount(uploads, count) {
  const deadline = Date.now() + 5000;
  while (uploads.length < count && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  assert.equal(uploads.length, count, `expected ${count} started packet uploads`);
}

async function preparedPacketSync(count = 5) {
  const {sync, drive, commands} = await setupSyntheticSync({outbox: []});
  const before = commands.getState();
  const next = structuredClone(before);
  next.pendingPackets = before.ledger.events.slice(0, count).map((event, index) => ({
    packet: buildPackets({events: [event], datasetId: before.binding.datasetId,
      epochId: event.epochId, id: () => `concurrent-packet-${index}`})[0],
    driveFileId: null, confirmed: false,
  }));
  await commands.commitExternal(next, await productStateHash(before));
  return {sync, drive, commands};
}

test('ordinary packet uploads start three together and never exceed three in flight', async () => {
  const {sync, drive, commands} = await preparedPacketSync();
  const realGenerate = drive.generateId.bind(drive);
  const realPut = drive.putJson.bind(drive);
  const reservations = [];
  const uploads = [];
  let inFlight = 0;
  let maximum = 0;
  let reservationsReleased = false;
  let released = false;
  drive.generateId = async () => {
    if (reservationsReleased) return realGenerate();
    const gate = uploadGate();
    reservations.push(gate);
    await gate.promise;
    return realGenerate();
  };
  drive.putJson = async (request) => {
    if (request.appProperties.kind !== 'packet') return realPut(request);
    if (released) return realPut(request);
    const gate = uploadGate();
    uploads.push({request, gate});
    inFlight += 1;
    maximum = Math.max(maximum, inFlight);
    try { await gate.promise; return await realPut(request); }
    finally { inFlight -= 1; }
  };
  const running = sync.sync();
  try {
    await waitForUploadCount(reservations, 3);
    reservationsReleased = true;
    reservations.forEach(({resolve}) => resolve());
    await waitForUploadCount(uploads, 3);
    assert.equal(maximum, 3);
    assert.equal(commands.getState().pendingPackets.slice(0, 3).every(({driveFileId}) => driveFileId !== null), true);
    uploads.slice(0, 3).forEach(({gate}) => gate.resolve());
    await waitForUploadCount(uploads, 5);
    uploads.slice(3).forEach(({gate}) => gate.resolve());
    await running;
    assert.equal(maximum, 3);
    assert.equal(commands.getState().pendingPackets.length, 0);
    assert.equal(drive.createdPacketIds.length, 5);
  } finally {
    reservationsReleased = true;
    released = true;
    reservations.forEach(({resolve}) => resolve());
    uploads.forEach(({gate}) => gate.resolve());
    await running.catch(() => {});
  }
});

test('failed packet group settles started writes, retains successful confirmations and retries saved IDs', async () => {
  const {sync, drive, commands} = await preparedPacketSync();
  const realPut = drive.putJson.bind(drive);
  const uploads = [];
  let released = false;
  drive.putJson = async (request) => {
    if (request.appProperties.kind !== 'packet') return realPut(request);
    if (released) return realPut(request);
    const gate = uploadGate();
    uploads.push({request, gate});
    await gate.promise;
    return realPut(request);
  };
  const running = sync.sync();
  let settled = false;
  running.then(() => { settled = true; }, () => { settled = true; });
  try {
    await waitForUploadCount(uploads, 3);
    const reserved = commands.getState().pendingPackets.slice(0, 3).map(({driveFileId}) => driveFileId);
    assert.equal(reserved.every(Boolean), true);
    uploads[0].gate.resolve();
    uploads[1].gate.reject(new DriveError('network', 'synthetic interruption'));
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(settled, false, 'sync must wait for the last started upload');
    assert.equal(uploads.length, 3, 'failure must stop the next wave');
    uploads[2].gate.resolve();
    await assert.rejects(running, {code: 'network'});
    assert.equal(commands.getState().pendingPackets.length, 3);
    assert.equal(commands.getState().pendingPackets.find(({packet}) => packet.packetId === 'concurrent-packet-1').driveFileId, reserved[1]);
    assert.equal(commands.getState().knownFiles.filter(({fileId}) => reserved.includes(fileId)).length, 2);
    drive.putJson = realPut;
    await sync.retry();
    assert.equal(commands.getState().pendingPackets.length, 0);
    assert.equal(drive.createdPacketIds.length, 5);
    assert.equal(drive.calls.filter(([name, request]) => name === 'putJson' && request.appProperties.kind === 'packet' && [reserved[0], reserved[2]].includes(request.id)).length, 2);
    const uploadedEventIds = drive.createdPacketIds.flatMap((fileId) => drive.files.get(fileId).value.events.map(({id}) => id));
    assert.deepEqual(uploadedEventIds.sort(), commands.getState().ledger.events.map(({id}) => id).sort());
  } finally {
    released = true;
    uploads.forEach(({gate}) => gate.resolve());
    await running.catch(() => {});
  }
});

test('later packet groups re-read quarantine and skip a newly blocked reserved ID', async () => {
  const {sync, drive, commands} = await preparedPacketSync();
  const before = commands.getState();
  const next = structuredClone(before);
  next.pendingPackets[3].driveFileId = 'blocked-packet-file';
  await commands.commitExternal(next, await productStateHash(before));
  const realPut = drive.putJson.bind(drive);
  const uploads = [];
  let released = false;
  drive.putJson = async (request) => {
    if (request.appProperties.kind !== 'packet' || released) return realPut(request);
    const gate = uploadGate();
    uploads.push({request, gate});
    await gate.promise;
    return realPut(request);
  };
  const running = sync.sync();
  try {
    await waitForUploadCount(uploads, 3);
    const current = commands.getState();
    const blocked = structuredClone(current);
    blocked.quarantinedFiles.push({
      fileId: 'blocked-packet-file', code: 'invalid', message: 'synthetic quarantine', value: null,
    });
    await commands.commitExternal(blocked, await productStateHash(current));
    uploads.forEach(({gate}) => gate.resolve());
    await waitForUploadCount(uploads, 4);
    assert.equal(uploads[3].request.appProperties.packetId, 'concurrent-packet-4');
    uploads[3].gate.resolve();
    await assert.rejects(running, {code: 'invalid'});
    assert.deepEqual(commands.getState().pendingPackets.map(({packet}) => packet.packetId), ['concurrent-packet-3']);
    assert.equal(commands.getState().pendingPackets[0].driveFileId, 'blocked-packet-file');
    assert.equal(drive.calls.some(([name, request]) => name === 'putJson' && request.id === 'blocked-packet-file'), false);
  } finally {
    released = true;
    uploads.forEach(({gate}) => gate.resolve());
    await running.catch(() => {});
  }
});
