import test from 'node:test';
import assert from 'node:assert/strict';

import {
  abandonRound,
  advanceRound,
  applyAnswer,
  completeRound,
  expandRound,
  nextTask,
  startRound,
} from '../../src/trainer/learning/rounds.js';
import {project} from '../../src/trainer/learning/progress.js';
import {createFixture} from './fixtures.js';

function setOwn(bucket, id, value) {
  Object.defineProperty(bucket, id, {
    value,
    enumerable: true,
    writable: true,
    configurable: true,
  });
}

function candidateIds(round) {
  return round.candidates.map(({wordId}) => wordId).sort();
}

function startEvent(f, roundId, {profileId = 'p1', mode = 'all', size = 10} = {}) {
  return f.event('round.started', {roundId, profileId, mode, size}, {id: `start-${roundId}`});
}

function profileRevision(f, {id, profileId, name = profileId, archived = false}) {
  return f.event('entity.revised', {
    entityType: 'profile', entityId: profileId, parents: [], value: {name, archived},
  }, {id});
}

function lessonRevision(f, {
  id, lessonId, parents = [], name = lessonId, archived = false, profileIds = ['p1'],
  ...overrides
}) {
  return f.event('entity.revised', {
    entityType: 'lesson', entityId: lessonId, parents,
    value: {name, archived, profileIds},
  }, {id, ...overrides});
}

function wordRevision(f, {
  id, wordId, lessonId = 'l1', parents = [], german = wordId, answers = [wordId],
  archived = false, learningId = `learn-${wordId}`, ...overrides
}) {
  return f.event('entity.revised', {
    entityType: 'word', entityId: wordId, parents,
    value: {lessonId, german, hint: '', answers, archived, learningId},
  }, {id, ...overrides});
}

function clearCurrent(round, overrides = {}) {
  return {...structuredClone(round), current: null, feedback: null, status: 'asking', ...overrides};
}

function setWordState(projection, profileId, wordId, overrides) {
  Object.assign(projection.profiles[profileId].words[wordId], overrides);
}

test('new selection stays frozen and failed single word cannot bypass gap', () => {
  const f = createFixture({words: [['w1', 'Hund', ['dog']]]});
  const initial = startRound({
    id: 'r1', profileId: 'p1', mode: 'new', size: 10,
    projection: project(f.base), day: '2026-09-17',
  });
  const answer = f.answer({id: 'a1', correct: false});
  const after = project(f.withEvents(f.roundStarted, answer));
  const feedback = applyAnswer({
    round: initial, answer, typed: 'dig', solutions: ['dog'], projection: after,
  });

  assert.equal(feedback.status, 'feedback');
  assert.equal(nextTask({round: feedback, projection: after, day: '2026-09-17'}).kind, 'exhausted');
  assert.equal(feedback.candidates.length, 1);
  assert.deepEqual(feedback.feedback, {
    answerId: 'a1', typed: 'dig', correct: false, solutions: ['dog'],
  });
  assert.equal(advanceRound({round: feedback, projection: after, day: '2026-09-17'}).status, 'exhausted');
});

