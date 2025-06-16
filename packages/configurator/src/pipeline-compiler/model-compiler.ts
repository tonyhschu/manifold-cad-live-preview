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
  console.log(`🔨 Compiling model: ${filePath}`);

  try {
    // Step 1: Extract model ID from file path
    const relativePath = filePath.replace(resolve(rootDir), '').replace(/^\//, '');
    const modelId = extractModelName('./' + relativePath);
    const fileName = getFileNameWithoutExtension(filePath);
    
    console.log(`📝 Model ID: ${modelId}, File: ${fileName}`);

    // Step 2: Compile TypeScript to JavaScript using Vite
    const compiledPath = await compileTypeScriptFile(filePath);
    console.log(`✅ TypeScript compiled to: ${compiledPath}`);

    // Step 3: Import and analyze the compiled module
    const moduleUrl = pathToFileURL(compiledPath).href;
    
    // Clear module cache for fresh import
    if (moduleUrl in require.cache) {
      delete require.cache[moduleUrl];
    }

    const module = await import(moduleUrl);
    const defaultExport = module.default;
    const metadata = module.modelMetadata;

    console.log(`📦 Module loaded, exports:`, Object.keys(module));

    // Step 4: Validate and analyze the export
    const validation = validateModelExport(defaultExport);
    if (!validation.isValid) {
      throw new Error(`Invalid model export: ${validation.error}`);
    }

    // Step 5: Extract model information
    const modelName = getModelNameFromExport(defaultExport, modelId);
    const modelType = validation.type as 'static' | 'parametric';
    
    console.log(`🏷️ Model: ${modelName} (${modelType})`);

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
      
      console.log(`🔧 Generated parametric function with ${Object.keys(config.parameters).length} parameters`);
    } else {
      // For static models, create simple wrapper function
      functionCode = generateStaticFunctionCode(
        functionName,
        compiledPath
      );
      
      console.log(`🔧 Generated static function`);
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
    console.error(`❌ Failed to compile ${filePath}:`, error);
    throw error;
  }
}

/**
 * Compile TypeScript file using Vite
 */
async function compileTypeScriptFile(filePath: string): Promise<string> {
  const fileName = basename(filePath, '.ts');
  const tempDir = join(process.cwd(), 'temp', 'compilation');
  
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
  // Import the compiled module
  const module = await import('${compiledPath}');
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
  // Import the compiled module
  const module = await import('${compiledPath}');
  const createModel = module.default;
  
  // Call the model creation function
  return createModel();
}`;
}
