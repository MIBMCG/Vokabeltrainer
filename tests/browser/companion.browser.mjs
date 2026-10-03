import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {createTrainerHarness} from './trainer-harness.mjs';
const evidence = process.env.COMPANION_EVIDENCE_DIR;
async function fixture(page, baseUrl) {
  await page.goto(baseUrl);
  await page.locator('#dataset-name').waitFor();
  await page.evaluate(async () => {
    const {renderJourney, renderAvatar} = await import('/src/trainer/ui/rewards.js');
    const {createCommands} = await import('/src/trainer/commands.js');
    const {project} = await import('/src/trainer/learning/progress.js');
    document.querySelector('#app').replaceChildren();
    const root = document.createElement('div'); root.id = 'companion-fixture'; document.querySelector('#app').append(root);
    let stored = null; let serial = 0;
    const commands = await createCommands({store: {load: async () => stored, save: async value => {stored = structuredClone(value);}}, deviceId: 'companion-browser', id: () => `fixture-${++serial}`, now: () => new Date('2026-10-03T10:00:00Z'), onChange: () => {window.drawCompanion?.();}});
    await commands.setup({name: 'Synthetische Insel', timeZone: 'Europe/Berlin'});
    for (const id of ['ada', 'ben']) await commands.revise({entityType: 'profile', entityId: id, expectedHeads: [], value: {name: id, archived: false}});
    window.companionView = {mode: 'active', accounts: {
      ada: {earnedPoints: 2400, availablePoints: 400, entitledFigureIds: ['explorer-girl', 'dragon'], entitledEvolutionIds: ['evolution:explorer-girl:1', 'evolution:explorer-girl:2', 'evolution:dragon:1', 'evolution:dragon:3']},
      ben: {earnedPoints: 1000, availablePoints: 200, entitledFigureIds: ['tiger'], entitledEvolutionIds: ['evolution:tiger:1', 'evolution:tiger:2']},
    }, selection: [{profileId: 'ada', figureId: 'dragon', stage: 3}, {profileId: 'ben', figureId: 'tiger', stage: 2}], jobs: [], head: null, control: null};
    window.companionBefore = JSON.stringify(window.companionView.accounts);
    window.companionProfile = 'ada'; window.companionSurface = 'avatar';
    const commerce = {getView: async () => structuredClone(window.companionView), isConnected: () => true};
    window.drawCompanion = () => {
      const product = commands.getState(); const profile = project(product.ledger).profiles[window.companionProfile];
      const state = {...product, commerce: window.companionView};
      const common = {root, profile, profileId: window.companionProfile, commerce, onNavigate: value => {window.navigation = value;}};
      if (window.companionSurface === 'avatar') renderAvatar({...common, state, commands, onRefresh: window.drawCompanion});
      else renderJourney({...common, productState: state});
    };
    window.companionCommands = commands;
    window.drawCompanion();
  });
}
async function shot(page, name) {if (evidence) {await mkdir(evidence, {recursive: true}); await page.screenshot({path: `${evidence}/${name}.png`, fullPage: true});}}
async function withFixture(run, options = {}) {
  const harness = await createTrainerHarness(); const device = await harness.newDevice(options);
  try {await fixture(device.page, harness.baseUrl); await run(device, harness);} finally {await harness.close();}
}
test('selected biography grants exact owned titles and rerenders do not repeat motion', {timeout: 60000}, async () => withFixture(async ({page}) => {
  await page.locator('.companion-biography').waitFor();
  const titles = page.locator('.companion-titles li'); assert.equal(await titles.count(), 2);
  assert.match(await titles.nth(0).innerText(), /Stufe 1/); assert.match(await titles.nth(1).innerText(), /Stufe 3/);
  assert.equal(await page.locator('.selected-purchase-figure .companion-figure').getAttribute('data-animate'), 'true');
  await page.getByRole('button', {name: 'Entwicklung', exact: true}).click();
  await page.getByRole('button', {name: 'Meine Figur', exact: true}).click();
  assert.equal(await page.locator('.selected-purchase-figure .companion-figure').getAttribute('data-animate'), 'false');
  assert.equal(await page.evaluate(() => JSON.stringify(window.companionView.accounts) === window.companionBefore), true);
  await shot(page, 'task1-avatar-dragon');
}));
test('shared motion preference saves with real commands for animal, human and classic selections', {timeout: 60000}, async () => withFixture(async ({page}) => {
  await page.locator('.companion-biography').waitFor();
  const motion = page.getByRole('switch', {name: 'Kurze Bewegungen anzeigen'}); await motion.uncheck();
  await page.waitForFunction(() => !document.querySelector('[role="switch"]').checked);
  assert.equal(await page.evaluate(() => window.companionCommands.getState().ledger.events.some(event => event.animations === false || event.payload?.animations === false)), true);
  for (const figure of ['explorer-girl', null]) {
    await page.evaluate(figure => {window.companionView.selection = figure ? [{profileId: 'ada', figureId: figure, stage: 2}] : []; window.drawCompanion();}, figure);
    assert.equal(await motion.isChecked(), false); assert.equal(await motion.isVisible(), true);
    if (figure) await page.locator('.companion-biography').waitFor();
  }
  await motion.check(); assert.equal(await motion.isChecked(), true);
}));
test('journey collection belongs to the current profile and navigation preserves explicit selection', {timeout: 60000}, async () => withFixture(async ({page}) => {
  await page.evaluate(() => {window.companionSurface = 'journey'; window.drawCompanion();});
  await page.locator('.companion-collection article[data-figure-id="dragon"]').waitFor();
  assert.equal(await page.locator('.companion-collection article').count(), 2);
  assert.match(await page.locator('.companion-home').innerText(), /Dra.*chen/u);
  await page.getByRole('button', {name: 'Figuren auswählen', exact: true}).click(); assert.equal(await page.evaluate(() => window.navigation), 'avatar');
  await page.evaluate(() => {window.companionProfile = 'ben'; window.drawCompanion();});
  await page.locator('.companion-collection article[data-figure-id="tiger"]').waitFor();
  assert.equal(await page.locator('.companion-collection article').count(), 1);
  assert.equal(await page.locator('.companion-collection article[data-figure-id="dragon"]').count(), 0);
  assert.equal(await page.evaluate(() => JSON.stringify(window.companionView.accounts) === window.companionBefore), true);
  await shot(page, 'task1-journey-tiger');
}));
test('journey ignores stale views and offers truthful inactive and error fallbacks', {timeout: 60000}, async () => withFixture(async ({page}) => {
  const result = await page.evaluate(async () => {
    const {renderJourney} = await import('/src/trainer/ui/rewards.js');
    const root = document.querySelector('#companion-fixture'); const state = window.companionCommands.getState();
    const {project} = await import('/src/trainer/learning/progress.js'); const profiles = project(state.ledger).profiles;
    let resolveOld; renderJourney({root, profileId: 'ada', profile: profiles.ada, productState: {...state, commerce: window.companionView}, commerce: {getView: () => new Promise(resolve => {resolveOld = resolve;})}});
    renderJourney({root, profileId: 'ben', profile: profiles.ben, productState: {...state, commerce: window.companionView}, commerce: {getView: async () => window.companionView}});
    await new Promise(resolve => setTimeout(resolve, 0)); resolveOld(window.companionView); await new Promise(resolve => setTimeout(resolve, 0));
    return root.querySelector('.companion-home').textContent;
  }); assert.match(result, /Tiger/); assert.doesNotMatch(result, /Dra.*chen/u);
  await page.evaluate(() => {window.companionSurface = 'journey'; window.companionView.mode = 'inactive'; window.drawCompanion();});
  await page.getByText('Dein klassischer Avatar hat hier seinen Platz.', {exact: true}).waitFor();
  await page.evaluate(async () => {
    const {renderJourney} = await import('/src/trainer/ui/rewards.js'); const {project} = await import('/src/trainer/learning/progress.js'); const state = window.companionCommands.getState();
    renderJourney({root: document.querySelector('#companion-fixture'), profileId: 'ada', profile: project(state.ledger).profiles.ada, productState: state, commerce: {getView: async () => {throw new Error('lokal unvollständig');}}});
  }); await page.getByText('Deine Sammlung konnte gerade nicht gelesen werden. Dein klassischer Avatar bleibt verfügbar.', {exact: true}).waitFor();
}));
test('narrow enlarged text, reduced motion and missing art keep biography and collection usable', {timeout: 60000}, async () => withFixture(async ({page}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.locator('.companion-biography').waitFor();
  assert.equal(await page.locator('.companion-figure').first().evaluate(node => getComputedStyle(node.firstElementChild).animationName), 'none');
  for (const width of [320, 390]) {
    await page.setViewportSize({width, height: 900}); await page.evaluate(() => {document.documentElement.style.fontSize = '200%';});
    for (const surface of ['avatar', 'journey']) {
      await page.evaluate(surface => {window.companionSurface = surface; window.drawCompanion();}, surface);
      await page.locator(surface === 'avatar' ? '.companion-biography' : '.companion-collection').waitFor();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1); assert.equal(overflow, false, `${width} ${surface} must not overflow`);
      await shot(page, `task1-${surface}-${width}-200`);
    }
  }
  await page.evaluate(() => {document.querySelectorAll('.companion-figure img').forEach(img => {img.dispatchEvent(new Event('error')); img.dispatchEvent(new Event('error'));});});
  assert.equal(await page.locator('.companion-home > h2').isVisible(), true);
  assert.equal(await page.locator('.companion-home .evolution-art-unavailable').isVisible(), true);
  await shot(page, 'task1-missing-art');
}));
test('new presentation modules and journey remain available after service worker offline reload', {timeout: 60000}, async () => withFixture(async ({page, context}) => {
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true); await page.reload(); await page.locator('#dataset-name').waitFor();
  await fixture(page, page.url()); await page.evaluate(() => {window.companionSurface = 'journey'; window.drawCompanion();});
  await page.locator('.companion-collection').waitFor();
  assert.equal(await page.locator('.companion-collection article').count(), 2);
}));






