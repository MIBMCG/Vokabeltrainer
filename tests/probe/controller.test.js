import test from 'node:test';
import assert from 'node:assert/strict';

import {createProbeController} from '../../src/probe/controller.js';

const folder = (id = 'folder-a') => ({
  id,
  name: `Verbindungsprobe ${id}`,
  mimeType: 'application/vnd.google-apps.folder',
  parents: [],
  appProperties: {vtProbe: '1'},
  trashed: false,
});

function memoryStore(initial = null) {
  let value = initial === null ? null : structuredClone(initial);
  let failNextSave = false;
  return {
    async load() {
      return value === null ? null : structuredClone(value);
    },
    async save(next) {
      if (failNextSave) {
        failNextSave = false;
        throw new Error('synthetic store failure');
      }
      value = structuredClone(next);
    },
    failSave() {
      failNextSave = true;
    },
    snapshot() {
      return value === null ? null : structuredClone(value);
    },
  };
}

function fakeDrive() {
  const files = new Map();
  const folders = new Map([['folder-a', folder()]]);
  const calls = [];
  let generated = 0;
  let failPutAfterRemote = false;
  let failNextPutBeforeRemote = false;

  const metadataForFile = ({id, name, parentId, appProperties}) => ({
    id,
    name,
    mimeType: 'application/json',
    parents: [parentId],
    appProperties: structuredClone(appProperties),
    trashed: false,
  });

  return {
    calls,
    files,
    folders,
    account: 'account-a',
    async accountId() {
      calls.push(['accountId']);
      return this.account;
    },
    async generateId() {
      const id = `drive-${++generated}`;
      calls.push(['generateId', id]);
      return id;
    },
    async listFiles(query) {
      calls.push(['listFiles', query]);
      if (query.includes("mimeType = 'application/vnd.google-apps.folder'")) {
        return [...folders.values()].map(structuredClone);
      }
      const parent = /'([^']+)' in parents/.exec(query)?.[1];
      return [...files.values()]
        .filter((entry) => entry.parentId === parent && entry.appProperties.vtKind === 'event')
        .map((entry) => metadataForFile(entry));
    },
    async metadata(id) {
      calls.push(['metadata', id]);
      if (folders.has(id)) return structuredClone(folders.get(id));
      const file = files.get(id);
      if (!file) throw new Error('missing');
      return metadataForFile(file);
    },
    async readJson(id) {
      calls.push(['readJson', id]);
      const file = files.get(id);
      if (!file) throw new Error('missing');
      return structuredClone(file.value);
    },
    async createFolder(request) {
      calls.push(['createFolder', structuredClone(request)]);
      const created = folder(request.id);
      created.name = request.name;
      created.appProperties = structuredClone(request.appProperties);
      folders.set(request.id, created);
      return structuredClone(created);
    },
    async putJson(request) {
      calls.push(['putJson', structuredClone(request)]);
      if (failNextPutBeforeRemote) {
        failNextPutBeforeRemote = false;
        throw new Error('synthetic network failure');
      }
      const previous = files.get(request.id);
      const stored = structuredClone(request);
      if (previous && JSON.stringify(previous) !== JSON.stringify(stored)) throw new Error('conflict');
      files.set(request.id, stored);
      if (failPutAfterRemote) {
        failPutAfterRemote = false;
        throw new Error('synthetic ambiguous upload');
      }
      return metadataForFile(stored);
    },
    failAfterRemote() {
      failPutAfterRemote = true;
    },
    failBeforeRemote() {
      failNextPutBeforeRemote = true;
    },
  };
}

function ids(...values) {
  let index = 0;
  return () => values[index++] ?? `local-${index}`;
}

async function selectedController({store = memoryStore(), drive = fakeDrive(), makeId = ids('answer-a')} = {}) {
  const controller = createProbeController({store, drive, makeId});
  await controller.load();
  await controller.selectFolder(folder());
  return {controller, store, drive};
}

test('requires a verified account and folder before queuing an answer', async () => {
  const store = memoryStore();
  const drive = fakeDrive();
  const controller = createProbeController({store, drive, makeId: ids('answer-a')});
  await controller.load();

  await assert.rejects(controller.addAnswer(), /Ordner|Verbindung/i);
  assert.equal(store.snapshot(), null);
  assert.equal(drive.calls.length, 0);
});

test('rejects unknown persisted fields instead of retaining possible credentials', async () => {
  const valid = memoryStore();
  const drive = fakeDrive();
  const fixture = await selectedController({store: valid, drive});
  const corrupted = memoryStore({...fixture.store.snapshot(), token: 'must-not-survive'});
  const controller = createProbeController({store: corrupted, drive});

  await assert.rejects(controller.load(), /beschädigt/i);
});

test('reload preserves an offline queued answer and its event ID', async () => {
  const store = memoryStore();
  const drive = fakeDrive();
  const first = await selectedController({store, drive, makeId: ids('answer-a')});
  await first.controller.addAnswer();

  const reloaded = createProbeController({store, drive, makeId: ids('unused')});
  await reloaded.load();

  assert.equal(reloaded.state().projection.answerCount, 1);
  assert.deepEqual(reloaded.state().pendingUploads, [{eventId: 'answer-a'}]);
});

