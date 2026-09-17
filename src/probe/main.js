import {createTokenSession, DriveError} from '../drive/auth.js';
import {createDriveClient} from '../drive/client.js';
import {createProbeController} from './controller.js';
import {openProbeStore} from './store.js';

const byId = (id) => document.getElementById(id);
const elements = Object.fromEntries([
  'client-id', 'prepare', 'connect', 'find-folders', 'create-folder', 'folder-select',
  'join-folder', 'add-answer', 'sync', 'repeat-upload', 'preview-reset', 'confirm-reset',
  'cancel-reset', 'reset-confirmation', 'answer-count', 'points', 'pending-count',
  'late-count', 'conflict-state', 'oauth-state', 'folder-state', 'status',
].map((id) => [id, byId(id)]));

let controller;
let driveClient;
let tokenSession;
let prepared = false;
let connected = false;
let busy = false;
let foundFolders = new Map();

const driveProxy = Object.fromEntries([
  'accountId', 'generateId', 'listFiles', 'metadata', 'readJson', 'createFolder', 'putJson',
].map((method) => [method, (...args) => {
  if (!driveClient) throw new Error('Google Drive ist noch nicht verbunden.');
  return driveClient[method](...args);
}]));

function showStatus(message, tone = 'normal') {
  elements.status.textContent = message;
  elements.status.dataset.tone = tone;
}

function safeMessage(error) {
  if (error instanceof DriveError || error instanceof Error) {
    const message = String(error.message ?? '');
    if (message && !/[\r\n]/.test(message) && message.length <= 220) return message;
  }
  return 'Die Aktion konnte nicht abgeschlossen werden. Bitte erneut versuchen.';
}

function render() {
  const state = controller?.state();
  const scopeReady = Boolean(state?.scope);
  const projection = state?.projection ?? {answerCount: 0, points: 0, lateAnswers: [], conflict: false};
  const hasFolderChoice = elements['folder-select'].value !== '';

  elements['answer-count'].textContent = String(projection.answerCount);
  elements.points.textContent = String(projection.points);
  elements['pending-count'].textContent = String(state?.pendingUploads.length ?? 0);
  elements['late-count'].textContent = String(projection.lateAnswers.length);
  elements['conflict-state'].hidden = !projection.conflict;

  elements.prepare.disabled = busy || elements['client-id'].value.trim() === '';
  elements.connect.disabled = busy || !prepared;
  elements['find-folders'].disabled = busy || !connected;
  elements['create-folder'].disabled = busy || !connected || scopeReady;
  elements['folder-select'].disabled = busy || !connected || foundFolders.size === 0;
  elements['join-folder'].disabled = busy || !connected || !hasFolderChoice;
  elements['add-answer'].disabled = busy || !scopeReady || projection.conflict;
  elements.sync.disabled = busy || !connected || !scopeReady;
  elements['repeat-upload'].disabled = busy || !connected || !state?.lastConfirmedUpload;
  elements['preview-reset'].disabled = busy || !connected || !scopeReady || projection.conflict;
  elements['confirm-reset'].disabled = busy || !connected || !scopeReady;
  elements['cancel-reset'].disabled = busy;

  if (prepared) {
    elements['oauth-state'].textContent = connected
      ? 'Google ist für diese geöffnete Sitzung verbunden. Das Zugriffstoken wird nicht gespeichert.'
      : 'Anmeldung ist vorbereitet. „Mit Google verbinden“ muss direkt angeklickt werden.';
  } else if (!navigator.onLine) {
    elements['oauth-state'].textContent = 'Offline: Google kann nicht vorbereitet werden. Bereits lokale Testdaten bleiben verfügbar.';
  } else {
    elements['oauth-state'].textContent = 'Noch keine Client-ID vorbereitet. Es wird kein Zugriffstoken dauerhaft gespeichert.';
  }
  elements['folder-state'].textContent = scopeReady
    ? `Probeordner ausgewählt: ${state.scope.folderId}. Dieses Browserprofil bleibt fest an diesen Probestand gebunden.`
    : 'Noch kein Probeordner ausgewählt. Ohne Ordner werden keine Testantworten angelegt.';
}

function run(action, successMessage) {
  if (busy) return Promise.resolve();
  busy = true;
  render();
  let operation;
  try {
    operation = action();
  } catch (error) {
    busy = false;
    render();
    showStatus(safeMessage(error), 'error');
    return Promise.reject(error);
  }
  return Promise.resolve(operation)
    .then(() => {
      if (successMessage) showStatus(successMessage, 'success');
    })
    .catch((error) => {
      showStatus(safeMessage(error), 'error');
    })
    .finally(() => {
      busy = false;
      render();
    });
}

