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
    env: {...process.env, SYNTHETIC_HTTP_DELAY_MS: '0'},
    timeout: 60_000,
    maxBuffer: 1024 * 1024,
  });
  const rows = stdout.trim().split(/\r?\n/u).map(line => JSON.parse(line));
  const confirmation = rows.find(row => row.name === 'confirm');
  assert.ok(confirmation, 'the complete confirmation must have been measured');
  assert.ok(confirmation.httpCount <= 139,
    `confirmation used ${confirmation.httpCount} requests; budget is 139`);
  const result = rows.at(-1);
  assert.equal(result.result, 'confirmed');
  assert.equal(result.points.availablePoints, 1400);
  assert.equal(result.points.earnedPoints, 1600);
});
