import { spawn, ChildProcess } from 'child_process';
import { ProcessRunner, ProcessResult } from './process-runner.js';

export interface ServerInstance {
  childProcess: ChildProcess;
  port: number;
  name: string;
  url: string;
  ready: boolean;
}

export interface ServerManagerOptions {
  projectPath: string;
  port?: number;
  timeout?: number;
  silent?: boolean;
}



/**
 * Manages CLI development server for testing
 * Handles starting/stopping the unified manifold-studio server with proper cleanup
 */
export class ServerManager {
  private server: ServerInstance | null = null;
  private options: Required<ServerManagerOptions>;

  constructor(options: ServerManagerOptions) {
    this.options = {
      port: 4000,
      timeout: 30000,
      silent: false,
      ...options
    };
  }

  /**
   * Start the CLI development server (manifold-studio dev)
   */
  async startServer(): Promise<ServerInstance> {
    const { projectPath, port, timeout, silent } = this.options;

    if (!silent) {
      console.log(`🚀 Starting CLI development server on port ${port}...`);
    }

    return new Promise((resolve, reject) => {
      const childProcess = spawn('npx', ['manifold-studio', 'dev', '--port', port.toString()], {
        cwd: projectPath,
        env: {
          ...process.env,
          NODE_ENV: 'development'
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const server: ServerInstance = {
        childProcess,
        port,
        name: 'cli-dev',
        url: `http://localhost:${port}`,
        ready: false
      };

      let output = '';
      let timeoutId: NodeJS.Timeout | null = null;

      // Set timeout for server startup
      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          this.killServer();
          reject(new Error(`CLI development server failed to start within ${timeout}ms`));
        }, timeout);
      }

      // Monitor output for readiness indicators
      const onData = (data: Buffer) => {
        const text = data.toString();
        output += text;

        if (!silent) {
          console.log(`[CLI-Dev] ${text.trim()}`);
        }

        // Debug: Log what we're looking for vs what we got
        if (text.includes('servers') || text.includes('started') || text.includes('✅')) {
          console.log(`[DEBUG] Potential ready indicator: "${text.trim()}"`);
        }

        // Look for CLI server ready indicators
        // The CLI outputs "✅ Development server started!" when the server is ready
        if (text.includes('Development server started!')) {
          server.ready = true;
          if (timeoutId) clearTimeout(timeoutId);
          this.server = server;
          resolve(server);
        }
      };

      childProcess.stdout?.on('data', onData);
      childProcess.stderr?.on('data', onData);

      childProcess.on('error', (error) => {
        if (timeoutId) clearTimeout(timeoutId);
        reject(new Error(`CLI development server error: ${error.message}`));
      });

      childProcess.on('exit', (code) => {
        if (timeoutId) clearTimeout(timeoutId);
        if (!server.ready) {
          console.error(`[DEBUG] CLI server exited with code ${code}`);
          console.error(`[DEBUG] Server output:\n${output}`);
          reject(new Error(`CLI development server exited with code ${code}. Output: ${output.slice(-500)}`));
        }
      });
    });
  }



  /**
   * Kill the server
   */
  killServer(): void {
    if (this.server) {
      this.server.childProcess.kill('SIGTERM');
      setTimeout(() => {
        if (this.server && !this.server.childProcess.killed) {
          this.server.childProcess.kill('SIGKILL');
        }
      }, 5000);
      this.server = null;
    }
  }

  /**
   * Get the server instance
   */
  getServer(): ServerInstance | null {
    return this.server;
  }

  /**
   * Check if server is running and ready
   */
  isServerReady(): boolean {
    return this.server?.ready ?? false;
  }

  /**
   * Wait for the server to be ready
   */
  async waitForServer(timeout: number = 30000): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (this.isServerReady()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return false;
  }

  /**
   * Test HTTP connectivity to the server
   */
  async testServerConnectivity(): Promise<boolean> {
    if (!this.server) return false;

    try {
      const response = await fetch(this.server.url);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Cleanup all resources
   */
  async cleanup(): Promise<void> {
    this.killServer();

    // Wait a bit for process to terminate
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
