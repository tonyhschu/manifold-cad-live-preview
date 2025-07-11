import fs from 'fs';
import path from 'path';
import type { DevCommandOptions } from '../types.js';
import { discoverUserModels, validateModelFiles } from '../model-discovery.js';
import { generatePipelineEntry, validatePipelineEntry, generateManifest } from '../pipeline-generator.js';
import { detectConfiguratorDevelopment } from '../dev-mode-detector.js';
import { createFileWatcher } from '../file-watcher.js';
import { createPipelineCompiler, validatePipelineEntry as validatePipelineFile } from '../pipeline-compiler.js';
import { createTemplateServer } from '../template-server.js';

/**
 * Main dev command implementation
 * This is the entry point for `manifold-dev dev`
 */
export async function devCommand(options: DevCommandOptions) {
  console.log('🚀 Starting Manifold Studio development server...');
  
  if (options.verbose) {
    console.log('Options:', options);
  }
  
  try {
    const userProjectPath = process.cwd();
    console.log(`📁 Project path: ${userProjectPath}`);
    
    // Step 1: Detect development mode
    const isDevelopment = await detectConfiguratorDevelopment(userProjectPath);
    const configuratorDevMode = options.configuratorDevMode || isDevelopment;

    if (configuratorDevMode) {
      console.log('🔧 Configurator development mode enabled');
    }
    
    // Step 2: Discover user models
    console.log('\n🔍 Discovering models...');
    const discoveredModels = await discoverUserModels(userProjectPath);
    const validModels = await validateModelFiles(discoveredModels);
    
    if (validModels.length === 0) {
      console.warn('⚠️  No valid models found. Make sure you have:');
      console.warn('   - main.ts or main.js in project root');
      console.warn('   - or .ts/.js files in components/ directory');
      console.warn('\nContinuing anyway...');
    }
    
    // Step 3: Generate pipeline entry
    console.log('\n⚙️  Generating pipeline entry...');
    const pipelineEntry = generatePipelineEntry(validModels);

    if (options.verbose) {
      console.log('Generated pipeline entry length:', pipelineEntry.length);
      console.log('First 200 chars:', pipelineEntry.substring(0, 200));
    }

    // Validate the generated pipeline
    const validation = validatePipelineEntry(pipelineEntry);
    if (!validation.valid) {
      console.error('Pipeline validation failed:', validation);
      console.error('Generated pipeline:', pipelineEntry);
      throw new Error(`Pipeline generation failed: ${validation.error}`);
    }
    
    // Step 4: Write pipeline entry to temp directory
    const tempDir = path.join(userProjectPath, 'temp');
    const pipelineEntryPath = path.join(tempDir, 'user-pipeline-entry.ts');
    const manifestPath = path.join(tempDir, 'manifest.json');
    
    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
      console.log(`📁 Created temp directory: ${tempDir}`);
    }
    
    // Write the pipeline entry
    fs.writeFileSync(pipelineEntryPath, pipelineEntry, 'utf-8');
    console.log(`✅ Pipeline entry written to: ${pipelineEntryPath}`);

    // Generate and write manifest
    const manifestContent = generateManifest(validModels);
    fs.writeFileSync(manifestPath, manifestContent, 'utf-8');
    console.log(`✅ Manifest written to: ${manifestPath}`);
    
    // Step 5: Show what we generated (for proof of concept)
    if (options.verbose) {
      console.log('\n📄 Generated pipeline entry preview:');
      console.log('─'.repeat(50));
      console.log(pipelineEntry.split('\n').slice(0, 20).join('\n'));
      if (pipelineEntry.split('\n').length > 20) {
        console.log('... (truncated)');
      }
      console.log('─'.repeat(50));
    }

    // Step 6: Start pipeline compiler (Vite process)
    console.log('\n🔄 Starting pipeline compiler...');
    const pipelineCompiler = await createPipelineCompiler({
      userProjectPath,
      pipelineEntryPath,
      port: parseInt(options.pipelinePort),
      verbose: options.verbose
    });

    // Step 7: Set up file watching for model changes
    console.log('\n👁️  Setting up file watcher...');
    const fileWatcher = createFileWatcher({
      userProjectPath,
      pipelineEntryPath,
      manifestPath,
      onPipelineRegenerated: async (models) => {
        console.log(`🔄 Pipeline regenerated with ${models.length} model(s)`);
        // Trigger pipeline compiler rebuild
        await pipelineCompiler.restart();
      },
      verbose: options.verbose
    });

    // Step 8: Start UI server with template serving
    console.log('\n🌐 Starting UI server...');
    const templateServer = await createTemplateServer({
      userProjectPath,
      port: parseInt(options.port),
      pipelinePath: '/temp/pipeline.js',
      manifestPath: '/temp/manifest.json',
      configuratorDevMode,
      verbose: options.verbose
    });

    console.log('\n✅ Development servers started!');
    console.log(`🎯 Watching ${validModels.length} models for changes`);
    console.log('📡 File watcher active - add/remove/edit model files to see updates');
    console.log(`\n🌐 UI Server: http://localhost:${templateServer.port}`);
    console.log(`⚙️  Pipeline Server: http://localhost:${parseInt(options.pipelinePort)}`);

    // Keep the process running
    console.log('\n⏳ Press Ctrl+C to stop...');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down...');
      await fileWatcher.close();
      await pipelineCompiler.close();
      await templateServer.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Shutting down...');
      await fileWatcher.close();
      await pipelineCompiler.close();
      await templateServer.close();
      process.exit(0);
    });

    // Keep process alive
    await new Promise(() => {}); // Infinite promise
    
  } catch (error) {
    console.error('\n❌ Error starting development server:');
    console.error(error);
    process.exit(1);
  }
}
