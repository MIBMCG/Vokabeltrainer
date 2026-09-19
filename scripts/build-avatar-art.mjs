import {createHash} from 'node:crypto';
import {mkdir, readdir, readFile, writeFile} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

import {FIGURES, ITEMS, isCompatible} from '../src/trainer/avatar/catalog.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_ROOT = resolve(ROOT, 'docs/design/avatar-shop-sources');
const OUTPUT_ROOT = resolve(ROOT, 'trainer/assets/avatar-shop');
const MANIFEST_PATH = resolve(ROOT, 'src/trainer/avatar/art-manifest.js');
const REPORT_PATH = resolve(OUTPUT_ROOT, 'build-report.json');
const WIDTHS = Object.freeze([256, 512, 768]);
const SMALL_BUDGET = 8 * 1024 * 1024;

export function nonUpscaledWidths(canvas, registration) {
  return WIDTHS.filter((width) => {
    const height = Math.round(canvas.height * width / canvas.width);
    return width <= canvas.width
      && width / canvas.width * registration.scale <= 1
      && height / canvas.height * registration.scale <= 1;
  });
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function source(name, entries) {
  const value = entries.get(name);
  return value ? {...value, sourceName: name} : null;
}

function sameCanvas(value, canvas) {
  return value.width === canvas.width && value.height === canvas.height;
}

function nonEmptyText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasTraceableProvenance(metadata) {
  return ['prompt', 'provenance', 'generator', 'reference'].some((field) => nonEmptyText(metadata[field]))
    || (Array.isArray(metadata.references) && metadata.references.some(nonEmptyText));
}

function declaredSourceMismatch(metadata, sourceName) {
  for (const field of ['sourceFile', 'source', 'sourceName']) {
    const declared = metadata[field];
    if (!nonEmptyText(declared) || !/\.png$/iu.test(declared.trim())) continue;
    const filename = declared.trim().split(/[\\/]/u).at(-1);
    if (filename.toLowerCase() !== sourceName.toLowerCase()) {
      return {field, declaredSource: filename};
    }
  }
  return null;
}

function registeredSource(value, canvas) {
  if (value.invalidPng) {
    return {error: {reason: 'invalid-png'}};
  }
  if (value.metadataMissing) {
    return {error: {reason: 'missing-metadata-sidecar'}};
  }
  if (value.metadataError) {
    return {error: {reason: 'invalid-metadata-json'}};
  }
  if (!value.provenanceVerified) {
    return {error: {reason: 'missing-provenance'}};
  }
  if (value.metadataSourceMismatch) {
    return {error: {reason: 'metadata-source-mismatch', ...value.metadataSourceMismatch}};
  }
  const supplied = Object.hasOwn(value, 'registration');
  const suppliedCanvas = Object.hasOwn(value, 'canvas');
  if (suppliedCanvas && !supplied) {
    return {error: {reason: 'canvas-without-registration', canvas: value.canvas}};
  }
  const targetCanvas = suppliedCanvas ? value.canvas : canvas;
  if (!targetCanvas
    || !Number.isInteger(targetCanvas.width) || targetCanvas.width <= 0
    || !Number.isInteger(targetCanvas.height) || targetCanvas.height <= 0
    || targetCanvas.width !== canvas.width || targetCanvas.height !== canvas.height) {
    return {error: {reason: 'registration-canvas-mismatch', canvas: targetCanvas}};
  }
  const registration = supplied ? value.registration : {scale: 1, x: 0, y: 0};
  if (!registration || typeof registration !== 'object' || Array.isArray(registration)) {
    return {error: {reason: 'invalid-registration', registration}};
  }
  const {scale, x, y} = registration;
  if (![scale, x, y].every(Number.isFinite)
    || scale <= 0 || scale > 2
    || x < -targetCanvas.width || x > targetCanvas.width
    || y < -targetCanvas.height || y > targetCanvas.height) {
    return {error: {reason: 'invalid-registration', registration}};
  }
  const registeredBounds = {
    left: x,
    top: y,
    right: x + value.width * scale,
    bottom: y + value.height * scale,
  };
  return {
    value: {
      ...value,
      registration: {scale, x, y},
      registrationExplicit: supplied,
      registeredBounds,
      targetCanvas: {...targetCanvas},
      allowsRawCanvasDifference: supplied && suppliedCanvas,
    },
  };
}

function figureBase(figureId, entries) {
  return source(`${figureId}.png`, entries);
}

function itemSourceNames(figureId, itemId) {
  return {
    rear: `${figureId}-${itemId}-rear.png`,
    front: `${figureId}-${itemId}-front.png`,
  };
}

export function planAvatarSources(sourceEntries) {
  const entries = new Map(sourceEntries.map((entry) => [entry.name, entry]));
  const used = new Set();
  const figures = {};
  const missing = [];
  const misaligned = [];
  const invalid = [];

  function markFigureMissing(figure, human) {
    if (human) {
      for (let index = 0; index < 4; index += 1) missing.push(`${figure.id}:skin:${index}`);
      for (let index = 0; index < 6; index += 1) missing.push(`${figure.id}:clothing:${index}`);
    } else {
      missing.push(`${figure.id}:base`);
    }
    for (const item of ITEMS.filter(({id}) => isCompatible(id, figure.id))) {
      missing.push(`${figure.id}:item:${item.id}`);
    }
  }

  function accept(figureId, value, canvas) {
    if (!value) return null;
    used.add(value.sourceName);
    const registered = registeredSource(value, canvas);
    if (registered.error) {
      invalid.push({
        figureId,
        sourceName: value.sourceName,
        ...registered.error,
      });
      return null;
    }
    if (!registered.value.allowsRawCanvasDifference && !sameCanvas(value, canvas)) {
      misaligned.push({
        figureId,
        sourceName: value.sourceName,
        expected: {width: canvas.width, height: canvas.height},
        actual: {width: value.width, height: value.height},
      });
      return null;
    }
    return registered.value;
  }

  for (const figure of FIGURES) {
    const human = figure.group === 'human';
    const first = human
      ? source(`${figure.id}-skin-0.png`, entries)
      : figureBase(figure.id, entries);
    if (first) used.add(first.sourceName);
    if (!first || first.invalidPng) {
      if (first?.invalidPng) invalid.push({figureId: figure.id, sourceName: first.sourceName, reason: 'invalid-png'});
      markFigureMissing(figure, human);
      continue;
    }
    const canvas = {width: first.width, height: first.height};
    const planned = {canvas, base: null, skins: {}, clothing: {}, items: {}};
    if (human) {
      for (let index = 0; index < 4; index += 1) {
        const key = `${figure.id}-skin-${index}.png`;
        const accepted = accept(figure.id, source(key, entries), canvas);
        if (accepted) planned.skins[index] = accepted;
        else missing.push(`${figure.id}:skin:${index}`);
      }
      for (let index = 0; index < 6; index += 1) {
        const key = `${figure.id}-clothing-${index}.png`;
        const accepted = accept(figure.id, source(key, entries), canvas);
        if (accepted) planned.clothing[index] = accepted;
        else missing.push(`${figure.id}:clothing:${index}`);
      }
    } else {
      planned.base = accept(figure.id, first, canvas);
      if (!planned.base) missing.push(`${figure.id}:base`);
    }

    for (const item of ITEMS.filter(({id}) => isCompatible(id, figure.id))) {
      const names = itemSourceNames(figure.id, item.id);
      const rear = accept(figure.id, source(names.rear, entries), canvas);
      const front = accept(figure.id, source(names.front, entries), canvas);
      if (rear || front) planned.items[item.id] = {rear, front};
      else missing.push(`${figure.id}:item:${item.id}`);
    }
    figures[figure.id] = planned;
  }

  const ignored = sourceEntries
    .filter(({name}) => name.toLowerCase().endsWith('.png') && !used.has(name))
    .map(({name}) => ({sourceName: name}));
  return {
    figures,
    missing: [...new Set(missing)].sort(),
    misaligned: misaligned.sort((a, b) => a.sourceName.localeCompare(b.sourceName)),
    invalid: invalid.sort((a, b) => a.sourceName.localeCompare(b.sourceName)),
    ignored: ignored.sort((a, b) => a.sourceName.localeCompare(b.sourceName)),
    complete: missing.length === 0 && misaligned.length === 0 && invalid.length === 0,
  };
}

function readPngDimensions(bytes, name) {
  const signature = '89504e470d0a1a0a';
  if (bytes.length < 24 || bytes.subarray(0, 8).toString('hex') !== signature) {
    throw new TypeError(`${name} is not a PNG file`);
  }
  return {width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20)};
}

