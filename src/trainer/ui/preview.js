import {project} from '../learning/progress.js';
import {el} from './dom.js';

const ENTITY_BUCKETS = {profile: 'profiles', lesson: 'lessons', word: 'words'};
const ENTITY_LABELS = {profile: 'Kind', lesson: 'Lektion', word: 'Vokabel'};

function dateLabel(day) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day ?? '');
  return match ? `${match[3]}.${match[2]}.${match[1]}` : 'Datum unbekannt';
}

function orderedEvents(state, extraEvents = []) {
  const byId = new Map();
  for (const event of [...(state?.ledger?.events ?? []), ...extraEvents]) byId.set(event.id, event);
  return [...byId.values()].sort((left, right) => left.clock - right.clock || left.id.localeCompare(right.id, 'en'));
}

function createContext(state, extraEvents = [], summary = null) {
  const events = orderedEvents(state, extraEvents);
  const eventById = new Map(events.map((event) => [event.id, event]));
  const names = {profile: new Map(), lesson: new Map(), word: new Map()};
  for (const event of events) {
    if (event.type !== 'entity.revised') continue;
    const {entityType, entityId, value} = event.payload;
    const name = entityType === 'word' ? value.german : value.name;
    if (name) names[entityType].set(entityId, name);
  }
  for (const change of summary?.contentChanges ?? []) {
    for (const side of [change.before, change.after]) {
      const value = side?.value;
      if (!value) continue;
      const name = change.entityType === 'word' ? value.german : value.name;
      if (name) names[change.entityType].set(change.entityId, name);
    }
  }
  let projection = null;
  try { projection = state?.ledger ? project(state.ledger) : null; } catch { projection = null; }
  for (const [entityType, bucket] of Object.entries(ENTITY_BUCKETS)) {
    for (const [entityId, entity] of Object.entries(projection?.entities?.[bucket] ?? {})) {
      const value = entity?.value;
      const name = entityType === 'word' ? value?.german : value?.name;
      if (name) names[entityType].set(entityId, name);
    }
  }
  return {
    eventById,
    name(entityType, entityId, fallbackValue = null) {
      const direct = entityType === 'word' ? fallbackValue?.german : fallbackValue?.name;
      return direct || names[entityType]?.get(entityId) || `Unbekannte${entityType === 'profile' ? 's Kind' : entityType === 'lesson' ? ' Lektion' : ' Vokabel'}`;
    },
  };
}

function statusLine(value) {
  return `Status: ${value.archived ? 'Archiviert' : 'Aktiv'}`;
}

function revisionPresentation(event, context, peerEvents = []) {
  const {entityType, entityId, value} = event.payload;
  const label = ENTITY_LABELS[entityType] ?? 'Inhalt';
  const name = context.name(entityType, entityId, value);
  const lines = [`${label}: ${name}`, statusLine(value)];
  if (entityType === 'lesson') {
    const profiles = value.profileIds.map((profileId) => context.name('profile', profileId));
    lines.push(`Freigegeben für: ${profiles.length ? profiles.join(', ') : 'kein Kind'}`);
  }
  if (entityType === 'word') {
    const learningIds = [...new Set(peerEvents
      .filter((peer) => peer?.payload?.entityType === 'word')
      .map((peer) => peer.payload.value.learningId))].sort();
    const learningIndex = learningIds.indexOf(value.learningId);
    lines.push(
      `Lektion: ${context.name('lesson', value.lessonId)}`,
      `Deutsch: ${value.german}`,
      `Englisch: ${value.answers.join(' / ')}`,
      `Hinweis: ${value.hint || 'kein Hinweis'}`,
      learningIds.length <= 1
        ? 'Lernstand: bleibt bei allen Fassungen gleich'
        : `Lernstand: getrennte Lernentwicklung, Variante ${learningIndex + 1}`,
    );
  }
  return {title: `${label} ${name}`, lines};
}

function changeSide(entityType, entityId, entity, context) {
  if (entity === null || entity === undefined) return {primary: 'nicht vorhanden', details: []};
  if (entity.value === null) return {primary: 'mehrere sichere Fassungen', details: []};
  const value = entity.value;
  if (entityType === 'word') return {
    primary: value.answers.join(' / '),
    details: [
      `Deutsch: ${value.german}`,
      `Lektion: ${context.name('lesson', value.lessonId)}`,
      statusLine(value),
      `Hinweis: ${value.hint || 'kein Hinweis'}`,
    ],
  };
  if (entityType === 'lesson') return {
    primary: value.name,
    details: [statusLine(value), `Freigegeben für: ${value.profileIds.length
      ? value.profileIds.map((profileId) => context.name('profile', profileId)).join(', ')
      : 'kein Kind'}`],
  };
  return {primary: value.name, details: [statusLine(value)]};
}

function wordProgress(value) {
  if (!value) return 'kein Lernstand';
  return `${value.correct ?? 0} richtig, ${value.wrong ?? 0} falsch, Serie ${value.streak ?? 0}${value.dueDay ? `, fällig ${dateLabel(value.dueDay)}` : ''}`;
}

