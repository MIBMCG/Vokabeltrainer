import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';

import {createTrainerHarness} from './trainer-harness.mjs';

const resultsDirectory = resolve('test-results', 'overhaul-a1');
const a2ResultsDirectory = resolve('test-results', 'overhaul-a2');
const a4ResultsDirectory = resolve('test-results', 'overhaul-a4');
const preparedGoogleClientId = '329410329467-s8nevn4sqi7m3fmtq2tkbpj76b8osvhs.apps.googleusercontent.com';

async function productState(page) {
  return page.evaluate(() => new Promise((resolveState, reject) => {
    const request = indexedDB.open('vokabeltrainer-product-v1', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const get = database.transaction('product-state').objectStore('product-state').get('current');
      get.onerror = () => reject(get.error);
      get.onsuccess = () => resolveState(get.result ?? null);
      get.transaction.oncomplete = () => database.close();
    };
  }));
}

async function visibleControlsFit(page, selector, {scroll = false} = {}) {
  if (scroll) {
    await page.locator(selector).evaluate((node) => node.scrollIntoView({block: 'center'}));
  }
  return page.locator(selector).evaluate((node) => {
    const box = node.getBoundingClientRect();
    const nav = document.querySelector('.bottom-nav')?.getBoundingClientRect();
    const visibleBottom = nav?.top ?? innerHeight;
    return {
      fits: box.top >= 0 && box.bottom <= visibleBottom && box.left >= 0 && box.right <= innerWidth,
      box: {top: box.top, right: box.right, bottom: box.bottom, left: box.left},
      visibleBottom,
      viewport: {width: innerWidth, height: innerHeight},
      headerDirection: getComputedStyle(document.querySelector('.practice-header')).flexDirection,
    };
  });
}

async function setupPractice(page) {
  await page.locator('#dataset-name').fill('Synthetische Bilderprobe');
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
  await page.getByRole('heading', {name: 'Hallo, Ada!'}).waitFor();
}

async function openSync(page) {
  const profileSwitch = page.getByRole('button', {name: 'Profil wechseln', exact: true});
  if (await profileSwitch.count()) await profileSwitch.click();
  await page.locator('#adult-entry').click();
  if (await page.locator('#adult-pin').count()) {
    await page.locator('#adult-pin').fill('1234');
    await page.locator('#adult-unlock').click();
  }
  await page.getByRole('button', {name: 'Einstellungen', exact: true}).click();
}

async function openAdult(page) {
  const profileSwitch = page.getByRole('button', {name: 'Profil wechseln', exact: true});
  if (await profileSwitch.count()) await profileSwitch.click();
  await page.locator('#adult-entry').click();
  if (await page.locator('#adult-pin').count()) {
    await page.locator('#adult-pin').fill('1234');
    await page.locator('#adult-unlock').click();
  }
  await page.locator('#adult-nav').waitFor();
}

async function loadedArt(page, selector = '[data-art-key] img') {
  await page.waitForFunction((query) => [...document.querySelectorAll(query)]
    .length > 0 && [...document.querySelectorAll(query)]
    .every((image) => image.complete && image.naturalWidth > 0), selector);
  return page.locator(selector).count();
}

async function settleLayout(page) {
  await page.evaluate(() => new Promise((resolveFrame) => requestAnimationFrame(
    () => requestAnimationFrame(resolveFrame),
  )));
  await page.waitForFunction(() => [...document.querySelectorAll('.bottom-nav button')]
    .every((node) => node.getBoundingClientRect().height > 0 && node.textContent.trim().length > 0));
}

