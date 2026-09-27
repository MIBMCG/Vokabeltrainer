import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../../server/worker.js';

test('unconfigured worker fails closed and never serves repository files', async () => {
  const served = [];
  const env = {ASSETS: {fetch(request) { served.push(new URL(request.url).pathname); return new Response('asset'); }}};
  const api = await worker.fetch(new Request('https://trainer.example/api/auth/session'), env);
  assert.equal(api.status, 503);
  for (const path of ['/server/worker.js', '/docs/secret.txt', '/.git/config', '/package.json']) {
    assert.equal((await worker.fetch(new Request('https://trainer.example' + path), env)).status, 404);
  }
  assert.equal((await worker.fetch(new Request('https://trainer.example/trainer/'), env)).status, 200);
  assert.deepEqual(served, ['/trainer/']);
});
