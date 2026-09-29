import {parseTable, validateRows} from '../adult/import.js';
import {project} from '../learning/progress.js';
import {dayInZone} from '../learning/calendar.js';
import {projectSchedule} from '../learning/schedule.js';
import {currentGenerations, currentPolicy} from '../model/policies.js';
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

function vocabularySavePending(root) {
  const pending = Boolean(stateFor(root).openEditor?.saving);
  if (pending && !root.querySelector('#adult-save-pending')) {
    const notice = message('Speichern läuft. Bitte warten Sie, bis die Eingaben übernommen wurden.');
    notice.id = 'adult-save-pending';
    root.querySelector('#adult-content')?.prepend(notice);
  }
  return pending;
}

export function requestVocabularyNavigation(root, action) {
  const ui = stateFor(root);
  if (vocabularySavePending(root)) return;
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
  const controls = [
    button('Speichern', async () => {
      if (vocabularySavePending(root)) return;
      for (const control of controls) control.disabled = true;
      try {
        const saved = await ui.draft?.save();
        if (saved) finish();
      } finally {
        if (dialog.isConnected) for (const control of controls) control.disabled = false;
      }
    }, {class: 'primary'}),
    button('Verwerfen', () => {
      if (vocabularySavePending(root)) return;
      ui.draft?.discard();
      finish();
    }, {class: 'secondary'}),
    button('Weiterbearbeiten', () => {
      if (!vocabularySavePending(root)) closeDecision(root);
    }, {class: 'secondary'}),
  ];
  dialog.append(...controls);
  root.append(dialog);
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
}

export function discardVocabularyDraft(root) {
  if (vocabularySavePending(root)) return false;
  const ui = stateFor(root);
  closeDecision(root);
  ui.openEditor = null;
  ui.draft = null;
  ui.importRows = null;
  ui.importIssues = [];
  return true;
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
  const assigned = el('p', {attrs: {class: 'hint', 'data-lesson-assignment': ''}});
  const update = () => {
    newFields.hidden = select.value !== NEW_LESSON;
    const lesson = lessons.find(({id}) => id === select.value);
    const names = lesson?.value.profileIds.map((id) => profiles.find((profile) => profile.id === id)?.value.name)
      .filter(Boolean) ?? [];
    assigned.textContent = lesson ? `Diese Lektion erhalten: ${names.join(', ') || 'kein Kind'}.` : '';
    assigned.hidden = !lesson;
  };
  select.addEventListener('change', update);
  update();
  wrapper.append(field('Lektion', select), assigned, newFields);
  return {wrapper, select, newLesson, assignments, update};
}

function readImportDraft(fields, text) {
  return {
    lessonId: fields.select.value,
    newLessonName: fields.newLesson.value,
    profileIds: [...fields.assignments.querySelectorAll('input:checked')]
      .map(({value}) => value).sort(),
    text: text.value,
  };
}

function restoreImportDraft(fields, text, draft) {
  fields.select.value = draft.lessonId;
  fields.update();
  fields.newLesson.value = draft.newLessonName;
  for (const checkbox of fields.assignments.querySelectorAll('input')) {
    checkbox.checked = draft.profileIds.includes(checkbox.value);
  }
  text.value = draft.text;
}

function setFormError(form, error) {
  form.querySelector('[data-form-error]')?.remove();
  form.append(message(error.message, 'error'));
  form.lastElementChild.dataset.formError = '';
}

function editorDirty(form, initial) {
  return () => JSON.stringify([...new FormData(form).entries()]) !== initial;
}

