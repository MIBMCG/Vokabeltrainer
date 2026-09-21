import {assertCommerce, assertConfig, emptyCommerce} from './schema.js';
import {assertBinding, assertHash, assertId, copy, digest, fail, sameBinding} from './value.js';
import {PURCHASE_APP} from './transport.js';

function checkedPersist(persist) {
  if (typeof persist !== 'function') fail('invalid', 'Der Einrichtung fehlt der dauerhafte Speicherweg.');
  return async (setup) => {
    const safe = copy(setup);
    await persist(copy(safe));
    return safe;
  };
}

function checkedContext(transport, binding, descriptorHash) {
  const checkedBinding = assertBinding(binding);
  assertHash(descriptorHash);
  if (!transport || typeof transport !== 'object'
    || !sameBinding(transport.binding, checkedBinding)
    || transport.descriptorHash !== descriptorHash) {
    fail('binding', 'Transport und Einrichtung gehören nicht zur selben Produktbindung.');
  }
  return checkedBinding;
}

function checkedSetup(value, transport) {
  const commerce = assertCommerce({
    ...emptyCommerce(),
    mode: 'migrating',
    binding: value?.binding ?? null,
    setup: value ?? null,
  });
  const setup = commerce.setup;
  checkedContext(transport, setup.binding, setup.descriptorHash);
  if (setup.coordinatorId === null || setup.contentFolderId === null
    || setup.configRef === null || setup.config === null
    || setup.config.coordinatorId !== setup.coordinatorId
    || setup.config.contentFolderId !== setup.contentFolderId
    || setup.config.descriptorHash !== setup.descriptorHash
    || !sameBinding(setup.config.binding, setup.binding)) {
    fail('binding', 'Der gespeicherte Einrichtungsauftrag ist unvollständig gebunden.');
  }
  return setup;
}

function pointerRef(snapshot) {
  const properties = snapshot.properties;
  const keys = ['purchaseApp', 'purchaseConfigId', 'purchaseConfigSha256'];
  const present = keys.filter((key) => Object.hasOwn(properties, key));
  if (present.length === 0) return null;
  if (present.length !== keys.length || properties.purchaseApp !== PURCHASE_APP) {
    fail('binding', 'Der gespeicherte Kaufkonfigurationsverweis ist unvollständig.');
  }
  return {id: properties.purchaseConfigId, sha256: properties.purchaseConfigSha256};
}

async function verifyDescriptor(transport, binding, descriptorHash) {
  await transport.readImmutable(
    {id: binding.descriptorFileId, sha256: descriptorHash},
    {kind: 'descriptor'},
  );
}

async function winnerSetup({transport, setup, snapshot, persist}) {
  const ref = pointerRef(snapshot);
  if (ref === null) return null;
  const config = await transport.readImmutable(ref, {kind: 'config'});
  const checked = assertConfig(config);
  if (!sameBinding(checked.binding, setup.binding) || checked.descriptorHash !== setup.descriptorHash) {
    fail('binding', 'Die Gewinnerkonfiguration gehört zu einer anderen Produktbindung.');
  }
  const next = {
    ...setup,
    phase: 'confirmed',
    coordinatorId: checked.coordinatorId,
    contentFolderId: checked.contentFolderId,
    configRef: copy(ref),
    config: checked,
    etag: snapshot.etag,
  };
  return persist(next);
}

export async function prepareBootstrap({transport, binding, descriptorHash, operationId, persist} = {}) {
  const checkedBinding = checkedContext(transport, binding, descriptorHash);
  assertId(operationId);
  const save = checkedPersist(persist);
  await transport.accountId();
  await verifyDescriptor(transport, checkedBinding, descriptorHash);
  const root = await transport.readFolder({id: checkedBinding.folderId, kind: 'dataset'});

  const coordinatorId = await transport.reserveId();
  const contentFolderId = await transport.reserveId();
  const configId = await transport.reserveId();
  const config = {
    version: 1,
    kind: 'purchase-config',
    binding: checkedBinding,
    descriptorHash,
    coordinatorId,
    contentFolderId,
  };
  const configRef = {id: configId, sha256: await digest(config)};
  const setup = {
    version: 1,
    operationId,
    phase: 'reserved',
    binding: checkedBinding,
    descriptorHash,
    coordinatorId,
    contentFolderId,
    configRef,
    config,
    etag: root.etag,
  };
  const existing = pointerRef(root);
  if (existing !== null) {
    // Preserve a complete local candidate for audit, then resolve on resume.
    return save(setup);
  }
  return save(setup);
}

export async function resumeBootstrap({transport, setup: rawSetup, persist} = {}) {
  const save = checkedPersist(persist);
  let setup = checkedSetup(rawSetup, transport);
  await transport.accountId();
  await verifyDescriptor(transport, setup.binding, setup.descriptorHash);

  let root = await transport.readFolder({id: setup.binding.folderId, kind: 'dataset'});
  let winner = await winnerSetup({transport, setup, snapshot: root, persist: save});
  if (winner !== null) return winner;

  await transport.createFolder({kind: 'coordinator', setup});
  await transport.createFolder({kind: 'content', setup});
  await transport.writeImmutable({
    ref: setup.configRef,
    value: setup.config,
    kind: 'config',
    config: setup.config,
    authorization: {kind: 'setup', setup},
  });
  setup = await save({...setup, phase: 'uploaded'});

  root = await transport.readFolder({id: setup.binding.folderId, kind: 'dataset'});
  winner = await winnerSetup({transport, setup, snapshot: root, persist: save});
  if (winner !== null) return winner;

  setup = await save({...setup, phase: 'pointer-pending', etag: root.etag});
  let pointerError = null;
  try {
    await transport.putPointer({
      snapshot: root,
      configRef: setup.configRef,
      authorization: {kind: 'setup', setup},
    });
  } catch (cause) {
    pointerError = cause;
  }
  setup = await save({...setup, phase: 'reconciling'});
  root = await transport.readFolder({id: setup.binding.folderId, kind: 'dataset'});
  winner = await winnerSetup({transport, setup, snapshot: root, persist: save});
  if (winner !== null) return winner;
  if (pointerError !== null) throw pointerError;
  fail('stale', 'Der Konfigurationspointer wurde nicht eindeutig bestätigt.');
}
