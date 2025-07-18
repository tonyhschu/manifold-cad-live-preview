/**
 * FontResolver - Universal font loading for browser and Node.js environments
 * Handles loading fonts from CDNs with proper error handling and caching
 */

import opentype from 'opentype.js';
import * as path from 'path';
import * as fs from 'fs';

export interface FontInfo {
  name: string;
  url: string;
  family: string;
  weight?: string;
  style?: string;
  fallbackUrls?: string[];
}

export interface LoadedFont {
  info: FontInfo;
  font: opentype.Font;
  loadedAt: number;
}

export class FontResolver {
  private fontCache = new Map<string, LoadedFont>();
  private loadingPromises = new Map<string, Promise<LoadedFont>>();

  // Fonts available - using proven working URLs from prototype testing
  static readonly AVAILABLE_FONTS: FontInfo[] = [
    {
      name: 'Inter Variable Font',
      family: 'Inter',
      weight: 'Variable',
      url: 'https://cdn.jsdelivr.net/npm/inter-font@3.19.0/Inter-VariableFont_slnt,wght.ttf'
    }
  ];

  constructor() {}

  /**
   * Load a font by name from the available fonts list
   */
  async loadFont(fontName: string): Promise<LoadedFont> {
    // Check cache first
    const cached = this.fontCache.get(fontName);
    if (cached) {
      console.log(`Font '${fontName}' loaded from cache`);
      return cached;
    }

    // Check if already loading
    const loadingPromise = this.loadingPromises.get(fontName);
    if (loadingPromise) {
      console.log(`Font '${fontName}' already loading, waiting...`);
      return loadingPromise;
    }

    // Find font info
    const fontInfo = FontResolver.AVAILABLE_FONTS.find(f => f.name === fontName);
    if (!fontInfo) {
      throw new Error(`Font '${fontName}' not found. Available fonts: ${FontResolver.AVAILABLE_FONTS.map(f => f.name).join(', ')}`);
    }

    // Start loading
    const promise = this.loadFontFromUrl(fontInfo);
    this.loadingPromises.set(fontName, promise);

    try {
      const result = await promise;
      this.fontCache.set(fontName, result);
      this.loadingPromises.delete(fontName);
      return result;
    } catch (error) {
      this.loadingPromises.delete(fontName);
      throw error;
    }
  }

  /**
   * Load a font from a URL with fallback support
   */
  private async loadFontFromUrl(fontInfo: FontInfo): Promise<LoadedFont> {
    const urlsToTry = [fontInfo.url, ...(fontInfo.fallbackUrls || [])];

    for (let i = 0; i < urlsToTry.length; i++) {
      const url = urlsToTry[i];
      const isLastAttempt = i === urlsToTry.length - 1;

      try {
        console.log(`Attempting to load font from: ${url} (attempt ${i + 1}/${urlsToTry.length})`);

        const fontInfoWithUrl = { ...fontInfo, url };
        const result = await this.loadSingleUrl(fontInfoWithUrl);

        console.log(`✅ Successfully loaded font '${fontInfo.name}' from ${url}`);
        return result;

      } catch (error) {
        console.warn(`❌ Failed to load font from ${url}: ${error.message}`);

        if (isLastAttempt) {
          throw new Error(`Failed to load font '${fontInfo.name}' from all ${urlsToTry.length} URLs. Last error: ${error.message}`);
        }

        // Continue to next URL
        console.log(`Trying next URL...`);
      }
    }

    throw new Error(`No URLs available for font '${fontInfo.name}'`);
  }

  /**
   * Load a font from a single URL with timeout handling
   */
  private async loadSingleUrl(fontInfo: FontInfo): Promise<LoadedFont> {
    console.log(`Loading font '${fontInfo.name}' from ${fontInfo.url}`);

    return new Promise<LoadedFont>((resolve, reject) => {
      const startTime = Date.now();

      // Set a timeout for font loading
      const timeout = setTimeout(() => {
        reject(new Error(`Font loading timeout after 10 seconds for '${fontInfo.name}'`));
      }, 10000);

      try {
        if (this.isBrowser()) {
          // Browser environment - use fetch
          this.loadFontInBrowser(fontInfo, timeout, startTime, resolve, reject);
        } else {
          // Node.js environment - use opentype.js load method directly
          this.loadFontInNode(fontInfo, timeout, startTime, resolve, reject);
        }
      } catch (error) {
        clearTimeout(timeout);
        reject(new Error(`Failed to load font '${fontInfo.name}': ${error.message}`));
      }
    });
  }

