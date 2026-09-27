import test from 'node:test';
import assert from 'node:assert/strict';

import {createTrainerHarness} from './trainer-harness.mjs';

async function localState(page) {
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
  return page.evaluate(async () => new Promise((resolve, reject) => {
    const request = indexedDB.open('vokabeltrainer-product-v1', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const tx = database.transaction('product-state', 'readonly');
      const get = tx.objectStore('product-state').get('current');
      get.onerror = () => reject(get.error);
      get.onsuccess = () => resolve(get.result);
      tx.oncomplete = () => database.close();
    };
  }));
}

test('a delayed connect status does not hide a newer active token', {timeout: 60_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice();
  try {
    await page.goto(harness.baseUrl);
    const state = await localState(page);
    await page.evaluate(async (current) => {
      const {renderSync, refreshSyncConnection} = await import('/src/trainer/ui/sync.js');
      const owner = document.createElement('div');
      owner.className = 'site-shell';
      const summary = document.createElement('p');
      summary.dataset.settingsSyncSummary = '';
      owner.append(summary);
      const root = document.createElement('section');
      root.id = 'auth-status-root';
      owner.append(root);
      document.body.append(owner);
      const auth = {
        getToken: () => 'newer-token',
        clientId: () => 'synthetic-client.apps.googleusercontent.com',
        configuration: () => ({clientId: 'synthetic-client.apps.googleusercontent.com', source: 'app', requiresDecision: false}),
      };
      const status = {phase: 'connect', pendingCount: 0, lateCount: 0, conflictCount: 0, message: 'Older request failed.'};
      renderSync({root, state: current, commands: {getState: () => current}, auth,
        sync: {getStatus: () => status},
        restore: {}});
      refreshSyncConnection(root, status);
    }, state);
    const root = page.locator('#auth-status-root');
    assert.equal(await root.getByRole('button', {name: 'Mit Google verbinden', exact: true}).count(), 0);
    assert.equal(await root.getByText('Google-Verbindung ist aktiv.', {exact: true}).count(), 1);
    assert.equal(await root.locator('[data-sync-status]').textContent(), 'Abgleich erneut versuchen');
    assert.match(await root.locator('.sync-status + .hint').textContent(), /früherer Abgleich.*erneut/i);
    assert.equal(await page.locator('.site-shell [data-settings-sync-summary]').textContent(), 'Status: Abgleich erneut versuchen');
  } finally {
    await harness.close();
  }
});

test('a locked adult action does not erase the Google session', {timeout: 60_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice();
  try {
    await page.goto(harness.baseUrl);
    const state = await localState(page);
    await page.evaluate(async (current) => {
      const {renderSync} = await import('/src/trainer/ui/sync.js');
      const root = document.createElement('section');
      root.id = 'auth-pin-root';
      document.body.append(root);
      window.__authInvalidations = 0;
      const auth = {
        getToken: () => 'current-token',
        invalidate: () => { window.__authInvalidations += 1; },
        clientId: () => 'synthetic-client.apps.googleusercontent.com',
        configuration: () => ({clientId: 'synthetic-client.apps.googleusercontent.com', source: 'app', requiresDecision: false}),
      };
      renderSync({root, state: current, commands: {getState: () => current}, auth,
        isUnlocked: () => false,
        sync: {getStatus: () => ({phase: 'synced', pendingCount: 0, lateCount: 0, conflictCount: 0, message: 'Vollständig abgeglichen.'}),
          discover: async () => []}, restore: {}});
    }, state);
    await page.locator('#auth-pin-root').getByRole('button', {name: 'Vorhandenen Lernbereich verwenden'})
      .evaluate((button) => button.click());
    assert.equal(await page.evaluate(() => window.__authInvalidations), 0);
  } finally {
    await harness.close();
  }
});

test('reloading clears only the local token and does not revoke Google consent', {timeout: 60_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice();
  try {
    await page.addInitScript(() => {
      let google;
      Object.defineProperty(window, 'google', {
        configurable: true,
        get: () => google,
        set(value) {
          google = value;
          const original = value.accounts.oauth2.revoke;
          value.accounts.oauth2.revoke = (...args) => {
            localStorage.setItem('synthetic-revoke-count',
              String(Number(localStorage.getItem('synthetic-revoke-count') ?? 0) + 1));
            return original(...args);
          };
        },
      });
    });
    await page.goto(harness.baseUrl);
    await localState(page);
    await page.locator('#adult-entry').click();
    await page.getByRole('button', {name: 'Einstellungen', exact: true}).click();
    await page.getByRole('button', {name: 'Mit Google verbinden', exact: true}).click();
    await page.getByText('Google-Verbindung ist aktiv.', {exact: true}).waitFor();
    await page.reload();
    await page.locator('#profile-list').waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('synthetic-revoke-count')), null);
  } finally {
    await harness.close();
  }
});
