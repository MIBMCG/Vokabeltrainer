import test from 'node:test';
import assert from 'node:assert/strict';

import {purchaseProfileModel} from '../../src/trainer/ui/purchases.js';

function activeView() {
  return {
    mode: 'active',
    head: {id: 'head-1', sha256: 'a'.repeat(64)},
    accounts: {
      p1: {
        profileId: 'p1',
        earnedPoints: 610,
        spentPoints: 0,
        availablePoints: 610,
        purchasedArticleIds: [],
        entitledFigureIds: ['explorer-girl'],
        entitledEvolutionIds: ['evolution:explorer-girl:1'],
      },
    },
    jobs: [],
    selection: [{profileId: 'p1', figureId: 'explorer-girl', stage: 1}],
    control: null,
  };
}

test('an affordable purchase requires explicit Google reconnect while owned selection stays available', () => {
  const model = purchaseProfileModel({
    view: activeView(),
    profileId: 'p1',
    online: true,
    authenticated: false,
  });

  assert.equal(model.shop.find(({id}) => id === 'deer-mist').action, 'reauth');
  assert.equal(model.selected.figureId, 'explorer-girl');
  assert.equal(model.selected.stage, 1);
});

test('offline remains distinct from reconnect and does not change owned selection', () => {
  const model = purchaseProfileModel({
    view: activeView(),
    profileId: 'p1',
    online: false,
    authenticated: false,
  });

  assert.equal(model.shop.find(({id}) => id === 'deer-mist').action, 'offline');
  assert.equal(model.selected.figureId, 'explorer-girl');
});

test('missing Google session does not replace the progress message before a purchase is affordable', () => {
  const view = activeView();
  view.accounts.p1.earnedPoints = 590;
  view.accounts.p1.availablePoints = 590;

  const model = purchaseProfileModel({view, profileId: 'p1', online: true, authenticated: false});

  assert.equal(model.shop.find(({id}) => id === 'deer-mist').action, 'saving');
});
