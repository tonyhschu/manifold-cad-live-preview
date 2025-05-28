#!/usr/bin/env node
/**
 * Compiles the manifold.ts file to JavaScript
 * This script uses TypeScript to compile the file and places it in the dist directory
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

// Get directories
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.join(projectRoot, 'src/lib');
const distDir = path.join(projectRoot, 'dist/lib');

// Create output directory if it doesn't exist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log(`Created output directory: ${distDir}`);
}

// Pipeline compilation output directory
const pipelineDistDir = path.join(projectRoot, 'dist');

// Create output directory if it doesn't exist
if (!fs.existsSync(pipelineDistDir)) {
  fs.mkdirSync(pipelineDistDir, { recursive: true });
  console.log(`Created output directory: ${pipelineDistDir}`);
}

async function compile(manifoldOnly = false) {
  console.log(`Compiling core libraries for Node.js pipeline...`);
  
  // Compile manifold.ts for Node.js pipeline
  console.log(`Compiling manifold.ts...`);
  const manifoldSrc = path.join(srcDir, 'manifold.ts');
  const tscManifoldCommand = 
    `npx tsc ${manifoldSrc} --outDir ${distDir} --module es2022 --target es2019 ` +
    `--moduleResolution node --lib es2019,dom --skipLibCheck --declaration`;
  
  try {
    await execAsync(tscManifoldCommand);
    console.log(`✅ manifold.ts compiled successfully`);
  } catch (error) {
    console.error(`❌ manifold.ts compilation failed:`, error.message);
    return false;
  }
  
  // Compile export-core.ts for Node.js pipeline
  console.log(`Compiling export-core.ts...`);
  const exportCoreSrc = path.join(srcDir, 'export-core.ts');
  const tscExportCoreCommand = 
    `npx tsc ${exportCoreSrc} --outDir ${distDir} --module es2022 --target es2019 ` +
    `--moduleResolution node --lib es2019,dom --skipLibCheck --declaration`;
  
  try {
    await execAsync(tscExportCoreCommand);
    console.log(`✅ export-core.ts compiled successfully`);
  } catch (error) {
    console.error(`❌ export-core.ts compilation failed:`, error.message);
    return false;
  }
  
  console.log(`✅ Core library compilation completed`);
  
  return true;
}

// Run compilation if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const manifoldOnly = process.argv.includes('--manifold-only');
  const success = await compile(manifoldOnly);
  process.exit(success ? 0 : 1);
}

export default compile;
