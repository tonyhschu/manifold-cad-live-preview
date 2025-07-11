import fs from 'fs';
import path from 'path';
import type { DevCommandOptions } from '../types.js';
import { discoverUserModels, validateModelFiles } from '../model-discovery.js';
import { generatePipelineEntry, validatePipelineEntry } from '../pipeline-generator.js';
import { detectConfiguratorDevelopment } from '../dev-mode-detector.js';

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
    
    // Validate the generated pipeline
    const validation = validatePipelineEntry(pipelineEntry);
    if (!validation.valid) {
      throw new Error(`Pipeline generation failed: ${validation.error}`);
    }
    
    // Step 4: Write pipeline entry to temp directory
    const tempDir = path.join(userProjectPath, 'temp');
    const pipelineEntryPath = path.join(tempDir, 'user-pipeline-entry.ts');
    
    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
      console.log(`📁 Created temp directory: ${tempDir}`);
    }
    
    // Write the pipeline entry
    fs.writeFileSync(pipelineEntryPath, pipelineEntry, 'utf-8');
    console.log(`✅ Pipeline entry written to: ${pipelineEntryPath}`);
    
    // Step 5: Show what we generated (for proof of concept)
    console.log('\n📄 Generated pipeline entry preview:');
    console.log('─'.repeat(50));
    console.log(pipelineEntry.split('\n').slice(0, 20).join('\n'));
    if (pipelineEntry.split('\n').length > 20) {
      console.log('... (truncated)');
    }
    console.log('─'.repeat(50));
    
    // TODO: Step 6: Start pipeline compiler (Vite process)
    console.log('\n🔄 Next steps (not implemented yet):');
    console.log('   - Start pipeline compiler with generated entry');
    console.log('   - Start UI server');
    console.log('   - Set up file watching for model changes');
    
    console.log('\n✅ CLI infrastructure and model discovery working!');
    console.log(`🎯 Found ${validModels.length} models, generated pipeline entry`);
    
  } catch (error) {
    console.error('\n❌ Error starting development server:');
    console.error(error);
    process.exit(1);
  }
}
