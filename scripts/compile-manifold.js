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

// Source file path
const srcFile = path.join(srcDir, 'manifold.ts');

// Ensure source file exists
if (!fs.existsSync(srcFile)) {
  console.error(`Error: Source file not found: ${srcFile}`);
  process.exit(1);
}

// TypeScript compilation command
// Using proper settings for top-level await and ES2019 features
const tscCommand = 
  `npx tsc ${srcFile} --outDir ${distDir} --module es2022 --target es2019 ` +
  `--moduleResolution node --lib es2019,dom --skipLibCheck`;

async function compile() {
  console.log(`Compiling manifold.ts to JavaScript...`);
  console.log(`Source: ${srcFile}`);
  console.log(`Destination: ${distDir}/manifold.js`);
  
  try {
    const { stdout, stderr } = await execAsync(tscCommand);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    // Check if compilation was successful
    const outputFile = path.join(distDir, 'manifold.js');
    if (fs.existsSync(outputFile)) {
      console.log('✅ Compilation successful');
      return true;
    } else {
      console.error('❌ Compilation failed: Output file not found');
      return false;
    }
  } catch (error) {
    console.error('❌ Compilation failed:', error.message);
    if (error.stderr) console.error(error.stderr);
    return false;
  }
}

// Run compilation if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const success = await compile();
  process.exit(success ? 0 : 1);
}

export default compile;