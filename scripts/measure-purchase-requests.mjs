// Synthetic request diagnostic: no real browser, real network, or credentials.
// Run: node scripts/measure-purchase-requests.mjs
// Optional: SYNTHETIC_HTTP_DELAY_MS is an integer from 0 through 25.
// PURCHASE_DIAGNOSTIC_MODE=server includes the real server auth adapter and proxy.
// PURCHASE_HTTP_DELAY_MS (0..1000) adds latency only to preview/confirm requests.
// Local timings exclude the browser, IndexedDB, D1 latency and real Google latency.
import assert from 'node:assert/strict';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {AsyncLocalStorage} from 'node:async_hooks';
import {fileURLToPath} from 'node:url';
import {createGoogleFixture} from '../tests/browser/google-fixture.mjs';
import {createDriveClient} from '../src/drive/client.js';
import {createServerAuth} from '../src/drive/server-auth.js';
import {createAuthService} from '../server/auth-service.js';
import {createCipher, sha256} from '../server/crypto.js';
import {createCommands} from '../src/trainer/commands.js';
import {backupLedger, parseBackup} from '../src/trainer/backup/format.js';
import {createPurchaseTransport} from '../src/trainer/purchases/transport.js';
import {createPurchaseService} from '../src/trainer/purchases/service.js';
import {createCommerceIntegration} from '../src/trainer/purchases/integration.js';
import {createProductSync} from '../src/trainer/sync/drive.js';
import {digest} from '../src/trainer/model/canonical.js';
import {memoryStore, productState, sequenceIds} from '../tests/trainer/backup-fixtures.js';

globalThis.fetch = () => {throw new Error('Real network is forbidden in this diagnostic.');};
const delayInput = (process.env.SYNTHETIC_HTTP_DELAY_MS ?? '0').trim();
const delayMs = Number(delayInput);
if (!/^\d+$/u.test(delayInput) || !Number.isSafeInteger(delayMs) || delayMs > 25) {
  throw new Error('SYNTHETIC_HTTP_DELAY_MS must be an integer from 0 through 25.');
}
const mode = process.env.PURCHASE_DIAGNOSTIC_MODE ?? 'direct';
if (!['direct', 'server'].includes(mode)) throw new Error('Unknown diagnostic mode.');
const purchaseDelayInput = (process.env.PURCHASE_HTTP_DELAY_MS ?? '0').trim();
const purchaseDelayMs = Number(purchaseDelayInput);
if (!/^\d+$/u.test(purchaseDelayInput) || !Number.isSafeInteger(purchaseDelayMs) || purchaseDelayMs > 1000) {
  throw new Error('PURCHASE_HTTP_DELAY_MS must be an integer from 0 through 1000.');
}
const google = createGoogleFixture();
const routes = new Map();
await google.attach({async exposeFunction() {}, async route(pattern, callback) {routes.set(pattern, callback);}});
const handler = routes.get('https://www.googleapis.com/**');
assert.equal(typeof handler, 'function');
const spans = [];
const requests = [];
const context = new AsyncLocalStorage();
let topPhase = 'setup';
let active = 0;
let phaseMaximum = 0;
// Ordering counters describe this synthetic run, not a measured real-network critical path.
let tick = 0;
let phaseTick = 0;
async function traced(name, operation) {
  const chain = [...(context.getStore() ?? []), name];
  const span = {phase: topPhase, chain, startMs: performance.now(), firstRequest: requests.length};
  spans.push(span);
  try {return await context.run(chain, operation);}
  finally {span.endMs = performance.now(); span.requests = requests.length - span.firstRequest;}
}
function wrap(object, prefix) {
  return Object.fromEntries(Object.entries(object).map(([key, value]) => [key,
    typeof value !== 'function' ? value : (...args) => traced(`${prefix}.${key}`, () => value(...args))]));
}
const googleFetch = async (url, init = {}) => {
  const parsed = new URL(url);
  assert.equal(parsed.origin, 'https://www.googleapis.com');
  const headers = Object.fromEntries(new Headers(init.headers).entries());
  const file = google.files.get(parsed.pathname.split('/').at(-1));
  const request = {phase: topPhase, chain: context.getStore() ?? [], method: init.method ?? 'GET',
    path: parsed.pathname, media: parsed.searchParams.get('alt') === 'media',
    kind: file?.metadata.appProperties?.kind ?? null,
    startMs: performance.now(), startTick: tick};
  requests.push(request);
  active++; phaseMaximum = Math.max(phaseMaximum, active);
  let result;
  try {
    const requestDelay = delayMs + (['preview', 'confirm'].includes(topPhase) ? purchaseDelayMs : 0);
    if (requestDelay > 0) await new Promise(resolve => setTimeout(resolve, requestDelay));
    const body = typeof init.body === 'string' ? init.body : init.body ? new TextDecoder().decode(init.body) : undefined;
    await handler({
      request: () => ({url: () => parsed.href, method: () => request.method,
        headers: () => headers, postData: () => body, postDataJSON: () => JSON.parse(body)}),
      fulfill: async ({status = 200, headers: responseHeaders, body}) => {result = new Response(body, {status, headers: responseHeaders});},
      abort: async reason => {throw new Error(`Synthetic abort: ${reason}`);},
    });
    assert.ok(result instanceof Response);
    return result;
  } finally {
    active--; tick = Math.max(tick, request.startTick + 1); request.endTick = tick; request.endMs = performance.now();
  }
};
let fetchImpl = googleFetch;
let getToken = async () => 'synthetic-browser-token-1';
let getAccountId;
if (mode === 'server') {
  const origin = 'https://trainer.example';
  const cookie = 'synthetic-diagnostic-session';
  const sessionId = await sha256(cookie);
  const encryptionKey = Buffer.alloc(32, 9).toString('base64');
  const cipher = createCipher(encryptionKey);
  let sessionRecord = {version: 1, expiresAt: Date.now() + 86_400_000,
    payload: await cipher.encrypt({accessToken: 'synthetic-browser-token-1', refreshToken: 'synthetic-refresh',
      tokenExpiresAt: Date.now() + 3_600_000, accountId: 'synthetic-account'})};
  const sessionStore = {
    async readSession(id) { return id === sessionId ? sessionRecord : null; },
    async deleteSession(id) { if (id === sessionId) sessionRecord = null; },
    async casSession(id, version, record) {
      if (id !== sessionId || sessionRecord?.version !== version) return false;
      sessionRecord = {...record, version: version + 1}; return true;
    },
  };
  const server = createAuthService({store: sessionStore, fetchImpl: googleFetch,
    config: {origin, clientId: 'synthetic-client', clientSecret: 'synthetic-secret', encryptionKey}});
  const auth = createServerAuth({fetchImpl: async (path, init) => {
    const headers = new Headers(init.headers);
    headers.set('Cookie', `__Host-vt_session=${cookie}`); headers.set('Origin', origin);
    return server.fetch(new Request(new URL(path, origin), {...init, headers}));
  }});
  assert.equal(await auth.resume(), true);
  getToken = () => auth.getToken();
  fetchImpl = (url, init) => auth.fetchDrive(url, init);
  getAccountId = typeof auth.accountIdForMarker === 'function' ? marker => auth.accountIdForMarker(marker) : undefined;
}
const drive = createDriveClient({fetchImpl, getToken, getAccountId});
const ledger = backupLedger(await parseBackup(await readFile(new URL('../tests/fixtures/purchase-demo-1600.json', import.meta.url), 'utf8')));
const initial = productState(ledger, {outbox: [], deviceId: 'diagnostic-device'});
initial.storageVersion = 2;
const store = memoryStore(initial);
const now = () => new Date('2026-09-28T20:00:00.000Z');
const commands = await createCommands({store, now, id: sequenceIds('diagnostic-command'), deviceId: 'diagnostic-device', onChange() {}});
const transportFor = input => wrap(createPurchaseTransport({fetchImpl, getToken, getAccountId, ...input}), 'transport');
let rawSync;
const integration = wrap(createCommerceIntegration({commands, drive, transportFor,
  learningSync: () => traced('product.syncLearning', () => rawSync.syncLearning()), now, id: sequenceIds('diagnostic-integration')}), 'integration');
