// Example Vite plugin for watching temp files and triggering HMR
import { watch } from 'chokidar';
import path from 'path';

export function tempFileWatchPlugin(userProjectPath) {
  let server;
  
  return {
    name: 'temp-file-watch',
    configureServer(viteServer) {
      server = viteServer;
      
      // Watch temp directory for changes
      const tempDir = path.join(userProjectPath, 'temp');
      const watcher = watch([
        path.join(tempDir, 'pipeline.js'),
        path.join(tempDir, 'manifest.json')
      ], {
        ignoreInitial: true
      });
      
      watcher.on('change', (filePath) => {
        console.log(`🔄 Temp file changed: ${path.basename(filePath)}`);
        
        // Send HMR update to browser
        server.ws.send({
          type: 'full-reload'
        });
      });
      
      // Cleanup on server close
      server.httpServer?.on('close', () => {
        watcher.close();
      });
    }
  };
}

// Alternative: More sophisticated HMR
export function smartTempFileWatchPlugin(userProjectPath) {
  let server;
  
  return {
    name: 'smart-temp-file-watch',
    configureServer(viteServer) {
      server = viteServer;
      
      const tempDir = path.join(userProjectPath, 'temp');
      const watcher = watch([
        path.join(tempDir, 'pipeline.js'),
        path.join(tempDir, 'manifest.json')
      ], {
        ignoreInitial: true
      });
      
      watcher.on('change', (filePath) => {
        const fileName = path.basename(filePath);
        console.log(`🔄 ${fileName} updated, sending HMR event...`);
        
        if (fileName === 'pipeline.js') {
          // Send custom HMR event for pipeline updates
          server.ws.send({
            type: 'custom',
            event: 'pipeline-updated',
            data: { timestamp: Date.now() }
          });
        } else if (fileName === 'manifest.json') {
          // Send custom HMR event for manifest updates
          server.ws.send({
            type: 'custom', 
            event: 'manifest-updated',
            data: { timestamp: Date.now() }
          });
        }
      });
      
      server.httpServer?.on('close', () => {
        watcher.close();
      });
    }
  };
}
