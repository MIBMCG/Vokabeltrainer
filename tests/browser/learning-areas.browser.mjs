import test from 'node:test';
import assert from 'node:assert/strict';
import {createTrainerHarness} from './trainer-harness.mjs';

async function setup(page, name = 'Ada') {
  await page.getByRole('button', {name: 'Neu einrichten', exact: true}).click();
  for (const [id, value] of Object.entries({
    'dataset-name': 'Übungsinsel', 'setup-pin': '1234', 'setup-pin-repeat': '1234',
    'setup-profile': name, 'setup-lesson': 'Unit 1', 'setup-word-1-german': 'Hund',
    'setup-word-1-answers': 'dog', 'setup-word-2-german': 'Katze', 'setup-word-2-answers': 'cat',
  })) await page.locator(`#${id}`).fill(value);
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

async function seed(harness) {
  const device = await harness.newDevice();
  await device.page.goto(harness.baseUrl);
  await setup(device.page);
  await settings(device.page);
  if (await device.page.getByRole('button', {name: 'Mit Google verbinden', exact: true}).count()) {
    await device.page.getByRole('button', {name: 'Mit Google verbinden', exact: true}).click();
  }
  await device.page.getByRole('button', {name: 'Neuen Lernbereich anlegen', exact: true}).click();
  await device.page.getByText('Abgeglichen', {exact: true}).waitFor();
  return device;
}

test('empty start offers existing before new and cancellation never creates local data', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  try {
    const {page} = await harness.newDevice();
    await page.goto(harness.baseUrl);
    await page.getByRole('button', {name: 'Bestehenden Lernbereich verbinden', exact: true}).click();
    assert.equal(await page.locator('#setup-pin').count(), 0);
    await page.getByRole('button', {name: 'Neu einrichten', exact: true}).click();
    await page.locator('#dataset-name').waitFor();
    assert.equal(harness.google.files.size, 0);
  } finally { await harness.close(); }
});

test('direct existing join loads real profiles then asks only for local PIN', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  try {
    await seed(harness);
    const rootCount = [...harness.google.files.values()].filter(({metadata}) => metadata.appProperties.kind === 'dataset-folder').length;
    assert.ok(rootCount > 0);
    const {page} = await harness.newDevice();
    await page.goto(harness.baseUrl);
    await page.getByRole('button', {name: 'Bestehenden Lernbereich verbinden', exact: true}).click();
    await page.getByRole('button', {name: 'Mit Google verbinden', exact: true}).click();
    await page.getByRole('button', {name: 'Diesen Lernbereich prüfen', exact: true}).click();
    await page.getByRole('button', {name: 'Abbrechen', exact: true}).click();
    assert.equal(await page.locator('#setup-pin').count(), 0);
    await page.getByRole('button', {name: 'Diesen Lernbereich prüfen', exact: true}).click();
    await page.getByRole('button', {name: 'Lernbereich verwenden', exact: true}).click();
    await page.locator('#setup-pin').waitFor();
    assert.equal(await page.locator('#setup-profile').count(), 0);
    assert.equal(await page.locator('#setup-lesson').count(), 0);
    await page.locator('#setup-pin').fill('1234');
    await page.locator('#setup-pin-repeat').fill('1234');
    await page.locator('#setup-submit').click();
    await page.getByRole('button', {name: /Ada/}).waitFor().catch(async (error) => {
      error.message += `\nVisible page after PIN setup:\n${await page.locator('body').innerText()}`;
      throw error;
    });
    assert.equal([...harness.google.files.values()].filter(({metadata}) => metadata.appProperties.kind === 'dataset-folder').length, rootCount);
  } finally { await harness.close(); }
});

