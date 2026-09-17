import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';

import {createTrainerHarness} from './trainer-harness.mjs';

const resultsDirectory = resolve('test-results');

async function productState(page) {
  return page.evaluate(() => new Promise((resolveState, reject) => {
    const request = indexedDB.open('vokabeltrainer-product-v1', 1);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('product-state')) {
        request.result.createObjectStore('product-state');
      }
    };
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction('product-state', 'readonly');
      const get = transaction.objectStore('product-state').get('current');
      get.onerror = () => reject(get.error);
      get.onsuccess = () => resolveState(get.result ?? null);
      transaction.oncomplete = () => database.close();
    };
  }));
}

async function writeProductState(page, state) {
  await page.evaluate((value) => new Promise((resolveWrite, reject) => {
    const request = indexedDB.open('vokabeltrainer-product-v1', 1);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('product-state')) {
        request.result.createObjectStore('product-state');
      }
    };
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction('product-state', 'readwrite');
      transaction.objectStore('product-state').put(value, 'current');
      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => { database.close(); resolveWrite(); };
    };
  }), state);
}

async function seedOneCorrectAnswer(page, state) {
  const profile = state.ledger.events.find((event) => (
    event.type === 'entity.revised' && event.payload.entityType === 'profile'
  ));
  const word = state.ledger.events.find((event) => (
    event.type === 'entity.revised' && event.payload.entityType === 'word'
  ));
  const next = structuredClone(state);
  const envelope = {
    format: 'vokabeltrainer-product', formatVersion: 1, ruleVersion: 1, kind: 'event',
    datasetId: state.ledger.descriptor.datasetId,
    epochId: state.ledger.descriptor.rootEpochId,
    deviceId: state.deviceId,
    occurredAt: '2026-09-17T10:00:00.000Z', day: '2026-09-17',
  };
  const started = {
    ...envelope, id: 'browser-history-round-start', clock: state.clock + 1,
    type: 'round.started',
    payload: {roundId: 'browser-history-round', profileId: profile.payload.entityId, mode: 'all', size: 10},
  };
  const answer = {
    ...envelope, id: 'browser-history-answer', clock: state.clock + 2,
    type: 'answer.recorded',
    payload: {
      roundId: 'browser-history-round', profileId: profile.payload.entityId, ordinal: 1,
      wordId: word.payload.entityId, revisionId: word.id,
      learningId: word.payload.value.learningId, correct: true,
    },
  };
  next.clock = answer.clock;
  next.ledger.events.push(started, answer);
  next.outboxEventIds.push(started.id, answer.id);
  await writeProductState(page, next);
}

async function holdNextPinDerivation(page) {
  await page.evaluate(() => {
    if (!window.__originalPinDeriveBits) {
      window.__originalPinDeriveBits = crypto.subtle.deriveBits.bind(crypto.subtle);
      crypto.subtle.deriveBits = async (...args) => {
        if (window.__holdPinDerivation) {
          window.__pinDerivationStarted = true;
          await window.__pinDerivationGate;
          window.__holdPinDerivation = false;
        }
        const result = await window.__originalPinDeriveBits(...args);
        window.__pinDerivationFinished = true;
        return result;
      };
    }
    window.__pinDerivationStarted = false;
    window.__pinDerivationFinished = false;
    window.__holdPinDerivation = true;
    window.__pinDerivationGate = new Promise((resolveGate) => {
      window.__releasePinDerivation = resolveGate;
    });
  });
}

async function backgroundDuringPinDerivation(page) {
  await page.waitForFunction(() => window.__pinDerivationStarted === true);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {value: 'hidden', configurable: true});
    document.dispatchEvent(new Event('visibilitychange'));
    window.__releasePinDerivation();
  });
  await page.waitForFunction(() => window.__pinDerivationFinished === true);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {value: 'visible', configurable: true});
  });
}

async function waitForVerifierChange(page, previousHash) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const current = await productState(page);
    if (current.pinVerifier?.hash !== previousHash) return current.pinVerifier.hash;
    await page.waitForTimeout(25);
  }
  throw new Error('PIN verifier did not change');
}

