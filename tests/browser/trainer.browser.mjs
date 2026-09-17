import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';

import {createTrainerHarness} from './trainer-harness.mjs';

const resultsDirectory = resolve('test-results');

async function productState(page) {
  return page.evaluate(() => new Promise((resolveState, reject) => {
    const request = indexedDB.open('vokabeltrainer-product-v1', 1);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('product-state')) {
        request.result.createObjectStore('product-state');
      }
    };
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
  await page.evaluate((value) => new Promise((resolveWrite, reject) => {
    const request = indexedDB.open('vokabeltrainer-product-v1', 1);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('product-state')) {
        request.result.createObjectStore('product-state');
      }
    };
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction('product-state', 'readwrite');
      transaction.objectStore('product-state').put(value, 'current');
      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => { database.close(); resolveWrite(); };
    };
  }), state);
}

async function seedOneCorrectAnswer(page, state) {
  const profile = state.ledger.events.find((event) => (
    event.type === 'entity.revised' && event.payload.entityType === 'profile'
  ));
  const word = state.ledger.events.find((event) => (
    event.type === 'entity.revised' && event.payload.entityType === 'word'
  ));
  const next = structuredClone(state);
  const envelope = {
    format: 'vokabeltrainer-product', formatVersion: 1, ruleVersion: 1, kind: 'event',
    datasetId: state.ledger.descriptor.datasetId,
    epochId: state.ledger.descriptor.rootEpochId,
    deviceId: state.deviceId,
    occurredAt: '2026-09-17T10:00:00.000Z', day: '2026-09-17',
  };
  const started = {
    ...envelope, id: 'browser-history-round-start', clock: state.clock + 1,
    type: 'round.started',
    payload: {roundId: 'browser-history-round', profileId: profile.payload.entityId, mode: 'all', size: 10},
  };
  const answer = {
    ...envelope, id: 'browser-history-answer', clock: state.clock + 2,
    type: 'answer.recorded',
    payload: {
      roundId: 'browser-history-round', profileId: profile.payload.entityId, ordinal: 1,
      wordId: word.payload.entityId, revisionId: word.id,
      learningId: word.payload.value.learningId, correct: true,
    },
  };
  next.clock = answer.clock;
  next.ledger.events.push(started, answer);
  next.outboxEventIds.push(started.id, answer.id);
  await writeProductState(page, next);
}

