import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createCommands,
  productStateHash,
} from '../../src/trainer/commands.js';
import {project} from '../../src/trainer/learning/progress.js';
import {createFixture} from './fixtures.js';

function sequenceIds(prefix = 'local') {
  let value = 0;
  return () => `${prefix}-${++value}`;
}

function validProductState(ledger = createFixture().base) {
  return {
    storageVersion: 1,
    deviceId: 'dev1',
    clock: Math.max(0, ...ledger.events.map(({clock}) => clock), ...ledger.epochs.map(({clock}) => clock)),
    ledger: structuredClone(ledger),
    rounds: {},
    binding: null,
    outboxEventIds: [],
    pendingPackets: [],
    knownFiles: [],
    quarantinedFiles: [],
    safetyCopies: [],
    restoreJobs: [],
    snapshotManifests: [],
    pinVerifier: null,
  };
}

function makeMemoryStore(initial) {
  let stored = initial === null ? null : structuredClone(initial);
  return {
    failNextSave: false,
    saves: [],
    async load() {
      return stored === null ? null : structuredClone(stored);
    },
    async save(next) {
      if (this.failNextSave) {
        this.failNextSave = false;
        throw new Error('synthetic commit failure');
      }
      stored = structuredClone(next);
      this.saves.push(structuredClone(next));
    },
    close() {},
    snapshot() {
      return stored === null ? null : structuredClone(stored);
    },
  };
}

async function harness({ledger, state, ids = sequenceIds(), onChange = () => {}} = {}) {
  const store = makeMemoryStore(state ?? validProductState(ledger));
  const commands = await createCommands({
    store,
    now: () => new Date('2026-09-17T10:00:00.000Z'),
    id: ids,
    deviceId: 'dev1',
    onChange,
  });
  return {store, commands};
}

test('practiceChoices previews without mutating state or consuming IDs', async () => {
  const ids = sequenceIds('choice');
  const {commands, store} = await harness({ids});
  const before = commands.getState();
  const savesBefore=store.saves.length;

  assert.deepEqual(commands.practiceChoices({profileId: 'p1'}), [
    {mode: 'all', totalCount: 3, availableCount: 3, latestLessonName: null, reason: 'ready'},
    {mode: 'latest', totalCount: 3, availableCount: 3, latestLessonName: 'Unit 1', reason: 'ready'},
    {mode: 'new', totalCount: 3, availableCount: 3, latestLessonName: null, reason: 'ready'},
  ]);
  assert.deepEqual(commands.getState(), before);
  assert.equal(store.saves.length, savesBefore);
  await commands.start({profileId: 'p1', mode: 'all', size: 10});
  assert.equal(commands.getState().rounds.p1.id, 'choice-1');
});

function solutionForCurrent(state, profileId = 'p1') {
  const revisionId = state.rounds[profileId].current.revisionId;
  return state.ledger.events.find(({id}) => id === revisionId).payload.value.answers[0];
}

function addRoundAnswer(f, ledger, {roundId, answerId, clock, correct = true}) {
  const started = f.event('round.started', {
    roundId, profileId: 'p1', mode: 'all', size: 10,
  }, {id: `start-${roundId}`, clock: clock - 1});
  const answer = f.answer({id: answerId, roundId, clock, correct});
  ledger.events.push(started, answer);
}

test('rejects malformed persisted Drive transport records at the command boundary', async () => {
  const state = validProductState();
  state.knownFiles.push({fileId: 'file-a', contentHash: 'not-a-hash', kind: 'packet'});

  await assert.rejects(
    createCommands({
      store: makeMemoryStore(state),
      now: () => new Date('2026-09-17T10:00:00.000Z'),
      id: sequenceIds(),
      deviceId: 'dev1',
      onChange: () => {},
    }),
    (error) => error?.code === 'invalid',
  );
});

test('normalizes legacy storage-version-one state with absent Task 9 transport indexes', async () => {
  const legacy = validProductState();
  assert.equal(Object.hasOwn(legacy, 'datasetSetup'), false);
  assert.equal(Object.hasOwn(legacy, 'packetIntegrity'), false);

  const {commands} = await harness({state: legacy});

  assert.equal(commands.getState().datasetSetup, null);
  assert.deepEqual(commands.getState().packetIntegrity, []);
});

