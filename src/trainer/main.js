import {createCommands, productStateHash} from './commands.js';
import {createPinGate} from './adult/pin.js';
import {createRestoreService} from './backup/restore.js';
import {createTokenSession, DriveError, withFreshAuth} from '../drive/auth.js';
import {createServerAuth} from '../drive/server-auth.js';
import {createDriveClient} from '../drive/client.js';
import {openProductStore} from './storage/store.js';
import {createProductSync} from './sync/drive.js';
import {createPurchaseTransport} from './purchases/transport.js';
import {createPurchaseService, purchasePreviewStateHash} from './purchases/service.js';
import {createCommerceIntegration} from './purchases/integration.js';
import {digest} from './model/canonical.js';
import {createLocalChangeNotifier, createSyncScheduler} from './sync/scheduler.js';
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
let resumeServerSession = null;
let stopServerResume = null;

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
    snapshot() {
      return {session, revision: session?.snapshot() ?? null};
    },
    invalidateIfCurrent(snapshot) {
      if (session !== snapshot.session || session === null) return false;
      const invalidated = session.invalidateIfCurrent(snapshot.revision);
      if (invalidated) shell?.syncStatusChanged(syncController?.getStatus());
      return invalidated;
    },
    clearLocal() {
      session?.clearLocal();
      session = null;
      sessionClientId = '';
    },
    disconnect() {
      session?.disconnect();
      session = null;
      sessionClientId = '';
    },
  };
}

