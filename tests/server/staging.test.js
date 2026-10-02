import assert from 'node:assert/strict';
import {lstat, mkdtemp, mkdir, readFile, readdir, realpath, rm, rmdir, symlink, unlink, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {basename, dirname, join, resolve} from 'node:path';
import {afterEach, test} from 'node:test';
import {fileURLToPath} from 'node:url';
import {prepareCloudflare} from '../../scripts/prepare-cloudflare.mjs';

const temporaryRoots = [];
const temporaryLinks = [];
const sourceRoot = resolve(fileURLToPath(new URL('../../', import.meta.url)));

afterEach(async () => {
  for (const link of temporaryLinks.splice(0)) {
    if ((await lstat(link)).isSymbolicLink()) await unlink(link);
  }
  const tempBase = await realpath(tmpdir());
  for (const root of temporaryRoots.splice(0)) {
    const resolved = await realpath(root);
    assert.equal(dirname(resolved).toLowerCase(), tempBase.toLowerCase());
    assert.match(basename(resolved), /^vokabeltrainer-(?:stage|outside|source)-/);
    assert.equal((await lstat(root)).isSymbolicLink(), false);
    await rm(root, {recursive: true});
  }
});

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'vokabeltrainer-stage-'));
  temporaryRoots.push(root);
  await mkdir(join(root, 'trainer'), {recursive: true});
  await mkdir(join(root, 'src', 'trainer'), {recursive: true});
  await writeFile(join(root, 'trainer', 'index.html'), '<h1>Trainer</h1>');
  await writeFile(join(root, 'src', 'trainer', 'config.js'), "export const APP_CONFIG = {authMode: 'browser'};\n");
  await writeFile(join(root, 'private.txt'), 'not public');
  await mkdir(join(root, 'server'));
  await writeFile(join(root, 'server', 'worker.js'), 'server only');
  return root;
}

const FILES = ['trainer/index.html', 'src/trainer/config.js'];

test('rejects a public list that names server files or leaves the allowed folders', async () => {
  const root = await fixture();
  await assert.rejects(prepareCloudflare({root, assetFiles: [...FILES, 'server/worker.js']}), /public asset list/i);
  await assert.rejects(prepareCloudflare({root, assetFiles: [...FILES, 'trainer/../private.txt']}), /public asset list/i);
});

test('copies only named public assets and enables the server mode in the staged config', async () => {
  const root = await fixture();
  await prepareCloudflare({root, assetFiles: FILES});
  const output = join(root, '.cloudflare', 'public');
  assert.deepEqual(await readdir(output), ['src', 'trainer']);
  assert.deepEqual(await readdir(join(output, 'src', 'trainer')), ['config.js']);
  assert.deepEqual(await readdir(join(output, 'trainer')), ['index.html']);
  assert.match(await readFile(join(output, 'src', 'trainer', 'config.js'), 'utf8'), /authMode: 'server'/);
  assert.equal(await readFile(join(root, 'src', 'trainer', 'config.js'), 'utf8'), "export const APP_CONFIG = {authMode: 'browser'};\n");
});

test('safe repetition preserves the exact public file set and rejects unknown output files', async () => {
  const root = await fixture();
  await prepareCloudflare({root, assetFiles: FILES});
  await prepareCloudflare({root, assetFiles: FILES});
  const stranger = join(root, '.cloudflare', 'public', 'server-secret.txt');
  await writeFile(stranger, 'must stay private');
  await assert.rejects(prepareCloudflare({root, assetFiles: FILES}), /unexpected|unbekannt/i);
  assert.equal(await readFile(stranger, 'utf8'), 'must stay private');
});

test('rejects a missing or ambiguous browser-mode switch', async () => {
  const root = await fixture();
  const config = join(root, 'src', 'trainer', 'config.js');
  await writeFile(config, "export const APP_CONFIG = {authMode: 'server'};\n");
  await assert.rejects(prepareCloudflare({root, assetFiles: FILES}), /authMode/i);
  await writeFile(config, "authMode: 'browser'; authMode: 'browser';\n");
  await assert.rejects(prepareCloudflare({root, assetFiles: FILES}), /authMode/i);
});

