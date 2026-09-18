import {project} from '../learning/progress.js';
import {el, field, button, message} from './dom.js';
import {renderAdult} from './adult.js';
import {practiceRenderKey, practiceUpdateBlocker, renderPractice, renderPracticeLanding} from './practice.js';
import {renderAvatar, renderJourney} from './rewards.js';

const MAX_ANSWERS_TEXT_LENGTH = 4_200;
const SHELL_SESSION_KEY = 'vokabeltrainer-shell-v1';

function restoredShellState() {
  try {
    const value = JSON.parse(sessionStorage.getItem(SHELL_SESSION_KEY) ?? 'null');
    if (value === null || typeof value !== 'object') return null;
    if (!['profiles', 'practice', 'journey', 'avatar'].includes(value.view)) return null;
    return {
      view: value.view,
      profileId: typeof value.profileId === 'string' ? value.profileId : null,
      practiceActive: value.practiceActive === true,
    };
  } catch {
    return null;
  }
}

function pinInput(id, name, value = '') {
  return el('input', {attrs: {
    id, name, type: 'password', inputmode: 'numeric', pattern: '[0-9]{4}',
    minlength: '4', maxlength: '4', autocomplete: 'off', required: true, value,
  }});
}

function textInput(id, name, maxlength, value = '') {
  return el('input', {attrs: {id, name, maxlength, value, required: true}});
}

function wordFields(index, draft) {
  const germanName = `word-${index}-german`;
  const answersName = `word-${index}-answers`;
  const german = textInput(`setup-word-${index}-german`, germanName, 200, draft[germanName]);
  const answers = textInput(
    `setup-word-${index}-answers`, answersName, MAX_ANSWERS_TEXT_LENGTH, draft[answersName],
  );
  return el('fieldset', {}, [
    el('legend', {text: `Vokabel ${index}`}),
    field('Deutsch', german),
    field('Englisch (mehrere Lösungen mit | trennen)', answers),
  ]);
}