test('latest mode follows original lesson creation and uses the lesson ID for an exact tie', () => {
  const f = createFixture();
  const l2 = lessonRevision(f, {id: 'rev-l2', lessonId: 'l2'});
  const w4 = wordRevision(f, {id: 'rev-w4', wordId: 'w4', lessonId: 'l2'});
  const lateEdit = lessonRevision(f, {
    id: 'edit-l1', lessonId: 'l1', parents: ['rev-l1'], name: 'Renamed later',
  });
  const projection = project(f.withEvents(l2, w4, lateEdit));
  const latest = startRound({
    id: 'latest-real', profileId: 'p1', mode: 'latest', projection, day: '2026-09-17',
  });
  assert.deepEqual(candidateIds(latest), ['w4']);

  const tied = structuredClone(project(f.base));
  setOwn(tied.entities.lessons, 'la', {
    id: 'la', heads: ['rev-la'], value: {name: 'A', archived: false, profileIds: ['p1']},
    createdOrder: [50, 'dev', 'root'], conflicted: false,
  });
  setOwn(tied.entities.lessons, 'lz', {
    id: 'lz', heads: ['rev-lz'], value: {name: 'Z', archived: false, profileIds: ['p1']},
    createdOrder: [50, 'dev', 'root'], conflicted: false,
  });
  setOwn(tied.entities.words, 'wa', {
    id: 'wa', heads: ['rev-wa'], value: {
      lessonId: 'la', german: 'A', hint: '', answers: ['a'], archived: false, learningId: 'learn-wa',
    }, createdOrder: [51, 'dev', 'rev-wa'], conflicted: false,
  });
  setOwn(tied.entities.words, 'wz', {
    id: 'wz', heads: ['rev-wz'], value: {
      lessonId: 'lz', german: 'Z', hint: '', answers: ['z'], archived: false, learningId: 'learn-wz',
    }, createdOrder: [52, 'dev', 'rev-wz'], conflicted: false,
  });
  setOwn(tied.profiles.p1.words, 'wa', structuredClone(tied.profiles.p1.words.w1));
  setOwn(tied.profiles.p1.words, 'wz', structuredClone(tied.profiles.p1.words.w1));
  tied.profiles.p1.words.wa.learningId = 'learn-wa';
  tied.profiles.p1.words.wz.learningId = 'learn-wz';

  const stableTie = startRound({
    id: 'latest-tie', profileId: 'p1', mode: 'latest', projection: tied, day: '2026-09-17',
  });
  assert.deepEqual(candidateIds(stableTie), ['wz']);
});

test('new mode is profile-specific and excludes attempts from an earlier learning revision', () => {
  const f = createFixture();
  const p2 = profileRevision(f, {id: 'rev-p2', profileId: 'p2', name: 'Ben'});
  const assigned = lessonRevision(f, {
    id: 'assign-p2', lessonId: 'l1', parents: ['rev-l1'], profileIds: ['p1', 'p2'],
  });
  const attempted = f.answer({id: 'old-attempt', wordId: 'w1'});
  const changed = wordRevision(f, {
    id: 'changed-w1', wordId: 'w1', parents: ['rev-w1'], german: 'Welpe', answers: ['puppy'],
    learningId: 'learn-w1-changed',
  });
  const projection = project(f.withEvents(f.roundStarted, p2, assigned, attempted, changed));

  const ada = startRound({
    id: 'new-ada', profileId: 'p1', mode: 'new', projection, day: '2026-09-17',
  });
  const ben = startRound({
    id: 'new-ben', profileId: 'p2', mode: 'new', projection, day: '2026-09-17',
  });
  assert.equal(candidateIds(ada).includes('w1'), false);
  assert.equal(candidateIds(ben).includes('w1'), true);
});

test('ranking prioritizes ready errors, due reviews, new words, then build-up words', () => {
  const f = createFixture({words: [
    ['error', 'Fehler', ['error']],
    ['due', 'Fällig', ['due']],
    ['fresh', 'Neu', ['new']],
    ['build', 'Aufbau', ['build']],
  ]});
  const projection = project(f.base);
  setWordState(projection, 'p1', 'error', {
    attempts: 1, wrong: 1, everPracticed: true, retryPending: true, errorGap: 0,
  });
  setWordState(projection, 'p1', 'due', {
    attempts: 3, correct: 3, everPracticed: true, intervalIndex: 0, dueDay: '2026-09-17',
  });
  setWordState(projection, 'p1', 'build', {
    attempts: 1, correct: 1, everPracticed: true, streak: 1,
  });
  const round = startRound({
    id: 'priority', profileId: 'p1', mode: 'all', projection, day: '2026-09-17',
  });

  assert.equal(round.current.wordId, 'error');
  assert.equal(nextTask({
    round: clearCurrent(round, {pausedWordIds: ['error']}), projection, day: '2026-09-17',
  }).task.wordId, 'due');
  assert.equal(nextTask({
    round: clearCurrent(round, {pausedWordIds: ['error', 'due']}), projection, day: '2026-09-17',
  }).task.wordId, 'fresh');
  assert.equal(nextTask({
    round: clearCurrent(round, {pausedWordIds: ['error', 'due', 'fresh']}), projection, day: '2026-09-17',
  }).task.wordId, 'build');
});

