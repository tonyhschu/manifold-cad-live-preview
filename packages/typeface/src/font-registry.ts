/**
 * Font Registry - Central font storage and management
 * 
 * This module provides centralized font storage with lazy loading support.
 * It maintains a registry of available fonts and handles loading them on demand.
 */

import type { LoadedFont, FontInfo } from './font-resolver.js';
import { FontResolver } from './font-resolver.js';

/**
 * Default fonts available in the registry (TTF format only for Node.js compatibility)
 */
export const DEFAULT_FONTS: FontInfo[] = [
  {
    name: 'Inter',
    family: 'Inter',
    weight: 'Variable',
    url: 'https://cdn.jsdelivr.net/npm/inter-font@3.19.0/Inter-VariableFont_slnt,wght.ttf'
  }
];

/**
 * Font Registry manages font loading and storage
 */
export class FontRegistry {
  private fontResolver: FontResolver;
  private customFonts = new Map<string, FontInfo>();
  private loadedFonts = new Map<string, LoadedFont>();
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.fontResolver = new FontResolver();
    
    // Update the resolver's available fonts to include our defaults
    FontResolver.AVAILABLE_FONTS.length = 0;
    FontResolver.AVAILABLE_FONTS.push(...DEFAULT_FONTS);
  }

  /**
   * Register a custom font
   */
  registerFont(name: string, url: string, options: {
    family?: string;
    weight?: string;
    style?: string;
    fallbackUrls?: string[];
  } = {}): void {
    const fontInfo: FontInfo = {
      name,
      url,
      family: options.family || name,
      weight: options.weight,
      style: options.style,
      fallbackUrls: options.fallbackUrls
    };

    this.customFonts.set(name, fontInfo);
    
    // Add to resolver's available fonts
    const existingIndex = FontResolver.AVAILABLE_FONTS.findIndex(f => f.name === name);
    if (existingIndex >= 0) {
      FontResolver.AVAILABLE_FONTS[existingIndex] = fontInfo;
    } else {
      FontResolver.AVAILABLE_FONTS.push(fontInfo);
    }
  }

  /**
   * Initialize fonts by loading all default and registered custom fonts
   */
  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.loadAllFonts();
    return this.initializationPromise;
  }

  /**
   * Ensure fonts are ready (same as initialize - idempotent)
   */
  async ensureReady(): Promise<void> {
    return this.initialize();
  }

  /**
   * Check if fonts have been initialized
   */
  isReady(): boolean {
    return this.initializationPromise !== null && this.loadedFonts.size > 0;
  }

  /**
   * Get list of available font names
   */
  list(): string[] {
    const defaultNames = DEFAULT_FONTS.map(f => f.name);
    const customNames = Array.from(this.customFonts.keys());
    return [...defaultNames, ...customNames];
  }

  /**
   * Get a loaded font by name
   */
  getFont(name: string): LoadedFont | null {
    return this.loadedFonts.get(name) || null;
  }

  /**
   * Check if a specific font is loaded
   */
  isFontLoaded(name: string): boolean {
    return this.loadedFonts.has(name);
  }

  /**
   * Load all fonts (default + custom)
   */
  private async loadAllFonts(): Promise<void> {
    const allFontNames = this.list();
    const loadPromises = allFontNames.map(async (fontName) => {
      try {
        const loadedFont = await this.fontResolver.loadFont(fontName);
        this.loadedFonts.set(fontName, loadedFont);
        // Font loaded successfully
      } catch (error) {
        // Font loading failed - continue with other fonts
        // Don't throw - allow other fonts to load
      }
    });

    await Promise.allSettled(loadPromises);
    
    if (this.loadedFonts.size === 0) {
      throw new Error('Failed to load any fonts. Check your network connection.');
    }

    // Font registry initialization complete
  }

  /**
   * Clear all loaded fonts and reset initialization
   */
  reset(): void {
    this.loadedFonts.clear();
    this.initializationPromise = null;
    this.fontResolver.clearCache();
  }

  /**
   * Get registry status for debugging
   */
  getStatus(): {
    isReady: boolean;
    loadedFonts: string[];
    availableFonts: string[];
    customFonts: string[];
  } {
    return {
      isReady: this.isReady(),
      loadedFonts: Array.from(this.loadedFonts.keys()),
      availableFonts: this.list(),
      customFonts: Array.from(this.customFonts.keys())
    };
  }
}

// Create singleton instance
export const fontRegistry = new FontRegistry();
