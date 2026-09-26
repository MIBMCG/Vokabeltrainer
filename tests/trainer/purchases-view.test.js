import test from 'node:test';
import assert from 'node:assert/strict';

import {
  activationPreviewModel,
  purchaseProfileModel,
} from '../../src/trainer/ui/purchases.js';
import {earnedLedger} from './purchases-fixtures.js';
import {purchasePreviewStateHash} from '../../src/trainer/purchases/service.js';
import {prepareRestorePreview} from '../../src/trainer/ui/backup.js';

test('activation preview is local, concrete and explains the preserved learning economy', () => {
  const calls = [];
  const state = {
    binding: {accountId: 'a1', folderId: 'f1', descriptorFileId: 'd1', datasetId: 'd1'},
    ledger: earnedLedger({correct: 30}),
    commerce: {mode: 'inactive', control: null},
  };

  const preview = activationPreviewModel(state, {onNetwork: () => calls.push('network')});

  assert.deepEqual(calls, []);
  assert.equal(preview.datasetName, 'Fixture');
  assert.deepEqual(preview.profiles.map(({name, points}) => [name, points]), [
    ['Ada', 300],
    ['Ben', 300],
  ]);
  assert.match(preview.explanation, /Lernpunkte und Level bleiben erhalten/);
  assert.match(preview.deviceNotice, /Appupdate/);
});

test('activation preview ignores upload bookkeeping but expires for a changed learning state', async () => {
  const state = {
    binding: {accountId: 'a1', folderId: 'f1', descriptorFileId: 'd1', datasetId: 'd1'},
    ledger: earnedLedger({correct: 1}),
    commerce: {mode: 'inactive', binding: null, configRef: null, config: null, head: null,
      control: null, jobs: [], selection: []},
    outboxEventIds: ['answer-p1-1'], pendingPackets: [], knownFiles: [], packetIntegrity: [],
  };
  const expected = await purchasePreviewStateHash(state);
  const synced = structuredClone(state);
  synced.outboxEventIds = [];
  synced.pendingPackets = [{transport: 'bookkeeping'}];
  synced.knownFiles = [{transport: 'bookkeeping'}];
  assert.equal(await purchasePreviewStateHash(synced), expected);
  const changed = structuredClone(state);
  changed.ledger.descriptor.name = 'Changed learning state';
  assert.notEqual(await purchasePreviewStateHash(changed), expected);
});

test('purchase profile model uses verified service accounts and keeps uncertain work explicit', () => {
  const view = {
    mode: 'active', head: {id: 'head-1', sha256: 'a'.repeat(64)},
    accounts: {
      p1: {
        profileId: 'p1', earnedPoints: 1620, spentPoints: 200, availablePoints: 1420,
        purchasedArticleIds: ['evolution:dragon:2'],
        entitledFigureIds: ['dragon', 'explorer-girl'],
        entitledEvolutionIds: ['evolution:dragon:1', 'evolution:dragon:2'],
      },
      p2: {
        profileId: 'p2', earnedPoints: 1620, spentPoints: 0, availablePoints: 1620,
        purchasedArticleIds: [], entitledFigureIds: ['dragon', 'explorer-boy'],
        entitledEvolutionIds: ['evolution:dragon:1'],
      },
    },
    jobs: [{
      status: 'open', intent: {operationId: 'buy-1', profileId: 'p1', articleId: 'evolution:dragon:3'},
      attempts: [{phase: 'pointer-pending'}],
    }],
    selection: [{profileId: 'p1', figureId: 'dragon', stage: 2}], control: null,
  };

  const model = purchaseProfileModel({view, profileId: 'p1', online: true});
  assert.equal(model.availablePoints, 1420);
  assert.equal(model.levelPoints, 1620);
  assert.equal(model.selected.id, 'evolution:dragon:2');
  assert.deepEqual(model.pending, {operationId: 'buy-1', articleId: 'evolution:dragon:3', phase: 'pointer-pending'});
  assert.equal(model.forms.find(({stage}) => stage === 2).owned, true);
  assert.equal(model.forms.find(({stage}) => stage === 3).action, 'resume');
  assert.equal(model.forms.find(({stage}) => stage === 4).action, 'locked');
  assert.equal(purchaseProfileModel({view, profileId: 'p2', online: false}).forms[1].action, 'offline');
});

test('only approved dragon stages are visually available while base figure art stays usable', () => {
  const view = {
    mode: 'active', head: {id: 'head-1', sha256: 'a'.repeat(64)}, jobs: [], selection: [], control: null,
    accounts: {p1: {
      profileId: 'p1', earnedPoints: 4000, spentPoints: 0, availablePoints: 4000,
      purchasedArticleIds: [], entitledFigureIds: ['dragon', 'explorer-girl'],
      entitledEvolutionIds: ['evolution:dragon:1'],
    }},
  };

  const model = purchaseProfileModel({view, profileId: 'p1', online: true});
  assert.equal(model.forms.length, 4);
  assert.equal(model.forms.every(({artAvailable}) => artAvailable), true);
  assert.equal(model.shop.every(({baseArtAvailable}) => baseArtAvailable), true);
  assert.equal(model.shop.some(({action}) => action === 'buy'), true);

  view.selection = [{profileId: 'p1', figureId: 'explorer-girl', stage: 1}];
  const pendingArt = purchaseProfileModel({view, profileId: 'p1', online: true});
  assert.equal(pendingArt.forms.length, 4);
  assert.equal(pendingArt.forms.every(({artAvailable, action}) => !artAvailable && action === 'unavailable'), true);
});

test('restore preview derives its economy after preparation has synchronized the current state', async () => {
  let current = {version: 'before'};
  const calls = [];
  const result = await prepareRestorePreview({
    backup: {kind: 'fixture'},
    restore: {async prepare() {
      calls.push('prepare');
      current = {version: 'after'};
      return {previewId: 'current-preview'};
    }},
    getState: () => current,
    economicPreview: async ({state}) => {
      calls.push(`economy:${state.version}`);
      return {included: true, stateVersion: state.version};
    },
  });
  assert.deepEqual(calls, ['prepare', 'economy:after']);
  assert.equal(result.prepared.previewId, 'current-preview');
  assert.equal(result.economy.stateVersion, 'after');
});
