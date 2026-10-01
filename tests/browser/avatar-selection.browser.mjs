import test from 'node:test';
import assert from 'node:assert/strict';

import {createCommands} from '../../src/trainer/commands.js';
import {project} from '../../src/trainer/learning/progress.js';
import {createTrainerHarness} from './trainer-harness.mjs';

async function setup(page) {
  await page.locator('#dataset-name').fill('Avatarinsel');
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

test('selected human colours stay locked during save and show errors beside the edited form', {timeout: 30_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice();
  try {
    await page.goto(harness.baseUrl);
    await page.locator('#dataset-name').waitFor();
    await page.evaluate(async () => {
      const {renderAvatar} = await import('/src/trainer/ui/rewards.js');
      const root = document.createElement('section');
      root.id = 'avatar-save-fixture';
      document.body.append(root);
      renderAvatar({root, profileId: 'test-profile', profile: {points: 0, avatar: {}, words: {}},
        state: {commerce: {mode: 'active', selection: [{profileId: 'test-profile', figureId: 'explorer-girl', stage: 1}]}},
        commands: {setAvatar: () => new Promise((_resolve, reject) => { window.rejectAvatarSave = reject; })},
      });
    });
    const fixture = page.locator('#avatar-save-fixture');
    const human = fixture.getByRole('form', {name: 'Entdeckerin gestalten', exact: true});
    await human.locator('input[name="clothing"][value="1"]').check();
    assert.equal(await human.locator('input[name="clothing"][value="2"]').isDisabled(), true,
      'the colour form must not accept another choice during an unsaved selection');
    await page.evaluate(() => window.rejectAvatarSave(new Error('Synthetischer Speicherfehler')));
    await human.getByText('Synthetischer Speicherfehler', {exact: true}).waitFor();
    assert.equal(await human.locator('input[name="clothing"][value="2"]').isDisabled(), false);
    assert.equal(await human.locator('input[name="clothing"][value="1"]').isDisabled(), false);
  } finally {
    await harness.close();
  }
});

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

async function addSecondProfileAndAppearance(initial) {
  let value = structuredClone(initial);
  let serial = 0;
  const commands = await createCommands({
    store: {
      async load() { return structuredClone(value); },
      async save(next) { value = structuredClone(next); },
    },
    deviceId: initial.deviceId,
    now: () => new Date('2027-01-02T10:00:00Z'),
    id: () => `avatar-browser-${++serial}`,
    onChange() {},
  });
  const before = project(commands.getState().ledger);
  const profileId = Object.keys(before.profiles)[0];
  const lesson = Object.values(before.entities.lessons)[0];
  const secondProfileId = 'avatar-ben';
  await commands.revise({
    entityType: 'profile', entityId: secondProfileId, expectedHeads: [],
    value: {name: 'Ben', archived: false},
  });
  await commands.revise({
    entityType: 'lesson', entityId: lesson.id, expectedHeads: lesson.heads,
    value: {...lesson.value, profileIds: [profileId, secondProfileId].sort()},
  });
  await commands.setAvatar({
    profileId, skin: 2, clothing: 4, head: null, back: null, hand: null,
  });
  return {state: commands.getState(), profileId};
}

async function waitForOutbox(page, count) {
  await page.waitForFunction(async (expected) => {
    const state = await new Promise((resolveState, reject) => {
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
    });
    return state.outboxEventIds.length === expected && state.pendingPackets.length === 0;
  }, count, {timeout: 30_000});
}

async function openAdultSettings(page) {
  await page.locator('#adult-entry').click();
  await page.locator('#adult-pin').fill('1234');
  await page.locator('#adult-unlock').click();
  await page.getByRole('button', {name: 'Einstellungen', exact: true}).click();
}

async function assertLoadedFigure(page, figureId) {
  const figure = page.locator(`.level-card [data-figure-id="${figureId}"]`);
  await figure.waitFor();
  assert.equal(await figure.getAttribute('data-complete'), 'true');
  try {
    await page.waitForFunction((id) => {
      const images = [...document.querySelectorAll(`.level-card [data-figure-id="${id}"] img`)];
      return images.length > 0 && images.every((image) => image.complete && image.naturalWidth > 0);
    }, figureId, {timeout: 5_000});
  } catch (error) {
    const images = await figure.locator('img').evaluateAll((nodes) => nodes.map((image) => ({
      src: image.currentSrc || image.src, complete: image.complete, naturalWidth: image.naturalWidth,
    })));
    error.message += `\nImage diagnostics: ${JSON.stringify(images)}`;
    throw error;
  }
}

test('selected girl appearance is shared by avatar, practice and journey and survives offline reload', {timeout: 120_000}, async () => {
  const harness = await createTrainerHarness();
  const {context, page, controls} = await harness.newDevice({viewport: {width: 1280, height: 900}});
  try {
    await page.goto(harness.baseUrl);
    await setup(page);
    const prepared = await addSecondProfileAndAppearance(await productState(page));
    await writeProductState(page, prepared.state);
    await page.reload();

    await openAdultSettings(page);
    await page.getByRole('button', {name: 'Mit Google verbinden'}).click();
    await page.getByRole('button', {name: 'Neuen Lernbereich anlegen'}).click();
    while ((await productState(page)).binding === null) await page.waitForTimeout(50);
    await waitForOutbox(page, 0);
    await page.getByRole('button', {name: 'Einstellungen', exact: true}).click();
    await page.locator('#settings-task-advanced > summary').click();
    await page.getByRole('button', {name: 'Daten für Figuren und Käufe aktualisieren'}).click();
    await page.getByRole('button', {name: 'Aktualisierung jetzt durchführen'}).click();
    await page.getByText('Figuren und Käufe sind bereit.', {exact: true}).waitFor({timeout: 60_000});

    await page.getByRole('button', {name: 'Zur Profilauswahl'}).click();
    await page.getByRole('button', {name: /Ada/}).first().click();
    await page.getByRole('button', {name: 'Mein Avatar'}).click();
    const girlCard = page.locator('.commerce-card').filter({
      has: page.getByRole('heading', {name: 'Entdeckerin', exact: true}),
    });
    await girlCard.getByRole('button', {name: 'Grundform auswählen'}).click();
    await girlCard.getByRole('button', {name: 'Ausgewählt'}).waitFor();

    const skinChoice = page.locator('input[name="skin"][value="2"]:visible');
    await skinChoice.waitFor();
    const selected = page.locator('[data-selected-purchase-figure] [data-figure-id="explorer-girl"]');
    await selected.locator('[data-art-key="figure-explorer-girl-skin-2"]').waitFor();
    await page.locator('input[name="clothing"][value="3"]:visible').check();
    await selected.locator('[data-art-key="figure-explorer-girl-clothing-3"]').waitFor();

    // Classic controls become available after deliberately selecting classic.
    await page.getByRole('button', {name: 'Klassisch auswählen'}).click();
    await page.locator('.classic-avatar > summary').waitFor();
    await page.locator('.classic-avatar input[name="clothing"][value="4"]').check();
    assert.equal(await page.locator('.classic-avatar').evaluate((node) => node.open), true);
    assert.equal(await page.locator('.classic-avatar input[name="clothing"][value="4"]').isChecked(), true);
    assert.equal(await page.evaluate(() => document.activeElement?.closest('form')?.getAttribute('aria-label')),
      'Klassischen Avatar gestalten');
    await girlCard.getByRole('button', {name: 'Grundform auswählen'}).click();
    await girlCard.getByRole('button', {name: 'Ausgewählt'}).waitFor();
    await selected.locator('[data-art-key="figure-explorer-girl-clothing-4"]').waitFor();

    await page.getByRole('button', {name: 'Üben'}).click();
    await assertLoadedFigure(page, 'explorer-girl');
    await page.getByRole('button', {name: 'Inselreise'}).click();
    await assertLoadedFigure(page, 'explorer-girl');

    controls.offline = true;
    await context.setOffline(true);
    await page.reload();
    if (await page.getByRole('button', {name: /Ada/}).count()) await page.getByRole('button', {name: /Ada/}).first().click();
    if (!await page.getByRole('heading', {name: 'Deine Inselreise'}).count()) {
      await page.getByRole('button', {name: 'Inselreise'}).click();
    }
    await assertLoadedFigure(page, 'explorer-girl');

    await page.getByRole('button', {name: 'Profil wechseln'}).click();
    await page.getByRole('button', {name: /Ben/}).first().click();
    await page.getByRole('button', {name: 'Üben'}).click();
    await page.locator('.level-card .avatar-art').waitFor();
    assert.equal(await page.locator('.level-card [data-figure-id="explorer-girl"]').count(), 0);

    await page.getByRole('button', {name: 'Profil wechseln'}).click();
    await page.getByRole('button', {name: /Ada/}).first().click();
    await page.getByRole('button', {name: 'Mein Avatar'}).click();
    await page.getByRole('button', {name: 'Klassisch auswählen'}).click();
    await page.getByRole('button', {name: 'Üben'}).click();
    await page.locator('.level-card .avatar-art').waitFor();
    assert.equal(await page.locator('.level-card [data-figure-id="explorer-girl"]').count(), 0);
  } finally {
    await harness.close();
  }
});