test('illustrated journey and layered avatar render responsively with real raster art', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice({viewport: {width: 390, height: 844}});
  await mkdir(resultsDirectory, {recursive: true});
  try {
    await page.goto(harness.baseUrl);
    await setupPractice(page);
    assert.ok(await loadedArt(page) >= 3);
    assert.equal(await page.locator('.practice-home .level-card').count(), 1);
    assert.equal(await page.locator('.practice-home .level-card .level-avatar').count(), 1);
    assert.equal(await page.locator('.practice-art .practice-avatar').count(), 0);
    await page.screenshot({path: resolve(resultsDirectory, 'start-390.png'), fullPage: true});

    await page.getByRole('button', {name: 'Inselreise', exact: true}).click();
    assert.equal(await page.locator('[data-art-key="island-journey"] img').evaluate((image) => image.naturalWidth > 0), true);
    assert.equal(await page.locator('[data-stage]').count(), 15);
    assert.equal(await page.locator('[data-island]').count(), 3);
    assert.equal(await page.locator('.journey-map').evaluate((map) => {
      const boundary = map.getBoundingClientRect();
      return [...map.querySelectorAll('[data-stage]')].every((stage) => {
        const box = stage.getBoundingClientRect();
        return box.left >= boundary.left && box.right <= boundary.right
          && box.left >= 0 && box.right <= innerWidth;
      });
    }), true);
    assert.equal(await page.locator('[data-island="mountain"]').evaluate((card) => {
      const cardBox = card.getBoundingClientRect();
      return ['14', '15'].every((stage) => {
        const markerBox = document.querySelector(`[data-stage="${stage}"] .stage-marker`).getBoundingClientRect();
        return cardBox.right <= markerBox.left || cardBox.left >= markerBox.right
          || cardBox.bottom <= markerBox.top || cardBox.top >= markerBox.bottom;
      });
    }), true);
    const levelTrack = await page.locator('.level-card .level-progress-track').evaluate((track) => ({
      background: getComputedStyle(track).backgroundColor,
      fill: getComputedStyle(track.querySelector('.level-progress-fill')).backgroundImage,
    }));
    assert.notEqual(levelTrack.background, 'rgb(0, 0, 0)');
    assert.match(levelTrack.fill, /gradient/i);
    assert.equal(await page.getByText('🔒 Gesperrt: Zahl = benötigtes Level', {exact: true}).isVisible(), true);
    const lockedStages = await page.locator('[data-stage][data-state="upcoming"]').evaluateAll((nodes) => nodes.map((node) => ({
      stage: Number(node.dataset.stage),
      unlockLevel: Number(node.dataset.unlockLevel),
      label: node.textContent,
    })));
    assert.equal(lockedStages.length, 14);
    assert.equal(lockedStages.every(({stage, unlockLevel, label}) => (
      unlockLevel === stage && label.includes(`Etappe ${stage}: gesperrt – ab Level ${stage}`)
    )), true, JSON.stringify(lockedStages));
    await page.screenshot({path: resolve(resultsDirectory, 'journey-390.png'), fullPage: true});
    await page.setViewportSize({width: 1024, height: 768});
    await page.waitForFunction(() => {
      const image = document.querySelector('[data-art-key="island-journey"] img');
      return image?.complete && image.naturalWidth > 0 && /-(?:960|1086)\.webp$/u.test(image.currentSrc);
    });
    await settleLayout(page);
    await page.screenshot({path: resolve(resultsDirectory, 'journey-1024.png'), fullPage: true});

    await page.getByRole('button', {name: 'Mein Avatar', exact: true}).click();
    await page.getByRole('radio', {name: 'Hautfarbe 4', exact: true}).check();
    await page.waitForFunction(() => document.activeElement?.matches('input[name="skin"][value="3"]:checked'));
    await page.getByRole('radio', {name: 'Kleidung Koralle', exact: true}).check();
    await page.waitForFunction(() => document.activeElement?.matches('input[name="clothing"][value="5"]:checked'));
    await page.waitForTimeout(500);
    await page.screenshot({path: resolve(resultsDirectory, 'avatar-clean-1024.png'), fullPage: true});
    await page.setViewportSize({width: 390, height: 844});
    await page.screenshot({path: resolve(resultsDirectory, 'avatar-clean-390.png'), fullPage: true});
    await page.setViewportSize({width: 1024, height: 768});
    await page.evaluate(async () => {
      const {avatarPicture} = await import('/src/trainer/ui/art.js');
      const combinations = [
        {skin: 0, clothing: 5, head: 'cap', back: 'backpack', hand: 'compass'},
        {skin: 1, clothing: 4, head: 'sunhat', back: 'backpack', hand: 'binoculars'},
        {skin: 2, clothing: 3, head: 'mountainhat', back: 'backpack', hand: 'compass'},
        {skin: 3, clothing: 2, head: 'cap', back: 'backpack', hand: 'binoculars'},
        {skin: 0, clothing: 1, head: 'sunhat', back: 'backpack', hand: 'compass'},
        {skin: 3, clothing: 0, head: 'mountainhat', back: 'backpack', hand: 'binoculars'},
      ];
      const diagnostic = document.createElement('section');
      diagnostic.className = 'qa-six-combinations';
      diagnostic.setAttribute('aria-label', 'Diagnose mit sechs Avatar-Kombinationen');
      Object.assign(diagnostic.style, {
        display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: '8px',
        padding: '12px', background: '#f7f4e8', border: '2px solid #184f55',
      });
      combinations.forEach((parts, index) => {
        const composite = avatarPicture(parts, {className: 'qa-all-slots', sizes: '160px'});
        composite.setAttribute('aria-label', `Prüfkombination ${index + 1} mit allen Ausrüstungsslots`);
        diagnostic.append(composite);
      });
      document.querySelector('main').append(diagnostic);
    });
    assert.equal(await page.locator('.qa-all-slots').count(), 6);
    assert.equal(await loadedArt(page, '.qa-all-slots [data-art-key] img'), 30);
    await page.screenshot({path: resolve(resultsDirectory, 'avatar-all-slots-diagnostic-1024.png'), fullPage: true});
  } finally {
    await harness.close();
  }
});