function loadGis() {
  if (globalThis.google?.accounts?.oauth2) return Promise.resolve(globalThis.google.accounts.oauth2);
  return new Promise((resolve, reject) => {
    const previous = document.getElementById('google-gis');
    if (previous) previous.remove();
    const script = document.createElement('script');
    script.id = 'google-gis';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      const oauth2 = globalThis.google?.accounts?.oauth2;
      if (oauth2) resolve(oauth2);
      else reject(new Error('Google Identity Services wurde nicht vollständig geladen.'));
    };
    script.onerror = () => {
      script.remove();
      reject(new Error('Google Identity Services konnte nicht geladen werden. Offline bleibt die Probe lokal nutzbar.'));
    };
    document.head.append(script);
  });
}

function populateFolders(folders) {
  foundFolders = new Map(folders.map((folder) => [folder.id, folder]));
  elements['folder-select'].replaceChildren();
  const prompt = document.createElement('option');
  prompt.value = '';
  if (folders.length === 0) {
    prompt.textContent = 'Keine bestehenden Probeordner gefunden';
    elements['folder-select'].append(prompt);
    return;
  }
  prompt.textContent = 'Bitte Probeordner auswählen';
  elements['folder-select'].append(prompt);
  for (const folder of folders) {
    const option = document.createElement('option');
    option.value = folder.id;
    option.textContent = folder.name;
    elements['folder-select'].append(option);
  }
}

elements['client-id'].addEventListener('input', render);
elements.prepare.addEventListener('click', () => run(async () => {
  const clientId = elements['client-id'].value.trim();
  await controller.setClientId(clientId);
  const oauth2 = await loadGis();
  tokenSession?.disconnect();
  tokenSession = createTokenSession({oauth2, clientId});
  driveClient = createDriveClient({getToken: tokenSession.getToken});
  connected = false;
  prepared = true;
}, 'Google-Anmeldung ist vorbereitet. Jetzt direkt „Mit Google verbinden“ anklicken.'));

elements.connect.addEventListener('click', () => run(() => {
  const connection = tokenSession.connect();
  return connection.then(() => { connected = true; });
}, 'Google ist für diese Sitzung verbunden.'));

elements['find-folders'].addEventListener('click', () => run(async () => {
  const folders = await controller.findFolders();
  populateFolders(folders);
  showStatus(
    folders.length === 0 ? 'Keine bestehenden Probeordner gefunden.' : `${folders.length} Probeordner gefunden.`,
    folders.length === 0 ? 'normal' : 'success',
  );
}, ''));

elements['create-folder'].addEventListener('click', () => run(
  () => controller.createFolder(),
  'Eindeutiger Probeordner wurde erstellt und ausgewählt.',
));

elements['folder-select'].addEventListener('change', render);
elements['join-folder'].addEventListener('click', () => run(async () => {
  const selected = foundFolders.get(elements['folder-select'].value);
  if (!selected) throw new Error('Bitte zuerst einen gefundenen Probeordner auswählen.');
  await controller.selectFolder(selected);
}, 'Der vorhandene Probeordner wurde überprüft und ausgewählt.'));

elements['add-answer'].addEventListener('click', () => run(
  () => controller.addAnswer(),
  'Eine richtige synthetische Antwort wurde lokal gespeichert.',
));

elements.sync.addEventListener('click', () => run(
  () => controller.sync(),
  'Lokale und entfernte Probeereignisse wurden abgeglichen.',
));

elements['repeat-upload'].addEventListener('click', () => run(
  () => controller.repeatLastUpload(),
  'Der letzte bestätigte Upload wurde mit derselben ID erneut geprüft.',
));

elements['preview-reset'].addEventListener('click', () => {
  elements['reset-confirmation'].hidden = false;
  elements['confirm-reset'].focus();
});
elements['cancel-reset'].addEventListener('click', () => {
  elements['reset-confirmation'].hidden = true;
  elements['preview-reset'].focus();
});
elements['confirm-reset'].addEventListener('click', () => run(async () => {
  await controller.restoreEmpty();
  elements['reset-confirmation'].hidden = true;
}, 'Die synthetische Probe wurde nach bestätigter Sicherung auf einen leeren Stand gesetzt.'));

globalThis.addEventListener('online', () => {
  render();
  showStatus('Netzwerk ist wieder verfügbar. Google muss bei Bedarf erneut verbunden werden.');
});
globalThis.addEventListener('offline', () => {
  connected = false;
  render();
  showStatus('Offline. Lokale Testantworten bleiben erhalten; der Drive-Abgleich wartet.', 'normal');
});

async function start() {
  try {
    const store = await openProbeStore();
    controller = createProbeController({store, drive: driveProxy});
    const state = await controller.load();
    elements['client-id'].value = state.clientId;
    render();
    showStatus(
      state.scope
        ? 'Lokaler Probestand geladen. Für Drive-Aktionen Google erneut vorbereiten und verbinden.'
        : 'Lokaler Speicher bereit. Beginne mit der öffentlichen Client-ID.',
      'success',
    );
  } catch (error) {
    showStatus(safeMessage(error), 'error');
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js', {scope: './'}).catch(() => {
      // Offline installation is helpful but must not block the local probe.
    });
  }
}

start();
