import test from 'node:test';
import assert from 'node:assert/strict';

import {createServerAuth} from '../../src/drive/server-auth.js';

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return {promise, resolve, reject};
}

test('resumes a server session and proxies Drive without forwarding a browser token', async () => {
  const calls = [];
  const auth = createServerAuth({fetchImpl: async (url, init) => {
    calls.push({url, init});
    if (url === '/api/auth/session') return Response.json({connected: true, accountId: 'account-1'});
    return new Response('{}', {headers: {'Content-Type': 'application/json', ETag: '"a"'}});
  }});
  await auth.resume();
  const marker = auth.getToken();
  assert.match(marker, /^server-session:/);
  const response = await auth.fetchDrive('https://www.googleapis.com/drive/v3/about?fields=user(permissionId)', {
    headers: {Authorization: `Bearer ${marker}`, 'If-Match': '"a"'},
  });
  assert.equal(response.headers.get('ETag'), '"a"');
  assert.equal(calls[1].url, '/api/drive/drive/v3/about?fields=user(permissionId)');
  assert.equal(new Headers(calls[1].init.headers).get('Authorization'), null);
  assert.equal(new Headers(calls[1].init.headers).get('If-Match'), '"a"');
  assert.equal(new Headers(calls[1].init.headers).get('X-Vokabeltrainer'), '1');
  assert.equal(new Headers(calls[1].init.headers).get('X-Vokabeltrainer-Account'), 'account-1');
  assert.equal(calls[1].init.credentials, 'same-origin');
});

test('a renewed session uses its new account binding for later proxy calls', async () => {
  let accountId = 'account-1';
  const accounts = [];
  const auth = createServerAuth({fetchImpl: async (url, init) => {
    if (url === '/api/auth/session') return Response.json({connected: true, accountId});
    accounts.push(new Headers(init.headers).get('X-Vokabeltrainer-Account'));
    return Response.json({});
  }});
  await auth.resume();
  const oldMarker = auth.getToken();
  accountId = 'account-2';
  await auth.resume();
  await assert.rejects(auth.fetchDrive('https://www.googleapis.com/drive/v3/about', {
    headers: {Authorization: `Bearer ${oldMarker}`},
  }), {code: 'auth'});
  await auth.fetchDrive('https://www.googleapis.com/drive/v3/about', {
    headers: {Authorization: `Bearer ${auth.getToken()}`},
  });
  assert.deepEqual(accounts, ['account-2']);
});

test('account lookup accepts only the current server session marker', async () => {
  let accountId = 'account-1';
  const auth = createServerAuth({fetchImpl: async (url) => url === '/api/auth/session'
    ? Response.json({connected: true, accountId}) : Response.json({connected: false})});
  await auth.resume();
  const first = auth.getToken();
  assert.equal(auth.accountIdForMarker(first), 'account-1');
  assert.throws(() => auth.accountIdForMarker('server-session:forged:account-1'), {code: 'auth'});
  accountId = 'account-2';
  await auth.resume();
  assert.throws(() => auth.accountIdForMarker(first), {code: 'auth'});
  assert.equal(auth.accountIdForMarker(auth.getToken()), 'account-2');
  auth.clearLocal();
  assert.throws(() => auth.accountIdForMarker(first), {code: 'auth'});
  await auth.resume();
  assert.throws(() => auth.accountIdForMarker(first), {code: 'auth'});
  assert.equal(auth.accountIdForMarker(auth.getToken()), 'account-2');
  await auth.disconnect();
  assert.throws(() => auth.accountIdForMarker(first), {code: 'auth'});
});

test('rejects non-Google URLs before a proxy request', async () => {
  let calls = 0;
  const auth = createServerAuth({fetchImpl: async () => { calls++; return Response.json({connected: true, accountId: 'account-1'}); }});
  await auth.resume();
  await assert.rejects(auth.fetchDrive('https://evil.example/drive/v3/about', {
    headers: {Authorization: `Bearer ${auth.getToken()}`},
  }));
  assert.equal(calls, 1);
});

test('transient session failure preserves local use and a later retry can resume', async () => {
  let calls = 0;
  const auth = createServerAuth({fetchImpl: async () => {
    calls++;
    if (calls === 1) throw new Error('offline');
    return Response.json({connected: true, accountId: 'account-1'});
  }});
  await assert.rejects(auth.resume(), {code: 'network'});
  assert.throws(() => auth.getToken(), {code: 'auth'});
  await auth.resume();
  assert.match(auth.getToken(), /^server-session:/);
});

