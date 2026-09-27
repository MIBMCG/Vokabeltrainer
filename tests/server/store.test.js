import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import test from 'node:test';
import {createD1SessionStore} from '../../server/session-store.js';

function sqliteD1() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../../server/schema.sql', import.meta.url), 'utf8'));
  return {
    prepare(sql) {
      let args;
      const statement = db.prepare(sql);
      return {
        bind(...values) { args = values; return this; },
        async run() { return {meta: {changes: statement.run(...args).changes}}; },
        async first() { return statement.get(...args) ?? null; },
      };
    },
    close() { db.close(); },
  };
}

test('D1 state consume is single use and session CAS cannot resurrect logout', async () => {
  const db = sqliteD1();
  try {
    const store = createD1SessionStore(db);
    await store.putState('state-hash', {payload: 'encrypted-state', expiresAt: 123});
    assert.deepEqual({...await store.consumeState('state-hash')}, {payload: 'encrypted-state', expiresAt: 123});
    assert.equal(await store.consumeState('state-hash'), null);
    await store.createSession('session-hash', {payload: 'encrypted-token', expiresAt: 456});
    assert.deepEqual({...await store.readSession('session-hash')}, {payload: 'encrypted-token', expiresAt: 456, version: 1});
    assert.equal(await store.casSession('session-hash', 1, {payload: 'new-encrypted-token', expiresAt: 456}), true);
    assert.equal(await store.casSession('session-hash', 1, {payload: 'stale', expiresAt: 456}), false);
    await store.deleteSession('session-hash');
    assert.equal(await store.casSession('session-hash', 2, {payload: 'resurrected', expiresAt: 456}), false);
    assert.equal(await store.readSession('session-hash'), null);
  } finally { db.close(); }
});

test('versioned deletion cannot remove a newer refreshed session', async () => {
  const db = sqliteD1();
  try {
    const store = createD1SessionStore(db);
    await store.createSession('session-hash', {payload: 'old', expiresAt: 456});
    await store.casSession('session-hash', 1, {payload: 'new', expiresAt: 456});
    await store.deleteSession('session-hash', 1);
    assert.equal((await store.readSession('session-hash')).payload, 'new');
  } finally { db.close(); }
});
