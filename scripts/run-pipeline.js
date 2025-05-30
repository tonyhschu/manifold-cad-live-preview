#!/usr/bin/env node
// scripts/run-pipeline.js
// Bootstrap script that compiles and runs pipeline.ts using Vite

import { build } from 'vite';
import { resolve, dirname } from 'path';
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function compilePipelineScript() {
  console.log('Compiling pipeline.ts...');

  const tempDir = 'temp/scripts';

  // Ensure temp directory exists
  if (!existsSync(tempDir)) {
    await mkdir(tempDir, { recursive: true });
  }

  await build({
    configFile: false,
    build: {
      target: 'node18',
      lib: {
        entry: resolve(__dirname, 'pipeline.ts'),
        name: 'Pipeline',
        fileName: 'pipeline',
        formats: ['es']
      },
      outDir: tempDir,
      rollupOptions: {
        external: [
          'vite',
          'path',
          'fs/promises',
          'fs',
          'util',
          'url'
        ]
      }
    },
    logLevel: 'warn' // Reduce build noise
  });

  return resolve(tempDir, 'pipeline.js');
}

async function runCompiledPipeline(compiledPath) {
  // Import and run the compiled pipeline
  const { main } = await import(`file://${compiledPath}`);
  await main();
}

async function main() {
  try {
    // Compile the TypeScript pipeline script
    const compiledPath = await compilePipelineScript();

    // Run the compiled pipeline
    await runCompiledPipeline(compiledPath);

  } catch (error) {
    console.error('❌ Pipeline compilation or execution failed:', error.message);
    process.exit(1);
  }
}

main();
