import {applyRows, parseTable, validateRows} from '../adult/import.js';
import {project} from '../learning/progress.js';
import {semanticWord} from '../model/revisions.js';
import {el, field, button, message} from './dom.js';

const localState = new WeakMap();
const MAX_ANSWERS_TEXT_LENGTH = 4_200;
const NEW_LESSON = '__new__';

function values(bucket) {
  return Object.values(bucket).filter((entity) => entity.value !== null);
}

function input(name, {value = '', maxlength = 80, required = true, type = 'text'} = {}) {
  return el('input', {attrs: {name, value, maxlength, required, type}});
}

function answers(text) {
  return text.split('|').map((value) => value.trim()).filter(Boolean);
}

function stateFor(root, profileId = null) {
  if (!localState.has(root)) {
    localState.set(root, {
      profileId,
      lessonId: null,
      search: '',
      filter: 'active',
      openEditor: null,
      draft: null,
      importRows: null,
      importIssues: [],
      notice: '',
      tone: 'info',
    });
  }
  return localState.get(root);
}

function report(ui, text, tone = 'info') {
  ui.notice = text;
  ui.tone = tone;
}

function closeDecision(root) {
  root.querySelector('#adult-unsaved-dialog')?.remove();
}

export function requestVocabularyNavigation(root, action) {
  const ui = stateFor(root);
  closeDecision(root);
  if (!ui.draft?.isDirty()) {
    ui.draft = null;
    action();
    return;
  }
  const titleId = 'adult-unsaved-title';
  const dialog = el('dialog', {attrs: {
    id: 'adult-unsaved-dialog', 'aria-labelledby': titleId,
  }}, [
    el('h2', {text: 'Ungespeicherte Eingaben', attrs: {id: titleId}}),
    el('p', {text: 'Möchten Sie die Eingaben speichern, verwerfen oder weiterbearbeiten?'}),
  ]);
  const finish = () => {
    closeDecision(root);
    ui.draft = null;
    action();
  };
  dialog.append(
    button('Speichern', async () => {
      const saved = await ui.draft?.save();
      if (saved) finish();
    }, {class: 'primary'}),
    button('Verwerfen', () => {
      ui.draft?.discard();
      finish();
    }, {class: 'secondary'}),
    button('Weiterbearbeiten', () => closeDecision(root), {class: 'secondary'}),
  );
  root.append(dialog);
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
}

export function discardVocabularyDraft(root) {
  const ui = stateFor(root);
  closeDecision(root);
  ui.openEditor = null;
  ui.draft = null;
  ui.importRows = null;
  ui.importIssues = [];
}

function lessonFields({profiles, lessons, selectedLessonId, profileId}) {
  const wrapper = el('div', {attrs: {class: 'lesson-target stack compact'}});
  const select = el('select', {attrs: {name: 'lessonId', 'aria-label': 'Lektion'}}, [
    ...lessons.filter((lesson) => !lesson.value.archived).map((lesson) => (
      el('option', {text: lesson.value.name, attrs: {value: lesson.id}})
    )),
    el('option', {text: 'Neue Lektion anlegen …', attrs: {value: NEW_LESSON}}),
  ]);
  select.value = lessons.some(({id}) => id === selectedLessonId) ? selectedLessonId : NEW_LESSON;
  const newLesson = input('newLessonName', {maxlength: 80, required: false});
  newLesson.setAttribute('aria-label', 'Neue Lektion');
  const assignments = el('fieldset', {}, [el('legend', {text: 'Neue Lektion für diese Kinder freigeben'})]);
  for (const profile of profiles) {
    const checkbox = el('input', {attrs: {
      type: 'checkbox', name: 'profileIds', value: profile.id, checked: profile.id === profileId,
    }});
    assignments.append(el('label', {}, [checkbox, profile.value.name]));
  }
  const newFields = el('div', {attrs: {class: 'new-lesson-fields'}}, [field('Neue Lektion', newLesson), assignments]);
  const update = () => { newFields.hidden = select.value !== NEW_LESSON; };
  select.addEventListener('change', update);
  update();
  wrapper.append(field('Lektion', select), newFields);
  return {wrapper, select, newLesson, assignments};
}

