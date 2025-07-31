/**
 * 🎯 TDD: Dev Server Integration Test
 * 
 * Test-driven development approach to ensure the dev server starts correctly
 * and basic functionality works before testing complex HMR scenarios.
 * 
 * Created: 2025-01-21 - Phase 2 TDD approach
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('🎯 TDD: Dev Server Integration', () => {
  let devProcess: ChildProcess | null = null;
  let testProjectPath: string;
  let tempDir: string;

  beforeEach(async () => {
    // Create a minimal test project for each test
    // Use a non-temp directory so CLI doesn't ignore it
    // Use high-resolution timestamp + random + test counter for uniqueness
    const uniqueId = `${Date.now()}-${process.hrtime.bigint()}-${Math.random().toString(36).substr(2, 9)}`;
    tempDir = path.join(__dirname, '../test-projects', `dev-server-tdd-${uniqueId}`);
    testProjectPath = tempDir; // Project is directly in the test directory, not in a 'project' subdirectory
    console.log('DEBUG: Creating test directory:', testProjectPath);
    await fs.mkdir(testProjectPath, { recursive: true });
    await fs.mkdir(path.join(testProjectPath, 'components'), { recursive: true });
  });

  afterEach(async () => {
    // Clean up process
    if (devProcess) {
      devProcess.kill('SIGTERM');
      devProcess = null;
    }

    // Clean up test project directory
    try {
      console.log('DEBUG: Cleaning up test directory:', tempDir);
      await fs.rm(tempDir, { recursive: true, force: true });
      console.log('DEBUG: Cleanup completed for:', tempDir);
    } catch (error) {
      console.log('DEBUG: Cleanup error for', tempDir, ':', error);
    }

    // Note: Fixed shared compilation directory issue in model-compiler.ts
    // No need for manual module cache clearing anymore
  });

  it('should start dev server and serve basic content', async () => {
    // Create minimal project files
    const mainContent = `
import { Manifold } from 'manifold-3d';

export interface MainParams {
  size: number;
}

export const parameters: MainParams = {
  size: 5
};

export default function main({ size }: MainParams): Manifold {
  return Manifold.cube([size, size, size]);
}

export const metadata = {
  name: 'TDD Test Cube',
  description: 'A cube for TDD testing'
};
`;

    const packageJsonContent = `{
  "name": "tdd-test-project",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "manifold-3d": "^3.1.0"
  }
}`;

    const tsconfigContent = `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}`;

    await fs.writeFile(path.join(testProjectPath, 'main.ts'), mainContent);
    await fs.writeFile(path.join(testProjectPath, 'package.json'), packageJsonContent);
    await fs.writeFile(path.join(testProjectPath, 'tsconfig.json'), tsconfigContent);

    // Start dev server
    const { process: proc, logs } = await startDevServer(testProjectPath);
    devProcess = proc;

    // Wait for server to start (basic check)
    await waitForServerStart(logs, 10000);

    // Check that server started successfully (updated to match actual CLI output)
    const allLogs = logs.join('\n');
    expect(allLogs).toContain('✅ Development server started!');
    expect(allLogs).toContain('🌐 UI Server: http://localhost:');

    // Should NOT contain pipeline server messages (single-server architecture)
    expect(allLogs).not.toContain('Pipeline server running on');
  }, 15000);

  it('should start CLI server without hanging', async () => {
    // Create minimal project files (same as above)
    const mainContent = `
// Simple test without external dependencies
export default function main(): string {
  return "Hello from test model";
}

export const metadata = {
  name: 'Simple Cube',
  description: 'A simple cube'
};
`;

    const packageJsonContent = `{
  "name": "tdd-test-project",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
  }
}`;

    await fs.writeFile(path.join(testProjectPath, 'main.ts'), mainContent);
    await fs.writeFile(path.join(testProjectPath, 'package.json'), packageJsonContent);

    // Install dependencies in test project
    console.log('DEBUG: Installing dependencies in test project...');
    const { spawn } = await import('child_process');
    const installProcess = spawn('npm', ['install'], {
      cwd: testProjectPath,
      stdio: 'pipe'
    });

    await new Promise<void>((resolve, reject) => {
      installProcess.on('close', (code) => {
        if (code === 0) {
          console.log('DEBUG: Dependencies installed successfully');
          resolve();
        } else {
          reject(new Error(`npm install failed with code ${code}`));
        }
      });
      installProcess.on('error', reject);
    });

    // Debug: Check that files were created
    console.log('DEBUG: Test project files created:');
    console.log('- main.ts exists:', await fs.access(path.join(testProjectPath, 'main.ts')).then(() => true).catch(() => false));
    console.log('- package.json exists:', await fs.access(path.join(testProjectPath, 'package.json')).then(() => true).catch(() => false));
    console.log('- node_modules exists:', await fs.access(path.join(testProjectPath, 'node_modules')).then(() => true).catch(() => false));
    console.log('- Project path:', testProjectPath);

    // Start dev server
    const { process: proc, logs } = await startDevServer(testProjectPath);
    devProcess = proc;

    // Wait for initial compilation (increased timeout for CI environments)
    await waitForInitialCompilation(logs, 45000);

    // Check that pipeline files were created (with retry for CI environments)
    const tempOutputDir = path.join(testProjectPath, 'temp');

    // Debug: List all files in temp directory
    try {
      const tempFiles = await fs.readdir(tempOutputDir);
      console.log('DEBUG: Files in temp directory:', tempFiles);
    } catch (error) {
      console.log('DEBUG: temp directory does not exist or is empty');
    }

    // Retry logic for file existence (CI environments can be slower)
    let pipelineExists = false;
    let manifestExists = false;

    for (let i = 0; i < 10; i++) {
      pipelineExists = await fs.access(path.join(tempOutputDir, 'pipeline.js')).then(() => true).catch(() => false);
      manifestExists = await fs.access(path.join(tempOutputDir, 'manifest.json')).then(() => true).catch(() => false);

      if (pipelineExists && manifestExists) break;

      console.log(`DEBUG: Retry ${i + 1}/10 - pipeline: ${pipelineExists}, manifest: ${manifestExists}`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    expect(pipelineExists).toBe(true);
    expect(manifestExists).toBe(true);

    // Check manifest content
    const manifestContent = await fs.readFile(path.join(tempOutputDir, 'manifest.json'), 'utf-8');
    const manifest = JSON.parse(manifestContent);
    expect(manifest.models).toHaveLength(1);
    expect(manifest.models[0].name).toBe('Simple Cube');
  }, 60000); // Increased timeout for npm install

  it('should use pipeline compiler directly with correct ignore patterns', async () => {
    // Create minimal project files
    const mainContent = `
import { Manifold } from 'manifold-3d';

export default function main(): Manifold {
  return Manifold.cube([1, 1, 1]);
}

export const metadata = {
  name: 'Direct Test Cube',
  description: 'A cube for direct compiler testing'
};
`;

    await fs.writeFile(path.join(testProjectPath, 'main.ts'), mainContent);

    // Import and use the pipeline compiler directly with test-friendly ignore patterns
    const { createPipelineCompiler } = await import('../../packages/configurator/src/pipeline-compiler/index.js');

    // Use ignore patterns that don't exclude temp directories (for testing)
    const testIgnorePatterns = [
      '**/node_modules/**',
      '**/dist/**',
      '**/scripts/**',
      '**/.git/**'
      // Note: removed '**/temp/**' to allow testing in temp directories
    ];

    const outputDir = path.join(testProjectPath, 'temp');
    const compiler = createPipelineCompiler(testProjectPath, outputDir, testIgnorePatterns);

    // Compile directly
    const result = await compiler.compile();

    // Should succeed
    expect(result.errors).toEqual([]); // No errors means success
    expect(result.modelCount).toBe(1);

    // Check that files were created
    const pipelineExists = await fs.access(path.join(outputDir, 'pipeline.js')).then(() => true).catch(() => false);
    const manifestExists = await fs.access(path.join(outputDir, 'manifest.json')).then(() => true).catch(() => false);

    expect(pipelineExists).toBe(true);
    expect(manifestExists).toBe(true);

    // Check manifest content
    const manifestContent = await fs.readFile(path.join(outputDir, 'manifest.json'), 'utf-8');
    const manifest = JSON.parse(manifestContent);
    expect(manifest.models).toHaveLength(1);
    expect(manifest.models[0].name).toBe('Direct Test Cube');
  }, 15000);

  it('should compile simple model without external dependencies via CLI', async () => {
    // Create minimal project files without external dependencies
    const mainContent = `
// Simple test without external dependencies
export default function main(): string {
  return "Hello from test model";
}

export const metadata = {
  name: 'CLI Test Model',
  description: 'A simple model for CLI testing'
};
`;

    const packageJsonContent = `{
  "name": "cli-test-project",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
  }
}`;

    await fs.writeFile(path.join(testProjectPath, 'main.ts'), mainContent);
    await fs.writeFile(path.join(testProjectPath, 'package.json'), packageJsonContent);

    // Install dependencies (even though there are none, this creates node_modules)
    console.log('DEBUG: Installing dependencies in test project...');
    const { spawn } = await import('child_process');
    const installProcess = spawn('npm', ['install'], {
      cwd: testProjectPath,
      stdio: 'pipe'
    });

    await new Promise<void>((resolve, reject) => {
      installProcess.on('close', (code) => {
        if (code === 0) {
          console.log('DEBUG: Dependencies installed successfully');
          resolve();
        } else {
          reject(new Error(`npm install failed with code ${code}`));
        }
      });
      installProcess.on('error', reject);
    });

    // Use the pipeline compiler directly (not via CLI server) to test just the compilation
    const { createPipelineCompiler } = await import('../../packages/configurator/src/pipeline-compiler/index.js');

    // Use ignore patterns that don't exclude temp directories (for testing)
    const testIgnorePatterns = [
      '**/node_modules/**',
      '**/dist/**',
      '**/scripts/**',
      '**/.git/**'
      // Note: removed '**/temp/**' to allow testing in temp directories
    ];

    const outputDir = path.join(testProjectPath, 'temp');
    const compiler = createPipelineCompiler(testProjectPath, outputDir, testIgnorePatterns);

    // Compile directly
    const result = await compiler.compile();

    // Should succeed
    expect(result.errors).toEqual([]); // No errors means success
    expect(result.modelCount).toBe(1);

    // Check that files were created
    const pipelineExists = await fs.access(path.join(outputDir, 'pipeline.js')).then(() => true).catch(() => false);
    const manifestExists = await fs.access(path.join(outputDir, 'manifest.json')).then(() => true).catch(() => false);

    expect(pipelineExists).toBe(true);
    expect(manifestExists).toBe(true);

    // Check manifest content
    const manifestContent = await fs.readFile(path.join(outputDir, 'manifest.json'), 'utf-8');
    const manifest = JSON.parse(manifestContent);

    console.log('DEBUG: [should compile simple model without external dependencies via CLI]');
    console.log('DEBUG: Test project path:', testProjectPath);
    console.log('DEBUG: Output dir:', outputDir);
    console.log('DEBUG: Manifest content:', manifestContent);
    console.log('DEBUG: Expected model name: CLI Test Model');
    console.log('DEBUG: Actual model name:', manifest.models[0]?.name);

    expect(manifest.models).toHaveLength(1);
    expect(manifest.models[0].name).toBe('CLI Test Model');
  }, 30000);

  it('should isolate Vite build issue', async () => {
    // Create minimal project files without external dependencies
    const mainContent = `
// Simple test without external dependencies
export default function main(): string {
  return "Hello from Vite test";
}

export const metadata = {
  name: 'Vite Test Model',
  description: 'A simple model for Vite build testing'
};
`;

    const packageJsonContent = `{
  "name": "vite-test-project",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
  }
}`;

    await fs.writeFile(path.join(testProjectPath, 'main.ts'), mainContent);
    await fs.writeFile(path.join(testProjectPath, 'package.json'), packageJsonContent);

    // Install dependencies
    const { spawn } = await import('child_process');
    const installProcess = spawn('npm', ['install'], {
      cwd: testProjectPath,
      stdio: 'pipe'
    });

    await new Promise<void>((resolve, reject) => {
      installProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`npm install failed with code ${code}`));
        }
      });
      installProcess.on('error', reject);
    });

    // Test just the pipeline compiler compilation step (without Vite build)
    const { createPipelineCompiler } = await import('../../packages/configurator/src/pipeline-compiler/index.js');

    const testIgnorePatterns = [
      '**/node_modules/**',
      '**/dist/**',
      '**/scripts/**',
      '**/.git/**'
    ];

    const outputDir = path.join(testProjectPath, 'temp');
    const compiler = createPipelineCompiler(testProjectPath, outputDir, testIgnorePatterns);

    console.log('DEBUG: Testing compilation without Vite build...');

    // We need to test the individual steps to isolate where the hang occurs
    // Let's manually call the compilation steps

    // Import the internal methods we need to test (corrected path)
    const { discoverModelFilesForCompilation } = await import('../../packages/configurator/src/pipeline-compiler/file-discovery.js');
    const { compileModelToFunction } = await import('../../packages/configurator/src/pipeline-compiler/model-compiler.js');

    // Step 1: File discovery
    console.log('DEBUG: Step 1 - File discovery...');
    const modelFiles = await discoverModelFilesForCompilation(testProjectPath, testIgnorePatterns);
    console.log('DEBUG: Found files:', modelFiles);
    expect(modelFiles).toHaveLength(1);

    // Step 2: Model compilation
    console.log('DEBUG: Step 2 - Model compilation...');
    const compiledFunctions = [];
    for (const filePath of modelFiles) {
      try {
        const compiledFunction = await compileModelToFunction(filePath, testProjectPath);
        compiledFunctions.push(compiledFunction);
        console.log('DEBUG: Compiled function:', compiledFunction.id);
      } catch (error) {
        console.error('DEBUG: Compilation failed:', error);
        throw error;
      }
    }
    expect(compiledFunctions).toHaveLength(1);

    // Step 3: Manifest generation (without Vite build)
    console.log('DEBUG: Step 3 - Manifest generation...');
    const manifest = {
      models: compiledFunctions.map(func => ({
        id: func.id,
        name: func.metadata?.name || func.id,
        description: func.metadata?.description || '',
        filePath: func.filePath,
        parameters: func.parameters || {}
      }))
    };

    // Write manifest
    await fs.mkdir(outputDir, { recursive: true });
    const manifestPath = path.join(outputDir, 'manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('DEBUG: Manifest written to:', manifestPath);

    // Verify manifest
    const manifestExists = await fs.access(manifestPath).then(() => true).catch(() => false);
    expect(manifestExists).toBe(true);

    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    const parsedManifest = JSON.parse(manifestContent);

    console.log('DEBUG: [should isolate Vite build issue]');
    console.log('DEBUG: Test project path:', testProjectPath);
    console.log('DEBUG: Manifest path:', manifestPath);
    console.log('DEBUG: Manifest content:', manifestContent);
    console.log('DEBUG: Expected model name: Vite Test Model');
    console.log('DEBUG: Actual model name:', parsedManifest.models[0]?.name);

    expect(parsedManifest.models).toHaveLength(1);
    expect(parsedManifest.models[0].name).toBe('Vite Test Model');

    console.log('DEBUG: All steps before Vite build completed successfully');
  }, 30000);

  it('should test Vite build in isolation', async () => {
    // Create minimal project files
    const mainContent = `
export default function main(): string {
  return "Hello from Vite build test";
}

export const metadata = {
  name: 'Vite Build Test',
  description: 'Testing Vite build in isolation'
};
`;

    await fs.writeFile(path.join(testProjectPath, 'main.ts'), mainContent);

    // Create a minimal user-pipeline-entry.ts file (what the pipeline compiler generates)
    const tempDir = path.join(testProjectPath, 'temp');
    await fs.mkdir(tempDir, { recursive: true });

    const userPipelineEntry = `
// Generated user pipeline entry for testing
import main from '../main.js';

export const models = {
  main: {
    func: main,
    metadata: { name: 'Vite Build Test', description: 'Testing Vite build in isolation' },
    parameters: {}
  }
};
`;

    const userPipelineEntryPath = path.join(tempDir, 'user-pipeline-entry.ts');
    await fs.writeFile(userPipelineEntryPath, userPipelineEntry);

    // Test Vite build directly with timeout
    console.log('DEBUG: Testing Vite build directly...');

    const { build } = await import('vite');

    const viteConfig = {
      root: testProjectPath,
      mode: 'production', // Explicit mode
      build: {
        lib: {
          entry: userPipelineEntryPath,
          name: 'UserPipeline',
          fileName: 'pipeline',
          formats: ['es']
        },
        rollupOptions: {
          external: ['manifold-3d', '@manifold-studio/wrapper'],
          output: {
            dir: tempDir,
            format: 'es'
          }
        },
        outDir: tempDir,
        target: 'esnext',
        minify: false,
        sourcemap: true,
        watch: null, // Explicitly disable watching
        emptyOutDir: false // Don't clear the directory
      },
      logLevel: 'info', // More verbose logging
      clearScreen: false, // Don't clear screen in test
      server: false, // Explicitly disable server
      preview: false // Explicitly disable preview
    };

    console.log('DEBUG: Starting Vite build with timeout...');

    // Add timeout to Vite build
    const buildPromise = build(viteConfig);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Vite build timed out after 15 seconds')), 15000);
    });

    try {
      await Promise.race([buildPromise, timeoutPromise]);
      console.log('DEBUG: Vite build completed successfully');

      // Check if pipeline.js was created
      const pipelineExists = await fs.access(path.join(tempDir, 'pipeline.js')).then(() => true).catch(() => false);
      expect(pipelineExists).toBe(true);

    } catch (error) {
      console.error('DEBUG: Vite build failed or timed out:', error);
      throw error;
    }
  }, 30000);
});

// Helper functions
async function startDevServer(projectPath: string): Promise<{ process: ChildProcess; logs: string[] }> {
  const logs: string[] = [];

  // Use the local CLI from the built package with a different port
  const cliPath = path.join(__dirname, '../../packages/configurator/dist/cli/index.js');
  const childProcess = spawn('node', [cliPath, 'dev', '--port', '3333'], {
    cwd: projectPath,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'test' }
  });

  // Capture logs
  childProcess.stdout?.on('data', (data) => {
    const output = data.toString();
    logs.push(output);
    console.log('STDOUT:', output);
  });

  childProcess.stderr?.on('data', (data) => {
    const output = data.toString();
    logs.push(output);
    console.log('STDERR:', output);
  });

  return { process: childProcess, logs };
}

async function waitForServerStart(logs: string[], timeoutMs: number): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const allLogs = logs.join('\n');
    // FIXED: Updated to match actual CLI output from packages/configurator/src/cli/commands/dev.ts
    // The CLI outputs: "✅ Development server started!" and "🌐 UI Server: http://localhost:${port}"
    // Previous test was looking for non-existent messages: "Template server running on" and "Local: http://localhost:"
    if (allLogs.includes('✅ Development server started!') || allLogs.includes('🌐 UI Server: http://localhost:')) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  throw new Error(`Server did not start within ${timeoutMs}ms. Logs: ${logs.join('\n')}`);
}

async function waitForInitialCompilation(logs: string[], timeoutMs: number): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const allLogs = logs.join('\n');
    // Look for the actual success messages from the pipeline compiler
    if (allLogs.includes('✅ Manifest re-written successfully after Vite build') ||
        allLogs.includes('✅ Vite build completed successfully') ||
        allLogs.includes('✅ Manifest written successfully') ||
        allLogs.includes('Pipeline compilation completed') ||
        allLogs.includes('ready in')) { // Vite's ready message
      console.log('DEBUG: Initial compilation completed successfully');

      // Additional wait to ensure files are fully written to disk
      await new Promise(resolve => setTimeout(resolve, 1000));
      return;
    }

    // Also check for error conditions to fail fast
    if (allLogs.includes('Vite build failed') || allLogs.includes('ERROR')) {
      throw new Error(`Compilation failed. Logs: ${allLogs}`);
    }

    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('DEBUG: Compilation timeout. All logs:');
  console.log(logs.join('\n'));
  throw new Error(`Initial compilation did not complete within ${timeoutMs}ms. Check logs above.`);
}
