#!/usr/bin/env node

/**
 * Manifold CAD Headless Pipeline
 * 
 * Generates 3D models programmatically from parametric configurations
 * Usage: node scripts/pipeline.js <model-id> [options]
 * Example: node scripts/pipeline.js parametric-hook --params thickness=5,width=20 --output hook-custom.obj
 */

import { writeFile } from 'fs/promises';
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

Usage: node scripts/pipeline.js <model-id> [options]

Arguments:
  model-id          ID of the parametric model to generate

Options:
  -p, --params      Parameter overrides (format: key=value,key2=value2)
  -o, --output      Output filename (default: <model-id>.<format>)
  -f, --format      Export format (default: obj)
  -h, --help        Show this help

Examples:
  node scripts/pipeline.js parametric-hook
  node scripts/pipeline.js parametric-hook --params thickness=5,width=20
  node scripts/pipeline.js parametric-hook --output custom-hook.obj --params mountingType=magnetic

Supported Models:
  parametric-hook   Customizable wall hook with mounting options
  
Supported Formats:
  obj               Wavefront OBJ format
`);
  process.exit(0);
}

const modelId = positionals[0];

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
 * Simple parametric hook model for pipeline (minimal implementation)
 */
function createHook(thickness = 3, width = 13, hookRadius = 10, segments = 16, hookEndAngle = Math.PI * 0.7, mountingType = "screw", includeRounding = true) {
  const range = (start, end) => {
    const length = end - start;
    return Array.from({ length }, (_, i) => start + i);
  };

  // Generate hook curve points
  const hook = range(0, segments + 1)
    .map((index) => (index / segments) * hookEndAngle)
    .map((theta) => [
      Math.cos(theta) * hookRadius - hookRadius,
      Math.sin(theta) * hookRadius,
    ]);

  // Generate anchor points based on mounting type
  const anchorRadius = thickness / 2 + (mountingType === "adhesive" ? 2 : 3.1) / 2;
  const anchor = range(0, segments + 1)
    .map((index) => (index / segments) * Math.PI)
    .map((theta) => [
      Math.cos(theta) * anchorRadius + anchorRadius,
      -Math.sin(theta) * anchorRadius - 80,
    ]);

  const hookEndPoint = hook[hook.length - 1];
  const hookExtensionAngle = hookEndAngle + Math.PI / 2;
  const hookExtensionLength = 15;

  // Build the midline path
  const midline = [].concat(
    [[2 * anchorRadius, -60]],
    anchor,
    [[0, -80]],
    hook,
    [
      [
        hookEndPoint[0] + (Math.cos(hookExtensionAngle) * width) / 2,
        hookEndPoint[1] + (Math.sin(hookExtensionAngle) * width) / 2,
      ],
    ]
  );

  // Create geometry along the midline
  const disks = midline.map((p) => {
    let disk = Manifold.cylinder(width, thickness / 2, thickness / 2).translate([
      p[0],
      p[1],
      0,
    ]);
    return disk;
  });

  const hulls = range(0, midline.length - 1).map((index) => {
    const d0 = disks[index];
    const d1 = disks[index + 1];
    return Manifold.hull([d0, d1]);
  });

  // Create the hook end based on mounting type
  let roundedEnd = Manifold.cylinder(thickness, width / 2, width / 2).rotate([0, 90, 0]);
  
  if (mountingType === "adhesive") {
    // Make the back flatter for adhesive mounting
    const flatBack = Manifold.cube([thickness, width, width], true);
    roundedEnd = Manifold.union([roundedEnd, flatBack]);
  }

  const extension = Manifold.hull([
    roundedEnd.translate([0, 0, 0]),
    roundedEnd.translate([0, hookExtensionLength, 0]),
  ]);

  let result = Manifold.union([
    Manifold.union(hulls),
    extension
      .translate([-thickness / 2, width / 2, width / 2])
      .rotate([0, 0, ((hookExtensionAngle - Math.PI / 2) / Math.PI) * 180])
      .translate([hookEndPoint[0], hookEndPoint[1], 0]),
  ]);

  // Add mounting features
  if (mountingType === "screw") {
    // Add screw hole
    const screwHole = Manifold.cylinder(2, thickness + 2, 8).translate([0, -40, 0]);
    result = Manifold.difference(result, screwHole);
  } else if (mountingType === "magnetic") {
    // Add magnet cavity
    const magnetCavity = Manifold.cylinder(8, 3, 8).translate([0, -40, -thickness/2 + 1]);
    result = Manifold.difference(result, magnetCavity);
  }

  return result;
}

/**
 * Load a parametric model configuration
 */
async function loadParametricModel(modelId) {
  try {
    if (modelId === 'parametric-hook') {
      return {
        parameters: {
          thickness: { value: 3, min: 1, max: 10 },
          width: { value: 13, min: 5, max: 50 },
          hookRadius: { value: 10, min: 5, max: 20 },
          segments: { value: 16, min: 8, max: 64 },
          hookEndAngle: { value: Math.PI * 0.7, min: Math.PI * 0.3, max: Math.PI * 0.9 },
          mountingType: { value: "screw", options: { screw: "screw", adhesive: "adhesive", magnetic: "magnetic" } },
          includeRounding: { value: true }
        },
        generateModel: (params) => createHook(
          params.thickness,
          params.width,
          params.hookRadius,
          params.segments,
          params.hookEndAngle,
          params.mountingType,
          params.includeRounding
        ),
        name: "Parametric Hook",
        description: "A customizable wall hook with adjustable dimensions and mounting options"
      };
    } else {
      throw new Error(`Unsupported model: ${modelId}`);
    }
  } catch (error) {
    throw new Error(`Failed to load model '${modelId}': ${error.message}`);
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
    console.log(`Loading model: ${modelId}`);
    
    // Load the parametric model configuration
    const config = await loadParametricModel(modelId);
    
    console.log(`Model loaded: ${config.name || modelId}`);
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
    const outputFilename = values.output || `${modelId}.${values.format}`;
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