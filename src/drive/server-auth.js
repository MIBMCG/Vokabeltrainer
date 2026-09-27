import {DriveError} from './client.js';

function authError(message = 'Google-Anmeldung ist nicht aktiv.') {
  return new DriveError('auth', message);
}

async function requestJson(fetchImpl, url, init, timeoutMs) {
  const controller = new AbortController();
  let timeout;
  try {
    return await Promise.race([
      (async () => {
        const response = await fetchImpl(url, {credentials: 'same-origin', cache: 'no-store', ...init, signal: controller.signal});
        if (!response?.ok) {
          if (response?.status === 401) throw authError();
          throw new DriveError(response?.status >= 500 ? 'network' : 'invalid',
            'Der Anmeldedienst konnte die Anfrage nicht abschließen.', response?.status);
        }
        try { return await response.json(); }
        catch { throw new DriveError('invalid', 'Der Anmeldedienst hat ungültige Daten geliefert.'); }
      })(),
      new Promise((_, reject) => {
        timeout = setTimeout(() => {
          controller.abort();
          reject(new Error('timeout'));
        }, timeoutMs);
      }),
    ]);
  } catch (error) {
    if (error instanceof DriveError) throw error;
    throw new DriveError('network', 'Der Anmeldedienst ist vorübergehend nicht erreichbar.');
  } finally {
    clearTimeout(timeout);
  }
}

export function createServerAuth({fetchImpl = globalThis.fetch, navigate = (url) => { location.href = url; },
  onChange = () => {}, onExpired = () => {}, timeoutMs = 10_000} = {}) {
  if (typeof fetchImpl !== 'function' || typeof navigate !== 'function' || typeof onChange !== 'function'
    || typeof onExpired !== 'function'
    || !Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
    throw new TypeError('Die Serveranmeldung ist unvollständig konfiguriert.');
  }
  let accountId = null;
  let revision = 0;
  let connected = false;
  let marker = null;
  let generation = 0;
  let disconnecting = false;

  function update(nextAccountId) {
    const nextConnected = nextAccountId !== null;
    const changed = connected !== nextConnected || accountId !== nextAccountId;
    if (changed) marker = nextConnected ? `server-session:${++generation}:${nextAccountId}` : null;
    connected = nextConnected;
    accountId = nextAccountId;
    revision += 1;
    if (changed) onChange();
  }

  async function resume() {
    if (disconnecting) return false;
    const previous = revision;
    const result = await requestJson(fetchImpl, '/api/auth/session', {method: 'GET'}, timeoutMs);
    if (revision !== previous) return false;
    if (result?.connected === false) {
      update(null);
      return false;
    }
    if (result?.connected !== true || typeof result.accountId !== 'string'
      || !/^[A-Za-z0-9_-]{1,128}$/u.test(result.accountId)) {
      throw new DriveError('invalid', 'Die Serversitzung ist ungültig.');
    }
    update(result.accountId);
    return true;
  }

  async function connect() {
    const result = await requestJson(fetchImpl, '/api/auth/start', {
      method: 'POST', headers: {'X-Vokabeltrainer': '1'},
    }, timeoutMs);
    const url = result?.url;
    if (typeof url !== 'string' || !url.startsWith('https://accounts.google.com/o/oauth2/v2/auth?')) {
      throw new DriveError('invalid', 'Der Anmeldedienst hat kein gültiges Google-Ziel geliefert.');
    }
    navigate(url);
  }

  function getToken() {
    if (!connected) throw authError();
    return marker;
  }

  function clearLocal() { update(null); }

  async function disconnect() {
    if (disconnecting) throw new DriveError('conflict', 'Die Trennung läuft bereits.');
    disconnecting = true;
    revision += 1;
    try {
      const result = await requestJson(fetchImpl, '/api/auth/logout', {
        method: 'POST', headers: {'X-Vokabeltrainer': '1'},
      }, timeoutMs);
      if (result?.connected !== false) throw new DriveError('invalid', 'Die Trennung wurde nicht bestätigt.');
      clearLocal();
    } finally {
      disconnecting = false;
    }
  }

  function invalidateIfCurrent(snapshot) {
    if (!connected || revision !== snapshot) return false;
    clearLocal();
    return true;
  }

  async function fetchDrive(url, init = {}) {
    getToken();
    let target;
    try { target = new URL(url); } catch { throw new DriveError('invalid', 'Ungültiges Drive-Ziel.'); }
    if (target.origin !== 'https://www.googleapis.com'
      || !/^\/(?:drive|upload\/drive)\/v[23]\//u.test(target.pathname)) {
      throw new DriveError('invalid', 'Das Drive-Ziel ist nicht zugelassen.');
    }
    const headers = new Headers(init.headers ?? {});
    if (headers.get('Authorization') !== `Bearer ${marker}`) throw authError('Die Google-Sitzung hat sich geändert.');
    headers.delete('Authorization');
    headers.set('X-Vokabeltrainer', '1');
    headers.set('X-Vokabeltrainer-Account', accountId);
    const current = revision;
    const response = await fetchImpl(`/api/drive${target.pathname}${target.search}`, {
      ...init, headers, credentials: 'same-origin', redirect: 'error', cache: 'no-store',
    });
    if (response?.status === 401 && invalidateIfCurrent(current)) onExpired();
    return response;
  }

  return Object.freeze({
    configuration: () => ({clientId: '', source: 'server', requiresDecision: false}),
    clientId: () => '',
    connect, resume, getToken, fetchDrive, clearLocal, disconnect,
    snapshot: () => revision, invalidateIfCurrent,
  });
}
