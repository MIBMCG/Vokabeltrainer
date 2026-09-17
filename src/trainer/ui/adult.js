import {project} from '../learning/progress.js';
import {semanticWord} from '../model/revisions.js';
import {applyRows, parseTable, validateRows} from '../adult/import.js';
import {el, field, button, message} from './dom.js';

const localState = new WeakMap();
const MAX_ANSWERS_TEXT_LENGTH = 4_200;

function viewState(root) {
  if (!localState.has(root)) {
    localState.set(root, {
      section: 'children',
      selectedLessonId: null,
      importRows: null,
      importIssues: [],
      notice: '',
      tone: 'info',
    });
  }
  return localState.get(root);
}

function input(name, {value = '', maxlength = 80, required = true, type = 'text'} = {}) {
  return el('input', {attrs: {name, value, maxlength, required, type}});
}

function answers(text) {
  return text.split('|').map((value) => value.trim()).filter(Boolean);
}

function values(bucket) {
  return Object.values(bucket).filter((entity) => entity.value !== null);
}

function setNotice(ui, text, tone = 'info') {
  ui.notice = text;
  ui.tone = tone;
}

function entityForm({legend, value, profiles = [], onSubmit, submitText = 'Speichern'}) {
  const form = el('form', {attrs: {class: 'stack compact'}});
  const name = input('name', {value: value?.name ?? '', maxlength: 80});
  form.append(el('h3', {text: legend}), field('Name', name));
  if (profiles.length > 0) {
    const group = el('fieldset', {}, [el('legend', {text: 'Für diese Kinder freigeben'})]);
    for (const profile of profiles) {
      const checkbox = el('input', {attrs: {
        type: 'checkbox', name: 'profileIds', value: profile.id,
        checked: value?.profileIds?.includes(profile.id) ?? false,
      }});
      group.append(el('label', {}, [checkbox, profile.value.name]));
    }
    form.append(group);
  }
  const submit = el('button', {text: submitText, attrs: {type: 'submit', class: 'primary'}});
  form.append(submit);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    submit.disabled = true;
    const data = new FormData(form);
    try {
      await onSubmit({
        name: data.get('name').trim(),
        profileIds: data.getAll('profileIds'),
      });
    } finally {
      submit.disabled = false;
    }
  });
  return form;
}

function renderChildren(container, projection, commands, rerender, ui) {
  const section = el('section', {attrs: {'aria-labelledby': 'children-title'}}, [
    el('h2', {text: 'Kinder', attrs: {id: 'children-title'}}),
    el('p', {text: 'Jedes Kind hat einen getrennten Lernstand.'}),
  ]);
  section.append(entityForm({
    legend: 'Kind hinzufügen',
    onSubmit: async ({name}) => {
      try {
        await commands.revise({
          entityType: 'profile', entityId: crypto.randomUUID(), expectedHeads: [],
          value: {name, archived: false},
        });
        setNotice(ui, 'Das Kind wurde hinzugefügt.');
      } catch (error) {
        setNotice(ui, error.message, 'error');
      }
      rerender();
    },
    submitText: 'Kind hinzufügen',
  }));

  const list = el('div', {attrs: {class: 'management-list'}});
  for (const profile of values(projection.entities.profiles)) {
    const card = el('article', {attrs: {class: 'management-card'}});
    card.append(el('h3', {text: profile.value.name}));
    const edit = entityForm({
      legend: 'Anzeigenamen ändern', value: profile.value,
      onSubmit: async ({name}) => {
        try {
          await commands.revise({
            entityType: 'profile', entityId: profile.id, expectedHeads: profile.heads,
            value: {...profile.value, name},
          });
          setNotice(ui, 'Der Anzeigename wurde gespeichert.');
        } catch (error) {
          setNotice(ui, error.message, 'error');
        }
        rerender();
      },
    });
    const details = el('details', {}, [el('summary', {text: 'Bearbeiten'}), edit]);
    card.append(
      el('p', {text: profile.value.archived ? 'Archiviert' : 'Aktiv', attrs: {class: 'status-chip'}}),
      details,
      button(profile.value.archived ? 'Reaktivieren' : 'Archivieren', async () => {
        try {
          await commands.revise({
            entityType: 'profile', entityId: profile.id, expectedHeads: profile.heads,
            value: {...profile.value, archived: !profile.value.archived},
          });
          setNotice(ui, profile.value.archived ? 'Das Kind ist wieder aktiv.' : 'Das Kind wurde archiviert.');
        } catch (error) {
          setNotice(ui, error.message, 'error');
        }
        rerender();
      }, {class: 'secondary'}),
    );
    list.append(card);
  }
  section.append(list);
  container.append(section);
}

