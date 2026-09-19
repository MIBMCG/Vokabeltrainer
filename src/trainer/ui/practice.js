import {project} from '../learning/progress.js';
import {avatarPicture, picture} from './art.js';
import {el, button, message} from './dom.js';
import {avatarParts} from './rewards.js';

const uiByRoot = new WeakMap();

function uiState(root) {
  if (!uiByRoot.has(root)) {
    uiByRoot.set(root, {busy: false, notice: '', invalidating: null});
  }
  return uiByRoot.get(root);
}

export function practiceUpdateBlocker(root) {
  const ui = uiState(root);
  if (ui.busy) return 'busy';
  const input = root.querySelector('#answer:not([disabled])');
  if (input?.value.trim()) return 'typed-answer';
  return null;
}

function own(record, key) {
  return record !== null && typeof record === 'object' && Object.hasOwn(record, key);
}

function selectedRound(state, profileId) {
  return own(state.rounds, profileId) ? state.rounds[profileId] : null;
}

function currentWord(projection, round) {
  if (round?.current === null || !own(projection.entities.words, round.current.wordId)) return null;
  const word = projection.entities.words[round.current.wordId];
  if (word.value === null || word.value.archived
    || word.value.learningId !== round.current.learningId
    || !word.heads.includes(round.current.revisionId)) return null;
  if (!own(projection.entities.lessons, word.value.lessonId)) return null;
  const lesson = projection.entities.lessons[word.value.lessonId];
  if (lesson.value === null || lesson.value.archived
    || !lesson.value.profileIds.includes(round.profileId)) return null;
  return word;
}

export function practiceRenderKey(state, profileId) {
  const round = selectedRound(state, profileId);
  if (round === null) return `none:${profileId}`;
  const projection = project(state.ledger);
  const profile = own(projection.entities.profiles, profileId)
    ? projection.entities.profiles[profileId]
    : null;
  const profileValidity = profile !== null && profile.value !== null && !profile.value.archived
    ? 'profile-valid'
    : 'profile-invalid';
  const word = currentWord(projection, round);
  const task = round.current === null
    ? 'none'
    : `${round.current.wordId}:${round.current.revisionId}:${round.current.learningId}:${round.current.ordinal}`;
  const validity = round.current === null
    ? 'none'
    : (word === null ? 'stale' : `${word.heads.join(',')}:${word.value.lessonId}`);
  return [
    round.id, round.status, profileValidity, task, validity, round.feedback?.answerId ?? 'none',
  ].join('|');
}

export function keyAction({key, repeat, isComposing, phase}) {
  if (key !== 'Enter' || repeat || isComposing) return null;
  if (phase === 'asking') return 'submit';
  if (phase === 'feedback') return 'next';
  return null;
}

export function roundSummary(round, events) {
  const ids = new Set(round?.answeredIds ?? []);
  const answers = events.filter((event) => event.type === 'answer.recorded' && ids.has(event.id));
  const completion = events.find((event) => (
    event.type === 'round.completed' && event.payload.roundId === round.id
  ));
  const wrongWordIds = [...new Set(answers
    .filter(({payload}) => !payload.correct)
    .map(({payload}) => payload.wordId))];
  const correct = answers.filter(({payload}) => payload.correct).length;
  return {
    answers: answers.length,
    correct,
    wrongWordIds,
    answerPoints: correct * 10,
    bonusPoints: completion === undefined ? 0 : 20,
  };
}

function focusSoon(node) {
  queueMicrotask(() => node.isConnected && node.focus());
}

function profileHeader(profileName, points, onNavigate) {
  return el('header', {attrs: {class: 'practice-header'}}, [
    el('div', {}, [
      el('p', {text: profileName, attrs: {class: 'eyebrow'}}),
      el('p', {text: `${points} Punkte`, attrs: {class: 'practice-points'}}),
    ]),
    button('Profil wechseln', () => onNavigate('profiles'), {class: 'secondary'}),
  ]);
}

function modeCard(label, description, onStart) {
  return el('article', {attrs: {class: 'mode-card'}}, [
    el('div', {}, [el('h2', {text: label}), el('p', {text: description, attrs: {class: 'hint'}})]),
    button(label, onStart, {class: 'primary'}),
  ]);
}

