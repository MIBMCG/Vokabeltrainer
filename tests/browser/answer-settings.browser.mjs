import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createTrainerHarness} from './trainer-harness.mjs';

async function setup(page) {
  for (const [id, value] of Object.entries({
    'dataset-name': 'Satzzeichenprobe', 'setup-pin': '1234', 'setup-pin-repeat': '1234',
    'setup-profile': 'Ada', 'setup-lesson': 'Unit 1',
    'setup-word-1-german': 'Hallo', 'setup-word-1-answers': 'Hello, world!',
    'setup-word-2-german': 'Hallo nochmal', 'setup-word-2-answers': 'Hello, world!',
  })) await page.locator(`#${id}`).fill(value);
  await page.locator('#setup-submit').click();
  await page.locator('#profile-list').waitFor();
}

async function openSettings(page) {
  await page.locator('#adult-entry').click();
  if (await page.locator('#adult-pin').count()) {
    await page.locator('#adult-pin').fill('1234');
    await page.locator('#adult-unlock').click();
  }
  await page.locator('#adult-nav').getByRole('button', {name: 'Einstellungen', exact: true}).click();
  const task = page.locator('#settings-task-answers');
  await task.waitFor({timeout: 3000});
  if (await task.getAttribute('open') === null) await task.locator('summary').click();
  return page.getByLabel('Satzzeichen müssen stimmen', {exact: true});
}

async function state(page) {
  return page.evaluate(() => new Promise((resolveState, reject) => {
    const request = indexedDB.open('vokabeltrainer-product-v1', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const get = database.transaction('product-state').objectStore('product-state').get('current');
      get.onerror = () => { database.close(); reject(get.error); };
      get.onsuccess = () => { database.close(); resolveState(get.result); };
    };
  }));
}

test('device punctuation option persists through reload, controlled update and offline assessment', {timeout: 90000}, async () => {
  const harness = await createTrainerHarness();
  const {page, context} = await harness.newDevice({viewport: {width: 320, height: 850}});
  try {
    await page.goto(harness.baseUrl);
    await setup(page);
    const checkbox = await openSettings(page);
    assert.equal(await checkbox.isChecked(), true);
    const before = await state(page);
    await checkbox.uncheck();
    await page.getByText('Satzzeichen werden bei der Antwortprüfung ignoriert.', {exact: true}).waitFor();
    assert.deepEqual(await state(page), before);
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await mkdir(resolve('test-results', 'answer-settings'), {recursive: true});
    await page.locator('#settings-task-answers').screenshot({path: resolve('test-results', 'answer-settings', '320px-200percent.png')});
    await page.reload();
    await page.locator('#profile-list').waitFor();
    assert.equal(await (await openSettings(page)).isChecked(), false);
    await page.getByRole('button', {name: 'Zur Profilauswahl', exact: true}).click();
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    harness.setServiceWorkerVersion('v55');
    await page.evaluate(async () => (await navigator.serviceWorker.getRegistration('./')).update());
    await page.waitForFunction(async () => (await navigator.serviceWorker.getRegistration('./'))?.waiting !== null);
    await page.reload();
    await page.locator('#profile-list').waitFor();
    await page.locator('#update-activate').waitFor();
    const navigation = page.waitForNavigation();
    await page.locator('#update-activate').click();
    await navigation;
    await page.locator('#profile-list').waitFor();
    assert.deepEqual(await state(page), before);
    await context.setOffline(true);
    await harness.stopServer();
    await page.reload({waitUntil: 'domcontentloaded'});
    await page.locator('#profile-list').waitFor();
    const offlineCheckbox = await openSettings(page);
    assert.equal(await offlineCheckbox.isChecked(), false);
    await page.getByRole('button', {name: 'Zur Profilauswahl', exact: true}).click();
    await page.getByRole('button', {name: /^Ada/}).click();
    await page.getByRole('button', {name: 'Üben', exact: true}).click();
    await page.getByRole('radio', {name: /^Alle Vokabeln/}).check();
    await page.getByRole('button', {name: 'Runde starten', exact: true}).click();
    await page.getByLabel('Englische Übersetzung').fill('Hello world');
    await page.getByRole('button', {name: 'Prüfen', exact: true}).click();
    await page.getByText('Richtig!', {exact: true}).waitFor();
    assert.equal((await state(page)).ledger.events.filter(e => e.type === 'answer.recorded').at(-1).payload.correct, true);
    assert.equal(await page.locator('#feedback').getByText('Hello, world!', {exact: true}).count(), 1);
    await page.getByRole('button', {name: 'Weiter', exact: true}).click();
    await page.getByRole('button', {name: 'Profil wechseln', exact: true}).click();
    const enabled = await openSettings(page);
    await enabled.check();
    await page.getByText('Satzzeichen müssen bei der Antwortprüfung stimmen.', {exact: true}).waitFor();
    await page.getByRole('button', {name: 'Zur Profilauswahl', exact: true}).click();
    await page.getByRole('button', {name: /^Ada/}).click();
    await page.getByRole('button', {name: 'Fortsetzen', exact: true}).click();
    await page.getByLabel('Englische Übersetzung').fill('Hello world');
    await page.getByRole('button', {name: 'Prüfen', exact: true}).click();
    await page.getByText('Noch nicht ganz', {exact: true}).waitFor();
    const after = await state(page);
    assert.deepEqual(after.ledger.events.filter(e => e.type === 'answer.recorded').map(e => e.payload.correct), [true, false]);
  } finally {
    await harness.close();
  }
});