test('PIN setup waits until the confirmed initial join retry has settled', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  try {
    await seed(harness);
    const {page, controls} = await harness.newDevice();
    await page.goto(harness.baseUrl);
    await page.getByRole('button', {name: 'Bestehenden Lernbereich verbinden', exact: true}).click();
    await page.getByRole('button', {name: 'Mit Google verbinden', exact: true}).click();
    await page.getByRole('button', {name: 'Diesen Lernbereich prüfen', exact: true}).click();
    await page.getByRole('button', {name: 'Lernbereich verwenden', exact: true}).waitFor();
    // Pause the first retry list request after atomic installation, rather
    // than a preview/confirm read while the device is still empty.
    controls.shouldHoldFilesRead = () => page.evaluate(() => new Promise((resolve, reject) => {
      const request = indexedDB.open('vokabeltrainer-product-v1', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction('product-state', 'readonly');
        const get = transaction.objectStore('product-state').get('current');
        get.onsuccess = () => resolve(Boolean(get.result?.binding && get.result.pinVerifier === null));
        get.onerror = () => reject(get.error);
        transaction.oncomplete = () => database.close();
      };
    }));
    await page.getByRole('button', {name: 'Lernbereich verwenden', exact: true}).click();
    await controls.waitForHeldFilesRead();
    try {
      await page.locator('#setup-pin').waitFor();
      assert.equal(await page.locator('#setup-pin').isDisabled(), true, 'PIN writes must wait for the confirmed join retry');
      assert.equal(await page.locator('#setup-submit').isDisabled(), true);
      await page.getByText('Der Lernbereich wird noch abgeglichen. Danach können Sie die lokale PIN einrichten.', {exact: true}).waitFor();
    } finally { controls.releaseHeldFilesRead(); }
    await page.locator('#setup-pin').fill('1234');
    await page.locator('#setup-pin-repeat').fill('1234');
    await page.locator('#setup-submit').click();
    await page.getByRole('button', {name: /Ada/}).waitFor();
  } finally { await harness.close(); }
});

test('bound adult automatically lists areas, renames and protects active root', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  try {
    const {page} = await seed(harness);
    await page.getByRole('button', {name: 'Lernbereiche erneut suchen', exact: true}).click();
    const active = page.locator('[data-learning-area]').filter({hasText: 'Auf diesem Gerät aktiv'});
    await active.waitFor();
    assert.equal(await active.getByRole('button', {name: 'In Papierkorb verschieben', exact: true}).isDisabled(), true);
    await active.getByLabel('Neuer Name').fill('Gemeinsame Insel');
    await active.getByRole('button', {name: 'Umbenennen', exact: true}).click();
    await active.getByRole('heading', {name: 'Gemeinsame Insel', exact: true}).waitFor();
    assert.equal((await page.locator('#app').innerText()).includes('[object Promise]'), false);
    await page.reload();
    await page.locator('#profile-list').waitFor();
    await settings(page);
    await page.getByRole('button', {name: 'Mit Google verbinden', exact: true}).click();
    await page.getByRole('heading', {name: 'Gemeinsame Insel', exact: true}).waitFor();
    assert.deepEqual(harness.google.unexpected, []);
  } finally { await harness.close(); }
});

test('restored server session automatically lists areas and PIN-only setup survives reload', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness({serverAuth: true, serverDriveFixture: true});
  try {
    await seed(harness);
    const {page, controls} = await harness.newDevice();
    await page.goto(harness.baseUrl);
    await page.getByRole('button', {name: 'Diesen Lernbereich prüfen', exact: true}).waitFor();
    for (const id of ['setup-pin', 'setup-pin-repeat', 'setup-profile', 'setup-lesson', 'setup-word-1-german', 'setup-word-1-answers']) {
      assert.equal(await page.locator(`#${id}`).count(), 0, `${id} must wait for an explicit new setup or completed join`);
    }
    await page.getByRole('button', {name: 'Diesen Lernbereich prüfen', exact: true}).click();
    assert.equal(await page.getByRole('button', {name: 'Mit Google verbinden', exact: true}).count(), 0);
    await page.getByRole('button', {name: 'Lernbereich verwenden', exact: true}).waitFor();
    controls.holdNextFilesRead = true;
    await page.getByRole('button', {name: 'Lernbereich verwenden', exact: true}).click();
    await controls.waitForHeldFilesRead();
    try {
      assert.equal(await page.locator('#setup-pin, #setup-profile, #setup-lesson, #setup-word-1-german').count(), 0);
      assert.equal(await page.getByRole('button', {name: 'Neu einrichten', exact: true}).isDisabled(), true);
    } finally { controls.releaseHeldFilesRead(); }
    await page.getByText('Der gemeinsame Lernbereich wurde geladen.', {exact: false}).waitFor();
    await page.reload();
    await page.locator('#setup-pin').waitFor();
    assert.equal(await page.locator('#setup-profile').count(), 0);
    assert.equal(await page.locator('#dataset-name').count(), 0);
    assert.deepEqual(harness.google.unexpected, []);
  } finally { await harness.close(); }
});

