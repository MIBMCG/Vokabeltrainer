import {assess} from './answers.js';
import {ProductError} from '../model/errors.js';

const MODES = new Set(['all', 'latest', 'new']);
const SIZES = new Set([10, 20, 30]);

function invalid(message) {
  throw new ProductError('invalid', message);
}

function compareAscii(left, right) {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function compareOrder(left, right) {
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    if (left[index] === right[index]) continue;
    if (left[index] === undefined) return -1;
    if (right[index] === undefined) return 1;
    return left[index] < right[index] ? -1 : 1;
  }
  return 0;
}

function setOwn(bucket, id, value) {
  Object.defineProperty(bucket, id, {
    value,
    enumerable: true,
    writable: true,
    configurable: true,
  });
}

function own(bucket, id) {
  return bucket !== null && typeof bucket === 'object' && Object.hasOwn(bucket, id);
}

function profileEntity(projection, profileId) {
  if (!own(projection?.entities?.profiles, profileId)) return null;
  const entity = projection.entities.profiles[profileId];
  return entity.value !== null && !entity.value.archived ? entity : null;
}

function assignedLessons(projection, profileId) {
  return Object.values(projection.entities.lessons).filter((entity) => (
    entity.value !== null
    && !entity.value.archived
    && entity.value.profileIds.includes(profileId)
  ));
}

function latestLessonId(projection, profileId) {
  const lessons = assignedLessons(projection, profileId);
  lessons.sort((left, right) => (
    compareOrder(left.createdOrder, right.createdOrder)
    || compareAscii(left.id, right.id)
  ));
  return lessons.at(-1)?.id ?? null;
}

function activeWords(projection, profileId) {
  if (!profileEntity(projection, profileId)) return [];
  const lessonIds = new Set(assignedLessons(projection, profileId).map(({id}) => id));
  return Object.values(projection.entities.words)
    .filter((entity) => entity.value !== null
      && !entity.value.archived
      && lessonIds.has(entity.value.lessonId))
    .sort((left, right) => compareAscii(left.id, right.id));
}

function profileWord(projection, profileId, wordId) {
  if (!own(projection?.profiles, profileId)) return null;
  const words = projection.profiles[profileId].words;
  return own(words, wordId) ? words[wordId] : null;
}

function initialCandidates(mode, projection, profileId) {
  const latestId = mode === 'latest' ? latestLessonId(projection, profileId) : null;
  return activeWords(projection, profileId)
    .filter((entity) => {
      if (mode === 'latest') return entity.value.lessonId === latestId;
      if (mode !== 'new') return true;
      return !(profileWord(projection, profileId, entity.id)?.everPracticed ?? false);
    })
    .map((entity) => ({wordId: entity.id, learningId: entity.value.learningId}));
}

function currentWordEntity(projection, round, candidate) {
  if (!profileEntity(projection, round.profileId)) return null;
  if (!own(projection.entities.words, candidate.wordId)) return null;
  const word = projection.entities.words[candidate.wordId];
  if (word.value === null
    || word.value.archived
    || word.value.learningId !== candidate.learningId) return null;
  if (!own(projection.entities.lessons, word.value.lessonId)) return null;
  const lesson = projection.entities.lessons[word.value.lessonId];
  if (lesson.value === null
    || lesson.value.archived
    || !lesson.value.profileIds.includes(round.profileId)) return null;
  return word;
}

function isDue(state, day) {
  if (state === null) return true;
  if (state.retryPending) return state.errorGap === 0;
  if (state.intervalIndex >= 0) return state.dueDay !== null && state.dueDay <= day;
  return true;
}

function candidateDetails(round, projection, day, candidate) {
  if (round.pausedWordIds.includes(candidate.wordId)) return null;
  const entity = currentWordEntity(projection, round, candidate);
  if (entity === null) return null;
  const state = profileWord(projection, round.profileId, candidate.wordId);
  if (!isDue(state, day)) return null;
  return {candidate, entity, state};
}

function eligibleCandidates(round, projection, day) {
  const eligible = [];
  for (const candidate of round.candidates) {
    const details = candidateDetails(round, projection, day, candidate);
    if (details !== null) eligible.push(details);
  }
  return eligible;
}

function additionalCandidates(round, projection, day) {
  if (round.expanded) return [];
  const selected = new Set(round.candidates.map(({wordId}) => wordId));
  const additional = [];
  for (const entity of activeWords(projection, round.profileId)) {
    if (selected.has(entity.id)) continue;
    const candidate = {wordId: entity.id, learningId: entity.value.learningId};
    if (candidateDetails(round, projection, day, candidate) !== null) additional.push(candidate);
  }
  return additional;
}

