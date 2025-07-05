import { join } from 'path';
import { TempDir } from './temp-dir.js';
import { ProcessRunner } from './process-runner.js';
import { FileValidator } from './file-validator.js';

export interface ProjectCreationOptions {
  projectName?: string;
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
      projectName = 'test-project',
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
   * Validate that a created project has the expected structure
   */
  static async validateProjectStructure(
    projectPath: string,
    template = 'basic'
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Define expected files for basic template
    const expectedFiles = [
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      'vite.pipeline.config.ts',
      'pipeline-entry.ts',
      'index.html',
      'main.ts',
      'src/main.ts',
      'components/example.ts',
      'components/wheel.ts',
      'vite-plugins/pipeline-hmr.ts',
      'vite-plugins/manifest-generator.ts',
      'scripts/generate-manifest.ts',
      'README.md'
    ];

    // Check that all expected files exist
    const fileValidation = await FileValidator.validateFilesExist(projectPath, expectedFiles);
    if (!fileValidation.valid) {
      errors.push(...fileValidation.missing.map(f => `Missing file: ${f}`));
      errors.push(...fileValidation.errors);
    }

    // Validate package.json structure
    const packageJsonPath = join(projectPath, 'package.json');
    const packageValidation = await FileValidator.validateJsonFile(
      packageJsonPath,
      (data) => {
        if (!data.name) return 'package.json missing name field';
        if (!data.scripts) return 'package.json missing scripts field';
        if (!data.scripts.dev) return 'package.json missing dev script';
        if (!data.scripts['build:pipeline']) return 'package.json missing build:pipeline script';
        if (!data.scripts['build:ui']) return 'package.json missing build:ui script';
        if (!data.dependencies) return 'package.json missing dependencies field';
        
        // Check for required dependencies
        // NOTE: During source-based development, @manifold-studio packages are imported via Vite aliases
        // Only manifold-3d is required as a runtime dependency
        const requiredDeps = [
          'manifold-3d'
        ];
        
        for (const dep of requiredDeps) {
          if (!data.dependencies[dep]) {
            return `package.json missing required dependency: ${dep}`;
          }
        }
        
        return true;
      }
    );

    if (!packageValidation.valid) {
      errors.push(`Package.json validation failed: ${packageValidation.error}`);
    }

    // Validate TypeScript config
    const tsconfigPath = join(projectPath, 'tsconfig.json');
    const tsconfigValidation = await FileValidator.validateJsonFile(tsconfigPath);
    if (!tsconfigValidation.valid) {
      errors.push(`tsconfig.json validation failed: ${tsconfigValidation.error}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Test that a project can build successfully
   */
  static async testProjectBuild(
    projectPath: string,
    timeout = 120000
  ): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Test pipeline build
      console.log('🔧 Testing pipeline build...');
      const pipelineBuild = await ProcessRunner.npmRun('build:pipeline', projectPath, { timeout });
      if (!pipelineBuild.success) {
        errors.push(`Pipeline build failed: ${pipelineBuild.stderr}`);
      }

      // Test UI build
      console.log('🔧 Testing UI build...');
      const uiBuild = await ProcessRunner.npmRun('build:ui', projectPath, { timeout });
      if (!uiBuild.success) {
        errors.push(`UI build failed: ${uiBuild.stderr}`);
      }

      // Check that build artifacts exist
      const expectedArtifacts = [
        'temp/pipeline.js',
        'temp/manifest.json',
        'dist/index.html'
      ];

      const artifactValidation = await FileValidator.validateFilesExist(projectPath, expectedArtifacts);
      if (!artifactValidation.valid) {
        errors.push(...artifactValidation.missing.map(f => `Missing build artifact: ${f}`));
      }

    } catch (error) {
      errors.push(`Build test failed: ${error}`);
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
