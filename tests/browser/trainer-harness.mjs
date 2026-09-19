import {pathToFileURL} from 'node:url';
import {readFile} from 'node:fs/promises';

import {createProbeServer} from '../../scripts/serve.mjs';
import {createGoogleFixture} from './google-fixture.mjs';

const playwrightPath = process.env.PLAYWRIGHT_MODULE
  ?? 'playwright';
const executablePath = process.env.BROWSER_EXECUTABLE;

function moduleUrl() {
  if (playwrightPath.startsWith('.')) return new URL(playwrightPath, import.meta.url).href;
  if (/^[A-Za-z]:[\\/]/u.test(playwrightPath)) return pathToFileURL(playwrightPath).href;
  return playwrightPath;
}

export async function createTrainerHarness({basePath = ''} = {}) {
  const {chromium} = await import(moduleUrl());
  const server = createProbeServer({basePath});
  const productWorker = await readFile(new URL('../../trainer/sw.js', import.meta.url), 'utf8');
  let workerVersion = 'v7';
  let workerActivationDelayMs = 0;
  let blockLargeArt = false;
  const originalRequest = server.listeners('request')[0];
  server.removeAllListeners('request');
  server.on('request', (request, response) => {
    const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
    if (blockLargeArt && /\/trainer\/assets\/art\/.*-(?:512|768|960|1086|1440)\.webp$/u.test(pathname)) {
      response.writeHead(503, {'Content-Type': 'text/plain; charset=utf-8'});
      response.end('Synthetic large-art failure.');
      return;
    }
    if (pathname === `${basePath}/trainer/sw.js` && workerVersion !== 'v7') {
      let source = productWorker.replace(
        'const CACHE_NAME = `${CACHE_OWNER}v7`;',
        `const CACHE_NAME = \`\${CACHE_OWNER}${workerVersion}\`;`,
      );
      if (source === productWorker) throw new Error('Synthetic worker version marker was not replaced.');
      if (workerActivationDelayMs > 0) {
        const beforeDelay = source;
        source = source.replace(
          'event.waitUntil(self.skipWaiting());',
          `event.waitUntil(new Promise((resolveActivation) => setTimeout(resolveActivation, ${workerActivationDelayMs}))\n      .then(() => self.skipWaiting()));`,
        );
        if (source === beforeDelay) throw new Error('Synthetic activation delay marker was not replaced.');
      }
      response.writeHead(200, {
        'Cache-Control': 'no-cache',
        'Content-Type': 'text/javascript; charset=utf-8',
        'Content-Length': Buffer.byteLength(source),
      });
      response.end(request.method === 'HEAD' ? undefined : source);
      return;
    }
    originalRequest(request, response);
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}${basePath}/trainer/`;
  let serverStopped = false;
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      ...(executablePath ? {executablePath} : {}),
      ignoreDefaultArgs: ['--disable-back-forward-cache'],
    });
  } catch (error) {
    await new Promise((resolve) => server.close(resolve));
    throw error;
  }
  const google = createGoogleFixture();
  const contexts = new Set();

  const stopServer = async () => {
    if (serverStopped) return;
    serverStopped = true;
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  };

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
    async newPersistentDevice({userDataDir, viewport = {width: 390, height: 844}}) {
      const context = await chromium.launchPersistentContext(userDataDir, {
        headless: true,
        ...(executablePath ? {executablePath} : {}),
        viewport,
        ignoreDefaultArgs: ['--disable-back-forward-cache'],
      });
      contexts.add(context);
      const controls = await google.attach(context);
      const pages = context.pages();
      const page = pages[0] ?? await context.newPage();
      return {context, page, controls};
    },
    stopServer,
    setServiceWorkerVersion(version, {activationDelayMs = 0} = {}) {
      if (!/^v(?:[8-9]|[1-9][0-9]+)$/u.test(version)) throw new TypeError('Synthetic worker version must be v8 or later.');
      if (!Number.isSafeInteger(activationDelayMs) || activationDelayMs < 0) {
        throw new TypeError('Synthetic activation delay must be a non-negative integer.');
      }
      workerVersion = version;
      workerActivationDelayMs = activationDelayMs;
    },
    blockLargeArt() {
      blockLargeArt = true;
    },
    async close() {
      await Promise.allSettled([...contexts].map((context) => context.close()));
      await browser.close();
      await stopServer();
    },
  };
}