function hasAdditionalCandidates(round, projection, day) {
  return additionalCandidates(round, projection, day).length > 0;
}

function priority(state) {
  if (state?.retryPending) return 0;
  if ((state?.intervalIndex ?? -1) >= 0) return 1;
  if (!(state?.everPracticed ?? false)) return 2;
  return 3;
}

function countInRound(round, wordId) {
  return own(round.wordCounts, wordId) ? round.wordCounts[wordId] : 0;
}

function compareLastPracticed(left, right) {
  return compareAscii(left ?? '', right ?? '');
}

function stableHash(value) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function stableMix(roundId, wordId) {
  return stableHash(`${roundId}\u0000${wordId}`);
}

function compareRank(left, right, round) {
  const categoryOrder = priority(left.state) - priority(right.state);
  if (categoryOrder !== 0) return categoryOrder;
  const countOrder = countInRound(round, left.candidate.wordId)
    - countInRound(round, right.candidate.wordId);
  if (countOrder !== 0) return countOrder;
  const practiceOrder = compareLastPracticed(
    left.state?.lastPracticedAt,
    right.state?.lastPracticedAt,
  );
  if (practiceOrder !== 0) return practiceOrder;
  const leftRepeated = left.candidate.wordId === round.lastWordId;
  const rightRepeated = right.candidate.wordId === round.lastWordId;
  if (leftRepeated !== rightRepeated) return leftRepeated ? 1 : -1;
  const hashOrder = stableMix(round.id, left.candidate.wordId)
    - stableMix(round.id, right.candidate.wordId);
  return hashOrder || compareAscii(left.candidate.wordId, right.candidate.wordId);
}

function taskFromDetails(details, ordinal) {
  return {
    wordId: details.candidate.wordId,
    revisionId: details.entity.heads.at(-1),
    learningId: details.candidate.learningId,
    ordinal,
  };
}

function rankCandidates(candidates, round) {
  const ordinal = round.answeredIds.length + 1;
  return [...candidates]
    .sort((left, right) => compareRank(left, right, round))
    .map((details) => taskFromDetails(details, ordinal));
}

function currentTaskIsEligible(round, eligible) {
  if (round.status !== 'asking' || round.current === null) return false;
  if (round.current.ordinal !== round.answeredIds.length + 1) return false;
  const details = eligible.find(({candidate}) => candidate.wordId === round.current.wordId);
  if (details === undefined) return false;
  const current = taskFromDetails(details, round.current.ordinal);
  return current.revisionId === round.current.revisionId
    && current.learningId === round.current.learningId;
}

export function nextTask({round, projection, day}) {
  if (round.status === 'completed') return {kind: 'complete'};
  if (round.status === 'abandoned') return {kind: 'exhausted', canExpand: false};
  if (round.answeredIds.length >= round.size) return {kind: 'complete'};
  const allowed = eligibleCandidates(round, projection, day);
  if (currentTaskIsEligible(round, allowed)) {
    return {kind: 'task', task: structuredClone(round.current)};
  }
  if (allowed.length === 0) {
    return {kind: 'exhausted', canExpand: hasAdditionalCandidates(round, projection, day)};
  }
  return {kind: 'task', task: rankCandidates(allowed, round)[0]};
}

function moveToNext(round, projection, day) {
  const next = nextTask({round, projection, day});
  if (next.kind === 'task') {
    return {...round, current: next.task, feedback: null, status: 'asking'};
  }
  if (next.kind === 'exhausted') {
    return {...round, current: null, feedback: null, status: 'exhausted'};
  }
  return {...round, current: null, feedback: null, status: 'asking'};
}

export function startRound({id, profileId, mode, size = 10, projection, day}) {
  if (!MODES.has(mode)) invalid('Unsupported round mode');
  if (!SIZES.has(size)) invalid('Unsupported round size');
  if (!profileEntity(projection, profileId)) invalid('Round profile is unavailable');
  if (projection.activeEpochId === null || projection.epochConflict) {
    invalid('Round requires one active epoch');
  }
  const round = {
    id,
    epochId: projection.activeEpochId,
    profileId,
    mode,
    size,
    candidates: initialCandidates(mode, projection, profileId),
    expanded: false,
    pausedWordIds: [],
    answeredIds: [],
    wordCounts: {},
    lastWordId: null,
    current: null,
    feedback: null,
    status: 'asking',
  };
  return moveToNext(round, projection, day);
}

