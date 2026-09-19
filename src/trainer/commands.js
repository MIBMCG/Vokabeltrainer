import {assess} from './learning/answers.js';
import {dayInZone} from './learning/calendar.js';
import {pendingMilestones, project} from './learning/progress.js';
import {rewardState} from './learning/rewards.js';
import {projectSchedule} from './learning/schedule.js';
import {
  abandonRound,
  activeWords,
  advanceRound,
  applyAnswer,
  completeRound,
  expandRound,
  nextTask,
  previewModes,
  startRound,
} from './learning/rounds.js';
import {canonical, digest} from './model/canonical.js';
import {ProductError} from './model/errors.js';
import {nextLearningId, revisionPayload} from './model/revisions.js';
import {assertLedger, assertEpoch, assertSnapshot, assertEvent} from './model/schema.js';
import {assertBackup} from './backup/format.js';
import {CURRENT_VERSION as VERSION, assertContainedVersion, assertSupportedVersion, LEGACY_VERSION} from './model/versions.js';
import {DEFAULT_POLICY, assertPolicy, currentPolicy, currentGenerations} from './model/policies.js';
import {migrateProductStateV1} from './storage/migrate.js';
import {validatePacket} from './sync/packets.js';

const STATE_KEYS = [
  'storageVersion',
  'deviceId',
  'clock',
  'ledger',
  'rounds',
  'binding',
  'outboxEventIds',
  'pendingPackets',
  'datasetSetup',
  'packetIntegrity',
  'knownFiles',
  'quarantinedFiles',
  'safetyCopies',
  'restoreJobs',
  'snapshotManifests',
  'pinVerifier',
];
const ROUND_KEYS = [
  'id', 'epochId', 'profileId', 'mode', 'size', 'candidates', 'expanded',
  'pausedWordIds', 'answeredIds', 'wordCounts', 'lastWordId', 'current', 'feedback', 'status',
];
const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const HASH_PATTERN = /^[0-9a-f]{64}$/;

function fail(code, message) {
  throw new ProductError(code, message);
}

function invalid(message = 'Die lokalen Produktdaten sind ungültig.') {
  fail('invalid', message);
}

function assertRecord(value, message) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) invalid(message);
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) invalid(message);
}

function assertExactKeys(value, keys, message) {
  assertRecord(value, message);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length
    || actual.some((key, index) => key !== expected[index])) invalid(message);
}

function assertId(value, message = 'Eine lokale ID ist ungültig.') {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) invalid(message);
}

function assertIdArray(value, message) {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) invalid(message);
  for (const entry of value) assertId(entry, message);
  if (new Set(value).size !== value.length) invalid(message);
}

function assertBinding(value) {
  if (value === null) return;
  assertExactKeys(value, ['accountId', 'folderId', 'descriptorFileId', 'datasetId'], 'Die Drive-Bindung ist ungültig.');
  for (const key of ['accountId', 'folderId', 'descriptorFileId', 'datasetId']) {
    assertId(value[key], 'Die Drive-Bindung ist ungültig.');
  }
}

function assertPendingPacket(value) {
  assertExactKeys(value, ['packet', 'driveFileId', 'confirmed'], 'Ein ausstehendes Drive-Paket ist ungültig.');
  validatePacket(value.packet);
  if (value.driveFileId !== null) assertId(value.driveFileId, 'Die Drive-Datei-ID ist ungültig.');
  if (value.confirmed !== false) invalid('Ein ausstehendes Drive-Paket hat einen ungültigen Bestätigungsstatus.');
}

