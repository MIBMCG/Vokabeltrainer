import {ProductError} from '../model/errors.js';

const DATABASE_NAME = 'vokabeltrainer-product-v1';
const STORE_NAME = 'product-state';
const STATE_KEY = 'current';
const LOCK_NAME = 'vokabeltrainer-product-v1-writer';

function storage(message) {
  return new ProductError('storage', message);
}

function locked(message) {
  return new ProductError('locked', message);
}

function acquireExclusiveLock(locks) {
  if (!locks || typeof locks.request !== 'function') {
    return Promise.reject(locked('Dieser Browser unterstützt die nötige Schreibsperre nicht.'));
  }

  let release;
  const hold = new Promise((resolve) => { release = resolve; });
  const acquired = new Promise((resolve, reject) => {
    let request;
    try {
      request = locks.request(LOCK_NAME, {mode: 'exclusive', ifAvailable: true}, async (lock) => {
        if (!lock) {
          reject(locked('Der Vokabeltrainer ist bereits in einem anderen Tab geöffnet.'));
          return;
        }
        resolve(release);
        await hold;
      });
    } catch {
      reject(locked('Die Schreibsperre konnte nicht gestartet werden.'));
      return;
    }
    Promise.resolve(request).catch(() => {
      reject(locked('Die Schreibsperre wurde unerwartet beendet.'));
    });
  });
  return acquired;
}

function openDatabase(indexedDBImpl) {
  return new Promise((resolve, reject) => {
    let request;
    try {
      request = indexedDBImpl.open(DATABASE_NAME, 1);
    } catch {
      reject(storage('Der lokale Produktspeicher konnte nicht geöffnet werden.'));
      return;
    }
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(storage('Der lokale Produktspeicher konnte nicht geöffnet werden.'));
    request.onblocked = () => reject(storage('Der lokale Produktspeicher wird noch verwendet.'));
  });
}

function loadState(database) {
  return new Promise((resolve, reject) => {
    let transaction;
    let request;
    try {
      transaction = database.transaction(STORE_NAME, 'readonly');
      request = transaction.objectStore(STORE_NAME).get(STATE_KEY);
    } catch {
      reject(storage('Die lokalen Produktdaten konnten nicht gelesen werden.'));
      return;
    }
    let result;
    request.onsuccess = () => { result = request.result; };
    request.onerror = () => reject(storage('Die lokalen Produktdaten konnten nicht gelesen werden.'));
    transaction.oncomplete = () => resolve(result === undefined ? null : structuredClone(result));
    transaction.onerror = () => reject(storage('Die lokalen Produktdaten konnten nicht gelesen werden.'));
    transaction.onabort = () => reject(storage('Das Lesen der lokalen Produktdaten wurde abgebrochen.'));
  });
}

function saveState(database, state) {
  return new Promise((resolve, reject) => {
    let transaction;
    try {
      transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(structuredClone(state), STATE_KEY);
    } catch {
      reject(storage('Die lokalen Produktdaten konnten nicht gespeichert werden.'));
      return;
    }
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(storage('Die lokalen Produktdaten konnten nicht gespeichert werden.'));
    transaction.onabort = () => reject(storage('Das Speichern der lokalen Produktdaten wurde abgebrochen.'));
  });
}

export async function openProductStore({
  indexedDBImpl = globalThis.indexedDB,
  locks = globalThis.navigator?.locks,
} = {}) {
  if (!indexedDBImpl || typeof indexedDBImpl.open !== 'function') {
    throw storage('Dieser Browser stellt keinen lokalen Produktspeicher bereit.');
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
  return {
    load() {
      if (closed) return Promise.reject(storage('Der lokale Produktspeicher ist geschlossen.'));
      return loadState(database);
    },
    save(state) {
      if (closed) return Promise.reject(storage('Der lokale Produktspeicher ist geschlossen.'));
      return saveState(database, state);
    },
    close() {
      if (closed) return;
      closed = true;
      database.close();
      releaseLock();
    },
  };
}
