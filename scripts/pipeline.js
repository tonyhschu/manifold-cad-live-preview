#!/usr/bin/env node

/**
 * Manifold CAD Headless Pipeline
 * 
 * Generates 3D models programmatically from parametric configurations
 * Usage: node scripts/pipeline.js <model-id> [options]
 * Example: node scripts/pipeline.js parametric-hook --params thickness=5,width=20 --output hook-custom.obj
 */

import { writeFile } from 'fs/promises';
import { existsSync as fs_existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseArgs } from 'util';

// Import manifold from compiled lib
import { Manifold } from '../dist/lib/manifold.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    params: { type: 'string', short: 'p' },
    output: { type: 'string', short: 'o' },
    format: { type: 'string', short: 'f', default: 'obj' },
    help: { type: 'boolean', short: 'h' },
  },
  allowPositionals: true
});

// Show help
if (values.help || positionals.length === 0) {
  console.log(`
Manifold CAD Headless Pipeline

Usage: node scripts/pipeline.js <model-path> [options]

Arguments:
  model-path        Path to the parametric model file (e.g., src/models/parametric-hook.ts)

Options:
  -p, --params      Parameter overrides (format: key=value,key2=value2)
  -o, --output      Output filename (default: <model-name>.<format>)
  -f, --format      Export format (default: obj)
  -h, --help        Show this help

Examples:
  node scripts/pipeline.js src/models/parametric-hook.ts
  node scripts/pipeline.js src/models/parametric-hook.ts --params thickness=5,width=20
  node scripts/pipeline.js src/models/cube.ts --output custom-cube.obj --params size=15

The model file should export a ParametricConfig as default export or named 'config'.

Supported Formats:
  obj               Wavefront OBJ format
`);
  process.exit(0);
}

const modelPath = positionals[0];

/**
 * Parse parameter string into object
 * Format: "key=value,key2=value2"
 */
function parseParameters(paramString) {
  if (!paramString) return {};
  
  const params = {};
  const pairs = paramString.split(',');
  
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (!key || value === undefined) {
      throw new Error(`Invalid parameter format: ${pair}. Use key=value format.`);
    }
    
    // Try to parse as number, boolean, or keep as string
    let parsedValue = value;
    if (!isNaN(value) && !isNaN(parseFloat(value))) {
      parsedValue = parseFloat(value);
    } else if (value.toLowerCase() === 'true') {
      parsedValue = true;
    } else if (value.toLowerCase() === 'false') {
      parsedValue = false;
    }
    
    params[key.trim()] = parsedValue;
  }
  
  return params;
}

/**
 * Extract model name from file path
 */
function getModelName(filePath) {
  const parts = filePath.split('/');
  const filename = parts[parts.length - 1];
  return filename.replace(/\.(ts|js)$/, '');
}

/**
 * Convert TypeScript path to compiled JavaScript path
 */
function getCompiledPath(tsPath) {
  // Convert src/models/foo.ts to dist/models/foo.js
  if (tsPath.startsWith('src/')) {
    return tsPath.replace('src/', 'dist/').replace('.ts', '.js');
  }
  return tsPath;
}

/**
 * Load a parametric model configuration from file path
 */
async function loadParametricModel(modelPath) {
  try {
    console.log(`Loading model from: ${modelPath}`);
    
    let importPath;
    
    // Handle TypeScript files by importing from compiled JavaScript
    if (modelPath.endsWith('.ts')) {
      const compiledPath = getCompiledPath(modelPath);
      importPath = resolve(__dirname, '..', compiledPath);
      console.log(`Using compiled path: ${compiledPath}`);
    } else {
      importPath = resolve(__dirname, '..', modelPath);
    }
    
    // Convert to file URL for proper ES module import
    const fileUrl = `file://${importPath}`;
    console.log(`Importing from: ${fileUrl}`);
    
    // Check if the file exists
    if (!fs_existsSync(importPath)) {
      throw new Error(`Compiled file not found: ${importPath}`);
    }
    
    // Dynamic import the module
    const modelModule = await import(fileUrl);
    
    // Try to find the config in common export patterns
    let config = null;
    
    // Try common export names
    if (modelModule.default) {
      config = modelModule.default;
    } else if (modelModule.config) {
      config = modelModule.config;
    } else {
      // Look for exports ending with 'Config'
      const configExports = Object.keys(modelModule).filter(key => key.toLowerCase().includes('config'));
      if (configExports.length > 0) {
        config = modelModule[configExports[0]];
      }
    }
    
    if (!config) {
      throw new Error(`No ParametricConfig found in module. Expected default export, 'config' export, or export ending with 'Config'.`);
    }
    
    // Validate that it's a proper ParametricConfig
    if (!config.parameters || !config.generateModel) {
      throw new Error(`Invalid ParametricConfig: missing 'parameters' or 'generateModel' properties.`);
    }
    
    return config;
    
  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND') {
      throw new Error(`Model file not found: ${modelPath}. Make sure the file exists and is compiled (for .ts files).`);
    }
    throw new Error(`Failed to load model from '${modelPath}': ${error.message}`);
  }
}