function assertRestoreRecords(state) {
  const unique = (entries, key) => {
    const values = entries.map(entry => entry[key]);
    if (new Set(values).size !== values.length) invalid('Eine lokale Sicherungsliste enthält doppelte IDs.');
  };
  for (const copy of state.safetyCopies) {
    assertExactKeys(copy, ['id','createdAt','purpose','backup','hash','driveManifestFileId','verified']);
    assertId(copy.id); assertBackup(copy.backup);
    if (copy.createdAt !== copy.backup.exportedAt || !['safety','restore','join',...(state.storageVersion===2?['format-migration']:[])].includes(copy.purpose)
      || !HASH_PATTERN.test(copy.hash) || typeof copy.verified !== 'boolean') invalid('Die lokale Sicherheitskopie ist ungültig.');
    if (copy.driveManifestFileId !== null) assertId(copy.driveManifestFileId);
  }
  unique(state.safetyCopies,'id');
  for (const job of state.restoreJobs) {
    assertExactKeys(job,['id','phase','backup','previewId','parentHeads','safetyCopyId','snapshot','uploads','epoch']);
    assertId(job.id); assertBackup(job.backup);
    if (!['preparing','preview','uploading','published','activated'].includes(job.phase)) invalid('Die Wiederherstellungsphase ist ungültig.');
    if (job.previewId !== null && !HASH_PATTERN.test(job.previewId)) invalid('Die Vorschau-ID ist ungültig.');
    if (job.parentHeads !== null) assertIdArray(job.parentHeads);
    if (job.safetyCopyId !== null) assertId(job.safetyCopyId);
    if (job.snapshot !== null) assertSnapshot(job.snapshot);
    if (job.epoch !== null) assertEpoch(job.epoch);
    if (!Array.isArray(job.uploads)) invalid('Die Wiederherstellungsdateien sind ungültig.');
    for (const upload of job.uploads) {
      assertExactKeys(upload,['kind','logicalId','fileId','value','verified']);
      assertId(upload.logicalId); assertId(upload.fileId); canonical(upload.value);
      assertSupportedVersion(upload.value);
      if(upload.kind==='epoch')assertEpoch(upload.value);
      if(upload.kind==='snapshot-part') {
        if(!Array.isArray(upload.value.events))invalid('Die Snapshot-Ereignisse fehlen.');
        assertContainedVersion(upload.value,upload.value.events);
        upload.value.events.forEach(assertEvent);
      }
      if (!['snapshot-part','snapshot-manifest','epoch'].includes(upload.kind)
        || upload.value?.kind !== upload.kind || typeof upload.verified !== 'boolean') invalid('Eine Wiederherstellungsdatei ist ungültig.');
    }
    unique(job.uploads,'fileId');
  }
  unique(state.restoreJobs,'id');
  for (const entry of state.snapshotManifests) {
    assertExactKeys(entry,['snapshotId','fileId']); assertId(entry.snapshotId); assertId(entry.fileId);
  }
  unique(state.snapshotManifests,'snapshotId');
}

function assertDatasetSetup(value) {
  if (value === null) return;
  assertExactKeys(value, [
    'accountId', 'name', 'folderId', 'descriptorFileId', 'epochFileId',
    'datasetId', 'descriptor', 'rootEpoch',
  ], 'Der Auftrag zur Drive-Einrichtung ist ungültig.');
  for (const key of ['accountId', 'folderId', 'descriptorFileId', 'epochFileId', 'datasetId']) {
    assertId(value[key], 'Der Auftrag zur Drive-Einrichtung ist ungültig.');
  }
  if (typeof value.name !== 'string' || value.name.trim() === '') {
    invalid('Der Auftrag zur Drive-Einrichtung ist ungültig.');
  }
  const ledger = assertLedger({
    descriptor: value.descriptor,
    events: [],
    epochs: [value.rootEpoch],
    snapshots: [],
    historicalEpochs: [],
  });
  if (ledger.descriptor.datasetId !== value.datasetId
    || ledger.descriptor.rootEpochId !== value.rootEpoch.id
    || value.rootEpoch.datasetId !== value.datasetId) {
    invalid('Der Auftrag zur Drive-Einrichtung enthält widersprüchliche IDs.');
  }
}

function assertPacketIntegrity(value) {
  if (!Array.isArray(value)) invalid('Der Paket-Integritätsindex ist ungültig.');
  const packetIds = new Set();
  for (const entry of value) {
    assertExactKeys(entry, ['packetId', 'contentHash'], 'Ein Paket-Integritätseintrag ist ungültig.');
    assertId(entry.packetId, 'Die Paket-ID ist ungültig.');
    if (typeof entry.contentHash !== 'string' || !HASH_PATTERN.test(entry.contentHash)) {
      invalid('Der Pakethash ist ungültig.');
    }
    if (packetIds.has(entry.packetId)) invalid('Der Paket-Integritätsindex enthält eine ID mehrfach.');
    packetIds.add(entry.packetId);
  }
}

function assertKnownFile(value) {
  assertExactKeys(value, ['fileId', 'contentHash', 'kind'], 'Ein bekannter Drive-Dateieintrag ist ungültig.');
  assertId(value.fileId, 'Die Drive-Datei-ID ist ungültig.');
  if (typeof value.contentHash !== 'string' || !HASH_PATTERN.test(value.contentHash)) {
    invalid('Der bekannte Drive-Dateihash ist ungültig.');
  }
  if (!['dataset', 'packet', 'epoch', 'snapshot-part', 'snapshot-manifest', 'safety-copy'].includes(value.kind)) {
    invalid('Die bekannte Drive-Dateiart ist ungültig.');
  }
}

function assertQuarantine(value) {
  assertExactKeys(value, ['fileId', 'code', 'message', 'value'], 'Ein Quarantäneeintrag ist ungültig.');
  assertId(value.fileId, 'Die Drive-Datei-ID ist ungültig.');
  if (typeof value.code !== 'string' || value.code.length === 0
    || typeof value.message !== 'string' || value.message.length === 0) {
    invalid('Ein Quarantäneeintrag ist ungültig.');
  }
  canonical(value.value);
}

function own(record, key) {
  return record !== null && typeof record === 'object' && Object.hasOwn(record, key);
}

function setOwn(record, key, value) {
  Object.defineProperty(record, key, {
    value,
    enumerable: true,
    writable: true,
    configurable: true,
  });
}