test('setup creates the version-two product state and publishes only its committed clone', async () => {
  const store = makeMemoryStore(null);
  const changed = [];
  const commands = await createCommands({
    store,
    now: () => new Date('2026-09-17T22:30:00.000Z'),
    id: sequenceIds('setup'),
    deviceId: 'device-a',
    onChange: (state) => changed.push(state),
  });

  await commands.setup({name: 'Familienwortschatz', timeZone: 'Europe/Berlin'});

  const state = commands.getState();
  assert.equal(state.storageVersion, 2);
  assert.equal(state.deviceId, 'device-a');
  assert.equal(state.ledger.descriptor.name, 'Familienwortschatz');
  assert.equal(state.ledger.descriptor.timeZone, 'Europe/Berlin');
  assert.equal(state.ledger.epochs.length, 1);
  assert.deepEqual(state.ledger.events, []);
  assert.equal(changed.length, 1);
  changed[0].clock = 999;
  assert.notEqual(commands.getState().clock, 999);
});

test('failed local commit retains the round draft and awards nothing', async () => {
  const {store, commands} = await harness();
  await commands.start({profileId: 'p1', mode: 'all', size: 10});
  const before = commands.getState();
  const roundId = before.rounds.p1.id;
  store.failNextSave = true;

  await assert.rejects(
    commands.submit({roundId, typed: solutionForCurrent(before)}),
    {code: 'storage'},
  );

  assert.deepEqual(commands.getState(), before);
  assert.equal(project(commands.getState().ledger).profiles.p1.points, 0);
});

test('answer, local feedback, pending ID and milestone claim share one successful save', async () => {
  const f = createFixture({words: [['w1', 'Hund', ['dog']]]});
  const ledger = structuredClone(f.base);
  addRoundAnswer(f, ledger, {roundId: 'prior-a', answerId: 'answer-a', clock: 20});
  addRoundAnswer(f, ledger, {roundId: 'prior-b', answerId: 'answer-b', clock: 30});
  const {store, commands} = await harness({ledger, ids: sequenceIds('atomic')});
  await commands.start({profileId: 'p1', mode: 'all', size: 10});
  store.saves.length = 0;

  const roundId = commands.getState().rounds.p1.id;
  const result = await commands.submit({roundId, typed: 'dog'});

  assert.equal(result.empty, false);
  assert.equal(result.feedback.correct, true);
  assert.equal(store.saves.length, 1);
  const committed = store.saves[0];
  const answer = committed.ledger.events.find(({id}) => id === result.feedback.answerId);
  const milestone = committed.ledger.events.find(({type}) => type === 'word.milestone');
  assert.equal(answer.type, 'answer.recorded');
  assert.equal(milestone.payload.milestone, 'mastered');
  assert.deepEqual(milestone.payload.evidenceAnswerIds, ['answer-a', 'answer-b', answer.id]);
  assert.equal(committed.outboxEventIds.includes(answer.id), true);
  assert.equal(committed.outboxEventIds.includes(milestone.id), true);
  assert.equal(committed.rounds.p1.feedback.answerId, answer.id);
});

test('empty and repeated submit cannot create another answer or overwrite feedback', async () => {
  const {store, commands} = await harness();
  await commands.start({profileId: 'p1', mode: 'all', size: 10});
  const roundId = commands.getState().rounds.p1.id;
  const savesBefore = store.saves.length;

  assert.deepEqual(await commands.submit({roundId, typed: '   '}), {empty: true, feedback: null});
  assert.equal(store.saves.length, savesBefore);

  const first = await commands.submit({roundId, typed: solutionForCurrent(commands.getState())});
  const savesAfterFirst = store.saves.length;
  const repeated = await commands.submit({roundId, typed: 'different text'});
  assert.deepEqual(repeated, first);
  assert.equal(store.saves.length, savesAfterFirst);
  assert.equal(commands.getState().ledger.events.filter(({type}) => type === 'answer.recorded').length, 1);
});

