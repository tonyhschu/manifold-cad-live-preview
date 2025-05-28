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
  console.log(`Compiling TypeScript files to JavaScript...`);
  
  // Always compile manifold.ts for the lib
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
  
  // Compile export-core.ts
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
  
  // Compile individual model files for pipeline
  console.log(`Compiling pipeline model files...`);
  const modelFiles = [
    { src: path.join(projectRoot, 'src/types/parametric-config.ts'), dest: path.join(projectRoot, 'dist/types') },
    { src: path.join(projectRoot, 'src/models/parametric-hook.ts'), dest: path.join(projectRoot, 'dist/models') },
    { src: path.join(projectRoot, 'src/models/cube.ts'), dest: path.join(projectRoot, 'dist/models') },
  ];

  for (const file of modelFiles) {
    if (!fs.existsSync(file.src)) {
      console.log(`⚠️  Skipping ${path.basename(file.src)} - file not found`);
      continue;
    }
    
    if (!fs.existsSync(file.dest)) {
      fs.mkdirSync(file.dest, { recursive: true });
    }

    const filename = path.basename(file.src);
    console.log(`Compiling ${filename}...`);
    
    const tscCommand = 
      `npx tsc ${file.src} --outDir ${file.dest} --module es2022 --target es2019 ` +
      `--moduleResolution bundler --lib es2019,dom --skipLibCheck --declaration --esModuleInterop --allowSyntheticDefaultImports --allowImportingTsExtensions false`;
    
    try {
      await execAsync(tscCommand);
      const jsFilename = filename.replace('.ts', '.js');
      const outputFile = path.join(file.dest, jsFilename);
      if (fs.existsSync(outputFile)) {
        console.log(`✅ ${filename} compiled successfully`);
      } else {
        console.error(`❌ ${filename} compilation failed: Output file not found`);
        return false;
      }
    } catch (error) {
      console.error(`❌ ${filename} compilation failed:`, error.message);
      return false;
    }
  }
  
  // Skip project-wide compilation if manifold-only flag is set
  if (manifoldOnly) {
    console.log(`✅ Compilation completed`);
    return true;
  }
  
  // Then compile the entire src tree for pipeline
  console.log(`Compiling pipeline modules...`);
  const tscPipelineCommand = 
    `npx tsc --project ${projectRoot} --outDir ${pipelineDistDir} --module es2022 --target es2019 ` +
    `--moduleResolution node --lib es2019,dom --skipLibCheck --declaration --noEmit false`;
  
  try {
    const { stdout, stderr } = await execAsync(tscPipelineCommand);
    if (stdout) console.log(stdout);
    if (stderr && !stderr.includes('error')) console.log(stderr); // Only show non-error output
    
    // Check if key files were compiled
    const keyFiles = [
      path.join(pipelineDistDir, 'types/parametric-config.js'),
      path.join(pipelineDistDir, 'models/parametric-hook.js')
    ];
    
    let allExist = true;
    for (const file of keyFiles) {
      if (fs.existsSync(file)) {
        console.log(`✅ ${path.basename(file)} compiled successfully`);
      } else {
        console.error(`❌ ${path.basename(file)} compilation failed: Output file not found`);
        allExist = false;
      }
    }
    
    return allExist;
  } catch (error) {
    console.error(`❌ Pipeline compilation failed:`, error.message);
    if (error.stderr) console.error(error.stderr);
    return false;
  }
}

// Run compilation if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const manifoldOnly = process.argv.includes('--manifold-only');
  const success = await compile(manifoldOnly);
  process.exit(success ? 0 : 1);
}

export default compile;
