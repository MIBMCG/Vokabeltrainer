import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

import {assertLedger} from '../../src/trainer/model/schema.js';
import {assertSupportedVersion, COMMERCE_VERSION} from '../../src/trainer/model/versions.js';
import {DEFAULT_POLICY} from '../../src/trainer/model/policies.js';
import {digest} from '../../src/trainer/model/canonical.js';
import {assertProductState, createCommands, productStateHash} from '../../src/trainer/commands.js';
import {readBasis} from '../../src/trainer/purchases/basis.js';
import {readHistory, replayHistory} from '../../src/trainer/purchases/history.js';
import {createCommerceIntegration} from '../../src/trainer/purchases/integration.js';
import {createPurchaseService} from '../../src/trainer/purchases/service.js';
import {emptyCommerce} from '../../src/trainer/purchases/schema.js';
import {BINDING, earnedLedger} from './purchases-fixtures.js';
import {SyntheticDrive} from './backup-fixtures.js';
import {exportBackup, snapshotHash, validateBackup} from '../../src/trainer/backup/format.js';
import {planSnapshotUploads, readSnapshot, uploadVerified} from '../../src/trainer/backup/transport.js';
import {createFixture} from './fixtures.js';
import {memoryStore, productState, sequenceIds} from './backup-fixtures.js';
import {createCommands as frozenV2Commands} from '../compat/v2/src/trainer/commands.js';
import {createProductSync as frozenV2Sync} from '../compat/v2/src/trainer/sync/drive.js';
import {createRestoreService as frozenV2Restore} from '../compat/v2/src/trainer/backup/restore.js';
import {exportBackup as frozenV2Backup} from '../compat/v2/src/trainer/backup/format.js';
import {createProductSync} from '../../src/trainer/sync/drive.js';
import {resolveEpochs} from '../../src/trainer/model/epochs.js';

function ids(prefix) {
  let value = 0;
  return () => `${prefix}-${++value}`;
}

async function migratingState() {
  const ledger = earnedLedger();
  const config = {
    version: 1, kind: 'purchase-config', binding: BINDING,
    descriptorHash: await digest(ledger.descriptor), coordinatorId: 'coordinator-1', contentFolderId: 'content-1',
  };
  const commerce = emptyCommerce();
  commerce.mode = 'migrating';
  commerce.binding = structuredClone(BINDING);
  commerce.config = config;
  commerce.configRef = {id: 'config-1', sha256: await digest(config)};
  commerce.control = {
    version: 1, operationId: 'activate-1', operation: 'initialize', phase: 'intent', epochId: null,
    head: null, etag: null, candidate: null, pointerProperties: null, uploads: [],
  };
  return {
    storageVersion: 3, deviceId: 'device-1', clock: 100, ledger, rounds: {}, binding: structuredClone(BINDING),
    outboxEventIds: [], pendingPackets: [], datasetSetup: null, packetIntegrity: [], knownFiles: [],
    quarantinedFiles: [], safetyCopies: [], restoreJobs: [], snapshotManifests: [], pinVerifier: null, commerce,
  };
}

test('format 3 is supported without rewriting the immutable version-2 descriptor', () => {
  assert.equal(assertSupportedVersion(COMMERCE_VERSION), 3);
  const fixture = createFixture();
  const ledger = structuredClone(fixture.base);
  ledger.descriptor.formatVersion = 2;
  ledger.descriptor.ruleVersion = 2;
  assert.equal(ledger.descriptor.formatVersion, 2);
  ledger.events.push(fixture.event('round.started', {
    roundId: 'round-v3', profileId: 'p1', mode: 'all', size: 10,
    policy: DEFAULT_POLICY,
    policyEventId: 'missing-policy',
  }, {id: 'round-v3', formatVersion: 3, ruleVersion: 3}));
  assert.throws(() => assertLedger(ledger), {code: 'reference'});
  assert.equal(ledger.descriptor.formatVersion, 2);
});

test('activation preparation returns a durable v3 epoch publication and matching receipt basis', async () => {
  const state = await migratingState();
  const before = structuredClone(state);
  const integration = createCommerceIntegration({
    now: () => new Date('2026-09-26T10:00:00.000Z'), id: ids('local'),
  });
  const prepared = await integration.prepareActivationCandidate({
    state, control: state.commerce.control, input: null, history: null, reserve: ids('purchase'),
  });
  assert.deepEqual(state, before);
  assert.equal(prepared.publication.id, 'activate-1');
  assert.equal(prepared.publication.phase, 'uploading');
  assert.equal(prepared.publication.epoch.formatVersion, 3);
  assert.equal(prepared.publication.epoch.ruleVersion, 3);
  const markerManifest = prepared.publication.uploads.find(({kind}) => kind === 'snapshot-manifest');
  assert.equal(prepared.publication.epoch.snapshotManifestFileId, markerManifest.fileId);
  const persisted = structuredClone(state);
  persisted.restoreJobs.push(prepared.publication);
  assertProductState(persisted);
  const values = new Map(prepared.uploads.map(({ref, value}) => [ref.id, value]));
  const receipt = values.get(prepared.candidate.id);
  assert.equal(receipt.operation, 'initialize');
  assert.equal(receipt.epochId, prepared.publication.epoch.id);
  const ledger = await readBasis(receipt.basis, async id => values.get(id));
  assert.equal(ledger.descriptor.formatVersion, before.ledger.descriptor.formatVersion);
  assert.equal(ledger.epochs.at(-1).id, prepared.publication.epoch.id);
});