  /**
   * Load font in browser environment using fetch
   */
  private async loadFontInBrowser(
    fontInfo: FontInfo,
    timeout: NodeJS.Timeout,
    startTime: number,
    resolve: (value: LoadedFont) => void,
    reject: (reason: any) => void
  ) {
    try {
      console.log(`Fetching font from: ${fontInfo.url}`);

      // Fetch the font file with CORS handling
      const response = await fetch(fontInfo.url, {
        mode: 'cors',
        headers: {
          'Accept': 'application/font-ttf, application/octet-stream, */*'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`Font file downloaded, size: ${response.headers.get('content-length') || 'unknown'} bytes`);

      // Get as ArrayBuffer
      const arrayBuffer = await response.arrayBuffer();
      console.log(`ArrayBuffer size: ${arrayBuffer.byteLength} bytes`);

      // Parse with OpenType.js
      const font = opentype.parse(arrayBuffer);

      if (!font || !font.names) {
        throw new Error('Invalid font file - OpenType.js could not parse the font');
      }

      clearTimeout(timeout);
      const loadTime = Date.now() - startTime;
      console.log(`Font '${fontInfo.name}' loaded successfully in ${loadTime}ms (browser)`);
      console.log(`Font details: ${font.names.fullName?.en || 'Unknown'}, ${font.numGlyphs} glyphs`);

      resolve({
        info: fontInfo,
        font,
        loadedAt: Date.now()
      });
    } catch (error) {
      clearTimeout(timeout);
      console.error(`Font loading error details:`, error);
      reject(new Error(`Browser font loading failed for '${fontInfo.name}': ${error.message}`));
    }
  }

  /**
   * Load font in Node.js environment
   */
  private loadFontInNode(
    fontInfo: FontInfo,
    timeout: NodeJS.Timeout,
    startTime: number,
    resolve: (value: LoadedFont) => void,
    reject: (reason: any) => void
  ) {
    // Resolve URL to file path for Node.js
    const filePath = this.resolveUrlToFilePath(fontInfo.url);
    console.log(`Resolved URL '${fontInfo.url}' to file path '${filePath}'`);

    // Check if file exists before trying to load
    if (!fs.existsSync(filePath)) {
      clearTimeout(timeout);
      reject(new Error(`Font file not found: ${filePath}`));
      return;
    }

    // Use opentype.js load method with resolved file path
    opentype.load(filePath, (err: any, font: opentype.Font) => {
      clearTimeout(timeout);

      if (err) {
        reject(new Error(`Node.js font loading failed for '${fontInfo.name}': ${err.message || err}`));
        return;
      }

      if (!font) {
        reject(new Error(`Font parsing failed for '${fontInfo.name}': No font object returned`));
        return;
      }

      const loadTime = Date.now() - startTime;
      console.log(`Font '${fontInfo.name}' loaded successfully in ${loadTime}ms (Node.js)`);

      resolve({
        info: fontInfo,
        font,
        loadedAt: Date.now()
      });
    });
  }

  /**
   * Resolve a URL to a file system path for Node.js environment
   */
  private resolveUrlToFilePath(url: string): string {
    // If it's an HTTP/HTTPS URL, return as-is (opentype.js can handle these)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // If it's already an absolute file system path, return as-is
    if (path.isAbsolute(url) && !url.startsWith('/assets/')) {
      return url;
    }

    // If it's a web-style URL starting with /assets/, resolve relative to project root
    if (url.startsWith('/')) {
      // Remove leading slash and resolve relative to current working directory
      const relativePath = url.substring(1);
      return path.resolve(process.cwd(), relativePath);
    }

    // Otherwise, treat as relative path
    return path.resolve(process.cwd(), url);
  }

  /**
   * Detect if we're running in a browser environment
   */
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof fetch !== 'undefined';
  }

  /**
   * Get list of available font names
   */
  getAvailableFonts(): string[] {
    return FontResolver.AVAILABLE_FONTS.map(f => f.name);
  }

  /**
   * Clear font cache
   */
  clearCache(): void {
    this.fontCache.clear();
    console.log('Font cache cleared');
  }

  /**
   * Get cache status
   */
  getCacheStatus(): { fontName: string; loadedAt: Date; family: string }[] {
    return Array.from(this.fontCache.entries()).map(([name, loaded]) => ({
      fontName: name,
      loadedAt: new Date(loaded.loadedAt),
      family: loaded.info.family
    }));
  }
}

// Create a singleton instance
export const fontResolver = new FontResolver();
