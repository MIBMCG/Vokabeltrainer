import test from 'node:test';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';

import {encodeAvatarSource, rasterIssue} from '../../scripts/build-avatar-art.mjs';

const playwrightPath = process.env.PLAYWRIGHT_MODULE ?? 'playwright';
const executablePath = process.env.BROWSER_EXECUTABLE;

function moduleUrl(value) {
  if (/^[A-Za-z]:[\\/]/u.test(value)) return pathToFileURL(value).href;
  if (value.startsWith('.')) return new URL(value, import.meta.url).href;
  return value;
}

test('registered margins cannot make opaque or alpha-254 rectangles pass cutout validation', {timeout: 60_000}, async () => {
  const {chromium} = await import(moduleUrl(playwrightPath));
  const browser = await chromium.launch({headless: true, ...(executablePath ? {executablePath} : {})});
  const page = await browser.newPage();
  try {
    const makeRectangle = async (alpha) => page.evaluate(async (pixelAlpha) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1536;
      const context = canvas.getContext('2d');
      context.fillStyle = `rgba(209, 59, 66, ${pixelAlpha / 255})`;
      context.fillRect(0, 0, canvas.width, canvas.height);
      const blob = await new Promise((resolveBlob) => canvas.toBlob(resolveBlob, 'image/png'));
      return Array.from(new Uint8Array(await blob.arrayBuffer()));
    }, alpha);
    const encodeRectangle = async (alpha) => encodeAvatarSource(
      page, Buffer.from(await makeRectangle(alpha)),
      {scale: 0.5, x: 0, y: 0}, {width: 1024, height: 1536},
    );
    const opaque = await encodeRectangle(255);
    const almostOpaque = await encodeRectangle(254);

    assert.equal(opaque.sourceHasFullyTransparentPixel, false);
    assert.equal(opaque.hasVisiblePixel, true);
    assert.equal(rasterIssue(opaque), 'missing-transparency');
    assert.equal(almostOpaque.sourceHasFullyTransparentPixel, false);
    assert.equal(almostOpaque.hasVisiblePixel, true);
    assert.equal(rasterIssue(almostOpaque), 'missing-transparency');
  } finally {
    await browser.close();
  }
});
