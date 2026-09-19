import {resolveEpochs} from '../model/epochs.js';
import {assertPolicy, currentGenerations} from '../model/policies.js';
import {effectiveAnswers} from './facts.js';
import {addDays} from './calendar.js';

export function projectSchedule({ledger, profileId, policy, day, generations = null}) {
  const rules = assertPolicy(policy);
  addDays(day, 0);
  const words = new Map(), advancedRounds = new Map();
  function ensure(wordId, learningId, generationId = null) {
    if (!words.has(wordId)) words.set(wordId, new Map());
    const versions = words.get(wordId);
    if (!versions.has(learningId)) versions.set(learningId, {
      streak: 0, intervalIndex: -1, dueDay: null, errorGap: 0,
      retryPending: false, excluded: false, generationId,
    });
    return versions.get(learningId);
  }
  for (const entry of generations ?? currentGenerations(ledger, profileId)) {
    ensure(entry.wordId, entry.learningId, entry.generationId);
  }
  for (const answer of effectiveAnswers(ledger)) {
    const p = answer.payload;
    if (p.profileId !== profileId) continue;
    const state = ensure(p.wordId, p.learningId);
    if ((p.schedulingGenerationId ?? null) !== state.generationId) continue;
    for (const [wordId, versions] of words) {
      if (wordId !== p.wordId) for (const other of versions.values()) {
        if (other.errorGap > 0) other.errorGap -= 1;
      }
    }
    if (!p.correct) {
      Object.assign(state, {streak: 0, intervalIndex: -1, dueDay: null,
        errorGap: 2, retryPending: true, excluded: false});
      continue;
    }
    state.streak += 1;
    state.retryPending = false;
    state.errorGap = 0;
    state.excluded = rules.stopAfter !== null && state.streak >= rules.stopAfter;
    if (!advancedRounds.has(state)) advancedRounds.set(state, new Set());
    const advanced = advancedRounds.get(state);
    if (state.intervalIndex < 0 && state.streak >= rules.slowAfter) {
      state.intervalIndex = 0;
      state.dueDay = addDays(answer.day, rules.intervals[0]);
      advanced.add(p.roundId);
    } else if (state.intervalIndex >= 0 && answer.day >= state.dueDay && !advanced.has(p.roundId)) {
      state.intervalIndex = Math.min(3, state.intervalIndex + 1);
      state.dueDay = addDays(answer.day, rules.intervals[state.intervalIndex]);
      advanced.add(p.roundId);
    }
  }
  return {words, epochConflict: resolveEpochs(ledger).epochConflict};
}