test('explained mode selection starts once and keeps the learning controls usable', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice({viewport: {width: 390, height: 844}});
  await mkdir(a2ResultsDirectory, {recursive: true});
  try {
    await page.goto(harness.baseUrl);
    await setupPractice(page);
    const before = await productState(page);
    const beforeStarts = before.ledger.events.filter(({type}) => type === 'round.started').length;

    await page.getByRole('radio', {name: /Letzte Vokabeln/}).check();
    await page.getByRole('radio', {name: /20 Antworten/}).check();
    assert.equal((await productState(page)).ledger.events.filter(({type}) => type === 'round.started').length, beforeStarts);
    await page.getByText(/Inselwörter/).waitFor();
    await page.getByText(/20 Antworten.*verschiedene Wörter|verschiedene Wörter.*20 Antworten/).waitFor();
    await page.getByRole('button', {name: 'Inselreise', exact: true}).click();
    await page.getByRole('button', {name: 'Üben', exact: true}).click();
    assert.equal(await page.getByRole('radio', {name: /Letzte Vokabeln/}).isChecked(), true);
    assert.equal(await page.getByRole('radio', {name: /20 Antworten/}).isChecked(), true);
    assert.equal((await productState(page)).ledger.events.filter(({type}) => type === 'round.started').length, beforeStarts);
    await page.screenshot({path: resolve(a2ResultsDirectory, 'round-start-390.png'), fullPage: true});

    await page.evaluate(() => {
      const original = IDBObjectStore.prototype.put;
      let failNext = true;
      IDBObjectStore.prototype.put = function put(...args) {
        if (failNext) {
          failNext = false;
          throw new DOMException('synthetic full storage', 'QuotaExceededError');
        }
        return original.apply(this, args);
      };
    });
    const startButton = page.getByRole('button', {name: 'Runde starten', exact: true});
    await startButton.click();
    await page.getByText('Die lokalen Produktdaten konnten nicht gespeichert werden.', {exact: true}).waitFor();
    assert.equal(await startButton.isEnabled(), true);
    assert.equal(await page.getByRole('radio', {name: /Letzte Vokabeln/}).isChecked(), true);
    assert.equal(await page.getByRole('radio', {name: /20 Antworten/}).isChecked(), true);
    assert.equal((await productState(page)).ledger.events.filter(({type}) => type === 'round.started').length, beforeStarts);

    await page.locator('.practice-start-form').evaluate((form) => {
      form.dispatchEvent(new SubmitEvent('submit', {bubbles: true, cancelable: true}));
      form.dispatchEvent(new SubmitEvent('submit', {bubbles: true, cancelable: true}));
    });
    await page.getByLabel('Englische Übersetzung').waitFor();
    const started = await productState(page);
    assert.equal(started.ledger.events.filter(({type}) => type === 'round.started').length, beforeStarts + 1);
    assert.equal(started.rounds[Object.keys(started.rounds)[0]].mode, 'latest');
    assert.equal(started.rounds[Object.keys(started.rounds)[0]].size, 20);

    for (const [name, width, height] of [
      ['asking-320x568.png', 320, 568],
      ['asking-844x390.png', 844, 390],
      ['asking-1024x768.png', 1024, 768],
    ]) {
      await page.setViewportSize({width, height});
      await settleLayout(page);
      const inputFit = await visibleControlsFit(page, '#answer');
      const submitFit = await visibleControlsFit(page, '#practice-submit');
      assert.equal(inputFit.fits, true, `${name}: answer input must fit ${JSON.stringify(inputFit)}`);
      assert.equal(submitFit.fits, true, `${name}: submit must fit ${JSON.stringify(submitFit)}`);
      await page.screenshot({path: resolve(a2ResultsDirectory, name)});
    }
    await page.setViewportSize({width: 390, height: 844});
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    await visibleControlsFit(page, '#practice-submit', {scroll: true});
    const largeInputFit = await visibleControlsFit(page, '#answer');
    const largeSubmitFit = await visibleControlsFit(page, '#practice-submit');
    assert.equal(largeInputFit.fits, true, `200% font: answer input must fit ${JSON.stringify(largeInputFit)}`);
    assert.equal(largeSubmitFit.fits, true, `200% font: submit must fit ${JSON.stringify(largeSubmitFit)}`);
    await page.screenshot({path: resolve(a2ResultsDirectory, 'asking-390-font-200.png')});
    await page.evaluate(() => { document.documentElement.style.fontSize = ''; });

    const beforeAnswer = await productState(page);
    const activeRound = beforeAnswer.rounds[Object.keys(beforeAnswer.rounds)[0]];
    const solution = beforeAnswer.ledger.events
      .find(({id}) => id === activeRound.current.revisionId).payload.value.answers[0];
    await page.getByLabel('Englische Übersetzung').fill(solution);
    await page.getByLabel('Englische Übersetzung').evaluate((input) => {
      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}));
      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}));
    });
    await page.getByText('Richtig!', {exact: true}).waitFor();
    assert.equal((await productState(page)).ledger.events.filter(({type}) => type === 'answer.recorded').length, 1);
    assert.equal((await visibleControlsFit(page, '#practice-next')).fits, true, 'feedback next button must fit');
    await page.screenshot({path: resolve(a2ResultsDirectory, 'feedback-390.png')});

    const reasonTexts = await page.evaluate(async (state) => {
      const {renderPracticeLanding} = await import('/src/trainer/ui/practice.js');
      const profileId = Object.keys(state.rounds)[0];
      const scenarios = [
        ['no-new', [
          {mode: 'all', totalCount: 2, availableCount: 2, latestLessonName: null, reason: 'ready'},
          {mode: 'latest', totalCount: 2, availableCount: 2, latestLessonName: 'Inselwörter', reason: 'ready'},
          {mode: 'new', totalCount: 0, availableCount: 0, latestLessonName: null, reason: 'no-new'},
        ]],
        ['empty', [
          {mode: 'all', totalCount: 0, availableCount: 0, latestLessonName: null, reason: 'no-words'},
          {mode: 'latest', totalCount: 0, availableCount: 0, latestLessonName: null, reason: 'no-words'},
          {mode: 'new', totalCount: 0, availableCount: 0, latestLessonName: null, reason: 'no-new'},
        ]],
        ['conflict', ['all', 'latest', 'new'].map((mode) => ({
          mode, totalCount: 2, availableCount: 0,
          latestLessonName: mode === 'latest' ? 'Inselwörter' : null, reason: 'conflict',
        }))],
      ];
      const results = [];
      for (const [name, choices] of scenarios) {
        const host = document.createElement('div');
        document.body.append(host);
        renderPracticeLanding({
          root: host,
          state: {...state, rounds: {}},
          commands: {practiceChoices: () => choices},
          profileId,
          onNavigate() {},
        });
        results.push([name, host.innerText]);
        host.remove();
      }
      return results;
    }, started);
    const reasons = Object.fromEntries(reasonTexts);
    assert.match(reasons['no-new'], /schon mindestens einmal beantwortet/i);
    assert.match(reasons.empty, /keine aktiven Vokabeln/i);
    assert.match(reasons.conflict, /Datenkonflikt/i);
  } finally {
    await harness.close();
  }
});

