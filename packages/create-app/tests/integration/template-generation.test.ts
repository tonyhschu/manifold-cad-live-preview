import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ProjectCreator, TempDir } from '../utils/index.js';

describe('Template Generation', () => {
  beforeAll(async () => {
    // Ensure create-app CLI is available
    const info = await ProjectCreator.getCreateAppInfo();
    if (!info.available) {
      throw new Error(`create-app CLI not available: ${info.error}`);
    }
    console.log(`✅ create-app CLI available (version: ${info.version})`);
  });

  afterAll(async () => {
    // Clean up any remaining temp directories
    await TempDir.cleanupAll();
  });

  describe('Basic Template', () => {
    it('should create project with correct file structure', async () => {
      const project = await ProjectCreator.createProject({
        name: 'test-basic-structure',
        template: 'basic',
        skipInstall: true
      });

      try {
        // Validate project structure
        const validation = await ProjectCreator.validateProjectStructure(project.path, 'basic');
        
        if (!validation.valid) {
          console.error('Validation errors:', validation.errors);
          expect.fail(`Project structure validation failed: ${validation.errors.join(', ')}`);
        }
        expect(validation.valid).toBe(true);
      } finally {
        await project.cleanup();
      }
    }, 30000);

    it('should process Handlebars templates correctly', async () => {
      const projectName = 'test-handlebars-processing';
      const project = await ProjectCreator.createProject({
        name: projectName,
        template: 'basic',
        skipInstall: true
      });

      try {
        // Check that package.json has the correct project name
        const { FileValidator } = await import('../utils/index.js');
        const packageJsonValidation = await FileValidator.validateJsonFile(
          `${project.path}/package.json`,
          (data) => {
            if (data.name !== projectName) {
              return `Expected project name "${projectName}", got "${data.name}"`;
            }
            return true;
          }
        );

        expect(packageJsonValidation.isValid).toBe(true);
        if (!packageJsonValidation.isValid) {
          expect.fail(`Package.json validation failed: ${packageJsonValidation.error}`);
        }

        // Check that README.md contains the project name
        const readmeValidation = await FileValidator.validateFileContent(
          `${project.path}/README.md`,
          new RegExp(projectName),
          { partial: true }
        );

        expect(readmeValidation.valid).toBe(true);
        if (!readmeValidation.valid) {
          expect.fail(`README.md should contain project name "${projectName}"`);
        }
      } finally {
        await project.cleanup();
      }
    }, 30000);

    it('should create all required files', async () => {
      const project = await ProjectCreator.createProject({
        name: 'test-required-files',
        template: 'basic',
        skipInstall: true
      });

      try {
        const { FileValidator } = await import('../utils/index.js');
        
        // Define all files that should exist (CLI-based architecture)
        const requiredFiles = [
          'package.json',
          'tsconfig.json',
          'vite.config.ts',
          'main.ts',
          'components/example.ts',
          'components/wheel.ts',
          'README.md'
        ];

        const validation = await FileValidator.validateFilesExist(project.path, requiredFiles);
        
        expect(validation.valid).toBe(true);
        if (!validation.valid) {
          console.error('Missing files:', validation.missing);
          console.error('File errors:', validation.errors);
          expect.fail(`Required files missing: ${validation.missing.join(', ')}`);
        }
      } finally {
        await project.cleanup();
      }
    }, 30000);

    it('should have valid package.json with correct dependencies', async () => {
      const project = await ProjectCreator.createProject({
        name: 'test-package-json',
        template: 'basic',
        skipInstall: true
      });

      try {
        const { FileValidator } = await import('../utils/index.js');
        
        const validation = await FileValidator.validateJsonFile(
          `${project.path}/package.json`,
          (data) => {
            // Check required fields
            const requiredFields = ['name', 'version', 'type', 'scripts', 'dependencies', 'devDependencies'];
            for (const field of requiredFields) {
              if (!data[field]) {
                return `Missing required field: ${field}`;
              }
            }

            // Check required scripts for CLI-based architecture
            const requiredScripts = ['dev', 'test'];
            for (const script of requiredScripts) {
              if (!data.scripts[script]) {
                return `Missing required script: ${script}`;
              }
            }

            // Validate CLI-based scripts
            if (data.scripts.dev !== 'manifold-dev dev') {
              return `dev script should be "manifold-dev dev", got "${data.scripts.dev}"`;
            }
            if (data.scripts.test !== 'vitest') {
              return `test script should be "vitest", got "${data.scripts.test}"`;
            }

            // Check required dependencies
            const requiredDeps = [
              'manifold-3d'
            ];
            for (const dep of requiredDeps) {
              if (!data.dependencies[dep]) {
                return `Missing required dependency: ${dep}`;
              }
            }

            // Check required dev dependencies for CLI-based architecture
            const requiredDevDeps = ['@manifold-studio/configurator', 'typescript', 'vitest'];
            for (const dep of requiredDevDeps) {
              if (!data.devDependencies[dep]) {
                return `Missing required dev dependency: ${dep}`;
              }
            }

            return true;
          }
        );

        expect(validation.isValid).toBe(true);
        if (!validation.isValid) {
          expect.fail(`Package.json validation failed: ${validation.error}`);
        }
      } finally {
        await project.cleanup();
      }
    }, 30000);

    it('should have valid TypeScript configuration', async () => {
      const project = await ProjectCreator.createProject({
        name: 'test-typescript-config',
        template: 'basic',
        skipInstall: true
      });

      try {
        const { FileValidator } = await import('../utils/index.js');
        
        const validation = await FileValidator.validateJsonFile(
          `${project.path}/tsconfig.json`,
          (data) => {
            if (!data.compilerOptions) {
              return 'Missing compilerOptions';
            }
            
            // Check for essential TypeScript options
            const requiredOptions = ['target', 'module', 'moduleResolution', 'strict'];
            for (const option of requiredOptions) {
              if (data.compilerOptions[option] === undefined) {
                return `Missing compiler option: ${option}`;
              }
            }

            return true;
          }
        );

        expect(validation.isValid).toBe(true);
        if (!validation.isValid) {
          expect.fail(`TypeScript config validation failed: ${validation.error}`);
        }
      } finally {
        await project.cleanup();
      }
    }, 30000);

    it('should have valid Vite configurations', async () => {
      const project = await ProjectCreator.createProject({
        name: 'test-vite-config',
        template: 'basic',
        skipInstall: true
      });

      try {
        const { FileValidator } = await import('../utils/index.js');
        
        // Check main vite.config.ts exists and has basic structure
        const viteConfigValidation = await FileValidator.validateFileContent(
          `${project.path}/vite.config.ts`,
          /defineConfig/,
          { partial: true }
        );

        expect(viteConfigValidation.valid).toBe(true);
        if (!viteConfigValidation.valid) {
          expect.fail('vite.config.ts should contain defineConfig');
        }
      } finally {
        await project.cleanup();
      }
    }, 30000);
  });

  describe('Error Handling', () => {
    it('should handle invalid project names gracefully', async () => {
      // Test with invalid characters
      await expect(
        ProjectCreator.createProject({
          name: 'invalid/project/name',
          skipInstall: true
        })
      ).rejects.toThrow();
    }, 15000);

    it('should handle non-existent templates gracefully', async () => {
      await expect(
        ProjectCreator.createProject({
          name: 'test-invalid-template',
          template: 'non-existent-template',
          skipInstall: true
        })
      ).rejects.toThrow();
    }, 15000);
  });
});