function renderLanding({root, state, commands, profileId, onNavigate, projection, round, ui}) {
  const profile = projection.entities.profiles[profileId];
  const progress = projection.profiles[profileId];
  let size = 10;
  const section = el('section', {attrs: {class: 'practice-home'}});
  section.append(
    profileHeader(profile.value.name, projection.profiles[profileId]?.points ?? 0, onNavigate),
    el('div', {attrs: {class: 'practice-intro'}}, [
      el('p', {text: 'Insel-Abenteuer', attrs: {class: 'eyebrow'}}),
      el('h1', {text: `Hallo, ${profile.value.name}!`}),
      el('p', {text: 'Welche Vokabeln möchtest du heute entdecken?'}),
    ]),
    el('div', {attrs: {class: 'practice-art', 'aria-hidden': 'true'}}, [
      picture('island-beach', {className: 'practice-beach-art', sizes: '(max-width: 700px) 94vw, 720px', loading: 'eager'}),
      avatarPicture(avatarParts(progress), {className: 'practice-avatar', sizes: '(max-width: 700px) 112px, 150px'}),
    ]),
  );
  if (ui.notice) section.append(message(ui.notice));
  if (round !== null && !['completed', 'abandoned'].includes(round.status)) {
    section.append(el('div', {attrs: {class: 'resume-card'}}, [
      el('h2', {text: 'Deine Runde wartet'}),
      el('p', {text: `${round.answeredIds.length} Antworten sind schon sicher gespeichert.`}),
      el('div', {attrs: {class: 'action-row'}}, [
        button('Fortsetzen', () => onNavigate('practice-active'), {class: 'primary'}),
        button('Neue Runde', async () => {
          if (ui.busy) return;
          ui.busy = true;
          try {
            await commands.abandon({roundId: round.id});
            onNavigate('practice-landing');
          } catch (error) {
            ui.busy = false;
            section.append(message(error?.message || 'Die Runde konnte nicht beendet werden.', 'error'));
          }
        }, {class: 'secondary'}),
      ]),
    ]));
    root.replaceChildren(section);
    return;
  }
  const sizes = el('fieldset', {attrs: {class: 'round-sizes'}}, [el('legend', {text: 'Antworten pro Runde'})]);
  for (const value of [10, 20, 30]) {
    const input = el('input', {attrs: {
      type: 'radio', name: 'round-size', id: `round-size-${value}`, value,
      checked: value === 10,
    }});
    input.addEventListener('change', () => { size = value; });
    sizes.append(el('label', {text: `${value} Antworten`}, [input]));
  }
  const start = async (mode) => {
    if (ui.busy) return;
    ui.busy = true;
    onNavigate('practice-active', {render: false});
    try {
      await commands.start({profileId, mode, size});
      ui.busy = false;
    } catch (error) {
      ui.busy = false;
      onNavigate('practice-landing', {render: false});
      root.append(message(error?.message || 'Die Runde konnte nicht gestartet werden.', 'error'));
    }
  };
  section.append(
    sizes,
    el('div', {attrs: {class: 'mode-grid'}}, [
      modeCard('Alle Vokabeln', 'Quer durch deinen Wortschatz.', () => start('all')),
      modeCard('Letzte Vokabeln', 'Aus deiner zuletzt angelegten Lektion.', () => start('latest')),
      modeCard('Neue Vokabeln', 'Wörter, die du noch nicht geübt hast.', () => start('new')),
    ]),
  );
  root.replaceChildren(section);
}

function renderFeedback({root, round, word, profile, points, commands, onNavigate, ui}) {
  const feedback = round.feedback;
  const input = el('input', {attrs: {
    id: 'answer', lang: 'en', autocomplete: 'off', autocapitalize: 'none', autocorrect: 'off',
    spellcheck: 'false', 'aria-describedby': 'feedback', value: feedback.typed, disabled: true,
  }});
  const next = button('Weiter', async () => {
    if (ui.busy) return;
    ui.busy = true;
    next.disabled = true;
    try {
      await commands.next({roundId: round.id});
      ui.busy = false;
    } catch (error) {
      ui.busy = false;
      next.disabled = false;
      status.replaceChildren(document.createTextNode(error?.message || 'Die Runde konnte nicht fortgesetzt werden.'));
      status.dataset.tone = 'error';
    }
  }, {class: 'primary', id: 'practice-next'});
  const solutionList = el('ul', {attrs: {class: 'solution-list'}});
  for (const solution of feedback.solutions) solutionList.append(el('li', {text: solution}));
  const status = el('div', {attrs: {id: 'feedback', role: 'status', 'aria-live': 'polite', class: 'feedback-card'}}, [
    el('p', {attrs: {class: 'feedback-title'}}, [
      el('span', {text: feedback.correct ? '✅' : '❌', attrs: {'aria-hidden': 'true'}}),
      el('span', {text: feedback.correct ? 'Richtig!' : 'Noch nicht ganz'}),
    ]),
    el('p', {text: feedback.correct ? '+10 Punkte' : 'Richtig wäre:'}),
    solutionList,
  ]);
  const section = practiceFrame({round, word, profile, points, onNavigate}, [
    el('label', {text: 'Englische Übersetzung'}, [input]), status, next,
  ]);
  root.replaceChildren(section);
  focusSoon(next);
}