test('prepared Google access connects without family configuration and waits for a deliberate dataset action', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page, controls} = await harness.newDevice();
  try {
    await page.goto(harness.baseUrl);
    await setupPractice(page);
    await openSync(page);

    assert.equal(await page.getByLabel('Öffentliche Google-Web-Client-ID').isVisible(), false);
    controls.cancelNextOauth = true;
    await page.getByRole('button', {name: 'Mit Google verbinden', exact: true}).click();
    await page.getByText('Google-Anmeldefenster wurde nicht geöffnet oder geschlossen.', {exact: true}).waitFor();
    assert.equal((await productState(page)).binding, null);
    assert.equal(harness.google.writes.length, 0);

    await page.getByRole('button', {name: 'Mit Google verbinden', exact: true}).click();
    await page.getByText('Google ist für diese Sitzung verbunden.', {exact: true}).waitFor();
    assert.deepEqual(controls.oauthClientIds, [preparedGoogleClientId, preparedGoogleClientId]);
    assert.equal((await productState(page)).binding, null);
    assert.equal(harness.google.writes.length, 0);
    await page.getByRole('button', {name: 'Neuen Lernbereich anlegen', exact: true}).waitFor();
    await page.getByRole('button', {name: 'Vorhandenen Lernbereich verwenden', exact: true}).waitFor();
  } finally {
    await harness.close();
  }
});