async function setupPractice(page, {
  profile = 'Ada',
  first = ['Hund', 'dog | hound'],
  second = ['Tier', 'dog | hound'],
} = {}) {
  await page.goto(page.url() || 'about:blank');
  await page.locator('#dataset-name').fill('Übungsinsel');
  await page.locator('#setup-pin').fill('1234');
  await page.locator('#setup-pin-repeat').fill('1234');
  await page.locator('#setup-profile').fill(profile);
  await page.locator('#setup-lesson').fill('Unit 1');
  await page.locator('#setup-word-1-german').fill(first[0]);
  await page.locator('#setup-word-1-answers').fill(first[1]);
  await page.locator('#setup-word-2-german').fill(second[0]);
  await page.locator('#setup-word-2-answers').fill(second[1]);
  await page.locator('#setup-submit').click();
  await page.locator('#profile-list').waitFor();
}

async function addSecondProfile(page) {
  const state = await productState(page);
  const next = structuredClone(state);
  const lesson = [...next.ledger.events].reverse().find((event) => (
    event.type === 'entity.revised' && event.payload.entityType === 'lesson'
  ));
  const base = {
    format: 'vokabeltrainer-product', formatVersion: 1, ruleVersion: 1, kind: 'event',
    datasetId: next.ledger.descriptor.datasetId, epochId: next.ledger.descriptor.rootEpochId,
    deviceId: next.deviceId, occurredAt: '2026-09-17T12:00:00.000Z', day: '2026-09-17',
  };
  const profile = {
    ...base, id: 'browser-profile-ben', clock: next.clock + 1, type: 'entity.revised',
    payload: {entityType: 'profile', entityId: 'browser-p2', parents: [], value: {name: 'Ben', archived: false}},
  };
  const assignment = {
    ...base, id: 'browser-lesson-shared', clock: next.clock + 2, type: 'entity.revised',
    payload: {
      entityType: 'lesson', entityId: lesson.payload.entityId, parents: [lesson.id],
      value: {...lesson.payload.value, profileIds: [...lesson.payload.value.profileIds, 'browser-p2'].sort()},
    },
  };
  next.clock = assignment.clock;
  next.ledger.events.push(profile, assignment);
  next.outboxEventIds.push(profile.id, assignment.id);
  await writeProductState(page, next);
  await page.reload();
  await page.locator('#profile-list').waitFor().catch(async (error) => {
    error.message += `\nVisible page after second profile:\n${await page.locator('body').innerText()}`;
    throw error;
  });
}

