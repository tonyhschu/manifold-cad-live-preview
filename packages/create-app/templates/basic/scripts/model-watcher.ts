#!/usr/bin/env node
/**
 * Standalone Model Watcher Script
 * 
 * Watches model files and compiles them using the wrapper pipeline.
 * This is the proven working solution from Model Watcher V2.
 */

import { build } from 'vite';
import { resolve, dirname, basename, join, relative } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import chokidar from 'chokidar';
import { glob } from 'glob';

// Import wrapper's proven pipeline utilities directly from source (like tests do)
import { manifoldToGLB } from '@manifold-studio/wrapper/src/lib/gltf-export';
import { 
  isParametricConfig,
  extractDefaultParams,
  mergeParameters
} from '@manifold-studio/wrapper/src/pipeline/core';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface ModelManifest {
  models: Array<{
    id: string;
    name: string;
    type: 'static' | 'parametric';
    filePath: string;
    blobPath?: string;
    lastUpdated: string;
    status: 'pending' | 'compiling' | 'compiled' | 'error';
    error?: string;
    blobSize?: number;
    compilationTime?: number;
  }>;
  lastBuild: string;
  buildCount: number;
}

// Configuration
const CONFIG = {
  modelDir: './components',
  tempDir: './temp',
  debounceMs: 300
};

// State
let buildCount = 0;
let debounceTimer: NodeJS.Timeout | null = null;

// Console logging utilities
const log = {
  info: (msg: string, ...args: any[]) => console.log(`🔍 [ModelWatcher] ${msg}`, ...args),
  success: (msg: string, ...args: any[]) => console.log(`✅ [ModelWatcher] ${msg}`, ...args),
  warn: (msg: string, ...args: any[]) => console.log(`⚠️  [ModelWatcher] ${msg}`, ...args),
  error: (msg: string, ...args: any[]) => console.log(`💥 [ModelWatcher] ${msg}`, ...args)
};

async function main(): Promise<void> {
  try {
    log.info('🚀 Starting Manifold Studio Model Watcher');
    log.info(`📁 Model Directory: ${CONFIG.modelDir}`);
    log.info(`📁 Temp Directory: ${CONFIG.tempDir}`);

    // Initialize temp folder structure
    await initializeTempFolder();
    
    // Discover and compile initial models
    await discoverAndCompileModels();
    
    // Start file watcher
    await startFileWatcher();
    
    log.success('✨ Model Watcher initialized and watching for changes...');
    log.info('Press Ctrl+C to stop');

  } catch (error: any) {
    log.error('Failed to start model watcher:', error.message);
    process.exit(1);
  }
}

async function initializeTempFolder(): Promise<void> {
  log.info('📁 Initializing temp folder structure...');
  
  try {
    // Create temp directories
    await mkdir(join(CONFIG.tempDir, 'blobs'), { recursive: true });
    await mkdir(join(CONFIG.tempDir, 'logs'), { recursive: true });
    await mkdir(join(CONFIG.tempDir, 'core'), { recursive: true });
    
    log.success(`Created temp directories at: ${CONFIG.tempDir}`);
    
    // Create initial manifest
    const initialManifest: ModelManifest = {
      models: [],
      lastBuild: new Date().toISOString(),
      buildCount: 0
    };
    
    await writeManifest(initialManifest);
    log.success('Created initial manifest.json');
    
  } catch (error) {
    log.error('Failed to initialize temp folder:', error);
    throw error;
  }
}

async function discoverAndCompileModels(): Promise<void> {
  log.info('🔍 Discovering model files...');
  
  try {
    // Discover model files
    const pattern = join(CONFIG.modelDir, '**/*.{ts,js}');
    const files = await glob(pattern);
    
    if (files.length === 0) {
      log.warn('No model files found in components/ directory');
      log.info('Create .ts files in the components/ directory to get started');
      return;
    }
    
    log.info(`📄 Found ${files.length} model files:`);
    files.forEach((file, index) => {
      log.info(`  ${index + 1}. ${file}`);
    });
    
    // Convert to model entries
    const models = files.map(filePath => {
      const id = filePathToModelId(filePath);
      const name = modelIdToDisplayName(id);
      
      return {
        id,
        name,
        type: 'static' as const,
        filePath,
        lastUpdated: new Date().toISOString(),
        status: 'pending' as const
      };
    });
    
    // Update manifest
    const manifest: ModelManifest = {
      models,
      lastBuild: new Date().toISOString(),
      buildCount: ++buildCount
    };
    
    await writeManifest(manifest);
    log.success(`📋 Updated manifest with ${models.length} models`);
    
    // Compile all models
    await compileAllModels(manifest);
    
  } catch (error) {
    log.error('Failed to discover and compile models:', error);
    throw error;
  }
}

async function compileAllModels(manifest: ModelManifest): Promise<void> {
  log.info('🏗️ Starting model compilation phase...');
  
  try {
    log.info(`📋 Found ${manifest.models.length} models to compile`);

    // Compile each model
    for (const model of manifest.models) {
      await compileModel(model);
    }

    // Update manifest with compilation results
    await writeManifest(manifest);

    const successCount = manifest.models.filter(m => m.status === 'compiled').length;
    const errorCount = manifest.models.filter(m => m.status === 'error').length;
    
    log.success(`🎉 Compilation phase complete - ${successCount} successful, ${errorCount} errors`);

  } catch (error) {
    log.error('Failed to compile models:', error);
    throw error;
  }
}

