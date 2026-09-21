import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir, mkdtemp, rm} from 'node:fs/promises';
import {resolve, sep} from 'node:path';

import {createTrainerHarness} from './trainer-harness.mjs';
import {snapshotHash} from '../../src/trainer/backup/format.js';
import {project as projectState} from '../../src/trainer/learning/progress.js';

const resultsDirectory = resolve('test-results');

test('B1 browser migrates actual v1 feedback atomically and leaves unknown storage visible', {timeout:60_000},async()=>{
  const {createCommands:oldCommands}=await import('../compat/v1/src/trainer/commands.js');
  const {buildPackets:buildOldPackets}=await import('../compat/v1/src/trainer/sync/packets.js');
  const {createFixture}=await import('../trainer/fixtures.js');
  const {memoryStore,productState:makeState,sequenceIds}=await import('../trainer/backup-fixtures.js');
  const harness=await createTrainerHarness(),{page}=await harness.newDevice();
  try {
    await page.goto(harness.baseUrl);await setupPractice(page);
    const configured=await productState(page),store=memoryStore(makeState(createFixture().base,{deviceId:configured.deviceId}));
    const old=await oldCommands({store,deviceId:configured.deviceId,id:sequenceIds('old-browser'),now:()=>new Date(),onChange(){}});
    await old.start({profileId:'p1',mode:'all',size:10});await old.submit({roundId:old.getState().rounds.p1.id,typed:'synthetic-wrong'});
    const source=store.snapshot();source.pinVerifier=configured.pinVerifier;
    const pendingEvent=source.ledger.events.at(-1);
    const [pendingPacket]=buildOldPackets({events:[pendingEvent],datasetId:pendingEvent.datasetId,
      epochId:pendingEvent.epochId,id:()=> 'c2-v1-pending'});
    source.pendingPackets.push({packet:pendingPacket,driveFileId:null,confirmed:false});
    await writeProductState(page,source);await page.reload();
    await page.getByRole('button',{name:/Ada/}).first().waitFor();
    const migrated=await productState(page);
    assert.equal(migrated.storageVersion,3);assert.deepEqual(migrated.ledger,source.ledger);
    assert.deepEqual(migrated.rounds.p1.feedback,source.rounds.p1.feedback);
    assert.deepEqual(migrated.pendingPackets,source.pendingPackets);
    assert.equal(migrated.safetyCopies.filter(c=>c.purpose==='format-migration' && c.verified).length,1);
    await page.reload();await page.getByRole('button',{name:/Ada/}).first().waitFor();
    assert.deepEqual(await productState(page),migrated);
    await page.getByRole('button',{name:/Ada/}).first().click();
    await page.getByRole('button',{name:'Fortsetzen',exact:true}).click();
    await page.getByRole('button',{name:'Weiter',exact:true}).waitFor();
    await page.getByRole('button',{name:'Weiter',exact:true}).click();
    assert.equal((await productState(page)).rounds.p1.schedulingMode,'legacy');
    const unknown={...await productState(page),storageVersion:99};
    await writeProductState(page,unknown);await page.reload();
    await page.getByText(/Speicherversion wird nicht unterstützt/).waitFor();
    assert.deepEqual(await productState(page),unknown);
  } finally {await harness.close();}
});

test('C2 rejected required precache install keeps the active offline app and foreign caches', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page, context} = await harness.newDevice({deviceScaleFactor: 2});
  try {
    await page.goto(harness.baseUrl);
    await setupPractice(page);
    assert.equal(await page.evaluate(() => devicePixelRatio), 2);
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, {timeout: 10_000});
    await page.evaluate(async () => { await caches.open('synthetic-foreign-cache'); });
    harness.setServiceWorkerVersion('v22');
    harness.failNextPrecacheAsset('styles.css');
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration('./');
      await registration.update();
    });
    await page.waitForFunction(async () => {
      const registration = await navigator.serviceWorker.getRegistration('./');
      return registration?.installing === null && registration?.waiting === null;
    });
    const cacheNames = await page.evaluate(async () => (await caches.keys()).sort());
    assert.equal(cacheNames.includes('synthetic-foreign-cache'), true, JSON.stringify(cacheNames));
    assert.equal(cacheNames.includes('vokabeltrainer-product:%2Ftrainer%2F:v21'), true, JSON.stringify(cacheNames));
    await context.setOffline(true);
    await page.reload({waitUntil: 'domcontentloaded'});
    await page.locator('#profile-list').waitFor();
  } finally {
    await harness.close();
  }
});

test('B2 browser continues frozen configurable policy and generation after reload', {timeout:60_000},async()=>{
  const {createCommands}=await import('../../src/trainer/commands.js');
  const {createFixture}=await import('../trainer/fixtures.js');
  const {memoryStore,productState:makeState,sequenceIds}=await import('../trainer/backup-fixtures.js');
  const harness=await createTrainerHarness(),{page}=await harness.newDevice();
  const open=async(state,prefix)=>createCommands({store:memoryStore(state),deviceId:state.deviceId,
    id:sequenceIds(prefix),now:()=>new Date(),onChange(){}});
  try {
    await page.goto(harness.baseUrl);await setupPractice(page);
    const configured=await productState(page),initial=makeState(createFixture({words:[['w1','Hund',['dog']]]}).base,{deviceId:configured.deviceId});
    initial.pinVerifier=configured.pinVerifier;
    const commands=await open(initial,'b2-browser');
    await commands.setLearningRules({profileId:'p1',expectedPolicyEventId:null,policy:{slowAfter:2,stopAfter:2,intervals:[1,3,7,14]}});
    await commands.start({profileId:'p1',mode:'all',size:10});
    await writeProductState(page,commands.getState());await page.reload();
    await page.getByRole('button',{name:/Ada/}).first().click();
    await page.getByRole('button',{name:'Fortsetzen',exact:true}).click();
    await page.locator('#answer').fill('dog');await page.getByRole('button',{name:'Prüfen',exact:true}).click();
    await page.getByRole('button',{name:'Weiter',exact:true}).waitFor();
    const stored=await productState(page),round=stored.rounds.p1;
    const edited=await open(stored,'b2-edited');
    await edited.setLearningRules({profileId:'p1',expectedPolicyEventId:round.policyEventId,policy:{slowAfter:5,stopAfter:null,intervals:[2,4,8,16]}});
    await edited.reactivateWord({profileId:'p1',wordId:'w1',learningId:'learn-w1',expectedGenerationId:null});
    const generation=edited.getState().ledger.events.find(e=>e.type==='word.reactivated').id;
    await writeProductState(page,edited.getState());await page.reload();
    await page.getByText('Richtig!',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Weiter',exact:true}).click();
    await page.locator('#answer').fill('dog');await page.getByRole('button',{name:'Prüfen',exact:true}).click();
    await page.getByRole('button',{name:'Weiter',exact:true}).click();
    await page.getByRole('button',{name:'Runde beenden',exact:true}).click();
    await page.getByRole('heading',{name:'Runde geschafft!'}).waitFor();
    const completed=await productState(page);
    assert.equal(completed.rounds.p1.answeredIds.length,2);
    assert.equal(completed.rounds.p1.policy.slowAfter,2);
    assert.equal(completed.rounds.p1.schedulingMode,'configurable');
    assert.equal(completed.ledger.events.filter(e=>e.type==='answer.recorded').at(-1).payload.schedulingGenerationId,null);
    assert.equal(projectState(completed.ledger).profiles.p1.points,40);
    await page.getByRole('button',{name:'Neue Runde',exact:true}).click();await startPracticeRound(page);
    const next=(await productState(page)).rounds.p1;
    assert.equal(next.policy.slowAfter,5);assert.equal(next.current.schedulingGenerationId,generation);
  } finally {await harness.close();}
});

async function startPracticeRound(root, mode = 'Alle Vokabeln') {
  await root.getByRole('radio', {name: new RegExp(`^${mode}`, 'u')}).check();
  await root.getByRole('button', {name: 'Runde starten', exact: true}).click();
}

// A separate synthetic store allows background commits while a real DOM editor
// remains focused. All mutations still use the production Commands/Sync services.
async function mountFixIntegration(page, initial) {
  await page.evaluate(async (state) => {
    const {createCommands, productStateHash} = await import('/src/trainer/commands.js');
    const {mountShell} = await import('/src/trainer/ui/shell.js');
    const {createProductSync} = await import('/src/trainer/sync/drive.js');
    const {createDriveClient} = await import('/src/drive/client.js');
    const {createRestoreService} = await import('/src/trainer/backup/restore.js');
    const {project} = await import('/src/trainer/learning/progress.js');
    let stored = structuredClone(state);
    const store = {load: async () => structuredClone(stored), save: async (next) => { stored = structuredClone(next); }};
    let shell;
    const commands = await createCommands({store, deviceId: state.deviceId,
      now: () => new Date('2026-09-18T12:00:00.000Z'), id: () => crypto.randomUUID(),
      onChange: () => shell?.stateChanged()});
    const drive = createDriveClient({getToken: () => 'synthetic-browser-token-1'});
    const sync = createProductSync({drive, store, commands, now: () => new Date(), id: () => crypto.randomUUID(),
      onStatus: (status) => shell?.syncStatusChanged(status)});
    await sync.createDataset('Synthetic integration');
    const restore = createRestoreService({commands, store, sync, drive, now: () => new Date(), id: () => crypto.randomUUID()});
    document.querySelector('#app').hidden = true;
    const root = document.createElement('main');
    root.id = 'fix-app';
    root.className = 'site-shell';
    document.body.append(root);
    let unlocked = true;
    const pinGate = {isUnlocked: () => unlocked, lock: () => { unlocked = false; }};
    shell = mountShell({root, commands, pinGate, sync, restore,
      auth: {clientId: () => '', invalidate() {}}});
    shell.show('adult');
    window.__fix = {root, commands, shell, sync, restore, pinGate, project, productStateHash};
  }, initial);
}

test('final I1 forgotten PIN is recoverable from the locked gate without old PIN or data loss', {timeout: 60_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice();
  try {
    await page.goto(harness.baseUrl);
    await setupPractice(page);
    const before = await productState(page);
    await page.reload();
    await page.locator('#adult-entry').click();
    assert.equal(await page.getByText('PIN vergessen', {exact: true}).count(), 1);
    await page.getByText('PIN vergessen', {exact: true}).click();
    await page.getByLabel('Bestätigungstext', {exact: true}).fill('PIN zurücksetzen');
    await page.getByLabel('Neue PIN', {exact: true}).fill('9012');
    await page.getByLabel('Neue PIN wiederholen', {exact: true}).fill('9012');
    await page.getByRole('button', {name: 'Vergessene PIN lokal zurücksetzen'}).click();
    await page.locator('#adult-nav').waitFor();
    assert.deepEqual((await productState(page)).ledger, before.ledger);
    assert.deepEqual((await productState(page)).rounds, before.rounds);
    assert.notEqual((await productState(page)).pinVerifier.hash, before.pinVerifier.hash);
    assert.equal(await page.evaluate(() => window.__syntheticOauthRequests ?? 0), 0);
    await page.reload();
    await page.locator('#adult-entry').click();
    await page.locator('#adult-pin').fill('9012');
    await page.locator('#adult-unlock').click();
    await page.locator('#adult-nav').waitFor();
  } finally { await harness.close(); }
});

test('final I2 adult drafts retain focus and original revision heads across unchanged and foreign sync', {timeout: 60_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice();
  try {
    await page.goto(harness.baseUrl);
    await setupPractice(page);
    await mountFixIntegration(page, await productState(page));
    const root = page.locator('#fix-app');
    const card = root.locator('[data-word-german="Hund"]');
    await card.getByRole('button', {name: 'Bearbeiten', exact: true}).click();
    const editor = root.locator('form.vocabulary-editor');
    const answer = editor.locator('[name="answers"]');
    await answer.fill('local draft');
    await answer.focus();
    const before = await page.evaluate(() => window.__fix.commands.getState());
    await page.evaluate(() => window.__fix.sync.sync());
    assert.equal(await answer.inputValue(), 'local draft');
    assert.equal(await answer.evaluate((node) => document.activeElement === node), true);
    const original = before.ledger.events.find((event) => event.payload?.value?.german === 'Hund');
    const foreign = {...structuredClone(original), id: 'foreign-editor-revision', deviceId: 'foreign-device', clock: before.clock + 1,
      payload: {...structuredClone(original.payload), parents: [original.id], value: {...original.payload.value, hint: 'Foreign hint'}}};
    const {buildPackets} = await import('../../src/trainer/sync/packets.js');
    const [packet] = buildPackets({events: [foreign], datasetId: foreign.datasetId, epochId: foreign.epochId, id: () => 'foreign-editor-packet'});
    harness.google.files.set('foreign-editor-file', {metadata: {id: 'foreign-editor-file', name: 'foreign.json', mimeType: 'application/json',
      parents: [before.binding.folderId], trashed: false, appProperties: {app: 'vokabeltrainer-product', kind: 'packet', datasetId: foreign.datasetId,
        epochId: packet.epochId, packetId: packet.packetId}}, value: packet});
    await answer.focus();
    await page.evaluate(() => window.__fix.sync.sync());
    assert.equal(await answer.inputValue(), 'local draft');
    assert.equal(await answer.evaluate((node) => document.activeElement === node), true);
    assert.ok((await page.evaluate(() => window.__fix.commands.getState())).ledger.events.some(({id}) => id === foreign.id));
    await editor.getByRole('button', {name: 'Änderung speichern'}).click();
    await root.getByRole('alert').filter({hasText: /inzwischen geändert/}).waitFor();
    const after = await page.evaluate(() => window.__fix.commands.getState());
    assert.equal(after.ledger.events.length, before.ledger.events.length + 1, 'stale draft must not silently rebase');
    assert.equal(await answer.inputValue(), 'local draft');
    await root.getByRole('button', {name: 'Ansicht neu laden (Eingaben verwerfen)'}).click();
    await root.locator('[data-word-german="Hund"]').getByRole('button', {name: 'Bearbeiten', exact: true}).click();
    const refreshed = root.locator('form.vocabulary-editor');
    assert.equal(await refreshed.locator('[name="answers"]').inputValue(), 'dog | hound');
    assert.equal(await refreshed.locator('[name="hint"]').inputValue(), 'Foreign hint');
    await page.evaluate(() => { window.__fix.pinGate.lock(); window.__fix.shell.stateChanged(); });
    assert.equal(await root.locator('#adult-nav').count(), 0);
    assert.equal(await root.locator('#adult-pin').count(), 1);
  } finally { await harness.close(); }
});

test('final I3 deliberate reconnect wakes pending bound sync without another lifecycle event', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page, controls} = await harness.newDevice();
  try {
    await page.clock.install();
    await page.goto(harness.baseUrl);
    await setupPractice(page);
    await page.locator('#adult-entry').click();
    await page.getByRole('button', {name: 'Einstellungen', exact: true}).click();
    await page.getByRole('button', {name: 'Mit Google verbinden', exact: true}).click();
    await page.getByRole('button', {name: 'Neuen Lernbereich anlegen'}).click();
    await page.getByText('Abgeglichen', {exact: true}).waitFor();
    await page.getByRole('button', {name: 'Einstellungen', exact: true}).click();
    await page.locator('summary').filter({hasText: 'Kind hinzufügen'}).click();
    const form = page.locator('#adult-content form').filter({has: page.getByRole('button', {name: 'Kind hinzufügen'})});
    await form.locator('[name="name"]').fill('Bea');
    await form.getByRole('button', {name: 'Kind hinzufügen'}).click();
    await page.getByText('Das Kind wurde hinzugefügt.', {exact: true}).waitFor();
    controls.rejectNextAbout401 = true;
    await page.getByRole('button', {name: 'Einstellungen', exact: true}).click();
    await page.locator('[data-sync-status]').filter({hasText: 'Mit Google verbinden'}).waitFor({timeout: 15_000});
    const pending = (await productState(page)).outboxEventIds;
    assert.ok(pending.length > 0);
    const requests = await page.evaluate(() => window.__syntheticOauthRequests);
    await page.getByRole('button', {name: 'Mit Google verbinden', exact: true}).click();
    await page.getByText('Google ist für diese Sitzung verbunden.', {exact: true}).waitFor();
    await page.waitForTimeout(1200);
    assert.equal((await productState(page)).outboxEventIds.length, 0, 'successful reconnect must wake stopped scheduler');
    assert.equal(await page.evaluate(() => window.__syntheticOauthRequests), requests + 1);
    for (const id of pending) assert.equal([...harness.google.files.values()].flatMap(({value}) => value?.kind === 'packet' ? value.events : []).filter((event) => event.id === id).length, 1);
    // Advancing the browser clock exercises normal polling without visibility/focus triggers.
    let polls = 0;
    page.on('request', (request) => { if (request.url().includes('/drive/v3/about')) polls += 1; });
    await page.clock.runFor(61_000);
    await page.waitForTimeout(100);
    assert.ok(polls > 0, 'normal polling resumes');
    assert.equal(harness.google.writes.some(({duplicate}) => duplicate), false);
  } finally { await harness.close(); }
});

