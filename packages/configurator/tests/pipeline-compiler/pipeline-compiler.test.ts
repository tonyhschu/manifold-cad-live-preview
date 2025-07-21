/**
 * Pipeline Compiler Real Behavior Tests
 *
 * Tests that verify actual pipeline compiler behavior with real file system operations.
 * These tests use temporary directories and test actual compilation results.
 *
 * Updated: 2025-01-21 - Real tests that verify actual behavior
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Pipeline Compiler Real Behavior', () => {
  let tempDir: string;
  let testProjectDir: string;

  beforeEach(async () => {
    // Create temporary directory for each test
    tempDir = path.join(__dirname, '../temp', `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    testProjectDir = path.join(tempDir, 'project');
    await fs.mkdir(testProjectDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Basic Functionality', () => {
    it('should be importable and create instances', async () => {
      const { createPipelineCompiler } = await import('../../src/pipeline-compiler/index');
      expect(createPipelineCompiler).toBeDefined();
      expect(typeof createPipelineCompiler).toBe('function');

      // Use custom ignore patterns for testing
      const testIgnorePatterns = ['**/node_modules/**', '**/dist/**', '**/scripts/**', '**/.git/**'];
      const compiler = createPipelineCompiler(testProjectDir, path.join(tempDir, 'output'), testIgnorePatterns);
      expect(compiler).toBeDefined();
      expect(typeof compiler.compile).toBe('function');
    });
  });

  describe('File System Operations', () => {
    it('should handle empty project (no model files)', async () => {
      const { createPipelineCompiler } = await import('../../src/pipeline-compiler/index');
      const outputDir = path.join(tempDir, 'output');

      // Use custom ignore patterns that don't exclude temp directories (for testing)
      const testIgnorePatterns = [
        '**/node_modules/**',
        '**/dist/**',
        '**/scripts/**',
        '**/.git/**'
      ];

      const compiler = createPipelineCompiler(testProjectDir, outputDir, testIgnorePatterns);

      const result = await compiler.compile();

      // Should complete without errors but with warnings
      expect(result.errors).toEqual([]); // No errors means success
      expect(result.warnings).toContain('No model files found');

      // Should still create manifest.json (even if empty)
      const manifestPath = path.join(outputDir, 'manifest.json');
      const manifestExists = await fs.access(manifestPath).then(() => true).catch(() => false);
      expect(manifestExists).toBe(true);

      // Manifest should have empty models array
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent);
      expect(manifest.models).toEqual([]);
    });

    it('should create output directory if it does not exist', async () => {
      const { createPipelineCompiler } = await import('../../src/pipeline-compiler/index');
      const outputDir = path.join(tempDir, 'nonexistent', 'output');
      const testIgnorePatterns = ['**/node_modules/**', '**/dist/**', '**/scripts/**', '**/.git/**'];
      const compiler = createPipelineCompiler(testProjectDir, outputDir, testIgnorePatterns);

      await compiler.compile();

      // Output directory should be created
      const outputExists = await fs.access(outputDir).then(() => true).catch(() => false);
      expect(outputExists).toBe(true);
    });
  });

  describe('Project with Simple Model', () => {
    it('should compile project with main.ts', async () => {
      // Create a simple main.ts file
      const mainContent = `
import { Manifold } from 'manifold-3d';

export interface MainParams {
  size: number;
}

export const parameters: MainParams = {
  size: 10
};

export default function main({ size }: MainParams): Manifold {
  return Manifold.cube([size, size, size]);
}

export const metadata = {
  name: 'Test Cube',
  description: 'A simple test cube'
};
`;

      await fs.writeFile(path.join(testProjectDir, 'main.ts'), mainContent);

      const { createPipelineCompiler } = await import('../../src/pipeline-compiler/index');
      const outputDir = path.join(tempDir, 'output');
      const testIgnorePatterns = ['**/node_modules/**', '**/dist/**', '**/scripts/**', '**/.git/**'];
      const compiler = createPipelineCompiler(testProjectDir, outputDir, testIgnorePatterns);

      const result = await compiler.compile();

      // Should succeed
      expect(result.errors).toEqual([]); // No errors means success

      // Should create both files
      const pipelineExists = await fs.access(path.join(outputDir, 'pipeline.js')).then(() => true).catch(() => false);
      const manifestExists = await fs.access(path.join(outputDir, 'manifest.json')).then(() => true).catch(() => false);

      expect(pipelineExists).toBe(true);
      expect(manifestExists).toBe(true);

      // Manifest should contain the model
      const manifestContent = await fs.readFile(path.join(outputDir, 'manifest.json'), 'utf-8');
      const manifest = JSON.parse(manifestContent);

      expect(manifest.models).toHaveLength(1);
      expect(manifest.models[0].id).toBe('main');
      expect(manifest.models[0].name).toBe('Test Cube');
      expect(manifest.models[0].description).toBe('A simple test cube');
    }, 15000); // Longer timeout for Vite build
  });

  describe('Project with Components', () => {
    it('should compile project with main.ts and components', async () => {
      // Create main.ts
      const mainContent = `
import { Manifold } from 'manifold-3d';
import simpleCube from './components/simple-cube.js';

export interface MainParams {
  cubeSize: number;
}

export const parameters: MainParams = {
  cubeSize: 5
};

export default function main({ cubeSize }: MainParams): Manifold {
  return simpleCube({ size: cubeSize });
}

export const metadata = {
  name: 'Main with Component',
  description: 'Uses a component'
};
`;

      // Create components directory and file
      await fs.mkdir(path.join(testProjectDir, 'components'), { recursive: true });
      const componentContent = `
import { Manifold } from 'manifold-3d';

export interface SimpleCubeParams {
  size: number;
}

export const parameters: SimpleCubeParams = {
  size: 10
};

export default function simpleCube({ size }: SimpleCubeParams): Manifold {
  return Manifold.cube([size, size, size]);
}

export const metadata = {
  name: 'Simple Cube Component',
  description: 'A reusable cube component'
};
`;

      await fs.writeFile(path.join(testProjectDir, 'main.ts'), mainContent);
      await fs.writeFile(path.join(testProjectDir, 'components', 'simple-cube.ts'), componentContent);

      const { createPipelineCompiler } = await import('../../src/pipeline-compiler/index');
      const outputDir = path.join(tempDir, 'output');
      const testIgnorePatterns = ['**/node_modules/**', '**/dist/**', '**/scripts/**', '**/.git/**'];
      const compiler = createPipelineCompiler(testProjectDir, outputDir, testIgnorePatterns);

      const result = await compiler.compile();

      // Should succeed
      expect(result.errors).toEqual([]); // No errors means success

      // Manifest should contain both models
      const manifestContent = await fs.readFile(path.join(outputDir, 'manifest.json'), 'utf-8');
      const manifest = JSON.parse(manifestContent);

      expect(manifest.models).toHaveLength(2);

      const mainModel = manifest.models.find(m => m.id === 'main');
      const componentModel = manifest.models.find(m => m.id === 'components/simple-cube');

      expect(mainModel).toBeDefined();
      expect(mainModel.name).toBe('Main with Component');

      expect(componentModel).toBeDefined();
      expect(componentModel.name).toBe('Simple Cube Component');
    }, 15000); // Longer timeout for Vite build
  });

  describe('Error Handling', () => {
    it('should handle invalid TypeScript in model files', async () => {
      // Create invalid TypeScript file
      const invalidContent = `
import { Manifold } from 'manifold-3d';

// Invalid syntax - missing closing brace
export default function main() {
  return Manifold.cube([1, 1, 1]);
// Missing closing brace
`;

      await fs.writeFile(path.join(testProjectDir, 'main.ts'), invalidContent);

      const { createPipelineCompiler } = await import('../../src/pipeline-compiler/index');
      const outputDir = path.join(tempDir, 'output');
      const testIgnorePatterns = ['**/node_modules/**', '**/dist/**', '**/scripts/**', '**/.git/**'];
      const compiler = createPipelineCompiler(testProjectDir, outputDir, testIgnorePatterns);

      const result = await compiler.compile();

      // Should fail with compilation errors
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
      expect(result.errors![0]).toContain('Failed to compile');
    }, 15000);

    it('should handle missing dependencies gracefully', async () => {
      // Create file with missing import
      const contentWithMissingImport = `
import { NonExistentFunction } from './non-existent-module.js';

export default function main() {
  return NonExistentFunction();
}
`;

      await fs.writeFile(path.join(testProjectDir, 'main.ts'), contentWithMissingImport);

      const { createPipelineCompiler } = await import('../../src/pipeline-compiler/index');
      const outputDir = path.join(tempDir, 'output');
      const testIgnorePatterns = ['**/node_modules/**', '**/dist/**', '**/scripts/**', '**/.git/**'];
      const compiler = createPipelineCompiler(testProjectDir, outputDir, testIgnorePatterns);

      const result = await compiler.compile();

      // Should fail with compilation errors
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    }, 15000);
  });
});