test('does not publish visible success when the local save fails', async () => {
  const fixture = await selectedController({makeId: ids('answer-a')});
  fixture.store.failSave();

  await assert.rejects(fixture.controller.addAnswer(), /store failure/);

  assert.equal(fixture.controller.state().projection.answerCount, 0);
  assert.equal(fixture.controller.state().pendingUploads.length, 0);
});

test('persists generated folder ID before creating the folder and retries the same ID', async () => {
  const store = memoryStore();
  const drive = fakeDrive();
  const originalCreate = drive.createFolder;
  let first = true;
  drive.createFolder = async (request) => {
    if (first) {
      first = false;
      drive.calls.push(['failedCreateFolder', structuredClone(request)]);
      throw new Error('synthetic folder failure');
    }
    return originalCreate.call(drive, request);
  };
  const controller = createProbeController({store, drive, makeId: ids('folder-name')});
  await controller.load();

  await assert.rejects(controller.createFolder(), /folder failure/);
  const persistedId = store.snapshot().pendingFolder.id;
  await controller.createFolder();

  const successful = drive.calls.find(([name]) => name === 'createFolder')[1];
  assert.equal(successful.id, persistedId);
  assert.equal(controller.state().scope.folderId, persistedId);
});

test('sync persists a Drive file ID before upload and acknowledges the event', async () => {
  const fixture = await selectedController({makeId: ids('answer-a')});
  await fixture.controller.addAnswer();

  await fixture.controller.sync();

  const upload = fixture.drive.calls.find(([name]) => name === 'putJson')[1];
  assert.equal(upload.value.id, 'answer-a');
  assert.equal(upload.id, 'drive-1');
  assert.equal(fixture.controller.state().pendingUploads.length, 0);
  assert.deepEqual(fixture.controller.state().lastConfirmedUpload, {
    eventId: 'answer-a',
    fileId: 'drive-1',
  });
});

test('remote upload followed by local failure retries the same ID and counts once', async () => {
  const fixture = await selectedController({makeId: ids('answer-a')});
  await fixture.controller.addAnswer();
  const originalSave = fixture.store.save;
  let saves = 0;
  fixture.store.save = async (value) => {
    saves += 1;
    if (saves === 3) throw new Error('synthetic acknowledgment failure');
    return originalSave.call(fixture.store, value);
  };

  await assert.rejects(fixture.controller.sync(), /acknowledgment failure/);
  assert.equal(fixture.drive.files.size, 1);
  assert.equal(fixture.controller.state().pendingUploads.length, 1);

  await fixture.controller.sync();
  assert.equal(fixture.drive.files.size, 1);
  assert.equal(fixture.controller.state().projection.answerCount, 1);
  assert.equal(fixture.controller.state().pendingUploads.length, 0);
});

test('sync rejects a different connected account before any Drive write', async () => {
  const fixture = await selectedController({makeId: ids('answer-a')});
  await fixture.controller.addAnswer();
  fixture.drive.account = 'account-b';

  await assert.rejects(fixture.controller.sync(), /Konto/i);
  assert.equal(fixture.drive.calls.filter(([name]) => name === 'putJson').length, 0);
  assert.equal(fixture.controller.state().pendingUploads.length, 1);
});

test('reset failure retains the old visible count and retry publishes the prepared IDs', async () => {
  const fixture = await selectedController({makeId: ids('answer-a', 'reset-a', 'epoch-reset-a')});
  await fixture.controller.addAnswer();
  await fixture.controller.sync();
  fixture.drive.failBeforeRemote();

  await assert.rejects(fixture.controller.restoreEmpty(), /network failure/);
  const afterFailure = fixture.controller.state();
  assert.equal(afterFailure.projection.answerCount, 1);
  assert.equal(afterFailure.pendingReset.event.id, 'reset-a');
  const preparedResetFileId = afterFailure.pendingReset.resetFileId;

  await fixture.controller.restoreEmpty();
  assert.equal(fixture.controller.state().projection.answerCount, 0);
  const resetUploads = fixture.drive.calls
    .filter(([name, request]) => name === 'putJson' && request.appProperties.vtKind === 'event')
    .map(([, request]) => request)
    .filter((request) => request.value.kind === 'reset');
  assert.equal(resetUploads.at(-1).id, preparedResetFileId);
});

test('repeat uploads the last confirmed event with the identical Drive ID', async () => {
  const fixture = await selectedController({makeId: ids('answer-a')});
  await fixture.controller.addAnswer();
  await fixture.controller.sync();
  const before = fixture.drive.calls.filter(([name]) => name === 'putJson').length;

  await fixture.controller.repeatLastUpload();

  const uploads = fixture.drive.calls.filter(([name]) => name === 'putJson');
  assert.equal(uploads.length, before + 1);
  assert.equal(uploads.at(-1)[1].id, 'drive-1');
  assert.equal(uploads.at(-1)[1].value.id, 'answer-a');
});

test('does not silently replace a selected folder while work is pending', async () => {
  const fixture = await selectedController({makeId: ids('answer-a')});
  fixture.drive.folders.set('folder-b', folder('folder-b'));
  await fixture.controller.addAnswer();

  await assert.rejects(fixture.controller.selectFolder(folder('folder-b')), /ausstehend|abgleichen/i);
  assert.equal(fixture.controller.state().scope.folderId, 'folder-a');
});
