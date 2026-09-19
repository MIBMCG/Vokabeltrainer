import test from 'node:test';
import assert from 'node:assert/strict';

import {eventLabel} from '../../src/trainer/ui/preview.js';
import {createFixture} from './fixtures.js';

test('late round abandonment and adoption use meaningful labels', () => {
  const fixture = createFixture();
  const state = {ledger: fixture.base};
  const abandoned = fixture.event('round.abandoned', {
    roundId: 'r1', profileId: 'p1', reason: 'profile-archived',
  }, {id: 'abandoned-r1'});
  const adopted = fixture.event('events.adopted', {
    sourceEpochId: 'e0', eventIds: [], supportEventIds: [],
  }, {id: 'adopted-events'});

  assert.equal(eventLabel(abandoned, state), 'Abgebrochene Runde von Ada am 17.09.2026');
  assert.equal(eventLabel(adopted, state), 'Ausgewählte alte Änderungen übernommen am 17.09.2026');
});

test('policy and reactivation adoption show their child and effect in readable labels',()=>{
  const f=createFixture(),state={ledger:f.base};
  const rules=f.event('learning.rules.changed',{profileId:'p1',slowAfter:5,stopAfter:8,intervals:[1,3,7,14]});
  const reset=f.event('word.reactivated',{profileId:'p1',wordId:'w1',revisionId:'rev-w1',learningId:'learn-w1'});
  assert.match(eventLabel(rules,state),/Lernregeln.*Ada.*5.*8/);
  assert.match(eventLabel(reset,state),/Hund.*Ada.*wieder/);
});