test('ranking uses local round count, last practice and stable mix without direct repeats', () => {
  const f = createFixture({words: [['w1', 'Eins', ['one']], ['w2', 'Zwei', ['two']]]});
  const projection = project(f.base);
  setWordState(projection, 'p1', 'w1', {
    attempts: 2, everPracticed: true, lastPracticedAt: '2026-09-10T10:00:00.000Z',
  });
  setWordState(projection, 'p1', 'w2', {
    attempts: 20, everPracticed: true, lastPracticedAt: '2026-09-16T10:00:00.000Z',
  });
  const initial = startRound({
    id: 'rank', profileId: 'p1', mode: 'all', projection, day: '2026-09-17',
  });
  const localCountWins = clearCurrent(initial, {wordCounts: {w1: 1, w2: 0}});
  assert.equal(nextTask({round: localCountWins, projection, day: '2026-09-17'}).task.wordId, 'w2');

  const olderWins = clearCurrent(initial, {wordCounts: {w1: 1, w2: 1}});
  assert.equal(nextTask({round: olderWins, projection, day: '2026-09-17'}).task.wordId, 'w1');

  setWordState(projection, 'p1', 'w2', {lastPracticedAt: '2026-09-10T10:00:00.000Z'});
  const avoidRepeat = clearCurrent(initial, {
    wordCounts: {w1: 1, w2: 1}, lastWordId: 'w1',
  });
  assert.equal(nextTask({round: avoidRepeat, projection, day: '2026-09-17'}).task.wordId, 'w2');

  const stable = clearCurrent(initial, {wordCounts: {w1: 1, w2: 1}, lastWordId: null});
  const first = nextTask({round: stable, projection, day: '2026-09-17'}).task.wordId;
  const reversed = structuredClone(projection);
  reversed.entities.words = Object.fromEntries(Object.entries(reversed.entities.words).reverse());
  reversed.profiles.p1.words = Object.fromEntries(Object.entries(reversed.profiles.p1.words).reverse());
  assert.equal(nextTask({round: stable, projection: reversed, day: '2026-09-17'}).task.wordId, first);
});

test('not-yet-due mastered words are excluded', () => {
  const f = createFixture({words: [['w1', 'Hund', ['dog']]]});
  const projection = project(f.base);
  setWordState(projection, 'p1', 'w1', {
    attempts: 3, correct: 3, everPracticed: true, streak: 3,
    intervalIndex: 0, dueDay: '2026-09-18',
  });
  const round = startRound({
    id: 'not-due', profileId: 'p1', mode: 'all', projection, day: '2026-09-17',
  });
  assert.deepEqual(candidateIds(round), ['w1']);
  assert.equal(round.status, 'exhausted');
  assert.deepEqual(nextTask({round, projection, day: '2026-09-17'}), {
    kind: 'exhausted', canExpand: false,
  });
});

test('three correct answers pause a word for the round even after the day changes', () => {
  const f = createFixture({words: [['w1', 'Hund', ['dog']]]});
  let round = startRound({
    id: 'r1', profileId: 'p1', mode: 'all', projection: project(f.base), day: '2026-09-17',
  });
  const answers = [];
  for (let ordinal = 1; ordinal <= 3; ordinal += 1) {
    const answer = f.answer({id: `a${ordinal}`, ordinal});
    answers.push(answer);
    const after = project(f.withEvents(f.roundStarted, ...answers));
    round = applyAnswer({round, answer, typed: 'dog', solutions: ['dog'], projection: after});
    if (ordinal < 3) round = advanceRound({round, projection: after, day: '2026-09-17'});
  }
  const after = project(f.withEvents(f.roundStarted, ...answers));

  assert.deepEqual(round.pausedWordIds, ['w1']);
  assert.equal(advanceRound({round, projection: after, day: '2026-09-18'}).status, 'exhausted');
});

