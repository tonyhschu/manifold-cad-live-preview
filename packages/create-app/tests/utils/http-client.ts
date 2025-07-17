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
   * Check if both UI and pipeline servers are healthy
   */
  static async checkDualServerHealth(uiUrl: string, pipelineUrl: string, timeout: number = 5000): Promise<{
    uiHealthy: boolean;
    pipelineHealthy: boolean;
    bothHealthy: boolean;
  }> {
    const [uiHealthy, pipelineHealthy] = await Promise.all([
      this.isServerHealthy(uiUrl, timeout),
      this.isPipelineServerHealthy(pipelineUrl, timeout)
    ]);

    return {
      uiHealthy,
      pipelineHealthy,
      bothHealthy: uiHealthy && pipelineHealthy
    };
  }

  /**
   * Check if the pipeline server is healthy using its specific health endpoint
   */
  static async isPipelineServerHealthy(pipelineUrl: string, timeout: number = 5000): Promise<boolean> {
    try {
      // Pipeline server has a specific health endpoint at /api/pipeline/health
      const healthUrl = `${pipelineUrl}/api/pipeline/health`;
      const response = await this.request(healthUrl, { timeout });

      if (response.success && response.body) {
        // Check if the response has the expected structure
        const healthData = JSON.parse(response.body);
        return healthData.status === 'ok';
      }

      return false;
    } catch (error) {
      console.log(`Pipeline health check failed for ${pipelineUrl}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Wait for both servers to become healthy
   */
  static async waitForDualServers(
    uiUrl: string,
    pipelineUrl: string,
    maxAttempts: number = 30,
    delayMs: number = 1000
  ): Promise<boolean> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const health = await this.checkDualServerHealth(uiUrl, pipelineUrl);

      console.log(`Health check attempt ${attempt}/${maxAttempts} - UI: ${health.uiHealthy}, Pipeline: ${health.pipelineHealthy}`);

      if (health.bothHealthy) {
        return true;
      }

      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    return false;
  }
}