function eventPresentation(event, context) {
  if (!event) return 'Nicht mehr lesbare historische Grundlage';
  const day = dateLabel(event.day);
  if (event.type === 'answer.recorded') {
    return `Antwort von ${context.name('profile', event.payload.profileId)} zu ${context.name('word', event.payload.wordId)} am ${day} (${event.payload.correct ? 'richtig' : 'falsch'})`;
  }
  if (event.type === 'round.started') return `Rundenstart für ${context.name('profile', event.payload.profileId)} am ${day}`;
  if (event.type === 'round.completed') return `Rundenabschluss für ${context.name('profile', event.payload.profileId)} am ${day}`;
  if (event.type === 'round.abandoned') return `Abgebrochene Runde von ${context.name('profile', event.payload.profileId)} am ${day}`;
  if (event.type === 'entity.revised') {
    const described = revisionPresentation(event, context);
    return `${described.title} geändert am ${day}`;
  }
  if(event.type==='learning.rules.changed') {
    const p=event.payload;
    return `Lernregeln für ${context.name('profile',p.profileId)}: seltener ab ${p.slowAfter}, ${p.stopAfter===null?'weiter auffrischen':`ausnehmen ab ${p.stopAfter}`}, Abstände ${p.intervals.join('/')} Tage, am ${day}`;
  }
  if(event.type==='word.reactivated')return `${context.name('word',event.payload.wordId)} für ${context.name('profile',event.payload.profileId)} wieder ins Üben aufgenommen am ${day}`;
  if (event.type === 'word.milestone') return `Lernerfolg zu ${context.name('word', event.payload.wordId)} für ${context.name('profile', event.payload.profileId)} am ${day}`;
  if (event.type === 'avatar.changed') return `Avatar von ${context.name('profile', event.payload.profileId)} geändert am ${day}`;
  if (event.type === 'preference.changed') return `Bewegungseinstellung von ${context.name('profile', event.payload.profileId)} geändert am ${day}`;
  if (event.type === 'events.adopted') return `Ausgewählte alte Änderungen übernommen am ${day}`;
  return `Historische Lernänderung vom ${day}`;
}

function detailsList(lines, prefix = '') {
  if (lines.length === 0) return null;
  return el('ul', {attrs: {class: 'preview-field-list'}}, lines.map((line) => el('li', {text: prefix ? `${prefix} · ${line}` : line})));
}

function conflictedBeforeNodes(entity, context) {
  if (entity?.value !== null || !Array.isArray(entity.heads)) return null;
  const revisions = entity.heads.map((headId) => context.eventById.get(headId));
  const peers = revisions.filter(Boolean);
  const nodes = [el('p', {text: 'Vorher: mehrere sichere Fassungen'})];
  for (const [index, revision] of revisions.entries()) {
    const choice = el('div', {attrs: {class: 'revision-choice'}}, [
      el('h6', {text: `Vorherige Fassung ${index + 1}`}),
    ]);
    if (revision) {
      const presentation = revisionPresentation(revision, context, peers);
      choice.append(detailsList(presentation.lines, 'Vorher'));
    } else {
      choice.append(el('p', {text: 'Diese sichere Fassung kann in der Vorschau nicht vollständig angezeigt werden.'}));
    }
    nodes.push(choice);
  }
  return nodes;
}

function conflictNodes(summary, context) {
  if (!summary.conflicts?.length) return [];
  const section = el('section', {attrs: {class: 'preview-conflicts'}}, [
    el('h4', {text: 'Konflikte in diesem Datenstand'}),
    el('p', {text: 'Die Fassungen bleiben getrennt erhalten, bis eine gemeinsame Fassung gewählt wird.'}),
  ]);
  for (const conflict of summary.conflicts) {
    const revisions = conflict.heads.map((headId) => context.eventById.get(headId)).filter(Boolean);
    const first = revisions[0];
    const fallbackValue = first?.payload?.value ?? null;
    const title = `${ENTITY_LABELS[conflict.entityType] ?? 'Inhalt'} ${context.name(conflict.entityType, conflict.entityId, fallbackValue)}`;
    const article = el('article', {attrs: {class: 'preview-conflict'}}, [el('h5', {text: `Konflikt: ${title}`})]);
    if (revisions.length === 0) article.append(el('p', {text: 'Die getrennten Fassungen bleiben sicher erhalten.'}));
    for (const revision of revisions) {
      const choice = revisionPresentation(revision, context, revisions);
      article.append(el('div', {attrs: {class: 'revision-choice'}}, [detailsList(choice.lines)]));
    }
    section.append(article);
  }
  return [section];
}

export function revisionChoiceNodes(event, state, extraEvents = [], peerEvents = []) {
  const context = createContext(state, extraEvents);
  const presentation = revisionPresentation(event, context, peerEvents);
  return [el('p', {text: presentation.title, attrs: {class: 'revision-title'}}), detailsList(presentation.lines)];
}

