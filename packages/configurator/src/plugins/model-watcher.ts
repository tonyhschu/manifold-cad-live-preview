/**
 * Model Watcher Plugin for Vite
 * 
 * Watches model files and manages temp folder compilation pipeline
 */

import type { Plugin } from 'vite';
import chokidar from 'chokidar';
import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';

interface ModelWatcherOptions {
  modelDir: string;
  tempDir: string;
  debounceMs?: number;
}

interface ModelManifest {
  models: Array<{
    id: string;
    name: string;
    type: 'static' | 'parametric';
    filePath: string;
    blobPath?: string;
    lastUpdated: string;
    status: 'pending' | 'compiled' | 'error';
    error?: string;
  }>;
  lastBuild: string;
  buildCount: number;
}

export function modelWatcherPlugin(options: ModelWatcherOptions): Plugin {
  const { modelDir, tempDir, debounceMs = 300 } = options;
  let watcher: chokidar.FSWatcher | null = null;
  let debounceTimer: NodeJS.Timeout | null = null;
  let buildCount = 0;

  // Console logging utilities
  const log = {
    info: (msg: string, ...args: any[]) => console.log(`🔍 [ModelWatcher] ${msg}`, ...args),
    success: (msg: string, ...args: any[]) => console.log(`✅ [ModelWatcher] ${msg}`, ...args),
    warn: (msg: string, ...args: any[]) => console.log(`⚠️  [ModelWatcher] ${msg}`, ...args),
    error: (msg: string, ...args: any[]) => console.log(`❌ [ModelWatcher] ${msg}`, ...args),
    debug: (msg: string, ...args: any[]) => console.log(`🐛 [ModelWatcher] ${msg}`, ...args),
    separator: () => console.log(`📋 [ModelWatcher] ${'='.repeat(60)}`),
  };

  return {
    name: 'model-watcher',
    
    async buildStart() {
      log.separator();
      log.info('🚀 Starting Model Watcher Plugin');
      log.info(`📁 Model Directory: ${modelDir}`);
      log.info(`📁 Temp Directory: ${tempDir}`);
      log.info(`⏱️  Debounce: ${debounceMs}ms`);
      
      // Initialize temp folder structure
      await initializeTempFolder();
      
      // Discover initial models
      await discoverAndUpdateModels();
      
      // Start file watcher
      await startFileWatcher();
      
      log.success('✨ Model Watcher Plugin initialized');
      log.separator();
    },

    async buildEnd() {
      if (watcher) {
        log.info('🛑 Stopping file watcher...');
        await watcher.close();
        watcher = null;
        log.success('File watcher stopped');
      }
    }
  };

  async function initializeTempFolder(): Promise<void> {
    log.info('📁 Initializing temp folder structure...');
    
    try {
      // Create temp directories
      await fs.mkdir(path.join(tempDir, 'blobs'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'logs'), { recursive: true });
      
      log.success(`Created temp directories at: ${tempDir}`);
      
      // Create initial manifest
      const initialManifest: ModelManifest = {
        models: [],
        lastBuild: new Date().toISOString(),
        buildCount: 0
      };
      
      await writeManifest(initialManifest);
      log.success('Created initial manifest.json');
      
    } catch (error) {
      log.error('Failed to initialize temp folder:', error);
      throw error;
    }
  }

  async function discoverAndUpdateModels(): Promise<void> {
    log.info('🔍 Discovering model files...');
    
    try {
      // Find all model files
      const pattern = path.join(modelDir, '**/*.{ts,js}').replace(/\\/g, '/');
      log.debug(`Glob pattern: ${pattern}`);
      
      const files = await glob(pattern, { 
        ignore: ['**/node_modules/**', '**/dist/**'],
        absolute: false 
      });
      
      log.info(`📄 Found ${files.length} model files:`);
      files.forEach((file, index) => {
        log.info(`  ${index + 1}. ${file}`);
      });
      
      // Convert to model entries
      const models = files.map(filePath => {
        const id = filePathToModelId(filePath);
        const name = modelIdToDisplayName(id);
        
        return {
          id,
          name,
          type: 'static' as const, // We'll detect this later
          filePath,
          lastUpdated: new Date().toISOString(),
          status: 'pending' as const
        };
      });
      
      // Update manifest
      const manifest: ModelManifest = {
        models,
        lastBuild: new Date().toISOString(),
        buildCount: ++buildCount
      };
      
      await writeManifest(manifest);
      log.success(`📋 Updated manifest with ${models.length} models`);
      
    } catch (error) {
      log.error('Failed to discover models:', error);
      throw error;
    }
  }

  async function startFileWatcher(): Promise<void> {
    log.info('👀 Starting file watcher...');
    
    const watchPattern = path.join(modelDir, '**/*.{ts,js}');
    log.debug(`Watch pattern: ${watchPattern}`);
    
    watcher = chokidar.watch(watchPattern, {
      ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
      persistent: true,
      ignoreInitial: true // Don't trigger on startup
    });

    watcher.on('ready', () => {
      log.success('👀 File watcher ready');
      const watchedPaths = watcher!.getWatched();
      const watchedCount = Object.values(watchedPaths).flat().length;
      log.info(`📁 Watching ${watchedCount} files for changes`);
    });

    watcher.on('add', (filePath) => {
      log.info(`➕ File added: ${filePath}`);
      debouncedModelUpdate('add', filePath);
    });

    watcher.on('change', (filePath) => {
      log.info(`📝 File changed: ${filePath}`);
      debouncedModelUpdate('change', filePath);
    });

    watcher.on('unlink', (filePath) => {
      log.info(`➖ File removed: ${filePath}`);
      debouncedModelUpdate('remove', filePath);
    });

    watcher.on('error', (error) => {
      log.error('File watcher error:', error);
    });
  }

  function debouncedModelUpdate(event: string, filePath: string): void {
    log.debug(`🕐 Debouncing ${event} event for: ${filePath}`);
    
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      log.debug('⏱️  Cleared previous debounce timer');
    }

    debounceTimer = setTimeout(async () => {
      log.info(`🔄 Processing debounced ${event} event for: ${filePath}`);
      
      try {
        await discoverAndUpdateModels();
        log.success(`✨ Model update complete for ${event}: ${filePath}`);
      } catch (error) {
        log.error(`Failed to process ${event} event:`, error);
      }
      
      debounceTimer = null;
    }, debounceMs);
    
    log.debug(`⏱️  Set debounce timer for ${debounceMs}ms`);
  }

  async function writeManifest(manifest: ModelManifest): Promise<void> {
    const manifestPath = path.join(tempDir, 'manifest.json');
    
    try {
      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
      log.debug(`📄 Wrote manifest to: ${manifestPath}`);
      log.debug(`📊 Manifest stats: ${manifest.models.length} models, build #${manifest.buildCount}`);
    } catch (error) {
      log.error('Failed to write manifest:', error);
      throw error;
    }
  }

  function filePathToModelId(filePath: string): string {
    // Convert file path to model ID
    // e.g., "components/chassis copy.ts" -> "components/chassis-copy"
    return filePath
      .replace(/\.(ts|js)$/, '')
      .replace(/\s+/g, '-')
      .toLowerCase();
  }

  function modelIdToDisplayName(id: string): string {
    // Convert model ID to display name
    // e.g., "components/chassis-copy" -> "Components / Chassis Copy"
    return id
      .split('/')
      .map(part => part.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
      .join(' / ');
  }
}
