const FOLDER = 'application/vnd.google-apps.folder';
const JSON_TYPE = 'application/json';

const clone = (value) => structuredClone(value);

function multipart(body) {
  const chunks = body.split('\r\n\r\n');
  return {
    metadata: JSON.parse(chunks[1].split('\r\n')[0]),
    value: JSON.parse(chunks[2].split('\r\n')[0]),
  };
}

function privateProperties(properties) {
  return Object.entries(properties).map(([key, value]) => ({key, value, visibility: 'PRIVATE'}));
}

export function purchasesHttpFixture({accountId = 'account-a', etag = '"opaque/strong:token"'} = {}) {
  let serial = 0;
  let activeAccountId = accountId;
  let loseNextCreateResponse = false;
  let loseNextPointerResponse = false;
  let dropNextPointerResponse = false;
  let beforePointer = null;
  const calls = [];
  const files = new Map();

  const response = (value, status = 200) => new Response(JSON.stringify(value), {
    status,
    headers: {'Content-Type': 'application/json'},
  });

  function seed({id, name, mimeType = JSON_TYPE, parentId = null, properties = {}, value = {}}) {
    files.set(id, {
      id,
      title: name,
      mimeType,
      parentId,
      properties: {...properties},
      value: clone(value),
      version: 1,
      etag,
    });
  }

  async function fetch(url, init = {}) {
    const parsed = new URL(url);
    const method = init.method ?? 'GET';
    calls.push({url: parsed.href, method, headers: {...(init.headers ?? {})}, body: init.body, cache: init.cache});

    if (parsed.pathname.endsWith('/drive/v3/about')) {
      return response({user: {permissionId: activeAccountId}});
    }
    if (parsed.pathname.endsWith('/drive/v3/files/generateIds')) {
      return response({ids: [`reserved-${++serial}`]});
    }

    if (method === 'POST' && parsed.pathname.endsWith('/upload/drive/v3/files')) {
      const {metadata, value} = multipart(init.body);
      if (files.has(metadata.id)) return response({}, 409);
      seed({
        id: metadata.id,
        name: metadata.name,
        mimeType: metadata.mimeType,
        parentId: metadata.parents?.[0] ?? null,
        properties: metadata.appProperties,
        value,
      });
      if (loseNextCreateResponse) {
        loseNextCreateResponse = false;
        throw new Error('synthetic lost create response');
      }
      return response({id: metadata.id});
    }

    if (method === 'POST' && parsed.pathname.endsWith('/drive/v3/files')) {
      const metadata = JSON.parse(init.body);
      if (files.has(metadata.id)) return response({}, 409);
      seed({
        id: metadata.id,
        name: metadata.name,
        mimeType: metadata.mimeType,
        parentId: metadata.parents?.[0] ?? null,
        properties: metadata.appProperties,
      });
      if (loseNextCreateResponse) {
        loseNextCreateResponse = false;
        throw new Error('synthetic lost create response');
      }
      return response({id: metadata.id});
    }

    const id = parsed.pathname.split('/').at(-1);
    const record = files.get(id);
    if (!record) return response({}, 404);

    if (method === 'GET' && parsed.pathname.includes('/drive/v2/files/')) {
      if (parsed.searchParams.get('alt') === 'media') return response(record.value);
      return response({
        id,
        title: record.title,
        mimeType: record.mimeType,
        parents: record.parentId === null ? [] : [{id: record.parentId}],
        properties: privateProperties(record.properties),
        labels: {trashed: false},
        version: String(record.version),
        etag: record.etag,
      });
    }

    if (method === 'PUT' && parsed.pathname.includes('/drive/v2/files/')) {
      if (init.headers?.['If-Match'] !== record.etag) return response({}, 412);
      if (beforePointer) {
        const hook = beforePointer;
        beforePointer = null;
        await hook({id, record, files});
        if (init.headers?.['If-Match'] !== record.etag) return response({}, 412);
      }
      if (dropNextPointerResponse) {
        dropNextPointerResponse = false;
        throw new Error('synthetic pointer response lost before application');
      }
      const body = JSON.parse(init.body);
      record.properties = Object.fromEntries((body.properties ?? []).map(({key, value}) => [key, value]));
      record.version += 1;
      record.etag = `"opaque/strong:token-${record.version}"`;
      if (loseNextPointerResponse) {
        loseNextPointerResponse = false;
        throw new Error('synthetic lost pointer response');
      }
      return response({id, version: String(record.version), etag: record.etag});
    }

    return response({}, 405);
  }

  return {
    calls,
    files,
    fetch,
    seed,
    setAccountId(value) { activeAccountId = value; },
    loseCreateResponse() { loseNextCreateResponse = true; },
    losePointerResponse() { loseNextPointerResponse = true; },
    dropPointerResponse() { dropNextPointerResponse = true; },
    beforeNextPointer(callback) { beforePointer = callback; },
    FOLDER,
    JSON_TYPE,
  };
}
