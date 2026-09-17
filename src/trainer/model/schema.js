import {canonical} from './canonical.js';
import {ProductError} from './errors.js';

const VERSION_KEYS = ['format', 'formatVersion', 'ruleVersion'];
const VERSION = {
  format: 'vokabeltrainer-product',
  formatVersion: 1,
  ruleVersion: 1,
};
const EVENT_KEYS = [
  ...VERSION_KEYS,
  'kind',
  'id',
  'datasetId',
  'epochId',
  'deviceId',
  'clock',
  'occurredAt',
  'day',
  'type',
  'payload',
];
const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const HASH_PATTERN = /^[0-9a-f]{64}$/;
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const MAX_EVENT_BYTES = 16 * 1024;

function fail(code, message) {
  throw new ProductError(code, message);
}

function invalid(message = 'Die Daten haben ein ungültiges Format.') {
  fail('invalid', message);
}

function reference(message = 'Die Daten enthalten einen ungültigen Verweis.') {
  fail('reference', message);
}

function collision(message = 'Eine ID enthält unterschiedliche Daten.') {
  fail('collision', message);
}

function assertPlainObject(value, message = 'Ein Objekt ist ungültig.') {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) invalid(message);
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) invalid(message);
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== 'string' || FORBIDDEN_KEYS.has(key)) invalid(message);
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) invalid(message);
  }
}

function assertExactKeys(value, expected, message) {
  assertPlainObject(value, message);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length
    || actual.some((key, index) => key !== wanted[index])) invalid(message);
}

function assertArray(value, message = 'Eine Liste ist ungültig.') {
  if (!Array.isArray(value)) invalid(message);
  const keys = Object.keys(value);
  if (keys.length !== value.length || keys.some((key, index) => key !== String(index))) {
    invalid(message);
  }
}

function assertVersion(value) {
  if (value.format !== VERSION.format
    || value.formatVersion !== VERSION.formatVersion
    || value.ruleVersion !== VERSION.ruleVersion) {
    fail('version', 'Diese Datenversion wird nicht unterstützt.');
  }
}

function assertId(value, message = 'Eine ID ist ungültig.') {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) invalid(message);
}

function assertNullableId(value, message) {
  if (value !== null) assertId(value, message);
}

function assertText(value, {minimum = 0, maximum, message = 'Ein Textfeld ist ungültig.'}) {
  if (typeof value !== 'string') invalid(message);
  const length = [...value].length;
  if (length < minimum || length > maximum) invalid(message);
}

function assertBoolean(value, message = 'Ein Wahrheitswert ist ungültig.') {
  if (typeof value !== 'boolean') invalid(message);
}

function assertInteger(value, {minimum = 0, maximum = Number.MAX_SAFE_INTEGER} = {}) {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    invalid('Ein Zähler ist ungültig.');
  }
}