test('compact vocabulary management opens editors deliberately and preserves their revision context', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice({viewport: {width: 390, height: 844}});
  await mkdir(a4ResultsDirectory, {recursive: true});
  try {
    await page.goto(harness.baseUrl);
    await setupPractice(page);
    await openAdult(page);

    assert.deepEqual(await page.locator('#adult-nav button').allTextContents(), [
      'Vokabeln', 'Lernstand', 'Lernregeln', 'Einstellungen',
    ]);
    assert.equal(await page.locator('#adult-nav button').evaluateAll((buttons) => (
      buttons.every((item) => item.getBoundingClientRect().right <= innerWidth)
    )), true);
    assert.equal(await page.locator('[data-word-german] form').count(), 0);
    assert.equal(await page.getByRole('button', {name: 'Wort hinzufügen', exact: true}).count(), 1);
    assert.equal(await page.getByRole('button', {name: 'Mehrere Wörter einfügen', exact: true}).count(), 1);

    await page.getByLabel('Vokabeln suchen').fill('Hund');
    assert.equal(await page.locator('[data-word-german="Hund"]').count(), 1);
    assert.equal(await page.locator('[data-word-german="Fahrrad"]').count(), 0);
    await page.getByLabel('Vokabeln suchen').fill('');

    await page.locator('[data-word-german="Hund"]').getByRole('button', {name: 'Bearbeiten', exact: true}).click();
    const editor = page.locator('form').filter({has: page.getByRole('heading', {name: 'Hund bearbeiten', exact: true})});
    await editor.getByRole('textbox', {name: /Englische Lösungen/}).fill('hound | dog');
    const before = await productState(page);
    await page.evaluate((current) => {
      const changed = structuredClone(current);
      changed.ledger.events.push({
        schemaVersion: 1, compatibilityVersion: 1, kind: 'event', id: 'a4-background',
        datasetId: changed.ledger.descriptor.datasetId, epochId: changed.ledger.epochs[0].id,
        deviceId: 'synthetic-a4', clock: 999, occurredAt: '2026-09-19T12:00:00.000Z',
        type: 'entity.revised', payload: {
          entityType: 'profile', entityId: 'synthetic-profile', parents: [],
          value: {name: 'Hintergrund', archived: true},
        },
      });
      return import('/src/trainer/ui/adult.js').then(({adultStateChanged}) => {
        adultStateChanged(document.querySelector('#app'), changed);
      });
    }, before);
    await page.locator('#adult-background-notice').waitFor();
    assert.equal(await editor.getByRole('textbox', {name: /Englische Lösungen/}).inputValue(), 'hound | dog');

    await page.getByRole('button', {name: 'Lernregeln', exact: true}).click();
    await page.getByRole('dialog', {name: 'Ungespeicherte Eingaben'}).waitFor();
    await page.getByRole('button', {name: 'Weiterbearbeiten', exact: true}).click();
    assert.equal(await editor.getByRole('textbox', {name: /Englische Lösungen/}).inputValue(), 'hound | dog');
    await page.getByRole('button', {name: 'Lernregeln', exact: true}).click();
    await page.getByRole('button', {name: 'Speichern', exact: true}).click();
    await page.getByRole('heading', {name: 'Lernregeln', exact: true}).waitFor();
    assert.equal(await page.locator('input[type="range"], input[type="checkbox"]').count(), 0);
    assert.deepEqual((await productState(page)).ledger.events.at(-1).payload.value.answers, ['hound', 'dog']);

    await page.getByRole('button', {name: 'Vokabeln', exact: true}).click();
    await page.locator('[data-word-german="Hund"]').getByRole('button', {name: 'Bearbeiten', exact: true}).click();
    await page.locator('form.vocabulary-editor').getByRole('textbox', {name: /Englische Lösungen/}).fill('verwerfen');
    await page.getByRole('button', {name: 'Lernregeln', exact: true}).click();
    await page.getByRole('button', {name: 'Verwerfen', exact: true}).click();
    await page.getByRole('button', {name: 'Vokabeln', exact: true}).click();
    await page.getByRole('button', {name: 'Wort hinzufügen', exact: true}).click();
    assert.equal(await page.getByRole('button', {name: 'Mehrere Wörter einfügen', exact: true}).count(), 0);
    await page.getByLabel('Deutsches Wort').fill('Boot');
    await page.getByLabel(/Englische Lösungen/).fill('boat | vessel');
    await page.getByLabel('Lektion', {exact: true}).selectOption('__new__');
    await page.getByLabel('Neue Lektion', {exact: true}).fill('Meer');
    await page.getByRole('checkbox', {name: 'Ada', exact: true}).check();
    await page.getByRole('button', {name: 'Vokabel hinzufügen', exact: true}).click();
    await page.locator('[data-word-german="Boot"]').waitFor();

    await page.getByRole('button', {name: 'Mehrere Wörter einfügen', exact: true}).click();
    await page.getByLabel('Lektion', {exact: true}).selectOption('__new__');
    await page.getByLabel('Neue Lektion', {exact: true}).fill('Reise');
    await page.getByRole('checkbox', {name: 'Ada', exact: true}).check();
    await page.locator('#import-text').fill('Bank\tbench\nBank\tbank');
    await page.locator('#import-preview').click();
    assert.equal(await page.locator('#import-apply').isDisabled(), true);
    await page.locator('[data-import-row="row-2"] select').selectOption('separate');
    assert.equal(await page.locator('#import-apply').isEnabled(), true);
    await page.locator('#import-apply').click();
    await page.getByText('Die geprüften Tabellenzeilen wurden übernommen.', {exact: true}).waitFor();

    await page.getByLabel('Lektion auswählen').selectOption({label: 'Inselwörter'});
    const hund = page.locator('[data-word-german="Hund"]');
    await hund.getByRole('button', {name: 'Archivieren', exact: true}).click();
    await page.getByRole('button', {name: 'Archiviert', exact: true}).click();
    await page.locator('[data-word-german="Hund"]').getByRole('button', {name: 'Reaktivieren', exact: true}).click();
    await page.getByRole('button', {name: 'Aktiv', exact: true}).click();
    assert.equal(await page.locator('.vocabulary-filters .active').textContent(), 'Aktiv');
    assert.ok(await page.locator('.lesson-actions').evaluate((node) => Number.parseFloat(getComputedStyle(node).gap) >= 8));

    await page.screenshot({path: resolve(a4ResultsDirectory, 'vocabulary-mobile-390.png'), fullPage: true});
    await page.setViewportSize({width: 1280, height: 900});
    await page.getByRole('button', {name: 'Einstellungen', exact: true}).click();
    await page.getByRole('heading', {name: 'Einstellungen', exact: true}).waitFor();
    await page.screenshot({path: resolve(a4ResultsDirectory, 'settings-desktop-1280.png'), fullPage: true});
  } finally {
    await harness.close();
  }
});

