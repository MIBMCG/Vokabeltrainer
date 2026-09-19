import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdir, readFile} from 'node:fs/promises';
import {extname, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const ROOT = resolve('.');
const PLAYWRIGHT_MODULE = process.env.PLAYWRIGHT_MODULE ?? 'playwright';
const BROWSER_EXECUTABLE = process.env.BROWSER_EXECUTABLE;
const PHASE = process.env.AVATAR_NECK_PHASE === 'before' ? 'before' : 'after';

function moduleUrl(value) {
  return /^[A-Za-z]:[\\/]/u.test(value) ? pathToFileURL(value).href : value;
}

function type(pathname) {
  return {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.webp': 'image/webp'}[extname(pathname)] ?? 'application/octet-stream';
}

async function fixtureServer() {
  const server = http.createServer(async (request, response) => {
    const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
    if (pathname === '/fixture.html') {
      const body = Buffer.from('<!doctype html><meta charset="utf-8"><title>Avatar neck QA</title><main></main>');
      response.writeHead(200, {'Content-Type': type(pathname), 'Content-Length': body.length});
      response.end(body);
      return;
    }
    const allowed = pathname.startsWith('/src/trainer/ui/') || pathname.startsWith('/trainer/assets/art/');
    const file = allowed ? resolve(ROOT, `.${pathname}`) : null;
    if (!file || !file.startsWith(ROOT)) {
      response.writeHead(404);
      response.end();
      return;
    }
    try {
      const body = await readFile(file);
      response.writeHead(200, {'Content-Type': type(pathname), 'Content-Length': body.length});
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end();
    }
  });
  await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
  return {
    url: `http://127.0.0.1:${server.address().port}/fixture.html`,
    close: () => new Promise((resolveClose, reject) => server.close((error) => error ? reject(error) : resolveClose())),
  };
}

test('all six product clothing colours keep the explorer neck opening transparent', {timeout: 60_000}, async () => {
  const fixture = await fixtureServer();
  const {chromium} = await import(moduleUrl(PLAYWRIGHT_MODULE));
  const browser = await chromium.launch({headless: true, ...(BROWSER_EXECUTABLE ? {executablePath: BROWSER_EXECUTABLE} : {})});
  const page = await browser.newPage({viewport: {width: 1500, height: 900}, deviceScaleFactor: 1});
  try {
    await page.goto(fixture.url);
    await page.addStyleTag({content: `
      body{margin:18px;background:#dce8e5;color:#17323b;font:16px Arial}
      main{display:grid;grid-template-columns:repeat(6,220px);gap:14px}
      article{background:white;border:2px solid #6c8d93;border-radius:12px;padding:9px;text-align:center}
      .avatar-art{position:relative;display:block;aspect-ratio:1086/1448;background:#f7faf8}
      .avatar-layer{position:absolute;inset:0;display:block;width:100%;height:100%}
      .avatar-layer img{display:block;width:100%;height:100%;object-fit:contain}
    `});
    await page.evaluate(async () => {
      const {avatarPicture} = await import('/src/trainer/ui/art.js');
      const main = document.querySelector('main');
      for (let clothing = 0; clothing < 6; clothing += 1) {
        const card = document.createElement('article');
        card.innerHTML = `<strong>Farbe ${clothing + 1}</strong>`;
        const avatar = avatarPicture({skin: 0, clothing}, {sizes: '220px', animations: false});
        avatar.dataset.clothing = String(clothing);
        card.append(avatar);
        main.append(card);
      }
    });
    await page.waitForFunction(() => [...document.images].length === 12
      && [...document.images].every((image) => image.complete && image.naturalWidth > 0));
    await mkdir(resolve('test-results', 'avatar-neck'), {recursive: true});
    await page.screenshot({path: resolve('test-results', 'avatar-neck', `${PHASE}.png`), fullPage: true});

    const samples = await page.locator('.avatar-art').evaluateAll((avatars) => avatars.map((avatar) => {
      const sample = (image) => {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d', {willReadFrequently: true});
        context.drawImage(image, 0, 0);
        const x = Math.round(canvas.width * 0.5);
        const y = Math.round(canvas.height * 0.26);
        return context.getImageData(x, y, 1, 1).data[3];
      };
      const layers = [...avatar.querySelectorAll('picture')];
      return {
        clothing: Number(avatar.dataset.clothing),
        keys: layers.map((layer) => layer.dataset.artKey),
        skinAlpha: sample(layers[0].querySelector('img')),
        clothingAlpha: sample(layers[1].querySelector('img')),
      };
    }));

    for (const value of samples) {
      assert.deepEqual(value.keys, ['avatar-skin-0', `avatar-clothing-${value.clothing}`]);
      assert.ok(value.skinAlpha >= 240, `skin ${value.clothing} must remain visible at neck anchor`);
      assert.ok(value.clothingAlpha <= 15, `clothing ${value.clothing} closes neck opening with alpha ${value.clothingAlpha}`);
    }
  } finally {
    await browser.close();
    await fixture.close();
  }
});
