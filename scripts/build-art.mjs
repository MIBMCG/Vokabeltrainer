import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {dirname, extname, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LEGACY_SOURCE_ROOT = resolve(ROOT, 'docs/design/art-sources');
const AVATAR_SOURCE_ROOT = resolve(ROOT, 'docs/design/avatar-shop-sources');
const OUTPUT_ROOT = resolve(ROOT, 'trainer/assets/art');
const MANIFEST_PATH = resolve(ROOT, 'src/trainer/ui/art-manifest.js');
const playwrightPath = process.env.PLAYWRIGHT_MODULE ?? 'playwright';
const executablePath = process.env.BROWSER_EXECUTABLE;

const AVATAR_CANVAS = Object.freeze({width: 1086, height: 1448});
const LANDSCAPE_WIDTHS = Object.freeze([480, 960, 1440]);
const AVATAR_WIDTHS = Object.freeze([256, 512, 768]);

const LANDSCAPE_SOURCES = Object.freeze([
  {kind: 'landscape', key: 'island-beach', file: 'island-beach.png', widths: LANDSCAPE_WIDTHS, sourceRoot: LEGACY_SOURCE_ROOT},
  {kind: 'landscape', key: 'island-journey', file: 'island-journey.png', widths: LANDSCAPE_WIDTHS, sourceRoot: LEGACY_SOURCE_ROOT},
]);

const AVATAR_SOURCE_FILES = Object.freeze([
  ...Array.from({length: 4}, (_, index) => ({key: `avatar-skin-${index}`, file: `explorer-boy-skin-${index}.png`})),
  ...Array.from({length: 6}, (_, index) => ({key: `avatar-clothing-${index}`, file: `explorer-boy-clothing-${index}.png`})),
  {key: 'avatar-head-cap', file: 'explorer-boy-cap-front.png'},
  {key: 'avatar-head-sunhat', file: 'explorer-boy-sunhat-front.png'},
  {key: 'avatar-head-mountainhat', file: 'explorer-boy-mountainhat-front.png'},
  {key: 'avatar-back-backpack', file: 'explorer-boy-backpack-rear.png'},
  {key: 'avatar-hand-binoculars', file: 'explorer-boy-binoculars-front.png'},
  {key: 'avatar-hand-compass', file: 'explorer-boy-compass-front.png'},
]);

function moduleUrl(value) {
  if (/^[A-Za-z]:[\\/]/u.test(value)) return pathToFileURL(value).href;
  if (value.startsWith('.')) return new URL(value, import.meta.url).href;
  return value;
}

function pngDimensions(bytes, filename) {
  if (bytes.length < 24 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new Error(`Invalid PNG source: ${filename}`);
  }
  return {width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20)};
}

function finiteNumber(value, name, filename) {
  if (!Number.isFinite(value)) throw new Error(`Invalid ${name} in ${filename}`);
  return value;
}