function wordEditor({word, lessonId, commands, rerender, ui}) {
  const form = el('form', {attrs: {class: 'stack compact'}});
  const german = input('german', {value: word?.value.german ?? '', maxlength: 200});
  const answerInput = input('answers', {
    value: word?.value.answers.join(' | ') ?? '', maxlength: MAX_ANSWERS_TEXT_LENGTH,
  });
  const hint = input('hint', {value: word?.value.hint ?? '', maxlength: 300, required: false});
  const preview = el('p', {attrs: {class: 'hint', 'data-revision-preview': ''}});
  const updatePreview = () => {
    if (!word) return;
    const next = {german: german.value, answers: answers(answerInput.value), hint: hint.value};
    preview.textContent = JSON.stringify(semanticWord(next)) === JSON.stringify(semanticWord(word.value))
      ? 'Die Lernserie bleibt erhalten.'
      : 'Bedeutung oder Lösungen ändern sich: Die aktuelle Serie beginnt für diese Fassung neu.';
  };
  german.addEventListener('input', updatePreview);
  answerInput.addEventListener('input', updatePreview);
  hint.addEventListener('input', updatePreview);
  updatePreview();
  form.append(
    field('Deutsches Wort', german),
    field('Englische Lösungen (mit | trennen)', answerInput),
    field('Bedeutungshinweis (optional)', hint),
    preview,
  );
  const submit = el('button', {
    text: word ? 'Änderung speichern' : 'Vokabel hinzufügen',
    attrs: {type: 'submit', class: 'primary'},
  });
  form.append(submit);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    submit.disabled = true;
    try {
      await commands.revise({
        entityType: 'word', entityId: word?.id ?? crypto.randomUUID(),
        expectedHeads: word?.heads ?? [],
        value: {
          lessonId,
          german: german.value.trim(),
          answers: answers(answerInput.value),
          hint: hint.value.trim(),
          archived: word?.value.archived ?? false,
        },
      });
      setNotice(ui, word ? 'Die Vokabel wurde gespeichert.' : 'Die Vokabel wurde hinzugefügt.');
    } catch (error) {
      setNotice(ui, error.message, 'error');
    }
    rerender();
  });
  return form;
}

