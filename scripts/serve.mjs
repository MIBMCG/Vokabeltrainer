import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HOST = '127.0.0.1';
const PORT = 4173;

const ASSETS = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/manifest.webmanifest', ['manifest.webmanifest', 'application/manifest+json; charset=utf-8']],
  ['/icons/probe.svg', ['icons/probe.svg', 'image/svg+xml; charset=utf-8']],
  ['/sw.js', ['sw.js', 'text/javascript; charset=utf-8']],
  ['/src/drive/auth.js', ['src/drive/auth.js', 'text/javascript; charset=utf-8']],
  ['/src/drive/client.js', ['src/drive/client.js', 'text/javascript; charset=utf-8']],
  ['/src/probe/controller.js', ['src/probe/controller.js', 'text/javascript; charset=utf-8']],
  ['/src/probe/main.js', ['src/probe/main.js', 'text/javascript; charset=utf-8']],
  ['/src/probe/model.js', ['src/probe/model.js', 'text/javascript; charset=utf-8']],
  ['/src/probe/store.js', ['src/probe/store.js', 'text/javascript; charset=utf-8']],
]);

const SECURITY_HEADERS = {
  'Cache-Control': 'no-cache',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' https://accounts.google.com; connect-src 'self' https://www.googleapis.com; frame-src https://accounts.google.com; style-src 'self'; img-src 'self'; manifest-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'",
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
};

function send(response, status, body, headers = {}) {
  response.writeHead(status, {
    ...SECURITY_HEADERS,
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    ...headers,
  });
  response.end(body);
}

export function createProbeServer({root = ROOT} = {}) {
  return http.createServer(async (request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      send(response, 405, 'Methode nicht erlaubt.', {Allow: 'GET, HEAD'});
      return;
    }

    let pathname;
    try {
      const url = new URL(request.url, `http://${HOST}`);
      pathname = decodeURIComponent(url.pathname);
    } catch {
      send(response, 400, 'Ungültige Anfrage.');
      return;
    }
    const asset = ASSETS.get(pathname);
    if (!asset) {
      send(response, 404, 'Nicht gefunden.');
      return;
    }

    let body;
    try {
      body = await readFile(resolve(root, asset[0]));
    } catch {
      send(response, 404, 'Nicht gefunden.');
      return;
    }
    response.writeHead(200, {
      ...SECURITY_HEADERS,
      'Content-Type': asset[1],
      'Content-Length': body.length,
    });
    response.end(request.method === 'HEAD' ? undefined : body);
  });
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
  const server = createProbeServer();
  server.listen(PORT, HOST, () => {
    process.stdout.write(`Verbindungsprobe: http://${HOST}:${PORT}\n`);
  });
}
