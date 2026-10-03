import test from 'node:test';
import assert from 'node:assert/strict';
import {FIGURES} from '../../src/trainer/avatar/catalog.js';
const api = await import('../../src/trainer/avatar/companion.js').catch(() => ({}));
const view = {mode: 'active', accounts: {
  ada: {entitledFigureIds: ['dragon', 'explorer-girl', 'unknown'], entitledEvolutionIds: ['evolution:dragon:1', 'evolution:dragon:3', 'evolution:explorer-girl:1', 'evolution:unknown:4', 'evolution:phoenix:4']},
  ben: {entitledFigureIds: ['tiger'], entitledEvolutionIds: ['evolution:tiger:1', 'evolution:tiger:2']},
}, selection: [{profileId: 'ada', figureId: 'dragon', stage: 4}], jobs: [], head: null, control: null};

test('all catalog figures have immutable distinct stories and titles for four valid stages', () => {
  assert.equal(typeof api.companionInfo, 'function', 'companion metadata must exist');
  for (const {id} of FIGURES) {
    const titles = new Set(); const stories = new Set();
    for (let stage = 1; stage <= 4; stage++) {
      const info = api.companionInfo(id, stage);
      assert.equal(info.figureId, id); assert.equal(info.stage, stage); assert.ok(Object.isFrozen(info));
      for (const key of ['name', 'title', 'place', 'trait', 'story', 'effect']) assert.ok(info[key].length > 0);
      assert.ok(['glow', 'mist', 'spark', 'sway'].includes(info.effect));
      titles.add(info.title); stories.add(info.story);
    }
    assert.equal(titles.size, 4); assert.equal(stories.size, 4);
  }
});
test('invalid metadata never produces a paid title', () => {
  assert.equal(typeof api.companionInfo, 'function');
  for (const [id, stage] of [['unknown', 4], ['dragon', 0], ['dragon', 5], ['dragon', '2'], ['dragon', NaN], [null, 1]]) assert.equal(api.companionInfo(id, stage), null);
});
test('collection uses exact confirmed known entitlements, no selected or inferred paid stage', () => {
  assert.equal(typeof api.ownedCompanions, 'function');
  const before = JSON.stringify(view);
  assert.deepEqual(api.ownedCompanions(view, 'ada').map(({figureId, stage, ownedStages}) => ({figureId, stage, ownedStages})), [
    {figureId: 'explorer-girl', stage: 1, ownedStages: [1]}, {figureId: 'dragon', stage: 3, ownedStages: [1, 3]},
  ]);
  assert.deepEqual(api.ownedCompanions(view, 'ben').map(({figureId, stage, ownedStages}) => ({figureId, stage, ownedStages})), [{figureId: 'tiger', stage: 2, ownedStages: [1, 2]}]);
  assert.equal(JSON.stringify(view), before);
});
test('inactive, missing account and base-only accounts grant no invented stages', () => {
  assert.equal(typeof api.ownedCompanions, 'function');
  for (const input of [null, {}, {...view, mode: 'inactive'}, {...view, accounts: {}}]) assert.deepEqual(api.ownedCompanions(input, 'ada'), []);
  assert.deepEqual(api.ownedCompanions({...view, accounts: {ada: {entitledFigureIds: ['dragon'], entitledEvolutionIds: []}}}, 'ada'), []);
});
test('moment claims are separated by owner and profile and retain only the last 256 keys', () => {
  assert.equal(typeof api.claimCompanionMoment, 'function');
  const owner = {}; assert.equal(api.claimCompanionMoment(owner, 'ada', 'same'), true);
  assert.equal(api.claimCompanionMoment(owner, 'ada', 'same'), false);
  assert.equal(api.claimCompanionMoment(owner, 'ben', 'same'), true);
  assert.equal(api.claimCompanionMoment({}, 'ada', 'same'), true);
  for (let i = 0; i < 256; i++) assert.equal(api.claimCompanionMoment(owner, 'ada', `key-${i}`), true);
  assert.equal(api.claimCompanionMoment(owner, 'ada', 'key-255'), false);
  assert.equal(api.claimCompanionMoment(owner, 'ada', 'same'), true);
  assert.equal(api.claimCompanionMoment(null, 'ada', 'key'), false);
  assert.equal(api.claimCompanionMoment(owner, '', 'key'), false);
});