async function resolveLesson({fields, commands}) {
  if (fields.select.value !== NEW_LESSON) return fields.select.value;
  const name = fields.newLesson.value.trim();
  if (!name) throw new Error('Bitte geben Sie einen Namen für die neue Lektion ein.');
  const lessonId = crypto.randomUUID();
  const profileIds = [...fields.assignments.querySelectorAll('input:checked')].map(({value}) => value).sort();
  await commands.revise({
    entityType: 'lesson', entityId: lessonId, expectedHeads: [],
    value: {name, archived: false, profileIds},
  });
  return lessonId;
}

function setFormError(form, error) {
  form.querySelector('[data-form-error]')?.remove();
  form.append(message(error.message, 'error'));
  form.lastElementChild.dataset.formError = '';
}

function editorDirty(form, initial) {
  return () => JSON.stringify([...new FormData(form).entries()]) !== initial;
}

function renderWordForm({root, container, ui, word, projection, commands, onRefresh}) {
  const form = el('form', {attrs: {class: 'stack compact vocabulary-editor'}});
  const german = input('german', {value: word?.value.german ?? '', maxlength: 200});
  const answerInput = input('answers', {
    value: word?.value.answers.join(' | ') ?? '', maxlength: MAX_ANSWERS_TEXT_LENGTH,
  });
  const hint = input('hint', {value: word?.value.hint ?? '', maxlength: 300, required: false});
  form.append(
    el('h3', {text: word ? `${word.value.german} bearbeiten` : 'Wort hinzufügen'}),
    field('Deutsches Wort', german),
    field('Englische Lösungen (mit | trennen)', answerInput),
    field('Bedeutungshinweis (optional)', hint),
  );
  const profiles = values(projection.entities.profiles).filter((profile) => !profile.value.archived);
  const lessons = values(projection.entities.lessons);
  const target = word ? null : lessonFields({
    profiles, lessons, selectedLessonId: ui.openEditor.lessonId, profileId: ui.openEditor.profileId,
  });
  if (target) form.append(target.wrapper);
  const preview = el('p', {attrs: {class: 'hint', 'data-revision-preview': ''}});
  const updatePreview = () => {
    if (!word) return;
    const next = {german: german.value, answers: answers(answerInput.value), hint: hint.value};
    preview.textContent = JSON.stringify(semanticWord(next)) === JSON.stringify(semanticWord(word.value))
      ? 'Die Lernserie bleibt erhalten.'
      : 'Bedeutung oder Lösungen ändern sich: Die aktuelle Serie beginnt für diese Fassung neu.';
  };
  for (const control of [german, answerInput, hint]) control.addEventListener('input', updatePreview);
  updatePreview();
  form.append(preview);
  const submit = el('button', {
    text: word ? 'Änderung speichern' : 'Vokabel hinzufügen',
    attrs: {type: 'submit', class: 'primary'},
  });
  form.append(submit, button('Abbrechen', () => {
    requestVocabularyNavigation(root, () => {
      ui.openEditor = null;
      ui.draft = null;
      onRefresh();
    });
  }, {class: 'secondary'}));
  const initial = JSON.stringify([...new FormData(form).entries()]);
  const save = async () => {
    submit.disabled = true;
    try {
      const lessonId = word?.value.lessonId ?? await resolveLesson({fields: target, commands});
      await commands.revise({
        entityType: 'word', entityId: word?.id ?? crypto.randomUUID(),
        expectedHeads: [...ui.openEditor.expectedHeads],
        value: {
          lessonId,
          german: german.value.trim(), answers: answers(answerInput.value), hint: hint.value.trim(),
          archived: word?.value.archived ?? false,
        },
      });
      ui.lessonId = lessonId;
      ui.openEditor = null;
      ui.draft = null;
      report(ui, word ? 'Die Vokabel wurde gespeichert.' : 'Die Vokabel wurde hinzugefügt.');
      onRefresh();
      return true;
    } catch (error) {
      setFormError(form, error);
      submit.disabled = false;
      return false;
    }
  };
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    await save();
  });
  ui.draft = {
    isDirty: editorDirty(form, initial), save,
    discard: () => { ui.openEditor = null; },
  };
  container.append(form);
}

