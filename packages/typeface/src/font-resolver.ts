/**
 * FontResolver - Universal font loading for browser and Node.js environments
 *
 * This module provides a robust font loading system with the following features:
 * - CDN-based font loading with fallback URLs
 * - Cross-platform support (browser and Node.js)
 * - Timeout handling and error recovery
 * - Font caching to avoid redundant downloads
 * - Comprehensive error reporting with custom error types
 *
 * @example
 * ```typescript
 * import { fontResolver } from './font-resolver';
 *
 * // Load a font
 * const loadedFont = await fontResolver.loadFont('Inter Variable Font');
 *
 * // Use the font with OpenType.js
 * const path = loadedFont.font.getPath('Hello', 0, 0, 72);
 * ```
 */

import opentype from 'opentype.js';

/**
 * Font metadata and loading configuration
 */
export interface FontInfo {
  /** Display name for the font */
  name: string;
  /** Primary URL to load the font from */
  url: string;
  /** Font family name */
  family: string;
  /** Font weight (e.g., '400', 'bold') */
  weight?: string;
  /** Font style (e.g., 'normal', 'italic') */
  style?: string;
  /** Fallback URLs to try if primary URL fails */
  fallbackUrls?: string[];
}

/**
 * Successfully loaded font with metadata
 */
export interface LoadedFont {
  /** Original font information */
  info: FontInfo;
  /** Parsed OpenType.js font object */
  font: opentype.Font;
  /** Timestamp when font was loaded */
  loadedAt: number;
}

/**
 * Error thrown when font loading fails from all available URLs
 */
export class FontLoadError extends Error {
  constructor(
    message: string,
    /** Name of the font that failed to load */
    public fontName: string,
    /** All URLs that were attempted */
    public attemptedUrls: string[],
    /** The last error encountered */
    public lastError?: Error
  ) {
    super(message);
    this.name = 'FontLoadError';
  }
}

/**
 * Error thrown when font loading exceeds the timeout limit
 */
export class FontTimeoutError extends Error {
  constructor(fontName: string, timeoutMs: number) {
    super(`Font loading timeout after ${timeoutMs}ms for '${fontName}'`);
    this.name = 'FontTimeoutError';
  }
}