test('final I4 restore conflict preserves an open answer until adult resolution without scoring', {timeout: 60_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice();
  try {
    await page.goto(harness.baseUrl);
    await setupPractice(page);
    await mountFixIntegration(page, await productState(page));
    await page.evaluate(() => window.__fix.shell.show('profiles'));
    const root = page.locator('#fix-app');
    await root.getByRole('button', {name: /^Ada/}).click();
    await startPracticeRound(root);
    await root.locator('#answer').fill('unsubmitted answer');
    await page.evaluate(async () => {
      const {commands, productStateHash} = window.__fix;
      const {snapshotHash} = await import('/src/trainer/backup/format.js');
      const current = commands.getState();
      const next = structuredClone(current);
      for (const [index, id] of ['conflict-a', 'conflict-b'].entries()) {
        const snapshot = {id: `snapshot-${id}`, datasetId: next.ledger.descriptor.datasetId,
          effectiveEventIds: next.ledger.events.map(({id}) => id).sort(), supportEventIds: [], contentHash: ''};
        snapshot.contentHash = await snapshotHash(snapshot, next.ledger.events);
        next.ledger.snapshots.push(snapshot);
        next.ledger.epochs.push({format: 'vokabeltrainer-product', formatVersion: 1, ruleVersion: 1, kind: 'epoch',
          id, datasetId: next.ledger.descriptor.datasetId, parents: [next.ledger.descriptor.rootEpochId],
          deviceId: 'foreign-restore', clock: next.clock + index + 1, occurredAt: '2026-09-18T12:00:00.000Z',
          snapshotId: snapshot.id, snapshotManifestFileId: null});
      }
      next.clock += 2;
      // Same atomic receive boundary used by product synchronization.
      await commands.commitExternal(next, await productStateHash(current));
    });
    assert.equal(await root.locator('#answer').count(), 1, 'conflict must not discard the answer as a missing profile');
    assert.equal(await root.locator('#answer').inputValue(), 'unsubmitted answer');
    assert.equal(await root.locator('#practice-submit:not([disabled])').count(), 0);
    await root.getByText(/Wiederherstellungen.*klären|Wiederherstellungen.*geklärt/).waitFor();
    const blocked = await page.evaluate(async () => {
      const {shell, commands} = window.__fix;
      const round = Object.values(commands.getState().rounds)[0];
      const codes = [];
      for (const action of [() => shell.pauseForUpdate(), () => commands.submit({roundId: round.id, typed: 'dog'}),
        () => commands.start({profileId: round.profileId, mode: 'all', size: 10})]) {
        try { await action(); codes.push('unexpected-success'); } catch (error) { codes.push(error.code); }
      }
      return codes;
    });
    assert.ok(blocked.every((code) => code !== 'unexpected-success'));
    await root.getByRole('button', {name: 'Für Erwachsene', exact: true}).click();
    // The test gate is deliberately unlocked again; production PIN behavior is covered separately.
    await page.evaluate(() => { window.__fix.pinGate.isUnlocked = () => true; window.__fix.shell.render(); });
    await page.evaluate(() => window.__fix.shell.show('profiles'));
    assert.equal(await root.locator('#answer').inputValue(), 'unsubmitted answer', 'adult navigation retains the conflict draft');
    const retainedBlocker = await page.evaluate(async () => {
      window.__fix.root.querySelector('#answer').remove();
      try { await window.__fix.shell.pauseForUpdate(); return 'unexpected-success'; } catch (error) { return error.code; }
    });
    assert.equal(retainedBlocker, 'typed-answer-present');
    await root.getByRole('button', {name: 'Für Erwachsene', exact: true}).click();
    await page.evaluate(() => { window.__fix.pinGate.isUnlocked = () => true; window.__fix.shell.render(); });
    await root.getByRole('button', {name: 'Einstellungen', exact: true}).click();
    await root.getByRole('button', {name: /Datenstand 1 .* prüfen/}).click();
    await root.getByRole('button', {name: 'Datenstand gemeinsam übernehmen'}).click();
    await page.waitForFunction(() => !window.__fix.project(window.__fix.commands.getState().ledger).epochConflict);
    const after = await page.evaluate(() => window.__fix.commands.getState());
    assert.equal(Object.values(after.rounds)[0].status, 'abandoned');
    assert.equal(after.ledger.events.filter(({type}) => ['answer.recorded', 'round.completed'].includes(type)).length, 0);
    await page.evaluate(() => window.__fix.shell.show('practice'));
    assert.equal(await root.locator('#answer').count(), 0);
  } finally { await harness.close(); }
});

async function syntheticProfileDirectory(prefix) {
  const root = resolve(resultsDirectory, 'offline-profiles');
  await mkdir(root, {recursive: true});
  const directory = await mkdtemp(resolve(root, `${prefix}-`));
  if (!directory.startsWith(`${root}${sep}`)) throw new Error('Unsafe synthetic profile directory.');
  return {directory, root};
}

async function productState(page) {
  return page.evaluate(() => new Promise((resolveState, reject) => {
    const request = indexedDB.open('vokabeltrainer-product-v1', 1);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('product-state')) {
        request.result.createObjectStore('product-state');
      }
    };
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction('product-state', 'readonly');
      const get = transaction.objectStore('product-state').get('current');
      get.onerror = () => reject(get.error);
      get.onsuccess = () => resolveState(get.result ?? null);
      transaction.oncomplete = () => database.close();
    };
  }));
}

async function writeProductState(page, state) {
  await page.evaluate((value) => new Promise((resolveWrite, reject) => {
    const request = indexedDB.open('vokabeltrainer-product-v1', 1);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('product-state')) {
        request.result.createObjectStore('product-state');
      }
    };
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction('product-state', 'readwrite');
      transaction.objectStore('product-state').put(value, 'current');
      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => { database.close(); resolveWrite(); };
    };
  }), state);
}

async function readSyntheticStorage(page) {
  return page.evaluate(async () => {
    const databases = [];
    for (const info of await indexedDB.databases()) {
      const database = await new Promise((resolveDatabase, reject) => {
        const request = indexedDB.open(info.name);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolveDatabase(request.result);
      });
      const stores = {};
      for (const name of database.objectStoreNames) {
        stores[name] = await new Promise((resolveValues, reject) => {
          const request = database.transaction(name).objectStore(name).getAll();
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolveValues(request.result);
        });
      }
      databases.push({name: info.name, stores});
      database.close();
    }
    return JSON.stringify({
      indexedDB: databases,
      localStorage: {...localStorage},
      sessionStorage: {...sessionStorage},
    });
  });
}

async function exportedBackupText(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

async function seedOneCorrectAnswer(page, state) {
  const profile = state.ledger.events.find((event) => (
    event.type === 'entity.revised' && event.payload.entityType === 'profile'
  ));
  const word = state.ledger.events.find((event) => (
    event.type === 'entity.revised' && event.payload.entityType === 'word'
  ));
  const next = structuredClone(state);
  const envelope = {
    format: 'vokabeltrainer-product', formatVersion: 1, ruleVersion: 1, kind: 'event',
    datasetId: state.ledger.descriptor.datasetId,
    epochId: state.ledger.descriptor.rootEpochId,
    deviceId: state.deviceId,
    occurredAt: '2026-09-17T10:00:00.000Z', day: '2026-09-17',
  };
  const started = {
    ...envelope, id: 'browser-history-round-start', clock: state.clock + 1,
    type: 'round.started',
    payload: {roundId: 'browser-history-round', profileId: profile.payload.entityId, mode: 'all', size: 10},
  };
  const answer = {
    ...envelope, id: 'browser-history-answer', clock: state.clock + 2,
    type: 'answer.recorded',
    payload: {
      roundId: 'browser-history-round', profileId: profile.payload.entityId, ordinal: 1,
      wordId: word.payload.entityId, revisionId: word.id,
      learningId: word.payload.value.learningId, correct: true,
    },
  };
  next.clock = answer.clock;
  next.ledger.events.push(started, answer);
  next.outboxEventIds.push(started.id, answer.id);
  await writeProductState(page, next);
}

function rewardProgressState(state, points, {allBadges = false} = {}) {
  const next = structuredClone(state);
  const profile = next.ledger.events.find((event) => (
    event.type === 'entity.revised' && event.payload.entityType === 'profile'
  ));
  const originalWords = next.ledger.events.filter((event) => (
    event.type === 'entity.revised' && event.payload.entityType === 'word'
  ));
  const envelope = {
    format: 'vokabeltrainer-product', formatVersion: 1, ruleVersion: 1, kind: 'event',
    datasetId: next.ledger.descriptor.datasetId,
    epochId: next.ledger.descriptor.rootEpochId,
    deviceId: next.deviceId,
    occurredAt: '2026-09-18T08:00:00.000Z', day: '2026-09-18',
  };
  let clock = next.clock;
  const append = (type, payload, id) => {
    clock += 1;
    const event = {...envelope, id, clock, type, payload};
    next.ledger.events.push(event);
    next.outboxEventIds.push(id);
    return event;
  };

  const words = [...originalWords];
  if (allBadges) {
    for (let index = words.length; index < 10; index += 1) {
      const source = originalWords[index % originalWords.length];
      words.push(append('entity.revised', {
        entityType: 'word',
        entityId: `reward-word-${index + 1}`,
        parents: [],
        value: {
          ...structuredClone(source.payload.value),
          german: `Inselwort ${index + 1}`,
          learningId: `reward-learning-${index + 1}`,
        },
      }, `reward-word-revision-${index + 1}`));
    }
  }

  let correctAnswers = 0;
  let roundNumber = 0;
  const addRound = ({word, wrongFirst = false, complete = false, answerCount = 10}) => {
    roundNumber += 1;
    const roundId = `reward-round-${String(roundNumber).padStart(2, '0')}`;
    append('round.started', {
      roundId, profileId: profile.payload.entityId, mode: 'all', size: answerCount <= 10 ? 10 : 30,
    }, `reward-start-${String(roundNumber).padStart(2, '0')}`);
    const answerIds = [];
    for (let ordinal = 1; ordinal <= answerCount; ordinal += 1) {
      const correct = !(wrongFirst && ordinal === 1);
      const id = `reward-answer-${String(roundNumber).padStart(2, '0')}-${String(ordinal).padStart(2, '0')}`;
      append('answer.recorded', {
        roundId,
        profileId: profile.payload.entityId,
        ordinal,
        wordId: word.payload.entityId,
        revisionId: word.id,
        learningId: word.payload.value.learningId,
        correct,
      }, id);
      answerIds.push(id);
      if (correct) correctAnswers += 1;
    }
    if (allBadges && wrongFirst) {
      append('word.milestone', {
        profileId: profile.payload.entityId,
        wordId: word.payload.entityId,
        milestone: 'recovered',
        evidenceAnswerIds: [answerIds[0], answerIds[1]],
      }, `reward-recovered-${String(roundNumber).padStart(2, '0')}`);
      append('word.milestone', {
        profileId: profile.payload.entityId,
        wordId: word.payload.entityId,
        milestone: 'mastered',
        evidenceAnswerIds: [answerIds[1], answerIds[2], answerIds[3]],
      }, `reward-mastered-${String(roundNumber).padStart(2, '0')}`);
    }
    if (complete) {
      append('round.completed', {
        roundId,
        profileId: profile.payload.entityId,
        reason: 'full',
        answerIds,
      }, `reward-complete-${String(roundNumber).padStart(2, '0')}`);
    }
  };

  if (allBadges) {
    for (const word of words) addRound({word, wrongFirst: true, complete: true});
    for (let index = 0; index < 15; index += 1) {
      addRound({word: words[index % words.length], complete: true});
    }
  }

  const completionPoints = allBadges ? 25 * 20 : 0;
  let pointsRemaining = points - ((correctAnswers * 10) + completionPoints);
  while (pointsRemaining > 0) {
    const answerCount = Math.min(30, pointsRemaining / 10);
    addRound({word: words[roundNumber % words.length], answerCount});
    pointsRemaining -= answerCount * 10;
  }
  next.clock = clock;
  return next;
}

async function holdNextPinDerivation(page) {
  await page.evaluate(() => {
    if (!window.__originalPinDeriveBits) {
      window.__originalPinDeriveBits = crypto.subtle.deriveBits.bind(crypto.subtle);
      crypto.subtle.deriveBits = async (...args) => {
        if (window.__holdPinDerivation) {
          window.__pinDerivationStarted = true;
          await window.__pinDerivationGate;
          window.__holdPinDerivation = false;
        }
        const result = await window.__originalPinDeriveBits(...args);
        window.__pinDerivationFinished = true;
        return result;
      };
    }
    window.__pinDerivationStarted = false;
    window.__pinDerivationFinished = false;
    window.__holdPinDerivation = true;
    window.__pinDerivationGate = new Promise((resolveGate) => {
      window.__releasePinDerivation = resolveGate;
    });
  });
}

async function backgroundDuringPinDerivation(page) {
  await page.waitForFunction(() => window.__pinDerivationStarted === true);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {value: 'hidden', configurable: true});
    document.dispatchEvent(new Event('visibilitychange'));
    window.__releasePinDerivation();
  });
  await page.waitForFunction(() => window.__pinDerivationFinished === true);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {value: 'visible', configurable: true});
  });
}

