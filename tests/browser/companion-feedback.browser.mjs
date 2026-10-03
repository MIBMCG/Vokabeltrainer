import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {createTrainerHarness} from './trainer-harness.mjs';
import {createFixture} from '../trainer/fixtures.js';
const evidence = process.env.COMPANION_EVIDENCE_DIR;
async function shot(page, name) {if (evidence) {await mkdir(evidence, {recursive: true}); await page.screenshot({path: `${evidence}/${name}.png`, fullPage: true});}}
function learningFixture(kind = 'recovered') {
  const f = createFixture(); const wrong = f.answer({id: 'wrong', ordinal: 1, correct: false}); const answer = f.answer({id: 'correct', ordinal: 2});
  const events = [f.roundStarted, wrong, answer];
  if (kind === 'recovered') events.push(f.event('word.milestone', {profileId: 'p1', wordId: 'w1', milestone: 'recovered', evidenceAnswerIds: ['wrong', 'correct']}));
  if (kind === 'completed') events.push(f.event('round.completed', {roundId: 'r1', profileId: 'p1', reason: 'exhausted', answerIds: ['wrong', 'correct']}));
  const round = {id: 'r1', profileId: 'p1', epochId: 'e0', size: 10, status: kind === 'completed' ? 'completed' : 'feedback', answeredIds: ['wrong', 'correct'], current: kind === 'completed' ? null : answer.payload, feedback: kind === 'completed' ? null : {answerId: 'correct', correct: true, typed: 'dog', solutions: ['dog']}};
  return {ledger: f.withEvents(...events), rounds: {p1: round}, commerce: {mode: 'active', selection: [{profileId: 'p1', figureId: 'dragon', stage: 1}]}};
}
async function setup(page, url) {
  await page.goto(url); await page.locator('#dataset-name').waitFor();
  await page.evaluate(async () => {
    const {renderPurchases} = await import('/src/trainer/ui/purchases.js');
    document.querySelector('#app').replaceChildren(); const root = document.createElement('div'); root.id = 'feedback-fixture'; document.querySelector('#app').append(root);
    window.feedbackProfile = 'p1'; window.feedbackMotion = true; window.feedbackMode = 'confirmed'; window.feedbackCalls = [];
    window.feedbackView = {mode: 'active', accounts: {p1: {earnedPoints: 1000, availablePoints: 800, entitledFigureIds: ['dragon'], entitledEvolutionIds: ['evolution:dragon:1']}}, jobs: [], selection: [{profileId: 'p1', figureId: 'dragon', stage: 1}]};
    const result = () => {
      if (window.feedbackMode === 'network' || window.feedbackMode === 'auth' || window.feedbackMode === 'stale') {const error = new Error('synthetischer Fehler'); error.code = window.feedbackMode; throw error;}
      if (window.feedbackMode === 'confirmed') {window.feedbackView.accounts.p1.entitledEvolutionIds.push('evolution:dragon:2'); window.feedbackView.jobs = [{status: 'confirmed', intent: {operationId: 'op1', profileId: 'p1', articleId: 'evolution:dragon:2'}}];}
      return {status: window.feedbackMode, operationId: 'op1'};
    };
    window.feedbackCommerce = {getView: async () => {window.feedbackCalls.push('getView'); return structuredClone(window.feedbackView);}, isConnected: () => true,
      preview: async ({profileId, articleId}) => {window.feedbackCalls.push('preview'); return {profileId, articleId, price: 200, availablePoints: 800};},
      confirm: async () => {window.feedbackCalls.push('confirm'); if (window.feedbackMode === 'deferred') return new Promise(resolve => {window.finishFeedbackPurchase = () => {window.feedbackMode = 'confirmed'; resolve(result());};}); return result();},
      resume: async () => {window.feedbackCalls.push('resume'); if (window.feedbackMode === 'deferred') return new Promise(resolve => {window.finishFeedbackPurchase = () => {window.feedbackMode = 'confirmed'; resolve(result());};}); return result();},
      select: async selection => {window.feedbackCalls.push('select'); window.feedbackView.selection = [selection];},
    };
    window.drawFeedbackPurchase = () => renderPurchases({root, profileId: window.feedbackProfile, commerce: window.feedbackCommerce, animations: window.feedbackMotion, online: true});
    window.drawFeedbackPractice = async state => {const {renderPractice} = await import('/src/trainer/ui/practice.js'); window.feedbackLearning = state; renderPractice({root, state, profileId: 'p1', commands: {next: async () => {window.feedbackNext = true;}}, onNavigate: path => {window.feedbackNavigation = path;}});};
    window.drawFeedbackPurchase();
  });
  await page.getByRole('button', {name: 'Entwicklung', exact: true}).click();
}
async function purchase(page) {await page.getByRole('button', {name: 'Für 200 Punkte entwickeln', exact: true}).click(); await page.locator('dialog img').evaluate(img => {window.feedbackPreviewArt = img;}); await page.getByRole('button', {name: 'Kauf verbindlich bestätigen', exact: true}).click();}
async function withFixture(run, options = {}) {const harness = await createTrainerHarness(); const device = await harness.newDevice(options); try {await setup(device.page, harness.baseUrl); await run(device, harness);} finally {await harness.close();}}
test('confirmed unlock reuses preview art, has immediate actions and skip without extra commerce calls', {timeout: 60000}, async () => withFixture(async ({page}) => {
  await purchase(page); await page.getByRole('heading', {name: 'Freigeschaltet', exact: true}).waitFor();
  assert.equal(await page.locator('dialog .companion-moment[data-kind="purchase"]').count(), 1);
  assert.equal(await page.locator('dialog .companion-figure').getAttribute('data-animate'), 'true');
  assert.equal(await page.locator('dialog img').evaluate(img => img === window.feedbackPreviewArt), true, 'already-loaded preview art is reused');
  assert.equal(await page.locator('dialog .companion-figure').evaluate(node => getComputedStyle(node.firstElementChild).animationDuration), '1.2s');
  assert.equal(await page.getByRole('button', {name: 'Jetzt auswählen', exact: true}).isEnabled(), true);
  assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Jetzt auswählen');
  assert.deepEqual(await page.evaluate(() => window.feedbackCalls), ['getView', 'preview', 'confirm', 'getView']);
  assert.equal(await page.evaluate(() => window.feedbackView.selection[0].stage), 1);
  await shot(page, 'task2-confirmed'); await page.getByRole('button', {name: 'Überspringen', exact: true}).click();
  assert.equal(await page.locator('dialog .companion-figure').getAttribute('data-animate'), 'false');
  await page.getByRole('button', {name: 'Jetzt auswählen', exact: true}).click(); assert.equal(await page.locator('dialog').count(), 0);
  assert.equal(await page.evaluate(() => window.feedbackView.selection[0].stage), 2);
}));
for (const mode of ['open', 'rejected', 'superseded', 'network', 'auth', 'stale']) test(`no celebration for ${mode}`, {timeout: 60000}, async () => withFixture(async ({page}) => {
  await page.evaluate(mode => {window.feedbackMode = mode;}, mode); await purchase(page);
  await page.waitForFunction(() => window.feedbackCalls.filter(call => call === 'getView').length === 2);
  assert.equal(await page.getByRole('heading', {name: 'Freigeschaltet', exact: true}).count(), 0); assert.equal(await page.locator('.companion-moment').count(), 0); assert.doesNotMatch(await page.locator('body').innerText(), /Der Kauf ist bestätigt|gehört jetzt dir/);
}));
async function resumedFixture(page, mode = 'confirmed') {
  await page.evaluate(async mode => {
    window.feedbackMode = mode;
    window.feedbackView.jobs = [{status: 'open', intent: {operationId: 'op1', profileId: 'p1', articleId: 'evolution:dragon:2'}, attempts: []}];
    const {renderPurchases} = await import('/src/trainer/ui/purchases.js');
    const freshRoot = document.createElement('div'); freshRoot.id = 'feedback-fixture';
    document.querySelector('#app').replaceChildren(freshRoot);
    renderPurchases({root: freshRoot, profileId: 'p1', commerce: window.feedbackCommerce, animations: true, online: true});
  }, mode);
  await page.getByRole('button', {name: 'Kauf fortsetzen', exact: true}).waitFor();
}
for (const mode of ['open', 'rejected', 'superseded', 'network', 'auth', 'stale']) test('no resumed celebration or success text for ' + mode, {timeout: 60000}, async () => withFixture(async ({page}) => {
  await resumedFixture(page, mode); const before = await page.evaluate(() => window.feedbackCalls.length);
  await page.getByRole('button', {name: 'Kauf fortsetzen', exact: true}).click();
  await page.waitForFunction(before => window.feedbackCalls.length === before + 2, before);
  assert.equal(await page.locator('dialog').count(), 0); assert.equal(await page.locator('.companion-moment').count(), 0);
  assert.doesNotMatch(await page.locator('body').innerText(), /Der Kauf ist bestätigt|gehört jetzt dir/);
}));
test('confirmed resumed unlock follows identical success path and Escape is immediate', {timeout: 60000}, async () => withFixture(async ({page}) => {
  await resumedFixture(page);
  await page.getByRole('button', {name: 'Kauf fortsetzen', exact: true}).click();
  await page.getByRole('heading', {name: 'Freigeschaltet', exact: true}).waitFor(); assert.equal(await page.locator('dialog .companion-moment').count(), 1);
  await page.keyboard.press('Escape'); await page.locator('dialog').waitFor({state: 'detached'}); assert.equal(await page.locator('dialog').count(), 0); await shot(page, 'task2-resumed');
}));
test('profile switched during confirmation does not receive another profile unlock', {timeout: 60000}, async () => withFixture(async ({page}) => {
  await page.evaluate(() => {window.feedbackMode = 'deferred';}); await purchase(page);
  await page.evaluate(() => {window.feedbackProfile = 'p2'; window.drawFeedbackPurchase(); window.finishFeedbackPurchase();});
  await page.waitForFunction(() => window.feedbackCalls.filter(call => call === 'getView').length === 2);
  assert.equal(await page.locator('.companion-moment').count(), 0); assert.equal(await page.getByRole('heading', {name: 'Freigeschaltet', exact: true}).count(), 0);
}));
test('saved recovery and valid short completion keep encouraging text, dedupe motion and next focus', {timeout: 60000}, async () => withFixture(async ({page}) => {
  await page.evaluate(state => window.drawFeedbackPractice(state), learningFixture()); await page.locator('.companion-moment[data-kind="recovered"]').waitFor();
  assert.equal(await page.locator('#practice-next').evaluate(node => node === document.activeElement), true);
  await shot(page, 'task2-recovered'); await page.evaluate(() => window.drawFeedbackPractice(window.feedbackLearning));
  assert.equal(await page.locator('.companion-moment .companion-figure').getAttribute('data-animate'), 'false');
  assert.match(await page.locator('.companion-moment').innerText(), /Fehler\u00ad?wort/);
  await page.locator('#practice-next').click(); assert.equal(await page.evaluate(() => window.feedbackNext), true);
  await page.evaluate(state => window.drawFeedbackPractice(state), learningFixture('ordinary')); assert.equal(await page.locator('.companion-moment').count(), 0);
  await page.evaluate(state => window.drawFeedbackPractice(state), learningFixture('completed')); await page.locator('.companion-moment[data-kind="completed"]').waitFor();
  await page.getByRole('button', {name: 'Neue Runde', exact: true}).click(); assert.equal(await page.evaluate(() => window.feedbackNavigation), 'practice-landing'); await shot(page, 'task2-completed-short');
}));
test('motion preference, OS reduction, missing art and 320/390px 200% preserve immediate controls', {timeout: 60000}, async () => withFixture(async ({page}) => {
  await page.evaluate(() => {window.feedbackMotion = false; window.drawFeedbackPurchase();}); await purchase(page); await page.getByRole('heading', {name: 'Freigeschaltet', exact: true}).waitFor();
  assert.equal(await page.locator('dialog .companion-figure').getAttribute('data-animate'), 'false'); await page.keyboard.press('Escape'); await page.locator('dialog').waitFor({state: 'detached'});
  await page.emulateMedia({reducedMotion: 'reduce'}); await page.evaluate(state => window.drawFeedbackPractice(state), learningFixture());
  assert.equal(await page.locator('.companion-moment .companion-figure').evaluate(node => getComputedStyle(node.firstElementChild).animationName), 'none');
  for (const width of [320, 390]) {await page.setViewportSize({width, height: 900}); await page.evaluate(() => {document.documentElement.style.fontSize = '200%';});
    for (const kind of ['recovered', 'completed']) {await page.evaluate(state => window.drawFeedbackPractice(state), learningFixture(kind)); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false); await shot(page, `task2-${kind}-${width}-200`);}}
  await page.evaluate(() => document.querySelectorAll('.companion-moment img').forEach(img => {img.dispatchEvent(new Event('error')); img.dispatchEvent(new Event('error'));}));
  assert.equal(await page.getByRole('button', {name: 'Neue Runde', exact: true}).isEnabled(), true);
}));
test('saved reaction remains usable offline after service worker reload', {timeout: 60000}, async () => withFixture(async ({page, context}) => {
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null); await context.setOffline(true); await page.reload();
  await setup(page, page.url()); await page.evaluate(state => window.drawFeedbackPractice(state), learningFixture()); await page.locator('.companion-moment').waitFor(); assert.equal(await page.locator('#practice-next').isEnabled(), true); await shot(page, 'task2-offline');
}));

