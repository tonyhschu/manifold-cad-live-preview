import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ProjectCreator, ProcessRunner, TempDir, FileValidator } from '../utils/index.js';
import { join } from 'path';

describe('Build System Testing', () => {
  beforeAll(async () => {
    const nodeVersion = await ProcessRunner.getNodeVersion();
    console.log(`🔧 Testing builds with node ${nodeVersion}`);
  });

  afterAll(async () => {
    await TempDir.cleanupAll();
  });

  describe('Pipeline Build', () => {
    it('should build pipeline successfully', async () => {
      const project = await ProjectCreator.createProjectWithInstall({
        projectName: 'test-pipeline-build'
      });

      try {
        console.log('🔧 Testing pipeline build...');
        const buildResult = await ProcessRunner.npmRun('build:pipeline', project.path, {
          timeout: 120000 // 2 minutes
        });

        expect(buildResult.success).toBe(true);
        if (!buildResult.success) {
          console.error('Pipeline build stdout:', buildResult.stdout);
          console.error('Pipeline build stderr:', buildResult.stderr);
          expect.fail(`Pipeline build failed: ${buildResult.stderr}`);
        }

        // Check that pipeline artifacts exist
        const expectedArtifacts = [
          'temp/pipeline.js',
          'temp/manifest.json'
        ];

        for (const artifact of expectedArtifacts) {
          const artifactPath = join(project.path, artifact);
          const validation = await FileValidator.validate(artifactPath);
          
          expect(validation.exists).toBe(true);
          expect(validation.isFile).toBe(true);
          
          if (!validation.exists) {
            expect.fail(`Pipeline artifact missing: ${artifact}`);
          }
        }

        console.log('✅ Pipeline build successful');
      } finally {
        await project.cleanup();
      }
    }, 180000);

    it('should generate valid pipeline.js', async () => {
      const project = await ProjectCreator.createProjectWithInstall({
        projectName: 'test-pipeline-js-validity'
      });

      try {
        const buildResult = await ProjectCreator.testProjectBuild(project.path);
        expect(buildResult.success).toBe(true);

        // Validate pipeline.js content
        const pipelineValidation = await FileValidator.validateFileContent(
          join(project.path, 'temp/pipeline.js'),
          /export.*default/,
          { partial: true }
        );

        expect(pipelineValidation.valid).toBe(true);
        if (!pipelineValidation.valid) {
          expect.fail('pipeline.js should contain export default');
        }

        // Check that it's valid JavaScript (basic syntax check)
        const content = pipelineValidation.content!;
        expect(content.length).toBeGreaterThan(0);
        expect(content).not.toContain('undefined');

        console.log('✅ pipeline.js is valid');
      } finally {
        await project.cleanup();
      }
    }, 180000);

    it('should generate valid manifest.json', async () => {
      const project = await ProjectCreator.createProjectWithInstall({
        projectName: 'test-manifest-validity'
      });

      try {
        await ProcessRunner.npmRun('build:pipeline', project.path);

        // Validate manifest.json
        const manifestValidation = await FileValidator.validateJsonFile(
          join(project.path, 'temp/manifest.json'),
          (data) => {
            if (!data.models) return 'Manifest missing models array';
            if (!Array.isArray(data.models)) return 'Models should be an array';
            
            // Check that we have at least one model
            if (data.models.length === 0) return 'Manifest should contain at least one model';
            
            // Validate model structure
            for (const model of data.models) {
              if (!model.id) return 'Model missing id field';
              if (!model.name) return 'Model missing name field';
              if (!model.path) return 'Model missing path field';
            }

            return true;
          }
        );

        expect(manifestValidation.valid).toBe(true);
        if (!manifestValidation.valid) {
          expect.fail(`manifest.json validation failed: ${manifestValidation.error}`);
        }

        console.log('✅ manifest.json is valid');
      } finally {
        await project.cleanup();
      }
    }, 180000);
  });

  describe('UI Build', () => {
    it('should build UI successfully', async () => {
      const project = await ProjectCreator.createProjectWithInstall({
        projectName: 'test-ui-build'
      });

      try {
        // Build pipeline first (UI build depends on it)
        await ProcessRunner.npmRun('build:pipeline', project.path);

        console.log('🔧 Testing UI build...');
        const buildResult = await ProcessRunner.npmRun('build:ui', project.path, {
          timeout: 120000 // 2 minutes
        });

        expect(buildResult.success).toBe(true);
        if (!buildResult.success) {
          console.error('UI build stdout:', buildResult.stdout);
          console.error('UI build stderr:', buildResult.stderr);
          expect.fail(`UI build failed: ${buildResult.stderr}`);
        }

        // Check that UI artifacts exist
        const expectedArtifacts = [
          'dist/index.html',
          'dist/assets'
        ];

        for (const artifact of expectedArtifacts) {
          const artifactPath = join(project.path, artifact);
          const validation = await FileValidator.validate(artifactPath);
          
          expect(validation.exists).toBe(true);
          
          if (!validation.exists) {
            expect.fail(`UI artifact missing: ${artifact}`);
          }
        }

        console.log('✅ UI build successful');
      } finally {
        await project.cleanup();
      }
    }, 240000);

    it('should generate valid HTML output', async () => {
      const project = await ProjectCreator.createProjectWithInstall({
        projectName: 'test-html-validity'
      });

      try {
        // Build both pipeline and UI
        await ProcessRunner.npmRun('build:pipeline', project.path);
        await ProcessRunner.npmRun('build:ui', project.path);

        // Validate index.html
        const htmlValidation = await FileValidator.validateFileContent(
          join(project.path, 'dist/index.html'),
          /<!DOCTYPE html>/,
          { partial: true }
        );

        expect(htmlValidation.valid).toBe(true);
        if (!htmlValidation.valid) {
          expect.fail('dist/index.html should be valid HTML');
        }

        const content = htmlValidation.content!;
        
        // Check for essential HTML elements
        expect(content).toContain('<html');
        expect(content).toContain('<head>');
        expect(content).toContain('<body>');
        expect(content).toContain('<script');

        console.log('✅ Generated HTML is valid');
      } finally {
        await project.cleanup();
      }
    }, 240000);
  });

  describe('Combined Build', () => {
    it('should build both pipeline and UI with build script', async () => {
      const project = await ProjectCreator.createProjectWithInstall({
        projectName: 'test-combined-build'
      });

      try {
        console.log('🔧 Testing combined build...');
        const buildResult = await ProcessRunner.npmRun('build', project.path, {
          timeout: 180000 // 3 minutes
        });

        expect(buildResult.success).toBe(true);
        if (!buildResult.success) {
          console.error('Combined build stdout:', buildResult.stdout);
          console.error('Combined build stderr:', buildResult.stderr);
          expect.fail(`Combined build failed: ${buildResult.stderr}`);
        }

        // Check that all artifacts exist
        const expectedArtifacts = [
          'temp/pipeline.js',
          'temp/manifest.json',
          'dist/index.html',
          'dist/assets'
        ];

        for (const artifact of expectedArtifacts) {
          const artifactPath = join(project.path, artifact);
          const validation = await FileValidator.validate(artifactPath);
          
          expect(validation.exists).toBe(true);
          if (!validation.exists) {
            expect.fail(`Build artifact missing: ${artifact}`);
          }
        }

        console.log('✅ Combined build successful');
      } finally {
        await project.cleanup();
      }
    }, 240000);

    it('should use ProjectCreator testProjectBuild utility', async () => {
      const project = await ProjectCreator.createProjectWithInstall({
        projectName: 'test-project-creator-build'
      });

      try {
        const buildResult = await ProjectCreator.testProjectBuild(project.path);
        
        expect(buildResult.success).toBe(true);
        if (!buildResult.success) {
          console.error('Build errors:', buildResult.errors);
          expect.fail(`Build test failed: ${buildResult.errors.join(', ')}`);
        }

        console.log('✅ ProjectCreator build test passed');
      } finally {
        await project.cleanup();
      }
    }, 240000);
  });

  describe('TypeScript Compilation', () => {
    it('should have no TypeScript errors', async () => {
      const project = await ProjectCreator.createProjectWithInstall({
        projectName: 'test-typescript-errors'
      });

      try {
        // Run TypeScript compiler check
        console.log('🔍 Checking TypeScript compilation...');
        const tscResult = await ProcessRunner.run('npx', ['tsc', '--noEmit'], {
          cwd: project.path,
          timeout: 60000
        });

        expect(tscResult.success).toBe(true);
        if (!tscResult.success) {
          console.error('TypeScript errors:', tscResult.stdout);
          console.error('TypeScript stderr:', tscResult.stderr);
          expect.fail(`TypeScript compilation failed: ${tscResult.stdout}`);
        }

        console.log('✅ No TypeScript errors');
      } finally {
        await project.cleanup();
      }
    }, 120000);

    it('should have valid TypeScript configuration', async () => {
      const project = await ProjectCreator.createProjectWithInstall({
        projectName: 'test-tsconfig-validity'
      });

      try {
        // Test that tsconfig.json is valid by running tsc --showConfig
        const configResult = await ProcessRunner.run('npx', ['tsc', '--showConfig'], {
          cwd: project.path,
          timeout: 30000
        });

        expect(configResult.success).toBe(true);
        if (!configResult.success) {
          expect.fail(`TypeScript config invalid: ${configResult.stderr}`);
        }

        // Parse the config output to ensure it's valid JSON
        try {
          JSON.parse(configResult.stdout);
          console.log('✅ TypeScript configuration is valid');
        } catch (error) {
          expect.fail(`TypeScript config output is not valid JSON: ${error}`);
        }
      } finally {
        await project.cleanup();
      }
    }, 60000);
  });

  describe('Build Performance', () => {
    it('should complete builds within reasonable time', async () => {
      const project = await ProjectCreator.createProjectWithInstall({
        projectName: 'test-build-performance'
      });

      try {
        const startTime = Date.now();
        
        const buildResult = await ProcessRunner.npmRun('build', project.path, {
          timeout: 180000 // 3 minutes max
        });

        const duration = Date.now() - startTime;
        
        expect(buildResult.success).toBe(true);
        
        // Build should complete within 3 minutes (generous)
        expect(duration).toBeLessThan(180000);
        
        console.log(`📊 Build performance: ${duration}ms`);
        
        if (duration > 60000) { // 1 minute
          console.warn(`⚠️  Build took longer than expected: ${duration}ms`);
        }

        console.log('✅ Build performance acceptable');
      } finally {
        await project.cleanup();
      }
    }, 240000);
  });
});