test('vocabulary search keeps focus during real character-by-character typing', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice({viewport: {width: 390, height: 844}});
  try {
    await page.goto(harness.baseUrl);
    await setupPractice(page);
    await openAdult(page);

    const search = page.getByLabel('Vokabeln suchen');
    await search.click();
    await page.keyboard.type('Hun', {delay: 20});
    assert.equal(await search.inputValue(), 'Hun');
    assert.equal(await search.evaluate((node) => document.activeElement === node), true);
    await page.keyboard.type('d', {delay: 20});
    assert.equal(await search.inputValue(), 'Hund');
    assert.equal(await page.locator('[data-word-german="Hund"]').isVisible(), true);
    assert.equal(await page.locator('[data-word-german="Katze"]').isVisible(), false);
  } finally {
    await harness.close();
  }
});

test('table import treats target-only changes as a protected draft', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice();
  try {
    await page.goto(harness.baseUrl);
    await setupPractice(page);
    await openAdult(page);

    await page.getByRole('button', {name: 'Mehrere Wörter einfügen', exact: true}).click();
    await page.getByLabel('Lektion', {exact: true}).selectOption('__new__');
    await page.getByLabel('Neue Lektion', {exact: true}).fill('Reise');
    await page.getByRole('checkbox', {name: 'Ada', exact: true}).uncheck();
    await page.getByRole('button', {name: 'Lernregeln', exact: true}).click();
    await page.getByRole('dialog', {name: 'Ungespeicherte Eingaben'}).waitFor();
    await page.getByRole('button', {name: 'Weiterbearbeiten', exact: true}).click();
    assert.equal(await page.getByLabel('Lektion', {exact: true}).inputValue(), '__new__');
    assert.equal(await page.getByLabel('Neue Lektion', {exact: true}).inputValue(), 'Reise');
    assert.equal(await page.getByRole('checkbox', {name: 'Ada', exact: true}).isChecked(), false);
  } finally {
    await harness.close();
  }
});