test('saved learning preference, classic figure and failed/stale evidence keep truthful static feedback', {timeout: 60000}, async () => withFixture(async ({page}) => {
  const state = learningFixture(); state.commerce.selection = [];
  state.ledger.events.push({...state.ledger.events.at(-1), id: 'motion-off', clock: 100, type: 'preference.changed', payload: {profileId: 'p1', animations: false}});
  await page.evaluate(state => window.drawFeedbackPractice(state), state);
  assert.equal(await page.locator('.companion-moment .avatar-art').count(), 1);
  assert.equal(await page.locator('.companion-moment .companion-figure').getAttribute('data-animate'), 'false');
  assert.equal(await page.getByRole('button', {name: 'Überspringen', exact: true}).count(), 0);
  for (const invalid of ['failed-save', 'stale-epoch', 'wrong-answer']) {
    const invalidState = learningFixture();
    if (invalid === 'failed-save') invalidState.ledger.events = invalidState.ledger.events.filter(event => event.id !== 'correct');
    if (invalid === 'stale-epoch') invalidState.rounds.p1.epochId = 'old';
    if (invalid === 'wrong-answer') invalidState.rounds.p1.feedback.correct = false;
    await page.evaluate(state => window.drawFeedbackPractice(state), invalidState);
    assert.equal(await page.locator('.companion-moment').count(), 0); assert.equal(await page.locator('#practice-next').isEnabled(), true);
  }
}));

