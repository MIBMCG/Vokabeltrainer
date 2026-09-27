import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';

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

test('adult navigation and settings present clear tasks and preserve the open task after saving', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice({viewport: {width: 390, height: 844}});
  const screenshots = resolve('.superpowers/sdd/2026-09-27-bedienkorrekturen');
  try {
    await page.goto(harness.baseUrl);
    await setupPractice(page);
    await page.locator('#adult-entry').click();

    const nav = page.locator('#adult-nav');
    for (const name of ['Vokabeln', 'Lernstand', 'Lernregeln', 'Einstellungen']) {
      assert.equal(await nav.getByRole('button', {name, exact: true}).count(), 1);
    }
    assert.deepEqual(await nav.locator('.adult-nav-description').allTextContents(), [
      'Wörter und Lektionen', 'Fortschritt ansehen', 'Wiederholen einstellen', 'Gerät und Familie',
    ]);

    const settingsButton = nav.getByRole('button', {name: 'Einstellungen', exact: true});
    await settingsButton.focus();
    await page.keyboard.press('Enter');
    await page.getByRole('heading', {name: 'Einstellungen', exact: true}).waitFor();

    const tasks = page.locator('.settings-task');
    const children = tasks.filter({has: page.locator('summary', {hasText: 'Kinder verwalten'})});
    const connection = page.locator('#settings-task-connection');
    const backup = page.locator('#settings-task-backup');
    const pin = page.locator('#settings-task-pin');
    const advanced = page.locator('#settings-task-advanced');
    for (const task of [children, connection, backup, pin, advanced]) assert.equal(await task.count(), 1);

    assert.equal(await connection.getAttribute('open'), '');
    assert.equal(await connection.locator('[data-settings-sync-summary]').innerText(), 'Status: Auf diesem Gerät gespeichert');
    assert.equal(await backup.getAttribute('open'), null);
    assert.equal(await pin.getAttribute('open'), null);
    assert.equal(await advanced.getAttribute('open'), null);

    await connection.getByRole('button', {name: 'Mit Google verbinden', exact: true}).click();
    await connection.getByRole('button', {name: 'Neuen Lernbereich anlegen', exact: true}).click();
    await connection.locator('[data-settings-sync-summary]').filter({hasText: 'Status: Abgeglichen'}).waitFor();
    await connection.locator('summary').first().click();
    assert.equal(await connection.getAttribute('open'), null);
    await mkdir(screenshots, {recursive: true});
    await page.screenshot({path: resolve(screenshots, 'adult-settings-mobile.png'), fullPage: true});
    await page.setViewportSize({width: 1280, height: 900});
    await page.screenshot({path: resolve(screenshots, 'adult-settings-desktop.png'), fullPage: true});
    await page.setViewportSize({width: 390, height: 844});

    await children.locator('summary').first().click();
    await children.locator('summary').filter({hasText: 'Kind hinzufügen'}).click();
    const addForm = children.locator('form').filter({has: page.getByRole('button', {name: 'Kind hinzufügen'})});
    await addForm.locator('[name="name"]').fill('Bea');
    await addForm.getByRole('button', {name: 'Kind hinzufügen'}).click();
    await page.getByText('Das Kind wurde hinzugefügt.', {exact: true}).waitFor();
    assert.equal(await page.locator('#settings-task-children').getAttribute('open'), '');

    await backup.locator('summary').first().click();
    assert.equal(await backup.getByRole('button', {name: 'Sicherung herunterladen', exact: true}).count(), 1);
    await pin.locator('summary').first().click();
    assert.equal(await pin.getByLabel('Aktuelle PIN').count(), 1);
    await advanced.locator('summary').first().click();
    assert.equal(await advanced.getByRole('heading', {name: 'Figuren und Käufe', exact: true}).count(), 1);

    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  } finally {
    await harness.close();
  }
});