function renderWordForm({root, container, ui, word, projection, state, commands, onRefresh}) {
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
  const nextSubmit = word ? null : button('Speichern und nächstes Wort', () => save(true), {class: 'secondary'});
  form.append(submit);
  if (nextSubmit) form.append(nextSubmit);
  form.append(button('Abbrechen', () => {
    requestVocabularyNavigation(root, () => {
      ui.openEditor = null;
      ui.draft = null;
      onRefresh();
    });
  }, {class: 'secondary'}));
  const initial = JSON.stringify([...new FormData(form).entries()]);
  let pending = false;
  const editor = ui.openEditor;
  const save = async (keepOpen = false) => {
    if (pending || editor.saving) return false;
    pending = true;
    editor.saving = true;
    for (const control of form.querySelectorAll('input, select, button')) control.disabled = true;
    try {
      const wordValue = {
        german: german.value.trim(), answers: answers(answerInput.value), hint: hint.value.trim(),
      };
      let lessonId = word?.value.lessonId ?? target.select.value;
      if (!word && lessonId === NEW_LESSON) {
        const name = target.newLesson.value.trim();
        if (!name) throw new Error('Bitte geben Sie einen Namen für die neue Lektion ein.');
        const profileIds = [...target.assignments.querySelectorAll('input:checked')].map(({value}) => value).sort();
        const key = JSON.stringify({name, profileIds, wordValue});
        if (!editor.singleRequest || editor.singleRequest.key !== key) {
          editor.singleRequest = {key, request: {
            expectedDatasetId: state.ledger.descriptor.datasetId,
            expectedEpochId: projection.activeEpochId,
            lesson: {id: crypto.randomUUID(), name, profileIds},
            words: [{id: crypto.randomUUID(), ...wordValue, decision: 'include'}],
          }};
        }
        const result = await commands.importWords(editor.singleRequest.request);
        lessonId = result.lessonId;
      } else {
        await commands.revise({
          entityType: 'word', entityId: word?.id ?? crypto.randomUUID(),
          expectedHeads: [...editor.expectedHeads],
          value: {lessonId, ...wordValue, archived: word?.value.archived ?? false},
        });
      }
      if (ui.openEditor !== editor) return true;
      ui.lessonId = lessonId;
      ui.openEditor = keepOpen && !word
        ? {kind: 'add', expectedHeads: [], profileId: editor.profileId, lessonId}
        : null;
      ui.draft = null;
      report(ui, word ? 'Die Vokabel wurde gespeichert.' : 'Die Vokabel wurde hinzugefügt.');
      onRefresh();
      if (keepOpen && !word) queueMicrotask(() => root.querySelector('form.vocabulary-editor input[name="german"]')?.focus());
      return true;
    } catch (error) {
      root.querySelector('#adult-save-pending')?.remove();
      setFormError(form, error);
      pending = false;
      editor.saving = false;
      for (const control of form.querySelectorAll('input, select, button')) control.disabled = false;
      return false;
    }
  };
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    await save(false);
  });
  ui.draft = {
    isDirty: editorDirty(form, initial), save,
    discard: () => { ui.openEditor = null; },
  };
  if (editor.saving) {
    for (const control of form.querySelectorAll('input, select, button')) control.disabled = true;
  }
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

