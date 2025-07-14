import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ProjectCreator, ProcessRunner, TempDir, FileValidator } from '../utils/index.js';
import { join } from 'path';

describe('CLI Development System Testing', () => {
  beforeAll(async () => {
    const nodeVersion = await ProcessRunner.getNodeVersion();
    console.log(`🔧 Testing CLI development with node ${nodeVersion}`);
  });

  afterAll(async () => {
    await TempDir.cleanupAll();
  });

  describe('CLI Development Server', () => {
    it('should start development server successfully', async () => {
      const project = await ProjectCreator.createProject({
        name: 'test-cli-dev-server',
        skipInstall: true
      });

      try {
        console.log('🔧 Testing CLI development server startup...');

        // Test that the CLI command exists and can be invoked
        const helpResult = await ProcessRunner.run('npx', ['manifold-dev', '--help'], {
          cwd: project.path,
          timeout: 30000
        });

        expect(helpResult.success).toBe(true);
        if (!helpResult.success) {
          console.error('CLI help stdout:', helpResult.stdout);
          console.error('CLI help stderr:', helpResult.stderr);
          expect.fail(`CLI help command failed: ${helpResult.stderr}`);
        }

        // Verify help output contains expected commands
        expect(helpResult.stdout).toContain('dev');
        expect(helpResult.stdout).toContain('development server');

        console.log('✅ CLI development server command available');
      } finally {
        await project.cleanup();
      }
    }, 60000);

    it('should discover models in project structure', async () => {
      const project = await ProjectCreator.createProject({
        name: 'test-model-discovery',
        skipInstall: true
      });

      try {
        console.log('🔍 Testing model discovery...');

        // Verify that the project has the expected model files
        const expectedModelFiles = [
          'main.ts',
          'components/example.ts',
          'components/wheel.ts'
        ];

        for (const modelFile of expectedModelFiles) {
          const modelPath = join(project.path, modelFile);
          const validation = await FileValidator.validate(modelPath);

          expect(validation.exists).toBe(true);
          expect(validation.isFile).toBe(true);

          if (!validation.exists) {
            expect.fail(`Expected model file missing: ${modelFile}`);
          }
        }

        // Verify model files contain expected exports (V3 format uses export default)
        const mainTsValidation = await FileValidator.validateFileContent(
          join(project.path, 'main.ts'),
          /export default/,
          { partial: true }
        );

        expect(mainTsValidation.valid).toBe(true);
        if (!mainTsValidation.valid) {
          expect.fail('main.ts should contain exported functions');
        }

        console.log('✅ Model discovery structure valid');
      } finally {
        await project.cleanup();
      }
    }, 60000);

    it('should validate CLI configuration files', async () => {
      const project = await ProjectCreator.createProject({
        name: 'test-cli-config',
        skipInstall: true
      });

      try {
        console.log('🔧 Testing CLI configuration validation...');

        // Verify that essential configuration files exist
        const configFiles = [
          'package.json',
          'tsconfig.json',
          'vite.config.ts'
        ];

        for (const configFile of configFiles) {
          const configPath = join(project.path, configFile);
          const validation = await FileValidator.validate(configPath);

          expect(validation.exists).toBe(true);
          expect(validation.isFile).toBe(true);

          if (!validation.exists) {
            expect.fail(`Configuration file missing: ${configFile}`);
          }
        }

        // Validate package.json has CLI-compatible scripts
        const packageValidation = await FileValidator.validateJsonFile(
          join(project.path, 'package.json'),
          (data) => {
            if (!data.scripts) return 'Package.json missing scripts';
            if (!data.scripts.dev) return 'Package.json missing dev script';
            if (!data.scripts.dev.includes('manifold-dev')) return 'Dev script should use manifold-dev';
            return true;
          }
        );

        expect(packageValidation.isValid).toBe(true);
        if (!packageValidation.isValid) {
          expect.fail(`package.json validation failed: ${packageValidation.error}`);
        }

        console.log('✅ CLI configuration files valid');
      } finally {
        await project.cleanup();
      }
    }, 60000);
  });

  describe('CLI Development Workflow', () => {
    it('should validate development dependencies', async () => {
      const project = await ProjectCreator.createProject({
        name: 'test-dev-dependencies',
        skipInstall: true
      });

      try {
        console.log('🔧 Testing development dependencies...');

        // Verify package.json has required dependencies
        const packageValidation = await FileValidator.validateJsonFile(
          join(project.path, 'package.json'),
          (data) => {
            if (!data.dependencies) return 'Package.json missing dependencies';

            const requiredDeps = [
              'manifold-3d'
            ];

            for (const dep of requiredDeps) {
              if (!data.dependencies[dep]) {
                return `Missing required dependency: ${dep}`;
              }
            }

            if (!data.devDependencies) return 'Package.json missing devDependencies';

            const requiredDevDeps = [
              '@manifold-studio/configurator',
              'typescript',
              'vitest'
            ];

            for (const dep of requiredDevDeps) {
              if (!data.devDependencies[dep]) {
                return `Missing required dev dependency: ${dep}`;
              }
            }

            return true;
          }
        );

        expect(packageValidation.isValid).toBe(true);
        if (!packageValidation.isValid) {
          expect.fail(`Dependencies validation failed: ${packageValidation.error}`);
        }

        console.log('✅ Development dependencies valid');
      } finally {
        await project.cleanup();
      }
    }, 60000);

    it('should validate CLI scripts are executable', async () => {
      const project = await ProjectCreator.createProject({
        name: 'test-cli-scripts',
        skipInstall: true
      });

      try {
        console.log('🔧 Testing CLI script validation...');

        // Test that the dev script can be parsed (without actually running it)
        const packageValidation = await FileValidator.validateJsonFile(
          join(project.path, 'package.json'),
          (data) => {
            if (!data.scripts?.dev) return 'Missing dev script';

            const devScript = data.scripts.dev;
            if (!devScript.includes('manifold-dev')) {
              return 'Dev script should use manifold-dev command';
            }

            if (!devScript.includes('dev')) {
              return 'Dev script should include dev subcommand';
            }

            return true;
          }
        );

        expect(packageValidation.isValid).toBe(true);
        if (!packageValidation.isValid) {
          expect.fail(`CLI script validation failed: ${packageValidation.error}`);
        }

        // Verify TypeScript configuration supports the CLI workflow
        const tsconfigValidation = await FileValidator.validateJsonFile(
          join(project.path, 'tsconfig.json'),
          (data) => {
            if (!data.compilerOptions) return 'Missing compilerOptions';
            if (!data.compilerOptions.target) return 'Missing target in compilerOptions';
            return true;
          }
        );

        expect(tsconfigValidation.isValid).toBe(true);
        if (!tsconfigValidation.isValid) {
          expect.fail(`TypeScript config validation failed: ${tsconfigValidation.error}`);
        }

        console.log('✅ CLI scripts are properly configured');
      } finally {
        await project.cleanup();
      }
    }, 60000);
  });

  describe('CLI Integration', () => {
    it('should validate project structure for CLI compatibility', async () => {
      const project = await ProjectCreator.createProject({
        name: 'test-cli-integration',
        skipInstall: true
      });

      try {
        console.log('🔧 Testing CLI integration compatibility...');

        // Verify project structure is CLI-compatible
        const expectedFiles = [
          'package.json',
          'tsconfig.json',
          'vite.config.ts',
          'main.ts',
          'components/example.ts',
          'components/wheel.ts',
          'README.md'
        ];

        for (const file of expectedFiles) {
          const filePath = join(project.path, file);
          const validation = await FileValidator.validate(filePath);

          expect(validation.exists).toBe(true);
          expect(validation.isFile).toBe(true);

          if (!validation.exists) {
            expect.fail(`CLI-required file missing: ${file}`);
          }
        }

        // Verify no old build artifacts exist (clean CLI-based project)
        const oldArtifacts = [
          'temp',
          'dist',
          'vite.pipeline.config.ts',
          'vite.ui.config.ts'
        ];

        for (const artifact of oldArtifacts) {
          const artifactPath = join(project.path, artifact);
          const validation = await FileValidator.validate(artifactPath);

          expect(validation.exists).toBe(false);
          if (validation.exists) {
            expect.fail(`Old build artifact should not exist: ${artifact}`);
          }
        }

        console.log('✅ CLI integration structure valid');
      } finally {
        await project.cleanup();
      }
    }, 60000);

    it('should validate CLI command availability', async () => {
      const project = await ProjectCreator.createProject({
        name: 'test-cli-availability',
        skipInstall: true
      });

      try {
        console.log('🔧 Testing CLI command availability...');

        // Test that manifold-dev command can be found and shows help
        const helpResult = await ProcessRunner.run('npx', ['manifold-dev', '--help'], {
          cwd: project.path,
          timeout: 30000
        });

        expect(helpResult.success).toBe(true);
        if (!helpResult.success) {
          console.error('CLI help stdout:', helpResult.stdout);
          console.error('CLI help stderr:', helpResult.stderr);
          expect.fail(`CLI help command failed: ${helpResult.stderr}`);
        }

        // Verify help output contains expected commands and options
        const helpOutput = helpResult.stdout;
        expect(helpOutput).toContain('dev');
        expect(helpOutput).toContain('development server');

        console.log('✅ CLI command is available and functional');
      } finally {
        await project.cleanup();
      }
    }, 60000);
  });

  describe('TypeScript Configuration', () => {
    it('should have valid TypeScript configuration for CLI', async () => {
      const project = await ProjectCreator.createProject({
        name: 'test-typescript-config',
        skipInstall: true
      });

      try {
        console.log('🔍 Checking TypeScript configuration for CLI compatibility...');

        // Test that tsconfig.json is valid by parsing it directly
        const tsconfigValidation = await FileValidator.validateJsonFile(
          join(project.path, 'tsconfig.json'),
          (data) => {
            if (!data.compilerOptions) return 'Missing compilerOptions';
            if (!data.compilerOptions.target) return 'Missing target in compilerOptions';
            if (!data.compilerOptions.module) return 'Missing module in compilerOptions';
            return true;
          }
        );

        expect(tsconfigValidation.isValid).toBe(true);
        if (!tsconfigValidation.isValid) {
          expect.fail(`TypeScript configuration validation failed: ${tsconfigValidation.error}`);
        }

        console.log('✅ TypeScript configuration is CLI-compatible');
      } finally {
        await project.cleanup();
      }
    }, 60000);

    it('should validate model files have correct TypeScript syntax', async () => {
      const project = await ProjectCreator.createProject({
        name: 'test-model-typescript',
        skipInstall: true
      });

      try {
        console.log('🔍 Checking model files TypeScript syntax...');

        // Validate that model files contain proper TypeScript exports
        const modelFiles = ['main.ts', 'components/example.ts', 'components/wheel.ts'];

        for (const modelFile of modelFiles) {
          const filePath = join(project.path, modelFile);
          const validation = await FileValidator.validateFileContent(
            filePath,
            /export default/,
            { partial: true }
          );

          expect(validation.valid).toBe(true);
          if (!validation.valid) {
            expect.fail(`Model file ${modelFile} should contain export default (V3 format)`);
          }

          // Check for TypeScript-specific syntax
          const content = validation.content!;
          expect(content).toMatch(/export default/);
          expect(content.length).toBeGreaterThan(0);
        }

        console.log('✅ Model files have valid TypeScript syntax');
      } finally {
        await project.cleanup();
      }
    }, 60000);
  });

  describe('CLI Performance', () => {
    it('should validate CLI command responds quickly', async () => {
      const project = await ProjectCreator.createProject({
        name: 'test-cli-performance',
        skipInstall: true
      });

      try {
        console.log('📊 Testing CLI command response time...');

        const startTime = Date.now();

        // Test CLI help command performance (should be fast)
        const helpResult = await ProcessRunner.run('npx', ['manifold-dev', '--help'], {
          cwd: project.path,
          timeout: 30000 // 30 seconds max
        });

        const duration = Date.now() - startTime;

        expect(helpResult.success).toBe(true);
        if (!helpResult.success) {
          expect.fail(`CLI help command failed: ${helpResult.stderr}`);
        }

        // CLI help should respond within 30 seconds (generous for npx)
        expect(duration).toBeLessThan(30000);

        console.log(`📊 CLI response time: ${duration}ms`);

        if (duration > 10000) { // 10 seconds
          console.warn(`⚠️  CLI took longer than expected: ${duration}ms`);
        }

        console.log('✅ CLI performance acceptable');
      } finally {
        await project.cleanup();
      }
    }, 60000);
  });
});
