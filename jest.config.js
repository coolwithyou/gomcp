/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.spec.ts'],
  setupFiles: ['<rootDir>/test-setup.js'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts', // Exclude CLI entry point
    '!src/ui.ts', // Exclude UI interactions
    '!src/activation.ts', // Exclude activation logic
    '!src/claude-settings.ts', // Exclude Claude-specific settings
    '!src/utils/prompt.ts', // Exclude interactive prompts
    '!src/**/__mocks__/**', // Exclude mock files
    '!src/**/__tests__/**', // Exclude test files
  ],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  modulePathIgnorePatterns: ['/dist/'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 35,
      lines: 30,
      statements: 30,
    },
  },
};