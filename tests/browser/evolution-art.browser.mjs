import test from 'node:test';
import assert from 'node:assert/strict';
import {createTrainerHarness} from './trainer-harness.mjs';

test('evolution pictures load responsive images and fall back to the cached small form offline', {timeout: 60_000}, async () => {
  const harness = await createTrainerHarness();
  const {page, context} = await harness.newDevice({viewport: {width: 1100, height: 800}});
  try {
    await page.goto(harness.baseUrl);
    await page.locator('#dataset-name').waitFor();
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    const cached = await page.evaluate(async () => {
      const cache = await caches.open('vokabeltrainer-product:%2Ftrainer%2F:v33');
      return Promise.all([1, 2, 3, 4].map(async (stage) => Boolean(await cache.match(
        new URL(`assets/avatar-evolution/dragon-stage-${stage}-256.webp`, location.href),
      ))));
    });
    assert.deepEqual(cached, [true, true, true, true]);
    await page.evaluate(async () => {
      const {evolutionPicture} = await import('/src/trainer/avatar/evolution-art.js');
      const picture = evolutionPicture('dragon', 2, {sizes: '500px', alt: 'Testdrache'});
      document.body.replaceChildren(picture);
    });
    await page.waitForFunction(() => {
      const img = document.querySelector('picture img');
      return img?.complete && img.naturalWidth > 0;
    });
    assert.match(await page.locator('picture img').evaluate((img) => img.currentSrc), /dragon-stage-2-512\.webp$/u);

    // Stage 4's large rendition was never loaded; only its required 256px
    // fallback is cached when this device loses its connection.
    await context.setOffline(true);
    await page.evaluate(async () => {
      const {evolutionPicture} = await import('/src/trainer/avatar/evolution-art.js');
      document.body.replaceChildren(evolutionPicture('dragon', 4, {sizes: '700px', alt: 'Testdrache offline'}));
    });
    await page.waitForFunction(() => {
      const img = document.querySelector('picture img');
      return img?.complete && img.naturalWidth > 0 && img.currentSrc.endsWith('dragon-stage-4-256.webp');
    });
    assert.equal(await page.locator('picture img').getAttribute('alt'), 'Testdrache offline');
    assert.equal(await page.locator('picture img').getAttribute('srcset'), null);

    // An incomplete cache must give an honest placeholder instead of a broken
    // image if even the small fallback is unavailable.
    await page.evaluate(async () => {
      const cache = await caches.open('vokabeltrainer-product:%2Ftrainer%2F:v33');
      await cache.delete(new URL('assets/avatar-evolution/dragon-stage-3-256.webp', location.href));
      const {evolutionPicture} = await import('/src/trainer/avatar/evolution-art.js');
      document.body.replaceChildren(evolutionPicture('dragon', 3, {sizes: '700px', alt: 'Fehlender Testdrache'}));
    });
    await page.locator('picture[data-art-unavailable="true"]').waitFor();
    assert.equal(await page.locator('picture img:visible').count(), 0);
    assert.match(await page.locator('picture').innerText(), /Bild.*(?:verfügbar|geladen)/u);
  } finally {
    await harness.close();
  }
});
