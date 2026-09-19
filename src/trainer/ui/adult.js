import {project} from '../learning/progress.js';
import {el, button, message} from './dom.js';
import {pinResetForm, renderSettings} from './settings.js';
import {discardLearningRuleDraft, renderLearningRules} from './learning-rules.js';
import {renderStatistics} from './statistics.js';
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
      discardLearningRuleDraft(root);
      ui.refresh();
    }, {class: 'secondary'}),
  ]);
  root.querySelector('.adult-header')?.after(notice);
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
  } else if (ui.section === 'progress') renderStatistics({
    root, state, commands, profileId: null, onRefresh: rerender,
  });
  else if (ui.section === 'rules') renderLearningRules({
    root, state, commands, profileId: null, onRefresh: rerender,
  });
  else renderSettings({
    root, state, commands, pinGate, sync, restore, auth, onRefresh: rerender,
    onConnected, onDownload, ui,
  });
}
