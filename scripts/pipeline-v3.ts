#!/usr/bin/env node
// scripts/pipeline-v3.ts
// TypeScript version of the pipeline with just-in-time compilation

import { build } from 'vite';
import { resolve, dirname, basename } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { parseArgs } from 'util';
import { fileURLToPath } from 'url';

// Import core pipeline utilities from compiled version
import {
  isParametricConfig,
  extractDefaultParams,
  mergeParameters,
  parseParameterString
} from '../dist/pipeline/pipeline/core.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Check for required compiled dependencies
function checkCompiledDependencies(): void {
  // Use current working directory as project root
  const projectRoot = process.cwd();
  const requiredFiles = [
    resolve(projectRoot, 'dist/lib/manifold.js'),
    resolve(projectRoot, 'dist/lib/export-core.js')
  ];

  const missing = requiredFiles.filter(file => !existsSync(file));

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
Manifold CAD Pipeline v3 (TypeScript)

Usage: pipeline-v3 <model-path> [options]

Arguments:
  model-path        Path to the TypeScript model file

Options:
  -p, --params      Parameter overrides (format: key=value,key2=value2)
  -o, --output      Output filename (default: <model-name>.<format>)
  -f, --format      Export format (default: obj)
  -h, --help        Show this help

Examples:
  pipeline-v3 src/models/cube.ts
  pipeline-v3 src/models/cube.ts --params size=25,centered=false
  pipeline-v3 src/models/parametric-hook.ts
  pipeline-v3 src/models/parametric-hook.ts --params thickness=5,mountingType=magnetic
`);
  process.exit(0);
}

// Check dependencies before proceeding
checkCompiledDependencies();

const modelPath = positionals[0];

async function compileModel(modelPath: string): Promise<string> {
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

export async function main(): Promise<void> {
  try {
    // Compile the model
    const compiledPath = await compileModel(modelPath);
    console.log(`✅ Model compiled to: ${compiledPath}`);

    // Import the compiled module
    const module = await import(`file://${compiledPath}`);
    console.log(`✅ Module loaded with exports:`, Object.keys(module));

    // Get the default export
    const defaultExport = module.default;
    if (!defaultExport) {
      throw new Error('No default export found in module');
    }

    // Parse user parameters if provided
    const userParams = values.params ? parseParameterString(values.params) : {};
    if (Object.keys(userParams).length > 0) {
      console.log(`User parameters:`, userParams);
    }

    let model: any;

    // Check if this is a parametric model
    if (isParametricConfig(defaultExport)) {
      console.log('📐 Detected parametric model');
      const config = defaultExport;

      // Extract default parameters
      const defaultParams = extractDefaultParams(config);
      console.log(`Default parameters:`, defaultParams);

      // Merge user parameters with defaults
      const finalParams = Object.keys(userParams).length > 0
        ? mergeParameters(defaultParams, userParams, { logChanges: true })
        : defaultParams;

      console.log(`Final parameters:`, finalParams);

      // Generate the model using the config
      console.log('Generating parametric model...');
      model = config.generateModel(finalParams);

    } else if (typeof defaultExport === 'function') {
      console.log('🔧 Detected function-based model');

      // Legacy function-based model (like cube.ts)
      console.log('Generating model...');
      if (Object.keys(userParams).length > 0) {
        // For cube.ts compatibility - pass specific parameters
        model = defaultExport(userParams.size, userParams.centered);
      } else {
        model = defaultExport();
      }

    } else {
      throw new Error('Invalid model export: must be either a ParametricConfig object or a function');
    }

    console.log(`✅ Model generated:`, typeof model);

    // Import the shared export function
    const projectRoot = process.cwd();
    const { manifoldToOBJ } = await import(`file://${resolve(projectRoot, 'dist/lib/export-core.js')}`);

    // Export to OBJ using shared function
    console.log('Exporting to OBJ...');
    const objContent = manifoldToOBJ(model);

    // Write to file (Node.js-specific)
    const modelName = basename(modelPath, '.ts');
    const outputFilename = values.output || `${modelName}.${values.format}`;
    await writeFile(outputFilename, objContent);

    console.log(`✅ Model exported to: ${outputFilename}`);
    console.log(`✅ Pipeline completed successfully!`);

  } catch (error: any) {
    console.error(`❌ Error:`, error.message);
    process.exit(1);
  }
}

// Run main function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
