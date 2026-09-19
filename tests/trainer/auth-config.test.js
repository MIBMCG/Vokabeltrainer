import test from 'node:test';
import assert from 'node:assert/strict';

import {selectGoogleConfig} from '../../src/trainer/auth-config.js';

test('prepared app configuration supplies the client ID for a fresh browser', () => {
  assert.deepEqual(selectGoogleConfig({
    configuredId: 'app.apps.googleusercontent.com', storedId: '', bound: false,
  }), {
    clientId: 'app.apps.googleusercontent.com', source: 'app', requiresDecision: false,
  });
});

test('a differing valid browser ID stays selected until an unbound user consciously switches', () => {
  assert.deepEqual(selectGoogleConfig({
    configuredId: 'new.apps.googleusercontent.com',
    storedId: 'old.apps.googleusercontent.com',
    bound: false,
  }), {
    clientId: 'old.apps.googleusercontent.com', source: 'browser', requiresDecision: true,
  });
});

test('a bound learning area retains its differing browser ID and requires a decision', () => {
  assert.deepEqual(selectGoogleConfig({
    configuredId: 'new.apps.googleusercontent.com',
    storedId: 'old.apps.googleusercontent.com',
    bound: true,
  }), {
    clientId: 'old.apps.googleusercontent.com', source: 'browser', requiresDecision: true,
  });
});

test('identical IDs use the stored browser choice without asking again', () => {
  assert.deepEqual(selectGoogleConfig({
    configuredId: ' same.apps.googleusercontent.com ',
    storedId: 'same.apps.googleusercontent.com',
    bound: true,
  }), {
    clientId: 'same.apps.googleusercontent.com', source: 'browser', requiresDecision: false,
  });
});

test('invalid and truncated IDs are never selected as fallbacks', () => {
  assert.deepEqual(selectGoogleConfig({
    configuredId: 'cut.apps.googleusercontent', storedId: 'synthetic-client-id', bound: false,
  }), {clientId: '', source: 'missing', requiresDecision: false});
  assert.deepEqual(selectGoogleConfig({
    configuredId: 'valid.apps.googleusercontent.com', storedId: 'https://valid.apps.googleusercontent.com', bound: false,
  }), {
    clientId: 'valid.apps.googleusercontent.com', source: 'app', requiresDecision: false,
  });
  assert.deepEqual(selectGoogleConfig({
    configuredId: '-.apps.googleusercontent.com', storedId: '', bound: false,
  }), {clientId: '', source: 'missing', requiresDecision: false});
});

test('empty values report missing configuration', () => {
  assert.deepEqual(selectGoogleConfig({configuredId: '', storedId: '', bound: false}), {
    clientId: '', source: 'missing', requiresDecision: false,
  });
});