function importPanel({lesson, words, commands, rerender, ui}) {
  const panel = el('section', {attrs: {class: 'subpanel', 'aria-labelledby': 'import-title'}}, [
    el('h3', {text: 'Tabelle einfügen', attrs: {id: 'import-title'}}),
    el('p', {text: 'Spalten: Deutsch, Englisch, optional Bedeutungshinweis. Mehrere Lösungen mit | trennen.'}),
  ]);
  const text = el('textarea', {attrs: {id: 'import-text', rows: '6'}});
  panel.append(field('Tabellenzeilen', text));
  panel.append(button('Vorschau prüfen', () => {
    const parsed = parseTable(text.value);
    ui.importRows = parsed.rows;
    ui.importIssues = parsed.issues;
    rerender();
  }, {id: 'import-preview', class: 'secondary'}));

  if (ui.importRows === null) return panel;
  const activeWords = words.filter((word) => !word.value.archived);
  const validated = validateRows(ui.importRows, activeWords);
  const allIssues = [...ui.importIssues, ...validated.issues];
  const issueList = el('ul', {attrs: {class: 'issues'}});
  for (const current of allIssues) issueList.append(el('li', {text: `${current.rowId}: ${current.message}`}));
  if (allIssues.length > 0) panel.append(message('Bitte klären Sie alle markierten Zeilen.', 'error'), issueList);

  const preview = el('div', {attrs: {class: 'import-preview'}});
  for (const row of validated.rows) {
    const german = input('german', {value: row.german, maxlength: 200});
    const answerInput = input('answers', {
      value: row.answers.join(' | '), maxlength: MAX_ANSWERS_TEXT_LENGTH,
    });
    const hint = input('hint', {value: row.hint, maxlength: 300, required: false});
    const decision = el('select', {attrs: {'aria-label': 'Entscheidung'}} , [
      el('option', {text: 'Übernehmen', attrs: {value: 'include'}}),
      el('option', {text: 'Überspringen', attrs: {value: 'skip'}}),
      el('option', {text: 'Als eigene Bedeutung übernehmen', attrs: {value: 'separate'}}),
    ]);
    decision.value = row.decision;
    const replace = (changes, resolveStructure = false) => {
      ui.importRows = ui.importRows.map((entry) => entry.rowId === row.rowId ? {...entry, ...changes} : entry);
      if (resolveStructure) {
        ui.importIssues = ui.importIssues.filter((current) => current.rowId !== row.rowId);
      }
      rerender();
    };
    german.addEventListener('change', () => replace({german: german.value}));
    answerInput.addEventListener('change', () => replace({answers: answers(answerInput.value)}));
    hint.addEventListener('change', () => replace({hint: hint.value}));
    decision.addEventListener('change', () => replace({decision: decision.value}, decision.value === 'skip'));
    const rowPanel = el('div', {attrs: {class: 'import-row', 'data-import-row': row.rowId}}, [
      field('Deutsch', german), field('Englisch', answerInput), field('Hinweis', hint), field('Entscheidung', decision),
    ]);
    if (ui.importIssues.some((current) => current.rowId === row.rowId)) {
      rowPanel.append(button('Struktur nach Prüfung bestätigen', () => {
        ui.importIssues = ui.importIssues.filter((current) => current.rowId !== row.rowId);
        rerender();
      }, {class: 'secondary'}));
    }
    preview.append(rowPanel);
  }
  panel.append(preview);
  const apply = button('Geprüfte Zeilen übernehmen', async () => {
    apply.disabled = true;
    try {
      const currentValidation = validateRows(ui.importRows, activeWords);
      if (ui.importIssues.length > 0 || currentValidation.issues.length > 0) {
        throw new Error('Bitte klären Sie zuerst alle Importhinweise.');
      }
      await applyRows(currentValidation.rows, async (row) => {
        await commands.revise({
          entityType: 'word', entityId: crypto.randomUUID(), expectedHeads: [],
          value: {
            lessonId: lesson.id, german: row.german, answers: row.answers,
            hint: row.hint, archived: false,
          },
        });
      }, (remaining) => {
        ui.importRows = remaining;
        ui.importIssues = [];
      });
      ui.importRows = null;
      ui.importIssues = [];
      setNotice(ui, 'Die geprüften Tabellenzeilen wurden übernommen.');
    } catch (error) {
      setNotice(ui, error.message, 'error');
    }
    rerender();
  }, {id: 'import-apply', class: 'primary', disabled: allIssues.length > 0});
  panel.append(apply);
  return panel;
}

