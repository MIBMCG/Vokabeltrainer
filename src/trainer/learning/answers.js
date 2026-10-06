import {normalize} from '../model/revisions.js';

export function assess(typed, wordValue, {requirePunctuation = true} = {}) {
  const comparable = (text) => {
    const normalized = normalize(text);
    return requirePunctuation ? normalized : normalized.replace(/\p{P}/gu, '').trim();
  };
  const normalized = comparable(typed);
  const solutions = wordValue.answers.map((answer) => String(answer));
  return {
    empty: normalized.length === 0,
    correct: normalized.length > 0
      && solutions.some((solution) => comparable(solution) === normalized),
    solutions,
  };
}
