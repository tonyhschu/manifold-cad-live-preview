/**
 * Vite Plugin: Pipeline HMR
 * 
 * Watches temp/pipeline.js for changes and triggers custom HMR events
 * for targeted model viewer updates without full page reloads.
 */

import { Plugin } from 'vite';
import path from 'path';

interface PipelineHMROptions {
  /** Files to watch for pipeline changes */
  watchFiles?: string[];
}

export function pipelineHMR(options: PipelineHMROptions = {}): Plugin {
  const {
    watchFiles = ['temp/pipeline.js', 'temp/manifest.json']
  } = options;

  let server: any;

  return {
    name: 'pipeline-hmr',
    
    configureServer(viteServer) {
      server = viteServer;

      console.log(`🔍 Pipeline HMR: Intercepting Vite events for ${watchFiles.join(', ')}`);

      // Intercept Vite's HMR to prevent page reloads for temp files and send custom events
      const originalSend = server.ws.send;
      server.ws.send = function(payload: any) {
        // Check if this is a reload for our watched files
        if (payload.type === 'full-reload') {
          // Check if any of our watched files triggered this reload
          const isPipelineFile = watchFiles.some(file =>
            payload.path?.includes(file) ||
            server.moduleGraph?.fileToModulesMap?.has(path.resolve(file))
          );

          if (isPipelineFile) {
            console.log('🚫 Pipeline HMR: Blocked Vite reload for pipeline file');
            console.log('📡 Pipeline HMR: Sending custom pipeline event instead');

            // Send our custom event instead
            handlePipelineChange(payload.path || 'temp/pipeline.js');
            return; // Block the original reload
          }
        }

        return originalSend.call(this, payload);
      };
    },

    buildEnd() {
      // No cleanup needed for Vite-based approach
      console.log('🧹 Pipeline HMR: Plugin cleaned up');
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