test('shared movement save failure restores its checkbox and keyboard focus beside the error', {timeout: 60000}, async () => withFixture(async ({page}) => {
  await page.evaluate(async () => {
    const {renderAvatar} = await import('/src/trainer/ui/rewards.js'); const {project} = await import('/src/trainer/learning/progress.js'); const state = window.companionCommands.getState();
    renderAvatar({root: document.querySelector('#companion-fixture'), profileId: 'ada', profile: project(state.ledger).profiles.ada, state: {...state, commerce: window.companionView}, commerce: {getView: async () => window.companionView, isConnected: () => true}, commands: {...window.companionCommands, setAnimations: () => new Promise((_resolve, reject) => {window.rejectCompanionMotion = reject;})}});
  });
  const motion = page.getByRole('switch', {name: 'Kurze Bewegungen anzeigen'});
  await motion.focus(); await page.keyboard.press('Space'); assert.equal(await motion.isDisabled(), true);
  await page.evaluate(() => window.rejectCompanionMotion(new Error('Synthetischer Bewegungs-Speicherfehler')));
  await page.getByText('Synthetischer Bewegungs-Speicherfehler', {exact: true}).waitFor();
  assert.equal(await motion.isChecked(), true); assert.equal(await motion.isDisabled(), false);
  assert.equal(await motion.evaluate(node => node === document.activeElement), true, 'keyboard focus must return to the restored switch');
}));