function validateAnswer(round, answer) {
  if (answer?.type !== 'answer.recorded') invalid('Round answer must be answer.recorded');
  if (round.status === 'completed' || round.status === 'abandoned') {
    invalid('Terminal round cannot accept answers');
  }
  if (round.current === null) invalid('Round has no displayed task');
  const payload = answer.payload;
  if (payload.roundId !== round.id
    || payload.profileId !== round.profileId
    || payload.wordId !== round.current.wordId
    || payload.revisionId !== round.current.revisionId
    || payload.learningId !== round.current.learningId
    || payload.ordinal !== round.current.ordinal) {
    invalid('Answer does not match the displayed task');
  }
}

function countedTotal(round) {
  return Object.values(round.wordCounts).reduce((sum, value) => sum + value, 0);
}

export function applyAnswer({round, answer, typed, solutions, projection}) {
  validateAnswer(round, answer);
  if (!Array.isArray(solutions)) invalid('Answer solutions must be an array');
  const assessment = assess(typed, {answers: solutions});
  if (assessment.empty || assessment.correct !== answer.payload.correct) {
    invalid('Recorded answer does not match assessment');
  }
  if (countedTotal(round) !== round.answeredIds.length) {
    invalid('Round answer counters are inconsistent');
  }
  if (round.answeredIds.includes(answer.id)) return structuredClone(round);

  const next = structuredClone(round);
  next.answeredIds.push(answer.id);
  if (own(next.wordCounts, answer.payload.wordId)) {
    next.wordCounts[answer.payload.wordId] += 1;
  } else {
    setOwn(next.wordCounts, answer.payload.wordId, 1);
  }
  next.lastWordId = answer.payload.wordId;
  next.feedback = {
    answerId: answer.id,
    typed,
    correct: answer.payload.correct,
    solutions: assessment.solutions,
  };
  next.status = 'feedback';

  const state = profileWord(projection, round.profileId, answer.payload.wordId);
  const correctlyPaused = answer.payload.correct
    && state?.learningId === answer.payload.learningId
    && state.intervalIndex >= 0
    && state.dueDay !== null
    && state.dueDay > answer.day;
  if (correctlyPaused && !next.pausedWordIds.includes(answer.payload.wordId)) {
    next.pausedWordIds.push(answer.payload.wordId);
  }
  return next;
}

export function advanceRound({round, projection, day}) {
  if (round.status === 'completed' || round.status === 'abandoned') return structuredClone(round);
  const next = structuredClone(round);
  if (next.status === 'feedback' || next.status === 'exhausted') {
    next.current = null;
    next.feedback = null;
    next.status = 'asking';
  }
  return moveToNext(next, projection, day);
}

export function expandRound({round, projection, day}) {
  if (round.status === 'completed' || round.status === 'abandoned') return structuredClone(round);
  const availability = nextTask({round, projection, day});
  if (availability.kind !== 'exhausted') invalid('Only an exhausted round can be expanded');
  const next = structuredClone(round);
  if (!next.expanded) next.candidates.push(...additionalCandidates(next, projection, day));
  next.expanded = true;
  next.current = null;
  next.feedback = null;
  next.status = 'asking';
  return moveToNext(next, projection, day);
}

export function completeRound({round, reason}) {
  if (reason !== 'full' && reason !== 'exhausted') invalid('Unsupported completion reason');
  if (round.status === 'completed' || round.status === 'abandoned') {
    return {round, payload: null};
  }
  if (countedTotal(round) !== round.answeredIds.length) {
    invalid('Round answer counters are inconsistent');
  }
  const full = reason === 'full' && round.answeredIds.length === round.size;
  const exhausted = reason === 'exhausted'
    && round.status === 'exhausted'
    && round.answeredIds.length > 0
    && round.answeredIds.length < round.size;
  if (!full && !exhausted) return {round, payload: null};
  const completed = {
    ...structuredClone(round), current: null, feedback: null, status: 'completed',
  };
  return {
    round: completed,
    payload: {
      roundId: round.id,
      profileId: round.profileId,
      reason,
      answerIds: [...round.answeredIds],
    },
  };
}

export function abandonRound(round) {
  if (round.status === 'completed' || round.status === 'abandoned') return structuredClone(round);
  return {
    ...structuredClone(round), current: null, feedback: null, status: 'abandoned',
  };
}