async function waitForVerifierChange(page, previousHash) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const current = await productState(page);
    if (current.pinVerifier?.hash !== previousHash) return current.pinVerifier.hash;
    await page.waitForTimeout(25);
  }
  throw new Error('PIN verifier did not change');
}

async function setupPractice(page, {
  profile = 'Ada',
  first = ['Hund', 'dog | hound'],
  second = ['Tier', 'dog | hound'],
} = {}) {
  await page.goto(page.url() || 'about:blank');
  await page.locator('#dataset-name').fill('Übungsinsel');
  await page.locator('#setup-pin').fill('1234');
  await page.locator('#setup-pin-repeat').fill('1234');
  await page.locator('#setup-profile').fill(profile);
  await page.locator('#setup-lesson').fill('Unit 1');
  await page.locator('#setup-word-1-german').fill(first[0]);
  await page.locator('#setup-word-1-answers').fill(first[1]);
  await page.locator('#setup-word-2-german').fill(second[0]);
  await page.locator('#setup-word-2-answers').fill(second[1]);
  await page.locator('#setup-submit').click();
  await page.locator('#profile-list').waitFor();
}

async function addSecondProfile(page) {
  const state = await productState(page);
  const next = structuredClone(state);
  const lesson = [...next.ledger.events].reverse().find((event) => (
    event.type === 'entity.revised' && event.payload.entityType === 'lesson'
  ));
  const base = {
    format: 'vokabeltrainer-product', formatVersion: 1, ruleVersion: 1, kind: 'event',
    datasetId: next.ledger.descriptor.datasetId, epochId: next.ledger.descriptor.rootEpochId,
    deviceId: next.deviceId, occurredAt: '2026-09-17T12:00:00.000Z', day: '2026-09-17',
  };
  const profile = {
    ...base, id: 'browser-profile-ben', clock: next.clock + 1, type: 'entity.revised',
    payload: {entityType: 'profile', entityId: 'browser-p2', parents: [], value: {name: 'Ben', archived: false}},
  };
  const assignment = {
    ...base, id: 'browser-lesson-shared', clock: next.clock + 2, type: 'entity.revised',
    payload: {
      entityType: 'lesson', entityId: lesson.payload.entityId, parents: [lesson.id],
      value: {...lesson.payload.value, profileIds: [...lesson.payload.value.profileIds, 'browser-p2'].sort()},
    },
  };
  next.clock = assignment.clock;
  next.ledger.events.push(profile, assignment);
  next.outboxEventIds.push(profile.id, assignment.id);
  await writeProductState(page, next);
  await page.reload();
  await page.locator('#profile-list').waitFor().catch(async (error) => {
    error.message += `\nVisible page after second profile:\n${await page.locator('body').innerText()}`;
    throw error;
  });
}

test('trainer practice is resumable, single-submit safe and completes an exhausted round', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page, context} = await harness.newDevice();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await mkdir(resultsDirectory, {recursive: true});

  try {
    await mkdir(resultsDirectory, {recursive: true});
    await page.goto(harness.baseUrl);
    await setupPractice(page);
    await addSecondProfile(page);
    await page.getByRole('button', {name: /^Ada/}).click();
    assert.equal(await page.getByRole('radio', {name: /^Alle Vokabeln/u}).count(), 1);
    assert.equal(await page.getByRole('radio', {name: /^Letzte Vokabeln/u}).count(), 1);
    assert.equal(await page.getByRole('radio', {name: /^Neue Vokabeln/u}).count(), 1);
    assert.equal(await page.getByRole('button', {name: 'Runde starten', exact: true}).count(), 1);
    await page.getByLabel('20 Antworten').check();
    await page.getByLabel('10 Antworten').check();
    await startPracticeRound(page);

    const answer = page.getByLabel('Englische Übersetzung');
    await answer.fill('   ');
    await page.getByRole('button', {name: 'Prüfen', exact: true}).click();
    assert.equal((await productState(page)).ledger.events.filter(({type}) => type === 'answer.recorded').length, 0);
    assert.equal(await answer.inputValue(), '   ');

    await answer.fill('wrong');
    await page.evaluate(() => {
      const input = document.querySelector('#answer');
      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', repeat: true, bubbles: true}));
      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', isComposing: true, bubbles: true}));
      document.querySelector('#practice-submit').dispatchEvent(new MouseEvent('click', {bubbles: true}));
      document.querySelector('#practice-submit').dispatchEvent(new MouseEvent('click', {bubbles: true}));
    });
    await page.getByText('Noch nicht ganz', {exact: true}).waitFor();
    assert.equal((await productState(page)).ledger.events.filter(({type}) => type === 'answer.recorded').length, 1);
    await page.getByText('dog', {exact: true}).waitFor();
    await page.getByText('hound', {exact: true}).waitFor();
    assert.equal(await answer.inputValue(), 'wrong');
    assert.equal(await answer.isDisabled(), true);
    assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'Weiter');

    await page.reload();
    await page.getByText('Noch nicht ganz', {exact: true}).waitFor();
    assert.equal(await page.getByLabel('Englische Übersetzung').inputValue(), 'wrong');
    await page.getByRole('button', {name: 'Weiter', exact: true}).click();
    await page.getByLabel('Englische Übersetzung').fill('dog');
    await page.getByLabel('Englische Übersetzung').press('Enter');
    await page.getByText('Richtig!', {exact: true}).waitFor();
    assert.equal((await productState(page)).ledger.events.filter(({type}) => type === 'answer.recorded').length, 2);

    await page.getByRole('button', {name: 'Profil wechseln', exact: true}).click();
    await page.getByRole('button', {name: /^Ben/}).click();
    await page.getByRole('button', {name: 'Profil wechseln', exact: true}).click();
    await page.getByRole('button', {name: /^Ada/}).click();
    await page.getByRole('button', {name: 'Fortsetzen', exact: true}).click();
    await page.getByText('Richtig!', {exact: true}).waitFor();
    assert.match(await page.locator('.practice-points').textContent(), /10 Punkte/);

    await page.getByRole('button', {name: 'Weiter', exact: true}).click();
    let completedState;
    for (let index = 0; index < 20; index += 1) {
      completedState = await productState(page);
      const activeRound = Object.values(completedState.rounds).find(({status}) => !['completed', 'abandoned'].includes(status));
      if (activeRound.status === 'exhausted') break;
      if (activeRound.status === 'asking') {
        await page.getByLabel('Englische Übersetzung').fill('dog');
        await page.getByRole('button', {name: 'Prüfen', exact: true}).click();
      }
      await page.getByRole('button', {name: 'Weiter', exact: true}).click();
    }
    await page.getByRole('heading', {name: 'Für heute ist alles geschafft'}).waitFor();
    assert.equal(await page.getByRole('button', {name: 'Weitere Vokabeln', exact: true}).count(), 0);
    assert.equal(await page.getByText(/weitere zulässige Wörter wählen/i).count(), 0);
    await page.getByText(/Alle verfügbaren Wörter dieser Runde sind beantwortet/i).waitFor();
    completedState = await productState(page);
    const exhaustedRound = Object.values(completedState.rounds).find(({status}) => status === 'exhausted');
    const expectedAnswers = exhaustedRound.answeredIds.length;
    await page.getByRole('button', {name: 'Runde beenden', exact: true}).click();
    await page.getByRole('heading', {name: 'Runde geschafft!'}).waitFor();
    assert.match(await page.locator('.round-summary').innerText(), new RegExp(`Antworten\\s*${expectedAnswers}`));
    assert.match(await page.locator('.round-summary').innerText(), new RegExp(`Antwortpunkte\\s*${(expectedAnswers - 1) * 10}`));
    assert.match(await page.locator('.round-summary').innerText(), /Rundenbonus\s*20/);

    await page.setViewportSize({width: 390, height: 844});
    await page.screenshot({path: resolve(resultsDirectory, 'trainer-summary-mobile.png'), fullPage: true});
    await page.setViewportSize({width: 1280, height: 900});
    await page.screenshot({path: resolve(resultsDirectory, 'trainer-summary-desktop.png'), fullPage: true});

    const expectedPoints = ((expectedAnswers - 1) * 10) + 20;
    await page.getByRole('button', {name: 'Neue Runde', exact: true}).click();
    assert.equal(await page.getByRole('radio', {name: /^Neue Vokabeln/u}).isDisabled(), true);
    await page.getByText(/schon mindestens einmal beantwortet/i).waitFor();
    assert.equal(await page.getByRole('heading', {name: 'Runde geschafft!'}).count(), 0);
    await page.getByRole('radio', {name: /^Alle Vokabeln/u}).waitFor();
    await page.getByRole('button', {name: 'Profil wechseln', exact: true}).click();
    await page.locator('#adult-entry').click();
    await page.locator('#adult-pin').fill('1234');
    await page.locator('#adult-unlock').click();
    await page.getByRole('button', {name: 'Vokabeln', exact: true}).click();
    await page.getByLabel('Lektion auswählen').selectOption({label: 'Unit 1'});
    await page.getByRole('button', {name: 'Wort hinzufügen', exact: true}).click();
    const addWord = page.locator('form').filter({has: page.getByRole('button', {name: 'Vokabel hinzufügen', exact: true})});
    await addWord.locator('input[name="german"]').fill('Schiff');
    await addWord.locator('input[name="answers"]').fill('ship');
    await addWord.getByRole('button', {name: 'Vokabel hinzufügen', exact: true}).click();
    await page.getByText('Die Vokabel wurde hinzugefügt.', {exact: true}).waitFor();
    await page.getByRole('button', {name: 'Zur Profilauswahl', exact: true}).click();
    await page.getByRole('button', {name: /^Ada/}).click();
    assert.match(await page.locator('.practice-points').textContent(), new RegExp(`${expectedPoints} Punkte`));
    await startPracticeRound(page);
    assert.match(await page.locator('.practice-points').textContent(), new RegExp(`${expectedPoints} Punkte`));

    const preserved = await page.evaluate(async (initialState) => {
      const {mountShell} = await import('../src/trainer/ui/shell.js');
      const profileId = Object.values(initialState.rounds).find(({status}) => status === 'asking').profileId;
      sessionStorage.setItem('vokabeltrainer-shell-v1', JSON.stringify({
        view: 'practice', profileId, practiceActive: true,
      }));
      let current = structuredClone(initialState);
      const host = document.createElement('div');
      document.body.append(host);
      const shell = mountShell({
        root: host,
        commands: {getState: () => structuredClone(current)},
        pinGate: {isUnlocked: () => false, lock() {}},
      });
      shell.render();
      const input = host.querySelector('#answer');
      input.value = 'unsent draft';
      input.focus();
      current.pendingPackets.push({kind: 'unrelated-background-update'});
      shell.stateChanged();
      const result = {
        sameNode: input === host.querySelector('#answer'),
        value: host.querySelector('#answer').value,
        focused: document.activeElement === input,
      };
      shell.destroy();
      host.remove();
      return result;
    }, await productState(page));
    assert.deepEqual(preserved, {sameNode: true, value: 'unsent draft', focused: true});

    await page.setViewportSize({width: 390, height: 844});
    await page.screenshot({path: resolve(resultsDirectory, 'trainer-practice-mobile.png'), fullPage: true});
    await page.setViewportSize({width: 1280, height: 900});
    await page.screenshot({path: resolve(resultsDirectory, 'trainer-practice-desktop.png'), fullPage: true});
    await page.setViewportSize({width: 320, height: 700});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
    await page.screenshot({path: resolve(resultsDirectory, 'trainer-practice-320.png'), fullPage: true});
    await page.setViewportSize({width: 390, height: 844});
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
    await page.screenshot({path: resolve(resultsDirectory, 'trainer-practice-200-percent.png'), fullPage: true});
    await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
    await page.emulateMedia({reducedMotion: 'reduce'});
    assert.equal(await page.locator('#practice-submit').evaluate((node) => getComputedStyle(node).transitionDuration), '0s');

    const beforeFailure = await productState(page);
    const beforeFailureAnswers = beforeFailure.ledger.events.filter(({type}) => type === 'answer.recorded').length;
    await page.evaluate(() => {
      const original = IDBObjectStore.prototype.put;
      let failNext = true;
      IDBObjectStore.prototype.put = function put(...args) {
        if (failNext) {
          failNext = false;
          throw new DOMException('synthetic full storage', 'QuotaExceededError');
        }
        return original.apply(this, args);
      };
    });
    await page.getByLabel('Englische Übersetzung').fill('ship');
    await page.getByRole('button', {name: 'Prüfen', exact: true}).click();
    await page.getByText('Die lokalen Produktdaten konnten nicht gespeichert werden.', {exact: true}).waitFor();
    assert.equal(await page.getByLabel('Englische Übersetzung').inputValue(), 'ship');
    assert.equal((await productState(page)).ledger.events.filter(({type}) => type === 'answer.recorded').length, beforeFailureAnswers);
    await page.getByRole('button', {name: 'Prüfen', exact: true}).click();
    await page.getByText('Richtig!', {exact: true}).waitFor();
    await page.getByRole('button', {name: 'Weiter', exact: true}).click();

    const staleGerman = await page.locator('.word-card h1').textContent();
    const answersBeforeRevision = (await productState(page)).ledger.events.filter(({type}) => type === 'answer.recorded').length;
    await page.getByRole('button', {name: 'Profil wechseln', exact: true}).click();
    await page.locator('#adult-entry').click();
    await page.locator('#adult-pin').fill('1234');
    await page.locator('#adult-unlock').click();
    await page.getByRole('button', {name: 'Vokabeln', exact: true}).click();
    await page.getByLabel('Lektion auswählen').selectOption({label: 'Unit 1'});
    const staleCard = page.locator(`[data-word-german="${staleGerman}"]`);
    await staleCard.getByRole('button', {name: 'Bearbeiten', exact: true}).click();
    const staleEditor = page.locator('form.vocabulary-editor');
    await staleEditor.locator('input[name="answers"]').fill('changed-answer');
    await staleEditor.getByRole('button', {name: 'Änderung speichern', exact: true}).click();
    await page.getByText('Die Vokabel wurde gespeichert.', {exact: true}).waitFor();
    await page.getByRole('button', {name: 'Zur Profilauswahl', exact: true}).click();
    await page.getByRole('button', {name: /^Ada/}).click();
    await page.getByRole('button', {name: 'Fortsetzen', exact: true}).click();
    await page.getByText('Die geänderte Vokabel wurde ohne Wertung übersprungen.', {exact: true}).waitFor();
    assert.equal((await productState(page)).ledger.events.filter(({type}) => type === 'answer.recorded').length, answersBeforeRevision);
    assert.deepEqual(pageErrors, []);
  } finally {
    await context.close();
    await harness.close();
  }
});

