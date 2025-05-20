/**
 * Simple script to compile just the lib files for testing
 */
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, '../dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Create lib directory if it doesn't exist
const libDir = path.join(distDir, 'lib');
if (!fs.existsSync(libDir)) {
  fs.mkdirSync(libDir, { recursive: true });
}

// Command to compile just the manifold.ts file
const command = 'npx tsc --skipLibCheck src/lib/manifold.ts --outDir dist/lib --module es2020 --target es2020 --moduleResolution node';

console.log('Compiling lib files...');
exec(command, { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
  if (error) {
    console.error(`Compilation error: ${error}`);
    console.error(stderr);
    process.exit(1);
  }
  
  console.log(stdout || 'Compilation completed successfully');
});