function cloneRoundMap(rounds) {
  const result = {};
  for (const profileId of Object.keys(rounds)) setOwn(result, profileId, structuredClone(rounds[profileId]));
  return result;
}

function assertRound(round, profileId, storageVersion) {
  const v2=storageVersion===2;
  assertExactKeys(round, [...ROUND_KEYS,...(v2?['policy','policyEventId','schedulingMode']:[])], 'Eine lokale Runde ist ungültig.');
  if(v2) {
    assertPolicy(round.policy);
    if(round.policyEventId!==null)assertId(round.policyEventId);
    if(!['legacy','configurable'].includes(round.schedulingMode))invalid('Die Rundenplanung ist ungültig.');
    if(round.policyEventId===null && canonical(round.policy)!==canonical(DEFAULT_POLICY))invalid('Die Standardregeln stimmen nicht.');
  }
  assertId(round.id);
  assertId(round.epochId);
  assertId(round.profileId);
  if (round.profileId !== profileId) invalid('Eine lokale Runde ist dem falschen Profil zugeordnet.');
  if (!['all', 'latest', 'new'].includes(round.mode) || ![10, 20, 30].includes(round.size)) {
    invalid('Die lokale Rundeneinstellung ist ungültig.');
  }
  if (!Array.isArray(round.candidates) || !Array.isArray(round.pausedWordIds)
    || !Array.isArray(round.answeredIds)) invalid('Die lokale Rundenauswahl ist ungültig.');
  const candidateWordIds = new Set();
  for (const candidate of round.candidates) {
    assertExactKeys(candidate, ['wordId', 'learningId',...(v2?['schedulingGenerationId']:[])], 'Ein lokaler Rundenkandidat ist ungültig.');
    assertId(candidate.wordId);
    assertId(candidate.learningId);
    if(v2 && candidate.schedulingGenerationId!==null)assertId(candidate.schedulingGenerationId);
    if (candidateWordIds.has(candidate.wordId)) invalid('Eine lokale Runde enthält ein Wort mehrfach.');
    candidateWordIds.add(candidate.wordId);
  }
  assertIdArray(round.pausedWordIds, 'Die Pausenliste einer Runde ist ungültig.');
  assertIdArray(round.answeredIds, 'Die Antwortliste einer Runde ist ungültig.');
  if (typeof round.expanded !== 'boolean') invalid('Der Erweiterungsstatus einer Runde ist ungültig.');
  assertRecord(round.wordCounts, 'Die lokalen Antwortzähler sind ungültig.');
  let counted = 0;
  for (const wordId of Object.keys(round.wordCounts)) {
    assertId(wordId);
    const count = round.wordCounts[wordId];
    if (!Number.isSafeInteger(count) || count < 1) invalid('Ein lokaler Antwortzähler ist ungültig.');
    counted += count;
  }
  if (counted !== round.answeredIds.length) invalid('Die lokalen Antwortzähler sind unvollständig.');
  if (round.lastWordId !== null) assertId(round.lastWordId);
  if (round.current !== null) {
    assertExactKeys(round.current, ['wordId', 'revisionId', 'learningId', 'ordinal',...(v2?['schedulingGenerationId']:[])],
      'Die angezeigte Aufgabe ist ungültig.');
    assertId(round.current.wordId);
    assertId(round.current.revisionId);
    assertId(round.current.learningId);
    if(v2 && round.current.schedulingGenerationId!==null)assertId(round.current.schedulingGenerationId);
    const expectedOrdinal = round.status === 'feedback'
      ? round.answeredIds.length
      : round.answeredIds.length + 1;
    if (!Number.isSafeInteger(round.current.ordinal)
      || round.current.ordinal !== expectedOrdinal) {
      invalid('Die Aufgabenposition ist ungültig.');
    }
  }
  if (round.feedback !== null) {
    assertExactKeys(round.feedback, ['answerId', 'typed', 'correct', 'solutions'],
      'Die lokale Rückmeldung ist ungültig.');
    assertId(round.feedback.answerId);
    if (typeof round.feedback.typed !== 'string' || typeof round.feedback.correct !== 'boolean'
      || !Array.isArray(round.feedback.solutions)
      || round.feedback.solutions.some((entry) => typeof entry !== 'string')) {
      invalid('Die lokale Rückmeldung ist ungültig.');
    }
  }
  if (!['asking', 'feedback', 'exhausted', 'completed', 'abandoned'].includes(round.status)) {
    invalid('Der lokale Rundenstatus ist ungültig.');
  }
  if ((round.status === 'feedback') !== (round.feedback !== null)) {
    invalid('Rundenstatus und Rückmeldung widersprechen sich.');
  }
}