test('trainer practice reacts to background profile invalidation without scoring', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page, context} = await harness.newDevice();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  try {
    await page.goto(harness.baseUrl);
    await setupPractice(page, {first: ['Hund', 'dog'], second: ['Katze', 'cat']});
    await page.getByRole('button', {name: /^Ada/}).click();
    await startPracticeRound(page);

    const result = await page.evaluate(async (initialState) => {
      const {mountShell} = await import('../src/trainer/ui/shell.js');
      const profileRevision = initialState.ledger.events.find((event) => (
        event.type === 'entity.revised' && event.payload.entityType === 'profile'
      ));
      const profileId = profileRevision.payload.entityId;
      const answerCount = (state) => state.ledger.events.filter(({type}) => type === 'answer.recorded').length;
      const session = JSON.stringify({view: 'practice', profileId, practiceActive: true});

      function mount(state) {
        sessionStorage.setItem('vokabeltrainer-shell-v1', session);
        let current = structuredClone(state);
        const host = document.createElement('div');
        document.body.append(host);
        const shell = mountShell({
          root: host,
          commands: {getState: () => structuredClone(current)},
          pinGate: {isUnlocked: () => false, lock() {}},
        });
        shell.render();
        return {host, shell, update(next) { current = structuredClone(next); }};
      }

      const valid = mount(initialState);
      const input = valid.host.querySelector('#answer');
      input.value = 'unsent draft';
      input.focus();
      const unrelated = structuredClone(initialState);
      unrelated.pendingPackets.push({kind: 'unrelated-background-update'});
      valid.update(unrelated);
      valid.shell.stateChanged();
      const preserved = {
        sameNode: input === valid.host.querySelector('#answer'),
        value: valid.host.querySelector('#answer')?.value,
        focused: document.activeElement === input,
      };
      valid.shell.destroy();
      valid.host.remove();

      const archivedState = structuredClone(initialState);
      const archive = structuredClone(profileRevision);
      archive.id = 'browser-profile-archived';
      archive.clock = archivedState.clock + 1;
      archive.payload.parents = [profileRevision.id];
      archive.payload.value = {...profileRevision.payload.value, archived: true};
      archivedState.clock = archive.clock;
      archivedState.ledger.events.push(archive);
      const archived = mount(initialState);
      archived.update(archivedState);
      archived.shell.stateChanged();
      const archiveResult = {
        redirected: archived.host.querySelector('#profile-list') !== null,
        notice: archived.host.textContent.includes('Die offene Antwort wurde nicht gewertet.'),
        inputRemoved: archived.host.querySelector('#answer') === null,
        answerCount: answerCount(archivedState),
      };
      archived.shell.destroy();
      archived.host.remove();

      const conflictState = structuredClone(initialState);
      const left = structuredClone(profileRevision);
      left.id = 'browser-profile-conflict-left';
      left.clock = conflictState.clock + 1;
      left.payload.parents = [profileRevision.id];
      left.payload.value = {...profileRevision.payload.value, name: 'Ada A'};
      const right = structuredClone(profileRevision);
      right.id = 'browser-profile-conflict-right';
      right.clock = conflictState.clock + 2;
      right.payload.parents = [profileRevision.id];
      right.payload.value = {...profileRevision.payload.value, name: 'Ada B'};
      conflictState.clock = right.clock;
      conflictState.ledger.events.push(left, right);
      const conflicted = mount(initialState);
      conflicted.update(conflictState);
      conflicted.shell.stateChanged();
      const conflictResult = {
        redirected: conflicted.host.querySelector('#profile-list') !== null,
        notice: conflicted.host.textContent.includes('Die offene Antwort wurde nicht gewertet.'),
        inputRemoved: conflicted.host.querySelector('#answer') === null,
        answerCount: answerCount(conflictState),
      };
      conflicted.shell.destroy();
      conflicted.host.remove();

      return {preserved, archiveResult, conflictResult, initialAnswers: answerCount(initialState)};
    }, await productState(page));

    assert.deepEqual(result.preserved, {sameNode: true, value: 'unsent draft', focused: true});
    assert.deepEqual(result.archiveResult, {
      redirected: true, notice: true, inputRemoved: true, answerCount: result.initialAnswers,
    });
    assert.deepEqual(result.conflictResult, {
      redirected: true, notice: true, inputRemoved: true, answerCount: result.initialAnswers,
    });
    assert.deepEqual(pageErrors, []);
  } finally {
    await context.close();
    await harness.close();
  }
});