test('trainer setup, adult decisions, persistence and BFCache lifecycle', {timeout: 60_000}, async () => {
  const harness = await createTrainerHarness();
  const device = await harness.newDevice();
  const {page, context} = device;
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await mkdir(resultsDirectory, {recursive: true});

  try {
    await page.goto(harness.baseUrl);
    await page.keyboard.press('Tab');
    assert.match(await page.evaluate(() => document.activeElement?.textContent ?? ''), /Zum Inhalt/);
    const controlMetrics = await page.locator('button, input, textarea, select').evaluateAll((controls) => (
      controls.filter((control) => control.getClientRects().length).map((control) => ({
        height: control.getBoundingClientRect().height,
        fontSize: Number.parseFloat(getComputedStyle(control).fontSize),
      }))
    ));
    assert.ok(controlMetrics.every(({height}) => height >= 44));
    assert.ok(controlMetrics.filter((_, index) => index > 0).every(({fontSize}) => fontSize >= 16));
    await page.locator('#dataset-name').fill('Familienwortschatz');
    await page.locator('#setup-pin').fill('1234');
    await page.locator('#setup-pin-repeat').fill('1234');
    await page.locator('#setup-profile').fill('Ada');
    await page.locator('#setup-lesson').fill('Unit 1');
    await page.locator('#setup-word-1-german').fill('Hund');
    await page.locator('#setup-word-1-answers').fill('dog');
    await page.locator('#setup-word-2-german').fill('Fahrrad');
    await page.locator('#setup-word-2-answers').fill('bicycle | bike');
    await page.locator('#setup-submit').click();
    await page.locator('#profile-list .profile-card', {hasText: /^Ada/}).waitFor({timeout: 8_000})
      .catch(async (error) => {
        error.message += `\nVisible page:\n${await page.locator('body').innerText()}\nPage errors: ${pageErrors.join(' | ')}`;
        throw error;
      });
    await page.screenshot({path: resolve(resultsDirectory, 'trainer-setup-mobile.png'), fullPage: true});

    const stateAfterSetup = await productState(page);
    assert.equal(stateAfterSetup.ledger.descriptor.name, 'Familienwortschatz');
    assert.equal(stateAfterSetup.pinVerifier === null, false);
    assert.doesNotMatch(JSON.stringify(stateAfterSetup.pinVerifier), /1234/);
    assert.equal(stateAfterSetup.ledger.events.filter((event) => event.type === 'entity.revised').length, 4);

    await page.reload();
    await page.locator('#adult-entry').click();
    await page.locator('#adult-unlock').waitFor();
    await page.locator('#adult-pin').fill('1234');
    await page.locator('#adult-unlock').click();
    await page.locator('#adult-nav').waitFor();

    await page.getByRole('button', {name: 'Lektionen'}).click();
    await page.locator('[data-lesson-name="Unit 1"]').click();
    const lessonForm = page.locator('form').filter({has: page.getByRole('heading', {name: 'Lektion bearbeiten'})});
    const assignment = lessonForm.getByRole('checkbox', {name: 'Ada'});
    await assignment.uncheck();
    await lessonForm.getByRole('button', {name: 'Speichern'}).click();
    await page.getByText('Lektion und Zuordnung wurden gespeichert.', {exact: true}).waitFor();
    assert.equal((await productState(page)).ledger.events.filter(({type}) => type === 'entity.revised').length, 5);
    const refreshedLessonForm = page.locator('form').filter({has: page.getByRole('heading', {name: 'Lektion bearbeiten'})});
    await refreshedLessonForm.getByRole('checkbox', {name: 'Ada'}).check();
    await refreshedLessonForm.getByRole('button', {name: 'Speichern'}).click();
    await page.getByText('Lektion und Zuordnung wurden gespeichert.', {exact: true}).waitFor();

    const editWord = page.locator('[data-word-german="Hund"] details');
    await editWord.locator('summary').click();
    await editWord.locator('input[name="answers"]').fill('hound');
    assert.match(await editWord.locator('[data-revision-preview]').textContent(), /Serie beginnt/);

    await page.locator('#import-text').fill('Pflichtfeld fehlt\t');
    await page.locator('#import-preview').click();
    assert.equal(await page.locator('#import-apply').isDisabled(), true);
    await page.locator('#import-text').fill('Fahrrad\tbicycle | bike\n<img onerror=window.__xss=1>\timage');
    await page.locator('#import-preview').click();
    assert.equal(await page.locator('#import-apply').isDisabled(), true);
    await page.locator('[data-import-row="row-1"] select').selectOption('separate');
    assert.equal(await page.locator('#import-apply').isEnabled(), true);
    await page.locator('#import-apply').click();
    await page.getByText('<img onerror=window.__xss=1>', {exact: true}).waitFor();
    assert.equal(await page.evaluate(() => window.__xss), undefined);

    await page.goto(new URL('../styles.css', harness.baseUrl).href);
    await seedOneCorrectAnswer(page, await productState(page));
    await page.goto(harness.baseUrl);
    await page.locator('#adult-entry').click();
    await page.locator('#adult-pin').fill('1234');
    await page.locator('#adult-unlock').click();
    await page.getByRole('button', {name: 'Lektionen'}).click();
    await page.locator('[data-lesson-name="Unit 1"]').click();
    await page.getByText('<img onerror=window.__xss=1>', {exact: true}).waitFor();
    const hundRow = page.locator('[data-word-german="Hund"]');
    await hundRow.getByRole('button', {name: 'Archivieren'}).click();
    await page.locator('[data-word-german="Hund"]').getByRole('button', {name: 'Reaktivieren'}).click();
    await page.getByRole('button', {name: 'Lernstand'}).click();
    const progressRow = page.locator('[data-progress-word="Hund"]');
    assert.equal(await progressRow.locator('[data-stat="attempts"]').textContent(), '1');
    assert.equal((await productState(page)).ledger.events.some(({id}) => id === 'browser-history-answer'), true);

    await page.setViewportSize({width: 1280, height: 900});
    await page.screenshot({path: resolve(resultsDirectory, 'trainer-adult-desktop.png'), fullPage: true});
    const resumableState = await productState(page);

    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {value: 'hidden', configurable: true});
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.locator('#profile-list').waitFor();
    await page.locator('#adult-entry').click();
    await page.locator('#adult-unlock').waitFor();

    await page.evaluate(() => {
      window.__trainerBfcacheMarker = 1;
      addEventListener('pageshow', (event) => {
        if (event.persisted) sessionStorage.setItem('trainer-bfcache-restored', 'yes');
      });
    });
    await page.goto(new URL('../styles.css', harness.baseUrl).href);
    const second = await context.newPage();
    try {
      await second.goto(harness.baseUrl);
      await second.locator('#profile-list').waitFor();
      await page.goBack({waitUntil: 'commit', timeout: 5_000}).catch((error) => {
        if (error?.name !== 'TimeoutError') throw error;
      });
      await page.waitForFunction(() => sessionStorage.getItem('trainer-bfcache-restored') === 'yes');
      await page.locator('#app-error').filter({hasText: /anderen (Tab|Fenster)|bereits geöffnet/i}).waitFor();
      assert.equal(await page.evaluate(() => window.__trainerBfcacheMarker), undefined);
    } finally {
      await second.close();
    }

    const interrupted = await harness.newDevice();
    try {
      await interrupted.page.goto(new URL('../styles.css', harness.baseUrl).href);
      const unfinished = structuredClone(resumableState);
      unfinished.pinVerifier = null;
      await interrupted.page.evaluate(({key, value}) => localStorage.setItem(key, value), {
        key: 'vokabeltrainer-product-device-id', value: unfinished.deviceId,
      });
      await writeProductState(interrupted.page, unfinished);
      await interrupted.page.goto(harness.baseUrl);
      await interrupted.page.getByRole('heading', {name: 'Einrichtung fortsetzen'}).waitFor();
      await interrupted.page.locator('#setup-pin').fill('6789');
      await interrupted.page.locator('#setup-pin-repeat').fill('6789');
      await interrupted.page.locator('#setup-profile').fill('Wird nicht dupliziert');
      await interrupted.page.locator('#setup-lesson').fill('Wird nicht dupliziert');
      await interrupted.page.locator('#setup-word-1-german').fill('Eins');
      await interrupted.page.locator('#setup-word-1-answers').fill('one');
      await interrupted.page.locator('#setup-word-2-german').fill('Zwei');
      await interrupted.page.locator('#setup-word-2-answers').fill('two');
      await interrupted.page.locator('#setup-submit').click();
      await interrupted.page.locator('#profile-list .profile-card', {hasText: /^Ada/}).waitFor();
      const resumed = await productState(interrupted.page);
      assert.equal(resumed.pinVerifier === null, false);
      assert.equal(resumed.ledger.events.filter((event) => (
        event.type === 'entity.revised' && event.payload.entityType === 'profile'
      )).length, 1);
    } finally {
      await interrupted.context.close();
    }

    assert.deepEqual(pageErrors, []);
    assert.deepEqual(harness.google.unexpected, []);
  } finally {
    await harness.close();
  }
});
