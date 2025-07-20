#!/usr/bin/env node
/**
 * Pipeline Compiler CLI
 * 
 * Command-line interface for testing the pipeline compiler.
 */

import { createPipelineCompiler } from './index.js';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'build';
  const rootDir = args[1] || process.cwd();

  console.log('🚀 Pipeline Compiler CLI');

  const compiler = createPipelineCompiler(rootDir);

  switch (command) {
    case 'build':
      const result = await compiler.compile();
      
      if (result.errors.length > 0) {
        console.error('❌ Compilation errors:');
        result.errors.forEach(error => console.error(`  - ${error}`));
        process.exit(1);
      }
      
      if (result.warnings.length > 0) {
        console.warn('⚠️ Compilation warnings:');
        result.warnings.forEach(warning => console.warn(`  - ${warning}`));
      }
      
      console.log(`✅ Pipeline compiled successfully!`);
      break;

    case 'watch':
      console.log('👀 Starting watch mode...');

      // Initial build
      await compiler.compile();

      // Start watching
      compiler.startWatching((result) => {
        if (result.errors.length > 0) {
          console.error('❌ Compilation errors:');
          result.errors.forEach(error => console.error(`  - ${error}`));
        } else {
          console.log(`✅ Pipeline updated!`);
        }
      });

      // Keep process alive
      console.log('Press Ctrl+C to stop watching...');
      process.on('SIGINT', () => {
        console.log('\n🛑 Stopping watcher...');
        compiler.stopWatching();
        process.exit(0);
      });
      break;

    default:
      console.error(`❌ Unknown command: ${command}`);
      console.log('Available commands:');
      console.log('  build [rootDir] - Build pipeline once');
      console.log('  watch [rootDir] - Build and watch for changes');
      process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}
