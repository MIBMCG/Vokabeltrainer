import assert from 'node:assert/strict';
import test from 'node:test';
import {createAuthService} from '../../server/auth-service.js';

const origin = 'https://trainer.example';
const scope = 'https://www.googleapis.com/auth/drive.file';
const key = Buffer.alloc(32, 7).toString('base64');

function memoryStore() {
  const states = new Map();
  const sessions = new Map();
  return {
    async putState(id, record) { states.set(id, record); },
    async consumeState(id) { const value = states.get(id); states.delete(id); return value ?? null; },
    async createSession(id, record) { sessions.set(id, {...record, version: 1}); },
    async readSession(id) { return sessions.get(id) ?? null; },
    async casSession(id, version, record) {
      if (sessions.get(id)?.version !== version) return false;
      sessions.set(id, {...record, version: version + 1});
      return true;
    },
    async deleteSession(id, version) {
      if (version === undefined || sessions.get(id)?.version === version) sessions.delete(id);
    },
    dump() { return {states: [...states.values()], sessions: [...sessions.values()]}; },
  };
}

function cookie(response, name) {
  return response.headers.get('set-cookie')?.match(new RegExp(`${name}=([^;]+)`))?.[1];
}

function fakeGoogle({tokenStatus = 200, token = {}, account = 'account-1'} = {}) {
  return async (url, init) => {
    const target = new URL(url);
    if (target.href === 'https://oauth2.googleapis.com/token') {
      assert.equal(init.method, 'POST');
      const body = new URLSearchParams(init.body);
      assert.equal(body.get('grant_type'), 'authorization_code');
      assert.ok(body.get('code_verifier'));
      return Response.json({access_token: 'synthetic-access', refresh_token: 'synthetic-refresh', expires_in: 3600, scope, ...token}, {status: tokenStatus});
    }
    if (target.href === 'https://www.googleapis.com/drive/v3/about?fields=user%28permissionId%29') {
      assert.equal(init.headers.Authorization, 'Bearer synthetic-access');
      return Response.json({user: {permissionId: account}});
    }
    throw new Error(`Unexpected Google URL: ${target.href}`);
  };
}

function serviceFor(store, fetchImpl = fakeGoogle(), now = () => 1_000_000) {
  return createAuthService({store, fetchImpl, now, config: {
    origin, clientId: 'synthetic-client', clientSecret: 'synthetic-secret', encryptionKey: key,
  }});
}

async function login(service, {stateCookie, state, code = 'code-1'} = {}) {
  const start = await service.fetch(new Request(origin + '/api/auth/start', {
    method: 'POST', headers: {Origin: origin, 'X-Vokabeltrainer': '1'},
  }));
  assert.equal(start.status, 200);
  const authUrl = new URL((await start.json()).url);
  const boundState = state ?? authUrl.searchParams.get('state');
  const boundCookie = stateCookie ?? cookie(start, '__Host-vt_oauth');
  const callback = await service.fetch(new Request(`${origin}/api/auth/callback?state=${encodeURIComponent(boundState)}&code=${code}`, {
    headers: {Cookie: `__Host-vt_oauth=${boundCookie}`},
  }));
  return {start, callback, authUrl, state: boundState, stateCookie: boundCookie};
}

