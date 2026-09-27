import {lstat, mkdir, readFile, readdir, realpath, writeFile} from 'node:fs/promises';
import {dirname, isAbsolute, join, relative, resolve, sep} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG = 'src/trainer/config.js';
const OUTPUT = ['.cloudflare', 'public'];
const PUBLIC_PREFIXES = ['trainer/', 'src/trainer/', 'src/drive/'];

function isInside(parent, child) {
  const rel = relative(parent, child);
  return rel === '' || (rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
}

function pathSegments(path) {
  return path.split('/');
}

function validAsset(path) {
  return typeof path === 'string'
    && PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix))
    && pathSegments(path).every((part) => /^[A-Za-z0-9_.-]+$/u.test(part) && part !== '.' && part !== '..');
}

async function existingStat(path) {
  try {
    return await lstat(path);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function assertPlainPath(root, segments, kind) {
  let current = root;
  for (let index = 0; index < segments.length; index += 1) {
    current = join(current, segments[index]);
    const stat = await existingStat(current);
    if (!stat) return false;
    if (stat.isSymbolicLink()) throw new Error(`Symlink or junction in ${kind}: ${current}`);
    if (index === segments.length - 1 && kind === 'source') {
      if (!stat.isFile()) throw new Error(`Source asset is not a regular file: ${current}`);
    } else if (!stat.isDirectory()) {
      throw new Error(`Non-directory ancestor in ${kind}: ${current}`);
    }
    const resolved = await realpath(current);
    if (!isInside(root, resolved)) throw new Error(`Resolved ${kind} escapes repository: ${current}`);
  }
  return true;
}

async function checkExistingOutput(output, files) {
  const allowedFiles = new Set(files);
  const allowedDirs = new Set();
  for (const file of files) {
    const parts = pathSegments(file);
    for (let count = 1; count < parts.length; count += 1) {
      allowedDirs.add(parts.slice(0, count).join('/'));
    }
  }
  async function walk(dir, prefix = '') {
    for (const entry of await readdir(dir, {withFileTypes: true})) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) throw new Error(`Symlink or junction in staging output: ${rel}`);
      if (entry.isDirectory() && allowedDirs.has(rel)) {
        await walk(join(dir, entry.name), rel);
      } else if (!(entry.isFile() && allowedFiles.has(rel))) {
        throw new Error(`Unexpected file in staging output: ${rel}`);
      }
    }
  }
  await walk(output);
}

function serverConfig(source) {
  const switchPattern = /\bauthMode\s*:\s*(['"])browser\1/gu;
  const matches = [...source.matchAll(switchPattern)];
  if (matches.length !== 1) throw new Error('Expected exactly one authMode browser setting in source config.');
  return source.replace(switchPattern, "authMode: 'server'");
}

export async function prepareCloudflare({root = ROOT, assetFiles} = {}) {
  const repository = await realpath(root);
  if (assetFiles === undefined) {
    const {publicAssetFiles} = await import('./serve.mjs');
    assetFiles = publicAssetFiles();
  }
  if (!Array.isArray(assetFiles) || assetFiles.length === 0 || !assetFiles.includes(CONFIG)
    || assetFiles.some((file) => !validAsset(file)) || new Set(assetFiles).size !== assetFiles.length) {
    throw new Error('Public asset list is empty, invalid, duplicated, or missing the trainer config.');
  }
  const files = [...assetFiles].sort();

  // Validate every source, destination ancestor and existing output before copying.
  const bodies = new Map();
  for (const file of files) {
    const segments = pathSegments(file);
    if (!(await assertPlainPath(repository, segments, 'source'))) {
      throw new Error(`Missing public source asset: ${file}`);
    }
    const body = await readFile(join(repository, ...segments));
    bodies.set(file, file === CONFIG ? Buffer.from(serverConfig(body.toString('utf8'))) : body);
  }

  for (let count = 1; count <= OUTPUT.length; count += 1) {
    const segments = OUTPUT.slice(0, count);
    const path = join(repository, ...segments);
    const exists = await assertPlainPath(repository, segments, 'output');
    if (!exists) await mkdir(path);
    await assertPlainPath(repository, segments, 'output');
  }
  const output = join(repository, ...OUTPUT);
  if (!isInside(join(repository, '.cloudflare'), await realpath(output))) {
    throw new Error('Staging output escaped .cloudflare.');
  }
  await checkExistingOutput(output, files);

  for (const file of files) {
    const segments = pathSegments(file);
    for (let count = 1; count < segments.length; count += 1) {
      const directorySegments = [...OUTPUT, ...segments.slice(0, count)];
      const path = join(repository, ...directorySegments);
      if (!(await assertPlainPath(repository, directorySegments, 'output'))) await mkdir(path);
      await assertPlainPath(repository, directorySegments, 'output');
    }
    const destinationSegments = [...OUTPUT, ...segments];
    const destination = join(repository, ...destinationSegments);
    const stat = await existingStat(destination);
    if (stat && (!stat.isFile() || stat.isSymbolicLink())) {
      throw new Error(`Symlink, junction or non-file destination: ${file}`);
    }
    await writeFile(destination, bodies.get(file));
  }
  return {output, files: files.length};
}

const invoked = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invoked) {
  try {
    const result = await prepareCloudflare();
    process.stdout.write(`${result.files} öffentliche Dateien vorbereitet: ${result.output}\n`);
  } catch (error) {
    process.stderr.write(`Cloudflare-Vorbereitung abgebrochen: ${error.message}\n`);
    process.exitCode = 1;
  }
}
