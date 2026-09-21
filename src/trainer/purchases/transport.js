import {assertCommerce, assertConfig, assertReceipt, emptyCommerce} from './schema.js';
import {
  assertBinding,
  assertHash,
  assertId,
  assertRef,
  canonical,
  copy,
  digest,
  fail,
  sameBinding,
  sameRef,
} from './value.js';

const API_V2 = 'https://www.googleapis.com/drive/v2/files';
const API_V3 = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_V3 = 'https://www.googleapis.com/upload/drive/v3/files';
const FOLDER = 'application/vnd.google-apps.folder';
const JSON_TYPE = 'application/json';
const PRODUCT_APP = 'vokabeltrainer-product';
export const PURCHASE_APP = 'vokabeltrainer-purchases';
const METADATA_FIELDS = 'id,title,mimeType,parents,properties,labels,version,etag';

function error(code, message, status = null) {
  try {
    fail(code, message);
  } catch (cause) {
    if (status !== null) cause.status = status;
    throw cause;
  }
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function same(left, right) {
  return canonical(left) === canonical(right);
}

function strongEtag(value) {
  return typeof value === 'string'
    && value.length >= 3
    && value.startsWith('"')
    && value.endsWith('"')
    && !value.startsWith('W/');
}

function classify(status) {
  if (status === 401) return ['auth', 'Google-Zugriff muss erneuert werden.'];
  if (status === 403) return ['permission', 'Google Drive hat den Zugriff abgelehnt.'];
  if (status === 404) return ['missing', 'Die Drive-Datei wurde nicht gefunden.'];
  if (status === 409) return ['conflict', 'Die Drive-Datei ist bereits vorhanden.'];
  if (status === 412) return ['stale', 'Der Drive-Stand wurde gleichzeitig geändert.'];
  if (status === 408 || status === 429 || status >= 500) {
    return ['retryable', 'Google Drive ist vorübergehend nicht erreichbar.'];
  }
  return ['invalid', 'Google Drive hat die Anfrage abgelehnt.'];
}

async function responseJson(response) {
  try {
    const value = await response.json();
    if (!isObject(value)) error('invalid', 'Google Drive hat ungültige Metadaten geliefert.', response.status);
    return value;
  } catch (cause) {
    if (cause?.code) throw cause;
    error('invalid', 'Google Drive hat ungültiges JSON geliefert.', response.status);
  }
}

async function contentJson(response) {
  try {
    return await response.json();
  } catch {
    error('invalid', 'Google Drive hat ungültiges JSON geliefert.', response.status);
  }
}

function normalizeProperties(value) {
  if (!Array.isArray(value)) error('binding', 'Die privaten Drive-Eigenschaften sind ungültig.');
  const result = {};
  for (const property of value) {
    if (!isObject(property)
      || typeof property.key !== 'string'
      || typeof property.value !== 'string'
      || property.visibility !== 'PRIVATE'
      || Object.hasOwn(result, property.key)) {
      error('binding', 'Die privaten Drive-Eigenschaften sind ungültig.');
    }
    result[property.key] = property.value;
  }
  return result;
}

function propertiesBody(properties) {
  const entries = Object.entries(properties);
  if (entries.length > 30) error('limit', 'Drive erlaubt höchstens 30 private Eigenschaften.');
  const encoder = new TextEncoder();
  for (const [key, value] of entries) {
    if (typeof value !== 'string') error('binding', 'Eine private Drive-Eigenschaft ist ungültig.');
    if (encoder.encode(key + value).byteLength > 124) {
      error('limit', 'Eine private Drive-Eigenschaft überschreitet 124 UTF-8-Bytes.');
    }
  }
  return entries.sort(([left], [right]) => left.localeCompare(right, 'en'))
    .map(([key, value]) => ({key, value, visibility: 'PRIVATE'}));
}

function configProperties(config, kind, sha256 = null) {
  const properties = {
    app: PURCHASE_APP,
    kind,
    datasetId: config.binding.datasetId,
    descriptorFileId: config.binding.descriptorFileId,
    descriptorHash: config.descriptorHash,
    coordinatorId: config.coordinatorId,
    contentFolderId: config.contentFolderId,
  };
  if (sha256 !== null) properties.sha256 = sha256;
  return properties;
}

function requiredProperties(actual, expected) {
  for (const [key, value] of Object.entries(expected)) {
    if (actual[key] !== value) error('binding', 'Die Drive-Datei gehört nicht zur konfigurierten Kaufhistorie.');
  }
}

function setupAuthorization(raw, expectedBinding, descriptorHash) {
  const commerce = assertCommerce({
    ...emptyCommerce(),
    mode: 'migrating',
    binding: raw?.binding ?? null,
    setup: raw ?? null,
  });
  const setup = commerce.setup;
  if (!sameBinding(setup.binding, expectedBinding) || setup.descriptorHash !== descriptorHash) {
    error('binding', 'Der Einrichtungsauftrag gehört zu einer anderen Produktbindung.');
  }
  if (setup.coordinatorId === null || setup.contentFolderId === null
    || setup.configRef === null || setup.config === null
    || setup.config.coordinatorId !== setup.coordinatorId
    || setup.config.contentFolderId !== setup.contentFolderId
    || setup.config.descriptorHash !== descriptorHash
    || !sameBinding(setup.config.binding, expectedBinding)) {
    error('binding', 'Der Einrichtungsauftrag ist nicht vollständig gebunden.');
  }
  return setup;
}

function immutableName(kind, id) {
  return `${PURCHASE_APP}-${kind}-${id}.json`;
}

let boundarySerial = 0;
function multipartBody(metadata, value) {
  boundarySerial += 1;
  const boundary = `vt_purchases_${boundarySerial.toString(36)}`;
  return {
    contentType: `multipart/related; boundary=${boundary}`,
    body: [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      JSON.stringify(metadata),
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      canonical(value),
      `--${boundary}--`,
      '',
    ].join('\r\n'),
  };
}

export function createPurchaseTransport({fetchImpl = globalThis.fetch, getToken, binding, descriptorHash} = {}) {
  if (typeof fetchImpl !== 'function' || typeof getToken !== 'function') {
    error('invalid', 'Der Kauftransport ist nicht vollständig konfiguriert.');
  }
  const checkedBinding = assertBinding(binding);
  assertHash(descriptorHash);

  async function runtimeToken() {
    let token;
    try {
      token = await getToken();
    } catch {
      error('auth', 'Google-Zugriff ist nicht verfügbar.');
    }
    if (typeof token !== 'string' || token.trim() === '') error('auth', 'Google-Zugriff ist nicht verfügbar.');
    return token;
  }

  async function requestWithToken(url, init = {}, accepted = [], token) {
    let response;
    try {
      response = await fetchImpl(url, {
        ...init,
        method: init.method ?? 'GET',
        headers: {...(init.headers ?? {}), Authorization: `Bearer ${token}`},
      });
    } catch {
      error('network', 'Google Drive konnte nicht erreicht werden.');
    }
    if (!response || typeof response.status !== 'number' || typeof response.ok !== 'boolean') {
      error('invalid', 'Google Drive hat keine gültige HTTP-Antwort geliefert.');
    }
    if (!response.ok && !accepted.includes(response.status)) {
      const [code, message] = classify(response.status);
      error(code, message, response.status);
    }
    return response;
  }

  async function accountIdForToken(token) {
    const response = await requestWithToken(
      'https://www.googleapis.com/drive/v3/about?fields=user(permissionId)',
      {},
      [],
      token,
    );
    const value = await responseJson(response);
    const actual = value?.user?.permissionId;
    if (actual !== checkedBinding.accountId) error('binding', 'Das verbundene Google-Konto stimmt nicht.');
    return actual;
  }

  async function accountId() {
    return accountIdForToken(await runtimeToken());
  }

  async function boundRequest(url, init = {}, accepted = []) {
    const token = await runtimeToken();
    await accountIdForToken(token);
    return requestWithToken(url, init, accepted, token);
  }

  async function reserveId() {
    const response = await boundRequest(`${API_V3}/generateIds?count=1&space=drive&type=files`);
    const value = await responseJson(response);
    if (!Array.isArray(value.ids) || value.ids.length !== 1) error('invalid', 'Drive hat keine eindeutige Datei-ID reserviert.');
    return assertId(value.ids[0]);
  }

  async function metadata(id) {
    assertId(id);
    const response = await boundRequest(`${API_V2}/${encodeURIComponent(id)}?fields=${encodeURIComponent(METADATA_FIELDS)}`, {cache: 'no-store'});
    const value = await responseJson(response);
    if (value.id !== id || typeof value.title !== 'string' || typeof value.mimeType !== 'string'
      || !Array.isArray(value.parents) || value.labels?.trashed !== false
      || typeof value.version !== 'string' || !/^(?:0|[1-9][0-9]*)$/.test(value.version)
      || !strongEtag(value.etag)) {
      error('binding', 'Die Drive-Metadaten sind nicht vollständig gebunden.');
    }
    const parents = value.parents.map((parent) => {
      if (!isObject(parent)) error('binding', 'Die Drive-Elternbindung ist ungültig.');
      return assertId(parent.id);
    });
    return {
      id,
      name: value.title,
      mimeType: value.mimeType,
      parents,
      properties: normalizeProperties(value.properties),
      version: value.version,
      etag: value.etag,
    };
  }

  function checkFolder(snapshot, {id, kind, config}) {
    if (snapshot.id !== id || snapshot.mimeType !== FOLDER) error('binding', 'Der Drive-Ordner stimmt nicht.');
    if (kind === 'dataset') {
      if (id !== checkedBinding.folderId) error('binding', 'Der Bestandsordner stimmt nicht.');
      requiredProperties(snapshot.properties, {
        app: PRODUCT_APP,
        kind: 'dataset-folder',
        datasetId: checkedBinding.datasetId,
      });
      const pointerKeys = ['purchaseApp', 'purchaseConfigId', 'purchaseConfigSha256'];
      const present = pointerKeys.filter((key) => Object.hasOwn(snapshot.properties, key));
      if (present.length !== 0 && present.length !== pointerKeys.length) {
        error('binding', 'Der Kaufkonfigurationsverweis ist unvollständig.');
      }
      if (present.length === pointerKeys.length && snapshot.properties.purchaseApp !== PURCHASE_APP) {
        error('binding', 'Der Kaufkonfigurationsverweis gehört zu einer anderen Anwendung.');
      }
      return;
    }
    const checkedConfig = assertConfig(config);
    const expectedId = kind === 'coordinator' ? checkedConfig.coordinatorId : checkedConfig.contentFolderId;
    if (!['coordinator', 'content'].includes(kind)
      || id !== expectedId
      || snapshot.parents.length !== 1
      || snapshot.parents[0] !== checkedBinding.folderId) {
      error('binding', 'Der Kaufordner stimmt nicht mit der Konfiguration überein.');
    }
    requiredProperties(snapshot.properties, configProperties(checkedConfig, kind));
  }

  async function readFolder({id, kind, config = null} = {}) {
    assertId(id);
    const before = await metadata(id);
    const after = await metadata(id);
    if (before.version !== after.version || before.etag !== after.etag
      || !same(before.properties, after.properties)
      || !same(before.parents, after.parents)) {
      error('stale', 'Der Drive-Ordner hat sich während des Lesens geändert.');
    }
    checkFolder(after, {id, kind, config});
    return copy(after);
  }

  async function createFolder({kind, setup: rawSetup} = {}) {
    const setup = setupAuthorization(rawSetup, checkedBinding, descriptorHash);
    if (!['coordinator', 'content'].includes(kind)) error('invalid', 'Die Kaufordnerrolle ist ungültig.');
    const id = kind === 'coordinator' ? setup.coordinatorId : setup.contentFolderId;
    const metadataValue = {
      id,
      name: `${PURCHASE_APP}-${kind}`,
      mimeType: FOLDER,
      parents: [checkedBinding.folderId],
      appProperties: configProperties(setup.config, kind),
    };
    propertiesBody(metadataValue.appProperties);
    const response = await boundRequest(`${API_V3}?fields=id`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json; charset=UTF-8'},
      body: JSON.stringify(metadataValue),
    }, [409]);
    if (response.status !== 409) {
      const created = await responseJson(response);
      if (created.id !== id) error('binding', 'Drive hat einen anderen Kaufordner angelegt.', response.status);
    }
    return readFolder({id, kind, config: setup.config});
  }

  function immutableContext(ref, {kind, config}) {
    if (kind === 'descriptor') {
      if (ref.id !== checkedBinding.descriptorFileId || ref.sha256 !== descriptorHash) {
        error('binding', 'Die Datensatzbeschreibung stimmt nicht mit der Produktbindung überein.');
      }
      return {
        parentId: checkedBinding.folderId,
        name: null,
        properties: {app: PRODUCT_APP, kind: 'dataset', datasetId: checkedBinding.datasetId},
      };
    }
    if (kind === 'config' && config == null) {
      return {
        discoverConfig: true,
        parentId: null,
        name: immutableName(kind, ref.id),
        properties: {
          app: PURCHASE_APP,
          kind,
          datasetId: checkedBinding.datasetId,
          descriptorFileId: checkedBinding.descriptorFileId,
          descriptorHash,
          sha256: ref.sha256,
        },
      };
    }
    const checkedConfig = assertConfig(config);
    if (!sameBinding(checkedConfig.binding, checkedBinding) || checkedConfig.descriptorHash !== descriptorHash) {
      error('binding', 'Die Kaufkonfiguration stimmt nicht mit dem Transport überein.');
    }
    if (kind !== 'config' && kind !== 'content') error('invalid', 'Die unveränderliche Dateirolle ist ungültig.');
    return {
      parentId: checkedConfig.contentFolderId,
      name: immutableName(kind, ref.id),
      properties: configProperties(checkedConfig, kind, ref.sha256),
    };
  }

  function checkImmutableMetadata(snapshot, ref, context) {
    if (snapshot.id !== ref.id || snapshot.mimeType !== JSON_TYPE
      || snapshot.parents.length !== 1
      || (context.parentId !== null && snapshot.parents[0] !== context.parentId)
      || (context.name !== null && snapshot.name !== context.name)) {
      error('binding', 'Die unveränderliche Drive-Datei ist falsch gebunden.');
    }
    requiredProperties(snapshot.properties, context.properties);
  }

  async function readImmutable(ref, options = {}) {
    assertId(ref?.id);
    assertHash(ref?.sha256);
    const context = immutableContext(ref, options);
    const before = await metadata(ref.id);
    checkImmutableMetadata(before, ref, context);
    const response = await boundRequest(`${API_V2}/${encodeURIComponent(ref.id)}?alt=media`, {cache: 'no-store'});
    const value = await contentJson(response);
    const after = await metadata(ref.id);
    checkImmutableMetadata(after, ref, context);
    if (before.version !== after.version || before.etag !== after.etag
      || !same(before.properties, after.properties)) {
      error('stale', 'Die unveränderliche Drive-Datei hat sich während des Lesens geändert.');
    }
    let actual;
    try {
      actual = await digest(value);
    } catch {
      error('integrity', 'Die unveränderliche Drive-Datei ist nicht kanonisch prüfbar.');
    }
    if (actual !== ref.sha256) error('integrity', 'Der Inhaltshash der Drive-Datei stimmt nicht.');
    if (context.discoverConfig) {
      const discovered = assertConfig(value);
      if (!sameBinding(discovered.binding, checkedBinding) || discovered.descriptorHash !== descriptorHash) {
        error('binding', 'Die gelesene Kaufkonfiguration gehört zu einer anderen Produktbindung.');
      }
      const complete = immutableContext(ref, {kind: 'config', config: discovered});
      checkImmutableMetadata(before, ref, complete);
      checkImmutableMetadata(after, ref, complete);
    }
    return copy(value);
  }

  function attemptAuthorization({commerce: rawCommerce, operationId, attemptId}, ref, value) {
    const commerce = assertCommerce(rawCommerce);
    if (!sameBinding(commerce.binding, checkedBinding) || commerce.config?.descriptorHash !== descriptorHash) {
      error('binding', 'Der Kaufauftrag gehört zu einer anderen Konfiguration.');
    }
    const job = commerce.jobs.find((entry) => entry.intent.operationId === operationId);
    const attempt = job?.attempts.find((entry) => entry.attemptId === attemptId);
    if (!attempt || job.intent.datasetId !== checkedBinding.datasetId) {
      error('binding', 'Der Kaufversuch gehört zu einem anderen Datensatz.');
    }
    const candidateUpload = attempt.uploads.find((entry) => sameRef(entry.ref, attempt.candidate));
    const receipt = assertReceipt(candidateUpload?.value);
    const manifestUpload = attempt.uploads.find((entry) => sameRef(entry.ref, receipt.basis));
    if (receipt.datasetId !== checkedBinding.datasetId
      || receipt.coordinatorId !== commerce.config.coordinatorId
      || receipt.intent?.datasetId !== checkedBinding.datasetId
      || manifestUpload?.value?.datasetId !== checkedBinding.datasetId) {
      error('binding', 'Der gespeicherte Kaufversuch gehört nicht zur konfigurierten Belegfolge.');
    }
    const upload = attempt?.uploads.find((entry) => sameRef(entry.ref, ref));
    if (!upload || canonical(upload.value) !== canonical(value)) {
      error('binding', 'Die Datei ist nicht im gespeicherten Kaufauftrag registriert.');
    }
    return {config: commerce.config, configRef: commerce.configRef, attempt, upload};
  }

  function controlAuthorization({commerce: rawCommerce, operationId}, ref, value) {
    const commerce=assertCommerce(rawCommerce);
    if(!sameBinding(commerce.binding,checkedBinding)||commerce.config?.descriptorHash!==descriptorHash) {
      error('binding','Der Steuerauftrag gehört zu einer anderen Konfiguration.');
    }
    const control=commerce.control;
    if(control===null||control.operationId!==operationId) {
      error('binding','Der Steuerauftrag wurde nicht in diesem Kaufzustand registriert.');
    }
    const candidateUpload=control.uploads.find(entry=>sameRef(entry.ref,control.candidate));
    const receipt=assertReceipt(candidateUpload?.value);
    const manifestUpload=control.uploads.find(entry=>sameRef(entry.ref,receipt.basis));
    if(receipt.datasetId!==checkedBinding.datasetId
      ||receipt.coordinatorId!==commerce.config.coordinatorId
      ||receipt.operation!==control.operation
      ||receipt.operationId!==control.operationId
      ||manifestUpload?.value?.datasetId!==checkedBinding.datasetId) {
      error('binding','Der gespeicherte Steuerauftrag gehört nicht zur konfigurierten Belegfolge.');
    }
    const upload=control.uploads.find(entry=>sameRef(entry.ref,ref));
    if(!upload||canonical(upload.value)!==canonical(value)) {
      error('binding','Die Datei ist nicht im gespeicherten Steuerauftrag registriert.');
    }
    return {config:commerce.config,configRef:commerce.configRef,control,upload};
  }

  async function verifyInstalledConfig(configRef, config) {
    const checkedRef = assertRef(configRef);
    const checkedConfig = assertConfig(config);
    if (!sameBinding(checkedConfig.binding, checkedBinding)
      || checkedConfig.descriptorHash !== descriptorHash
      || await digest(checkedConfig) !== checkedRef.sha256) {
      error('binding', 'Die gespeicherte Kaufkonfiguration stimmt nicht mit ihrer Referenz überein.');
    }
    const root = await readFolder({id: checkedBinding.folderId, kind: 'dataset'});
    if (root.properties.purchaseApp !== PURCHASE_APP
      || root.properties.purchaseConfigId !== checkedRef.id
      || root.properties.purchaseConfigSha256 !== checkedRef.sha256) {
      error('binding', 'Die Kaufkonfiguration ist nicht als Bestandsanker installiert.');
    }
    const installed = await readImmutable(checkedRef, {kind: 'config'});
    if (canonical(installed) !== canonical(checkedConfig)) {
      error('binding', 'Die installierte Kaufkonfiguration stimmt nicht mit dem Auftrag überein.');
    }
    return checkedConfig;
  }

  async function writeImmutable({ref, value, kind = 'content', config, authorization} = {}) {
    assertId(ref?.id);
    assertHash(ref?.sha256);
    let authorizedConfig;
    if (authorization?.kind === 'setup') {
      const setup = setupAuthorization(authorization.setup, checkedBinding, descriptorHash);
      if (kind !== 'config' || !sameRef(ref, setup.configRef)
        || canonical(value) !== canonical(setup.config)) {
        error('binding', 'Die Datei ist nicht im gespeicherten Einrichtungsauftrag registriert.');
      }
      authorizedConfig = setup.config;
    } else if (authorization?.kind === 'attempt') {
      const checked = attemptAuthorization(authorization, ref, value);
      authorizedConfig = await verifyInstalledConfig(checked.configRef, checked.config);
    } else if (authorization?.kind === 'control') {
      const checked=controlAuthorization(authorization,ref,value);
      authorizedConfig=await verifyInstalledConfig(checked.configRef,checked.config);
    } else {
      error('binding', 'Der unveränderlichen Datei fehlt ein gespeicherter Schreibauftrag.');
    }
    if (!same(assertConfig(config), authorizedConfig)) error('binding', 'Die Uploadkonfiguration stimmt nicht.');
    const actualHash = await digest(value);
    if (actualHash !== ref.sha256) error('integrity', 'Der gespeicherte Uploadinhalt stimmt nicht mit seinem Hash überein.');
    const context = immutableContext(ref, {kind, config: authorizedConfig});
    const appProperties = context.properties;
    propertiesBody(appProperties);
    const uploadMetadata = {
      id: ref.id,
      name: context.name,
      mimeType: JSON_TYPE,
      parents: [context.parentId],
      appProperties,
    };
    const multipart = multipartBody(uploadMetadata, value);
    const response = await boundRequest(`${UPLOAD_V3}?uploadType=multipart&fields=id`, {
      method: 'POST',
      headers: {'Content-Type': multipart.contentType},
      body: multipart.body,
    }, [409]);
    if (response.status !== 409) {
      const created = await responseJson(response);
      if (created.id !== ref.id) error('binding', 'Drive hat eine andere unveränderliche Datei angelegt.', response.status);
    }
    return readImmutable(ref, {kind, config: authorizedConfig});
  }

  function assertSnapshot(snapshot, expected) {
    if (!isObject(snapshot) || snapshot.id !== expected.id || !strongEtag(snapshot.etag)
      || typeof snapshot.version !== 'string' || !isObject(snapshot.properties)) {
      error('binding', 'Der gespeicherte Pointerstand ist ungültig.');
    }
  }

  async function putPointer({snapshot, configRef = null, head = null, headValue = null, authorization} = {}) {
    let expected;
    let additions;
    let storedProperties;
    let storedEtag;
    if (authorization?.kind === 'setup') {
      const setup = setupAuthorization(authorization.setup, checkedBinding, descriptorHash);
      if (!sameRef(configRef, setup.configRef) || head !== null) {
        error('binding', 'Der Konfigurationspointer stimmt nicht mit dem gespeicherten Auftrag überein.');
      }
      if (setup.phase !== 'pointer-pending'
        || (snapshot !== undefined && setup.etag !== snapshot.etag)) {
        error('binding', 'Der Konfigurationspointer verwendet nicht die gespeicherte Schreibbedingung.');
      }
      if (snapshot !== undefined) {
        const dataset = {id: checkedBinding.folderId, kind: 'dataset', config: null};
        assertSnapshot(snapshot, dataset);
        checkFolder(snapshot, dataset);
        if (Object.hasOwn(snapshot.properties, 'purchaseConfigId')
          && (snapshot.properties.purchaseConfigId !== configRef.id
            || snapshot.properties.purchaseConfigSha256 !== configRef.sha256)) {
          error('binding', 'Ein installierter Kaufkonfigurationsverweis darf nicht ersetzt werden.');
        }
      }
      additions = {
        purchaseApp: PURCHASE_APP,
        purchaseConfigId: configRef.id,
        purchaseConfigSha256: configRef.sha256,
      };
      requiredProperties(setup.pointerProperties, {
        app: PRODUCT_APP,
        kind: 'dataset-folder',
        datasetId: checkedBinding.datasetId,
        ...additions,
      });
      if (await digest(setup.config) !== setup.configRef.sha256) {
        error('binding', 'Die gespeicherte Kaufkonfiguration stimmt nicht mit ihrer Referenz überein.');
      }
      propertiesBody(setup.pointerProperties);
      const storedConfig = await readImmutable(setup.configRef, {kind: 'config', config: setup.config});
      if (canonical(storedConfig) !== canonical(setup.config)) {
        error('binding', 'Der gespeicherte Configbody stimmt nicht mit dem Einrichtungsauftrag überein.');
      }
      const installed = await readFolder({id: checkedBinding.folderId, kind: 'dataset'});
      if (Object.hasOwn(installed.properties, 'purchaseConfigId')) {
        if (installed.properties.purchaseConfigId !== configRef.id
          || installed.properties.purchaseConfigSha256 !== configRef.sha256) {
          error('binding', 'Ein installierter Kaufkonfigurationsverweis darf nicht ersetzt werden.');
        }
        return {id: checkedBinding.folderId, status: null, unchanged: true};
      }
      const response = await boundRequest(`${API_V2}/${encodeURIComponent(checkedBinding.folderId)}?fields=id,version,etag,properties`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json; charset=UTF-8', 'If-Match': setup.etag},
        body: JSON.stringify({properties: propertiesBody(setup.pointerProperties)}),
      });
      const updated = await responseJson(response);
      if (updated.id !== checkedBinding.folderId) {
        error('binding', 'Drive hat einen anderen Pointer geändert.', response.status);
      }
      return {id: checkedBinding.folderId, status: response.status};
    } else if (authorization?.kind === 'attempt' || authorization?.kind === 'control') {
      const commerce = assertCommerce(authorization.commerce);
      const checked = authorization.kind==='attempt'
        ? attemptAuthorization(authorization,head,headValue)
        : controlAuthorization(authorization,head,headValue);
      const config = await verifyInstalledConfig(checked.configRef, checked.config);
      const stored = authorization.kind==='attempt'?checked.attempt:checked.control;
      if (!sameRef(stored.candidate, head)
        || stored.phase !== 'pointer-pending'
        || stored.etag !== snapshot?.etag
        || await digest(headValue) !== head.sha256) {
        error('binding', 'Der Kopfpointer stimmt nicht mit dem gespeicherten Kaufversuch überein.');
      }
      expected = {id: config.coordinatorId, kind: 'coordinator', config};
      additions = {purchaseHeadId: head.id, purchaseHeadSha256: head.sha256};
      storedProperties = stored.pointerProperties;
      storedEtag = stored.etag;
      requiredProperties(storedProperties, {...configProperties(config, 'coordinator'), ...additions});
      propertiesBody(storedProperties);
      if (!same(commerce.config, config) || configRef !== null) error('binding', 'Der Kopfpointer ist falsch autorisiert.');
    } else {
      error('binding', 'Dem Pointer fehlt ein gespeicherter Schreibauftrag.');
    }
    assertSnapshot(snapshot, expected);
    checkFolder(snapshot, expected);
    if (authorization.kind === 'setup' && Object.hasOwn(snapshot.properties, 'purchaseConfigId')) {
      if (snapshot.properties.purchaseApp !== PURCHASE_APP
        || snapshot.properties.purchaseConfigId !== additions.purchaseConfigId
        || snapshot.properties.purchaseConfigSha256 !== additions.purchaseConfigSha256) {
        error('binding', 'Ein installierter Kaufkonfigurationsverweis darf nicht ersetzt werden.');
      }
      return {id: snapshot.id, status: null, unchanged: true};
    }
    const properties = storedProperties;
    const body = {properties: propertiesBody(properties)};
    const response = await boundRequest(`${API_V2}/${encodeURIComponent(snapshot.id)}?fields=id,version,etag,properties`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json; charset=UTF-8', 'If-Match': storedEtag},
      body: JSON.stringify(body),
    });
    const updated = await responseJson(response);
    if (updated.id !== snapshot.id) error('binding', 'Drive hat einen anderen Pointer geändert.', response.status);
    return {id: snapshot.id, status: response.status};
  }

  return Object.freeze({
    binding: copy(checkedBinding),
    descriptorHash,
    accountId,
    reserveId,
    readFolder,
    createFolder,
    readImmutable,
    writeImmutable,
    putPointer,
  });
}
