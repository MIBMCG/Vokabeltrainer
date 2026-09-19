import {project} from '../learning/progress.js';
import {activeWords} from '../learning/rounds.js';
import {projectSchedule} from '../learning/schedule.js';
import {currentPolicy} from '../model/policies.js';
import {el, field, message} from './dom.js';

const localState = new WeakMap();
const GROUPS = [
  ['new', 'Noch neu', '#69a7c2'],
  ['learning', 'In Übung', '#e0a33c'],
  ['review', 'Zur Auffrischung', '#0aa6a4'],
  ['excluded', 'Aus dem Üben genommen', '#8063a8'],
];

function stateFor(root) {
  if (!localState.has(root)) localState.set(root, {profileId: null, days: 14});
  return localState.get(root);
}

function svgNode(tag, attrs = {}, text = null) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, String(value));
  if (text !== null) node.textContent = String(text);
  return node;
}

function formatPercent(value) {
  if (value === null) return '—';
  return `${new Intl.NumberFormat('de-DE', {maximumFractionDigits: 1}).format(value)} %`;
}

function shortDay(day) {
  return `${day.slice(8, 10)}.${day.slice(5, 7)}.`;
}

function renderRing(statistics) {
  const titleId = `word-groups-${crypto.randomUUID()}`;
  const figure = el('figure', {attrs: {class: 'statistics-figure word-ring-card'}}, [
    el('h2', {text: 'Aktueller Wortbestand', attrs: {id: titleId}}),
    el('p', {text: `${statistics.wordCount} aktuell zugeordnete Wörter · ${statistics.dueCount} jetzt zum Üben verfügbar`, attrs: {class: 'chart-summary'}}),
  ]);
  const body = el('div', {attrs: {class: 'word-ring-layout'}});
  const svg = svgNode('svg', {
    viewBox: '0 0 120 120', role: 'img', 'aria-labelledby': `${titleId} ${titleId}-description`,
  });
  svg.append(svgNode('title', {id: `${titleId}-description`}, 'Verteilung der aktuell zugeordneten Wörter auf vier Lernstände.'));
  svg.append(svgNode('circle', {cx: 60, cy: 60, r: 42, fill: 'none', stroke: '#e4ece8', 'stroke-width': 18}));
  const circumference = 2 * Math.PI * 42;
  let offset = 0;
  if (statistics.wordCount > 0) {
    for (const [key, , color] of GROUPS) {
      const length = (statistics.buckets[key] / statistics.wordCount) * circumference;
      if (length > 0) {
        svg.append(svgNode('circle', {
          cx: 60, cy: 60, r: 42, fill: 'none', stroke: color, 'stroke-width': 18,
          'stroke-dasharray': `${length} ${circumference - length}`,
          'stroke-dashoffset': -offset,
          transform: 'rotate(-90 60 60)',
        }));
      }
      offset += length;
    }
  }
  svg.append(svgNode('text', {x: 60, y: 56, 'text-anchor': 'middle', class: 'ring-total'}, statistics.wordCount));
  svg.append(svgNode('text', {x: 60, y: 72, 'text-anchor': 'middle', class: 'ring-label'}, 'Wörter'));
  const labels = el('ul', {attrs: {class: 'chart-key'}});
  for (const [key, label] of GROUPS) {
    labels.append(el('li', {}, [
      el('span', {attrs: {class: 'chart-swatch', 'data-swatch': key}}),
      el('span', {text: label}),
      el('strong', {text: statistics.buckets[key], attrs: {'data-bucket': key}}),
    ]));
  }
  body.append(svg, labels);
  figure.append(body);
  return figure;
}

