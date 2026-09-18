import {digest} from '../model/canonical.js';
import {ProductError} from '../model/errors.js';
import {assertDescriptor, assertLedger, assertEpoch, mergeEvents} from '../model/schema.js';
import {project} from '../learning/progress.js';
import {productStateHash} from '../commands.js';
import {buildPackets, validatePacket} from './packets.js';
import {mergeById, epochHistory, exportBackup} from '../backup/format.js';
import {readSnapshot, planSnapshotUploads, uploadVerified, localSafetyCopy} from '../backup/transport.js';

const APP = 'vokabeltrainer-product';
const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';
const JSON_MIME_TYPE = 'application/json';
const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

function productError(code, message) {
  return new ProductError(code, message);
}

function assertId(value, label) {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) {
    throw productError('invalid', `${label} ist ungültig.`);
  }
  return value;
}

function own(record, key) {
  return record !== null && typeof record === 'object' && Object.hasOwn(record, key);
}

function queryProperty(key, value) {
  return `appProperties has { key='${key}' and value='${value}' }`;
}

function folderQuery() {
  return [
    'trashed = false',
    `mimeType = '${FOLDER_MIME_TYPE}'`,
    queryProperty('app', APP),
    queryProperty('kind', 'dataset-folder'),
  ].join(' and ');
}

function childQuery(folderId, datasetId, kind = null) {
  assertId(folderId, 'Die Drive-Ordner-ID');
  assertId(datasetId, 'Die Datensatz-ID');
  return [
    'trashed = false',
    `'${folderId}' in parents`,
    queryProperty('app', APP),
    queryProperty('datasetId', datasetId),
    ...(kind === null ? [] : [queryProperty('kind', kind)]),
  ].join(' and ');
}

function assertMetadata(meta, {
  id = null,
  parentId = null,
  kind = null,
  datasetId = null,
  mimeType = null,
} = {}) {
  if (meta === null || typeof meta !== 'object' || Array.isArray(meta)) {
    throw productError('invalid', 'Drive hat ungültige Dateimetadaten geliefert.');
  }
  assertId(meta.id, 'Die Drive-Datei-ID');
  if (id !== null && meta.id !== id) throw productError('binding', 'Die Drive-Datei stimmt nicht mit der Auswahl überein.');
  if (meta.trashed !== false) throw productError('missing', 'Eine benötigte Drive-Datei fehlt.');
  if (mimeType !== null && meta.mimeType !== mimeType) throw productError('invalid', 'Eine Drive-Datei hat den falschen Typ.');
  if (parentId !== null && (!Array.isArray(meta.parents) || meta.parents.length !== 1
    || meta.parents[0] !== parentId)) {
    throw productError('binding', 'Eine Drive-Datei liegt nicht im gebundenen Ordner.');
  }
  if (!meta.appProperties || meta.appProperties.app !== APP) {
    throw productError('binding', 'Eine Drive-Datei gehört nicht zum Vokabeltrainer.');
  }
  if (kind !== null && meta.appProperties.kind !== kind) {
    throw productError('binding', 'Eine Drive-Datei hat eine unerwartete Kennung.');
  }
  if (datasetId !== null && meta.appProperties.datasetId !== datasetId) {
    throw productError('binding', 'Eine Drive-Datei gehört zu einem anderen Datensatz.');
  }
  return meta;
}

function metadataIdentity(value) {
  return JSON.stringify({
    id: value.id,
    name: value.name,
    mimeType: value.mimeType,
    parents: value.parents,
    appProperties: Object.fromEntries(Object.entries(value.appProperties).sort(([left], [right]) => (
      left < right ? -1 : left > right ? 1 : 0
    ))),
    trashed: value.trashed,
  });
}

function statusFromState(state, phase, message, lastConfirmedAt) {
  if (state === null) {
    return {phase: 'local', pendingCount: 0, lateCount: 0, conflictCount: 0, message, lastConfirmedAt};
  }
  let projection;
  try {
    projection = project(state.ledger);
  } catch {
    projection = {lateEvents: [], conflicts: [], epochConflict: false, epochHeads: []};
  }
  const pendingCount = state.outboxEventIds.length + state.pendingPackets.filter(({confirmed}) => !confirmed).length;
  const conflictCount = (projection.conflicts?.length ?? 0)
    + (projection.epochConflict ? Math.max(1, projection.epochHeads?.length ?? 0) : 0);
  return {
    phase,
    pendingCount,
    lateCount: projection.lateEvents?.length ?? 0,
    conflictCount,
    message,
    lastConfirmedAt,
  };
}

function upsertKnown(knownFiles, entry) {
  return [...knownFiles.filter(({fileId}) => fileId !== entry.fileId), entry]
    .sort((left, right) => (left.fileId < right.fileId ? -1 : left.fileId > right.fileId ? 1 : 0));
}

function upsertQuarantine(quarantinedFiles, entry) {
  return [...quarantinedFiles.filter(({fileId}) => fileId !== entry.fileId), entry]
    .sort((left, right) => (left.fileId < right.fileId ? -1 : left.fileId > right.fileId ? 1 : 0));
}

function removeQuarantine(quarantinedFiles, fileId) {
  return quarantinedFiles.filter((entry) => entry.fileId !== fileId);
}

function upsertPacketIntegrity(packetIntegrity, entry) {
  const existing = packetIntegrity.find(({packetId}) => packetId === entry.packetId);
  if (existing && existing.contentHash !== entry.contentHash) {
    throw productError('collision', 'Eine Paket-ID enthält unterschiedliche Drive-Daten.');
  }
  return [...packetIntegrity.filter(({packetId}) => packetId !== entry.packetId), entry]
    .sort((left, right) => (left.packetId < right.packetId ? -1 : left.packetId > right.packetId ? 1 : 0));
}

function isTransportFailure(error) {
  return ['auth', 'network', 'retryable', 'permission', 'missing', 'stale', 'binding'].includes(error?.code);
}

function safeMessage(error, fallback = 'Der Drive-Abgleich ist fehlgeschlagen.') {
  if (error instanceof ProductError || typeof error?.code === 'string') return error.message || fallback;
  return fallback;
}

