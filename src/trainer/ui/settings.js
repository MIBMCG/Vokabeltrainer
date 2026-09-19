import {project} from '../learning/progress.js';
import {el, field, button, message} from './dom.js';
import {renderBackup} from './backup.js';
import {renderSync} from './sync.js';

function input(name, {value = '', maxlength = 80, required = true, type = 'text'} = {}) {
  return el('input', {attrs: {name, value, maxlength, required, type}});
}

function values(bucket) {
  return Object.values(bucket).filter((entity) => entity.value !== null);
}

function entityForm({legend, value, onSubmit, submitText = 'Speichern'}) {
  const form = el('form', {attrs: {class: 'stack compact'}});
  const name = input('name', {value: value?.name ?? '', maxlength: 80});
  const submit = el('button', {text: submitText, attrs: {type: 'submit', class: 'primary'}});
  form.append(el('h3', {text: legend}), field('Name', name), submit);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    submit.disabled = true;
    try {
      await onSubmit(name.value.trim());
    } finally {
      submit.disabled = false;
    }
  });
  return form;
}

function report(ui, text, tone = 'info') {
  ui.notice = text;
  ui.tone = tone;
}

function renderChildren(container, projection, commands, onRefresh, ui) {
  const section = el('section', {attrs: {class: 'subpanel', 'aria-labelledby': 'children-title'}}, [
    el('h2', {text: 'Kinder', attrs: {id: 'children-title'}}),
    el('p', {text: 'Jedes Kind hat einen getrennten Lernstand.'}),
  ]);
  const add = el('details', {}, [el('summary', {text: 'Kind hinzufügen'})]);
  add.append(entityForm({
    legend: 'Kind hinzufügen', submitText: 'Kind hinzufügen',
    onSubmit: async (name) => {
      try {
        await commands.revise({
          entityType: 'profile', entityId: crypto.randomUUID(), expectedHeads: [],
          value: {name, archived: false},
        });
        report(ui, 'Das Kind wurde hinzugefügt.');
      } catch (error) {
        report(ui, error.message, 'error');
      }
      onRefresh();
    },
  }));
  section.append(add);
  const list = el('div', {attrs: {class: 'management-list compact-management'}});
  for (const profile of values(projection.entities.profiles)) {
    const expectedHeads = [...profile.heads];
    const card = el('article', {attrs: {class: 'management-card'}}, [
      el('h3', {text: profile.value.name}),
      el('p', {text: profile.value.archived ? 'Archiviert' : 'Aktiv', attrs: {class: 'status-chip'}}),
    ]);
    const edit = el('details', {}, [el('summary', {text: 'Bearbeiten'})]);
    edit.append(entityForm({
      legend: 'Anzeigenamen ändern', value: profile.value,
      onSubmit: async (name) => {
        try {
          await commands.revise({
            entityType: 'profile', entityId: profile.id, expectedHeads,
            value: {...profile.value, name},
          });
          report(ui, 'Der Anzeigename wurde gespeichert.');
        } catch (error) {
          report(ui, error.message, 'error');
        }
        onRefresh();
      },
    }));
    card.append(edit, button(profile.value.archived ? 'Reaktivieren' : 'Archivieren', async () => {
      try {
        await commands.revise({
          entityType: 'profile', entityId: profile.id, expectedHeads,
          value: {...profile.value, archived: !profile.value.archived},
        });
        report(ui, profile.value.archived ? 'Das Kind ist wieder aktiv.' : 'Das Kind wurde archiviert.');
      } catch (error) {
        report(ui, error.message, 'error');
      }
      onRefresh();
    }, {class: 'secondary'}));
    list.append(card);
  }
  section.append(list);
  container.append(section);
}

export function pinResetForm({pinGate, onSuccess}) {
  const reset = el('form', {attrs: {class: 'stack compact'}});
  const status = message('Die Lerndaten bleiben beim lokalen Zurücksetzen erhalten.');
  reset.append(
    el('p', {text: 'Geben Sie zur Bestätigung genau „PIN zurücksetzen“ ein.'}),
    field('Bestätigungstext', input('confirmation', {maxlength: 30})),
    field('Neue PIN', input('next', {maxlength: 4, type: 'password'})),
    field('Neue PIN wiederholen', input('repeat', {maxlength: 4, type: 'password'})),
    status,
  );
  const submit = el('button', {text: 'Vergessene PIN lokal zurücksetzen', attrs: {type: 'submit', class: 'secondary'}});
  reset.append(submit);
  reset.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submit.disabled) return;
    submit.disabled = true;
    const data = new FormData(reset);
    try {
      await pinGate.reset(data.get('confirmation'), data.get('next'), data.get('repeat'));
      reset.reset();
      onSuccess();
    } catch (error) {
      status.textContent = error.message;
      status.dataset.tone = 'error';
    } finally {
      submit.disabled = false;
    }
  });
  return el('details', {}, [el('summary', {text: 'PIN vergessen'}), reset]);
}

function renderPinSettings(container, pinGate, onRefresh, ui) {
  const section = el('section', {attrs: {class: 'subpanel'}}, [
    el('h2', {text: 'PIN auf diesem Gerät'}),
    el('p', {text: 'Die PIN verhindert versehentliche Änderungen. Sie ist keine Sicherheitsgrenze.'}),
  ]);
  const change = el('form', {attrs: {class: 'stack compact'}});
  for (const [name, label] of [['current', 'Aktuelle PIN'], ['next', 'Neue PIN'], ['repeat', 'Neue PIN wiederholen']]) {
    change.append(field(label, input(name, {maxlength: 4, type: 'password'})));
  }
  const changeButton = el('button', {text: 'PIN ändern', attrs: {type: 'submit', class: 'secondary'}});
  change.append(changeButton);
  change.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(change);
    try {
      await pinGate.change(data.get('current'), data.get('next'), data.get('repeat'));
      report(ui, 'Die lokale PIN wurde geändert.');
      change.reset();
    } catch (error) {
      report(ui, error.message, 'error');
    }
    onRefresh();
  });
  section.append(el('details', {}, [el('summary', {text: 'PIN ändern'}), change]));
  section.append(pinResetForm({pinGate, onSuccess: () => {
    report(ui, 'Die lokale PIN wurde zurückgesetzt. Die Lerndaten blieben erhalten.');
    onRefresh();
  }}));
  container.append(section);
}

export function renderSettings({
  root, state, commands, pinGate, sync, restore, auth, onRefresh, onConnected, onDownload,
  ui = {},
}) {
  const container = root.querySelector('#adult-content') ?? root;
  const projection = project(state.ledger);
  container.append(el('header', {attrs: {class: 'section-heading'}}, [
    el('h1', {text: 'Einstellungen'}),
    el('p', {text: 'Kinder, Geräteschutz, Google-Verbindung und Sicherung an einem Ort.'}),
  ]));
  renderChildren(container, projection, commands, onRefresh, ui);
  renderPinSettings(container, pinGate, onRefresh, ui);

  const syncHost = el('section', {attrs: {class: 'settings-service', 'aria-label': 'Google-Abgleich'}});
  container.append(syncHost);
  renderSync({
    root: syncHost, state, sync, restore, auth, commands,
    isUnlocked: () => pinGate.isUnlocked(), onRefresh, onConnected,
  });

  const backupHost = el('section', {attrs: {class: 'settings-service', 'aria-label': 'Sicherung'}});
  container.append(backupHost);
  renderBackup({
    root: backupHost, state, restore, onDownload,
    isUnlocked: () => pinGate.isUnlocked(), onRefresh,
    getState: () => commands.getState(),
  });
}