test('callback consumes bound state and session resumes without exposing tokens', async () => {
  const store = memoryStore();
  const service = serviceFor(store);
  const {callback, authUrl, state, stateCookie} = await login(service);
  assert.equal(authUrl.searchParams.get('scope'), scope);
  assert.equal(authUrl.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(callback.status, 302);
  assert.equal(callback.headers.get('location'), origin + '/trainer/');
  const sessionCookie = cookie(callback, '__Host-vt_session');
  assert.ok(sessionCookie);
  assert.match(callback.headers.get('set-cookie'), /HttpOnly; Secure; SameSite=Lax/);
  const resumed = await service.fetch(new Request(origin + '/api/auth/session', {
    headers: {Cookie: `__Host-vt_session=${sessionCookie}`},
  }));
  assert.deepEqual(await resumed.json(), {connected: true, accountId: 'account-1'});
  assert.equal(JSON.stringify(store.dump()).includes('synthetic-refresh'), false);
  assert.equal(JSON.stringify(store.dump()).includes(sessionCookie), false);
  const replay = await service.fetch(new Request(`${origin}/api/auth/callback?state=${state}&code=code-1`, {
    headers: {Cookie: `__Host-vt_oauth=${stateCookie}`},
  }));
  assert.equal(replay.status, 400);
  const restarted = serviceFor(store);
  const afterRestart = await restarted.fetch(new Request(origin + '/api/auth/session', {headers: {Cookie: `__Host-vt_session=${sessionCookie}`}}));
  assert.deepEqual(await afterRestart.json(), {connected: true, accountId: 'account-1'});
});

test('callback rejects missing, wrong and expired browser binding before token exchange', async () => {
  let time = 1_000_000;
  let exchanges = 0;
  const store = memoryStore();
  const google = async (...args) => { exchanges += 1; return fakeGoogle()(...args); };
  const service = serviceFor(store, google, () => time);
  const start = await service.fetch(new Request(origin + '/api/auth/start', {
    method: 'POST', headers: {Origin: origin, 'X-Vokabeltrainer': '1'},
  }));
  const state = new URL((await start.json()).url).searchParams.get('state');
  for (const header of ['', '__Host-vt_oauth=wrong-binding']) {
    const response = await service.fetch(new Request(`${origin}/api/auth/callback?state=${state}&code=code`, {headers: {Cookie: header}}));
    assert.equal(response.status, 400);
  }
  assert.equal(exchanges, 0);
  const second = await service.fetch(new Request(origin + '/api/auth/start', {
    method: 'POST', headers: {Origin: origin, 'X-Vokabeltrainer': '1'},
  }));
  const expiredState = new URL((await second.json()).url).searchParams.get('state');
  time += 600_001;
  const expired = await service.fetch(new Request(`${origin}/api/auth/callback?state=${expiredState}&code=code`, {
    headers: {Cookie: `__Host-vt_oauth=${cookie(second, '__Host-vt_oauth')}`},
  }));
  assert.equal(expired.status, 400);
  assert.equal(exchanges, 0);
});

test('Google denial and missing drive.file grant do not create a session', async () => {
  for (const google of [fakeGoogle({tokenStatus: 400}), fakeGoogle({token: {scope: 'openid profile'}})]) {
    const store = memoryStore();
    const result = await login(serviceFor(store, google));
    assert.equal(result.callback.status, 502);
    assert.equal(store.dump().sessions.length, 0);
    assert.equal(JSON.stringify(await result.callback.json()).includes('synthetic-secret'), false);
  }
});

test('mutations reject foreign Origin and missing CSRF header; GET rejects supplied foreign Origin', async () => {
  const service = serviceFor(memoryStore());
  for (const headers of [{Origin: 'https://evil.example', 'X-Vokabeltrainer': '1'}, {Origin: origin}]) {
    const response = await service.fetch(new Request(origin + '/api/auth/start', {method: 'POST', headers}));
    assert.equal(response.status, 403);
  }
  const session = await service.fetch(new Request(origin + '/api/auth/session', {headers: {Origin: 'https://evil.example'}}));
  assert.equal(session.status, 403);
  const normal = await service.fetch(new Request(origin + '/api/auth/session'));
  assert.deepEqual(await normal.json(), {connected: false});
});

test('refresh network failure preserves session; invalid_grant ends it', async () => {
  let time = 1_000_000;
  let mode = 'network';
  const google = async (url, init) => {
    if (url === 'https://oauth2.googleapis.com/token' && new URLSearchParams(init.body).get('grant_type') === 'refresh_token') {
      if (mode === 'network') throw new TypeError('synthetic offline');
      return Response.json({error: 'invalid_grant'}, {status: 400});
    }
    return fakeGoogle()(url, init);
  };
  const store = memoryStore();
  const service = serviceFor(store, google, () => time);
  const {callback} = await login(service);
  const sessionCookie = cookie(callback, '__Host-vt_session');
  time += 3_600_000;
  const pending = await service.fetch(new Request(origin + '/api/auth/session', {headers: {Cookie: `__Host-vt_session=${sessionCookie}`}}));
  assert.equal(pending.status, 503);
  assert.equal(store.dump().sessions.length, 1);
  mode = 'revoked';
  const revoked = await service.fetch(new Request(origin + '/api/auth/session', {headers: {Cookie: `__Host-vt_session=${sessionCookie}`}}));
  assert.deepEqual(await revoked.json(), {connected: false});
  assert.equal(store.dump().sessions.length, 0);
});

test('logout wins over a delayed refresh and cannot be resurrected', async () => {
  let time = 1_000_000;
  let release;
  let refreshStarted;
  const started = new Promise((resolve) => { refreshStarted = resolve; });
  const delayed = new Promise((resolve) => { release = resolve; });
  const google = async (url, init) => {
    if (url === 'https://oauth2.googleapis.com/token' && new URLSearchParams(init.body).get('grant_type') === 'refresh_token') {
      refreshStarted();
      await delayed;
      return Response.json({access_token: 'synthetic-access', expires_in: 3600});
    }
    if (url === 'https://oauth2.googleapis.com/revoke') return new Response(null, {status: 200});
    return fakeGoogle()(url, init);
  };
  const store = memoryStore();
  const service = serviceFor(store, google, () => time);
  const {callback} = await login(service);
  const sessionCookie = cookie(callback, '__Host-vt_session');
  time += 3_600_000;
  const pending = service.fetch(new Request(origin + '/api/auth/session', {headers: {Cookie: `__Host-vt_session=${sessionCookie}`}}));
  await started;
  const logout = await service.fetch(new Request(origin + '/api/auth/logout', {
    method: 'POST', headers: {Origin: origin, 'X-Vokabeltrainer': '1', Cookie: `__Host-vt_session=${sessionCookie}`},
  }));
  assert.equal(logout.status, 200);
  release();
  assert.deepEqual(await (await pending).json(), {connected: false});
  assert.equal(store.dump().sessions.length, 0);
});

test('Drive proxy preserves conditional status and ETag, rejects foreign targets and never follows redirects', async () => {
  const calls = [];
  const google = async (url, init) => {
    if (String(url).startsWith('https://www.googleapis.com/drive/v2/files/file-a')) {
      calls.push({url, init});
      return new Response('{"error":"precondition"}', {status: 412, headers: {'ETag': 'etag-new', 'Content-Type': 'application/json'}});
    }
    return fakeGoogle()(url, init);
  };
  const service = serviceFor(memoryStore(), google);
  const {callback} = await login(service);
  const sessionCookie = cookie(callback, '__Host-vt_session');
  const headers = {Origin: origin, 'X-Vokabeltrainer': '1', Cookie: `__Host-vt_session=${sessionCookie}`,
    'If-Match': 'etag-old', 'Content-Type': 'application/json'};
  const response = await service.fetch(new Request(origin + '/api/drive/drive/v2/files/file-a?fields=id,etag', {
    method: 'PUT', headers, body: '{}',
  }));
  assert.equal(response.status, 412);
  assert.equal(response.headers.get('etag'), 'etag-new');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init.headers.get('if-match'), 'etag-old');
  assert.equal(calls[0].init.redirect, 'manual');
  assert.equal(calls[0].init.headers.get('cookie'), null);
  for (const path of ['/api/drive/https://evil.example', '/api/drive/drive/v3/files/file%2Fa', '/api/drive/drive/v3/changes']) {
    const denied = await service.fetch(new Request(origin + path, {headers: {'X-Vokabeltrainer': '1', Cookie: `__Host-vt_session=${sessionCookie}`}}));
    assert.equal(denied.status, 400);
  }
  const foreign = await service.fetch(new Request(origin + '/api/drive/drive/v3/files', {
    headers: {Origin: 'https://evil.example', 'X-Vokabeltrainer': '1', Cookie: `__Host-vt_session=${sessionCookie}`},
  }));
  assert.equal(foreign.status, 403);
});

