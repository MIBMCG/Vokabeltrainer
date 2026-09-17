// Run against npm start. Only Google HTTP/GIS is simulated; app, IDB and SW are real.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import {createGoogleFixture} from './google-fixture.mjs';

const require = createRequire(import.meta.url);
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const baseUrl = process.env.PROBE_BASE_URL || 'http://localhost:4173';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(baseUrl).hostname), 'Use a local synthetic test server');
const browser = await chromium.launch({headless: true,
  ...(process.env.BROWSER_EXECUTABLE ? {executablePath: process.env.BROWSER_EXECUTABLE} : {})});
const fixture = createGoogleFixture();
const results = [];
const pageErrors = [];
await mkdir('test-results', {recursive: true});

async function step(name, run) {
  await run();
  results.push(name);
  console.log(`PASS ${name}`);
}

async function device(viewport) {
  const context = await browser.newContext({viewport});
  const control = await fixture.attach(context);
  const page = await context.newPage();
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto(baseUrl);
  return {context, control, page};
}

const byId = (page, id) => page.locator(`#${id}`);
async function metric(page, id, want) {
  await page.waitForFunction(({id, want}) => {
    const text = document.getElementById(id)?.textContent || '';
    return Number(text.match(/\d+/)?.[0]) === want;
  }, {id, want});
}
async function connect(page) {
  await byId(page, 'client-id').fill('synthetic-browser.apps.googleusercontent.com');
  await byId(page, 'prepare').click();
  await byId(page, 'connect').click();
  await byId(page, 'find-folders').waitFor({state: 'visible'});
}

async function storageContents(page) {
  return page.evaluate(async () => {
    const result = [];
    for (const info of await indexedDB.databases()) {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open(info.name);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      for (const name of db.objectStoreNames) {
        result.push(await new Promise((resolve, reject) => {
          const request = db.transaction(name).objectStore(name).getAll();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        }));
      }
      db.close();
    }
    return JSON.stringify({idb: result, local: {...localStorage}, session: {...sessionStorage}});
  });
}

