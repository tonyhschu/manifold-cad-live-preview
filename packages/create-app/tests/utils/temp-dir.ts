import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

/**
 * Utility for managing temporary directories in tests
 */
export class TempDir {
  private static activeDirs = new Set<string>();

  /**
   * Create a temporary directory with optional prefix
   */
  static async create(prefix = 'manifold-test-'): Promise<string> {
    const tempDir = await mkdtemp(join(tmpdir(), prefix));
    this.activeDirs.add(tempDir);
    return tempDir;
  }

  /**
   * Clean up a specific temporary directory
   */
  static async cleanup(tempDir: string): Promise<void> {
    try {
      await rm(tempDir, { recursive: true, force: true });
      this.activeDirs.delete(tempDir);
    } catch (error) {
      console.warn(`Failed to cleanup temp dir ${tempDir}:`, error);
    }
  }

  /**
   * Clean up all active temporary directories
   */
  static async cleanupAll(): Promise<void> {
    const cleanupPromises = Array.from(this.activeDirs).map(dir => this.cleanup(dir));
    await Promise.all(cleanupPromises);
  }

  /**
   * Get list of active temporary directories
   */
  static getActiveDirs(): string[] {
    return Array.from(this.activeDirs);
  }
}

/**
 * Test helper to automatically cleanup temp directories
 */
export function withTempDir<T>(
  testFn: (tempDir: string) => Promise<T>,
  prefix?: string
): () => Promise<T> {
  return async () => {
    const tempDir = await TempDir.create(prefix);
    try {
      return await testFn(tempDir);
    } finally {
      await TempDir.cleanup(tempDir);
    }
  };
}
