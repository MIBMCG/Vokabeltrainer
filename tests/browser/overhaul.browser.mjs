import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';

import {createTrainerHarness} from './trainer-harness.mjs';

const resultsDirectory = resolve('test-results', 'overhaul-a1');

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
    .every((image) => image.complete && image.naturalWidth > 0), selector);
  return page.locator(selector).count();
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
