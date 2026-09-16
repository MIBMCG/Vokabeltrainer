import {DriveError} from './client.js';

export {DriveError};

export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

const EXPIRY_MARGIN_MS = 30_000;

function invalid(message) {
  return new DriveError('invalid', message);
}

function authError(message = 'Google-Anmeldung ist nicht aktiv.') {
  return new DriveError('auth', message);
}

export function createTokenSession({oauth2, clientId, now = Date.now} = {}) {
  if (typeof clientId !== 'string' || clientId.trim() === '') {
    throw invalid('Eine öffentliche Google-Web-Client-ID ist erforderlich.');
  }
  if (!oauth2 || typeof oauth2.initTokenClient !== 'function' || typeof now !== 'function') {
    throw invalid('Google Identity Services ist nicht bereit.');
  }

  let token = null;
  let pending = null;
  let generation = 0;

  function settleCallback(attempt, response) {
    if (!pending || pending.attempt !== attempt || generation !== attempt) return;
    const current = pending;
    pending = null;

    if (!response || typeof response !== 'object') {
      current.reject(invalid('Google Identity Services hat ungültige Daten geliefert.'));
      return;
    }
    if (response.error) {
      current.reject(authError('Google-Anmeldung wurde nicht abgeschlossen.'));
      return;
    }
    if (typeof response.access_token !== 'string' || response.access_token.trim() === '') {
      current.reject(invalid('Google Identity Services hat kein Zugriffstoken geliefert.'));
      return;
    }
    const expiresIn = Number(response.expires_in);
    if (!Number.isFinite(expiresIn) || expiresIn <= 0) {
      current.reject(invalid('Google Identity Services hat keine gültige Ablaufzeit geliefert.'));
      return;
    }
    if (typeof response.scope !== 'string' || !response.scope.split(/\s+/).includes(DRIVE_SCOPE)) {
      current.reject(new DriveError('permission', 'Die erforderliche Drive-Berechtigung wurde nicht erteilt.'));
      return;
    }

    token = {
      value: response.access_token,
      expiresAt: now() + expiresIn * 1000,
    };
    current.resolve();
  }

  function settlePopupError(attempt) {
    if (!pending || pending.attempt !== attempt || generation !== attempt) return;
    const current = pending;
    pending = null;
    current.reject(authError('Google-Anmeldefenster wurde nicht geöffnet oder geschlossen.'));
  }

  function connect() {
    if (pending) return Promise.reject(new DriveError('conflict', 'Eine Google-Anmeldung läuft bereits.'));
    if (token && now() < token.expiresAt - EXPIRY_MARGIN_MS) return Promise.resolve();
    token = null;
    generation += 1;
    const attempt = generation;

    return new Promise((resolve, reject) => {
      pending = {attempt, resolve, reject};
      let tokenClient;
      try {
        tokenClient = oauth2.initTokenClient({
          client_id: clientId.trim(),
          scope: DRIVE_SCOPE,
          include_granted_scopes: false,
          callback: (response) => settleCallback(attempt, response),
          error_callback: () => settlePopupError(attempt),
        });
        if (!tokenClient || typeof tokenClient.requestAccessToken !== 'function') {
          throw new TypeError('missing requestAccessToken');
        }
        tokenClient.requestAccessToken();
      } catch {
        if (pending?.attempt === attempt) pending = null;
        reject(authError('Google-Anmeldung konnte nicht gestartet werden.'));
      }
    });
  }

  function getToken() {
    if (!token || now() >= token.expiresAt - EXPIRY_MARGIN_MS) {
      token = null;
      throw authError();
    }
    return token.value;
  }

  function disconnect() {
    generation += 1;
    if (pending) {
      const current = pending;
      pending = null;
      current.reject(authError('Google-Anmeldung wurde getrennt.'));
    }
    const tokenToRevoke = token?.value;
    token = null;
    if (tokenToRevoke && typeof oauth2.revoke === 'function') {
      try {
        oauth2.revoke(tokenToRevoke, () => {});
      } catch {
        // The local session is already cleared; a revoke transport error is non-fatal here.
      }
    }
  }

  return {connect, getToken, disconnect};
}
