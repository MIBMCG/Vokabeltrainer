import {ProductError} from '../model/errors.js';
import {assertLedger, mergeEvents} from '../model/schema.js';
import {COMMERCE_VERSION, CURRENT_VERSION} from '../model/versions.js';
import {resolveEpochs} from '../model/epochs.js';
import {project} from '../learning/progress.js';
import {exportBackup, snapshotHash} from '../backup/format.js';
import {planSnapshotUploads, uploadVerified} from '../backup/transport.js';
import {productStateHash} from '../commands.js';
import {packBasis, verifyBasisRecord} from './basis.js';
import {packProof} from './proof.js';
import {rebuildAccounts} from './projection.js';
import {readHistory} from './history.js';
import {PURCHASE_APP} from './transport.js';
import {assertCommerce, assertConfig} from './schema.js';
import {canonical, copy, digest, refFor, sameBinding, sameRef} from './value.js';

function fail(code, message) {
  throw new ProductError(code, message);
}

function requireFunction(value, name) {
  if (typeof value !== 'function') fail('invalid', `Der Commerce-Adapter benötigt ${name}.`);
  return value;
}

function targetSnapshot(backup, snapshotId, datasetId) {
  return {
    ...copy(backup.snapshot),
    id: snapshotId,
    datasetId,
  };
}

function mergeExactById(left, right, label) {
  const values = new Map();
  for (const value of [...left, ...right]) {
    const previous = values.get(value.id);
    if (previous && canonical(previous) !== canonical(value)) fail('collision', `${label} enthält widersprüchliche IDs.`);
    if (!previous) values.set(value.id, copy(value));
  }
  return [...values.values()];
}

function historicalEpoch(epoch) {
  const {id: epochId, datasetId, parents, deviceId, clock, occurredAt} = epoch;
  return {id: epochId, datasetId, parents: copy(parents), deviceId, clock, occurredAt};
}

function economyProofObjects(economy) {
  const objects = new Map();
  const add = (ref, value) => {
    const previous = objects.get(ref.id);
    if (previous && canonical(previous.value) !== canonical(value)) {
      fail('collision', 'Die portable Kaufherkunft enthält widersprüchliche Datei-IDs.');
    }
    if (!previous) objects.set(ref.id, {ref: copy(ref), value: copy(value)});
  };
  for (const entry of economy.entries.values) add(entry.ref, entry.value);
  for (const basis of economy.bases) {
    add(basis.ref, basis.manifest);
    for (const part of basis.parts) add(part.ref, part.value);
  }
  for (const proof of economy.entries.proofs) {
    add(proof.ref, proof.manifest);
    for (const object of proof.objects) add(object.stored, object.value);
  }
  return [...objects.values()];
}