test('reload in feedback restores the exact answer and repeated Enter still counts once', async () => {
  const store = makeMemoryStore(validProductState());
  const options = {
    store,
    now: () => new Date('2026-09-17T10:00:00.000Z'),
    id: sequenceIds('reload'),
    deviceId: 'dev1',
    onChange: () => {},
  };
  const firstCommands = await createCommands(options);
  await firstCommands.start({profileId: 'p1', mode: 'all', size: 10});
  const roundId = firstCommands.getState().rounds.p1.id;
  const submitted = await firstCommands.submit({
    roundId,
    typed: solutionForCurrent(firstCommands.getState()),
  });

  const reloaded = await createCommands(options);
  assert.deepEqual(reloaded.getState().rounds.p1.feedback, submitted.feedback);
  assert.deepEqual(await reloaded.submit({roundId, typed: 'ignored'}), submitted);
  assert.equal(reloaded.getState().ledger.events.filter(({type}) => type === 'answer.recorded').length, 1);
});

test('last feedback advances through complete and stores the full completion claim', async () => {
  const words = Array.from({length: 10}, (_, index) => [
    `word-${String(index).padStart(3, '0')}`,
    `Wort ${index}`,
    [`answer-${index}`],
  ]);
  const {commands} = await harness({ledger: createFixture({words}).base});
  await commands.start({profileId: 'p1', mode: 'all', size: 10});
  const roundId = commands.getState().rounds.p1.id;

  for (let index = 0; index < 10; index += 1) {
    const state = commands.getState();
    await commands.submit({roundId, typed: solutionForCurrent(state)});
    if (index < 9) await commands.next({roundId});
  }
  assert.equal(commands.getState().rounds.p1.status, 'feedback');
  assert.equal(commands.getState().ledger.events.some(({type}) => type === 'round.completed'), false);

  await commands.next({roundId});
  const state = commands.getState();
  const completion = state.ledger.events.find(({type}) => type === 'round.completed');
  assert.equal(state.rounds.p1.status, 'completed');
  assert.equal(completion.payload.reason, 'full');
  assert.equal(completion.payload.answerIds.length, 10);
  assert.equal(project(state.ledger).profiles.p1.points, 120);
});

test('finish treats ineligible completion as a no-op with no invalid event', async () => {
  const {store, commands} = await harness();
  await commands.start({profileId: 'p1', mode: 'all', size: 10});
  const state = commands.getState();
  const beforeSaves = store.saves.length;

  await commands.finish({roundId: state.rounds.p1.id, reason: 'full'});

  assert.equal(store.saves.length, beforeSaves);
  assert.equal(commands.getState().ledger.events.some(({type}) => type === 'round.completed'), false);
});

test('serialized revisions compare expected heads after an earlier queued revision commits', async () => {
  const {commands} = await harness();
  const value = {name: 'Ada Neu', archived: false};

  const first = commands.revise({
    entityType: 'profile', entityId: 'p1', expectedHeads: ['rev-p1'], value,
  });
  const stale = commands.revise({
    entityType: 'profile', entityId: 'p1', expectedHeads: ['rev-p1'],
    value: {name: 'Veraltet', archived: false},
  });

  await first;
  await assert.rejects(stale, {code: 'stale'});
  const revisions = commands.getState().ledger.events.filter(({type, payload}) => (
    type === 'entity.revised' && payload.entityType === 'profile' && payload.entityId === 'p1'
  ));
  assert.equal(revisions.length, 2);
  assert.equal(revisions.at(-1).payload.value.name, 'Ada Neu');
});

