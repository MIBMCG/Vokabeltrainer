const SAFE_ID = /^[A-Za-z0-9_-]+$/;

function fail(message) {
  throw new TypeError(message);
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function exactKeys(value, expected) {
  const keys = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return keys.length === wanted.length && keys.every((key, index) => key === wanted[index]);
}

function validId(value) {
  return typeof value === 'string' && SAFE_ID.test(value);
}

function validateAnswer(event) {
  if (!exactKeys(event, ['version', 'kind', 'id', 'epoch', 'correct'])
    || event.version !== 1
    || event.kind !== 'answer'
    || !validId(event.id)
    || !validId(event.epoch)
    || event.correct !== true) {
    fail('Antwort-Ereignis ist ungültig.');
  }
}

function validateReset(event) {
  if (!exactKeys(event, [
    'version', 'kind', 'id', 'parentEpoch', 'epoch', 'baseAnswers', 'previousAnswerIds', 'backupFileId',
  ])
    || event.version !== 1
    || event.kind !== 'reset'
    || !validId(event.id)
    || !validId(event.parentEpoch)
    || !validId(event.epoch)
    || event.epoch === event.parentEpoch
    || !Array.isArray(event.baseAnswers)
    || event.baseAnswers.length !== 0
    || !Array.isArray(event.previousAnswerIds)
    || !event.previousAnswerIds.every(validId)
    || new Set(event.previousAnswerIds).size !== event.previousAnswerIds.length
    || !validId(event.backupFileId)) {
    fail('Rücksetz-Ereignis oder Generation ist ungültig.');
  }
}

function validateEvent(event) {
  if (!isPlainObject(event)) fail('Ereignis ist ungültig.');
  if (event.kind === 'answer') validateAnswer(event);
  else if (event.kind === 'reset') validateReset(event);
  else fail('Ereignis ist ungültig.');
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (isPlainObject(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function projectProbe(events) {
  if (!Array.isArray(events)) fail('Ereignisliste ist ungültig.');

  const byId = new Map();
  for (const event of events) {
    validateEvent(event);
    const canonical = canonicalJson(event);
    const previous = byId.get(event.id);
    if (previous && previous.canonical !== canonical) {
      fail('Dieselbe Ereignis-ID enthält unterschiedliche Daten.');
    }
    if (!previous) byId.set(event.id, {event, canonical});
  }

  const uniqueEvents = [...byId.values()].map(({event}) => event);
  const resets = uniqueEvents.filter((event) => event.kind === 'reset');
  const children = new Map();
  const resetByTarget = new Map();
  for (const reset of resets) {
    if (reset.epoch === 'initial' || resetByTarget.has(reset.epoch)) {
      fail('Rücksetz-Zielgeneration ist mehrfach oder ungültig.');
    }
    resetByTarget.set(reset.epoch, reset);
    const siblings = children.get(reset.parentEpoch) ?? [];
    siblings.push(reset);
    children.set(reset.parentEpoch, siblings);
  }

  const graphState = new Map();
  function visit(epoch) {
    const state = graphState.get(epoch);
    if (state === 'visiting') fail('Rücksetz-Generationen enthalten einen Kreis.');
    if (state === 'visited') return;
    graphState.set(epoch, 'visiting');
    for (const reset of children.get(epoch) ?? []) visit(reset.epoch);
    graphState.set(epoch, 'visited');
  }
  for (const reset of resets) {
    visit(reset.parentEpoch);
    visit(reset.epoch);
  }

  let epoch = 'initial';
  const traversed = new Set();
  const appliedResets = [];
  let conflict = false;
  while (children.has(epoch)) {
    if (traversed.has(epoch)) fail('Rücksetz-Generationen enthalten einen Kreis.');
    traversed.add(epoch);
    const next = children.get(epoch);
    if (next.length !== 1) {
      conflict = true;
      break;
    }
    const [clearingReset] = next;
    appliedResets.push(clearingReset);
    epoch = clearingReset.epoch;
  }

  const answers = uniqueEvents.filter((event) => event.kind === 'answer');
  const active = answers.filter((event) => event.epoch === epoch);
  const lateAnswers = appliedResets.flatMap((clearingReset) => {
    const excluded = new Set(clearingReset.previousAnswerIds);
    return answers.filter((event) => event.epoch === clearingReset.parentEpoch && !excluded.has(event.id));
  });

  return {
    epoch,
    answerCount: active.length,
    points: active.length * 10,
    lateAnswers,
    conflict,
  };
}
