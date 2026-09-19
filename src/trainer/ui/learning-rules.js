import {project} from '../learning/progress.js';
import {DEFAULT_POLICY, currentPolicy} from '../model/policies.js';
import {el, field, button, message} from './dom.js';

const localState = new WeakMap();

function stateFor(root) {
  if (!localState.has(root)) {
    localState.set(root, {profileId: null, drafts: new Map(), notice: '', tone: 'info'});
  }
  return localState.get(root);
}

function activeProfiles(state) {
  return Object.values(project(state.ledger).entities.profiles)
    .filter((profile) => profile.value !== null && !profile.value.archived);
}

function valuesFrom(policy) {
  return {
    slowAfter: String(policy.slowAfter),
    refresh: policy.stopAfter === null,
    stopAfter: String(policy.stopAfter ?? Math.max(6, policy.slowAfter)),
    intervals: policy.intervals.map(String),
  };
}

function openDraft(state, profileId) {
  const current = currentPolicy(state.ledger, profileId);
  return {
    openedPolicyEventId: current.eventId,
    values: valuesFrom(current.policy),
    preview: null,
  };
}

function policyFrom(values) {
  return {
    slowAfter: Number(values.slowAfter),
    stopAfter: values.refresh ? null : Number(values.stopAfter),
    intervals: values.intervals.map(Number),
  };
}

function explanation(values) {
  const stop = values.refresh
    ? 'Gelernte Wörter werden weiterhin zur Auffrischung angeboten.'
    : `Nach ${values.stopAfter || '…'} richtigen Antworten hintereinander wird ein Wort nicht mehr automatisch abgefragt.`;
  return `Nach ${values.slowAfter || '…'} richtigen Antworten hintereinander kommt ein Wort seltener. ${stop}`;
}

export function discardLearningRuleDraft(root) {
  const ui = stateFor(root);
  ui.drafts.clear();
  ui.notice = '';
}