test('revision head comparison treats compatible projected heads as an unordered set', async () => {
  const f = createFixture();
  const ledger = structuredClone(f.base);
  ledger.events.push(
    f.event('entity.revised', {
      entityType: 'profile', entityId: 'p1', parents: ['rev-p1'],
      value: {name: ' ADA ', archived: false},
    }, {id: 'z-head', clock: 20, deviceId: 'A'}),
    f.event('entity.revised', {
      entityType: 'profile', entityId: 'p1', parents: ['rev-p1'],
      value: {name: 'ada', archived: false},
    }, {id: 'a-head', clock: 30, deviceId: 'A'}),
  );
  const {commands} = await harness({ledger, ids: sequenceIds('heads')});
  const expectedHeads = project(commands.getState().ledger).entities.profiles.p1.heads;
  assert.deepEqual(expectedHeads, ['z-head', 'a-head']);

  await commands.revise({
    entityType: 'profile', entityId: 'p1', expectedHeads,
    value: {name: 'Ada vereinigt', archived: false},
  });

  const latest = commands.getState().ledger.events.at(-1);
  assert.deepEqual(latest.payload.parents, ['a-head', 'z-head']);
});

test('external merge reconciles full effective history atomically and remains idempotent', async () => {
  const f = createFixture({words: [['w1', 'Hund', ['dog']]]});
  const {store, commands} = await harness({ledger: f.base, ids: sequenceIds('merge')});
  const expected = await productStateHash(commands.getState());
  const incoming = commands.getState();
  addRoundAnswer(f, incoming.ledger, {roundId: 'merge-a', answerId: 'merge-answer-a', clock: 20});
  addRoundAnswer(f, incoming.ledger, {roundId: 'merge-b', answerId: 'merge-answer-b', clock: 30});
  addRoundAnswer(f, incoming.ledger, {roundId: 'merge-c', answerId: 'merge-answer-c', clock: 40});
  addRoundAnswer(f, incoming.ledger, {
    roundId: 'merge-d', answerId: 'merge-answer-wrong', clock: 50, correct: false,
  });
  incoming.clock = 50;

  await commands.commitExternal(incoming, expected);

  const first = commands.getState();
  const claims = first.ledger.events.filter(({type}) => type === 'word.milestone');
  assert.equal(claims.length, 1);
  assert.equal(claims[0].payload.milestone, 'mastered');
  assert.deepEqual(claims[0].payload.evidenceAnswerIds,
    ['merge-answer-a', 'merge-answer-b', 'merge-answer-c']);
  assert.equal(first.outboxEventIds.includes(claims[0].id), true);
  assert.equal(store.saves.at(-1).ledger.events.some(({id}) => id === claims[0].id), true);

  const later = structuredClone(first);
  addRoundAnswer(f, later.ledger, {
    roundId: 'merge-e', answerId: 'merge-answer-recovered', clock: 60, correct: true,
  });
  later.clock = 60;
  await commands.commitExternal(later, await productStateHash(first));
  const reconciled = commands.getState();
  assert.deepEqual(reconciled.ledger.events
    .filter(({type}) => type === 'word.milestone')
    .map(({payload}) => payload.milestone).sort(), ['mastered', 'recovered']);

  await commands.commitExternal(structuredClone(reconciled), await productStateHash(reconciled));
  assert.equal(commands.getState().ledger.events.filter(({type}) => type === 'word.milestone').length, 2);
});

test('commitExternal becomes stale behind a queued local mutation instead of overwriting it', async () => {
  const {commands} = await harness();
  const oldState = commands.getState();
  const oldHash = await productStateHash(oldState);

  const local = commands.start({profileId: 'p1', mode: 'all', size: 10});
  const stale = commands.commitExternal(oldState, oldHash);
  await local;
  await assert.rejects(stale, {code: 'stale'});
  assert.equal(Object.hasOwn(commands.getState().rounds, 'p1'), true);
});

