import test from 'node:test';
import assert from 'node:assert/strict';

import {createTrainerHarness} from './trainer-harness.mjs';

async function setupPractice(page) {
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

async function productState(page) {
  return page.evaluate(async () => new Promise((resolveState, reject) => {
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

test('sync settings show the active Google session and never call a pending retry confirmed', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice();
  try {
    await page.goto(harness.baseUrl);
    await setupPractice(page);
    await page.locator('#adult-entry').click();
    await page.getByRole('button', {name: 'Einstellungen', exact: true}).click();
    await page.getByRole('button', {name: 'Mit Google verbinden', exact: true}).click();
    await page.getByRole('button', {name: 'Neuen Lernbereich anlegen', exact: true}).click();
    await page.getByText('Abgeglichen', {exact: true}).waitFor();

    assert.equal(await page.getByRole('button', {name: 'Mit Google verbinden', exact: true}).count(), 0);
    assert.equal(await page.getByText('Google-Verbindung ist aktiv.', {exact: true}).count(), 1);
    assert.equal(await page.getByRole('button', {name: 'Google-Verbindung trennen', exact: true}).count(), 1);

    const state = await productState(page);
    await page.evaluate(async (current) => {
      const {renderSync} = await import('/src/trainer/ui/sync.js');
      const root = document.createElement('section');
      root.id = 'sync-regression-root';
      document.body.append(root);
      let status = {
        phase: 'synced', pendingCount: 0, lateCount: 0, conflictCount: 0,
        message: 'Vollständig abgeglichen.', lastConfirmedAt: '2026-09-27T12:00:00.000Z',
      };
      let releaseRetry;
      let retryMode = 'pending';
      let authActive = true;
      const sync = {
        getStatus: () => structuredClone(status),
        retry() {
          if (retryMode === 'synced') {
            status = {...status, phase: 'synced', pendingCount: 0, message: 'Vollständig abgeglichen.'};
            return Promise.resolve(structuredClone(status));
          }
          if (retryMode === 'error') {
            status = {...status, phase: 'error', pendingCount: 1, message: 'Der synthetische Abgleich ist fehlgeschlagen.'};
            return Promise.resolve(structuredClone(status));
          }
          status = {...status, phase: 'pending', pendingCount: 1, message: 'Änderungen werden abgeglichen.'};
          return new Promise((resolveRetry) => {
            releaseRetry = () => resolveRetry(structuredClone(status));
          });
        },
      };
      const commands = {getState: () => current};
      const auth = {
        clientId: () => 'synthetic-client.apps.googleusercontent.com',
        configuration: () => ({
          clientId: 'synthetic-client.apps.googleusercontent.com', source: 'prepared', requiresDecision: false,
        }),
        getToken() {
          if (!authActive) throw Object.assign(new Error('expired'), {code: 'auth'});
          return 'synthetic-token';
        },
        invalidate() {},
        disconnect() {},
      };
      const render = () => renderSync({root, state: current, sync, restore: {}, auth, commands});
      render();
      window.__releasePendingRetry = () => releaseRetry();
      window.__succeedNextRetry = () => { retryMode = 'synced'; };
      window.__failNextRetry = () => { retryMode = 'error'; };
      window.__setSyntheticSyncStatus = (phase) => {
        status = phase === 'checking'
          ? {...status, phase, pendingCount: 0, message: 'Gespeicherte Daten werden auf neue Änderungen geprüft.'}
          : phase === 'syncing'
          ? {...status, phase, pendingCount: 1, message: 'Deine Änderungen werden mit Google Drive abgeglichen.'}
          : phase === 'pending'
          ? {...status, phase, pendingCount: 1, message: 'Änderungen werden abgeglichen.'}
          : {...status, phase: 'error', pendingCount: 1, message: 'Der synthetische Abgleich ist fehlgeschlagen.'};
        render();
      };
      window.__expireSyntheticAuth = () => { authActive = false; render(); };
    }, state);

    const regression = page.locator('#sync-regression-root');
    await regression.getByRole('button', {name: 'Jetzt abgleichen', exact: true}).click();
    assert.equal(await regression.locator('[data-sync-status]').getAttribute('data-phase'), 'pending');
    assert.equal(await regression.locator('[data-sync-status]').innerText(), 'Abgleich ausstehend');
    await page.evaluate(() => window.__releasePendingRetry());
    await regression.getByText('Änderungen werden abgeglichen.', {exact: true}).waitFor();
    assert.equal(await regression.getByText('Der Abgleich wurde ausgeführt.', {exact: true}).count(), 0);
    assert.equal(await regression.getByText('Der Abgleich ist vollständig bestätigt.', {exact: true}).count(), 0);

    await page.evaluate(() => window.__succeedNextRetry());
    await regression.getByRole('button', {name: 'Jetzt abgleichen', exact: true}).click();
    await regression.getByText('Vollständig abgeglichen.', {exact: true}).waitFor();
    await page.evaluate(() => window.__setSyntheticSyncStatus('pending'));
    assert.equal(await regression.getByText('Der Abgleich ist vollständig bestätigt.', {exact: true}).count(), 0);

    await page.evaluate(() => window.__failNextRetry());
    await regression.getByRole('button', {name: 'Jetzt abgleichen', exact: true}).click();
    await regression.locator('p.hint').filter({hasText: 'Der synthetische Abgleich ist fehlgeschlagen.'}).waitFor();
    assert.equal(await regression.getByText('Der Abgleich wurde ausgeführt.', {exact: true}).count(), 0);
    assert.equal(await regression.getByText('Der Abgleich ist vollständig bestätigt.', {exact: true}).count(), 0);

    await page.evaluate(() => window.__setSyntheticSyncStatus('checking'));
    assert.equal(await regression.locator('[data-sync-status]').innerText(), 'Auf Änderungen prüfen …');
    assert.equal(await regression.getByText('Abgleich ausstehend', {exact: true}).count(), 0);
    await page.evaluate(() => window.__setSyntheticSyncStatus('syncing'));
    assert.equal(await regression.locator('[data-sync-status]').innerText(), 'Abgleich läuft …');

    await page.evaluate(() => window.__expireSyntheticAuth());
    assert.equal(await regression.getByRole('button', {name: 'Mit Google verbinden', exact: true}).count(), 1);
    assert.equal(await regression.getByRole('button', {name: 'Google-Verbindung trennen', exact: true}).count(), 0);
    assert.equal(await regression.getByText('Google ist für diese Sitzung verbunden.', {exact: true}).count(), 0);
  } finally {
    await harness.close();
  }
});
