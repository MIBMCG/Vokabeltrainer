import test from 'node:test';
import assert from 'node:assert/strict';

import {digest} from '../../src/trainer/model/canonical.js';
import {assertLedger} from '../../src/trainer/model/schema.js';
import {
  nextLearningId,
  normalize,
  projectEntities,
  revisionPayload,
  semanticWord,
} from '../../src/trainer/model/revisions.js';
import {createFixture} from './fixtures.js';

function wordRevision(f, {
  id,
  parents = ['rev-w1'],
  answers = ['dog'],
  german = 'Hund',
  hint = '',
  lessonId = 'l1',
  archived = false,
  learningId = 'learn-w1',
  ...overrides
}) {
  return f.event('entity.revised', {
    entityType: 'word',
    entityId: 'w1',
    parents,
    value: {lessonId, german, hint, answers, archived, learningId},
  }, {id, ...overrides});
}

test('text and word meaning use the exact stable normalization contract', () => {
  assert.equal(normalize("  L’École  verte "), "l'école  verte");
  assert.equal(normalize('A\u0308'), 'ä');
  assert.deepEqual(semanticWord({
    german: ' Hund ',
    hint: ' TIER ',
    answers: [' Hound ', 'dog', 'DOG', 'dog  house'],
    lessonId: 'ignored',
    archived: true,
    learningId: 'ignored',
  }), {
    german: 'hund',
    hint: 'tier',
    answers: ['dog', 'dog  house', 'hound'],
  });
});

test('learning IDs survive spelling changes but change for meaning changes or merged histories', async () => {
  const f = createFixture();
  const parent = f.base.events.find(({id}) => id === 'rev-w1');
  const sameMeaning = {
    lessonId: 'l1', german: ' HUND ', hint: '', answers: ['DOG', 'dog'], archived: true,
  };
  assert.equal(await nextLearningId({
    wordId: 'w1', revisionId: 'spell-only', value: sameMeaning, parents: [parent],
  }), 'learn-w1');

  const changedValue = {...sameMeaning, answers: ['hound']};
  assert.equal(await nextLearningId({
    wordId: 'w1', revisionId: 'meaning-change', value: changedValue, parents: [parent],
  }), await digest({
    wordId: 'w1',
    parentLearningIds: ['learn-w1'],
    semantic: {german: 'hund', hint: '', answers: ['hound']},
  }));

  const otherHistory = wordRevision(f, {
    id: 'other-history', parents: [], answers: ['dog'], learningId: 'learn-other',
  });
  assert.equal(await nextLearningId({
    wordId: 'w1', revisionId: 'merged', value: sameMeaning, parents: [parent, otherHistory],
  }), await digest({
    wordId: 'w1',
    parentLearningIds: ['learn-other', 'learn-w1'],
    semantic: {german: 'hund', hint: '', answers: ['dog']},
  }));

  assert.equal(await nextLearningId({
    wordId: 'w-new', revisionId: 'rev-new', value: changedValue, parents: [],
  }), await digest({wordId: 'w-new', revisionId: 'rev-new'}));
});

test('two successors remain conflict until a revision names both parents', () => {
  const f = createFixture();
  const left = wordRevision(f, {id: 'left', answers: ['dog']});
  const right = wordRevision(f, {id: 'right', answers: ['hound']});
  const before = projectEntities([...f.base.events, left, right]);
  assert.equal(before.entities.words.w1.conflicted, true);
  assert.deepEqual(before.entities.words.w1.heads, ['left', 'right']);
  assert.equal(before.entities.words.w1.value, null);
  assert.deepEqual(before.conflicts, [{entityType: 'word', entityId: 'w1', heads: ['left', 'right']}]);

  const chosen = wordRevision(f, {id: 'chosen', answers: ['hound'], parents: ['left', 'right']});
  const after = projectEntities([...f.base.events, left, right, chosen]);
  assert.equal(after.conflicts.length, 0);
  assert.deepEqual(after.entities.words.w1.heads, ['chosen']);
});

test('compatible heads normalize text but archive and lesson assignment still conflict', () => {
  const f = createFixture();
  const normalizedLeft = wordRevision(f, {
    id: 'normalized-left', german: ' Hund ', answers: ['DOG', 'dog'], deviceId: 'A', clock: 30,
  });
  const normalizedRight = wordRevision(f, {
    id: 'normalized-right', german: 'HUND', answers: ['dog'], deviceId: 'B', clock: 30,
  });
  const compatible = projectEntities([...f.base.events, normalizedRight, normalizedLeft]);
  assert.equal(compatible.entities.words.w1.conflicted, false);
  assert.deepEqual(compatible.entities.words.w1.heads, ['normalized-left', 'normalized-right']);
  assert.equal(compatible.entities.words.w1.value.german, 'HUND');

  const archived = wordRevision(f, {id: 'archived', archived: true});
  assert.equal(projectEntities([...f.base.events, normalizedLeft, archived]).entities.words.w1.conflicted, true);

  const secondLesson = f.event('entity.revised', {
    entityType: 'lesson', entityId: 'l2', parents: [],
    value: {name: 'Unit 2', archived: false, profileIds: ['p1']},
  }, {id: 'rev-l2'});
  const reassigned = wordRevision(f, {id: 'reassigned', lessonId: 'l2'});
  assert.equal(projectEntities([...f.base.events, secondLesson, normalizedLeft, reassigned])
    .entities.words.w1.conflicted, true);
});

