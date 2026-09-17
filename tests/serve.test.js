import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

import {createProbeServer} from '../scripts/serve.mjs';

async function withServer(run) {
  const server = createProbeServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  try {
    assert.equal(server.address().address, '127.0.0.1');
    await run(server.address().port);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function request(port, path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const operation = http.request({host: '127.0.0.1', port, path, method}, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve({
        status: response.statusCode,
        headers: response.headers,
        body: Buffer.concat(chunks),
      }));
    });
    operation.on('error', reject);
    operation.end();
  });
}

test('serves only named probe and trainer assets with correct MIME types', async () => {
  await withServer(async (port) => {
    const cases = [
      ['/', 'text/html; charset=utf-8'],
      ['/styles.css', 'text/css; charset=utf-8'],
      ['/src/probe/main.js', 'text/javascript; charset=utf-8'],
      ['/manifest.webmanifest', 'application/manifest+json; charset=utf-8'],
      ['/icons/probe.svg', 'image/svg+xml; charset=utf-8'],
      ['/src/probe/model.js', 'text/javascript; charset=utf-8'],
      ['/src/drive/client.js', 'text/javascript; charset=utf-8'],
      ['/trainer/', 'text/html; charset=utf-8'],
      ['/trainer/index.html', 'text/html; charset=utf-8'],
      ['/trainer/styles.css', 'text/css; charset=utf-8'],
      ['/src/trainer/main.js', 'text/javascript; charset=utf-8'],
      ['/src/trainer/ui/dom.js', 'text/javascript; charset=utf-8'],
      ['/src/trainer/ui/shell.js', 'text/javascript; charset=utf-8'],
      ['/src/trainer/ui/adult.js', 'text/javascript; charset=utf-8'],
      ['/src/trainer/adult/pin.js', 'text/javascript; charset=utf-8'],
      ['/src/trainer/adult/import.js', 'text/javascript; charset=utf-8'],
      ['/src/trainer/commands.js', 'text/javascript; charset=utf-8'],
      ['/src/trainer/storage/store.js', 'text/javascript; charset=utf-8'],
      ['/src/trainer/model/canonical.js', 'text/javascript; charset=utf-8'],
      ['/src/trainer/model/errors.js', 'text/javascript; charset=utf-8'],
      ['/src/trainer/model/revisions.js', 'text/javascript; charset=utf-8'],
      ['/src/trainer/model/schema.js', 'text/javascript; charset=utf-8'],
      ['/src/trainer/model/epochs.js', 'text/javascript; charset=utf-8'],
      ['/src/trainer/learning/answers.js', 'text/javascript; charset=utf-8'],
      ['/src/trainer/learning/calendar.js', 'text/javascript; charset=utf-8'],
      ['/src/trainer/learning/progress.js', 'text/javascript; charset=utf-8'],
      ['/src/trainer/learning/rewards.js', 'text/javascript; charset=utf-8'],
      ['/src/trainer/learning/rounds.js', 'text/javascript; charset=utf-8'],
    ];
    for (const [path, contentType] of cases) {
      const response = await request(port, path);
      assert.equal(response.status, 200, path);
      assert.equal(response.headers['content-type'], contentType, path);
      assert.ok(response.body.length > 0, path);
    }
  });
});

test('serves the bounded German probe UI and relative offline manifest', async () => {
  await withServer(async (port) => {
    const html = (await request(port, '/index.html')).body.toString();
    assert.match(html, /Verbindungsprobe · noch kein Vokabeltrainer/);
    assert.match(html, /Browserprofil.*fest.*Probestand/i);
    for (const id of [
      'client-id', 'prepare', 'connect', 'find-folders', 'create-folder', 'folder-select',
      'join-folder', 'add-answer', 'sync', 'repeat-upload', 'preview-reset', 'confirm-reset',
      'cancel-reset', 'answer-count', 'points', 'pending-count', 'late-count', 'status',
    ]) {
      assert.match(html, new RegExp(`id=["']${id}["']`), id);
    }

    const manifest = JSON.parse((await request(port, '/manifest.webmanifest')).body.toString());
    assert.equal(manifest.start_url, './');
    assert.equal(manifest.scope, './');
    assert.equal(manifest.icons[0].src, './icons/probe.svg');

    const serviceWorker = (await request(port, '/sw.js')).body.toString();
    assert.match(serviceWorker, /'\.\/sw\.js'/);
    assert.doesNotMatch(serviceWorker, /skipWaiting/);
    assert.doesNotMatch(serviceWorker, /accounts\.google|googleapis/);
  });
});

test('supports HEAD without returning an asset body', async () => {
  await withServer(async (port) => {
    const response = await request(port, '/index.html', 'HEAD');
    assert.equal(response.status, 200);
    assert.equal(response.body.length, 0);
    assert.ok(Number(response.headers['content-length']) > 0);
  });
});

test('blocks non-read methods, traversal, private trees, dotfiles, and missing files', async () => {
  await withServer(async (port) => {
    const cases = [
      ['/index.html', 'POST', 405],
      ['/../docs/ARCHITEKTUR.md', 'GET', 404],
      ['/%2e%2e/docs/ARCHITEKTUR.md', 'GET', 404],
      ['/docs/ANFORDERUNGEN.md', 'GET', 404],
      ['/tests/serve.test.js', 'GET', 404],
      ['/node_modules/example.js', 'GET', 404],
      ['/.git/config', 'GET', 404],
      ['/trainer/../tests/trainer/adult.test.js', 'GET', 404],
      ['/trainer/%2e%2e/%2e%2e/.git/config', 'GET', 404],
      ['/missing.js', 'GET', 404],
    ];
    for (const [path, method, status] of cases) {
      assert.equal((await request(port, path, method)).status, status, `${method} ${path}`);
    }
  });
});

test('returns a bounded client error for a malformed URL', async () => {
  await withServer(async (port) => {
    const response = await request(port, '/%ZZ');
    assert.equal(response.status, 400);
    assert.doesNotMatch(response.body.toString(), /stack|G:\\/i);
  });
});
