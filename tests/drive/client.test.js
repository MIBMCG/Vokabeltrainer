import test from 'node:test';
import assert from 'node:assert/strict';

import {DriveError, createDriveClient} from '../../src/drive/client.js';

const jsonMetadata = (overrides = {}) => ({
  id: 'file-a',
  name: 'a.json',
  mimeType: 'application/json',
  parents: ['folder-a'],
  appProperties: {kind: 'probe', dataset: 'set-a'},
  trashed: false,
  ...overrides,
});

function expectDriveError(code, status) {
  return (error) => {
    assert.ok(error instanceof DriveError);
    assert.equal(error.code, code);
    assert.equal(error.status, status);
    return true;
  };
}

test('binds the account through permissionId without requesting an email address', async () => {
  const requests = [];
  const client = createDriveClient({
    getToken: () => 'token-a',
    fetchImpl: async (url, init) => {
      requests.push({url: String(url), init});
      return Response.json({user: {permissionId: 'permission-123'}});
    },
  });

  assert.equal(await client.accountId(), 'permission-123');
  assert.equal(requests.length, 1);
  const requestUrl = new URL(requests[0].url);
  assert.equal(requestUrl.origin, 'https://www.googleapis.com');
  assert.equal(requestUrl.pathname, '/drive/v3/about');
  assert.equal(requestUrl.searchParams.get('fields'), 'user(permissionId)');
  assert.equal(requestUrl.searchParams.has('emailAddress'), false);
  assert.equal(requests[0].init.headers.Authorization, 'Bearer token-a');
});

test('rejects a malformed account response instead of binding the wrong identifier', async () => {
  const client = createDriveClient({
    getToken: () => 'token-a',
    fetchImpl: async () => Response.json({user: {displayName: 'Synthetic Parent'}}),
  });

  await assert.rejects(client.accountId(), expectDriveError('invalid'));
});

test('maps an unauthorized response to a safe auth error', async () => {
  const client = createDriveClient({
    getToken: () => 'super-secret-token',
    fetchImpl: async () => new Response('upstream secret details', {status: 401}),
  });

  await assert.rejects(client.accountId(), (error) => {
    expectDriveError('auth', 401)(error);
    assert.doesNotMatch(error.message, /secret|token/i);
    return true;
  });
});

test('preallocates one Drive file ID and validates the response', async () => {
  const urls = [];
  const client = createDriveClient({
    getToken: () => 'token-a',
    fetchImpl: async (url) => {
      urls.push(new URL(url));
      return Response.json({ids: ['generated_123']});
    },
  });

  assert.equal(await client.generateId(), 'generated_123');
  assert.equal(urls[0].pathname, '/drive/v3/files/generateIds');
  assert.equal(urls[0].searchParams.get('count'), '1');
  assert.equal(urls[0].searchParams.get('space'), 'drive');
  assert.equal(urls[0].searchParams.get('type'), 'files');
});

test('rejects malformed generated IDs', async () => {
  const client = createDriveClient({
    getToken: () => 'token-a',
    fetchImpl: async () => Response.json({ids: ['bad/id']}),
  });

  await assert.rejects(client.generateId(), expectDriveError('invalid'));
});

test('collects every search page and obtains a fresh token for every request', async () => {
  const requests = [];
  let tokenNumber = 0;
  const first = jsonMetadata({id: 'file-1', name: 'one.json'});
  const second = jsonMetadata({id: 'file-2', name: 'two.json'});
  const client = createDriveClient({
    getToken: () => `token-${++tokenNumber}`,
    fetchImpl: async (url, init) => {
      const parsed = new URL(url);
      requests.push({parsed, init});
      if (!parsed.searchParams.has('pageToken')) {
        return Response.json({files: [first], nextPageToken: 'next page', incompleteSearch: false});
      }
      return Response.json({files: [second], incompleteSearch: false});
    },
  });

  assert.deepEqual(await client.listFiles("appProperties has { key='vtProbe' and value='1' }"), [first, second]);
  assert.equal(requests.length, 2);
  assert.equal(requests[0].parsed.searchParams.get('q'), "appProperties has { key='vtProbe' and value='1' }");
  assert.equal(requests[1].parsed.searchParams.get('pageToken'), 'next page');
  assert.equal(requests[0].init.headers.Authorization, 'Bearer token-1');
  assert.equal(requests[1].init.headers.Authorization, 'Bearer token-2');
});

test('rejects incomplete or malformed search pages instead of returning partial data', async () => {
  const incomplete = createDriveClient({
    getToken: () => 'token-a',
    fetchImpl: async () => Response.json({files: [], incompleteSearch: true}),
  });
  const malformed = createDriveClient({
    getToken: () => 'token-a',
    fetchImpl: async () => Response.json({files: 'not-an-array', incompleteSearch: false}),
  });

  await assert.rejects(incomplete.listFiles('trashed = false'), expectDriveError('invalid'));
  await assert.rejects(malformed.listFiles('trashed = false'), expectDriveError('invalid'));
});

