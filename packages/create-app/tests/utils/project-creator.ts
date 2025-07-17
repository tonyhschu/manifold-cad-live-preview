import { join } from 'path';
import { cp } from 'fs/promises';
import { TempDir } from './temp-dir.js';
import { ProcessRunner } from './process-runner.js';
import { FileValidator } from './file-validator.js';

export interface ProjectCreationOptions {
  name?: string;  // Changed from projectName for consistency
  template?: string;
  skipInstall?: boolean;
  timeout?: number;
}

export interface CreatedProject {
  name: string;
  path: string;
  cleanup: () => Promise<void>;
}

/**
 * Utility for creating test projects using the create-app CLI
 */
export class ProjectCreator {
  private static readonly CREATE_APP_PATH = join(process.cwd(), 'bin', 'index.js');

  /**
   * Create a new project using the create-app CLI
   */
  static async createProject(
    options: ProjectCreationOptions = {}
  ): Promise<CreatedProject> {
    const {
      name: projectName = 'test-project',
      template = 'basic',
      skipInstall = false,
      timeout = 120000 // 2 minutes
    } = options;

    // Create temporary directory
    const tempDir = await TempDir.create('create-app-test-');
    const projectPath = join(tempDir, projectName);

    try {
      console.log(`🏗️  Creating project "${projectName}" in ${tempDir}`);

      // Build the create-app command arguments
      const args = [this.CREATE_APP_PATH, projectName];
      if (template !== 'basic') {
        args.push('--template', template);
      }
      if (skipInstall) {
        args.push('--no-install');
      }

      // Run the create-app command
      const result = await ProcessRunner.run('node', args, {
        cwd: tempDir,
        timeout
      });

      if (!result.success) {
        throw new Error(`Project creation failed: ${result.stderr || result.stdout}`);
      }

      // Verify the project was created
      const validation = await FileValidator.validate(projectPath);
      if (!validation.exists || !validation.isDirectory) {
        throw new Error(`Project directory was not created: ${projectPath}`);
      }

      console.log(`✅ Project "${projectName}" created successfully`);

      return {
        name: projectName,
        path: projectPath,
        cleanup: async () => {
          await TempDir.cleanup(tempDir);
        }
      };

    } catch (error) {
      // Clean up on failure
      await TempDir.cleanup(tempDir);
      throw error;
    }
  }

  /**
   * Create a project and install dependencies
   */
  static async createProjectWithInstall(
    options: Omit<ProjectCreationOptions, 'skipInstall'> = {}
  ): Promise<CreatedProject> {
    const project = await this.createProject({ ...options, skipInstall: false });

    try {
      console.log(`📦 Installing dependencies for "${project.name}"`);
      
      const installResult = await ProcessRunner.npmInstall(project.path, {
        timeout: 300000 // 5 minutes for npm install
      });

      if (!installResult.success) {
        throw new Error(`Dependency installation failed: ${installResult.stderr}`);
      }

      console.log(`✅ Dependencies installed for "${project.name}"`);
      return project;

    } catch (error) {
      // Clean up on failure
      await project.cleanup();
      throw error;
    }
  }

  /**
   * Copy an existing project for test isolation (much faster than creating + installing)
   */
  static async copyProject(
    sourceProject: CreatedProject,
    options: { name: string }
  ): Promise<CreatedProject> {
    const { name } = options;

    // Create temporary directory for the copy
    const tempDir = await TempDir.create('create-app-test-');
    const projectPath = join(tempDir, name);

    try {
      console.log(`📋 Copying project from ${sourceProject.path} to ${projectPath}`);

      // Copy the entire project directory
      await cp(sourceProject.path, projectPath, {
        recursive: true,
        force: true
      });

      console.log(`✅ Project "${name}" copied successfully`);

      return {
        name,
        path: projectPath,
        cleanup: async () => {
          await TempDir.cleanup(tempDir);
        }
      };

    } catch (error) {
      // Clean up on failure
      await TempDir.cleanup(tempDir);
      throw error;
    }
  }