test('profile-keyed rounds preserve accepted special IDs as own enumerable fields', async () => {
  const f = createFixture();
  const ledger = structuredClone(f.base);
  ledger.events.push(
    f.event('entity.revised', {
      entityType: 'profile', entityId: '__proto__', parents: [],
      value: {name: 'Sicheres Profil', archived: false},
    }, {id: 'rev-special-profile', clock: 20}),
    f.event('entity.revised', {
      entityType: 'lesson', entityId: 'special-lesson', parents: [],
      value: {name: 'Sicher', archived: false, profileIds: ['__proto__']},
    }, {id: 'rev-special-lesson', clock: 21}),
    f.event('entity.revised', {
      entityType: 'word', entityId: '__proto__', parents: [],
      value: {
        lessonId: 'special-lesson', german: 'Sicher', hint: '', answers: ['safe'],
        archived: false, learningId: 'learn-special',
      },
    }, {id: 'rev-special-word', clock: 22}),
  );
  const {commands} = await harness({ledger});

  await commands.start({profileId: '__proto__', mode: 'all', size: 10});
  const roundId = commands.getState().rounds.__proto__.id;
  await commands.submit({roundId, typed: 'safe'});

  const rounds = commands.getState().rounds;
  assert.equal(Object.hasOwn(rounds, '__proto__'), true);
  assert.equal(Object.keys(rounds).includes('__proto__'), true);
  assert.equal(rounds.__proto__.profileId, '__proto__');
  assert.equal(Object.hasOwn(rounds.__proto__.wordCounts, '__proto__'), true);
  assert.equal(rounds.__proto__.wordCounts.__proto__, 1);
  assert.equal(JSON.parse(JSON.stringify(rounds)).__proto__.profileId, '__proto__');
  assert.match(await productStateHash(commands.getState()), /^[0-9a-f]{64}$/);
});

test('productStateHash is key-order independent and includes nested special-ID values', async () => {
  function ownRecord(entries) {
    const record = {};
    for (const [key, value] of entries) {
      Object.defineProperty(record, key, {
        value,
        enumerable: true,
        writable: true,
        configurable: true,
      });
    }
    return record;
  }
  const first = {
    marker: 'hash-fixture',
    rounds: ownRecord([
      ['z-profile', {wordCounts: ownRecord([['ordinary', 2], ['constructor', 1]])}],
      ['__proto__', {wordCounts: ownRecord([['prototype', 4], ['a-word', 3]])}],
    ]),
  };
  const reordered = {
    rounds: ownRecord([
      ['__proto__', {wordCounts: ownRecord([['a-word', 3], ['prototype', 4]])}],
      ['z-profile', {wordCounts: ownRecord([['constructor', 1], ['ordinary', 2]])}],
    ]),
    marker: 'hash-fixture',
  };
  const changed = structuredClone(reordered);
  Object.defineProperty(changed.rounds.__proto__.wordCounts, 'prototype', {
    value: 5,
    enumerable: true,
    writable: true,
    configurable: true,
  });

  assert.equal(await productStateHash(first), await productStateHash(reordered));
  assert.notEqual(await productStateHash(first), await productStateHash(changed));
});

test('a 500-word latest round expands deliberately and accepts only its refreshed current task', async () => {
  const words = Array.from({length: 500}, (_, index) => [
    `course7_unit12_word${String(index).padStart(4, '0')}`,
    `Wort ${index}`,
    [`answer-${index}`],
  ]);
  const f = createFixture({words});
  const ledger = structuredClone(f.base);
  const movedWordId = words.at(-1)[0];
  ledger.events.push(
    f.event('entity.revised', {
      entityType: 'lesson', entityId: 'lesson-latest', parents: [],
      value: {name: 'Unit 2', archived: false, profileIds: ['p1']},
    }, {id: 'rev-lesson-latest', clock: 700}),
    f.event('entity.revised', {
      entityType: 'word', entityId: movedWordId, parents: [`rev-${movedWordId}`],
      value: {
        lessonId: 'lesson-latest', german: 'Letztes Wort', hint: '', answers: ['latest'],
        archived: false, learningId: `learn-${movedWordId}`,
      },
    }, {id: 'rev-word-latest', clock: 701}),
  );
  const {commands} = await harness({ledger, ids: sequenceIds('large')});
  await commands.start({profileId: 'p1', mode: 'latest', size: 10});
  const roundId = commands.getState().rounds.p1.id;
  assert.equal(commands.getState().rounds.p1.candidates.length, 1);

  for (let index = 0; index < 3; index += 1) {
    await commands.submit({roundId, typed: 'latest'});
    await commands.next({roundId});
  }
  assert.equal(commands.getState().rounds.p1.status, 'exhausted');
  await commands.expand({roundId});
  assert.equal(commands.getState().rounds.p1.candidates.length, 500);
  const refreshed = commands.getState();
  const valid = solutionForCurrent(refreshed);
  await commands.submit({roundId, typed: valid});
  assert.equal(commands.getState().rounds.p1.feedback.correct, true);
});

