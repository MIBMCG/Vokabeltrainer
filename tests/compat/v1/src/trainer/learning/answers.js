import {normalize} from '../model/revisions.js';

export function assess(typed, wordValue) {
  const normalized = normalize(typed);
  const solutions = wordValue.answers.map((answer) => String(answer));
  return {
    empty: normalized.length === 0,
    correct: normalized.length > 0
      && solutions.some((solution) => normalize(solution) === normalized),
    solutions,
  };
}
