import { request } from 'http';
import { URL } from 'url';

export interface HttpResponse {
  statusCode: number;
  headers: Record<string, string | string[]>;
  body: string;
  success: boolean;
}

export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

/**
 * Simple HTTP client for testing server responses
 * Used to verify UI and pipeline servers are responding correctly
 */
export class HttpClient {
  /**
   * Make an HTTP request to the specified URL
   */
  static async request(url: string, options: HttpRequestOptions = {}): Promise<HttpResponse> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = 10000
    } = options;

    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      
      const requestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method,
        headers: {
          'User-Agent': 'manifold-cli-test',
          ...headers
        },
        timeout
      };

      const req = request(requestOptions, (res) => {
        let responseBody = '';
        
        res.on('data', (chunk) => {
          responseBody += chunk.toString();
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode || 0,
            headers: res.headers as Record<string, string | string[]>,
            body: responseBody,
            success: (res.statusCode || 0) >= 200 && (res.statusCode || 0) < 300
          });
        });
      });

      req.on('error', (error) => {
        reject(new Error(`HTTP request failed: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`HTTP request timed out after ${timeout}ms`));
      });

      if (body) {
        req.write(body);
      }
      
      req.end();
    });
  }

  /**
   * Check if a server is responding at the given URL
   */
  static async isServerHealthy(url: string, timeout: number = 5000): Promise<boolean> {
    try {
      const response = await this.request(url, { timeout });
      return response.success;
    } catch (error) {
      console.log(`Health check failed for ${url}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Wait for a server to become healthy with retry logic
   */
  static async waitForServer(url: string, maxAttempts: number = 30, delayMs: number = 1000): Promise<boolean> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const isHealthy = await this.isServerHealthy(url);
      
      if (isHealthy) {
        return true;
      }
      
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    return false;
  }

  /**
   * Check if pipeline files are accessible as static assets from the server
   */
  static async isPipelineFileAccessible(serverUrl: string, filePath: string, timeout: number = 5000): Promise<boolean> {
    try {
      // Pipeline files are now served as static assets from /temp/
      const fileUrl = `${serverUrl}${filePath}`;
      const response = await this.request(fileUrl, { timeout });
      return response.success;
    } catch (error) {
      console.log(`Pipeline file check failed for ${serverUrl}${filePath}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Check if both the server and pipeline files are accessible
   */
  static async checkServerAndPipelineHealth(serverUrl: string, timeout: number = 5000): Promise<{
    serverHealthy: boolean;
    pipelineAccessible: boolean;
    manifestAccessible: boolean;
    allHealthy: boolean;
  }> {
    const [serverHealthy, pipelineAccessible, manifestAccessible] = await Promise.all([
      this.isServerHealthy(serverUrl, timeout),
      this.isPipelineFileAccessible(serverUrl, '/temp/pipeline.js', timeout),
      this.isPipelineFileAccessible(serverUrl, '/temp/manifest.json', timeout)
    ]);

    return {
      serverHealthy,
      pipelineAccessible,
      manifestAccessible,
      allHealthy: serverHealthy && pipelineAccessible && manifestAccessible
    };
  }

  /**
   * Wait for server and pipeline files to become accessible
   */
  static async waitForServerAndPipeline(
    serverUrl: string,
    maxAttempts: number = 30,
    delayMs: number = 1000
  ): Promise<boolean> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const health = await this.checkServerAndPipelineHealth(serverUrl);

      console.log(`Health check attempt ${attempt}/${maxAttempts} - Server: ${health.serverHealthy}, Pipeline: ${health.pipelineAccessible}, Manifest: ${health.manifestAccessible}`);

      if (health.allHealthy) {
        return true;
      }

      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    return false;
  }
}