function renderLessonEditor({root, container, ui, lesson, projection, commands, onRefresh}) {
  const expectedHeads = [...ui.openEditor.expectedHeads];
  const form = el('form', {attrs: {class: 'stack compact vocabulary-editor'}});
  const name = input('name', {value: lesson.value.name, maxlength: 80});
  const profiles = values(projection.entities.profiles).filter((profile) => !profile.value.archived);
  const group = el('fieldset', {}, [el('legend', {text: 'Für diese Kinder freigeben'})]);
  for (const profile of profiles) {
    group.append(el('label', {}, [
      el('input', {attrs: {
        type: 'checkbox', name: 'profileIds', value: profile.id,
        checked: lesson.value.profileIds.includes(profile.id),
      }}),
      profile.value.name,
    ]));
  }
  const submit = el('button', {text: 'Speichern', attrs: {type: 'submit', class: 'primary'}});
  form.append(el('h3', {text: 'Lektion bearbeiten'}), field('Name', name), group, submit,
    button('Abbrechen', () => requestVocabularyNavigation(root, () => {
      ui.openEditor = null;
      ui.draft = null;
      onRefresh();
    }), {class: 'secondary'}));
  const initial = JSON.stringify([...new FormData(form).entries()]);
  const save = async () => {
    submit.disabled = true;
    try {
      const data = new FormData(form);
      await commands.revise({
        entityType: 'lesson', entityId: lesson.id, expectedHeads,
        value: {...lesson.value, name: name.value.trim(), profileIds: data.getAll('profileIds').sort()},
      });
      ui.openEditor = null;
      ui.draft = null;
      report(ui, 'Lektion und Zuordnung wurden gespeichert.');
      onRefresh();
      return true;
    } catch (error) {
      setFormError(form, error);
      submit.disabled = false;
      return false;
    }
  };
  form.addEventListener('submit', async (event) => { event.preventDefault(); await save(); });
  ui.draft = {isDirty: editorDirty(form, initial), save, discard: () => { ui.openEditor = null; }};
  container.append(form);
}

