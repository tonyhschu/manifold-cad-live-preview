import chokidar from 'chokidar';
import fs from 'fs';
import path from 'path';
import type { ModelFile } from './types.js';
import { discoverUserModels, validateModelFiles } from './model-discovery.js';
import { generatePipelineEntry, validatePipelineEntry, generateManifest } from './pipeline-generator.js';

export interface FileWatcherOptions {
  userProjectPath: string;
  pipelineEntryPath: string;
  manifestPath?: string;
  onPipelineRegenerated?: (models: ModelFile[]) => void;
  verbose?: boolean;
}

export interface FileWatcherInstance {
  close: () => Promise<void>;
  regeneratePipeline: () => Promise<void>;
}

/**
 * Creates a file watcher that monitors model files and regenerates pipeline entries
 * Leverages chokidar for efficient file watching and integrates with Vite HMR
 */
export function createFileWatcher(options: FileWatcherOptions): FileWatcherInstance {
  const { userProjectPath, pipelineEntryPath, manifestPath, onPipelineRegenerated, verbose } = options;
  
  // Watch patterns for model files
  const watchPatterns = [
    path.join(userProjectPath, 'main.{ts,js}'),
    path.join(userProjectPath, 'components/**/*.{ts,js}')
  ];
  
  if (verbose) {
    console.log('👁️  Setting up file watcher for patterns:', watchPatterns);
  }
  
  // Create chokidar watcher
  const watcher = chokidar.watch(watchPatterns, {
    ignored: [
      '**/node_modules/**',
      '**/dist/**',
      '**/temp/**',
      '**/.git/**'
    ],
    persistent: true,
    ignoreInitial: true, // Don't trigger on startup
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50
    }
  });
  
  // Debounce regeneration to avoid excessive rebuilds
  let regenerationTimeout: NodeJS.Timeout | null = null;
  
  const debouncedRegenerate = () => {
    if (regenerationTimeout) {
      clearTimeout(regenerationTimeout);
    }
    
    regenerationTimeout = setTimeout(async () => {
      await regeneratePipeline();
    }, 200); // 200ms debounce
  };
  
  // Set up event handlers
  watcher
    .on('add', (filePath) => {
      console.log(`📁 Model file added: ${path.relative(userProjectPath, filePath)}`);
      debouncedRegenerate();
    })
    .on('change', (filePath) => {
      if (verbose) {
        console.log(`📝 Model file changed: ${path.relative(userProjectPath, filePath)}`);
      }
      debouncedRegenerate();
    })
    .on('unlink', (filePath) => {
      console.log(`🗑️  Model file removed: ${path.relative(userProjectPath, filePath)}`);
      debouncedRegenerate();
    })
    .on('error', (error) => {
      console.error('❌ File watcher error:', error);
    })
    .on('ready', () => {
      console.log('👁️  File watcher ready, monitoring model files...');
    });
  
  /**
   * Regenerates the pipeline entry based on current model files
   */
  async function regeneratePipeline(): Promise<void> {
    try {
      if (verbose) {
        console.log('🔄 Regenerating pipeline entry...');
      }
      
      // Discover current models
      const discoveredModels = await discoverUserModels(userProjectPath);
      const validModels = await validateModelFiles(discoveredModels);
      
      // Generate new pipeline entry
      const pipelineEntry = generatePipelineEntry(validModels);
      
      // Validate the generated pipeline
      const validation = validatePipelineEntry(pipelineEntry);
      if (!validation.valid) {
        throw new Error(`Pipeline generation failed: ${validation.error}`);
      }
      
      // Write the updated pipeline entry
      const tempDir = path.dirname(pipelineEntryPath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      fs.writeFileSync(pipelineEntryPath, pipelineEntry, 'utf-8');

      // Note: Manifest generation is handled by the pipeline compiler
      // The pipeline compiler will regenerate temp/manifest.json with rich metadata

      console.log(`✅ Pipeline entry regenerated with ${validModels.length} model(s)`);
      
      // Notify callback if provided
      if (onPipelineRegenerated) {
        onPipelineRegenerated(validModels);
      }
      
    } catch (error) {
      console.error('❌ Error regenerating pipeline:', error);
    }
  }
  
  return {
    close: async () => {
      if (regenerationTimeout) {
        clearTimeout(regenerationTimeout);
      }
      await watcher.close();
      console.log('👁️  File watcher closed');
    },
    regeneratePipeline
  };
}
