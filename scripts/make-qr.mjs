// Generates the conference QR code for /card: public/card/qr.svg and public/card/qr.png (1024 px).
// Run by hand (`npm run qr`) after profile.siteUrl changes; commit both outputs. src/__tests__/lib/qr.test.ts
// fails if the committed SVG drifts from profile.siteUrl. Imports profile.ts directly (D21): needs Node >= 22.18
// to strip the types (this box runs 24).
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import { profile } from '../src/lib/data/profile.ts';

const url = `${profile.siteUrl}/card?src=qr`;
// Keep in sync with src/__tests__/lib/qr.test.ts.
const options = { margin: 2, errorCorrectionLevel: 'M', color: { dark: '#0a0a0f', light: '#ffffff' } };

const outDir = new URL('../public/card/', import.meta.url);
await mkdir(outDir, { recursive: true });

const svgPath = new URL('qr.svg', outDir);
const pngPath = new URL('qr.png', outDir);
// Written as returned (it already ends with a newline): the test compares it byte for byte.
await writeFile(svgPath, await QRCode.toString(url, { ...options, type: 'svg' }));
await QRCode.toFile(fileURLToPath(pngPath), url, { ...options, type: 'png', width: 1024 });

console.log(`QR for ${url} → public/card/qr.svg, public/card/qr.png`);
