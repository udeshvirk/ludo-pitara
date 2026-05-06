// Rasterize public/favicon.svg to the PNG sizes the manifest + iOS need.
// Run with: node scripts/gen-icons.mjs

import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const src = resolve(root, 'public/favicon.svg');

const targets = [
  { out: 'public/pwa-192x192.png', size: 192 },
  { out: 'public/pwa-512x512.png', size: 512 },
  { out: 'public/apple-touch-icon.png', size: 180 },
];

const svg = await readFile(src);

for (const { out, size } of targets) {
  const png = await sharp(svg, { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await writeFile(resolve(root, out), png);
  console.log(`wrote ${out}`);
}