export async function inventoryAvatarSources(sourceRoot) {
  const names = (await readdir(sourceRoot, {withFileTypes: true}))
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.png'))
    .map(({name}) => name)
    .sort();
  return Promise.all(names.map(async (name) => {
    const bytes = await readFile(resolve(sourceRoot, name));
    const value = {name, bytes: bytes.length, sha256: sha256(bytes)};
    try {
      Object.assign(value, readPngDimensions(bytes, name));
    } catch {
      value.invalidPng = true;
    }
    const metadataName = name.replace(/\.png$/iu, '.json');
    try {
      const metadataBytes = await readFile(resolve(sourceRoot, metadataName));
      value.metadataName = metadataName;
      value.metadataBytes = metadataBytes.length;
      value.metadataSha256 = sha256(metadataBytes);
      try {
        const metadata = JSON.parse(metadataBytes.toString('utf8'));
        if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
          throw new TypeError('Metadata must be a JSON object');
        }
        value.provenanceVerified = hasTraceableProvenance(metadata);
        value.metadataSourceMismatch = declaredSourceMismatch(metadata, name);
        if (Object.hasOwn(metadata, 'registration')) value.registration = metadata.registration;
        if (Object.hasOwn(metadata, 'canvas')) value.canvas = metadata.canvas;
      } catch {
        value.metadataError = true;
      }
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
      value.metadataMissing = true;
    }
    return value;
  }));
}

