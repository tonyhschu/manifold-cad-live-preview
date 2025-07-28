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
  },
});
