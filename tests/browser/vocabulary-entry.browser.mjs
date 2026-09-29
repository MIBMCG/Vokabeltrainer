import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createTrainerHarness} from './trainer-harness.mjs';

const resultsDirectory = resolve('test-results', 'vocabulary-entry');

async function setup(page, baseUrl) {
  await page.goto(baseUrl);
  await page.locator('#dataset-name').fill('Synthetischer Wortimport');
  await page.locator('#setup-pin').fill('1234');
  await page.locator('#setup-pin-repeat').fill('1234');
  await page.locator('#setup-profile').fill('Ada');
  await page.locator('#setup-lesson').fill('Inselwörter');
  await page.locator('#setup-word-1-german').fill('Hund');
  await page.locator('#setup-word-1-answers').fill('dog');
  await page.locator('#setup-word-2-german').fill('Katze');
  await page.locator('#setup-word-2-answers').fill('cat');
  await page.locator('#setup-submit').click();
  await page.locator('#profile-list').waitFor();
  await page.getByRole('button', {name: /^Ada/}).click();
  await page.getByRole('button', {name: 'Profil wechseln', exact: true}).click();
  await page.locator('#adult-entry').click();
  if (await page.locator('#adult-pin').count()) {
    await page.locator('#adult-pin').fill('1234');
    await page.locator('#adult-unlock').click();
  }
  await page.locator('#adult-nav').waitFor();
}

async function storedState(page) {
  return page.evaluate(() => new Promise((resolveState, reject) => {
    const request = indexedDB.open('vokabeltrainer-product-v1', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const get = database.transaction('product-state').objectStore('product-state').get('current');
      get.onerror = () => reject(get.error);
      get.onsuccess = () => resolveState(get.result);
      get.transaction.oncomplete = () => database.close();
    };
  }));
}

async function holdNextDigest(page) {
  await page.evaluate(() => {
    const original = crypto.subtle.digest.bind(crypto.subtle);
    crypto.subtle.digest = (...args) => {
      crypto.subtle.digest = original;
      window.vocabularyDigestHeld = true;
      return new Promise((resolve, reject) => {
        window.vocabularyReleaseDigest = () => original(...args).then(resolve, reject);
      });
    };
  });
}

test('import starts its bound Google sync before the old ten-second delay and drains the batch', {timeout: 60_000}, async () => {
  const harness = await createTrainerHarness();
  const {page, controls} = await harness.newDevice();
  try {
    await setup(page, harness.baseUrl);
    await page.getByRole('button', {name: 'Einstellungen', exact: true}).click();
    await page.getByRole('button', {name: 'Mit Google verbinden', exact: true}).click();
    await page.getByText('Google-Verbindung ist aktiv.', {exact: true}).waitFor();
    await page.getByRole('button', {name: 'Neuen Lernbereich anlegen', exact: true}).click();
    await page.locator('[data-sync-status]').filter({hasText: 'Abgeglichen'}).waitFor({timeout: 15_000});
    await page.getByRole('button', {name: 'Vokabeln', exact: true}).click();
    await page.getByRole('button', {name: 'Mehrere Wörter einfügen', exact: true}).click();
    await page.locator('#import-text').fill('Boot\tboat\nWelle\twave');
    const before = await storedState(page);
    controls.holdNextFilesRead = true;
    const syncStarted = controls.waitForHeldFilesRead();
    await page.locator('#import-apply').click();
    await page.getByText('2 Wörter wurden auf diesem Gerät gespeichert.', {exact: true}).waitFor();
    const afterSave = await storedState(page);
    const imported = afterSave.ledger.events.slice(before.ledger.events.length)
      .filter(({type, payload}) => type === 'entity.revised' && payload.entityType === 'word');
    assert.equal(imported.length, 2);
    let startTimeout;
    try {
      await Promise.race([
        syncStarted,
        new Promise((_, reject) => {
          startTimeout = setTimeout(() => reject(new Error('Google sync did not start within 5 seconds of import')), 5_000);
        }),
      ]);
    } finally {
      clearTimeout(startTimeout);
    }
    controls.releaseHeldFilesRead();
    let afterSync;
    const deadline = Date.now() + 15_000;
    do {
      afterSync = await storedState(page);
      if (afterSync.outboxEventIds.length === 0 && afterSync.pendingPackets.length === 0) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    } while (Date.now() < deadline);
    assert.deepEqual(afterSync.outboxEventIds, []);
    assert.deepEqual(afterSync.pendingPackets, []);
    for (const {id} of imported) {
      assert.equal([...harness.google.files.values()].flatMap(({value}) => value?.kind === 'packet' ? value.events : [])
        .filter((event) => event.id === id).length, 1);
    }
    assert.deepEqual(harness.google.unexpected, []);
  } finally {
    controls.releaseHeldFilesRead();
    await harness.close();
  }
});