export function mountShell({root, commands, pinGate, sync, restore, auth, onDownload}) {
  const restored = restoredShellState();
  let currentView = restored?.view ?? 'profiles';
  let activeProfileId = restored?.profileId ?? null;
  let practiceActive = restored?.practiceActive ?? false;
  let lastPracticeKey = null;
  let profileNotice = '';
  let destroyed = false;
  let setupBusy = false;
  let updateLocked = false;
  let updateRelease = null;
  const setupDraft = {
    'dataset-name': 'Familienwortschatz',
    pin: '',
    'pin-repeat': '',
    profile: '',
    lesson: '',
    'word-1-german': '',
    'word-1-answers': '',
    'word-2-german': '',
    'word-2-answers': '',
  };

  function persistShellState() {
    sessionStorage.setItem(SHELL_SESSION_KEY, JSON.stringify({
      view: currentView,
      profileId: activeProfileId,
      practiceActive,
    }));
  }

  function showError(error) {
    const text = error?.message || 'Die Aktion konnte nicht abgeschlossen werden.';
    const existing = root.querySelector('#shell-message');
    if (existing) existing.replaceWith(message(text, 'error'));
  }

  function updateBoundaryError(code, text) {
    const error = new Error(text);
    error.code = code;
    return error;
  }

  function renderSetup(state) {
    const form = el('form', {attrs: {
      class: 'panel setup-panel', id: 'setup-form', 'aria-busy': setupBusy ? 'true' : 'false',
    }});
    const initial = state === null;
    form.append(
      el('p', {text: initial
        ? 'Ein Erwachsener richtet den gemeinsamen Wortschatz und die lokale PIN ein.'
        : 'Die Datensatzeinrichtung wurde begonnen. Legen Sie jetzt die lokale PIN fest und vervollständigen Sie fehlende Startdaten.'}),
    );
    if (initial) form.append(field(
      'Name des Datensatzes',
      textInput('dataset-name', 'dataset-name', 80, setupDraft['dataset-name']),
    ));
    else form.append(el('p', {text: `Datensatz: ${state.ledger.descriptor.name}`, attrs: {class: 'summary'}}));
    form.append(
      field('Vierstellige PIN', pinInput('setup-pin', 'pin', setupDraft.pin)),
      field('PIN wiederholen', pinInput('setup-pin-repeat', 'pin-repeat', setupDraft['pin-repeat'])),
      field('Name des Kindes', textInput('setup-profile', 'profile', 80, setupDraft.profile)),
      field('Name der ersten Lektion', textInput('setup-lesson', 'lesson', 80, setupDraft.lesson)),
      wordFields(1, setupDraft),
      wordFields(2, setupDraft),
      el('p', {text: 'Die PIN bleibt nur auf diesem Gerät. Sie ist eine Bedienhürde und kein Kontoschutz.', attrs: {class: 'hint'}}),
      el('p', {attrs: {id: 'shell-message', class: 'message', role: 'status'}}),
    );
    const submit = el('button', {text: 'Trainer einrichten', attrs: {id: 'setup-submit', type: 'submit', class: 'primary'}});
    form.append(submit);
    form.addEventListener('input', (event) => {
      const name = event.target?.name;
      if (Object.hasOwn(setupDraft, name)) setupDraft[name] = event.target.value;
    });
    if (setupBusy) {
      for (const control of form.querySelectorAll('input, button')) control.disabled = true;
    }
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (setupBusy) return;
      const data = structuredClone(setupDraft);
      setupBusy = true;
      submit.disabled = true;
      render();
      try {
        if (commands.getState() === null) {
          await commands.setup({
            name: data['dataset-name'].trim(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Berlin',
          });
        }
        let projection = project(commands.getState().ledger);
        let profile = Object.values(projection.entities.profiles)
          .find((entity) => entity.value && !entity.value.archived);
        if (!profile) {
          const profileId = crypto.randomUUID();
          await commands.revise({
            entityType: 'profile', entityId: profileId, expectedHeads: [],
            value: {name: data.profile.trim(), archived: false},
          });
          projection = project(commands.getState().ledger);
          profile = projection.entities.profiles[profileId];
        }
        let lesson = Object.values(projection.entities.lessons)
          .find((entity) => entity.value && !entity.value.archived);
        if (!lesson) {
          const lessonId = crypto.randomUUID();
          await commands.revise({
            entityType: 'lesson', entityId: lessonId, expectedHeads: [],
            value: {name: data.lesson.trim(), archived: false, profileIds: [profile.id]},
          });
          projection = project(commands.getState().ledger);
          lesson = projection.entities.lessons[lessonId];
        }
        const existingWords = Object.values(projection.entities.words)
          .filter((entity) => entity.value && entity.value.lessonId === lesson.id);
        for (let index = existingWords.length + 1; index <= 2; index += 1) {
          const answers = data[`word-${index}-answers`].split('|').map((value) => value.trim()).filter(Boolean);
          await commands.revise({
            entityType: 'word', entityId: crypto.randomUUID(), expectedHeads: [],
            value: {
              lessonId: lesson.id,
              german: data[`word-${index}-german`].trim(),
              hint: '', answers, archived: false,
            },
          });
        }
        await pinGate.setup(data.pin, data['pin-repeat']);
        setupBusy = false;
        setupDraft.pin = '';
        setupDraft['pin-repeat'] = '';
        render();
      } catch (error) {
        setupBusy = false;
        render();
        showError(error);
      }
    });
    root.replaceChildren(el('section', {attrs: {'aria-labelledby': 'setup-title'}}, [
      el('h1', {text: initial ? 'Vokabeltrainer einrichten' : 'Einrichtung fortsetzen', attrs: {id: 'setup-title'}}),
      form,
    ]));
  }

  function shellNavigation() {
    const nav = el('nav', {attrs: {'aria-label': 'Hauptnavigation', class: 'bottom-nav'}});
    for (const [view, label] of [['practice', 'Üben'], ['journey', 'Inselreise'], ['avatar', 'Mein Avatar']]) {
      nav.append(button(label, () => show(view), {
        class: currentView === view ? 'active' : '', 'aria-current': currentView === view ? 'page' : null,
      }));
    }
    return nav;
  }

  function renderProfiles(state) {
    const projection = project(state.ledger);
    const profiles = Object.values(projection.entities.profiles)
      .filter((entity) => entity.value && !entity.value.archived);
    const list = el('div', {attrs: {id: 'profile-list', class: 'profile-grid'}});
    for (const profile of profiles) {
      const progress = projection.profiles[profile.id];
      list.append(button(profile.value.name, () => {
        profileNotice = '';
        activeProfileId = profile.id;
        practiceActive = false;
        show('practice');
      }, {class: 'profile-card', 'data-profile-id': profile.id}));
      list.lastChild.append(el('span', {text: `Level ${progress?.level ?? 1} · ${progress?.points ?? 0} Punkte`}));
    }
    root.replaceChildren(
      el('section', {attrs: {class: 'home'}}, [
        el('p', {text: 'Insel-Abenteuer', attrs: {class: 'eyebrow'}}),
        el('h1', {text: 'Wer möchte üben?'}),
        profileNotice ? message(profileNotice) : null,
        list,
        button('Für Erwachsene', () => show('adult'), {id: 'adult-entry', class: 'secondary'}),
      ]),
      shellNavigation(),
    );
  }

  function renderScaffold(state, view) {
    const projection = project(state.ledger);
    const profile = activeProfileId ? projection.entities.profiles[activeProfileId] : null;
    const labels = {
      practice: ['Üben', 'Die vollständige Übungsrunde wird im nächsten Arbeitspaket angeschlossen. Ihre Inhalte sind bereits sicher gespeichert.'],
      journey: ['Inselreise', 'Die Reiseansicht wird im nächsten Arbeitspaket aus dem echten Lernfortschritt aufgebaut.'],
      avatar: ['Avatar', 'Die Avatar-Auswahl folgt mit den freigeschalteten Reisebelohnungen.'],
    };
    const [title, copy] = labels[view];
    root.replaceChildren(
      el('section', {attrs: {class: 'panel scaffold'}}, [
        el('p', {text: profile?.value?.name ?? 'Profil wählen', attrs: {class: 'eyebrow'}}),
        el('h1', {text: title}),
        el('p', {text: copy}),
        button('Zur Profilauswahl', () => show('profiles'), {class: 'secondary'}),
      ]),
      shellNavigation(),
    );
  }

  function renderAdultGate() {
    const form = el('form', {attrs: {class: 'panel narrow'}});
    const pin = pinInput('adult-pin', 'pin');
    const unlock = el('button', {text: 'Öffnen', attrs: {id: 'adult-unlock', type: 'submit', class: 'primary'}});
    form.append(
      el('h1', {text: 'Für Erwachsene'}),
      field('PIN', pin),
      el('p', {attrs: {id: 'shell-message', class: 'message', role: 'status'}}),
      unlock,
      button('Zurück', () => show('profiles'), {class: 'secondary'}),
    );
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      unlock.disabled = true;
      try {
        await pinGate.unlock(pin.value);
        render();
      } catch (error) {
        unlock.disabled = false;
        showError(error);
      }
    });
    root.replaceChildren(form);
  }

  function render() {
    if (destroyed) return;
    const state = commands.getState();
    if (state === null || state.pinVerifier === null) {
      renderSetup(state);
      return;
    }
    if (currentView === 'profiles') renderProfiles(state);
    else if (currentView === 'adult') {
      if (!pinGate.isUnlocked()) renderAdultGate();
      else renderAdult({root, state, commands, pinGate, onNavigate: show, sync, restore, auth, onDownload});
    } else if (currentView === 'practice' && activeProfileId !== null) {
      const projection = project(state.ledger);
      const profile = projection.entities.profiles[activeProfileId];
      if (profile?.value === null || profile?.value?.archived || profile === undefined) {
        profileNotice = practiceActive
          ? 'Dieses Lernprofil ist nicht mehr verfügbar. Die offene Antwort wurde nicht gewertet.'
          : 'Dieses Lernprofil ist nicht mehr verfügbar. Bitte wähle ein anderes Profil.';
        currentView = 'profiles';
        activeProfileId = null;
        practiceActive = false;
        persistShellState();
        renderProfiles(state);
      } else {
        const renderPracticeView = practiceActive ? renderPractice : renderPracticeLanding;
        renderPracticeView({
          root, state, commands, profileId: activeProfileId, onNavigate: handlePracticeNavigation,
        });
        root.append(shellNavigation());
        lastPracticeKey = practiceRenderKey(state, activeProfileId);
      }
    } else if ((currentView === 'journey' || currentView === 'avatar') && activeProfileId !== null) {
      const projection = project(state.ledger);
      const profileEntity = projection.entities.profiles[activeProfileId];
      if (profileEntity?.value === null || profileEntity?.value?.archived || profileEntity === undefined) {
        profileNotice = 'Dieses Lernprofil ist nicht mehr verfügbar. Bitte wähle ein anderes Profil.';
        currentView = 'profiles';
        activeProfileId = null;
        practiceActive = false;
        persistShellState();
        renderProfiles(state);
      } else {
        const profile = projection.profiles[activeProfileId];
        if (currentView === 'journey') renderJourney({root, profile});
        else renderAvatar({root, profile, profileId: activeProfileId, commands});
        root.firstElementChild?.prepend(button('Profil wechseln', () => show('profiles'), {
          class: 'secondary profile-switch',
        }));
        root.append(shellNavigation());
      }
    } else renderScaffold(state, currentView);
  }

  function handlePracticeNavigation(destination, {render: shouldRender = true} = {}) {
    if (updateLocked) return;
    if (destination === 'practice-active' || destination === 'practice-landing') {
      currentView = 'practice';
      practiceActive = destination === 'practice-active';
      persistShellState();
      if (shouldRender) render();
      return;
    }
    show(destination);
  }

  function closeAdultDialogs() {
    for (const dialog of document.querySelectorAll('dialog.restore-dialog')) {
      dialog.close();
      dialog.remove();
    }
  }

  function show(view) {
    if (updateLocked) return;
    if (!['profiles', 'practice', 'journey', 'avatar', 'adult'].includes(view)) return;
    if (currentView === 'adult' && view !== 'adult') {
      closeAdultDialogs();
      pinGate.lock();
    }
    if (view === 'profiles') practiceActive = false;
    currentView = view;
    persistShellState();
    render();
  }

  function onVisibilityChange() {
    if (document.visibilityState !== 'hidden') return;
    closeAdultDialogs();
    pinGate.lock();
    if (currentView === 'adult') {
      currentView = 'profiles';
      render();
    }
  }
  document.addEventListener('visibilitychange', onVisibilityChange);

  return {
    render,
    stateChanged() {
      if (destroyed) return;
      const state = commands.getState();
      if (state !== null && currentView === 'practice' && practiceActive && activeProfileId !== null) {
        const nextKey = practiceRenderKey(state, activeProfileId);
        if (nextKey === lastPracticeKey) return;
      }
      render();
    },
    syncStatusChanged(status) {
      if (destroyed) return;
      const node = root.querySelector('[data-sync-status]');
      if (!node) return;
      const label = status?.phase === 'synced' && status.pendingCount === 0 && status.conflictCount === 0
        ? 'Abgeglichen'
        : status?.phase === 'connect'
          ? 'Mit Google verbinden'
          : status?.phase === 'pending'
            ? 'Abgleich ausstehend'
            : ['error', 'conflict'].includes(status?.phase)
              ? 'Abgleich fehlgeschlagen'
              : 'Auf diesem Gerät gespeichert';
      node.textContent = label;
      node.dataset.phase = status?.phase ?? 'local';
      const detail = node.nextElementSibling;
      if (detail?.classList.contains('hint')) detail.textContent = status?.message ?? '';
    },
    async pauseForUpdate() {
      if (destroyed) throw updateBoundaryError('not-ready', 'Die App wird gerade geschlossen.');
      if (updateLocked) throw updateBoundaryError('not-ready', 'Die Aktualisierung läuft bereits.');
      const state = commands.getState();
      if (setupBusy || state === null || state.pinVerifier === null) {
        throw updateBoundaryError('not-ready', 'Bitte die Einrichtung zuerst abschließen.');
      }
      if (currentView === 'adult') {
        throw updateBoundaryError('not-ready', 'Bitte die Erwachsenenansicht zuerst verlassen.');
      }
      const blocker = practiceUpdateBlocker(root);
      if (blocker === 'busy') {
        throw updateBoundaryError('not-ready', 'Die Antwort wird gerade gespeichert. Bitte kurz warten und erneut aktualisieren.');
      }
      if (blocker === 'typed-answer') {
        throw updateBoundaryError('typed-answer-present', 'Bitte die offene Eingabe zuerst absenden oder leeren.');
      }
      persistShellState();
      updateLocked = true;
      root.inert = true;
      root.setAttribute('aria-busy', 'true');
      let released = false;
      const release = () => {
        if (released) return;
        released = true;
        if (updateRelease !== release) return;
        updateRelease = null;
        updateLocked = false;
        root.inert = false;
        root.removeAttribute('aria-busy');
      };
      updateRelease = release;
      return release;
    },
    show,
    destroy() {
      updateRelease?.();
      destroyed = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      closeAdultDialogs();
      pinGate.lock();
    },
  };
}
