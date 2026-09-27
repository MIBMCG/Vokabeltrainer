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
    let heldFilesRead = null;
    let observedHeldFilesRead = null;
    const controls = {
      offline: false,
      account: 'synthetic-account',
      loseNextUpload: false,
      loseNextPointerResponse: false,
      rejectNextAbout401: false,
      cancelNextOauth: false,
      oauthClientIds: [],
      holdNextFilesRead: false,
      heldFilesReads: 0,
      waitForHeldFilesRead() {
        if (controls.heldFilesReads > 0) return Promise.resolve(controls.heldFilesReads);
        return new Promise((resolveHeld) => { observedHeldFilesRead = resolveHeld; });
      },
      releaseHeldFilesRead() {
        const release = heldFilesRead;
        heldFilesRead = null;
        release?.();
      },
    };
    await context.exposeFunction('__syntheticOauthDecision', (clientId) => {
      controls.oauthClientIds.push(clientId);
      const cancel = controls.cancelNextOauth;
      controls.cancelNextOauth = false;
      return {cancel};
    });
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
              window.__syntheticOauthRequests = (window.__syntheticOauthRequests || 0) + 1;
              const token = 'synthetic-browser-token-' + window.__syntheticOauthRequests;
              const finish = () => queueMicrotask(() => options.callback({access_token:token,
                scope:${JSON.stringify(scope)}, expires_in:Number(window.__syntheticExpiresIn || 3600)}));
              window.__syntheticOauthDecision(options.client_id).then(({cancel}) => {
                if (cancel) {
                  queueMicrotask(() => options.error_callback({type: 'popup_closed'}));
                } else if (window.__holdSyntheticOauth) {
                  window.__syntheticOauthStarted = true;
                  Promise.resolve(window.__syntheticOauthGate).then(finish);
                } else finish();
              });
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
        'access-control-allow-headers': 'authorization,content-type,if-match',
        'access-control-allow-methods': 'GET,POST,PUT,OPTIONS'};
      const respond = (value, status = 200) => route.fulfill({status, headers,
        contentType: 'application/json', body: JSON.stringify(value)});
      if (method === 'OPTIONS') return respond({});
      assert.match(request.headers().authorization, /^Bearer synthetic-browser-token-\d+$/);
      if (url.pathname === '/drive/v3/about') {
        if (controls.rejectNextAbout401) {
          controls.rejectNextAbout401 = false;
          return respond({error: {code: 401}}, 401);
        }
        return respond({user: {permissionId: controls.account}});
      }
      if (url.pathname === '/drive/v3/files/generateIds') return respond({ids: [`file-${++sequence}`]});
      if (url.pathname === '/drive/v3/files' && method === 'GET') {
        if (controls.holdNextFilesRead) {
          controls.holdNextFilesRead = false;
          controls.heldFilesReads += 1;
          observedHeldFilesRead?.(controls.heldFilesReads);
          observedHeldFilesRead = null;
          await new Promise((release) => { heldFilesRead = release; });
        }
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
        writes.push({
          id: metadata.id,
          duplicate: files.has(metadata.id),
          kind: metadata.appProperties?.kind ?? value?.kind ?? (metadata.mimeType === folderMime ? 'folder' : null),
          name: metadata.name ?? null,
          packetId: metadata.appProperties?.packetId ?? value?.packetId ?? null,
        });
        if (files.has(metadata.id)) return respond({error: {code: 409}}, 409);
        const normalized = {...metadata, parents: metadata.parents || ['root'], trashed: false,
          version: '1', etag: `"${metadata.id}-v1"`};
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
      const v2FileId = url.pathname.match(/^\/drive\/v2\/files\/([A-Za-z0-9_-]+)$/)?.[1];
      if (v2FileId && method === 'GET') {
        const file = files.get(v2FileId);
        if (!file) return respond({error: {code: 404}}, 404);
        if (url.searchParams.get('alt') === 'media') return respond(file.value);
        return respond({
          id: v2FileId,
          title: file.metadata.name,
          mimeType: file.metadata.mimeType,
          parents: file.metadata.parents.map((id) => ({id})),
          properties: Object.entries(file.metadata.appProperties || {})
            .map(([key, value]) => ({key, value, visibility: 'PRIVATE'})),
          labels: {trashed: file.metadata.trashed === true},
          version: file.metadata.version,
          etag: file.metadata.etag,
        });
      }
      if (v2FileId && method === 'PUT') {
        const file = files.get(v2FileId);
        if (!file) return respond({error: {code: 404}}, 404);
        if (request.headers()['if-match'] !== file.metadata.etag) return respond({error: {code: 412}}, 412);
        const body = request.postDataJSON();
        assert.ok(Array.isArray(body.properties));
        file.metadata.appProperties = Object.fromEntries(body.properties.map(({key, value, visibility}) => {
          assert.equal(visibility, 'PRIVATE');
          return [key, value];
        }));
        file.metadata.version = String(Number(file.metadata.version) + 1);
        file.metadata.etag = `"${v2FileId}-v${file.metadata.version}"`;
        writes.push({id: v2FileId, duplicate: false, kind: 'pointer', name: file.metadata.name, packetId: null, pointer: true});
        const updated = {id: v2FileId, version: file.metadata.version, etag: file.metadata.etag,
          properties: body.properties};
        if (controls.loseNextPointerResponse) {
          controls.loseNextPointerResponse = false;
          return route.abort('connectionreset');
        }
        return respond(updated);
      }
      unexpected.push(`${method} ${url.pathname}`);
      return respond({error: {code: 400}}, 400);
    });
    return controls;
  }
  return {attach, files, writes, unexpected};
}