function renderLessonDetail(container, lesson, projection, commands, rerender, ui) {
  const profiles = values(projection.entities.profiles).filter((profile) => !profile.value.archived);
  const words = values(projection.entities.words).filter((word) => word.value.lessonId === lesson.id);
  const detail = el('section', {attrs: {class: 'lesson-detail'}}, [
    el('h2', {text: lesson.value.name}),
    el('p', {text: 'Eine Änderung der Kinderzuordnung löscht keinen Lernstand.', attrs: {class: 'hint'}}),
  ]);
  detail.append(entityForm({
    legend: 'Lektion bearbeiten', value: lesson.value, profiles,
    onSubmit: async ({name, profileIds}) => {
      try {
        await commands.revise({
          entityType: 'lesson', entityId: lesson.id, expectedHeads: lesson.heads,
          value: {...lesson.value, name, profileIds: [...new Set(profileIds)].sort()},
        });
        setNotice(ui, 'Lektion und Zuordnung wurden gespeichert.');
      } catch (error) {
        setNotice(ui, error.message, 'error');
      }
      rerender();
    },
  }));
  detail.append(button(lesson.value.archived ? 'Lektion reaktivieren' : 'Lektion archivieren', async () => {
    try {
      await commands.revise({
        entityType: 'lesson', entityId: lesson.id, expectedHeads: lesson.heads,
        value: {...lesson.value, archived: !lesson.value.archived},
      });
      setNotice(ui, lesson.value.archived ? 'Die Lektion ist wieder aktiv.' : 'Die Lektion wurde archiviert.');
    } catch (error) {
      setNotice(ui, error.message, 'error');
    }
    rerender();
  }, {class: 'secondary'}));
  detail.append(el('h3', {text: 'Vokabeln'}), wordEditor({lessonId: lesson.id, commands, rerender, ui}));
  const wordList = el('div', {attrs: {class: 'management-list'}});
  for (const word of words) {
    const card = el('article', {attrs: {
      class: 'management-card', 'data-word-german': word.value.german,
    }}, [
      el('h4', {text: word.value.german}),
      el('p', {text: word.value.answers.join(' · ')}),
      word.value.hint ? el('p', {text: word.value.hint, attrs: {class: 'hint'}}) : null,
      el('p', {text: word.value.archived ? 'Archiviert' : 'Aktiv', attrs: {class: 'status-chip'}}),
    ]);
    card.append(el('details', {}, [
      el('summary', {text: 'Bearbeiten'}),
      wordEditor({word, lessonId: lesson.id, commands, rerender, ui}),
    ]));
    card.append(button(word.value.archived ? 'Reaktivieren' : 'Archivieren', async () => {
      try {
        await commands.revise({
          entityType: 'word', entityId: word.id, expectedHeads: word.heads,
          value: {...word.value, archived: !word.value.archived},
        });
        setNotice(ui, word.value.archived ? 'Die Vokabel ist wieder aktiv.' : 'Die Vokabel wurde archiviert.');
      } catch (error) {
        setNotice(ui, error.message, 'error');
      }
      rerender();
    }, {class: 'secondary'}));
    wordList.append(card);
  }
  detail.append(wordList, importPanel({lesson, words, commands, rerender, ui}));
  container.append(detail);
}

function renderLessons(container, projection, commands, rerender, ui) {
  const profiles = values(projection.entities.profiles).filter((profile) => !profile.value.archived);
  const lessons = values(projection.entities.lessons);
  const section = el('section', {attrs: {'aria-labelledby': 'lessons-title'}}, [
    el('h2', {text: 'Lektionen', attrs: {id: 'lessons-title'}}),
  ]);
  section.append(entityForm({
    legend: 'Lektion hinzufügen', profiles,
    onSubmit: async ({name, profileIds}) => {
      try {
        await commands.revise({
          entityType: 'lesson', entityId: crypto.randomUUID(), expectedHeads: [],
          value: {name, archived: false, profileIds: [...new Set(profileIds)].sort()},
        });
        setNotice(ui, 'Die Lektion wurde hinzugefügt.');
      } catch (error) {
        setNotice(ui, error.message, 'error');
      }
      rerender();
    },
    submitText: 'Lektion hinzufügen',
  }));
  const picker = el('div', {attrs: {class: 'lesson-picker'}});
  for (const lesson of lessons) {
    picker.append(button(`${lesson.value.name}${lesson.value.archived ? ' (archiviert)' : ''}`, () => {
      ui.selectedLessonId = lesson.id;
      ui.importRows = null;
      ui.importIssues = [];
      rerender();
    }, {'data-lesson-name': lesson.value.name, class: ui.selectedLessonId === lesson.id ? 'active' : ''}));
  }
  section.append(picker);
  container.append(section);
  const selected = lessons.find(({id}) => id === ui.selectedLessonId) ?? lessons[0];
  if (selected) {
    ui.selectedLessonId = selected.id;
    renderLessonDetail(container, selected, projection, commands, rerender, ui);
  }
}

function formatDate(value) {
  if (!value) return '—';
  return value.slice(0, 10);
}