export function assertProductState(value, expectedDeviceId = null) {
  assertExactKeys(value, STATE_KEYS, 'Der lokale Produktzustand ist ungültig.');
  if (![1,2].includes(value.storageVersion)) fail('version', 'Diese lokale Speicherversion wird nicht unterstützt.');
  assertId(value.deviceId, 'Die Geräte-ID ist ungültig.');
  if (expectedDeviceId !== null && value.deviceId !== expectedDeviceId) {
    invalid('Der lokale Produktzustand gehört zu einem anderen Gerät.');
  }
  if (!Number.isSafeInteger(value.clock) || value.clock < 0) invalid('Die lokale Uhr ist ungültig.');
  const ledger = assertLedger(value.ledger);
  const knownClock = Math.max(
    0,
    ...ledger.events.map(({clock}) => clock),
    ...ledger.epochs.map(({clock}) => clock),
    ...ledger.historicalEpochs.map(({clock}) => clock),
  );
  if (value.clock < knownClock) invalid('Die lokale Uhr liegt hinter bekannten Daten.');
  assertRecord(value.rounds, 'Die lokalen Runden sind ungültig.');
  const rounds = {};
  for (const profileId of Object.keys(value.rounds)) {
    assertId(profileId);
    assertRound(value.rounds[profileId], profileId, value.storageVersion);
    setOwn(rounds, profileId, structuredClone(value.rounds[profileId]));
  }
  assertIdArray(value.outboxEventIds, 'Die Liste ausstehender Ereignisse ist ungültig.');
  const eventIds = new Set(ledger.events.map(({id}) => id));
  if (value.outboxEventIds.some((eventId) => !eventIds.has(eventId))) {
    invalid('Ein ausstehendes Ereignis fehlt im Fachmodell.');
  }
  for (const key of ['pendingPackets', 'knownFiles', 'quarantinedFiles', 'safetyCopies', 'restoreJobs', 'snapshotManifests']) {
    if (!Array.isArray(value[key])) invalid('Eine lokale Speicherliste ist ungültig.');
  }
  assertBinding(value.binding);
  assertDatasetSetup(value.datasetSetup);
  value.pendingPackets.forEach(assertPendingPacket);
  assertPacketIntegrity(value.packetIntegrity);
  value.knownFiles.forEach(assertKnownFile);
  value.quarantinedFiles.forEach(assertQuarantine);
  assertRestoreRecords(value);
  if(value.storageVersion===1) {
    const objects=[ledger.descriptor,...ledger.events,...ledger.epochs,
      ...value.pendingPackets.map(p=>p.packet),...value.safetyCopies.map(c=>c.backup),
      ...value.restoreJobs.flatMap(j=>[j.backup,...j.uploads.map(u=>u.value),...(j.epoch?[j.epoch]:[])])];
    assertContainedVersion(LEGACY_VERSION,objects);
  }
  if(value.storageVersion===2)for(const round of Object.values(rounds)) {
    const start=ledger.events.find(e=>e.type==='round.started' && e.payload.roundId===round.id);
    if(!start || start.payload.profileId!==round.profileId)invalid('Der lokale Rundenstart fehlt.');
    const policy=start.formatVersion===1?DEFAULT_POLICY:start.payload.policy;
    const policyEventId=start.formatVersion===1?null:start.payload.policyEventId;
    if(canonical(round.policy)!==canonical(policy) || round.policyEventId!==policyEventId)invalid('Der lokale Rundenvertrag wurde verändert.');
    if(round.current!==null) {
      const candidate=round.candidates.find(c=>c.wordId===round.current.wordId && c.learningId===round.current.learningId);
      if(!candidate || candidate.schedulingGenerationId!==round.current.schedulingGenerationId) {
        invalid('Die angezeigte Wortgeneration passt nicht zur eingefrorenen Rundenauswahl.');
      }
    }
    for(const candidate of [...round.candidates,...(round.current?[round.current]:[])]) {
      if(candidate.schedulingGenerationId!==null) {
        const reset=ledger.events.find(e=>e.id===candidate.schedulingGenerationId);
        if(!reset || reset.type!=='word.reactivated' || reset.payload.profileId!==round.profileId
          || reset.payload.wordId!==candidate.wordId || reset.payload.learningId!==candidate.learningId)invalid('Die lokale Wortgeneration ist unvollständig.');
      }
    }
  }
  if (value.pinVerifier !== null) assertRecord(value.pinVerifier, 'Der lokale PIN-Prüfwert ist ungültig.');
  return {
    ...structuredClone(value),
    ledger,
    rounds,
  };
}

function normalizeProductState(value) {
  const normalized = structuredClone(value);
  if (normalized?.storageVersion === 1) {
    if (!own(normalized, 'datasetSetup')) normalized.datasetSetup = null;
    if (!own(normalized, 'packetIntegrity')) normalized.packetIntegrity = [];
  }
  return normalized;
}

function stateForHash(state) {
  const copy = structuredClone(state);
  copy.rounds = Object.keys(state.rounds).sort().map((profileId) => {
    const round = structuredClone(state.rounds[profileId]);
    round.wordCounts = Object.keys(round.wordCounts).sort()
      .map((wordId) => [wordId, round.wordCounts[wordId]]);
    return [profileId, round];
  });
  return copy;
}

