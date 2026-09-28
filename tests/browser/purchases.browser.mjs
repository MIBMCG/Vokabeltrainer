import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';

import {createTrainerHarness} from './trainer-harness.mjs';
import {createCommands} from '../../src/trainer/commands.js';
import {project} from '../../src/trainer/learning/progress.js';

const resultsDirectory = resolve('test-results', 'purchases-task5');

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

async function productState(page) {
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

async function earnedState(initial) {
  let value = structuredClone(initial);
  let day = new Date('2027-01-01T10:00:00Z');
  let serial = 0;
  const store = {
    async load() { return structuredClone(value); },
    async save(next) { value = structuredClone(next); },
  };
  const commands = await createCommands({
    store, deviceId: initial.deviceId, now: () => new Date(day),
    id: () => `task5-browser-${++serial}`, onChange: () => {},
  });
  let learning = project(commands.getState().ledger);
  const profileId = Object.keys(learning.profiles)[0];
  const lesson = Object.values(learning.entities.lessons)[0];
  const secondProfileId = 'task5-ben';
  await commands.revise({
    entityType: 'profile', entityId: secondProfileId, expectedHeads: [],
    value: {name: 'Ben', archived: false},
  });
  await commands.revise({
    entityType: 'lesson', entityId: lesson.id, expectedHeads: lesson.heads,
    value: {...lesson.value, profileIds: [profileId, secondProfileId]},
  });
  for (let index = 3; index <= 60; index += 1) {
    await commands.revise({
      entityType: 'word', entityId: `task5-word-${index}`, expectedHeads: [],
      value: {lessonId: lesson.id, german: `Wort ${index}`, answers: [`word${index}`], hint: '', archived: false},
    });
  }
  let rounds = 0;
  while (project(commands.getState().ledger).profiles[profileId].points < 1600) {
    if (++rounds > 30) throw new Error('Synthetic earning fixture did not reach level 9.');
    const choice = commands.practiceChoices({profileId}).find(({mode}) => mode === 'all');
    if (!choice || choice.availableCount === 0) {
      day = new Date(day.getTime() + 40 * 86_400_000);
      rounds -= 1;
      continue;
    }
    await commands.start({profileId, mode: 'all', size: 30});
    const roundId = commands.getState().rounds[profileId].id;
    let steps = 0;
    while (!['completed', 'abandoned'].includes(commands.getState().rounds[profileId].status)) {
      if (++steps > 40) throw new Error('Synthetic earning round did not finish.');
      const available = commands.roundAvailability({roundId});
      if (available.kind === 'task') {
        learning = project(commands.getState().ledger);
        const answer = learning.entities.words[available.task.wordId].value.answers[0];
        await commands.submit({roundId, typed: answer});
        await commands.next({roundId});
      } else if (available.kind === 'exhausted') {
        await commands.finish({roundId, reason: 'exhausted'});
      } else {
        await commands.next({roundId});
      }
    }
    day = new Date(day.getTime() + 40 * 86_400_000);
  }
  const next = commands.getState();
  return {state: next, profileId, secondProfileId};
}

async function waitForOutbox(page, count) {
  const timeoutAt = Date.now() + 30_000;
  while (Date.now() < timeoutAt) {
    const state = await productState(page);
    if (state.outboxEventIds.length === count && state.pendingPackets.length === 0) return;
    await page.waitForTimeout(100);
  }
  throw new Error(`Timed out waiting for ${count} queued learning events.`);
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

test('parent sees a local upgrade preview before any commerce setup write', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice({viewport: {width: 1280, height: 900}});
  try {
    await page.goto(harness.baseUrl);
    await setup(page);
    await openAdultSettings(page);
    await page.getByRole('button', {name: 'Mit Google verbinden'}).click();
    await page.getByRole('button', {name: 'Neuen Lernbereich anlegen'}).click();
    while ((await productState(page)).binding === null) await page.waitForTimeout(50);
    await waitForOutbox(page, 0);
    await page.getByRole('button', {name: 'Einstellungen', exact: true}).click();
    await page.locator('#settings-task-advanced > summary').click();

    const commerceFiles = () => [...harness.google.files.values()]
      .filter(({metadata}) => metadata.appProperties?.app === 'vokabeltrainer-purchases').length;
    const writesBeforePreview = commerceFiles();
    await page.getByRole('button', {name: 'Daten für Figuren und Käufe aktualisieren'}).click();
    await page.getByRole('heading', {name: 'Datenaktualisierung prüfen'}).waitFor();
    assert.equal(commerceFiles(), writesBeforePreview);
    assert.match(await page.locator('[data-commerce-preview]').innerText(), /Lernpunkte und Level bleiben erhalten/);
    assert.equal((await productState(page)).commerce.mode, 'inactive');
    await page.getByRole('button', {name: 'Aktualisierung jetzt durchführen'}).click();
    await page.getByText('Figuren und Käufe sind bereit.', {exact: true}).waitFor({timeout: 60_000});
    assert.ok(commerceFiles() > writesBeforePreview, JSON.stringify({
      commerce: (await productState(page)).commerce,
      files: [...harness.google.files.values()].map(({metadata}) => metadata),
      body: await page.locator('body').innerText(),
    }));
  } finally {
    await harness.close();
  }
});

test('purchase UI stays usable on desktop and narrow screens with keyboard focus', {timeout: 90_000}, async () => {
  await mkdir(resultsDirectory, {recursive: true});
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice({viewport: {width: 390, height: 844}});
  try {
    await page.goto(harness.baseUrl);
    await setup(page);
    await page.getByRole('button', {name: /Ada/}).first().click();
    await page.getByRole('button', {name: 'Mein Avatar'}).click();
    const tab = page.getByRole('button', {name: 'Meine Figur', exact: true});
    await tab.waitFor();
    await tab.focus();
    assert.equal(await tab.evaluate((node) => document.activeElement === node), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({path: resolve(resultsDirectory, 'mobile-inactive.png'), fullPage: true});
  } finally {
    await harness.close();
  }
});

test('purchase view follows a root replaced during its initial load', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice({viewport: {width: 1280, height: 900}});
  try {
    await page.goto(harness.baseUrl);
    const result = await page.evaluate(async () => {
      const {renderPurchases} = await import('/src/trainer/ui/purchases.js');
      const productApp = document.querySelector('#app');
      productApp.id = 'product-app';
      const app = document.createElement('main');
      app.id = 'app';
      document.body.append(app);
      let release;
      const pending = new Promise((resolve) => { release = resolve; });
      const commerce = {getView: () => pending};
      const first = document.createElement('section');
      app.append(first);
      renderPurchases({root: first, profileId: 'p1', commerce, onRefresh: () => {}, online: true});
      const replacement = document.createElement('section');
      app.replaceChildren(replacement);
      renderPurchases({root: replacement, profileId: 'p1', commerce, onRefresh: () => {}, online: true});
      release({mode: 'inactive', head: null, accounts: {}, jobs: [], selection: [], control: null});
      await pending;
      await new Promise((resolve) => setTimeout(resolve, 0));
      const result = {text: replacement.innerText, connected: replacement.isConnected};
      app.remove();
      productApp.id = 'app';
      return result;
    });
    assert.equal(result.connected, true);
    assert.doesNotMatch(result.text, /werden geladen/);
    assert.match(result.text, /Erwachsenenbereich/);
  } finally {
    await harness.close();
  }
});

test('late purchase loading never rebuilds the adult view after leaving the avatar', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice({viewport: {width: 1280, height: 900}});
  try {
    await page.goto(harness.baseUrl);
    await setup(page);
    const state = await productState(page);
    const profileId = Object.keys(project(state.ledger).profiles)[0];
    const result = await page.evaluate(async ({initial, selectedProfileId}) => {
      const {mountShell} = await import('/src/trainer/ui/shell.js');
      sessionStorage.setItem('vokabeltrainer-shell-v1', JSON.stringify({
        view: 'avatar', profileId: selectedProfileId, practiceActive: false,
      }));
      let release;
      const pending = new Promise((resolve) => { release = resolve; });
      const root = document.querySelector('#app');
      const shell = mountShell({
        root,
        commands: {getState: () => structuredClone(initial)},
        pinGate: {isUnlocked: () => true, lock() {}},
        commerce: {getView: () => pending},
      });
      shell.render();
      shell.show('adult');
      const input = root.querySelector('input');
      input.value = 'offener Erwachsenenentwurf';
      release({mode: 'inactive', head: null, accounts: {}, jobs: [], selection: [], control: null});
      await pending;
      await new Promise((resolve) => setTimeout(resolve, 0));
      const result = {
        sameNode: input === root.querySelector('input'),
        value: root.querySelector('input')?.value,
        adultVisible: root.querySelector('.adult-layout') !== null,
      };
      shell.destroy();
      return result;
    }, {initial: state, selectedProfileId: profileId});
    assert.deepEqual(result, {
      sameNode: true, value: 'offener Erwachsenenentwurf', adultVisible: true,
    });
  } finally {
    await harness.close();
  }
});