test('pasted table previews compactly without a separate click and saves in one action', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice({viewport: {width: 320, height: 700}});
  try {
    await setup(page, harness.baseUrl);
    await page.getByRole('button', {name: 'Mehrere Wörter einfügen', exact: true}).click();
    const before = await storedState(page);
    const lines = Array.from({length: 100}, (_, index) => `Wort${index + 1}\tword${index + 1}`);
    const textarea = page.locator('#import-text');
    await textarea.fill(lines.join('\n'));
    assert.equal(await textarea.evaluate((node) => document.activeElement === node), true);
    assert.match(await page.locator('#import-summary').textContent(), /100 bereit/);
    assert.equal(await page.locator('[data-import-row]').count(), 100);
    assert.equal(await page.locator('[data-import-row] input:visible').count(), 0);
    assert.equal(await page.locator('#import-apply').isEnabled(), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await mkdir(resultsDirectory, {recursive: true});
    await page.screenshot({path: resolve(resultsDirectory, 'import-320.png'), fullPage: true});
    await page.setViewportSize({width: 390, height: 844});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({path: resolve(resultsDirectory, 'import-390.png'), fullPage: true});
    await page.setViewportSize({width: 1280, height: 900});
    await page.screenshot({path: resolve(resultsDirectory, 'import-desktop.png'), fullPage: true});
    await page.locator('section.vocabulary-editor').screenshot({path: resolve(resultsDirectory, 'import-panel.png')});
    await page.locator('#import-apply').evaluate((node) => { node.click(); node.click(); });
    await page.getByText('100 Wörter wurden auf diesem Gerät gespeichert.', {exact: true}).waitFor();
    const after = await storedState(page);
    assert.equal(after.ledger.events.length, before.ledger.events.length + 100);
    assert.equal(await page.getByLabel('Lektion auswählen').inputValue(), await page.getByLabel('Lektion auswählen').locator('option', {hasText: 'Inselwörter'}).getAttribute('value'));
  } finally {
    await harness.close();
  }
});

test('save and next keeps the lesson, clears word fields and focuses German input', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice({viewport: {width: 390, height: 844}});
  try {
    await setup(page, harness.baseUrl);
    await page.getByRole('button', {name: 'Wort hinzufügen', exact: true}).click();
    await page.getByLabel('Deutsches Wort').fill('Boot');
    await page.getByLabel(/Englische Lösungen/).fill('boat');
    await page.getByRole('button', {name: 'Speichern und nächstes Wort', exact: true}).click();
    const german = page.getByLabel('Deutsches Wort');
    await german.waitFor();
    assert.equal(await german.inputValue(), '');
    assert.equal(await german.evaluate((node) => document.activeElement === node), true);
    assert.match(await page.locator('[data-lesson-assignment]').textContent(), /Ada/);
    await german.fill('Berg');
    await page.getByLabel(/Englische Lösungen/).fill('mountain');
    await page.getByRole('button', {name: 'Speichern und nächstes Wort', exact: true}).click();
    await page.waitForFunction(() => document.querySelector('form.vocabulary-editor input[name="german"]')?.value === '');
    assert.equal(await german.inputValue(), '');
    const state = await storedState(page);
    const words = state.ledger.events.filter(({type, payload}) => type === 'entity.revised'
      && payload.entityType === 'word');
    assert.equal(words.filter(({payload}) => ['Boot', 'Berg'].includes(payload.value.german)).length, 2);
    assert.equal(words.find(({payload}) => payload.value.german === 'Boot').payload.value.lessonId,
      words.find(({payload}) => payload.value.german === 'Berg').payload.value.lessonId);
  } finally {
    await harness.close();
  }
});

