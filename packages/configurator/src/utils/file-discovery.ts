/**
 * File Discovery Utilities
 * 
 * Utilities for discovering model files in user projects.
 * Adapted from V1 model-loader.ts for use in V3 pipeline compilation.
 */

import type { ModelRegistryEntry } from '../types/model.js';
import { extractModelName, isModelFile } from './path-utils.js';
import { validateModelExport, getModelNameFromExport } from './model-detection.js';

/**
 * Standard glob patterns for model discovery
 * These patterns define where we look for user models
 */
export const MODEL_GLOB_PATTERNS = [
  './main.{ts,js}',
  './components/**/*.{ts,js}',
  // Note: assemblies was removed per user feedback - it was an oversight
  './**/*.{ts,js}',
  '!./node_modules/**',
  '!./dist/**',
  '!./src/**',
  '!./temp/**',
  '!./scripts/**'
] as const;

/**
 * Discover model files using Vite's import.meta.glob
 * 
 * This is the runtime version used by the configurator.
 * For pipeline compilation, use discoverModelFilesForCompilation instead.
 * 
 * @returns Promise that resolves to array of model registry entries
 */
export async function discoverModelFiles(): Promise<ModelRegistryEntry[]> {
  const models: ModelRegistryEntry[] = [];

  try {
    // Use Vite's glob import to discover model files at build time
    const modelModules = import.meta.glob(MODEL_GLOB_PATTERNS, {
      eager: false
    });



    // Process each discovered file
    for (const [filePath, moduleLoader] of Object.entries(modelModules)) {
      try {
        // Skip non-model files
        if (!isModelFile(filePath)) {
          continue;
        }

        // Extract model name from file path
        const modelId = extractModelName(filePath);

        // Skip if we already have this model (avoid duplicates)
        if (models.find(m => m.id === modelId)) {
          continue;
        }

        // Try to load the module to determine its type
        const module = await moduleLoader();
        const defaultExport = (module as any).default;

        // Validate the export
        const validation = validateModelExport(defaultExport);
        if (!validation.isValid) {
          continue;
        }

        // Determine model name and type
        const modelName = getModelNameFromExport(defaultExport, modelId);
        const modelType = validation.type as 'static' | 'parametric';

        models.push({
          id: modelId,
          path: filePath,
          name: modelName,
          type: modelType,
          loader: moduleLoader
        });
      } catch (error) {
        // Continue processing other files
      }
    }
  } catch (error) {
    // Error during model discovery
  }

  return models;
}

/**
 * Discover model files for compilation (Node.js environment)
 * 
 * This version uses Node.js file system APIs and is intended for
 * use in the pipeline compiler.
 * 
 * @param rootDir - Root directory to search from
 * @returns Promise that resolves to array of file paths
 */
export async function discoverModelFilesForCompilation(rootDir: string = '.'): Promise<string[]> {
  // This will be implemented when we build the pipeline compiler
  // For now, return empty array

  return [];
}

/**
 * Filter discovered files to only include valid model files
 * 
 * @param filePaths - Array of file paths to filter
 * @returns Filtered array of model file paths
 */
export function filterModelFiles(filePaths: string[]): string[] {
  return filePaths.filter(isModelFile);
}

/**
 * Group models by directory
 * 
 * Organizes models into groups based on their directory structure.
 * Useful for UI organization.
 * 
 * @param models - Array of model registry entries
 * @returns Object with directory names as keys and model arrays as values
 */
export function groupModelsByDirectory(models: ModelRegistryEntry[]): Record<string, ModelRegistryEntry[]> {
  const groups: Record<string, ModelRegistryEntry[]> = {};

  for (const model of models) {
    const pathParts = model.path.split('/');
    const directory = pathParts.length > 1 ? pathParts[0] : 'root';
    
    if (!groups[directory]) {
      groups[directory] = [];
    }
    
    groups[directory].push(model);
  }

  return groups;
}

/**
 * Sort models by priority
 * 
 * Sorts models with 'main' first, then alphabetically.
 * 
 * @param models - Array of model registry entries to sort
 * @returns Sorted array of models
 */
export function sortModelsByPriority(models: ModelRegistryEntry[]): ModelRegistryEntry[] {
  return [...models].sort((a, b) => {
    // Main model always comes first
    if (a.id === 'main') return -1;
    if (b.id === 'main') return 1;
    
    // Then sort alphabetically
    return a.name.localeCompare(b.name);
  });
}
