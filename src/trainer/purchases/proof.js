import {
  assertArray,
  assertBinding,
  assertExactKeys,
  assertId,
  assertRef,
  canonical,
  copy,
  digest,
  fail,
  refFor,
} from './value.js';

export async function packProof({binding, head, objects}, reserve) {
  const checkedBinding = assertBinding(binding);
  const checkedHead = assertRef(head);
  assertArray(objects, 'Die zu transportierenden Herkunftsobjekte sind ungültig.');
  if (objects.length === 0 || typeof reserve !== 'function') {
    fail('invalid', 'Der portable Herkunftsnachweis ist unvollständig.');
  }
  const logicalIds = new Set();
  const reservedIds = new Set(objects.map(({ref}) => assertRef(ref).id));
  const packed = [];
  for (let index = 0; index < objects.length; index += 1) {
    const object = objects[index];
    assertExactKeys(object, ['ref', 'value'], 'Ein logisches Herkunftsobjekt ist ungültig.');
    const logical = assertRef(object.ref);
    if (logicalIds.has(logical.id)) fail('collision', 'Ein logisches Herkunftsobjekt wird mehrfach geliefert.');
    logicalIds.add(logical.id);
    if (await digest(object.value) !== logical.sha256) {
      fail('integrity', 'Ein logisches Herkunftsobjekt hat einen falschen Hash.');
    }
    const storedId = await reserve({kind: 'proof-object', index});
    assertId(storedId, 'Die reservierte Herkunftsdatei-ID ist ungültig.');
    if (reservedIds.has(storedId)) fail('collision', 'Eine Herkunftsdatei-ID wurde nicht neu reserviert.');
    reservedIds.add(storedId);
    packed.push({
      logical,
      stored: {id: storedId, sha256: logical.sha256},
      value: copy(object.value),
    });
  }
  packed.sort((left, right) => left.logical.id.localeCompare(right.logical.id));
  const manifest = {
    version: 1,
    kind: 'proof-manifest',
    binding: checkedBinding,
    head: checkedHead,
    objects: packed.map(({logical, stored}) => ({logical: copy(logical), stored: copy(stored)})),
  };
  const manifestId = await reserve({kind: 'proof-manifest', index: null});
  assertId(manifestId, 'Die reservierte Herkunftsmanifest-ID ist ungültig.');
  if (reservedIds.has(manifestId)) fail('collision', 'Die Herkunftsmanifest-ID wurde nicht neu reserviert.');
  return {
    ref: await refFor(manifestId, manifest),
    manifest,
    objects: packed,
  };
}

export function assertProofManifest(value) {
  assertExactKeys(value, ['version', 'kind', 'binding', 'head', 'objects'], 'Das Herkunftsmanifest ist ungültig.');
  if (value.version !== 1 || value.kind !== 'proof-manifest') {
    fail('version', 'Diese Herkunftsmanifestversion wird nicht unterstützt.');
  }
  assertBinding(value.binding);
  assertRef(value.head);
  assertArray(value.objects, 'Die Herkunftsobjekte sind ungültig.');
  if (value.objects.length === 0) fail('invalid', 'Das Herkunftsmanifest ist leer.');
  const logicalIds = new Set();
  const storedIds = new Set();
  for (const mapping of value.objects) {
    assertExactKeys(mapping, ['logical', 'stored'], 'Eine Herkunftszuordnung ist ungültig.');
    const logical = assertRef(mapping.logical);
    const stored = assertRef(mapping.stored);
    if (logical.sha256 !== stored.sha256) {
      fail('integrity', 'Logischer und physischer Herkunftsverweis haben unterschiedliche Hashes.');
    }
    if (logicalIds.has(logical.id) || storedIds.has(stored.id)) {
      fail('collision', 'Eine Herkunftsdatei wird mehrfach zugeordnet.');
    }
    logicalIds.add(logical.id);
    storedIds.add(stored.id);
  }
  return copy(value);
}

export async function verifyProofRecord(value) {
  assertExactKeys(value, ['ref', 'manifest', 'objects'], 'Der Herkunftsnachweis ist ungültig.');
  const ref = assertRef(value.ref);
  const manifest = assertProofManifest(value.manifest);
  if (await digest(manifest) !== ref.sha256) fail('integrity', 'Der Hash des Herkunftsmanifests stimmt nicht.');
  assertArray(value.objects, 'Die transportierten Herkunftsobjekte sind ungültig.');
  if (value.objects.length !== manifest.objects.length) {
    fail('history', 'Der Herkunftsnachweis ist unvollständig.');
  }
  const objects = [];
  for (let index = 0; index < manifest.objects.length; index += 1) {
    const supplied = value.objects[index];
    assertExactKeys(supplied, ['logical', 'stored', 'value'], 'Ein transportiertes Herkunftsobjekt ist ungültig.');
    const mapping = manifest.objects[index];
    if (canonical(supplied.logical) !== canonical(mapping.logical)
      || canonical(supplied.stored) !== canonical(mapping.stored)) {
      fail('integrity', 'Die Herkunftszuordnung stimmt nicht mit ihrem Manifest überein.');
    }
    const actual = await digest(supplied.value);
    if (actual !== mapping.logical.sha256 || actual !== mapping.stored.sha256) {
      fail('integrity', 'Ein transportiertes Herkunftsobjekt hat einen falschen Hash.');
    }
    objects.push(copy(supplied));
  }
  return {ref, manifest, objects};
}
