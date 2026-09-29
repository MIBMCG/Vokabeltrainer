import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createTrainerHarness} from './trainer-harness.mjs';

const screenshotDirectory = fileURLToPath(new URL('../../test-results/tiger-art/', import.meta.url));

test('evolution pictures load responsive images and fall back to the cached small form offline', {timeout: 60_000}, async () => {
  const harness = await createTrainerHarness();
  const {page, context} = await harness.newDevice({viewport: {width: 1100, height: 800}});
  try {
    await page.goto(harness.baseUrl);
    await page.locator('#dataset-name').waitFor();
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    const cached = await page.evaluate(async () => {
      const cache = await caches.open('vokabeltrainer-product:%2Ftrainer%2F:v38');
      return Promise.all(['dragon', 'deer-mist', 'tiger'].flatMap((figureId) => [1, 2, 3, 4].map(async (stage) => Boolean(await cache.match(
        new URL(`assets/avatar-evolution/${figureId}-stage-${stage}-256.webp`, location.href),
      )))));
    });
    assert.deepEqual(cached, Array(12).fill(true));
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

    await page.evaluate(async () => {
      const {evolutionPicture} = await import('/src/trainer/avatar/evolution-art.js');
      document.body.replaceChildren(evolutionPicture('deer-mist', 2, {sizes: '500px', alt: 'Nebelhirsch'}));
    });
    await page.waitForFunction(() => {
      const img = document.querySelector('picture img');
      return img?.complete && img.naturalWidth > 0 && img.currentSrc.endsWith('deer-mist-stage-2-512.webp');
    });

    await page.evaluate(async () => {
      const {evolutionPicture} = await import('/src/trainer/avatar/evolution-art.js');
      document.body.replaceChildren(evolutionPicture('tiger', 2, {sizes: '500px', alt: 'Tiger'}));
    });
    await page.waitForFunction(() => {
      const img = document.querySelector('picture img');
      return img?.complete && img.naturalWidth > 0 && img.currentSrc.endsWith('tiger-stage-2-512.webp');
    });

    // Stage 4's large rendition was never loaded; only its required 256px
    // fallback is cached when this device loses its connection.
    await context.setOffline(true);
    await page.evaluate(async () => {
      const {evolutionPicture} = await import('/src/trainer/avatar/evolution-art.js');
      document.body.replaceChildren(evolutionPicture('tiger', 4, {sizes: '700px', alt: 'Tiger offline'}));
    });
    await page.waitForFunction(() => {
      const img = document.querySelector('picture img');
      return img?.complete && img.naturalWidth > 0 && img.currentSrc.endsWith('tiger-stage-4-256.webp');
    });
    assert.equal(await page.locator('picture img').getAttribute('alt'), 'Tiger offline');
    assert.equal(await page.locator('picture img').getAttribute('srcset'), null);

    // An incomplete cache must give an honest placeholder instead of a broken
    // image if even the small fallback is unavailable.
    await page.evaluate(async () => {
      const cache = await caches.open('vokabeltrainer-product:%2Ftrainer%2F:v38');
      await cache.delete(new URL('assets/avatar-evolution/deer-mist-stage-3-256.webp', location.href));
      const {evolutionPicture} = await import('/src/trainer/avatar/evolution-art.js');
      document.body.replaceChildren(evolutionPicture('deer-mist', 3, {sizes: '700px', alt: 'Fehlender Nebelhirsch'}));
    });
    await page.locator('picture[data-art-unavailable="true"]').waitFor();
    assert.equal(await page.locator('picture img:visible').count(), 0);
    assert.match(await page.locator('picture').innerText(), /Bild.*(?:verfügbar|geladen)/u);
  } finally {
    await harness.close();
  }
});

for (const {figureId, displayName} of [
  {figureId: 'deer-mist', displayName: 'Nebelhirsch'},
  {figureId: 'tiger', displayName: 'Tiger'},
]) test(`owned ${displayName} stage can be selected and all forms fit desktop and mobile gallery cards`, {timeout: 60_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice({viewport: {width: 1280, height: 900}});
  try {
    await page.goto(harness.baseUrl);
    await page.evaluate(async ({figureId}) => {
      const {renderPurchases} = await import('/src/trainer/ui/purchases.js');
      document.querySelector('#app').style.display = 'none';
      const root = document.createElement('div');
      root.id = `${figureId}-gallery`;
      document.body.append(root);
      const view = {
        mode: 'active', jobs: [], selection: [{profileId: 'p1', figureId, stage: 1}],
        accounts: {p1: {earnedPoints: 600, availablePoints: 600,
          entitledFigureIds: [figureId], entitledEvolutionIds: [`evolution:${figureId}:1`, `evolution:${figureId}:2`]}},
      };
      renderPurchases({root, profileId: 'p1', online: true, commerce: {
        isConnected: () => true,
        getView: async () => view,
        select: async ({profileId, figureId, stage}) => { view.selection = [{profileId, figureId, stage}]; },
      }});
    }, {figureId});
    const gallery = page.locator(`#${figureId}-gallery`);
    await gallery.locator(`[data-selected-purchase-figure] img[src*="${figureId}-stage-1"]`).waitFor();
    await gallery.locator('[data-owned-stage="2"]').getByRole('button', {name: 'Diese Form auswählen'}).click();
    await gallery.locator(`[data-selected-purchase-figure] img[src*="${figureId}-stage-2"]`).waitFor();
    assert.equal(await gallery.locator('[data-selected-purchase-figure] h3').innerText(), `${displayName} – Stufe 2`);
    await gallery.getByRole('button', {name: 'Entwicklung', exact: true}).click();
    await gallery.locator('.evolution-card').last().waitFor();
    const assertVisibleArt = async () => {
      const result = await gallery.evaluate((root) => ({
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
        images: [...root.querySelectorAll('.evolution-card')].map((card) => {
          const image = card.querySelector('picture img');
          const cardRect = card.getBoundingClientRect();
          const imageRect = image?.getBoundingClientRect();
          return {stage: card.dataset.stage, complete: image?.complete, naturalWidth: image?.naturalWidth,
            objectFit: image && getComputedStyle(image).objectFit,
            clipped: !imageRect || imageRect.left < cardRect.left - 1 || imageRect.right > cardRect.right + 1
              || cardRect.left < -1 || cardRect.right > innerWidth + 1};
        }),
      }));
      assert.equal(result.horizontalOverflow, false, JSON.stringify(result));
      assert.deepEqual(result.images.map(({stage}) => stage), ['1', '2', '3', '4']);
      for (const image of result.images) {
        assert.equal(image.complete, true, JSON.stringify(image));
        assert.ok(image.naturalWidth > 0, JSON.stringify(image));
        assert.equal(image.objectFit, 'contain', JSON.stringify(image));
        assert.equal(image.clipped, false, JSON.stringify(image));
      }
    };
    await page.waitForFunction((figureId) => [...document.querySelectorAll(`#${figureId}-gallery .evolution-card img`)]
      .length === 4 && [...document.querySelectorAll(`#${figureId}-gallery .evolution-card img`)]
      .every((image) => image.complete && image.naturalWidth > 0), figureId);
    await assertVisibleArt();
    if (figureId === 'tiger') {
      await mkdir(screenshotDirectory, {recursive: true});
      await page.screenshot({path: join(screenshotDirectory, 'desktop.png'), fullPage: true});
    }
    await page.setViewportSize({width: 390, height: 844});
    await assertVisibleArt();
    if (figureId === 'tiger') await page.screenshot({path: join(screenshotDirectory, 'mobile.png'), fullPage: true});
  } finally {
    await harness.close();
  }
});