test('explicit exact-duplicate skip leaves different meanings for review and source changes revalidate', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice();
  try {
    await setup(page, harness.baseUrl);
    await page.getByRole('button', {name: 'Mehrere Wörter einfügen', exact: true}).click();
    const text = page.locator('#import-text');
    await text.fill('Hund\tdog\nHund\thound\nMeer\tsea');
    assert.match(await page.locator('#import-summary').textContent(), /2 zu prüfen/);
    assert.equal(await page.locator('#import-apply').isDisabled(), true);
    await page.locator('#import-skip-identical').click();
    assert.match(await page.locator('#import-summary').textContent(), /1 übersprungen/);
    assert.match(await page.locator('#import-summary').textContent(), /1 zu prüfen/);
    assert.equal(await page.locator('[data-import-row="row-2"]').getAttribute('open') !== null, true);
    await page.locator('[data-import-row="row-2"] select').selectOption('separate');
    assert.match(await page.locator('#import-summary').textContent(), /2 bereit/);
    assert.equal(await page.locator('#import-apply').isEnabled(), true);
    await text.fill('Hund\tdog\nBank\tbench');
    assert.match(await page.locator('#import-summary').textContent(), /0 übersprungen/);
    assert.equal(await page.locator('#import-apply').isDisabled(), true);
    assert.equal(await text.evaluate((node) => document.activeElement === node), true);
    await page.locator('#import-skip-identical').click();
    assert.equal(await page.locator('#import-apply').isEnabled(), true);
    await page.locator('#import-apply').click();
    await page.getByText('1 Wort wurde auf diesem Gerät gespeichert.', {exact: true}).waitFor();
    const state = await storedState(page);
    const imported = state.ledger.events.filter(({type, payload}) => type === 'entity.revised'
      && payload.entityType === 'word' && payload.value.german === 'Bank');
    assert.equal(imported.length, 1);
  } finally {
    await harness.close();
  }
});

test('failed new-lesson batch save keeps the draft and retry creates one lesson with all words', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice({viewport: {width: 390, height: 844}});
  try {
    await setup(page, harness.baseUrl);
    await page.getByRole('button', {name: 'Mehrere Wörter einfügen', exact: true}).click();
    await page.getByLabel('Lektion', {exact: true}).selectOption('__new__');
    await page.getByLabel('Neue Lektion', {exact: true}).fill('Meer');
    await page.locator('#import-text').fill('Boot\tboat\nWelle\twave');
    assert.match(await page.locator('#import-summary').textContent(), /2 bereit/);
    const before = await storedState(page);
    await page.evaluate(() => {
      const original = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function failOnce(...args) {
        IDBObjectStore.prototype.put = original;
        throw new Error('synthetic storage failure');
      };
    });
    await page.locator('#import-apply').click();
    await page.getByText('Die lokalen Produktdaten konnten nicht gespeichert werden.', {exact: true}).waitFor();
    assert.deepEqual(await storedState(page), before);
    assert.equal(await page.getByLabel('Neue Lektion', {exact: true}).inputValue(), 'Meer');
    assert.equal(await page.locator('#import-text').inputValue(), 'Boot\tboat\nWelle\twave');
    assert.equal(await page.getByRole('checkbox', {name: 'Ada', exact: true}).isChecked(), true);
    assert.equal(await page.locator('#import-apply').isEnabled(), true);
    await page.locator('#import-apply').click();
    await page.getByText('2 Wörter wurden auf diesem Gerät gespeichert.', {exact: true}).waitFor();
    const after = await storedState(page);
    const added = after.ledger.events.slice(before.ledger.events.length)
      .filter(({type}) => type === 'entity.revised');
    assert.deepEqual(added.map(({payload}) => payload.entityType), ['lesson', 'word', 'word']);
    assert.equal(added[0].payload.value.name, 'Meer');
    assert.deepEqual(added[0].payload.value.profileIds.length, 1);
    assert.ok(added.slice(1).every(({payload}) => payload.value.lessonId === added[0].payload.entityId));
  } finally {
    await harness.close();
  }
});

