import {assertLedger} from '../model/schema.js';
import {
  assertArray,
  assertExactKeys,
  assertId,
  assertInteger,
  assertRef,
  canonical,
  copy,
  digest,
  fail,
  refFor,
} from './value.js';

const PART_BYTES = 64 * 1024;

function utf8Length(value) {
  return new TextEncoder().encode(value).byteLength;
}

function chunks(value) {
  const result = [];
  let current = '';
  let currentBytes = 0;
  for (const symbol of value) {
    const size = utf8Length(symbol);
    if (current !== '' && currentBytes + size > PART_BYTES) {
      result.push(current);
      current = '';
      currentBytes = 0;
    }
    current += symbol;
    currentBytes += size;
  }
  result.push(current);
  return result;
}

function assertManifest(value) {
  assertExactKeys(value, [
    'version', 'kind', 'datasetId', 'byteLength', 'ledgerHash', 'parts',
  ], 'Das Basismodellmanifest ist ungültig.');
  if (value.version !== 1 || value.kind !== 'basis') fail('version', 'Diese Basisversion wird nicht unterstützt.');
  assertId(value.datasetId);
  assertInteger(value.byteLength, {minimum: 2});
  if (typeof value.ledgerHash !== 'string' || !/^[0-9a-f]{64}$/.test(value.ledgerHash)) {
    fail('invalid', 'Der Basismodellhash ist ungültig.');
  }
  assertArray(value.parts);
  if (value.parts.length === 0) fail('invalid', 'Das Basismodell hat keine Teile.');
  const ids = new Set();
  for (const ref of value.parts) {
    const checked = assertRef(ref);
    if (ids.has(checked.id)) fail('collision', 'Ein Basismodellteil wird mehrfach referenziert.');
    ids.add(checked.id);
  }
  return copy(value);
}

function assertPart(value) {
  assertExactKeys(value, ['version', 'kind', 'index', 'count', 'content'], 'Ein Basismodellteil ist ungültig.');
  if (value.version !== 1 || value.kind !== 'basis-part') {
    fail('version', 'Diese Basismodellteilversion wird nicht unterstützt.');
  }
  assertInteger(value.index);
  assertInteger(value.count, {minimum: 1});
  if (typeof value.content !== 'string' || utf8Length(value.content) > PART_BYTES) {
    fail('invalid', 'Der Inhalt eines Basismodellteils ist ungültig.');
  }
  return copy(value);
}

async function reserveId(reserve, request, used) {
  if (typeof reserve !== 'function') fail('invalid', 'Die ID-Reservierung für die Basis fehlt.');
  const id = await reserve(copy(request));
  assertId(id, 'Die reservierte Datei-ID ist ungültig.');
  if (used.has(id)) fail('collision', 'Die ID-Reservierung lieferte eine ID mehrfach.');
  used.add(id);
  return id;
}

export async function packBasis(ledger, reserve) {
  const checked = assertLedger(ledger);
  const content = canonical(checked);
  const split = chunks(content);
  const used = new Set();
  const parts = [];
  for (let index = 0; index < split.length; index += 1) {
    const value = {
      version: 1,
      kind: 'basis-part',
      index,
      count: split.length,
      content: split[index],
    };
    const id = await reserveId(reserve, {kind: 'basis-part', index}, used);
    parts.push({ref: await refFor(id, value), value});
  }
  const manifest = {
    version: 1,
    kind: 'basis',
    datasetId: checked.descriptor.datasetId,
    byteLength: utf8Length(content),
    ledgerHash: await digest(checked),
    parts: parts.map(({ref}) => copy(ref)),
  };
  const id = await reserveId(reserve, {kind: 'basis', index: null}, used);
  return {
    ref: await refFor(id, manifest),
    manifest: copy(manifest),
    parts: copy(parts),
  };
}

async function checkedRead(ref, read) {
  assertRef(ref);
  if (typeof read !== 'function') fail('invalid', 'Die Lesefunktion für die Basis fehlt.');
  let value;
  try {
    value = await read(ref.id);
  } catch (error) {
    if (typeof error?.code === 'string') throw error;
    fail('history', `Ein Basismodellteil fehlt: ${ref.id}.`);
  }
  let actual;
  try {
    actual = await digest(value);
  } catch {
    fail('integrity', `Ein Basismodellteil ist nicht kanonisch: ${ref.id}.`);
  }
  if (actual !== ref.sha256) fail('integrity', `Der Hash eines Basismodellteils stimmt nicht: ${ref.id}.`);
  return value;
}

export async function readBasis(ref, read) {
  return (await readBasisRecord(ref, read)).ledger;
}

export async function readBasisRecord(ref, read) {
  const manifestValue = await checkedRead(ref, read);
  const manifest = assertManifest(manifestValue);
  const contents = [];
  const parts = [];
  for (let index = 0; index < manifest.parts.length; index += 1) {
    const partRef = manifest.parts[index];
    const partValue = await checkedRead(partRef, read);
    const part = assertPart(partValue);
    if (part.index !== index || part.count !== manifest.parts.length) {
      fail('reference', 'Die Reihenfolge der Basismodellteile ist ungültig.');
    }
    contents.push(part.content);
    parts.push({ref: copy(partRef), value: copy(partValue)});
  }
  const content = contents.join('');
  if (utf8Length(content) !== manifest.byteLength) fail('integrity', 'Die Länge des Basismodells stimmt nicht.');
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    fail('integrity', 'Das Basismodell ist kein gültiges JSON.');
  }
  const ledger = assertLedger(parsed);
  if (canonical(ledger) !== content || await digest(ledger) !== manifest.ledgerHash) {
    fail('integrity', 'Der Inhalt des Basismodells stimmt nicht mit dem Manifest überein.');
  }
  if (ledger.descriptor.datasetId !== manifest.datasetId) {
    fail('binding', 'Das Basismodell gehört zu einem anderen Datensatz.');
  }
  return {
    ref: assertRef(ref),
    manifest: copy(manifestValue),
    parts,
    ledger: copy(ledger),
  };
}

export async function verifyBasisRecord(value) {
  assertExactKeys(value, ['ref', 'manifest', 'parts', 'ledger'], 'Der geprüfte Basismodellstand ist ungültig.');
  const ref = assertRef(value.ref);
  assertArray(value.parts, 'Die Basismodellteile sind ungültig.');
  const stored = new Map([[ref.id, copy(value.manifest)]]);
  for (const entry of value.parts) {
    assertExactKeys(entry, ['ref', 'value'], 'Ein Basismodellteil ist ungültig.');
    const partRef = assertRef(entry.ref);
    if (stored.has(partRef.id)) fail('collision', 'Eine Basisdatei-ID wird mehrfach verwendet.');
    stored.set(partRef.id, copy(entry.value));
  }
  const record = await readBasisRecord(ref, async (id) => {
    if (!stored.has(id)) fail('history', `Ein Basismodellteil fehlt: ${id}.`);
    return copy(stored.get(id));
  });
  const checkedLedger = assertLedger(value.ledger);
  if (canonical(record.ledger) !== canonical(checkedLedger)) {
    fail('integrity', 'Der geprüfte Ledger stimmt nicht mit seinen Basismodellteilen überein.');
  }
  return record;
}