function practiceFrame({round, word, profile, points, onNavigate}, children) {
  const answered = round.answeredIds.length;
  const percent = Math.min(100, Math.round((answered / round.size) * 100));
  return el('section', {attrs: {class: 'practice-screen'}}, [
    profileHeader(profile.value.name, points, onNavigate),
    el('div', {attrs: {class: 'practice-progress'}}, [
      el('span', {text: `${answered} von ${round.size}`}),
      el('progress', {attrs: {max: round.size, value: answered, 'aria-label': 'Rundenfortschritt'}}),
      el('span', {text: `${percent} %`}),
    ]),
    el('article', {attrs: {class: 'word-card'}}, [
      el('p', {text: 'Übersetze ins Englische', attrs: {class: 'hint'}}),
      el('h1', {text: word.value.german}),
      word.value.hint ? el('p', {text: `Hinweis: ${word.value.hint}`, attrs: {class: 'word-hint'}}) : null,
      ...children,
    ]),
    picture('island-beach', {alt: '', className: 'practice-screen-art', sizes: '(max-width: 700px) 100vw, 900px'}),
  ]);
}

function renderAsking({root, round, word, profile, points, commands, onNavigate, ui}) {
  const input = el('input', {attrs: {
    id: 'answer', lang: 'en', autocomplete: 'off', autocapitalize: 'none', autocorrect: 'off',
    spellcheck: 'false', 'aria-describedby': 'feedback', enterkeyhint: 'done',
  }});
  const status = el('div', {attrs: {id: 'feedback', role: 'status', 'aria-live': 'polite'}});
  const submit = button('Prüfen', async () => {
    if (ui.busy) return;
    ui.busy = true;
    submit.disabled = true;
    input.setAttribute('aria-busy', 'true');
    try {
      const result = await commands.submit({roundId: round.id, typed: input.value});
      ui.busy = false;
      if (result.empty) {
        submit.disabled = false;
        input.removeAttribute('aria-busy');
        status.textContent = 'Bitte gib zuerst eine Übersetzung ein.';
        input.focus();
      }
    } catch (error) {
      ui.busy = false;
      submit.disabled = false;
      input.removeAttribute('aria-busy');
      status.textContent = error?.message || 'Deine Antwort wurde noch nicht gespeichert. Bitte versuche es erneut.';
      status.dataset.tone = 'error';
      input.focus();
    }
  }, {class: 'primary', id: 'practice-submit'});
  input.addEventListener('keydown', (event) => {
    if (keyAction({key: event.key, repeat: event.repeat, isComposing: event.isComposing, phase: round.status}) !== 'submit') return;
    event.preventDefault();
    submit.click();
  });
  const nodes = [];
  if (ui.notice) {
    nodes.push(message(ui.notice));
    ui.notice = '';
  }
  nodes.push(el('label', {text: 'Englische Übersetzung'}, [input]), status, submit);
  root.replaceChildren(practiceFrame({round, word, profile, points, onNavigate}, nodes));
  focusSoon(input);
}

function renderExhausted({root, round, profile, points, commands, onNavigate, ui, canExpand}) {
  const hasAnswers = round.answeredIds.length > 0;
  const section = el('section', {attrs: {class: 'panel practice-finish'}}, [
    profileHeader(profile.value.name, points, onNavigate),
    el('h1', {text: hasAnswers ? 'Für heute ist alles geschafft' : 'Hier gibt es gerade keine Vokabeln'}),
    el('p', {text: hasAnswers
      ? canExpand
        ? `${round.answeredIds.length} Antworten sind sicher gespeichert. Du kannst weitere zulässige Wörter wählen oder die Runde beenden.`
        : `${round.answeredIds.length} Antworten sind sicher gespeichert. Alle verfügbaren Wörter dieser Runde sind beantwortet. Du kannst die Runde beenden.`
      : 'Für diese Auswahl ist gerade kein Wort fällig. Wähle eine andere Runde.'}),
  ]);
  if (ui.notice) {
    section.append(message(ui.notice));
    ui.notice = '';
  }
  if (hasAnswers) {
    if (canExpand) section.append(button('Weitere Vokabeln', async () => {
      if (ui.busy) return;
      ui.busy = true;
      try { await commands.expand({roundId: round.id}); } catch (error) {
        ui.busy = false;
        section.append(message(error?.message || 'Es konnten keine weiteren Wörter gewählt werden.', 'error'));
      }
      ui.busy = false;
    }, {class: 'secondary'}));
    section.append(button('Runde beenden', async () => {
      if (ui.busy) return;
      ui.busy = true;
      try { await commands.finish({roundId: round.id, reason: 'exhausted'}); } catch (error) {
        ui.busy = false;
        section.append(message(error?.message || 'Die Runde konnte nicht abgeschlossen werden.', 'error'));
      }
      ui.busy = false;
    }, {class: 'primary'}));
  } else {
    section.append(button('Andere Auswahl', () => onNavigate('practice-landing'), {class: 'primary'}));
  }
  root.replaceChildren(section);
}

