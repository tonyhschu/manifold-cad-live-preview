import { spawn, ChildProcess } from 'child_process';
import { ProcessRunner, ProcessResult } from './process-runner.js';

export interface ServerInstance {
  childProcess: ChildProcess;
  uiPort: number;
  pipelinePort: number;
  name: string;
  uiUrl: string;
  pipelineUrl: string;
  ready: boolean;
}

export interface ServerManagerOptions {
  projectPath: string;
  uiPort?: number;
  pipelinePort?: number;
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
      uiPort: 3000,
      pipelinePort: 3001,
      timeout: 30000,
      silent: false,
      ...options
    };
  }

  /**
   * Start the CLI development server (manifold-studio dev)
   */
  async startServer(): Promise<ServerInstance> {
    const { projectPath, uiPort, pipelinePort, timeout, silent } = this.options;

    if (!silent) {
      console.log(`🚀 Starting CLI development server (UI: ${uiPort}, Pipeline: ${pipelinePort})...`);
    }

    return new Promise((resolve, reject) => {
      const childProcess = spawn('npx', ['manifold-studio', 'dev', '--port', uiPort.toString(), '--pipeline-port', pipelinePort.toString()], {
        cwd: projectPath,
        env: {
          ...process.env,
          NODE_ENV: 'development'
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const server: ServerInstance = {
        childProcess,
        uiPort,
        pipelinePort,
        name: 'cli-dev',
        uiUrl: `http://localhost:${uiPort}`,
        pipelineUrl: `http://localhost:${pipelinePort}`,
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
        // The CLI outputs "✅ Development servers started!" when both servers are ready
        if (text.includes('Development servers started!')) {
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
          reject(new Error(`CLI development server exited with code ${code}`));
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