/**
 * FontResolver handles loading fonts from CDNs with caching and fallback support
 */
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
   * Get list of available font names
   * @returns Array of font names that can be loaded
   */
  getAvailableFonts(): string[] {
    return FontResolver.AVAILABLE_FONTS.map(font => font.name);
  }

  /**
   * Load a font by name with caching and fallback support
   *
   * @param fontName - Name of the font to load (must be in registry)
   * @returns Promise that resolves to the loaded font
   * @throws {FontLoadError} When font loading fails from all URLs
   * @throws {FontTimeoutError} When font loading exceeds timeout
   * @throws {Error} When font is not found in registry
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
    const errors: Error[] = [];

    if (urlsToTry.length === 0) {
      throw new FontLoadError(
        `No URLs available for font '${fontInfo.name}'`,
        fontInfo.name,
        []
      );
    }

    for (let i = 0; i < urlsToTry.length; i++) {
      const url = urlsToTry[i];
      const isLastAttempt = i === urlsToTry.length - 1;

      try {
        const fontInfoWithUrl = { ...fontInfo, url };
        const result = await this.loadSingleUrl(fontInfoWithUrl);
        return result;

      } catch (error) {
        const fontError = error instanceof Error ? error : new Error(String(error));
        errors.push(fontError);

        console.warn(`Failed to load font from ${url}: ${fontError.message}`);

        if (isLastAttempt) {
          throw new FontLoadError(
            `Failed to load font '${fontInfo.name}' from all ${urlsToTry.length} URLs`,
            fontInfo.name,
            urlsToTry,
            fontError
          );
        }
      }
    }

    // This should never be reached, but included for completeness
    throw new FontLoadError(
      `Unexpected error loading font '${fontInfo.name}'`,
      fontInfo.name,
      urlsToTry,
      errors[errors.length - 1]
    );
  }

  /**
   * Load a font from a single URL with timeout handling
   */
  private async loadSingleUrl(fontInfo: FontInfo, timeoutMs: number = 30000): Promise<LoadedFont> {
    return new Promise<LoadedFont>((resolve, reject) => {
      const startTime = Date.now();
      let isResolved = false;

      // Set a timeout for font loading
      const timeout = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          reject(new FontTimeoutError(fontInfo.name, timeoutMs));
        }
      }, timeoutMs);

      const handleSuccess = (result: LoadedFont) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeout);
          resolve(result);
        }
      };

      const handleError = (error: Error) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeout);
          reject(error);
        }
      };

      try {
        console.log(`🔄 Starting font load for '${fontInfo.name}' from ${fontInfo.url}`);
        if (this.isBrowser()) {
          // Browser environment - use fetch
          console.log(`🌐 Using browser environment for font loading`);
          this.loadFontInBrowser(fontInfo, startTime, handleSuccess, handleError);
        } else {
          // Node.js environment - use opentype.js load method directly
          console.log(`🖥️ Using Node.js environment for font loading`);
          this.loadFontInNode(fontInfo, startTime, handleSuccess, handleError).catch(handleError);
        }
      } catch (error) {
        const fontError = error instanceof Error ? error : new Error(String(error));
        console.error(`❌ Font loading setup error for '${fontInfo.name}':`, fontError.message);
        handleError(new Error(`Failed to load font '${fontInfo.name}': ${fontError.message}`));
      }
    });
  }

  /**
   * Load font in browser environment using fetch
   */
  private async loadFontInBrowser(
    fontInfo: FontInfo,
    startTime: number,
    resolve: (value: LoadedFont) => void,
    reject: (reason: Error) => void
  ) {
    try {
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

      // Get as ArrayBuffer and parse with OpenType.js
      const arrayBuffer = await response.arrayBuffer();
      const font = opentype.parse(arrayBuffer);

      if (!font || !font.names) {
        throw new Error('Invalid font file - OpenType.js could not parse the font');
      }

      const loadTime = Date.now() - startTime;
      console.log(`Font '${fontInfo.name}' loaded successfully in ${loadTime}ms (browser)`);

      resolve({
        info: fontInfo,
        font,
        loadedAt: Date.now()
      });
    } catch (error) {
      const fontError = error instanceof Error ? error : new Error(String(error));
      reject(new Error(`Browser font loading failed for '${fontInfo.name}': ${fontError.message}`));
    }
  }

  /**
   * Load font in Node.js environment
   */
  private async loadFontInNode(
    fontInfo: FontInfo,
    startTime: number,
    resolve: (value: LoadedFont) => void,
    reject: (reason: Error) => void
  ) {
    try {
      // Resolve URL to file path for Node.js
      const filePath = this.resolveUrlToFilePath(fontInfo.url);

      // In Node.js, download the font from URL and parse it directly
      if (typeof process !== 'undefined' && process.versions?.node) {
        try {
          // Use fetch to download the font (Node.js 18+ has built-in fetch)
          console.log(`📥 Fetching font from URL: ${fontInfo.url}`);
          const response = await fetch(fontInfo.url);

          if (!response.ok) {
            console.error(`❌ Font download failed: ${response.status} ${response.statusText}`);
            reject(new Error(`Failed to download font '${fontInfo.name}': ${response.status} ${response.statusText}`));
            return;
          }

          console.log(`✅ Font download successful, parsing...`);

          // Get the font data as ArrayBuffer
          const arrayBuffer = await response.arrayBuffer();

          // Parse with opentype.js
          const font = opentype.parse(arrayBuffer);

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

        } catch (fetchError) {
          const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
          reject(new Error(`Node.js font loading failed for '${fontInfo.name}': ${errorMessage}`));
        }
      } else {
        // Fallback: try using opentype.load with URL (might work in some environments)
        opentype.load(fontInfo.url, { isUrl: true }, (err: any, font: opentype.Font) => {
          if (err) {
            const errorMessage = err.message || String(err);
            reject(new Error(`Font loading fallback failed for '${fontInfo.name}': ${errorMessage}`));
            return;
          }

          if (!font) {
            reject(new Error(`Font parsing failed for '${fontInfo.name}': No font object returned`));
            return;
          }

          const loadTime = Date.now() - startTime;
          console.log(`Font '${fontInfo.name}' loaded successfully in ${loadTime}ms (fallback)`);

          resolve({
            info: fontInfo,
            font,
            loadedAt: Date.now()
          });
        });
      }
    } catch (error) {
      const fontError = error instanceof Error ? error : new Error(String(error));
      reject(new Error(`Node.js font loading setup failed for '${fontInfo.name}': ${fontError.message}`));
    }
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
    if (typeof require !== 'undefined') {
      const path = require('path');
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

    // Browser fallback - return URL as-is
    return url;
  }

  /**
   * Detect if we're running in a browser environment
   */
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof fetch !== 'undefined';
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