async function compileModel(model: ModelManifest['models'][0]): Promise<void> {
  log.info(`🔨 Compiling model: ${model.id}`);

  // Update status to compiling
  model.status = 'compiling';
  model.lastUpdated = new Date().toISOString();

  try {
    const startTime = Date.now();

    // Step 1: Compile TypeScript model to JavaScript using Vite
    const compiledPath = await compileModelFile(model.filePath);
    log.info(`✅ TypeScript compiled to: ${compiledPath}`);

    // Step 2: Import the compiled module
    const module = await import(`file://${compiledPath}`);
    log.info(`✅ Module loaded with exports:`, Object.keys(module));

    // Step 3: Get the default export and generate the model
    const defaultExport = module.default;
    if (!defaultExport) {
      throw new Error('No default export found in module');
    }

    let manifoldModel: any;

    // Check if this is a parametric model or function-based model
    if (isParametricConfig(defaultExport)) {
      log.info('📐 Detected parametric model');
      model.type = 'parametric';
      
      // For parametric models, use default parameters
      const defaultParams = extractDefaultParams(defaultExport);
      manifoldModel = defaultExport.generateModel(defaultParams);
    } else if (typeof defaultExport === 'function') {
      log.info('🔧 Detected function-based model');
      // For function-based models, call with no parameters (use defaults)
      manifoldModel = defaultExport();
    } else {
      throw new Error('Invalid model export: must be either a ParametricConfig object or a function');
    }

    log.info(`✅ Manifold model generated:`, typeof manifoldModel);

    // Step 4: Export to GLB using wrapper's proven export function
    log.info('📦 Exporting to GLB...');
    const glbBlob = await manifoldToGLB(manifoldModel);
    
    // Step 5: Write GLB blob to temp folder
    const blobsDir = join(CONFIG.tempDir, 'blobs');
    const fileName = `${model.id.replace(/[\/\\]/g, '-')}.glb`;
    const blobPath = join(blobsDir, fileName);

    // Convert blob to buffer for Node.js file writing
    const glbBuffer = Buffer.from(await glbBlob.arrayBuffer());
    await writeFile(blobPath, glbBuffer);

    const compilationTime = Date.now() - startTime;

    // Update model status
    model.status = 'compiled';
    model.blobPath = relative(CONFIG.tempDir, blobPath);
    model.blobSize = glbBuffer.length;
    model.compilationTime = compilationTime;
    model.lastUpdated = new Date().toISOString();

    log.success(`✅ Model compiled successfully: ${model.id} (${glbBuffer.length} bytes, ${compilationTime}ms)`);

  } catch (error: any) {
    model.status = 'error';
    model.error = error.message;
    model.lastUpdated = new Date().toISOString();

    log.error(`💥 Model compilation failed: ${model.id} - ${error.message}`);
  }
}

async function compileModelFile(modelPath: string): Promise<string> {
  const modelName = basename(modelPath, '.ts');
  const tempCompileDir = join(CONFIG.tempDir, 'core');

  // Use Vite to compile the model file
  await build({
    configFile: false,
    build: {
      target: 'node18',
      lib: {
        entry: resolve(modelPath),
        name: `${modelName}Model`,
        fileName: modelName,
        formats: ['es']
      },
      outDir: tempCompileDir,
      rollupOptions: {
        external: ['manifold-3d', '@manifold-studio/wrapper']
      }
    }
  });

  return resolve(tempCompileDir, `${modelName}.js`);
}

async function startFileWatcher(): Promise<void> {
  log.info('👀 Starting file watcher...');
  
  const watchPattern = join(CONFIG.modelDir, '**/*.{ts,js}');
  
  const watcher = chokidar.watch(watchPattern, {
    ignored: /node_modules/,
    persistent: true,
    ignoreInitial: true
  });

  watcher.on('add', (filePath) => debouncedModelUpdate('add', filePath));
  watcher.on('change', (filePath) => debouncedModelUpdate('change', filePath));
  watcher.on('unlink', (filePath) => debouncedModelUpdate('unlink', filePath));

  watcher.on('error', (error) => {
    log.error('File watcher error:', error);
  });

  log.success('File watcher started');
}

function debouncedModelUpdate(event: string, filePath: string): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(async () => {
    log.info(`🔄 Processing ${event} event for: ${filePath}`);
    
    try {
      await discoverAndCompileModels();
      log.success(`✨ Model update complete for ${event}: ${filePath}`);
    } catch (error) {
      log.error(`Failed to process ${event} event:`, error);
    }
    
    debounceTimer = null;
  }, CONFIG.debounceMs);
}

async function writeManifest(manifest: ModelManifest): Promise<void> {
  const manifestPath = join(CONFIG.tempDir, 'manifest.json');
  
  try {
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  } catch (error) {
    log.error('Failed to write manifest:', error);
    throw error;
  }
}

function filePathToModelId(filePath: string): string {
  // Convert file path to model ID
  // e.g., "components/chassis copy.ts" -> "components/chassis-copy"
  return filePath
    .replace(/\.(ts|js)$/, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

function modelIdToDisplayName(id: string): string {
  // Convert model ID to display name
  // e.g., "components/chassis-copy" -> "Components / Chassis Copy"
  return id
    .split('/')
    .map(part => part.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' '))
    .join(' / ');
}

// Run main function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
