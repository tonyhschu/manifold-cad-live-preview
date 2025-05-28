#!/usr/bin/env node
import { build } from 'vite';
import { resolve, dirname, basename } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { parseArgs } from 'util';

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

if (values.help || positionals.length === 0) {
  console.log(`
Manifold CAD Pipeline v2

Usage: node scripts/pipeline-v2.js <model-path> [options]

Arguments:
  model-path        Path to the TypeScript model file

Options:
  -p, --params      Parameter overrides (format: key=value,key2=value2)
  -o, --output      Output filename (default: <model-name>.<format>)
  -f, --format      Export format (default: obj)
  -h, --help        Show this help

Examples:
  node scripts/pipeline-v2.js src/models/cube.ts
  node scripts/pipeline-v2.js src/models/cube.ts --params size=25,centered=false
`);
  process.exit(0);
}

const modelPath = positionals[0];

async function compileModel(modelPath) {
  console.log(`Compiling ${modelPath}...`);
  
  const modelName = basename(modelPath, '.ts');
  const tempDir = 'temp/pipeline';
  
  // Ensure temp directory exists
  if (!existsSync(tempDir)) {
    await mkdir(tempDir, { recursive: true });
  }
  
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
      outDir: tempDir,
      rollupOptions: {
        external: ['manifold-3d']
      }
    }
  });
  
  return resolve(tempDir, `${modelName}.js`);
}

function exportToOBJ(manifold) {
  try {
    const mesh = manifold.getMesh();
    
    // Use the correct property names
    const vertices = mesh.vertProperties;
    const triangles = mesh.triVerts;
    
    if (!vertices || !triangles) {
      throw new Error(`Missing mesh data - vertices: ${!!vertices}, triangles: ${!!triangles}`);
    }
    
    const numVertices = vertices.length / 3;
    let objContent = '# Exported from Manifold\n';
    
    // Add vertices
    for (let i = 0; i < vertices.length; i += 3) {
      objContent += `v ${vertices[i]} ${vertices[i + 1]} ${vertices[i + 2]}\n`;
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

async function main() {
  try {
    // Compile the model
    const compiledPath = await compileModel(modelPath);
    console.log(`✅ Model compiled to: ${compiledPath}`);
    
    // Import the compiled module
    const module = await import(`file://${compiledPath}`);
    console.log(`✅ Module loaded with exports:`, Object.keys(module));
    
    // Get the model function (prefer default export)
    const modelFunction = module.default || module.createCube || module.createHook;
    if (!modelFunction) {
      throw new Error('No model function found in exports');
    }
    
    // Parse parameters if provided
    const params = {};
    if (values.params) {
      values.params.split(',').forEach(pair => {
        const [key, value] = pair.split('=');
        // Try to parse as number, boolean, or keep as string
        if (value === 'true') params[key] = true;
        else if (value === 'false') params[key] = false;
        else if (!isNaN(value)) params[key] = Number(value);
        else params[key] = value;
      });
      console.log(`Parameters:`, params);
    }
    
    // Execute the model
    console.log('Generating model...');
    const model = Object.keys(params).length > 0 
      ? modelFunction(params.size, params.centered) // For cube
      : modelFunction();
    
    console.log(`✅ Model generated:`, typeof model);
    
    // Export to OBJ
    console.log('Exporting to OBJ...');
    const objContent = exportToOBJ(model);
    
    // Write to file
    const modelName = basename(modelPath, '.ts');
    const outputFilename = values.output || `${modelName}.${values.format}`;
    await writeFile(outputFilename, objContent);
    
    console.log(`✅ Model exported to: ${outputFilename}`);
    console.log(`✅ Pipeline completed successfully!`);
    
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    process.exit(1);
  }
}

main();
