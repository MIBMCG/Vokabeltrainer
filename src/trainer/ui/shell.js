import {project} from '../learning/progress.js';
import {el, field, button, message} from './dom.js';
import {renderAdult} from './adult.js';

function pinInput(id, name) {
  return el('input', {attrs: {
    id, name, type: 'password', inputmode: 'numeric', pattern: '[0-9]{4}',
    minlength: '4', maxlength: '4', autocomplete: 'off', required: true,
  }});
}

function textInput(id, name, maxlength, value = '') {
  return el('input', {attrs: {id, name, maxlength, value, required: true}});
}

function wordFields(index) {
  const german = textInput(`setup-word-${index}-german`, `word-${index}-german`, 200);
  const answers = textInput(`setup-word-${index}-answers`, `word-${index}-answers`, 420);
  return el('fieldset', {}, [
    el('legend', {text: `Vokabel ${index}`}),
    field('Deutsch', german),
    field('Englisch (mehrere Lösungen mit | trennen)', answers),
  ]);
}

export function mountShell({root, commands, pinGate}) {
  let currentView = 'profiles';
  let activeProfileId = null;
  let destroyed = false;

  function showError(error) {
    const text = error?.message || 'Die Aktion konnte nicht abgeschlossen werden.';
    const existing = root.querySelector('#shell-message');
    if (existing) existing.replaceWith(message(text, 'error'));
  }

  function renderSetup(state) {
    const form = el('form', {attrs: {class: 'panel setup-panel', id: 'setup-form'}});
    const initial = state === null;
    form.append(
      el('p', {text: initial
        ? 'Ein Erwachsener richtet den gemeinsamen Wortschatz und die lokale PIN ein.'
        : 'Die Datensatzeinrichtung wurde begonnen. Legen Sie jetzt die lokale PIN fest und vervollständigen Sie fehlende Startdaten.'}),
    );
    if (initial) form.append(field('Name des Datensatzes', textInput('dataset-name', 'dataset-name', 80, 'Familienwortschatz')));
    else form.append(el('p', {text: `Datensatz: ${state.ledger.descriptor.name}`, attrs: {class: 'summary'}}));
    form.append(
      field('Vierstellige PIN', pinInput('setup-pin', 'pin')),
      field('PIN wiederholen', pinInput('setup-pin-repeat', 'pin-repeat')),
      field('Name des Kindes', textInput('setup-profile', 'profile', 80)),
      field('Name der ersten Lektion', textInput('setup-lesson', 'lesson', 80)),
      wordFields(1),
      wordFields(2),
      el('p', {text: 'Die PIN bleibt nur auf diesem Gerät. Sie ist eine Bedienhürde und kein Kontoschutz.', attrs: {class: 'hint'}}),
      el('p', {attrs: {id: 'shell-message', class: 'message', role: 'status'}}),
    );
    const submit = el('button', {text: 'Trainer einrichten', attrs: {id: 'setup-submit', type: 'submit', class: 'primary'}});
    form.append(submit);
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      submit.disabled = true;
      const data = new FormData(form);
      try {
        if (commands.getState() === null) {
          await commands.setup({
            name: data.get('dataset-name').trim(),
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
            value: {name: data.get('profile').trim(), archived: false},
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
            value: {name: data.get('lesson').trim(), archived: false, profileIds: [profile.id]},
          });
          projection = project(commands.getState().ledger);
          lesson = projection.entities.lessons[lessonId];
        }
        const existingWords = Object.values(projection.entities.words)
          .filter((entity) => entity.value && entity.value.lessonId === lesson.id);
        for (let index = existingWords.length + 1; index <= 2; index += 1) {
          const answers = data.get(`word-${index}-answers`).split('|').map((value) => value.trim()).filter(Boolean);
          await commands.revise({
            entityType: 'word', entityId: crypto.randomUUID(), expectedHeads: [],
            value: {
              lessonId: lesson.id,
              german: data.get(`word-${index}-german`).trim(),
              hint: '', answers, archived: false,
            },
          });
        }
        await pinGate.setup(data.get('pin'), data.get('pin-repeat'));
        render();
      } catch (error) {
        submit.disabled = false;
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
    for (const [view, label] of [['practice', 'Üben'], ['journey', 'Reise'], ['avatar', 'Avatar']]) {
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
        activeProfileId = profile.id;
        show('practice');
      }, {class: 'profile-card', 'data-profile-id': profile.id}));
      list.lastChild.append(el('span', {text: `Level ${progress?.level ?? 1} · ${progress?.points ?? 0} Punkte`}));
    }
    root.replaceChildren(
      el('section', {attrs: {class: 'home'}}, [
        el('p', {text: 'Insel-Abenteuer', attrs: {class: 'eyebrow'}}),
        el('h1', {text: 'Wer möchte üben?'}),
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
      else renderAdult({root, state, commands, pinGate, onNavigate: show});
    } else renderScaffold(state, currentView);
  }

  function show(view) {
    if (!['profiles', 'practice', 'journey', 'avatar', 'adult'].includes(view)) return;
    if (currentView === 'adult' && view !== 'adult') pinGate.lock();
    currentView = view;
    render();
  }

  function onVisibilityChange() {
    if (document.visibilityState !== 'hidden') return;
    pinGate.lock();
    if (currentView === 'adult') currentView = 'profiles';
    render();
  }
  document.addEventListener('visibilitychange', onVisibilityChange);

  return {
    render,
    show,
    destroy() {
      destroyed = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      pinGate.lock();
    },
  };
}