test('activation preview pairs its visible current state with the confirmed ticket', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice({viewport: {width: 1280, height: 900}});
  try {
    await page.goto(harness.baseUrl);
    await setup(page);
    const oldState = await productState(page);
    const current = (await earnedState(oldState)).state;
    const binding = {accountId: 'a1', folderId: 'f1', descriptorFileId: 'df1', datasetId: 'd1'};
    oldState.binding = binding;
    current.binding = binding;
    await page.evaluate(({stale, fresh}) => {
      window.__activationTicket = null;
      return import('/src/trainer/ui/purchases.js').then(({renderCommerceSettings}) => {
        const root = document.createElement('section');
        document.querySelector('#app').replaceChildren(root);
        const commerce = {
          previewActivation: async () => ({
            ticket: {stateHash: 'fresh-ticket'}, previewState: {ledger: fresh.ledger},
          }),
          activate: async (ticket) => { window.__activationTicket = ticket; },
        };
        const render = () => renderCommerceSettings({
          root, state: stale, commerce, isUnlocked: () => true, onRefresh: render,
        });
        render();
      });
    }, {stale: oldState, fresh: current});
    await page.getByRole('button', {name: 'Daten für Figuren und Käufe aktualisieren'}).click();
    const preview = page.locator('[data-commerce-preview]');
    await preview.waitFor();
    assert.match(await preview.innerText(), /Ada: 1600 Lernpunkte/);
    await page.getByRole('button', {name: 'Aktualisierung jetzt durchführen'}).click();
    assert.deepEqual(await page.evaluate(() => window.__activationTicket), {stateHash: 'fresh-ticket'});
  } finally {
    await harness.close();
  }
});