test('an external word change invalidates the displayed local task instead of accepting it', async () => {
  const f = createFixture({words: [['w1', 'Hund', ['dog']]]});
  const {commands} = await harness({ledger: f.base, ids: sequenceIds('invalid')});
  await commands.start({profileId: 'p1', mode: 'all', size: 10});
  const before = commands.getState();
  const incoming = structuredClone(before);
  incoming.ledger.events.push(f.event('entity.revised', {
    entityType: 'word', entityId: 'w1', parents: ['rev-w1'],
    value: {
      lessonId: 'l1', german: 'Hund', hint: '', answers: ['hound'],
      archived: false, learningId: 'learn-new-meaning',
    },
  }, {id: 'remote-word-change', deviceId: 'remote', clock: 100}));
  incoming.clock = 100;
  await commands.commitExternal(incoming, await productStateHash(before));

  await assert.rejects(
    commands.submit({roundId: before.rounds.p1.id, typed: 'dog'}),
    {code: 'invalid'},
  );
  assert.equal(project(commands.getState().ledger).profiles.p1.points, 0);
});

test('rounds for another profile remain untouched when switching profiles', async () => {
  const f = createFixture();
  const ledger = structuredClone(f.base);
  ledger.events.push(
    f.event('entity.revised', {
      entityType: 'profile', entityId: 'p2', parents: [],
      value: {name: 'Ben', archived: false},
    }, {id: 'rev-p2', clock: 20}),
    f.event('entity.revised', {
      entityType: 'lesson', entityId: 'l2', parents: [],
      value: {name: 'Unit 2', archived: false, profileIds: ['p2']},
    }, {id: 'rev-l2', clock: 21}),
    f.event('entity.revised', {
      entityType: 'word', entityId: 'p2-word', parents: [],
      value: {
        lessonId: 'l2', german: 'Baum', hint: '', answers: ['tree'], archived: false,
        learningId: 'learn-p2-word',
      },
    }, {id: 'rev-p2-word', clock: 22}),
  );
  const {commands} = await harness({ledger});
  await commands.start({profileId: 'p1', mode: 'all', size: 10});
  const p1 = commands.getState().rounds.p1;
  await commands.start({profileId: 'p2', mode: 'all', size: 10});

  assert.deepEqual(commands.getState().rounds.p1, p1);
  assert.equal(commands.getState().rounds.p2.profileId, 'p2');
});

test('abandon stores one claim, keeps earned answer points and never awards a round bonus', async () => {
  const {commands} = await harness();
  await commands.start({profileId: 'p1', mode: 'all', size: 10});
  const roundId = commands.getState().rounds.p1.id;
  await commands.submit({roundId, typed: solutionForCurrent(commands.getState())});

  await commands.abandon({roundId});
  await commands.abandon({roundId});

  const state = commands.getState();
  assert.equal(state.rounds.p1.status, 'abandoned');
  assert.equal(state.ledger.events.filter(({type}) => type === 'round.abandoned').length, 1);
  assert.equal(project(state.ledger).profiles.p1.points, 10);
});

test('avatar and animation commands persist valid choices and reject locked equipment', async () => {
  const {commands} = await harness();

  await commands.setAvatar({
    profileId: 'p1', skin: 3, clothing: 5, head: null, back: null, hand: null,
  });
  await commands.setAnimations({profileId: 'p1', animations: false});
  await assert.rejects(commands.setAvatar({
    profileId: 'p1', skin: 3, clothing: 5, head: 'cap', back: null, hand: null,
  }), {code: 'invalid'});

  const profile = project(commands.getState().ledger).profiles.p1;
  assert.deepEqual(profile.avatar, {skin: 3, clothing: 5, head: null, back: null, hand: null});
  assert.equal(profile.animations, false);
  assert.equal(commands.getState().ledger.events.filter(({type}) => type === 'avatar.changed').length, 1);
});
