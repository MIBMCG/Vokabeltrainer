import test from 'node:test';
import assert from 'node:assert/strict';

import {createTrainerHarness} from './trainer-harness.mjs';
import {createCommands} from '../../src/trainer/commands.js';
import {project} from '../../src/trainer/learning/progress.js';

async function setupProduct(page) {
  await page.locator('#dataset-name').fill('Übungsinsel');
  await page.locator('#setup-pin').fill('1234');
  await page.locator('#setup-pin-repeat').fill('1234');
  await page.locator('#setup-profile').fill('Ada');
  await page.locator('#setup-lesson').fill('Unit 1');
  await page.locator('#setup-word-1-german').fill('Hund');
  await page.locator('#setup-word-1-answers').fill('dog');
  await page.locator('#setup-word-2-german').fill('Katze');
  await page.locator('#setup-word-2-answers').fill('cat');
  await page.locator('#setup-submit').click();
  await page.locator('#profile-list').waitFor();
}

async function readProductState(page) {
  return page.evaluate(() => new Promise((resolveState, reject) => {
    const request = indexedDB.open('vokabeltrainer-product-v1', 1);
    request.onerror = () => reject(request.error);
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
  await page.evaluate((next) => new Promise((resolveWrite, reject) => {
    const request = indexedDB.open('vokabeltrainer-product-v1', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction('product-state', 'readwrite');
      transaction.objectStore('product-state').put(next, 'current');
      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => { database.close(); resolveWrite(); };
    };
  }), state);
}

async function stateWithAffordablePurchase(initial) {
  let value = structuredClone(initial);
  let day = new Date('2027-01-01T10:00:00Z');
  let serial = 0;
  const store = {
    async load() { return structuredClone(value); },
    async save(next) { value = structuredClone(next); },
  };
  const commands = await createCommands({
    store, deviceId: initial.deviceId, now: () => new Date(day),
    id: () => `purchase-reconnect-${++serial}`, onChange: () => {},
  });
  let learning = project(commands.getState().ledger);
  const profileId = Object.keys(learning.profiles)[0];
  const lessonId = Object.keys(learning.entities.lessons)[0];
  for (let index = 3; index <= 60; index += 1) {
    await commands.revise({
      entityType: 'word', entityId: `purchase-reconnect-word-${index}`, expectedHeads: [],
      value: {lessonId, german: `Wort ${index}`, answers: [`word${index}`], hint: '', archived: false},
    });
  }
  while (project(commands.getState().ledger).profiles[profileId].points < 600) {
    const choice = commands.practiceChoices({profileId}).find(({mode}) => mode === 'all');
    if (!choice?.availableCount) {
      day = new Date(day.getTime() + 40 * 86_400_000);
      continue;
    }
    await commands.start({profileId, mode: 'all', size: 30});
    const roundId = commands.getState().rounds[profileId].id;
    while (!['completed', 'abandoned'].includes(commands.getState().rounds[profileId].status)) {
      const available = commands.roundAvailability({roundId});
      if (available.kind === 'task') {
        learning = project(commands.getState().ledger);
        await commands.submit({roundId, typed: learning.entities.words[available.task.wordId].value.answers[0]});
        await commands.next({roundId});
      } else if (available.kind === 'exhausted') {
        await commands.finish({roundId, reason: 'exhausted'});
      } else {
        await commands.next({roundId});
      }
    }
    day = new Date(day.getTime() + 40 * 86_400_000);
  }
  return commands.getState();
}

async function waitForOutbox(page) {
  const timeoutAt = Date.now() + 30_000;
  while (Date.now() < timeoutAt) {
    const state = await readProductState(page);
    if (state.outboxEventIds.length === 0 && state.pendingPackets.length === 0) return;
    await page.waitForTimeout(100);
  }
  throw new Error('Timed out waiting for the learning outbox to drain.');
}

async function openAdultSettings(page) {
  if (await page.getByRole('button', {name: 'Profil wechseln', exact: true}).count()) {
    await page.getByRole('button', {name: 'Profil wechseln', exact: true}).click();
  }
  await page.locator('#adult-entry').click();
  if (await page.locator('#adult-pin').count()) {
    await page.locator('#adult-pin').fill('1234');
    await page.locator('#adult-unlock').click();
  }
  await page.getByRole('button', {name: 'Einstellungen', exact: true}).click();
}

test('purchase auth gaps offer explicit reconnect and clear after the session returns', {timeout: 60_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice({viewport: {width: 390, height: 844}});
  try {
    await page.goto(harness.baseUrl);
    await page.locator('#dataset-name').waitFor();
    await page.evaluate(async () => {
      const {renderPurchases} = await import('/src/trainer/ui/purchases.js');
      const root = document.createElement('section');
      root.id = 'purchase-reconnect-fixture';
      document.body.append(root);
      const view = {
        mode: 'active', head: {id: 'head-1', sha256: 'a'.repeat(64)},
        accounts: {p1: {
          profileId: 'p1', earnedPoints: 610, spentPoints: 0, availablePoints: 610,
          purchasedArticleIds: [], entitledFigureIds: ['explorer-girl'], entitledEvolutionIds: [],
        }},
        jobs: [], selection: [{profileId: 'p1', figureId: 'explorer-girl', stage: 1}], control: null,
      };
      const fixture = {
        connected: false, failAt: null, reconnects: 0,
        commerce: {
          isConnected: () => fixture.connected,
          getView: async () => structuredClone(view),
          preview: async ({profileId, articleId}) => {
            if (fixture.failAt === 'preview') {
              fixture.connected = false;
              throw Object.assign(new Error('Google-Zugriff ist nicht verfügbar.'), {code: 'auth'});
            }
            return {
              version: 1, previewId: 'preview-1', stateHash: 'state-1', head: view.head,
              profileId, articleId, price: 600, availablePoints: 610,
            };
          },
          confirm: async () => {
            if (fixture.failAt === 'confirm') {
              fixture.connected = false;
              throw Object.assign(new Error('Google-Zugriff ist nicht verfügbar.'), {code: 'auth'});
            }
          },
        },
      };
      fixture.render = () => renderPurchases({
        root, profileId: 'p1', commerce: fixture.commerce, online: true,
        onRefresh: fixture.render,
        onReconnect: () => { fixture.reconnects += 1; },
      });
      window.__purchaseReconnect = fixture;
      fixture.render();
    });

    const root = page.locator('#purchase-reconnect-fixture');
    const authNotice = 'Für neue Käufe muss Google erneut verbunden werden. Freigeschaltete Figuren bleiben verfügbar.';
    assert.equal(await root.getByText(authNotice, {exact: true}).count(), 1, 'auth guidance is shown exactly once');
    await root.getByRole('button', {name: 'Google erneut verbinden', exact: true}).click();
    assert.equal(await page.evaluate(() => window.__purchaseReconnect.reconnects), 1);

    await root.getByRole('button', {name: 'Shop', exact: true}).click();
    const deer = root.locator('.commerce-card').filter({hasText: 'Nebelhirsch'});
    const reconnect = deer.getByRole('button', {name: 'Google erneut verbinden', exact: true});
    await reconnect.waitFor();
    await reconnect.click();
    assert.equal(await page.evaluate(() => window.__purchaseReconnect.reconnects), 2);

    await page.evaluate(() => {
      window.__purchaseReconnect.connected = true;
      window.__purchaseReconnect.render();
    });
    await root.getByRole('button', {name: 'Für 600 Punkte freischalten', exact: true}).waitFor();
    assert.equal(await reconnect.count(), 0, 'successful reconnect clears the stale action');

    await page.evaluate(() => { window.__purchaseReconnect.failAt = 'preview'; });
    await root.getByRole('button', {name: 'Für 600 Punkte freischalten', exact: true}).click();
    await reconnect.waitFor();

    await page.evaluate(() => {
      window.__purchaseReconnect.connected = true;
      window.__purchaseReconnect.failAt = null;
      window.__purchaseReconnect.render();
    });
    await root.getByRole('button', {name: 'Für 600 Punkte freischalten', exact: true}).click();
    const dialog = page.getByRole('dialog', {name: 'Kauf prüfen'});
    await dialog.waitFor();
    await page.evaluate(() => { window.__purchaseReconnect.failAt = 'confirm'; });
    await dialog.getByRole('button', {name: 'Kauf verbindlich bestätigen'}).click();
    await reconnect.waitFor();
    assert.equal(await dialog.count(), 0, 'auth expiry at confirmation returns to the reconnect action');
  } finally {
    await harness.close();
  }
});

test('active shop routes a missing Google session through PIN reconnect back to purchase preview', {timeout: 120_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice({viewport: {width: 1280, height: 900}});
  try {
    await page.goto(harness.baseUrl);
    await setupProduct(page);
    await writeProductState(page, await stateWithAffordablePurchase(await readProductState(page)));
    await page.reload();

    await openAdultSettings(page);
    await page.getByRole('button', {name: 'Mit Google verbinden'}).click();
    await page.getByRole('button', {name: 'Neuen Lernbereich anlegen'}).click();
    while ((await readProductState(page)).binding === null) await page.waitForTimeout(50);
    await waitForOutbox(page);
    await page.getByRole('button', {name: 'Einstellungen', exact: true}).click();
    await page.locator('#settings-task-advanced > summary').click();
    await page.getByRole('button', {name: 'Daten für Figuren und Käufe aktualisieren'}).click();
    await page.getByRole('button', {name: 'Aktualisierung jetzt durchführen'}).click();
    await page.getByText('Figuren und Käufe sind bereit.', {exact: true}).waitFor({timeout: 60_000});

    await page.reload();
    await page.getByRole('button', {name: /Ada/}).first().click();
    await page.getByRole('button', {name: 'Mein Avatar'}).click();
    const authNotice = 'Für neue Käufe muss Google erneut verbunden werden. Freigeschaltete Figuren bleiben verfügbar.';
    assert.equal(await page.getByText(authNotice, {exact: true}).count(), 1);
    await page.locator('.commerce-auth-notice').getByRole('button', {name: 'Google erneut verbinden'}).click();

    await page.locator('#adult-pin').fill('1234');
    await page.locator('#adult-unlock').click();
    const connectionTask = page.locator('#settings-task-connection');
    await connectionTask.waitFor();
    assert.equal(await connectionTask.evaluate((details) => details.open), true);
    assert.equal(await connectionTask.locator(':scope > summary').evaluate((summary) => document.activeElement === summary), true);
    await connectionTask.getByRole('button', {name: 'Mit Google verbinden'}).click();
    await connectionTask.getByText('Google-Verbindung ist aktiv.', {exact: true}).waitFor();

    await page.getByRole('button', {name: 'Zur Profilauswahl'}).click();
    await page.getByRole('button', {name: /Ada/}).first().click();
    await page.getByRole('button', {name: 'Mein Avatar'}).click();
    await page.getByRole('button', {name: 'Shop', exact: true}).click();
    assert.equal(await page.getByText(authNotice, {exact: true}).count(), 0, 'reconnect guidance is no longer stale');
    const deer = page.locator('.commerce-card').filter({hasText: 'Nebelhirsch'});
    await deer.getByRole('button', {name: 'Für 600 Punkte freischalten', exact: true}).click();
    await page.getByRole('dialog', {name: 'Kauf prüfen'}).waitFor();
    await page.getByRole('button', {name: 'Abbrechen', exact: true}).click();
  } finally {
    await harness.close();
  }
});
