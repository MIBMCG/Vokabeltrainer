import test from 'node:test';
import assert from 'node:assert/strict';
import {projectSchedule} from '../../src/trainer/learning/schedule.js';
import {project, pendingMilestones} from '../../src/trainer/learning/progress.js';
import {assertLedger} from '../../src/trainer/model/schema.js';
import {createFixture} from './fixtures.js';
import * as policies from '../../src/trainer/model/policies.js';
import {effectiveAnswers, uniqueAnswers} from '../../src/trainer/learning/facts.js';

const policy = (slowAfter=3,stopAfter=null,intervals=[1,3,7,14]) => ({slowAfter,stopAfter,intervals});
function schedule(ledger, rules=policy(), options={}) {
  assertLedger(ledger);
  return projectSchedule({ledger, profileId:'p1', policy:rules, day:'2026-09-17', ...options});
}
const word = result => result.words.get('w1').get('learn-w1');
function answers(f,count,options={}) {
  return Array.from({length:count},(_,i)=>f.answer({id:`answer-${i}`,ordinal:i+1,...options}));
}

test('slow and stop thresholds affect scheduling without changing answer rewards or three-answer claims', () => {
  for(const [slow,stop,count] of [[2,2,2],[5,null,4],[10,20,10],[10,20,20],[10,null,25]]) {
    const f=createFixture();f.roundStarted.payload.size=30;
    const ledger=f.withEvents(f.roundStarted,...answers(f,count)), before=project(ledger);
    const state=word(schedule(ledger,policy(slow,stop)));
    assert.equal(state.streak,count);
    assert.equal(state.intervalIndex,count>=slow?0:-1);
    assert.equal(state.dueDay,count>=slow?'2026-09-18':null);
    assert.equal(state.excluded,stop!==null && count>=stop);
    assert.equal(project(ledger).profiles.p1.points,count*10);
    assert.deepEqual(project(ledger),before);
    assert.equal(pendingMilestones(ledger).filter(e=>e.milestone==='mastered').length,count>=3?1:0);
  }
});

test('a wrong answer resets scheduling and waits for two other answers', () => {
  const f=createFixture(), events=answers(f,3);
  events.push(f.answer({id:'wrong',ordinal:4,correct:false}));
  assert.deepEqual(word(schedule(f.withEvents(f.roundStarted,...events))), {
    streak:0,intervalIndex:-1,dueDay:null,errorGap:2,retryPending:true,excluded:false,generationId:null,
  });
  events.push(f.answer({id:'other-one',ordinal:5,wordId:'w2'}));
  assert.equal(word(schedule(f.withEvents(f.roundStarted,...events))).errorGap,1);
  events.push(f.answer({id:'other-two',ordinal:6,wordId:'w3'}));
  assert.equal(word(schedule(f.withEvents(f.roundStarted,...events))).errorGap,0);
  events.push(f.answer({id:'retry',ordinal:7}));
  assert.equal(word(schedule(f.withEvents(f.roundStarted,...events))).streak,1);
  assert.equal(word(schedule(f.withEvents(f.roundStarted,...events))).retryPending,false);
});

test('interval advances at most once per round and repeats the final interval', () => {
  const f=createFixture(), events=[f.roundStarted,...answers(f,2)];
  events.push(f.answer({id:'same-round-next-day',ordinal:3,day:'2026-09-18'}));
  assert.equal(word(schedule(f.withEvents(...events),policy(2))).intervalIndex,0);
  for(let index=1;index<=5;index++) {
    const roundId=`review-${index}`,day=`2026-09-${18+index}`;
    events.push(f.event('round.started',{roundId,profileId:'p1',mode:'all',size:10}));
    events.push(f.answer({id:`review-answer-${index}`,roundId,day}));
    events.push(f.answer({id:`review-duplicate-day-${index}`,roundId,ordinal:2,day}));
    const state=word(schedule(f.withEvents(...events),policy(2,null,[1,1,1,1])));
    assert.equal(state.intervalIndex,Math.min(index,3));
    assert.equal(state.dueDay,`2026-09-${19+index}`);
  }
});

test('policy changes recalculate history without awarding, removing or rewriting rewards', () => {
  const f=createFixture(),ledger=f.withEvents(f.roundStarted,...answers(f,4));
  const before=structuredClone(ledger),reward=project(ledger),claims=pendingMilestones(ledger);
  assert.equal(word(schedule(ledger,policy(5))).intervalIndex,-1);
  assert.equal(word(schedule(ledger,policy(2,3))).excluded,true);
  assert.equal(word(schedule(ledger,policy(2,null,[7,7,7,7]))).dueDay,'2026-09-24');
  assert.equal(word(schedule(ledger,policy(2))).excluded,false);
  assert.deepEqual(ledger,before);assert.deepEqual(project(ledger),reward);
  assert.deepEqual(pendingMilestones(ledger),claims);
});