test('an import draft survives a background notice and protected navigation', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice();
  try {
    await setup(page, harness.baseUrl);
    await page.getByRole('button', {name: 'Mehrere Wörter einfügen', exact: true}).click();
    await page.locator('#import-text').fill('Welle\twave\nBoot\tboat');
    const original = await storedState(page);
    await page.evaluate((state) => {
      const changed = structuredClone(state);
      changed.ledger.descriptor.name += ' Hintergrund';
      return import('/src/trainer/ui/adult.js').then(({adultStateChanged}) => {
        adultStateChanged(document.querySelector('#app'), changed);
      });
    }, original);
    await page.locator('#adult-background-notice').waitFor();
    assert.equal(await page.locator('#import-text').inputValue(), 'Welle\twave\nBoot\tboat');
    assert.match(await page.locator('#import-summary').textContent(), /2 bereit/);
    await page.getByRole('button', {name: 'Lernregeln', exact: true}).click();
    await page.getByRole('dialog', {name: 'Ungespeicherte Eingaben'}).waitFor();
    await page.getByRole('button', {name: 'Weiterbearbeiten', exact: true}).click();
    assert.equal(await page.locator('#import-text').inputValue(), 'Welle\twave\nBoot\tboat');
    assert.deepEqual(await storedState(page), original);
  } finally {
    await harness.close();
  }
});

test('pending import save blocks navigation until its original draft finishes', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice();
  try {
    await setup(page, harness.baseUrl);
    await page.getByRole('button', {name: 'Mehrere Wörter einfügen', exact: true}).click();
    await page.locator('#import-text').fill('Boot\tboat\nWelle\twave');
    await holdNextDigest(page);
    await page.locator('#import-apply').click();
    await page.waitForFunction(() => window.vocabularyDigestHeld === true);
    await page.getByRole('button', {name: 'Lernregeln', exact: true}).click();
    assert.equal(await page.locator('#adult-unsaved-dialog').count(), 0);
    assert.equal(await page.locator('#import-text').inputValue(), 'Boot\tboat\nWelle\twave');
    assert.equal(await page.locator('#import-text').isDisabled(), true);
    await page.evaluate((state) => {
      const changed = structuredClone(state);
      changed.ledger.descriptor.name += ' Hintergrund';
      return import('/src/trainer/ui/adult.js').then(({adultStateChanged}) => {
        adultStateChanged(document.querySelector('#app'), changed);
      });
    }, await storedState(page));
    await page.getByRole('button', {name: 'Ansicht neu laden (Eingaben verwerfen)', exact: true}).click();
    assert.equal(await page.locator('#import-text').count(), 1);
    await page.getByRole('button', {name: 'Lektion bearbeiten', exact: true}).click();
    assert.equal(await page.locator('#import-text').count(), 1);
    await page.evaluate(() => window.vocabularyReleaseDigest());
    await page.getByText('2 Wörter wurden auf diesem Gerät gespeichert.', {exact: true}).waitFor();
    const state = await storedState(page);
    assert.equal(state.ledger.events.filter(({type, payload}) => type === 'entity.revised'
      && payload.entityType === 'word' && ['Boot', 'Welle'].includes(payload.value.german)).length, 2);
  } finally {
    await harness.close();
  }
});

test('pending single-word save blocks navigation until its original draft finishes', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice();
  try {
    await setup(page, harness.baseUrl);
    await page.getByRole('button', {name: 'Wort hinzufügen', exact: true}).click();
    await page.getByLabel('Deutsches Wort').fill('Boot');
    await page.getByLabel(/Englische Lösungen/).fill('boat');
    await holdNextDigest(page);
    await page.getByRole('button', {name: 'Vokabel hinzufügen', exact: true}).click();
    await page.waitForFunction(() => window.vocabularyDigestHeld === true);
    await page.getByRole('button', {name: 'Lernregeln', exact: true}).click();
    assert.equal(await page.locator('#adult-unsaved-dialog').count(), 0);
    assert.equal(await page.getByLabel('Deutsches Wort').inputValue(), 'Boot');
    assert.equal(await page.getByLabel('Deutsches Wort').isDisabled(), true);
    await page.evaluate(() => window.vocabularyReleaseDigest());
    await page.getByText('Die Vokabel wurde hinzugefügt.', {exact: true}).waitFor();
    const state = await storedState(page);
    assert.equal(state.ledger.events.filter(({type, payload}) => type === 'entity.revised'
      && payload.entityType === 'word' && payload.value.german === 'Boot').length, 1);
  } finally {
    await harness.close();
  }
});