function assetSpecs(plan) {
  const specs = [];
  const manifestFigures = {};
  const add = (key, value, figureId, plane) => {
    if (!value) return null;
    specs.push({key, sourceName: value.sourceName, figureId, plane, source: value});
    return key;
  };
  for (const figure of FIGURES) {
    const planned = plan.figures[figure.id];
    if (!planned) continue;
    const output = {canvas: planned.canvas, base: null, skins: {}, clothing: {}, items: {}};
    if (figure.group === 'human') {
      for (const [index, value] of Object.entries(planned.skins)) {
        output.skins[index] = add(`figure-${figure.id}-skin-${index}`, value, figure.id, 'base');
      }
      for (const [index, value] of Object.entries(planned.clothing)) {
        output.clothing[index] = add(`figure-${figure.id}-clothing-${index}`, value, figure.id, 'clothing');
      }
    } else {
      output.base = add(`figure-${figure.id}-base`, planned.base, figure.id, 'base');
    }
    for (const [itemId, layers] of Object.entries(planned.items)) {
      output.items[itemId] = {
        rear: add(`item-${itemId}-${figure.id}-rear`, layers.rear, figure.id, 'rear'),
        front: add(`item-${itemId}-${figure.id}-front`, layers.front, figure.id, 'front'),
      };
      if (!output.items[itemId].rear) delete output.items[itemId].rear;
      if (!output.items[itemId].front) delete output.items[itemId].front;
    }
    manifestFigures[figure.id] = output;
  }
  return {specs, manifestFigures};
}

function moduleUrl(value) {
  if (/^[A-Za-z]:[\\/]/u.test(value)) return pathToFileURL(value).href;
  if (value.startsWith('.')) return new URL(value, import.meta.url).href;
  return value;
}

