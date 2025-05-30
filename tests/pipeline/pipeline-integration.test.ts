// tests/pipeline/pipeline-integration.test.ts
// Integration tests for the pipeline CLI

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { spawn } from 'child_process';
import { readFile, unlink, access } from 'fs/promises';
import { resolve } from 'path';

// Helper to run pipeline commands
async function runPipeline(args: string[], options: { timeout?: number } = {}): Promise<{
  exitCode: number;
  stdout: string;
  stderr: string;
}> {
  const { timeout = 30000 } = options;

  return new Promise((resolve, reject) => {
    const child = spawn('node', ['scripts/run-pipeline.js', ...args], {
      cwd: process.cwd(),
      stdio: 'pipe'
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    const timeoutId = setTimeout(() => {
      child.kill();
      reject(new Error(`Pipeline command timed out after ${timeout}ms`));
    }, timeout);

    child.on('close', (code) => {
      clearTimeout(timeoutId);
      resolve({
        exitCode: code || 0,
        stdout,
        stderr
      });
    });

    child.on('error', (error) => {
      clearTimeout(timeoutId);
      reject(error);
    });
  });
}

// Helper to check if file exists
async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

// Helper to clean up generated files
async function cleanupFile(path: string): Promise<void> {
  try {
    await unlink(path);
  } catch {
    // File doesn't exist, ignore
  }
}

describe('Pipeline Integration Tests', () => {
  // Ensure dependencies are compiled before running tests
  beforeAll(async () => {
    console.log('Compiling dependencies for integration tests...');
    const result = await runPipeline(['--help'], { timeout: 60000 });
    // Help command should succeed
    expect(result.exitCode).toBe(0);
  }, 60000);

  afterEach(async () => {
    // Clean up generated files after each test
    await cleanupFile('simple-cube.obj');
    await cleanupFile('parametric-sphere.obj');
    await cleanupFile('test-output.obj');
  });

  describe('Function-based Models', () => {
    it('processes simple cube model successfully', async () => {
      const result = await runPipeline(['tests/fixtures/simple-cube.ts']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('🔧 Detected function-based model');
      expect(result.stdout).toContain('✅ Model generated');
      expect(result.stdout).toContain('✅ Model exported to: simple-cube.obj');
      expect(result.stdout).toContain('✅ Pipeline completed successfully!');

      // Check that output file was created
      expect(await fileExists('simple-cube.obj')).toBe(true);

      // Check that output file has content
      const content = await readFile('simple-cube.obj', 'utf-8');
      expect(content).toContain('v '); // Should contain vertices
      expect(content).toContain('f '); // Should contain faces
    });

    it('processes cube with parameters', async () => {
      const result = await runPipeline([
        'tests/fixtures/simple-cube.ts',
        '--params', 'size=20,centered=false'
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('User parameters: { size: 20, centered: false }');
      expect(result.stdout).toContain('🔧 Detected function-based model');
      expect(result.stdout).toContain('✅ Pipeline completed successfully!');

      expect(await fileExists('simple-cube.obj')).toBe(true);
    });

    it('handles custom output filename', async () => {
      const result = await runPipeline([
        'tests/fixtures/simple-cube.ts',
        '--output', 'test-output.obj'
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('✅ Model exported to: test-output.obj');

      expect(await fileExists('test-output.obj')).toBe(true);
      expect(await fileExists('simple-cube.obj')).toBe(false);
    });
  });

  describe('Parametric Models', () => {
    it('processes parametric sphere model successfully', async () => {
      const result = await runPipeline(['tests/fixtures/parametric-sphere.ts']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('📐 Detected parametric model');
      expect(result.stdout).toContain('Default parameters:');
      expect(result.stdout).toContain('radius: 5');
      expect(result.stdout).toContain('segments: 16');
      expect(result.stdout).toContain('✅ Model exported to: parametric-sphere.obj');

      expect(await fileExists('parametric-sphere.obj')).toBe(true);
    });

    it('processes parametric model with parameter overrides', async () => {
      const result = await runPipeline([
        'tests/fixtures/parametric-sphere.ts',
        '--params', 'radius=10,segments=32'
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('User parameters: { radius: 10, segments: 32 }');
      expect(result.stdout).toContain('📐 Detected parametric model');
      expect(result.stdout).toContain('radius: 5 → 10');
      expect(result.stdout).toContain('segments: 16 → 32');
      expect(result.stdout).toContain('Final parameters:');
      expect(result.stdout).toContain('radius: 10');
      expect(result.stdout).toContain('segments: 32');

      expect(await fileExists('parametric-sphere.obj')).toBe(true);
    });

    it('warns about unknown parameters', async () => {
      const result = await runPipeline([
        'tests/fixtures/parametric-sphere.ts',
        '--params', 'radius=8,unknownParam=value'
      ]);

      expect(result.exitCode).toBe(0);
      // Warning might be in stderr instead of stdout
      const output = result.stdout + result.stderr;
      expect(output).toContain('Warning: Unknown parameter "unknownParam" ignored');
      expect(result.stdout).toContain('radius: 5 → 8');
      expect(result.stdout).toContain('✅ Pipeline completed successfully!');
    });
  });

  describe('Error Handling', () => {
    it('handles missing model file', async () => {
      const result = await runPipeline(['nonexistent-model.ts']);

      expect(result.exitCode).toBe(1);
      const output = result.stdout + result.stderr;
      expect(output).toContain('❌ Error:');
    });

    it('handles model with no default export', async () => {
      const result = await runPipeline(['tests/fixtures/invalid-model.ts']);

      expect(result.exitCode).toBe(1);
      const output = result.stdout + result.stderr;
      expect(output).toContain('❌ Error:');
      expect(output).toContain('No default export found in module');
    });

    it('handles invalid parameter format', async () => {
      const result = await runPipeline([
        'tests/fixtures/simple-cube.ts',
        '--params', 'invalid-format'
      ]);

      expect(result.exitCode).toBe(1);
      const output = result.stdout + result.stderr;
      expect(output).toContain('❌ Error:');
      expect(output).toContain('Invalid parameter format');
    });

    it('shows help when no arguments provided', async () => {
      const result = await runPipeline([]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Manifold CAD Pipeline');
      expect(result.stdout).toContain('Usage: pipeline <model-path> [options]');
      expect(result.stdout).toContain('Examples:');
    });

    it('shows help with --help flag', async () => {
      const result = await runPipeline(['--help']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Manifold CAD Pipeline');
      expect(result.stdout).toContain('Options:');
      expect(result.stdout).toContain('-p, --params');
      expect(result.stdout).toContain('-o, --output');
    });
  });

  describe('Real Models', () => {
    it('processes existing cube model', async () => {
      const result = await runPipeline(['src/models/cube.ts']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('🔧 Detected function-based model');
      expect(result.stdout).toContain('✅ Pipeline completed successfully!');

      expect(await fileExists('cube.obj')).toBe(true);
    });

    it('processes existing parametric hook model', async () => {
      const result = await runPipeline(['src/models/parametric-hook.ts']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('📐 Detected parametric model');
      expect(result.stdout).toContain('thickness: 3');
      expect(result.stdout).toContain("mountingType: 'screw'");
      expect(result.stdout).toContain('✅ Pipeline completed successfully!');

      expect(await fileExists('parametric-hook.obj')).toBe(true);
    });
  });
});
