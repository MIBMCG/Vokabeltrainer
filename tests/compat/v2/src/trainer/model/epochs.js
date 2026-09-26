function compareAscii(left, right) {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function compareOrdered(left, right) {
  if (left.clock !== right.clock) return left.clock - right.clock;
  const deviceOrder = compareAscii(left.deviceId, right.deviceId);
  return deviceOrder || compareAscii(left.id, right.id);
}

function sortedEvents(ids, eventsById) {
  return [...ids]
    .map((id) => eventsById.get(id))
    .filter(Boolean)
    .sort(compareOrdered)
    .map((event) => structuredClone(event));
}

export function resolveEpochs(ledger) {
  const parents = new Set(ledger.epochs.flatMap((epoch) => epoch.parents));
  const headEpochs = ledger.epochs.filter((epoch) => !parents.has(epoch.id)).sort(compareOrdered);
  const heads = headEpochs.map(({id}) => id);
  const epochConflict = heads.length !== 1;
  const eventsById = new Map(ledger.events.map((event) => [event.id, event]));

  if (epochConflict) {
    return {
      activeEpochId: null,
      heads,
      epochConflict,
      effectiveEvents: [],
      supportEvents: [],
      lateEvents: sortedEvents(new Set(eventsById.keys()), eventsById),
    };
  }

  const activeEpoch = headEpochs[0];
  const isRoot = activeEpoch.id === ledger.descriptor.rootEpochId;
  const snapshot = activeEpoch.snapshotId === null
    ? null
    : ledger.snapshots.find(({id}) => id === activeEpoch.snapshotId);
  if ((!isRoot && !snapshot) || (isRoot && activeEpoch.snapshotId !== null && !snapshot)) {
    return {
      activeEpochId: null,
      heads,
      epochConflict: false,
      effectiveEvents: [],
      supportEvents: [],
      lateEvents: sortedEvents(new Set(eventsById.keys()), eventsById),
    };
  }

  const effectiveIds = new Set(snapshot?.effectiveEventIds ?? []);
  const supportIds = new Set(snapshot?.supportEventIds ?? []);
  for (const event of ledger.events) {
    if (event.epochId === activeEpoch.id) effectiveIds.add(event.id);
  }

  const processedAdoptions = new Set();
  let foundAdoption = true;
  while (foundAdoption) {
    foundAdoption = false;
    for (const id of effectiveIds) {
      const event = eventsById.get(id);
      if (!event || event.type !== 'events.adopted' || processedAdoptions.has(id)) continue;
      processedAdoptions.add(id);
      foundAdoption = true;
      for (const adoptedId of event.payload.eventIds) effectiveIds.add(adoptedId);
      for (const supportId of event.payload.supportEventIds) supportIds.add(supportId);
    }
  }

  for (const id of effectiveIds) supportIds.delete(id);
  const lateIds = new Set(
    [...eventsById.keys()].filter((id) => !effectiveIds.has(id) && !supportIds.has(id)),
  );
  return {
    activeEpochId: activeEpoch.id,
    heads,
    epochConflict: false,
    effectiveEvents: sortedEvents(effectiveIds, eventsById),
    supportEvents: sortedEvents(supportIds, eventsById),
    lateEvents: sortedEvents(lateIds, eventsById),
  };
}
