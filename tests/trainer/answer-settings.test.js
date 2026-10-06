import test from 'node:test';
import assert from 'node:assert/strict';
import * as storageModule from '../../src/trainer/storage/store.js';

function settings(storage) {
  assert.equal(typeof storageModule.createAnswerSettings, 'function');
  return storageModule.createAnswerSettings(storage);
}

test('device answer settings default to strict and persist both choices across new instances', () => {
  const values = new Map();
  const storage = {getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value)};
  const first = settings(storage);
  assert.equal(first.get(), true);
  first.set(false);
  const reloaded = settings(storage);
  assert.equal(reloaded.get(), false);
  reloaded.set(true);
  assert.equal(first.get(), true);
  assert.equal(values.size, 1);
});

test('unknown saved punctuation values do not silently disable strict answers', () => {
  for (const value of [null, '', '0', 'null', 'FALSE', '{}']) {
    assert.equal(settings({getItem: () => value}).get(), true);
  }
});

test('failed local setting writes are reported and preserve the previous choice', () => {
  const local = settings({getItem: () => 'false', setItem: () => { throw new Error('quota'); }});
  assert.throws(() => local.set(true), {code: 'storage'});
  assert.equal(local.get(), false);
  assert.throws(() => local.set('false'), {code: 'invalid'});
});

test('unreadable device settings block assessment rather than choosing another rule', () => {
  const local = settings({getItem: () => { throw new Error('blocked'); }});
  assert.throws(() => local.get(), {code: 'storage'});
});