export function productStateHash(state) {
  return digest(stateForHash(state));
}

function calendarDay(date, timeZone) {
  try {
    return dayInZone(date, timeZone);
  } catch {
    invalid('Der Zeitpunkt oder die Lernzeitzone ist ungültig.');
  }
}

function maximumClock(state) {
  return Math.max(
    state.clock,
    ...state.ledger.events.map(({clock}) => clock),
    ...state.ledger.epochs.map(({clock}) => clock),
    ...state.ledger.historicalEpochs.map(({clock}) => clock),
  );
}

function appendOutbox(state, eventId) {
  state.outboxEventIds = [...new Set([...state.outboxEventIds, eventId])].sort();
}

function findRound(state, roundId) {
  for (const profileId of Object.keys(state.rounds)) {
    const round = state.rounds[profileId];
    if (round.id === roundId) return {profileId, round};
  }
  invalid('Die lokale Runde wurde nicht gefunden.');
}

function activeProfile(projection, profileId) {
  if (!own(projection.entities.profiles, profileId)) return false;
  const entity = projection.entities.profiles[profileId];
  return entity.value !== null && !entity.value.archived;
}

function sameTask(left, right) {
  return left !== null && right !== null
    && left.wordId === right.wordId
    && left.revisionId === right.revisionId
    && left.learningId === right.learningId
    && left.ordinal === right.ordinal
    && left.schedulingGenerationId === right.schedulingGenerationId;
}

function scheduleForRound(state, round, day) {
  if (round.schedulingMode === 'legacy') return null;
  // Already selected candidates retain their generation. Newly available words
  // (only used by explicit expansion) use the current generation and old policy.
  const generations = currentGenerations(state.ledger, round.profileId)
    .filter(entry => !round.candidates.some(candidate => candidate.wordId === entry.wordId
      && candidate.learningId === entry.learningId));
  generations.push(...round.candidates.map(({wordId, learningId, schedulingGenerationId}) =>
    ({wordId, learningId, generationId: schedulingGenerationId})));
  return projectSchedule({ledger: state.ledger, profileId: round.profileId, policy: round.policy, day, generations});
}

function learningProfile(state, profileId) {
  const projection = project(state.ledger);
  if (projection.epochConflict) fail('conflict', 'Die aktive Datensatzversion ist nicht eindeutig.');
  if (projection.activeEpochId === null) fail('not-ready', 'Die aktive Datensatzversion ist unvollständig.');
  if (!activeProfile(projection, profileId)) invalid('Das Profil ist nicht verfügbar.');
  return projection;
}

