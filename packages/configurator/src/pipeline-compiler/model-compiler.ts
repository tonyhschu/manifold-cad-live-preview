/**
 * Model Compiler
 * 
 * Compiles individual TypeScript model files and extracts their metadata.
 * This is Step 2.3: Handle Parametric Models.
 */

import { build } from 'vite';
import { resolve, dirname, basename, join } from 'path';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';

import { 
  extractModelName, 
  getFileNameWithoutExtension 
} from '../utils/path-utils.js';
import { 
  isParametricConfig, 
  validateModelExport, 
  getModelNameFromExport,
  extractDefaultParams 
} from '../utils/model-detection.js';

/**
 * Compiled function metadata
 */
export interface CompiledFunction {
  id: string;
  name: string;
  type: 'static' | 'parametric';
  filePath: string;
  functionName: string;
  functionCode: string;
  config?: any; // ParametricConfig for parametric models
  metadata?: any;
}

/**
 * Compile a single model file to a function
 * 
 * @param filePath - Absolute path to the model file
 * @param rootDir - Root directory for relative path calculation
 * @returns Promise that resolves to compiled function metadata
 */
export async function compileModelToFunction(
  filePath: string,
  rootDir: string
): Promise<CompiledFunction> {
  try {
    // Step 1: Extract model ID from file path
    const relativePath = filePath.replace(resolve(rootDir), '').replace(/^\//, '');
    const modelId = extractModelName('./' + relativePath);
    const fileName = getFileNameWithoutExtension(filePath);

    // Step 2: Compile TypeScript to JavaScript using Vite
    const compiledPath = await compileTypeScriptFile(filePath);

    // Step 3: Import and analyze the compiled module
    const moduleUrl = pathToFileURL(compiledPath).href;

    // Add cache-busting query parameter to force fresh import
    // This ensures we get updated metadata when files change
    const cacheBustingUrl = `${moduleUrl}?t=${Date.now()}`;

    const module = await import(cacheBustingUrl);
    const defaultExport = module.default;
    const metadata = module.modelMetadata || module.metadata;

    // Step 4: Validate and analyze the export
    const validation = validateModelExport(defaultExport);
    if (!validation.isValid) {
      throw new Error(`Invalid model export: ${validation.error}`);
    }

    // Step 5: Extract model information
    const modelName = getModelNameFromExport(defaultExport, modelId);
    const modelType = validation.type as 'static' | 'parametric';

    // Step 6: Generate function code based on type
    let functionCode: string;
    let config: any = undefined;
    const functionName = `generate_${modelId.replace(/[\/\-]/g, '_')}`;

    if (modelType === 'parametric') {
      // For parametric models, extract config and create wrapper function
      config = defaultExport;
      const defaultParams = extractDefaultParams(config);

      functionCode = generateParametricFunctionCode(
        functionName,
        config,
        defaultParams,
        compiledPath
      );
    } else {
      // For static models, create simple wrapper function
      functionCode = generateStaticFunctionCode(
        functionName,
        compiledPath
      );
    }

    return {
      id: modelId,
      name: modelName,
      type: modelType,
      filePath: relativePath,
      functionName,
      functionCode,
      config,
      metadata
    };

  } catch (error) {
    throw error;
  }
}

/**
 * Compile TypeScript file using Vite
 */
async function compileTypeScriptFile(filePath: string): Promise<string> {
  const fileName = basename(filePath, '.ts');

  // CRITICAL: Use unique temp directory to prevent cross-test contamination
  //
  // Previously used shared directory: join(process.cwd(), 'temp', 'compilation')
  // This caused race conditions where:
  // 1. Test A compiles main.ts → writes to temp/compilation/main.js
  // 2. Test B compiles main.ts → overwrites temp/compilation/main.js with different content
  // 3. Test A imports compiled file → gets Test B's content instead!
  //
  // Solution: Each compilation gets its own unique directory to prevent interference
  const uniqueId = `${Date.now()}-${process.hrtime.bigint()}-${Math.random().toString(36).substr(2, 9)}`;
  const tempDir = join(process.cwd(), 'temp', 'compilation', uniqueId);

  // Ensure temp directory exists
  if (!existsSync(tempDir)) {
    await mkdir(tempDir, { recursive: true });
  }

  // Use Vite to compile the model file
  await build({
    configFile: false,
    build: {
      target: 'node18',
      lib: {
        entry: resolve(filePath),
        name: `${fileName}Model`,
        fileName: fileName,
        formats: ['es']
      },
      outDir: tempDir,
      rollupOptions: {
        external: ['manifold-3d', '@manifold-studio/wrapper']
      }
    }
  });

  return resolve(tempDir, `${fileName}.js`);
}

/**
 * Generate function code for parametric models
 */
function generateParametricFunctionCode(
  functionName: string,
  config: any,
  defaultParams: Record<string, any>,
  compiledPath: string
): string {
  return `
// Parametric model function: ${functionName}
async function ${functionName}(params = {}) {
  // Import the compiled module with cache busting
  const module = await import('${compiledPath}?t=' + Date.now());
  const config = module.default;
  
  // Merge provided params with defaults
  const finalParams = { ...${JSON.stringify(defaultParams)}, ...params };
  
  // Generate model using the parametric config
  return config.generateModel(finalParams);
}`;
}

/**
 * Generate function code for static models
 */
function generateStaticFunctionCode(
  functionName: string,
  compiledPath: string
): string {
  return `
// Static model function: ${functionName}
async function ${functionName}(params = {}) {
  // Import the compiled module with cache busting
  const module = await import('${compiledPath}?t=' + Date.now());
  const createModel = module.default;
  
  // Call the model creation function
  return createModel();
}`;
}
