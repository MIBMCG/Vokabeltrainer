import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';

import {createTrainerHarness} from './trainer-harness.mjs';

const screenshots = resolve('test-results', 'mobile-navigation');

async function setup(page, baseUrl) {
  await page.goto(baseUrl);
  for (const [id, value] of Object.entries({
    'dataset-name': 'Navigation Probe',
    'setup-pin': '1234',
    'setup-pin-repeat': '1234',
    'setup-profile': 'Ada',
    'setup-lesson': 'Englisch',
    'setup-word-1-german': 'Sonne',
    'setup-word-1-answers': 'sun',
    'setup-word-2-german': 'Mond',
    'setup-word-2-answers': 'moon',
  })) await page.locator(`#${id}`).fill(value);
  await page.locator('#setup-submit').click();
  await page.getByRole('button', {name: /^Ada/}).click();
}

async function navigationGeometry(page) {
  return page.evaluate(() => {
    const nav = document.querySelector('.bottom-nav');
    const buttons = [...nav.querySelectorAll('button')];
    const content = [...document.querySelector('#app').children].find((child) => child !== nav);
    const words = buttons.flatMap((button) => {
      const text = button.firstChild;
      return [...text.textContent.matchAll(/\S+/gu)].map((match) => {
        const {0: word, index: offset} = match;
        const positions = [];
        for (let i = offset; i < offset + word.length; i++) {
          const range = document.createRange();
          range.setStart(text, i);
          range.setEnd(text, i + 1);
          const rect = range.getBoundingClientRect();
          positions.push({top: Math.round(rect.top * 10) / 10, left: Math.round(rect.left * 10) / 10});
        }
        return {word, lineTops: [...new Set(positions.map(({top}) => top))], positions};
      });
    });
    return {
      width: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      rootFont: getComputedStyle(document.documentElement).fontSize,
      nav: {height: nav.getBoundingClientRect().height, top: nav.getBoundingClientRect().top,
        left: nav.getBoundingClientRect().left, right: nav.getBoundingClientRect().right},
      clearance: nav.getBoundingClientRect().top - content.getBoundingClientRect().bottom,
      scrollY: window.scrollY,
      buttons: buttons.map((button) => ({text: button.textContent, height: button.getBoundingClientRect().height,
        current: button.getAttribute('aria-current'), fontSize: getComputedStyle(button).fontSize})),
      words,
    };
  });
}

async function inspect(page, sample, view) {
  await page.evaluate(() => window.scrollTo({top: document.scrollingElement.scrollHeight, behavior: 'instant'}));
  const geometry = await navigationGeometry(page);
  console.log(`navigation ${sample.width}x${sample.height} ${sample.font} ${view}: ${JSON.stringify({
    navHeight: geometry.nav.height, clearance: geometry.clearance, scrollY: geometry.scrollY,
    words: geometry.words.map(({word, lineTops}) => ({word, lineTops})),
  })}`);
  assert.equal(geometry.rootFont, sample.font === '200%' ? '32px' : '16px');
  assert.equal(geometry.scrollWidth, geometry.width, JSON.stringify(geometry));
  assert.ok(geometry.nav.left >= -1 && geometry.nav.right <= geometry.width + 1, JSON.stringify(geometry));
  assert.deepEqual(geometry.buttons.map(({text}) => text), ['Üben', 'Inselreise', 'Mein Avatar']);
  assert.deepEqual(geometry.buttons.map(({current}) => current), [
    view === 'practice' ? 'page' : null,
    view === 'journey' ? 'page' : null,
    view === 'avatar' ? 'page' : null,
  ]);
  assert.ok(geometry.buttons.every(({height, fontSize}) => height >= 44 && fontSize === (sample.font === '200%' ? '25.6px' : '16px')),
    JSON.stringify(geometry));
  assert.deepEqual(geometry.words.filter(({lineTops}) => lineTops.length !== 1), [], JSON.stringify(geometry));
  assert.ok(geometry.clearance >= 8, JSON.stringify(geometry));
  await page.screenshot({path: resolve(screenshots, `after-${sample.width}x${sample.height}-${sample.font}-${view}.png`)});
}

test('main navigation keeps whole words, actions, and final content reachable', {timeout: 180_000}, async () => {
  await mkdir(screenshots, {recursive: true});
  const harness = await createTrainerHarness();
  try {
    for (const sample of [
      {width: 320, height: 568, font: '200%'},
      {width: 390, height: 844, font: '200%'},
      {width: 320, height: 568, font: '100%'},
      {width: 390, height: 844, font: '100%'},
      {width: 640, height: 360, font: '200%'},
      {width: 1280, height: 900, font: '100%'},
    ]) {
      const {page, context} = await harness.newDevice({viewport: {width: sample.width, height: sample.height}});
      try {
        await setup(page, harness.baseUrl);
        await page.evaluate((font) => { document.documentElement.style.fontSize = font; }, sample.font);
        await inspect(page, sample, 'practice');
        await page.getByRole('button', {name: 'Inselreise', exact: true}).click();
        await inspect(page, sample, 'journey');
        await page.getByRole('button', {name: 'Mein Avatar', exact: true}).click();
        await inspect(page, sample, 'avatar');
        await page.getByRole('button', {name: 'Üben', exact: true}).click();
        await inspect(page, sample, 'practice');
        if (sample.width === 320 && sample.font === '200%') {
          await page.getByRole('button', {name: 'Runde starten', exact: true}).click();
          await page.locator('#answer').fill('wrong');
          await page.getByRole('button', {name: 'Prüfen', exact: true}).click();
          await page.getByRole('button', {name: 'Weiter', exact: true}).waitFor();
          await inspect(page, sample, 'practice');
          await page.reload();
          await page.getByRole('button', {name: 'Weiter', exact: true}).waitFor();
          assert.equal(await page.locator('#answer').inputValue(), 'wrong');
        }
      } finally {
        await context.close();
      }
    }
  } finally {
    await harness.close();
  }
});
