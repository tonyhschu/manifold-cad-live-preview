import { FontServer, startFontServer } from './font-server';

/**
 * Test utilities and helpers for typeface package tests
 */

export interface TestFontInfo {
  name: string;
  filename: string;
  hasHoles: boolean; // Whether this font has characters with holes (O, P, B, etc.)
}

/**
 * Available test fonts with their characteristics
 */
export const TEST_FONTS: TestFontInfo[] = [
  {
    name: 'Inter',
    filename: 'Inter-Regular.ttf',
    hasHoles: true,
  },
  {
    name: 'Roboto',
    filename: 'Roboto-Regular.ttf', 
    hasHoles: true,
  },
];

/**
 * Test text samples for different scenarios
 */
export const TEST_TEXTS = {
  simple: 'Hello',
  withHoles: 'BOPQ', // Characters that should have holes
  noHoles: 'ILEFT', // Characters that should not have holes
  empty: '',
  unicode: 'Héllo 世界',
  special: '!@#$%',
  long: 'The quick brown fox jumps over the lazy dog',
};

/**
 * Mock polygon data for testing
 * Represents a simple square with a hole (like the letter 'O')
 */
export const MOCK_POLYGON_WITH_HOLE = [
  // Outer square (counter-clockwise)
  [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ],
  // Inner square hole (clockwise)
  [
    { x: 25, y: 25 },
    { x: 25, y: 75 },
    { x: 75, y: 75 },
    { x: 75, y: 25 },
  ],
];

/**
 * Mock polygon data for testing
 * Represents a simple rectangle without holes (like the letter 'I')
 */
export const MOCK_POLYGON_NO_HOLE = [
  [
    { x: 0, y: 0 },
    { x: 20, y: 0 },
    { x: 20, y: 100 },
    { x: 0, y: 100 },
  ],
];

/**
 * Global test font server instance
 */
let globalFontServer: FontServer | null = null;

/**
 * Set up font server for tests
 * Call this in beforeAll/beforeEach
 */
export async function setupFontServer(): Promise<FontServer> {
  if (globalFontServer) {
    return globalFontServer;
  }
  
  globalFontServer = await startFontServer();
  return globalFontServer;
}

/**
 * Clean up font server after tests
 * Call this in afterAll/afterEach
 */
export async function teardownFontServer(): Promise<void> {
  if (globalFontServer) {
    await globalFontServer.stop();
    globalFontServer = null;
  }
}

/**
 * Get font URL for testing
 */
export function getTestFontUrl(fontName: string): string {
  if (!globalFontServer) {
    throw new Error('Font server not started. Call setupFontServer() first.');
  }
  
  const font = TEST_FONTS.find(f => f.name === fontName);
  if (!font) {
    throw new Error(`Test font '${fontName}' not found. Available: ${TEST_FONTS.map(f => f.name).join(', ')}`);
  }
  
  return globalFontServer.getFontUrl(font.filename);
}

/**
 * Check if we're running in a browser-like environment
 * Useful for environment-specific tests
 */
export function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Check if we're running in Node.js environment
 */
export function isNodeEnvironment(): boolean {
  return typeof process !== 'undefined' && process.versions && process.versions.node;
}

/**
 * Wait for a condition to be true
 * Useful for async operations in tests
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Create a mock OpenType.js font object for testing
 * This is useful when we want to test without loading real fonts
 */
export function createMockFont(name: string = 'MockFont') {
  return {
    names: {
      fontFamily: { en: name },
      fullName: { en: name },
    },
    getPath: (text: string, x: number, y: number, fontSize: number) => {
      // Return a mock path that represents simple rectangles
      return {
        commands: [
          { type: 'M', x: x, y: y },
          { type: 'L', x: x + text.length * fontSize * 0.6, y: y },
          { type: 'L', x: x + text.length * fontSize * 0.6, y: y + fontSize },
          { type: 'L', x: x, y: y + fontSize },
          { type: 'Z' },
        ],
      };
    },
  };
}