test('failed pending import save keeps the draft and restores navigation after the failure', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice();
  try {
    await setup(page, harness.baseUrl);
    await page.getByRole('button', {name: 'Mehrere Wörter einfügen', exact: true}).click();
    await page.locator('#import-text').fill('Boot\tboat\nWelle\twave');
    const before = await storedState(page);
    await page.evaluate(() => {
      const original = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function failOnce(...args) {
        IDBObjectStore.prototype.put = original;
        throw new Error('synthetic storage failure');
      };
    });
    await holdNextDigest(page);
    await page.locator('#import-apply').click();
    await page.waitForFunction(() => window.vocabularyDigestHeld === true);
    await page.getByRole('button', {name: 'Lernregeln', exact: true}).click();
    assert.equal(await page.locator('#adult-unsaved-dialog').count(), 0);
    await page.evaluate(() => window.vocabularyReleaseDigest());
    await page.getByText('Die lokalen Produktdaten konnten nicht gespeichert werden.', {exact: true}).waitFor();
    assert.equal(await page.locator('#import-text').inputValue(), 'Boot\tboat\nWelle\twave');
    assert.equal(await page.locator('#import-apply').isEnabled(), true);
    assert.deepEqual(await storedState(page), before);
    await page.getByRole('button', {name: 'Lernregeln', exact: true}).click();
    await page.getByRole('dialog', {name: 'Ungespeicherte Eingaben'}).waitFor();
    await page.getByRole('button', {name: 'Weiterbearbeiten', exact: true}).click();
    assert.equal(await page.locator('#import-text').inputValue(), 'Boot\tboat\nWelle\twave');
  } finally {
    await harness.close();
  }
});

test('failed pending single-word save keeps the draft and restores navigation after the failure', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice();
  try {
    await setup(page, harness.baseUrl);
    await page.getByRole('button', {name: 'Wort hinzufügen', exact: true}).click();
    await page.getByLabel('Deutsches Wort').fill('Boot');
    await page.getByLabel(/Englische Lösungen/).fill('boat');
    const before = await storedState(page);
    await page.evaluate(() => {
      const original = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function failOnce(...args) {
        IDBObjectStore.prototype.put = original;
        throw new Error('synthetic storage failure');
      };
    });
    await holdNextDigest(page);
    await page.getByRole('button', {name: 'Vokabel hinzufügen', exact: true}).click();
    await page.waitForFunction(() => window.vocabularyDigestHeld === true);
    await page.getByRole('button', {name: 'Lernregeln', exact: true}).click();
    assert.equal(await page.locator('#adult-unsaved-dialog').count(), 0);
    await page.evaluate(() => window.vocabularyReleaseDigest());
    await page.getByText('Die lokalen Produktdaten konnten nicht gespeichert werden.', {exact: true}).waitFor();
    assert.equal(await page.getByLabel('Deutsches Wort').inputValue(), 'Boot');
    assert.equal(await page.getByLabel(/Englische Lösungen/).inputValue(), 'boat');
    assert.deepEqual(await storedState(page), before);
    await page.getByRole('button', {name: 'Lernregeln', exact: true}).click();
    await page.getByRole('dialog', {name: 'Ungespeicherte Eingaben'}).waitFor();
    await page.getByRole('button', {name: 'Weiterbearbeiten', exact: true}).click();
    assert.equal(await page.getByLabel('Deutsches Wort').inputValue(), 'Boot');
  } finally {
    await harness.close();
  }
});