export function createCommerceIntegration({
  commands = null, learningSync = null, drive = null, transportFor = null, now, id,
} = {}) {
  const clock = requireFunction(now, 'eine Zeitquelle');
  const createId = requireFunction(id, 'eine ID-Quelle');

  function configRefFromDataset(snapshot) {
    const properties = snapshot?.properties ?? {};
    const keys = ['purchaseApp', 'purchaseConfigId', 'purchaseConfigSha256'];
    const present = keys.filter(key => Object.hasOwn(properties, key));
    if (present.length === 0) return null;
    if (present.length !== keys.length || properties.purchaseApp !== PURCHASE_APP) {
      fail('binding', 'Der Kaufkonfigurationsverweis des Datensatzes ist unvollständig.');
    }
    return {id: properties.purchaseConfigId, sha256: properties.purchaseConfigSha256};
  }

  function headFromCoordinator(snapshot) {
    const properties = snapshot?.properties ?? {};
    const keys = ['purchaseHeadId', 'purchaseHeadSha256'];
    const present = keys.filter(key => Object.hasOwn(properties, key));
    if (present.length === 0) return null;
    if (present.length !== keys.length) fail('binding', 'Der gemeinsame Kaufkopf ist unvollständig.');
    return {id: properties.purchaseHeadId, sha256: properties.purchaseHeadSha256};
  }

  async function authoritativeState(state, history) {
    if (history?.projection === undefined || !sameRef(history.entries?.head, history.projection.head)) {
      fail('history', 'Der gemeinsame Kaufkopf ist nicht vollständig geprüft.');
    }
    const record = history.bases.find(entry => sameRef(entry.ref, history.projection.basis));
    if (!record) fail('history', 'Dem bestätigten Kaufkopf fehlt sein vollständiger Fachstand.');
    const verified = await verifyBasisRecord(record);
    if (await digest(verified.ledger.descriptor) !== await digest(state.ledger.descriptor)) {
      fail('binding', 'Der bestätigte Kaufkopf gehört zu einer anderen Datensatzbeschreibung.');
    }
    const authoritative = resolveEpochs(verified.ledger);
    if (authoritative.epochConflict || authoritative.activeEpochId !== history.projection.activeEpochId) {
      fail('history', 'Kaufkopf und bestätigte aktive Epoche widersprechen sich.');
    }
    const activeIds = new Set(verified.ledger.epochs.map(({id: epochId}) => epochId));
    const lateHistory = state.ledger.epochs.filter(({id: epochId}) => !activeIds.has(epochId)).map(historicalEpoch);
    const ledger = assertLedger({
      ...copy(verified.ledger),
      events: mergeEvents(verified.ledger.events, state.ledger.events),
      snapshots: mergeExactById(verified.ledger.snapshots, state.ledger.snapshots, 'Die Sicherungsstände'),
      historicalEpochs: mergeExactById(verified.ledger.historicalEpochs, [
        ...state.ledger.historicalEpochs,
        ...lateHistory,
      ], 'Die Epochenherkunft'),
    });
    const next = copy(state);
    next.ledger = ledger;
    next.clock = Math.max(next.clock, ...ledger.events.map(entry => entry.clock),
      ...ledger.epochs.map(entry => entry.clock), ...ledger.historicalEpochs.map(entry => entry.clock));
    for (const round of Object.values(next.rounds)) {
      if (round.epochId !== history.projection.activeEpochId && !['completed', 'abandoned'].includes(round.status)) {
        round.status = 'abandoned';
        round.current = null;
        round.feedback = null;
      }
    }
    return next;
  }

  async function prepareActivationCandidate({state, control, reserve} = {}) {
    const commerce = assertCommerce(state?.commerce);
    if (commerce.mode !== 'migrating' || control?.operation !== 'initialize'
      || control.phase !== 'intent' || commerce.config === null) {
      fail('not-ready', 'Die gemeinsame Kaufaktivierung ist nicht vorbereitet.');
    }
    const resolved = resolveEpochs(state.ledger);
    const learning = project(state.ledger);
    if (resolved.epochConflict || learning.conflicts.length > 0 || learning.integrityProblems.length > 0
      || resolved.activeEpochId === null) {
      fail('incomplete', 'Der Lernstand ist für die Kaufaktivierung nicht eindeutig.');
    }
    const backup = await exportBackup(state, clock().toISOString(), {selectedEpochId: resolved.activeEpochId});
    const snapshotId = createId();
    const snapshot = targetSnapshot(backup, snapshotId, state.ledger.descriptor.datasetId);
    snapshot.contentHash = await snapshotHash(snapshot, backup.events);
    const targetBackup = {...backup, snapshot};
    const idDrive = drive && typeof drive.generateId === 'function'
      ? drive
      : {generateId: async () => createId()};
    const publicationUploads = await planSnapshotUploads(targetBackup, 'restore', idDrive);
    const manifestFileId = publicationUploads.find(({kind}) => kind === 'snapshot-manifest')?.fileId;
    if (typeof manifestFileId !== 'string') fail('invalid', 'Der Aktivierungsmarker hat kein Snapshot-Manifest.');
    const epochFileId = await idDrive.generateId();
    const epoch = {
      ...COMMERCE_VERSION,
      kind: 'epoch',
      id: createId(),
      datasetId: state.ledger.descriptor.datasetId,
      parents: [resolved.activeEpochId],
      deviceId: state.deviceId,
      clock: Math.max(state.clock, ...state.ledger.epochs.map(entry => entry.clock)) + 1,
      occurredAt: clock().toISOString(),
      snapshotId,
      snapshotManifestFileId: manifestFileId,
    };
    const ledger = assertLedger({
      ...copy(state.ledger),
      snapshots: [...state.ledger.snapshots, snapshot],
      epochs: [...state.ledger.epochs, epoch],
    });
    const basis = await packBasis(ledger, reserve);
    const receipt = {
      version: 1,
      kind: 'receipt',
      datasetId: commerce.binding.datasetId,
      coordinatorId: commerce.config.coordinatorId,
      sequence: 0,
      previous: null,
      operationId: control.operationId,
      operation: 'initialize',
      epochId: epoch.id,
      basis: copy(basis.ref),
      intent: null,
      economy: {version: 1, kind: 'economic-snapshot', source: null},
    };
    const receiptRef = await refFor(await reserve({kind: 'receipt', index: null}), receipt);
    publicationUploads.push({
      kind: 'epoch', logicalId: epoch.id, fileId: epochFileId, value: copy(epoch), verified: false,
    });
    return {
      epochId: epoch.id,
      candidate: receiptRef,
      uploads: [...basis.parts, {ref: basis.ref, value: basis.manifest}, {ref: receiptRef, value: receipt}],
      publication: {
        id: control.operationId,
        phase: 'uploading',
        backup: targetBackup,
        previewId: null,
        parentHeads: copy(resolved.heads),
        safetyCopyId: null,
        snapshot,
        uploads: publicationUploads,
        epoch,
      },
    };
  }

  async function prepareRestoreCandidate({state, control, input, history, reserve} = {}) {
    const commerce = assertCommerce(state?.commerce);
    if (commerce.mode !== 'active' || control?.operation !== 'restore' || control.phase !== 'intent'
      || !sameRef(commerce.head, history?.entries?.head)) {
      fail('not-ready', 'Die gemeinsame Wiederherstellung ist nicht vorbereitet.');
    }
    const source = state.restoreJobs.find(({id: jobId}) => jobId === input?.restoreJobId);
    if (!source || source.id !== control.operationId || source.phase !== 'preview'
      || source.previewId !== input?.previewId || source.snapshot === null) {
      fail('stale', 'Die gespeicherte Wiederherstellungsvorschau ist nicht mehr gültig.');
    }
    const datasetId = state.ledger.descriptor.datasetId;
    const events = source.backup.events.map(event => ({...copy(event), datasetId}));
    const importedHistory = source.backup.epochHistory.map(epoch => ({...copy(epoch), datasetId}));
    const snapshot = {...copy(source.snapshot), datasetId};
    snapshot.contentHash = await snapshotHash(snapshot, events);
    const targetBackup = {
      ...copy(source.backup),
      ...(source.backup.formatVersion === 3 ? COMMERCE_VERSION : CURRENT_VERSION),
      descriptor: copy(state.ledger.descriptor),
      snapshot,
      events,
      epochHistory: mergeExactById(importedHistory,
        state.ledger.epochs.map(historicalEpoch), 'Die Restoreherkunft'),
    };
    const idDrive = drive && typeof drive.generateId === 'function'
      ? drive
      : {generateId: async () => createId()};
    const publicationUploads = await planSnapshotUploads(targetBackup, 'restore', idDrive);
    const manifestFileId = publicationUploads.find(({kind}) => kind === 'snapshot-manifest')?.fileId;
    if (typeof manifestFileId !== 'string') fail('invalid', 'Dem Restoremarker fehlt sein Snapshot-Manifest.');
    const epochFileId = await idDrive.generateId();
    const epoch = {
      ...COMMERCE_VERSION,
      kind: 'epoch',
      id: createId(),
      datasetId,
      parents: copy(source.parentHeads),
      deviceId: state.deviceId,
      clock: Math.max(state.clock, ...state.ledger.epochs.map(entry => entry.clock)) + 1,
      occurredAt: clock().toISOString(),
      snapshotId: snapshot.id,
      snapshotManifestFileId: manifestFileId,
    };
    const ledger = assertLedger({
      ...copy(state.ledger),
      events: mergeEvents(state.ledger.events, events),
      snapshots: mergeExactById(state.ledger.snapshots, [snapshot], 'Die Restore-Sicherungsstände'),
      historicalEpochs: mergeExactById(state.ledger.historicalEpochs, importedHistory, 'Die Restoreherkunft'),
      epochs: [...state.ledger.epochs, epoch],
    });
    const basis = await packBasis(ledger, reserve);
    const sourceEconomy = source.backup.formatVersion === 3 ? source.backup.economy : null;
    const proof = sourceEconomy === null ? null : await packProof({
      binding: sourceEconomy.binding,
      head: sourceEconomy.head,
      objects: economyProofObjects(sourceEconomy),
    }, reserve);
    const receipt = {
      version: 1,
      kind: 'receipt',
      datasetId,
      coordinatorId: commerce.config.coordinatorId,
      sequence: history.projection.sequence + 1,
      previous: copy(commerce.head),
      operationId: control.operationId,
      operation: 'restore',
      epochId: epoch.id,
      basis: copy(basis.ref),
      intent: null,
      economy: {version: 1, kind: 'economic-snapshot', source: proof === null ? null : {
        binding: copy(sourceEconomy.binding), head: copy(sourceEconomy.head), proof: copy(proof.ref),
      }},
    };
    const receiptRef = await refFor(await reserve({kind: 'receipt', index: null}), receipt);
    publicationUploads.push({
      kind: 'epoch', logicalId: epoch.id, fileId: epochFileId, value: copy(epoch), verified: false,
    });
    return {
      epochId: epoch.id,
      candidate: receiptRef,
      uploads: [
        ...basis.parts,
        {ref: basis.ref, value: basis.manifest},
        ...(proof === null ? [] : [
          {ref: proof.ref, value: proof.manifest},
          ...proof.objects.map(({stored, value}) => ({ref: stored, value})),
        ]),
        {ref: receiptRef, value: receipt},
      ],
      publication: {
        ...copy(source),
        phase: 'uploading',
        backup: targetBackup,
        snapshot,
        uploads: [...source.uploads, ...publicationUploads],
        epoch,
      },
    };
  }

  async function applyConfirmedControl({state, control, history} = {}) {
    const commerce = assertCommerce(state?.commerce);
    if (control?.phase !== 'confirmed' || history?.projection === undefined
      || !sameRef(commerce.head, history.entries?.head)) {
      fail('not-ready', 'Der gemeinsame Kaufkopf ist noch nicht vollständig bestätigt.');
    }
    const next = await authoritativeState(state, history);
    const publication = next.restoreJobs.find(({id: jobId}) => jobId === control.operationId);
    if (publication) {
      if (control.operation === 'restore' && history.projection.activeEpochId === control.epochId) {
        const targetSelection = publication.backup?.formatVersion === 3
          ? publication.backup.economy.selection
          : [];
        for (const {profileId, figureId, stage} of targetSelection) {
          const account = history.projection.accounts[profileId];
          if (!account?.entitledFigureIds.includes(figureId)
            || !account.entitledEvolutionIds.includes(`evolution:${figureId}:${stage}`)) {
            fail('entitlement', 'Die wiederhergestellte Figurenauswahl ist im bestätigten Kaufstand nicht belegt.');
          }
        }
        next.commerce.selection = copy(targetSelection);
      }
      publication.phase = 'activated';
    }
    return next;
  }

  async function discoverInstalled({state, binding, descriptorHash} = {}) {
    const commerce = assertCommerce(state?.commerce);
    if (typeof transportFor !== 'function') fail('not-ready', 'Die Kaufentdeckung ist nicht angebunden.');
    if (!sameBinding(binding, state?.binding) || await digest(state.ledger.descriptor) !== descriptorHash) {
      fail('binding', 'Die Kaufentdeckung gehört zu einer anderen Produktbindung.');
    }
    const transport = await transportFor({binding: copy(binding), descriptorHash});
    if (!transport || !sameBinding(transport.binding, binding) || transport.descriptorHash !== descriptorHash) {
      fail('binding', 'Der Kauftransport gehört zu einer anderen Produktbindung.');
    }
    const dataset = await transport.readFolder({id: binding.folderId, kind: 'dataset'});
    const configRef = configRefFromDataset(dataset);
    if (configRef === null) {
      if (commerce.mode === 'active' || commerce.config !== null) {
        fail('history', 'Die installierte Kaufkonfiguration fehlt am verbundenen Datensatz.');
      }
      return {state: copy(state), transport};
    }
    const config = assertConfig(await transport.readImmutable(configRef, {kind: 'config'}));
    if (!sameBinding(config.binding, binding) || config.descriptorHash !== descriptorHash) {
      fail('binding', 'Die installierte Kaufkonfiguration gehört zu einem anderen Datensatz.');
    }
    if (commerce.config !== null && (canonical(commerce.config) !== canonical(config)
      || !sameRef(commerce.configRef, configRef))) {
      fail('binding', 'Die lokale Kaufkonfiguration widerspricht dem installierten Anker.');
    }
    const next = copy(state);
    next.commerce = assertCommerce({...commerce, binding: copy(binding), configRef: copy(configRef), config: copy(config)});
    return {state: next, transport};
  }

  async function discover(input = {}) {
    return (await discoverInstalled(input)).state;
  }

  async function reconcile(input = {}) {
    const discovered = await discoverInstalled(input);
    let next = discovered.state;
    const commerce = assertCommerce(next.commerce);
    if (commerce.config === null) return next;
    const {binding} = input;
    const {transport} = discovered;
    const {config, configRef} = commerce;
    const coordinator = await transport.readFolder({id: config.coordinatorId, kind: 'coordinator', config});
    const head = headFromCoordinator(coordinator);
    if (head === null) {
      if (commerce.mode === 'active' || commerce.head !== null) {
        fail('history', 'Der gemeinsame Kaufkopf fehlt.');
      }
      return next;
    }
    const history = await readHistory({
      head, binding, cache: commerce.cache,
      read: (refId, expectedRef) => {
        if (expectedRef === null) fail('history', `Dem Kaufobjekt ${refId} fehlt sein erwarteter Hash.`);
        return transport.readImmutable(expectedRef, {kind: 'content', config});
      },
      onProgress: () => {},
    });
    next.commerce = assertCommerce({
      ...commerce,
      mode: 'active', binding: copy(binding), configRef: copy(configRef), config: copy(config),
      head: copy(head), cache: copy(history.cache),
    });
    next = await authoritativeState(next, history);
    const accounts = rebuildAccounts(project(next.ledger), history.projection.accounts);
    next.commerce.selection = next.commerce.selection.filter(({profileId, figureId, stage}) => {
      const account = accounts[profileId];
      return Boolean(account?.entitledFigureIds.includes(figureId)
        && account.entitledEvolutionIds.includes(`evolution:${figureId}:${stage}`));
    });
    return next;
  }

  async function mutatePublication(operationId, transform) {
    if (!commands || typeof commands.getState !== 'function' || typeof commands.commitExternal !== 'function') {
      fail('not-ready', 'Der dauerhafte Produktspeicher ist nicht angebunden.');
    }
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const current = commands.getState();
      const publication = current.restoreJobs.find(({id: jobId}) => jobId === operationId);
      if (!publication) fail('reference', 'Der gespeicherte Publikationsauftrag fehlt.');
      const next = copy(current);
      const target = next.restoreJobs.find(({id: jobId}) => jobId === operationId);
      transform(target, next);
      try {
        await commands.commitExternal(next, await productStateHash(current));
        return commands.getState().restoreJobs.find(({id: jobId}) => jobId === operationId);
      } catch (error) {
        if (error?.code !== 'stale') throw error;
      }
    }
    fail('stale', 'Der Publikationsauftrag ändert sich fortlaufend.');
  }

  async function publishControl({state, control} = {}) {
    if (!drive || typeof drive.accountId !== 'function' || typeof drive.putJson !== 'function') {
      fail('not-ready', 'Der Produkt-Drive-Transport ist nicht angebunden.');
    }
    if (control?.operationId === undefined || state?.commerce?.control?.operationId !== control.operationId) {
      fail('binding', 'Steuerauftrag und Publikationszustand passen nicht zusammen.');
    }
    let publication = commands.getState().restoreJobs.find(({id: jobId}) => jobId === control.operationId);
    if (!publication) fail('reference', 'Der gespeicherte Publikationsauftrag fehlt.');
    if (publication.phase === 'published' || publication.phase === 'activated') return copy(publication);
    if (publication.phase !== 'uploading') fail('not-ready', 'Der Publikationsauftrag ist nicht sendebereit.');
    for (const pending of publication.uploads.filter(({verified}) => !verified)) {
      await uploadVerified(drive, state.binding, pending);
      publication = await mutatePublication(control.operationId, target => {
        const upload = target.uploads.find(({fileId}) => fileId === pending.fileId);
        if (!upload || canonical(upload.value) !== canonical(pending.value)) {
          fail('collision', 'Der gespeicherte Markerupload wurde verändert.');
        }
        upload.verified = true;
      });
    }
    if (!publication.uploads.every(({verified}) => verified)) fail('pending', 'Die Epochenpublikation ist noch unvollständig.');
    return mutatePublication(control.operationId, target => { target.phase = 'published'; });
  }

  return Object.freeze({
    prepareActivationCandidate,
    prepareRestoreCandidate,
    applyConfirmedControl,
    publishControl,
    discover,
    reconcile,
    async syncLearning() {
      if (typeof learningSync !== 'function') fail('not-ready', 'Der Lernabgleich ist nicht angebunden.');
      return learningSync();
    },
  });
}