test('Drive 401 makes the next session request refresh without replaying the write', async () => {
  let refreshes = 0;
  let writes = 0;
  const google = async (url, init) => {
    if (url === 'https://oauth2.googleapis.com/token' && new URLSearchParams(init.body).get('grant_type') === 'refresh_token') {
      refreshes += 1;
      return Response.json({access_token: 'synthetic-access-new', expires_in: 3600});
    }
    if (String(url).startsWith('https://www.googleapis.com/drive/v3/about')) {
      return Response.json({user: {permissionId: 'account-1'}});
    }
    if (String(url).startsWith('https://www.googleapis.com/drive/v2/files/file-a')) {
      writes += 1;
      return new Response(null, {status: 401});
    }
    return fakeGoogle()(url, init);
  };
  const service = serviceFor(memoryStore(), google);
  const {callback} = await login(service);
  const sessionCookie = cookie(callback, '__Host-vt_session');
  const rejected = await service.fetch(new Request(origin + '/api/drive/drive/v2/files/file-a', {
    method: 'PUT', headers: {Origin: origin, 'X-Vokabeltrainer': '1', Cookie: `__Host-vt_session=${sessionCookie}`,
      'Content-Type': 'application/json', 'If-Match': 'etag-old'}, body: '{}',
  }));
  assert.equal(rejected.status, 401);
  const resumed = await service.fetch(new Request(origin + '/api/auth/session', {
    headers: {Cookie: `__Host-vt_session=${sessionCookie}`},
  }));
  assert.deepEqual(await resumed.json(), {connected: true, accountId: 'account-1'});
  assert.equal(refreshes, 1);
  assert.equal(writes, 1);
});