test('a hung session lookup times out so a later retry can proceed', async () => {
  let calls = 0;
  const auth = createServerAuth({timeoutMs: 20, fetchImpl: async () => {
    calls++;
    if (calls === 1) return new Promise(() => {});
    return Response.json({connected: true, accountId: 'account-1'});
  }});
  await assert.rejects(auth.resume(), {code: 'network'});
  await auth.resume();
  assert.match(auth.getToken(), /^server-session:/);
});

test('a hung session response body also times out', async () => {
  const auth = createServerAuth({timeoutMs: 20, fetchImpl: async () => ({
    ok: true, json: () => new Promise(() => {}),
  })});
  await assert.rejects(auth.resume(), {code: 'network'});
});

test('a proxy 401 requests a fresh server session without replaying the write', async () => {
  const calls = [];
  let onExpired = 0;
  const auth = createServerAuth({onExpired: () => { onExpired++; }, fetchImpl: async (url, init) => {
    calls.push({url, init});
    if (url === '/api/auth/session') return Response.json({connected: true, accountId: 'account-1'});
    return new Response(null, {status: 401});
  }});
  await auth.resume();
  await auth.fetchDrive('https://www.googleapis.com/drive/v2/files/file-a', {
    method: 'PUT', body: '{}', headers: {Authorization: `Bearer ${auth.getToken()}`},
  });
  assert.equal(onExpired, 1);
  assert.equal(calls.filter(({url}) => url.startsWith('/api/drive/')).length, 1);
});

test('late resume cannot restore a cleared local session', async () => {
  const pending = deferred();
  const auth = createServerAuth({fetchImpl: () => pending.promise});
  const resuming = auth.resume();
  auth.clearLocal();
  pending.resolve(Response.json({connected: true, accountId: 'account-1'}));
  await resuming;
  assert.throws(() => auth.getToken(), {code: 'auth'});
});

test('scheduler auth check while resume is pending does not discard the returning session', async () => {
  const pending = deferred();
  const auth = createServerAuth({fetchImpl: () => pending.promise});
  const resuming = auth.resume();
  const before = auth.snapshot();
  assert.throws(() => auth.getToken(), {code: 'auth'});
  assert.equal(auth.invalidateIfCurrent(before), false);
  pending.resolve(Response.json({connected: true, accountId: 'account-1'}));
  await resuming;
  assert.match(auth.getToken(), /^server-session:/);
});

test('logout confirms server removal before clearing and failure retains connection', async () => {
  let fail = true;
  const auth = createServerAuth({fetchImpl: async (url) => {
    if (url === '/api/auth/session') return Response.json({connected: true, accountId: 'account-1'});
    if (fail) return new Response(null, {status: 503});
    return Response.json({connected: false});
  }});
  await auth.resume();
  await assert.rejects(auth.disconnect());
  assert.match(auth.getToken(), /^server-session:/);
  fail = false;
  await auth.disconnect();
  assert.throws(() => auth.getToken(), {code: 'auth'});
});

test('stale authorization failure cannot invalidate a newer resumed session', async () => {
  const auth = createServerAuth({fetchImpl: async () => Response.json({connected: true, accountId: 'account-1'})});
  await auth.resume();
  const old = auth.snapshot();
  await auth.resume();
  assert.equal(auth.invalidateIfCurrent(old), false);
  assert.match(auth.getToken(), /^server-session:/);
});

test('same-account resume keeps an in-flight transport marker valid', async () => {
  const auth = createServerAuth({fetchImpl: async (url) => url === '/api/auth/session'
    ? Response.json({connected: true, accountId: 'account-1'}) : Response.json({})});
  await auth.resume();
  const marker = auth.getToken();
  await auth.resume();
  assert.equal(auth.getToken(), marker);
  await auth.fetchDrive('https://www.googleapis.com/drive/v3/about', {
    headers: {Authorization: `Bearer ${marker}`},
  });
});

test('clearing local session invalidates a captured transport marker after a new resume', async () => {
  const auth = createServerAuth({fetchImpl: async (url) => url === '/api/auth/session'
    ? Response.json({connected: true, accountId: 'account-1'}) : Response.json({})});
  await auth.resume();
  const marker = auth.getToken();
  auth.clearLocal();
  await auth.resume();
  assert.notEqual(auth.getToken(), marker);
  await assert.rejects(auth.fetchDrive('https://www.googleapis.com/drive/v3/about', {
    headers: {Authorization: `Bearer ${marker}`},
  }), {code: 'auth'});
});
