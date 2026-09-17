import {pathToFileURL} from 'node:url';

import {createProbeServer} from '../../scripts/serve.mjs';
import {createGoogleFixture} from './google-fixture.mjs';

const playwrightPath = process.env.PLAYWRIGHT_MODULE
  ?? '../../.superpowers/sdd/2026-09-16-google-drive-probe/browser-runtime/node_modules/playwright/index.mjs';
const executablePath = process.env.BROWSER_EXECUTABLE
  ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

function moduleUrl() {
  if (playwrightPath.startsWith('.')) return new URL(playwrightPath, import.meta.url).href;
  if (/^[A-Za-z]:[\\/]/u.test(playwrightPath)) return pathToFileURL(playwrightPath).href;
  return playwrightPath;
}

export async function createTrainerHarness() {
  const {chromium} = await import(moduleUrl());
  const server = createProbeServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/trainer/`;
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath,
      ignoreDefaultArgs: ['--disable-back-forward-cache'],
    });
  } catch (error) {
    await new Promise((resolve) => server.close(resolve));
    throw error;
  }
  const google = createGoogleFixture();
  const contexts = new Set();

  return {
    baseUrl,
    browser,
    google,
    async newDevice({viewport = {width: 390, height: 844}} = {}) {
      const context = await browser.newContext({viewport});
      contexts.add(context);
      const controls = await google.attach(context);
      const page = await context.newPage();
      return {context, page, controls};
    },
    async close() {
      await Promise.allSettled([...contexts].map((context) => context.close()));
      await browser.close();
      await new Promise((resolve) => server.close(resolve));
    },
  };
}