test('rejects a repeated page token before issuing an unbounded follow-up request', async () => {
  let requestCount = 0;
  const client = createDriveClient({
    getToken: () => 'token-a',
    fetchImpl: async () => {
      requestCount += 1;
      if (requestCount > 2) throw new Error('pagination did not stop');
      return Response.json({
        files: [],
        nextPageToken: 'repeated-token',
        incompleteSearch: false,
      });
    },
  });

  await assert.rejects(client.listFiles('trashed = false'), expectDriveError('invalid'));
  assert.equal(requestCount, 2);
});

test('encodes valid IDs and rejects unsafe IDs before making a request', async () => {
  let calls = 0;
  const client = createDriveClient({
    getToken: () => 'token-a',
    fetchImpl: async () => {
      calls += 1;
      return Response.json(jsonMetadata());
    },
  });

  await assert.rejects(client.metadata('../file-a'), expectDriveError('invalid'));
  assert.equal(calls, 0);
  assert.equal((await client.metadata('file_a-123')).id, 'file-a');
  assert.equal(calls, 1);
});

test('rejects malformed metadata and malformed JSON content', async () => {
  let responseNumber = 0;
  const client = createDriveClient({
    getToken: () => 'token-a',
    fetchImpl: async () => {
      responseNumber += 1;
      return responseNumber === 1
        ? Response.json({id: 'file-a', name: 'a.json'})
        : new Response('{broken', {headers: {'content-type': 'application/json'}});
    },
  });

  await assert.rejects(client.metadata('file-a'), expectDriveError('invalid'));
  await assert.rejects(client.readJson('file-a'), expectDriveError('invalid'));
});

test('creates a folder with the supplied ID and verifies its stored metadata', async () => {
  const requests = [];
  const stored = {
    id: 'folder-a',
    name: 'Vocabulary Probe',
    mimeType: 'application/vnd.google-apps.folder',
    parents: [],
    appProperties: {vtProbe: '1'},
    trashed: false,
  };
  const client = createDriveClient({
    getToken: () => 'token-a',
    fetchImpl: async (url, init) => {
      requests.push({url: new URL(url), init});
      return init.method === 'POST'
        ? Response.json({id: 'unverified-post-response'})
        : Response.json(stored);
    },
  });

  assert.deepEqual(await client.createFolder({
    id: 'folder-a',
    name: 'Vocabulary Probe',
    appProperties: {vtProbe: '1'},
  }), stored);
  assert.equal(requests.length, 2);
  assert.equal(requests[0].url.pathname, '/drive/v3/files');
  assert.equal(requests[0].init.method, 'POST');
  assert.deepEqual(JSON.parse(requests[0].init.body), {
    id: 'folder-a',
    name: 'Vocabulary Probe',
    mimeType: 'application/vnd.google-apps.folder',
    appProperties: {vtProbe: '1'},
  });
  assert.equal(requests[1].url.pathname, '/drive/v3/files/folder-a');
  assert.equal(requests.filter(({url, init}) => (
    init.method === 'GET' && url.pathname === '/drive/v3/files/folder-a'
  )).length, 1);
});

test('a folder conflict verifies the existing supplied ID without creating a duplicate', async () => {
  let postCount = 0;
  const stored = {
    id: 'folder-a',
    name: 'Vocabulary Probe',
    mimeType: 'application/vnd.google-apps.folder',
    parents: [],
    appProperties: {vtProbe: '1'},
    trashed: false,
  };
  const client = createDriveClient({
    getToken: () => 'token-a',
    fetchImpl: async (_url, init) => {
      if (init.method === 'POST') {
        postCount += 1;
        return new Response('', {status: 409});
      }
      return Response.json(stored);
    },
  });

  assert.equal((await client.createFolder({
    id: 'folder-a',
    name: 'Vocabulary Probe',
    appProperties: {vtProbe: '1'},
  })).id, 'folder-a');
  assert.equal(postCount, 1);
});

test('rejects a conflicting folder whose immutable metadata differs', async () => {
  const client = createDriveClient({
    getToken: () => 'token-a',
    fetchImpl: async (_url, init) => init.method === 'POST'
      ? new Response('', {status: 409})
      : Response.json({
          id: 'folder-a',
          name: 'Other folder',
          mimeType: 'application/vnd.google-apps.folder',
          parents: [],
          appProperties: {vtProbe: '1'},
          trashed: false,
        }),
  });

  await assert.rejects(client.createFolder({
    id: 'folder-a',
    name: 'Vocabulary Probe',
    appProperties: {vtProbe: '1'},
  }), expectDriveError('conflict'));
});

