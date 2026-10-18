/** @jest-environment node */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import QRCode from 'qrcode';
import { profile } from '@/lib/data';

// Duplicates the options in scripts/make-qr.mjs on purpose: the .mjs script can't be imported into Jest.
const options = {
  margin: 2,
  errorCorrectionLevel: 'M',
  color: { dark: '#0a0a0f', light: '#ffffff' },
} as const;

const publicCard = join(process.cwd(), 'public', 'card');

describe('committed QR code', () => {
  it('committed qr.svg encodes ${profile.siteUrl}/card?src=qr', async () => {
    const svg = await QRCode.toString(`${profile.siteUrl}/card?src=qr`, { ...options, type: 'svg' });
    expect(readFileSync(join(publicCard, 'qr.svg'), 'utf8')).toBe(svg);
  });

  it('committed qr.png is 1024 × 1024', () => {
    const png = readFileSync(join(publicCard, 'qr.png'));
    expect(png.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    expect(png.toString('ascii', 12, 16)).toBe('IHDR');
    expect(png.readUInt32BE(16)).toBe(1024);
    expect(png.readUInt32BE(20)).toBe(1024);
  });
});