function renderCompleted({root, state, round, profile, points, projection, onNavigate}) {
  const summary = roundSummary(round, state.ledger.events);
  const wrong = summary.wrongWordIds.map((wordId) => (
    projection.entities.words[wordId]?.value?.german ?? 'Nicht mehr verfügbare Vokabel'
  ));
  root.replaceChildren(el('section', {attrs: {class: 'panel practice-finish'}}, [
    profileHeader(profile.value.name, points, onNavigate),
    el('p', {text: 'Etappe beendet', attrs: {class: 'eyebrow'}}),
    el('h1', {text: 'Runde geschafft!'}),
    el('dl', {attrs: {class: 'round-summary'}}, [
      el('dt', {text: 'Antworten'}), el('dd', {text: summary.answers}),
      el('dt', {text: 'Richtig'}), el('dd', {text: summary.correct}),
      el('dt', {text: 'Fehlerwörter'}), el('dd', {text: wrong.length ? wrong.join(', ') : 'Keine'}),
      el('dt', {text: 'Antwortpunkte'}), el('dd', {text: summary.answerPoints}),
      el('dt', {text: 'Rundenbonus'}), el('dd', {text: summary.bonusPoints}),
    ]),
    button('Neue Runde', () => onNavigate('practice-landing'), {class: 'primary'}),
  ]));
}

function renderPracticeView({root, state, commands, profileId, onNavigate}, active) {
  const projection = project(state.ledger);
  const profile = own(projection.entities.profiles, profileId)
    ? projection.entities.profiles[profileId]
    : null;
  if (profile?.value === null || profile?.value?.archived) {
    onNavigate('profiles');
    return;
  }
  const ui = uiState(root);
  ui.busy = false;
  const round = selectedRound(state, profileId);
  if (!active || round === null || round.status === 'abandoned') {
    renderLanding({root, state, commands, profileId, onNavigate, projection, round, ui});
    return;
  }
  const points = projection.profiles[profileId]?.points ?? 0;
  if (round.status === 'completed') {
    renderCompleted({root, state, round, profile, points, projection, onNavigate});
    return;
  }
  if (round.status === 'exhausted') {
    const availability = commands.roundAvailability({roundId: round.id});
    renderExhausted({
      root, round, profile, points, commands, onNavigate, ui,
      canExpand: availability.kind === 'exhausted' && availability.canExpand,
    });
    return;
  }
  const word = currentWord(projection, round);
  if (word === null) {
    const invalidKey = `${round.id}:${JSON.stringify(round.current)}`;
    root.replaceChildren(el('section', {attrs: {class: 'panel practice-finish'}}, [
      profileHeader(profile.value.name, points, onNavigate),
      message('Diese Vokabel wurde inzwischen geändert. Sie wird ohne Wertung ersetzt.'),
      el('p', {text: 'Die nächste zulässige Aufgabe wird vorbereitet.'}),
    ]));
    if (ui.invalidating !== invalidKey) {
      ui.invalidating = invalidKey;
      ui.notice = 'Die geänderte Vokabel wurde ohne Wertung übersprungen.';
      commands.next({roundId: round.id}).catch((error) => {
        ui.invalidating = null;
        root.append(message(error?.message || 'Die nächste Aufgabe konnte nicht geladen werden.', 'error'));
      });
    }
    return;
  }
  ui.invalidating = null;
  if (round.status === 'feedback') {
    renderFeedback({root, round, word, profile, points, commands, onNavigate, ui});
  } else {
    renderAsking({root, round, word, profile, points, commands, onNavigate, ui});
  }
}

export function renderPractice(options) {
  renderPracticeView(options, true);
}

export function renderPracticeLanding(options) {
  renderPracticeView(options, false);
}