  /**
   * Validate that a created project has the expected structure
   */
  static async validateProjectStructure(
    projectPath: string,
    template = 'basic'
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Define expected files for basic template (CLI-based architecture)
    const expectedFiles = [
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      'main.ts',
      'components/example.ts',
      'components/wheel.ts',
      'README.md'
    ];

    // Check that all expected files exist
    const fileValidation = await FileValidator.validateFilesExist(projectPath, expectedFiles);
    if (!fileValidation.valid) {
      errors.push(...fileValidation.missing.map(f => `Missing file: ${f}`));
      errors.push(...fileValidation.errors);
    }

    // Validate package.json structure for CLI-based architecture
    const packageJsonPath = join(projectPath, 'package.json');
    const packageValidation = await FileValidator.validateJsonFile(
      packageJsonPath,
      (data) => {
        if (!data.name) return 'package.json missing name field';
        if (!data.scripts) return 'package.json missing scripts field';
        if (!data.scripts.dev) return 'package.json missing dev script';
        if (!data.scripts.test) return 'package.json missing test script';
        if (!data.dependencies) return 'package.json missing dependencies field';
        if (!data.devDependencies) return 'package.json missing devDependencies field';

        // Validate CLI-based scripts
        if (data.scripts.dev !== 'manifold-studio dev') {
          return `package.json dev script should be "manifold-studio dev", got "${data.scripts.dev}"`;
        }
        if (data.scripts.test !== 'vitest') {
          return `package.json test script should be "vitest", got "${data.scripts.test}"`;
        }

        // Check for required runtime dependencies
        const requiredDeps = [
          'manifold-3d'
        ];

        for (const dep of requiredDeps) {
          if (!data.dependencies[dep]) {
            return `package.json missing required dependency: ${dep}`;
          }
        }

        // Check for required dev dependencies (note: configurator path will be different in generated projects)
        const requiredDevDeps = [
          'typescript',
          'vitest'
        ];

        for (const dep of requiredDevDeps) {
          if (!data.devDependencies[dep]) {
            return `package.json missing required devDependency: ${dep}`;
          }
        }

        // Check that configurator dependency exists (path may vary)
        if (!data.devDependencies['@manifold-studio/configurator']) {
          return 'package.json missing required devDependency: @manifold-studio/configurator';
        }

        return true;
      }
    );

    if (!packageValidation.isValid) {
      errors.push(`Package.json validation failed: ${packageValidation.error}`);
    }

    // Validate TypeScript config
    const tsconfigPath = join(projectPath, 'tsconfig.json');
    const tsconfigValidation = await FileValidator.validateJsonFile(tsconfigPath);
    if (!tsconfigValidation.isValid) {
      errors.push(`tsconfig.json validation failed: ${tsconfigValidation.error}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Test that a project can work with the CLI development server
   */
  static async testProjectCLI(
    projectPath: string,
    timeout = 10000
  ): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Test that manifold-studio command is available by running help
      console.log('🔧 Testing CLI availability...');

      const helpResult = await ProcessRunner.run('npx', ['manifold-studio', '--help'], {
        cwd: projectPath,
        timeout: 10000,
        silent: true
      });

      if (!helpResult.success) {
        errors.push(`CLI not available: ${helpResult.stderr}`);
        return { success: false, errors };
      }

      // Test that the project structure is valid for CLI
      console.log('🔧 Testing project structure for CLI compatibility...');

      // Check that main.ts exists and has valid content
      const mainTsPath = join(projectPath, 'main.ts');
      const mainTsValidation = await FileValidator.validate(mainTsPath);
      if (!mainTsValidation.exists || !mainTsValidation.isFile) {
        errors.push('main.ts file missing - required for CLI model discovery');
      }

      // Check that components directory exists
      const componentsPath = join(projectPath, 'components');
      const componentsDirValidation = await FileValidator.validate(componentsPath);
      if (!componentsDirValidation.exists || !componentsDirValidation.isDirectory) {
        errors.push('components/ directory missing - required for CLI model discovery');
      }

      console.log('✅ CLI compatibility test completed');

    } catch (error) {
      errors.push(`CLI test failed: ${error}`);
    }

    return {
      success: errors.length === 0,
      errors
    };
  }

  /**
   * Get information about the create-app CLI
   */
  static async getCreateAppInfo(): Promise<{
    available: boolean;
    version?: string;
    error?: string;
  }> {
    try {
      const result = await ProcessRunner.run('node', [this.CREATE_APP_PATH, '--version'], {
        silent: true,
        timeout: 10000
      });

      return {
        available: result.success,
        version: result.success ? result.stdout.trim() : undefined,
        error: result.success ? undefined : result.stderr || 'Command failed'
      };
    } catch (error) {
      return {
        available: false,
        error: `Failed to get create-app info: ${error}`
      };
    }
  }
}