test('expansion adds only currently assigned eligible words and keeps the chosen size', () => {
  const f = createFixture({words: [['w1', 'Hund', ['dog']]]});
  const initialProjection = project(f.base);
  let round = startRound({
    id: 'expand', profileId: 'p1', mode: 'new', size: 20,
    projection: initialProjection, day: '2026-09-17',
  });
  round = clearCurrent(round, {pausedWordIds: ['w1'], status: 'exhausted'});

  const assignedWord = wordRevision(f, {id: 'rev-w2', wordId: 'w2'});
  const unassignedLesson = lessonRevision(f, {
    id: 'rev-private', lessonId: 'private', profileIds: [],
  });
  const unassignedWord = wordRevision(f, {
    id: 'rev-w3', wordId: 'w3', lessonId: 'private',
  });
  const later = project(f.withEvents(assignedWord, unassignedLesson, unassignedWord));

  assert.deepEqual(nextTask({round, projection: later, day: '2026-09-17'}), {
    kind: 'exhausted', canExpand: true,
  });
  const expanded = expandRound({round, projection: later, day: '2026-09-17'});
  assert.equal(expanded.expanded, true);
  assert.equal(expanded.size, 20);
  assert.deepEqual(candidateIds(expanded), ['w1', 'w2']);
  assert.equal(expanded.current.wordId, 'w2');
  assert.deepEqual(nextTask({
    round: clearCurrent(expanded, {pausedWordIds: ['w1', 'w2'], status: 'exhausted'}),
    projection: later, day: '2026-09-17',
  }), {kind: 'exhausted', canExpand: false});
});

test('archive, assignment withdrawal, conflict and learning change replace a displayed task without scoring', () => {
  const f = createFixture({words: [['w1', 'Hund', ['dog']], ['w2', 'Katze', ['cat']]]});
  const baseProjection = project(f.base);
  setOwn(baseProjection.entities.lessons, 'l2', {
    id: 'l2', heads: ['rev-l2'], value: {name: 'Other', archived: false, profileIds: ['p1']},
    createdOrder: [50, 'dev', 'rev-l2'], conflicted: false,
  });
  baseProjection.entities.words.w2.value.lessonId = 'l2';
  const started = startRound({
    id: 'replace', profileId: 'p1', mode: 'all', projection: baseProjection, day: '2026-09-17',
  });
  const displayed = clearCurrent(started, {
    current: {wordId: 'w1', revisionId: 'rev-w1', learningId: 'learn-w1', ordinal: 1},
  });

  const variants = [];
  const archived = structuredClone(baseProjection);
  archived.entities.words.w1.value.archived = true;
  variants.push(archived);
  const withdrawn = structuredClone(baseProjection);
  withdrawn.entities.lessons.l1.value.profileIds = [];
  variants.push(withdrawn);
  const conflicted = structuredClone(baseProjection);
  conflicted.entities.words.w1.value = null;
  conflicted.entities.words.w1.conflicted = true;
  variants.push(conflicted);
  const changed = structuredClone(baseProjection);
  changed.entities.words.w1.heads = ['rev-w1-new'];
  changed.entities.words.w1.value.learningId = 'learn-w1-new';
  changed.profiles.p1.words.w1.learningId = 'learn-w1-new';
  variants.push(changed);

  for (const projection of variants) {
    const replaced = advanceRound({round: displayed, projection, day: '2026-09-17'});
    assert.equal(replaced.current.wordId, 'w2');
    assert.deepEqual(replaced.answeredIds, []);
    assert.deepEqual(replaced.wordCounts, {});
    assert.equal(replaced.lastWordId, null);
  }
});

test('compatible revision heads use the greatest event-order head for the displayed task', () => {
  const f = createFixture({words: [['w1', 'Hund', ['dog']]]});
  const left = wordRevision(f, {
    id: 'compatible-left', wordId: 'w1', parents: ['rev-w1'], german: ' HUND ', answers: ['DOG'],
    clock: 50, deviceId: 'A',
  });
  const right = wordRevision(f, {
    id: 'compatible-right', wordId: 'w1', parents: ['rev-w1'], german: 'Hund', answers: ['dog'],
    clock: 50, deviceId: 'B',
  });
  const projection = project(f.withEvents(right, left));
  assert.deepEqual(projection.entities.words.w1.heads, ['compatible-left', 'compatible-right']);

  const round = startRound({
    id: 'heads', profileId: 'p1', mode: 'all', projection, day: '2026-09-17',
  });
  assert.equal(round.current.revisionId, 'compatible-right');
});

