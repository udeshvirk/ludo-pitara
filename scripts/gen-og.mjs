// Build the 1200×630 social preview card (public/og-image.png) from the
// gameplay screenshots in public/screenshots/. Run by hand after
// refreshing screenshots: node scripts/gen-og.mjs
// The output is committed; this is not part of the build.

import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const W = 1200, H = 630;

const bg = Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g" cx="30%" cy="20%" r="90%">
      <stop offset="0" stop-color="#3a1a5e"/><stop offset="1" stop-color="#190a2e"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <text x="70" y="200" font-family="Arial Rounded MT Bold, Helvetica, Arial" font-size="76" font-weight="700" fill="#fff8e7">Ludo Pitara</text>
  <text x="72" y="262" font-family="Helvetica, Arial" font-size="32" fill="rgba(255,248,231,0.75)">Ludo · Snakes &amp; Ladders · Dice</text>
  <g font-family="Helvetica, Arial" font-size="30" font-weight="700" fill="#ffd966">
    <text x="72" y="360">✓ Free, no ads</text>
    <text x="72" y="410">✓ Plays offline</text>
    <text x="72" y="460">✓ No sign-up</text>
  </g>
  <text x="72" y="555" font-family="Helvetica, Arial" font-size="24" fill="rgba(255,248,231,0.6)">udeshvirk.github.io/ludo-pitara</text>
</svg>`);

// Phone-shaped crops of the screenshots with a gold rim.
async function phone(file, h) {
  const w = Math.round(h * 585 / 1266);
  const r = Math.round(w * 0.09);
  const mask = Buffer.from(`<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${r}" fill="#fff"/></svg>`);
  const shot = await sharp(resolve(root, 'public/screenshots', file)).resize(w, h)
    .composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  const pad = 6;
  const rim = Buffer.from(`<svg width="${w + pad * 2}" height="${h + pad * 2}"><rect width="100%" height="100%" rx="${r + pad}" fill="#d4a017"/></svg>`);
  return sharp(rim).composite([{ input: shot, left: pad, top: pad }]).png().toBuffer();
}

const ph = 560;
const ludo = await phone('ludo.png', ph);
const snl = await phone('snakes-and-ladders.png', ph - 40);

await sharp(bg)
  .composite([
    { input: snl, left: 660, top: 55 },
    { input: ludo, left: 900, top: 30 },
  ])
  .png({ compressionLevel: 9 })
  .toFile(resolve(root, 'public/og-image.png'));
console.log('wrote public/og-image.png');