test('trainer setup, adult decisions, persistence and BFCache lifecycle', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const device = await harness.newDevice();
  const {page, context} = device;
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await mkdir(resultsDirectory, {recursive: true});

  try {
    await page.goto(harness.baseUrl);
    await page.keyboard.press('Tab');
    assert.match(await page.evaluate(() => document.activeElement?.textContent ?? ''), /Zum Inhalt/);
    const controlMetrics = await page.locator('button, input, textarea, select').evaluateAll((controls) => (
      controls.filter((control) => control.getClientRects().length).map((control) => ({
        height: control.getBoundingClientRect().height,
        fontSize: Number.parseFloat(getComputedStyle(control).fontSize),
      }))
    ));
    assert.ok(controlMetrics.every(({height}) => height >= 44));
    assert.ok(controlMetrics.filter((_, index) => index > 0).every(({fontSize}) => fontSize >= 16));
    const longAnswers = [150, 151, 152].map((length, index) => String.fromCharCode(97 + index).repeat(length)).join(' | ');
    assert.ok(longAnswers.length > 420);
    await page.locator('#dataset-name').fill('Familienwortschatz');
    await page.locator('#setup-pin').fill('1234');
    await page.locator('#setup-pin-repeat').fill('1234');
    await page.locator('#setup-profile').fill('Ada');
    await page.locator('#setup-lesson').fill('Unit 1');
    await page.locator('#setup-word-1-german').fill('Hund');
    assert.ok(await page.locator('#setup-word-1-answers').evaluate(
      (input, requiredLength) => input.maxLength >= requiredLength,
      longAnswers.length,
    ));
    await page.locator('#setup-word-1-answers').fill(longAnswers);
    await page.locator('#setup-word-2-german').fill('Fahrrad');
    await page.locator('#setup-word-2-answers').fill('bicycle | bike');
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {value: 'hidden', configurable: true});
      document.dispatchEvent(new Event('visibilitychange'));
    });
    assert.equal(await page.locator('#dataset-name').inputValue(), 'Familienwortschatz');
    assert.equal(await page.locator('#setup-pin').inputValue(), '1234');
    assert.equal(await page.locator('#setup-profile').inputValue(), 'Ada');
    assert.equal(await page.locator('#setup-word-1-answers').inputValue(), longAnswers);
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {value: 'visible', configurable: true});
      window.__busySetupRenders = 0;
      window.__setupObserver = new MutationObserver(() => {
        const form = document.querySelector('#setup-form[aria-busy="true"]');
        if (form?.querySelector('#setup-submit:disabled')) window.__busySetupRenders += 1;
      });
      window.__setupObserver.observe(document.querySelector('#app'), {childList: true, subtree: true});
      const submit = document.querySelector('#setup-submit');
      submit.click();
      submit.click();
    });
    await page.locator('#profile-list .profile-card', {hasText: /^Ada/}).waitFor({timeout: 8_000})
      .catch(async (error) => {
        error.message += `\nVisible page:\n${await page.locator('body').innerText()}\nPage errors: ${pageErrors.join(' | ')}`;
        throw error;
      });
    await page.screenshot({path: resolve(resultsDirectory, 'trainer-setup-mobile.png'), fullPage: true});

    const stateAfterSetup = await productState(page);
    assert.equal(stateAfterSetup.ledger.descriptor.name, 'Familienwortschatz');
    assert.equal(stateAfterSetup.pinVerifier === null, false);
    assert.doesNotMatch(JSON.stringify(stateAfterSetup.pinVerifier), /1234/);
    assert.equal(stateAfterSetup.ledger.events.filter((event) => event.type === 'entity.revised').length, 4);
    assert.ok(await page.evaluate(() => window.__busySetupRenders > 0));
    assert.deepEqual(stateAfterSetup.ledger.events.find((event) => (
      event.type === 'entity.revised' && event.payload.entityType === 'word'
      && event.payload.value.german === 'Hund'
    )).payload.value.answers, longAnswers.split(' | '));

    for (const [label, destinationHeading] of [
      ['Üben', 'Hallo, Ada!'],
      ['Inselreise', 'Deine Inselreise'],
      ['Mein Avatar', 'Mein Avatar'],
    ]) {
      await page.getByRole('button', {name: label, exact: true}).click();
      await page.getByText(/Wähle zuerst ein Lernprofil/i).waitFor();
      assert.equal(await page.getByText(/nächsten Arbeitspaket|folgt mit den freigeschalteten/i).count(), 0);
      await page.getByRole('button', {name: 'Profil auswählen', exact: true}).click();
      await page.getByRole('heading', {name: 'Wer möchte üben?'}).waitFor();
      await page.locator('#profile-list .profile-card', {hasText: /^Ada/}).click();
      await page.getByRole('heading', {name: destinationHeading, exact: true}).waitFor();
      await page.getByRole('button', {name: 'Profil wechseln', exact: true}).click();
      await page.evaluate(() => {
        const key = 'vokabeltrainer-shell-v1';
        const state = JSON.parse(sessionStorage.getItem(key));
        sessionStorage.setItem(key, JSON.stringify({...state, view: 'profiles', profileId: null}));
      });
      await page.reload();
      await page.getByRole('heading', {name: 'Wer möchte üben?'}).waitFor();
    }

    await page.reload();
    await page.locator('#adult-entry').click();
    await page.locator('#adult-unlock').waitFor();
    await holdNextPinDerivation(page);
    await page.locator('#adult-pin').fill('1234');
    await page.locator('#adult-unlock').click();
    await backgroundDuringPinDerivation(page);
    await page.locator('#profile-list').waitFor();
    await page.locator('#adult-entry').click();
    await page.locator('#adult-unlock').waitFor();
    await page.locator('#adult-pin').fill('1234');
    await page.locator('#adult-unlock').click();
    await page.locator('#adult-nav').waitFor();

    await page.getByRole('button', {name: 'Vokabeln', exact: true}).click();
    await page.getByLabel('Lektion auswählen').selectOption({label: 'Unit 1'});
    await page.getByRole('button', {name: 'Lektion bearbeiten', exact: true}).click();
    const lessonForm = page.locator('form').filter({has: page.getByRole('heading', {name: 'Lektion bearbeiten'})});
    const assignment = lessonForm.getByRole('checkbox', {name: 'Ada'});
    await assignment.uncheck();
    await lessonForm.getByRole('button', {name: 'Speichern'}).click();
    await page.getByText('Lektion und Zuordnung wurden gespeichert.', {exact: true}).waitFor();
    assert.equal((await productState(page)).ledger.events.filter(({type}) => type === 'entity.revised').length, 5);
    await page.getByRole('button', {name: 'Lektion bearbeiten', exact: true}).click();
    const refreshedLessonForm = page.locator('form').filter({has: page.getByRole('heading', {name: 'Lektion bearbeiten'})});
    await refreshedLessonForm.getByRole('checkbox', {name: 'Ada'}).check();
    await refreshedLessonForm.getByRole('button', {name: 'Speichern'}).click();
    await page.getByText('Lektion und Zuordnung wurden gespeichert.', {exact: true}).waitFor();

    await page.locator('[data-word-german="Hund"]').getByRole('button', {name: 'Bearbeiten', exact: true}).click();
    const editWord = page.locator('form.vocabulary-editor');
    assert.ok(await editWord.locator('input[name="answers"]').evaluate(
      (input, requiredLength) => input.maxLength >= requiredLength,
      longAnswers.length,
    ));
    await editWord.locator('input[name="answers"]').fill('hound');
    assert.match(await editWord.locator('[data-revision-preview]').textContent(), /Serie beginnt/);
    await editWord.getByRole('button', {name: 'Abbrechen', exact: true}).click();
    await page.getByRole('button', {name: 'Verwerfen', exact: true}).click();

    await page.getByRole('button', {name: 'Mehrere Wörter einfügen', exact: true}).click();
    await page.locator('#import-text').fill('Bank\tbench\tSitzplatz\textra');
    await page.locator('#import-preview').click();
    await page.getByText(/Rohzeile:.*Sitzplatz.*extra/).waitFor();
    const structuralRow = page.locator('[data-import-row="row-1"]');
    await structuralRow.locator('input[name="german"]').fill('Sitzbank');
    await structuralRow.locator('input[name="german"]').press('Tab');
    assert.equal(await page.locator('#import-apply').isDisabled(), true);
    await page.getByText(/Rohzeile:.*Sitzplatz.*extra/).waitFor();
    await structuralRow.getByRole('button', {name: /Struktur.*bestätigen/}).click();
    assert.equal(await page.locator('#import-apply').isEnabled(), true);
    await page.locator('#import-apply').click();
    await page.getByText('Sitzbank', {exact: true}).waitFor();

    await page.getByRole('button', {name: 'Mehrere Wörter einfügen', exact: true}).click();
    await page.locator('#import-text').fill('"mehr\tdeutig"\tanswer');
    await page.locator('#import-preview').click();
    await page.getByText(/Rohzeile:.*"mehr.*deutig".*answer/).waitFor();
    const quotedRow = page.locator('[data-import-row="row-1"]');
    await quotedRow.locator('input[name="hint"]').fill('Nur der Hinweis wurde geändert');
    await quotedRow.locator('input[name="hint"]').press('Tab');
    assert.equal(await page.locator('#import-apply').isDisabled(), true);
    await quotedRow.locator('select').selectOption('skip');
    assert.equal(await page.locator('#import-apply').isEnabled(), true);
    await page.locator('#import-apply').click();

    await page.getByRole('button', {name: 'Mehrere Wörter einfügen', exact: true}).click();
    await page.locator('#import-text').fill(`Langform\t${longAnswers}`);
    await page.locator('#import-preview').click();
    assert.equal(await page.locator('[data-import-row="row-1"] input[name="answers"]').inputValue(), longAnswers);
    assert.ok(await page.locator('[data-import-row="row-1"] input[name="answers"]').evaluate(
      (input, requiredLength) => input.maxLength >= requiredLength,
      longAnswers.length,
    ));
    await page.locator('#import-apply').click();
    await page.getByText('Langform', {exact: true}).waitFor();

    await page.getByRole('button', {name: 'Mehrere Wörter einfügen', exact: true}).click();
    await page.locator('#import-text').fill('Pflichtfeld fehlt\t');
    await page.locator('#import-preview').click();
    assert.equal(await page.locator('#import-apply').isDisabled(), true);
    await page.locator('#import-text').fill('Fahrrad\tbicycle | bike\n<img onerror=window.__xss=1>\timage');
    await page.locator('#import-preview').click();
    assert.equal(await page.locator('#import-apply').isDisabled(), true);
    await page.locator('[data-import-row="row-1"] select').selectOption('separate');
    assert.equal(await page.locator('#import-apply').isEnabled(), true);
    await page.locator('#import-apply').click();
    await page.getByText('<img onerror=window.__xss=1>', {exact: true}).waitFor();
    assert.equal(await page.evaluate(() => window.__xss), undefined);

    await page.goto(new URL('../styles.css', harness.baseUrl).href);
    await seedOneCorrectAnswer(page, await productState(page));
    await page.goto(harness.baseUrl);
    await page.locator('#adult-entry').click();
    await page.locator('#adult-pin').fill('1234');
    await page.locator('#adult-unlock').click();
    await page.getByRole('button', {name: 'Vokabeln', exact: true}).click();
    await page.getByLabel('Lektion auswählen').selectOption({label: 'Unit 1'});
    await page.getByText('<img onerror=window.__xss=1>', {exact: true}).waitFor();
    const hundRow = page.locator('[data-word-german="Hund"]');
    await hundRow.getByRole('button', {name: 'Archivieren'}).click();
    await page.getByRole('button', {name: 'Archiviert', exact: true}).click();
    await page.locator('[data-word-german="Hund"]').getByRole('button', {name: 'Reaktivieren'}).click();
    await page.getByRole('button', {name: 'Lernstand'}).click();
    await page.getByText(/Wortdetails \(/).click();
    const progressRow = page.locator('[data-statistics-word="Hund"]');
    assert.equal(await progressRow.locator('[data-word-stat="attempts"]').textContent(), '1');
    assert.equal((await productState(page)).ledger.events.some(({id}) => id === 'browser-history-answer'), true);

    await page.setViewportSize({width: 1280, height: 900});
    await page.screenshot({path: resolve(resultsDirectory, 'trainer-adult-desktop.png'), fullPage: true});
    const resumableState = await productState(page);

    await page.getByRole('button', {name: 'Einstellungen', exact: true}).click();
    const changePin = page.locator('details').filter({has: page.locator('summary', {hasText: 'PIN ändern'})});
    await changePin.locator('summary').click();
    await changePin.locator('input[name="current"]').fill('1234');
    await changePin.locator('input[name="next"]').fill('5678');
    await changePin.locator('input[name="repeat"]').fill('5678');
    const beforeChangeHash = (await productState(page)).pinVerifier.hash;
    await holdNextPinDerivation(page);
    await changePin.getByRole('button', {name: 'PIN ändern'}).click();
    await backgroundDuringPinDerivation(page);
    await waitForVerifierChange(page, beforeChangeHash);
    await page.locator('#profile-list').waitFor();
    await page.locator('#adult-entry').click();
    await page.locator('#adult-unlock').waitFor();
    await page.locator('#adult-pin').fill('5678');
    await page.locator('#adult-unlock').click();
    await page.locator('#adult-nav').waitFor();

    await page.getByRole('button', {name: 'Einstellungen', exact: true}).click();
    const resetPin = page.locator('details').filter({has: page.locator('summary', {hasText: 'PIN vergessen'})});
    await resetPin.locator('summary').click();
    await resetPin.locator('input[name="confirmation"]').fill('PIN zurücksetzen');
    await resetPin.locator('input[name="next"]').fill('9012');
    await resetPin.locator('input[name="repeat"]').fill('9012');
    const beforeResetHash = (await productState(page)).pinVerifier.hash;
    await holdNextPinDerivation(page);
    await resetPin.getByRole('button', {name: 'Vergessene PIN lokal zurücksetzen'}).click();
    await backgroundDuringPinDerivation(page);
    await waitForVerifierChange(page, beforeResetHash);
    await page.locator('#profile-list').waitFor();
    await page.locator('#adult-entry').click();
    await page.locator('#adult-unlock').waitFor();
    await page.locator('#adult-pin').fill('9012');
    await page.locator('#adult-unlock').click();
    await page.locator('#adult-nav').waitFor();

    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {value: 'hidden', configurable: true});
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.locator('#profile-list').waitFor();
    await page.locator('#adult-entry').click();
    await page.locator('#adult-unlock').waitFor();

    await page.evaluate(() => {
      window.__trainerBfcacheMarker = 1;
      addEventListener('pageshow', (event) => {
        if (event.persisted) sessionStorage.setItem('trainer-bfcache-restored', 'yes');
      });
    });
    await page.goto(new URL('../styles.css', harness.baseUrl).href);
    const second = await context.newPage();
    try {
      await second.goto(harness.baseUrl);
      await second.locator('#profile-list').waitFor();
      await page.goBack({waitUntil: 'commit', timeout: 5_000}).catch((error) => {
        if (error?.name !== 'TimeoutError') throw error;
      });
      await page.waitForFunction(() => sessionStorage.getItem('trainer-bfcache-restored') === 'yes');
      await page.locator('#app-error').filter({hasText: /anderen (Tab|Fenster)|bereits geöffnet/i}).waitFor();
      assert.equal(await page.evaluate(() => window.__trainerBfcacheMarker), undefined);
    } finally {
      await second.close();
    }

    const interrupted = await harness.newDevice();
    try {
      await interrupted.page.goto(new URL('../styles.css', harness.baseUrl).href);
      const unfinished = structuredClone(resumableState);
      unfinished.pinVerifier = null;
      await interrupted.page.evaluate(({key, value}) => localStorage.setItem(key, value), {
        key: 'vokabeltrainer-product-device-id', value: unfinished.deviceId,
      });
      await writeProductState(interrupted.page, unfinished);
      await interrupted.page.goto(harness.baseUrl);
      await interrupted.page.getByRole('heading', {name: 'Einrichtung fortsetzen'}).waitFor();
      await interrupted.page.locator('#setup-pin').fill('6789');
      await interrupted.page.locator('#setup-pin-repeat').fill('6789');
      await interrupted.page.locator('#setup-profile').fill('Wird nicht dupliziert');
      await interrupted.page.locator('#setup-lesson').fill('Wird nicht dupliziert');
      await interrupted.page.locator('#setup-word-1-german').fill('Eins');
      await interrupted.page.locator('#setup-word-1-answers').fill('one');
      await interrupted.page.locator('#setup-word-2-german').fill('Zwei');
      await interrupted.page.locator('#setup-word-2-answers').fill('two');
      await interrupted.page.evaluate(() => {
        const submit = document.querySelector('#setup-submit');
        submit.click();
        submit.click();
      });
      await interrupted.page.locator('#profile-list .profile-card', {hasText: /^Ada/}).waitFor();
      const resumed = await productState(interrupted.page);
      assert.equal(resumed.pinVerifier === null, false);
      assert.equal(resumed.ledger.events.filter((event) => (
        event.type === 'entity.revised' && event.payload.entityType === 'profile'
      )).length, 1);
    } finally {
      await interrupted.context.close();
    }

    assert.deepEqual(pageErrors, []);
    assert.deepEqual(harness.google.unexpected, []);
  } finally {
    await harness.close();
  }
});

test('trainer rewards render the complete journey and save profile-specific avatar choices', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page, context} = await harness.newDevice();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await mkdir(resultsDirectory, {recursive: true});

  try {
    await page.goto(harness.baseUrl);
    await setupPractice(page);
    await addSecondProfile(page);
    const base = await productState(page);
    await page.getByRole('button', {name: /^Ada/}).click();
    await page.getByRole('button', {name: 'Inselreise', exact: true}).click();

    const equipmentNames = ['Kappe', 'Rucksack', 'Sonnenhut', 'Fernglas', 'Bergmütze', 'Kompass'];
    for (const milestone of [
      {points: 0, level: 1, stages: 0, islands: [true, false, false], equipment: [false, false, false, false, false, false]},
      {points: 200, level: 2, stages: 1, islands: [true, false, false], equipment: [true, false, false, false, false, false]},
      {points: 600, level: 4, stages: 3, islands: [true, false, false], equipment: [true, true, false, false, false, false]},
      {points: 1000, level: 6, stages: 5, islands: [true, true, false], equipment: [true, true, true, false, false, false]},
      {points: 1400, level: 8, stages: 7, islands: [true, true, false], equipment: [true, true, true, true, false, false]},
      {points: 2000, level: 11, stages: 10, islands: [true, true, true], equipment: [true, true, true, true, true, false]},
      {points: 2600, level: 14, stages: 13, islands: [true, true, true], equipment: [true, true, true, true, true, true]},
      {points: 3000, level: 16, stages: 15, islands: [true, true, true], equipment: [true, true, true, true, true, true]},
    ]) {
      const {points, level, stages, islands, equipment} = milestone;
      await writeProductState(page, rewardProgressState(base, points));
      await page.reload();
      await page.getByRole('heading', {name: 'Deine Inselreise'}).waitFor();
      assert.equal(await page.locator('[data-level]').textContent(), `Level ${level}`);
      assert.equal(await page.locator('[data-journey-progress]').textContent(), `${stages} von 15 Etappen`);
      assert.equal(await page.locator('[data-stage]').count(), 15);
      for (const [index, islandId] of ['beach', 'forest', 'mountain'].entries()) {
        const island = page.locator(`[data-island="${islandId}"]`);
        assert.equal(await island.isVisible(), true, `${islandId} visible at ${points} points`);
        assert.equal(await island.getAttribute('data-unlocked'), String(islands[index]), `${islandId} unlocked at ${points} points`);
      }

      await page.getByRole('button', {name: 'Mein Avatar', exact: true}).click();
      for (const [index, equipmentName] of equipmentNames.entries()) {
        const radio = page.getByRole('radio', {name: new RegExp(`^${equipmentName}`)});
        assert.equal(await radio.isVisible(), true, `${equipmentName} visible at ${points} points`);
        assert.equal(await radio.isDisabled(), !equipment[index], `${equipmentName} enabled at ${points} points`);
      }
      await page.getByRole('button', {name: 'Inselreise', exact: true}).click();
    }

    await writeProductState(page, rewardProgressState(base, 3000, {allBadges: true}));
    await page.reload();
    await page.getByText('Reise geschafft!', {exact: true}).waitFor({timeout: 3_000}).catch(async (error) => {
      throw new Error(`${error.message}\nPage errors: ${pageErrors.join(' | ')}\nVisible page:\n${await page.locator('body').innerText()}`);
    });
    assert.equal(await page.locator('[data-level]').textContent(), 'Level 16');
    assert.equal(await page.locator('[data-journey-progress]').textContent(), '15 von 15 Etappen');
    assert.equal(await page.locator('[data-badge][data-earned="true"]').count(), 6);
    assert.equal(await page.getByText(/weitere Insel/i).count(), 0);

    await page.setViewportSize({width: 390, height: 844});
    await page.screenshot({path: resolve(resultsDirectory, 'trainer-rewards-mobile.png'), fullPage: true});
    await page.setViewportSize({width: 1280, height: 900});
    await page.screenshot({path: resolve(resultsDirectory, 'trainer-rewards-desktop.png'), fullPage: true});

    await page.getByRole('button', {name: 'Mein Avatar', exact: true}).click();
    assert.equal(await page.getByRole('group', {name: 'Hautfarbe'}).getByRole('radio').count(), 4);
    assert.equal(await page.getByRole('group', {name: 'Kleidungsfarbe'}).getByRole('radio').count(), 6);
    const previousSkinRadio = await page.getByRole('radio', {name: 'Hautfarbe 4', exact: true}).elementHandle();
    await page.getByRole('radio', {name: 'Hautfarbe 4', exact: true}).check();
    await page.waitForFunction(() => (
      document.activeElement?.matches('input[type="radio"][name="skin"][value="3"]')
      && document.activeElement.checked
    ));
    assert.equal(await previousSkinRadio.evaluate((radio) => radio.isConnected), false);
    assert.deepEqual(await page.evaluate(() => ({
      name: document.activeElement?.getAttribute('name'),
      value: document.activeElement?.getAttribute('value'),
    })), {name: 'skin', value: '3'});
    await page.getByRole('radio', {name: 'Hautfarbe 4', exact: true}).press('ArrowLeft');
    assert.equal(await page.getByRole('radio', {name: 'Hautfarbe 3', exact: true}).isChecked(), true);
    assert.deepEqual(await page.evaluate(() => ({
      name: document.activeElement?.getAttribute('name'),
      value: document.activeElement?.getAttribute('value'),
    })), {name: 'skin', value: '2'});
    await page.getByRole('radio', {name: 'Hautfarbe 3', exact: true}).press('ArrowRight');
    assert.equal(await page.getByRole('radio', {name: 'Hautfarbe 4', exact: true}).isChecked(), true);
    await page.getByRole('radio', {name: 'Kleidung Koralle', exact: true}).check();
    await page.getByRole('radio', {name: 'Kompass', exact: true}).check();
    assert.deepEqual(await page.evaluate(() => ({
      name: document.activeElement?.getAttribute('name'),
      value: document.activeElement?.getAttribute('value'),
    })), {name: 'hand', value: 'compass'});
    await page.getByText('Alle sechs Ausrüstungsteile sind freigeschaltet. Wähle deine Favoriten.', {exact: true}).waitFor();
    assert.equal(await page.evaluate(() => document.activeElement?.classList.contains('skip-link')), false);
    const skipBox = await page.locator('.skip-link').boundingBox();
    assert.ok(skipBox.y + skipBox.height <= 0);
    await page.setViewportSize({width: 390, height: 844});
    assert.equal(await page.evaluate(() => document.activeElement?.classList.contains('skip-link')), false);
    const mobileSkipBox = await page.locator('.skip-link').boundingBox();
    assert.ok(mobileSkipBox.y + mobileSkipBox.height <= 0);
    await page.screenshot({path: resolve(resultsDirectory, 'trainer-avatar-mobile.png'), fullPage: true});
    await page.setViewportSize({width: 1280, height: 900});
    await page.screenshot({path: resolve(resultsDirectory, 'trainer-avatar-desktop.png'), fullPage: true});

    await page.getByRole('button', {name: 'Profil wechseln', exact: true}).click();
    await page.getByRole('button', {name: /^Ben/}).click();
    await page.getByRole('button', {name: 'Mein Avatar', exact: true}).click();
    assert.equal(await page.getByRole('radio', {name: /Kappe.*Level 2/}).isDisabled(), true);
    await page.getByRole('radio', {name: 'Hautfarbe 2', exact: true}).check();
    await page.getByRole('button', {name: 'Profil wechseln', exact: true}).click();
    await page.getByRole('button', {name: /^Ada/}).click();
    await page.getByRole('button', {name: 'Mein Avatar', exact: true}).click();
    assert.equal(await page.getByRole('radio', {name: 'Hautfarbe 4', exact: true}).isChecked(), true);
    const avatarEvents = (await productState(page)).ledger.events.filter(({type}) => type === 'avatar.changed');
    assert.equal(new Set(avatarEvents.map(({payload}) => payload.profileId)).size, 2);
    assert.deepEqual(pageErrors, []);
  } finally {
    await context.close();
    await harness.close();
  }
});

