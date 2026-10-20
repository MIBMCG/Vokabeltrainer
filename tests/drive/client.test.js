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
  version: '7',
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

test('server-bound account lookup uses the captured session marker without Google about', async () => {
  const markers = [];
  const client = createDriveClient({
    getToken: () => 'server-session:1:account-a',
    getAccountId: (marker) => { markers.push(marker); return 'account-a'; },
    fetchImpl: async () => { throw new Error('Unexpected Google request'); },
  });

  assert.equal(await client.accountId(), 'account-a');
  assert.deepEqual(markers, ['server-session:1:account-a']);
});

test('server-bound account lookup rejects malformed account IDs', async () => {
  const client = createDriveClient({
    getToken: () => 'server-session:1:account-a',
    getAccountId: () => 'wrong/account',
    fetchImpl: async () => { throw new Error('Unexpected Google request'); },
  });
  await assert.rejects(client.accountId(), expectDriveError('invalid'));
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
  assert.match(requests[0].parsed.searchParams.get('fields'), /version/);
});

test('accepts an optional decimal Drive version and rejects malformed values', async () => {
  const values = [jsonMetadata({version: undefined}), jsonMetadata({version: '9007199254740993'}), jsonMetadata({version: '1.5'})];
  let index = 0;
  const client = createDriveClient({
    getToken: () => 'token-a',
    fetchImpl: async () => Response.json(values[index++]),
  });

  assert.equal((await client.metadata('file-a')).version, undefined);
  assert.equal((await client.metadata('file-a')).version, '9007199254740993');
  await assert.rejects(client.metadata('file-a'), expectDriveError('invalid'));
});

