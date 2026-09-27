CREATE TABLE IF NOT EXISTS oauth_states (
  id_hash TEXT PRIMARY KEY,
  encrypted_payload TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id_hash TEXT PRIMARY KEY,
  encrypted_payload TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS oauth_states_expiry ON oauth_states(expires_at);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
