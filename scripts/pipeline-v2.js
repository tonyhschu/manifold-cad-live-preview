#!/usr/bin/env node
import { build } from 'vite';
import { resolve, dirname, basename } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { parseArgs } from 'util';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Check for required compiled dependencies
function checkCompiledDependencies() {
  const requiredFiles = [
    '../dist/lib/manifold.js',
    '../dist/lib/export-core.js'
  ];
  
  const missing = requiredFiles.filter(file => !existsSync(resolve(__dirname, file)));
  
  if (missing.length > 0) {
    console.error(`❌ Missing compiled dependencies:`);
    missing.forEach(file => console.error(`   ${file}`));
    console.error(`
⚠️  DEVELOPER NOTE: You need to compile the core libraries first.
   Run: npm run compile
   
   This step is only needed for developers working on this project.
   End users should receive pre-compiled libraries.
`);
    process.exit(1);
  }
}

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

// Check dependencies before proceeding
checkCompiledDependencies();

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
    
    // Import the shared export function
    const { manifoldToOBJ } = await import('../dist/lib/export-core.js');
    
    // Export to OBJ using shared function
    console.log('Exporting to OBJ...');
    const objContent = manifoldToOBJ(model);
    
    // Write to file (Node.js-specific)
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
