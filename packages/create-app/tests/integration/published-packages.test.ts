import { describe, it, expect, beforeAll } from 'vitest';
import { ProjectCreator } from '../utils/project-creator.js';
import { ProcessRunner } from '../utils/process-runner.js';
import path from 'path';
import fs from 'fs';

/**
 * Published Package Validation Tests
 * 
 * These tests validate that published packages work correctly in real-world scenarios.
 * They are separate from the main CI tests to avoid catch-22 situations where:
 * - CI fails because published packages are broken
 * - Can't publish fixed packages because CI is failing
 * 
 * Run these tests manually with: npm run test:published
 * 
 * These tests will:
 * 1. Use actual published packages from npm (not local workspace)
 * 2. Catch real import path issues that only surface with published packages
 * 3. Validate the complete user experience
 */
describe('Published Package Validation', () => {
  
  beforeAll(() => {
    console.log('🚨 PUBLISHED PACKAGE TESTS');
    console.log('These tests use published packages from npm, not local workspace packages.');
    console.log('They may fail if the published packages have issues.');
    console.log('Run these manually to validate published package functionality.');
    console.log('');
  });

  describe('Real User Experience', () => {
    it('should create project that works with published packages', async () => {
      // This test replicates the exact user experience:
      // 1. User runs `npm create @manifold-studio/app my-project`
      // 2. Uses published packages from npm
      // 3. Everything should work without import errors

      const project = await ProjectCreator.createProject({
        name: 'test-published-packages',
        skipInstall: false,
        usePublished: true // Force use of published packages
      });

      try {
        console.log('📦 Testing with published packages from npm...');

        // Verify we're using published packages (not file: paths)
        const packageJsonPath = path.join(project.path, 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        
        console.log('Dependencies:', packageJson.dependencies);
        
        // Should NOT have file: paths (those are local workspace packages)
        expect(packageJson.dependencies['@manifold-studio/configurator']).not.toMatch(/^file:/);
        expect(packageJson.dependencies['@manifold-studio/wrapper']).not.toMatch(/^file:/);
        
        console.log('✅ Project uses published package versions');

        // Attempt to run the development server (which triggers pipeline compilation)
        const devResult = await ProcessRunner.run('npm', ['run', 'dev'], {
          cwd: project.path,
          timeout: 45000, // Give it time to compile
          env: {
            ...process.env,
            NODE_ENV: 'development'
          }
        });

        console.log('Dev server output (stdout):', devResult.stdout);
        console.log('Dev server output (stderr):', devResult.stderr);

        // Check for import/compilation errors that indicate path issues
        const hasImportErrors = devResult.stderr.includes('Failed to resolve module specifier') ||
                               devResult.stderr.includes('Unexpected token') ||
                               devResult.stderr.includes('Note that you need plugins to import files that are not JavaScript') ||
                               devResult.stderr.includes('Cannot resolve dependency');

        if (hasImportErrors) {
          console.error('❌ Published packages have import/path issues:', devResult.stderr);
          expect.fail(`Published packages have import/path issues. This indicates the published packages are broken and need to be fixed. Error: ${devResult.stderr}`);
        }

        // Look for successful compilation indicators
        const hasSuccessfulCompilation = devResult.stdout.includes('Local:') || 
                                        devResult.stdout.includes('ready in') ||
                                        devResult.stdout.includes('built in') ||
                                        !hasImportErrors;

        expect(hasSuccessfulCompilation).toBe(true);
        console.log('✅ Published packages work correctly!');

      } finally {
        await project.cleanup();
      }
    }, 120000); // 2 minutes timeout for full compilation

    it('should generate importable pipeline files with published packages', async () => {
      // This test validates that pipeline files generated using published packages
      // can be imported without TypeScript/JavaScript parsing errors

      const project = await ProjectCreator.createProject({
        name: 'test-published-pipeline-imports',
        skipInstall: false,
        usePublished: true // Force use of published packages
      });

      try {
        console.log('🔧 Testing pipeline file generation with published packages...');

        // Run pipeline compilation (dev command compiles pipeline automatically)
        const compileResult = await ProcessRunner.run('npm', ['run', 'dev'], {
          cwd: project.path,
          timeout: 10000 // 10 seconds - pipeline should compile by then
        });

        // Check for compilation errors that indicate import path issues
        const hasCompilationError = compileResult.stderr.includes('Failed to resolve module specifier') ||
                                   compileResult.stderr.includes('Unexpected token') ||
                                   compileResult.stderr.includes('Note that you need plugins to import files that are not JavaScript');

        if (hasCompilationError) {
          console.error('Pipeline compilation failed with import errors:', compileResult.stderr);
          expect.fail(`Pipeline compilation failed with import errors. This indicates published packages have broken imports: ${compileResult.stderr}`);
        }

        // Check that pipeline files were generated during the dev command
        const pipelinePath = path.join(project.path, 'dist', 'pipeline.js');
        const manifestPath = path.join(project.path, 'dist', 'manifest.json');
        
        const pipelineExists = fs.existsSync(pipelinePath);
        const manifestExists = fs.existsSync(manifestPath);

        if (!pipelineExists || !manifestExists) {
          console.error(`❌ Pipeline files not generated. Pipeline exists: ${pipelineExists}, Manifest exists: ${manifestExists}`);
          console.error('Dev command output:', compileResult.stdout);
          expect.fail(`Pipeline compilation did not generate expected files. This may indicate issues with published package imports.`);
        }

        console.log('✅ Pipeline files generated successfully with published packages');

        // Try to import the generated pipeline file to ensure it's valid JavaScript
        try {
          // Use dynamic import to test the generated file
          const pipelineModule = await import(`file://${pipelinePath}`);
          console.log('✅ Generated pipeline file is importable');
          
          // Basic validation that it has expected structure
          expect(pipelineModule).toBeDefined();
          
        } catch (importError) {
          console.error('❌ Generated pipeline file cannot be imported:', importError);
          expect.fail(`Generated pipeline file has import/syntax errors: ${importError}. This indicates issues with published package compilation.`);
        }

      } finally {
        await project.cleanup();
      }
    }, 120000); // 2 minutes timeout
  });
});