test('a pending import save from the unsaved dialog cannot be discarded before completion', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice();
  try {
    await setup(page, harness.baseUrl);
    await page.getByRole('button', {name: 'Mehrere Wörter einfügen', exact: true}).click();
    await page.locator('#import-text').fill('Boot\tboat\nWelle\twave');
    await page.getByRole('button', {name: 'Lernregeln', exact: true}).click();
    const dialog = page.getByRole('dialog', {name: 'Ungespeicherte Eingaben'});
    await dialog.waitFor();
    await holdNextDigest(page);
    await dialog.getByRole('button', {name: 'Speichern', exact: true}).click();
    await page.waitForFunction(() => window.vocabularyDigestHeld === true);
    assert.equal(await dialog.getByRole('button', {name: 'Verwerfen', exact: true}).isDisabled(), true);
    assert.equal(await dialog.getByRole('button', {name: 'Weiterbearbeiten', exact: true}).isDisabled(), true);
    await page.evaluate(() => window.vocabularyReleaseDigest());
    await page.getByRole('heading', {name: 'Lernregeln', exact: true}).waitFor();
    const state = await storedState(page);
    assert.equal(state.ledger.events.filter(({type, payload}) => type === 'entity.revised'
      && payload.entityType === 'word' && ['Boot', 'Welle'].includes(payload.value.german)).length, 2);
  } finally {
    await harness.close();
  }
});

test('a pending single-word save from the unsaved dialog cannot be discarded before completion', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice();
  try {
    await setup(page, harness.baseUrl);
    await page.getByRole('button', {name: 'Wort hinzufügen', exact: true}).click();
    await page.getByLabel('Deutsches Wort').fill('Boot');
    await page.getByLabel(/Englische Lösungen/).fill('boat');
    await page.getByRole('button', {name: 'Lernregeln', exact: true}).click();
    const dialog = page.getByRole('dialog', {name: 'Ungespeicherte Eingaben'});
    await dialog.waitFor();
    await holdNextDigest(page);
    await dialog.getByRole('button', {name: 'Speichern', exact: true}).click();
    await page.waitForFunction(() => window.vocabularyDigestHeld === true);
    assert.equal(await dialog.getByRole('button', {name: 'Verwerfen', exact: true}).isDisabled(), true);
    assert.equal(await dialog.getByRole('button', {name: 'Weiterbearbeiten', exact: true}).isDisabled(), true);
    await page.evaluate(() => window.vocabularyReleaseDigest());
    await page.getByRole('heading', {name: 'Lernregeln', exact: true}).waitFor();
    const state = await storedState(page);
    assert.equal(state.ledger.events.filter(({type, payload}) => type === 'entity.revised'
      && payload.entityType === 'word' && payload.value.german === 'Boot').length, 1);
  } finally {
    await harness.close();
  }
});

test('lesson edit and archive ask before replacing an unsaved import', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice();
  try {
    await setup(page, harness.baseUrl);
    await page.getByRole('button', {name: 'Mehrere Wörter einfügen', exact: true}).click();
    await page.locator('#import-text').fill('Boot\tboat\nWelle\twave');
    const before = await storedState(page);
    await page.getByRole('button', {name: 'Lektion bearbeiten', exact: true}).click();
    const dialog = page.getByRole('dialog', {name: 'Ungespeicherte Eingaben'});
    await dialog.waitFor();
    assert.deepEqual(await storedState(page), before);
    await dialog.getByRole('button', {name: 'Weiterbearbeiten', exact: true}).click();
    assert.equal(await page.locator('#import-text').inputValue(), 'Boot\tboat\nWelle\twave');
    await page.getByRole('button', {name: 'Lektion archivieren', exact: true}).click();
    await dialog.waitFor();
    assert.deepEqual(await storedState(page), before);
    await dialog.getByRole('button', {name: 'Weiterbearbeiten', exact: true}).click();
    assert.equal(await page.locator('#import-text').inputValue(), 'Boot\tboat\nWelle\twave');
    await page.getByRole('button', {name: 'Lektion archivieren', exact: true}).click();
    await dialog.waitFor();
    await dialog.getByRole('button', {name: 'Verwerfen', exact: true}).click();
    await page.getByText('Die Lektion wurde archiviert.', {exact: true}).waitFor();
    assert.equal(await page.locator('#import-text').count(), 0);
  } finally {
    await harness.close();
  }
});
