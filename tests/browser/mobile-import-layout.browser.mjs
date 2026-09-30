import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';

import {createTrainerHarness} from './trainer-harness.mjs';

const screenshotDirectory = resolve('test-results', 'mobile-import-layout');

async function setup(page, baseUrl) {
  await page.goto(baseUrl);
  for (const [selector, value] of Object.entries({
    '#dataset-name': 'Mobile Mengenpruefung',
    '#setup-pin': '1234',
    '#setup-pin-repeat': '1234',
    '#setup-profile': 'Ada',
    '#setup-lesson': 'Inselwoerter',
    '#setup-word-1-german': 'Hund',
    '#setup-word-1-answers': 'dog',
    '#setup-word-2-german': 'Katze',
    '#setup-word-2-answers': 'cat',
  })) await page.locator(selector).fill(value);
  await page.locator('#setup-submit').click();
  await page.getByRole('button', {name: /^Ada/}).click();
  await page.getByRole('button', {name: 'Profil wechseln', exact: true}).click();
  await page.locator('#adult-entry').click();
  if (await page.locator('#adult-pin').count()) {
    await page.locator('#adult-pin').fill('1234');
    await page.locator('#adult-unlock').click();
  }
  await page.locator('#adult-nav').waitFor();
}

async function layout(page) {
  return page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    const visible = (element) => element.getClientRects().length > 0;
    const outside = [...document.querySelectorAll('#adult-nav *, #adult-content *, #adult-nav, #adult-content')]
      .filter(visible)
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && (rect.left < -1 || rect.right > viewport + 1);
      })
      .map((element) => element.id || element.className || element.tagName)
      .slice(0, 12);
    const pageOutside = [...document.querySelectorAll('body, body *')]
      .filter(visible)
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && (rect.left < -1 || rect.right > viewport + 1);
      })
      .map((element) => ({element: element.id || element.className || element.tagName,
        parent: element.parentElement?.className, text: element.textContent?.slice(0, 70),
        right: Math.round(element.getBoundingClientRect().right), scrollWidth: element.scrollWidth}))
      .slice(0, 12);
    return {
      viewport,
      scrollWidth: document.documentElement.scrollWidth,
      rootFont: getComputedStyle(document.documentElement).fontSize,
      navLabelFont: getComputedStyle(document.querySelector('.adult-nav-label')).fontSize,
      outside,
      pageOutside,
    };
  });
}

async function savedState(page) {
  return page.evaluate(() => new Promise((resolveState, reject) => {
    const request = indexedDB.open('vokabeltrainer-product-v1', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('product-state');
      const read = transaction.objectStore('product-state').get('current');
      read.onerror = () => reject(read.error);
      read.onsuccess = () => resolveState(read.result);
      transaction.oncomplete = () => db.close();
    };
  }));
}

test('adult vocabulary import remains reachable at narrow and enlarged text sizes', {timeout: 180_000}, async () => {
  await mkdir(screenshotDirectory, {recursive: true});
  const harness = await createTrainerHarness();
  const baseline = process.env.MOBILE_LAYOUT_BASELINE === '1' ? 'before' : 'after';
  try {
    for (const sample of [
      {width: 390, height: 844, rootFont: '200%'},
      {width: 320, height: 568, rootFont: '200%'},
      {width: 320, height: 568, rootFont: '100%'},
      {width: 1280, height: 900, rootFont: '100%'},
    ]) {
      const {context, page} = await harness.newDevice({viewport: {width: sample.width, height: sample.height}});
      try {
        await setup(page, harness.baseUrl);
        await page.evaluate((font) => { document.documentElement.style.fontSize = font; }, sample.rootFont);
        const beforeImport = await layout(page);
        if (sample.rootFont === '200%') {
          assert.equal(beforeImport.rootFont, '32px');
          assert.equal(beforeImport.navLabelFont, '32px');
          const wrappedNavLabels = await page.locator('.adult-nav-label').evaluateAll((labels) => labels
            .filter((label) => label.getBoundingClientRect().height > Number.parseFloat(getComputedStyle(label).lineHeight) + 1)
            .map((label) => label.textContent));
          assert.deepEqual(wrappedNavLabels, [], 'Adult navigation labels need enough width at 200% text');
        }
        await page.getByRole('button', {name: 'Vokabeln', exact: true}).click();
        await page.getByRole('button', {name: 'Mehrere Wörter einfügen', exact: true}).click();
        await page.locator('#import-text').fill('Hund\tdog\nBoot\t\nSchmetterling\tbutterfly');
        assert.equal(await page.locator('#import-apply').isDisabled(), true);
        await page.locator('#import-skip-identical').click();
        const correction = page.locator('[data-import-row]').filter({has: page.locator('input[name="german"][value="Boot"]')});
        await correction.locator('input[name="answers"]').fill('boat');
        await correction.locator('input[name="hint"]').click();
        await page.getByLabel('Lektion', {exact: true}).selectOption({label: 'Neue Lektion anlegen …'});
        await page.getByLabel('Neue Lektion', {exact: true}).fill('Englisch Unterricht – Reisevorbereitungen und Wegbeschreibungen');
        await page.getByLabel('Ada', {exact: true}).check();
        await page.locator('#import-apply').scrollIntoViewIfNeeded();
        await page.screenshot({path: resolve(screenshotDirectory, `${baseline}-${sample.width}-${sample.rootFont}.png`), fullPage: true});
        const duringImport = await layout(page);
        assert.equal(beforeImport.scrollWidth, beforeImport.viewport, JSON.stringify({sample, phase: 'adult navigation', beforeImport}));
        assert.deepEqual(beforeImport.outside, [], JSON.stringify({sample, phase: 'adult navigation', beforeImport}));
        assert.equal(duringImport.scrollWidth, duringImport.viewport, JSON.stringify({sample, phase: 'import', duringImport}));
        assert.deepEqual(duringImport.outside, [], JSON.stringify({sample, phase: 'import', duringImport}));
        assert.equal(await page.locator('#import-apply').isEnabled(), true);
        await page.locator('#import-apply').click();
        await page.getByText('2 Wörter wurden auf diesem Gerät gespeichert.', {exact: true}).waitFor();
        await page.reload();
        const state = await savedState(page);
        const words = state.ledger.events.filter((event) => event.type === 'entity.revised' && event.payload.entityType === 'word');
        const lesson = state.ledger.events.filter((event) => event.type === 'entity.revised' && event.payload.entityType === 'lesson').at(-1);
        const ada = state.ledger.events.find((event) => event.type === 'entity.revised'
          && event.payload.entityType === 'profile' && event.payload.value.name === 'Ada');
        assert.deepEqual(words.map((event) => event.payload.value.german), ['Hund', 'Katze', 'Boot', 'Schmetterling']);
        assert.equal(lesson.payload.value.name, 'Englisch Unterricht – Reisevorbereitungen und Wegbeschreibungen');
        assert.deepEqual(lesson.payload.value.profileIds, [ada.payload.entityId]);
      } finally {
        await context.close();
      }
    }
  } finally {
    await harness.close();
  }
});