test('uploads JSON once with its supplied ID then verifies metadata and logical content', async () => {
  const uploaded = {correct: true, id: 'evt-a', nested: {b: 2, a: 1}};
  const requests = [];
  const client = createDriveClient({
    getToken: () => 'token-a',
    fetchImpl: async (url, init) => {
      const parsed = new URL(url);
      requests.push({parsed, init});
      if (parsed.origin === 'https://www.googleapis.com' && parsed.pathname.startsWith('/upload/')) {
        return Response.json({id: 'unverified-upload-response'});
      }
      if (parsed.searchParams.get('alt') === 'media') {
        return Response.json({nested: {a: 1, b: 2}, id: 'evt-a', correct: true});
      }
      return Response.json(jsonMetadata());
    },
  });

  assert.deepEqual(await client.putJson({
    id: 'file-a',
    name: 'a.json',
    parentId: 'folder-a',
    appProperties: {dataset: 'set-a', kind: 'probe'},
    value: uploaded,
  }), jsonMetadata());
  const upload = requests.find(({parsed}) => parsed.pathname.startsWith('/upload/'));
  assert.equal(upload.parsed.origin, 'https://www.googleapis.com');
  assert.equal(upload.parsed.pathname, '/upload/drive/v3/files');
  assert.equal(upload.parsed.searchParams.get('uploadType'), 'multipart');
  assert.match(upload.init.headers['Content-Type'], /^multipart\/related; boundary=/);
  assert.match(upload.init.body, /"id":"file-a"/);
  assert.match(upload.init.body, /"parents":\["folder-a"\]/);
  assert.match(upload.init.body, /"mimeType":"application\/json"/);
  assert.equal(requests.filter(({parsed}) => parsed.pathname.startsWith('/upload/')).length, 1);
  assert.equal(requests.filter(({parsed, init}) => (
    init.method === 'GET'
      && parsed.pathname === '/drive/v3/files/file-a'
      && !parsed.searchParams.has('alt')
  )).length, 1);
  assert.equal(requests.filter(({parsed}) => parsed.searchParams.get('alt') === 'media').length, 1);
});

test('an ambiguous JSON upload verifies the same ID and never uploads a duplicate', async () => {
  const uploaded = {id: 'evt-a', correct: true};
  const seen = [];
  const client = createDriveClient({
    getToken: () => 'token-a',
    fetchImpl: async (url, init) => {
      const parsed = new URL(url);
      seen.push([parsed, init.method]);
      if (parsed.pathname.startsWith('/upload/')) return new Response('', {status: 409});
      if (parsed.searchParams.get('alt') === 'media') return Response.json(uploaded);
      return Response.json(jsonMetadata({appProperties: {kind: 'probe'}}));
    },
  });

  const result = await client.putJson({
    id: 'file-a',
    name: 'a.json',
    parentId: 'folder-a',
    appProperties: {kind: 'probe'},
    value: uploaded,
  });
  assert.equal(result.id, 'file-a');
  assert.equal(seen.filter(([url]) => url.pathname.startsWith('/upload/')).length, 1);
});

test('rejects the same ID when content, parent, or app properties differ', async (t) => {
  const cases = [
    {
      name: 'content',
      metadata: jsonMetadata(),
      remoteValue: {id: 'evt-a', correct: false},
    },
    {
      name: 'parent',
      metadata: jsonMetadata({parents: ['folder-b']}),
      remoteValue: {id: 'evt-a', correct: true},
    },
    {
      name: 'properties',
      metadata: jsonMetadata({appProperties: {kind: 'other', dataset: 'set-a'}}),
      remoteValue: {id: 'evt-a', correct: true},
    },
  ];

  for (const fixture of cases) {
    await t.test(fixture.name, async () => {
      const client = createDriveClient({
        getToken: () => 'token-a',
        fetchImpl: async (url) => {
          const parsed = new URL(url);
          if (parsed.pathname.startsWith('/upload/')) return new Response('', {status: 409});
          if (parsed.searchParams.get('alt') === 'media') return Response.json(fixture.remoteValue);
          return Response.json(fixture.metadata);
        },
      });

      await assert.rejects(client.putJson({
        id: 'file-a',
        name: 'a.json',
        parentId: 'folder-a',
        appProperties: {kind: 'probe', dataset: 'set-a'},
        value: {id: 'evt-a', correct: true},
      }), expectDriveError('conflict'));
    });
  }
});

test('does not retry indefinitely after a retryable response or network failure', async () => {
  let retryableCalls = 0;
  const retryable = createDriveClient({
    getToken: () => 'token-a',
    fetchImpl: async () => {
      retryableCalls += 1;
      return new Response('temporary details', {status: 503});
    },
  });
  await assert.rejects(retryable.generateId(), expectDriveError('retryable', 503));
  assert.equal(retryableCalls, 1);

  let networkCalls = 0;
  const network = createDriveClient({
    getToken: () => 'token-a',
    fetchImpl: async () => {
      networkCalls += 1;
      throw new TypeError('network down with internal details');
    },
  });
  await assert.rejects(network.generateId(), (error) => {
    expectDriveError('network')(error);
    assert.doesNotMatch(error.message, /internal details/);
    return true;
  });
  assert.equal(networkCalls, 1);
});
