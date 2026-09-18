


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


export {sequenceIds, memoryStore, productState, SyntheticDrive, makeCommands, setupSyntheticSync};