function renderDailyChart(statistics) {
  const titleId = `daily-chart-${crypto.randomUUID()}`;
  const figure = el('figure', {attrs: {class: 'statistics-figure daily-chart-card'}}, [
    el('h2', {text: `Antworten der letzten ${statistics.daily.length} Tage`, attrs: {id: titleId}}),
    el('p', {text: 'Jeder Balken zeigt richtig und falsch beantwortete Aufgaben. Die Zahlen stehen als richtig/falsch direkt über dem Balken.'}),
  ]);
  const width = Math.max(520, statistics.daily.length * 38 + 48);
  const height = 230;
  const chartBottom = 172;
  const chartHeight = 122;
  const maxTotal = Math.max(1, ...statistics.daily.map(({correct, wrong}) => correct + wrong));
  const svg = svgNode('svg', {
    viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-labelledby': `${titleId} ${titleId}-description`,
    width, height,
  });
  svg.append(svgNode('title', {id: `${titleId}-description`}, 'Gestapelte Tagesbalken für richtige und falsche Antworten.'));
  svg.append(svgNode('line', {x1: 24, x2: width - 12, y1: chartBottom, y2: chartBottom, stroke: '#9fb2ad'}));
  statistics.daily.forEach((entry, index) => {
    const x = 30 + index * 38;
    const correctHeight = (entry.correct / maxTotal) * chartHeight;
    const wrongHeight = (entry.wrong / maxTotal) * chartHeight;
    const top = chartBottom - correctHeight - wrongHeight;
    const group = svgNode('g', {
      'data-stat-day': entry.day,
      'aria-label': `${entry.day}: ${entry.correct} richtig, ${entry.wrong} falsch`,
    });
    if (entry.correct > 0) group.append(svgNode('rect', {
      x, y: chartBottom - correctHeight, width: 22, height: correctHeight, rx: 3, fill: '#0aa6a4',
    }));
    if (entry.wrong > 0) group.append(svgNode('rect', {
      x, y: top, width: 22, height: wrongHeight, rx: 3, fill: '#d48922',
    }));
    if (entry.correct + entry.wrong === 0) group.append(svgNode('line', {
      x1: x + 3, x2: x + 19, y1: chartBottom - 2, y2: chartBottom - 2, stroke: '#c9d5d1', 'stroke-width': 3,
    }));
    group.append(svgNode('text', {x: x + 11, y: Math.max(16, top - 6), 'text-anchor': 'middle', class: 'bar-value'}, `${entry.correct}/${entry.wrong}`));
    group.append(svgNode('text', {x: x + 11, y: 194, 'text-anchor': 'middle', class: 'bar-day'}, shortDay(entry.day)));
    svg.append(group);
  });
  const scroll = el('div', {attrs: {class: 'chart-scroll'}});
  scroll.append(svg);
  requestAnimationFrame(() => {
    scroll.scrollLeft = scroll.scrollWidth;
  });
  const key = el('p', {attrs: {class: 'bar-key'}}, [
    el('span', {text: 'Richtig', attrs: {class: 'key-correct'}}),
    el('span', {text: 'Falsch', attrs: {class: 'key-wrong'}}),
  ]);
  figure.append(
    el('p', {text: 'Geöffnet sind die neuesten Tage. Seitliches Scrollen zeigt ältere Tage.', attrs: {class: 'chart-scroll-hint'}}),
    scroll,
    key,
  );
  return figure;
}

function renderDailyTable(statistics) {
  const details = el('details', {attrs: {class: 'statistics-table'}}, [
    el('summary', {text: 'Tageswerte als Tabelle'}),
  ]);
  const wrapper = el('div', {attrs: {class: 'table-scroll'}});
  const table = el('table', {}, [
    el('caption', {text: `Antworten pro Lerntag in den letzten ${statistics.daily.length} Tagen`}),
    el('thead', {}, [el('tr', {}, [
      el('th', {text: 'Lerntag', attrs: {scope: 'col'}}),
      el('th', {text: 'Richtig', attrs: {scope: 'col'}}),
      el('th', {text: 'Falsch', attrs: {scope: 'col'}}),
      el('th', {text: 'Gesamt', attrs: {scope: 'col'}}),
    ])]),
  ]);
  const body = el('tbody');
  for (const entry of statistics.daily) {
    body.append(el('tr', {attrs: {'data-statistics-day': entry.day}}, [
      el('th', {text: entry.day, attrs: {scope: 'row'}}),
      el('td', {text: entry.correct, attrs: {'data-daily': 'correct'}}),
      el('td', {text: entry.wrong, attrs: {'data-daily': 'wrong'}}),
      el('td', {text: entry.correct + entry.wrong, attrs: {'data-daily': 'total'}}),
    ]));
  }
  table.append(body);
  wrapper.append(table);
  details.append(wrapper);
  return details;
}

function wordStatus({facts, scheduled, day}) {
  if (scheduled?.excluded) return 'Aus dem Üben genommen';
  if (!facts.everPracticed) return 'Noch neu';
  if ((scheduled?.intervalIndex ?? -1) >= 0) {
    return scheduled.dueDay <= day
      ? `Zur Auffrischung fällig seit ${scheduled.dueDay}`
      : `Zur Auffrischung ab ${scheduled.dueDay}`;
  }
  return scheduled?.retryPending ? 'In Übung · Fehlerwiederholung offen' : 'In Übung';
}

function renderWordDetails({state, profileId, day}) {
  const projection = project(state.ledger);
  const words = activeWords(projection, profileId);
  const {policy} = currentPolicy(state.ledger, profileId);
  const schedule = projectSchedule({ledger: state.ledger, profileId, policy, day});
  const details = el('details', {attrs: {class: 'statistics-word-details'}}, [
    el('summary', {text: `Wortdetails (${words.length})`}),
    el('p', {text: 'Die aktuelle Serie und Fälligkeit folgen denselben Lernregeln wie neue Runden. Ausgenommene Wörter können unter „Vokabeln“ mit „Wieder üben“ zurückgenommen werden.'}),
  ]);
  const wrapper = el('div', {attrs: {class: 'table-scroll'}});
  const headings = [
    'Vokabel', 'Versuche', 'Richtig', 'Falsch', 'Aktuelle Serie', 'Status und Fälligkeit', 'Letzte Übung',
  ];
  const table = el('table', {}, [
    el('caption', {text: 'Aktueller Lernstand je zugeordnetem Wort'}),
    el('thead', {}, [
      el('tr', {}, headings.map((label) => el('th', {text: label, attrs: {scope: 'col'}}))),
    ]),
  ]);
  const body = el('tbody');
  for (const word of words) {
    const facts = projection.profiles[profileId]?.words[word.id] ?? {
      attempts: 0, correct: 0, wrong: 0, everPracticed: false, lastPracticedAt: null,
    };
    const scheduled = schedule.words.get(word.id)?.get(word.value.learningId) ?? null;
    body.append(el('tr', {attrs: {'data-statistics-word': word.value.german}}, [
      el('th', {text: word.value.german, attrs: {scope: 'row'}}),
      el('td', {text: facts.attempts, attrs: {'data-word-stat': 'attempts'}}),
      el('td', {text: facts.correct, attrs: {'data-word-stat': 'correct'}}),
      el('td', {text: facts.wrong, attrs: {'data-word-stat': 'wrong'}}),
      el('td', {text: scheduled?.streak ?? 0, attrs: {'data-word-stat': 'streak'}}),
      el('td', {text: wordStatus({facts, scheduled, day}), attrs: {'data-word-stat': 'status'}}),
      el('td', {text: facts.lastPracticedAt?.slice(0, 10) ?? '—'}),
    ]));
  }
  table.append(body);
  wrapper.append(table);
  details.append(wrapper);
  return details;
}

