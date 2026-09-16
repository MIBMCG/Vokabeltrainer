const DRIVE_API_ORIGIN = 'https://www.googleapis.com';
const DRIVE_API_ROOT = `${DRIVE_API_ORIGIN}/drive/v3`;
const DRIVE_UPLOAD_ROOT = `${DRIVE_API_ORIGIN}/upload/drive/v3`;
const METADATA_FIELDS = 'id,name,mimeType,parents,appProperties,trashed';
const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';
const JSON_MIME_TYPE = 'application/json';
const SAFE_ID = /^[A-Za-z0-9_-]+$/;

export class DriveError extends Error {
  constructor(code, message, status) {
    super(message);
    this.name = 'DriveError';
    this.code = code;
    if (status !== undefined) this.status = status;
  }
}

function invalid(message = 'Ungültige Drive-Daten.') {
  return new DriveError('invalid', message);
}

function assertId(value, label = 'Datei-ID') {
  if (typeof value !== 'string' || !SAFE_ID.test(value)) {
    throw invalid(`${label} ist ungültig.`);
  }
  return value;
}

function assertNonemptyString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw invalid(`${label} fehlt.`);
  }
  return value;
}

function assertAppProperties(value) {
  if (!isPlainObject(value)) throw invalid('Drive-Dateieigenschaften sind ungültig.');
  for (const [key, propertyValue] of Object.entries(value)) {
    if (key === '' || typeof propertyValue !== 'string') {
      throw invalid('Drive-Dateieigenschaften sind ungültig.');
    }
  }
  return value;
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function validateMetadata(value) {
  if (!isPlainObject(value)) throw invalid('Drive-Metadaten sind ungültig.');
  assertId(value.id);
  assertNonemptyString(value.name, 'Dateiname');
  assertNonemptyString(value.mimeType, 'MIME-Typ');
  if (!Array.isArray(value.parents) || !value.parents.every((parent) => typeof parent === 'string' && SAFE_ID.test(parent))) {
    throw invalid('Drive-Elternordner sind ungültig.');
  }
  assertAppProperties(value.appProperties);
  if (typeof value.trashed !== 'boolean') throw invalid('Drive-Papierkorbstatus ist ungültig.');
  return value;
}

function ensureJsonValue(value, seen = new WeakSet()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw invalid('JSON enthält keine endliche Zahl.');
    return;
  }
  if (Array.isArray(value)) {
    if (seen.has(value)) throw invalid('JSON enthält einen Kreisbezug.');
    seen.add(value);
    for (let index = 0; index < value.length; index += 1) {
      if (!(index in value)) throw invalid('JSON enthält eine leere Array-Position.');
      ensureJsonValue(value[index], seen);
    }
    seen.delete(value);
    return;
  }
  if (isPlainObject(value)) {
    if (seen.has(value)) throw invalid('JSON enthält einen Kreisbezug.');
    seen.add(value);
    for (const child of Object.values(value)) ensureJsonValue(child, seen);
    seen.delete(value);
    return;
  }
  throw invalid('Wert ist kein gültiges JSON.');
}