test('trainer practice is resumable, single-submit safe and completes an exhausted round', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page, context} = await harness.newDevice();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await mkdir(resultsDirectory, {recursive: true});

  try {
    await page.goto(harness.baseUrl);
    await setupPractice(page);
    await addSecondProfile(page);
    await page.getByRole('button', {name: /^Ada/}).click();
    assert.equal(await page.getByRole('button', {name: 'Alle Vokabeln', exact: true}).count(), 1);
    assert.equal(await page.getByRole('button', {name: 'Letzte Vokabeln', exact: true}).count(), 1);
    assert.equal(await page.getByRole('button', {name: 'Neue Vokabeln', exact: true}).count(), 1);
    await page.getByLabel('20 Antworten').check();
    await page.getByLabel('10 Antworten').check();
    await page.getByRole('button', {name: 'Alle Vokabeln', exact: true}).click();

    const answer = page.getByLabel('Englische Übersetzung');
    await answer.fill('   ');
    await page.getByRole('button', {name: 'Prüfen', exact: true}).click();
    assert.equal((await productState(page)).ledger.events.filter(({type}) => type === 'answer.recorded').length, 0);
    assert.equal(await answer.inputValue(), '   ');

    await answer.fill('wrong');
    await page.evaluate(() => {
      const input = document.querySelector('#answer');
      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', repeat: true, bubbles: true}));
      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', isComposing: true, bubbles: true}));
      document.querySelector('#practice-submit').dispatchEvent(new MouseEvent('click', {bubbles: true}));
      document.querySelector('#practice-submit').dispatchEvent(new MouseEvent('click', {bubbles: true}));
    });
    await page.getByText('Noch nicht ganz', {exact: true}).waitFor();
    assert.equal((await productState(page)).ledger.events.filter(({type}) => type === 'answer.recorded').length, 1);
    await page.getByText('dog', {exact: true}).waitFor();
    await page.getByText('hound', {exact: true}).waitFor();
    assert.equal(await answer.inputValue(), 'wrong');
    assert.equal(await answer.isDisabled(), true);
    assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'Weiter');

    await page.reload();
    await page.getByText('Noch nicht ganz', {exact: true}).waitFor();
    assert.equal(await page.getByLabel('Englische Übersetzung').inputValue(), 'wrong');
    await page.getByRole('button', {name: 'Weiter', exact: true}).click();
    await page.getByLabel('Englische Übersetzung').fill('dog');
    await page.getByLabel('Englische Übersetzung').press('Enter');
    await page.getByText('Richtig!', {exact: true}).waitFor();
    assert.equal((await productState(page)).ledger.events.filter(({type}) => type === 'answer.recorded').length, 2);

    await page.getByRole('button', {name: 'Profil wechseln', exact: true}).click();
    await page.getByRole('button', {name: /^Ben/}).click();
    await page.getByRole('button', {name: 'Profil wechseln', exact: true}).click();
    await page.getByRole('button', {name: /^Ada/}).click();
    await page.getByRole('button', {name: 'Fortsetzen', exact: true}).click();
    await page.getByText('Richtig!', {exact: true}).waitFor();
    assert.match(await page.locator('.practice-points').textContent(), /10 Punkte/);

    await page.getByRole('button', {name: 'Weiter', exact: true}).click();
    let completedState;
    for (let index = 0; index < 20; index += 1) {
      completedState = await productState(page);
      const activeRound = Object.values(completedState.rounds).find(({status}) => !['completed', 'abandoned'].includes(status));
      if (activeRound.status === 'exhausted') break;
      if (activeRound.status === 'asking') {
        await page.getByLabel('Englische Übersetzung').fill('dog');
        await page.getByRole('button', {name: 'Prüfen', exact: true}).click();
      }
      await page.getByRole('button', {name: 'Weiter', exact: true}).click();
    }
    await page.getByRole('heading', {name: 'Für heute ist alles geschafft'}).waitFor();
    completedState = await productState(page);
    const exhaustedRound = Object.values(completedState.rounds).find(({status}) => status === 'exhausted');
    const expectedAnswers = exhaustedRound.answeredIds.length;
    await page.getByRole('button', {name: 'Runde beenden', exact: true}).click();
    await page.getByRole('heading', {name: 'Runde geschafft!'}).waitFor();
    assert.match(await page.locator('.round-summary').innerText(), new RegExp(`Antworten\\s*${expectedAnswers}`));
    assert.match(await page.locator('.round-summary').innerText(), new RegExp(`Antwortpunkte\\s*${(expectedAnswers - 1) * 10}`));
    assert.match(await page.locator('.round-summary').innerText(), /Rundenbonus\s*20/);

    await page.setViewportSize({width: 390, height: 844});
    await page.screenshot({path: resolve(resultsDirectory, 'trainer-summary-mobile.png'), fullPage: true});
    await page.setViewportSize({width: 1280, height: 900});
    await page.screenshot({path: resolve(resultsDirectory, 'trainer-summary-desktop.png'), fullPage: true});

    const expectedPoints = ((expectedAnswers - 1) * 10) + 20;
    await page.getByRole('button', {name: 'Neue Runde', exact: true}).click();
    await page.getByRole('button', {name: 'Neue Vokabeln', exact: true}).click();
    await page.getByRole('heading', {name: 'Hier gibt es gerade keine Vokabeln'}).waitFor();
    assert.equal(await page.getByRole('heading', {name: 'Runde geschafft!'}).count(), 0);
    await page.getByRole('button', {name: 'Andere Auswahl', exact: true}).click();
    await page.getByRole('button', {name: 'Neue Runde', exact: true}).click();
    await page.getByRole('button', {name: 'Alle Vokabeln', exact: true}).waitFor();
    await page.getByRole('button', {name: 'Profil wechseln', exact: true}).click();
    await page.locator('#adult-entry').click();
    await page.locator('#adult-pin').fill('1234');
    await page.locator('#adult-unlock').click();
    await page.getByRole('button', {name: 'Lektionen'}).click();
    await page.locator('[data-lesson-name="Unit 1"]').click();
    const addWord = page.locator('form').filter({has: page.getByRole('button', {name: 'Vokabel hinzufügen', exact: true})});
    await addWord.locator('input[name="german"]').fill('Schiff');
    await addWord.locator('input[name="answers"]').fill('ship');
    await addWord.getByRole('button', {name: 'Vokabel hinzufügen', exact: true}).click();
    await page.getByText('Die Vokabel wurde hinzugefügt.', {exact: true}).waitFor();
    await page.getByRole('button', {name: 'Zur Profilauswahl', exact: true}).click();
    await page.getByRole('button', {name: /^Ada/}).click();
    assert.match(await page.locator('.practice-points').textContent(), new RegExp(`${expectedPoints} Punkte`));
    await page.getByRole('button', {name: 'Alle Vokabeln', exact: true}).click();
    assert.match(await page.locator('.practice-points').textContent(), new RegExp(`${expectedPoints} Punkte`));

    const preserved = await page.evaluate(async (initialState) => {
      const {mountShell} = await import('../src/trainer/ui/shell.js');
      const profileId = Object.values(initialState.rounds).find(({status}) => status === 'asking').profileId;
      sessionStorage.setItem('vokabeltrainer-shell-v1', JSON.stringify({
        view: 'practice', profileId, practiceActive: true,
      }));
      let current = structuredClone(initialState);
      const host = document.createElement('div');
      document.body.append(host);
      const shell = mountShell({
        root: host,
        commands: {getState: () => structuredClone(current)},
        pinGate: {isUnlocked: () => false, lock() {}},
      });
      shell.render();
      const input = host.querySelector('#answer');
      input.value = 'unsent draft';
      input.focus();
      current.pendingPackets.push({kind: 'unrelated-background-update'});
      shell.stateChanged();
      const result = {
        sameNode: input === host.querySelector('#answer'),
        value: host.querySelector('#answer').value,
        focused: document.activeElement === input,
      };
      shell.destroy();
      host.remove();
      return result;
    }, await productState(page));
    assert.deepEqual(preserved, {sameNode: true, value: 'unsent draft', focused: true});

    await page.setViewportSize({width: 390, height: 844});
    await page.screenshot({path: resolve(resultsDirectory, 'trainer-practice-mobile.png'), fullPage: true});
    await page.setViewportSize({width: 1280, height: 900});
    await page.screenshot({path: resolve(resultsDirectory, 'trainer-practice-desktop.png'), fullPage: true});
    await page.setViewportSize({width: 320, height: 700});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
    await page.screenshot({path: resolve(resultsDirectory, 'trainer-practice-320.png'), fullPage: true});
    await page.setViewportSize({width: 390, height: 844});
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
    await page.screenshot({path: resolve(resultsDirectory, 'trainer-practice-200-percent.png'), fullPage: true});
    await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
    await page.emulateMedia({reducedMotion: 'reduce'});
    assert.equal(await page.locator('#practice-submit').evaluate((node) => getComputedStyle(node).transitionDuration), '0s');

    const beforeFailure = await productState(page);
    const beforeFailureAnswers = beforeFailure.ledger.events.filter(({type}) => type === 'answer.recorded').length;
    await page.evaluate(() => {
      const original = IDBObjectStore.prototype.put;
      let failNext = true;
      IDBObjectStore.prototype.put = function put(...args) {
        if (failNext) {
          failNext = false;
          throw new DOMException('synthetic full storage', 'QuotaExceededError');
        }
        return original.apply(this, args);
      };
    });
    await page.getByLabel('Englische Übersetzung').fill('ship');
    await page.getByRole('button', {name: 'Prüfen', exact: true}).click();
    await page.getByText('Die lokalen Produktdaten konnten nicht gespeichert werden.', {exact: true}).waitFor();
    assert.equal(await page.getByLabel('Englische Übersetzung').inputValue(), 'ship');
    assert.equal((await productState(page)).ledger.events.filter(({type}) => type === 'answer.recorded').length, beforeFailureAnswers);
    await page.getByRole('button', {name: 'Prüfen', exact: true}).click();
    await page.getByText('Richtig!', {exact: true}).waitFor();
    await page.getByRole('button', {name: 'Weiter', exact: true}).click();

    const staleGerman = await page.locator('.word-card h1').textContent();
    const answersBeforeRevision = (await productState(page)).ledger.events.filter(({type}) => type === 'answer.recorded').length;
    await page.getByRole('button', {name: 'Profil wechseln', exact: true}).click();
    await page.locator('#adult-entry').click();
    await page.locator('#adult-pin').fill('1234');
    await page.locator('#adult-unlock').click();
    await page.getByRole('button', {name: 'Lektionen'}).click();
    await page.locator('[data-lesson-name="Unit 1"]').click();
    const staleCard = page.locator(`[data-word-german="${staleGerman}"]`);
    await staleCard.locator('summary', {hasText: 'Bearbeiten'}).click();
    await staleCard.locator('input[name="answers"]').fill('changed-answer');
    await staleCard.getByRole('button', {name: 'Änderung speichern', exact: true}).click();
    await page.getByText('Die Vokabel wurde gespeichert.', {exact: true}).waitFor();
    await page.getByRole('button', {name: 'Zur Profilauswahl', exact: true}).click();
    await page.getByRole('button', {name: /^Ada/}).click();
    await page.getByRole('button', {name: 'Fortsetzen', exact: true}).click();
    await page.getByText('Die geänderte Vokabel wurde ohne Wertung übersprungen.', {exact: true}).waitFor();
    assert.equal((await productState(page)).ledger.events.filter(({type}) => type === 'answer.recorded').length, answersBeforeRevision);
    assert.deepEqual(pageErrors, []);
  } finally {
    await context.close();
    await harness.close();
  }
});