/**
 * Validate parameters against model configuration
 */
function validateParameters(config, params) {
  for (const [key, value] of Object.entries(params)) {
    const paramConfig = config.parameters[key];
    if (!paramConfig) {
      console.warn(`Warning: Unknown parameter '${key}' for model`);
      continue;
    }
    
    // Validate based on parameter type
    if ('min' in paramConfig && typeof value === 'number' && value < paramConfig.min) {
      throw new Error(`Parameter '${key}' value ${value} is below minimum ${paramConfig.min}`);
    }
    if ('max' in paramConfig && typeof value === 'number' && value > paramConfig.max) {
      throw new Error(`Parameter '${key}' value ${value} is above maximum ${paramConfig.max}`);
    }
    if ('options' in paramConfig && paramConfig.options) {
      const validOptions = Object.keys(paramConfig.options);
      if (!validOptions.includes(value)) {
        throw new Error(`Parameter '${key}' value '${value}' is not valid. Options: ${validOptions.join(', ')}`);
      }
    }
  }
}

/**
 * Generate default parameters from config
 */
function getDefaultParameters(config) {
  const defaults = {};
  for (const [key, paramConfig] of Object.entries(config.parameters)) {
    defaults[key] = paramConfig.value;
  }
  return defaults;
}

/**
 * Export model to OBJ format
 */
function exportToOBJ(model) {
  try {
    // Get the mesh from the model
    const mesh = model.getMesh();
    
    // Extract vertices and triangles
    const positions = mesh.vertProperties;
    const triangles = mesh.triVerts;

    // Validate the data
    if (!positions || !triangles || positions.length === 0 || triangles.length === 0) {
      throw new Error("Invalid mesh data for export");
    }

    const numComponents = mesh.numProp || 3;
    const numVertices = positions.length / numComponents;

    // Build OBJ format string
    let objContent = "# Exported from Manifold CAD Pipeline\n";
    objContent += `# Vertices: ${numVertices}, Triangles: ${triangles.length / 3}\n`;
    objContent += `# Generated: ${new Date().toISOString()}\n\n`;

    // Add vertices
    for (let i = 0; i < numVertices; i++) {
      const baseIdx = i * numComponents;
      if (baseIdx + 2 < positions.length) {
        objContent += `v ${positions[baseIdx]} ${positions[baseIdx + 1]} ${positions[baseIdx + 2]}\n`;
      }
    }

    // Add faces (triangles)
    for (let i = 0; i < triangles.length; i += 3) {
      if (i + 2 < triangles.length &&
          triangles[i] < numVertices &&
          triangles[i + 1] < numVertices &&
          triangles[i + 2] < numVertices) {
        // OBJ uses 1-based indexing
        objContent += `f ${triangles[i] + 1} ${triangles[i + 1] + 1} ${triangles[i + 2] + 1}\n`;
      }
    }

    return objContent;
  } catch (error) {
    throw new Error(`OBJ export failed: ${error.message}`);
  }
}

/**
 * Main pipeline execution
 */
async function main() {
  try {
    // Load the parametric model configuration
    const config = await loadParametricModel(modelPath);
    
    const modelName = getModelName(modelPath);
    console.log(`Model loaded: ${config.name || modelName}`);
    if (config.description) {
      console.log(`Description: ${config.description}`);
    }
    
    // Parse and validate parameters
    const userParams = parseParameters(values.params);
    const defaultParams = getDefaultParameters(config);
    const finalParams = { ...defaultParams, ...userParams };
    
    console.log(`Parameters:`, finalParams);
    
    // Validate parameters
    validateParameters(config, userParams);
    
    // Generate the model
    console.log('Generating model...');
    const model = config.generateModel(finalParams);
    
    if (!model) {
      throw new Error('Model generation returned null or undefined');
    }
    
    // Export the model
    const outputFilename = values.output || `${modelName}.${values.format}`;
    console.log(`Exporting to: ${outputFilename}`);
    
    let exportContent;
    switch (values.format) {
      case 'obj':
        exportContent = exportToOBJ(model);
        break;
      default:
        throw new Error(`Unsupported export format: ${values.format}`);
    }
    
    // Write to file
    await writeFile(outputFilename, exportContent);
    
    console.log(`✓ Model exported successfully to ${outputFilename}`);
    console.log(`✓ Pipeline completed`);
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the pipeline
main().catch(error => {
  console.error(`Unexpected error: ${error.message}`);
  process.exit(1);
});