test('purchase success stays usable at320/390px 200% and missing art never delays explicit selection', {timeout: 60000}, async () => withFixture(async ({page}) => {
  await purchase(page); await page.getByRole('heading', {name: 'Freigeschaltet', exact: true}).waitFor();
  for (const width of [320, 390]) {
    await page.setViewportSize({width, height: 900}); await page.evaluate(() => {document.documentElement.style.fontSize = '200%';});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    assert.equal(await page.locator('dialog').evaluate(node => node.scrollWidth > node.clientWidth + 1), false, 'success heading must fit inside dialog');
    for (const name of ['Jetzt auswählen', 'Später auswählen', 'Überspringen']) assert.equal(await page.getByRole('button', {name, exact: true}).isEnabled(), true);
    await shot(page, 'task2-purchase-' + width + '-200');
  }
  await page.evaluate(() => document.querySelectorAll('dialog img').forEach(img => {img.dispatchEvent(new Event('error')); img.dispatchEvent(new Event('error'));}));
  assert.equal(await page.getByRole('heading', {name: 'Freigeschaltet', exact: true}).count(), 1);
  assert.match(await page.locator('dialog').innerText(), /gehört jetzt dir/);
  assert.doesNotMatch(await page.locator('dialog').innerText(), /Dieser Kauf kann noch nicht bestätigt werden/);
  assert.equal(await page.locator('dialog .evolution-art-unavailable').count(), 1);
  await shot(page, 'task2-confirmed-missing-art-fixed');
  assert.equal(await page.getByRole('button', {name: 'Jetzt auswählen', exact: true}).isEnabled(), true);
  await page.getByRole('button', {name: 'Jetzt auswählen', exact: true}).click();
  await page.locator('dialog').waitFor({state: 'detached'});
  assert.equal(await page.evaluate(() => window.feedbackView.selection[0].stage), 2);
}));