test('requests and validates an optional binary content revision without cached reads', async () => {
  const requests = [];
  const values = [
    jsonMetadata({headRevisionId: 'revision-a'}),
    jsonMetadata({headRevisionId: ''}),
  ];
  const client = createDriveClient({
    getToken: () => 'token-a',
    fetchImpl: async (url, init) => {
      requests.push({url: new URL(url), init});
      return new URL(url).searchParams.get('alt') === 'media'
        ? Response.json({id: 'epoch-a'})
        : Response.json(values.shift());
    },
  });
  assert.equal((await client.metadata('file-a')).headRevisionId, 'revision-a');
  assert.deepEqual(await client.readJson('file-a'), {id: 'epoch-a'});
  await assert.rejects(client.metadata('file-a'), expectDriveError('invalid'));
  assert.match(requests[0].url.searchParams.get('fields'), /headRevisionId/);
  assert.equal(requests.every(({init}) => init.cache === 'no-store'), true);
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

const datasetFolder = (overrides = {}) => ({
  id: 'dataset-folder', name: 'Existing area', mimeType: 'application/vnd.google-apps.folder',
  parents: ['drive-root'], appProperties: {
    app: 'vokabeltrainer-product', kind: 'dataset-folder', datasetId: 'dataset-a',
    purchaseApp: 'vokabeltrainer-purchases', purchaseConfigId: 'config-a', purchaseConfigSha256: 'hash-a',
  }, trashed: false, version: '7', ...overrides,
});

function folderV2(value, etag = '"folder-etag-7"') {
  return {id: value.id, title: value.name, mimeType: value.mimeType,
    parents: value.parents.map(id => ({id})),
    properties: Object.entries(value.appProperties).map(([key, value]) => ({key, value, visibility: 'PRIVATE'})),
    labels: {trashed: value.trashed}, version: value.version, etag};
}

function folderClient({before = datasetFolder(), after = datasetFolder({name: 'New area', version: '8'}),
  writeResponse = () => Response.json({id: 'unverified'}), token = () => 'token-a',
  account = () => 'account-a', onRead = () => {}, rawBefore = null} = {}) {
  const requests = [];
  let reads = 0;
  const client = createDriveClient({getToken: token, getAccountId: account,
    fetchImpl: async (url, init) => {
      requests.push({url: new URL(url), init});
      if (init.method === 'PUT') return writeResponse();
      reads++;
      onRead(reads);
      if (new URL(url).pathname.includes('/v2/')) return Response.json(rawBefore ?? folderV2(before));
      return Response.json(after);
    },
  });
  return {client, requests};
}

const renameFolder = {id: 'dataset-folder', datasetId: 'dataset-a', expectedVersion: '7', name: 'New area'};

test('renames only a marked dataset root with a conditional metadata update and verified v3 readback', async () => {
  const {client, requests} = folderClient();
  assert.deepEqual(await client.updateDatasetFolder(renameFolder), datasetFolder({name: 'New area', version: '8'}));
  assert.equal(requests.length, 3);
  assert.equal(requests[0].url.pathname, '/drive/v2/files/dataset-folder');
  assert.match(requests[0].url.searchParams.get('fields'), /etag/);
  assert.equal(requests[1].init.method, 'PUT');
  assert.equal(requests[1].init.headers['If-Match'], '"folder-etag-7"');
  assert.deepEqual(JSON.parse(requests[1].init.body), {title: 'New area'});
  assert.equal(requests[2].url.pathname, '/drive/v3/files/dataset-folder');
  assert.equal(requests.every(({init}) => init.cache === 'no-store'), true);
});

test('moves the dataset root to trash without deleting or rewriting properties', async () => {
  const after = datasetFolder({trashed: true, version: '8'});
  const {client, requests} = folderClient({after});
  assert.deepEqual(await client.updateDatasetFolder({id: 'dataset-folder', datasetId: 'dataset-a', expectedVersion: '7', trashed: true}), after);
  assert.deepEqual(JSON.parse(requests[1].init.body), {labels: {trashed: true}});
  assert.equal(requests.some(({init}) => init.method === 'DELETE'), false);
});

test('rejects invalid folder mutations before contacting Google', async (t) => {
  for (const change of [{name: ''}, {name: '  '}, {trashed: false}, {name: undefined}, {name: 'new', trashed: true},
    {expectedVersion: undefined}, {expectedVersion: '1.2'}, {id: '../folder'}, {datasetId: ''}]) {
    await t.test(JSON.stringify(change), async () => {
      const {client, requests} = folderClient();
      await assert.rejects(client.updateDatasetFolder({...renameFolder, ...change}), expectDriveError('invalid'));
      assert.equal(requests.length, 0);
    });
  }
});

test('rejects foreign folder markers and nonfolder or trashed targets before writing', async (t) => {
  for (const change of [{id: 'other-folder'}, {mimeType: 'application/json'}, {trashed: true},
    {appProperties: {app: 'foreign', kind: 'dataset-folder', datasetId: 'dataset-a'}},
    {appProperties: {app: 'vokabeltrainer-product', kind: 'coordinator', datasetId: 'dataset-a'}},
    {appProperties: {app: 'vokabeltrainer-product', kind: 'dataset-folder', datasetId: 'dataset-b'}}]) {
    await t.test(JSON.stringify(change), async () => {
      const {client, requests} = folderClient({before: datasetFolder(change)});
      await assert.rejects(client.updateDatasetFolder(renameFolder), expectDriveError('binding'));
      assert.equal(requests.some(({init}) => init.method === 'PUT'), false);
    });
  }
});

test('rejects stale discovery and 412 without replaying writes', async () => {
  const stale = folderClient({before: datasetFolder({version: '8'})});
  await assert.rejects(stale.client.updateDatasetFolder(renameFolder), expectDriveError('stale'));
  assert.equal(stale.requests.length, 1);
  const precondition = folderClient({writeResponse: () => new Response(null, {status: 412})});
  await assert.rejects(precondition.client.updateDatasetFolder(renameFolder), expectDriveError('stale', 412));
  assert.equal(precondition.requests.length, 2);
});

test('rejects missing or weak ETags and ambiguous private markers before writing', async (t) => {
  for (const change of [{etag: undefined}, {etag: 'W/"weak"'}, {etag: 'invalid'},
    {properties: [{key: 'app', value: 'vokabeltrainer-product', visibility: 'PUBLIC'}]},
    {properties: [...folderV2(datasetFolder()).properties, {key: 'app', value: 'foreign', visibility: 'PRIVATE'}]}]) {
    await t.test(JSON.stringify(change), async () => {
      const {client, requests} = folderClient({rawBefore: {...folderV2(datasetFolder()), ...change}});
      await assert.rejects(client.updateDatasetFolder(renameFolder), expectDriveError('invalid'));
      assert.equal(requests.length, 1);
    });
  }
});

test('rejects token or account changes before mutating a folder', async (t) => {
  for (const kind of ['token', 'account']) {
    await t.test(kind, async () => {
      let changed = false;
      const {client, requests} = folderClient({onRead: () => {changed = true;},
        token: () => changed && kind === 'token' ? 'token-b' : 'token-a',
        account: () => changed && kind === 'account' ? 'account-b' : 'account-a'});
      await assert.rejects(client.updateDatasetFolder(renameFolder), expectDriveError('auth'));
      assert.equal(requests.some(({init}) => init.method === 'PUT'), false);
    });
  }
});

test('captures direct OAuth account and never writes after a token switch during account lookup', async () => {
  let token = 'token-a';
  const requests = [];
  const client = createDriveClient({getToken: () => token, fetchImpl: async (url, init) => {
    requests.push({url: new URL(url), init});
    token = 'token-b';
    return Response.json({user: {permissionId: 'account-a'}});
  }});
  await assert.rejects(client.updateDatasetFolder(renameFolder), expectDriveError('auth'));
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url.pathname, '/drive/v3/about');
});

test('does not report ambiguous write failures as success or retry a write', async (t) => {
  for (const fail of [() => {throw new TypeError('private network details');}, () => new Response(null, {status: 503})]) {
    await t.test(String(fail), async () => {
      const {client, requests} = folderClient({writeResponse: fail});
      await assert.rejects(client.updateDatasetFolder(renameFolder), error => ['network', 'retryable'].includes(error.code));
      assert.equal(requests.filter(({init}) => init.method === 'PUT').length, 1);
      assert.equal(requests.length, 2);
    });
  }
});

test('requires stored mutation and unchanged identity, parents and properties on readback', async (t) => {
  for (const change of [{name: 'Existing area'}, {trashed: true}, {id: 'other'}, {version: undefined}, {version: '6'},
    {parents: ['other-root']}, {appProperties: {...datasetFolder().appProperties, purchaseConfigId: 'other'}}]) {
    await t.test(JSON.stringify(change), async () => {
      const {client, requests} = folderClient({after: datasetFolder({name: 'New area', version: '8', ...change})});
      await assert.rejects(client.updateDatasetFolder(renameFolder), expectDriveError('conflict'));
      assert.equal(requests.filter(({init}) => init.method === 'PUT').length, 1);
    });
  }
});

test('does not report success when credentials change after the write or while reading its result', async (t) => {
  for (const stage of ['write', 'body']) {
    await t.test(stage, async () => {
      let token = 'token-a';
      let writes = 0;
      const client = createDriveClient({getToken: () => token, getAccountId: () => 'account-a',
        fetchImpl: async (url, init) => {
          if (init.method === 'PUT') {
            writes++;
            if (stage === 'write') token = 'token-b';
            return Response.json({id: 'unverified'});
          }
          if (new URL(url).pathname.includes('/v2/')) return Response.json(folderV2(datasetFolder()));
          return {status: 200, ok: true, async json() {
            token = 'token-b';
            return datasetFolder({name: 'New area', version: '8'});
          }};
        }});
      await assert.rejects(client.updateDatasetFolder(renameFolder), expectDriveError('auth'));
      assert.equal(writes, 1);
    });
  }
});

test('rejects dataset folder names longer than 80 characters before contacting Google', async () => {
  const {client, requests} = folderClient();
  await assert.rejects(client.updateDatasetFolder({...renameFolder, name: 'x'.repeat(81)}), expectDriveError('invalid'));
  assert.equal(requests.length, 0);
});

test('validates the optional folder write guard before contacting Google', async () => {
  const {client, requests} = folderClient();
  await assert.rejects(client.updateDatasetFolder({...renameFolder, beforeWrite: true}), expectDriveError('invalid'));
  assert.equal(requests.length, 0);
});

test('runs the synchronous guard once at the folder write boundary', async () => {
  let checks = 0;
  const {client, requests} = folderClient({writeResponse() {
    assert.equal(checks, 1);
    return Response.json({id: 'unverified'});
  }});
  const after = await client.updateDatasetFolder({...renameFolder, beforeWrite() {
    checks++;
    assert.equal(requests.length, 1);
    queueMicrotask(() => { checks += 10; });
  }});
  assert.equal(after.name, 'New area');
  assert.equal(checks, 11);
  assert.equal(requests.filter(({init}) => init.method === 'PUT').length, 1);
});

test('a lock during the account or final token preflight prevents folder PUT and preserves its error', async (t) => {
  for (const stage of ['account', 'finalToken']) {
    await t.test(stage, async () => {
      let allowed = true;
      let accountChecks = 0;
      let finalTokenChecks = 0;
      let unblock;
      let notify;
      const blocked = new Promise(resolve => { notify = resolve; });
      const gate = new Promise(resolve => { unblock = resolve; });
      const requests = [];
      const locked = Object.assign(new Error('Adults view locked'), {code: 'locked'});
      const client = createDriveClient({
        getToken: async () => {
          if (stage === 'finalToken' && accountChecks === 3 && ++finalTokenChecks === 2) {
            notify();
            await gate;
          }
          return 'token-a';
        },
        getAccountId: async () => {
          accountChecks++;
          if (stage === 'account' && accountChecks === 3) {
            notify();
            await gate;
          }
          return 'account-a';
        },
        fetchImpl: async (url, init) => {
          requests.push({url: new URL(url), init});
          if (init.method === 'PUT') return Response.json({id: 'unverified'});
          return Response.json(new URL(url).pathname.includes('/v2/')
            ? folderV2(datasetFolder()) : datasetFolder({name: 'New area', version: '8'}));
        },
      });
      const operation = client.updateDatasetFolder({...renameFolder, beforeWrite() {
        if (!allowed) throw locked;
      }});
      await blocked;
      allowed = false;
      unblock();
      await assert.rejects(operation, error => error === locked);
      assert.equal(requests.some(({init}) => init.method === 'PUT'), false);
    });
  }
});
