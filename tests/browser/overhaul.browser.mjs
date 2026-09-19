import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';

import {createTrainerHarness} from './trainer-harness.mjs';

const resultsDirectory = resolve('test-results', 'overhaul-a1');
const a2ResultsDirectory = resolve('test-results', 'overhaul-a2');

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
    await page.screenshot({path: resolve(resultsDirectory, 'start-390.png'), fullPage: true});

    await page.getByRole('button', {name: 'Inselreise', exact: true}).click();
    assert.equal(await page.locator('[data-art-key="island-journey"] img').evaluate((image) => image.naturalWidth > 0), true);
    assert.equal(await page.locator('[data-stage]').count(), 15);
    assert.equal(await page.locator('[data-island]').count(), 3);
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
