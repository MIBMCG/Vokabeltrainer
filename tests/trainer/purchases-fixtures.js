import {digest} from '../../src/trainer/model/canonical.js';
import {createFixture} from './fixtures.js';

export const BINDING = Object.freeze({
  accountId: 'account-1',
  folderId: 'dataset-folder-1',
  descriptorFileId: 'descriptor-file-1',
  datasetId: 'd1',
});

export function rebindLedger(value, {datasetId, epochId}) {
  const ledger = structuredClone(value);
  ledger.descriptor.datasetId = datasetId;
  ledger.descriptor.rootEpochId = epochId;
  for (const entry of ledger.events) {
    entry.datasetId = datasetId;
    entry.epochId = epochId;
  }
  for (const entry of ledger.epochs) {
    entry.datasetId = datasetId;
    entry.id = epochId;
    entry.parents = [];
    entry.snapshotId = null;
    entry.snapshotManifestFileId = null;
  }
  for (const entry of ledger.snapshots) entry.datasetId = datasetId;
  for (const entry of ledger.historicalEpochs) entry.datasetId = datasetId;
  return ledger;
}

export function earnedLedger({datasetId = 'd1', epochId = 'e0', correct = 30} = {}) {
  const f = createFixture();
  const ledger = structuredClone(f.base);
  const profile2 = f.event('entity.revised', {
    entityType: 'profile', entityId: 'p2', parents: [],
    value: {name: 'Ben', archived: false},
  }, {id: 'rev-p2'});
  ledger.events.find(({id}) => id === 'rev-l1').payload.value.profileIds = ['p1', 'p2'];
  ledger.events.push(profile2);
  for (const profileId of ['p1', 'p2']) {
    const roundId = `round-${profileId}`;
    ledger.events.push(f.event('round.started', {
      roundId, profileId, mode: 'all', size: correct,
    }, {id: `start-${profileId}`}));
    for (let ordinal = 1; ordinal <= correct; ordinal += 1) {
      ledger.events.push(f.answer({
        id: `answer-${profileId}-${ordinal}`,
        roundId,
        profileId,
        ordinal,
      }));
    }
  }
  return rebindLedger(ledger, {datasetId, epochId});
}

export async function referenced(value, id) {
  return {ref: {id, sha256: await digest(value)}, value: structuredClone(value)};
}

export function intent(overrides = {}) {
  return {
    version: 1,
    operationId: 'purchase-1',
    datasetId: 'd1',
    profileId: 'p1',
    epochId: 'e0',
    articleId: 'evolution:explorer-girl:2',
    catalogVersion: 1,
    price: 200,
    confirmed: true,
    ...structuredClone(overrides),
  };
}

export function receipt(overrides = {}) {
  return {
    version: 1,
    kind: 'receipt',
    datasetId: 'd1',
    coordinatorId: 'coordinator-1',
    sequence: 0,
    previous: null,
    operationId: 'initialize-1',
    operation: 'initialize',
    epochId: 'e0',
    basis: null,
    intent: null,
    economy: {version: 1, kind: 'economic-snapshot', source: null},
    ...structuredClone(overrides),
  };
}

export function memoryReader(values) {
  const byId = new Map(values.map(({ref, value}) => [ref.id, structuredClone(value)]));
  return async (id) => {
    if (!byId.has(id)) throw Object.assign(new Error(`missing ${id}`), {code: 'not-found'});
    return structuredClone(byId.get(id));
  };
}
