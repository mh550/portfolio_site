// Types for Jest's globals, so `npx tsc --noEmit` checks the tests too (the repo has no @types/jest).
// Type-only: @jest/globals ships with jest; the jest-dom import adds its matchers to `expect`.
// tsconfig includes this file, so app code also sees these names as types; Jest still provides them only in tests.
// If @types/jest is ever added, delete this file (its `declare var`s would clash with these `const`s).
import type * as JestGlobals from '@jest/globals';
import type {} from '@testing-library/jest-dom/jest-globals';

declare global {
  const describe: typeof JestGlobals.describe;
  const it: typeof JestGlobals.it;
  const test: typeof JestGlobals.test;
  const expect: typeof JestGlobals.expect;
  const beforeAll: typeof JestGlobals.beforeAll;
  const beforeEach: typeof JestGlobals.beforeEach;
  const afterAll: typeof JestGlobals.afterAll;
  const afterEach: typeof JestGlobals.afterEach;
  const jest: typeof JestGlobals.jest;
}
