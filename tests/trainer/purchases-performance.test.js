import test from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';

const execute = promisify(execFile);
const repository = fileURLToPath(new URL('../../', import.meta.url));

test('a complete 1600-point purchase stays within its network request budget', async () => {
  // Reintroducing duplicate full syncs or per-file ID reservations breaks this budget.
  // The diagnostic runs the actual services and transport against a local HTTP double.
  const {stdout} = await execute(process.execPath, ['scripts/measure-purchase-requests.mjs'], {
    cwd: repository,
    env: {...process.env, SYNTHETIC_HTTP_DELAY_MS: '0', PURCHASE_DIAGNOSTIC_MODE: 'direct', PURCHASE_HTTP_DELAY_MS: '0'},
    timeout: 60_000,
    maxBuffer: 1024 * 1024,
  });
  const rows = stdout.trim().split(/\r?\n/u).map(line => JSON.parse(line));
  const confirmation = rows.find(row => row.name === 'confirm');
  assert.ok(confirmation, 'the complete confirmation must have been measured');
  assert.ok(confirmation.httpCount <= 70,
    `confirmation used ${confirmation.httpCount} requests; budget is 70`);
  const result = rows.at(-1);
  assert.equal(result.result, 'confirmed');
  assert.equal(result.points.availablePoints, 1400);
  assert.equal(result.points.earnedPoints, 1600);
});

test('server purchase opens locally and stays under 20 seconds with 500ms network latency', async () => {
  const {stdout} = await execute(process.execPath, ['scripts/measure-purchase-requests.mjs'], {
    cwd: repository,
    env: {...process.env, SYNTHETIC_HTTP_DELAY_MS: '0', PURCHASE_DIAGNOSTIC_MODE: 'server', PURCHASE_HTTP_DELAY_MS: '500'},
    timeout: 60_000, maxBuffer: 1024 * 1024,
  });
  const rows = stdout.trim().split(/\r?\n/u).map(line => JSON.parse(line));
  const preview = rows.find(row => row.name === 'preview');
  const confirmation = rows.find(row => row.name === 'confirm');
  assert.equal(preview.httpCount, 0, 'opening the purchase must not wait for a full Drive sync');
  const fullDuration = preview.elapsedMs + confirmation.elapsedMs;
  assert.ok(fullDuration < 20_000, `preview and confirmation took ${fullDuration}ms; budget is 20000ms`);
  assert.ok(confirmation.httpCount <= 35, `confirmation used ${confirmation.httpCount} requests; budget is 35`);
  assert.equal(confirmation.counts.account ?? 0, 0, 'the server session already binds every proxy request to its Google account');
  assert.equal(rows.at(-1).result, 'confirmed');
  assert.equal(rows.at(-1).points.availablePoints, 1400);
  assert.equal(rows.at(-1).points.earnedPoints, 1600);
});