test('table import revalidates its preview against the currently selected target lesson', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice();
  try {
    await page.goto(harness.baseUrl);
    await setupPractice(page);
    await openAdult(page);

    await page.getByRole('button', {name: 'Wort hinzufügen', exact: true}).click();
    await page.getByLabel('Deutsches Wort').fill('Boot');
    await page.getByLabel(/Englische Lösungen/).fill('boat');
    await page.getByLabel('Lektion', {exact: true}).selectOption('__new__');
    await page.getByLabel('Neue Lektion', {exact: true}).fill('Meer');
    await page.getByRole('button', {name: 'Vokabel hinzufügen', exact: true}).click();
    await page.locator('[data-word-german="Boot"]').waitFor();

    await page.getByRole('button', {name: 'Mehrere Wörter einfügen', exact: true}).click();
    await page.getByLabel('Lektion', {exact: true}).selectOption({label: 'Inselwörter'});
    await page.locator('#import-text').fill('Boot\tboat');
    await page.locator('#import-preview').click();
    assert.equal(await page.locator('#import-apply').isEnabled(), true);

    await page.getByLabel('Lektion', {exact: true}).selectOption({label: 'Meer'});
    assert.equal(await page.locator('#import-apply').isDisabled(), true);
    await page.locator('[data-import-row="row-1"] input[name="hint"]').fill('bereits vorhanden');
    await page.locator('[data-import-row="row-1"] input[name="hint"]').blur();
    assert.equal(await page.getByLabel('Lektion', {exact: true}).inputValue(), await page.getByLabel('Lektion', {exact: true}).locator('option', {hasText: 'Meer'}).getAttribute('value'));
    assert.equal(await page.locator('#import-apply').isDisabled(), true);

    await page.getByLabel('Lektion', {exact: true}).selectOption({label: 'Inselwörter'});
    assert.equal(await page.locator('#import-apply').isEnabled(), true);
    await page.locator('#import-text').fill('Katze\tcat');
    assert.equal(await page.locator('#import-apply').isDisabled(), true);
  } finally {
    await harness.close();
  }
});

test('a differing browser client stays explicit and a bound learning area cannot quick-switch it', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const oldClientId = '123456-old.apps.googleusercontent.com';
  const unbound = await harness.newDevice();
  const bound = await harness.newDevice();
  try {
    await unbound.page.addInitScript((value) => {
      localStorage.setItem('vokabeltrainer-google-client-id', value);
    }, oldClientId);
    await unbound.page.goto(harness.baseUrl);
    await setupPractice(unbound.page);
    await openSync(unbound.page);
    await unbound.page.getByText('Erweiterte Einstellungen', {exact: true}).click();
    await unbound.page.getByText(/andere Client-ID gespeichert/i).waitFor();
    await unbound.page.getByRole('button', {name: 'Vorbereiteten Zugang verwenden und verbinden', exact: true}).click();
    await unbound.page.getByText('Google ist für diese Sitzung verbunden.', {exact: true}).waitFor();
    assert.deepEqual(unbound.controls.oauthClientIds, [preparedGoogleClientId]);
    assert.equal(await unbound.page.evaluate(() => localStorage.getItem('vokabeltrainer-google-client-id')), preparedGoogleClientId);
    assert.equal((await productState(unbound.page)).binding, null);

    await bound.page.addInitScript((value) => {
      localStorage.setItem('vokabeltrainer-google-client-id', value);
    }, oldClientId);
    await bound.page.goto(harness.baseUrl);
    await setupPractice(bound.page);
    await openSync(bound.page);
    await bound.page.getByRole('button', {name: 'Mit Google verbinden', exact: true}).click();
    await bound.page.getByText('Google ist für diese Sitzung verbunden.', {exact: true}).waitFor();
    await bound.page.getByRole('button', {name: 'Neuen Lernbereich anlegen', exact: true}).click();
    await bound.page.getByText('Abgeglichen', {exact: true}).waitFor();
    await bound.page.getByText('Erweiterte Einstellungen', {exact: true}).click();
    await bound.page.getByText(/bestehende Lernbereich behält seine bisherige Verbindung/i).waitFor();
    assert.equal(await bound.page.getByRole('button', {name: /Vorbereiteten Zugang verwenden/}).count(), 0);
    assert.deepEqual(bound.controls.oauthClientIds, [oldClientId]);
    assert.equal(await bound.page.evaluate(() => localStorage.getItem('vokabeltrainer-google-client-id')), oldClientId);
  } finally {
    await Promise.allSettled([unbound.context.close(), bound.context.close()]);
    await harness.close();
  }
});