function assertUtcInstant(value) {
  if (typeof value !== 'string') invalid('Ein Zeitpunkt ist ungültig.');
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?Z$/.exec(value);
  if (!match) invalid('Ein Zeitpunkt ist ungültig.');
  const milliseconds = (match[7] ?? '').padEnd(3, '0');
  const normalized = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}.${milliseconds}Z`;
  const time = Date.parse(normalized);
  if (!Number.isFinite(time) || new Date(time).toISOString() !== normalized) {
    invalid('Ein Zeitpunkt ist ungültig.');
  }
}

function assertCalendarDay(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    invalid('Ein Kalendertag ist ungültig.');
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    invalid('Ein Kalendertag ist ungültig.');
  }
}

function assertTimeZone(value) {
  if (typeof value !== 'string' || value.length === 0) invalid('Die Lernzeitzone ist ungültig.');
  try {
    new Intl.DateTimeFormat('de-DE', {timeZone: value}).format(0);
  } catch {
    invalid('Die Lernzeitzone ist ungültig.');
  }
}

function assertEnum(value, allowed, message) {
  if (!allowed.includes(value)) invalid(message);
}

function assertIdArray(value, {sorted = true, allowEmpty = true, message = 'Eine ID-Liste ist ungültig.'} = {}) {
  assertArray(value, message);
  if (!allowEmpty && value.length === 0) invalid(message);
  for (const id of value) assertId(id, message);
  if (new Set(value).size !== value.length) invalid(message);
  if (sorted && value.some((id, index) => index > 0 && value[index - 1] > id)) invalid(message);
}

function assertEntityValue(entityType, value) {
  if (entityType === 'profile') {
    assertExactKeys(value, ['name', 'archived'], 'Die Profilfassung ist ungültig.');
    assertText(value.name, {minimum: 1, maximum: 80, message: 'Der Profilname ist ungültig.'});
    assertBoolean(value.archived);
    return;
  }
  if (entityType === 'lesson') {
    assertExactKeys(value, ['name', 'archived', 'profileIds'], 'Die Lektionsfassung ist ungültig.');
    assertText(value.name, {minimum: 1, maximum: 80, message: 'Der Lektionsname ist ungültig.'});
    assertBoolean(value.archived);
    assertIdArray(value.profileIds);
    return;
  }
  if (entityType === 'word') {
    assertExactKeys(
      value,
      ['lessonId', 'german', 'hint', 'answers', 'archived', 'learningId'],
      'Die Wortfassung ist ungültig.',
    );
    assertId(value.lessonId);
    assertText(value.german, {minimum: 1, maximum: 200, message: 'Das deutsche Wort ist ungültig.'});
    assertText(value.hint, {maximum: 300, message: 'Der Hinweis ist ungültig.'});
    assertArray(value.answers, 'Die Antwortvarianten sind ungültig.');
    if (value.answers.length === 0 || value.answers.length > 20) invalid('Die Antwortvarianten sind ungültig.');
    for (const answer of value.answers) {
      assertText(answer, {minimum: 1, maximum: 200, message: 'Eine Antwortvariante ist ungültig.'});
    }
    assertBoolean(value.archived);
    assertId(value.learningId);
    return;
  }
  invalid('Der Entitätstyp ist ungültig.');
}

function assertEntityRevision(payload) {
  assertExactKeys(payload, ['entityType', 'entityId', 'parents', 'value'], 'Die Inhaltsfassung ist ungültig.');
  assertEnum(payload.entityType, ['profile', 'lesson', 'word'], 'Der Entitätstyp ist ungültig.');
  assertId(payload.entityId);
  assertIdArray(payload.parents);
  assertEntityValue(payload.entityType, payload.value);
}

function assertRoundStarted(payload) {
  assertExactKeys(payload, ['roundId', 'profileId', 'mode', 'size', 'candidates'], 'Der Rundenstart ist ungültig.');
  assertId(payload.roundId);
  assertId(payload.profileId);
  assertEnum(payload.mode, ['all', 'latest', 'new'], 'Der Lernmodus ist ungültig.');
  assertEnum(payload.size, [10, 20, 30], 'Die Rundengröße ist ungültig.');
  assertArray(payload.candidates, 'Die Aufgabenauswahl ist ungültig.');
  const words = new Set();
  for (const candidate of payload.candidates) {
    assertExactKeys(candidate, ['wordId', 'learningId'], 'Eine Aufgabe ist ungültig.');
    assertId(candidate.wordId);
    assertId(candidate.learningId);
    if (words.has(candidate.wordId)) invalid('Die Aufgabenauswahl enthält ein Wort mehrfach.');
    words.add(candidate.wordId);
  }
}

function assertAnswer(payload) {
  assertExactKeys(
    payload,
    ['roundId', 'profileId', 'ordinal', 'wordId', 'revisionId', 'learningId', 'correct'],
    'Die Antwort ist ungültig.',
  );
  assertId(payload.roundId);
  assertId(payload.profileId);
  assertInteger(payload.ordinal, {minimum: 1, maximum: 30});
  assertId(payload.wordId);
  assertId(payload.revisionId);
  assertId(payload.learningId);
  assertBoolean(payload.correct);
}

function assertRoundCompleted(payload) {
  assertExactKeys(payload, ['roundId', 'profileId', 'reason', 'answerIds'], 'Der Rundenabschluss ist ungültig.');
  assertId(payload.roundId);
  assertId(payload.profileId);
  assertEnum(payload.reason, ['full', 'exhausted'], 'Der Abschlussgrund ist ungültig.');
  assertIdArray(payload.answerIds, {allowEmpty: false});
}

function assertRoundAbandoned(payload) {
  assertExactKeys(payload, ['roundId', 'profileId'], 'Der Rundenabbruch ist ungültig.');
  assertId(payload.roundId);
  assertId(payload.profileId);
}

function assertMilestone(payload) {
  assertExactKeys(
    payload,
    ['profileId', 'wordId', 'milestone', 'evidenceAnswerIds'],
    'Der Wortmeilenstein ist ungültig.',
  );
  assertId(payload.profileId);
  assertId(payload.wordId);
  assertEnum(payload.milestone, ['mastered', 'recovered'], 'Der Wortmeilenstein ist ungültig.');
  assertIdArray(payload.evidenceAnswerIds, {sorted: false, allowEmpty: false});
  const expectedLength = payload.milestone === 'mastered' ? 3 : 2;
  if (payload.evidenceAnswerIds.length !== expectedLength) invalid('Die Meilensteinbelege sind unvollständig.');
}

function assertAvatar(payload) {
  assertExactKeys(
    payload,
    ['profileId', 'skin', 'clothing', 'head', 'back', 'hand'],
    'Die Avatar-Auswahl ist ungültig.',
  );
  assertId(payload.profileId);
  assertInteger(payload.skin, {minimum: 0, maximum: 3});
  assertInteger(payload.clothing, {minimum: 0, maximum: 5});
  assertEnum(payload.head, [null, 'cap', 'sunhat', 'mountainhat'], 'Die Kopfbedeckung ist ungültig.');
  assertEnum(payload.back, [null, 'backpack'], 'Die Rückenausstattung ist ungültig.');
  assertEnum(payload.hand, [null, 'binoculars', 'compass'], 'Die Handausstattung ist ungültig.');
}

function assertPreference(payload) {
  assertExactKeys(payload, ['profileId', 'animations'], 'Die Einstellung ist ungültig.');
  assertId(payload.profileId);
  assertBoolean(payload.animations);
}

function assertAdopted(payload) {
  assertExactKeys(
    payload,
    ['sourceEpochId', 'eventIds', 'supportEventIds'],
    'Die Übernahmeauswahl ist ungültig.',
  );
  assertId(payload.sourceEpochId);
  assertIdArray(payload.eventIds);
  assertIdArray(payload.supportEventIds);
  if (payload.eventIds.some((id) => payload.supportEventIds.includes(id))) {
    invalid('Wirksame und unterstützende Ereignisse müssen getrennt sein.');
  }
}

const PAYLOAD_VALIDATORS = new Map([
  ['entity.revised', assertEntityRevision],
  ['round.started', assertRoundStarted],
  ['answer.recorded', assertAnswer],
  ['round.completed', assertRoundCompleted],
  ['round.abandoned', assertRoundAbandoned],
  ['word.milestone', assertMilestone],
  ['avatar.changed', assertAvatar],
  ['preference.changed', assertPreference],
  ['events.adopted', assertAdopted],
]);

export function assertDescriptor(value) {
  assertExactKeys(
    value,
    [...VERSION_KEYS, 'kind', 'datasetId', 'name', 'timeZone', 'rootEpochId', 'createdAt'],
    'Die Datensatzbeschreibung ist ungültig.',
  );
  assertVersion(value);
  if (value.kind !== 'dataset') invalid('Die Datensatzbeschreibung ist ungültig.');
  assertId(value.datasetId);
  assertText(value.name, {minimum: 1, maximum: 80, message: 'Der Datensatzname ist ungültig.'});
  assertTimeZone(value.timeZone);
  assertId(value.rootEpochId);
  assertUtcInstant(value.createdAt);
  return structuredClone(value);
}

export function assertEvent(value) {
  assertExactKeys(value, EVENT_KEYS, 'Das Ereignis ist ungültig.');
  assertVersion(value);
  if (value.kind !== 'event') invalid('Das Ereignis ist ungültig.');
  assertId(value.id);
  assertId(value.datasetId);
  assertId(value.epochId);
  assertId(value.deviceId);
  assertInteger(value.clock);
  assertUtcInstant(value.occurredAt);
  assertCalendarDay(value.day);
  const validatePayload = PAYLOAD_VALIDATORS.get(value.type);
  if (!validatePayload) invalid('Der Ereignistyp ist ungültig.');
  validatePayload(value.payload);
  if (new TextEncoder().encode(canonical(value)).byteLength > MAX_EVENT_BYTES) {
    invalid('Das Ereignis überschreitet die zulässige Größe von 16 KiB.');
  }
  return structuredClone(value);
}

function assertEpoch(value) {
  assertExactKeys(
    value,
    [
      ...VERSION_KEYS,
      'kind',
      'id',
      'datasetId',
      'parents',
      'deviceId',
      'clock',
      'occurredAt',
      'snapshotId',
      'snapshotManifestFileId',
    ],
    'Die Epoche ist ungültig.',
  );
  assertVersion(value);
  if (value.kind !== 'epoch') invalid('Die Epoche ist ungültig.');
  assertId(value.id);
  assertId(value.datasetId);
  assertIdArray(value.parents);
  assertId(value.deviceId);
  assertInteger(value.clock);
  assertUtcInstant(value.occurredAt);
  assertNullableId(value.snapshotId);
  assertNullableId(value.snapshotManifestFileId);
  return structuredClone(value);
}

function assertEpochHistory(value) {
  assertExactKeys(
    value,
    ['id', 'datasetId', 'parents', 'deviceId', 'clock', 'occurredAt'],
    'Der Epochenherkunftseintrag ist ungültig.',
  );
  assertId(value.id);
  assertId(value.datasetId);
  assertIdArray(value.parents);
  assertId(value.deviceId);
  assertInteger(value.clock);
  assertUtcInstant(value.occurredAt);
  return structuredClone(value);
}

function assertSnapshot(value) {
  assertExactKeys(
    value,
    ['id', 'datasetId', 'effectiveEventIds', 'supportEventIds', 'contentHash'],
    'Der Sicherungsstand ist ungültig.',
  );
  assertId(value.id);
  assertId(value.datasetId);
  assertIdArray(value.effectiveEventIds);
  assertIdArray(value.supportEventIds);
  if (value.effectiveEventIds.some((id) => value.supportEventIds.includes(id))) {
    invalid('Wirksame und unterstützende Ereignisse müssen getrennt sein.');
  }
  if (typeof value.contentHash !== 'string' || !HASH_PATTERN.test(value.contentHash)) {
    invalid('Der Sicherungsstand enthält keinen gültigen SHA-256-Hash.');
  }
  return structuredClone(value);
}

function uniqueById(values, label) {
  const byId = new Map();
  for (const value of values) {
    const previous = byId.get(value.id);
    if (previous && canonical(previous) !== canonical(value)) {
      collision(`${label} enthält eine ID mit unterschiedlichen Daten.`);
    }
    if (!previous) byId.set(value.id, value);
  }
  return [...byId.values()];
}

function assertDag(nodes, parentLookup, label) {
  const states = new Map();
  for (const startId of nodes.keys()) {
    if (states.has(startId)) continue;
    states.set(startId, 'visiting');
    const stack = [{id: startId, parents: parentLookup(startId), index: 0}];
    while (stack.length > 0) {
      const current = stack.at(-1);
      if (current.index >= current.parents.length) {
        states.set(current.id, 'visited');
        stack.pop();
        continue;
      }
      const parentId = current.parents[current.index];
      current.index += 1;
      const parentState = states.get(parentId);
      if (parentState === 'visiting') reference(`${label} enthält einen Kreis.`);
      if (parentState === 'visited') continue;
      states.set(parentId, 'visiting');
      stack.push({id: parentId, parents: parentLookup(parentId), index: 0});
    }
  }
}

function compareEvents(left, right) {
  if (left.clock !== right.clock) return left.clock - right.clock;
  if (left.deviceId !== right.deviceId) return left.deviceId < right.deviceId ? -1 : 1;
  if (left.id !== right.id) return left.id < right.id ? -1 : 1;
  return 0;
}

function validateEntityReferences(eventsById, entityEvents) {
  for (const event of entityEvents) {
    for (const parentId of event.payload.parents) {
      const parent = eventsById.get(parentId);
      if (!parent || parent.type !== 'entity.revised'
        || parent.payload.entityType !== event.payload.entityType
        || parent.payload.entityId !== event.payload.entityId) {
        reference('Eine Inhaltsfassung verweist nicht auf eine passende Vorgängerfassung.');
      }
    }
  }
  const entityByRevision = new Map(entityEvents.map((event) => [event.id, event]));
  assertDag(
    entityByRevision,
    (id) => entityByRevision.get(id).payload.parents,
    'Der Fassungsgraph',
  );

  const entityIds = {
    profile: new Set(),
    lesson: new Set(),
    word: new Set(),
  };
  for (const event of entityEvents) entityIds[event.payload.entityType].add(event.payload.entityId);
  for (const event of entityEvents) {
    const {entityType, value} = event.payload;
    if (entityType === 'lesson') {
      for (const profileId of value.profileIds) {
        if (!entityIds.profile.has(profileId)) reference('Eine Lektion verweist auf ein unbekanntes Profil.');
      }
    }
    if (entityType === 'word' && !entityIds.lesson.has(value.lessonId)) {
      reference('Ein Wort verweist auf eine unbekannte Lektion.');
    }
  }
  return entityIds;
}

function validateRoundReferences(events, eventsById, entityIds) {
  const revisions = new Map(events
    .filter((event) => event.type === 'entity.revised')
    .map((event) => [event.id, event]));
  const starts = new Map();
  for (const event of events.filter((entry) => entry.type === 'round.started')) {
    const {roundId, profileId, candidates} = event.payload;
    if (!entityIds.profile.has(profileId)) reference('Eine Runde verweist auf ein unbekanntes Profil.');
    for (const candidate of candidates) {
      const matches = [...revisions.values()].some((revision) => revision.payload.entityType === 'word'
        && revision.payload.entityId === candidate.wordId
        && revision.payload.value.learningId === candidate.learningId);
      if (!matches) reference('Eine Runde verweist auf eine unbekannte Lernfassung.');
    }
    const previous = starts.get(roundId);
    if (previous && canonical(previous.payload) !== canonical(event.payload)) {
      collision('Eine Runden-ID enthält unterschiedliche Startdaten.');
    }
    if (!previous || compareEvents(previous, event) > 0) starts.set(roundId, event);
  }

  const answers = new Map();
  const answerBySlot = new Map();
  for (const event of events.filter((entry) => entry.type === 'answer.recorded')) {
    const payload = event.payload;
    const start = starts.get(payload.roundId);
    if (!start || start.payload.profileId !== payload.profileId || payload.ordinal > start.payload.size) {
      reference('Eine Antwort verweist nicht auf den passenden Rundenstart.');
    }
    const revision = revisions.get(payload.revisionId);
    if (!revision || revision.payload.entityType !== 'word'
      || revision.payload.entityId !== payload.wordId
      || revision.payload.value.learningId !== payload.learningId) {
      reference('Eine Antwort verweist nicht auf die passende Wortfassung.');
    }
    const candidate = start.payload.candidates.find(({wordId}) => wordId === payload.wordId);
    if (!candidate || candidate.learningId !== payload.learningId) {
      reference('Eine Antwort gehört nicht zur eingefrorenen Aufgabenauswahl.');
    }
    const slot = `${payload.roundId}\u0000${payload.ordinal}`;
    const previous = answerBySlot.get(slot);
    if (previous && canonical(previous.payload) !== canonical(payload)) {
      collision('Eine Rundennummer enthält widersprüchliche Antworten.');
    }
    if (!previous || compareEvents(previous, event) > 0) answerBySlot.set(slot, event);
    answers.set(event.id, event);
  }

  for (const event of events.filter((entry) => entry.type === 'round.completed')) {
    const {roundId, profileId, reason, answerIds} = event.payload;
    const start = starts.get(roundId);
    if (!start || start.payload.profileId !== profileId) {
      reference('Ein Abschluss verweist nicht auf den passenden Rundenstart.');
    }
    const slots = new Set();
    for (const answerId of answerIds) {
      const answer = answers.get(answerId);
      if (!answer || answer.payload.roundId !== roundId || answer.payload.profileId !== profileId) {
        reference('Ein Abschluss verweist auf eine unpassende Antwort.');
      }
      slots.add(answer.payload.ordinal);
    }
    if (slots.size !== answerIds.length) reference('Ein Abschluss enthält eine Antwortposition mehrfach.');
    if ((reason === 'full' && answerIds.length !== start.payload.size)
      || (reason === 'exhausted' && (answerIds.length === 0 || answerIds.length >= start.payload.size))) {
      reference('Der Abschlussgrund passt nicht zur Anzahl der Antworten.');
    }
    const abandoned = events.some((entry) => entry.type === 'round.abandoned'
      && entry.payload.roundId === roundId
      && entry.payload.profileId === profileId
      && compareEvents(entry, event) < 0);
    if (abandoned) reference('Eine abgebrochene Runde darf nicht abgeschlossen werden.');
  }

  for (const event of events.filter((entry) => entry.type === 'round.abandoned')) {
    const start = starts.get(event.payload.roundId);
    if (!start || start.payload.profileId !== event.payload.profileId) {
      reference('Ein Abbruch verweist nicht auf den passenden Rundenstart.');
    }
  }

  return answers;
}

function validateProfileEvents(events, entityIds, answers) {
  for (const event of events) {
    const payload = event.payload;
    if (['avatar.changed', 'preference.changed'].includes(event.type)
      && !entityIds.profile.has(payload.profileId)) {
      reference('Ein Profilereignis verweist auf ein unbekanntes Profil.');
    }
    if (event.type !== 'word.milestone') continue;
    if (!entityIds.profile.has(payload.profileId) || !entityIds.word.has(payload.wordId)) {
      reference('Ein Wortmeilenstein verweist auf ein unbekanntes Profil oder Wort.');
    }
    const evidence = payload.evidenceAnswerIds.map((id) => answers.get(id));
    if (evidence.some((answer) => !answer)) reference('Ein Wortmeilenstein enthält einen unbekannten Beleg.');
    if (evidence.some((answer) => answer.payload.profileId !== payload.profileId
      || answer.payload.wordId !== payload.wordId)) {
      reference('Ein Wortmeilenstein enthält einen unpassenden Beleg.');
    }
    if (evidence.some((answer, index) => index > 0 && compareEvents(evidence[index - 1], answer) >= 0)) {
      reference('Die Meilensteinbelege haben eine ungültige Reihenfolge.');
    }
    if (payload.milestone === 'mastered') {
      if (evidence.some((answer) => !answer.payload.correct)
        || new Set(evidence.map((answer) => answer.payload.learningId)).size !== 1) {
        reference('Die Belege weisen die Dreierserie nicht nach.');
      }
    } else if (evidence[0].payload.correct || !evidence[1].payload.correct) {
      reference('Die Belege weisen die Erholung nach einem Fehler nicht nach.');
    }
  }
}

function validateAdoptions(events, eventsById, epochIds) {
  for (const event of events.filter((entry) => entry.type === 'events.adopted')) {
    if (!epochIds.has(event.payload.sourceEpochId)) {
      reference('Eine Übernahme verweist auf eine unbekannte Herkunftsepoche.');
    }
    for (const id of [...event.payload.eventIds, ...event.payload.supportEventIds]) {
      if (!eventsById.has(id)) reference('Eine Übernahme verweist auf ein unbekanntes Ereignis.');
    }
  }
}

export function assertLedger(value) {
  assertExactKeys(
    value,
    ['descriptor', 'events', 'epochs', 'snapshots', 'historicalEpochs'],
    'Das Fachmodell ist ungültig.',
  );
  const descriptor = assertDescriptor(value.descriptor);
  assertArray(value.events, 'Die Ereignisliste ist ungültig.');
  assertArray(value.epochs, 'Die Epochenliste ist ungültig.');
  assertArray(value.snapshots, 'Die Sicherungsstandliste ist ungültig.');
  assertArray(value.historicalEpochs, 'Die Epochenherkunftsliste ist ungültig.');

  const events = mergeEvents([], value.events);
  const epochs = uniqueById(value.epochs.map(assertEpoch), 'Der Epochenbaum');
  const snapshots = uniqueById(value.snapshots.map(assertSnapshot), 'Die Sicherungsstände');
  const historicalEpochs = uniqueById(
    value.historicalEpochs.map(assertEpochHistory),
    'Die Epochenherkunft',
  );
  const datasetId = descriptor.datasetId;
  for (const item of [...events, ...epochs, ...snapshots, ...historicalEpochs]) {
    if (item.datasetId !== datasetId) reference('Ein Bestandteil gehört zu einem anderen Datensatz.');
  }

  const snapshotById = new Map(snapshots.map((snapshot) => [snapshot.id, snapshot]));
  const epochById = new Map(epochs.map((epoch) => [epoch.id, epoch]));
  const root = epochById.get(descriptor.rootEpochId);
  if (!root || root.parents.length !== 0 || root.snapshotId !== null
    || root.snapshotManifestFileId !== null) {
    reference('Die Wurzelepoche ist unvollständig oder ungültig.');
  }
  for (const epoch of epochs) {
    if (epoch.id !== descriptor.rootEpochId && epoch.parents.length === 0) {
      reference('Der aktive Epochenbaum enthält eine weitere Wurzel.');
    }
    for (const parentId of epoch.parents) {
      if (!epochById.has(parentId)) reference('Eine Epoche verweist auf einen unbekannten Vorgänger.');
    }
    if (epoch.id !== descriptor.rootEpochId && epoch.snapshotId === null) {
      reference('Eine Folgeepoche ist nicht vollständig belegt.');
    }
    if (epoch.snapshotId !== null && !snapshotById.has(epoch.snapshotId)) {
      reference('Eine Epoche verweist auf einen unbekannten Sicherungsstand.');
    }
  }
  assertDag(epochById, (id) => epochById.get(id).parents, 'Der Epochenbaum');

  const historyById = new Map(historicalEpochs.map((epoch) => [epoch.id, epoch]));
  for (const [id, history] of historyById) {
    const active = epochById.get(id);
    if (active) {
      const projection = {
        id: active.id,
        datasetId: active.datasetId,
        parents: active.parents,
        deviceId: active.deviceId,
        clock: active.clock,
        occurredAt: active.occurredAt,
      };
      if (canonical(projection) !== canonical(history)) {
        collision('Eine Epochen-ID enthält unterschiedliche Herkunftsdaten.');
      }
    }
    for (const parentId of history.parents) {
      if (!historyById.has(parentId) && !epochById.has(parentId)) {
        reference('Ein Herkunftseintrag verweist auf eine unbekannte Epoche.');
      }
    }
  }
  assertDag(
    historyById,
    (id) => historyById.get(id).parents.filter((parentId) => historyById.has(parentId)),
    'Der Herkunftsgraph',
  );

  const epochIds = new Set([...epochById.keys(), ...historyById.keys()]);
  const eventsById = new Map(events.map((event) => [event.id, event]));
  for (const event of events) {
    if (!epochIds.has(event.epochId)) reference('Ein Ereignis verweist auf eine unbekannte Epoche.');
  }
  for (const snapshot of snapshots) {
    for (const eventId of [...snapshot.effectiveEventIds, ...snapshot.supportEventIds]) {
      if (!eventsById.has(eventId)) reference('Ein Sicherungsstand verweist auf ein unbekanntes Ereignis.');
    }
  }

  const entityEvents = events.filter((event) => event.type === 'entity.revised');
  const entityIds = validateEntityReferences(eventsById, entityEvents);
  const answers = validateRoundReferences(events, eventsById, entityIds);
  validateProfileEvents(events, entityIds, answers);
  validateAdoptions(events, eventsById, epochIds);

  return {descriptor, events, epochs, snapshots, historicalEpochs};
}

export function mergeEvents(existing, incoming) {
  assertArray(existing, 'Die gespeicherte Ereignisliste ist ungültig.');
  assertArray(incoming, 'Die neue Ereignisliste ist ungültig.');
  const byId = new Map();
  for (const rawEvent of [...existing, ...incoming]) {
    const event = assertEvent(rawEvent);
    const previous = byId.get(event.id);
    if (previous && canonical(previous) !== canonical(event)) {
      collision('Eine Ereignis-ID enthält unterschiedliche Daten.');
    }
    if (!previous) byId.set(event.id, event);
  }
  return [...byId.values()].map((event) => structuredClone(event));
}
