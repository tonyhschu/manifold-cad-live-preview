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
  pipelinePort?: number;
  uiPort?: number;
  timeout?: number;
  silent?: boolean;
}

/**
 * Manages dual Vite servers for V3 architecture testing
 * Handles starting/stopping pipeline and UI servers with proper cleanup
 */
export class ServerManager {
  private servers: Map<string, ServerInstance> = new Map();
  private options: Required<ServerManagerOptions>;

  constructor(options: ServerManagerOptions) {
    this.options = {
      pipelinePort: 3001,
      uiPort: 5173,
      timeout: 30000,
      silent: false,
      ...options
    };
  }

  /**
   * Start the pipeline server (Vite build with watch mode)
   */
  async startPipelineServer(): Promise<ServerInstance> {
    const { projectPath, pipelinePort, timeout, silent } = this.options;

    if (!silent) {
      console.log(`🚀 Starting pipeline server on port ${pipelinePort}...`);
    }

    return new Promise((resolve, reject) => {
      const childProcess = spawn('npm', ['run', 'dev:pipeline'], {
        cwd: projectPath,
        env: {
          ...process.env,
          PORT: pipelinePort.toString(),
          NODE_ENV: 'development'
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const server: ServerInstance = {
        childProcess,
        port: pipelinePort,
        name: 'pipeline',
        url: `http://localhost:${pipelinePort}`,
        ready: false
      };

      let output = '';
      let timeoutId: NodeJS.Timeout | null = null;

      // Set timeout for server startup
      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          this.killServer('pipeline');
          reject(new Error(`Pipeline server failed to start within ${timeout}ms`));
        }, timeout);
      }

      // Monitor output for readiness indicators
      const onData = (data: Buffer) => {
        const text = data.toString();
        output += text;
        
        if (!silent) {
          console.log(`[Pipeline] ${text.trim()}`);
        }

        // Look for build completion indicators
        // Wait for both the initial build completion AND manifest generation
        if (text.includes('built in') && output.includes('✅ Manifest generated')) {
          server.ready = true;
          if (timeoutId) clearTimeout(timeoutId);
          this.servers.set('pipeline', server);
          resolve(server);
        }
      };

      childProcess.stdout?.on('data', onData);
      childProcess.stderr?.on('data', onData);

      childProcess.on('error', (error) => {
        if (timeoutId) clearTimeout(timeoutId);
        reject(new Error(`Pipeline server error: ${error.message}`));
      });

      childProcess.on('exit', (code) => {
        if (timeoutId) clearTimeout(timeoutId);
        if (!server.ready) {
          reject(new Error(`Pipeline server exited with code ${code}`));
        }
      });
    });
  }

  /**
   * Start the UI server (Vite dev server)
   */
  async startUIServer(): Promise<ServerInstance> {
    const { projectPath, uiPort, timeout, silent } = this.options;
    
    if (!silent) {
      console.log(`🚀 Starting UI server on port ${uiPort}...`);
    }

    return new Promise((resolve, reject) => {
      const childProcess = spawn('npm', ['run', 'dev'], {
        cwd: projectPath,
        env: {
          ...process.env,
          PORT: uiPort.toString(),
          NODE_ENV: 'development'
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const server: ServerInstance = {
        childProcess,
        port: uiPort,
        name: 'ui',
        url: `http://localhost:${uiPort}`,
        ready: false
      };

      let output = '';
      let timeoutId: NodeJS.Timeout | null = null;

      // Set timeout for server startup
      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          this.killServer('ui');
          reject(new Error(`UI server failed to start within ${timeout}ms`));
        }, timeout);
      }

      // Monitor output for readiness indicators
      const onData = (data: Buffer) => {
        const text = data.toString();
        output += text;
        
        if (!silent) {
          console.log(`[UI] ${text.trim()}`);
        }

        // Look for Vite dev server ready indicators
        if (text.includes('Local:') || text.includes('ready in')) {
          server.ready = true;
          if (timeoutId) clearTimeout(timeoutId);
          this.servers.set('ui', server);
          resolve(server);
        }
      };

      childProcess.stdout?.on('data', onData);
      childProcess.stderr?.on('data', onData);

      childProcess.on('error', (error) => {
        if (timeoutId) clearTimeout(timeoutId);
        reject(new Error(`UI server error: ${error.message}`));
      });

      childProcess.on('exit', (code) => {
        if (timeoutId) clearTimeout(timeoutId);
        if (!server.ready) {
          reject(new Error(`UI server exited with code ${code}`));
        }
      });
    });
  }

  /**
   * Start both servers concurrently
   */
  async startBothServers(): Promise<{ pipeline: ServerInstance; ui: ServerInstance }> {
    const [pipeline, ui] = await Promise.all([
      this.startPipelineServer(),
      this.startUIServer()
    ]);

    return { pipeline, ui };
  }

  /**
   * Kill a specific server
   */
  killServer(name: string): void {
    const server = this.servers.get(name);
    if (server) {
      server.childProcess.kill('SIGTERM');
      setTimeout(() => {
        if (!server.childProcess.killed) {
          server.childProcess.kill('SIGKILL');
        }
      }, 5000);
      this.servers.delete(name);
    }
  }

  /**
   * Kill all servers
   */
  killAllServers(): void {
    for (const [name] of this.servers) {
      this.killServer(name);
    }
  }

  /**
   * Get server instance by name
   */
  getServer(name: string): ServerInstance | undefined {
    return this.servers.get(name);
  }

  /**
   * Check if server is running and ready
   */
  isServerReady(name: string): boolean {
    const server = this.servers.get(name);
    return server?.ready ?? false;
  }

  /**
   * Wait for a server to be ready
   */
  async waitForServer(name: string, timeout: number = 30000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (this.isServerReady(name)) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return false;
  }

  /**
   * Test HTTP connectivity to a server
   */
  async testServerConnectivity(name: string): Promise<boolean> {
    const server = this.servers.get(name);
    if (!server) return false;

    try {
      const response = await fetch(server.url);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Cleanup all resources
   */
  async cleanup(): Promise<void> {
    this.killAllServers();
    
    // Wait a bit for processes to terminate
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
