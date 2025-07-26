import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { FontServer, startFontServer, stopFontServer } from './utils/font-server';
import { promises as fs } from 'fs';
import path from 'path';

describe('FontServer', () => {
  let server: FontServer;

  afterAll(async () => {
    if (server) {
      await server.stop();
    }
  });

  describe('Server Lifecycle', () => {
    test('should start and stop server', async () => {
      server = new FontServer();
      const port = await server.start();
      
      expect(port).toBeGreaterThan(0);
      expect(server.getPort()).toBe(port);
      
      await server.stop();
    });

    test('should use random port when port is 0', async () => {
      server = new FontServer({ port: 0 });
      const port = await server.start();
      
      expect(port).toBeGreaterThan(1000); // Should get a random high port
      
      await server.stop();
    });
  });

  describe('Font Serving', () => {
    beforeAll(async () => {
      // Use absolute path to ensure we find the fonts directory
      const fontsDir = path.join(process.cwd(), '../../reference-project/assets/fonts');
      server = await startFontServer({ fontsDir });
    });

    test('should serve existing font files', async () => {
      const fontUrl = server.getFontUrl('Inter-Regular.ttf');

      const response = await fetch(fontUrl);
      expect(response.ok).toBe(true);
      expect(response.headers.get('content-type')).toBe('font/ttf');

      const fontData = await response.arrayBuffer();
      expect(fontData.byteLength).toBeGreaterThan(0);
    });

    test('should return 404 for non-existent fonts', async () => {
      const fontUrl = server.getFontUrl('NonExistent.ttf');
      
      const response = await fetch(fontUrl);
      expect(response.status).toBe(404);
    });

    test('should reject non-TTF files', async () => {
      const invalidUrl = `http://localhost:${server.getPort()}/malicious.exe`;
      
      const response = await fetch(invalidUrl);
      expect(response.status).toBe(404);
    });

    test('should prevent directory traversal', async () => {
      const maliciousUrl = `http://localhost:${server.getPort()}/../../../etc/passwd`;
      
      const response = await fetch(maliciousUrl);
      expect(response.status).toBe(404);
    });

    test('should handle CORS headers', async () => {
      const fontUrl = server.getFontUrl('Inter-Regular.ttf');
      
      const response = await fetch(fontUrl);
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
      expect(response.headers.get('access-control-allow-methods')).toBe('GET, OPTIONS');
    });

    test('should handle OPTIONS requests', async () => {
      const fontUrl = server.getFontUrl('Inter-Regular.ttf');
      
      const response = await fetch(fontUrl, { method: 'OPTIONS' });
      expect(response.status).toBe(200);
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });
  });

  describe('Error Handling', () => {
    beforeAll(async () => {
      const fontsDir = path.join(process.cwd(), '../../reference-project/assets/fonts');
      server = await startFontServer({ fontsDir });
    });

    test('should handle invalid HTTP methods', async () => {
      const fontUrl = server.getFontUrl('Inter-Regular.ttf');
      
      const response = await fetch(fontUrl, { method: 'POST' });
      expect(response.status).toBe(405);
      
      const text = await response.text();
      expect(text).toBe('Method Not Allowed');
    });
  });

  describe('Convenience Functions', () => {
    test('should start server with convenience function', async () => {
      const testServer = await startFontServer();
      
      expect(testServer.getPort()).toBeGreaterThan(0);
      
      await stopFontServer(testServer);
    });

    test('should handle custom options', async () => {
      const customServer = await startFontServer({ port: 0 });
      
      expect(customServer.getPort()).toBeGreaterThan(0);
      
      await stopFontServer(customServer);
    });
  });
});
