import {assess} from './learning/answers.js';
import {dayInZone} from './learning/calendar.js';
import {pendingMilestones, project} from './learning/progress.js';
import {rewardState} from './learning/rewards.js';
import {
  abandonRound,
  advanceRound,
  applyAnswer,
  completeRound,
  expandRound,
  nextTask,
  startRound,
} from './learning/rounds.js';
import {canonical, digest} from './model/canonical.js';
import {ProductError} from './model/errors.js';
import {nextLearningId, revisionPayload} from './model/revisions.js';
import {assertLedger} from './model/schema.js';
import {validatePacket} from './sync/packets.js';

const VERSION = {
  format: 'vokabeltrainer-product',
  formatVersion: 1,
  ruleVersion: 1,
};
const STATE_KEYS = [
  'storageVersion',
  'deviceId',
  'clock',
  'ledger',
  'rounds',
  'binding',
  'outboxEventIds',
  'pendingPackets',
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

function assertRound(round, profileId) {
  assertExactKeys(round, ROUND_KEYS, 'Eine lokale Runde ist ungültig.');
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
    assertExactKeys(candidate, ['wordId', 'learningId'], 'Ein lokaler Rundenkandidat ist ungültig.');
    assertId(candidate.wordId);
    assertId(candidate.learningId);
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
    assertExactKeys(round.current, ['wordId', 'revisionId', 'learningId', 'ordinal'],
      'Die angezeigte Aufgabe ist ungültig.');
    assertId(round.current.wordId);
    assertId(round.current.revisionId);
    assertId(round.current.learningId);
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

function assertProductState(value, expectedDeviceId = null) {
  assertExactKeys(value, STATE_KEYS, 'Der lokale Produktzustand ist ungültig.');
  if (value.storageVersion !== 1) fail('version', 'Diese lokale Speicherversion wird nicht unterstützt.');
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
    assertRound(value.rounds[profileId], profileId);
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
  value.pendingPackets.forEach(assertPendingPacket);
  value.knownFiles.forEach(assertKnownFile);
  value.quarantinedFiles.forEach(assertQuarantine);
  if (value.pinVerifier !== null) assertRecord(value.pinVerifier, 'Der lokale PIN-Prüfwert ist ungültig.');
  return {
    ...structuredClone(value),
    ledger,
    rounds,
  };
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
    && left.ordinal === right.ordinal;
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
  let state = loaded === null ? null : assertProductState(loaded, deviceId);
  let mutationTail = Promise.resolve();

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

    roundAvailability({roundId}) {
      const current = requireState();
      const found = findRound(current, roundId);
      const projection = project(current.ledger);
      const day = calendarDay(now(), current.ledger.descriptor.timeZone);
      return structuredClone(nextTask({round: found.round, projection, day}));
    },

    setup({name, timeZone}) {
      return enqueue(async () => {
        if (state !== null) invalid('Der Vokabeltrainer ist bereits eingerichtet.');
        const date = now();
        const datasetId = id();
        const rootEpochId = id();
        const initial = {
          storageVersion: 1,
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
        const round = startRound({id: roundId, profileId, mode, size, projection, day});
        const event = nextEvent(next, 'round.started', {roundId, profileId, mode, size});
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
        const available = nextTask({round: found.round, projection: projectionBefore, day});
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
        });
        appendLocalEvent(next, answer);
        const projectionAfter = project(next.ledger);
        const updatedRound = applyAnswer({
          round: nextFound.round,
          answer,
          typed,
          solutions: checked.solutions,
          projection: projectionAfter,
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
        let updated = advanceRound({round: found.round, projection, day});
        let completionPayload = null;
        if (nextTask({round: updated, projection, day}).kind === 'complete') {
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
        const updated = expandRound({round: found.round, projection, day});
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
        reconcileMilestones(next);
        await commit(next);
      });
    },
  };
}
