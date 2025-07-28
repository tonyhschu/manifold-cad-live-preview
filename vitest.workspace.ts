import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  // Each package in the workspace
  'packages/wrapper',
  'packages/configurator', 
  'packages/create-app',
  
  // Root-level integration tests
  {
    test: {
      include: ['tests/integration/**/*.test.ts'],
      name: 'integration',
      environment: 'node',
      // Run integration tests sequentially to avoid port conflicts
      pool: 'forks',
      poolOptions: {
        forks: {
          singleFork: true
        }
      }
    }
  }
])
