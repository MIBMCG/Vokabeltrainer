import test from 'node:test';
import assert from 'node:assert/strict';

import {DRIVE_SCOPE, DriveError, createTokenSession} from '../../src/drive/auth.js';

function oauthFixture() {
  let config;
  let requestCount = 0;
  const revoked = [];
  const oauth2 = {
    initTokenClient(value) {
      config = value;
      return {
        requestAccessToken() {
          requestCount += 1;
        },
      };
    },
    revoke(token, callback) {
      revoked.push(token);
      callback?.();
    },
  };
  return {
    oauth2,
    config: () => config,
    requestCount: () => requestCount,
    revoked,
  };
}

function expectDriveError(code) {
  return (error) => {
    assert.ok(error instanceof DriveError);
    assert.equal(error.code, code);
    return true;
  };
}

test('configures GIS for only drive.file and starts the popup synchronously', async () => {
  const fixture = oauthFixture();
  const session = createTokenSession({oauth2: fixture.oauth2, clientId: 'client-id.apps.googleusercontent.com'});
  let sameStack = true;
  const connection = session.connect();
  assert.equal(fixture.requestCount(), 1);
  assert.equal(sameStack, true);
  sameStack = false;
  assert.equal(fixture.config().client_id, 'client-id.apps.googleusercontent.com');
  assert.equal(fixture.config().scope, DRIVE_SCOPE);
  assert.equal(fixture.config().include_granted_scopes, false);

  fixture.config().callback({
    access_token: 'access-a',
    expires_in: 3600,
    scope: DRIVE_SCOPE,
  });
  await connection;
  assert.equal(session.getToken(), 'access-a');
});

test('rejects an empty client ID before initializing GIS', () => {
  const fixture = oauthFixture();
  assert.throws(
    () => createTokenSession({oauth2: fixture.oauth2, clientId: '   '}),
    expectDriveError('invalid'),
  );
  assert.equal(fixture.config(), undefined);
});

test('expires the RAM token with a safety margin and requires reconnection', async () => {
  let currentTime = 1_000;
  const fixture = oauthFixture();
  const session = createTokenSession({
    oauth2: fixture.oauth2,
    clientId: 'client-id.apps.googleusercontent.com',
    now: () => currentTime,
  });
  const connection = session.connect();
  fixture.config().callback({access_token: 'access-a', expires_in: 120, scope: DRIVE_SCOPE});
  await connection;

  currentTime = 90_999;
  assert.equal(session.getToken(), 'access-a');
  currentTime = 91_000;
  assert.throws(() => session.getToken(), expectDriveError('auth'));
});

test('rejects missing scope, token, or expiry from GIS', async (t) => {
  const cases = [
    {name: 'scope', response: {access_token: 'access-a', expires_in: 3600}, code: 'permission'},
    {name: 'token', response: {expires_in: 3600, scope: DRIVE_SCOPE}, code: 'invalid'},
    {name: 'expiry', response: {access_token: 'access-a', scope: DRIVE_SCOPE}, code: 'invalid'},
  ];

  for (const fixtureCase of cases) {
    await t.test(fixtureCase.name, async () => {
      const fixture = oauthFixture();
      const session = createTokenSession({oauth2: fixture.oauth2, clientId: 'client-id.apps.googleusercontent.com'});
      const connection = session.connect();
      fixture.config().callback(fixtureCase.response);
      await assert.rejects(connection, expectDriveError(fixtureCase.code));
      assert.throws(() => session.getToken(), expectDriveError('auth'));
    });
  }
});

test('maps denied and popup errors to bounded auth errors', async (t) => {
  for (const errorCode of ['access_denied', 'popup_closed', 'popup_failed_to_open']) {
    await t.test(errorCode, async () => {
      const fixture = oauthFixture();
      const session = createTokenSession({oauth2: fixture.oauth2, clientId: 'client-id.apps.googleusercontent.com'});
      const connection = session.connect();
      fixture.config().callback({error: errorCode, error_description: 'private upstream details'});
      await assert.rejects(connection, (error) => {
        expectDriveError('auth')(error);
        assert.doesNotMatch(error.message, /private upstream details/);
        return true;
      });
    });
  }
});

test('handles popup failures delivered through the GIS error callback', async () => {
  const fixture = oauthFixture();
  const session = createTokenSession({oauth2: fixture.oauth2, clientId: 'client-id.apps.googleusercontent.com'});
  const connection = session.connect();

  fixture.config().error_callback({type: 'popup_failed_to_open'});

  await assert.rejects(connection, expectDriveError('auth'));
  assert.throws(() => session.getToken(), expectDriveError('auth'));
});

test('blocks a second connect while the first popup is pending', async () => {
  const fixture = oauthFixture();
  const session = createTokenSession({oauth2: fixture.oauth2, clientId: 'client-id.apps.googleusercontent.com'});
  const first = session.connect();
  await assert.rejects(session.connect(), expectDriveError('conflict'));
  assert.equal(fixture.requestCount(), 1);
  fixture.config().callback({access_token: 'access-a', expires_in: 3600, scope: DRIVE_SCOPE});
  await first;
});

test('disconnect clears and revokes the token while ignoring a late callback', async () => {
  const fixture = oauthFixture();
  const session = createTokenSession({oauth2: fixture.oauth2, clientId: 'client-id.apps.googleusercontent.com'});
  const first = session.connect();
  session.disconnect();
  await assert.rejects(first, expectDriveError('auth'));
  fixture.config().callback({access_token: 'late-access', expires_in: 3600, scope: DRIVE_SCOPE});
  assert.throws(() => session.getToken(), expectDriveError('auth'));
  assert.deepEqual(fixture.revoked, []);

  const second = session.connect();
  fixture.config().callback({access_token: 'current-access', expires_in: 3600, scope: DRIVE_SCOPE});
  await second;
  session.disconnect();
  assert.deepEqual(fixture.revoked, ['current-access']);
  assert.throws(() => session.getToken(), expectDriveError('auth'));
});
