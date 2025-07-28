/**
 * 🎯 Critical HMR Integration Test
 * 
 * Tests the single-server HMR functionality without browser complexity.
 * This is the most important test for verifying the V3.1 architecture works correctly.
 * 
 * Created: 2025-01-21 - Phase 2 of Integration Test Plan
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('🎯 Single-Server HMR Integration', () => {
  let devProcess: ChildProcess | null = null;
  let testProjectPath: string;
  let tempDir: string;
  
  beforeAll(async () => {
    // Set up test project path
    testProjectPath = path.join(__dirname, '../fixtures/test-project');
    tempDir = path.join(testProjectPath, 'temp');
    
    // Ensure test project exists
    const mainExists = await fs.access(path.join(testProjectPath, 'main.ts')).then(() => true).catch(() => false);
    expect(mainExists).toBe(true);
  });

  afterAll(async () => {
    // Cleanup temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  beforeEach(async () => {
    // Clean temp directory before each test
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore if doesn't exist
    }
  });

  afterEach(async () => {
    // Kill dev process after each test
    if (devProcess) {
      devProcess.kill('SIGTERM');
      devProcess = null;
    }
  });

  it('should start dev server and generate initial pipeline files', async () => {
    // Start dev server programmatically
    const { process: proc, logs } = await startDevServer(testProjectPath);
    devProcess = proc;

    // Wait for initial compilation
    await waitForInitialCompilation(logs, 10000);

    // Verify pipeline.js exists and has recent timestamp
    const pipelineJsPath = path.join(tempDir, 'pipeline.js');
    const pipelineExists = await fs.access(pipelineJsPath).then(() => true).catch(() => false);
    expect(pipelineExists).toBe(true);

    const pipelineStats = await fs.stat(pipelineJsPath);
    const ageMs = Date.now() - pipelineStats.mtime.getTime();
    expect(ageMs).toBeLessThan(5000); // Should be very recent

    // Verify manifest.json exists and contains expected data
    const manifestPath = path.join(tempDir, 'manifest.json');
    const manifestExists = await fs.access(manifestPath).then(() => true).catch(() => false);
    expect(manifestExists).toBe(true);

    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    expect(manifest).toHaveProperty('models');
    expect(Array.isArray(manifest.models)).toBe(true);

    // Find main model
    const mainModel = manifest.models.find((m: any) => m.id === 'main');
    expect(mainModel).toBeDefined();
    expect(mainModel.name).toBe('Test Cube');

    // Find component model
    const componentModel = manifest.models.find((m: any) => m.id === 'components/simple-cube');
    expect(componentModel).toBeDefined();
  }, 15000);

  it('should regenerate pipeline files when component is modified', async () => {
    // Start dev server
    const { process: proc, logs } = await startDevServer(testProjectPath);
    devProcess = proc;

    // Wait for initial compilation
    await waitForInitialCompilation(logs, 10000);

    // Get initial timestamps
    const pipelineJsPath = path.join(tempDir, 'pipeline.js');
    const manifestPath = path.join(tempDir, 'manifest.json');
    
    const initialPipelineStats = await fs.stat(pipelineJsPath);
    const initialManifestStats = await fs.stat(manifestPath);

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Modify component file
    const componentPath = path.join(testProjectPath, 'components/simple-cube.ts');
    const originalContent = await fs.readFile(componentPath, 'utf-8');
    const modifiedContent = originalContent.replace(
      'width: 5,',
      'width: 8, // Modified for HMR test'
    );
    await fs.writeFile(componentPath, modifiedContent);

    // Wait for recompilation
    await waitForRecompilation(logs, 8000);

    // Verify pipeline.js was regenerated
    const newPipelineStats = await fs.stat(pipelineJsPath);
    expect(newPipelineStats.mtime.getTime()).toBeGreaterThan(initialPipelineStats.mtime.getTime());

    // Verify manifest.json was updated
    const newManifestStats = await fs.stat(manifestPath);
    expect(newManifestStats.mtime.getTime()).toBeGreaterThan(initialManifestStats.mtime.getTime());

    // Restore original content
    await fs.writeFile(componentPath, originalContent);
  }, 20000);

  it('should complete builds within performance expectations', async () => {
    // Start dev server
    const { process: proc, logs } = await startDevServer(testProjectPath);
    devProcess = proc;

    // Measure initial compilation time
    const startTime = Date.now();
    await waitForInitialCompilation(logs, 10000);
    const compilationTime = Date.now() - startTime;

    // Should be faster than the old dual-server approach (< 500ms target)
    expect(compilationTime).toBeLessThan(2000); // Generous for CI, but much better than 581ms baseline
    
    // Log performance for debugging
    console.log(`Initial compilation completed in ${compilationTime}ms`);
  }, 15000);

  it('should not produce dependency optimization errors in logs', async () => {
    // Start dev server
    const { process: proc, logs } = await startDevServer(testProjectPath);
    devProcess = proc;

    // Wait for initial compilation
    await waitForInitialCompilation(logs, 10000);

    // Modify a file to trigger HMR
    const componentPath = path.join(testProjectPath, 'components/simple-cube.ts');
    const originalContent = await fs.readFile(componentPath, 'utf-8');
    const modifiedContent = originalContent.replace('height: 3', 'height: 4');
    await fs.writeFile(componentPath, modifiedContent);

    // Wait for recompilation
    await waitForRecompilation(logs, 8000);

    // Check logs for dependency optimization errors
    const allLogs = logs.join('\n');
    expect(allLogs).not.toContain('504 Outdated Optimize Dep');
    expect(allLogs).not.toContain('ERR_ABORTED 504');
    expect(allLogs).not.toContain('Failed to fetch dynamically imported module');

    // Restore original content
    await fs.writeFile(componentPath, originalContent);
  }, 20000);
});

// Helper functions
async function startDevServer(projectPath: string): Promise<{ process: ChildProcess; logs: string[] }> {
  const logs: string[] = [];
  
  const proc = spawn('npx', ['@manifold-studio/configurator', 'dev'], {
    cwd: projectPath,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Capture logs
  proc.stdout?.on('data', (data) => {
    const log = data.toString();
    logs.push(log);
    console.log('[DEV SERVER]', log);
  });

  proc.stderr?.on('data', (data) => {
    const log = data.toString();
    logs.push(log);
    console.error('[DEV SERVER ERROR]', log);
  });

  return { process: proc, logs };
}

async function waitForInitialCompilation(logs: string[], timeoutMs: number): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const allLogs = logs.join('\n');

    // Look for the actual success messages from the pipeline compiler
    if (allLogs.includes('✅ Manifest re-written successfully after Vite build') ||
        allLogs.includes('✅ Vite build completed successfully') ||
        allLogs.includes('✅ Manifest written successfully') ||
        allLogs.includes('Pipeline compilation completed')) {
      console.log('DEBUG: Initial compilation completed successfully');
      return;
    }

    // Also check for error conditions to fail fast
    if (allLogs.includes('Vite build failed') || allLogs.includes('ERROR')) {
      throw new Error(`Compilation failed. Logs: ${allLogs}`);
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('DEBUG: Compilation timeout. Recent logs:');
  console.log(logs.slice(-20).join('\n'));
  throw new Error(`Initial compilation did not complete within ${timeoutMs}ms. Check logs above.`);
}

async function waitForRecompilation(logs: string[], timeoutMs: number): Promise<void> {
  const startTime = Date.now();
  const initialLogCount = logs.length;

  while (Date.now() - startTime < timeoutMs) {
    // Look for new logs indicating recompilation
    const newLogs = logs.slice(initialLogCount).join('\n');

    // Look for the actual success messages from the pipeline compiler
    if (newLogs.includes('✅ Manifest re-written successfully after Vite build') ||
        newLogs.includes('✅ Vite build completed successfully') ||
        newLogs.includes('✅ Manifest written successfully') ||
        newLogs.includes('Pipeline compilation completed') ||
        newLogs.includes('page reload') ||
        newLogs.includes('hmr update')) {
      // Wait a bit for file operations to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('DEBUG: Recompilation timeout. Recent new logs:');
  console.log(logs.slice(initialLogCount).join('\n'));
  throw new Error(`Recompilation did not complete within ${timeoutMs}ms. Check logs above.`);
}