function canonicalJson(value) {
  ensureJsonValue(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (isPlainObject(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function sameJson(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function classifyHttpError(status) {
  if (status === 401) return new DriveError('auth', 'Google-Zugriff muss erneuert werden.', status);
  if (status === 403) return new DriveError('permission', 'Google Drive hat den Zugriff abgelehnt.', status);
  if (status === 404) return new DriveError('missing', 'Die Drive-Datei wurde nicht gefunden.', status);
  if (status === 409) return new DriveError('conflict', 'Die Drive-Datei ist bereits vorhanden.', status);
  if (status === 408 || status === 429 || status >= 500) {
    return new DriveError('retryable', 'Google Drive ist vorübergehend nicht erreichbar.', status);
  }
  return new DriveError('invalid', 'Google Drive hat die Anfrage abgelehnt.', status);
}

async function parseJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    throw invalid('Google Drive hat ungültiges JSON geliefert.');
  }
}

function buildUrl(root, path, search = {}) {
  const url = new URL(path, root.endsWith('/') ? root : `${root}/`);
  for (const [key, value] of Object.entries(search)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url;
}

function assertVerifiedMetadata(actual, expected, {checkParents}) {
  validateMetadata(actual);
  const matches = actual.id === expected.id
    && actual.name === expected.name
    && actual.mimeType === expected.mimeType
    && actual.trashed === false
    && sameJson(actual.appProperties, expected.appProperties)
    && (!checkParents || (actual.parents.length === 1 && actual.parents[0] === expected.parentId));
  if (!matches) throw new DriveError('conflict', 'Vorhandene Drive-Datei stimmt nicht mit dem lokalen Inhalt überein.');
  return actual;
}

let boundaryCounter = 0;
function makeBoundary() {
  boundaryCounter += 1;
  return `vt_probe_${Date.now().toString(36)}_${boundaryCounter.toString(36)}`;
}

export function createDriveClient({getToken, fetchImpl = globalThis.fetch} = {}) {
  if (typeof getToken !== 'function' || typeof fetchImpl !== 'function') {
    throw invalid('Drive-Client ist nicht vollständig konfiguriert.');
  }

  async function request(url, init = {}, acceptedStatuses = []) {
    let token;
    try {
      token = await getToken();
    } catch (error) {
      if (error instanceof DriveError) throw error;
      throw new DriveError('auth', 'Google-Zugriff ist nicht verfügbar.');
    }
    if (typeof token !== 'string' || token.trim() === '') {
      throw new DriveError('auth', 'Google-Zugriff ist nicht verfügbar.');
    }

    let response;
    try {
      response = await fetchImpl(url, {
        ...init,
        method: init.method ?? 'GET',
        headers: {
          ...(init.headers ?? {}),
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      throw new DriveError('network', 'Google Drive konnte nicht erreicht werden.');
    }
    if (!response || typeof response.status !== 'number' || typeof response.ok !== 'boolean') {
      throw invalid('Google Drive hat keine gültige HTTP-Antwort geliefert.');
    }
    if (!response.ok && !acceptedStatuses.includes(response.status)) {
      throw classifyHttpError(response.status);
    }
    return response;
  }

  async function accountId() {
    const url = buildUrl(DRIVE_API_ROOT, 'about', {fields: 'user(permissionId)'});
    const result = await parseJsonResponse(await request(url));
    const permissionId = result?.user?.permissionId;
    return assertNonemptyString(permissionId, 'Google-Kontokennung');
  }

  async function generateId() {
    const url = buildUrl(DRIVE_API_ROOT, 'files/generateIds', {count: 1, space: 'drive', type: 'files'});
    const result = await parseJsonResponse(await request(url));
    if (!isPlainObject(result) || !Array.isArray(result.ids) || result.ids.length !== 1) {
      throw invalid('Google Drive hat keine eindeutige Datei-ID geliefert.');
    }
    return assertId(result.ids[0], 'Erzeugte Datei-ID');
  }

  async function listFiles(query) {
    assertNonemptyString(query, 'Drive-Suchabfrage');
    const files = [];
    let pageToken;
    do {
      const url = buildUrl(DRIVE_API_ROOT, 'files', {
        q: query,
        spaces: 'drive',
        pageSize: 1000,
        fields: `nextPageToken,incompleteSearch,files(${METADATA_FIELDS})`,
        pageToken,
      });
      const result = await parseJsonResponse(await request(url));
      if (!isPlainObject(result)
        || !Array.isArray(result.files)
        || result.incompleteSearch !== false
        || (result.nextPageToken !== undefined
          && (typeof result.nextPageToken !== 'string' || result.nextPageToken === ''))) {
        throw invalid('Drive-Suchergebnis ist unvollständig oder ungültig.');
      }
      files.push(...result.files.map(validateMetadata));
      pageToken = result.nextPageToken;
    } while (pageToken !== undefined);
    return files;
  }

  async function metadata(id) {
    assertId(id);
    const url = buildUrl(DRIVE_API_ROOT, `files/${encodeURIComponent(id)}`, {fields: METADATA_FIELDS});
    return validateMetadata(await parseJsonResponse(await request(url)));
  }

  async function readJson(id) {
    assertId(id);
    const url = buildUrl(DRIVE_API_ROOT, `files/${encodeURIComponent(id)}`, {alt: 'media'});
    const value = await parseJsonResponse(await request(url));
    ensureJsonValue(value);
    return value;
  }

  async function createFolder({id, name, appProperties} = {}) {
    assertId(id);
    assertNonemptyString(name, 'Ordnername');
    assertAppProperties(appProperties);
    const expected = {id, name, mimeType: FOLDER_MIME_TYPE, appProperties};
    const url = buildUrl(DRIVE_API_ROOT, 'files', {fields: METADATA_FIELDS});
    await request(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json; charset=UTF-8'},
      body: JSON.stringify(expected),
    }, [409]);
    return assertVerifiedMetadata(await metadata(id), expected, {checkParents: false});
  }

  async function putJson({id, name, parentId, appProperties, value} = {}) {
    assertId(id);
    assertId(parentId, 'Elternordner-ID');
    assertNonemptyString(name, 'Dateiname');
    assertAppProperties(appProperties);
    ensureJsonValue(value);
    const expected = {id, name, mimeType: JSON_MIME_TYPE, parentId, appProperties};
    const uploadMetadata = {
      id,
      name,
      mimeType: JSON_MIME_TYPE,
      parents: [parentId],
      appProperties,
    };
    const boundary = makeBoundary();
    const body = [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      JSON.stringify(uploadMetadata),
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      JSON.stringify(value),
      `--${boundary}--`,
      '',
    ].join('\r\n');
    const url = buildUrl(DRIVE_UPLOAD_ROOT, 'files', {uploadType: 'multipart', fields: METADATA_FIELDS});
    await request(url, {
      method: 'POST',
      headers: {'Content-Type': `multipart/related; boundary=${boundary}`},
      body,
    }, [409]);

    const verified = assertVerifiedMetadata(await metadata(id), expected, {checkParents: true});
    const storedValue = await readJson(id);
    if (!sameJson(storedValue, value)) {
      throw new DriveError('conflict', 'Vorhandene Drive-Datei enthält andere JSON-Daten.');
    }
    return verified;
  }

  return {accountId, generateId, listFiles, metadata, readJson, createFolder, putJson};
}