try {
  const a = await device({width: 1280, height: 900});
  await step('service worker preserves unrelated caches on the same origin', async () => {
    const context = await browser.newContext();
    try {
      await fixture.attach(context);
      const page = await context.newPage();
      await page.goto(new URL('styles.css', baseUrl).href);
      await page.evaluate(async () => {
        const cache = await caches.open('unrelated-app-test');
        await cache.put('./unrelated.txt', new Response('preserve-me'));
      });
      await page.goto(baseUrl);
      await page.evaluate(() => navigator.serviceWorker.ready);
      assert.equal(await page.evaluate(() => caches.has('unrelated-app-test')), true);
    } finally {
      await context.close();
    }
  });
  await step('initial page, keyboard access and narrow layout', async () => {
    await a.page.getByRole('heading', {name: /Verbindungsprobe/}).waitFor();
    assert.match(await a.page.locator('body').innerText(), /noch kein Vokabeltrainer/);
    await a.page.keyboard.press('Tab');
    assert.ok(await a.page.evaluate(() => document.activeElement !== document.body));
    await a.page.screenshot({path: 'test-results/probe-desktop.png', fullPage: true});
    await a.page.setViewportSize({width: 390, height: 844});
    assert.ok(await a.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const heights = await a.page.locator('button, input, select').evaluateAll((controls) =>
      controls.filter((element) => element.getClientRects().length).map((element) => element.getBoundingClientRect().height));
    assert.ok(heights.every((height) => height >= 44), 'Touch controls must remain at least 44px tall');
    assert.ok(await byId(a.page, 'client-id').evaluate((element) => parseFloat(getComputedStyle(element).fontSize) >= 16));
    assert.equal(await byId(a.page, 'connect').isDisabled(), true);
    assert.equal(await byId(a.page, 'add-answer').isDisabled(), true);
    await a.page.screenshot({path: 'test-results/probe-mobile.png', fullPage: true});
  });

  const b = await device({width: 390, height: 844});
  await step('create, join, sync and repeat without double points', async () => {
    await connect(a.page);
    await byId(a.page, 'create-folder').click();
    await byId(a.page, 'add-answer').click();
    await metric(a.page, 'answer-count', 1);
    await metric(a.page, 'pending-count', 1);
    await byId(a.page, 'sync').click();
    await metric(a.page, 'pending-count', 0);
    await byId(a.page, 'repeat-upload').click();
    await connect(b.page);
    await byId(b.page, 'find-folders').click();
    await byId(b.page, 'folder-select').locator('option').nth(1).waitFor({state: 'attached'});
    await byId(b.page, 'folder-select').selectOption({index: 1});
    await byId(b.page, 'join-folder').click();
    await byId(b.page, 'sync').click();
    await metric(b.page, 'answer-count', 1);
    await metric(b.page, 'points', 10);
  });
  await step('offline save and reload retain real IndexedDB and cached app', async () => {
    await b.page.evaluate(() => navigator.serviceWorker.ready);
    await b.page.reload();
    await b.page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    b.control.offline = true;
    await b.context.setOffline(true);
    await byId(b.page, 'add-answer').click();
    await metric(b.page, 'answer-count', 2);
    await b.page.reload();
    await metric(b.page, 'answer-count', 2);
    await metric(b.page, 'pending-count', 1);
    assert.equal(await byId(b.page, 'sync').isDisabled(), true);
    b.control.offline = false;
    await b.context.setOffline(false);
    await connect(b.page);
    await byId(b.page, 'sync').click();
    await metric(b.page, 'pending-count', 0);
    await byId(a.page, 'sync').click();
    await metric(a.page, 'points', 20);
  });
  await step('lost remote upload response keeps queue and retries same ID', async () => {
    await byId(a.page, 'add-answer').click();
    a.control.loseNextUpload = true;
    await byId(a.page, 'sync').click();
    await byId(a.page, 'sync').click();
    await metric(a.page, 'pending-count', 0);
    await byId(b.page, 'sync').click();
    await metric(b.page, 'points', 30);
    assert.ok(fixture.writes.some((write) => write.duplicate));
  });
  await step('verified reset preserves late offline answers separately', async () => {
    b.control.offline = true;
    await b.context.setOffline(true);
    await byId(b.page, 'add-answer').click();
    await metric(b.page, 'answer-count', 4);
    await byId(a.page, 'preview-reset').click();
    await byId(a.page, 'confirm-reset').click();
    await metric(a.page, 'answer-count', 0);
    b.control.offline = false;
    await b.context.setOffline(false);
    await connect(b.page);
    await byId(b.page, 'sync').click();
    await metric(b.page, 'answer-count', 0);
    await metric(b.page, 'late-count', 1);
    await metric(b.page, 'pending-count', 0);
    await byId(a.page, 'sync').click();
    await metric(a.page, 'late-count', 1);
    await a.page.screenshot({path: 'test-results/probe-reset.png', fullPage: true});
  });
  await step('wrong Google account cannot receive queued local answers', async () => {
    await byId(a.page, 'add-answer').click();
    await metric(a.page, 'pending-count', 1);
    const before = fixture.writes.length;
    a.control.account = 'different-synthetic-account';
    await byId(a.page, 'sync').click();
    await a.page.locator('#status[data-tone="error"]').waitFor();
    await metric(a.page, 'pending-count', 1);
    assert.equal(fixture.writes.length, before);
    a.control.account = 'synthetic-account';
    await byId(a.page, 'sync').click();
    await metric(a.page, 'pending-count', 0);
  });
  await step('second tab cannot overwrite the active tab state', async () => {
    const second = await a.context.newPage();
    try {
      await second.goto(baseUrl);
      await second.locator('#status[data-tone="error"]').waitFor();
      assert.equal(await byId(second, 'add-answer').isDisabled(), true);
      await metric(a.page, 'answer-count', 1);
    } finally {
      await second.close();
    }
  });
  await step('token is absent from persisted browser state and program cache', async () => {
    for (const item of [a, b]) {
      assert.ok(!(await storageContents(item.page)).includes('synthetic-browser-token'));
      const cached = await item.page.evaluate(async () => {
        const urls = [];
        for (const name of await caches.keys()) {
          for (const request of await (await caches.open(name)).keys()) urls.push(request.url);
        }
        return urls;
      });
      assert.ok(cached.some((url) => url.endsWith('/src/probe/main.js')));
      assert.ok(cached.every((url) => new URL(url).origin === new URL(baseUrl).origin));
    }
  });
  assert.deepEqual(pageErrors, []);
  assert.deepEqual(fixture.unexpected, []);
  console.log(JSON.stringify({browser: browser.version(), scenarios: results, pageErrors}, null, 2));
} finally {
  await browser.close();
}