export async function createCommands({store, now, id, deviceId, onChange}) {
  if (!store || typeof store.load !== 'function' || typeof store.save !== 'function') {
    invalid('Der lokale Speicher ist nicht verfügbar.');
  }
  if (typeof now !== 'function' || typeof id !== 'function' || typeof onChange !== 'function') {
    invalid('Eine Befehlsabhängigkeit fehlt.');
  }
  assertId(deviceId, 'Die Geräte-ID ist ungültig.');
  const loaded = await store.load();
  let state = loaded === null ? null : assertProductState(normalizeProductState(loaded), deviceId);
  if(state?.storageVersion===1) {
    const migrated=await migrateProductStateV1(state,{now});
    try { await store.save(migrated); }
    catch { throw new ProductError('storage','Die Formatumstellung konnte nicht gespeichert werden. Die bisherigen Daten bleiben erhalten.'); }
    state=migrated;
  }
  let mutationTail = Promise.resolve();
  const listeners = new Set();

  function enqueue(mutation) {
    const running = mutationTail.then(mutation);
    mutationTail = running.catch(() => {});
    return running;
  }

  function requireState() {
    if (state === null) fail('not-ready', 'Der Vokabeltrainer ist noch nicht eingerichtet.');
    return state;
  }

  function nextEvent(target, type, payload, {eventId = id(), epochId = null} = {}) {
    const date = now();
    let activeEpochId = epochId;
    if (activeEpochId === null) {
      const projection = project(target.ledger);
      if (projection.epochConflict) fail('conflict', 'Die aktive Datensatzversion ist nicht eindeutig.');
      if (projection.activeEpochId === null) {
        fail('not-ready', 'Die aktive Datensatzversion ist unvollständig.');
      }
      activeEpochId = projection.activeEpochId;
    }
    const clock = maximumClock(target) + 1;
    target.clock = clock;
    return {
      ...VERSION,
      kind: 'event',
      id: eventId,
      datasetId: target.ledger.descriptor.datasetId,
      epochId: activeEpochId,
      deviceId,
      clock,
      occurredAt: date.toISOString(),
      day: calendarDay(date, target.ledger.descriptor.timeZone),
      type,
      payload: structuredClone(payload),
    };
  }

  function appendLocalEvent(target, event) {
    target.ledger.events.push(event);
    appendOutbox(target, event.id);
  }

  function reconcileMilestones(target) {
    const payloads = pendingMilestones(target.ledger);
    if (payloads.length === 0) return;
    const projection = project(target.ledger);
    for (const payload of payloads) {
      appendLocalEvent(target, nextEvent(target, 'word.milestone', payload, {
        epochId: projection.activeEpochId,
      }));
    }
  }

  async function commit(next) {
    const validated = assertProductState(next, deviceId);
    try {
      await store.save(validated);
    } catch (error) {
      if (error instanceof ProductError && error.code === 'storage') throw error;
      throw new ProductError('storage', 'Die lokalen Produktdaten konnten nicht gespeichert werden.');
    }
    state = validated;
    onChange(structuredClone(state));
    for (const listener of listeners) listener(structuredClone(state));
  }

  function newWorkingState() {
    const current = requireState();
    return {
      ...structuredClone(current),
      rounds: cloneRoundMap(current.rounds),
    };
  }

  return {
    getState() {
      return state === null ? null : structuredClone(state);
    },

    subscribe(listener) {
      if (typeof listener !== 'function') invalid('Der Änderungsbeobachter ist ungültig.');
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    practiceChoices({profileId}) {
      const current = requireState();
      const projection = project(current.ledger);
      const day = calendarDay(now(), current.ledger.descriptor.timeZone);
      const {policy} = currentPolicy(current.ledger, profileId);
      const schedule = projectSchedule({ledger: current.ledger, profileId, policy, day});
      return previewModes({projection, profileId, day, schedule});
    },

    learningRulePreview({profileId, policy}) {
      const current = requireState(), projection = learningProfile(current, profileId);
      const day = calendarDay(now(), current.ledger.descriptor.timeZone);
      const schedule = projectSchedule({ledger: current.ledger, profileId, policy, day});
      const excludedCount = activeWords(projection, profileId).filter(word =>
        schedule.words.get(word.id)?.get(word.value.learningId)?.excluded).length;
      const dueCount = previewModes({projection, profileId, day, schedule}).find(mode => mode.mode === 'all').availableCount;
      return {excludedCount, dueCount, policyEventId: currentPolicy(current.ledger, profileId).eventId};
    },

    setLearningRules({profileId, expectedPolicyEventId, policy}) {
      return enqueue(async () => {
        const next = newWorkingState();
        learningProfile(next, profileId);
        const rules = assertPolicy(policy);
        if (currentPolicy(next.ledger, profileId).eventId !== expectedPolicyEventId) {
          fail('conflict', 'Die Lernregeln wurden inzwischen geändert. Bitte den Entwurf erneut prüfen.');
        }
        appendLocalEvent(next, nextEvent(next, 'learning.rules.changed', {profileId, ...rules}));
        await commit(next);
      });
    },

    reactivateWord({profileId, wordId, learningId, expectedGenerationId}) {
      return enqueue(async () => {
        const next = newWorkingState(), projection = learningProfile(next, profileId);
        const word = activeWords(projection, profileId).find(word => word.id === wordId);
        if (!word) invalid('Das Wort ist für dieses Profil nicht verfügbar.');
        if (word.value.learningId !== learningId) fail('conflict', 'Die Lernfassung des Wortes wurde inzwischen geändert.');
        const current = currentGenerations(next.ledger, profileId)
          .find(entry => entry.wordId === wordId && entry.learningId === learningId)?.generationId ?? null;
        if (current !== expectedGenerationId) fail('conflict', 'Das Wort wurde inzwischen wieder zum Üben aufgenommen.');
        appendLocalEvent(next, nextEvent(next, 'word.reactivated', {
          profileId, wordId, learningId, revisionId: word.heads.at(-1),
        }));
        await commit(next);
      });
    },

    roundAvailability({roundId}) {
      const current = requireState();
      const found = findRound(current, roundId);
      const projection = project(current.ledger);
      const day = calendarDay(now(), current.ledger.descriptor.timeZone);
      return structuredClone(nextTask({round: found.round, projection, day,
        schedule: scheduleForRound(current, found.round, day)}));
    },

    setup({name, timeZone}) {
      return enqueue(async () => {
        if (state !== null) invalid('Der Vokabeltrainer ist bereits eingerichtet.');
        const date = now();
        const datasetId = id();
        const rootEpochId = id();
        const initial = {
          storageVersion: 2,
          deviceId,
          clock: 0,
          ledger: {
            descriptor: {
              ...VERSION,
              kind: 'dataset',
              datasetId,
              name,
              timeZone,
              rootEpochId,
              createdAt: date.toISOString(),
            },
            events: [],
            epochs: [{
              ...VERSION,
              kind: 'epoch',
              id: rootEpochId,
              datasetId,
              parents: [],
              deviceId,
              clock: 0,
              occurredAt: date.toISOString(),
              snapshotId: null,
              snapshotManifestFileId: null,
            }],
            snapshots: [],
            historicalEpochs: [],
          },
          rounds: {},
          binding: null,
          outboxEventIds: [],
          pendingPackets: [],
          datasetSetup: null,
          packetIntegrity: [],
          knownFiles: [],
          quarantinedFiles: [],
          safetyCopies: [],
          restoreJobs: [],
          snapshotManifests: [],
          pinVerifier: null,
        };
        await commit(initial);
      });
    },

    revise({entityType, entityId, expectedHeads, value}) {
      return enqueue(async () => {
        const next = newWorkingState();
        if (!Array.isArray(expectedHeads)) invalid('Die erwarteten Fassungen sind ungültig.');
        const projection = project(next.ledger);
        const bucketName = {profile: 'profiles', lesson: 'lessons', word: 'words'}[entityType];
        if (!bucketName) invalid('Der Entitätstyp ist ungültig.');
        const entity = own(projection.entities[bucketName], entityId)
          ? projection.entities[bucketName][entityId]
          : null;
        const actualHeads = [...(entity?.heads ?? [])].sort();
        const expected = [...new Set(expectedHeads)].sort();
        if (expected.length !== actualHeads.length
          || expected.some((head, index) => head !== actualHeads[index])) {
          fail('stale', 'Die Inhaltsfassung wurde inzwischen geändert.');
        }
        const revisionId = id();
        let nextValue = structuredClone(value);
        if (entityType === 'word') {
          const byId = new Map(next.ledger.events.map((event) => [event.id, event]));
          const parents = actualHeads.map((head) => byId.get(head));
          if (parents.some((parent) => !parent)) invalid('Eine Vorgängerfassung fehlt.');
          nextValue.learningId = await nextLearningId({
            wordId: entityId,
            revisionId,
            value: nextValue,
            parents,
          });
        }
        const event = nextEvent(next, 'entity.revised', revisionPayload({
          entityType,
          entityId,
          parents: actualHeads,
          value: nextValue,
        }), {eventId: revisionId});
        appendLocalEvent(next, event);
        reconcileMilestones(next);
        await commit(next);
      });
    },

    start({profileId, mode, size}) {
      return enqueue(async () => {
        const next = newWorkingState();
        if (own(next.rounds, profileId)
          && !['completed', 'abandoned'].includes(next.rounds[profileId].status)) {
          fail('conflict', 'Für dieses Profil läuft bereits eine Runde.');
        }
        const projection = project(next.ledger);
        const roundId = id();
        const day = calendarDay(now(), next.ledger.descriptor.timeZone);
        const {eventId: policyEventId, policy} = currentPolicy(next.ledger, profileId);
        const schedule = projectSchedule({ledger: next.ledger, profileId, policy, day});
        const round = {...startRound({id: roundId, profileId, mode, size, projection, day, schedule}),
          policyEventId, policy, schedulingMode: 'configurable'};
        const event = nextEvent(next, 'round.started', {roundId, profileId, mode, size, policyEventId, policy});
        appendLocalEvent(next, event);
        setOwn(next.rounds, profileId, round);
        reconcileMilestones(next);
        await commit(next);
      });
    },

    submit({roundId, typed}) {
      return enqueue(async () => {
        const current = requireState();
        const found = findRound(current, roundId);
        if (found.round.feedback !== null) {
          return {empty: false, feedback: structuredClone(found.round.feedback)};
        }
        const projectionBefore = project(current.ledger);
        const day = calendarDay(now(), current.ledger.descriptor.timeZone);
        const available = nextTask({round: found.round, projection: projectionBefore, day,
          schedule: scheduleForRound(current, found.round, day)});
        if (available.kind !== 'task' || !sameTask(available.task, found.round.current)) {
          invalid('Die angezeigte Aufgabe ist nicht mehr zulässig.');
        }
        const word = projectionBefore.entities.words[found.round.current.wordId];
        const checked = assess(typed, word.value);
        if (checked.empty) return {empty: true, feedback: null};

        const next = newWorkingState();
        const nextFound = findRound(next, roundId);
        const answer = nextEvent(next, 'answer.recorded', {
          roundId,
          profileId: nextFound.round.profileId,
          ordinal: nextFound.round.current.ordinal,
          wordId: nextFound.round.current.wordId,
          revisionId: nextFound.round.current.revisionId,
          learningId: nextFound.round.current.learningId,
          correct: checked.correct,
          schedulingGenerationId: nextFound.round.current.schedulingGenerationId,
        });
        appendLocalEvent(next, answer);
        const projectionAfter = project(next.ledger);
        const updatedRound = applyAnswer({
          round: nextFound.round,
          answer,
          typed,
          solutions: checked.solutions,
          projection: projectionAfter,
          schedule: scheduleForRound(next, nextFound.round, day),
        });
        setOwn(next.rounds, nextFound.profileId, updatedRound);
        reconcileMilestones(next);
        await commit(next);
        return {empty: false, feedback: structuredClone(updatedRound.feedback)};
      });
    },

    next({roundId}) {
      return enqueue(async () => {
        const next = newWorkingState();
        const found = findRound(next, roundId);
        const before = JSON.stringify(found.round);
        const projection = project(next.ledger);
        const day = calendarDay(now(), next.ledger.descriptor.timeZone);
        const schedule = scheduleForRound(next, found.round, day);
        let updated = advanceRound({round: found.round, projection, day, schedule});
        let completionPayload = null;
        if (nextTask({round: updated, projection, day, schedule}).kind === 'complete') {
          const completed = completeRound({round: updated, reason: 'full'});
          updated = completed.round;
          completionPayload = completed.payload;
        }
        if (completionPayload !== null) {
          appendLocalEvent(next, nextEvent(next, 'round.completed', {
            ...completionPayload,
            answerIds: [...completionPayload.answerIds].sort(),
          }));
        }
        if (JSON.stringify(updated) === before && completionPayload === null) return;
        setOwn(next.rounds, found.profileId, updated);
        reconcileMilestones(next);
        await commit(next);
      });
    },

    expand({roundId}) {
      return enqueue(async () => {
        const next = newWorkingState();
        const found = findRound(next, roundId);
        const projection = project(next.ledger);
        const day = calendarDay(now(), next.ledger.descriptor.timeZone);
        const updated = expandRound({round: found.round, projection, day,
          schedule: scheduleForRound(next, found.round, day)});
        setOwn(next.rounds, found.profileId, updated);
        await commit(next);
      });
    },

    finish({roundId, reason}) {
      return enqueue(async () => {
        const next = newWorkingState();
        const found = findRound(next, roundId);
        const completed = completeRound({round: found.round, reason});
        if (completed.payload === null) return;
        appendLocalEvent(next, nextEvent(next, 'round.completed', {
          ...completed.payload,
          answerIds: [...completed.payload.answerIds].sort(),
        }));
        setOwn(next.rounds, found.profileId, completed.round);
        reconcileMilestones(next);
        await commit(next);
      });
    },

    abandon({roundId}) {
      return enqueue(async () => {
        const next = newWorkingState();
        const found = findRound(next, roundId);
        if (['completed', 'abandoned'].includes(found.round.status)) return;
        const updated = abandonRound(found.round);
        appendLocalEvent(next, nextEvent(next, 'round.abandoned', {
          roundId,
          profileId: found.round.profileId,
        }));
        setOwn(next.rounds, found.profileId, updated);
        reconcileMilestones(next);
        await commit(next);
      });
    },

    setAvatar({profileId, skin, clothing, head, back, hand}) {
      return enqueue(async () => {
        const next = newWorkingState();
        const projection = project(next.ledger);
        if (!activeProfile(projection, profileId)) invalid('Das Profil ist nicht verfügbar.');
        const profile = projection.profiles[profileId];
        const masteredWordIds = Object.entries(profile.words)
          .filter(([, word]) => word.masteredEver).map(([wordId]) => wordId);
        const recoveredWordIds = Object.entries(profile.words)
          .filter(([, word]) => word.recoveredEver).map(([wordId]) => wordId);
        const unlocked = rewardState({
          points: profile.points,
          completedRounds: profile.completedRounds,
          masteredWordIds,
          recoveredWordIds,
        }).unlocked;
        if ((head !== null && !unlocked.head.includes(head))
          || (back !== null && !unlocked.back.includes(back))
          || (hand !== null && !unlocked.hand.includes(hand))) {
          invalid('Diese Avatar-Ausstattung ist noch nicht freigeschaltet.');
        }
        appendLocalEvent(next, nextEvent(next, 'avatar.changed', {
          profileId, skin, clothing, head, back, hand,
        }));
        reconcileMilestones(next);
        await commit(next);
      });
    },

    setAnimations({profileId, animations}) {
      return enqueue(async () => {
        const next = newWorkingState();
        if (!activeProfile(project(next.ledger), profileId)) invalid('Das Profil ist nicht verfügbar.');
        appendLocalEvent(next, nextEvent(next, 'preference.changed', {profileId, animations}));
        reconcileMilestones(next);
        await commit(next);
      });
    },

    commitExternal(nextState, expectedStateHash) {
      return enqueue(async () => {
        const current = requireState();
        if (await productStateHash(current) !== expectedStateHash) {
          fail('stale', 'Der lokale Stand hat sich inzwischen geändert.');
        }
        const next = assertProductState(structuredClone(nextState), deviceId);
        const previousEpoch = project(current.ledger).activeEpochId;
        const nextEpoch = project(next.ledger).activeEpochId;
        if (nextEpoch !== null && nextEpoch !== previousEpoch) {
          for (const round of Object.values(next.rounds)) {
            if (round.epochId !== nextEpoch && !['completed', 'abandoned'].includes(round.status)) {
              round.status = 'abandoned';
              round.current = null;
              round.feedback = null;
            }
          }
        }
        reconcileMilestones(next);
        await commit(next);
      });
    },
  };
}
