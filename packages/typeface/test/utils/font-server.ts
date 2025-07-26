import { createServer, Server } from 'http';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Simple local font server for testing
 * Serves font files from the reference-project/assets/fonts directory
 * to eliminate network dependencies in tests.
 */

export interface FontServerOptions {
  port?: number;
  fontsDir?: string;
}

export class FontServer {
  private server: Server | null = null;
  private port: number;
  private fontsDir: string;

  constructor(options: FontServerOptions = {}) {
    this.port = options.port || 0; // Use 0 for random available port
    this.fontsDir = options.fontsDir || path.join(process.cwd(), '../../reference-project/assets/fonts');
  }

  async start(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.server = createServer(async (req, res) => {
        // Enable CORS for browser requests
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.writeHead(200);
          res.end();
          return;
        }

        if (req.method !== 'GET') {
          res.writeHead(405, { 'Content-Type': 'text/plain' });
          res.end('Method Not Allowed');
          return;
        }

        try {
          // Extract font filename from URL path
          const urlPath = req.url || '';
          const fontName = path.basename(urlPath);
          
          // Security: only allow .ttf files and prevent directory traversal
          if (!fontName.endsWith('.ttf') || fontName.includes('..')) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Font not found');
            return;
          }

          const fontPath = path.join(this.fontsDir, fontName);

          // Check if font file exists
          try {
            await fs.access(fontPath);
          } catch {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Font not found');
            return;
          }

          // Serve the font file
          const fontData = await fs.readFile(fontPath);
          res.writeHead(200, {
            'Content-Type': 'font/ttf',
            'Content-Length': fontData.length,
          });
          res.end(fontData);

        } catch (error) {
          console.error('Font server error:', error);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Internal Server Error');
        }
      });

      this.server.listen(this.port, () => {
        const address = this.server!.address();
        if (address && typeof address === 'object') {
          this.port = address.port;
          resolve(this.port);
        } else {
          reject(new Error('Failed to get server port'));
        }
      });

      this.server.on('error', reject);
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }

      this.server.close((error) => {
        if (error) {
          reject(error);
        } else {
          this.server = null;
          resolve();
        }
      });
    });
  }

  getPort(): number {
    return this.port;
  }

  getFontUrl(fontName: string): string {
    return `http://localhost:${this.port}/${fontName}`;
  }
}

/**
 * Convenience functions for test setup/teardown
 */
export async function startFontServer(options?: FontServerOptions): Promise<FontServer> {
  const server = new FontServer(options);
  await server.start();
  return server;
}

export async function stopFontServer(server: FontServer): Promise<void> {
  await server.stop();
}
