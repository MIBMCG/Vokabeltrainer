export function hasActiveGoogleSession(auth, fallback = false) {
  if (typeof auth?.getToken !== 'function') return fallback;
  try {
    auth.getToken();
    return true;
  } catch {
    return false;
  }
}

export function syncStatusLabel(status, connected = false) {
  if (status?.phase === 'synced' && status.pendingCount === 0 && status.conflictCount === 0) return 'Abgeglichen';
  if (status?.phase === 'connect') return connected ? 'Abgleich erneut versuchen' : 'Mit Google verbinden';
  if (status?.phase === 'checking') return 'Auf Änderungen prüfen …';
  if (status?.phase === 'syncing') return 'Abgleich läuft …';
  if (status?.phase === 'pending') return 'Abgleich ausstehend';
  if (status?.phase === 'error' || status?.phase === 'conflict') return 'Abgleich fehlgeschlagen';
  return 'Auf diesem Gerät gespeichert';
}

export function syncStatusMessage(status, connected = false) {
  if (status?.phase === 'connect' && connected) {
    return 'Google-Verbindung ist aktiv. Ein früherer Abgleich konnte nicht abgeschlossen werden. Bitte jetzt erneut abgleichen.';
  }
  return status?.message ?? '';
}