function invalidateOnAuth(service, authSession) {
  const wrapped = {...service};
  for (const [name, method] of Object.entries(service)) {
    if (typeof method !== 'function' || ['getStatus', 'destroy'].includes(name)) continue;
    wrapped[name] = (...args) => withFreshAuth(authSession, () => method(...args));
  }
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

function hideUpdateAvailable() {
  updateNotice?.remove();
  updateNotice = null;
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
      onUnavailable: hideUpdateAvailable,
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
  const serverMode = APP_CONFIG.authMode === 'server';
  auth = serverMode
    ? createServerAuth({
      onChange: () => shell?.syncStatusChanged(syncController?.getStatus()),
      onExpired: () => queueMicrotask(() => resumeServerSession?.()),
    })
    : createProductAuth();
  const driveFetch = serverMode ? (url, init) => auth.fetchDrive(url, init) : globalThis.fetch;
  const getAccountId = serverMode ? (marker) => auth.accountIdForMarker(marker) : undefined;
  const drive = createDriveClient({getToken: () => auth.getToken(), getAccountId, fetchImpl: driveFetch});
  const purchaseTransportFor = ({binding, descriptorHash}) => createPurchaseTransport({
    getToken: () => auth.getToken(), getAccountId, fetchImpl: driveFetch, binding, descriptorHash,
  });
  let rawSync;
  const commerceIntegration = createCommerceIntegration({
    commands, drive, transportFor: purchaseTransportFor,
    learningSync: () => rawSync.syncLearning(),
    now: () => new Date(), id: () => crypto.randomUUID(),
  });
  rawSync = createProductSync({
    drive, store, commands, now: () => new Date(), id: () => crypto.randomUUID(),
    commerce: commerceIntegration,
    onStatus: (status) => {
      shell?.syncStatusChanged(status);
    },
  });
  syncController = invalidateOnAuth(rawSync, auth);
  let purchaseRuntime = null;
  let purchaseRuntimeKey = null;
  async function currentPurchaseService() {
    const state = commands.getState();
    if (!state || state.binding === null) {
      throw new Error('Der gemeinsame Lernbereich ist noch nicht verbunden.');
    }
    const descriptorHash = await digest(state.ledger.descriptor);
    const key = JSON.stringify({binding: state.binding, descriptorHash});
    if (purchaseRuntime === null || purchaseRuntimeKey !== key) {
      purchaseRuntime = createPurchaseService({
        commands,
        transport: purchaseTransportFor({binding: state.binding, descriptorHash}),
        sync: commerceIntegration,
        now: () => new Date(), id: () => crypto.randomUUID(), onStatus: () => {},
      });
      purchaseRuntimeKey = key;
    }
    return purchaseRuntime;
  }
  async function purchaseCall(name, ...args) {
    return withFreshAuth(auth, async () => {
      const service = await currentPurchaseService();
      return await service[name](...args);
    });
  }
  const commerce = Object.freeze({
    isConnected() {
      try {
        auth.getToken();
        return true;
      } catch {
        return false;
      }
    },
    async previewActivation() {
      const state = commands.getState();
      if (!state?.binding) throw new Error('Der gemeinsame Lernbereich ist noch nicht verbunden.');
      return {
        ticket: {
          stateHash: await purchasePreviewStateHash(state),
          binding: structuredClone(state.binding),
          descriptorHash: await digest(state.ledger.descriptor),
        },
        previewState: {ledger: structuredClone(state.ledger)},
      };
    },
    async activate(ticket) {
      const state = commands.getState();
      if (!ticket || await purchasePreviewStateHash(state) !== ticket.stateHash) {
        const error = new Error('Der Datenstand hat sich seit der Vorschau geändert.');
        error.code = 'stale';
        throw error;
      }
      const prepared = await purchaseCall('prepareActivation', {
        binding: ticket.binding, descriptorHash: ticket.descriptorHash,
      });
      return purchaseCall('confirmActivation', prepared.operationId);
    },
    getView: (...args) => purchaseCall('getView', ...args),
    refresh: (...args) => purchaseCall('refresh', ...args),
    preview: (...args) => purchaseCall('preview', ...args),
    confirm: (...args) => purchaseCall('confirm', ...args),
    resume: (...args) => purchaseCall('resume', ...args),
    select: (...args) => purchaseCall('select', ...args),
    clearSelection: (...args) => purchaseCall('clearSelection', ...args),
  });
  const commerceRestore = {
    async prepareRestore(input) { return (await currentPurchaseService()).prepareRestore(input); },
    async confirmRestore(operationId) { return (await currentPurchaseService()).confirmRestore(operationId); },
    async resume(operationId) { return (await currentPurchaseService()).resume(operationId); },
  };
  const restore = invalidateOnAuth(createRestoreService({
    commands, store, sync: syncController, drive, now: () => new Date(), id: () => crypto.randomUUID(),
    commerce: () => commerceRestore,
  }), auth);
  scheduler = createSyncScheduler({
    sync: () => syncController.sync(),
    hasChanges: () => {
      const state = commands.getState();
      return Boolean(state && (state.outboxEventIds.length > 0 || state.pendingPackets.length > 0));
    },
    now: () => Date.now(),
  });
  shell = mountShell({
    root, commands, pinGate, sync: syncController, restore, auth, commerce,
    onDownload: downloadBlob,
    onConnected: () => {
      if (!closing && pinGate.isUnlocked() && commands.getState()?.binding) scheduler?.online();
    },
  });
  shell.render();
  if (serverMode) {
    const delays = [1_000, 2_000, 4_000, 8_000, 16_000];
    let retryIndex = 0;
    let retryTimer = null;
    let pending = null;
    let confirmedAbsent = false;
    resumeServerSession = () => {
      if (closing || document.hidden || !navigator.onLine || confirmedAbsent || pending) return;
      try { auth.getToken(); return; } catch { /* No local session yet. */ }
      if (retryTimer !== null) { clearTimeout(retryTimer); retryTimer = null; }
      pending = auth.resume().then((connected) => {
        retryIndex = 0;
        confirmedAbsent = !connected;
        if (connected && !closing && commands.getState()?.binding) scheduler?.online();
      }).catch((error) => {
        if ((error?.code === 'network' || error?.code === 'retryable') && retryIndex < delays.length
          && !closing && navigator.onLine && !document.hidden) {
          const delay = delays[retryIndex++];
          retryTimer = setTimeout(() => { retryTimer = null; resumeServerSession?.(); }, delay);
        }
      }).finally(() => { pending = null; });
    };
    stopServerResume = () => {
      if (retryTimer !== null) clearTimeout(retryTimer);
      retryTimer = null;
      pending = null;
      resumeServerSession = null;
    };
    resumeServerSession();
  }
  await startUpdates(commands);
  const notifyLocalChange = createLocalChangeNotifier({scheduler, initialState: commands.getState()});
  unsubscribeScheduler = commands.subscribe((state) => {
    refreshUpdateNotice(commands);
    notifyLocalChange(state);
  });
  schedulerVisibility = () => {
    scheduler?.visibility(!document.hidden && navigator.onLine);
    if (!document.hidden && navigator.onLine) resumeServerSession?.();
  };
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
  stopServerResume?.();
  if (schedulerVisibility) {
    document.removeEventListener('visibilitychange', schedulerVisibility);
    removeEventListener('offline', schedulerVisibility);
  }
  if (schedulerOnline) removeEventListener('online', schedulerOnline);
  syncController?.destroy();
  updates?.destroy();
  updateNotice?.remove();
  updateNotice = null;
  auth?.clearLocal();
  shell?.destroy();
  store?.close();
}

addEventListener('pagehide', close);
addEventListener('pageshow', (event) => {
  if (event.persisted) location.reload();
});

start().catch(showFatal);