export async function encodeAvatarSource(page, sourceBytes, registration, targetCanvas) {
  return page.evaluate(async ({dataUrl, widths, registration, targetCanvas}) => {
    const image = new Image();
    image.src = dataUrl;
    await image.decode();
    const sourceScan = document.createElement('canvas');
    sourceScan.width = image.naturalWidth;
    sourceScan.height = image.naturalHeight;
    const sourceContext = sourceScan.getContext('2d', {willReadFrequently: true});
    sourceContext.drawImage(image, 0, 0);
    const sourcePixels = sourceContext.getImageData(0, 0, sourceScan.width, sourceScan.height).data;
    // A layer is a cutout only when its decoded source has genuine background
    // pixels. Uniform alpha-254 rectangles remain backgrounds, not cutouts.
    let sourceHasFullyTransparentPixel = false;
    for (let offset = 3; offset < sourcePixels.length; offset += 4) {
      if (sourcePixels[offset] === 0) {
        sourceHasFullyTransparentPixel = true;
        break;
      }
    }
    const scan = document.createElement('canvas');
    scan.width = targetCanvas.width;
    scan.height = targetCanvas.height;
    const scanContext = scan.getContext('2d', {willReadFrequently: true});
    scanContext.setTransform(registration.scale, 0, 0, registration.scale, registration.x, registration.y);
    scanContext.drawImage(image, 0, 0);
    scanContext.resetTransform();
    const pixels = scanContext.getImageData(0, 0, scan.width, scan.height).data;
    let hasVisiblePixel = false;
    for (let offset = 3; offset < pixels.length; offset += 4) {
      if (pixels[offset] > 0) hasVisiblePixel = true;
      if (hasVisiblePixel) break;
    }
    const variants = [];
    for (const requestedWidth of widths) {
      if (requestedWidth > scan.width) continue;
      const requestedHeight = Math.round(scan.height * requestedWidth / scan.width);
      const canvas = document.createElement('canvas');
      canvas.width = requestedWidth;
      canvas.height = requestedHeight;
      canvas.getContext('2d').drawImage(
        scan,
        0, 0, scan.width, scan.height,
        0, 0, canvas.width, canvas.height,
      );
      const blob = await new Promise((resolveBlob) => canvas.toBlob(resolveBlob, 'image/webp', 0.88));
      if (!blob || blob.type !== 'image/webp') throw new Error('WebP encoding unavailable');
      variants.push({
        width: canvas.width,
        height: canvas.height,
        bytes: Array.from(new Uint8Array(await blob.arrayBuffer())),
      });
    }
    return {
      sourceWidth: image.naturalWidth,
      sourceHeight: image.naturalHeight,
      canvasWidth: scan.width,
      canvasHeight: scan.height,
      sourceHasFullyTransparentPixel,
      hasVisiblePixel,
      variants,
    };
  }, {
    dataUrl: `data:image/png;base64,${sourceBytes.toString('base64')}`,
    widths: nonUpscaledWidths(targetCanvas, registration),
    registration,
    targetCanvas,
  });
}

export function rasterIssue(result) {
  if (!result.sourceHasFullyTransparentPixel) return 'missing-transparency';
  if (!result.hasVisiblePixel) return 'empty-after-registration';
  if (result.variants.length === 0 || result.variants[0].width !== 256) return 'missing-256-fallback';
  return null;
}

function missingFromManifest(manifestFigures) {
  const missing = [];
  for (const figure of FIGURES) {
    const art = manifestFigures[figure.id];
    if (figure.group === 'human') {
      for (let index = 0; index < 4; index += 1) if (!art?.skins?.[index]) missing.push(`${figure.id}:skin:${index}`);
      for (let index = 0; index < 6; index += 1) if (!art?.clothing?.[index]) missing.push(`${figure.id}:clothing:${index}`);
    } else if (!art?.base) {
      missing.push(`${figure.id}:base`);
    }
    for (const item of ITEMS.filter(({id}) => isCompatible(id, figure.id))) {
      if (!art?.items?.[item.id] || Object.keys(art.items[item.id]).length === 0) {
        missing.push(`${figure.id}:item:${item.id}`);
      }
    }
  }
  return missing.sort();
}