export async function loadAvatarSource(definition, {sourceRoot = AVATAR_SOURCE_ROOT} = {}) {
  const metadataName = `${definition.file.slice(0, -extname(definition.file).length)}.json`;
  let metadata;
  try {
    metadata = JSON.parse(await readFile(resolve(sourceRoot, metadataName), 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') throw new Error(`Missing avatar sidecar: ${metadataName}`, {cause: error});
    if (error instanceof SyntaxError) throw new Error(`Invalid avatar sidecar JSON: ${metadataName}`, {cause: error});
    throw error;
  }
  const sourceBytes = await readFile(resolve(sourceRoot, definition.file));
  const dimensions = pngDimensions(sourceBytes, definition.file);
  const canvas = metadata.canvas ?? AVATAR_CANVAS;
  if (canvas?.width !== AVATAR_CANVAS.width || canvas?.height !== AVATAR_CANVAS.height) {
    throw new Error(`Avatar sidecar canvas must be ${AVATAR_CANVAS.width}x${AVATAR_CANVAS.height}: ${metadataName}`);
  }
  const registration = metadata.registration;
  if (!registration) throw new Error(`Missing avatar registration: ${metadataName}`);
  const scale = finiteNumber(registration.scale, 'registration scale', metadataName);
  const x = finiteNumber(registration.x, 'registration x', metadataName);
  const y = finiteNumber(registration.y, 'registration y', metadataName);
  if (scale <= 0 || scale > 2) throw new Error(`Avatar registration scale is out of range: ${metadataName}`);
  if (x < -canvas.width || x > canvas.width || y < -canvas.height || y > canvas.height) {
    throw new Error(`Avatar registration translation is out of range: ${metadataName}`);
  }
  for (const requestedWidth of AVATAR_WIDTHS) {
    const requestedHeight = Math.round(canvas.height * requestedWidth / canvas.width);
    const horizontalScale = requestedWidth / canvas.width * scale;
    const verticalScale = requestedHeight / canvas.height * scale;
    if (horizontalScale > 1 || verticalScale > 1) {
      throw new Error(`Avatar rendition would upscale source pixels at ${requestedWidth}px: ${metadataName}`);
    }
  }
  return {
    kind: 'avatar',
    ...definition,
    widths: AVATAR_WIDTHS,
    sourceRoot,
    metadataName,
    canvas: {...canvas},
    registration: {scale, x, y},
    sourceWidth: dimensions.width,
    sourceHeight: dimensions.height,
  };
}

export async function loadArtSources() {
  return [
    ...LANDSCAPE_SOURCES,
    ...await Promise.all(AVATAR_SOURCE_FILES.map((definition) => loadAvatarSource(definition))),
  ];
}

function manifestModule(art) {
  const fallbackUrls = Object.values(art).map(({fallbackUrl}) => fallbackUrl);
  return `// Generated by scripts/build-art.mjs. Do not edit by hand.\n`
    + `export const ART = Object.freeze(${JSON.stringify(art, null, 2)});\n\n`
    + `export const PRECACHE_ART_URLS = Object.freeze(${JSON.stringify(fallbackUrls, null, 2)});\n\n`
    + `export const AVATAR_LAYER_KEYS = Object.freeze({\n`
    + `  skin: Object.freeze(['avatar-skin-0', 'avatar-skin-1', 'avatar-skin-2', 'avatar-skin-3']),\n`
    + `  clothing: Object.freeze(['avatar-clothing-0', 'avatar-clothing-1', 'avatar-clothing-2', 'avatar-clothing-3', 'avatar-clothing-4', 'avatar-clothing-5']),\n`
    + `  head: Object.freeze({cap: 'avatar-head-cap', sunhat: 'avatar-head-sunhat', mountainhat: 'avatar-head-mountainhat'}),\n`
    + `  back: Object.freeze({backpack: 'avatar-back-backpack'}),\n`
    + `  hand: Object.freeze({binoculars: 'avatar-hand-binoculars', compass: 'avatar-hand-compass'}),\n`
    + `});\n`;
}

async function encode(page, sourceBytes, requestedWidth, sourceDefinition) {
  return page.evaluate(async ({source, requestedWidth, sourceDefinition}) => {
    const img = new Image();
    img.src = source;
    await img.decode();
    let logicalWidth = img.naturalWidth;
    let logicalHeight = img.naturalHeight;
    const normalized = document.createElement('canvas');
    if (sourceDefinition.kind === 'avatar') {
      logicalWidth = sourceDefinition.canvas.width;
      logicalHeight = sourceDefinition.canvas.height;
      normalized.width = logicalWidth;
      normalized.height = logicalHeight;
      const context = normalized.getContext('2d');
      const {scale, x, y} = sourceDefinition.registration;
      context.setTransform(scale, 0, 0, scale, x, y);
      context.drawImage(img, 0, 0);
      context.resetTransform();
    } else {
      normalized.width = logicalWidth;
      normalized.height = logicalHeight;
      normalized.getContext('2d').drawImage(img, 0, 0);
    }
    const width = Math.min(requestedWidth, logicalWidth);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = Math.round(logicalHeight * width / logicalWidth);
    canvas.getContext('2d').drawImage(normalized, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolveBlob) => canvas.toBlob(resolveBlob, 'image/webp', 0.86));
    if (!blob || blob.type !== 'image/webp') throw new Error('WebP encoding unavailable');
    return {bytes: Array.from(new Uint8Array(await blob.arrayBuffer())), width: canvas.width, height: canvas.height};
  }, {
    source: `data:image/png;base64,${sourceBytes.toString('base64')}`,
    requestedWidth,
    sourceDefinition: sourceDefinition.kind === 'avatar'
      ? {kind: sourceDefinition.kind, canvas: sourceDefinition.canvas, registration: sourceDefinition.registration}
      : {kind: sourceDefinition.kind},
  });
}

export async function buildArt() {
  const sources = await loadArtSources();
  await mkdir(OUTPUT_ROOT, {recursive: true});
  const {chromium} = await import(moduleUrl(playwrightPath));
  const browser = await chromium.launch({headless: true, ...(executablePath ? {executablePath} : {})});
  const page = await browser.newPage();
  const art = {};
  try {
    for (const source of sources) {
      const bytes = await readFile(resolve(source.sourceRoot, source.file));
      const variants = [];
      for (const requestedWidth of source.widths) {
        const result = await encode(page, bytes, requestedWidth, source);
        if (variants.some(({width}) => width === result.width)) continue;
        const filename = `${source.key}-${result.width}.webp`;
        await writeFile(resolve(OUTPUT_ROOT, filename), Uint8Array.from(result.bytes));
        variants.push({width: result.width, url: `../../../trainer/assets/art/${filename}`});
        art[source.key] ??= {width: result.width, height: result.height, variants: [], fallbackUrl: ''};
        art[source.key].width = Math.max(art[source.key].width, result.width);
        art[source.key].height = Math.max(art[source.key].height, result.height);
      }
      art[source.key].variants = variants;
      art[source.key].fallbackUrl = variants[0].url;
    }
  } finally {
    await browser.close();
  }
  await writeFile(MANIFEST_PATH, manifestModule(art), 'utf8');
  process.stdout.write(`Built ${Object.keys(art).length} art assets with ${Object.values(art).reduce((sum, asset) => sum + asset.variants.length, 0)} renditions.\n`);
  return art;
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) await buildArt();
