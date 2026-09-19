import {project} from '../learning/progress.js';
import {el, button, message} from './dom.js';
import {pinResetForm, renderSettings} from './settings.js';
import {
  discardVocabularyDraft,
  renderVocabulary,
  requestVocabularyNavigation,
} from './vocabulary.js';

const localState = new WeakMap();

function viewState(root) {
  if (!localState.has(root)) {
    localState.set(root, {section: 'vocabulary', notice: '', tone: 'info'});
  }
  return localState.get(root);
}

// Background commits never replace the live editor: its controls and closures
// retain both the draft and the revision heads with which editing began.
export function adultStateChanged(root, state) {
  const ui = viewState(root);
  if (JSON.stringify(state.ledger) === ui.renderedLedger || root.querySelector('#adult-background-notice')) return;
  const notice = el('aside', {attrs: {id: 'adult-background-notice', class: 'message', role: 'status'}}, [
    el('p', {text: 'Im Hintergrund wurde der Datenstand geändert. Ihre offenen Eingaben bleiben erhalten. Veraltete Bearbeitungen werden beim Speichern geprüft.'}),
    button('Ansicht neu laden (Eingaben verwerfen)', () => {
      discardVocabularyDraft(root);
      ui.refresh();
    }, {class: 'secondary'}),
  ]);
  root.querySelector('.adult-header')?.after(notice);
}

function values(bucket) {
  return Object.values(bucket).filter((entity) => entity.value !== null);
}

function formatDate(value) {
  if (!value) return '—';
  return value.slice(0, 10);
}

function renderProgress(container, projection) {
  const section = el('section', {attrs: {'aria-labelledby': 'progress-title'}}, [
    el('h1', {text: 'Lernstand', attrs: {id: 'progress-title'}}),
    el('p', {text: 'Die Werte gehören jeweils nur zum ausgewählten Kind.'}),
  ]);
  for (const profile of values(projection.entities.profiles)) {
    const profileProgress = projection.profiles[profile.id];
    section.append(el('h2', {text: profile.value.name}));
    const wrapper = el('div', {attrs: {class: 'table-scroll'}});
    const table = el('table', {}, [el('thead', {}, [el('tr', {}, [
      'Vokabel', 'Versuche', 'Richtig', 'Falsch', 'Serie', 'Letzte Übung', 'Fälligkeit',
    ].map((label) => el('th', {text: label, attrs: {scope: 'col'}})))])]);
    const body = el('tbody');
    for (const word of values(projection.entities.words)) {
      const stats = profileProgress?.words[word.id] ?? {
        attempts: 0, correct: 0, wrong: 0, streak: 0, lastPracticedAt: null, dueDay: null,
      };
      body.append(el('tr', {attrs: {'data-progress-word': word.value.german}}, [
        el('th', {text: word.value.german, attrs: {scope: 'row'}}),
        el('td', {text: stats.attempts, attrs: {'data-stat': 'attempts'}}),
        el('td', {text: stats.correct, attrs: {'data-stat': 'correct'}}),
        el('td', {text: stats.wrong, attrs: {'data-stat': 'wrong'}}),
        el('td', {text: stats.streak, attrs: {'data-stat': 'streak'}}),
        el('td', {text: formatDate(stats.lastPracticedAt)}),
        el('td', {text: stats.dueDay ?? '—'}),
      ]));
    }
    table.append(body);
    wrapper.append(table);
    section.append(wrapper);
  }
  container.append(section);
}

function renderRules(container) {
  container.append(el('section', {attrs: {'aria-labelledby': 'rules-title'}}, [
    el('h1', {text: 'Lernregeln', attrs: {id: 'rules-title'}}),
    el('p', {text: 'Diese Regeln gelten für alle Kinder und können in dieser Version noch nicht geändert werden.'}),
    el('dl', {attrs: {class: 'rules-summary'}}, [
      el('dt', {text: 'Punkte'}),
      el('dd', {text: '10 Punkte je richtiger Antwort, 20 Punkte für eine abgeschlossene Runde.'}),
      el('dt', {text: 'Wiederholen'}),
      el('dd', {text: 'Fehler erscheinen häufiger. Nach drei richtigen Antworten pausiert das Wort für den Rest der Runde.'}),
      el('dt', {text: 'Lernabstände'}),
      el('dd', {text: 'Richtige Antworten verlängern den Abstand bis zur nächsten Wiederholung.'}),
    ]),
  ]));
}

export {pinResetForm};

export function renderAdult({root, state, commands, pinGate, onNavigate, sync, restore, auth, onDownload, onConnected}) {
  const ui = viewState(root);
  const projection = project(state.ledger);
  const rerender = () => {
    if (!pinGate.isUnlocked()) {
      discardVocabularyDraft(root);
      onNavigate('profiles');
      return;
    }
    renderAdult({
      root, state: commands.getState(), commands, pinGate, onNavigate,
      sync, restore, auth, onDownload, onConnected,
    });
  };
  ui.renderedLedger = JSON.stringify(state.ledger);
  ui.refresh = rerender;
  const page = el('div', {attrs: {class: 'adult-layout'}});
  const leave = () => requestVocabularyNavigation(root, () => {
    discardVocabularyDraft(root);
    onNavigate('profiles');
  });
  const header = el('header', {attrs: {class: 'adult-header'}}, [
    el('div', {}, [el('p', {text: 'Geschützter Bereich', attrs: {class: 'eyebrow'}}), el('h1', {text: 'Für Erwachsene'})]),
    button('Zur Profilauswahl', leave, {class: 'secondary'}),
  ]);
  const nav = el('nav', {attrs: {id: 'adult-nav', class: 'adult-nav', 'aria-label': 'Erwachsenenverwaltung'}});
  for (const [key, label] of [
    ['vocabulary', 'Vokabeln'], ['progress', 'Lernstand'],
    ['rules', 'Lernregeln'], ['settings', 'Einstellungen'],
  ]) {
    nav.append(button(label, () => requestVocabularyNavigation(root, () => {
      discardVocabularyDraft(root);
      ui.section = key;
      rerender();
    }), {class: ui.section === key ? 'active' : '', 'aria-current': ui.section === key ? 'page' : null}));
  }
  const content = el('section', {attrs: {
    id: 'adult-content', tabindex: '-1', 'aria-label': 'Inhalt der Erwachsenenverwaltung',
  }});
  page.append(header, nav, content);
  root.replaceChildren(page);
  if (ui.notice) content.append(message(ui.notice, ui.tone));
  if (projection.conflicts.length > 0 || projection.epochConflict) {
    content.append(message('Mindestens eine Änderung benötigt eine Konfliktklärung. Neue Bearbeitungen sind bis dahin eingeschränkt.', 'error'));
  }
  if (ui.section === 'vocabulary') {
    renderVocabulary({root, state, commands, profileId: null, onRefresh: rerender});
  } else if (ui.section === 'progress') renderProgress(content, projection);
  else if (ui.section === 'rules') renderRules(content);
  else renderSettings({
    root, state, commands, pinGate, sync, restore, auth, onRefresh: rerender,
    onConnected, onDownload, ui,
  });
}
