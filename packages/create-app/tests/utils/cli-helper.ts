import { ProcessRunner, type ProcessResult } from './process-runner.js';
import { FileValidator } from './file-validator.js';
import { join } from 'path';

export interface CLITestResult {
  success: boolean;
  output: string;
  error?: string;
  duration: number;
}

export interface CLIValidationResult {
  isValid: boolean;
  error?: string;
  version?: string;
}

/**
 * CLI Helper for testing manifold-dev CLI functionality
 * Provides common patterns for testing CLI commands and validation
 */
export class CLIHelper {
  /**
   * Test if manifold-dev CLI is available and working
   */
  static async testCLIAvailability(projectPath: string, timeout: number = 30000): Promise<CLIValidationResult> {
    try {
      const startTime = Date.now();
      const result = await ProcessRunner.run('npx', ['manifold-dev', '--help'], {
        cwd: projectPath,
        timeout
      });
      const duration = Date.now() - startTime;

      if (!result.success) {
        return {
          isValid: false,
          error: `CLI command failed: ${result.stderr || result.stdout}`
        };
      }

      // Try to extract version if available in help output
      const versionMatch = result.stdout.match(/version[:\s]+([^\s\n]+)/i);
      const version = versionMatch ? versionMatch[1] : undefined;

      return {
        isValid: true,
        version,
      };
    } catch (error) {
      return {
        isValid: false,
        error: `CLI availability test failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Test CLI command execution with timing
   */
  static async testCLICommand(
    projectPath: string, 
    args: string[], 
    options: { timeout?: number; expectSuccess?: boolean } = {}
  ): Promise<CLITestResult> {
    const { timeout = 30000, expectSuccess = true } = options;
    
    try {
      const startTime = Date.now();
      const result = await ProcessRunner.run('npx', ['manifold-dev', ...args], {
        cwd: projectPath,
        timeout
      });
      const duration = Date.now() - startTime;

      const success = expectSuccess ? result.success : true; // If we don't expect success, any result is valid

      return {
        success,
        output: result.stdout,
        error: result.success ? undefined : result.stderr,
        duration
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error),
        duration: 0
      };
    }
  }

  /**
   * Validate that package.json has correct CLI-based scripts
   */
  static async validateCLIScripts(projectPath: string): Promise<CLIValidationResult> {
    const packagePath = join(projectPath, 'package.json');
    
    const validation = await FileValidator.validateJsonFile(packagePath, (data) => {
      if (!data.scripts) {
        return 'Package.json missing scripts section';
      }

      const scripts = data.scripts;

      // Check dev script
      if (!scripts.dev) {
        return 'Missing dev script';
      }
      if (!scripts.dev.includes('manifold-dev')) {
        return `Dev script should use manifold-dev, got: "${scripts.dev}"`;
      }
      if (!scripts.dev.includes('dev')) {
        return `Dev script should include dev subcommand, got: "${scripts.dev}"`;
      }

      // Check that expected script format is correct
      if (scripts.dev !== 'manifold-dev dev') {
        return `Dev script should be "manifold-dev dev", got: "${scripts.dev}"`;
      }

      // Check test script (should use vitest)
      if (!scripts.test) {
        return 'Missing test script';
      }
      if (!scripts.test.includes('vitest')) {
        return `Test script should use vitest, got: "${scripts.test}"`;
      }

      // Build script should exist (even if placeholder)
      if (!scripts.build) {
        return 'Missing build script';
      }

      return true;
    });

    return {
      isValid: validation.isValid,
      error: validation.isValid ? undefined : validation.error
    };
  }

  /**
   * Test CLI development server startup (without actually starting it)
   * This tests that the command can be invoked and shows expected help/usage
   */
  static async testCLIDevServerCommand(projectPath: string): Promise<CLIValidationResult> {
    // Test that 'manifold-dev dev --help' works
    const result = await this.testCLICommand(projectPath, ['dev', '--help']);
    
    if (!result.success) {
      return {
        isValid: false,
        error: `CLI dev command test failed: ${result.error}`
      };
    }

    // Check that help output mentions development server
    const output = result.output.toLowerCase();
    if (!output.includes('dev') && !output.includes('development')) {
      return {
        isValid: false,
        error: 'CLI dev command help does not mention development functionality'
      };
    }

    return {
      isValid: true
    };
  }

  /**
   * Test CLI performance (command response time)
   */
  static async testCLIPerformance(
    projectPath: string, 
    maxDuration: number = 5000
  ): Promise<CLITestResult & { withinLimit: boolean }> {
    const result = await this.testCLICommand(projectPath, ['--help']);
    const withinLimit = result.duration <= maxDuration;

    return {
      ...result,
      withinLimit,
      error: result.error || (!withinLimit ? `CLI response time ${result.duration}ms exceeds limit ${maxDuration}ms` : undefined)
    };
  }

  /**
   * Validate project structure for CLI compatibility
   */
  static async validateCLIProjectStructure(projectPath: string): Promise<CLIValidationResult> {
    const requiredFiles = [
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      'main.ts'
    ];

    for (const file of requiredFiles) {
      const filePath = join(projectPath, file);
      const validation = await FileValidator.validate(filePath);
      
      if (!validation.exists) {
        return {
          isValid: false,
          error: `Required CLI project file missing: ${file}`
        };
      }
    }

    // Validate that old dual-server artifacts don't exist
    const oldArtifacts = [
      'vite.pipeline.config.ts',
      'vite.ui.config.ts',
      'pipeline.config.ts'
    ];

    for (const artifact of oldArtifacts) {
      const artifactPath = join(projectPath, artifact);
      const validation = await FileValidator.validate(artifactPath);
      
      if (validation.exists) {
        return {
          isValid: false,
          error: `Old dual-server artifact should not exist in CLI project: ${artifact}`
        };
      }
    }

    return {
      isValid: true
    };
  }
}
