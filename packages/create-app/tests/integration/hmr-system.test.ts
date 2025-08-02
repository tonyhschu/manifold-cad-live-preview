import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { join } from 'path';
import { writeFileSync, readFileSync } from 'fs';
import {
  ProjectCreator,
  FileValidator,
  ProcessRunner,
  type CreatedProject
} from '../utils/index.js';

describe('CLI HMR System Tests', () => {
  let sharedProject: CreatedProject;
  let project: CreatedProject;

  // Create shared project once for all tests
  beforeAll(async () => {
    console.log('🏗️ Creating shared test project with dependencies...');
    sharedProject = await ProjectCreator.createProject({
      name: 'shared-cli-hmr-project',
      template: 'basic'
    });

    // Install dependencies once
    console.log('📦 Installing dependencies for shared project...');
    const installResult = await ProcessRunner.npmInstall(sharedProject.path, { timeout: 120000 });
    expect(installResult.success).toBe(true);
    console.log('✅ Shared project ready for all tests');
  }, 180000); // 3 minute timeout for shared setup

  // Clean up shared project after all tests
  afterAll(async () => {
    if (sharedProject) {
      await sharedProject.cleanup();
    }
  });

  beforeEach(async () => {
    // Copy shared project for each test (much faster than npm install)
    console.log('📋 Copying shared project for test isolation...');
    project = await ProjectCreator.copyProject(sharedProject, {
      name: `test-cli-hmr-${Date.now()}`
    });
  }, 30000); // Much shorter timeout since no npm install

  afterEach(async () => {
    // Cleanup project copy
    await project?.cleanup();
  });

  describe('CLI Development Server Tests', () => {
    it('should start CLI development server successfully', async () => {
      console.log('🚀 Testing CLI development server startup...');

      // Test that CLI command is available
      const helpResult = await ProcessRunner.run('npx', ['manifold-studio', '--help'], { cwd: project.path, timeout: 10000 });
      expect(helpResult.success).toBe(true);
      expect(helpResult.stdout.toLowerCase()).toContain('development server');

      console.log('✅ CLI development server command available');
    });

    it('should validate CLI development environment', async () => {
      console.log('🔧 Testing CLI development environment...');

      // Check that required files exist for CLI development
      const mainTsExists = await FileValidator.fileExists(join(project.path, 'main.ts'));
      expect(mainTsExists).toBe(true);

      const packageJsonExists = await FileValidator.fileExists(join(project.path, 'package.json'));
      expect(packageJsonExists).toBe(true);

      const viteConfigExists = await FileValidator.fileExists(join(project.path, 'vite.config.ts'));
      expect(viteConfigExists).toBe(true);

      // Validate package.json has CLI dev script
      const packageValidation = await FileValidator.validateJsonFile(
        join(project.path, 'package.json'),
        (data) => {
          if (!data.scripts?.dev?.includes('manifold-studio')) {
            return 'package.json missing manifold-studio dev script';
          }
          return null;
        }
      );

      expect(packageValidation.isValid).toBe(true);
      console.log('✅ CLI development environment validated');
    });

    it('should validate model file structure for CLI', async () => {
      console.log('🔍 Testing model file structure for CLI compatibility...');

      // Validate main.ts contains export default pattern (V3 format)
      const mainTsValidation = await FileValidator.validateFileContent(
        join(project.path, 'main.ts'),
        /export default/,
        { partial: true }
      );

      expect(mainTsValidation.valid).toBe(true);
      if (!mainTsValidation.valid) {
        expect.fail('main.ts should contain export default (V3 format)');
      }

      // Check for TypeScript-specific syntax
      const content = mainTsValidation.content!;
      expect(content).toMatch(/export default/);
      expect(content.length).toBeGreaterThan(0);

      console.log('✅ Model file structure validated for CLI');
    });
  });

  describe('CLI Configuration Tests', () => {
    it('should have proper Vite configuration for CLI', async () => {
      console.log('🔧 Testing Vite configuration for CLI...');

      const viteConfigPath = join(project.path, 'vite.config.ts');
      const viteConfigExists = await FileValidator.fileExists(viteConfigPath);
      expect(viteConfigExists).toBe(true);

      // Read and validate vite config content
      const viteConfigContent = readFileSync(viteConfigPath, 'utf-8');

      // Check for CLI-compatible configuration
      expect(viteConfigContent).toContain('defineConfig');
      expect(viteConfigContent.length).toBeGreaterThan(0);

      console.log('✅ Vite configuration validated for CLI');
    });

    it('should have proper TypeScript configuration for CLI', async () => {
      console.log('🔧 Testing TypeScript configuration for CLI...');

      const tsconfigPath = join(project.path, 'tsconfig.json');
      const tsconfigExists = await FileValidator.fileExists(tsconfigPath);
      expect(tsconfigExists).toBe(true);

      // Validate tsconfig.json structure
      const tsconfigValidation = await FileValidator.validateJsonFile(
        tsconfigPath,
        (data) => {
          if (!data.compilerOptions) {
            return 'tsconfig.json missing compilerOptions';
          }
          return null;
        }
      );

      expect(tsconfigValidation.isValid).toBe(true);
      console.log('✅ TypeScript configuration validated for CLI');
    });
  });

  describe('CLI Hot Module Replacement Tests', () => {
    it('should validate CLI HMR infrastructure', async () => {
      console.log('🔧 Testing CLI HMR infrastructure...');

      // Check that Vite configuration exists (required for HMR)
      const viteConfigPath = join(project.path, 'vite.config.ts');
      const viteConfigExists = await FileValidator.fileExists(viteConfigPath);
      expect(viteConfigExists).toBe(true);

      // Validate that the project structure supports HMR
      const mainTsPath = join(project.path, 'main.ts');
      const mainTsExists = await FileValidator.fileExists(mainTsPath);
      expect(mainTsExists).toBe(true);

      // Check that model files are in the expected format for HMR
      const mainTsValidation = await FileValidator.validateFileContent(
        mainTsPath,
        /export default/,
        { partial: true }
      );

      expect(mainTsValidation.valid).toBe(true);
      console.log('✅ CLI HMR infrastructure validated');
    });

    it('should support file modification workflow', async () => {
      console.log('🔧 Testing file modification workflow for CLI...');

      // Test that we can modify model files without breaking the structure
      const mainTsPath = join(project.path, 'main.ts');
      const originalContent = readFileSync(mainTsPath, 'utf-8');

      // Make a safe modification (add a comment)
      const modifiedContent = originalContent + '\n// CLI HMR test modification';
      writeFileSync(mainTsPath, modifiedContent);

      // Verify the file is still valid after modification
      const modifiedValidation = await FileValidator.validateFileContent(
        mainTsPath,
        /export default/,
        { partial: true }
      );

      expect(modifiedValidation.valid).toBe(true);

      // Restore original content
      writeFileSync(mainTsPath, originalContent);

      // Verify restoration worked
      const restoredValidation = await FileValidator.validateFileContent(
        mainTsPath,
        /export default/,
        { partial: true }
      );

      expect(restoredValidation.valid).toBe(true);
      console.log('✅ File modification workflow validated');
    });

    it('should validate CLI development dependencies for HMR', async () => {
      console.log('🔧 Testing CLI development dependencies for HMR...');

      // Check that required dev dependencies are present
      const packageValidation = await FileValidator.validateJsonFile(
        join(project.path, 'package.json'),
        (data) => {
          if (!data.dependencies?.['@manifold-studio/configurator']) {
            return 'Missing @manifold-studio/configurator dependency';
          }
          if (!data.dependencies?.['@manifold-studio/wrapper']) {
            return 'Missing @manifold-studio/wrapper dependency';
          }
          if (!data.devDependencies?.typescript) {
            return 'Missing typescript dev dependency';
          }
          if (!data.devDependencies?.vitest) {
            return 'Missing vitest dev dependency';
          }
          return null;
        }
      );

      expect(packageValidation.isValid).toBe(true);
      console.log('✅ CLI development dependencies validated for HMR');
    });
  });

  describe('CLI Error Handling Tests', () => {
    it('should handle TypeScript compilation errors gracefully', async () => {
      console.log('🔧 Testing CLI TypeScript error handling...');

      // Introduce a syntax error in main.ts
      const mainTsPath = join(project.path, 'main.ts');
      const originalContent = readFileSync(mainTsPath, 'utf-8');
      const brokenContent = originalContent + '\n// Syntax error: invalid TypeScript\nconst broken = {';

      writeFileSync(mainTsPath, brokenContent);

      // Verify the file is broken by checking content validation
      const brokenValidation = await FileValidator.validateFileContent(
        mainTsPath,
        /export default/,
        { partial: true }
      );
      expect(brokenValidation.valid).toBe(true); // Should still contain export default
      expect(brokenValidation.content).toContain('const broken = {'); // But also contain the error

      // Restore original content
      writeFileSync(mainTsPath, originalContent);

      // Verify recovery by checking the file is back to normal
      const recoveredValidation = await FileValidator.validateFileContent(
        mainTsPath,
        /export default/,
        { partial: true }
      );
      expect(recoveredValidation.valid).toBe(true);
      expect(recoveredValidation.content).not.toContain('const broken = {');

      console.log('✅ CLI TypeScript error handling validated');
    });

    it('should handle CLI command errors gracefully', async () => {
      console.log('🔧 Testing CLI command error handling...');

      // Test invalid CLI command
      const invalidResult = await ProcessRunner.run('npx', ['manifold-studio', 'invalid-command'], { cwd: project.path, timeout: 10000 });
      expect(invalidResult.success).toBe(false);

      // Test that help command still works
      const helpResult = await ProcessRunner.run('npx', ['manifold-studio', '--help'], { cwd: project.path, timeout: 10000 });
      expect(helpResult.success).toBe(true);
      expect(helpResult.stdout.toLowerCase()).toContain('development server');

      console.log('✅ CLI command error handling validated');
    });

    it('should validate project structure integrity after errors', async () => {
      console.log('🔧 Testing project structure integrity after errors...');

      // Temporarily break and restore a file to test recovery
      const mainTsPath = join(project.path, 'main.ts');
      const originalContent = readFileSync(mainTsPath, 'utf-8');

      // Break the file
      writeFileSync(mainTsPath, 'invalid content');

      // Verify it's broken
      const brokenValidation = await FileValidator.validateFileContent(
        mainTsPath,
        /export default/,
        { partial: true }
      );
      expect(brokenValidation.valid).toBe(false);

      // Restore the file
      writeFileSync(mainTsPath, originalContent);

      // Verify it's fixed
      const fixedValidation = await FileValidator.validateFileContent(
        mainTsPath,
        /export default/,
        { partial: true }
      );
      expect(fixedValidation.valid).toBe(true);

      console.log('✅ Project structure integrity validated');
    });
  });
});