test('unavailable preview artwork still blocks unconfirmed purchase without commerce confirmation', {timeout: 60000}, async () => withFixture(async ({page}) => {
  await page.getByRole('button', {name: 'Für 200 Punkte entwickeln', exact: true}).click();
  await page.waitForFunction(() => {const image = document.querySelector('dialog img'); return image?.complete && image.naturalWidth > 0;});
  await page.locator('dialog img').evaluate(img => {img.dataset.fallback = 'true'; img.dispatchEvent(new Event('error'));});
  assert.equal(await page.getByRole('button', {name: 'Kauf verbindlich bestätigen', exact: true}).isDisabled(), true);
  assert.match(await page.locator('dialog').innerText(), /Dieser Kauf kann noch nicht bestätigt werden/);
  assert.equal(await page.getByRole('heading', {name: 'Freigeschaltet', exact: true}).count(), 0);
  assert.equal(await page.evaluate(() => window.feedbackCalls.includes('confirm')), false);
  await page.getByRole('button', {name: 'Abbrechen', exact: true}).click();
  await page.locator('dialog').waitFor({state: 'detached'});
}));

async function replacePurchaseHost(page, context = 'same') {
  await page.evaluate(async context => {
    const {renderPurchases} = await import('/src/trainer/ui/purchases.js');
    window.feedbackOriginalHost = document.querySelector('#feedback-fixture');
    const owner = document.querySelector('#app'); owner.replaceChildren();
    if (context !== 'route-left') {
      const host = document.createElement('section'); host.id = 'feedback-fixture';
      if (context === 'different-owner') document.body.append(host); else owner.append(host);
      renderPurchases({root: host, profileId: 'p1', commerce: context === 'different-session' ? {...window.feedbackCommerce} : window.feedbackCommerce, animations: true, online: true});
    } else owner.textContent = 'Synthetische andere Ansicht';
    window.finishFeedbackPurchase();
  }, context);
}
for (const mode of ['confirm', 'resume']) test('confirmed ' + mode + ' accepts current same-context replacement host', {timeout: 60000}, async () => withFixture(async ({page}) => {
  if (mode === 'resume') {await resumedFixture(page, 'deferred'); await page.getByRole('button', {name: 'Kauf fortsetzen', exact: true}).click();}
  else {await page.evaluate(() => {window.feedbackMode = 'deferred';}); await purchase(page);}
  const before = await page.evaluate(() => window.feedbackCalls.filter(call => call === 'getView').length);
  await replacePurchaseHost(page); await page.waitForFunction(before => window.feedbackCalls.filter(call => call === 'getView').length === before + 1, before);
  assert.equal(await page.evaluate(() => window.feedbackOriginalHost.isConnected), false);
  assert.equal(await page.getByRole('heading', {name: 'Freigeschaltet', exact: true}).count(), 1, 'valid persisted success survives same-context host replacement');
  assert.equal(await page.getByRole('button', {name: 'Jetzt auswählen', exact: true}).isEnabled(), true);
  assert.equal(await page.evaluate(() => window.feedbackView.selection[0].stage), 1);
  await shot(page, 'final-fix-' + mode + '-replacement');
  await page.keyboard.press('Escape'); await page.locator('dialog').waitFor({state: 'detached'});
}));
for (const context of ['route-left', 'different-session', 'different-owner']) test('confirmed result is rejected after ' + context, {timeout: 60000}, async () => withFixture(async ({page}) => {
  await page.evaluate(() => {window.feedbackMode = 'deferred';}); await purchase(page);
  await replacePurchaseHost(page, context); await page.waitForFunction(() => window.feedbackCalls.filter(call => call === 'getView').length >= 2);
  assert.equal(await page.getByRole('heading', {name: 'Freigeschaltet', exact: true}).count(), 0);
  assert.equal(await page.locator('dialog .companion-moment').count(), 0);
  assert.doesNotMatch(await page.locator('body').innerText(), /Der Kauf ist bestätigt|gehört jetzt dir/);
}));
