import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {extname, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const ROOT = resolve('.');
const PLAYWRIGHT_MODULE = process.env.PLAYWRIGHT_MODULE ?? 'playwright';
const BROWSER_EXECUTABLE = process.env.BROWSER_EXECUTABLE;

function moduleUrl(value) {
  return /^[A-Za-z]:[\\/]/u.test(value) ? pathToFileURL(value).href : value;
}

function contentType(pathname) {
  return {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.webp': 'image/webp',
  }[extname(pathname)] ?? 'application/octet-stream';
}

async function fixtureServer() {
  const requests = [];
  const server = http.createServer(async (request, response) => {
    const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
    requests.push(pathname);
    if (pathname === '/fixture.html') {
      const body = Buffer.from('<!doctype html><meta charset="utf-8"><title>Avatar art fixture</title><main id="fixture"></main>');
      response.writeHead(200, {'Content-Type': contentType(pathname), 'Content-Length': body.length});
      response.end(body);
      return;
    }
    if (pathname === '/trainer/assets/avatar-shop/figure-horse-base-768.webp') {
      response.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
      response.end('synthetic missing large rendition');
      return;
    }
    const allowed = pathname.startsWith('/src/trainer/avatar/') || pathname.startsWith('/trainer/assets/avatar-shop/');
    const file = allowed ? resolve(ROOT, `.${pathname}`) : null;
    if (!file || !file.startsWith(ROOT)) {
      response.writeHead(404);
      response.end();
      return;
    }
    try {
      const body = await readFile(file);
      response.writeHead(200, {'Content-Type': contentType(pathname), 'Content-Length': body.length});
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end();
    }
  });
  await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
  const {port} = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    requests,
    close: () => new Promise((resolveClose, reject) => server.close((error) => (error ? reject(error) : resolveClose()))),
  };
}

test('animal cloaks remain visibly worn over the body instead of disappearing behind it', {timeout: 60_000}, async () => {
  const harness = await fixtureServer();
  const {chromium} = await import(moduleUrl(PLAYWRIGHT_MODULE));
  const browser = await chromium.launch({headless: true, ...(BROWSER_EXECUTABLE ? {executablePath: BROWSER_EXECUTABLE} : {})});
  const page = await browser.newPage({viewport: {width: 1320, height: 850}, deviceScaleFactor: 1});
  try {
    await page.goto(`${harness.baseUrl}/fixture.html`);
    const samples = await page.evaluate(async () => {
      const {figurePicture} = await import('/src/trainer/avatar/art.js');
      const pairs = [['horse','moon-body'],['unicorn-moon','moon-body'],['pegasus-star','moon-body'],['wolf-aurora','aurora-body'],['deer-mist','forest-body']];
      const root = document.querySelector('#fixture');
      root.style.cssText = 'display:flex;gap:20px;padding:20px;font:16px system-ui;background:#eaf0e8';
      for (const [figureId,itemId] of pairs) {
        const card = document.createElement('section');
        card.style.cssText = 'width:235px;flex-shrink:0';
        const title = document.createElement('h2');title.textContent = figureId;title.style.fontSize = '16px';
        const avatar = figurePicture({figureId,equipment:{body:itemId}}, {sizes:'235px'});
        avatar.dataset.fitItem = itemId;
        card.append(title,avatar);root.append(card);
      }
      await Promise.all([...document.images].map(image=>image.decode()));
      return [...document.querySelectorAll('.avatar-shop-art')].map(avatar=>{
        const pictures=[...avatar.querySelectorAll('picture')];
        const body=avatar.querySelector('[data-plane="base"] img');
        function pixels(images){
          const canvas=document.createElement('canvas');canvas.width=256;canvas.height=Math.round(256*body.naturalHeight/body.naturalWidth);
          const context=canvas.getContext('2d',{willReadFrequently:true});
          for(const image of images)context.drawImage(image,0,0,canvas.width,canvas.height);
          return context.getImageData(0,0,canvas.width,canvas.height).data;
        }
        const bare=pixels([body]),dressed=pixels(pictures.map(picture=>picture.querySelector('img')));
        let bodyPixels=0,visiblyClothedPixels=0;
        for(let i=0;i<bare.length;i+=4){
          if(bare[i+3]<240)continue;
          bodyPixels++;
          if(Math.abs(bare[i]-dressed[i])+Math.abs(bare[i+1]-dressed[i+1])+Math.abs(bare[i+2]-dressed[i+2])>=45)visiblyClothedPixels++;
        }
        return {figureId:avatar.dataset.figureId,itemId:avatar.dataset.fitItem,bodyPixels,visiblyClothedPixels,visibleBodyFraction:visiblyClothedPixels/bodyPixels};
      });
    });
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await mkdir(resolve('test-results/avatar-fit'),{recursive:true});
    const phase=process.env.AVATAR_FIT_PHASE==='before'?'before':'after';
    await page.screenshot({path:resolve(`test-results/avatar-fit/cloaks-${phase}.png`),fullPage:true});
    await writeFile(resolve(`test-results/avatar-fit/visibility-${phase}.json`),JSON.stringify(samples,null,2)+'\n');
    for (const sample of samples) {
      assert.ok(sample.bodyPixels > 0, `${sample.figureId} must have a visible opaque body to compare`);
    }
    const hidden=samples.filter(sample=>sample.visibleBodyFraction<0.025);
    assert.deepEqual(hidden,[],`Cloaks must have a visible attachment or drape on the body: ${JSON.stringify(hidden)}`);
  } finally {
    await browser.close();await harness.close();
  }
});

