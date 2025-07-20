/**
 * File Discovery for Pipeline Compilation
 * 
 * Node.js-based file discovery for the pipeline compiler.
 * Adapted from V1 glob patterns but using Node.js APIs instead of import.meta.glob.
 */

import { glob } from 'glob';
import { resolve, join } from 'path';
import { isModelFile } from '../utils/path-utils.js';

/**
 * Discover model files for compilation using Node.js glob
 * 
 * This is the Node.js version used by the pipeline compiler,
 * as opposed to the browser version in utils/file-discovery.ts
 * 
 * @param rootDir - Root directory to search from
 * @returns Promise that resolves to array of absolute file paths
 */
export async function discoverModelFilesForCompilation(rootDir: string = '.'): Promise<string[]> {

  
  try {
    // Define glob patterns for model discovery
    const patterns = [
      'main.{ts,js}',
      'components/**/*.{ts,js}',
      // Note: assemblies was removed per user feedback
    ];

    const allFiles: string[] = [];

    // Search for each pattern
    for (const pattern of patterns) {
      const fullPattern = join(rootDir, pattern);

      
      const files = await glob(fullPattern, {
        ignore: [
          '**/node_modules/**',
          '**/dist/**',
          '**/temp/**',
          '**/scripts/**',
          '**/.git/**'
        ]
      });

      // Convert to absolute paths and filter
      const absoluteFiles = files
        .map(file => resolve(file))
        .filter(isModelFile);

      allFiles.push(...absoluteFiles);

    }

    // Remove duplicates
    const uniqueFiles = [...new Set(allFiles)];
    


    return uniqueFiles;

  } catch (error) {
    return [];
  }
}

/**
 * Check if a file should be included in compilation
 * 
 * @param filePath - File path to check
 * @returns True if file should be compiled
 */
export function shouldCompileFile(filePath: string): boolean {
  // Use the existing isModelFile utility
  if (!isModelFile(filePath)) {
    return false;
  }

  // Additional checks for compilation
  if (filePath.includes('.test.') || filePath.includes('.spec.')) {
    return false;
  }

  if (filePath.includes('.d.ts')) {
    return false;
  }

  return true;
}

/**
 * Group discovered files by type/location
 * 
 * @param filePaths - Array of file paths
 * @returns Object with categorized file paths
 */
export function categorizeModelFiles(filePaths: string[]): {
  main: string[];
  components: string[];
  other: string[];
} {
  const categories = {
    main: [] as string[],
    components: [] as string[],
    other: [] as string[]
  };

  for (const filePath of filePaths) {
    if (filePath.includes('/main.') || filePath.endsWith('main.ts') || filePath.endsWith('main.js')) {
      categories.main.push(filePath);
    } else if (filePath.includes('/components/')) {
      categories.components.push(filePath);
    } else {
      categories.other.push(filePath);
    }
  }

  return categories;
}

/**
 * Sort files by compilation priority
 * 
 * Main files should be compiled first, then components, then others.
 * 
 * @param filePaths - Array of file paths to sort
 * @returns Sorted array of file paths
 */
export function sortFilesByPriority(filePaths: string[]): string[] {
  return [...filePaths].sort((a, b) => {
    // Main files first
    const aIsMain = a.includes('/main.') || a.endsWith('main.ts') || a.endsWith('main.js');
    const bIsMain = b.includes('/main.') || b.endsWith('main.ts') || b.endsWith('main.js');
    
    if (aIsMain && !bIsMain) return -1;
    if (!aIsMain && bIsMain) return 1;
    
    // Then components
    const aIsComponent = a.includes('/components/');
    const bIsComponent = b.includes('/components/');
    
    if (aIsComponent && !bIsComponent) return -1;
    if (!aIsComponent && bIsComponent) return 1;
    
    // Finally alphabetical
    return a.localeCompare(b);
  });
}
