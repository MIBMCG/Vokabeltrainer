import {createCommands, productStateHash} from './commands.js';
import {createPinGate} from './adult/pin.js';
import {createRestoreService} from './backup/restore.js';
import {createTokenSession, DriveError} from '../drive/auth.js';
import {createDriveClient} from '../drive/client.js';
import {openProductStore} from './storage/store.js';
import {createProductSync} from './sync/drive.js';
import {createSyncScheduler} from './sync/scheduler.js';
import {createUpdateController} from './updates.js';
import {mountShell} from './ui/shell.js';
import {APP_CONFIG} from './config.js';
import {selectGoogleConfig} from './auth-config.js';

const root = document.querySelector('#app');
const CLIENT_ID_KEY = 'vokabeltrainer-google-client-id';
let store = null;
let shell = null;
let syncController = null;
let scheduler = null;
let auth = null;
let unsubscribeScheduler = null;
let schedulerVisibility = null;
let schedulerOnline = null;
let updates = null;
let updateNotice = null;
let closing = false;

function deviceId() {
  const key = 'vokabeltrainer-product-device-id';
  let value = localStorage.getItem(key);
  if (!/^[A-Za-z0-9_-]{1,128}$/u.test(value ?? '')) {
    value = crypto.randomUUID();
    localStorage.setItem(key, value);
  }
  return value;
}

function showFatal(error) {
  const section = document.createElement('section');
  section.className = 'panel narrow';
  const title = document.createElement('h1');
  title.textContent = 'Vokabeltrainer nicht verfügbar';
  const copy = document.createElement('p');
  copy.id = 'app-error';
  copy.setAttribute('role', 'alert');
  copy.textContent = error?.message || 'Der Trainer konnte nicht gestartet werden.';
  section.append(title, copy);
  root.replaceChildren(section);
}

function sameVerifier(left, right) {
  if (left === null || right === null) return left === right;
  return typeof left === 'object' && typeof right === 'object'
    && left.salt === right.salt
    && left.hash === right.hash
    && left.iterations === right.iterations;
}

let gisPromise = null;
function loadGoogleIdentity() {
  if (globalThis.google?.accounts?.oauth2) return Promise.resolve(globalThis.google.accounts.oauth2);
  if (gisPromise !== null) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.addEventListener('load', () => {
      const oauth2 = globalThis.google?.accounts?.oauth2;
      if (oauth2) resolve(oauth2);
      else reject(new DriveError('auth', 'Google Identity Services wurde nicht vollständig geladen.'));
    }, {once: true});
    script.addEventListener('error', () => {
      gisPromise = null;
      reject(new DriveError('network', 'Google Identity Services konnte nicht geladen werden. Offline bleiben die Lerndaten verfügbar.'));
    }, {once: true});
    document.head.append(script);
  });
  return gisPromise;
}

function createProductAuth() {
  let session = null;
  let sessionClientId = '';

  return {
    configuration(bound = false) {
      return selectGoogleConfig({
        configuredId: APP_CONFIG.googleClientId,
        storedId: localStorage.getItem(CLIENT_ID_KEY) ?? '',
        bound,
      });
    },
    clientId() {
      return this.configuration(false).clientId;
    },
    preparedClientId() {
      return APP_CONFIG.googleClientId;
    },
    async connect(requestedClientId) {
      const requested = String(requestedClientId ?? this.clientId()).trim();
      const clientId = selectGoogleConfig({configuredId: '', storedId: requested, bound: false}).clientId;
      if (clientId === '') {
        throw new DriveError('invalid', 'Eine vollständige öffentliche Google-Web-Client-ID ist erforderlich.');
      }
      if (session === null || sessionClientId !== clientId) {
        session?.disconnect();
        session = createTokenSession({oauth2: await loadGoogleIdentity(), clientId});
        sessionClientId = clientId;
      }
      await session.connect();
      localStorage.setItem(CLIENT_ID_KEY, clientId);
    },
    getToken() {
      if (session === null) throw new DriveError('auth', 'Google-Anmeldung ist nicht aktiv.');
      return session.getToken();
    },
    invalidate() {
      session?.invalidate();
    },
    disconnect() {
      session?.disconnect();
      session = null;
      sessionClientId = '';
    },
  };
}

function invalidateOnAuth(service, authSession) {
  const wrapped = {};
  for (const name of ['discover', 'createDataset', 'joinDataset', 'sync', 'retry']) {
    wrapped[name] = async (...args) => {
      try {
        return await service[name](...args);
      } catch (error) {
        if (error?.code === 'auth') authSession.invalidate();
        throw error;
      }
    };
  }
  wrapped.getStatus = () => service.getStatus();
  wrapped.destroy = () => service.destroy();
  return wrapped;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  return 'Download gestartet';
}

function hasActiveRound(commands) {
  const rounds = commands.getState()?.rounds ?? {};
  return Object.values(rounds).some((round) => !['completed', 'abandoned'].includes(round.status));
}

function refreshUpdateNotice(commands) {
  const activate = updateNotice?.querySelector('#update-activate');
  if (!activate) return;
  const activeRound = hasActiveRound(commands);
  activate.dataset.activeRound = String(activeRound);
  activate.textContent = activeRound ? 'Runde pausieren und aktualisieren' : 'Jetzt aktualisieren';
}