test('trainer sync and restore exposes deliberate Google, download and import flows', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page, context, controls} = await harness.newDevice();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  try {
    await page.goto(harness.baseUrl);
    await setupPractice(page);
    await page.locator('#adult-entry').click();
    if (await page.locator('#adult-pin').count()) {
      await page.locator('#adult-pin').fill('1234');
      await page.locator('#adult-unlock').click();
    }
    await page.getByRole('button', {name: 'Einstellungen', exact: true}).click();

    await page.getByRole('button', {name: 'Mit Google verbinden', exact: true}).click();
    await page.getByText('Google ist für diese Sitzung verbunden.', {exact: true}).waitFor({timeout: 5_000}).catch(async (error) => {
      const diagnostics = await page.evaluate(() => ({
        googleReady: Boolean(window.google?.accounts?.oauth2),
        oauthRequests: window.__syntheticOauthRequests,
        scripts: [...document.scripts].map(({src}) => src),
      }));
      error.message += `\nGoogle diagnostics: ${JSON.stringify(diagnostics)}\nVisible page after Google connect:\n${await page.locator('body').innerText()}`;
      throw error;
    });
    await page.getByLabel('Name des Lernbereichs').fill('Familienwortschatz');
    await page.getByRole('button', {name: 'Neuen Lernbereich anlegen', exact: true}).click();
    await page.getByText('Abgeglichen', {exact: true}).waitFor();

    controls.rejectNextAbout401 = true;
    await page.getByRole('button', {name: 'Zur Profilauswahl', exact: true}).click();
    await page.getByRole('button', {name: /^Ada/}).click();
    await startPracticeRound(page);
    const preservedAnswer = page.getByLabel('Englische Übersetzung');
    await preservedAnswer.fill('unfinished answer');
    await preservedAnswer.focus();
    await page.waitForTimeout(10_500);
    assert.equal(await preservedAnswer.inputValue(), 'unfinished answer');
    assert.equal(await preservedAnswer.evaluate((input) => document.activeElement === input), true);
    await page.getByRole('button', {name: 'Profil wechseln', exact: true}).click();
    await page.locator('#adult-entry').click();
    await page.locator('#adult-pin').fill('1234');
    await page.locator('#adult-unlock').click();
    assert.equal(await page.getByRole('main').count(), 1);
    await page.getByRole('button', {name: 'Einstellungen', exact: true}).click();
    await page.locator('[data-sync-status]').filter({hasText: 'Mit Google verbinden'}).waitFor();
    await page.getByRole('button', {name: 'Mit Google verbinden', exact: true}).click();
    await page.getByText('Google ist für diese Sitzung verbunden.', {exact: true}).waitFor();

    await page.getByRole('button', {name: 'Einstellungen', exact: true}).click();
    const downloading = page.waitForEvent('download');
    await page.getByRole('button', {name: 'Sicherung herunterladen', exact: true}).click();
    const download = await downloading;
    assert.match(download.suggestedFilename(), /\.json$/);
    const backupText = await exportedBackupText(download);
    assert.equal(backupText.includes('pinVerifier'), false);
    assert.equal(backupText.includes('synthetic-browser-token-'), false);
    await page.getByText('Download gestartet', {exact: true}).waitFor();

    const before = await productState(page);
    await page.locator('#backup-file').setInputFiles({
      name: 'future.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({
        format: 'vokabeltrainer-product', formatVersion: 999, ruleVersion: 1, kind: 'backup',
        exportedAt: '2026-09-18T12:00:00.000Z', descriptor: null, snapshot: null,
        events: [], epochHistory: [], safetyCopyIndex: [],
      })),
    });
    await page.getByText(/benötigen eine neuere App-Version/i).waitFor().catch(async (error) => {
      error.message += `\nVisible page after future backup:\n${await page.locator('body').innerText()}`;
      throw error;
    });
    await page.screenshot({path: resolve(resultsDirectory, 'trainer-sync-import-error-mobile.png'), fullPage: true});
    assert.deepEqual(await productState(page), before);

    const validBackup = await page.evaluate(async (current) => {
      const {exportBackup} = await import('/src/trainer/backup/format.js');
      return exportBackup(current, '2026-09-18T12:30:00.000Z');
    }, before);
    await page.locator('#backup-file').setInputFiles({
      name: 'valid.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(validBackup)),
    });
    await page.getByRole('dialog', {name: 'Wiederherstellung prüfen'}).waitFor();
    await page.getByRole('dialog').getByText(/gemeinsame[mn] Datenstand/i).waitFor();
    assert.equal(await page.getByRole('dialog').getByText(/Datenepoche|Schutzgrenzen/i).count(), 0);
    await page.getByRole('dialog').getByRole('button', {name: 'Abbrechen'}).click();
    await page.waitForTimeout(50);
    const restoredFocus = await page.evaluate(() => ({
      activeId: document.activeElement?.id ?? '',
      fileConnected: document.querySelector('#backup-file')?.isConnected ?? false,
      fileCount: document.querySelectorAll('#backup-file').length,
    }));
    assert.deepEqual(restoredFocus, {activeId: 'backup-file', fileConnected: true, fileCount: 1});
    await page.locator('#backup-file').setInputFiles({
      name: 'valid.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(validBackup)),
    });
    await page.getByRole('dialog', {name: 'Wiederherstellung prüfen'}).waitFor();
    const eventsBeforeStaleChange = (await productState(page)).ledger.events.length;
    await page.evaluate(() => {
      [...document.querySelectorAll('#adult-nav button')].find((node) => node.textContent === 'Vokabeln').click();
    });
    await page.locator('[data-word-german="Hund"]').waitFor();
    await page.locator('[data-word-german="Hund"]').evaluate((row) => {
      [...row.querySelectorAll('button')].find((node) => node.textContent === 'Bearbeiten').click();
    });
    await page.locator('form.vocabulary-editor input[name="answers"]').evaluate((input) => {
      input.value = 'dog | hound | canine';
      input.dispatchEvent(new Event('input', {bubbles: true}));
    });
    await page.locator('form.vocabulary-editor').evaluate((form) => {
      form.dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}));
    });
    await page.waitForFunction(async (count) => new Promise((resolveState) => {
      const request = indexedDB.open('vokabeltrainer-product-v1', 1);
      request.onsuccess = () => {
        const database = request.result;
        const get = database.transaction('product-state', 'readonly').objectStore('product-state').get('current');
        get.onsuccess = () => {
          resolveState(get.result.ledger.events.length > count);
          database.close();
        };
      };
    }), eventsBeforeStaleChange);
    await page.getByRole('dialog').getByRole('button', {name: 'Wiederherstellung verbindlich bestätigen'}).click();
    await page.getByText(/Datenstand hat sich geändert.*erneut bestätigt/i).waitFor();
    await page.getByRole('dialog').getByRole('heading', {name: 'Vokabel Hund', exact: true}).waitFor();
    await page.getByRole('dialog').getByText('Vorher: dog / hound / canine', {exact: true}).waitFor();
    await page.getByRole('dialog').getByText('Nachher: dog / hound', {exact: true}).waitFor();
    await page.screenshot({path: resolve(resultsDirectory, 'trainer-restore-stale-mobile.png'), fullPage: true});
    assert.equal(await page.getByRole('dialog').count(), 1);
    await page.getByRole('dialog').getByRole('button', {name: 'Abbrechen'}).click();
    assert.ok((await productState(page)).ledger.events.length > eventsBeforeStaleChange);

    await page.getByRole('button', {name: 'Einstellungen', exact: true}).click();
    controls.rejectNextAbout401 = true;
    await page.getByRole('button', {name: 'Jetzt abgleichen', exact: true}).click();
    await page.locator('[data-sync-status]').filter({hasText: 'Mit Google verbinden'}).waitFor();
    const requests = await page.evaluate(() => window.__syntheticOauthRequests);
    await page.getByRole('button', {name: 'Jetzt abgleichen', exact: true}).click();
    assert.equal(await page.evaluate(() => window.__syntheticOauthRequests), requests);

    await page.evaluate(() => {
      window.__holdSyntheticOauth = true;
      window.__syntheticOauthStarted = false;
      window.__syntheticOauthGate = new Promise((resolveGate) => {
        window.__releaseSyntheticOauth = resolveGate;
      });
    });
    await page.getByRole('button', {name: 'Mit Google verbinden', exact: true}).click();
    await page.waitForFunction(() => window.__syntheticOauthStarted === true);
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {value: 'hidden', configurable: true});
      document.dispatchEvent(new Event('visibilitychange'));
      window.__releaseSyntheticOauth();
    });
    await page.locator('#profile-list').waitFor();
    await page.evaluate(() => {
      window.__holdSyntheticOauth = false;
      Object.defineProperty(document, 'visibilityState', {value: 'visible', configurable: true});
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.locator('#adult-entry').click();
    await page.locator('#adult-pin').fill('1234');
    await page.locator('#adult-unlock').click();
    await page.getByRole('button', {name: 'Einstellungen', exact: true}).click();
    const afterLockedPopup = await page.evaluate(() => window.__syntheticOauthRequests);
    await page.getByRole('button', {name: 'Jetzt abgleichen', exact: true}).click();
    await page.locator('[data-sync-status]').filter({hasText: 'Mit Google verbinden'}).waitFor();
    assert.equal(await page.evaluate(() => window.__syntheticOauthRequests), afterLockedPopup);

    assert.deepEqual(pageErrors, []);
    assert.deepEqual(harness.google.unexpected, []);
    assert.equal((await readSyntheticStorage(page)).includes('synthetic-browser-token-'), false);
  } finally {
    await context.close();
    await harness.close();
  }
});