export function renderStatistics({root, state, commands, profileId, onRefresh}) {
  const ui = stateFor(root);
  const container = root.querySelector('#adult-content') ?? root;
  const projection = project(state.ledger);
  const profiles = Object.values(projection.entities.profiles)
    .filter(({value}) => value !== null && !value.archived);
  if (!profiles.some(({id}) => id === ui.profileId)) {
    ui.profileId = profiles.some(({id}) => id === profileId) ? profileId : profiles[0]?.id ?? null;
  }
  const section = el('section', {attrs: {class: 'statistics-view stack', 'aria-labelledby': 'statistics-title'}}, [
    el('header', {attrs: {class: 'section-heading'}}, [
      el('h1', {text: 'Lernstand', attrs: {id: 'statistics-title'}}),
      el('p', {text: 'Aktueller Wortbestand und Antworten im gewählten Zeitraum werden getrennt dargestellt.'}),
    ]),
  ]);
  if (profiles.length === 0) {
    section.append(message('Legen Sie zuerst ein aktives Kinderprofil an.'));
    container.append(section);
    return;
  }
  const profileSelect = el('select', {attrs: {'aria-label': 'Kind für Lernstand'}}, profiles.map((profile) => (
    el('option', {text: profile.value.name, attrs: {value: profile.id}})
  )));
  profileSelect.value = ui.profileId;
  profileSelect.addEventListener('change', () => {
    ui.profileId = profileSelect.value;
    onRefresh();
  });
  const periodSelect = el('select', {attrs: {'aria-label': 'Zeitraum für Lernstand'}}, [
    el('option', {text: '14 Tage', attrs: {value: 14}}),
    el('option', {text: '30 Tage', attrs: {value: 30}}),
  ]);
  periodSelect.value = String(ui.days);
  periodSelect.addEventListener('change', () => {
    ui.days = Number(periodSelect.value);
    onRefresh();
  });
  section.append(el('div', {attrs: {class: 'statistics-controls'}}, [
    field('Kind', profileSelect),
    field('Zeitraum', periodSelect),
  ]));

  const statistics = commands.statistics({profileId: ui.profileId, days: ui.days});
  if (statistics.epochConflict) {
    section.append(message('Die aktive Datensatzversion ist nicht eindeutig. Klären Sie zuerst den Datenkonflikt; bis dahin wird keine Gesamtstatistik angezeigt.', 'error'));
    container.append(section);
    return;
  }
  const cards = el('div', {attrs: {class: 'statistics-cards'}}, [
    el('article', {}, [el('span', {text: 'Antworten'}), el('strong', {text: statistics.summary.attempts, attrs: {'data-statistic': 'attempts'}})]),
    el('article', {}, [el('span', {text: 'Richtig'}), el('strong', {text: statistics.summary.correct, attrs: {'data-statistic': 'correct'}})]),
    el('article', {}, [el('span', {text: 'Trefferquote'}), el('strong', {text: formatPercent(statistics.summary.accuracy), attrs: {'data-statistic': 'accuracy'}})]),
  ]);
  section.append(cards);
  if (statistics.summary.attempts === 0) {
    section.append(message('Noch keine Antworten in diesem Zeitraum.'));
  }
  section.append(
    el('p', {text: 'Die Wortverteilung zeigt nur aktuell zugeordnete, aktive Wörter. Die Antwortzahlen enthalten dagegen auch Wörter, die inzwischen archiviert oder nicht mehr zugeordnet sind.', attrs: {class: 'statistics-explanation'}}),
    renderRing(statistics),
    renderDailyChart(statistics),
    renderDailyTable(statistics),
  );
  if (projection.conflicts.some(({entityType}) => entityType === 'word')) {
    section.append(message('Konfliktbehaftete Wortfassungen sind nicht im aktuellen Wortbestand enthalten.', 'error'));
  }
  section.append(renderWordDetails({state, profileId: ui.profileId, day: statistics.daily.at(-1).day}));
  container.append(section);
}