function showUpdateAvailable(commands) {
  if (updateNotice?.isConnected) return;
  const notice = document.createElement('aside');
  notice.id = 'update-notice';
  notice.className = 'update-notice';
  notice.setAttribute('aria-labelledby', 'update-title');
  const title = document.createElement('strong');
  title.id = 'update-title';
  title.textContent = 'Neue Programmversion verfügbar';
  const detail = document.createElement('p');
  detail.id = 'update-message';
  detail.textContent = 'Dein gespeicherter Lernstand bleibt erhalten.';
  const activate = document.createElement('button');
  activate.id = 'update-activate';
  activate.className = 'primary';
  activate.addEventListener('click', async () => {
    const activeRound = hasActiveRound(commands);
    if (activeRound && activate.dataset.activeRound !== 'true') {
      refreshUpdateNotice(commands);
      detail.textContent = 'Die laufende Runde bleibt gespeichert. Bitte bestätige die Pause mit dem neuen Knopftext.';
      return;
    }
    activate.disabled = true;
    detail.textContent = 'Die Aktualisierung wird vorbereitet …';
    try {
      await updates.activate({pauseConfirmed: activeRound});
      detail.textContent = 'Gespeichert. Die neue Version wird geladen …';
    } catch (error) {
      detail.textContent = error?.message || 'Die Aktualisierung konnte noch nicht gestartet werden.';
      detail.dataset.tone = 'error';
      activate.disabled = false;
    }
  });
  notice.append(title, detail, activate);
  root.before(notice);
  updateNotice = notice;
  refreshUpdateNotice(commands);
}

async function startUpdates(commands) {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.register('./sw.js', {scope: './'});
    updates = createUpdateController({
      registration,
      hasActiveRound: () => hasActiveRound(commands),
      pauseAndSave: () => shell.pauseForUpdate(),
      reload: () => location.reload(),
      onAvailable: () => showUpdateAvailable(commands),
    });
    await updates.check();
  } catch {
    // Offline use after a successful first load remains available if an update check fails.
  }
}

async function start() {
  store = await openProductStore();
  let commands;
  commands = await createCommands({
    store,
    now: () => new Date(),
    id: () => crypto.randomUUID(),
    deviceId: deviceId(),
    onChange: () => shell?.stateChanged(),
  });
  const pinGate = createPinGate({
    loadVerifier: async () => commands.getState()?.pinVerifier ?? null,
    saveVerifier: async (pinVerifier, expectedVerifier) => {
      const current = commands.getState();
      if (current === null) throw new Error('Der Datensatz muss zuerst eingerichtet werden.');
      if (!sameVerifier(current.pinVerifier, expectedVerifier)) {
        throw new Error('Die lokale PIN wurde zwischenzeitlich geändert. Bitte versuchen Sie es erneut.');
      }
      const expectedStateHash = await productStateHash(current);
      const next = structuredClone(current);
      next.pinVerifier = structuredClone(pinVerifier);
      await commands.commitExternal(next, expectedStateHash);
    },
  });
  auth = createProductAuth();
  const drive = createDriveClient({getToken: () => auth.getToken()});
  const rawSync = createProductSync({
    drive, store, commands, now: () => new Date(), id: () => crypto.randomUUID(),
    onStatus: (status) => {
      shell?.syncStatusChanged(status);
    },
  });
  syncController = invalidateOnAuth(rawSync, auth);
  const restore = createRestoreService({
    commands, store, sync: syncController, drive, now: () => new Date(), id: () => crypto.randomUUID(),
  });
  scheduler = createSyncScheduler({
    sync: () => syncController.sync(),
    hasChanges: () => {
      const state = commands.getState();
      return Boolean(state && (state.outboxEventIds.length > 0 || state.pendingPackets.length > 0));
    },
    now: () => Date.now(),
  });
  shell = mountShell({
    root, commands, pinGate, sync: syncController, restore, auth,
    onDownload: downloadBlob,
    onConnected: () => {
      if (!closing && pinGate.isUnlocked() && commands.getState()?.binding) scheduler?.online();
    },
  });
  shell.render();
  await startUpdates(commands);
  let completedRounds = commands.getState()?.ledger.events.filter(({type}) => type === 'round.completed').length ?? 0;
  unsubscribeScheduler = commands.subscribe((state) => {
    refreshUpdateNotice(commands);
    const nextCompleted = state.ledger.events.filter(({type}) => type === 'round.completed').length;
    if (nextCompleted > completedRounds) scheduler?.roundCompleted();
    else scheduler?.changed();
    completedRounds = nextCompleted;
  });
  schedulerVisibility = () => scheduler?.visibility(!document.hidden && navigator.onLine);
  schedulerOnline = () => {
    schedulerVisibility();
    scheduler?.online();
  };
  document.addEventListener('visibilitychange', schedulerVisibility);
  addEventListener('offline', schedulerVisibility);
  addEventListener('online', schedulerOnline);
  scheduler.visibility(!document.hidden && navigator.onLine);
  scheduler.start();
}

function close() {
  if (closing) return;
  closing = true;
  unsubscribeScheduler?.();
  scheduler?.stop();
  if (schedulerVisibility) {
    document.removeEventListener('visibilitychange', schedulerVisibility);
    removeEventListener('offline', schedulerVisibility);
  }
  if (schedulerOnline) removeEventListener('online', schedulerOnline);
  syncController?.destroy();
  updates?.destroy();
  updateNotice?.remove();
  updateNotice = null;
  auth?.disconnect();
  shell?.destroy();
  store?.close();
}

addEventListener('pagehide', close);
addEventListener('pageshow', (event) => {
  if (event.persisted) location.reload();
});

start().catch(showFatal);
