import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseMemory } from '@/lib/concierge/contract';
import { memoryV2 } from '../fixtures/concierge';

// .harness/concierge-check.mjs (P3-09) seeds the browser's memory cache with this file, since a plain .mjs can't
// import the TypeScript fixture: it has to stay the memoryV2 fixture, and a body the page accepts.
const json = readFileSync(join(process.cwd(), '.harness/fixtures/memory-v2.json'), 'utf8');

describe('.harness/fixtures/memory-v2.json', () => {
  it('is the memoryV2 fixture', () => {
    expect(JSON.parse(json)).toEqual(memoryV2);
  });

  it('parses as a v2 body', () => {
    expect(parseMemory(json)).toEqual(memoryV2);
  });
});
