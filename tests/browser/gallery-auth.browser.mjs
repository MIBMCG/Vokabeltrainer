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

test('restored server session updates the mounted purchase gallery without navigation', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice();
  try {
    await page.goto(harness.baseUrl);
    await setup(page);
    await page.evaluate(async () => {
      const {mountShell} = await import('/src/trainer/ui/shell.js');
      const {createServerAuth} = await import('/src/drive/server-auth.js');
      const {project} = await import('/src/trainer/learning/progress.js');
      const state = await new Promise((resolve, reject) => {
        const request = indexedDB.open('vokabeltrainer-product-v1', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction('product-state', 'readonly');
          const get = transaction.objectStore('product-state').get('current');
          get.onerror = () => reject(get.error);
          get.onsuccess = () => resolve(get.result);
          transaction.oncomplete = () => database.close();
        };
      });
      const profileId = Object.keys(project(state.ledger).profiles)[0];
      state.commerce = {...state.commerce, mode: 'active',
        selection: [{profileId, figureId: 'explorer-girl', stage: 1}]};
      const view = {
        mode: 'active', head: {id: 'head-1', sha256: 'a'.repeat(64)},
        accounts: {[profileId]: {
          profileId, earnedPoints: 610, spentPoints: 0, availablePoints: 610,
          purchasedArticleIds: [], entitledFigureIds: ['explorer-girl', 'dragon'],
          entitledEvolutionIds: ['evolution:explorer-girl:1', 'evolution:dragon:1'],
        }}, jobs: [], selection: state.commerce.selection, control: null,
      };
      const root = document.createElement('main');
      document.querySelector('#app').id = 'original-app';
      root.id = 'app';
      root.className = 'gallery-auth-fixture';
      document.body.append(root);
      let finishSession;
      const session = new Promise((resolve) => { finishSession = resolve; });
      let shell;
      let previewCalls = 0;
      let releasePreview = null;
      let holdPreview = false;
      const sync = {getStatus: () => ({phase: 'local', pendingCount: 0, lateCount: 0})};
      const auth = createServerAuth({
        fetchImpl: () => session,
        onChange: () => shell?.syncStatusChanged(sync.getStatus()),
      });
      let viewLoads = 0;
      const commerce = {
        isConnected: () => { try { auth.getToken(); return true; } catch { return false; } },
        getView: async () => { viewLoads += 1; return structuredClone(view); },
        preview: async ({profileId: requestedProfile, articleId}) => {
          previewCalls += 1;
          if (holdPreview) await new Promise((resolve) => { releasePreview = resolve; });
          return {version: 1, previewId: 'preview-1', stateHash: 'state-1', head: view.head,
            profileId: requestedProfile, articleId, price: 600, availablePoints: 610};
        },
      };
      shell = mountShell({root, commands: {getState: () => state},
        pinGate: {isUnlocked: () => false}, sync, auth, commerce});
      shell.render();
      const pendingResume = auth.resume();
      window.__galleryAuth = {auth, shell, root, viewLoads: () => viewLoads,
        previewCalls: () => previewCalls, holdPreview: () => { holdPreview = true; },
        releasePreview: () => releasePreview(),
        completeResume: () => finishSession({ok: true, json: async () => ({connected: true, accountId: 'synthetic-account'})}),
        pendingResume};
    });
    const root = page.locator('#app.gallery-auth-fixture');
    await root.locator('#profile-list .profile-card').first().click();
    await root.getByRole('button', {name: 'Mein Avatar'}).click();
    await root.getByRole('button', {name: 'Shop', exact: true}).click();
    await root.locator('.commerce-auth-notice').waitFor();
    const deer = root.locator('.commerce-card').filter({hasText: 'Nebelhirsch'});
    await deer.getByRole('button', {name: 'Google erneut verbinden'}).waitFor();
    await root.getByRole('button', {name: 'Shop', exact: true}).focus();
    await page.evaluate(() => window.__galleryAuth.completeResume());
    await page.evaluate(() => window.__galleryAuth.pendingResume);
    await root.locator('.commerce-auth-notice').waitFor({state: 'detached', timeout: 1500});
    assert.equal(await deer.getByRole('button', {name: 'Für 600 Punkte freischalten'}).count(), 1);
    assert.equal(await root.getByRole('button', {name: 'Shop', exact: true}).getAttribute('aria-current'), 'page');
    assert.equal(await root.getByRole('button', {name: 'Shop', exact: true}).evaluate((node) => document.activeElement === node), true,
      'auth refresh keeps focus on the active gallery tab');
    const loaded = await page.evaluate(() => window.__galleryAuth.viewLoads());
    await page.evaluate(() => {
      window.__galleryAuth.shell.syncStatusChanged({phase: 'working'});
      window.__galleryAuth.shell.syncStatusChanged({phase: 'idle'});
    });
    assert.equal(await page.evaluate(() => window.__galleryAuth.viewLoads()), loaded,
      'unchanged sync progress does not load purchases again');

    await deer.getByRole('button', {name: 'Für 600 Punkte freischalten'}).focus();
    await page.evaluate(() => window.__galleryAuth.auth.clearLocal());
    await root.locator('.commerce-auth-notice').waitFor();
    const reconnectAction = deer.getByRole('button', {name: 'Google erneut verbinden'});
    await reconnectAction.waitFor();
    assert.equal(await reconnectAction.evaluate((node) => document.activeElement === node), true,
      'auth loss keeps focus on the same offer');
    await page.evaluate(() => window.__galleryAuth.auth.resume());
    await root.locator('.commerce-auth-notice').waitFor({state: 'detached'});
    assert.equal(await root.getByRole('button', {name: 'Shop', exact: true}).getAttribute('aria-current'), 'page');
    assert.equal(await deer.getByRole('button', {name: 'Für 600 Punkte freischalten'})
      .evaluate((node) => document.activeElement === node), true,
    'auth recovery keeps focus on the same offer');

    await page.evaluate(() => window.__galleryAuth.auth.clearLocal());
    const noticeReconnect = root.locator('.commerce-auth-notice')
      .getByRole('button', {name: 'Google erneut verbinden'});
    await noticeReconnect.focus();
    await page.evaluate(() => window.__galleryAuth.auth.resume());
    await root.locator('.commerce-auth-notice').waitFor({state: 'detached'});
    assert.equal(await root.getByRole('button', {name: 'Shop', exact: true})
      .evaluate((node) => document.activeElement === node), true,
    'focus moves to the active tab when the reconnect control disappears');

    await page.evaluate(() => window.__galleryAuth.holdPreview());
    await deer.getByRole('button', {name: 'Für 600 Punkte freischalten'}).click();
    await root.getByText('Kaufangebot wird geprüft …', {exact: true}).waitFor();
    await page.evaluate(() => window.__galleryAuth.auth.clearLocal());
    await root.getByText('Kaufangebot wird geprüft …', {exact: true}).waitFor();
    assert.equal(await page.evaluate(() => window.__galleryAuth.previewCalls()), 1);
    assert.equal(await page.locator('dialog.purchase-dialog').count(), 0);
    await page.evaluate(() => window.__galleryAuth.auth.resume());
    await page.evaluate(() => window.__galleryAuth.releasePreview());
    const dialog = page.getByRole('dialog', {name: 'Kauf prüfen'});
    await dialog.waitFor();
    await page.evaluate(() => {
      window.__openPurchaseDialog = document.querySelector('dialog.purchase-dialog');
      window.__galleryAuth.auth.clearLocal();
    });
    assert.equal(await dialog.count(), 1);
    assert.equal(await page.evaluate(() => document.querySelector('dialog.purchase-dialog') === window.__openPurchaseDialog), true);
    await page.evaluate(() => window.__galleryAuth.auth.resume());
    assert.equal(await dialog.count(), 1);
    await dialog.getByRole('button', {name: 'Abbrechen'}).click();
    await root.getByRole('button', {name: 'Meine Figur', exact: true}).click();
    const dragon = root.locator('.owned-form-card').filter({hasText: 'Einfacher Drache'});
    await dragon.getByRole('button', {name: 'Entwicklung ansehen'}).click();
    await root.getByRole('heading', {name: 'Einfacher Drache entwickeln'}).waitFor();
    await page.evaluate(() => window.__galleryAuth.auth.clearLocal());
    await root.locator('.commerce-auth-notice').waitFor();
    await page.evaluate(() => window.__galleryAuth.auth.resume());
    await root.locator('.commerce-auth-notice').waitFor({state: 'detached'});
    assert.equal(await root.getByRole('heading', {name: 'Einfacher Drache entwickeln'}).count(), 1,
      'auth notifications preserve the figure being viewed');
    assert.equal(await root.getByText('610 Verfügbare Punkte', {exact: true}).count(), 1);
  } finally {
    await harness.close();
  }
});
