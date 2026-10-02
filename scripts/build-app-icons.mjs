import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sharp = require(process.env.SHARP_MODULE || 'sharp');
const source = await readFile(resolve(root, 'docs/design/lejeadventure-logo-source.png'));
const metadata = await sharp(source).metadata();
if (metadata.format !== 'png' || metadata.width !== metadata.height || metadata.width < 512) {
  throw new Error('App icon source must be a square PNG of at least 512 pixels.');
}

const output = resolve(root, 'trainer/assets');
await mkdir(output, {recursive: true});
let totalBytes = 0;
for (const size of [32, 64, 180, 192, 512]) {
  const bytes = await sharp(source)
    .resize(size, size, {kernel: 'lanczos3', withoutEnlargement: true})
    .png({compressionLevel: 9, palette: true, colours: 256, dither: 0})
    .toBuffer();
  await writeFile(resolve(output, `lejeadventure-${size}.png`), bytes);
  totalBytes += bytes.length;
  process.stdout.write(`${size}x${size}: ${bytes.length} bytes\n`);
}
process.stdout.write(`Total: ${totalBytes} bytes\n`);