test('duplicate answers and special IDs keep an own safe word count with a matching sum', () => {
  const f = createFixture({words: [['__proto__', 'Sicher', ['safe']]]});
  const projection = project(f.base);
  let round = startRound({
    id: 'special', profileId: 'p1', mode: 'all', projection, day: '2026-09-17',
  });
  const started = startEvent(f, 'special');
  const answer = f.answer({
    id: 'constructor', roundId: 'special', wordId: '__proto__',
    revisionId: 'rev-__proto__', learningId: 'learn-__proto__',
  });
  const after = project(f.withEvents(started, answer));
  round = applyAnswer({round, answer, typed: 'safe', solutions: ['safe'], projection: after});
  round = applyAnswer({round, answer, typed: 'safe', solutions: ['safe'], projection: after});

  assert.deepEqual(round.answeredIds, ['constructor']);
  assert.equal(Object.hasOwn(round.wordCounts, '__proto__'), true);
  assert.equal(round.wordCounts.__proto__, 1);
  assert.equal(Object.values(round.wordCounts).reduce((sum, value) => sum + value, 0), 1);
  assert.equal(round.lastWordId, '__proto__');
});

test('completion requires a full or genuinely exhausted answered round and abandonment has no payload', () => {
  const f = createFixture({words: []});
  const empty = startRound({
    id: 'empty', profileId: 'p1', mode: 'all', projection: project(f.base), day: '2026-09-17',
  });
  assert.equal(empty.status, 'exhausted');
  assert.deepEqual(completeRound({round: empty, reason: 'exhausted'}), {
    round: empty, payload: null,
  });

  const paused = {
    ...structuredClone(empty), status: 'asking', answeredIds: ['a1'], wordCounts: {w1: 1},
  };
  assert.deepEqual(completeRound({round: paused, reason: 'exhausted'}), {
    round: paused, payload: null,
  });

  const exhausted = {
    ...structuredClone(empty), answeredIds: ['a1'], wordCounts: {w1: 1}, status: 'exhausted',
  };
  const completed = completeRound({round: exhausted, reason: 'exhausted'});
  assert.equal(completed.round.status, 'completed');
  assert.deepEqual(completed.payload, {
    roundId: 'empty', profileId: 'p1', reason: 'exhausted', answerIds: ['a1'],
  });

  const abandoned = abandonRound(exhausted);
  assert.equal(abandoned.status, 'abandoned');
  assert.equal(abandoned.current, null);
  assert.equal(abandoned.feedback, null);
  assert.deepEqual(completeRound({round: abandoned, reason: 'exhausted'}), {
    round: abandoned, payload: null,
  });
  const alreadyCompleted = completeRound({round: completed.round, reason: 'exhausted'});
  assert.equal(alreadyCompleted.round, completed.round);
  assert.equal(alreadyCompleted.payload, null);
  assert.throws(
    () => completeRound({round: exhausted, reason: 'manual'}),
    (error) => error?.code === 'invalid',
  );
  assert.throws(
    () => completeRound({
      round: {...structuredClone(paused), wordCounts: {}}, reason: 'exhausted',
    }),
    (error) => error?.code === 'invalid',
  );
});

test('full rounds complete at the selected answer count without changing persisted counters', () => {
  const f = createFixture();
  const initial = startRound({
    id: 'full', profileId: 'p1', mode: 'all', size: 10,
    projection: project(f.base), day: '2026-09-17',
  });
  const answeredIds = Array.from({length: 10}, (_, index) => `a${index + 1}`);
  const full = {
    ...structuredClone(initial), answeredIds, wordCounts: {w1: 4, w2: 3, w3: 3},
    lastWordId: 'w1', current: null, feedback: null, status: 'asking',
  };
  assert.deepEqual(nextTask({round: full, projection: project(f.base), day: '2026-09-17'}), {
    kind: 'complete',
  });
  const completed = completeRound({round: full, reason: 'full'});
  assert.deepEqual(completed.payload, {
    roundId: 'full', profileId: 'p1', reason: 'full', answerIds: answeredIds,
  });
  assert.deepEqual(completed.round.wordCounts, full.wordCounts);
  assert.equal(completed.round.lastWordId, 'w1');
});

test('round entry rejects unsupported sizes and modes', () => {
  const projection = project(createFixture().base);
  assert.throws(() => startRound({
    id: 'bad-mode', profileId: 'p1', mode: 'random', projection, day: '2026-09-17',
  }), /mode/u);
  assert.throws(() => startRound({
    id: 'bad-size', profileId: 'p1', mode: 'all', size: 11, projection, day: '2026-09-17',
  }), /size/u);
});
