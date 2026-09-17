import {projectProbe} from './model.js';

const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';
const SAFE_ID = /^[A-Za-z0-9_-]+$/;

function clone(value) {
  return structuredClone(value);
}

function fail(message) {
  throw new Error(message);
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function validId(value) {
  return typeof value === 'string' && SAFE_ID.test(value);
}

function exactKeys(value, expected) {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
}

function defaultState() {
  return {
    version: 1,
    clientId: '',
    scope: null,
    events: [],
    pendingUploads: [],
    lastConfirmedUpload: null,
    pendingFolder: null,
    pendingReset: null,
  };
}

function validateScope(scope) {
  return isPlainObject(scope)
    && validId(scope.accountId)
    && validId(scope.folderId)
    && Object.keys(scope).length === 2;
}

function sameScope(left, right) {
  return validateScope(left)
    && validateScope(right)
    && left.accountId === right.accountId
    && left.folderId === right.folderId;
}

function sameIdSet(left, right) {
  if (left.length !== right.length) return false;
  const rightIds = new Set(right);
  return rightIds.size === right.length && left.every((id) => rightIds.has(id));
}

function validatePersistedState(value) {
  if (!isPlainObject(value)
    || !exactKeys(value, [
      'version', 'clientId', 'scope', 'events', 'pendingUploads', 'lastConfirmedUpload',
      'pendingFolder', 'pendingReset',
    ])
    || value.version !== 1
    || typeof value.clientId !== 'string'
    || !(value.scope === null || validateScope(value.scope))
    || !Array.isArray(value.events)
    || !Array.isArray(value.pendingUploads)
    || !(value.lastConfirmedUpload === null
      || (isPlainObject(value.lastConfirmedUpload)
        && exactKeys(value.lastConfirmedUpload, ['eventId', 'fileId'])
        && validId(value.lastConfirmedUpload.eventId)
        && validId(value.lastConfirmedUpload.fileId)))
    || !(value.pendingFolder === null
      || (isPlainObject(value.pendingFolder)
        && exactKeys(value.pendingFolder, ['id', 'accountId', 'name'])
        && validId(value.pendingFolder.id)
        && validId(value.pendingFolder.accountId)
        && typeof value.pendingFolder.name === 'string'
        && value.pendingFolder.name !== ''))
    || !(value.pendingReset === null || isPlainObject(value.pendingReset))) {
    fail('Gespeicherte Probedaten sind beschädigt.');
  }

  projectProbe(value.events);
  const eventIds = new Set(value.events.map((event) => event.id));
  const pendingIds = new Set();
  for (const pending of value.pendingUploads) {
    if (!isPlainObject(pending)
      || !exactKeys(pending, pending.fileId === undefined ? ['eventId'] : ['eventId', 'fileId'])
      || !validId(pending.eventId)
      || !eventIds.has(pending.eventId)
      || !(pending.fileId === undefined || validId(pending.fileId))
      || pendingIds.has(pending.eventId)) {
      fail('Gespeicherte Upload-Daten sind beschädigt.');
    }
    pendingIds.add(pending.eventId);
  }

  if (value.pendingReset !== null) {
    const pending = value.pendingReset;
    if (!exactKeys(pending, ['backupFileId', 'resetFileId', 'backupConfirmed', 'backup', 'event'])
      || !validId(pending.backupFileId)
      || !validId(pending.resetFileId)
      || typeof pending.backupConfirmed !== 'boolean'
      || !isPlainObject(pending.backup)
      || !exactKeys(pending.backup, ['version', 'kind', 'scope', 'events'])
      || pending.backup.version !== 1
      || pending.backup.kind !== 'backup'
      || !validateScope(pending.backup.scope)
      || !Array.isArray(pending.backup.events)
      || !isPlainObject(pending.event)
      || pending.event.kind !== 'reset') {
      fail('Gespeicherter Rücksetzversuch ist beschädigt.');
    }
    const backupProjection = projectProbe(pending.backup.events);
    projectProbe([pending.event]);
    const activeBackupAnswerIds = pending.backup.events
      .filter((event) => event.kind === 'answer' && event.epoch === backupProjection.epoch)
      .map(({id}) => id);
    if (!value.scope
      || pending.backupFileId === pending.resetFileId
      || pending.event.backupFileId !== pending.backupFileId
      || !sameScope(pending.backup.scope, value.scope)
      || backupProjection.conflict
      || pending.event.parentEpoch !== backupProjection.epoch
      || !sameIdSet(pending.event.previousAnswerIds, activeBackupAnswerIds)) {
      fail('Gespeicherter Rücksetzversuch ist beschädigt.');
    }
  }
  return value;
}

function isProbeFolder(metadata, id = metadata?.id) {
  return isPlainObject(metadata)
    && metadata.id === id
    && validId(metadata.id)
    && typeof metadata.name === 'string'
    && metadata.name !== ''
    && metadata.mimeType === FOLDER_MIME_TYPE
    && Array.isArray(metadata.parents)
    && metadata.trashed === false
    && isPlainObject(metadata.appProperties)
    && metadata.appProperties.vtProbe === '1';
}

function assertProbeFolder(metadata, id) {
  if (!isProbeFolder(metadata, id)) fail('Der ausgewählte Probeordner ist ungültig.');
  return metadata;
}

function eventProperties(scope, event) {
  return {
    vtProbe: '1',
    vtKind: 'event',
    vtAccountId: scope.accountId,
    vtFolderId: scope.folderId,
    vtEventId: event.id,
  };
}

function eventUpload(scope, event, fileId) {
  return {
    id: fileId,
    name: `event-${event.id}.json`,
    parentId: scope.folderId,
    appProperties: eventProperties(scope, event),
    value: event,
  };
}

function metadataMatchesEvent(metadata, scope) {
  return isPlainObject(metadata)
    && validId(metadata.id)
    && metadata.mimeType === 'application/json'
    && metadata.trashed === false
    && Array.isArray(metadata.parents)
    && metadata.parents.length === 1
    && metadata.parents[0] === scope.folderId
    && isPlainObject(metadata.appProperties)
    && metadata.appProperties.vtProbe === '1'
    && metadata.appProperties.vtKind === 'event'
    && metadata.appProperties.vtAccountId === scope.accountId
    && metadata.appProperties.vtFolderId === scope.folderId
    && validId(metadata.appProperties.vtEventId);
}

function mergeEvents(localEvents, remoteEvents) {
  const merged = [...localEvents];
  const positions = new Map(merged.map((event, index) => [event.id, index]));
  for (const event of remoteEvents) {
    const position = positions.get(event.id);
    if (position === undefined) {
      positions.set(event.id, merged.length);
      merged.push(event);
    } else {
      projectProbe([merged[position], event]);
    }
  }
  projectProbe(merged);
  return merged;
}

export function createProbeController({store, drive, makeId = () => crypto.randomUUID()} = {}) {
  if (!store || typeof store.load !== 'function' || typeof store.save !== 'function') {
    fail('Lokaler Speicher ist nicht verfügbar.');
  }
  if (!drive || !['accountId', 'generateId', 'listFiles', 'metadata', 'readJson', 'createFolder', 'putJson']
    .every((name) => typeof drive[name] === 'function')) {
    fail('Drive-Anbindung ist nicht vollständig.');
  }
  if (typeof makeId !== 'function') fail('ID-Erzeugung ist nicht verfügbar.');

  let current = null;
  let actions = Promise.resolve();

  function serial(action) {
    const result = actions.then(action);
    actions = result.catch(() => {});
    return result;
  }

  function requireLoaded() {
    if (current === null) fail('Die Verbindungsprobe wurde noch nicht geladen.');
  }

  function requireScope() {
    requireLoaded();
    if (!current.scope) fail('Zuerst einen überprüften Probeordner auswählen oder erstellen.');
    return current.scope;
  }

  async function persist(candidate) {
    validatePersistedState(candidate);
    await store.save(clone(candidate));
    current = candidate;
  }

  async function verifyScope() {
    const scope = requireScope();
    const accountId = await drive.accountId();
    if (accountId !== scope.accountId) {
      fail('Das verbundene Google-Konto stimmt nicht mit den lokalen Probedaten überein.');
    }
    assertProbeFolder(await drive.metadata(scope.folderId), scope.folderId);
    return scope;
  }

  async function readRemoteEvents(scope) {
    const query = `'${scope.folderId}' in parents and trashed = false and appProperties has { key='vtProbe' and value='1' } and appProperties has { key='vtKind' and value='event' }`;
    const metadataList = await drive.listFiles(query);
    const events = [];
    const fileByEvent = new Map();
    for (const metadata of metadataList) {
      if (!metadataMatchesEvent(metadata, scope)) fail('Eine Drive-Probedatei gehört nicht zum ausgewählten Bereich.');
      const event = await drive.readJson(metadata.id);
      projectProbe([event]);
      if (event.id !== metadata.appProperties.vtEventId) {
        fail('Drive-Datei und Ereignis-ID stimmen nicht überein.');
      }
      const previousFile = fileByEvent.get(event.id);
      if (previousFile && previousFile !== metadata.id) {
        fail('Dasselbe Ereignis liegt in mehreren Drive-Dateien vor.');
      }
      fileByEvent.set(event.id, metadata.id);
      events.push(event);
    }
    projectProbe(events);
    return {events, fileByEvent};
  }

  async function internalSync() {
    const scope = await verifyScope();
    const remote = await readRemoteEvents(scope);
    const merged = mergeEvents(current.events, remote.events);
    let candidate = clone(current);
    candidate.events = clone(merged);

    const stillPending = [];
    for (const pending of candidate.pendingUploads) {
      const remoteFileId = remote.fileByEvent.get(pending.eventId);
      if (remoteFileId) {
        candidate.lastConfirmedUpload = {eventId: pending.eventId, fileId: remoteFileId};
      } else {
        stillPending.push(pending);
      }
    }
    candidate.pendingUploads = stillPending;
    await persist(candidate);

    for (const pendingValue of [...current.pendingUploads]) {
      let pending = current.pendingUploads.find(({eventId}) => eventId === pendingValue.eventId);
      if (!pending) continue;
      const event = current.events.find(({id}) => id === pending.eventId);
      if (!event) fail('Ausstehendes Ereignis fehlt lokal.');
      if (!pending.fileId) {
        const fileId = await drive.generateId();
        candidate = clone(current);
        pending = candidate.pendingUploads.find(({eventId}) => eventId === pendingValue.eventId);
        pending.fileId = fileId;
        await persist(candidate);
      }
      await drive.putJson(eventUpload(current.scope, event, pending.fileId));
      candidate = clone(current);
      candidate.pendingUploads = candidate.pendingUploads.filter(({eventId}) => eventId !== event.id);
      candidate.lastConfirmedUpload = {eventId: event.id, fileId: pending.fileId};
      await persist(candidate);
    }
    return stateSnapshot();
  }

  function stateSnapshot() {
    requireLoaded();
    return clone({...current, projection: projectProbe(current.events)});
  }

  async function loadAction() {
    if (current !== null) return stateSnapshot();
    const loaded = await store.load();
    current = loaded === null ? defaultState() : clone(validatePersistedState(loaded));
    return stateSnapshot();
  }

  async function setClientIdAction(clientId) {
    requireLoaded();
    if (typeof clientId !== 'string') fail('Die öffentliche Client-ID ist ungültig.');
    const candidate = clone(current);
    candidate.clientId = clientId.trim();
    await persist(candidate);
    return stateSnapshot();
  }

  async function findFoldersAction() {
    requireLoaded();
    await drive.accountId();
    const found = await drive.listFiles("mimeType = 'application/vnd.google-apps.folder' and trashed = false and appProperties has { key='vtProbe' and value='1' }");
    return clone(found.filter((metadata) => isProbeFolder(metadata)));
  }

  async function selectFolderAction(folderMetadata) {
    requireLoaded();
    assertProbeFolder(folderMetadata);
    if (current.scope && current.scope.folderId !== folderMetadata.id) {
      fail('Dieses Browserprofil ist fest an seinen Probeordner gebunden; ein anderer Ordner kann nicht gewählt werden.');
    }
    const accountId = await drive.accountId();
    if (current.scope && current.scope.accountId !== accountId) {
      fail('Dieses Browserprofil ist fest an ein anderes Google-Konto gebunden.');
    }
    const verified = assertProbeFolder(await drive.metadata(folderMetadata.id), folderMetadata.id);
    if (verified.name !== folderMetadata.name) fail('Der Probeordner hat sich während der Auswahl geändert.');
    const candidate = clone(current);
    candidate.scope = {accountId, folderId: verified.id};
    await persist(candidate);
    return stateSnapshot();
  }

  async function createFolderAction() {
    requireLoaded();
    if (current.scope) {
      fail('Dieses Browserprofil ist fest an seinen Probeordner gebunden; ein neuer Ordner kann nicht erstellt werden.');
    }
    let pending = current.pendingFolder;
    if (!pending) {
      const accountId = await drive.accountId();
      const id = await drive.generateId();
      const candidate = clone(current);
      candidate.pendingFolder = {
        id,
        accountId,
        name: `Vokabeltrainer-Verbindungsprobe ${id.slice(-8)}`,
      };
      await persist(candidate);
      pending = current.pendingFolder;
    } else {
      const accountId = await drive.accountId();
      if (accountId !== pending.accountId) fail('Das verbundene Google-Konto hat sich geändert.');
    }

    await drive.createFolder({
      id: pending.id,
      name: pending.name,
      appProperties: {vtProbe: '1'},
    });
    const candidate = clone(current);
    candidate.scope = {accountId: pending.accountId, folderId: pending.id};
    candidate.pendingFolder = null;
    await persist(candidate);
    return stateSnapshot();
  }

  async function addAnswerAction() {
    const scope = requireScope();
    if (!validateScope(scope)) fail('Der lokale Probeordner ist ungültig.');
    const eventId = makeId();
    if (!validId(eventId)) fail('Die erzeugte Ereignis-ID ist ungültig.');
    const event = {
      version: 1,
      kind: 'answer',
      id: eventId,
      epoch: projectProbe(current.events).epoch,
      correct: true,
    };
    const candidate = clone(current);
    candidate.events.push(event);
    candidate.pendingUploads.push({eventId});
    await persist(candidate);
    return stateSnapshot();
  }

  async function repeatLastUploadAction() {
    const scope = await verifyScope();
    if (!current.lastConfirmedUpload) fail('Es gibt noch keinen bestätigten Upload zum Wiederholen.');
    const event = current.events.find(({id}) => id === current.lastConfirmedUpload.eventId);
    if (!event) fail('Das zuletzt bestätigte Ereignis fehlt lokal.');
    await drive.putJson(eventUpload(scope, event, current.lastConfirmedUpload.fileId));
    return stateSnapshot();
  }

  async function restoreEmptyAction() {
    await internalSync();
    if (current.pendingReset && current.events.some(({id}) => id === current.pendingReset.event.id)) {
      const candidate = clone(current);
      candidate.pendingReset = null;
      await persist(candidate);
      return stateSnapshot();
    }

    const scope = requireScope();
    let pending = current.pendingReset;
    if (!pending) {
      const projection = projectProbe(current.events);
      if (projection.conflict) fail('Der Rücksetzkonflikt muss vor einem weiteren Rücksetzen geklärt werden.');
      const backupFileId = await drive.generateId();
      const resetFileId = await drive.generateId();
      const eventId = makeId();
      const epoch = makeId();
      if (![eventId, epoch].every(validId)) fail('Die erzeugte Rücksetz-ID ist ungültig.');
      const event = {
        version: 1,
        kind: 'reset',
        id: eventId,
        parentEpoch: projection.epoch,
        epoch,
        baseAnswers: [],
        previousAnswerIds: current.events
          .filter((eventValue) => eventValue.kind === 'answer' && eventValue.epoch === projection.epoch)
          .map(({id}) => id),
        backupFileId,
      };
      const backup = {
        version: 1,
        kind: 'backup',
        scope: clone(scope),
        events: clone(current.events),
      };
      const candidate = clone(current);
      candidate.pendingReset = {
        backupFileId,
        resetFileId,
        backupConfirmed: false,
        backup,
        event,
      };
      await persist(candidate);
      pending = current.pendingReset;
    }

    if (!pending.backupConfirmed) {
      await drive.putJson({
        id: pending.backupFileId,
        name: `backup-${pending.event.id}.json`,
        parentId: scope.folderId,
        appProperties: {
          vtProbe: '1',
          vtKind: 'backup',
          vtAccountId: scope.accountId,
          vtFolderId: scope.folderId,
          vtResetId: pending.event.id,
        },
        value: pending.backup,
      });
      const candidate = clone(current);
      candidate.pendingReset.backupConfirmed = true;
      await persist(candidate);
      pending = current.pendingReset;
    }

    await drive.putJson(eventUpload(scope, pending.event, pending.resetFileId));
    const candidate = clone(current);
    candidate.events.push(clone(pending.event));
    candidate.pendingReset = null;
    candidate.lastConfirmedUpload = {eventId: pending.event.id, fileId: pending.resetFileId};
    await persist(candidate);
    return stateSnapshot();
  }

  return {
    load: () => serial(loadAction),
    state: stateSnapshot,
    setClientId: (clientId) => serial(() => setClientIdAction(clientId)),
    findFolders: () => serial(findFoldersAction),
    selectFolder: (folderMetadata) => serial(() => selectFolderAction(folderMetadata)),
    createFolder: () => serial(createFolderAction),
    addAnswer: () => serial(addAnswerAction),
    sync: () => serial(internalSync),
    repeatLastUpload: () => serial(repeatLastUploadAction),
    restoreEmpty: () => serial(restoreEmptyAction),
  };
}
