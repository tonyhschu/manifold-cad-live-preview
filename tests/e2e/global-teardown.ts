import { FullConfig } from '@playwright/test';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Global teardown for Playwright E2E tests
 * 
 * Cleans up the test project and stops any running processes.
 */

const TEST_PROJECT_DIR = path.join(process.cwd(), 'tests/temp/e2e-test-project');

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up E2E test environment...');
  
  try {
    // Kill any remaining processes on port 3000
    try {
      const { spawn } = await import('child_process');
      const killProcess = spawn('pkill', ['-f', 'manifold-studio'], { stdio: 'ignore' });
      await new Promise(resolve => {
        killProcess.on('close', resolve);
        setTimeout(resolve, 2000); // Timeout after 2 seconds
      });
    } catch (error) {
      // Ignore errors - process might not exist
    }
    
    // Clean up test project directory
    await fs.rm(TEST_PROJECT_DIR, { recursive: true, force: true });
    
    console.log('✅ E2E test environment cleaned up!');
    
  } catch (error) {
    console.error('⚠️  Error during E2E cleanup:', error);
    // Don't throw - cleanup errors shouldn't fail the test run
  }
}

export default globalTeardown;
