import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ProjectCreator, ProcessRunner, TempDir } from '../utils/index.js';
import { join } from 'path';
import { readFile } from 'fs/promises';

describe('Pipeline Compilation Integration', () => {
  beforeAll(async () => {
    const info = await ProjectCreator.getCreateAppInfo();
    if (!info.available) {
      throw new Error(`create-app CLI not available: ${info.error}`);
    }
    console.log(`✅ create-app CLI available (version: ${info.version})`);
  });

  afterAll(async () => {
    await TempDir.cleanupAll();
  });

  describe('Real User Journey: Pipeline Compilation', () => {
    it('should create project that can successfully compile pipeline with published packages', async () => {
      // This test replicates the exact user experience:
      // 1. User runs `npm create @manifold-studio/app my-project`
      // 2. User runs `npm run dev` 
      // 3. Pipeline compilation should work without import errors

      const project = await ProjectCreator.createProject({
        name: 'test-pipeline-compilation',
        skipInstall: false, // CRITICAL: Must install real published packages
        usePublished: true  // CRITICAL: Must use published packages, not local file: paths
      });

      try {
        console.log('🔧 Testing pipeline compilation with published packages...');

        // Verify the project was created with published package dependencies
        const packageJsonPath = join(project.path, 'package.json');
        const packageJsonContent = await readFile(packageJsonPath, 'utf-8');
        const packageJson = JSON.parse(packageJsonContent);
        
        // Ensure we're testing with published packages (not file: paths)
        expect(packageJson.dependencies['@manifold-studio/configurator']).toMatch(/^\^/);
        expect(packageJson.dependencies['@manifold-studio/wrapper']).toMatch(/^\^/);
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

        // Check for specific import errors that we've been encountering
        const hasImportError = devResult.stderr.includes('Failed to resolve module specifier') ||
                              devResult.stderr.includes('Unexpected token') ||
                              devResult.stderr.includes('Note that you need plugins to import files that are not JavaScript');

        if (hasImportError) {
          console.error('❌ Pipeline compilation failed with import errors:');
          console.error('STDOUT:', devResult.stdout);
          console.error('STDERR:', devResult.stderr);
          expect.fail(`Pipeline compilation failed with import resolution errors. This indicates the published packages have broken imports.`);
        }

        // Success indicators
        const hasSuccessfulCompilation = devResult.stdout.includes('Pipeline compiler generated manifest') ||
                                        devResult.stdout.includes('✅ Vite build completed successfully');

        if (!hasSuccessfulCompilation) {
          console.error('❌ Pipeline compilation did not complete successfully:');
          console.error('STDOUT:', devResult.stdout);
          console.error('STDERR:', devResult.stderr);
          expect.fail(`Pipeline compilation did not show success indicators`);
        }

        console.log('✅ Pipeline compilation completed successfully');
        expect(hasSuccessfulCompilation).toBe(true);

      } finally {
        await project.cleanup();
      }
    }, 120000); // 2 minutes timeout for full compilation

    it('should generate importable pipeline files', async () => {
      // This test specifically validates that the generated pipeline files
      // can be imported without TypeScript/JavaScript parsing errors

      const project = await ProjectCreator.createProject({
        name: 'test-pipeline-imports',
        skipInstall: false,
        usePublished: true
      });

      try {
        console.log('🔧 Testing generated pipeline file imports...');

        // Run pipeline compilation (dev command compiles pipeline automatically)
        const compileResult = await ProcessRunner.run('timeout', ['10s', 'npm', 'run', 'dev'], {
          cwd: project.path,
          timeout: 15000
        });

        // Dev command will timeout after 10s, but pipeline should be compiled by then
        // We expect it to timeout (exit code 124) after successful compilation
        const hasCompilationError = compileResult.stderr.includes('Failed to resolve module specifier') ||
                                   compileResult.stderr.includes('Unexpected token') ||
                                   compileResult.stderr.includes('Note that you need plugins to import files that are not JavaScript');

        if (hasCompilationError) {
          console.error('Pipeline compilation failed with import errors:', compileResult.stderr);
          expect.fail(`Pipeline compilation failed with import errors: ${compileResult.stderr}`);
        }

        // Check that pipeline files were generated during the dev command
        const pipelinePath = join(project.path, 'temp', 'pipeline.js');
        const manifestPath = join(project.path, 'temp', 'manifest.json');

        // Verify files exist (they should be created during dev startup)
        const pipelineExists = await ProcessRunner.fileExists(pipelinePath);
        const manifestExists = await ProcessRunner.fileExists(manifestPath);

        if (!pipelineExists || !manifestExists) {
          console.error(`❌ Pipeline files not generated. Pipeline exists: ${pipelineExists}, Manifest exists: ${manifestExists}`);
          console.error('Dev command output:', compileResult.stdout);
          expect.fail(`Pipeline compilation did not generate expected files`);
        }

        console.log('✅ Pipeline files generated successfully');
        expect(pipelineExists).toBe(true);
        expect(manifestExists).toBe(true);

      } finally {
        await project.cleanup();
      }
    }, 90000);
  });
});
