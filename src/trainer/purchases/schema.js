import {
  assertArray,
  assertBinding,
  assertExactKeys,
  assertHash,
  assertId,
  assertInteger,
  assertNullableRef,
  assertNullableString,
  assertRef,
  canonical,
  copy,
  fail,
} from './value.js';

const OPERATIONS = ['initialize', 'purchase', 'restore'];
const MODES = ['inactive', 'migrating', 'active', 'blocked'];
const PHASES = ['intent', 'reserved', 'uploaded', 'pointer-pending', 'reconciling', 'confirmed', 'rejected', 'superseded'];
const FINAL_JOB_STATUSES = ['open', 'confirmed', 'rejected', 'superseded'];

function assertVersion(value, kind = null) {
  if (value.version !== 1 || (kind !== null && value.kind !== kind)) {
    fail('version', 'Diese Kaufprotokollversion wird nicht unterstützt.');
  }
}

function assertEnum(value, allowed, message) {
  if (!allowed.includes(value)) fail('invalid', message);
}

function assertArticleId(value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > 180) {
    fail('invalid', 'Die Artikel-ID ist ungültig.');
  }
  if (value.startsWith('evolution:')) {
    const match = /^evolution:([A-Za-z0-9_-]{1,128}):([1-4])$/.exec(value);
    if (!match) fail('invalid', 'Die Artikel-ID ist ungültig.');
  } else {
    assertId(value, 'Die Artikel-ID ist ungültig.');
  }
}

export function assertIntent(value) {
  assertExactKeys(value, [
    'version', 'operationId', 'datasetId', 'profileId', 'epochId', 'articleId',
    'catalogVersion', 'price', 'confirmed',
  ], 'Der Kaufauftrag ist ungültig.');
  assertVersion(value);
  for (const key of ['operationId', 'datasetId', 'profileId', 'epochId']) assertId(value[key]);
  assertArticleId(value.articleId);
  if (value.catalogVersion !== 1) fail('version', 'Diese Katalogversion wird nicht unterstützt.');
  assertInteger(value.price);
  if (value.confirmed !== true) fail('invalid', 'Der Kaufauftrag ist nicht bestätigt.');
  return copy(value);
}

export function assertEconomicSnapshot(value) {
  assertExactKeys(value, ['version', 'kind', 'source'], 'Der wirtschaftliche Zielstand ist ungültig.');
  assertVersion(value, 'economic-snapshot');
  if (value.source !== null) {
    assertExactKeys(value.source, ['binding', 'head', 'proof'], 'Die wirtschaftliche Herkunft ist ungültig.');
    assertBinding(value.source.binding);
    assertRef(value.source.head);
    assertNullableRef(value.source.proof);
  }
  return copy(value);
}

export function assertReceipt(value) {
  assertExactKeys(value, [
    'version', 'kind', 'datasetId', 'coordinatorId', 'sequence', 'previous',
    'operationId', 'operation', 'epochId', 'basis', 'intent', 'economy',
  ], 'Der Kaufbeleg ist ungültig.');
  assertVersion(value, 'receipt');
  for (const key of ['datasetId', 'coordinatorId', 'operationId', 'epochId']) assertId(value[key]);
  assertInteger(value.sequence);
  const previous = assertNullableRef(value.previous);
  assertEnum(value.operation, OPERATIONS, 'Die Belegoperation ist ungültig.');
  assertRef(value.basis);

  if (value.operation === 'initialize') {
    if (value.sequence !== 0 || previous !== null || value.intent !== null || value.economy === null) {
      fail('invalid', 'Der Initialisierungsbeleg ist ungültig.');
    }
    const economy = assertEconomicSnapshot(value.economy);
    if (economy.source !== null) fail('invalid', 'Eine Initialisierung darf keine fremde Herkunft übernehmen.');
  } else if (value.operation === 'purchase') {
    if (value.sequence === 0 || previous === null || value.intent === null || value.economy !== null) {
      fail('invalid', 'Der Kaufbeleg ist ungültig.');
    }
    const checked = assertIntent(value.intent);
    if (checked.operationId !== value.operationId
      || checked.datasetId !== value.datasetId
      || checked.epochId !== value.epochId) {
      fail('reference', 'Kaufbeleg und Kaufauftrag passen nicht zusammen.');
    }
  } else {
    if (value.sequence === 0 || previous === null || value.intent !== null || value.economy === null) {
      fail('invalid', 'Der Wiederherstellungsbeleg ist ungültig.');
    }
    assertEconomicSnapshot(value.economy);
  }
  return copy(value);
}

