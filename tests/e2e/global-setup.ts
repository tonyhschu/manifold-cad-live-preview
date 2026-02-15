import { FullConfig } from '@playwright/test';
import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Global setup for Playwright E2E tests
 * 
 * Sets up a test project and starts the Manifold Studio CLI dev server
 * for browser-based testing of the single-server architecture.
 */

let devServerProcess: ChildProcess | null = null;
const TEST_PROJECT_DIR = path.join(process.cwd(), 'reference-project');

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up E2E test environment...');
  
  try {
    console.log(`📁 Using existing test project: ${TEST_PROJECT_DIR}`);

    // Verify the test project exists
    try {
      await fs.access(TEST_PROJECT_DIR);
      console.log('✅ Test project directory found');
    } catch (error) {
      throw new Error(`Test project directory not found: ${TEST_PROJECT_DIR}`);
    }

    // Start the dev server using npm run dev (which uses manifold-studio dev)
    console.log('🌐 Starting dev server...');
    devServerProcess = spawn('npm', ['run', 'dev'], {
      cwd: TEST_PROJECT_DIR,
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'test' }
    });

    // Log server output for debugging
    devServerProcess.stdout?.on('data', (data) => {
      console.log('[DEV SERVER]', data.toString());
    });

    devServerProcess.stderr?.on('data', (data) => {
      console.error('[DEV SERVER ERROR]', data.toString());
    });
    
    // Wait for server to be ready
    await waitForServer('http://localhost:4000', 30000);
    
    console.log('✅ E2E test environment ready!');
    
  } catch (error) {
    console.error('❌ Failed to set up E2E test environment:', error);
    throw error;
  }
}



async function waitForServer(url: string, timeout: number): Promise<void> {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch (error) {
      // Server not ready yet, continue waiting
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error(`Server at ${url} did not start within ${timeout}ms`);
}

export default globalSetup;
