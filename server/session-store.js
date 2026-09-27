// Every mutation that can race with logout is conditional at the database boundary.
export function createD1SessionStore(db) {
  if (!db?.prepare) throw new Error('D1 binding is required');
  return {
    async putState(id, record) {
      await db.prepare('INSERT INTO oauth_states (id_hash, encrypted_payload, expires_at) VALUES (?, ?, ?)')
        .bind(id, record.payload, record.expiresAt).run();
    },
    async consumeState(id) {
      const row = await db.prepare('DELETE FROM oauth_states WHERE id_hash = ? RETURNING encrypted_payload AS payload, expires_at AS expiresAt')
        .bind(id).first();
      return row ?? null;
    },
    async createSession(id, record) {
      await db.prepare('INSERT INTO sessions (id_hash, encrypted_payload, expires_at, version) VALUES (?, ?, ?, 1)')
        .bind(id, record.payload, record.expiresAt).run();
    },
    async readSession(id) {
      return await db.prepare('SELECT encrypted_payload AS payload, expires_at AS expiresAt, version FROM sessions WHERE id_hash = ?')
        .bind(id).first() ?? null;
    },
    async casSession(id, version, record) {
      const result = await db.prepare('UPDATE sessions SET encrypted_payload = ?, expires_at = ?, version = version + 1 WHERE id_hash = ? AND version = ?')
        .bind(record.payload, record.expiresAt, id, version).run();
      return result.meta.changes === 1;
    },
    async deleteSession(id, version) {
      if (version === undefined) {
        await db.prepare('DELETE FROM sessions WHERE id_hash = ?').bind(id).run();
      } else {
        await db.prepare('DELETE FROM sessions WHERE id_hash = ? AND version = ?').bind(id, version).run();
      }
    },
  };
}