export function assertConfig(value) {
  assertExactKeys(value, [
    'version', 'kind', 'binding', 'descriptorHash', 'coordinatorId', 'contentFolderId',
  ], 'Die Kaufprotokollkonfiguration ist ungültig.');
  assertVersion(value, 'purchase-config');
  assertBinding(value.binding);
  assertHash(value.descriptorHash);
  assertId(value.coordinatorId);
  assertId(value.contentFolderId);
  return copy(value);
}

export function assertCache(value) {
  assertExactKeys(value, ['version', 'head', 'values'], 'Der Kaufprotokollcache ist ungültig.');
  assertVersion(value);
  assertNullableRef(value.head);
  assertArray(value.values, 'Die Cacheeinträge sind ungültig.');
  const byId = new Map();
  for (const entry of value.values) {
    assertExactKeys(entry, ['ref', 'value'], 'Ein Cacheeintrag ist ungültig.');
    const ref = assertRef(entry.ref);
    canonical(entry.value);
    const previous = byId.get(ref.id);
    if (previous && canonical(previous) !== canonical(entry)) {
      fail('collision', 'Eine Cache-ID enthält unterschiedliche Daten.');
    }
    byId.set(ref.id, entry);
  }
  return copy(value);
}

function assertUpload(value) {
  assertExactKeys(value, ['ref', 'value'], 'Ein gespeicherter unveränderlicher Upload ist ungültig.');
  assertRef(value.ref);
  canonical(value.value);
  return copy(value);
}

function assertAttempt(value) {
  assertExactKeys(
    value,
    ['version', 'attemptId', 'phase', 'head', 'etag', 'candidate', 'uploads'],
    'Der Kaufversuch ist ungültig.',
  );
  assertVersion(value);
  assertId(value.attemptId);
  assertEnum(value.phase, PHASES, 'Die Kaufphase ist ungültig.');
  assertNullableRef(value.head);
  assertNullableString(value.etag, 2048);
  assertNullableRef(value.candidate);
  assertArray(value.uploads, 'Die gespeicherten Uploads sind ungültig.');
  const uploads = new Map();
  for (const upload of value.uploads) {
    const checked = assertUpload(upload);
    if (uploads.has(checked.ref.id)) fail('collision', 'Eine Upload-ID wird mehrfach gespeichert.');
    uploads.set(checked.ref.id, checked);
  }
  if (value.phase === 'intent'
    && (value.head !== null || value.etag !== null || value.candidate !== null || value.uploads.length !== 0)) {
    fail('invalid', 'Ein noch nicht reservierter Kaufversuch enthält Schreibdaten.');
  }
  if (value.phase !== 'intent' && (value.candidate === null || !uploads.has(value.candidate.id))) {
    fail('invalid', 'Dem Kaufversuch fehlt der gespeicherte Kandidat.');
  }
  if (value.candidate !== null) {
    const candidate = uploads.get(value.candidate.id);
    if (candidate.ref.sha256 !== value.candidate.sha256) fail('integrity', 'Der Belegkandidat hat einen anderen Hash.');
    const receipt = assertReceipt(candidate.value);
    const manifest = uploads.get(receipt.basis.id);
    if (!manifest || manifest.ref.sha256 !== receipt.basis.sha256) {
      fail('invalid', 'Dem Kaufversuch fehlt das gespeicherte Basismodellmanifest.');
    }
    assertExactKeys(manifest.value, [
      'version', 'kind', 'datasetId', 'byteLength', 'ledgerHash', 'parts',
    ], 'Das gespeicherte Basismodellmanifest ist ungültig.');
    if (manifest.value.version !== 1 || manifest.value.kind !== 'basis') {
      fail('version', 'Diese Basisversion wird nicht unterstützt.');
    }
    assertArray(manifest.value.parts, 'Die gespeicherten Basismodellteile sind ungültig.');
    const required = new Set([candidate.ref.id, manifest.ref.id]);
    for (const rawPartRef of manifest.value.parts) {
      const partRef = assertRef(rawPartRef);
      const part = uploads.get(partRef.id);
      if (!part || part.ref.sha256 !== partRef.sha256) {
        fail('invalid', 'Dem Kaufversuch fehlt ein gespeicherter Basismodellteil.');
      }
      required.add(partRef.id);
    }
    if (required.size !== uploads.size) {
      fail('invalid', 'Der Kaufversuch enthält einen nicht autorisierten unveränderlichen Upload.');
    }
  }
  return copy(value);
}

