import {resolveEpochs} from '../model/epochs.js';
import {projectEntities} from '../model/revisions.js';
import {addDays} from './calendar.js';
import {rewardState} from './rewards.js';

const REVIEW_INTERVALS = [1, 3, 7, 14];

function compareAscii(left, right) {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function compareEvents(left, right) {
  if (left.clock !== right.clock) return left.clock - right.clock;
  return compareAscii(left.deviceId, right.deviceId) || compareAscii(left.id, right.id);
}

function setOwn(bucket, id, value) {
  Object.defineProperty(bucket, id, {
    value,
    enumerable: true,
    writable: true,
    configurable: true,
  });
}

function orderedUniqueEvents(events) {
  const byId = new Map();
  for (const event of events) {
    const previous = byId.get(event.id);
    if (!previous || compareEvents(event, previous) < 0) byId.set(event.id, event);
  }
  return [...byId.values()].sort(compareEvents);
}

function uniqueAnswers(events) {
  const answers = new Map();
  for (const event of orderedUniqueEvents(events)) {
    if (event.type !== 'answer.recorded') continue;
    const key = `${event.payload.roundId}\u0000${event.payload.ordinal}`;
    if (!answers.has(key)) answers.set(key, event);
  }
  return [...answers.values()];
}

function defaultLearningState() {
  return {
    streak: 0,
    intervalIndex: -1,
    dueDay: null,
    errorGap: 0,
    retryPending: false,
    advancedRoundIds: new Set(),
    correctSeriesAnswerIds: [],
    masteredEvidenceAnswerIds: null,
  };
}

function defaultTotals() {
  return {
    attempts: 0,
    correct: 0,
    wrong: 0,
    lastPracticedAt: null,
    everPracticed: false,
  };
}

function profileFacts(map, profileId) {
  if (!map.has(profileId)) {
    map.set(profileId, {
      totals: new Map(),
      learning: new Map(),
      mastered: new Set(),
      recovered: new Set(),
      pendingWrongByWord: new Map(),
      recoveredEvidenceByWord: new Map(),
      completedRoundIds: new Set(),
      avatar: {skin: 0, clothing: 0, head: null, back: null, hand: null},
      animations: true,
    });
  }
  return map.get(profileId);
}

function learningState(facts, wordId, learningId) {
  if (!facts.learning.has(wordId)) facts.learning.set(wordId, new Map());
  const versions = facts.learning.get(wordId);
  if (!versions.has(learningId)) versions.set(learningId, defaultLearningState());
  return versions.get(learningId);
}

function milestoneKey(profileId, wordId, milestone) {
  return `${profileId}\u0000${wordId}\u0000${milestone}`;
}

function recordMilestoneCandidate(candidates, payload) {
  const key = milestoneKey(payload.profileId, payload.wordId, payload.milestone);
  if (candidates.keys.has(key)) return;
  candidates.keys.add(key);
  candidates.ordered.push(payload);
}

function applyAnswer(factsByProfile, event, candidates) {
  const {profileId, wordId, learningId, correct, roundId} = event.payload;
  const facts = profileFacts(factsByProfile, profileId);
  for (const [otherWordId, versions] of facts.learning) {
    if (otherWordId === wordId) continue;
    for (const state of versions.values()) {
      if (state.errorGap > 0) state.errorGap -= 1;
    }
  }

  if (!facts.totals.has(wordId)) facts.totals.set(wordId, defaultTotals());
  const totals = facts.totals.get(wordId);
  totals.attempts += 1;
  totals.correct += correct ? 1 : 0;
  totals.wrong += correct ? 0 : 1;
  totals.lastPracticedAt = event.occurredAt;
  totals.everPracticed = true;

  const state = learningState(facts, wordId, learningId);
  if (!correct) {
    state.streak = 0;
    state.intervalIndex = -1;
    state.dueDay = null;
    state.errorGap = 2;
    state.retryPending = true;
    state.correctSeriesAnswerIds = [];
    if (!facts.pendingWrongByWord.has(wordId)) facts.pendingWrongByWord.set(wordId, event.id);
    return;
  }

  state.retryPending = false;
  const previousWrongId = facts.pendingWrongByWord.get(wordId);
  if (previousWrongId !== undefined) {
    facts.pendingWrongByWord.delete(wordId);
    if (!facts.recoveredEvidenceByWord.has(wordId)) {
      const evidenceAnswerIds = [previousWrongId, event.id];
      facts.recoveredEvidenceByWord.set(wordId, evidenceAnswerIds);
      recordMilestoneCandidate(candidates, {
        profileId,
        wordId,
        milestone: 'recovered',
        evidenceAnswerIds,
      });
    }
  }

  if (state.intervalIndex < 0) {
    state.streak = Math.min(3, state.streak + 1);
    state.correctSeriesAnswerIds.push(event.id);
    if (state.streak === 3) {
      state.intervalIndex = 0;
      state.dueDay = addDays(event.day, REVIEW_INTERVALS[0]);
      if (state.masteredEvidenceAnswerIds === null) {
        state.masteredEvidenceAnswerIds = state.correctSeriesAnswerIds.slice(-3);
        recordMilestoneCandidate(candidates, {
          profileId,
          wordId,
          milestone: 'mastered',
          evidenceAnswerIds: [...state.masteredEvidenceAnswerIds],
        });
      }
    }
    return;
  }

  if (event.day >= state.dueDay && !state.advancedRoundIds.has(roundId)) {
    state.intervalIndex = Math.min(3, state.intervalIndex + 1);
    state.dueDay = addDays(event.day, REVIEW_INTERVALS[state.intervalIndex]);
    state.advancedRoundIds.add(roundId);
  }
}

function foldAnswers(events) {
  const factsByProfile = new Map();
  const candidates = {keys: new Set(), ordered: []};
  const answers = uniqueAnswers(events);
  for (const answer of answers) applyAnswer(factsByProfile, answer, candidates);
  return {factsByProfile, answers, milestoneCandidates: candidates.ordered};
}

function validCompletedRounds(effectiveEvents, supportEvents) {
  const all = orderedUniqueEvents([...supportEvents, ...effectiveEvents]);
  const active = orderedUniqueEvents(effectiveEvents);
  const effectiveById = new Map(active.map((event) => [event.id, event]));
  const starts = new Map();
  for (const event of all) {
    if (event.type === 'round.started' && !starts.has(event.payload.roundId)) {
      starts.set(event.payload.roundId, event);
    }
  }
  const claims = new Map();
  for (const event of active) {
    if (event.type !== 'round.completed' || claims.has(event.payload.roundId)) continue;
    const {roundId, profileId, reason, answerIds} = event.payload;
    const start = starts.get(roundId);
    if (!start || start.payload.profileId !== profileId) continue;
    const answers = answerIds.map((id) => effectiveById.get(id));
    if (answers.some((answer) => !answer
      || answer.type !== 'answer.recorded'
      || answer.payload.roundId !== roundId
      || answer.payload.profileId !== profileId)) continue;
    const slots = new Set(answers.map((answer) => answer.payload.ordinal));
    if (slots.size !== answers.length) continue;
    if (reason === 'full' && answers.length !== start.payload.size) continue;
    if (reason === 'exhausted' && (answers.length === 0 || answers.length >= start.payload.size)) continue;
    const abandoned = active.some((candidate) => candidate.type === 'round.abandoned'
      && candidate.payload.roundId === roundId
      && candidate.payload.profileId === profileId
      && compareEvents(candidate, event) < 0);
    if (!abandoned) claims.set(roundId, event);
  }
  return [...claims.values()];
}

function wordOutput(facts, wordId, currentLearningId) {
  const totals = facts.totals.get(wordId) ?? defaultTotals();
  const current = currentLearningId === null
    ? defaultLearningState()
    : (facts.learning.get(wordId)?.get(currentLearningId) ?? defaultLearningState());
  return {
    attempts: totals.attempts,
    correct: totals.correct,
    wrong: totals.wrong,
    lastPracticedAt: totals.lastPracticedAt,
    everPracticed: totals.everPracticed,
    learningId: currentLearningId,
    streak: current.streak,
    intervalIndex: current.intervalIndex,
    dueDay: current.dueDay,
    errorGap: current.errorGap,
    retryPending: current.retryPending,
    masteredEver: facts.mastered.has(wordId),
    recoveredEver: facts.recovered.has(wordId),
  };
}

function selectedAvatar(selection, unlocked) {
  return {
    skin: selection.skin,
    clothing: selection.clothing,
    head: unlocked.head.includes(selection.head) ? selection.head : null,
    back: unlocked.back.includes(selection.back) ? selection.back : null,
    hand: unlocked.hand.includes(selection.hand) ? selection.hand : null,
  };
}

/**
 * Pure Projection result. `integrityProblems` is either empty or contains the
 * stable code `active-epoch-incomplete`; competing heads use `epochConflict`.
 * Avatar shape is `{skin,clothing,head,back,hand}` and reward entitlements use
 * `unlocked:{head:string[],back:string[],hand:string[]}` plus
 * `journey:{completedStages,islands:{id,unlocked}[]}`.
 * Each projected word also exposes `retryPending:boolean` for an unanswered
 * failure in its current learning version.
 */
export function project(ledger) {
  const resolved = resolveEpochs(ledger);
  const entityProjection = projectEntities(
    resolved.effectiveEvents,
    {supportEvents: resolved.supportEvents},
  );
  const events = orderedUniqueEvents(resolved.effectiveEvents);
  const {factsByProfile, answers} = foldAnswers(events);

  for (const entity of Object.values(entityProjection.entities.profiles)) {
    profileFacts(factsByProfile, entity.id);
  }

  for (const event of events) {
    if (event.type === 'word.milestone') {
      const facts = profileFacts(factsByProfile, event.payload.profileId);
      facts[event.payload.milestone].add(event.payload.wordId);
    } else if (event.type === 'avatar.changed') {
      profileFacts(factsByProfile, event.payload.profileId).avatar = {
        skin: event.payload.skin,
        clothing: event.payload.clothing,
        head: event.payload.head,
        back: event.payload.back,
        hand: event.payload.hand,
      };
    } else if (event.type === 'preference.changed') {
      profileFacts(factsByProfile, event.payload.profileId).animations = event.payload.animations;
    }
  }

  const completed = validCompletedRounds(events, resolved.supportEvents);
  for (const claim of completed) {
    profileFacts(factsByProfile, claim.payload.profileId).completedRoundIds.add(claim.payload.roundId);
  }

  const correctCounts = new Map();
  for (const answer of answers) {
    if (!answer.payload.correct) continue;
    correctCounts.set(answer.payload.profileId, (correctCounts.get(answer.payload.profileId) ?? 0) + 1);
  }

  const profiles = {};
  for (const [profileId, facts] of factsByProfile) {
    const points = (correctCounts.get(profileId) ?? 0) * 10 + facts.completedRoundIds.size * 20;
    const reward = rewardState({
      points,
      completedRounds: facts.completedRoundIds.size,
      masteredWordIds: [...facts.mastered],
      recoveredWordIds: [...facts.recovered],
    });
    const words = {};
    const wordIds = new Set([
      ...Object.keys(entityProjection.entities.words),
      ...facts.totals.keys(),
      ...facts.mastered,
      ...facts.recovered,
    ]);
    for (const wordId of wordIds) {
      const entity = Object.hasOwn(entityProjection.entities.words, wordId)
        ? entityProjection.entities.words[wordId]
        : null;
      const learningId = entity?.value?.learningId ?? null;
      setOwn(words, wordId, wordOutput(facts, wordId, learningId));
    }
    setOwn(profiles, profileId, {
      points,
      level: reward.level,
      completedRounds: facts.completedRoundIds.size,
      badges: reward.badges,
      avatar: selectedAvatar(facts.avatar, reward.unlocked),
      animations: facts.animations,
      words,
    });
  }

  return {
    activeEpochId: resolved.activeEpochId,
    epochConflict: resolved.epochConflict,
    entities: entityProjection.entities,
    conflicts: entityProjection.conflicts,
    profiles,
    lateEvents: resolved.lateEvents.map((event) => structuredClone(event)),
    effectiveEventIds: events.map(({id}) => id),
    integrityProblems: resolved.activeEpochId === null && !resolved.epochConflict
      ? ['active-epoch-incomplete']
      : [],
  };
}

/**
 * Returns absent durable milestone claims derived from the complete effective
 * answer history. Each payload is
 * `{profileId,wordId,milestone,evidenceAnswerIds}`; support and late events do
 * not create or suppress claims. At most one payload per profile/word/type is
 * returned, and an incomplete or conflicting active epoch returns `[]`.
 */
export function pendingMilestones(ledger) {
  const resolved = resolveEpochs(ledger);
  if (resolved.activeEpochId === null || resolved.epochConflict) return [];
  const events = orderedUniqueEvents(resolved.effectiveEvents);
  const {milestoneCandidates} = foldAnswers(events);
  const claimed = new Set(events
    .filter(({type}) => type === 'word.milestone')
    .map(({payload}) => milestoneKey(payload.profileId, payload.wordId, payload.milestone)));
  return milestoneCandidates
    .filter((payload) => !claimed.has(milestoneKey(
      payload.profileId,
      payload.wordId,
      payload.milestone,
    )))
    .map((payload) => structuredClone(payload));
}

export function milestonesAfterAnswer(projectionBefore, projectionAfter, answer, events) {
  if (answer.type !== 'answer.recorded' || !answer.payload.correct) return [];
  const {profileId, wordId, learningId} = answer.payload;
  if (!Object.hasOwn(projectionAfter.profiles, profileId)
    || !Object.hasOwn(projectionAfter.profiles[profileId].words, wordId)) return [];
  const before = Object.hasOwn(projectionBefore.profiles, profileId)
    && Object.hasOwn(projectionBefore.profiles[profileId].words, wordId)
    ? projectionBefore.profiles[profileId].words[wordId]
    : null;
  const after = projectionAfter.profiles[profileId].words[wordId];
  const answers = uniqueAnswers(events).filter((event) => compareEvents(event, answer) <= 0);
  const currentIndex = answers.findIndex(({id}) => id === answer.id);
  if (currentIndex < 0) return [];
  const result = [];

  if (!(before?.masteredEver ?? false)
    && (before?.streak ?? 0) < 3
    && after.streak === 3) {
    let series = [];
    for (const event of answers.slice(0, currentIndex + 1)) {
      if (event.payload.profileId !== profileId
        || event.payload.wordId !== wordId
        || event.payload.learningId !== learningId) continue;
      if (!event.payload.correct) series = [];
      else series.push(event);
    }
    const evidence = series.slice(-3);
    if (evidence.length === 3 && evidence.at(-1).id === answer.id) {
      result.push({
        profileId,
        wordId,
        milestone: 'mastered',
        evidenceAnswerIds: evidence.map(({id}) => id),
      });
    }
  }

  if (!(before?.recoveredEver ?? false)) {
    const previousWrong = answers
      .slice(0, currentIndex)
      .filter((event) => event.payload.profileId === profileId
        && event.payload.wordId === wordId
        && !event.payload.correct)
      .at(-1);
    if (previousWrong) {
      result.push({
        profileId,
        wordId,
        milestone: 'recovered',
        evidenceAnswerIds: [previousWrong.id, answer.id],
      });
    }
  }
  return result;
}