function renderImport({root, container, ui, projection, state, commands, onRefresh}) {
  const editor = ui.openEditor;
  const panel = el('section', {attrs: {class: 'subpanel vocabulary-editor', 'aria-labelledby': 'import-title'}}, [
    el('h3', {text: 'Mehrere Wörter einfügen', attrs: {id: 'import-title'}}),
    el('p', {text: 'Spalten: Deutsch, Englisch, optional Bedeutungshinweis. Mehrere Lösungen mit | trennen.'}),
  ]);
  const profiles = values(projection.entities.profiles).filter((profile) => !profile.value.archived);
  const lessons = values(projection.entities.lessons);
  const target = lessonFields({
    profiles, lessons, selectedLessonId: editor.lessonId, profileId: editor.profileId,
  });
  const text = el('textarea', {attrs: {id: 'import-text', rows: '6', 'aria-label': 'Tabellenzeilen'}});
  if (editor.importDraft) restoreImportDraft(target, text, editor.importDraft);
  else {
    editor.importDraft = readImportDraft(target, text);
    editor.initialImportDraft = JSON.stringify(editor.importDraft);
  }
  editor.openRowIds ??= new Set();
  editor.showAllRows ??= false;
  editor.datasetId ??= state.ledger.descriptor.datasetId;
  editor.epochId ??= projection.activeEpochId;
  const captureTarget = () => {
    if (editor.targetId === target.select.value) return;
    editor.targetId = target.select.value;
    editor.targetHeads = [...(projection.entities.lessons[target.select.value]?.heads ?? [])];
  };
  captureTarget();
  if (ui.importRows === null) {
    const parsed = parseTable(editor.importDraft.text);
    ui.importRows = parsed.rows;
    ui.importIssues = parsed.issues;
  }
  editor.parsedText ??= editor.importDraft.text;
  const updateDraft = () => { editor.importDraft = readImportDraft(target, text); };
  const activeWordsFor = (lessonId) => values(projection.entities.words).filter((word) => (
    !word.value.archived && lessonId !== NEW_LESSON && word.value.lessonId === lessonId
  ));
  const summary = el('p', {attrs: {id: 'import-summary', class: 'import-summary', role: 'status'}});
  const previewArea = el('div', {attrs: {class: 'import-preview'}});
  let apply;
  let skipExact;
  const renderPreview = () => {
    const activeWords = activeWordsFor(target.select.value).map(({value}) => value);
    const validated = validateRows(ui.importRows, activeWords);
    const issues = [...ui.importIssues, ...validated.issues];
    const problemIds = new Set(issues.map(({rowId}) => rowId));
    const skipped = validated.rows.filter(({decision}) => decision === 'skip').length;
    const ready = validated.rows.filter(({rowId, decision}) => decision !== 'skip' && !problemIds.has(rowId)).length;
    const lessonName = target.select.value === NEW_LESSON
      ? (target.newLesson.value.trim() || 'Neue Lektion')
      : (lessons.find(({id}) => id === target.select.value)?.value.name || 'Keine Lektion');
    summary.textContent = ready + ' bereit · ' + skipped + ' übersprungen · '
      + problemIds.size + ' zu prüfen · Lektion: ' + lessonName;
    previewArea.replaceChildren();
    if (issues.length) {
      previewArea.append(message('Bitte klären Sie die markierten Zeilen.', 'error'),
        el('ul', {attrs: {class: 'issues'}},
          issues.map((issue) => el('li', {text: issue.rowId + ': ' + issue.message}))));
    }
    const allRows = el('details', {attrs: {class: 'import-all-rows', open: editor.showAllRows}}, [
      el('summary', {text: 'Alle ' + validated.rows.length + ' Tabellenzeilen ansehen und bearbeiten'}),
    ]);
    allRows.addEventListener('toggle', () => {
      if (allRows.isConnected) editor.showAllRows = allRows.open;
    });
    const exactRows = new Set(validated.rows.filter((row) => row.decision !== 'skip'
      && activeWords.some((word) => JSON.stringify(semanticWord(row)) === JSON.stringify(semanticWord(word))))
      .map(({rowId}) => rowId));
    for (const row of validated.rows) {
      const problem = problemIds.has(row.rowId);
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
        if (editor.saving) return;
        editor.openRowIds.add(row.rowId);
        ui.importRows = ui.importRows.map((entry) => entry.rowId === row.rowId ? {...entry, ...changes} : entry);
        if (resolveStructure) ui.importIssues = ui.importIssues.filter((issue) => issue.rowId !== row.rowId);
        editor.importRequest = null;
        renderPreview();
      };
      german.addEventListener('change', () => replace({german: german.value}));
      answerInput.addEventListener('change', () => replace({answers: answers(answerInput.value)}));
      hint.addEventListener('change', () => replace({hint: hint.value}));
      decision.addEventListener('change', () => replace({decision: decision.value}, decision.value === 'skip'));
      const detail = el('details', {attrs: {
        class: 'import-row' + (problem ? ' import-row-problem' : ''),
        'data-import-row': row.rowId,
        open: problem || editor.openRowIds.has(row.rowId),
      }});
      detail.addEventListener('toggle', () => {
        if (detail.open) editor.openRowIds.add(row.rowId);
        else editor.openRowIds.delete(row.rowId);
      });
      const status = row.decision === 'skip' ? 'übersprungen' : problem ? 'bitte prüfen' : 'bereit';
      detail.append(el('summary', {text: row.rowId + ' · ' + (row.german || 'Ohne deutsches Wort')
        + ' — ' + row.answers.join(' | ') + ' · ' + status}));
      const fields = el('div', {attrs: {class: 'import-row-fields'}}, [
        field('Deutsch', german), field('Englisch', answerInput),
        field('Hinweis', hint), field('Entscheidung', decision),
      ]);
      detail.append(fields);
      if (ui.importIssues.some((issue) => issue.rowId === row.rowId)) {
        detail.append(button('Struktur nach Prüfung bestätigen', () => {
          if (editor.saving) return;
          ui.importIssues = ui.importIssues.filter((issue) => issue.rowId !== row.rowId);
          editor.importRequest = null;
          renderPreview();
        }, {class: 'secondary'}));
      }
      if (problem) previewArea.append(detail);
      else allRows.append(detail);
    }
    if (validated.rows.length) previewArea.append(allRows);
    const validLesson = target.select.value !== NEW_LESSON || target.newLesson.value.trim().length > 0;
    if (apply) apply.disabled = Boolean(editor.saving) || !validLesson || ready === 0 || issues.length > 0;
    if (skipExact) skipExact.disabled = Boolean(editor.saving) || exactRows.size === 0;
    if (editor.saving) {
      for (const control of panel.querySelectorAll('input, textarea, select, button')) control.disabled = true;
    }
    return {validated, issues, ready, exactRows};
  };
  text.addEventListener('input', () => {
    if (editor.saving) return;
    updateDraft();
    const parsed = parseTable(text.value);
    ui.importRows = parsed.rows;
    ui.importIssues = parsed.issues;
    editor.parsedText = text.value;
    editor.openRowIds.clear();
    editor.importRequest = null;
    panel.querySelector('[data-form-error]')?.remove();
    renderPreview();
  });
  target.select.addEventListener('change', () => {
    if (editor.saving) return;
    updateDraft();
    captureTarget();
    editor.importRequest = null;
    renderPreview();
  });
  target.newLesson.addEventListener('input', () => {
    updateDraft();
    editor.importRequest = null;
    renderPreview();
  });
  for (const checkbox of target.assignments.querySelectorAll('input')) {
    checkbox.addEventListener('change', () => {
      updateDraft();
      editor.importRequest = null;
      renderPreview();
    });
  }
  skipExact = button('Identische vorhandene Wörter überspringen', () => {
    const {exactRows} = renderPreview();
    ui.importRows = ui.importRows.map((row) => exactRows.has(row.rowId)
      ? {...row, decision: 'skip'} : row);
    ui.importIssues = ui.importIssues.filter((issue) => !exactRows.has(issue.rowId));
    editor.importRequest = null;
    renderPreview();
  }, {id: 'import-skip-identical', class: 'secondary'});
  const save = async () => {
    if (editor.saving) return false;
    editor.saving = true;
    for (const control of panel.querySelectorAll('input, textarea, select, button')) control.disabled = true;
    try {
      updateDraft();
      if (editor.parsedText !== text.value) {
        throw new Error('Die Tabellenzeilen haben sich seit der Prüfung geändert. Bitte erneut prüfen.');
      }
      const {validated, issues, ready} = renderPreview();
      if (issues.length || ready === 0) throw new Error('Bitte klären Sie zuerst alle Importhinweise.');
      const selected = validated.rows.filter(({decision}) => decision !== 'skip');
      const key = JSON.stringify({draft: editor.importDraft, selected});
      if (!editor.importRequest || editor.importRequest.key !== key) {
        const lesson = target.select.value === NEW_LESSON
          ? {id: crypto.randomUUID(), name: target.newLesson.value.trim(),
            profileIds: editor.importDraft.profileIds}
          : {id: target.select.value, expectedHeads: [...editor.targetHeads]};
        editor.importRequest = {key, request: {
          expectedDatasetId: editor.datasetId,
          expectedEpochId: editor.epochId,
          lesson,
          words: selected.map((row) => ({
            id: crypto.randomUUID(), german: row.german, answers: row.answers,
            hint: row.hint, decision: row.decision,
          })),
        }};
      }
      const result = await commands.importWords(editor.importRequest.request);
      if (ui.openEditor !== editor) return true;
      ui.lessonId = result.lessonId;
      ui.openEditor = null;
      ui.draft = null;
      ui.importRows = null;
      ui.importIssues = [];
      report(ui, result.addedCount === 1
        ? '1 Wort wurde auf diesem Gerät gespeichert.'
        : result.addedCount + ' Wörter wurden auf diesem Gerät gespeichert.');
      onRefresh();
      return true;
    } catch (error) {
      root.querySelector('#adult-save-pending')?.remove();
      editor.saving = false;
      for (const control of panel.querySelectorAll('input, textarea, select, button')) control.disabled = false;
      setFormError(panel, error);
      renderPreview();
      return false;
    }
  };
  apply = button('Geprüfte Zeilen übernehmen', save, {id: 'import-apply', class: 'primary'});
  panel.append(target.wrapper, field('Tabellenzeilen', text), summary, skipExact, previewArea,
    apply, button('Abbrechen', () => requestVocabularyNavigation(root, () => {
      discardVocabularyDraft(root);
      onRefresh();
    }), {class: 'secondary'}));
  renderPreview();
  if (editor.saving) {
    for (const control of panel.querySelectorAll('input, textarea, select, button')) control.disabled = true;
  }
  ui.draft = {
    isDirty: () => {
      updateDraft();
      return JSON.stringify(editor.importDraft) !== editor.initialImportDraft
        || ui.importRows.some((row) => row.decision !== 'include');
    },
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
  const policy = ui.profileId === null ? null : currentPolicy(state.ledger, ui.profileId).policy;
  const schedule = policy === null ? null : projectSchedule({
    ledger: state.ledger,
    profileId: ui.profileId,
    policy,
    day: dayInZone(new Date(), state.ledger.descriptor.timeZone),
  });
  const generations = ui.profileId === null ? [] : currentGenerations(state.ledger, ui.profileId);

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
      button('Lektion bearbeiten', () => requestVocabularyNavigation(root, () => {
        ui.openEditor = {
          kind: 'lesson', entityId: selectedLesson.id, expectedHeads: [...selectedLesson.heads],
          profileId: ui.profileId, lessonId: selectedLesson.id,
        };
        onRefresh();
      }), {class: 'secondary'}),
      button(selectedLesson.value.archived ? 'Lektion reaktivieren' : 'Lektion archivieren', () => requestVocabularyNavigation(root, async () => {
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
      }), {class: 'secondary'}),
    ]);
    container.append(lessonBar);
  }

  if (ui.openEditor?.kind === 'word') {
    const word = projection.entities.words[ui.openEditor.entityId];
    if (word?.value) renderWordForm({root, container, ui, word, projection, state, commands, onRefresh});
  } else if (ui.openEditor?.kind === 'add') {
    renderWordForm({root, container, ui, word: null, projection, state, commands, onRefresh});
  } else if (ui.openEditor?.kind === 'import') {
    renderImport({root, container, ui, projection, state, commands, onRefresh});
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
    container.append(actions, filters);
    const words = values(projection.entities.words).filter((word) => (
      word.value.lessonId === ui.lessonId
      && (ui.filter === 'archived' ? word.value.archived : !word.value.archived)
    ));
    const list = el('div', {attrs: {class: 'management-list vocabulary-list'}});
    for (const word of words) {
      const card = el('article', {attrs: {class: 'management-card vocabulary-row', 'data-word-german': word.value.german}}, [
        el('div', {}, [el('h3', {text: word.value.german}), el('p', {text: word.value.answers.join(' · ')})]),
      ]);
      card.dataset.search = [word.value.german, ...word.value.answers, word.value.hint]
        .join(' ').toLocaleLowerCase('de');
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
      const assigned = !word.value.archived && selectedLesson?.value !== null
        && !selectedLesson?.value?.archived
        && selectedLesson?.value?.profileIds.includes(ui.profileId);
      const scheduled = schedule?.words.get(word.id)?.get(word.value.learningId);
      if (assigned && scheduled?.excluded) {
        const generationId = generations.find((entry) => entry.wordId === word.id
          && entry.learningId === word.value.learningId)?.generationId ?? null;
        card.querySelector('div').append(
          el('p', {text: 'Aus dem automatischen Üben genommen', attrs: {class: 'status-chip'}}),
          el('p', {text: 'Beginnt die Wiederholung neu; deine bisherigen Punkte und Antworten bleiben.'}),
        );
        card.append(button('Wieder üben', async () => {
          try {
            await commands.reactivateWord({
              profileId: ui.profileId,
              wordId: word.id,
              learningId: word.value.learningId,
              expectedGenerationId: generationId,
            });
            report(ui, `${word.value.german} wird für ${profiles.find(({id}) => id === ui.profileId)?.value.name} wieder geübt. Bisherige Punkte und Antworten bleiben erhalten.`);
          } catch (error) {
            report(ui, error.message, 'error');
          }
          onRefresh();
        }, {class: 'secondary'}));
      }
      list.append(card);
    }
    const empty = message('Für diese Auswahl wurden keine Vokabeln gefunden.');
    list.append(empty);
    const filterWords = () => {
      ui.search = search.value;
      const query = ui.search.trim().toLocaleLowerCase('de');
      let visible = 0;
      for (const card of list.querySelectorAll('[data-word-german]')) {
        card.hidden = Boolean(query) && !card.dataset.search.includes(query);
        if (!card.hidden) visible += 1;
      }
      empty.hidden = visible > 0;
    };
    search.addEventListener('input', filterWords);
    filterWords();
    container.append(list);
  }
}