test('confirmed control atomically applies the verified head basis and keeps late epochs historical', async () => {
  const state = await migratingState();
  const integration = createCommerceIntegration({
    now: () => new Date('2026-09-26T10:00:00.000Z'), id: ids('local'),
  });
  const prepared = await integration.prepareActivationCandidate({
    state, control: state.commerce.control, input: null, history: null, reserve: ids('purchase'),
  });
  const byId = new Map(prepared.uploads.map(({ref, value}) => [ref.id, value]));
  const history = await readHistory({
    head: prepared.candidate, binding: BINDING, cache: {version: 1, head: null, values: []},
    read: async fileId => byId.get(fileId), onProgress: () => {},
  });
  const persisted = structuredClone(state);
  persisted.restoreJobs.push(prepared.publication);
  persisted.commerce.mode = 'active';
  persisted.commerce.head = prepared.candidate;
  persisted.commerce.cache = history.cache;
  persisted.commerce.control = {
    ...persisted.commerce.control, phase: 'confirmed', epochId: prepared.epochId,
    candidate: prepared.candidate, etag: '"etag-1"', uploads: prepared.uploads,
    pointerProperties: {
      app: 'vokabeltrainer-purchases', kind: 'coordinator', datasetId: 'd1',
      descriptorFileId: 'descriptor-file-1', descriptorHash: persisted.commerce.config.descriptorHash,
      coordinatorId: 'coordinator-1', contentFolderId: 'content-1',
      purchaseHeadId: prepared.candidate.id, purchaseHeadSha256: prepared.candidate.sha256,
    },
  };
  const applied = await integration.applyConfirmedControl({
    state: persisted, control: persisted.commerce.control, history,
  });
  assert.equal(resolveActive(applied), prepared.epochId);
  assert.equal(applied.ledger.descriptor.formatVersion, state.ledger.descriptor.formatVersion);
  assert.equal(applied.restoreJobs.find(({id}) => id === 'activate-1').phase, 'activated');
});

test('empty second device discovers installed commerce and applies only the shared authoritative epoch', async () => {
  const source = await migratingState();
  const prepare = createCommerceIntegration({
    now: () => new Date('2026-09-26T10:00:00.000Z'), id: ids('discover-source'),
  });
  const activation = await prepare.prepareActivationCandidate({
    state: source, control: source.commerce.control, input: null, history: null, reserve: ids('discover-upload'),
  });
  const values = new Map(activation.uploads.map(({ref, value}) => [ref.id, value]));
  values.set(source.commerce.configRef.id, source.commerce.config);
  const orphan = {
    ...COMMERCE_VERSION, kind: 'epoch', id: 'uncoordinated-old-epoch', datasetId: 'd1',
    parents: [source.ledger.epochs[0].id], deviceId: 'old-client', clock: 999,
    occurredAt: '2026-09-26T10:30:00.000Z', snapshotId: null, snapshotManifestFileId: null,
  };
  const second = structuredClone(source);
  second.commerce = emptyCommerce();
  second.ledger.epochs.push(orphan);
  second.clock = orphan.clock;
  const descriptorHash = source.commerce.config.descriptorHash;
  const transport = {
    binding: BINDING, descriptorHash,
    async readFolder({kind}) {
      if (kind === 'dataset') return {properties: {
        purchaseApp: 'vokabeltrainer-purchases', purchaseConfigId: source.commerce.configRef.id,
        purchaseConfigSha256: source.commerce.configRef.sha256,
      }};
      return {properties: {purchaseHeadId: activation.candidate.id, purchaseHeadSha256: activation.candidate.sha256}};
    },
    async readImmutable(ref) { return structuredClone(values.get(ref.id)); },
  };
  const integration = createCommerceIntegration({
    transportFor: async () => transport,
    now: () => new Date('2026-09-26T11:00:00.000Z'), id: ids('discover-target'),
  });
  const discovered = await integration.reconcile({state: second, binding: BINDING, descriptorHash});
  assert.equal(discovered.commerce.mode, 'active');
  assert.deepEqual(discovered.commerce.head, activation.candidate);
  assert.equal(resolveActive(discovered), activation.epochId);
  assert.equal(discovered.ledger.epochs.some(({id}) => id === orphan.id), false);
  assert.equal(discovered.ledger.historicalEpochs.some(({id}) => id === orphan.id), true);
});

