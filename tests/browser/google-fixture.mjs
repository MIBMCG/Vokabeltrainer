// External Google boundary for browser tests only. Never served by the app.
import assert from 'node:assert/strict';

const folderMime = 'application/vnd.google-apps.folder';
const scope = 'https://www.googleapis.com/auth/drive.file';

export function createGoogleFixture() {
  const files = new Map();
  let sequence = 0;
  const unexpected = [];
  const writes = [];

  async function attach(context) {
    const controls = {offline: false, account: 'synthetic-account', loseNextUpload: false};
    await context.route('**/*', async (route) => {
      if (['localhost', '127.0.0.1'].includes(new URL(route.request().url()).hostname)) {
        return route.continue();
      }
      unexpected.push(route.request().url());
      return route.abort();
    });
    await context.route('https://accounts.google.com/**', async (route) => {
      if (controls.offline) return route.abort('internetdisconnected');
      if (new URL(route.request().url()).pathname !== '/gsi/client') {
        unexpected.push(route.request().url());
        return route.abort();
      }
      return route.fulfill({contentType: 'text/javascript', body: `
        window.google = {accounts: {oauth2: {
          initTokenClient(options) {
            if (options.scope !== ${JSON.stringify(scope)} || options.include_granted_scopes !== false) {
              throw new Error('Unexpected OAuth scope');
            }
            return {requestAccessToken() {
              if (!navigator.userActivation.isActive) throw new Error('Missing user gesture');
              queueMicrotask(() => options.callback({access_token:'synthetic-browser-token',
                scope:${JSON.stringify(scope)}, expires_in:3600}));
            }};
          },
          revoke(token, done) { done(); }
        }}};
      `});
    });

    await context.route('https://www.googleapis.com/**', async (route) => {
      if (controls.offline) return route.abort('internetdisconnected');
      const request = route.request();
      const url = new URL(request.url());
      const method = request.method();
      const headers = {'access-control-allow-origin': '*',
        'access-control-allow-headers': 'authorization,content-type',
        'access-control-allow-methods': 'GET,POST,OPTIONS'};
      const respond = (value, status = 200) => route.fulfill({status, headers,
        contentType: 'application/json', body: JSON.stringify(value)});
      if (method === 'OPTIONS') return respond({});
      assert.equal(request.headers().authorization, 'Bearer synthetic-browser-token');
      if (url.pathname === '/drive/v3/about') return respond({user: {permissionId: controls.account}});
      if (url.pathname === '/drive/v3/files/generateIds') return respond({ids: [`file-${++sequence}`]});
      if (url.pathname === '/drive/v3/files' && method === 'GET') {
        const query = url.searchParams.get('q') || '';
        let matches = [...files.values()].filter((file) => !file.metadata.trashed);
        const parent = query.match(/'([A-Za-z0-9_-]+)' in parents/);
        if (parent) matches = matches.filter((file) => file.metadata.parents.includes(parent[1]));
        const mime = query.match(/mimeType\s*=\s*'([^']+)'/);
        if (mime) matches = matches.filter((file) => file.metadata.mimeType === mime[1]);
        for (const property of query.matchAll(/appProperties\s+has\s*\{\s*key\s*=\s*'([^']+)'\s+and\s+value\s*=\s*'([^']+)'\s*\}/g)) {
          matches = matches.filter((file) => file.metadata.appProperties[property[1]] === property[2]);
        }
        return respond({files: matches.map((file) => file.metadata), incompleteSearch: false});
      }
      if (method === 'POST' && ['/drive/v3/files', '/upload/drive/v3/files'].includes(url.pathname)) {
        let metadata;
        let value;
        if (url.pathname.startsWith('/upload/')) {
          const boundary = request.headers()['content-type'].match(/boundary=(.+)$/)?.[1];
          assert.ok(boundary, 'Multipart boundary required');
          const parts = request.postData().split(`--${boundary}`).slice(1, -1);
          assert.equal(parts.length, 2);
          [metadata, value] = parts.map((part) => JSON.parse(part.split('\r\n\r\n')[1].trim()));
        } else {
          metadata = request.postDataJSON();
          assert.equal(metadata.mimeType, folderMime);
        }
        assert.match(metadata.id, /^file-\d+$/);
        writes.push({id: metadata.id, duplicate: files.has(metadata.id)});
        if (files.has(metadata.id)) return respond({error: {code: 409}}, 409);
        const normalized = {...metadata, parents: metadata.parents || ['root'], trashed: false};
        files.set(metadata.id, {metadata: normalized, value});
        if (controls.loseNextUpload && value) {
          controls.loseNextUpload = false;
          return route.abort('connectionreset');
        }
        return respond(normalized);
      }
      const fileId = url.pathname.match(/^\/drive\/v3\/files\/([A-Za-z0-9_-]+)$/)?.[1];
      if (fileId && method === 'GET') {
        const file = files.get(fileId);
        if (!file) return respond({error: {code: 404}}, 404);
        return respond(url.searchParams.get('alt') === 'media' ? file.value : file.metadata);
      }
      unexpected.push(`${method} ${url.pathname}`);
      return respond({error: {code: 400}}, 400);
    });
    return controls;
  }
  return {attach, files, writes, unexpected};
}
