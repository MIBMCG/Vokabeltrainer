import {canonical} from './canonical.js';
import {ProductError} from './errors.js';
import {resolveEpochs} from './epochs.js';

export const DEFAULT_POLICY = Object.freeze({slowAfter:3,stopAfter:null,intervals:Object.freeze([1,3,7,14])});

export function assertPolicy(value) {
  const invalid=()=>{throw new ProductError('invalid','Die Lernregeln sind ungültig.');};
  try { canonical(value); } catch { invalid(); }
  if (!value || Array.isArray(value) || typeof value !== 'object'
    || Object.keys(value).sort().join('|') !== 'intervals|slowAfter|stopAfter') invalid();
  const {slowAfter,stopAfter,intervals}=value;
  if (!Number.isInteger(slowAfter) || slowAfter<2 || slowAfter>10
    || (stopAfter!==null && (!Number.isInteger(stopAfter) || stopAfter<slowAfter || stopAfter>20))
    || !Array.isArray(intervals) || intervals.length!==4
    || intervals.some((days,index)=>!Number.isInteger(days) || days<1 || days>365 || (index>0 && days<intervals[index-1]))) invalid();
  return {slowAfter,stopAfter,intervals:[...intervals]};
}

export function currentPolicy(ledger, profileId) {
  const event = resolveEpochs(ledger).effectiveEvents
    .filter(event => event.type === 'learning.rules.changed' && event.payload.profileId === profileId).at(-1);
  if (!event) return {eventId: null, policy: assertPolicy(DEFAULT_POLICY)};
  const {profileId: ignored, ...policy} = event.payload;
  return {eventId: event.id, policy: assertPolicy(policy)};
}

export function currentGenerations(ledger, profileId) {
  const words = new Map();
  function put(wordId, learningId, generationId) {
    if (!words.has(wordId)) words.set(wordId, new Map());
    const versions = words.get(wordId);
    if (generationId !== null || !versions.has(learningId)) versions.set(learningId, generationId);
  }
  for (const event of resolveEpochs(ledger).effectiveEvents) {
    const p = event.payload;
    if (event.type === 'entity.revised' && p.entityType === 'word') put(p.entityId, p.value.learningId, null);
    if (event.type === 'word.reactivated' && p.profileId === profileId) put(p.wordId, p.learningId, event.id);
  }
  return [...words].flatMap(([wordId, versions]) => [...versions].map(([learningId, generationId]) =>
    ({wordId, learningId, generationId})));
}