export function createProductSync({drive, store, commands, now, id, onStatus} = {}) {
  const driveMethods = ['accountId', 'generateId', 'listFiles', 'metadata', 'readJson', 'createFolder', 'putJson'];
  if (!drive || driveMethods.some((method) => typeof drive[method] !== 'function')
    || !store || !commands || typeof commands.getState !== 'function'
    || typeof commands.subscribe !== 'function'
    || typeof commands.commitExternal !== 'function' || typeof now !== 'function'
    || typeof id !== 'function' || typeof onStatus !== 'function') {
    throw productError('invalid', 'Der Produktabgleich ist nicht vollständig konfiguriert.');
  }

  let lastConfirmedAt = null;
  let status = statusFromState(commands.getState(), commands.getState()?.binding ? 'pending' : 'local',
    commands.getState()?.binding ? 'Änderungen sind noch nicht vollständig abgeglichen.' : 'Nur lokal gespeichert.',
    lastConfirmedAt);
  let active = null;
  let rerun = false;
  const sessionVersions = new Map();
  const joinPreviews = new Map();

  function publish(phase, message) {
    status = statusFromState(commands.getState(), phase, message, lastConfirmedAt);
    onStatus(structuredClone(status));
  }

  function reconcileStatus(notify = false) {
    const state = commands.getState();
    let phase = status.phase;
    let message = status.message;
    const measured = statusFromState(state, phase, message, lastConfirmedAt);
    if (state === null || (state.binding === null && state.datasetSetup === null)) {
      phase = 'local';
      message = 'Nur lokal gespeichert.';
    } else if (state.datasetSetup !== null && state.binding === null) {
      phase = 'pending';
      message = 'Die Drive-Einrichtung wartet auf Bestätigung.';
    } else if (state.quarantinedFiles.length > 0) {
      phase = 'error';
      message = 'Mindestens eine Drive-Datei benötigt Aufmerksamkeit.';
    } else if (phase === 'connect' || phase === 'error') {
      // Keep the action-required phase until retry()/sync() explicitly starts a new operation.
    } else if (measured.conflictCount > 0) {
      phase = 'conflict';
      message = 'Ein Datenkonflikt muss geklärt werden.';
    } else if (measured.pendingCount > 0) {
      phase = 'pending';
      message = 'Änderungen sind noch nicht vollständig abgeglichen.';
    } else if (phase !== 'synced') {
      phase = 'pending';
      message = 'Der Datensatz ist verbunden; der Abgleich steht noch aus.';
    }
    const next = statusFromState(state, phase, message, lastConfirmedAt);
    const changed = JSON.stringify(next) !== JSON.stringify(status);
    status = next;
    if (notify && changed) onStatus(structuredClone(status));
    return status;
  }

  function handleError(error) {
    if (error?.code === 'auth') publish('connect', 'Mit Google verbinden, um den Abgleich fortzusetzen.');
    else if (error?.code === 'conflict') publish('conflict', safeMessage(error));
    else publish('error', safeMessage(error));
    throw error;
  }

  async function mutate(transform) {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const current = commands.getState();
      if (current === null) throw productError('not-ready', 'Der Vokabeltrainer ist noch nicht eingerichtet.');
      const expected = await productStateHash(current);
      const next = structuredClone(current);
      const result = await transform(next, current);
      if (result === false) return current;
      try {
        await commands.commitExternal(next, expected);
        return commands.getState();
      } catch (error) {
        if (error?.code !== 'stale') throw error;
      }
    }
    throw productError('stale', 'Der lokale Stand ändert sich fortlaufend; der Abgleich wurde angehalten.');
  }

  async function contentHash(value) {
    return digest(value);
  }

  async function readBracketed(meta) {
    const before = assertMetadata(await drive.metadata(meta.id));
    if (metadataIdentity(before) !== metadataIdentity(meta)) {
      throw productError('stale', 'Eine Drive-Datei wurde vor dem Lesen geändert.');
    }
    const value = await drive.readJson(meta.id);
    const after = assertMetadata(await drive.metadata(meta.id));
    if (metadataIdentity(after) !== metadataIdentity(before)) {
      throw productError('stale', 'Eine Drive-Datei wurde während des Lesens geändert.');
    }
    if (before.version !== undefined && after.version !== undefined && before.version !== after.version) {
      throw productError('stale', 'Eine Drive-Datei wurde während des Lesens geändert.');
    }
    const hash = await contentHash(value);
    if (before.version !== undefined && after.version !== undefined && before.version === after.version) {
      sessionVersions.set(meta.id, {version: after.version, hash});
    } else {
      sessionVersions.delete(meta.id);
    }
    return {value, hash, metadata: after};
  }

  function knownFor(state, fileId) {
    return state.knownFiles.find((entry) => entry.fileId === fileId) ?? null;
  }

  async function readIfNeeded(meta, state, {force = false} = {}) {
    const known = knownFor(state, meta.id);
    const cached = sessionVersions.get(meta.id);
    if (!force && known && meta.version !== undefined && cached
      && cached.version === meta.version && cached.hash === known.contentHash) {
      const fresh = assertMetadata(await drive.metadata(meta.id));
      if (fresh.version === meta.version && metadataIdentity(fresh) === metadataIdentity(meta)) {
        return {skipped: true, hash: known.contentHash, value: null, metadata: fresh};
      }
      meta = fresh;
    }
    const read = await readBracketed(meta);
    if (known && known.contentHash !== read.hash) {
      const error = productError('collision', 'Eine bereits bekannte Drive-Datei wurde nachträglich verändert.');
      error.inspectedValue = read.value;
      throw error;
    }
    return {skipped: false, ...read};
  }

  async function verifyAccount(binding) {
    const accountId = await drive.accountId();
    if (accountId !== binding.accountId) {
      throw productError('binding', 'Dieser Browser ist mit einem anderen Google-Konto verbunden.');
    }
  }

  async function verifyFolder(binding) {
    const meta = assertMetadata(await drive.metadata(binding.folderId), {
      id: binding.folderId,
      kind: 'dataset-folder',
      datasetId: binding.datasetId,
      mimeType: FOLDER_MIME_TYPE,
    });
    return meta;
  }

  async function readDescriptor({folderId, descriptorFileId, datasetId}) {
    const meta = assertMetadata(await drive.metadata(descriptorFileId), {
      id: descriptorFileId,
      parentId: folderId,
      kind: 'dataset',
      datasetId,
      mimeType: JSON_MIME_TYPE,
    });
    const read = await readBracketed(meta);
    const descriptor = assertDescriptor(read.value);
    if (descriptor.datasetId !== datasetId) {
      throw productError('binding', 'Die Datensatzbeschreibung gehört zu einem anderen Datensatz.');
    }
    return {...read, descriptor};
  }

  async function rootEpochFor(folderId, descriptor) {
    const files = await drive.listFiles(childQuery(folderId, descriptor.datasetId, 'epoch'));
    const matches = files.filter((meta) => meta.appProperties.epochId === descriptor.rootEpochId);
    if (matches.length !== 1) {
      throw productError('missing', 'Die unveränderliche Wurzelepoche fehlt oder ist nicht eindeutig.');
    }
    const meta = assertMetadata(matches[0], {
      parentId: folderId,
      kind: 'epoch',
      datasetId: descriptor.datasetId,
      mimeType: JSON_MIME_TYPE,
    });
    if (meta.appProperties.epochId !== descriptor.rootEpochId) {
      throw productError('binding', 'Die Wurzelepoche hat eine falsche Kennung.');
    }
    const read = await readBracketed(meta);
    const ledger = assertLedger({
      descriptor,
      events: [],
      epochs: [read.value],
      snapshots: [],
      historicalEpochs: [],
    });
    return {...read, epoch: ledger.epochs[0], fileId: meta.id};
  }

  async function discover() {
    try {
      await drive.accountId();
      const folders = await drive.listFiles(folderQuery());
      const results = [];
      for (const rawFolder of folders) {
        const folder = assertMetadata(rawFolder, {kind: 'dataset-folder', mimeType: FOLDER_MIME_TYPE});
        const datasetId = assertId(folder.appProperties.datasetId, 'Die Datensatz-ID');
        const descriptors = await drive.listFiles(childQuery(folder.id, datasetId, 'dataset'));
        for (const rawDescriptor of descriptors) {
          const descriptorMeta = assertMetadata(rawDescriptor, {
            parentId: folder.id, kind: 'dataset', datasetId, mimeType: JSON_MIME_TYPE,
          });
          const read = await readBracketed(descriptorMeta);
          const descriptor = assertDescriptor(read.value);
          if (descriptor.datasetId !== datasetId) {
            throw productError('binding', 'Eine Datensatzbeschreibung hat eine widersprüchliche Kennung.');
          }
          results.push({folderId: folder.id, descriptorFileId: descriptorMeta.id, descriptor});
        }
      }
      return results.sort((left, right) => left.descriptor.datasetId.localeCompare(right.descriptor.datasetId, 'en'));
    } catch (error) {
      return handleError(error);
    }
  }

  async function prepareDatasetSetup(name) {
    const state = commands.getState();
    if (state === null) throw productError('not-ready', 'Der Vokabeltrainer ist noch nicht eingerichtet.');
    if (state.binding !== null) throw productError('binding', 'Dieser Browser ist bereits mit einem Datensatz verbunden.');
    if (state.datasetSetup !== null) {
      if (typeof name === 'string' && name.trim() !== state.datasetSetup.name) {
        throw productError('stale', 'Die bereits begonnene Drive-Einrichtung verwendet einen anderen Ordnernamen.');
      }
      return state.datasetSetup;
    }
    if (typeof name !== 'string' || name.trim() === '') throw productError('invalid', 'Der Drive-Ordnername fehlt.');
    const {descriptor} = state.ledger;
    const rootEpoch = state.ledger.epochs.find(({id: epochId}) => epochId === descriptor.rootEpochId);
    if (!rootEpoch) throw productError('reference', 'Die lokale Wurzelepoche fehlt.');
    const accountId = await drive.accountId();
    const folderId = await drive.generateId();
    const epochFileId = await drive.generateId();
    const descriptorFileId = await drive.generateId();
    const setup = {
      accountId,
      name: name.trim(),
      folderId,
      descriptorFileId,
      epochFileId,
      datasetId: descriptor.datasetId,
      descriptor: structuredClone(descriptor),
      rootEpoch: structuredClone(rootEpoch),
    };
    const descriptorHash = await contentHash(descriptor);
    const rootEpochHash = await contentHash(rootEpoch);
    await mutate(async (next) => {
      if (next.binding !== null) throw productError('binding', 'Die Drive-Bindung wurde inzwischen geändert.');
      if (next.datasetSetup !== null) {
        if (await contentHash(next.datasetSetup) !== await contentHash(setup)) {
          throw productError('collision', 'Es gibt zwei verschiedene Aufträge zur Drive-Einrichtung.');
        }
        return false;
      }
      const nextEpochHashes = await Promise.all(next.ledger.epochs.map((epoch) => contentHash(epoch)));
      if (await contentHash(next.ledger.descriptor) !== descriptorHash
        || !nextEpochHashes.includes(rootEpochHash)) {
        throw productError('stale', 'Der lokale Datensatz wurde inzwischen geändert.');
      }
      next.datasetSetup = setup;
    });
    return commands.getState().datasetSetup;
  }

  async function resumeDatasetSetup() {
    const setup = commands.getState()?.datasetSetup;
    if (setup === null || setup === undefined) return false;
    const accountId = await drive.accountId();
    if (accountId !== setup.accountId) {
      throw productError('binding', 'Die Drive-Einrichtung gehört zu einem anderen Google-Konto.');
    }
    await drive.createFolder({
      id: setup.folderId,
      name: setup.name,
      appProperties: {app: APP, kind: 'dataset-folder', datasetId: setup.datasetId},
    });
    await publishLocalEpochs(setup);
    await drive.putJson({
      id: setup.epochFileId,
      name: `epoch-${setup.rootEpoch.id}.json`,
      parentId: setup.folderId,
      appProperties: {
        app: APP, kind: 'epoch', datasetId: setup.datasetId, epochId: setup.rootEpoch.id,
      },
      value: setup.rootEpoch,
    });
    await drive.putJson({
      id: setup.descriptorFileId,
      name: 'dataset.json',
      parentId: setup.folderId,
      appProperties: {app: APP, kind: 'dataset', datasetId: setup.datasetId},
      value: setup.descriptor,
    });
    const epochHash = await contentHash(setup.rootEpoch);
    const descriptorHash = await contentHash(setup.descriptor);
    const setupHash = await contentHash(setup);
    await mutate(async (next) => {
      if (next.binding !== null) throw productError('binding', 'Die Drive-Bindung wurde inzwischen geändert.');
      if (next.datasetSetup === null || await contentHash(next.datasetSetup) !== setupHash) {
        throw productError('stale', 'Der Auftrag zur Drive-Einrichtung wurde inzwischen geändert.');
      }
      const localRoot = next.ledger.epochs.find(({id: epochId}) => epochId === setup.rootEpoch.id);
      if (await contentHash(next.ledger.descriptor) !== descriptorHash
        || localRoot === undefined || await contentHash(localRoot) !== epochHash) {
        throw productError('stale', 'Der lokale Datensatz wurde inzwischen geändert.');
      }
      next.binding = {
        accountId: setup.accountId,
        folderId: setup.folderId,
        descriptorFileId: setup.descriptorFileId,
        datasetId: setup.datasetId,
      };
      next.knownFiles = upsertKnown(next.knownFiles, {
        fileId: setup.epochFileId, contentHash: epochHash, kind: 'epoch',
      });
      next.knownFiles = upsertKnown(next.knownFiles, {
        fileId: setup.descriptorFileId, contentHash: descriptorHash, kind: 'dataset',
      });
      next.datasetSetup = null;
    });
    publish('pending', 'Der Datensatz ist verbunden; Änderungen werden abgeglichen.');
    return true;
  }

  // Activated offline restore jobs own their reserved IDs even before a binding exists.
  async function publishLocalEpochs(binding) {
    const jobs=commands.getState().restoreJobs.filter(j=>j.phase==='activated' && j.epoch!==null);
    for(const original of jobs) {
      let job=commands.getState().restoreJobs.find(j=>j.id===original.id);
      let manifest=job.uploads.find(u=>u.kind==='snapshot-manifest' && u.value.purpose==='restore');
      if(manifest?.verified && job.uploads.some(u=>u.kind==='epoch' && u.verified)
        && commands.getState().snapshotManifests.some(m=>m.snapshotId===job.snapshot.id))continue;
      if(!manifest) {
        const state=commands.getState(),datasetId=binding.datasetId;
        const backup={...job.backup,descriptor:state.ledger.descriptor,snapshot:job.snapshot,
          events:job.backup.events.map(e=>({...e,datasetId})),
          epochHistory:mergeById(job.backup.epochHistory.map(e=>({...e,datasetId})),epochHistory(state.ledger))};
        const uploads=await planSnapshotUploads(backup,'restore',drive);
        await mutate(next=>{next.restoreJobs.find(j=>j.id===job.id).uploads.push(...uploads);});
        job=commands.getState().restoreJobs.find(j=>j.id===job.id);
        manifest=job.uploads.find(u=>u.kind==='snapshot-manifest' && u.value.purpose==='restore');
      }
      const ids=new Set([...manifest.value.parts.map(p=>p.fileId),manifest.fileId]);
      for(const upload of job.uploads.filter(u=>ids.has(u.fileId))) {
        await uploadVerified(drive,binding,upload);
        await mutate(next=>{next.restoreJobs.find(j=>j.id===job.id).uploads.find(u=>u.fileId===upload.fileId).verified=true;});
      }
      await mutate(next=>{const found=next.snapshotManifests.find(m=>m.snapshotId===job.snapshot.id);
        if(!found)next.snapshotManifests.push({snapshotId:job.snapshot.id,fileId:manifest.fileId});});
      let control=job.uploads.find(u=>u.kind==='epoch');
      if(!control) {
        control={kind:'epoch',logicalId:job.epoch.id,fileId:await drive.generateId(),value:job.epoch,verified:false};
        await mutate(next=>{next.restoreJobs.find(j=>j.id===job.id).uploads.push(control);});
      }
      await uploadVerified(drive,binding,control);
      await mutate(next=>{next.restoreJobs.find(j=>j.id===job.id).uploads.find(u=>u.fileId===control.fileId).verified=true;});
    }
  }

  async function createDataset(name) {
    try {
      await prepareDatasetSetup(name);
      await resumeDatasetSetup();
      await sync();
      return structuredClone(commands.getState().binding);
    } catch (error) {
      return handleError(error);
    }
  }

  async function joinDataset(selection, decision) {
    try {
      if (!['preview', 'confirm'].includes(decision)) {
        throw productError('invalid', 'Die Auswahlentscheidung ist ungültig.');
      }
      if (!selection || typeof selection !== 'object') throw productError('invalid', 'Die Datensatzauswahl fehlt.');
      const folderId = assertId(selection.folderId, 'Die Drive-Ordner-ID');
      const descriptorFileId = assertId(selection.descriptorFileId, 'Die Beschreibungsdatei-ID');
      const selectedDescriptor = assertDescriptor(selection.descriptor);
      const accountId = await drive.accountId();
      const folder = assertMetadata(await drive.metadata(folderId), {
        id: folderId, kind: 'dataset-folder', datasetId: selectedDescriptor.datasetId, mimeType: FOLDER_MIME_TYPE,
      });
      const descriptorRead = await readDescriptor({
        folderId, descriptorFileId, datasetId: selectedDescriptor.datasetId,
      });
      if (await contentHash(selectedDescriptor) !== descriptorRead.hash) {
        throw productError('stale', 'Die Datensatzauswahl hat sich inzwischen geändert.');
      }
      const root = await rootEpochFor(folderId, descriptorRead.descriptor);
      const current = commands.getState();
      if (current === null) throw productError('not-ready', 'Der Vokabeltrainer ist noch nicht eingerichtet.');
      if(current.binding!==null)throw productError('binding','Dieser Browser ist bereits verbunden.');
      const binding={accountId,folderId,descriptorFileId,datasetId:selectedDescriptor.datasetId};
      const sameDataset = current.ledger.descriptor.datasetId === descriptorRead.descriptor.datasetId;
      const nonempty = current.ledger.events.length > 0 || current.outboxEventIds.length > 0
        || current.pendingPackets.length > 0 || Object.keys(current.rounds).length > 0;
      const preview = {
        kind: 'preview',
        datasetId: descriptorRead.descriptor.datasetId,
        name: descriptorRead.descriptor.name,
        localEventCount: current.ledger.events.length,
        remoteBootstrapEventCount: 0,
        requiresSafetyCopy: !sameDataset && nonempty,
      };
      let expectedLocalHash=null,remoteState=null;
      if(!sameDataset && nonempty) {
        remoteState=await inspectJoinedDataset(current,binding,descriptorRead.descriptor,root.epoch);
        preview.remoteBootstrapEventCount=remoteState.ledger.events.length;
      }
      if (decision === 'preview') {
        if(preview.requiresSafetyCopy) {
          const safety=await localSafetyCopy({commands,store,now,id,purpose:'join'});
          const freshBackup=await exportBackup(commands.getState(),safety.createdAt);
          if(await digest({...freshBackup,safetyCopyIndex:[]})!==await digest({...safety.backup,safetyCopyIndex:[]})) {
            throw productError('stale','Der lokale Stand wurde während der Sicherung geändert. Bitte eine neue Vorschau öffnen.');
          }
          expectedLocalHash=await productStateHash(commands.getState());
          const previewId=await digest({binding,local:expectedLocalHash,remote:remoteState.ledger,safetyCopyId:safety.id});
          joinPreviews.set(previewId,{expectedLocalHash,remoteHash:await digest(remoteState.ledger),binding,safetyCopyId:safety.id});
          return {...preview,previewId,safetyCopyId:safety.id};
        }
        return {...preview,previewId:null,safetyCopyId:null};
      }
      if (!sameDataset && nonempty) {
        if(!selection.previewId || !selection.safetyCopyId)throw productError('not-ready','Bitte die Sicherheitskopie und Datensatzauswahl ausdrücklich bestätigen.');
        const approved=joinPreviews.get(selection.previewId);
        if(!approved || approved.safetyCopyId!==selection.safetyCopyId
          || await digest(approved.binding)!==await digest(binding)
          || approved.expectedLocalHash!==await productStateHash(commands.getState())
          || approved.remoteHash!==await digest(remoteState.ledger))throw productError('stale','Die Datensatzauswahl wurde geändert. Bitte eine neue Vorschau öffnen.');
        const safety=commands.getState().safetyCopies.find(c=>c.id===approved.safetyCopyId);
        if(!safety?.verified || await digest(safety.backup)!==safety.hash)throw productError('storage','Die Sicherheitskopie ist nicht mehr vollständig.');
        expectedLocalHash=approved.expectedLocalHash;
      }
      const descriptorHash = descriptorRead.hash;
      const epochHash = root.hash;
      await mutate(async (next) => {
        if (next.binding !== null) throw productError('binding', 'Dieser Browser ist bereits verbunden.');
        const currentSameDataset = next.ledger.descriptor.datasetId === descriptorRead.descriptor.datasetId;
        const currentNonempty = next.ledger.events.length > 0 || next.outboxEventIds.length > 0
          || next.pendingPackets.length > 0 || Object.keys(next.rounds).length > 0;
        if (!currentSameDataset && currentNonempty) {
          if(expectedLocalHash===null)throw productError('not-ready','Der lokale Stand wurde inzwischen geändert; eine Sicherheitskopie ist nötig.');
          if(await productStateHash(next)!==expectedLocalHash)throw productError('stale','Der lokale Stand wurde inzwischen geändert. Bitte die Auswahl erneut prüfen.');
        }
        if (!currentSameDataset) {
          next.ledger = {
            descriptor: descriptorRead.descriptor,
            events: [],
            epochs: [root.epoch],
            snapshots: [],
            historicalEpochs: [],
          };
          if(remoteState)next.ledger=remoteState.ledger;
          next.clock = Math.max(next.clock, root.epoch.clock);
          next.rounds = {};
          next.outboxEventIds = [];
          next.pendingPackets = [];
          next.packetIntegrity = [];
          next.quarantinedFiles = [];
          next.restoreJobs=[];
          next.snapshotManifests=remoteState?.snapshotManifests??[];
          next.datasetSetup=null;
          next.knownFiles=remoteState?.knownFiles??[];
          next.packetIntegrity=remoteState?.packetIntegrity??[];
          if(remoteState)next.safetyCopies=mergeById(next.safetyCopies,remoteState.safetyCopies);
          next.clock=Math.max(next.clock,remoteState?.clock??0);
        } else {
          const checked = assertLedger({
            ...next.ledger,
            descriptor: descriptorRead.descriptor,
            epochs: next.ledger.epochs.some(({id: epochId}) => epochId === root.epoch.id)
              ? next.ledger.epochs
              : [...next.ledger.epochs, root.epoch],
          });
          next.ledger = checked;
        }
        next.binding = {
          accountId, folderId, descriptorFileId, datasetId: descriptorRead.descriptor.datasetId,
        };
        next.knownFiles = upsertKnown(next.knownFiles, {fileId: descriptorFileId, contentHash: descriptorHash, kind: 'dataset'});
        next.knownFiles = upsertKnown(next.knownFiles, {fileId: root.fileId, contentHash: epochHash, kind: 'epoch'});
      });
      if(selection.previewId)joinPreviews.delete(selection.previewId);
      publish('pending', 'Der Datensatz ist verbunden und wird geladen.');
      return preview;
    } catch (error) {
      return handleError(error);
    }
  }

  async function inspectJoinedDataset(current,binding,descriptor,root) {
    let value={...structuredClone(current),ledger:{descriptor,events:[],epochs:[root],snapshots:[],historicalEpochs:[]},
      binding,clock:Math.max(current.clock,root.clock),rounds:{},outboxEventIds:[],pendingPackets:[],datasetSetup:null,
      packetIntegrity:[],knownFiles:[],quarantinedFiles:[],safetyCopies:[],restoreJobs:[],snapshotManifests:[]};
    const scratch={async load(){return structuredClone(value);},async save(next){value=structuredClone(next);}};
    // Read-only staging has no local command hooks: discovering a remote milestone
    // must not generate/upload a new claim before the user confirms the join.
    const reader={getState:()=>structuredClone(value),subscribe:()=>()=>{},
      async commitExternal(next,expected){
        if(await productStateHash(value)!==expected)throw productError('stale','Die Datensatzvorschau wurde geändert.');
        assertLedger(next.ledger);await scratch.save(next);
      }};
    const probe=createProductSync({drive,store:scratch,commands:reader,now,id,onStatus:()=>{}});
    try {await probe.sync();return reader.getState();} finally {probe.destroy();}
  }

  function packetMetadataMatches(meta, packet, binding) {
    assertMetadata(meta, {
      parentId: binding.folderId, kind: 'packet', datasetId: binding.datasetId, mimeType: JSON_MIME_TYPE,
    });
    if (meta.appProperties.epochId !== packet.epochId
      || meta.appProperties.packetId !== packet.packetId) {
      throw productError('binding', 'Paketinhalt und Drive-Kennung widersprechen sich.');
    }
  }

  async function download(binding) {
    await verifyAccount(binding);
    await verifyFolder(binding);
    const descriptorRead = await readDescriptor(binding);
    const before = commands.getState();
    if (await contentHash(before.ledger.descriptor) !== descriptorRead.hash) {
      throw productError('collision', 'Die gebundene Datensatzbeschreibung wurde verändert.');
    }
    const files = await drive.listFiles(childQuery(binding.folderId, binding.datasetId));
    const observedIds = new Set(files.map(({id: fileId}) => fileId));
    for (const known of before.knownFiles) {
      if (!observedIds.has(known.fileId)) {
        throw productError('missing', 'Eine bereits bekannte Drive-Datei fehlt.');
      }
    }

    const packetCandidates = [];
    const epochCandidates = [];
    const manifestGroups = new Map();
    const receivedSafetyCopies = [];
    const immediateQuarantine = [];
    const verifiedKnown = [];
    const packetIds = new Map(before.packetIntegrity.map(({packetId, contentHash: hash}) => (
      [packetId, {fileId: null, packet: null, hash, persisted: true}]
    )));
    for (const rawMeta of files) {
      let meta;
      let inspectedValue = null;
      try {
        meta = assertMetadata(rawMeta, {
          parentId: binding.folderId, datasetId: binding.datasetId, mimeType: JSON_MIME_TYPE,
        });
        const kind = meta.appProperties.kind;
        if (kind === 'dataset') {
          if (meta.id !== binding.descriptorFileId) throw productError('collision', 'Es gibt eine unerwartete zweite Datensatzbeschreibung.');
          verifiedKnown.push({fileId: meta.id, contentHash: descriptorRead.hash, kind});
          continue;
        }
        // Snapshot identity is shared by all physical manifests, including newly
        // discovered ones. A cached epoch/file must not bypass this fetch's group.
        const read = await readIfNeeded(meta, before, {force: kind === 'snapshot-manifest'});
        if (read.skipped) {
          const known = knownFor(before, meta.id);
          verifiedKnown.push(known);
          continue;
        }
        meta = read.metadata;
        inspectedValue = read.value;
        if (kind === 'epoch') {
          const epoch=assertEpoch(read.value);
          if(meta.appProperties.epochId!==epoch.id || epoch.datasetId!==binding.datasetId) throw productError('binding','Die Epochenkennung stimmt nicht.');
          epochCandidates.push({epoch,backup:null,manifestId:null,fileId:meta.id,hash:read.hash});
          continue;
        }
        if(kind==='snapshot-part' || kind==='snapshot-manifest') {
          // Parts may arrive before their manifest/control; only a complete control activates them.
          if(read.value?.kind!==kind || read.value.datasetId!==binding.datasetId
            || read.value.snapshotId!==meta.appProperties.snapshotId)throw productError('invalid','Die Snapshot-Dateikennung stimmt nicht.');
          if(kind==='snapshot-manifest') {
            const checked=await readSnapshot({drive,binding,fileId:meta.id,descriptor:before.ledger.descriptor});
            if(await digest(checked.manifest)!==read.hash)throw productError('stale','Das Snapshot-Manifest wurde während der Prüfung geändert.');
            const snapshotId=checked.manifest.snapshotId;
            if(!manifestGroups.has(snapshotId))manifestGroups.set(snapshotId,[]);
            manifestGroups.get(snapshotId).push({...checked,fileId:meta.id,hash:read.hash});
          } else {
            verifiedKnown.push({fileId:meta.id,contentHash:read.hash,kind});
          }
          continue;
        }
        if (kind !== 'packet') throw productError('invalid', 'Der gebundene Ordner enthält eine unbekannte Produktdatei.');
        const packet = validatePacket(read.value);
        packetMetadataMatches(meta, packet, binding);
        const pending = before.pendingPackets.find(({driveFileId}) => driveFileId === meta.id);
        if (pending !== undefined && await contentHash(pending.packet) !== read.hash) {
          throw productError('collision', 'Eine vorab reservierte Paketdatei enthält andere Daten.');
        }
        const previous = packetIds.get(packet.packetId);
        if (previous && previous.hash !== read.hash) {
          throw productError('collision', 'Eine Paket-ID enthält unterschiedliche Drive-Daten.');
        }
        if (!previous) {
          const entry = {fileId: meta.id, packet, hash: read.hash, duplicates: []};
          packetIds.set(packet.packetId, entry);
          packetCandidates.push(entry);
        } else if (previous.persisted) {
          verifiedKnown.push({fileId: meta.id, contentHash: read.hash, kind: 'packet'});
        } else {
          previous.duplicates.push({fileId: meta.id, hash: read.hash});
        }
      } catch (error) {
        if (isTransportFailure(error)) throw error;
        if (error?.inspectedValue !== undefined) inspectedValue = error.inspectedValue;
        immediateQuarantine.push({
          fileId: rawMeta?.id ?? `unknown-${immediateQuarantine.length + 1}`,
          code: error?.code ?? 'invalid',
          message: safeMessage(error, 'Eine Drive-Datei ist ungültig.'),
          value: inspectedValue,
        });
      }
    }

    const conflictingSnapshots = new Set();
    for (const [snapshotId, group] of manifestGroups) {
      group.sort((left,right)=>left.fileId<right.fileId?-1:left.fileId>right.fileId?1:0);
      if (new Set(group.map(entry=>entry.manifest.totalHash)).size > 1) {
        conflictingSnapshots.add(snapshotId);
        for (const entry of group) immediateQuarantine.push({
          fileId:entry.fileId,code:'collision',message:'Eine Snapshot-ID enthält verschiedene Inhalte.',value:entry.manifest,
        });
        continue;
      }
      for (const entry of group) {
        verifiedKnown.push({fileId:entry.fileId,contentHash:entry.hash,kind:'snapshot-manifest'});
        if (entry.manifest.purpose === 'safety') receivedSafetyCopies.push({
          id:snapshotId,createdAt:entry.backup.exportedAt,purpose:'safety',backup:entry.backup,
          hash:await digest(entry.backup),driveManifestFileId:entry.fileId,verified:true,
        });
      }
    }
    const completeEpochs = [];
    for (const entry of epochCandidates) {
      const {epoch} = entry;
      if (epoch.snapshotId === null) {
        completeEpochs.push(entry);
        continue;
      }
      const group = manifestGroups.get(epoch.snapshotId) ?? [];
      // Physical duplicates with the same totalHash are one unambiguous content.
      const selected = epoch.snapshotManifestFileId === null
        ? group.find(candidate=>candidate.manifest.purpose==='restore')
        : group.find(candidate=>candidate.fileId===epoch.snapshotManifestFileId && candidate.manifest.purpose==='restore');
      if (conflictingSnapshots.has(epoch.snapshotId) || !selected) {
        immediateQuarantine.push({fileId:entry.fileId,
          code:conflictingSnapshots.has(epoch.snapshotId)?'collision':'reference',
          message:conflictingSnapshots.has(epoch.snapshotId)
            ?'Eine Snapshot-ID enthält verschiedene Inhalte.':'Das vollständige Snapshot-Manifest fehlt.',value:epoch});
        continue;
      }
      completeEpochs.push({...entry,backup:selected.backup,manifestId:selected.fileId});
    }

    for (const entry of before.quarantinedFiles) {
      if (entry.code !== 'reference' || entry.value?.kind !== 'packet') continue;
      try {
        const packet = validatePacket(entry.value);
        if (!packetIds.has(packet.packetId)) {
          packetIds.set(packet.packetId, {
            fileId: entry.fileId, packet, hash: await contentHash(packet), duplicates: [],
          });
          packetCandidates.push(packetIds.get(packet.packetId));
        }
      } catch {
        // The persisted quarantine remains authoritative for malformed content.
      }
    }

    let firstProblem = immediateQuarantine[0] ?? null;
    await mutate(async (next) => {
      for(const copy of receivedSafetyCopies) {
        const previous=next.safetyCopies.find(c=>c.id===copy.id);
        if(previous && previous.hash!==copy.hash)throw productError('collision','Eine Sicherheitskopie-ID enthält andere Daten.');
        if(!next.safetyCopies.some(c=>c.hash===copy.hash || c.driveManifestFileId===copy.driveManifestFileId))next.safetyCopies.push(copy);
      }
      let controls=[...completeEpochs],controlProgress=true;
      while(controls.length && controlProgress) {
        controlProgress=false;const waiting=[];
        for(const entry of controls) {
          try {
            const backup=entry.backup;
            next.ledger=assertLedger({...next.ledger,epochs:mergeById(next.ledger.epochs,[entry.epoch]),
              events:backup?mergeEvents(next.ledger.events,backup.events):next.ledger.events,
              snapshots:backup?mergeById(next.ledger.snapshots,[backup.snapshot]):next.ledger.snapshots,
              historicalEpochs:backup?mergeById(next.ledger.historicalEpochs,backup.epochHistory):next.ledger.historicalEpochs});
            if(backup && !next.snapshotManifests.some(m=>m.snapshotId===backup.snapshot.id))next.snapshotManifests.push({snapshotId:backup.snapshot.id,fileId:entry.manifestId});
            verifiedKnown.push({fileId:entry.fileId,contentHash:entry.hash,kind:'epoch'});controlProgress=true;
          } catch(error) {
            if(error.code==='reference')waiting.push({...entry,error});
            else {const problem={fileId:entry.fileId,code:error.code??'invalid',message:safeMessage(error),value:entry.epoch};
              next.quarantinedFiles=upsertQuarantine(next.quarantinedFiles,problem);if(!firstProblem)firstProblem=problem;}
          }
        }
        controls=waiting;
      }
      for(const entry of controls){const problem={fileId:entry.fileId,code:'reference',message:safeMessage(entry.error),value:entry.epoch};
        next.quarantinedFiles=upsertQuarantine(next.quarantinedFiles,problem);if(!firstProblem)firstProblem=problem;}
      for (const known of verifiedKnown) {
        next.knownFiles = upsertKnown(next.knownFiles, known);
        next.quarantinedFiles = removeQuarantine(next.quarantinedFiles, known.fileId);
      }
      for (const problem of immediateQuarantine) {
        next.quarantinedFiles = upsertQuarantine(next.quarantinedFiles, problem);
      }
      let remaining = [...packetCandidates];
      let progressed = true;
      while (remaining.length > 0 && progressed) {
        progressed = false;
        const postponed = [];
        for (const entry of remaining) {
          try {
            const events = mergeEvents(next.ledger.events, entry.packet.events);
            next.ledger = assertLedger({...next.ledger, events});
            for (const physical of [entry, ...entry.duplicates]) {
              next.knownFiles = upsertKnown(next.knownFiles, {
                fileId: physical.fileId, contentHash: physical.hash, kind: 'packet',
              });
              next.quarantinedFiles = removeQuarantine(next.quarantinedFiles, physical.fileId);
            }
            next.packetIntegrity = upsertPacketIntegrity(next.packetIntegrity, {
              packetId: entry.packet.packetId, contentHash: entry.hash,
            });
            progressed = true;
          } catch (error) {
            if (error?.code === 'reference') postponed.push({...entry, error});
            else {
              for (const physical of [entry, ...entry.duplicates]) {
                const problem = {
                  fileId: physical.fileId,
                  code: error?.code ?? 'invalid',
                  message: safeMessage(error, 'Ein Änderungspaket ist ungültig.'),
                  value: entry.packet,
                };
                next.quarantinedFiles = upsertQuarantine(next.quarantinedFiles, problem);
                if (firstProblem === null) firstProblem = problem;
              }
            }
          }
        }
        remaining = postponed;
      }
      for (const entry of remaining) {
        for (const physical of [entry, ...entry.duplicates]) {
          const problem = {
            fileId: physical.fileId,
            code: 'reference',
            message: safeMessage(entry.error, 'Ein Änderungspaket wartet auf abhängige Daten.'),
            value: entry.packet,
          };
          next.quarantinedFiles = upsertQuarantine(next.quarantinedFiles, problem);
          if (firstProblem === null) firstProblem = problem;
        }
      }
      next.clock = Math.max(
        next.clock,
        ...next.ledger.events.map(({clock}) => clock),
        ...next.ledger.epochs.map(({clock}) => clock),
        ...next.ledger.historicalEpochs.map(({clock}) => clock),
      );
    });
    return firstProblem;
  }

  async function preparePackets(binding) {
    await mutate(async (next) => {
      if (next.binding?.datasetId !== binding.datasetId || next.binding.folderId !== binding.folderId) {
        throw productError('binding', 'Die Drive-Bindung wurde während des Abgleichs geändert.');
      }
      if (next.outboxEventIds.length === 0) return false;
      const wanted = new Set(next.outboxEventIds);
      const events = next.ledger.events.filter(({id: eventId}) => wanted.has(eventId));
      if (events.length !== wanted.size) throw productError('reference', 'Eine ausstehende Änderung fehlt im Fachmodell.');
      const byEpoch = new Map();
      for (const event of events) {
        if (!byEpoch.has(event.epochId)) byEpoch.set(event.epochId, []);
        byEpoch.get(event.epochId).push(event);
      }
      const packets = [];
      for (const [epochId, entries] of byEpoch) {
        packets.push(...buildPackets({events: entries, datasetId: binding.datasetId, epochId, id}));
      }
      for (const packet of packets) {
        next.packetIntegrity = upsertPacketIntegrity(next.packetIntegrity, {
          packetId: packet.packetId,
          contentHash: await contentHash(packet),
        });
      }
      next.pendingPackets.push(...packets.map((packet) => ({packet, driveFileId: null, confirmed: false})));
      next.outboxEventIds = next.outboxEventIds.filter((eventId) => !wanted.has(eventId));
    });
  }

  async function uploadPending(binding) {
    while (true) {
      const state = commands.getState();
      const blockedFileIds = new Set(state.quarantinedFiles.map(({fileId}) => fileId));
      const pending = state.pendingPackets.find(({confirmed, driveFileId}) => (
        !confirmed && (driveFileId === null || !blockedFileIds.has(driveFileId))
      ));
      if (!pending) return;
      if (pending.packet.datasetId !== binding.datasetId) {
        throw productError('binding', 'Ausstehende Änderungen gehören zu einem anderen Datensatz.');
      }
      let fileId = pending.driveFileId;
      if (fileId === null) {
        fileId = await drive.generateId();
        await mutate((next) => {
          const record = next.pendingPackets.find(({packet}) => packet.packetId === pending.packet.packetId);
          if (!record) return false;
          if (record.driveFileId !== null && record.driveFileId !== fileId) {
            throw productError('collision', 'Ein ausstehendes Paket hat zwei Drive-Datei-IDs.');
          }
          record.driveFileId = fileId;
        });
      }
      await drive.putJson({
        id: fileId,
        name: `packet-${pending.packet.packetId}.json`,
        parentId: binding.folderId,
        appProperties: {
          app: APP,
          kind: 'packet',
          datasetId: pending.packet.datasetId,
          epochId: pending.packet.epochId,
          packetId: pending.packet.packetId,
        },
        value: pending.packet,
      });
      const hash = await contentHash(pending.packet);
      await mutate((next) => {
        const record = next.pendingPackets.find(({packet}) => packet.packetId === pending.packet.packetId);
        if (!record) return false;
        if (record.driveFileId !== fileId) {
          throw productError('collision', 'Die bestätigte Drive-Datei-ID stimmt nicht mit dem Paket überein.');
        }
        next.pendingPackets = next.pendingPackets.filter(({packet}) => packet.packetId !== pending.packet.packetId);
        next.knownFiles = upsertKnown(next.knownFiles, {fileId, contentHash: hash, kind: 'packet'});
        next.packetIntegrity = upsertPacketIntegrity(next.packetIntegrity, {
          packetId: pending.packet.packetId, contentHash: hash,
        });
      });
      lastConfirmedAt = now().toISOString();
    }
  }

  async function performSync() {
    let state = commands.getState();
    if (state === null) throw productError('not-ready', 'Der Vokabeltrainer ist noch nicht eingerichtet.');
    if (state.binding === null && state.datasetSetup !== null) {
      await resumeDatasetSetup();
      state = commands.getState();
    }
    if (state.binding === null) {
      publish('local', 'Nur lokal gespeichert.');
      return getStatus();
    }
    publish('pending', 'Änderungen werden abgeglichen.');
    await publishLocalEpochs(state.binding);
    const remoteProblem = await download(state.binding);
    await preparePackets(state.binding);
    await uploadPending(state.binding);
    const current = commands.getState();
    const projection = project(current.ledger);
    if (current.quarantinedFiles.length > 0) {
      throw productError(remoteProblem?.code ?? 'invalid',
        remoteProblem?.message ?? 'Mindestens eine Drive-Datei benötigt Aufmerksamkeit.');
    }
    if (projection.epochConflict || projection.conflicts.length > 0) {
      publish('conflict', 'Ein Datenkonflikt muss geklärt werden.');
    } else if (current.outboxEventIds.length > 0 || current.pendingPackets.length > 0) {
      publish('pending', 'Änderungen warten noch auf Bestätigung.');
    } else {
      lastConfirmedAt = now().toISOString();
      publish('synced', 'Vollständig abgeglichen.');
    }
    return getStatus();
  }

  function sync() {
    if (active !== null) {
      rerun = true;
      return active;
    }
    active = (async () => {
      try {
        do {
          rerun = false;
          await performSync();
        } while (rerun);
        return getStatus();
      } catch (error) {
        return handleError(error);
      } finally {
        active = null;
      }
    })();
    return active;
  }

  async function retry() {
    publish(commands.getState()?.binding ? 'pending' : 'local', 'Der Abgleich wird erneut versucht.');
    return sync();
  }

  function getStatus() {
    return structuredClone(reconcileStatus());
  }

  const unsubscribe = commands.subscribe(() => reconcileStatus(true));

  function destroy() {
    unsubscribe();
  }

  return {discover, createDataset, joinDataset, sync, retry, getStatus, destroy};
}
