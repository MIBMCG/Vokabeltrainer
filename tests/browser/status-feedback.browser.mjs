import test from 'node:test';
import assert from 'node:assert/strict';

import {createTrainerHarness} from './trainer-harness.mjs';

test('update notice follows actual waiting version and disappears after another client activates it', {timeout: 60_000}, async () => {
  const harness = await createTrainerHarness();
  const {page, context} = await harness.newDevice();
  try {
    await page.goto(harness.baseUrl);
    await page.locator('#dataset-name').waitFor();
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    assert.equal(await page.locator('#update-notice').count(), 0, 'first installation is not an available update');

    harness.setServiceWorkerVersion('v53');
    await page.evaluate(async () => {
      await (await navigator.serviceWorker.getRegistration('./')).update();
    });
    await page.waitForFunction(async () => Boolean((await navigator.serviceWorker.getRegistration('./'))?.waiting));
    await page.reload();
    await page.locator('#dataset-name').waitFor();
    await page.locator('#update-notice').waitFor();
    await page.locator('#dataset-name').fill('Ungespeicherter Entwurf');

    // A separate synthetic client activates the shared worker. The first tab
    // must remove its stale notice without reloading or losing its draft.
    const other = await context.newPage();
    await other.goto(harness.baseUrl);
    await other.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await other.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration('./');
      registration.active.postMessage({type: 'REQUEST_UPDATE_ACTIVATION', requestId: 'other-synthetic-client'});
    });
    await page.waitForFunction(async () => {
      const registration = await navigator.serviceWorker.getRegistration('./');
      return registration.active?.state === 'activated' && registration.waiting === null;
    });
    await page.locator('#update-notice').waitFor({state: 'detached'});
    assert.equal(await page.locator('#dataset-name').inputValue(), 'Ungespeicherter Entwurf');

    await page.reload();
    await page.locator('#dataset-name').waitFor();
    assert.equal(await page.locator('#update-notice').count(), 0, 'active version has no update action');
  } finally {
    await harness.close();
  }
});
