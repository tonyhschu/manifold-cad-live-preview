import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Enable parallel execution for independent tests
    pool: 'threads',
    poolOptions: {
      threads: {
        // Limit concurrent threads to avoid resource exhaustion
        maxThreads: 4,
        minThreads: 1,
      }
    },
    // Increase timeout for integration tests
    testTimeout: 60000, // 1 minute per test
    // Global setup timeout
    hookTimeout: 180000, // 3 minutes for beforeAll/afterAll
  },
});