test('explicit new setup preserves its draft when a server session resumes later', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness({serverAuth: true, serverDriveFixture: true});
  harness.delayNextServerSession(1500);
  try {
    const {page} = await harness.newDevice();
    const resumed = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/auth/session' && response.ok());
    await page.goto(harness.baseUrl);
    await page.getByRole('button', {name: 'Neu einrichten', exact: true}).click();
    await page.locator('#setup-profile').fill('Unfertiger Entwurf');
    await page.locator('#setup-lesson').fill('Meine Lektion');
    await page.locator('#setup-word-1-german').fill('Wolke');
    await page.locator('#setup-profile').focus();
    await page.locator('#setup-profile').evaluate((node) => node.setSelectionRange(2, 6));
    await page.waitForFunction(() => document.querySelector('#setup-profile')?.value === 'Unfertiger Entwurf');
    // The completed server resume emits a real auth status update. The selected
    // local setup must remain visible, editable and focused across it.
    await resumed;
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await page.locator('#setup-profile').inputValue(), 'Unfertiger Entwurf');
    assert.equal(await page.locator('#setup-lesson').inputValue(), 'Meine Lektion');
    assert.equal(await page.locator('#setup-word-1-german').inputValue(), 'Wolke');
    assert.equal(await page.locator('#setup-profile').evaluate((node) => document.activeElement === node && node.selectionStart === 2 && node.selectionEnd === 6), true);
    assert.equal(await page.getByRole('button', {name: 'Diesen Lernbereich prüfen', exact: true}).count(), 0);
  } finally { await harness.close(); }
});

test('inactive area needs explicit shared-area confirmation before trash', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  try {
    const {page} = await seed(harness);
    await seed(harness);
    await page.getByRole('button', {name: 'Lernbereiche erneut suchen', exact: true}).click();
    const inactive = page.locator('[data-learning-area]').filter({hasNotText: 'Auf diesem Gerät aktiv'});
    await inactive.waitFor();
    assert.equal(await page.locator('[data-learning-area]').getByRole('button', {name: 'Diesen Lernbereich prüfen', exact: true}).count(), 0,
      'a bound device offers management without a join action that the core cannot perform');
    await inactive.getByRole('button', {name: 'In Papierkorb verschieben', exact: true}).click();
    await page.getByText(/gesamten gemeinsamen Bereich mit Profilen, Lernständen und Käufen/).waitFor();
    assert.equal([...harness.google.files.values()].filter(({metadata}) => metadata.trashed).length, 0);
    await page.getByRole('button', {name: 'Abbrechen', exact: true}).click();
    assert.equal(await inactive.count(), 1);
    await inactive.getByRole('button', {name: 'In Papierkorb verschieben', exact: true}).click();
    await page.getByRole('button', {name: 'Diesen gemeinsamen Bereich in Papierkorb verschieben', exact: true}).click();
    await page.getByText('Der gemeinsame Lernbereich liegt im Google-Drive-Papierkorb.', {exact: true}).waitFor();
    assert.equal([...harness.google.files.values()].filter(({metadata}) => metadata.trashed).length, 1);
    assert.equal(await page.locator('[data-learning-area]').count(), 1);
  } finally { await harness.close(); }
});

