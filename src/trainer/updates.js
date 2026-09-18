function updateError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

export function createUpdateController({
  registration,
  hasActiveRound,
  pauseAndSave,
  reload,
  onAvailable,
}) {
  const serviceWorker = globalThis.navigator?.serviceWorker;
  let destroyed = false;
  let activationRequested = false;
  let installing = null;

  const reportWaiting = () => {
    if (!destroyed && registration.waiting) onAvailable();
  };
  const onStateChange = () => {
    if (installing?.state === 'installed') setTimeout(reportWaiting, 0);
  };
  const onUpdateFound = () => {
    installing?.removeEventListener('statechange', onStateChange);
    installing = registration.installing;
    installing?.addEventListener('statechange', onStateChange);
  };
  const onControllerChange = () => {
    if (!destroyed && activationRequested) {
      activationRequested = false;
      reload();
    }
  };

  registration.addEventListener('updatefound', onUpdateFound);
  serviceWorker?.addEventListener('controllerchange', onControllerChange);

  return {
    async check() {
      await registration.update();
      reportWaiting();
    },
    async activate({pauseConfirmed = false} = {}) {
      const worker = registration.waiting;
      if (!worker) throw updateError('not-ready', 'Es wartet noch keine neue Programmversion.');
      if (!serviceWorker?.controller || (registration.active && serviceWorker.controller !== registration.active)) {
        throw updateError('not-ready', 'Die geöffnete App wird noch nicht vom Programmcache gesteuert.');
      }
      if (hasActiveRound()) {
        if (!pauseConfirmed) {
          throw updateError('not-ready', 'Die laufende Runde muss zuerst ausdrücklich pausiert werden.');
        }
      }
      await pauseAndSave();
      activationRequested = true;
      worker.postMessage({type: 'ACTIVATE_UPDATE'});
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      activationRequested = false;
      registration.removeEventListener('updatefound', onUpdateFound);
      installing?.removeEventListener('statechange', onStateChange);
      serviceWorker?.removeEventListener('controllerchange', onControllerChange);
    },
  };
}
