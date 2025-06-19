/**
 * Vite Plugin: Pipeline HMR
 * 
 * Watches temp/pipeline.js for changes and triggers custom HMR events
 * for targeted model viewer updates without full page reloads.
 */

import { Plugin } from 'vite';
import { watch } from 'chokidar';
import path from 'path';

interface PipelineHMROptions {
  /** Directory to watch for pipeline changes */
  watchDir?: string;
  /** Files to watch within the directory */
  watchFiles?: string[];
  /** Debounce delay in milliseconds */
  debounceMs?: number;
}

export function pipelineHMR(options: PipelineHMROptions = {}): Plugin {
  const {
    watchDir = 'temp',
    watchFiles = ['pipeline.js', 'manifest.json'],
    debounceMs = 100
  } = options;

  let server: any;
  let watcher: any;
  let debounceTimer: NodeJS.Timeout | null = null;

  return {
    name: 'pipeline-hmr',
    
    configureServer(viteServer) {
      server = viteServer;
      
      // Set up file watcher when server starts
      const watchPaths = watchFiles.map(file => path.join(watchDir, file));
      
      console.log(`🔍 Pipeline HMR: Watching ${watchPaths.join(', ')}`);
      
      watcher = watch(watchPaths, {
        ignored: /node_modules/,
        persistent: true,
        ignoreInitial: true
      });

      watcher.on('change', (filePath: string) => {
        console.log(`🔄 Pipeline HMR: File changed - ${filePath}`);
        
        // Debounce multiple rapid changes
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        
        debounceTimer = setTimeout(() => {
          handlePipelineChange(filePath);
        }, debounceMs);
      });

      watcher.on('error', (error: Error) => {
        console.error('❌ Pipeline HMR: Watcher error:', error);
      });
    },

    buildEnd() {
      // Clean up watcher when build ends
      if (watcher) {
        watcher.close();
        console.log('🧹 Pipeline HMR: Watcher closed');
      }
    }
  };

  function handlePipelineChange(filePath: string) {
    if (!server) {
      console.warn('⚠️ Pipeline HMR: Server not available');
      return;
    }

    const fileName = path.basename(filePath);
    console.log(`📡 Pipeline HMR: Broadcasting ${fileName} change`);

    // Send custom HMR event to all connected clients
    server.ws.send({
      type: 'custom',
      event: 'pipeline:updated',
      data: {
        file: fileName,
        path: filePath,
        timestamp: Date.now()
      }
    });

    // Also send a more specific event based on file type
    if (fileName === 'pipeline.js') {
      server.ws.send({
        type: 'custom',
        event: 'pipeline:code-updated',
        data: {
          timestamp: Date.now()
        }
      });
    } else if (fileName === 'manifest.json') {
      server.ws.send({
        type: 'custom',
        event: 'pipeline:manifest-updated',
        data: {
          timestamp: Date.now()
        }
      });
    }
  }
}
