import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';

import {createTrainerHarness} from './trainer-harness.mjs';

const screenshots = resolve('test-results', 'mobile-child-layout');

async function setup(page, baseUrl) {
  await page.goto(baseUrl);
  for (const [id, value] of Object.entries({
    'dataset-name': 'Schmale Kinderansicht',
    'setup-pin': '1234',
    'setup-pin-repeat': '1234',
    'setup-profile': 'Ada',
    'setup-lesson': 'Englisch Unterricht',
    'setup-word-1-german': 'Wettervorhersage',
    'setup-word-1-answers': 'weather forecast',
    'setup-word-2-german': 'Schmetterling',
    'setup-word-2-answers': 'butterfly',
  })) await page.locator(`#${id}`).fill(value);
  await page.locator('#setup-submit').click();
  await page.getByRole('button', {name: /^Ada/}).click();
}

async function geometry(page, selector) {
  return page.evaluate((selector) => {
    const width = document.documentElement.clientWidth;
    const elements = [...document.querySelectorAll(selector)].filter((element) => element.getClientRects().length);
    return {
      width,
      scrollWidth: document.documentElement.scrollWidth,
      rootFont: getComputedStyle(document.documentElement).fontSize,
      outside: elements.filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && (rect.left < -1 || rect.right > width + 1 || element.scrollWidth > element.clientWidth + 1);
      }).map((element) => ({name: element.className || element.tagName, text: element.textContent?.trim().slice(0, 40),
        left: Math.round(element.getBoundingClientRect().left), right: Math.round(element.getBoundingClientRect().right),
        clientWidth: element.clientWidth, scrollWidth: element.scrollWidth})),
    };
  }, selector);
}

async function inspect(page, sample, phase, selector) {
  const label = `${sample.width}-${sample.font}-${phase}`;
  await page.screenshot({path: resolve(screenshots, `${process.env.CHILD_LAYOUT_BASELINE === '1' ? 'before' : 'after'}-${label}-viewport.png`)});
  await page.screenshot({path: resolve(screenshots, `${process.env.CHILD_LAYOUT_BASELINE === '1' ? 'before' : 'after'}-${label}-full.png`), fullPage: true});
  const result = await geometry(page, selector);
  assert.equal(result.rootFont, sample.font === '200%' ? '32px' : '16px', label);
  assert.equal(result.scrollWidth, result.width, JSON.stringify({label, result}));
  assert.deepEqual(result.outside, [], JSON.stringify({label, result}));
}

async function screenshotAt(page, sample, phase, selector) {
  await page.locator(selector).first().evaluate((element) => element.scrollIntoView({block: 'center', behavior: 'instant'}));
  await page.screenshot({path: resolve(screenshots, `after-${sample.width}-${sample.font}-${phase}-detail.png`)});
}

test('child practice, journey and avatar stay usable on narrow screens with enlarged text', {timeout: 180_000}, async () => {
  await mkdir(screenshots, {recursive: true});
  const harness = await createTrainerHarness();
  try {
    for (const sample of [
      {width: 320, height: 568, font: '200%'},
      {width: 390, height: 844, font: '200%'},
      {width: 320, height: 568, font: '100%'},
      {width: 390, height: 844, font: '100%'},
      {width: 1280, height: 900, font: '100%'},
    ]) {
      const {page, context} = await harness.newDevice({viewport: {width: sample.width, height: sample.height}});
      try {
        await setup(page, harness.baseUrl);
        await page.evaluate((font) => { document.documentElement.style.fontSize = font; }, sample.font);
        await inspect(page, sample, 'practice-home', '.practice-home, .practice-header, .practice-intro, .level-card, .practice-start-form, .mode-grid, .mode-card, .mode-card-copy, .mode-title, .mode-status, .practice-header button');
        await screenshotAt(page, sample, 'practice-modes', '.mode-grid');
        await screenshotAt(page, sample, 'round-sizes', '.round-sizes');
        await page.getByRole('button', {name: 'Inselreise', exact: true}).click();
        await inspect(page, sample, 'journey', '.reward-screen, .reward-header, .level-card, .badge-shelf, .badge-grid, .badge-card, .badge-card strong, .badge-card span');
        const badges = await page.locator('.badge-grid').evaluate((grid) => ({
          columns: getComputedStyle(grid).gridTemplateColumns.split(' ').length,
          cardWidth: grid.querySelector('.badge-card').getBoundingClientRect().width,
        }));
        assert.equal(badges.columns, sample.font === '200%' ? 1 : sample.width < 600 ? 2 : 6,
          JSON.stringify({sample, badges}));
        if (sample.font === '200%') assert.ok(badges.cardWidth >= 200, JSON.stringify({sample, badges}));
        await screenshotAt(page, sample, 'badges', '.badge-grid');
        await page.getByRole('button', {name: 'Mein Avatar', exact: true}).click();
        await inspect(page, sample, 'avatar', '.reward-screen, .reward-header, .avatar-commerce, .commerce-panel, .commerce-tabs, .commerce-tabs button, .classic-avatar, .classic-avatar > summary, .classic-avatar > summary strong, .classic-avatar > summary span');
        const developmentLines = await page.getByRole('button', {name: 'Entwicklung', exact: true}).evaluate((button) => {
          const range = document.createRange();
          range.selectNodeContents(button);
          return range.getClientRects().length;
        });
        assert.equal(developmentLines, 1, JSON.stringify({sample, developmentLines}));
        await screenshotAt(page, sample, 'commerce', '.commerce-tabs');
        if (await page.locator('.classic-avatar').getAttribute('open') === null) {
          await page.locator('.classic-avatar > summary').click();
        }
        await page.locator('.avatar-customizer').screenshot({path: resolve(screenshots, `${process.env.CHILD_LAYOUT_BASELINE === '1' ? 'before' : 'after'}-${sample.width}-${sample.font}-classic-controls.png`)});
        await inspect(page, sample, 'classic-open', '.reward-screen, .classic-avatar, .classic-avatar > summary, .avatar-controls, .choice-group, .choice-tile, .choice-tile span');
        await screenshotAt(page, sample, 'classic-colours', '.colour-group');
        await screenshotAt(page, sample, 'classic-equipment', '.equipment-group');
        await page.getByRole('button', {name: 'Üben', exact: true}).click();
        await page.getByRole('button', {name: 'Runde starten', exact: true}).click();
        await page.locator('#answer').fill('wrong');
        await page.getByRole('button', {name: 'Prüfen', exact: true}).click();
        await page.getByRole('button', {name: 'Weiter', exact: true}).waitFor();
        await inspect(page, sample, 'feedback', '.practice-header, .word-card, #feedback');
        await page.reload();
        await page.getByRole('button', {name: 'Weiter', exact: true}).waitFor();
        assert.equal(await page.locator('#answer').inputValue(), 'wrong');
      } finally {
        await context.close();
      }
    }
  } finally {
    await harness.close();
  }
});
