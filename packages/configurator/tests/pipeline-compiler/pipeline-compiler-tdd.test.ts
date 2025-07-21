/**
 * TDD Test for Pipeline Compiler Architecture Fix
 * 
 * This test is designed to FAIL initially, exposing the architectural coupling issue.
 * We'll then fix the architecture to make this test pass.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('TDD: Pipeline Compiler Architecture Fix', () => {
  let tempDir: string;
  let testProjectDir: string;

  beforeEach(async () => {
    // Create completely isolated temporary directory
    tempDir = path.join(__dirname, '../temp', `tdd-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    testProjectDir = path.join(tempDir, 'isolated-project');
    await fs.mkdir(testProjectDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should compile a simple project in an isolated directory', async () => {
    // Create a minimal project structure
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
  name: 'Isolated Test Cube',
  description: 'A cube in an isolated test environment'
};
`;
    
    await fs.writeFile(path.join(testProjectDir, 'main.ts'), mainContent);

    // This should work but currently fails due to architectural coupling
    const { createPipelineCompiler } = await import('../../src/pipeline-compiler/index');
    const outputDir = path.join(tempDir, 'output');

    // Use custom ignore patterns that don't exclude temp directories (for testing)
    const testIgnorePatterns = [
      '**/node_modules/**',
      '**/dist/**',
      '**/scripts/**',
      '**/.git/**'
      // Note: removed '**/temp/**' to allow testing in temp directories
    ];

    const compiler = createPipelineCompiler(testProjectDir, outputDir, testIgnorePatterns);

    // THE TEST THAT SHOULD PASS BUT CURRENTLY FAILS:
    const result = await compiler.compile();

    // What we expect after fixing the architecture:
    expect(result.errors).toEqual([]); // No errors means success
    expect(result.warnings).toBeDefined();

    // Should create both files
    const pipelineExists = await fs.access(path.join(outputDir, 'pipeline.js')).then(() => true).catch(() => false);
    const manifestExists = await fs.access(path.join(outputDir, 'manifest.json')).then(() => true).catch(() => false);
    
    expect(pipelineExists).toBe(true);
    expect(manifestExists).toBe(true);

    // Manifest should contain the model
    const manifestContent = await fs.readFile(path.join(outputDir, 'manifest.json'), 'utf-8');
    const manifest = JSON.parse(manifestContent);

    // Clean test - no debug logging needed

    expect(manifest.models).toHaveLength(1);
    expect(manifest.models[0].id).toBe('main');
    expect(manifest.models[0].name).toBe('Isolated Test Cube');
  }, 15000);

  it('should be able to resolve pipeline runtime dependencies from any directory', async () => {
    // This test focuses specifically on the dependency resolution issue
    
    // Create minimal project
    await fs.writeFile(path.join(testProjectDir, 'main.ts'), `
export default function main() { return null; }
export const parameters = {};
export const metadata = { name: 'Test' };
`);

    const { createPipelineCompiler } = await import('../../src/pipeline-compiler/index');
    const outputDir = path.join(tempDir, 'output');

    // Use custom ignore patterns for testing
    const testIgnorePatterns = [
      '**/node_modules/**',
      '**/dist/**',
      '**/scripts/**',
      '**/.git/**'
    ];

    const compiler = createPipelineCompiler(testProjectDir, outputDir, testIgnorePatterns);

    // The core issue: this should not fail due to missing pipeline runtime types
    const result = await compiler.compile();

    // After architecture fix, this should succeed
    expect(result.errors).toEqual([]); // No errors means success
    
    // The generated user-pipeline-entry.ts should be able to import pipeline runtime
    const userPipelineEntryPath = path.join(outputDir, 'user-pipeline-entry.ts');
    const entryExists = await fs.access(userPipelineEntryPath).then(() => true).catch(() => false);
    expect(entryExists).toBe(true);

    // The entry file should contain imports that can be resolved
    const entryContent = await fs.readFile(userPipelineEntryPath, 'utf-8');
    expect(entryContent).toContain('pipeline-runtime'); // Should import pipeline runtime
    
    // And Vite should be able to build it without path resolution errors
    const pipelineJsExists = await fs.access(path.join(outputDir, 'pipeline.js')).then(() => true).catch(() => false);
    expect(pipelineJsExists).toBe(true);
  }, 15000);
});