function assertJob(value) {
  assertExactKeys(value, ['version', 'intent', 'status', 'attempts'], 'Der Kaufauftragsspeicher ist ungültig.');
  assertVersion(value);
  const intent = assertIntent(value.intent);
  assertEnum(value.status, FINAL_JOB_STATUSES, 'Der Kaufstatus ist ungültig.');
  assertArray(value.attempts);
  const ids = new Set();
  for (const attempt of value.attempts) {
    const checked = assertAttempt(attempt);
    if (ids.has(checked.attemptId)) fail('collision', 'Eine Versuchs-ID wird mehrfach verwendet.');
    ids.add(checked.attemptId);
    const candidate = checked.candidate === null
      ? null
      : checked.uploads.find(({ref}) => ref.id === checked.candidate.id)?.value;
    if (candidate?.intent && canonical(candidate.intent) !== canonical(intent)) {
      fail('collision', 'Ein Belegkandidat verändert seinen Kaufauftrag.');
    }
  }
  return copy(value);
}

function assertSetup(value) {
  assertExactKeys(value, [
    'version', 'operationId', 'phase', 'binding', 'descriptorHash', 'coordinatorId',
    'contentFolderId', 'configRef', 'config', 'etag',
  ], 'Der Einrichtungsauftrag ist ungültig.');
  assertVersion(value);
  assertId(value.operationId);
  assertEnum(value.phase, PHASES, 'Die Einrichtungsphase ist ungültig.');
  assertBinding(value.binding);
  assertHash(value.descriptorHash);
  for (const key of ['coordinatorId', 'contentFolderId']) {
    if (value[key] !== null) assertId(value[key]);
  }
  assertNullableRef(value.configRef);
  if (value.config !== null) assertConfig(value.config);
  assertNullableString(value.etag, 2048);
  if ((value.config === null) !== (value.configRef === null)) {
    fail('invalid', 'Konfiguration und Konfigurationsverweis sind unvollständig.');
  }
  return copy(value);
}

function assertSelection(value) {
  assertExactKeys(value, ['profileId', 'figureId', 'stage'], 'Die Figurenauswahl ist ungültig.');
  assertId(value.profileId);
  assertId(value.figureId);
  assertInteger(value.stage, {minimum: 1, maximum: 4});
  return copy(value);
}

export function emptyCommerce() {
  return {
    version: 1,
    mode: 'inactive',
    binding: null,
    configRef: null,
    config: null,
    head: null,
    cache: {version: 1, head: null, values: []},
    setup: null,
    jobs: [],
    selection: [],
  };
}

export function assertCommerce(value) {
  assertExactKeys(value, [
    'version', 'mode', 'binding', 'configRef', 'config', 'head', 'cache', 'setup',
    'jobs', 'selection',
  ], 'Der Kaufzustand ist ungültig.');
  assertVersion(value);
  assertEnum(value.mode, MODES, 'Der Kaufmodus ist ungültig.');
  if (value.binding !== null) assertBinding(value.binding);
  assertNullableRef(value.configRef);
  if (value.config !== null) assertConfig(value.config);
  assertNullableRef(value.head);
  assertCache(value.cache);
  if (value.setup !== null) assertSetup(value.setup);
  assertArray(value.jobs);
  const operationIds = new Set();
  for (const job of value.jobs) {
    const checked = assertJob(job);
    if (operationIds.has(checked.intent.operationId)) fail('collision', 'Eine Kaufoperation wird mehrfach gespeichert.');
    operationIds.add(checked.intent.operationId);
  }
  assertArray(value.selection);
  const profiles = new Set();
  for (const selection of value.selection) {
    const checked = assertSelection(selection);
    if (profiles.has(checked.profileId)) fail('collision', 'Ein Profil hat mehrere Figurenauswahlen.');
    profiles.add(checked.profileId);
  }

  const configPairComplete = value.configRef !== null && value.config !== null;
  if ((value.configRef === null) !== (value.config === null)) {
    fail('invalid', 'Konfiguration und Konfigurationsverweis sind unvollständig.');
  }
  if (value.config !== null && (value.binding === null
    || canonical(value.config.binding) !== canonical(value.binding))) {
    fail('binding', 'Konfiguration und Produktbindung passen nicht zusammen.');
  }
  if (['active', 'blocked'].includes(value.mode)
    && (value.binding === null || !configPairComplete || value.head === null)) {
    fail('invalid', 'Der aktive Kaufzustand ist unvollständig.');
  }
  if (value.mode === 'migrating' && (value.binding === null || value.setup === null)) {
    fail('invalid', 'Der vorbereitende Kaufzustand ist unvollständig.');
  }
  if (value.mode === 'inactive' && value.head !== null) {
    fail('invalid', 'Ein inaktiver Kaufzustand darf keinen aktiven Kopf haben.');
  }
  return copy(value);
}
