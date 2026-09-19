function validId(value) {
  return typeof value === 'string'
    && /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.apps\.googleusercontent\.com$/u.test(value.trim());
}

export function selectGoogleConfig({configuredId, storedId, bound} = {}) {
  const stored = validId(storedId) ? storedId.trim() : '';
  const configured = validId(configuredId) ? configuredId.trim() : '';
  return {
    clientId: stored || configured,
    source: stored ? 'browser' : configured ? 'app' : 'missing',
    requiresDecision: Boolean(stored && configured && stored !== configured),
  };
}
