import {canonical} from './canonical.js';
import {ProductError} from './errors.js';

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