function resolveActive(state) {
  const parents = new Set(state.ledger.epochs.flatMap(({parents: values}) => values));
  return state.ledger.epochs.find(({id}) => !parents.has(id))?.id ?? null;
}

test('purchase service persists the complete publication before the first dependent upload', async () => {
  let state = await migratingState();
  const integration = createCommerceIntegration({
    now: () => new Date('2026-09-26T10:00:00.000Z'), id: ids('local'),
  });
  let publicationObserved = false;
  const commands = {
    getState: () => structuredClone(state),
    async commitExternal(next, expected) {
      assert.equal(expected, await productStateHash(state));
      state = assertProductState(next);
    },
  };
  const folder = {
    id: 'coordinator-1', name: 'Kaufkoordination', mimeType: 'application/vnd.google-apps.folder',
    parents: ['dataset-folder-1'], version: '1', etag: '"etag-1"',
    properties: {
      app: 'vokabeltrainer-purchases', kind: 'coordinator', datasetId: 'd1',
      descriptorFileId: 'descriptor-file-1', descriptorHash: state.commerce.config.descriptorHash,
      coordinatorId: 'coordinator-1', contentFolderId: 'content-1',
    },
  };
  const transport = {
    binding: BINDING, descriptorHash: state.commerce.config.descriptorHash,
    reserveId: ids('purchase'), readFolder: async () => structuredClone(folder),
    async writeImmutable() {
      publicationObserved = state.restoreJobs.some(({id}) => id === 'activate-1');
    },
    async putPointer() { throw new Error('pointer must not be sent by prepare'); },
  };
  const sync = {
    ...integration,
    async publishControl() {
      publicationObserved = state.restoreJobs.some(({id}) => id === 'activate-1');
      const next = structuredClone(state);
      next.restoreJobs.find(({id}) => id === 'activate-1').phase = 'published';
      await commands.commitExternal(next, await productStateHash(state));
      return state;
    },
  };
  const service = createPurchaseService({
    commands, transport, sync, now: () => new Date('2026-09-26T10:00:00.000Z'),
    id: ids('service'), onStatus: () => {},
  });
  await service.prepareActivation(null);
  assert.equal(publicationObserved, true);
  assert.equal(state.restoreJobs.find(({id}) => id === 'activate-1').phase, 'published');
  assert.equal(state.commerce.control.phase, 'pointer-pending');
});

test('control publication resumes the same reserved product files after an unknown upload outcome', async () => {
  let state = await migratingState();
  const prepare = createCommerceIntegration({
    now: () => new Date('2026-09-26T10:00:00.000Z'), id: ids('local'),
  });
  const prepared = await prepare.prepareActivationCandidate({
    state, control: state.commerce.control, input: null, history: null, reserve: ids('purchase'),
  });
  state.restoreJobs.push(prepared.publication);
  state.commerce.control = {
    ...state.commerce.control, phase: 'reserved', epochId: prepared.epochId, etag: '"etag-1"',
    candidate: prepared.candidate, uploads: prepared.uploads,
    pointerProperties: {
      app: 'vokabeltrainer-purchases', kind: 'coordinator', datasetId: 'd1',
      descriptorFileId: 'descriptor-file-1', descriptorHash: state.commerce.config.descriptorHash,
      coordinatorId: 'coordinator-1', contentFolderId: 'content-1',
      purchaseHeadId: prepared.candidate.id, purchaseHeadSha256: prepared.candidate.sha256,
    },
  };
  const commands = {
    getState: () => structuredClone(state),
    async commitExternal(next, expected) {
      assert.equal(expected, await productStateHash(state));
      state = assertProductState(next);
    },
  };
  const drive = new SyntheticDrive();
  drive.account = 'account-1';
  drive.loseUploadKind = 'snapshot-manifest';
  const integration = createCommerceIntegration({
    commands, drive, now: () => new Date('2026-09-26T10:00:00.000Z'), id: ids('resume'),
  });
  await assert.rejects(integration.publishControl({state, control: state.commerce.control}), {code: 'network'});
  const reservedIds = state.restoreJobs[0].uploads.map(({fileId}) => fileId);
  await integration.publishControl({state: commands.getState(), control: commands.getState().commerce.control});
  assert.equal(state.restoreJobs[0].phase, 'published');
  assert.ok(state.restoreJobs[0].uploads.every(({verified}) => verified));
  assert.deepEqual(state.restoreJobs[0].uploads.map(({fileId}) => fileId), reservedIds);
});