test('complete avatar catalogue renders every compatible item and every human colour at mobile width', {timeout: 60_000}, async () => {
  const harness = await fixtureServer();
  const {chromium} = await import(moduleUrl(PLAYWRIGHT_MODULE));
  const browser = await chromium.launch({headless: true, ...(BROWSER_EXECUTABLE ? {executablePath: BROWSER_EXECUTABLE} : {})});
  const context = await browser.newContext({viewport: {width: 320, height: 800}, deviceScaleFactor: 2});
  const page = await context.newPage();
  try {
    await page.goto(`${harness.baseUrl}/fixture.html`);
    const coverage = await page.evaluate(async () => {
      const {AVATAR_ART} = await import('/src/trainer/avatar/art-manifest.js');
      return AVATAR_ART.coverage;
    });
    assert.equal(coverage.ready, true, `unfinished art: ${coverage.missing.join(', ')}`);
    const counts = await page.evaluate(async () => {
      const {figurePicture, figureLayers} = await import('/src/trainer/avatar/art.js');
      const {FIGURES, ITEMS, isCompatible} = await import('/src/trainer/avatar/catalog.js');
      const root = document.querySelector('#fixture');
      const style = document.createElement('style');
      style.textContent = `*{box-sizing:border-box}body{margin:0;background:#f5efdf;color:#183e47;font:16px system-ui}main{padding:20px}h1{font-size:30px;margin:0 0 8px}p{margin:0 0 24px}.overview,.checks{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:18px}.card{border:1px solid #bad4cf;background:linear-gradient(#fff,#e9f3e9);border-radius:22px;padding:16px;min-width:0}.card h2{font-size:18px;margin:0 0 12px}.card .avatar-shop-art{height:320px;max-width:100%;margin:auto}.checks{margin-top:30px}.checks .avatar-shop-art{height:220px}small{display:block;margin-top:8px;color:#48616a}`;
      document.head.append(style);
      root.innerHTML = '<h1>Deine Abenteuerfiguren</h1><p>Bildvorschau · Figurenwahl und Punkteshop noch in Entwicklung</p><div class="overview"></div><div class="checks"></div>';
      const overview = root.querySelector('.overview');
      const checks = root.querySelector('.checks');
      function card(parent, title, selection, note = '') {
        const section = document.createElement('section');
        section.className = 'card';
        const heading = document.createElement('h2');
        heading.textContent = title;
        section.append(heading, figurePicture(selection, {sizes: '256px', animations: false}));
        if (note) { const label = document.createElement('small'); label.textContent = note; section.append(label); }
        parent.append(section);
      }
      let pairs = 0;
      let variants = 0;
      let missing = 0;
      for (const figure of FIGURES) {
        const compatible = ITEMS.filter(item => isCompatible(item.id, figure.id));
        const setId = figure.group === 'equine' ? (figure.id === 'pegasus-star' ? 'stars' : 'moon') : compatible.find(item => item.setId)?.setId;
        const equipment = Object.fromEntries(compatible.filter(item => item.setId === setId && setId).map(item => [item.slot, item.id]));
        if (figure.group === 'human') equipment.clothing = 'knight-clothing';
        card(overview, figure.name, {figureId: figure.id, skin: 0, clothing: 2, equipment}, 'Vorschau mit passender Ausrüstung');
        for (const item of compatible) {
          const selection = {figureId: figure.id, skin: 0, clothing: 2, equipment: {[item.slot]: item.id}};
          if (!figureLayers(selection).some(layer => layer.itemId === item.id)) missing++;
          card(checks, `${figure.name} · ${item.name}`, selection);
          pairs++;
        }
        if (figure.group === 'human') for (let skin = 0; skin < 4; skin++) for (let clothing = 0; clothing < 6; clothing++) {
          card(checks, `${figure.name} · ${skin + 1}/${clothing + 1}`, {figureId: figure.id, skin, clothing, equipment: {}});
          variants++;
        }
      }
      return {figures: FIGURES.length, pairs, variants, missing};
    });
    assert.deepEqual(counts, {figures: 13, pairs: 62, variants: 48, missing: 0});
    await page.waitForFunction(() => [...document.images].every(img => img.complete && img.naturalWidth > 0));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.equal(await page.locator('.avatar-shop-placeholder').count(), 0);
    await mkdir(resolve('test-results/avatar-art'), {recursive: true});
    await page.screenshot({path: resolve('test-results/avatar-art/catalogue-mobile.png')});
    await page.setViewportSize({width: 1320, height: 1600});
    await page.locator('.checks').evaluate(node => { node.hidden = true; node.style.display = 'none'; });
    await page.locator('.overview img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.screenshot({path: resolve('test-results/avatar-art/catalogue-overview.png'), fullPage: true});
  } finally {
    await context.close();
    await browser.close();
    await harness.close();
  }
});

test('figurePicture keeps fixed layer coordinates and falls back once when a large rendition is missing', {timeout: 60_000}, async () => {
  const harness = await fixtureServer();
  const {chromium} = await import(moduleUrl(PLAYWRIGHT_MODULE));
  const browser = await chromium.launch({headless: true, ...(BROWSER_EXECUTABLE ? {executablePath: BROWSER_EXECUTABLE} : {})});
  const context = await browser.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2});
  const page = await context.newPage();
  try {
    await page.goto(`${harness.baseUrl}/fixture.html`);
    const mounted = await page.evaluate(async () => {
      const {figurePicture} = await import('/src/trainer/avatar/art.js');
      const frame = document.createElement('section');
      frame.style.width = '320px';
      const horse = figurePicture({
        figureId: 'horse', skin: 0, clothing: 0, equipment: {},
      }, {sizes: '320px', animations: false});
      horse.id = 'horse-art';
      const boy = figurePicture({
        figureId: 'explorer-boy', skin: 0, clothing: 2, equipment: {},
      }, {sizes: '320px', animations: false});
      boy.id = 'boy-art';
      const knight = figurePicture({
        figureId: 'explorer-boy', skin: 0, clothing: 2,
        equipment: {clothing: 'knight-clothing'},
      }, {sizes: '320px', animations: false});
      knight.id = 'knight-art';
      const legacy = figurePicture({
        figureId: 'explorer-boy', skin: 0, clothing: 2,
        equipment: {head: 'cap', back: 'backpack'},
      }, {sizes: '320px', animations: false});
      legacy.id = 'legacy-art';
      const invalid = figurePicture({
        figureId: '<img src=x onerror=alert(1)>', equipment: {},
      });
      invalid.id = 'invalid-art';
      frame.append(horse, boy, knight, legacy, invalid);
      document.querySelector('#fixture').append(frame);
      return {
        horseLabel: horse.getAttribute('aria-label'),
        boyLabel: boy.getAttribute('aria-label'),
        knightLabel: knight.getAttribute('aria-label'),
        legacyLabel: legacy.getAttribute('aria-label'),
        invalidLabel: invalid.getAttribute('aria-label'),
      };
    });
    assert.deepEqual(mounted, {
      horseLabel: 'Pferd', boyLabel: 'Entdecker', knightLabel: 'Entdecker', legacyLabel: 'Entdecker',
      invalidLabel: 'Avatarbild nicht verfügbar',
    });
    await page.waitForFunction(() => {
      const image = document.querySelector('#horse-art img');
      return image?.complete && image.naturalWidth > 0 && image.dataset.fallback === 'true';
    });
    assert.equal(await page.locator('#horse-art img').count(), 1);
    await page.waitForFunction(() => [...document.querySelectorAll('#boy-art img')]
      .every((image) => image.complete && image.naturalWidth > 0));
    assert.equal(await page.locator('#boy-art img').count(), 2);
    assert.deepEqual(await page.locator('#boy-art picture').evaluateAll((pictures) => pictures.map((node) => node.dataset.plane)), ['base', 'clothing']);
    await page.waitForFunction(() => [...document.querySelectorAll('#knight-art img')]
      .every((image) => image.complete && image.naturalWidth > 0));
    assert.equal(await page.locator('#knight-art img').count(), 2);
    assert.deepEqual(await page.locator('#knight-art picture').evaluateAll((pictures) => pictures.map((node) => node.dataset.plane)), ['base', 'front']);
    assert.equal(await page.locator('#knight-art picture[data-plane="front"]').getAttribute('data-art-key'), 'item-knight-clothing-explorer-boy-front');
    await page.waitForFunction(() => [...document.querySelectorAll('#legacy-art img')]
      .every((image) => image.complete && image.naturalWidth > 0));
    assert.equal(await page.locator('#legacy-art img').count(), 4);
    assert.deepEqual(await page.locator('#legacy-art picture').evaluateAll((pictures) => pictures.map((node) => node.dataset.plane)), ['rear', 'base', 'clothing', 'front']);
    assert.equal(await page.locator('#invalid-art img').count(), 0);
    assert.equal(await page.locator('#invalid-art .avatar-shop-placeholder').textContent(), 'Bild folgt');
    assert.equal(await page.locator('#horse-art').getAttribute('data-animate'), 'false');
    assert.match(await page.locator('#horse-art img').evaluate((image) => image.currentSrc), /-256\.webp$/u);
    assert.equal(await page.locator('#horse-art img').evaluate((image) => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d', {willReadFrequently: true});
      context.drawImage(image, 0, 0);
      return context.getImageData(0, 0, 1, 1).data[3] < 255;
    }), true);
    assert.equal(await page.locator('#horse-art').evaluate((host) => {
      const outer = host.getBoundingClientRect();
      return [...host.querySelectorAll('picture')].every((node) => {
        const box = node.getBoundingClientRect();
        return Math.round(box.left - outer.left) === 0
          && Math.round(box.top - outer.top) === 0
          && Math.round(box.width) === Math.round(outer.width)
          && Math.round(box.height) === Math.round(outer.height);
      });
    }), true);
    assert.equal(await page.locator('#boy-art').evaluate((host) => {
      const outer = host.getBoundingClientRect();
      return [...host.querySelectorAll('picture')].every((node) => {
        const box = node.getBoundingClientRect();
        return Math.round(box.left - outer.left) === 0
          && Math.round(box.top - outer.top) === 0
          && Math.round(box.width) === Math.round(outer.width)
          && Math.round(box.height) === Math.round(outer.height);
      });
    }), true);
    const anchors = await page.evaluate(async () => {
      async function alphaBounds(url) {
        const image = new Image();
        image.src = url;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d', {willReadFrequently: true});
        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        let left = canvas.width;
        let top = canvas.height;
        let right = -1;
        let bottom = -1;
        for (let y = 0; y < canvas.height; y += 1) {
          for (let x = 0; x < canvas.width; x += 1) {
            if (pixels[(y * canvas.width + x) * 4 + 3] === 0) continue;
            left = Math.min(left, x);
            top = Math.min(top, y);
            right = Math.max(right, x);
            bottom = Math.max(bottom, y);
          }
        }
        return {width: canvas.width, height: canvas.height, left, top, right, bottom};
      }
      return Promise.all([256, 768].map((width) => alphaBounds(
        `/trainer/assets/avatar-shop/figure-explorer-boy-clothing-2-${width}.webp`,
      )));
    });
    const [small, large] = anchors;
    for (const key of ['left', 'top', 'right', 'bottom']) {
      const smallExtent = key === 'left' || key === 'right' ? small.width : small.height;
      const largeExtent = key === 'left' || key === 'right' ? large.width : large.height;
      assert.ok(Math.abs(small[key] / smallExtent - large[key] / largeExtent) < 0.01, `${key} registration drifted`);
    }
    assert.ok(large.left >= Math.floor(205 / 1086 * large.width));
    assert.ok(large.top >= Math.floor(82 / 1448 * large.height));
    assert.ok(large.right <= Math.ceil(919.588 / 1086 * large.width));
    assert.ok(large.bottom <= Math.ceil(1034.784 / 1448 * large.height));
    assert.equal(harness.requests.filter((path) => path === '/trainer/assets/avatar-shop/figure-horse-base-768.webp').length, 1);
    await mkdir(resolve('test-results', 'avatar-art'), {recursive: true});
    await page.screenshot({path: resolve('test-results', 'avatar-art', 'fixed-canvas-fallback.png'), fullPage: true});
  } finally {
    await context.close();
    await browser.close();
    await harness.close();
  }
});
