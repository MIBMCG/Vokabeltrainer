import test from 'node:test';
import assert from 'node:assert/strict';
import * as practice from '../../src/trainer/ui/practice.js';
import * as purchases from '../../src/trainer/ui/purchases.js';
import {createFixture} from './fixtures.js';

function recovery() {
  const f = createFixture();
  const wrong = f.answer({id: 'wrong', ordinal: 1, correct: false, learningId: 'old-version'});
  const answer = f.answer({id: 'correct', ordinal: 2});
  const milestone = f.event('word.milestone', {profileId: 'p1', wordId: 'w1', milestone: 'recovered', evidenceAnswerIds: [wrong.id, answer.id]});
  const ledger = f.withEvents(f.roundStarted, wrong, answer, milestone);
  const round = {id: 'r1', profileId: 'p1', epochId: 'e0', status: 'feedback', size: 10, answeredIds: ['wrong', 'correct'], current: {...answer.payload}, feedback: {answerId: answer.id, correct: true}};
  return {f, wrong, answer, milestone, ledger, round, profileId: 'p1'};
}
function reaction(value) {assert.equal(typeof practice.practiceReaction, 'function', 'saved effective reaction selector exists'); return practice.practiceReaction(value);}

test('saved correct recovery resolves both effective evidence answers across learning versions', () => {
  const value = recovery(); const before = JSON.stringify(value.ledger);
  assert.deepEqual(reaction(value), {kind: 'recovered', key: 'correct'});
  assert.equal(JSON.stringify(value.ledger), before);
});
for (const [label, mutate] of [
  ['ordinary right answer', v => {v.ledger.events = v.ledger.events.filter(e => e.id !== v.milestone.id);} ],
  ['wrong feedback', v => {v.round.feedback.correct = false;}],
  ['failed answer save', v => {v.ledger.events = v.ledger.events.filter(e => e.id !== 'correct');}],
  ['answer outside saved round', v => {v.round.answeredIds = ['wrong'];}],
  ['stale epoch', v => {v.round.epochId = 'old';}],
  ['other profile', v => {v.profileId = 'other';}],
  ['different displayed task', v => {v.round.current.wordId = 'w2';}],
  ['different revision', v => {v.round.current.revisionId = 'rev-w2';}],
  ['duplicate answer slot', v => {v.ledger.events.push(v.f.answer({id: 'earlier-slot', ordinal: 2, clock: v.answer.clock - 0.5}));}],
  ['abandoned round', v => {v.ledger.events.push(v.f.event('round.abandoned', {roundId: 'r1', profileId: 'p1'}));}],
  ['archived profile', v => {v.ledger.events.push(v.f.event('entity.revised', {entityType: 'profile', entityId: 'p1', parents: ['rev-p1'], value: {name: 'Ada', archived: true}}));}],
  ['competing epoch heads', v => {v.ledger.epochs.push({...v.ledger.epochs[0], id: 'other'});}],
  ['incomplete active epoch', v => {v.ledger.epochs.push({...v.ledger.epochs[0], id: 'e1', parents: ['e0'], snapshotId: 'missing'}); v.round.epochId = 'e1';}],
  ['reversed evidence', v => {v.milestone.payload.evidenceAnswerIds.reverse(); v.ledger.events = v.ledger.events.map(e => e.id === v.milestone.id ? v.milestone : e);}],
]) test(`no difficult-word reaction for ${label}`, () => {const value = recovery(); mutate(value); assert.equal(reaction(value), null);});