test('precache keeps unseen avatar fallbacks available when large renditions and server are offline', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page, context} = await harness.newDevice();
  try {
    page.setDefaultTimeout(5_000);
    await page.goto(harness.baseUrl);
    await setupPractice(page);
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, {timeout: 10_000});
    await page.getByRole('button', {name: 'Mein Avatar', exact: true}).click();
    await page.getByRole('radio', {name: 'Hautfarbe 4', exact: true}).check();
    await page.waitForFunction(() => document.activeElement?.matches('input[name="skin"][value="3"]:checked'));
    await page.getByRole('radio', {name: 'Kleidung Koralle', exact: true}).check();
    await page.waitForFunction(() => document.activeElement?.matches('input[name="clothing"][value="5"]:checked'));
    const cacheState = await page.evaluate(async () => {
      const {PRECACHE_ART_URLS} = await import('/src/trainer/ui/art-manifest.js');
      const missing = [];
      for (const path of PRECACHE_ART_URLS) {
        const url = new URL(path, new URL('/src/trainer/ui/art-manifest.js', location.href)).href;
        if (!await caches.match(url)) missing.push(url);
      }
      const names = await caches.keys();
      const requests = names.length ? (await (await caches.open(names[0])).keys()).map(({url}) => url) : [];
      return {missing, names, requests, controller: navigator.serviceWorker.controller?.scriptURL ?? ''};
    });
    assert.deepEqual(cacheState.missing, [], JSON.stringify(cacheState));
    harness.blockLargeArt();
    await page.evaluate(async () => {
      const {ART} = await import('/src/trainer/ui/art-manifest.js');
      const names = await caches.keys();
      for (const name of names) {
        const cache = await caches.open(name);
        for (const asset of Object.values(ART)) {
          for (const variant of asset.variants.slice(1)) {
            const url = new URL(variant.url, new URL('/src/trainer/ui/art-manifest.js', location.href)).href;
            await cache.delete(url);
          }
        }
      }
    });
    const devtools = await context.newCDPSession(page);
    await devtools.send('Network.clearBrowserCache');
    await devtools.detach();
    await page.getByRole('radio', {name: 'Hautfarbe 2', exact: true}).check();
    await page.waitForFunction(() => document.activeElement?.matches('input[name="skin"][value="1"]:checked'));
    await page.getByRole('radio', {name: 'Kleidung Violett', exact: true}).check();
    await page.waitForFunction(() => document.activeElement?.matches('input[name="clothing"][value="4"]:checked'));
    await page.evaluate(async () => {
      const {avatarPicture} = await import('/src/trainer/ui/art.js');
      document.querySelector('.avatar-preview').append(avatarPicture({
        skin: 1, clothing: 4, head: 'mountainhat', back: 'backpack', hand: 'binoculars',
      }, {className: 'qa-offline-unseen', sizes: '768px'}));
    });
    const images = page.locator('.qa-offline-unseen [data-art-key] img');
    await page.waitForTimeout(700);
    assert.equal(await images.count(), 5);
    const sources = await images.evaluateAll((nodes) => nodes.map((image) => ({
      currentSrc: image.currentSrc,
      fallback: image.dataset.fallback ?? '',
      naturalWidth: image.naturalWidth,
    })));
    assert.equal(sources.every(({naturalWidth}) => naturalWidth > 0), true, JSON.stringify(sources));
    assert.equal(sources.every(({currentSrc, fallback}) => (
      currentSrc.endsWith('-256.webp') || fallback === 'true'
    )), true, JSON.stringify(sources));

    await page.locator('.qa-offline-unseen').evaluate((node) => node.remove());
    await harness.stopServer();
    await context.setOffline(true);
    await page.getByRole('radio', {name: 'Hautfarbe 3', exact: true}).check();
    await page.waitForFunction(() => document.activeElement?.matches('input[name="skin"][value="2"]:checked'));
    await page.getByRole('radio', {name: 'Kleidung Himmelblau', exact: true}).check();
    await page.waitForFunction(() => document.activeElement?.matches('input[name="clothing"][value="3"]:checked'));
    await page.evaluate(async () => {
      const {avatarPicture} = await import('/src/trainer/ui/art.js');
      document.body.append(avatarPicture({
        skin: 2, clothing: 3, head: 'cap', back: 'backpack', hand: 'compass',
      }, {className: 'qa-offline-second', sizes: '768px'}));
    });
    await page.waitForTimeout(700);
    const offlineSources = await page.locator('.qa-offline-second [data-art-key] img').evaluateAll((nodes) => (
      nodes.map((image) => ({currentSrc: image.currentSrc, fallback: image.dataset.fallback ?? '', naturalWidth: image.naturalWidth}))
    ));
    assert.equal(offlineSources.length, 5);
    assert.equal(offlineSources.every(({naturalWidth}) => naturalWidth > 0), true, JSON.stringify(offlineSources));
  } finally {
    await harness.close();
  }
});
