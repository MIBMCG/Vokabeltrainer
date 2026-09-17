const DATABASE_NAME = 'vokabeltrainer-verbindungsprobe';
const STORE_NAME = 'probe-state';
const STATE_KEY = 'current';
const LOCK_NAME = 'vokabeltrainer-verbindungsprobe-active-tab';

function openDatabase(indexedDBImpl) {
  return new Promise((resolve, reject) => {
    let request;
    try {
      request = indexedDBImpl.open(DATABASE_NAME, 1);
    } catch {
      reject(new Error('Der lokale Browser-Speicher konnte nicht geöffnet werden.'));
      return;
    }
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Der lokale Browser-Speicher konnte nicht geöffnet werden.'));
    request.onblocked = () => reject(new Error('Der lokale Browser-Speicher wird noch von einem anderen Fenster verwendet.'));
  });
}

function acquireExclusiveLock(locks) {
  if (!locks || typeof locks.request !== 'function') {
    return Promise.reject(new Error('Dieser Browser unterstützt den nötigen Einzelfenster-Modus nicht.'));
  }

  let release;
  const hold = new Promise((resolve) => { release = resolve; });
  const acquired = new Promise((resolve, reject) => {
    let request;
    try {
      request = locks.request(LOCK_NAME, {mode: 'exclusive', ifAvailable: true}, async (lock) => {
        if (!lock) {
          reject(new Error('Die Verbindungsprobe ist bereits in einem anderen Tab oder Fenster geöffnet.'));
          return;
        }
        resolve();
        await hold;
      });
    } catch {
      reject(new Error('Der Einzelfenster-Modus konnte nicht gestartet werden.'));
      return;
    }
    Promise.resolve(request).catch(() => {
      reject(new Error('Der Einzelfenster-Modus wurde unerwartet beendet.'));
    });
  });
  return acquired.then(() => release);
}

function loadState(database) {
  return new Promise((resolve, reject) => {
    let transaction;
    let request;
    try {
      transaction = database.transaction(STORE_NAME, 'readonly');
      request = transaction.objectStore(STORE_NAME).get(STATE_KEY);
    } catch {
      reject(new Error('Lokale Probedaten konnten nicht gelesen werden.'));
      return;
    }
    let result;
    request.onsuccess = () => { result = request.result; };
    request.onerror = () => reject(new Error('Lokale Probedaten konnten nicht gelesen werden.'));
    transaction.oncomplete = () => resolve(result === undefined ? null : structuredClone(result));
    transaction.onerror = () => reject(new Error('Lokale Probedaten konnten nicht gelesen werden.'));
    transaction.onabort = () => reject(new Error('Das Lesen lokaler Probedaten wurde abgebrochen.'));
  });
}

function saveState(database, state) {
  return new Promise((resolve, reject) => {
    let transaction;
    try {
      transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(structuredClone(state), STATE_KEY);
    } catch {
      reject(new Error('Lokale Probedaten konnten nicht gespeichert werden.'));
      return;
    }
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error('Lokale Probedaten konnten nicht gespeichert werden.'));
    transaction.onabort = () => reject(new Error('Das Speichern lokaler Probedaten wurde abgebrochen.'));
  });
}

export async function openProbeStore({
  indexedDBImpl = globalThis.indexedDB,
  locks = globalThis.navigator?.locks,
} = {}) {
  if (!indexedDBImpl || typeof indexedDBImpl.open !== 'function') {
    throw new Error('Dieser Browser stellt keinen lokalen Speicher bereit.');
  }
  const releaseLock = await acquireExclusiveLock(locks);
  let database;
  try {
    database = await openDatabase(indexedDBImpl);
  } catch (error) {
    releaseLock();
    throw error;
  }

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    database.close();
    releaseLock();
  };
  globalThis.addEventListener?.('pagehide', close, {once: true});

  return {
    load: () => loadState(database),
    save: (state) => saveState(database, state),
    close,
  };
}