test('session expires after thirty days and does not refresh', async () => {
  let time = 1_000_000;
  let refreshes = 0;
  const google = async (url, init) => {
    if (url === 'https://oauth2.googleapis.com/token' && new URLSearchParams(init.body).get('grant_type') === 'refresh_token') refreshes += 1;
    return fakeGoogle()(url, init);
  };
  const store = memoryStore();
  const service = serviceFor(store, google, () => time);
  const {callback} = await login(service);
  const sessionCookie = cookie(callback, '__Host-vt_session');
  time += 30 * 24 * 60 * 60 * 1000;
  const expired = await service.fetch(new Request(origin + '/api/auth/session', {
    headers: {Cookie: `__Host-vt_session=${sessionCookie}`},
  }));
  assert.deepEqual(await expired.json(), {connected: false});
  assert.equal(refreshes, 0);
  assert.equal(store.dump().sessions.length, 0);
});

test('Drive proxy rejects an oversized streamed write before contacting Google', async () => {
  let writes = 0;
  const google = async (url, init) => {
    if (String(url).startsWith('https://www.googleapis.com/drive/v2/files/file-a')) writes += 1;
    return fakeGoogle()(url, init);
  };
  const service = serviceFor(memoryStore(), google);
  const {callback} = await login(service);
  const response = await service.fetch(new Request(origin + '/api/drive/drive/v2/files/file-a', {
    method: 'PUT', headers: {Origin: origin, 'X-Vokabeltrainer': '1', Cookie: `__Host-vt_session=${cookie(callback, '__Host-vt_session')}`},
    body: new Uint8Array(12 * 1024 * 1024 + 1),
  }));
  assert.equal(response.status, 413);
  assert.equal(writes, 0);
});