test('trainer unbound discovery, create and join require an explicit reconnect after authentication errors', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const creator = await harness.newDevice();
  const joining = await harness.newDevice();
  const creating = await harness.newDevice();
  const errors = [];
  for (const {page} of [creator, joining, creating]) {
    page.on('pageerror', (error) => errors.push(error.message));
  }

  const openSync = async ({page}) => {
    await page.locator('#adult-entry').click();
    if (await page.locator('#adult-pin').count()) {
      await page.locator('#adult-pin').fill('1234');
      await page.locator('#adult-unlock').click();
    }
    await page.getByRole('button', {name: 'Einstellungen', exact: true}).click();
  };
  const reconnect = async ({page}) => {
    await page.getByRole('button', {name: 'Mit Google verbinden', exact: true}).click();
    await page.getByText('Google ist für diese Sitzung verbunden.', {exact: true}).waitFor();
  };

  try {
    await creator.page.goto(harness.baseUrl);
    await setupPractice(creator.page, {profile: 'Ada'});
    await openSync(creator);
    await reconnect(creator);
    await creator.page.getByRole('button', {name: 'Neuen Lernbereich anlegen', exact: true}).click();
    await creator.page.getByText('Abgeglichen', {exact: true}).waitFor();

    await joining.page.goto(harness.baseUrl);
    await setupPractice(joining.page, {profile: 'Bea'});
    await openSync(joining);
    await reconnect(joining);
    joining.controls.rejectNextAbout401 = true;
    await joining.page.getByRole('button', {name: 'Vorhandenen Lernbereich verwenden', exact: true}).click();
    await joining.page.locator('[data-sync-status]').filter({hasText: 'Mit Google verbinden'}).waitFor();
    await reconnect(joining);
    await joining.page.getByRole('button', {name: 'Vorhandenen Lernbereich verwenden', exact: true}).click();
    await joining.page.getByRole('button', {name: 'Diesen Lernbereich prüfen', exact: true}).waitFor();

    joining.controls.rejectNextAbout401 = true;
    await joining.page.getByRole('button', {name: 'Diesen Lernbereich prüfen', exact: true}).click();
    await joining.page.locator('[data-sync-status]').filter({hasText: 'Mit Google verbinden'}).waitFor();
    await reconnect(joining);
    await joining.page.getByRole('button', {name: 'Diesen Lernbereich prüfen', exact: true}).click();
    await joining.page.getByRole('heading', {name: 'Lernbereich prüfen'}).waitFor();

    await creating.page.goto(harness.baseUrl);
    await setupPractice(creating.page, {profile: 'Cem'});
    await openSync(creating);
    await reconnect(creating);
    creating.controls.rejectNextAbout401 = true;
    await creating.page.getByRole('button', {name: 'Neuen Lernbereich anlegen', exact: true}).click();
    await creating.page.locator('[data-sync-status]').filter({hasText: 'Mit Google verbinden'}).waitFor();
    await reconnect(creating);
    await creating.page.getByRole('button', {name: 'Neuen Lernbereich anlegen', exact: true}).click();
    await creating.page.getByText('Abgeglichen', {exact: true}).waitFor();

    assert.deepEqual(errors, []);
    assert.deepEqual(harness.google.unexpected, []);
  } finally {
    await Promise.allSettled([creator.context.close(), joining.context.close(), creating.context.close()]);
    await harness.close();
  }
});

test('trainer sync and restore keeps concurrent word versions until an adult resolves them', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const first = await harness.newDevice();
  const second = await harness.newDevice();
  const errors = [];
  first.page.on('pageerror', (error) => errors.push(`A: ${error.message}`));
  second.page.on('pageerror', (error) => errors.push(`B: ${error.message}`));

  const openAdult = async (page) => {
    await page.locator('#adult-entry').click();
    if (await page.locator('#adult-pin').count()) {
      await page.locator('#adult-pin').fill('1234');
      await page.locator('#adult-unlock').click();
    }
    await page.locator('#adult-nav').waitFor();
  };
  const connect = async (page) => {
    await page.getByRole('button', {name: 'Einstellungen', exact: true}).click();
    await page.getByRole('button', {name: 'Mit Google verbinden', exact: true}).click();
    await page.getByText('Google ist für diese Sitzung verbunden.', {exact: true}).waitFor();
  };
  const reviseHund = async (page, answer) => {
    await page.getByRole('button', {name: 'Vokabeln', exact: true}).click();
    await page.locator('[data-word-german="Hund"]').getByRole('button', {name: 'Bearbeiten', exact: true}).click();
    const editor = page.locator('form.vocabulary-editor');
    await editor.locator('input[name="answers"]').fill(answer);
    await editor.getByRole('button', {name: 'Änderung speichern', exact: true}).click();
    await page.getByText('Die Vokabel wurde gespeichert.', {exact: true}).waitFor({timeout: 5_000}).catch(async (error) => {
      error.message += `\nVisible page after revising ${answer}:\n${await page.locator('body').innerText()}`;
      throw error;
    });
  };

  try {
    await mkdir(resultsDirectory, {recursive: true});
    await first.page.goto(harness.baseUrl);
    await setupPractice(first.page);
    await openAdult(first.page);
    await connect(first.page);
    await first.page.getByLabel('Name des Lernbereichs').fill('Gemeinsame Lerninsel');
    await first.page.getByRole('button', {name: 'Neuen Lernbereich anlegen', exact: true}).click();
    await first.page.getByText('Abgeglichen', {exact: true}).waitFor();

    await second.page.goto(harness.baseUrl);
    await setupPractice(second.page);
    await openAdult(second.page);
    await connect(second.page);
    await second.page.getByRole('button', {name: 'Vorhandenen Lernbereich verwenden', exact: true}).click();
    await second.page.getByText('Gefundene Lernbereiche', {exact: true}).waitFor();
    await second.page.getByRole('button', {name: 'Diesen Lernbereich prüfen', exact: true}).click();
    await second.page.getByRole('heading', {name: 'Lernbereich prüfen'}).waitFor({timeout: 5_000}).catch(async (error) => {
      error.message += `\nVisible join page:\n${await second.page.locator('body').innerText()}`;
      throw error;
    });
    await second.page.getByRole('button', {name: 'Lernbereich verwenden', exact: true}).click();
    await second.page.getByRole('button', {name: 'Jetzt abgleichen', exact: true}).click();
    await second.page.getByText('Abgeglichen', {exact: true}).waitFor();
    const unambiguousBackup = await second.page.evaluate(async (current) => {
      const {exportBackup} = await import('/src/trainer/backup/format.js');
      return exportBackup(current, '2026-09-18T13:00:00.000Z');
    }, await productState(second.page));

    first.controls.offline = true;
    second.controls.offline = true;
    await reviseHund(first.page, 'dog | hound | pooch');
    await reviseHund(second.page, 'dog | hound | canine');
    first.controls.offline = false;
    second.controls.offline = false;

    await first.page.getByRole('button', {name: 'Einstellungen', exact: true}).click();
    await first.page.getByRole('button', {name: 'Jetzt abgleichen', exact: true}).click();
    await second.page.getByRole('button', {name: 'Einstellungen', exact: true}).click();
    await second.page.getByRole('button', {name: 'Jetzt abgleichen', exact: true}).click();
    await second.page.getByRole('heading', {name: 'Inhaltskonflikte'}).waitFor();
    await second.page.getByText(/pooch/).waitFor();
    await second.page.getByText(/canine/).waitFor();
    const conflictingBackup = await second.page.evaluate(async (current) => {
      const {exportBackup} = await import('/src/trainer/backup/format.js');
      return exportBackup(current, '2026-09-18T13:30:00.000Z');
    }, await productState(second.page));
    await second.page.getByRole('button', {name: 'Einstellungen', exact: true}).click();
    await second.page.locator('#backup-file').setInputFiles({
      name: 'unambiguous-target.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(unambiguousBackup)),
    });
    const currentConflictPreview = second.page.getByRole('dialog', {name: 'Wiederherstellung prüfen'});
    await currentConflictPreview.getByRole('heading', {name: 'Vorherige Fassung 1', exact: true}).waitFor();
    await currentConflictPreview.getByRole('heading', {name: 'Vorherige Fassung 2', exact: true}).waitFor();
    await currentConflictPreview.getByText('Vorher · Englisch: dog / hound / pooch', {exact: true}).waitFor();
    await currentConflictPreview.getByText('Vorher · Englisch: dog / hound / canine', {exact: true}).waitFor();
    await currentConflictPreview.getByText('Nachher: dog / hound', {exact: true}).waitFor();
    await currentConflictPreview.getByRole('button', {name: 'Abbrechen'}).click();
    await second.page.getByRole('button', {name: 'Einstellungen', exact: true}).click();
    await second.page.screenshot({path: resolve(resultsDirectory, 'trainer-revision-conflict-mobile.png'), fullPage: true});

    await second.page.getByRole('button', {name: 'Zur Profilauswahl', exact: true}).click();
    await second.page.getByRole('button', {name: /^Ada/}).click();
    await startPracticeRound(second.page);
    await second.page.getByRole('heading', {name: 'Tier', exact: true}).waitFor();
    assert.equal(await second.page.getByRole('heading', {name: 'Hund', exact: true}).count(), 0);
    await second.page.getByRole('button', {name: 'Profil wechseln', exact: true}).click();
    await openAdult(second.page);
    await second.page.getByRole('button', {name: 'Einstellungen', exact: true}).click();
    const versions = second.page.getByRole('button', {name: 'Diese Fassung übernehmen', exact: true});
    assert.equal(await versions.count(), 2);
    await versions.first().click();
    await second.page.getByText('Eine gemeinsame Fassung wurde angelegt.', {exact: true}).waitFor();
    assert.equal(await second.page.getByRole('heading', {name: 'Inhaltskonflikte'}).count(), 0);

    await second.page.getByRole('button', {name: 'Jetzt abgleichen', exact: true}).click();
    await second.page.getByText('Abgeglichen', {exact: true}).waitFor();
    await first.page.getByRole('button', {name: 'Jetzt abgleichen', exact: true}).click();
    await first.page.getByText('Abgeglichen', {exact: true}).waitFor();
    await first.page.getByRole('button', {name: 'Einstellungen', exact: true}).click();
    await first.page.locator('#backup-file').setInputFiles({
      name: 'conflicting-words.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(conflictingBackup)),
    });
    const conflictPreview = first.page.getByRole('dialog', {name: 'Wiederherstellung prüfen'});
    await conflictPreview.getByRole('heading', {name: 'Konflikt: Vokabel Hund', exact: true}).waitFor();
    await conflictPreview.getByText('Englisch: dog / hound / pooch', {exact: true}).waitFor();
    await conflictPreview.getByText('Englisch: dog / hound / canine', {exact: true}).waitFor();
    await conflictPreview.getByRole('button', {name: 'Abbrechen'}).click();
    const restoreSourceState = await productState(first.page);
    const restoreBackup = await first.page.evaluate(async (current) => {
      const {exportBackup} = await import('/src/trainer/backup/format.js');
      return exportBackup(current, '2026-09-18T14:00:00.000Z');
    }, restoreSourceState);

    second.controls.offline = true;
    await second.page.getByRole('button', {name: 'Zur Profilauswahl', exact: true}).click();
    await second.page.getByRole('button', {name: /^Ada/}).click();
    await second.page.getByRole('button', {name: 'Neue Runde', exact: true}).click();
    await startPracticeRound(second.page);

    await first.page.locator('#backup-file').setInputFiles({
      name: 'restore-before-offline-answer.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(restoreBackup)),
    });
    await first.page.getByRole('dialog').waitFor({timeout: 10_000}).catch(async (error) => {
      error.message += `\nVisible restore page:\n${await first.page.locator('body').innerText()}`;
      throw error;
    });
    first.controls.loseNextUpload = true;
    await first.page.getByRole('dialog').getByRole('button', {name: 'Wiederherstellung verbindlich bestätigen'}).click();
    await first.page.getByRole('dialog').getByText(/nicht erreicht|vorübergehend/i).waitFor();
    await first.page.reload();
    await first.page.locator('#profile-list').waitFor();
    await openAdult(first.page);
    await connect(first.page);
    await first.page.getByRole('button', {name: 'Einstellungen', exact: true}).click();
    await first.page.getByRole('button', {name: 'Bestätigte Wiederherstellung fortsetzen', exact: true}).click();
    await first.page.getByText('Die bestätigte Wiederherstellung wurde fortgesetzt.', {exact: true}).waitFor();
    assert.ok(await first.page.getByRole('button', {name: 'Sicherheitskopie herunterladen', exact: true}).count() >= 1);

    await second.page.getByLabel('Englische Übersetzung').fill('dog');
    await second.page.getByRole('button', {name: 'Prüfen', exact: true}).click();
    await second.page.getByText('Richtig!', {exact: true}).waitFor();
    second.controls.offline = false;
    await first.page.getByRole('button', {name: 'Einstellungen', exact: true}).click();
    await first.page.getByRole('button', {name: 'Jetzt abgleichen', exact: true}).click();

    await second.page.getByRole('button', {name: 'Profil wechseln', exact: true}).click();
    await openAdult(second.page);
    await second.page.getByRole('button', {name: 'Einstellungen', exact: true}).click();
    await second.page.getByRole('button', {name: 'Jetzt abgleichen', exact: true}).click();
    await second.page.getByRole('heading', {name: 'Alte Änderungen getrennt erhalten'}).waitFor();
    await second.page.getByText(/^\d+ alte Änderungen bleiben getrennt erhalten\.$/).waitFor();
    await second.page.screenshot({path: resolve(resultsDirectory, 'trainer-late-change-mobile.png'), fullPage: true});
    const beforeAdoptionState = await productState(second.page);
    const adoptedProfileId = beforeAdoptionState.ledger.events.find((event) => (
      event.type === 'entity.revised' && event.payload.entityType === 'profile'
    )).payload.entityId;
    const pointsBeforeAdoption = projectState(beforeAdoptionState.ledger).profiles[adoptedProfileId].points;
    const lateAnswer = second.page.getByLabel(/Antwort von Ada/);
    const inspectSelection = second.page.getByRole('button', {name: 'Auswahl prüfen', exact: true});
    assert.equal(await inspectSelection.isDisabled(), true);
    await lateAnswer.check();
    assert.equal(await inspectSelection.isEnabled(), true);
    await lateAnswer.uncheck();
    assert.equal(await inspectSelection.isDisabled(), true);
    await lateAnswer.check();
    assert.equal(await inspectSelection.isEnabled(), true);
    await inspectSelection.click();
    await second.page.getByRole('heading', {name: 'Übernahme bestätigen'}).waitFor();
    const adoptionPreview = second.page.locator('.restore-preview');
    await adoptionPreview.getByRole('heading', {name: 'Ausgewählte Änderungen', exact: true}).waitFor();
    await adoptionPreview.getByText(/Antwort von Ada zu (Hund|Tier).*richtig/).waitFor({timeout: 5_000}).catch(async (error) => {
      error.message += `\nVisible adoption preview:\n${await second.page.locator('body').innerText()}`;
      throw error;
    });
    await adoptionPreview.getByRole('heading', {name: 'Nur benötigte Grundlagen', exact: true}).waitFor();
    await adoptionPreview.getByText(/Rundenstart für Ada/).waitFor();
    await adoptionPreview.getByText(/keine zusätzliche Wertung/i).waitFor();
    await adoptionPreview.getByText('Punkte · Ada', {exact: true}).waitFor();
    await second.page.getByText(new RegExp(`${pointsBeforeAdoption} → ${pointsBeforeAdoption + 10}`)).waitFor();
    await second.page.getByRole('button', {name: 'Ausgewählte Änderungen übernehmen', exact: true}).click();
    await second.page.getByRole('heading', {name: 'Übernahme bestätigen'}).waitFor({state: 'detached'});
    const adoptedState = await productState(second.page);
    assert.equal(projectState(adoptedState.ledger).profiles[adoptedProfileId].points, pointsBeforeAdoption + 10);

    assert.deepEqual(errors, []);
    assert.deepEqual(harness.google.unexpected, []);
  } finally {
    await Promise.allSettled([first.context.close(), second.context.close()]);
    await harness.close();
  }
});