test('an unclear setup is the activation operation offered for explicit continuation', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice({viewport: {width: 1280, height: 900}});
  try {
    await page.goto(harness.baseUrl);
    await setup(page);
    const state = await productState(page);
    state.binding = {accountId: 'a1', folderId: 'f1', descriptorFileId: 'df1', datasetId: 'd1'};
    state.commerce.mode = 'migrating';
    state.commerce.setup = {operationId: 'setup-recovery', phase: 'reconciling'};
    state.commerce.control = {operationId: 'old-control', operation: 'initialize', phase: 'reserved'};
    await page.evaluate((current) => {
      window.__resumedCommerceOperation = null;
      return import('/src/trainer/ui/purchases.js').then(({renderCommerceSettings}) => {
        const root = document.createElement('section');
        document.querySelector('#app').replaceChildren(root);
        const commerce = {resume: async (operationId) => { window.__resumedCommerceOperation = operationId; }};
        const render = () => renderCommerceSettings({
          root, state: current, commerce, isUnlocked: () => true, onRefresh: render,
        });
        render();
      });
    }, state);

    await page.getByRole('button', {name: 'Datenaktualisierung fortsetzen'}).click();
    assert.equal(await page.evaluate(() => window.__resumedCommerceOperation), 'setup-recovery');
  } finally {
    await harness.close();
  }
});