test('effective recovered claim with support-only wrong answer cannot celebrate', () => {
  const value = recovery(); const effectiveIds = value.ledger.events.filter(e => e.id !== 'wrong').map(e => e.id);
  value.ledger.snapshots.push({id: 's1', effectiveEventIds: effectiveIds, supportEventIds: ['wrong']});
  value.ledger.epochs.push({...value.ledger.epochs[0], id: 'e1', parents: ['e0'], snapshotId: 's1'});
  value.round.epochId = 'e1'; assert.equal(reaction(value), null);
});
function completed(reason = 'exhausted') {
  const value = recovery(); value.ledger.events = value.ledger.events.filter(e => e.id !== value.milestone.id);
  value.round.status = 'completed'; value.round.current = null; value.round.feedback = null;
  if (reason === 'full') value.ledger.events.find(e => e.id === 'start-r1').payload.size = 2;
  value.completion = value.f.event('round.completed', {roundId: 'r1', profileId: 'p1', reason, answerIds: ['wrong', 'correct']});
  value.ledger.events.push(value.completion); return value;
}
for (const reason of ['exhausted', 'full']) test(`saved valid ${reason} completion celebrates`, () => {assert.deepEqual(reaction(completed(reason)), {kind: 'completed', key: 'r1'});});
for (const [label, mutate] of [
  ['exhausted without saved completion', v => {v.round.status = 'exhausted'; v.ledger.events.pop();}],
  ['failed completion save', v => {v.ledger.events.pop();}],
  ['abandonment before completion', v => {v.ledger.events.push(v.f.event('round.abandoned', {roundId: 'r1', profileId: 'p1'}, {clock: v.completion.clock - 0.5}));}],
  ['abandonment after completion', v => {v.ledger.events.push(v.f.event('round.abandoned', {roundId: 'r1', profileId: 'p1'}));}],
  ['mismatching answer list', v => {v.round.answeredIds = ['correct'];}],
  ['foreign completion profile', v => {v.completion.payload.profileId = 'other';}],
]) test(`no completed reaction for ${label}`, () => {const value = completed(); mutate(value); assert.equal(reaction(value), null);});

function purchase() {return {result: {status: 'confirmed', operationId: 'op1'}, profileId: 'p1', articleId: 'evolution:dragon:2', view: {mode: 'active', accounts: {p1: {entitledFigureIds: ['dragon'], entitledEvolutionIds: ['evolution:dragon:1', 'evolution:dragon:2']}}, jobs: [{status: 'confirmed', intent: {operationId: 'op1', profileId: 'p1', articleId: 'evolution:dragon:2'}}]}};}
function unlock(value) {assert.equal(typeof purchases.confirmedCompanionUnlock, 'function', 'confirmed unlock selector exists'); return purchases.confirmedCompanionUnlock(value);}
test('matching confirmed fresh entitlement selects a presentation moment without calls or mutations', () => {const v = purchase(); const before = JSON.stringify(v); assert.deepEqual(unlock(v), {figureId: 'dragon', stage: 2, key: 'op1'}); assert.equal(JSON.stringify(v), before);});
for (const [label, mutate] of [
  ['pending result', v => {v.result.status = 'open';}], ['rejected result', v => {v.result.status = 'rejected';}], ['superseded result', v => {v.result.status = 'superseded';}], ['missing result', v => {v.result = undefined;}],
  ['stale operation', v => {v.result.operationId = 'old';}], ['foreign profile', v => {v.profileId = 'p2';}], ['foreign article', v => {v.articleId = 'tiger';}],
  ['old ownership without job', v => {v.view.jobs = [];}], ['pending job', v => {v.view.jobs[0].status = 'open';}], ['no entitlement', v => {v.view.accounts.p1.entitledEvolutionIds.pop();}],
  ['inactive account', v => {v.view.mode = 'inactive';}],
]) test(`no unlock for ${label}`, () => {const v = purchase(); mutate(v); assert.equal(unlock(v), null);});

test('base-figure confirmation requires its exact base evolution entitlement too', () => {
  const value = purchase(); value.articleId = 'dragon'; value.view.jobs[0].intent.articleId = 'dragon';
  assert.deepEqual(unlock(value), {figureId: 'dragon', stage: 1, key: 'op1'});
  value.view.accounts.p1.entitledEvolutionIds = ['evolution:dragon:2']; assert.equal(unlock(value), null);
});