function renderImport({root, container, ui, projection, commands, onRefresh}) {
  const panel = el('section', {attrs: {class: 'subpanel vocabulary-editor', 'aria-labelledby': 'import-title'}}, [
    el('h3', {text: 'Mehrere Wörter einfügen', attrs: {id: 'import-title'}}),
    el('p', {text: 'Spalten: Deutsch, Englisch, optional Bedeutungshinweis. Mehrere Lösungen mit | trennen.'}),
  ]);
  const profiles = values(projection.entities.profiles).filter((profile) => !profile.value.archived);
  const lessons = values(projection.entities.lessons);
  const target = lessonFields({profiles, lessons, selectedLessonId: ui.openEditor.lessonId, profileId: ui.openEditor.profileId});
  const text = el('textarea', {attrs: {id: 'import-text', rows: '6', 'aria-label': 'Tabellenzeilen'}});
  panel.append(target.wrapper, field('Tabellenzeilen', text));
  panel.append(button('Vorschau prüfen', () => {
    const parsed = parseTable(text.value);
    ui.importRows = parsed.rows;
    ui.importIssues = parsed.issues;
    ui.openEditor.importTarget = {
      lessonId: target.select.value,
      newLessonName: target.newLesson.value,
      profileIds: [...target.assignments.querySelectorAll('input:checked')].map(({value}) => value),
    };
    onRefresh();
  }, {id: 'import-preview', class: 'secondary'}));

  if (ui.openEditor.importTarget) {
    target.select.value = ui.openEditor.importTarget.lessonId;
    target.select.dispatchEvent(new Event('change'));
    target.newLesson.value = ui.openEditor.importTarget.newLessonName;
    for (const checkbox of target.assignments.querySelectorAll('input')) {
      checkbox.checked = ui.openEditor.importTarget.profileIds.includes(checkbox.value);
    }
  }
  const selectedLessonId = target.select.value;
  const activeWords = values(projection.entities.words).filter((word) => (
    !word.value.archived && selectedLessonId !== NEW_LESSON && word.value.lessonId === selectedLessonId
  ));
  let allIssues = [];
  let validated = {rows: [], issues: []};
  if (ui.importRows !== null) {
    validated = validateRows(ui.importRows, activeWords.map(({value}) => value));
    allIssues = [...ui.importIssues, ...validated.issues];
    if (allIssues.length) {
      panel.append(message('Bitte klären Sie alle markierten Zeilen.', 'error'), el('ul', {attrs: {class: 'issues'}},
        allIssues.map((issue) => el('li', {text: `${issue.rowId}: ${issue.message}`}))));
    }
    const preview = el('div', {attrs: {class: 'import-preview'}});
    for (const row of validated.rows) {
      const german = input('german', {value: row.german, maxlength: 200});
      const answerInput = input('answers', {value: row.answers.join(' | '), maxlength: MAX_ANSWERS_TEXT_LENGTH});
      const hint = input('hint', {value: row.hint, maxlength: 300, required: false});
      const decision = el('select', {attrs: {'aria-label': 'Entscheidung'}}, [
        el('option', {text: 'Übernehmen', attrs: {value: 'include'}}),
        el('option', {text: 'Überspringen', attrs: {value: 'skip'}}),
        el('option', {text: 'Als eigene Bedeutung übernehmen', attrs: {value: 'separate'}}),
      ]);
      decision.value = row.decision;
      const replace = (changes, resolveStructure = false) => {
        ui.importRows = ui.importRows.map((entry) => entry.rowId === row.rowId ? {...entry, ...changes} : entry);
        if (resolveStructure) ui.importIssues = ui.importIssues.filter((issue) => issue.rowId !== row.rowId);
        onRefresh();
      };
      german.addEventListener('change', () => replace({german: german.value}));
      answerInput.addEventListener('change', () => replace({answers: answers(answerInput.value)}));
      hint.addEventListener('change', () => replace({hint: hint.value}));
      decision.addEventListener('change', () => replace({decision: decision.value}, decision.value === 'skip'));
      const rowPanel = el('div', {attrs: {class: 'import-row', 'data-import-row': row.rowId}}, [
        field('Deutsch', german), field('Englisch', answerInput), field('Hinweis', hint), field('Entscheidung', decision),
      ]);
      if (ui.importIssues.some((issue) => issue.rowId === row.rowId)) {
        rowPanel.append(button('Struktur nach Prüfung bestätigen', () => {
          ui.importIssues = ui.importIssues.filter((issue) => issue.rowId !== row.rowId);
          onRefresh();
        }, {class: 'secondary'}));
      }
      preview.append(rowPanel);
    }
    panel.append(preview);
  }
  let apply;
  const save = async () => {
    apply.disabled = true;
    try {
      const currentValidation = validateRows(ui.importRows ?? [], activeWords.map(({value}) => value));
      if (ui.importIssues.length || currentValidation.issues.length) throw new Error('Bitte klären Sie zuerst alle Importhinweise.');
      const lessonId = await resolveLesson({fields: target, commands});
      await applyRows(currentValidation.rows, async (row) => {
        await commands.revise({
          entityType: 'word', entityId: crypto.randomUUID(), expectedHeads: [],
          value: {lessonId, german: row.german, answers: row.answers, hint: row.hint, archived: false},
        });
      }, (remaining) => { ui.importRows = remaining; ui.importIssues = []; });
      ui.lessonId = lessonId;
      ui.openEditor = null;
      ui.draft = null;
      ui.importRows = null;
      report(ui, 'Die geprüften Tabellenzeilen wurden übernommen.');
      onRefresh();
      return true;
    } catch (error) {
      setFormError(panel, error);
      apply.disabled = false;
      return false;
    }
  };
  apply = button('Geprüfte Zeilen übernehmen', save, {
    id: 'import-apply', class: 'primary', disabled: ui.importRows === null || allIssues.length > 0,
  });
  panel.append(apply, button('Abbrechen', () => requestVocabularyNavigation(root, () => {
    discardVocabularyDraft(root);
    onRefresh();
  }), {class: 'secondary'}));
  ui.draft = {
    isDirty: () => text.value.trim() !== '' || ui.importRows !== null,
    save,
    discard: () => { ui.openEditor = null; ui.importRows = null; ui.importIssues = []; },
  };
  container.append(panel);
}