test('restore preparation binds the existing durable preview job to a fresh shared-head successor', async () => {
  const source = await migratingState();
  const integration = createCommerceIntegration({
    now: () => new Date('2026-09-26T10:00:00.000Z'), id: ids('restore-local'),
  });
  const activation = await integration.prepareActivationCandidate({
    state: source, control: source.commerce.control, input: null, history: null, reserve: ids('activate-upload'),
  });
  const activationValues = new Map(activation.uploads.map(({ref, value}) => [ref.id, value]));
  const activationHistory = await readHistory({
    head: activation.candidate, binding: BINDING, cache: {version: 1, head: null, values: []},
    read: async fileId => activationValues.get(fileId), onProgress: () => {},
  });
  const staged = structuredClone(source);
  staged.restoreJobs.push({...activation.publication, phase: 'published'});
  staged.commerce.mode = 'active'; staged.commerce.head = activation.candidate; staged.commerce.cache = activationHistory.cache;
  staged.commerce.control = {
    ...staged.commerce.control, phase: 'confirmed', epochId: activation.epochId, candidate: activation.candidate,
    etag: '"etag-a"', uploads: activation.uploads, pointerProperties: {
      app: 'vokabeltrainer-purchases', kind: 'coordinator', datasetId: 'd1', descriptorFileId: 'descriptor-file-1',
      descriptorHash: staged.commerce.config.descriptorHash, coordinatorId: 'coordinator-1', contentFolderId: 'content-1',
      purchaseHeadId: activation.candidate.id, purchaseHeadSha256: activation.candidate.sha256,
    },
  };
  const active = await integration.applyConfirmedControl({state: staged, control: staged.commerce.control, history: activationHistory});
  active.restoreJobs = [];
  active.commerce.control = {
    version: 1, operationId: 'restore-1', operation: 'restore', phase: 'intent', epochId: null,
    head: null, etag: null, candidate: null, pointerProperties: null, uploads: [],
  };
  const imported = await exportBackup(active, '2026-09-25T10:00:00.000Z');
  const targetSnapshot = {...imported.snapshot, id: 'restore-snapshot', datasetId: 'd1'};
  targetSnapshot.contentHash = await snapshotHash(targetSnapshot, imported.events);
  active.restoreJobs.push({
    id: 'restore-1', phase: 'preview', backup: imported, previewId: 'a'.repeat(64),
    parentHeads: [activation.epochId], safetyCopyId: 'safety-1', snapshot: targetSnapshot, uploads: [], epoch: null,
  });
  const prepared = await integration.prepareRestoreCandidate({
    state: active, control: active.commerce.control,
    input: {restoreJobId: 'restore-1', previewId: 'a'.repeat(64)}, history: activationHistory,
    reserve: ids('restore-upload'),
  });
  const values = new Map(prepared.uploads.map(({ref, value}) => [ref.id, value]));
  const receipt = values.get(prepared.candidate.id);
  assert.deepEqual(receipt.previous, activation.candidate);
  assert.equal(receipt.operation, 'restore');
  assert.notEqual(receipt.epochId, activation.epochId);
  assert.deepEqual(receipt.economy.source.binding, imported.economy.binding);
  assert.deepEqual(receipt.economy.source.head, imported.economy.head);
  assert.ok(receipt.economy.source.proof);
  const sameBindingProof = prepared.uploads.find(({ref}) => ref.id === receipt.economy.source.proof.id).value;
  const checkpointMapping = sameBindingProof.objects.find(({logical}) => logical.id === imported.economy.head.id);
  assert.ok(checkpointMapping);
  assert.notEqual(checkpointMapping.stored.id, checkpointMapping.logical.id);
  const candidateValues = new Map([
    ...activation.uploads.map(({ref, value}) => [ref.id, value]),
    ...prepared.uploads.map(({ref, value}) => [ref.id, value]),
  ]);
  const restoredHistory = await readHistory({
    head: prepared.candidate, binding: BINDING, cache: {version: 1, head: null, values: []},
    read: async fileId => candidateValues.get(fileId), onProgress: () => {},
  });
  assert.deepEqual(restoredHistory.projection.accounts, activationHistory.projection.accounts);
  const stagedB = structuredClone(active);
  stagedB.restoreJobs = [prepared.publication];
  stagedB.commerce.head = prepared.candidate;
  stagedB.commerce.cache = restoredHistory.cache;
  stagedB.commerce.control = {
    version: 1, operationId: 'restore-1', operation: 'restore', phase: 'confirmed',
    epochId: prepared.epochId, head: activation.candidate, etag: '"etag-b"',
    candidate: prepared.candidate, uploads: prepared.uploads, pointerProperties: {
      app: 'vokabeltrainer-purchases', kind: 'coordinator', datasetId: 'd1',
      descriptorFileId: 'descriptor-file-1', descriptorHash: active.commerce.config.descriptorHash,
      coordinatorId: 'coordinator-1', contentFolderId: 'content-1',
      purchaseHeadId: prepared.candidate.id, purchaseHeadSha256: prepared.candidate.sha256,
    },
  };
  const activeB = await integration.applyConfirmedControl({state: stagedB, control: stagedB.commerce.control, history: restoredHistory});
  const backupB = await exportBackup(activeB, '2026-09-26T12:00:00.000Z');
  const targetC = structuredClone(active);
  targetC.restoreJobs = [];
  targetC.commerce.control = {
    version: 1, operationId: 'restore-2', operation: 'restore', phase: 'intent', epochId: null,
    head: null, etag: null, candidate: null, pointerProperties: null, uploads: [],
  };
  const snapshotC = {...backupB.snapshot, id: 'restore-snapshot-c', datasetId: 'd1'};
  snapshotC.contentHash = await snapshotHash(snapshotC, backupB.events);
  targetC.restoreJobs.push({
    id: 'restore-2', phase: 'preview', backup: backupB, previewId: 'c'.repeat(64),
    parentHeads: [activation.epochId], safetyCopyId: 'safety-2', snapshot: snapshotC, uploads: [], epoch: null,
  });
  const preparedC = await integration.prepareRestoreCandidate({
    state: targetC, control: targetC.commerce.control,
    input: {restoreJobId: 'restore-2', previewId: 'c'.repeat(64)}, history: activationHistory,
    reserve: ids('restore-c-upload'),
  });
  const receiptC = preparedC.uploads.find(({ref}) => ref.id === preparedC.candidate.id).value;
  const outerProof = preparedC.uploads.find(({ref}) => ref.id === receiptC.economy.source.proof.id).value;
  assert.ok(outerProof.objects.some(({logical}) => logical.id === receipt.economy.source.proof.id));
  const valuesC = new Map([
    ...activation.uploads.map(({ref, value}) => [ref.id, value]),
    ...preparedC.uploads.map(({ref, value}) => [ref.id, value]),
  ]);
  const historyC = await readHistory({
    head: preparedC.candidate, binding: BINDING, cache: {version: 1, head: null, values: []},
    read: async fileId => valuesC.get(fileId), onProgress: () => {},
  });
  assert.deepEqual(historyC.projection.accounts, restoredHistory.projection.accounts);
  assert.equal(prepared.publication.id, 'restore-1');
  assert.equal(prepared.publication.safetyCopyId, 'safety-1');
  assert.equal(prepared.publication.epoch.id, receipt.epochId);
});

