import {ProductError} from '../model/errors.js';
import {currentPolicy} from '../model/policies.js';
import {addDays} from './calendar.js';
import {effectiveAnswers} from './facts.js';
import {project} from './progress.js';
import {activeWords, previewModes} from './rounds.js';
import {projectSchedule} from './schedule.js';

function invalid(message) {
  throw new ProductError('invalid', message);
}

function emptyBuckets() {
  return {new: 0, learning: 0, review: 0, excluded: 0};
}

export function learningStatistics({ledger, profileId, day, days = 14}) {
  if (days !== 14 && days !== 30) invalid('Der Statistikzeitraum ist ungültig.');
  addDays(day, 0);

  const daily = Array.from({length: days}, (_, index) => ({
    day: addDays(day, index + 1 - days),
    correct: 0,
    wrong: 0,
  }));
  const byDay = new Map(daily.map((entry) => [entry.day, entry]));
  const projection = project(ledger);
  if (projection.epochConflict) {
    return {
      summary: {attempts: 0, correct: 0, wrong: 0, accuracy: null},
      buckets: emptyBuckets(),
      daily,
      dueCount: 0,
      wordCount: 0,
      epochConflict: true,
    };
  }

  for (const event of effectiveAnswers(ledger)) {
    if (event.payload.profileId !== profileId) continue;
    const bucket = byDay.get(event.day);
    if (!bucket) continue;
    bucket[event.payload.correct ? 'correct' : 'wrong'] += 1;
  }
  const correct = daily.reduce((sum, entry) => sum + entry.correct, 0);
  const wrong = daily.reduce((sum, entry) => sum + entry.wrong, 0);
  const attempts = correct + wrong;

  const {policy} = currentPolicy(ledger, profileId);
  const schedule = projectSchedule({ledger, profileId, policy, day});
  const words = activeWords(projection, profileId);
  const buckets = emptyBuckets();
  for (const word of words) {
    const state = schedule.words.get(word.id)?.get(word.value.learningId) ?? null;
    const practiced = projection.profiles[profileId]?.words[word.id]?.everPracticed ?? false;
    if (state?.excluded) buckets.excluded += 1;
    else if (!practiced) buckets.new += 1;
    else if ((state?.intervalIndex ?? -1) >= 0) buckets.review += 1;
    else buckets.learning += 1;
  }
  const dueCount = previewModes({projection, profileId, day, schedule})
    .find(({mode}) => mode === 'all')?.availableCount ?? 0;

  return {
    summary: {
      attempts,
      correct,
      wrong,
      accuracy: attempts === 0 ? null : (100 * correct) / attempts,
    },
    buckets,
    daily,
    dueCount,
    wordCount: words.length,
    epochConflict: false,
  };
}
