import test from 'node:test';
import assert from 'node:assert/strict';

import {createTrainerHarness} from './trainer-harness.mjs';

test('one purchase stays visibly in progress through slow preview and confirmation', {timeout: 60_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice();
  try {
    await page.goto(harness.baseUrl);
    await page.locator('#dataset-name').waitFor();
    await page.evaluate(async () => {
      const {renderPurchases} = await import('/src/trainer/ui/purchases.js');
      const root = document.createElement('section');
      root.id = 'purchase-progress-fixture';
      document.body.append(root);
      let releasePreview;
      let releaseConfirm;
      const previewGate = new Promise((resolve) => { releasePreview = resolve; });
      const confirmGate = new Promise((resolve) => { releaseConfirm = resolve; });
      const view = {
        mode: 'active', head: {id: 'head-1', sha256: 'a'.repeat(64)},
        accounts: {p1: {
          profileId: 'p1', earnedPoints: 610, spentPoints: 0, availablePoints: 610,
          purchasedArticleIds: [], entitledFigureIds: ['explorer-girl'], entitledEvolutionIds: [],
        }},
        jobs: [], selection: [{profileId: 'p1', figureId: 'explorer-girl', stage: 1}], control: null,
      };
      const fixture = {
        previewCalls: 0, confirmCalls: 0, releasePreview, releaseConfirm,
        commerce: {
          isConnected: () => true,
          getView: async () => structuredClone(view),
          preview: async ({profileId, articleId}) => {
            fixture.previewCalls += 1;
            await previewGate;
            return {version: 1, previewId: 'preview-1', stateHash: 'state-1', head: view.head,
              profileId, articleId, price: 600, availablePoints: 610};
          },
          confirm: async () => {
            fixture.confirmCalls += 1;
            await confirmGate;
            view.accounts.p1.availablePoints = 10;
            view.accounts.p1.spentPoints = 600;
            view.accounts.p1.purchasedArticleIds.push('deer-mist');
            view.accounts.p1.entitledFigureIds.push('deer-mist');
            view.accounts.p1.entitledEvolutionIds.push('evolution:deer-mist:1');
            view.jobs = [{status: 'confirmed', intent: {operationId: 'progress-proof', profileId: 'p1', articleId: 'deer-mist'}}];
            return {status: 'confirmed', operationId: 'progress-proof'};
          },
        },
      };
      fixture.render = () => renderPurchases({
        root, profileId: 'p1', commerce: fixture.commerce, online: true,
        onRefresh: fixture.render,
      });
      window.__purchaseProgress = fixture;
      fixture.render();
    });

    const root = page.locator('#purchase-progress-fixture');
    await root.getByRole('button', {name: 'Shop', exact: true}).click();
    const buy = root.locator('.commerce-card').filter({hasText: 'Nebelhirsch'})
      .getByRole('button', {name: 'Für 600 Punkte freischalten'});
    await buy.waitFor();
    await buy.evaluate((node) => {
      window.__staleBuy = node;
      node.click(); node.click();
    });
    await root.getByText('Kaufangebot wird geprüft …', {exact: true}).waitFor();
    assert.equal(await root.getByText('Kaufangebot wird geprüft …').getAttribute('role'), 'status');
    assert.equal(await buy.isDisabled(), true);
    await page.evaluate(() => window.__staleBuy.click());
    assert.equal(await page.evaluate(() => window.__purchaseProgress.previewCalls), 1);
    assert.equal(await page.getByRole('dialog', {name: 'Kauf prüfen'}).count(), 0);

    await page.evaluate(() => window.__purchaseProgress.releasePreview());
    const dialog = page.getByRole('dialog', {name: 'Kauf prüfen'});
    await dialog.waitFor();
    assert.equal(await dialog.count(), 1);
    await page.keyboard.press('Escape');
    await page.locator('dialog.purchase-dialog').waitFor({state: 'detached'});
    assert.equal(await buy.isDisabled(), false);
    await buy.click();
    await dialog.waitFor();
    const confirm = dialog.getByRole('button', {name: 'Kauf verbindlich bestätigen'});
    await confirm.evaluate((node) => { node.click(); node.click(); });
    await dialog.getByRole('status').filter({hasText: 'Kauf wird abgeschlossen …'}).waitFor();
    await page.keyboard.press('Escape');
    assert.equal(await dialog.isVisible(), true);
    await root.getByText('Kauf wird bestätigt …', {exact: true}).waitFor();
    assert.equal(await root.getByText('Kauf wird bestätigt …').getAttribute('role'), 'status');
    assert.equal(await root.getByText('Der Kauf ist bestätigt.', {exact: true}).count(), 0);
    assert.equal(await confirm.isDisabled(), true);
    assert.equal(await page.evaluate(() => window.__purchaseProgress.confirmCalls), 1);
    await page.evaluate(() => window.__purchaseProgress.releaseConfirm());
    await root.getByText('Der Kauf ist bestätigt.', {exact: true}).waitFor();
    assert.equal(await dialog.count(), 0);
  } finally {
    await harness.close();
  }
});