test('purchase service accepts its matching restore preview while keeping unrelated legacy restores blocked', async () => {
  const source = await migratingState();
  const integration = createCommerceIntegration({
    now: () => new Date('2026-09-26T10:00:00.000Z'), id: ids('service-restore-local'),
  });
  const activation = await integration.prepareActivationCandidate({
    state: source, control: source.commerce.control, input: null, history: null, reserve: ids('service-activate-upload'),
  });
  const immutable = new Map(activation.uploads.map(({ref, value}) => [ref.id, value]));
  const history = await readHistory({
    head: activation.candidate, binding: BINDING, cache: {version: 1, head: null, values: []},
    read: async fileId => immutable.get(fileId), onProgress: () => {},
  });
  const staged = structuredClone(source);
  staged.restoreJobs.push({...activation.publication, phase: 'published'});
  staged.commerce.mode = 'active'; staged.commerce.head = activation.candidate; staged.commerce.cache = history.cache;
  staged.commerce.control = {
    ...staged.commerce.control, phase: 'confirmed', epochId: activation.epochId, candidate: activation.candidate,
    etag: '"etag-a"', uploads: activation.uploads, pointerProperties: {
      app: 'vokabeltrainer-purchases', kind: 'coordinator', datasetId: 'd1', descriptorFileId: 'descriptor-file-1',
      descriptorHash: staged.commerce.config.descriptorHash, coordinatorId: 'coordinator-1', contentFolderId: 'content-1',
      purchaseHeadId: activation.candidate.id, purchaseHeadSha256: activation.candidate.sha256,
    },
  };
  let state = await integration.applyConfirmedControl({state: staged, control: staged.commerce.control, history});
  state.restoreJobs = []; state.commerce.control = null;
  const imported = await exportBackup(source, '2026-09-25T10:00:00.000Z');
  const snapshot = {...imported.snapshot, id: 'service-restore-snapshot', datasetId: 'd1'};
  snapshot.contentHash = await snapshotHash(snapshot, imported.events);
  state.restoreJobs.push({id: 'restore-service-1', phase: 'preview', backup: imported, previewId: 'b'.repeat(64),
    parentHeads: [activation.epochId], safetyCopyId: 'safety-2', snapshot, uploads: [], epoch: null});
  const commands = {getState: () => structuredClone(state), async commitExternal(next, expected) {
    assert.equal(expected, await productStateHash(state)); state = assertProductState(next);
  }};
  const folder = {id: 'coordinator-1', name: 'Kaufkoordination', mimeType: 'application/vnd.google-apps.folder',
    parents: ['dataset-folder-1'], version: '1', etag: '"etag-r"', properties: {
      app: 'vokabeltrainer-purchases', kind: 'coordinator', datasetId: 'd1', descriptorFileId: 'descriptor-file-1',
      descriptorHash: state.commerce.config.descriptorHash, coordinatorId: 'coordinator-1', contentFolderId: 'content-1',
      purchaseHeadId: activation.candidate.id, purchaseHeadSha256: activation.candidate.sha256,
    }};
  const transport = {binding: BINDING, descriptorHash: state.commerce.config.descriptorHash,
    reserveId: ids('service-restore-upload'), readFolder: async () => structuredClone(folder),
    readImmutable: async ref => structuredClone(immutable.get(ref.id)), writeImmutable: async () => {},
    putPointer: async () => { throw new Error('prepare must not send pointer'); }};
  const sync = {...integration, syncLearning: async () => ({phase: 'synced'}), publishControl: async () => {
    const next=structuredClone(state);
    next.restoreJobs.find(({id})=>id==='restore-service-1').phase='published';
    await commands.commitExternal(next,await productStateHash(state));
    return state;
  }};
  const service = createPurchaseService({commands, transport, sync,
    now: () => new Date('2026-09-26T10:00:00.000Z'), id: ids('service-restore'), onStatus: () => {}});
  const control = await service.prepareRestore({restoreJobId: 'restore-service-1', previewId: 'b'.repeat(64)});
  assert.equal(control.operationId, 'restore-service-1');
  assert.equal(state.commerce.control.operation, 'restore');
  assert.equal(state.restoreJobs.find(({id}) => id === 'restore-service-1').phase, 'published');
});

