import { spawn } from 'child_process';
import { join } from 'path';

export interface ProcessResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  success: boolean;
  duration: number;
}

export interface ProcessOptions {
  cwd?: string;
  timeout?: number;
  env?: Record<string, string>;
  silent?: boolean;
}

/**
 * Utility for running processes with proper error handling and output capture
 */
export class ProcessRunner {
  /**
   * Run a command and return the result
   */
  static async run(
    command: string,
    args: string[] = [],
    options: ProcessOptions = {}
  ): Promise<ProcessResult> {
    const startTime = Date.now();
    const {
      cwd = process.cwd(),
      timeout = 60000, // 60 seconds default
      env = {},
      silent = false
    } = options;

    if (!silent) {
      console.log(`🔧 Running: ${command} ${args.join(' ')} in ${cwd}`);
    }

    return new Promise((resolve) => {
      const child = spawn(command, args, {
        cwd,
        env: { ...process.env, ...env },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';
      let timeoutId: NodeJS.Timeout | null = null;

      // Capture output
      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      // Set timeout
      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          child.kill('SIGTERM');
          setTimeout(() => child.kill('SIGKILL'), 5000);
        }, timeout);
      }

      child.on('close', (exitCode) => {
        if (timeoutId) clearTimeout(timeoutId);
        
        const duration = Date.now() - startTime;
        const success = exitCode === 0;
        
        if (!silent) {
          if (success) {
            console.log(`✅ Command completed in ${duration}ms`);
          } else {
            console.log(`❌ Command failed with exit code ${exitCode} after ${duration}ms`);
            if (stderr) console.log('STDERR:', stderr);
          }
        }

        resolve({
          exitCode: exitCode || 0,
          stdout,
          stderr,
          success,
          duration
        });
      });

      child.on('error', (error) => {
        if (timeoutId) clearTimeout(timeoutId);
        
        const duration = Date.now() - startTime;
        
        if (!silent) {
          console.log(`❌ Command error after ${duration}ms:`, error.message);
        }

        resolve({
          exitCode: 1,
          stdout,
          stderr: stderr + error.message,
          success: false,
          duration
        });
      });
    });
  }

  /**
   * Run npm command in a directory
   */
  static async npm(
    command: string,
    args: string[] = [],
    options: ProcessOptions = {}
  ): Promise<ProcessResult> {
    return this.run('npm', [command, ...args], options);
  }

  /**
   * Run npm install in a directory
   */
  static async npmInstall(
    projectDir: string,
    options: Omit<ProcessOptions, 'cwd'> = {}
  ): Promise<ProcessResult> {
    return this.npm('install', [], { ...options, cwd: projectDir });
  }

  /**
   * Run npm script in a directory
   */
  static async npmRun(
    script: string,
    projectDir: string,
    options: Omit<ProcessOptions, 'cwd'> = {}
  ): Promise<ProcessResult> {
    return this.npm('run', [script], { ...options, cwd: projectDir });
  }

  /**
   * Check if a command is available
   */
  static async isCommandAvailable(command: string): Promise<boolean> {
    const result = await this.run('which', [command], { silent: true });
    return result.success;
  }

  /**
   * Get npm version
   */
  static async getNpmVersion(): Promise<string | null> {
    const result = await this.run('npm', ['--version'], { silent: true });
    return result.success ? result.stdout.trim() : null;
  }

  /**
   * Get Node.js version
   */
  static async getNodeVersion(): Promise<string | null> {
    const result = await this.run('node', ['--version'], { silent: true });
    return result.success ? result.stdout.trim() : null;
  }

  /**
   * Check if a file exists
   */
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      const { existsSync } = await import('fs');
      return existsSync(filePath);
    } catch {
      return false;
    }
  }
}
