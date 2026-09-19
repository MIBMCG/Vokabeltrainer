import test from 'node:test';
import assert from 'node:assert/strict';
import {assertPolicy} from '../../src/trainer/model/policies.js';
import {assertEvent, assertLedger} from '../../src/trainer/model/schema.js';
import {createFixture} from './fixtures.js';

const defaults = {slowAfter:3,stopAfter:null,intervals:[1,3,7,14]};
test('policy accepts boundaries as independent values and rejects malformed rules', () => {
  for (const policy of [defaults,{slowAfter:2,stopAfter:2,intervals:[1,1,3,365]},
    {slowAfter:10,stopAfter:20,intervals:[365,365,365,365]}]) {
    const checked=assertPolicy(policy); assert.deepEqual(checked,policy);
    assert.notEqual(checked.intervals,policy.intervals);
  }
  for (const policy of [null,[],{...defaults,extra:true},{...defaults,slowAfter:1},
    {...defaults,slowAfter:2.5},{...defaults,slowAfter:11},{...defaults,stopAfter:2},
    {...defaults,stopAfter:21},{...defaults,intervals:[1,7,3,14]},
    {...defaults,intervals:[1,3,7,366]},{...defaults,intervals:[0,1,2,3]},
    {...defaults,intervals:[1,2,3]},{...defaults,intervals:[1,2,3,4.5]}]) {
    assert.throws(()=>assertPolicy(policy),e=>e.code==='invalid');
  }
});
test('v2 round and answer references require the matching policy and generation', () => {
  const f=createFixture();
  const event=(type,payload,id)=>f.event(type,payload,{id,formatVersion:2,ruleVersion:2});
  const policy=event('learning.rules.changed',{profileId:'p1',...defaults},'rules');
  const reset=event('word.reactivated',{profileId:'p1',wordId:'w1',revisionId:'rev-w1',learningId:'learn-w1'},'reset');
  const start=event('round.started',{...f.roundStarted.payload,policyEventId:'rules',policy:defaults},'v2-start');
  const answer={...f.answer({id:'answer'}),formatVersion:2,ruleVersion:2};
  answer.payload.schedulingGenerationId='reset';
  const ledger=f.withEvents(policy,reset,start,answer);
  assert.deepEqual(assertLedger(ledger).events,ledger.events);
  for (const damage of [l=>l.events.find(e=>e.id==='v2-start').payload.policy.slowAfter=4,
    l=>l.events.find(e=>e.id==='reset').payload.learningId='other',
    l=>l.events.find(e=>e.id==='answer').payload.schedulingGenerationId='missing',
    l=>{l.events.find(e=>e.id==='v2-start').payload.policyEventId=null;l.events.find(e=>e.id==='v2-start').payload.policy.slowAfter=5;}]) {
    const bad=structuredClone(ledger);damage(bad);assert.throws(()=>assertLedger(bad));
  }
  const mixed=f.withEvents(f.roundStarted,{...answer,payload:{...answer.payload,schedulingGenerationId:null}});
  assert.doesNotThrow(()=>assertLedger(mixed));
  assert.throws(()=>assertEvent({...policy,formatVersion:1,ruleVersion:1}));
  for(const [formatVersion,ruleVersion] of [[1,2],[2,1],[3,3]]) {
    assert.throws(()=>assertEvent({...policy,formatVersion,ruleVersion}),e=>e.code==='version');
  }
});