test('v3 backup carries the complete verified economy without local jobs, etags or tokens', async () => {
  const source = await migratingState();
  const integration = createCommerceIntegration({
    now: () => new Date('2026-09-26T10:00:00.000Z'), id: ids('backup-local'),
  });
  const activation = await integration.prepareActivationCandidate({
    state: source, control: source.commerce.control, input: null, history: null, reserve: ids('backup-upload'),
  });
  const values = new Map(activation.uploads.map(({ref, value}) => [ref.id, value]));
  const history = await readHistory({head: activation.candidate, binding: BINDING,
    cache: {version: 1, head: null, values: []}, read: async fileId => values.get(fileId), onProgress: () => {}});
  const staged = structuredClone(source);
  staged.restoreJobs.push({...activation.publication, phase: 'published'});
  staged.commerce.mode = 'active'; staged.commerce.head = activation.candidate; staged.commerce.cache = history.cache;
  staged.commerce.selection = [{profileId: 'p1', figureId: 'explorer-girl', stage: 1}];
  staged.commerce.control = {...staged.commerce.control,phase:'confirmed',epochId:activation.epochId,
    candidate:activation.candidate,etag:'"private-etag"',uploads:activation.uploads,pointerProperties:{
      app:'vokabeltrainer-purchases',kind:'coordinator',datasetId:'d1',descriptorFileId:'descriptor-file-1',
      descriptorHash:staged.commerce.config.descriptorHash,coordinatorId:'coordinator-1',contentFolderId:'content-1',
      purchaseHeadId:activation.candidate.id,purchaseHeadSha256:activation.candidate.sha256}};
  const active = await integration.applyConfirmedControl({state:staged,control:staged.commerce.control,history});
  const fixture = createFixture();
  const activeEpochId = resolveActive(active);
  const offlineStart = fixture.event('round.started', {
    roundId: 'offline-round', profileId: 'p1', mode: 'all', size: 10,
  }, {id: 'offline-start', epochId: activeEpochId, deviceId: active.deviceId, clock: 201});
  const offlineAnswer = fixture.answer({
    id: 'offline-answer', roundId: 'offline-round', profileId: 'p1', ordinal: 1,
    epochId: activeEpochId, deviceId: active.deviceId, clock: 202,
  });
  const offlineCompleted = fixture.event('round.completed', {
    roundId: 'offline-round', profileId: 'p1', reason: 'exhausted', answerIds: ['offline-answer'],
  }, {id: 'offline-completed', epochId: activeEpochId, deviceId: active.deviceId, clock: 203});
  active.ledger.events.push(offlineStart, offlineAnswer, offlineCompleted);
  active.clock = 203;
  const offlineViewService = createPurchaseService({
    commands: {getState: () => structuredClone(active), commitExternal: async () => assert.fail('read-only view')},
    transport: {readFolder: async () => assert.fail('read-only view')}, sync: {},
    now: () => new Date('2026-09-26T11:00:00.000Z'),
    id: ids('offline-view'), onStatus: () => {},
  });
  assert.equal((await offlineViewService.getView()).accounts.p1.earnedPoints,
    history.projection.accounts.p1.earnedPoints + 30);
  const backup = await exportBackup(active, '2026-09-26T11:00:00.000Z');
  assert.equal(backup.formatVersion, 3);
  assert.equal(backup.economy.kind, 'economy-backup');
  assert.deepEqual(backup.economy.selection, active.commerce.selection);
  const checkpoint = backup.economy.entries.values.find(({ref}) => ref.id === backup.economy.head.id);
  assert.equal(checkpoint.value.operation, 'checkpoint');
  assert.deepEqual(checkpoint.value.previous, activation.candidate);
  await assert.rejects(replayHistory({
    entries: backup.economy.entries, bases: backup.economy.bases, binding: backup.economy.binding,
  }), {code: 'history'});
  const targetSuccessorValue = {
    version: 1, kind: 'receipt', datasetId: 'd1', coordinatorId: checkpoint.value.coordinatorId,
    sequence: checkpoint.value.sequence + 1, previous: checkpoint.ref,
    operationId: 'target-after-checkpoint', operation: 'purchase', epochId: checkpoint.value.epochId,
    basis: checkpoint.value.basis,
    intent: {
      version: 1, operationId: 'target-after-checkpoint', datasetId: 'd1', profileId: 'p1',
      epochId: checkpoint.value.epochId, articleId: 'evolution:explorer-girl:2',
      catalogVersion: 1, price: 200, confirmed: true,
    },
    economy: null,
  };
  const targetSuccessor = {id: 'target-after-checkpoint', sha256: await digest(targetSuccessorValue)};
  const targetEntries = structuredClone(backup.economy.entries);
  targetEntries.head = targetSuccessor;
  targetEntries.values.push({ref: targetSuccessor, value: targetSuccessorValue});
  await assert.rejects(replayHistory({
    entries: targetEntries, bases: backup.economy.bases, binding: backup.economy.binding,
  }), {code: 'history'});
  const portableProjection = await replayHistory({
    entries: backup.economy.entries, bases: backup.economy.bases, binding: backup.economy.binding,
    sourceProvenance: true,
  });
  assert.equal(portableProjection.accounts.p1.earnedPoints, history.projection.accounts.p1.earnedPoints + 30);
  assert.equal(portableProjection.accounts.p1.spentPoints, history.projection.accounts.p1.spentPoints);
  const repeated = await exportBackup(active, '2026-09-26T11:05:00.000Z');
  assert.deepEqual(repeated.economy.head, backup.economy.head);
  const serialized = JSON.stringify(backup);
  for (const forbidden of ['private-etag','pointer-pending','access_token','jobs']) assert.equal(serialized.includes(forbidden), false);
  await validateBackup(backup);
  const drive = new SyntheticDrive(); drive.account = 'account-1';
  const uploads = await planSnapshotUploads(backup, 'safety', drive);
  for (const upload of uploads) await uploadVerified(drive, BINDING, upload);
  const manifest = uploads.find(({kind}) => kind === 'snapshot-manifest');
  const roundTrip = await readSnapshot({drive, binding: BINDING, fileId: manifest.fileId, descriptor: active.ledger.descriptor});
  assert.deepEqual(roundTrip.backup.economy, backup.economy);
  const missing = structuredClone(backup);
  missing.economy.entries.values = missing.economy.entries.values.slice(1);
  await assert.rejects(validateBackup(missing), error => ['history','reference','integrity'].includes(error.code));
  const manipulated = structuredClone(backup);
  manipulated.economy.selection = [{profileId: 'p1', figureId: 'not-entitled', stage: 4}];
  await assert.rejects(validateBackup(manipulated), {code: 'entitlement'});
  const reidentified = structuredClone(backup);
  const changedCheckpoint = reidentified.economy.entries.values
    .find(({ref}) => ref.id === reidentified.economy.head.id);
  changedCheckpoint.value.operationId = 'changed-checkpoint-identity';
  changedCheckpoint.ref.sha256 = await digest(changedCheckpoint.value);
  reidentified.economy.head.sha256 = changedCheckpoint.ref.sha256;
  reidentified.economy.entries.head.sha256 = changedCheckpoint.ref.sha256;
  await assert.rejects(validateBackup(reidentified), {code: 'integrity'});

  const incomplete = structuredClone(active);
  incomplete.commerce.cache.values = incomplete.commerce.cache.values.filter(({ref}) => ref.id !== activation.candidate.id);
  await assert.rejects(exportBackup(incomplete, '2026-09-26T11:10:00.000Z'), {code: 'history'});

  const collision = structuredClone(active);
  collision.ledger.events.push(fixture.answer({
    id: 'offline-answer-collision', roundId: 'offline-round', profileId: 'p1', ordinal: 1,
    wordId: 'w2', revisionId: 'rev-w2', learningId: 'learn-w2',
    epochId: activeEpochId, deviceId: 'other-device', clock: 204,
  }));
  await assert.rejects(exportBackup(collision, '2026-09-26T11:15:00.000Z'), {code: 'collision'});
});

