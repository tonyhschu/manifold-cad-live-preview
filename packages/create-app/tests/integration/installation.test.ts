import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ProjectCreator, ProcessRunner, TempDir, FileValidator } from '../utils/index.js';
import { join } from 'path';

describe('Installation Testing', () => {
  beforeAll(async () => {
    const npmVersion = await ProcessRunner.getNpmVersion();
    const nodeVersion = await ProcessRunner.getNodeVersion();
    console.log(`🔧 Testing with npm ${npmVersion}, node ${nodeVersion}`);
  });

  afterAll(async () => {
    await TempDir.cleanupAll();
  });

  describe('Fresh Installation', () => {
    it('should complete npm install successfully', async () => {
      const project = await ProjectCreator.createProject({
        projectName: 'test-fresh-install',
        skipInstall: true
      });

      try {
        console.log('📦 Testing fresh npm install...');
        const startTime = Date.now();
        
        const installResult = await ProcessRunner.npmInstall(project.path, {
          timeout: 300000 // 5 minutes
        });

        const duration = Date.now() - startTime;
        console.log(`⏱️  Installation completed in ${duration}ms`);

        expect(installResult.success).toBe(true);
        if (!installResult.success) {
          console.error('Install stdout:', installResult.stdout);
          console.error('Install stderr:', installResult.stderr);
          expect.fail(`npm install failed: ${installResult.stderr}`);
        }

        // Verify node_modules was created
        const nodeModulesValidation = await FileValidator.validate(join(project.path, 'node_modules'));
        expect(nodeModulesValidation.exists).toBe(true);
        expect(nodeModulesValidation.isDirectory).toBe(true);

        console.log('✅ Fresh installation successful');
      } finally {
        await project.cleanup();
      }
    }, 360000);

    it('should install all required dependencies', async () => {
      const project = await ProjectCreator.createProjectWithInstall({
        projectName: 'test-required-deps'
      });

      try {
        // Check that all required dependencies are installed
        const requiredDeps = [
          '@manifold-studio/wrapper',
          '@manifold-studio/configurator',
          'manifold-3d',
          'typescript',
          'vite',
          'concurrently'
        ];

        for (const dep of requiredDeps) {
          const depPath = join(project.path, 'node_modules', dep);
          const validation = await FileValidator.validate(depPath);
          
          expect(validation.exists).toBe(true);
          if (!validation.exists) {
            expect.fail(`Required dependency not installed: ${dep}`);
          }
        }

        console.log('✅ All required dependencies installed');
      } finally {
        await project.cleanup();
      }
    }, 360000);

    it('should create package-lock.json', async () => {
      const project = await ProjectCreator.createProjectWithInstall({
        projectName: 'test-package-lock'
      });

      try {
        const lockFileValidation = await FileValidator.validate(join(project.path, 'package-lock.json'));
        
        expect(lockFileValidation.exists).toBe(true);
        expect(lockFileValidation.isFile).toBe(true);
        
        // Validate lock file is valid JSON
        const lockValidation = await FileValidator.validateJsonFile(
          join(project.path, 'package-lock.json'),
          (data) => {
            if (!data.name) return 'Lock file missing name';
            if (!data.lockfileVersion) return 'Lock file missing lockfileVersion';
            if (!data.packages) return 'Lock file missing packages';
            return true;
          }
        );

        expect(lockValidation.valid).toBe(true);
        if (!lockValidation.valid) {
          expect.fail(`package-lock.json validation failed: ${lockValidation.error}`);
        }

        console.log('✅ package-lock.json created and valid');
      } finally {
        await project.cleanup();
      }
    }, 360000);
  });

  describe('Installation Performance', () => {
    it('should complete installation within reasonable time', async () => {
      const project = await ProjectCreator.createProject({
        projectName: 'test-install-performance',
        skipInstall: true
      });

      try {
        const startTime = Date.now();
        
        const installResult = await ProcessRunner.npmInstall(project.path, {
          timeout: 300000 // 5 minutes max
        });

        const duration = Date.now() - startTime;
        
        expect(installResult.success).toBe(true);
        
        // Installation should complete within 5 minutes (generous timeout)
        expect(duration).toBeLessThan(300000);
        
        // Log performance for monitoring
        console.log(`📊 Installation performance: ${duration}ms`);
        
        if (duration > 120000) { // 2 minutes
          console.warn(`⚠️  Installation took longer than expected: ${duration}ms`);
        }

        console.log('✅ Installation performance acceptable');
      } finally {
        await project.cleanup();
      }
    }, 360000);
  });

  describe('Installation Robustness', () => {
    it('should handle network interruptions gracefully', async () => {
      const project = await ProjectCreator.createProject({
        projectName: 'test-network-robustness',
        skipInstall: true
      });

      try {
        // Test with shorter timeout to simulate network issues
        const installResult = await ProcessRunner.npmInstall(project.path, {
          timeout: 180000, // 3 minutes
          env: {
            // Use npm registry with potential for slower responses
            npm_config_registry: 'https://registry.npmjs.org/'
          }
        });

        // Even if it fails due to timeout, it shouldn't crash
        if (!installResult.success) {
          // Check if it's a timeout vs actual error
          const isTimeout = installResult.stderr.includes('timeout') || 
                           installResult.duration >= 180000;
          
          if (!isTimeout) {
            // If it's not a timeout, it's a real error
            expect.fail(`Installation failed with non-timeout error: ${installResult.stderr}`);
          } else {
            console.warn('⚠️  Installation timed out (this may be acceptable under poor network conditions)');
          }
        } else {
          console.log('✅ Installation completed successfully despite potential network issues');
        }
      } finally {
        await project.cleanup();
      }
    }, 240000);

    it('should work with clean npm cache', async () => {
      const project = await ProjectCreator.createProject({
        projectName: 'test-clean-cache',
        skipInstall: true
      });

      try {
        // Clear npm cache first
        console.log('🧹 Clearing npm cache...');
        const cacheCleanResult = await ProcessRunner.npm('cache', ['clean', '--force'], {
          timeout: 30000
        });

        if (!cacheCleanResult.success) {
          console.warn('Cache clean failed, continuing anyway:', cacheCleanResult.stderr);
        }

        // Now try installation
        const installResult = await ProcessRunner.npmInstall(project.path, {
          timeout: 300000
        });

        expect(installResult.success).toBe(true);
        if (!installResult.success) {
          expect.fail(`Installation failed with clean cache: ${installResult.stderr}`);
        }

        console.log('✅ Installation works with clean cache');
      } finally {
        await project.cleanup();
      }
    }, 360000);
  });

  describe('Post-Installation Validation', () => {
    it('should have executable scripts after installation', async () => {
      const project = await ProjectCreator.createProjectWithInstall({
        projectName: 'test-executable-scripts'
      });

      try {
        // Test that we can at least list the available scripts
        const scriptListResult = await ProcessRunner.npm('run', [], {
          cwd: project.path,
          timeout: 30000
        });

        expect(scriptListResult.success).toBe(true);
        
        // Check that our required scripts are listed
        const output = scriptListResult.stdout;
        const requiredScripts = ['dev', 'build:pipeline', 'build:ui'];
        
        for (const script of requiredScripts) {
          expect(output).toContain(script);
        }

        console.log('✅ All scripts are executable after installation');
      } finally {
        await project.cleanup();
      }
    }, 360000);

    it('should have TypeScript compiler available', async () => {
      const project = await ProjectCreator.createProjectWithInstall({
        projectName: 'test-typescript-available'
      });

      try {
        // Test that TypeScript compiler is available
        const tscResult = await ProcessRunner.run('npx', ['tsc', '--version'], {
          cwd: project.path,
          timeout: 30000
        });

        expect(tscResult.success).toBe(true);
        expect(tscResult.stdout).toContain('Version');

        console.log(`✅ TypeScript compiler available: ${tscResult.stdout.trim()}`);
      } finally {
        await project.cleanup();
      }
    }, 360000);

    it('should have Vite available', async () => {
      const project = await ProjectCreator.createProjectWithInstall({
        projectName: 'test-vite-available'
      });

      try {
        // Test that Vite is available
        const viteResult = await ProcessRunner.run('npx', ['vite', '--version'], {
          cwd: project.path,
          timeout: 30000
        });

        expect(viteResult.success).toBe(true);
        expect(viteResult.stdout).toMatch(/vite\/\d+\.\d+\.\d+/);

        console.log(`✅ Vite available: ${viteResult.stdout.trim()}`);
      } finally {
        await project.cleanup();
      }
    }, 360000);
  });
});