export function renderLearningRules({root, state, commands, profileId, onRefresh}) {
  const ui = stateFor(root);
  const container = root.querySelector('#adult-content') ?? root;
  const profiles = activeProfiles(state);
  if (!profiles.some(({id}) => id === ui.profileId)) {
    ui.profileId = profiles.some(({id}) => id === profileId) ? profileId : profiles[0]?.id ?? null;
  }
  const section = el('section', {attrs: {class: 'learning-rules stack', 'aria-labelledby': 'rules-title'}}, [
    el('header', {attrs: {class: 'section-heading'}}, [
      el('h1', {text: 'Lernregeln', attrs: {id: 'rules-title'}}),
      el('p', {text: 'Die Einstellungen gelten nur für das ausgewählte Kind und erst ab der nächsten neuen Runde.'}),
    ]),
  ]);
  if (profiles.length === 0) {
    section.append(message('Legen Sie zuerst ein aktives Kinderprofil an.'));
    container.append(section);
    return;
  }
  const profileSelect = el('select', {attrs: {'aria-label': 'Kind für Lernregeln'}}, profiles.map((profile) => (
    el('option', {text: profile.value.name, attrs: {value: profile.id}})
  )));
  profileSelect.value = ui.profileId;
  profileSelect.addEventListener('change', () => {
    ui.profileId = profileSelect.value;
    ui.notice = '';
    onRefresh();
  });
  section.append(field('Kind', profileSelect));
  if (ui.notice) section.append(message(ui.notice, ui.tone));

  const selected = profiles.find(({id}) => id === ui.profileId);
  if (!ui.drafts.has(selected.id)) ui.drafts.set(selected.id, openDraft(state, selected.id));
  const draft = ui.drafts.get(selected.id);
  const form = el('form', {attrs: {class: 'rules-form stack compact'}});
  const slow = el('select', {attrs: {
    name: 'slowAfter', 'aria-label': 'Ab wie vielen richtigen Antworten hintereinander seltener?',
  }}, Array.from({length: 9}, (_, index) => {
    const value = String(index + 2);
    return el('option', {text: value, attrs: {value}});
  }));
  slow.value = draft.values.slowAfter;
  const refresh = el('input', {attrs: {type: 'checkbox', name: 'refresh', checked: draft.values.refresh}});
  const stop = el('input', {attrs: {
    type: 'number', name: 'stopAfter', min: '2', max: '20', step: '1', value: draft.values.stopAfter,
    'aria-label': 'Nach wie vielen richtigen Antworten nicht mehr automatisch abfragen?',
  }});
  const stopField = field('Nach wie vielen richtigen Antworten nicht mehr automatisch abfragen?', stop);
  const details = el('details', {attrs: {class: 'rule-details'}}, [
    el('summary', {text: 'Wiederholungsabstände'}),
    el('p', {text: 'Vier Tagesabstände, positiv und nicht absteigend. Der letzte Abstand wiederholt sich.'}),
  ]);
  const intervals = draft.values.intervals.map((value, index) => {
    const input = el('input', {attrs: {
      type: 'number', min: '1', max: '365', step: '1', value,
      'data-rule-interval': '',
      'aria-label': `${index + 1}. Wiederholungsabstand in Tagen`,
    }});
    details.append(field(`${index + 1}. Abstand in Tagen`, input));
    return input;
  });
  const explanationNode = el('p', {text: explanation(draft.values), attrs: {class: 'rules-explanation'}});
  const effect = message(draft.preview === null
    ? 'Prüfen Sie die Auswirkung vor dem Speichern.'
    : `${draft.preview.excludedCount} Wörter werden in neuen Runden nicht mehr automatisch abgefragt. Heute sind ${draft.preview.dueCount} Wörter verfügbar.`);
  effect.classList.add('rules-effect');
  const updateDraft = () => {
    draft.values = {
      slowAfter: slow.value,
      refresh: refresh.checked,
      stopAfter: stop.value,
      intervals: intervals.map((input) => input.value),
    };
    draft.preview = null;
    stop.disabled = refresh.checked;
    stopField.hidden = refresh.checked;
    explanationNode.textContent = explanation(draft.values);
    effect.textContent = 'Prüfen Sie die Auswirkung vor dem Speichern.';
    effect.dataset.tone = 'info';
  };
  for (const control of [slow, refresh, stop, ...intervals]) {
    control.addEventListener(control === refresh ? 'change' : 'input', () => {
      if (control === refresh && !refresh.checked && !stop.value) {
        stop.value = String(Math.max(6, Number(slow.value) || 6));
      }
      updateDraft();
    });
  }
  updateDraft();
  form.append(
    field('Ab wie vielen richtigen Antworten hintereinander seltener?', slow),
    el('label', {attrs: {class: 'rule-toggle'}}, [refresh, 'Gelernte Wörter weiter auffrischen']),
    stopField,
    details,
    explanationNode,
    effect,
  );

  const preview = () => {
    updateDraft();
    try {
      const result = commands.learningRulePreview({profileId: selected.id, policy: policyFrom(draft.values)});
      draft.preview = result;
      effect.textContent = `${result.excludedCount} Wörter werden in neuen Runden nicht mehr automatisch abgefragt. Heute sind ${result.dueCount} Wörter verfügbar.`;
      if (result.policyEventId !== draft.openedPolicyEventId) {
        effect.textContent += ' Die gespeicherten Regeln wurden inzwischen geändert; Ihr Entwurf bleibt erhalten und kann nicht unbemerkt darüber gespeichert werden.';
        effect.dataset.tone = 'error';
      } else {
        effect.dataset.tone = 'info';
      }
      return result;
    } catch (error) {
      effect.textContent = error.message;
      effect.dataset.tone = 'error';
      return null;
    }
  };
  const submit = el('button', {text: 'Lernregeln speichern', attrs: {type: 'submit', class: 'primary'}});
  form.append(
    button('Auswirkung prüfen', preview, {class: 'secondary'}),
    button('Standardwerte einsetzen', () => {
      draft.values = valuesFrom(DEFAULT_POLICY);
      slow.value = draft.values.slowAfter;
      refresh.checked = draft.values.refresh;
      stop.value = draft.values.stopAfter;
      intervals.forEach((input, index) => { input.value = draft.values.intervals[index]; });
      updateDraft();
    }, {class: 'secondary'}),
    button('Gespeicherte Regeln neu laden', () => {
      ui.drafts.set(selected.id, openDraft(commands.getState(), selected.id));
      ui.notice = 'Der offene Entwurf wurde durch die aktuell gespeicherten Regeln ersetzt.';
      ui.tone = 'info';
      onRefresh();
    }, {class: 'secondary'}),
    submit,
  );
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submit.disabled) return;
    const checked = preview();
    if (checked === null) return;
    submit.disabled = true;
    try {
      await commands.setLearningRules({
        profileId: selected.id,
        expectedPolicyEventId: draft.openedPolicyEventId,
        policy: policyFrom(draft.values),
      });
      ui.drafts.delete(selected.id);
      ui.notice = `Die Lernregeln für ${selected.value.name} wurden gespeichert.`;
      ui.tone = 'info';
      onRefresh();
    } catch (error) {
      effect.textContent = error.message;
      effect.dataset.tone = 'error';
      submit.disabled = false;
    }
  });
  section.append(form);
  container.append(section);
}