function renderProgress(container, projection) {
  const section = el('section', {attrs: {'aria-labelledby': 'progress-title'}}, [
    el('h2', {text: 'Lernstand', attrs: {id: 'progress-title'}}),
    el('p', {text: 'Die Werte gehören jeweils nur zum ausgewählten Kind.'}),
  ]);
  for (const profile of values(projection.entities.profiles)) {
    const profileProgress = projection.profiles[profile.id];
    section.append(el('h3', {text: profile.value.name}));
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

function renderLocalStatus(container, state, kind) {
  const pending = state.outboxEventIds.length;
  const copy = kind === 'sync'
    ? `Auf diesem Gerät gespeichert. ${pending} Änderung${pending === 1 ? '' : 'en'} wartet auf einen späteren Abgleich. Eine Google-Verbindung ist hier noch nicht eingerichtet.`
    : 'Der vollständige lokale Stand ist in IndexedDB gespeichert. Export und Wiederherstellung werden erst mit dem geprüften Sicherungspaket angeboten.';
  container.append(el('section', {attrs: {class: 'panel'}}, [
    el('h2', {text: kind === 'sync' ? 'Abgleich' : 'Sicherung'}),
    message(copy),
  ]));
}

function renderPinSettings(container, pinGate, rerender, ui) {
  const section = el('section', {attrs: {class: 'subpanel'}}, [
    el('h3', {text: 'PIN auf diesem Gerät'}),
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
      setNotice(ui, 'Die lokale PIN wurde geändert.');
      change.reset();
    } catch (error) {
      setNotice(ui, error.message, 'error');
    }
    rerender();
  });
  const reset = el('form', {attrs: {class: 'stack compact'}});
  reset.append(
    el('p', {text: 'Geben Sie zur Bestätigung genau „PIN zurücksetzen“ ein.'}),
    field('Bestätigungstext', input('confirmation', {maxlength: 30})),
    field('Neue PIN', input('next', {maxlength: 4, type: 'password'})),
    field('Neue PIN wiederholen', input('repeat', {maxlength: 4, type: 'password'})),
  );
  const resetButton = el('button', {text: 'Vergessene PIN lokal zurücksetzen', attrs: {type: 'submit', class: 'secondary'}});
  reset.append(resetButton);
  reset.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(reset);
    try {
      await pinGate.reset(data.get('confirmation'), data.get('next'), data.get('repeat'));
      setNotice(ui, 'Die lokale PIN wurde zurückgesetzt. Die Lerndaten blieben erhalten.');
      reset.reset();
    } catch (error) {
      setNotice(ui, error.message, 'error');
    }
    rerender();
  });
  section.append(el('details', {}, [el('summary', {text: 'PIN ändern'}), change]));
  section.append(el('details', {}, [el('summary', {text: 'PIN vergessen'}), reset]));
  container.append(section);
}

export function renderAdult({root, state, commands, pinGate, onNavigate}) {
  const ui = viewState(root);
  const projection = project(state.ledger);
  const rerender = () => {
    if (!pinGate.isUnlocked()) {
      onNavigate('profiles');
      return;
    }
    renderAdult({root, state: commands.getState(), commands, pinGate, onNavigate});
  };
  const page = el('div', {attrs: {class: 'adult-layout'}});
  const header = el('header', {attrs: {class: 'adult-header'}}, [
    el('div', {}, [el('p', {text: 'Geschützter Bereich', attrs: {class: 'eyebrow'}}), el('h1', {text: 'Für Erwachsene'})]),
    button('Zur Profilauswahl', () => onNavigate('profiles'), {class: 'secondary'}),
  ]);
  const nav = el('nav', {attrs: {id: 'adult-nav', class: 'adult-nav', 'aria-label': 'Erwachsenenverwaltung'}});
  for (const [key, label] of [
    ['children', 'Kinder'], ['lessons', 'Lektionen'], ['progress', 'Lernstand'],
    ['sync', 'Abgleich'], ['backup', 'Sicherung'],
  ]) {
    nav.append(button(label, () => {
      ui.section = key;
      rerender();
    }, {class: ui.section === key ? 'active' : '', 'aria-current': ui.section === key ? 'page' : null}));
  }
  const content = el('main', {attrs: {id: 'adult-content', tabindex: '-1'}});
  if (ui.notice) content.append(message(ui.notice, ui.tone));
  if (projection.conflicts.length > 0 || projection.epochConflict) {
    content.append(message('Mindestens eine Änderung benötigt eine Konfliktklärung. Neue Bearbeitungen sind bis dahin eingeschränkt.', 'error'));
  }
  if (ui.section === 'children') {
    renderChildren(content, projection, commands, rerender, ui);
    renderPinSettings(content, pinGate, rerender, ui);
  } else if (ui.section === 'lessons') renderLessons(content, projection, commands, rerender, ui);
  else if (ui.section === 'progress') renderProgress(content, projection);
  else if (ui.section === 'sync') renderLocalStatus(content, state, 'sync');
  else renderLocalStatus(content, state, 'backup');
  page.append(header, nav, content);
  root.replaceChildren(page);
}
