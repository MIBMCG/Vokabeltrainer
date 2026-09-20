import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HOST = '127.0.0.1';
const PORT = 4173;

const ART_RENDITIONS = [
  ['island-beach', [480, 960, 1440]],
  ['island-journey', [480, 960, 1086]],
  ...Array.from({length: 4}, (_, index) => [`avatar-skin-${index}`, [256, 512, 768]]),
  ...Array.from({length: 6}, (_, index) => [`avatar-clothing-${index}`, [256, 512, 768]]),
  ['avatar-head-cap', [256, 512, 768]],
  ['avatar-head-sunhat', [256, 512, 768]],
  ['avatar-head-mountainhat', [256, 512, 768]],
  ['avatar-back-backpack', [256, 512, 768]],
  ['avatar-hand-binoculars', [256, 512, 768]],
  ['avatar-hand-compass', [256, 512, 768]],
];

const ASSETS = new Map([
  ['/shop-probe/', ['shop-probe/index.html', 'text/html; charset=utf-8']],
  ['/shop-probe/index.html', ['shop-probe/index.html', 'text/html; charset=utf-8']],
  ['/shop-probe/styles.css', ['shop-probe/styles.css', 'text/css; charset=utf-8']],
  ...['main','transport','v2-coherent-transport','scenarios','immutable-value','purchase-coordinator','purchase-scenarios'].map(name=>[`/src/shop-probe/${name}.js`, [`src/shop-probe/${name}.js`, 'text/javascript; charset=utf-8']]),
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
  ['/trainer/', ['trainer/index.html', 'text/html; charset=utf-8']],
  ['/trainer/index.html', ['trainer/index.html', 'text/html; charset=utf-8']],
  ['/trainer/styles.css', ['trainer/styles.css', 'text/css; charset=utf-8']],
  ['/trainer/manifest.webmanifest', ['trainer/manifest.webmanifest', 'application/manifest+json; charset=utf-8']],
  ['/trainer/sw.js', ['trainer/sw.js', 'text/javascript; charset=utf-8']],
  ['/trainer/assets/app-icon.svg', ['trainer/assets/app-icon.svg', 'image/svg+xml; charset=utf-8']],
  ['/trainer/assets/islands.svg', ['trainer/assets/islands.svg', 'image/svg+xml; charset=utf-8']],
  ['/trainer/assets/avatar.svg', ['trainer/assets/avatar.svg', 'image/svg+xml; charset=utf-8']],
  ['/trainer/assets/badges.svg', ['trainer/assets/badges.svg', 'image/svg+xml; charset=utf-8']],
  ['/src/trainer/main.js', ['src/trainer/main.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/config.js', ['src/trainer/config.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/auth-config.js', ['src/trainer/auth-config.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/updates.js', ['src/trainer/updates.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/ui/dom.js', ['src/trainer/ui/dom.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/ui/art.js', ['src/trainer/ui/art.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/ui/art-manifest.js', ['src/trainer/ui/art-manifest.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/ui/shell.js', ['src/trainer/ui/shell.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/ui/practice.js', ['src/trainer/ui/practice.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/ui/rewards.js', ['src/trainer/ui/rewards.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/ui/adult.js', ['src/trainer/ui/adult.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/ui/learning-rules.js', ['src/trainer/ui/learning-rules.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/ui/statistics.js', ['src/trainer/ui/statistics.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/ui/vocabulary.js', ['src/trainer/ui/vocabulary.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/ui/settings.js', ['src/trainer/ui/settings.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/ui/sync.js', ['src/trainer/ui/sync.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/ui/backup.js', ['src/trainer/ui/backup.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/ui/preview.js', ['src/trainer/ui/preview.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/ui/status.js', ['src/trainer/ui/status.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/adult/pin.js', ['src/trainer/adult/pin.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/adult/import.js', ['src/trainer/adult/import.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/commands.js', ['src/trainer/commands.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/backup/format.js', ['src/trainer/backup/format.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/backup/restore.js', ['src/trainer/backup/restore.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/backup/transport.js', ['src/trainer/backup/transport.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/sync/packets.js', ['src/trainer/sync/packets.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/sync/drive.js', ['src/trainer/sync/drive.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/sync/scheduler.js', ['src/trainer/sync/scheduler.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/storage/store.js', ['src/trainer/storage/store.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/model/canonical.js', ['src/trainer/model/canonical.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/model/errors.js', ['src/trainer/model/errors.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/model/revisions.js', ['src/trainer/model/revisions.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/model/schema.js', ['src/trainer/model/schema.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/model/versions.js', ['src/trainer/model/versions.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/model/policies.js', ['src/trainer/model/policies.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/storage/migrate.js', ['src/trainer/storage/migrate.js', 'text/javascript; charset=utf-8']],

  ['/src/trainer/model/epochs.js', ['src/trainer/model/epochs.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/learning/answers.js', ['src/trainer/learning/answers.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/learning/calendar.js', ['src/trainer/learning/calendar.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/learning/progress.js', ['src/trainer/learning/progress.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/learning/facts.js', ['src/trainer/learning/facts.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/learning/schedule.js', ['src/trainer/learning/schedule.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/learning/statistics.js', ['src/trainer/learning/statistics.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/learning/rewards.js', ['src/trainer/learning/rewards.js', 'text/javascript; charset=utf-8']],
  ['/src/trainer/learning/rounds.js', ['src/trainer/learning/rounds.js', 'text/javascript; charset=utf-8']],
  ...ART_RENDITIONS.flatMap(([key, widths]) => widths.map((width) => [
    `/trainer/assets/art/${key}-${width}.webp`,
    [`trainer/assets/art/${key}-${width}.webp`, 'image/webp'],
  ])),
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

export function createProbeServer({root = ROOT, basePath = ''} = {}) {
  if (basePath !== '' && !/^\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/u.test(basePath)) {
    throw new TypeError('basePath must be empty or a normalized URL path prefix.');
  }
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
    if (basePath !== '') {
      if (!pathname.startsWith(`${basePath}/`)) {
        send(response, 404, 'Nicht gefunden.');
        return;
      }
      pathname = pathname.slice(basePath.length);
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
