function updateError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

const ACTIVATION_TIMEOUT_MS = 10_000;
let requestSequence = 0;

function nextRequestId() {
  requestSequence += 1;
  return `update-${Date.now()}-${requestSequence}`;
}

export function createUpdateController({
  registration,
  hasActiveRound,
  pauseAndSave,
  reload,
  onAvailable,
  onUnavailable = () => {},
}) {
  const serviceWorker = globalThis.navigator?.serviceWorker;
  let destroyed = false;
  let installing = null;
  let watchedWaiting = null;
  let pendingActivation = null;
  let lockedRelease = null;

  const releaseBoundary = (release) => {
    if (lockedRelease === release) lockedRelease = null;
    release?.();
  };

  const rejectPending = (error) => {
    const pending = pendingActivation;
    if (!pending) return;
    pendingActivation = null;
    clearTimeout(pending.timeout);
    releaseBoundary(pending.release);
    pending.reject(error);
  };

  const onWaitingStateChange = () => {
    setTimeout(reportAvailability, 0);
  };
  const watchWaiting = () => {
    const waiting = registration.waiting;
    if (watchedWaiting === waiting) return;
    watchedWaiting?.removeEventListener('statechange', onWaitingStateChange);
    watchedWaiting = waiting && waiting !== installing ? waiting : null;
    watchedWaiting?.addEventListener('statechange', onWaitingStateChange);
  };
  const reportAvailability = () => {
    if (destroyed) return;
    watchWaiting();
    if (registration.waiting) onAvailable();
    else onUnavailable();
  };
  const onStateChange = () => {
    if (['installed', 'activating', 'activated', 'redundant'].includes(installing?.state)) {
      setTimeout(reportAvailability, 0);
    }
  };
  const onUpdateFound = () => {
    installing?.removeEventListener('statechange', onStateChange);
    installing = registration.installing;
    installing?.addEventListener('statechange', onStateChange);
    onStateChange();
  };
  const onControllerChange = () => {
    reportAvailability();
    const pending = pendingActivation;
    if (destroyed || !pending) return;
    pendingActivation = null;
    clearTimeout(pending.timeout);
    pending.resolve();
    reload();
  };
  const onMessage = (event) => {
    const pending = pendingActivation;
    if (!pending || event.source !== pending.activeWorker) return;
    if (event.data?.requestId !== pending.requestId) return;
    if (event.data.type === 'UPDATE_ACTIVATION_REJECTED') {
      rejectPending(updateError('not-ready', 'Die neue Programmversion konnte nicht sicher aktiviert werden. Bitte erneut versuchen.'));
    }
  };

  registration.addEventListener('updatefound', onUpdateFound);
  serviceWorker?.addEventListener('controllerchange', onControllerChange);
  serviceWorker?.addEventListener('message', onMessage);

  return {
    async check() {
      await registration.update();
      reportAvailability();
    },
    async activate({pauseConfirmed = false} = {}) {
      if (pendingActivation || lockedRelease) {
        throw updateError('not-ready', 'Die Aktualisierung läuft bereits.');
      }
      const worker = registration.waiting;
      const activeWorker = registration.active;
      if (!worker) {
        reportAvailability();
        throw updateError('not-ready', 'Es wartet noch keine neue Programmversion.');
      }
      if (!serviceWorker?.controller || !activeWorker || serviceWorker.controller !== activeWorker) {
        throw updateError('not-ready', 'Die geöffnete App wird noch nicht vom Programmcache gesteuert.');
      }
      if (hasActiveRound()) {
        if (!pauseConfirmed) {
          throw updateError('not-ready', 'Die laufende Runde muss zuerst ausdrücklich pausiert werden.');
        }
      }
      const boundaryRelease = await pauseAndSave();
      const release = typeof boundaryRelease === 'function' ? boundaryRelease : () => {};
      lockedRelease = release;
      if (registration.waiting !== worker || registration.active !== activeWorker
        || serviceWorker.controller !== activeWorker) {
        releaseBoundary(release);
        throw updateError('not-ready', 'Der Aktualisierungsstand hat sich geändert. Bitte erneut versuchen.');
      }

      const requestId = nextRequestId();
      const completion = new Promise((resolve, reject) => {
        pendingActivation = {
          requestId,
          activeWorker,
          release,
          resolve,
          reject,
          timeout: setTimeout(() => {
            rejectPending(updateError(
              'not-ready',
              'Die Aktualisierung hat nicht rechtzeitig geantwortet. Bitte offene Eingaben sichern und die App neu öffnen.',
            ));
          }, ACTIVATION_TIMEOUT_MS),
        };
      });
      try {
        activeWorker.postMessage({type: 'REQUEST_UPDATE_ACTIVATION', requestId});
      } catch (error) {
        rejectPending(error);
      }
      await completion;
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      rejectPending(updateError('not-ready', 'Die Aktualisierung wurde beendet.'));
      releaseBoundary(lockedRelease);
      registration.removeEventListener('updatefound', onUpdateFound);
      installing?.removeEventListener('statechange', onStateChange);
      watchedWaiting?.removeEventListener('statechange', onWaitingStateChange);
      serviceWorker?.removeEventListener('controllerchange', onControllerChange);
      serviceWorker?.removeEventListener('message', onMessage);
    },
  };
}