test('support ancestry is transitive without allowing support successors to become active heads', () => {
  const f = createFixture();
  const v2 = wordRevision(f, {id: 'v2', parents: ['rev-w1'], answers: ['dog']});
  const v3 = wordRevision(f, {id: 'v3', parents: ['v2'], answers: ['dog']});
  const v4 = wordRevision(f, {id: 'v4', parents: ['v3'], answers: ['dog']});
  const v5 = wordRevision(f, {id: 'v5', parents: ['v4'], answers: ['hound']});

  const bridged = projectEntities([...f.base.events, v2, v5], {supportEvents: [v3, v4]});
  assert.deepEqual(bridged.entities.words.w1.heads, ['v5']);
  assert.deepEqual(bridged.entities.words.w1.createdOrder, [3, 'dev1', 'rev-w1']);

  const supportOnlySuccessor = projectEntities([...f.base.events, v2], {supportEvents: [v3, v4, v5]});
  assert.deepEqual(supportOnlySuccessor.entities.words.w1.heads, ['v2']);
  assert.equal(supportOnlySuccessor.entities.words.w1.value.answers[0], 'dog');
});

test('created order remains the earliest reachable root tuple and input permutations agree', () => {
  const f = createFixture();
  const secondRoot = f.event('entity.revised', {
    entityType: 'lesson', entityId: 'l1', parents: [],
    value: {name: 'Unit One', archived: false, profileIds: ['p1']},
  }, {id: 'lesson-root-b', clock: 12, deviceId: 'B'});
  const merged = f.event('entity.revised', {
    entityType: 'lesson', entityId: 'l1', parents: ['lesson-root-b', 'rev-l1'],
    value: {name: 'Unit 1', archived: false, profileIds: ['p1']},
  }, {id: 'lesson-merged', clock: 20});

  const events = [...f.base.events, secondRoot, merged];
  const forward = projectEntities(events);
  const reverse = projectEntities([...events].reverse());
  assert.deepEqual(forward, reverse);
  assert.deepEqual(forward.entities.lessons.l1.createdOrder, [2, 'dev1', 'rev-l1']);
});

test('accepted special-key entity IDs remain enumerable own fields in every bucket', () => {
  const f = createFixture();
  const specialKeys = ['__proto__', 'constructor', 'prototype'];
  const revisions = specialKeys.flatMap((entityId) => [
    f.event('entity.revised', {
      entityType: 'profile', entityId, parents: [],
      value: {name: `Profil ${entityId}`, archived: false},
    }, {id: `rev-profile-${entityId}`}),
    f.event('entity.revised', {
      entityType: 'lesson', entityId, parents: [],
      value: {name: `Lektion ${entityId}`, archived: false, profileIds: [entityId]},
    }, {id: `rev-lesson-${entityId}`}),
    f.event('entity.revised', {
      entityType: 'word', entityId, parents: [],
      value: {
        lessonId: entityId, german: `Wort ${entityId}`, hint: '', answers: ['safe'],
        archived: false, learningId: `learn-${entityId}`,
      },
    }, {id: `rev-word-${entityId}`}),
  ]);
  const valid = assertLedger(f.withEvents(...revisions));

  const {entities} = projectEntities(valid.events);
  for (const bucket of [entities.profiles, entities.lessons, entities.words]) {
    const serialized = JSON.parse(JSON.stringify(bucket));
    for (const entityId of specialKeys) {
      assert.equal(Object.hasOwn(bucket, entityId), true);
      assert.ok(Object.values(bucket).some(({id}) => id === entityId));
      assert.equal(Object.hasOwn(serialized, entityId), true);
    }
  }
});

test('deep support chains project without recursive call-stack growth', () => {
  const f = createFixture();
  let parent = 'rev-w1';
  const supportEvents = [];
  for (let index = 0; index < 12_005; index += 1) {
    const id = `support-${String(index).padStart(5, '0')}`;
    supportEvents.push(wordRevision(f, {id, parents: [parent]}));
    parent = id;
  }
  const active = wordRevision(f, {id: 'deep-active', parents: [parent], answers: ['hound']});

  const projected = projectEntities([...f.base.events, active], {supportEvents});
  assert.deepEqual(projected.entities.words.w1.heads, ['deep-active']);
  assert.deepEqual(projected.entities.words.w1.createdOrder, [3, 'dev1', 'rev-w1']);
});

test('revision payload sorts and deduplicates heads and owns its returned values', () => {
  const value = {name: 'Unit 1', archived: false, profileIds: ['p1']};
  const payload = revisionPayload({
    entityType: 'lesson', entityId: 'l1', parents: ['z', 'a', 'z'], value,
  });
  assert.deepEqual(payload, {
    entityType: 'lesson', entityId: 'l1', parents: ['a', 'z'], value,
  });
  value.name = 'Changed';
  assert.equal(payload.value.name, 'Unit 1');
});