test('PIN lock during rename preflight prevents the Drive write', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  try {
    const {page, controls} = await seed(harness);
    await page.getByRole('button', {name: 'Lernbereiche erneut suchen', exact: true}).click();
    const card = page.locator('[data-learning-area]');
    await card.getByLabel('Neuer Name').fill('Nicht schreiben');
    controls.holdNextMetadataRead = true;
    await card.getByRole('button', {name: 'Umbenennen', exact: true}).click();
    await controls.waitForHeldFilesRead();
    await page.getByRole('button', {name: 'Zur Profilauswahl', exact: true}).click();
    controls.releaseHeldFilesRead();
    await settings(page);
    await page.getByRole('heading', {name: 'Vokabeltrainer', exact: true}).waitFor();
    assert.equal(harness.google.writes.filter(({kind}) => kind === 'folder-update').length, 0);
  } finally { await harness.close(); }
});

test('existing-area intent resumes after navigation and discovery errors can be retried', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  try {
    await seed(harness);
    const {page, controls} = await harness.newDevice();
    await page.goto(harness.baseUrl);
    await page.getByRole('button', {name: 'Bestehenden Lernbereich verbinden', exact: true}).click();
    await page.reload();
    assert.equal(await page.locator('#setup-pin').count(), 0);
    controls.holdNextFilesRead = true;
    await page.getByRole('button', {name: 'Mit Google verbinden', exact: true}).click();
    await controls.waitForHeldFilesRead();
    controls.offline = true;
    controls.releaseHeldFilesRead();
    await page.getByRole('alert').waitFor();
    controls.offline = false;
    await page.getByRole('button', {name: 'Lernbereiche erneut suchen', exact: true}).click();
    await page.getByRole('button', {name: 'Diesen Lernbereich prüfen', exact: true}).waitFor();
    assert.equal(await page.locator('#setup-pin').count(), 0);
  } finally { await harness.close(); }
});

test('new entry and management fit 320 pixels at doubled text size', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const overflow = async (page) => page.evaluate(() => ({
    width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth,
    outside: [...document.querySelectorAll('#app *')].filter((node) => node.getBoundingClientRect().right > 321)
      .map((node) => ({tag: node.tagName, text: node.textContent.slice(0, 60)})).slice(0, 12),
  }));
  try {
    const {page} = await seed(harness);
    await page.setViewportSize({width: 320, height: 844});
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await page.getByRole('button', {name: 'Lernbereiche erneut suchen', exact: true}).click();
    await page.locator('[data-learning-area]').waitFor();
    const management = await overflow(page);
    assert.ok(management.scroll <= management.width, JSON.stringify(management));
    const nameWidth = await page.locator('[data-learning-area] input').evaluate((node) => node.getBoundingClientRect().width);
    assert.ok(nameWidth >= 140, `Rename input must be usable at 320px/200%: ${nameWidth}px`);
    await page.screenshot({path: '.superpowers/sdd/2026-10-20-lernbereiche/task-3-management-320.png', fullPage: true});
    await page.locator('[data-learning-area] input').scrollIntoViewIfNeeded();
    await page.screenshot({path: '.superpowers/sdd/2026-10-20-lernbereiche/task-3-management-viewport-320.png', fullPage: false});
    const fresh = await harness.newDevice({viewport: {width: 320, height: 844}});
    await fresh.page.goto(harness.baseUrl);
    await fresh.page.getByRole('button', {name: 'Bestehenden Lernbereich verbinden', exact: true}).click();
    await fresh.page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    const entry = await overflow(fresh.page);
    assert.ok(entry.scroll <= entry.width, JSON.stringify(entry));
    await fresh.page.screenshot({path: '.superpowers/sdd/2026-10-20-lernbereiche/task-3-entry-320.png', fullPage: true});
  } finally { await harness.close(); }
});
