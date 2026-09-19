import {resolveEpochs} from '../model/epochs.js';

function compareAscii(left, right) {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

export function compareEvents(left, right) {
  if (left.clock !== right.clock) return left.clock - right.clock;
  return compareAscii(left.deviceId, right.deviceId) || compareAscii(left.id, right.id);
}

export function orderedUniqueEvents(events) {
  const byId = new Map();
  for (const event of events) {
    const previous = byId.get(event.id);
    if (!previous || compareEvents(event, previous) < 0) byId.set(event.id, event);
  }
  return [...byId.values()].sort(compareEvents);
}

export function uniqueAnswers(events) {
  const answers = new Map();
  for (const event of orderedUniqueEvents(events)) {
    if (event.type !== 'answer.recorded') continue;
    const key = `${event.payload.roundId}\u0000${event.payload.ordinal}`;
    if (!answers.has(key)) answers.set(key, event);
  }
  return [...answers.values()];
}

export function effectiveAnswers(ledger) {
  return uniqueAnswers(resolveEpochs(ledger).effectiveEvents);
}
