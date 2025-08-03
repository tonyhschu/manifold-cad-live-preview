import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Use forks with singleFork for integration tests to avoid port conflicts
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // Ensure tests run completely sequentially
      }
    },
    // Increase timeout for integration tests
    testTimeout: 60000, // 1 minute per test
    // Global setup timeout
    hookTimeout: 180000, // 3 minutes for beforeAll/afterAll
    // Exclude published package tests from regular runs (they use published packages and may fail)
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/published-packages.test.ts' // Run these separately with npm run test:published
    ]
  },
});
