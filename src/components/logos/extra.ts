// Hand-authored marks for what simple-icons 16.9.0 doesn't carry (D97); paths.ts stays generated (D78).
// LinkedIn: simple-icons removed LinkedIn's mark at the brand's request, so there is no siLinkedin. This "in" is
// drawn here (a rounded square with the i and the n cut out) after the shape of LinkedIn's own bug, not their
// artwork; their brand guidelines apply to how it is shown. Mail: a plain envelope, the flap's V cut out.
// Both cut their holes as separate subpaths, so Logo draws them with fill-rule evenodd.
import type { LogoPath } from './paths';

export interface ExtraPath extends LogoPath {
  fillRule: 'evenodd';
}

export const extraPaths = {
  linkedin: {
    title: 'LinkedIn',
    path:
      'M4 2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z' +
      'M5.25 6.5a1.75 1.75 0 1 0 3.5 0a1.75 1.75 0 1 0-3.5 0Z' +
      'M5.5 9.5h3v9h-3Z' +
      'M10 9.5h2.9v1.3c.5-.9 1.6-1.6 3.1-1.6 2.6 0 3.5 1.6 3.5 4.1v5.2h-3v-4.6c0-1.2-.3-2.1-1.5-2.1s-2.1.9-2.1 2.3v4.4H10Z',
    fillRule: 'evenodd',
  },
  mail: {
    title: 'Email',
    path:
      'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z' +
      'M4.4 7.2 12 12.3l7.6-5.1-.9-1.4-6.7 4.4-6.7-4.4Z',
    fillRule: 'evenodd',
  },
} satisfies Record<string, ExtraPath>;

export type ExtraKey = keyof typeof extraPaths;
