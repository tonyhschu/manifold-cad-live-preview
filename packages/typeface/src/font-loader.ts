/**
 * Font Loader - Main API for loading fonts and creating text
 * 
 * This module provides the primary API that component authors will use
 * to create 3D text from font-based rendering.
 */

import { CrossSection } from '@manifold-studio/wrapper';
import { textToCrossSection, type TextRenderOptions } from './text-renderer.js';
import { fontRegistry } from './font-registry.js';

/**
 * Font loader function that returns a text rendering function
 * 
 * @param fontName - Name of the font to use
 * @returns Function that converts text to CrossSection
 */
export function fontLoader(fontName: string): (text: string, options?: TextRenderOptions) => CrossSection {
  return (text: string, options?: TextRenderOptions): CrossSection => {
    if (!fontRegistry.isReady()) {
      throw new Error(
        `Fonts not initialized. Call 'await fonts.ensureReady()' before using fontLoader.`
      );
    }

    if (!fontRegistry.isFontLoaded(fontName)) {
      const availableFonts = fontRegistry.list();
      throw new Error(
        `Font '${fontName}' not available. Available fonts: ${availableFonts.join(', ')}`
      );
    }

    return textToCrossSection(text, fontName, options);
  };
}

/**
 * Register a custom font for use with fontLoader
 * 
 * @param name - Display name for the font
 * @param url - URL to load the font from
 * @param options - Additional font metadata
 */
export function registerFont(
  name: string, 
  url: string, 
  options: {
    family?: string;
    weight?: string;
    style?: string;
    fallbackUrls?: string[];
  } = {}
): void {
  fontRegistry.registerFont(name, url, options);
}

/**
 * Font management API
 */
export const fonts = {
  /**
   * Initialize fonts by loading all default and registered custom fonts
   */
  async initialize(): Promise<void> {
    return fontRegistry.initialize();
  },

  /**
   * Ensure fonts are ready (same as initialize - idempotent)
   */
  async ensureReady(): Promise<void> {
    return fontRegistry.ensureReady();
  },

  /**
   * Check if fonts have been initialized
   */
  isReady(): boolean {
    return fontRegistry.isReady();
  },

  /**
   * Get list of available font names
   */
  list(): string[] {
    return fontRegistry.list();
  },

  /**
   * Check if a specific font is loaded
   */
  isFontLoaded(name: string): boolean {
    return fontRegistry.isFontLoaded(name);
  },

  /**
   * Get registry status for debugging
   */
  getStatus(): {
    isReady: boolean;
    loadedFonts: string[];
    availableFonts: string[];
    customFonts: string[];
  } {
    return fontRegistry.getStatus();
  },

  /**
   * Reset font registry (for testing)
   */
  reset(): void {
    fontRegistry.reset();
  }
};