test('rejects an output directory that escapes through a symlink or junction', async (context) => {
  const root = await fixture();
  const outside = await mkdtemp(join(tmpdir(), 'vokabeltrainer-outside-'));
  temporaryRoots.push(outside);
  try {
    await symlink(outside, join(root, '.cloudflare'), process.platform === 'win32' ? 'junction' : 'dir');
    temporaryLinks.push(join(root, '.cloudflare'));
  } catch (error) {
    if (error.code === 'EPERM' || error.code === 'EACCES') return context.skip('symlink privilege unavailable');
    throw error;
  }
  await assert.rejects(prepareCloudflare({root, assetFiles: FILES}), /symlink|junction|link/i);
  assert.deepEqual(await readdir(outside), []);
});

test('rejects a source asset that resolves through a symlink or junction', async (context) => {
  const root = await fixture();
  const outside = await mkdtemp(join(tmpdir(), 'vokabeltrainer-source-'));
  temporaryRoots.push(outside);
  await unlink(join(root, 'trainer', 'index.html'));
  await rmdir(join(root, 'trainer'));
  await writeFile(join(outside, 'index.html'), 'private external');
  try {
    await symlink(outside, join(root, 'trainer'), process.platform === 'win32' ? 'junction' : 'dir');
    temporaryLinks.push(join(root, 'trainer'));
  } catch (error) {
    if (error.code === 'EPERM' || error.code === 'EACCES') return context.skip('symlink privilege unavailable');
    throw error;
  }
  await assert.rejects(prepareCloudflare({root, assetFiles: FILES}), /symlink|junction|link/i);
});

test('actual repository copy contains public assets but no private, server, or report files', async () => {
  const canary = join(sourceRoot, '.cloudflare', 'private-staging-canary.txt');
  await mkdir(join(sourceRoot, '.cloudflare'), {recursive: true});
  await writeFile(canary, 'synthetic private sentinel');
  try {
    await prepareCloudflare({root: sourceRoot});
    const output = join(sourceRoot, '.cloudflare', 'public');
    assert.match(await readFile(join(output, 'trainer', 'index.html'), 'utf8'), /<html/);
    assert.match(await readFile(join(output, 'src', 'trainer', 'config.js'), 'utf8'), /authMode: 'server'/);
    for (const file of ['index.html', 'datenschutz.html', 'nutzung.html', 'styles.css']) {
      const source = await readFile(join(sourceRoot, 'trainer', 'info', file));
      assert.deepEqual(await readFile(join(output, 'trainer', 'info', file)), source, file);
    }
    assert.deepEqual(await readdir(output), ['src', 'trainer']);
    await assert.rejects(readFile(join(output, 'server', 'worker.js')));
    await assert.rejects(readFile(join(output, 'docs', 'ANFORDERUNGEN.md')));
    await assert.rejects(readFile(join(output, 'private-staging-canary.txt')));
  } finally {
    await unlink(canary);
  }
});

test('Wrangler example points its build hook at the fail-closed staging script', async () => {
  const configurationPath = join(sourceRoot, 'server', 'wrangler.example.jsonc');
  const jsonc = await readFile(configurationPath, 'utf8');
  const configuration = JSON.parse(jsonc.split(/\r?\n/u).filter((line) => !line.trimStart().startsWith('//')).join('\n'));
  const buildRoot = resolve(dirname(configurationPath), configuration.build.cwd);
  assert.equal(buildRoot, sourceRoot);
  assert.equal(resolve(dirname(configurationPath), configuration.main), join(sourceRoot, 'server', 'worker.js'));
  assert.equal(resolve(dirname(configurationPath), configuration.assets.directory), join(sourceRoot, '.cloudflare', 'public'));
  assert.equal(configuration.observability.enabled, false);
  assert.equal(configuration.assets.run_worker_first, true);
  assert.equal(configuration.build.command, 'npm run prepare:cloudflare');
  const sentinel = join(sourceRoot, '.cloudflare', 'public', 'unexpected-deploy-sentinel.txt');
  await writeFile(sentinel, 'synthetic private value');
  try {
    await assert.rejects(prepareCloudflare({root: buildRoot}), /unexpected file/i);
    assert.equal(await readFile(sentinel, 'utf8'), 'synthetic private value');
  } finally {
    await unlink(sentinel);
  }
});