export function eventLabel(event, state, extraEvents = []) {
  return eventPresentation(event, createContext(state, extraEvents));
}

export function previewSummaryNodes({summary, state, events = [], selectedEventIds = [], supportEventIds = []}) {
  const context = createContext(state, events, summary);
  const nodes = [];
  const list = el('dl', {attrs: {class: 'summary-list'}}, [
    el('dt', {text: 'Profile'}), el('dd', {text: `${summary.profiles.before} → ${summary.profiles.after}`}),
    el('dt', {text: 'Vokabeln'}), el('dd', {text: `${summary.wordCount.before} → ${summary.wordCount.after}`}),
    el('dt', {text: 'Antworten'}), el('dd', {text: `${summary.answerCount.before} → ${summary.answerCount.after}`}),
  ]);
  for (const progress of summary.progressChanges) {
    const profileName = context.name('profile', progress.profileId);
    list.append(el('dt', {text: `Punkte · ${profileName}`}), el('dd', {text: `${progress.points.before} → ${progress.points.after}`}));
  }
  nodes.push(list);
  for(const [key,label] of [['added','Zusätzliche Lernregeln und Wiederaktivierungen im aktiven Verlauf'],['removed','Lernregeln und Wiederaktivierungen künftig nur im alten Verlauf']]) {
    const changes=summary.learningChanges?.[key] ?? [];
    if(changes.length)nodes.push(el('section',{},[el('h4',{text:label}),
      ...changes.map(event=>el('p',{text:eventPresentation(event,context)}))]));
  }

  if (summary.contentChanges.length > 0) {
    const section = el('section', {attrs: {class: 'preview-content-changes'}}, [el('h4', {text: 'Inhaltliche Unterschiede'})]);
    for (const change of summary.contentChanges) {
      const before = changeSide(change.entityType, change.entityId, change.before, context);
      const after = changeSide(change.entityType, change.entityId, change.after, context);
      const value = change.after?.value ?? change.before?.value ?? null;
      const title = `${ENTITY_LABELS[change.entityType] ?? 'Inhalt'} ${context.name(change.entityType, change.entityId, value)}`;
      const article = el('article', {attrs: {class: 'preview-change'}}, [el('h5', {text: title})]);
      const conflictedBefore = conflictedBeforeNodes(change.before, context);
      if (conflictedBefore) article.append(...conflictedBefore);
      else {
        article.append(el('p', {text: `Vorher: ${before.primary}`}));
        const beforeDetails = detailsList(before.details, 'Vorher');
        if (beforeDetails) article.append(beforeDetails);
      }
      article.append(el('p', {text: `Nachher: ${after.primary}`}));
      const afterDetails = detailsList(after.details, 'Nachher');
      if (afterDetails) article.append(afterDetails);
      if (change.entityType === 'word' && change.before?.value && change.after?.value) {
        article.append(el('p', {
          text: `Lernstand-Zuordnung: ${change.before.value.learningId === change.after.value.learningId ? 'unverändert' : 'ändert sich'}`,
        }));
      }
      section.append(article);
    }
    nodes.push(section);
  }

  const changedWords = new Map();
  for (const progress of summary.progressChanges) {
    const before = new Map(progress.words.before);
    const after = new Map(progress.words.after);
    for (const wordId of new Set([...before.keys(), ...after.keys()])) {
      if (JSON.stringify(before.get(wordId) ?? null) === JSON.stringify(after.get(wordId) ?? null)) continue;
      const key = `${progress.profileId}\u0000${wordId}`;
      changedWords.set(key, {
        profileName: context.name('profile', progress.profileId), wordName: context.name('word', wordId),
        before: wordProgress(before.get(wordId)), after: wordProgress(after.get(wordId)),
      });
    }
  }
  if (changedWords.size > 0) {
    const section = el('section', {attrs: {class: 'preview-progress-changes'}}, [el('h4', {text: 'Lernstand je Kind und Vokabel'})]);
    for (const change of changedWords.values()) section.append(el('p', {
      text: `${change.profileName} · ${change.wordName}: ${change.before} → ${change.after}`,
    }));
    nodes.push(section);
  }

  nodes.push(...conflictNodes(summary, context));

  if (selectedEventIds.length > 0) {
    nodes.push(el('section', {attrs: {class: 'preview-selected-events'}}, [
      el('h4', {text: 'Ausgewählte Änderungen'}),
      ...selectedEventIds.map((eventId) => el('p', {text: eventPresentation(context.eventById.get(eventId), context)})),
    ]));
  }
  if (supportEventIds.length > 0) {
    nodes.push(el('section', {attrs: {class: 'preview-support-events'}}, [
      el('h4', {text: 'Nur benötigte Grundlagen'}),
      el('p', {text: 'Diese Ereignisse belegen die ausgewählten Änderungen und geben keine zusätzliche Wertung.'}),
      ...supportEventIds.map((eventId) => el('p', {text: eventPresentation(context.eventById.get(eventId), context)})),
    ]));
  }
  return nodes;
}
