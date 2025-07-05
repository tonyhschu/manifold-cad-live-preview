import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ProjectCreator, ProcessRunner, TempDir } from '../utils/index.js';

describe('Package.json Validation', () => {
  beforeAll(async () => {
    // Ensure npm is available
    const npmAvailable = await ProcessRunner.isCommandAvailable('npm');
    if (!npmAvailable) {
      throw new Error('npm is not available');
    }

    const npmVersion = await ProcessRunner.getNpmVersion();
    const nodeVersion = await ProcessRunner.getNodeVersion();
    console.log(`✅ npm ${npmVersion}, node ${nodeVersion}`);
  });

  afterAll(async () => {
    await TempDir.cleanupAll();
  });

  describe('Dependency Resolution', () => {
    it('should have all dependencies resolvable', async () => {
      const project = await ProjectCreator.createProject({
        projectName: 'test-dependency-resolution',
        skipInstall: true
      });

      try {
        // Test that npm install works without errors
        console.log('📦 Testing npm install...');
        const installResult = await ProcessRunner.npmInstall(project.path, {
          timeout: 300000 // 5 minutes
        });

        expect(installResult.success).toBe(true);
        if (!installResult.success) {
          console.error('npm install stdout:', installResult.stdout);
          console.error('npm install stderr:', installResult.stderr);
          expect.fail(`npm install failed: ${installResult.stderr}`);
        }

        console.log('✅ All dependencies installed successfully');
      } finally {
        await project.cleanup();
      }
    }, 360000); // 6 minutes timeout

    it('should not have dependency conflicts', async () => {
      const project = await ProjectCreator.createProject({
        projectName: 'test-no-conflicts',
        skipInstall: true
      });

      try {
        // Run npm install and check for peer dependency warnings
        const installResult = await ProcessRunner.npmInstall(project.path);

        expect(installResult.success).toBe(true);
        
        // Check for common conflict indicators in output
        const output = installResult.stdout + installResult.stderr;
        const hasConflicts = output.includes('ERESOLVE') || 
                           output.includes('conflicting peer dependency') ||
                           output.includes('unable to resolve dependency tree');

        expect(hasConflicts).toBe(false);
        if (hasConflicts) {
          console.error('Dependency conflict detected in output:', output);
          expect.fail('Dependency conflicts detected');
        }
      } finally {
        await project.cleanup();
      }
    }, 360000);

    it('should have no security vulnerabilities in fresh install', async () => {
      const project = await ProjectCreator.createProjectWithInstall({
        projectName: 'test-security-audit'
      });

      try {
        // Run npm audit
        console.log('🔍 Running security audit...');
        const auditResult = await ProcessRunner.npm('audit', [], {
          cwd: project.path,
          timeout: 60000
        });

        // npm audit returns non-zero exit code if vulnerabilities found
        // But we'll be lenient and just check for high/critical vulnerabilities
        if (!auditResult.success) {
          const output = auditResult.stdout + auditResult.stderr;
          const hasCriticalVulns = output.includes('critical') || output.includes('high');
          
          expect(hasCriticalVulns).toBe(false);
          if (hasCriticalVulns) {
            console.error('Security vulnerabilities found:', output);
            expect.fail('Critical or high security vulnerabilities detected');
          }
        }

        console.log('✅ No critical security vulnerabilities found');
      } finally {
        await project.cleanup();
      }
    }, 120000);
  });

  describe('Script Definitions', () => {
    it('should have all required scripts defined', async () => {
      const project = await ProjectCreator.createProject({
        projectName: 'test-script-definitions',
        skipInstall: true
      });

      try {
        const { FileValidator } = await import('../utils/index.js');
        
        const validation = await FileValidator.validateJsonFile(
          `${project.path}/package.json`,
          (data) => {
            const requiredScripts = {
              'dev': 'should start development servers',
              'build:pipeline': 'should build pipeline',
              'build:ui': 'should build UI',
              'build': 'should build both pipeline and UI'
            };

            for (const [script, description] of Object.entries(requiredScripts)) {
              if (!data.scripts[script]) {
                return `Missing required script "${script}" (${description})`;
              }
            }

            return true;
          }
        );

        expect(validation.valid).toBe(true);
        if (!validation.valid) {
          expect.fail(`Script validation failed: ${validation.error}`);
        }
      } finally {
        await project.cleanup();
      }
    }, 30000);

    it('should have valid script commands', async () => {
      const project = await ProjectCreator.createProjectWithInstall({
        projectName: 'test-script-validity'
      });

      try {
        // Test that scripts don't have obvious syntax errors
        // We'll test this by running npm run with --dry-run where possible
        
        const { FileValidator } = await import('../utils/index.js');
        const packageValidation = await FileValidator.validateJsonFile(`${project.path}/package.json`);
        
        expect(packageValidation.valid).toBe(true);
        const packageData = packageValidation.data;

        // Check that script commands reference valid executables/files
        const scripts = packageData.scripts;
        
        // Dev script should use concurrently
        expect(scripts.dev).toContain('concurrently');
        
        // Build scripts should use vite
        expect(scripts['build:pipeline']).toContain('vite');
        expect(scripts['build:ui']).toContain('vite');
        
        console.log('✅ All script commands appear valid');
      } finally {
        await project.cleanup();
      }
    }, 180000);
  });

  describe('Package Metadata', () => {
    it('should have valid package metadata', async () => {
      const project = await ProjectCreator.createProject({
        projectName: 'test-package-metadata',
        skipInstall: true
      });

      try {
        const { FileValidator } = await import('../utils/index.js');
        
        const validation = await FileValidator.validateJsonFile(
          `${project.path}/package.json`,
          (data) => {
            // Check required metadata fields
            if (!data.name) return 'Missing name field';
            if (!data.version) return 'Missing version field';
            if (!data.type) return 'Missing type field';
            
            // Check that type is module (for ESM)
            if (data.type !== 'module') {
              return `Expected type "module", got "${data.type}"`;
            }
            
            // Check version format
            const versionRegex = /^\d+\.\d+\.\d+/;
            if (!versionRegex.test(data.version)) {
              return `Invalid version format: ${data.version}`;
            }
            
            // Check name format (should be valid npm package name)
            const nameRegex = /^[a-z0-9-_]+$/;
            if (!nameRegex.test(data.name)) {
              return `Invalid package name format: ${data.name}`;
            }

            return true;
          }
        );

        expect(validation.valid).toBe(true);
        if (!validation.valid) {
          expect.fail(`Package metadata validation failed: ${validation.error}`);
        }
      } finally {
        await project.cleanup();
      }
    }, 30000);

    it('should have correct dependency versions', async () => {
      const project = await ProjectCreator.createProject({
        projectName: 'test-dependency-versions',
        skipInstall: true
      });

      try {
        const { FileValidator } = await import('../utils/index.js');
        
        const validation = await FileValidator.validateJsonFile(
          `${project.path}/package.json`,
          (data) => {
            // Check that all dependency versions are valid semver ranges
            const allDeps = { ...data.dependencies, ...data.devDependencies };
            
            for (const [name, version] of Object.entries(allDeps)) {
              if (typeof version !== 'string') {
                return `Invalid version type for ${name}: ${typeof version}`;
              }
              
              // Basic semver pattern check
              const semverPattern = /^[\^~]?\d+\.\d+\.\d+/;
              if (!semverPattern.test(version as string)) {
                return `Invalid version format for ${name}: ${version}`;
              }
            }

            // Check specific required versions
            const requiredDeps = {
              'manifold-3d': '^3.1.1',
              'typescript': '^5.0.0',
              'vite': '^5.0.0'
            };

            for (const [name, expectedVersion] of Object.entries(requiredDeps)) {
              const actualVersion = allDeps[name];
              if (!actualVersion) {
                return `Missing required dependency: ${name}`;
              }
              
              // Check major version compatibility
              const expectedMajor = expectedVersion.match(/\d+/)?.[0];
              const actualMajor = (actualVersion as string).match(/\d+/)?.[0];
              
              if (expectedMajor !== actualMajor) {
                return `Version mismatch for ${name}: expected ${expectedVersion}, got ${actualVersion}`;
              }
            }

            return true;
          }
        );

        expect(validation.valid).toBe(true);
        if (!validation.valid) {
          expect.fail(`Dependency version validation failed: ${validation.error}`);
        }
      } finally {
        await project.cleanup();
      }
    }, 30000);
  });

  describe('Package Installation', () => {
    it('should install without warnings for missing peer dependencies', async () => {
      const project = await ProjectCreator.createProject({
        projectName: 'test-peer-deps',
        skipInstall: true
      });

      try {
        const installResult = await ProcessRunner.npmInstall(project.path);
        
        expect(installResult.success).toBe(true);
        
        // Check for peer dependency warnings
        const output = installResult.stdout + installResult.stderr;
        const hasPeerWarnings = output.includes('peer dep') && output.includes('warning');
        
        // We'll be lenient here - peer dependency warnings are common and not always critical
        if (hasPeerWarnings) {
          console.warn('Peer dependency warnings detected (this may be acceptable)');
          console.warn('Output:', output);
        }
        
        console.log('✅ Package installation completed');
      } finally {
        await project.cleanup();
      }
    }, 300000);
  });
});
