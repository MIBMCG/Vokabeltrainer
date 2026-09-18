export function syncStatusLabel(status) {
  if (status?.phase === 'synced' && status.pendingCount === 0 && status.conflictCount === 0) return 'Abgeglichen';
  if (status?.phase === 'connect') return 'Mit Google verbinden';
  if (status?.phase === 'pending') return 'Abgleich ausstehend';
  if (status?.phase === 'error' || status?.phase === 'conflict') return 'Abgleich fehlgeschlagen';
  return 'Auf diesem Gerät gespeichert';
}