rawSync = createProductSync({drive, store, commands, now, id: sequenceIds('diagnostic-sync'), commerce: integration, onStatus() {}});
const phases = [];
async function phase(name, run) {
  topPhase = name; phaseMaximum = 0; phaseTick = tick;
  const before = requests.length, start = performance.now();
  const result = await run();
  const rows = requests.slice(before);
  const counts = Object.create(null);
  for (const row of rows) {
    const category = row.path.endsWith('/about') ? 'account' : row.path.endsWith('/generateIds') ? 'reserveId'
      : row.path === '/drive/v3/files' && row.method === 'GET' ? 'listFiles'
        : row.method !== 'GET' ? row.method : row.media ? 'media' : 'metadata';
    counts[category] = (counts[category] ?? 0) + 1;
  }
  const item = {name, elapsedMs: Math.round(performance.now() - start), httpCount: rows.length,
    maximumConcurrentRequests: phaseMaximum, syntheticDependencyTicks: tick - phaseTick, counts};
  phases.push(item); console.log(JSON.stringify(item)); return result;
}
await phase('datasetSetup', async () => {
  await rawSync.createDataset('Isolated synthetic purchase diagnostic');
  assert.ok(commands.getState().binding, JSON.stringify(rawSync.getStatus()));
});
const state = commands.getState();
const descriptorHash = await digest(state.ledger.descriptor);
const service = createPurchaseService({commands, transport: transportFor({binding: state.binding, descriptorHash}),
  sync: integration, now, id: sequenceIds('diagnostic-purchase'), onStatus() {}});
await phase('activation', async () => {
  const prepared = await service.prepareActivation({binding: state.binding, descriptorHash});
  const confirmed = await service.confirmActivation(prepared.operationId);
  assert.equal(confirmed.phase, 'confirmed');
});
await phase('getViewBefore', () => service.getView());
const preview = await phase('preview', () => service.preview({profileId: 'purchase-demo-profile', articleId: 'evolution:dragon:2'}));
assert.equal(preview.availablePoints, 1600);
const result = await phase('confirm', () => service.confirm(preview));
assert.equal(result.status, 'confirmed');
const view = await phase('getViewAfter', () => service.getView());
assert.equal(view.accounts['purchase-demo-profile'].availablePoints, 1400);
assert.equal(view.accounts['purchase-demo-profile'].earnedPoints, 1600);
assert.equal(google.unexpected.length, 0);
const report = {syntheticOnly: true, mode, delayMs, purchaseDelayMs, eventCount: ledger.events.length, phases,
  spans: spans.map(span => ({...span, elapsedMs: Math.round(span.endMs - span.startMs)})), requests};
const outputDirectory = new URL('../.superpowers/', import.meta.url);
await mkdir(outputDirectory, {recursive: true});
const output = new URL(`purchase-latency-measure${mode === 'server' ? '-server' : ''}.json`, outputDirectory);
await writeFile(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({result: result.status, points: view.accounts['purchase-demo-profile'], report: fileURLToPath(output)}));