const v2 = {formatVersion:2,ruleVersion:2};
function reset(f,id,overrides={}) {
  return f.event('word.reactivated',{profileId:'p1',wordId:'w1',revisionId:'rev-w1',learningId:'learn-w1'}, {...v2,id,...overrides});
}
function generationAnswer(f,{generationId,...options}) {
  const answer=f.answer(options);Object.assign(answer,v2);answer.payload.schedulingGenerationId=generationId;return answer;
}

test('current policies and generations use whole effective winners independent of arrival order', () => {
  const f=createFixture();
  const first=f.event('learning.rules.changed',{profileId:'p1',...policy(2,2)}, {...v2,id:'rule-a',clock:50,deviceId:'a'});
  const second=f.event('learning.rules.changed',{profileId:'p1',...policy(5,10,[2,4,8,16])}, {...v2,id:'rule-b',clock:50,deviceId:'b'});
  const resetA=reset(f,'reset-a',{clock:51,deviceId:'a'}),resetB=reset(f,'reset-b',{clock:51,deviceId:'b'});
  for(const changes of [[first,second,resetA,resetB],[resetB,resetA,second,first]]) {
    const ledger=f.withEvents(...changes);assertLedger(ledger);
    assert.deepEqual(policies.currentPolicy(ledger,'p1'),{eventId:'rule-b',policy:policy(5,10,[2,4,8,16])});
    assert.equal(policies.currentGenerations(ledger,'p1').find(e=>e.wordId==='w1').generationId,'reset-b');
    assert.deepEqual(policies.currentPolicy(ledger,'other'),{eventId:null,policy:policy()});
  }
});

test('reset and late old or losing-generation answers retain rewards but cannot change the current schedule', () => {
  const f=createFixture(), old=answers(f,3), resetA=reset(f,'reset-a'), resetB=reset(f,'reset-b');
  const current=generationAnswer(f,{id:'current',ordinal:4,generationId:'reset-b'});
  const late=f.answer({id:'late-old',ordinal:5,correct:false});
  const losing=generationAnswer(f,{id:'losing',ordinal:6,generationId:'reset-a',correct:false});
  const ledger=f.withEvents(f.roundStarted,...old,resetA,resetB,current,late,losing);
  assert.equal(word(schedule(ledger)).streak,1);
  assert.equal(word(schedule(ledger)).generationId,'reset-b');
  assert.equal(word(schedule(ledger)).retryPending,false);
  assert.equal(project(ledger).profiles.p1.points,40);
  assert.equal(project(ledger).profiles.p1.words.w1.attempts,6);
  const frozen=schedule(ledger,policy(),{generations:[{wordId:'w1',learningId:'learn-w1',generationId:null}]});
  assert.equal(word(frozen).streak,0);assert.equal(word(frozen).retryPending,true);
  const fresh=schedule(f.withEvents(f.roundStarted,...old,resetA));
  assert.deepEqual(word(fresh),{streak:0,intervalIndex:-1,dueDay:null,errorGap:0,retryPending:false,excluded:false,generationId:'reset-a'});
});

test('scheduling and rewards share the original answer-slot deduplication and event ordering', () => {
  const f=createFixture(),first=f.answer({id:'first',clock:20}),duplicate=f.answer({id:'duplicate',clock:21});
  const ledger=f.withEvents(f.roundStarted,duplicate,first);
  assert.equal(word(schedule(ledger)).streak,1);
  assert.equal(project(ledger).profiles.p1.words.w1.attempts,1);
  assert.equal(project(ledger).profiles.p1.points,10);
  assert.deepEqual(effectiveAnswers(ledger).map(e=>e.id),['first']);
  assert.deepEqual(uniqueAnswers([duplicate,first,structuredClone(first)]).map(e=>e.id),['first']);
});

test('new learning revisions and other profiles do not inherit a reset or scheduling series', () => {
  const f=createFixture(),prior=answers(f,3),change=f.event('entity.revised',{
    ...f.base.events.find(e=>e.id==='rev-w1').payload,parents:['rev-w1'],
    value:{...f.base.events.find(e=>e.id==='rev-w1').payload.value,answers:['hound'],learningId:'new-learning'},
  },{id:'new-revision'});
  const ledger=f.withEvents(f.roundStarted,...prior,reset(f,'old-reset'),change);
  assert.equal(schedule(ledger).words.get('w1').get('new-learning').streak,0);
  assert.equal(schedule(ledger).words.get('w1').get('new-learning').generationId,null);
  const other=schedule(ledger,policy(),{profileId:'other'});
  assert.equal(other.words.get('w1').get('learn-w1').generationId,null);
  assert.equal(other.words.get('w1').get('learn-w1').streak,0);
});