function manifestModule(value, smallUrls) {
  return `// Generated by scripts/build-avatar-art.mjs. Do not edit by hand.\n`
    + `function deepFreeze(value) {\n`
    + `  if (value && typeof value === 'object' && !Object.isFrozen(value)) {\n`
    + `    for (const child of Object.values(value)) deepFreeze(child);\n`
    + `    Object.freeze(value);\n`
    + `  }\n`
    + `  return value;\n`
    + `}\n\n`
    + `export const AVATAR_ART = deepFreeze(${JSON.stringify(value, null, 2)});\n\n`
    + `export const AVATAR_SMALL_URLS = Object.freeze(${JSON.stringify(smallUrls, null, 2)});\n`;
}

export async function buildAvatarArt({
  sourceRoot = SOURCE_ROOT,
  outputRoot = OUTPUT_ROOT,
  manifestPath = MANIFEST_PATH,
  reportPath = REPORT_PATH,
  playwrightModule = process.env.PLAYWRIGHT_MODULE ?? 'playwright',
  executablePath = process.env.BROWSER_EXECUTABLE,
} = {}) {
  const sourceEntries = await inventoryAvatarSources(sourceRoot);
  const plan = planAvatarSources(sourceEntries);
  const {specs, manifestFigures} = assetSpecs(plan);
  await mkdir(outputRoot, {recursive: true});
  await mkdir(dirname(manifestPath), {recursive: true});
  const {chromium} = await import(moduleUrl(playwrightModule));
  const browser = await chromium.launch({headless: true, ...(executablePath ? {executablePath} : {})});
  const page = await browser.newPage();
  const assets = {};
  const invalid = [...plan.invalid];
  try {
    for (const spec of specs) {
      const plannedLayer = spec.source;
      const registration = plannedLayer.registration;
      let sourceBytes;
      let result;
      try {
        sourceBytes = await readFile(resolve(sourceRoot, spec.sourceName));
        result = await encodeAvatarSource(page, sourceBytes, registration, plannedLayer.targetCanvas);
      } catch {
        invalid.push({
          key: spec.key,
          sourceName: spec.sourceName,
          reason: 'decode-failed',
        });
        continue;
      }
      const issue = rasterIssue(result);
      if (issue) {
        invalid.push({key: spec.key, sourceName: spec.sourceName, reason: issue});
        continue;
      }
      const variants = [];
      for (const variant of result.variants) {
        const bytes = Buffer.from(variant.bytes);
        const filename = `${spec.key}-${variant.width}.webp`;
        await writeFile(resolve(outputRoot, filename), bytes);
        variants.push({
          width: variant.width,
          height: variant.height,
          url: `../../../trainer/assets/avatar-shop/${filename}`,
          bytes: bytes.length,
          sha256: sha256(bytes),
        });
      }
      assets[spec.key] = {
        key: spec.key,
        figureId: spec.figureId,
        plane: spec.plane,
        sourceName: spec.sourceName,
        sourceWidth: result.sourceWidth,
        sourceHeight: result.sourceHeight,
        canvasWidth: result.canvasWidth,
        canvasHeight: result.canvasHeight,
        sourceBytes: sourceBytes.length,
        sourceSha256: sha256(sourceBytes),
        metadataName: plannedLayer?.metadataName,
        metadataBytes: plannedLayer?.metadataBytes,
        metadataSha256: plannedLayer?.metadataSha256,
        registration,
        registrationExplicit: plannedLayer.registrationExplicit,
        registeredBounds: plannedLayer?.registeredBounds,
        derivationSha256: sha256(Buffer.concat([
          sourceBytes,
          Buffer.from('\0'),
          Buffer.from(JSON.stringify(registration)),
        ])),
        width: variants.at(-1).width,
        height: variants.at(-1).height,
        variants,
        fallbackUrl: variants[0].url,
        outputBytes: variants.reduce((sum, variant) => sum + variant.bytes, 0),
      };
    }
  } finally {
    await browser.close();
  }

  for (const figure of Object.values(manifestFigures)) {
    if (figure.base && !assets[figure.base]) figure.base = null;
    for (const [index, key] of Object.entries(figure.skins)) if (!assets[key]) delete figure.skins[index];
    for (const [index, key] of Object.entries(figure.clothing)) if (!assets[key]) delete figure.clothing[index];
    for (const [itemId, layers] of Object.entries(figure.items)) {
      for (const [plane, key] of Object.entries(layers)) if (!assets[key]) delete layers[plane];
      if (Object.keys(layers).length === 0) delete figure.items[itemId];
    }
  }
  for (const [figureId, figure] of Object.entries(manifestFigures)) {
    if (!figure.base && !figure.skins['0']) delete manifestFigures[figureId];
  }

  const missing = missingFromManifest(manifestFigures);
  const smallUrls = Object.values(assets).map(({fallbackUrl}) => fallbackUrl);
  const smallBytes = Object.values(assets).reduce((sum, asset) => sum + asset.variants[0].bytes, 0);
  const totalBytes = Object.values(assets).reduce((sum, asset) => sum + asset.outputBytes, 0);
  const coverage = {
    complete: missing.length === 0 && plan.misaligned.length === 0 && invalid.length === 0,
    ready: missing.length === 0 && plan.misaligned.length === 0 && invalid.length === 0 && smallBytes <= SMALL_BUDGET,
    missing,
    misaligned: plan.misaligned,
    invalid,
    ignored: plan.ignored,
    assetCount: Object.keys(assets).length,
    smallBytes,
    totalBytes,
    smallBudgetBytes: SMALL_BUDGET,
  };
  const manifest = {assets, figures: manifestFigures, coverage};
  const report = {
    generatedAt: new Date().toISOString(),
    coverage,
    sources: sourceEntries.map(({
      name, width, height, bytes, sha256: hash,
      metadataName, metadataBytes, metadataSha256, registration, canvas, invalidPng,
      metadataMissing, metadataError, provenanceVerified, metadataSourceMismatch,
    }) => ({
      name, width, height, bytes, sha256: hash,
      ...(metadataName ? {metadataName, metadataBytes, metadataSha256} : {}),
      ...(registration ? {registration} : {}),
      ...(canvas ? {canvas} : {}),
      ...(invalidPng ? {invalidPng: true} : {}),
      ...(metadataMissing ? {metadataMissing: true} : {}),
      ...(metadataError ? {metadataError: true} : {}),
      ...(provenanceVerified ? {provenanceVerified: true} : {}),
      ...(metadataSourceMismatch ? {metadataSourceMismatch} : {}),
    })),
    assets: Object.fromEntries(Object.entries(assets).map(([key, asset]) => [key, {
      sourceName: asset.sourceName,
      sourceSha256: asset.sourceSha256,
      sourceBytes: asset.sourceBytes,
      ...(asset.metadataName ? {
        metadataName: asset.metadataName,
        metadataBytes: asset.metadataBytes,
        metadataSha256: asset.metadataSha256,
      } : {}),
      registration: asset.registration,
      registrationExplicit: asset.registrationExplicit,
      registeredBounds: asset.registeredBounds,
      canvasWidth: asset.canvasWidth,
      canvasHeight: asset.canvasHeight,
      derivationSha256: asset.derivationSha256,
      outputBytes: asset.outputBytes,
      variants: asset.variants,
    }])),
  };
  await writeFile(manifestPath, manifestModule(manifest, smallUrls), 'utf8');
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return report;
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
  const report = await buildAvatarArt();
  process.stdout.write(`${JSON.stringify({
    assets: report.coverage.assetCount,
    complete: report.coverage.complete,
    ready: report.coverage.ready,
    missing: report.coverage.missing.length,
    misaligned: report.coverage.misaligned.length,
    invalid: report.coverage.invalid.length,
    smallBytes: report.coverage.smallBytes,
    totalBytes: report.coverage.totalBytes,
  })}\n`);
  if (report.coverage.misaligned.length > 0 || report.coverage.invalid.length > 0) process.exitCode = 1;
}