test('earned points buy through the real service and survive reopen, offline use, stale preview and lost response', {timeout: 180_000}, async () => {
  await mkdir(resultsDirectory, {recursive: true});
  const harness = await createTrainerHarness();
  const {context, page, controls} = await harness.newDevice({viewport: {width: 1280, height: 900}});
  try {
    await page.goto(harness.baseUrl);
    await setup(page);
    const earned = await earnedState(await productState(page));
    const earnedProjection = project(earned.state.ledger);
    assert.equal(earnedProjection.profiles[earned.profileId].points, 1600);
    assert.equal(earnedProjection.profiles[earned.secondProfileId].points, 0);
    await writeProductState(page, earned.state);
    await page.reload();
    assert.equal(project((await productState(page)).ledger).profiles[earned.profileId].points, 1600);

    await openAdultSettings(page);
    await page.getByRole('button', {name: 'Mit Google verbinden'}).click();
    await page.getByRole('button', {name: 'Neuen Lernbereich anlegen'}).click();
    while ((await productState(page)).binding === null) await page.waitForTimeout(50);
    await waitForOutbox(page, 0);
    await page.getByRole('button', {name: 'Einstellungen', exact: true}).click();
    await page.locator('#settings-task-advanced > summary').click();
    await page.getByRole('button', {name: 'Daten für Figuren und Käufe aktualisieren'}).click();
    await page.getByRole('button', {name: 'Aktualisierung jetzt durchführen'}).click();
    try {
      await page.getByText('Figuren und Käufe sind bereit.', {exact: true}).waitFor({timeout: 20_000});
    } catch (error) {
      const failed = await productState(page);
      error.message += `\nActivation diagnostics:${JSON.stringify({
        commerce: failed.commerce,
        outbox: failed.outboxEventIds.length,
        pendingPackets: failed.pendingPackets.length,
        quarantined: failed.quarantinedFiles.length,
        writes: harness.google.writes.slice(-8),
        unexpected: harness.google.unexpected.slice(-8),
      })}\nVisible page:\n${await page.locator('body').innerText()}`;
      throw error;
    }

    await page.getByRole('button', {name: 'Zur Profilauswahl'}).click();
    await page.getByRole('button', {name: /Ada/}).first().click();
    await page.getByRole('button', {name: 'Mein Avatar'}).click();
    await page.getByRole('button', {name: 'Entwicklung', exact: true}).click();
    assert.equal(await page.locator('.evolution-card').count(), 4);
    assert.match(await page.locator('.evolution-summary').innerText(), /Nächste Form: Stufe 2.*Preis: 200 Punkte/);
    assert.match(await page.locator('.evolution-summary').innerText(), /Verfügbar: 1600 Punkte.*Noch 0 Punkte fehlen/);
    assert.equal(await page.locator('.evolution-progress').getAttribute('aria-valuenow'), '100');
    await page.screenshot({path: resolve(resultsDirectory, 'desktop-evolution.png'), fullPage: true});
    const buyStage2 = page.getByRole('button', {name: 'Für 200 Punkte entwickeln'});
    try { await buyStage2.click({timeout: 10_000}); } catch (error) {
      error.message += `\nVisible page:\n${await page.locator('body').innerText()}\nCommerce:${JSON.stringify((await productState(page)).commerce)}`;
      throw error;
    }
    assert.equal(await page.locator('.purchase-dialog .evolution-art img').count(), 1);
    await page.getByRole('button', {name: 'Kauf verbindlich bestätigen'}).click();
    await page.getByText('Der Kauf ist bestätigt.', {exact: true}).waitFor({timeout: 30_000});
    await page.getByRole('heading', {name: 'Freigeschaltet'}).waitFor();
    assert.equal(await page.getByRole('button', {name: 'Jetzt auswählen'}).count(), 1);
    assert.equal((await productState(page)).commerce.selection.length, 0);
    await page.keyboard.press('Escape');
    await page.locator('.purchase-dialog').waitFor({state: 'detached'});
    assert.equal(await page.evaluate(() => document.activeElement?.isConnected === true), true);
    assert.equal(await page.evaluate(() => document.activeElement?.closest('.commerce-tabs') !== null), true);
    assert.match(await page.locator('.commerce-balance').innerText(), /1400 Verfügbare Punkte/);
    assert.equal(project((await productState(page)).ledger).profiles[earned.profileId].points, 1600);
    await page.locator('[data-stage="2"]').getByRole('button', {name: 'Diese Form auswählen'}).click();
    await page.locator('[data-stage="2"]').getByRole('button', {name: 'Ausgewählt'}).waitFor({timeout: 5_000});
    assert.equal(await page.locator('.classic-avatar').count(), 0);
    assert.equal(await page.evaluate(() => document.activeElement?.isConnected === true), true);
    assert.equal(await page.evaluate(() => document.activeElement?.closest('.commerce-tabs') !== null), true);
    await page.getByRole('button', {name: 'Meine Figur', exact: true}).click();
    await page.locator('[data-selected-purchase-figure] img[src*="dragon-stage-2"]').waitFor();
    const dragonCard = page.locator('.commerce-card').filter({
      has: page.getByRole('heading', {name: 'Einfacher Drache', exact: true}),
    });
    const selectBaseDragon = dragonCard.getByRole('button', {name: 'Grundform auswählen'});
    await selectBaseDragon.waitFor();
    assert.equal(await selectBaseDragon.isEnabled(), true);
    await dragonCard.getByRole('button', {name: 'Entwicklung ansehen'}).click();
    await page.locator('[data-stage="2"] button:disabled').waitFor();
    assert.equal((await productState(page)).commerce.selection[0].stage, 2);
    await page.getByRole('button', {name: 'Meine Figur', exact: true}).click();
    await page.screenshot({path: resolve(resultsDirectory, 'desktop-owned.png'), fullPage: true});
    await page.locator('[data-selected-purchase-figure]').screenshot({path: resolve(resultsDirectory, 'desktop-selected-figure.png')});

    await page.close();
    const reopened = await context.newPage();
    await reopened.goto(harness.baseUrl);
    await reopened.getByRole('button', {name: /Ada/}).first().click();
    await reopened.getByRole('button', {name: 'Mein Avatar'}).click();
    await reopened.getByRole('button', {name: 'Entwicklung', exact: true}).click();
    await reopened.getByRole('button', {name: 'Diese Form auswählen'}).waitFor();
    assert.match(await reopened.locator('.commerce-balance').innerText(), /1400 Verfügbare Punkte/);
    await reopened.getByRole('button', {name: 'Meine Figur', exact: true}).click();
    await reopened.getByRole('button', {name: 'Klassisch auswählen'}).click();
    await reopened.locator('.classic-avatar').waitFor();
    await reopened.getByRole('button', {name: 'Entwicklung', exact: true}).click();

    await openAdultSettings(reopened);
    await reopened.getByRole('button', {name: 'Mit Google verbinden'}).click();
    await waitForOutbox(reopened, 0);
    await reopened.getByRole('button', {name: 'Zur Profilauswahl'}).click();
    await reopened.getByRole('button', {name: /Ada/}).first().click();
    await reopened.getByRole('button', {name: 'Mein Avatar'}).click();
    await reopened.getByRole('button', {name: 'Entwicklung', exact: true}).click();

    await reopened.getByRole('button', {name: 'Für 400 Punkte entwickeln'}).click();
    await reopened.getByRole('button', {name: 'Kauf verbindlich bestätigen'}).waitFor();
    const beforeStale = (await productState(reopened)).ledger.events.length;
    await reopened.locator('input[name="skin"]').nth(1).evaluate((input) => {
      input.checked = true;
      input.dispatchEvent(new Event('change', {bubbles: true}));
    });
    while ((await productState(reopened)).ledger.events.length === beforeStale) await reopened.waitForTimeout(25);
    await reopened.getByRole('button', {name: 'Kauf verbindlich bestätigen'}).click();
    await reopened.getByText('Die Kaufvorschau ist nicht mehr aktuell.', {exact: true}).waitFor();
    assert.equal((await productState(reopened)).commerce.jobs.length, 1);
    await reopened.getByRole('button', {name: 'Abbrechen'}).click();
    assert.equal(await reopened.evaluate(() => document.activeElement?.isConnected === true), true);
    assert.equal(await reopened.evaluate(() => document.activeElement?.closest('.commerce-tabs') !== null), true);

    await waitForOutbox(reopened, 0);

    controls.loseNextPointerResponse = true;
    await reopened.getByRole('button', {name: 'Für 400 Punkte entwickeln'}).click();
    await reopened.getByRole('button', {name: 'Kauf verbindlich bestätigen'}).click();
    await reopened.getByText(/Ausgang ist noch unbekannt/).waitFor({timeout: 30_000});
    await reopened.getByRole('button', {name: 'Kauf fortsetzen'}).click();
    await reopened.getByText('Der Kauf wurde erneut geprüft.', {exact: true}).waitFor({timeout: 30_000});
    assert.match(await reopened.locator('.commerce-balance').innerText(), /1000 Verfügbare Punkte/);
    await reopened.locator('[data-stage="3"]').getByRole('button', {name: 'Diese Form auswählen'}).click();
    await reopened.locator('[data-stage="3"]').getByRole('button', {name: 'Ausgewählt'}).waitFor({timeout: 5_000});
    assert.equal(await reopened.evaluate(() => document.activeElement?.isConnected === true), true);
    await reopened.getByRole('button', {name: 'Meine Figur', exact: true}).click();
    await reopened.locator('[data-selected-purchase-figure] img[src*="dragon-stage-3"]').waitFor();

    await reopened.setViewportSize({width: 390, height: 844});
    assert.equal(await reopened.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await reopened.getByRole('button', {name: 'Entwicklung', exact: true}).click();
    await reopened.screenshot({path: resolve(resultsDirectory, 'mobile-evolution.png'), fullPage: true});
    await reopened.getByRole('button', {name: 'Meine Figur', exact: true}).click();
    await reopened.screenshot({path: resolve(resultsDirectory, 'mobile-owned.png'), fullPage: true});
    await reopened.locator('[data-selected-purchase-figure]').screenshot({path: resolve(resultsDirectory, 'mobile-selected-figure.png')});
    controls.offline = true;
    await context.setOffline(true);
    await reopened.reload();
    if (await reopened.getByRole('button', {name: /Ada/}).count()) {
      await reopened.getByRole('button', {name: /Ada/}).first().click();
    }
    if (!await reopened.getByRole('heading', {name: 'Mein Avatar'}).count()) {
      await reopened.getByRole('button', {name: 'Mein Avatar'}).click();
    }
    await reopened.locator('[data-selected-purchase-figure] img[src*="dragon-stage-3"]').waitFor();
    await reopened.getByRole('button', {name: 'Entwicklung', exact: true}).click();
    await reopened.locator('[data-stage="3"]').getByRole('button', {name: 'Ausgewählt'}).waitFor();
    const offlineBuy = reopened.getByRole('button', {name: 'Offline – Kauf nicht möglich'});
    await offlineBuy.waitFor();
    assert.equal(await offlineBuy.isDisabled(), true);

    await reopened.getByRole('button', {name: 'Profil wechseln'}).click();
    await reopened.getByRole('button', {name: /Ben/}).first().click();
    await reopened.getByRole('button', {name: 'Mein Avatar'}).click();
    await reopened.getByRole('button', {name: 'Entwicklung', exact: true}).click();
    assert.match(await reopened.locator('.commerce-balance').innerText(), /0 Verfügbare Punkte/);
    assert.equal(await reopened.locator('[data-stage="2"]').getByRole('button', {name: 'Diese Form auswählen'}).count(), 0);
    assert.match(await reopened.locator('.evolution-summary').innerText(), /Noch 200 Punkte fehlen/);
  } finally {
    await harness.close();
  }
});

test('failed selection after confirmed purchase stays visible in the dialog', {timeout: 60_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice();
  try {
    await page.goto(harness.baseUrl);
    await page.evaluate(async () => {
      const {renderPurchases} = await import('/src/trainer/ui/purchases.js');
      const root = document.createElement('div');
      root.id = 'synthetic-purchase-ui';
      document.body.append(root);
      const view = {
        mode: 'active', jobs: [], selection: [],
        accounts: {p1: {
          earnedPoints: 200, availablePoints: 200,
          entitledFigureIds: ['dragon'], entitledEvolutionIds: ['evolution:dragon:1'],
        }},
      };
      const commerce = {
        isConnected: () => true,
        getView: async () => view,
        preview: async () => ({price: 200, availablePoints: 200}),
        confirm: async () => { view.accounts.p1.entitledEvolutionIds.push('evolution:dragon:2'); },
        select: async () => { throw new Error('Auswahlprobe fehlgeschlagen'); },
      };
      renderPurchases({root, profileId: 'p1', commerce, online: true});
    });
    const ui = page.locator('#synthetic-purchase-ui');
    await ui.getByRole('button', {name: 'Entwicklung', exact: true}).click();
    await ui.getByRole('button', {name: 'Für 200 Punkte entwickeln'}).click();
    await page.getByRole('button', {name: 'Kauf verbindlich bestätigen'}).click();
    await page.getByRole('heading', {name: 'Freigeschaltet'}).waitFor();
    await page.getByRole('button', {name: 'Jetzt auswählen'}).click();
    await page.locator('.purchase-dialog').getByText('Die Auswahl konnte noch nicht gespeichert werden.', {exact: false}).waitFor();
    assert.equal(await page.getByRole('button', {name: 'Jetzt auswählen'}).isEnabled(), true);
    await page.keyboard.press('Escape');
    await page.locator('.purchase-dialog').waitFor({state: 'detached'});
  } finally {
    await harness.close();
  }
});