test('trainer setup, adult decisions, persistence and BFCache lifecycle', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const device = await harness.newDevice();
  const {page, context} = device;
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await mkdir(resultsDirectory, {recursive: true});

  try {
    await page.goto(harness.baseUrl);
    await page.keyboard.press('Tab');
    assert.match(await page.evaluate(() => document.activeElement?.textContent ?? ''), /Zum Inhalt/);
    const controlMetrics = await page.locator('button, input, textarea, select').evaluateAll((controls) => (
      controls.filter((control) => control.getClientRects().length).map((control) => ({
        height: control.getBoundingClientRect().height,
        fontSize: Number.parseFloat(getComputedStyle(control).fontSize),
      }))
    ));
    assert.ok(controlMetrics.every(({height}) => height >= 44));
    assert.ok(controlMetrics.filter((_, index) => index > 0).every(({fontSize}) => fontSize >= 16));
    const longAnswers = [150, 151, 152].map((length, index) => String.fromCharCode(97 + index).repeat(length)).join(' | ');
    assert.ok(longAnswers.length > 420);
    await page.locator('#dataset-name').fill('Familienwortschatz');
    await page.locator('#setup-pin').fill('1234');
    await page.locator('#setup-pin-repeat').fill('1234');
    await page.locator('#setup-profile').fill('Ada');
    await page.locator('#setup-lesson').fill('Unit 1');
    await page.locator('#setup-word-1-german').fill('Hund');
    assert.ok(await page.locator('#setup-word-1-answers').evaluate(
      (input, requiredLength) => input.maxLength >= requiredLength,
      longAnswers.length,
    ));
    await page.locator('#setup-word-1-answers').fill(longAnswers);
    await page.locator('#setup-word-2-german').fill('Fahrrad');
    await page.locator('#setup-word-2-answers').fill('bicycle | bike');
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {value: 'hidden', configurable: true});
      document.dispatchEvent(new Event('visibilitychange'));
    });
    assert.equal(await page.locator('#dataset-name').inputValue(), 'Familienwortschatz');
    assert.equal(await page.locator('#setup-pin').inputValue(), '1234');
    assert.equal(await page.locator('#setup-profile').inputValue(), 'Ada');
    assert.equal(await page.locator('#setup-word-1-answers').inputValue(), longAnswers);
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {value: 'visible', configurable: true});
      window.__busySetupRenders = 0;
      window.__setupObserver = new MutationObserver(() => {
        const form = document.querySelector('#setup-form[aria-busy="true"]');
        if (form?.querySelector('#setup-submit:disabled')) window.__busySetupRenders += 1;
      });
      window.__setupObserver.observe(document.querySelector('#app'), {childList: true, subtree: true});
      const submit = document.querySelector('#setup-submit');
      submit.click();
      submit.click();
    });
    await page.locator('#profile-list .profile-card', {hasText: /^Ada/}).waitFor({timeout: 8_000})
      .catch(async (error) => {
        error.message += `\nVisible page:\n${await page.locator('body').innerText()}\nPage errors: ${pageErrors.join(' | ')}`;
        throw error;
      });
    await page.screenshot({path: resolve(resultsDirectory, 'trainer-setup-mobile.png'), fullPage: true});

    const stateAfterSetup = await productState(page);
    assert.equal(stateAfterSetup.ledger.descriptor.name, 'Familienwortschatz');
    assert.equal(stateAfterSetup.pinVerifier === null, false);
    assert.doesNotMatch(JSON.stringify(stateAfterSetup.pinVerifier), /1234/);
    assert.equal(stateAfterSetup.ledger.events.filter((event) => event.type === 'entity.revised').length, 4);
    assert.ok(await page.evaluate(() => window.__busySetupRenders > 0));
    assert.deepEqual(stateAfterSetup.ledger.events.find((event) => (
      event.type === 'entity.revised' && event.payload.entityType === 'word'
      && event.payload.value.german === 'Hund'
    )).payload.value.answers, longAnswers.split(' | '));

    await page.reload();
    await page.locator('#adult-entry').click();
    await page.locator('#adult-unlock').waitFor();
    await holdNextPinDerivation(page);
    await page.locator('#adult-pin').fill('1234');
    await page.locator('#adult-unlock').click();
    await backgroundDuringPinDerivation(page);
    await page.locator('#profile-list').waitFor();
    await page.locator('#adult-entry').click();
    await page.locator('#adult-unlock').waitFor();
    await page.locator('#adult-pin').fill('1234');
    await page.locator('#adult-unlock').click();
    await page.locator('#adult-nav').waitFor();

    await page.getByRole('button', {name: 'Lektionen'}).click();
    await page.locator('[data-lesson-name="Unit 1"]').click();
    const lessonForm = page.locator('form').filter({has: page.getByRole('heading', {name: 'Lektion bearbeiten'})});
    const assignment = lessonForm.getByRole('checkbox', {name: 'Ada'});
    await assignment.uncheck();
    await lessonForm.getByRole('button', {name: 'Speichern'}).click();
    await page.getByText('Lektion und Zuordnung wurden gespeichert.', {exact: true}).waitFor();
    assert.equal((await productState(page)).ledger.events.filter(({type}) => type === 'entity.revised').length, 5);
    const refreshedLessonForm = page.locator('form').filter({has: page.getByRole('heading', {name: 'Lektion bearbeiten'})});
    await refreshedLessonForm.getByRole('checkbox', {name: 'Ada'}).check();
    await refreshedLessonForm.getByRole('button', {name: 'Speichern'}).click();
    await page.getByText('Lektion und Zuordnung wurden gespeichert.', {exact: true}).waitFor();

    const editWord = page.locator('[data-word-german="Hund"] details');
    await editWord.locator('summary').click();
    assert.ok(await editWord.locator('input[name="answers"]').evaluate(
      (input, requiredLength) => input.maxLength >= requiredLength,
      longAnswers.length,
    ));
    await editWord.locator('input[name="answers"]').fill('hound');
    assert.match(await editWord.locator('[data-revision-preview]').textContent(), /Serie beginnt/);

    await page.locator('#import-text').fill('Bank\tbench\tSitzplatz\textra');
    await page.locator('#import-preview').click();
    await page.getByText(/Rohzeile:.*Sitzplatz.*extra/).waitFor();
    const structuralRow = page.locator('[data-import-row="row-1"]');
    await structuralRow.locator('input[name="german"]').fill('Sitzbank');
    await structuralRow.locator('input[name="german"]').press('Tab');
    assert.equal(await page.locator('#import-apply').isDisabled(), true);
    await page.getByText(/Rohzeile:.*Sitzplatz.*extra/).waitFor();
    await structuralRow.getByRole('button', {name: /Struktur.*bestätigen/}).click();
    assert.equal(await page.locator('#import-apply').isEnabled(), true);
    await page.locator('#import-apply').click();
    await page.getByText('Sitzbank', {exact: true}).waitFor();

    await page.locator('#import-text').fill('"mehr\tdeutig"\tanswer');
    await page.locator('#import-preview').click();
    await page.getByText(/Rohzeile:.*"mehr.*deutig".*answer/).waitFor();
    const quotedRow = page.locator('[data-import-row="row-1"]');
    await quotedRow.locator('input[name="hint"]').fill('Nur der Hinweis wurde geändert');
    await quotedRow.locator('input[name="hint"]').press('Tab');
    assert.equal(await page.locator('#import-apply').isDisabled(), true);
    await quotedRow.locator('select').selectOption('skip');
    assert.equal(await page.locator('#import-apply').isEnabled(), true);
    await page.locator('#import-apply').click();

    await page.locator('#import-text').fill(`Langform\t${longAnswers}`);
    await page.locator('#import-preview').click();
    assert.equal(await page.locator('[data-import-row="row-1"] input[name="answers"]').inputValue(), longAnswers);
    assert.ok(await page.locator('[data-import-row="row-1"] input[name="answers"]').evaluate(
      (input, requiredLength) => input.maxLength >= requiredLength,
      longAnswers.length,
    ));
    await page.locator('#import-apply').click();
    await page.getByText('Langform', {exact: true}).waitFor();

    await page.locator('#import-text').fill('Pflichtfeld fehlt\t');
    await page.locator('#import-preview').click();
    assert.equal(await page.locator('#import-apply').isDisabled(), true);
    await page.locator('#import-text').fill('Fahrrad\tbicycle | bike\n<img onerror=window.__xss=1>\timage');
    await page.locator('#import-preview').click();
    assert.equal(await page.locator('#import-apply').isDisabled(), true);
    await page.locator('[data-import-row="row-1"] select').selectOption('separate');
    assert.equal(await page.locator('#import-apply').isEnabled(), true);
    await page.locator('#import-apply').click();
    await page.getByText('<img onerror=window.__xss=1>', {exact: true}).waitFor();
    assert.equal(await page.evaluate(() => window.__xss), undefined);

    await page.goto(new URL('../styles.css', harness.baseUrl).href);
    await seedOneCorrectAnswer(page, await productState(page));
    await page.goto(harness.baseUrl);
    await page.locator('#adult-entry').click();
    await page.locator('#adult-pin').fill('1234');
    await page.locator('#adult-unlock').click();
    await page.getByRole('button', {name: 'Lektionen'}).click();
    await page.locator('[data-lesson-name="Unit 1"]').click();
    await page.getByText('<img onerror=window.__xss=1>', {exact: true}).waitFor();
    const hundRow = page.locator('[data-word-german="Hund"]');
    await hundRow.getByRole('button', {name: 'Archivieren'}).click();
    await page.locator('[data-word-german="Hund"]').getByRole('button', {name: 'Reaktivieren'}).click();
    await page.getByRole('button', {name: 'Lernstand'}).click();
    const progressRow = page.locator('[data-progress-word="Hund"]');
    assert.equal(await progressRow.locator('[data-stat="attempts"]').textContent(), '1');
    assert.equal((await productState(page)).ledger.events.some(({id}) => id === 'browser-history-answer'), true);

    await page.setViewportSize({width: 1280, height: 900});
    await page.screenshot({path: resolve(resultsDirectory, 'trainer-adult-desktop.png'), fullPage: true});
    const resumableState = await productState(page);

    await page.getByRole('button', {name: 'Kinder'}).click();
    const changePin = page.locator('details').filter({has: page.locator('summary', {hasText: 'PIN ändern'})});
    await changePin.locator('summary').click();
    await changePin.locator('input[name="current"]').fill('1234');
    await changePin.locator('input[name="next"]').fill('5678');
    await changePin.locator('input[name="repeat"]').fill('5678');
    const beforeChangeHash = (await productState(page)).pinVerifier.hash;
    await holdNextPinDerivation(page);
    await changePin.getByRole('button', {name: 'PIN ändern'}).click();
    await backgroundDuringPinDerivation(page);
    await waitForVerifierChange(page, beforeChangeHash);
    await page.locator('#profile-list').waitFor();
    await page.locator('#adult-entry').click();
    await page.locator('#adult-unlock').waitFor();
    await page.locator('#adult-pin').fill('5678');
    await page.locator('#adult-unlock').click();
    await page.locator('#adult-nav').waitFor();

    await page.getByRole('button', {name: 'Kinder'}).click();
    const resetPin = page.locator('details').filter({has: page.locator('summary', {hasText: 'PIN vergessen'})});
    await resetPin.locator('summary').click();
    await resetPin.locator('input[name="confirmation"]').fill('PIN zurücksetzen');
    await resetPin.locator('input[name="next"]').fill('9012');
    await resetPin.locator('input[name="repeat"]').fill('9012');
    const beforeResetHash = (await productState(page)).pinVerifier.hash;
    await holdNextPinDerivation(page);
    await resetPin.getByRole('button', {name: 'Vergessene PIN lokal zurücksetzen'}).click();
    await backgroundDuringPinDerivation(page);
    await waitForVerifierChange(page, beforeResetHash);
    await page.locator('#profile-list').waitFor();
    await page.locator('#adult-entry').click();
    await page.locator('#adult-unlock').waitFor();
    await page.locator('#adult-pin').fill('9012');
    await page.locator('#adult-unlock').click();
    await page.locator('#adult-nav').waitFor();

    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {value: 'hidden', configurable: true});
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.locator('#profile-list').waitFor();
    await page.locator('#adult-entry').click();
    await page.locator('#adult-unlock').waitFor();

    await page.evaluate(() => {
      window.__trainerBfcacheMarker = 1;
      addEventListener('pageshow', (event) => {
        if (event.persisted) sessionStorage.setItem('trainer-bfcache-restored', 'yes');
      });
    });
    await page.goto(new URL('../styles.css', harness.baseUrl).href);
    const second = await context.newPage();
    try {
      await second.goto(harness.baseUrl);
      await second.locator('#profile-list').waitFor();
      await page.goBack({waitUntil: 'commit', timeout: 5_000}).catch((error) => {
        if (error?.name !== 'TimeoutError') throw error;
      });
      await page.waitForFunction(() => sessionStorage.getItem('trainer-bfcache-restored') === 'yes');
      await page.locator('#app-error').filter({hasText: /anderen (Tab|Fenster)|bereits geöffnet/i}).waitFor();
      assert.equal(await page.evaluate(() => window.__trainerBfcacheMarker), undefined);
    } finally {
      await second.close();
    }

    const interrupted = await harness.newDevice();
    try {
      await interrupted.page.goto(new URL('../styles.css', harness.baseUrl).href);
      const unfinished = structuredClone(resumableState);
      unfinished.pinVerifier = null;
      await interrupted.page.evaluate(({key, value}) => localStorage.setItem(key, value), {
        key: 'vokabeltrainer-product-device-id', value: unfinished.deviceId,
      });
      await writeProductState(interrupted.page, unfinished);
      await interrupted.page.goto(harness.baseUrl);
      await interrupted.page.getByRole('heading', {name: 'Einrichtung fortsetzen'}).waitFor();
      await interrupted.page.locator('#setup-pin').fill('6789');
      await interrupted.page.locator('#setup-pin-repeat').fill('6789');
      await interrupted.page.locator('#setup-profile').fill('Wird nicht dupliziert');
      await interrupted.page.locator('#setup-lesson').fill('Wird nicht dupliziert');
      await interrupted.page.locator('#setup-word-1-german').fill('Eins');
      await interrupted.page.locator('#setup-word-1-answers').fill('one');
      await interrupted.page.locator('#setup-word-2-german').fill('Zwei');
      await interrupted.page.locator('#setup-word-2-answers').fill('two');
      await interrupted.page.evaluate(() => {
        const submit = document.querySelector('#setup-submit');
        submit.click();
        submit.click();
      });
      await interrupted.page.locator('#profile-list .profile-card', {hasText: /^Ada/}).waitFor();
      const resumed = await productState(interrupted.page);
      assert.equal(resumed.pinVerifier === null, false);
      assert.equal(resumed.ledger.events.filter((event) => (
        event.type === 'entity.revised' && event.payload.entityType === 'profile'
      )).length, 1);
    } finally {
      await interrupted.context.close();
    }

    assert.deepEqual(pageErrors, []);
    assert.deepEqual(harness.google.unexpected, []);
  } finally {
    await harness.close();
  }
});
