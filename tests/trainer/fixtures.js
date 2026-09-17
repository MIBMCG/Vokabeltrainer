const VERSION = {
  format: 'vokabeltrainer-product',
  formatVersion: 1,
  ruleVersion: 1,
};

export function createFixture({
  timeZone = 'Europe/Berlin',
  words = [
    ['w1', 'Hund', ['dog']],
    ['w2', 'Katze', ['cat']],
    ['w3', 'Haus', ['house']],
  ],
} = {}) {
  let clock = 0;
  const startedAt = Date.parse('2026-09-17T10:00:00.000Z');

  function event(type, payload, overrides = {}) {
    clock += 1;
    return {
      ...VERSION,
      kind: 'event',
      id: `${type.replace('.', '-')}-${clock}`,
      datasetId: 'd1',
      epochId: 'e0',
      deviceId: 'dev1',
      clock,
      occurredAt: new Date(startedAt + (clock * 1000)).toISOString(),
      day: '2026-09-17',
      type,
      payload: structuredClone(payload),
      ...structuredClone(overrides),
    };
  }

  const profile = event('entity.revised', {
    entityType: 'profile',
    entityId: 'p1',
    parents: [],
    value: {name: 'Ada', archived: false},
  }, {id: 'rev-p1'});
  const lesson = event('entity.revised', {
    entityType: 'lesson',
    entityId: 'l1',
    parents: [],
    value: {name: 'Unit 1', archived: false, profileIds: ['p1']},
  }, {id: 'rev-l1'});
  const wordEvents = words.map(([wordId, german, answers]) => event('entity.revised', {
    entityType: 'word',
    entityId: wordId,
    parents: [],
    value: {
      lessonId: 'l1',
      german,
      hint: '',
      answers: structuredClone(answers),
      archived: false,
      learningId: `learn-${wordId}`,
    },
  }, {id: `rev-${wordId}`}));

  const base = {
    descriptor: {
      ...VERSION,
      kind: 'dataset',
      datasetId: 'd1',
      name: 'Fixture',
      timeZone,
      rootEpochId: 'e0',
      createdAt: '2026-09-17T10:00:00.000Z',
    },
    events: [profile, lesson, ...wordEvents],
    epochs: [{
      ...VERSION,
      kind: 'epoch',
      id: 'e0',
      datasetId: 'd1',
      parents: [],
      deviceId: 'dev1',
      clock: 0,
      occurredAt: '2026-09-17T10:00:00.000Z',
      snapshotId: null,
      snapshotManifestFileId: null,
    }],
    snapshots: [],
    historicalEpochs: [],
  };

  const roundStarted = event('round.started', {
    roundId: 'r1',
    profileId: 'p1',
    mode: 'all',
    size: 10,
    candidates: words.map(([wordId]) => ({wordId, learningId: `learn-${wordId}`})),
  }, {id: 'start-r1'});

  function answer({
    id,
    ordinal = 1,
    wordId = 'w1',
    correct = true,
    day = '2026-09-17',
    roundId = 'r1',
    profileId = 'p1',
    revisionId = `rev-${wordId}`,
    learningId = `learn-${wordId}`,
    ...overrides
  }) {
    return event('answer.recorded', {
      roundId,
      profileId,
      ordinal,
      wordId,
      revisionId,
      learningId,
      correct,
    }, {id, day, ...overrides});
  }

  function withEvents(...events) {
    const copy = structuredClone(base);
    copy.events.push(...structuredClone(events));
    return copy;
  }

  return {
    base: structuredClone(base),
    roundStarted: structuredClone(roundStarted),
    event,
    answer,
    withEvents,
  };
}
