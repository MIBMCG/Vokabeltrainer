function transient(error) {
  return error?.code === 'network' || error?.code === 'retryable';
}

export function createLocalChangeNotifier({scheduler, initialState}) {
  let previousOutbox = new Set(initialState?.outboxEventIds ?? []);
  return (state) => {
    const outbox = new Set(state?.outboxEventIds ?? []);
    const added = new Set([...outbox].filter((eventId) => !previousOutbox.has(eventId)));
    previousOutbox = outbox;
    if (added.size === 0) return;
    const addedEvents = state.ledger.events.filter(({id}) => added.has(id));
    if (addedEvents.some(({type}) => type === 'round.completed')) {
      scheduler.roundCompleted();
    } else {
      scheduler.changed({immediate: addedEvents.some(({type, payload}) => type === 'entity.revised'
        && (payload?.entityType === 'word' || payload?.entityType === 'lesson'))});
    }
  };
}

export function createSyncScheduler({
  sync,
  hasChanges,
  setTimer = globalThis.setTimeout,
  clearTimer = globalThis.clearTimeout,
  now,
} = {}) {
  if (typeof sync !== 'function' || typeof hasChanges !== 'function'
    || typeof setTimer !== 'function' || typeof clearTimer !== 'function'
    || typeof now !== 'function') {
    throw new TypeError('Der Abgleich-Zeitplan ist unvollständig.');
  }

  const retryDelays = [1_000, 2_000, 4_000, 8_000, 16_000];
  let started = false;
  let visible = true;
  let onlineState = true;
  let running = false;
  let queued = false;
  let timerId = null;
  let timerDue = null;
  let retryIndex = 0;

  function cancelTimer() {
    if (timerId !== null) clearTimer(timerId);
    timerId = null;
    timerDue = null;
  }

  function schedule(delay, mode) {
    if (!started || !visible || !onlineState) return;
    const due = Number(now()) + delay;
    if (timerId !== null && timerDue <= due) return;
    cancelTimer();
    timerDue = due;
    timerId = setTimer(() => {
      timerId = null;
      timerDue = null;
      void run(mode);
    }, delay);
  }

  async function run(mode = 'normal') {
    if (!started || !visible || !onlineState) return;
    if (running) {
      queued = true;
      return;
    }
    cancelTimer();
    running = true;
    try {
      await sync();
      retryIndex = 0;
      if (queued) {
        queued = false;
        running = false;
        await run();
        return;
      }
      schedule(hasChanges() ? 10_000 : 60_000, 'normal');
    } catch (error) {
      if (transient(error) && retryIndex < retryDelays.length) {
        const delay = retryDelays[retryIndex];
        retryIndex += 1;
        schedule(delay, 'retry');
      }
    } finally {
      running = false;
    }
  }

  function trigger() {
    if (!started || !visible || !onlineState) return;
    void run();
  }

  return {
    start() {
      if (started) return;
      started = true;
      trigger();
    },
    changed({immediate = false} = {}) {
      if (!started || !visible || !onlineState) return;
      retryIndex = 0;
      if (immediate) trigger();
      else schedule(10_000, 'change');
    },
    roundCompleted() {
      retryIndex = 0;
      trigger();
    },
    visibility(nextVisible) {
      visible = Boolean(nextVisible);
      if (!visible) cancelTimer();
      else {
        retryIndex = 0;
        trigger();
      }
    },
    online() {
      onlineState = true;
      retryIndex = 0;
      trigger();
    },
    stop() {
      started = false;
      queued = false;
      cancelTimer();
    },
  };
}
