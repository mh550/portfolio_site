import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^framer-motion$': '<rootDir>/src/__mocks__/framer-motion.tsx',
    // No test can open a LiveKit connection (D42); livekit-server-sdk doesn't import livekit-client.
    '^livekit-client$': '<rootDir>/src/__mocks__/livekit-client.ts',
    '^@livekit/components-react$': '<rootDir>/src/__mocks__/livekit-components-react.tsx',
  },
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/.claude/', '<rootDir>/.next-check/'],
  modulePathIgnorePatterns: ['<rootDir>/.claude/', '<rootDir>/.next-check/'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
};

export default createJestConfig(config);
