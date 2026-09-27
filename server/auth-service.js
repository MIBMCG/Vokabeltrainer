import {createCipher, randomToken, sha256} from './crypto.js';

const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const STATE_MS = 10 * 60 * 1000;
const SESSION_MS = 30 * 24 * 60 * 60 * 1000;
const REFRESH_MARGIN_MS = 60 * 1000;
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const ABOUT_URL = 'https://www.googleapis.com/drive/v3/about?fields=user%28permissionId%29';
const MAX_DRIVE_BODY = 12 * 1024 * 1024;

function json(value, status = 200, extra = {}) {
  return new Response(JSON.stringify(value), {status, headers: {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra}});
}
function error(status) { return json({error: status === 503 ? 'temporarily_unavailable' : 'request_rejected'}, status); }
function cookieValue(request, name) {
  const pair = request.headers.get('cookie')?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  const value = pair?.slice(name.length + 1);
  return value && /^[A-Za-z0-9_-]{20,128}$/.test(value) ? value : null;
}
function setCookie(name, value, maxAge) {
  return `${name}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}
function exactOrigin(request, origin) { return request.headers.get('origin') === origin; }
function browserMutation(request, origin) {
  return exactOrigin(request, origin) && request.headers.get('x-vokabeltrainer') === '1';
}
function noForeignOrigin(request, origin) {
  const supplied = request.headers.get('origin');
  return !supplied || supplied === origin;
}
function boundedError(errorValue) {
  return errorValue?.name === 'TypeError' ? 503 : 502;
}
function readBody(request) {
  const raw = request.headers.get('content-length');
  if (raw && (!/^\d+$/.test(raw) || Number(raw) > MAX_DRIVE_BODY)) return false;
  return true;
}
async function limitedBody(request) {
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_DRIVE_BODY) { await reader.cancel(); return null; }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  return body;
}

export function createAuthService({store, fetchImpl = globalThis.fetch, now = Date.now, config} = {}) {
  if (!store || typeof fetchImpl !== 'function' || typeof now !== 'function'
    || !config?.origin || !config?.clientId || !config?.clientSecret || !config?.encryptionKey) {
    throw new Error('Auth service is not configured');
  }
  const origin = new URL(config.origin);
  if (origin.protocol !== 'https:' || origin.pathname !== '/' || origin.search || origin.hash || origin.username || origin.password) {
    throw new Error('Invalid app origin');
  }
  const appOrigin = origin.origin;
  const cipher = createCipher(config.encryptionKey);
  const redirectUri = `${appOrigin}/api/auth/callback`;

  async function google(url, options) {
    return await fetchImpl(url, {...options, redirect: 'manual', signal: AbortSignal.timeout(10_000)});
  }
  async function accountFor(accessToken) {
    const response = await google(ABOUT_URL, {headers: {Authorization: `Bearer ${accessToken}`}});
    if (!response.ok) return null;
    const body = await response.json();
    const id = body?.user?.permissionId;
    return typeof id === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(id) ? id : null;
  }
  async function exchange(params) {
    return await google(TOKEN_URL, {method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body: new URLSearchParams(params).toString()});
  }
  async function start(request) {
    if (!browserMutation(request, appOrigin)) return error(403);
    const state = randomToken();
    const binding = randomToken();
    const verifier = randomToken(48);
    await store.putState(await sha256(state), {
      payload: await cipher.encrypt({bindingHash: await sha256(binding), verifier}),
      expiresAt: now() + STATE_MS,
    });
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', config.clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', SCOPE);
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'consent');
    url.searchParams.set('state', state);
    url.searchParams.set('code_challenge', await sha256(verifier));
    url.searchParams.set('code_challenge_method', 'S256');
    return json({url: url.href}, 200, {'Set-Cookie': setCookie('__Host-vt_oauth', binding, 600)});
  }
  async function callback(request, url) {
    const state = url.searchParams.get('state');
    const binding = cookieValue(request, '__Host-vt_oauth');
    if (!state || !/^[A-Za-z0-9_-]{20,128}$/.test(state) || !binding) return error(400);
    const record = await store.consumeState(await sha256(state));
    if (!record || record.expiresAt <= now()) return error(400);
    let saved;
    try { saved = await cipher.decrypt(record.payload); } catch { return error(400); }
    if (saved.bindingHash !== await sha256(binding)) return error(400);
    if (url.searchParams.has('error') || !url.searchParams.get('code')) return error(400);
    let response;
    try {
      response = await exchange({code: url.searchParams.get('code'), client_id: config.clientId,
        client_secret: config.clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code', code_verifier: saved.verifier});
    } catch (caught) { return error(boundedError(caught)); }
    if (!response.ok) return error(502);
    let token;
    try { token = await response.json(); } catch { return error(502); }
    if (!token || typeof token.access_token !== 'string' || typeof token.refresh_token !== 'string'
      || token.token_type?.toLowerCase() !== 'bearer' && token.token_type !== undefined
      || typeof token.expires_in !== 'number' || token.expires_in <= 0
      || !String(token.scope ?? '').split(/\s+/).includes(SCOPE)) return error(502);
    let accountId;
    try { accountId = await accountFor(token.access_token); } catch (caught) { return error(boundedError(caught)); }
    if (!accountId) return error(502);
    const session = randomToken();
    await store.createSession(await sha256(session), {
      payload: await cipher.encrypt({accessToken: token.access_token, refreshToken: token.refresh_token,
        tokenExpiresAt: now() + token.expires_in * 1000, accountId}),
      expiresAt: now() + SESSION_MS,
    });
    const headers = new Headers({Location: `${appOrigin}/trainer/`, 'Cache-Control': 'no-store'});
    headers.append('Set-Cookie', setCookie('__Host-vt_oauth', '', 0));
    headers.append('Set-Cookie', setCookie('__Host-vt_session', session, SESSION_MS / 1000));
    return new Response(null, {status: 302, headers});
  }
  async function sessionFor(request) {
    const cookie = cookieValue(request, '__Host-vt_session');
    if (!cookie) return null;
    const id = await sha256(cookie);
    let record = await store.readSession(id);
    if (!record) return null;
    if (record.expiresAt <= now()) { await store.deleteSession(id); return null; }
    let state;
    try { state = await cipher.decrypt(record.payload); } catch { await store.deleteSession(id); return null; }
    if (state.tokenExpiresAt > now() + REFRESH_MARGIN_MS) return {id, record, state};
    let response;
    try {
      response = await exchange({client_id: config.clientId, client_secret: config.clientSecret,
        refresh_token: state.refreshToken, grant_type: 'refresh_token'});
    } catch { return {error: 503}; }
    if (!response.ok) {
      if (response.status === 400 || response.status === 401) {
        let failure;
        try { failure = await response.json(); } catch { /* no details exposed */ }
        if (failure?.error === 'invalid_grant') { await store.deleteSession(id, record.version); return null; }
      }
      return {error: response.status >= 500 || response.status === 429 ? 503 : 502};
    }
    let token;
    try { token = await response.json(); } catch { return {error: 502}; }
    if (!token || typeof token.access_token !== 'string' || typeof token.expires_in !== 'number' || token.expires_in <= 0
      || token.scope && !String(token.scope).split(/\s+/).includes(SCOPE)) return {error: 502};
    const next = {...state, accessToken: token.access_token,
      refreshToken: typeof token.refresh_token === 'string' ? token.refresh_token : state.refreshToken,
      tokenExpiresAt: now() + token.expires_in * 1000};
    let accountId;
    try { accountId = await accountFor(next.accessToken); } catch { return {error: 503}; }
    if (!accountId) return {error: 503};
    if (accountId !== state.accountId) { await store.deleteSession(id, record.version); return null; }
    const written = await store.casSession(id, record.version, {payload: await cipher.encrypt(next), expiresAt: record.expiresAt});
    if (written) return {id, record: {...record, version: record.version + 1}, state: next};
    // A concurrent logout or refresh won the race. Never insert a deleted row.
    record = await store.readSession(id);
    if (!record) return null;
    try { state = await cipher.decrypt(record.payload); } catch { return {error: 503}; }
    return {id, record, state};
  }
  async function session(request) {
    if (!noForeignOrigin(request, appOrigin)) return error(403);
    const current = await sessionFor(request);
    if (current?.error) return error(current.error);
    return json(current ? {connected: true, accountId: current.state.accountId} : {connected: false});
  }
  async function logout(request) {
    if (!browserMutation(request, appOrigin)) return error(403);
    const cookie = cookieValue(request, '__Host-vt_session');
    if (cookie) await store.deleteSession(await sha256(cookie));
    // Keep the browser cookie unchanged: a late logout response must not erase
    // a newer login using the same cookie name. Its old value is invalid in D1.
    return json({connected: false});
  }
  function driveTarget(url, method) {
    const path = url.pathname.slice('/api/drive'.length);
    if (path.includes('%') || path.includes('\\') || path.includes('//')) return null;
    const file = '[A-Za-z0-9_-]+';
    const allowed = [
      {pattern: /^\/drive\/v3\/about$/, methods: ['GET']},
      {pattern: /^\/drive\/v3\/files\/generateIds$/, methods: ['GET']},
      {pattern: /^\/drive\/v2\/files$/, methods: ['GET']},
      {pattern: /^\/drive\/v3\/files$/, methods: ['GET', 'POST']},
      {pattern: new RegExp(`^/drive/v2/files/${file}$`), methods: ['GET', 'PUT']},
      {pattern: new RegExp(`^/drive/v3/files/${file}$`), methods: ['GET']},
      {pattern: /^\/upload\/drive\/v3\/files$/, methods: ['POST']},
      {pattern: new RegExp(`^/upload/drive/v2/files/${file}$`), methods: ['PUT']},
    ];
    if (!allowed.some((entry) => entry.pattern.test(path) && entry.methods.includes(method))) return null;
    for (const key of url.searchParams.keys()) {
      if (!['fields', 'q', 'spaces', 'pageSize', 'pageToken', 'alt', 'count', 'space', 'type', 'uploadType'].includes(key)) return null;
    }
    return `https://www.googleapis.com${path}${url.search}`;
  }
  async function drive(request, url) {
    const method = request.method.toUpperCase();
    if (request.headers.get('x-vokabeltrainer') !== '1' || !noForeignOrigin(request, appOrigin)
      || (method !== 'GET' && !exactOrigin(request, appOrigin))) return error(403);
    const target = driveTarget(url, method);
    if (!target || !readBody(request)) return error(400);
    const current = await sessionFor(request);
    if (current?.error) return error(current.error);
    if (!current) return error(401);
    let body;
    if (method !== 'GET') {
      try { body = await limitedBody(request); } catch { return error(400); }
      if (!body) return error(413);
    }
    const headers = new Headers({Authorization: `Bearer ${current.state.accessToken}`});
    for (const name of ['content-type', 'if-match']) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
    let response;
    try { response = await google(target, {method, headers, body}); }
    catch { return error(503); }
    if (response.status >= 300 && response.status < 400) return error(502);
    if (response.status === 401) {
      // Force a refresh on the next request without replaying a write. The CAS
      // leaves a newer token or a concurrent logout untouched.
      await store.casSession(current.id, current.record.version, {
        payload: await cipher.encrypt({...current.state, tokenExpiresAt: 0}),
        expiresAt: current.record.expiresAt,
      });
    }
    const outgoing = new Headers({'Cache-Control': 'no-store'});
    for (const name of ['content-type', 'etag']) {
      const value = response.headers.get(name);
      if (value) outgoing.set(name, value);
    }
    return new Response(response.body, {status: response.status, headers: outgoing});
  }
  return {async fetch(request) {
    const url = new URL(request.url);
    if (url.origin !== appOrigin) return error(403);
    if (url.pathname === '/api/auth/start' && request.method === 'POST') return start(request);
    if (url.pathname === '/api/auth/callback' && request.method === 'GET') return callback(request, url);
    if (url.pathname === '/api/auth/session' && request.method === 'GET') return session(request);
    if (url.pathname === '/api/auth/logout' && request.method === 'POST') return logout(request);
    if (url.pathname.startsWith('/api/drive/')) return drive(request, url);
    return error(404);
  }};
}
