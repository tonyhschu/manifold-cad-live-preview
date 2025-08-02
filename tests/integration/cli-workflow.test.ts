/**
 * CLI Workflow Integration Test
 * 
 * Tests the complete CLI workflow from project creation to dev server startup.
 * Verifies the single-server architecture works end-to-end.
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

describe('CLI Workflow Integration', () => {
  let testWorkspaceDir: string;
  let devProcess: ChildProcess | null = null;

  beforeAll(async () => {
    // Create temporary workspace for CLI tests
    testWorkspaceDir = path.join(__dirname, '../temp/cli-test-workspace');
    await fs.mkdir(testWorkspaceDir, { recursive: true });
  });

  afterAll(async () => {
    // Cleanup test workspace
    try {
      await fs.rm(testWorkspaceDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  afterEach(async () => {
    // Kill dev process after each test
    if (devProcess) {
      devProcess.kill('SIGTERM');
      devProcess = null;
    }
  });

  it('should create a new project with CLI', async () => {
    const projectName = 'test-cli-project';
    const projectPath = path.join(testWorkspaceDir, projectName);

    // Run CLI create command using the correct create-app tool
    const createResult = await runCommand('node', [path.join(process.cwd(), 'packages/create-app/bin/index.js'), projectName, '--no-install'], {
      cwd: testWorkspaceDir,
      timeout: 30000
    });

    expect(createResult.exitCode).toBe(0);

    // Verify project structure was created
    const mainExists = await fs.access(path.join(projectPath, 'main.ts')).then(() => true).catch(() => false);
    expect(mainExists).toBe(true);

    const packageJsonExists = await fs.access(path.join(projectPath, 'package.json')).then(() => true).catch(() => false);
    expect(packageJsonExists).toBe(true);

    const tsconfigExists = await fs.access(path.join(projectPath, 'tsconfig.json')).then(() => true).catch(() => false);
    expect(tsconfigExists).toBe(true);

    // Verify package.json has correct dependencies
    const packageJsonContent = await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);

    expect(packageJson.dependencies).toHaveProperty('manifold-3d');
    expect(packageJson.dependencies).toHaveProperty('@manifold-studio/configurator');
    expect(packageJson.dependencies).toHaveProperty('@manifold-studio/wrapper');
  }, 45000);

  it('should start dev server on created project', async () => {
    const projectName = 'test-dev-project';
    const projectPath = path.join(testWorkspaceDir, projectName);

    // Create project first using the correct create-app tool
    await runCommand('node', [path.join(process.cwd(), 'packages/create-app/bin/index.js'), projectName, '--no-install'], {
      cwd: testWorkspaceDir,
      timeout: 30000
    });

    // Start dev server
    const { process: proc, logs } = await startDevServerAsync(projectPath);
    devProcess = proc;

    // Wait for server to start
    await waitForServerStart(logs, 15000);

    // Verify single server is running (not dual server)
    const allLogs = logs.join('\n');
    expect(allLogs).toContain('🌐 UI Server:');
    expect(allLogs).toContain('localhost:3000');
    
    // Should NOT contain pipeline server references
    expect(allLogs).not.toContain('Pipeline Server:');
    expect(allLogs).not.toContain('localhost:3001');

    // Verify temp files are generated
    const tempDir = path.join(projectPath, 'temp');
    const pipelineJsExists = await fs.access(path.join(tempDir, 'pipeline.js')).then(() => true).catch(() => false);
    const manifestExists = await fs.access(path.join(tempDir, 'manifest.json')).then(() => true).catch(() => false);

    expect(pipelineJsExists).toBe(true);
    expect(manifestExists).toBe(true);
  }, 60000);

  it('should handle project with components directory', async () => {
    const projectName = 'test-components-project';
    const projectPath = path.join(testWorkspaceDir, projectName);

    // Create project using the correct create-app tool
    await runCommand('node', [path.join(process.cwd(), 'packages/create-app/bin/index.js'), projectName, '--no-install'], {
      cwd: testWorkspaceDir,
      timeout: 30000
    });

    // Add components directory and file
    const componentsDir = path.join(projectPath, 'components');
    await fs.mkdir(componentsDir, { recursive: true });
    
    const componentContent = `
// Test component for integration testing
import { Manifold, P, createConfig } from "@manifold-studio/wrapper";

// Export parametric config as default for UI compatibility
export default createConfig(
  {
    radius: P.number(5, 1, 20, 0.5)
  },
  (params) => Manifold.sphere(params.radius),
  {
    name: "Test Component",
    description: "A test component for integration testing"
  }
);
`;
    
    await fs.writeFile(path.join(componentsDir, 'test-component.ts'), componentContent);

    // Start dev server
    const { process: proc, logs } = await startDevServerAsync(projectPath);
    devProcess = proc;

    // Wait for compilation
    await waitForServerStart(logs, 15000);

    // Verify both main and component are discovered
    const manifestPath = path.join(projectPath, 'temp', 'manifest.json');
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);



    // Models is an array, not an object
    expect(Array.isArray(manifest.models)).toBe(true);
    expect(manifest.models.length).toBeGreaterThanOrEqual(2);

    // Find main model
    const mainModel = manifest.models.find((m: any) => m.id === 'main');
    expect(mainModel).toBeDefined();

    // Find component model
    const componentModel = manifest.models.find((m: any) => m.id === 'components/test-component');
    expect(componentModel).toBeDefined();
    expect(componentModel.name).toBe('Test Component');
  }, 60000);
});

// Helper functions
async function runCommand(
  command: string, 
  args: string[], 
  options: { cwd: string; timeout: number }
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { cwd: options.cwd });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });
    
    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });
    
    proc.on('close', (code) => {
      resolve({ exitCode: code || 0, stdout, stderr });
    });
    
    proc.on('error', reject);
    
    // Timeout handling
    setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error(`Command timed out after ${options.timeout}ms`));
    }, options.timeout);
  });
}

async function startDevServerAsync(projectPath: string): Promise<{ process: ChildProcess; logs: string[] }> {
  const logs: string[] = [];

  // Use the correct CLI path for the configurator dev command
  const proc = spawn('node', [path.join(process.cwd(), 'packages/configurator/dist/cli/index.js'), 'dev'], {
    cwd: projectPath,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Capture logs
  proc.stdout?.on('data', (data) => {
    const log = data.toString();
    logs.push(log);
    console.log('[CLI DEV]', log);
  });

  proc.stderr?.on('data', (data) => {
    const log = data.toString();
    logs.push(log);
    console.error('[CLI DEV ERROR]', log);
  });

  return { process: proc, logs };
}

async function waitForServerStart(logs: string[], timeoutMs: number): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    const allLogs = logs.join('\n');
    
    // Look for server start indicators
    if (allLogs.includes('🌐 UI Server:') || allLogs.includes('Local:')) {
      // Wait a bit more for full startup
      await new Promise(resolve => setTimeout(resolve, 2000));
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  throw new Error(`Dev server did not start within ${timeoutMs}ms`);
}
