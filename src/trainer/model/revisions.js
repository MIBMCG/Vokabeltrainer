import {canonical, digest} from './canonical.js';

const ENTITY_BUCKETS = {
  profile: 'profiles',
  lesson: 'lessons',
  word: 'words',
};

function compareAscii(left, right) {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function compareEvents(left, right) {
  if (left.clock !== right.clock) return left.clock - right.clock;
  const deviceOrder = compareAscii(left.deviceId, right.deviceId);
  return deviceOrder || compareAscii(left.id, right.id);
}

function eventOrder(event) {
  return [event.clock, event.deviceId, event.id];
}

function compatibilityValue(event) {
  const {entityType, value} = event.payload;
  if (entityType === 'profile') {
    return {name: normalize(value.name), archived: value.archived};
  }
  if (entityType === 'lesson') {
    return {
      name: normalize(value.name),
      archived: value.archived,
      profileIds: [...value.profileIds],
    };
  }
  return {
    ...semanticWord(value),
    lessonId: value.lessonId,
    archived: value.archived,
  };
}

function collectReachableRoots(heads, allById) {
  const roots = [];
  const visited = new Set();
  const stack = [...heads.map(({id}) => id)];
  while (stack.length > 0) {
    const id = stack.pop();
    if (visited.has(id)) continue;
    visited.add(id);
    const event = allById.get(id);
    if (!event) continue;
    const parents = event.payload.parents;
    if (parents.length === 0) {
      roots.push(event);
      continue;
    }
    for (const parentId of parents) stack.push(parentId);
  }
  return roots;
}

function findHeads(activeEvents, allById) {
  const activeIds = new Set(activeEvents.map(({id}) => id));
  const displaced = new Set();
  const visited = new Set();
  const stack = [...activeIds];
  while (stack.length > 0) {
    const id = stack.pop();
    if (visited.has(id)) continue;
    visited.add(id);
    const event = allById.get(id);
    if (!event) continue;
    for (const parentId of event.payload.parents) {
      if (activeIds.has(parentId)) displaced.add(parentId);
      stack.push(parentId);
    }
  }
  return activeEvents.filter(({id}) => !displaced.has(id)).sort(compareEvents);
}

export function normalize(text) {
  return text
    .normalize('NFC')
    .trim()
    .toLowerCase()
    .replace(/[\u2018\u2019\u02bc]/gu, "'");
}

export function semanticWord(value) {
  return {
    german: normalize(value.german),
    hint: normalize(value.hint),
    answers: [...new Set(value.answers.map((answer) => normalize(answer)))].sort(compareAscii),
  };
}

export async function nextLearningId({wordId, revisionId, value, parents}) {
  if (parents.length === 0) return digest({wordId, revisionId});

  const semantic = semanticWord(value);
  const parentLearningIds = [...new Set(
    parents.map((parent) => parent.payload.value.learningId),
  )].sort(compareAscii);
  const meaningUnchanged = parents.every((parent) => (
    canonical(semanticWord(parent.payload.value)) === canonical(semantic)
  ));
  if (meaningUnchanged && parentLearningIds.length === 1) return parentLearningIds[0];
  return digest({wordId, parentLearningIds, semantic});
}

export function revisionPayload({entityType, entityId, parents, value}) {
  return {
    entityType,
    entityId,
    parents: [...new Set(parents)].sort(compareAscii),
    value: structuredClone(value),
  };
}

export function projectEntities(events, {supportEvents = []} = {}) {
  const activeRevisions = events.filter(({type}) => type === 'entity.revised');
  const supportRevisions = supportEvents.filter(({type}) => type === 'entity.revised');
  const allById = new Map();
  for (const event of [...supportRevisions, ...activeRevisions]) allById.set(event.id, event);

  const grouped = new Map();
  for (const event of activeRevisions) {
    const {entityType, entityId} = event.payload;
    const key = `${entityType}\u0000${entityId}`;
    if (!grouped.has(key)) grouped.set(key, {entityType, entityId, events: []});
    grouped.get(key).events.push(event);
  }

  const entities = {profiles: {}, lessons: {}, words: {}};
  const conflicts = [];
  const groups = [...grouped.values()].sort((left, right) => (
    compareAscii(left.entityType, right.entityType) || compareAscii(left.entityId, right.entityId)
  ));
  for (const group of groups) {
    const heads = findHeads(group.events, allById);
    const roots = collectReachableRoots(heads, allById).sort(compareEvents);
    const createdFrom = roots[0] ?? heads[0];
    const compatibility = new Set(heads.map((event) => canonical(compatibilityValue(event))));
    const conflicted = compatibility.size > 1;
    const winner = heads.at(-1);
    const headIds = heads.map(({id}) => id);
    entities[ENTITY_BUCKETS[group.entityType]][group.entityId] = {
      id: group.entityId,
      heads: headIds,
      value: conflicted ? null : structuredClone(winner.payload.value),
      createdOrder: eventOrder(createdFrom),
      conflicted,
    };
    if (conflicted) {
      conflicts.push({entityType: group.entityType, entityId: group.entityId, heads: headIds});
    }
  }

  return {entities, conflicts};
}