test('frozen v2 commands, sync and restore closure is byte exact and stops an in-flight restore at a v3 marker', async () => {
  const base = new URL('../compat/v2/', import.meta.url);
  const manifest = JSON.parse(await readFile(new URL('source-manifest.json', base), 'utf8'));
  assert.equal(manifest.revision, '777b3511e280f37de7aa0a940ca86b6b16a5fdbf');
  assert.deepEqual(manifest.roots, [
    'src/trainer/commands.js', 'src/trainer/sync/drive.js', 'src/trainer/backup/restore.js',
  ]);
  for (const entry of manifest.files) {
    const bytes = await readFile(new URL(entry.path, base));
    assert.equal(bytes.length, entry.bytes, entry.path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.sha256, entry.path);
  }

  const now = () => new Date('2026-09-20T10:00:00.000Z');
  const store = memoryStore(productState(createFixture().base));
  const commands = await frozenV2Commands({store, now, id: sequenceIds('v2-command'), deviceId: 'dev1', onChange() {}});
  const drive = new SyntheticDrive();
  const sync = frozenV2Sync({drive, store, commands, now, id: sequenceIds('v2-sync'), onStatus() {}});
  await sync.createDataset('Frozen v2');
  const sharedBase = commands.getState();
  const restore = frozenV2Restore({commands, store, sync, drive, now, id: sequenceIds('v2-restore')});
  const backup = await frozenV2Backup(commands.getState(), now().toISOString());
  const preview = await restore.prepare(backup);
  drive.loseUploadKind = 'snapshot-part';
  await assert.rejects(restore.confirm(preview.previewId), {code: 'network'});
  assert.equal(commands.getState().restoreJobs.some(({phase}) => phase === 'uploading'), true);

  const binding = commands.getState().binding;
  const currentState = structuredClone(sharedBase);
  currentState.deviceId = 'new-client';
  const currentStore = memoryStore(currentState);
  const currentCommands = await createCommands({
    store: currentStore, now, id: sequenceIds('current-command'), deviceId: 'new-client', onChange() {},
  });
  const descriptorHash = await digest(currentCommands.getState().ledger.descriptor);
  const config = {
    version: 1, kind: 'purchase-config', binding, descriptorHash,
    coordinatorId: 'v3-coordinator', contentFolderId: 'v3-content',
  };
  const configRef = {id: 'v3-config', sha256: await digest(config)};
  const activationState = currentCommands.getState();
  activationState.commerce = emptyCommerce();
  activationState.commerce.mode = 'migrating';
  activationState.commerce.binding = structuredClone(binding);
  activationState.commerce.config = structuredClone(config);
  activationState.commerce.configRef = structuredClone(configRef);
  activationState.commerce.control = {
    version: 1, operationId: 'v3-activation', operation: 'initialize', phase: 'intent',
    epochId: null, head: null, etag: null, candidate: null, pointerProperties: null, uploads: [],
  };
  const prepare = createCommerceIntegration({now, id: sequenceIds('v3-prepare')});
  const activation = await prepare.prepareActivationCandidate({
    state: activationState, control: activationState.commerce.control, reserve: sequenceIds('v3-file'),
  });
  for (const upload of activation.publication.uploads) await uploadVerified(drive, binding, upload);
  const values = new Map([
    [configRef.id, config],
    ...activation.uploads.map(({ref, value}) => [ref.id, value]),
  ]);
  const purchaseTransport = {
    binding, descriptorHash,
    async readFolder({kind}) {
      if (kind === 'dataset') return {properties: {
        purchaseApp: 'vokabeltrainer-purchases', purchaseConfigId: configRef.id,
        purchaseConfigSha256: configRef.sha256,
      }};
      return {properties: {
        purchaseHeadId: activation.candidate.id, purchaseHeadSha256: activation.candidate.sha256,
      }};
    },
    async readImmutable(ref) { return structuredClone(values.get(ref.id)); },
  };
  const commerce = createCommerceIntegration({transportFor: async () => purchaseTransport, now, id: sequenceIds('v3-commerce')});
  const currentSync = createProductSync({
    drive, store: currentStore, commands: currentCommands, commerce, now,
    id: sequenceIds('current-sync'), onStatus() {},
  });
  const offset = drive.calls.length;
  await assert.rejects(sync.sync(), {code: 'version'});
  assert.equal(drive.calls.slice(offset).some(([method]) => method === 'putJson'), false);
  assert.equal(commands.getState().restoreJobs.some(({phase}) => phase === 'uploading'), true);
  await currentSync.sync();
  assert.equal(resolveEpochs(currentCommands.getState().ledger).activeEpochId, activation.epochId);

  await restore.confirm(preview.previewId);
  const lateEpoch = commands.getState().restoreJobs.find(({previewId}) => previewId === preview.previewId).epoch;
  assert.equal(commands.getState().restoreJobs.some(({phase}) => phase === 'activated'), true);
  await currentSync.sync();
  const afterLateUpload = currentCommands.getState();
  assert.equal(resolveEpochs(afterLateUpload.ledger).activeEpochId, activation.epochId);
  assert.equal(afterLateUpload.ledger.epochs.some(({id}) => id === lateEpoch.id), false);
  assert.equal(afterLateUpload.ledger.historicalEpochs.some(({id}) => id === lateEpoch.id), true);
  assert.equal([...drive.files.values()].some(({value}) => value?.kind === 'epoch' && value.id === lateEpoch.id), true);
  currentSync.destroy();
  sync.destroy();
});