test('trainer sync and restore renders a mobile epoch conflict without choosing a winner', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page, context} = await harness.newDevice();
  try {
    await mkdir(resultsDirectory, {recursive: true});
    await page.goto(harness.baseUrl);
    await setupPractice(page);
    const state = await productState(page);
    const eventIds = state.ledger.events.map(({id}) => id).sort();
    for (const [index, epochId] of ['browser-restore-a', 'browser-restore-b'].entries()) {
      const snapshot = {
        id: `browser-snapshot-${index + 1}`,
        datasetId: state.ledger.descriptor.datasetId,
        effectiveEventIds: eventIds,
        supportEventIds: [],
        contentHash: '',
      };
      snapshot.contentHash = await snapshotHash(snapshot, state.ledger.events);
      state.ledger.snapshots.push(snapshot);
      state.ledger.epochs.push({
        format: 'vokabeltrainer-product', formatVersion: 1, ruleVersion: 1, kind: 'epoch',
        id: epochId, datasetId: state.ledger.descriptor.datasetId,
        parents: [state.ledger.descriptor.rootEpochId], deviceId: state.deviceId,
        clock: state.clock + index + 1,
        occurredAt: `2026-09-18T1${index}:00:00.000Z`,
        snapshotId: snapshot.id, snapshotManifestFileId: null,
      });
    }
    state.clock += 2;
    await writeProductState(page, state);
    await page.reload();
    await page.locator('#adult-entry').click();
    await page.locator('#adult-pin').fill('1234');
    await page.locator('#adult-unlock').click();
    await page.getByRole('button', {name: 'Einstellungen', exact: true}).click();
    await page.getByRole('heading', {name: 'Konflikt zwischen Wiederherstellungen'}).waitFor();
    assert.equal(await page.getByRole('button', {name: /Datenstand .* prüfen/}).count(), 2);
    assert.equal(await page.getByText(/browser-restore|browser-snapshot/).count(), 0);
    await page.screenshot({path: resolve(resultsDirectory, 'trainer-epoch-conflict-mobile.png'), fullPage: true});
    await page.getByRole('button', {name: 'Einstellungen', exact: true}).click();
    const epochOptions = page.locator('#backup-epoch option');
    assert.equal(await epochOptions.count(), 3);
    assert.equal(await page.getByText(/browser-restore|browser-snapshot/).count(), 0);
    assert.equal(await page.getByRole('button', {name: 'Sicherung herunterladen', exact: true}).isDisabled(), true);
    await page.locator('#backup-epoch').selectOption('browser-restore-a');
    assert.equal(await page.getByRole('button', {name: 'Sicherung herunterladen', exact: true}).isEnabled(), true);
    await page.locator('#backup-epoch').selectOption('');
    assert.equal(await page.getByRole('button', {name: 'Sicherung herunterladen', exact: true}).isDisabled(), true);
    await page.locator('#backup-epoch').selectOption('browser-restore-b');
    const conflictedDownload = page.waitForEvent('download');
    await page.getByRole('button', {name: 'Sicherung herunterladen', exact: true}).click();
    assert.match((await conflictedDownload).suggestedFilename(), /\.json$/);
    await page.getByText('Download gestartet', {exact: true}).waitFor();
    await page.screenshot({path: resolve(resultsDirectory, 'trainer-epoch-export-mobile.png'), fullPage: true});
  } finally {
    await context.close();
    await harness.close();
  }
});

test('trainer sync and restore describes archive and assignment conflict choices', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page, context} = await harness.newDevice();
  try {
    await page.goto(harness.baseUrl);
    await setupPractice(page);
    const state = await productState(page);
    const profile = state.ledger.events.find((event) => event.type === 'entity.revised' && event.payload.entityType === 'profile');
    const lesson = state.ledger.events.find((event) => event.type === 'entity.revised' && event.payload.entityType === 'lesson');
    const word = state.ledger.events.find((event) => event.type === 'entity.revised'
      && event.payload.entityType === 'word' && event.payload.value.german === 'Hund');
    const baseEnvelope = {
      format: 'vokabeltrainer-product', formatVersion: 1, ruleVersion: 1, kind: 'event',
      datasetId: state.ledger.descriptor.datasetId, epochId: state.ledger.descriptor.rootEpochId,
      deviceId: state.deviceId, occurredAt: '2026-09-18T15:00:00.000Z', day: '2026-09-18',
      type: 'entity.revised',
    };
    let clock = state.clock;
    const revision = (id, entityType, entityId, parents, value) => ({
      ...baseEnvelope, id, clock: ++clock,
      payload: {entityType, entityId, parents, value},
    });
    state.ledger.events.push(
      revision('browser-unit-2', 'lesson', 'browser-l2', [], {
        name: 'Unit 2', archived: false, profileIds: [profile.payload.entityId],
      }),
      revision('browser-profile-active', 'profile', profile.payload.entityId, [profile.id], {...profile.payload.value, archived: false}),
      revision('browser-profile-archived', 'profile', profile.payload.entityId, [profile.id], {...profile.payload.value, archived: true}),
      revision('browser-lesson-ada', 'lesson', lesson.payload.entityId, [lesson.id], {...lesson.payload.value, profileIds: [profile.payload.entityId]}),
      revision('browser-lesson-none', 'lesson', lesson.payload.entityId, [lesson.id], {...lesson.payload.value, profileIds: []}),
      revision('browser-word-unit-1', 'word', word.payload.entityId, [word.id], {...word.payload.value, lessonId: lesson.payload.entityId}),
      revision('browser-word-unit-2', 'word', word.payload.entityId, [word.id], {...word.payload.value, lessonId: 'browser-l2'}),
    );
    state.clock = clock;
    await writeProductState(page, state);
    await page.reload();
    await page.locator('#adult-entry').click();
    await page.locator('#adult-pin').fill('1234');
    await page.locator('#adult-unlock').click();
    await page.getByRole('button', {name: 'Einstellungen', exact: true}).click();
    await page.getByRole('heading', {name: 'Inhaltskonflikte'}).waitFor();
    await page.getByText('Kind: Ada', {exact: true}).first().waitFor();
    await page.getByText('Status: Aktiv', {exact: true}).first().waitFor();
    await page.getByText('Status: Archiviert', {exact: true}).first().waitFor();
    await page.getByText('Lektion: Unit 1', {exact: true}).first().waitFor();
    await page.getByText('Lektion: Unit 2', {exact: true}).first().waitFor();
    await page.getByText('Lernstand: bleibt bei allen Fassungen gleich', {exact: true}).first().waitFor();
    await page.getByText('Freigegeben für: Ada', {exact: true}).first().waitFor();
    await page.getByText('Freigegeben für: kein Kind', {exact: true}).first().waitFor();
    assert.equal(await page.getByText(/browser-l2|browser-profile|browser-word|browser-lesson/).count(), 0);
  } finally {
    await context.close();
    await harness.close();
  }
});

test('trainer offline starts in a new tab and after a persistent browser restart with the server closed', {timeout: 180_000}, async () => {
  for (const [label, basePath] of [['root', ''], ['repo', '/repo']]) {
    const profile = await syntheticProfileDirectory(label);
    const harness = await createTrainerHarness({basePath});
    let first;
    let restarted;
    try {
      first = await harness.newPersistentDevice({userDataDir: profile.directory});
      await first.page.goto(harness.baseUrl);
      await setupPractice(first.page);
      await first.page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, {timeout: 10_000});
      await first.context.setOffline(true);
      await harness.stopServer();

      await first.page.close();
      const offlineTab = await first.context.newPage();
      await offlineTab.goto(harness.baseUrl, {waitUntil: 'domcontentloaded'});
      await offlineTab.locator('#profile-list').waitFor().catch(async (error) => {
        error.message += `\nOffline page body:\n${await offlineTab.locator('body').innerText()}\nCaches: ${JSON.stringify(await offlineTab.evaluate(() => caches.keys()))}`;
        throw error;
      });
      await offlineTab.getByRole('button', {name: /^Ada/}).click();
      await startPracticeRound(offlineTab);
      await offlineTab.getByLabel('Englische Übersetzung').fill('dog');
      await offlineTab.getByRole('button', {name: 'Prüfen', exact: true}).click();
      await offlineTab.getByText('Richtig!', {exact: true}).waitFor();
      await first.context.close();
      first = null;

      restarted = await harness.newPersistentDevice({userDataDir: profile.directory});
      await restarted.context.setOffline(true);
      await restarted.page.goto(harness.baseUrl, {waitUntil: 'domcontentloaded'});
      await restarted.page.locator('#profile-list').waitFor();
      await restarted.page.getByRole('button', {name: /^Ada/}).click();
      await restarted.page.getByText('1 Antworten sind schon sicher gespeichert.', {exact: true}).waitFor();
      await restarted.page.getByRole('button', {name: 'Fortsetzen', exact: true}).click();
      await restarted.page.getByText('Richtig!', {exact: true}).waitFor();
    } finally {
      await Promise.allSettled([first?.context.close(), restarted?.context.close()]);
      await harness.close();
      if (!profile.directory.startsWith(`${profile.root}${sep}`)) throw new Error('Unsafe profile cleanup target.');
      await rm(profile.directory, {recursive: true, force: true});
    }
  }
});

test('trainer offline update UI blocks typing and pending answers before controlled activation', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page, context} = await harness.newDevice();
  try {
    await page.goto(harness.baseUrl);
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, {timeout: 10_000});
    harness.setServiceWorkerVersion('v22', {activationDelayMs: 750});
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration('./');
      await registration.update();
    });
    await page.waitForFunction(async () => (await navigator.serviceWorker.getRegistration('./'))?.waiting !== null);
    await page.reload();
    await page.locator('#dataset-name').waitFor();
    const updateButton = page.locator('#update-activate');
    await updateButton.waitFor();
    assert.equal(await updateButton.textContent(), 'Jetzt aktualisieren');

    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration('./');
      registration.waiting.postMessage({type: 'ACTIVATE_UPDATE', requestId: 'direct-page-message'});
    });
    await page.waitForTimeout(100);
    assert.equal(await page.evaluate(async () => (await navigator.serviceWorker.getRegistration('./')).waiting !== null), true);

    await page.locator('#dataset-name').fill('Bleibt im Formular');
    await updateButton.click();
    await page.getByText(/Einrichtung zuerst abschließen/i).waitFor();
    assert.equal(await page.locator('#dataset-name').inputValue(), 'Bleibt im Formular');

    await setupPractice(page);
    await updateButton.waitFor();
    await page.locator('#adult-entry').click();
    if (await page.locator('#adult-pin').count()) {
      await page.locator('#adult-pin').fill('1234');
      await page.locator('#adult-unlock').click();
    }
    await page.locator('#adult-nav').waitFor();
    await updateButton.click();
    await page.getByText(/Erwachsenenansicht zuerst verlassen/i).waitFor();
    await page.getByRole('button', {name: 'Zur Profilauswahl', exact: true}).click();

    await page.getByRole('button', {name: /^Ada/}).click();
    await startPracticeRound(page);
    await page.getByLabel('Englische Übersetzung').waitFor();
    assert.equal(await updateButton.textContent(), 'Runde pausieren und aktualisieren');

    await page.getByLabel('Englische Übersetzung').fill('draft');
    await updateButton.click();
    await page.getByText(/zuerst.*absenden oder leeren/i).waitFor();
    assert.equal(await page.evaluate(async () => (await navigator.serviceWorker.getRegistration('./')).waiting !== null), true);

    await page.getByLabel('Englische Übersetzung').fill('dog');
    await page.evaluate(() => {
      document.querySelector('#practice-submit').click();
      document.querySelector('#update-activate').click();
    });
    await page.getByText(/Antwort.*gespeichert/i).waitFor();
    assert.equal(await page.evaluate(async () => (await navigator.serviceWorker.getRegistration('./')).waiting !== null), true);
    await page.getByText('Richtig!', {exact: true}).waitFor();

    const beforeReload = await productState(page);
    assert.equal(beforeReload.ledger.events.some(({type}) => type === 'round.completed' || type === 'round.abandoned'), false);
    assert.deepEqual(await page.evaluate(async () => (await caches.keys()).filter((name) => name.startsWith('vokabeltrainer-product:')).sort()), [
      'vokabeltrainer-product:%2Ftrainer%2F:v21',
      'vokabeltrainer-product:%2Ftrainer%2F:v22',
    ]);
    const navigation = page.waitForNavigation();
    await updateButton.click();
    await page.waitForFunction(() => document.querySelector('#app')?.inert === true);
    assert.equal(await page.locator('#app').getAttribute('aria-busy'), 'true');
    assert.equal(await page.getByLabel('Englische Übersetzung').isEditable(), false);
    await page.evaluate(() => {
      [...document.querySelectorAll('button')].find((node) => node.textContent === 'Inselreise')?.click();
    });
    await page.waitForTimeout(50);
    await page.getByText('Richtig!', {exact: true}).waitFor();
    await navigation;
    await page.getByText('Richtig!', {exact: true}).waitFor();
    assert.deepEqual(await page.evaluate(async () => (await caches.keys()).filter((name) => name.startsWith('vokabeltrainer-product:')).sort()), [
      'vokabeltrainer-product:%2Ftrainer%2F:v22',
    ]);
  } finally {
    await context.close();
    await harness.close();
  }
});