function chooseWithBoundary(root, ui, onRefresh, change) {
  requestVocabularyNavigation(root, () => {
    discardVocabularyDraft(root);
    change();
    onRefresh();
  });
}

export function renderVocabulary({root, state, commands, profileId, onRefresh}) {
  const ui = stateFor(root, profileId);
  const container = root.querySelector('#adult-content') ?? root;
  const projection = project(state.ledger);
  const profiles = values(projection.entities.profiles).filter((profile) => !profile.value.archived);
  if (!profiles.some(({id}) => id === ui.profileId)) ui.profileId = profiles[0]?.id ?? null;
  const availableLessons = values(projection.entities.lessons);
  if (!availableLessons.some(({id}) => id === ui.lessonId)) {
    ui.lessonId = availableLessons.find((lesson) => !lesson.value.archived)?.id ?? availableLessons[0]?.id ?? null;
  }
  const selectedLesson = projection.entities.lessons[ui.lessonId];

  const heading = el('header', {attrs: {class: 'section-heading'}}, [
    el('h1', {text: 'Vokabeln'}),
    el('p', {text: 'Wählen Sie Kind und Lektion. Formulare öffnen sich nur bei Bedarf.'}),
  ]);
  const selectors = el('div', {attrs: {class: 'vocabulary-selectors'}});
  const profileSelect = el('select', {attrs: {'aria-label': 'Kind auswählen'}}, profiles.map((profile) => (
    el('option', {text: profile.value.name, attrs: {value: profile.id}})
  )));
  profileSelect.value = ui.profileId ?? '';
  profileSelect.addEventListener('change', () => chooseWithBoundary(root, ui, onRefresh, () => {
    ui.profileId = profileSelect.value;
    ui.lessonId = null;
  }));
  const lessonSelect = el('select', {attrs: {'aria-label': 'Lektion auswählen'}}, availableLessons.map((lesson) => (
    el('option', {text: [
      lesson.value.name,
      lesson.value.archived ? ' (archiviert)' : '',
      !lesson.value.profileIds.includes(ui.profileId) ? ' (nicht zugeordnet)' : '',
    ].join(''), attrs: {value: lesson.id}})
  )));
  lessonSelect.value = ui.lessonId ?? '';
  lessonSelect.addEventListener('change', () => chooseWithBoundary(root, ui, onRefresh, () => {
    ui.lessonId = lessonSelect.value;
  }));
  selectors.append(field('Kind', profileSelect), field('Lektion', lessonSelect));
  container.append(heading, selectors);
  if (ui.notice) container.append(message(ui.notice, ui.tone));

  if (selectedLesson?.value) {
    const lessonBar = el('div', {attrs: {class: 'lesson-actions'}}, [
      el('strong', {text: selectedLesson.value.name}),
      button('Lektion bearbeiten', () => {
        ui.openEditor = {
          kind: 'lesson', entityId: selectedLesson.id, expectedHeads: [...selectedLesson.heads],
          profileId: ui.profileId, lessonId: selectedLesson.id,
        };
        onRefresh();
      }, {class: 'secondary'}),
      button(selectedLesson.value.archived ? 'Lektion reaktivieren' : 'Lektion archivieren', async () => {
        try {
          await commands.revise({
            entityType: 'lesson', entityId: selectedLesson.id, expectedHeads: [...selectedLesson.heads],
            value: {...selectedLesson.value, archived: !selectedLesson.value.archived},
          });
          report(ui, selectedLesson.value.archived ? 'Die Lektion ist wieder aktiv.' : 'Die Lektion wurde archiviert.');
        } catch (error) {
          report(ui, error.message, 'error');
        }
        onRefresh();
      }, {class: 'secondary'}),
    ]);
    container.append(lessonBar);
  }

  if (ui.openEditor?.kind === 'word') {
    const word = projection.entities.words[ui.openEditor.entityId];
    if (word?.value) renderWordForm({root, container, ui, word, projection, commands, onRefresh});
  } else if (ui.openEditor?.kind === 'add') {
    renderWordForm({root, container, ui, word: null, projection, commands, onRefresh});
  } else if (ui.openEditor?.kind === 'import') {
    renderImport({root, container, ui, projection, commands, onRefresh});
  } else if (ui.openEditor?.kind === 'lesson' && selectedLesson?.value) {
    renderLessonEditor({root, container, ui, lesson: selectedLesson, projection, commands, onRefresh});
  } else {
    ui.openEditor = null;
    ui.draft = null;
    const actions = el('div', {attrs: {class: 'vocabulary-actions'}}, [
      button('Wort hinzufügen', () => {
        ui.openEditor = {kind: 'add', expectedHeads: [], profileId: ui.profileId, lessonId: ui.lessonId};
        onRefresh();
      }, {class: 'primary'}),
      button('Mehrere Wörter einfügen', () => {
        ui.openEditor = {kind: 'import', expectedHeads: [], profileId: ui.profileId, lessonId: ui.lessonId};
        ui.importRows = null;
        ui.importIssues = [];
        onRefresh();
      }, {class: 'secondary'}),
    ]);
    const filters = el('div', {attrs: {class: 'vocabulary-filters'}}, [
      field('Vokabeln suchen', el('input', {attrs: {type: 'search', value: ui.search, 'aria-label': 'Vokabeln suchen'}})),
      button('Aktiv', () => { ui.filter = 'active'; onRefresh(); }, {class: ui.filter === 'active' ? 'active' : ''}),
      button('Archiviert', () => { ui.filter = 'archived'; onRefresh(); }, {class: ui.filter === 'archived' ? 'active' : ''}),
    ]);
    const search = filters.querySelector('input');
    search.addEventListener('input', () => { ui.search = search.value; onRefresh(); });
    container.append(actions, filters);
    const query = ui.search.trim().toLocaleLowerCase('de');
    const words = values(projection.entities.words).filter((word) => (
      word.value.lessonId === ui.lessonId
      && (ui.filter === 'archived' ? word.value.archived : !word.value.archived)
      && (!query || [word.value.german, ...word.value.answers, word.value.hint]
        .join(' ').toLocaleLowerCase('de').includes(query))
    ));
    const list = el('div', {attrs: {class: 'management-list vocabulary-list'}});
    for (const word of words) {
      const card = el('article', {attrs: {class: 'management-card vocabulary-row', 'data-word-german': word.value.german}}, [
        el('div', {}, [el('h3', {text: word.value.german}), el('p', {text: word.value.answers.join(' · ')})]),
      ]);
      card.append(
        button('Bearbeiten', () => {
          ui.openEditor = {
            kind: 'word', entityId: word.id, expectedHeads: [...word.heads],
            profileId: ui.profileId, lessonId: ui.lessonId,
          };
          onRefresh();
        }, {class: 'secondary'}),
        button(word.value.archived ? 'Reaktivieren' : 'Archivieren', async () => {
          try {
            await commands.revise({
              entityType: 'word', entityId: word.id, expectedHeads: [...word.heads],
              value: {...word.value, archived: !word.value.archived},
            });
            report(ui, word.value.archived ? 'Die Vokabel ist wieder aktiv.' : 'Die Vokabel wurde archiviert.');
          } catch (error) {
            report(ui, error.message, 'error');
          }
          onRefresh();
        }, {class: 'secondary'}),
      );
      list.append(card);
    }
    if (!words.length) list.append(message('Für diese Auswahl wurden keine Vokabeln gefunden.'));
    container.append(list);
  }
}
