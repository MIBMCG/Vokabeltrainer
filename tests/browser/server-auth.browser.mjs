import test from 'node:test';
import assert from 'node:assert/strict';

import {createTrainerHarness} from './trainer-harness.mjs';

async function setup(page) {
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

async function settings(page) {
  await page.locator('#adult-entry').click();
  if (await page.locator('#adult-pin').count()) {
    await page.locator('#adult-pin').fill('1234');
    await page.locator('#adult-unlock').click();
  }
  await page.getByRole('button', {name: 'Einstellungen', exact: true}).click();
}

test('server session appears after reload without a Google click and logout persists', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness({serverAuth: true});
  const {page} = await harness.newDevice();
  try {
    await page.goto(harness.baseUrl);
    await setup(page);
    await settings(page);
    await page.getByText('Google-Verbindung ist aktiv.', {exact: true}).waitFor();
    assert.equal(await page.locator('#google-client-id').count(), 0);
    await page.reload();
    await page.locator('#profile-list').waitFor();
    await settings(page);
    await page.getByText('Google-Verbindung ist aktiv.', {exact: true}).waitFor();
    await page.getByRole('button', {name: 'Google-Verbindung trennen', exact: true}).click();
    await page.getByRole('button', {name: 'Mit Google verbinden', exact: true}).waitFor();
    await page.reload();
    await page.locator('#profile-list').waitFor();
    await settings(page);
    assert.equal(await page.getByRole('button', {name: 'Mit Google verbinden', exact: true}).count(), 1);
  } finally { await harness.close(); }
});

test('session outage leaves local setup usable and retries without a popup', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness({serverAuth: true});
  harness.failServerSessions(1);
  const {page} = await harness.newDevice();
  try {
    await page.goto(harness.baseUrl);
    await setup(page);
    await settings(page);
    await page.getByText('Google-Verbindung ist aktiv.', {exact: true}).waitFor({timeout: 12_000});
    assert.ok(harness.serverSessionRequests() >= 2);
  } finally { await harness.close(); }
});

test('failed logout keeps the connected view and reports that disconnect was not confirmed', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness({serverAuth: true});
  const {page} = await harness.newDevice();
  try {
    await page.goto(harness.baseUrl);
    await setup(page);
    await settings(page);
    await page.getByText('Google-Verbindung ist aktiv.', {exact: true}).waitFor();
    harness.failServerLogouts(1);
    await page.getByRole('button', {name: 'Google-Verbindung trennen', exact: true}).click();
    await page.getByText(/Anmeldedienst konnte die Anfrage nicht abschließen/).waitFor();
    assert.equal(await page.getByText('Google-Verbindung ist aktiv.', {exact: true}).count(), 1);
  } finally { await harness.close(); }
});

test('a delayed server resume starts sync for a bound dataset while the adult PIN is locked', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness({serverAuth: true});
  const {page} = await harness.newDevice();
  try {
    await page.goto(harness.baseUrl);
    await setup(page);
    await page.evaluate(() => new Promise((resolve, reject) => {
      const request = indexedDB.open('vokabeltrainer-product-v1', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction('product-state', 'readwrite');
        const get = transaction.objectStore('product-state').get('current');
        get.onsuccess = () => {
          const state = get.result;
          state.binding = {accountId: 'synthetic-account', folderId: 'folder-a',
            descriptorFileId: 'descriptor-a', datasetId: state.ledger.descriptor.datasetId};
          transaction.objectStore('product-state').put(state, 'current');
        };
        transaction.onerror = () => reject(transaction.error);
        transaction.oncomplete = () => { database.close(); resolve(); };
      };
    }));
    harness.delayNextServerSession(1800);
    await page.reload();
    await page.locator('#profile-list').waitFor();
    const deadline = Date.now() + 6_000;
    while (harness.serverProxyRequests() === 0 && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.ok(harness.serverSessionRequests() >= 2);
    assert.ok(harness.serverProxyRequests() > 0, 'Automatic sync must contact the proxy after delayed resume.');
    await page.locator('#adult-entry').click();
    assert.equal(await page.locator('#adult-pin').count(), 1);
  } finally { await harness.close(); }
});
