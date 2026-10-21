import fs from 'fs';
import path from 'path';

// WCAG 2 relative luminance and contrast ratio, shared by a11y-new-pages.test.tsx and design-tokens.test.ts.

export const luminance = (hex: string): number => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const ratio = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const css = () => fs.readFileSync(path.join(process.cwd(), 'src/app/globals.css'), 'utf8');

/** The hex a `--color-<name>` token is set to in globals.css. */
export const colour = (name: string): string => {
  const match = css().match(new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6})\\b`, 'i'));
  if (!match) throw new Error(`--color-${name} is not a hex in globals.css`);
  return match[1];
};
