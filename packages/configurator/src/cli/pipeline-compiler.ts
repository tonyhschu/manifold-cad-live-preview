import { createServer, ViteDevServer, InlineConfig } from 'vite';
import path from 'path';
import fs from 'fs';

export interface PipelineCompilerOptions {
  userProjectPath: string;
  pipelineEntryPath: string;
  port: number;
  verbose?: boolean;
}

export interface PipelineCompilerInstance {
  server: ViteDevServer;
  close: () => Promise<void>;
  restart: () => Promise<void>;
}

/**
 * Creates a Vite dev server specifically for compiling the generated pipeline entry
 * This server compiles user model files into a bundle that can be consumed by the configurator
 */
export async function createPipelineCompiler(options: PipelineCompilerOptions): Promise<PipelineCompilerInstance> {
  const { userProjectPath, pipelineEntryPath, port, verbose } = options;
  
  // Create a temporary Vite config for the pipeline compiler
  const viteConfig: InlineConfig = {
    root: userProjectPath,
    
    // Build configuration for pipeline compilation
    build: {
      lib: {
        entry: pipelineEntryPath,
        name: 'UserPipeline',
        fileName: 'pipeline',
        formats: ['es']
      },
      rollupOptions: {
        external: [
          // External dependencies that should not be bundled
          'manifold-3d',
          '@manifold-studio/wrapper'
        ],
        output: {
          dir: path.join(userProjectPath, 'temp'),
          format: 'es'
        }
      },
      outDir: path.join(userProjectPath, 'temp'),
      target: 'esnext',
      minify: false, // Keep readable for debugging
      sourcemap: true
    },
    
    // Server configuration
    server: {
      port,
      host: 'localhost',
      strictPort: true, // Fail if port is already in use
      open: false, // Don't open browser
      cors: true,
      // Allow serving files from user project and temp directory
      fs: {
        allow: [userProjectPath, path.join(userProjectPath, 'temp')]
      }
    },
    
    // Resolve configuration
    resolve: {
      alias: {
        // Allow relative imports in user model files
        '@': path.join(userProjectPath, 'src'),
      }
    },
    
    // Plugin configuration
    plugins: [
      // Custom plugin to handle pipeline-specific logic
      createPipelineCompilerPlugin({ verbose })
    ],
    
    // Logging
    logLevel: verbose ? 'info' : 'warn',
    
    // Clear screen on rebuild
    clearScreen: false
  };
  
  // Create the Vite dev server
  const server = await createServer(viteConfig);
  
  // Start the server
  await server.listen();
  
  const serverInfo = server.config.logger.info;
  console.log(`🔧 Pipeline compiler running on http://localhost:${port}`);
  
  return {
    server,
    close: async () => {
      await server.close();
      console.log('🔧 Pipeline compiler stopped');
    },
    restart: async () => {
      console.log('🔄 Restarting pipeline compiler...');
      await server.restart();
      console.log('✅ Pipeline compiler restarted');
    }
  };
}

/**
 * Custom Vite plugin for pipeline compiler specific functionality
 */
function createPipelineCompilerPlugin(options: { verbose?: boolean }) {
  return {
    name: 'pipeline-compiler',
    
    configureServer(server: ViteDevServer) {
      if (options.verbose) {
        console.log('🔧 Pipeline compiler plugin configured');
      }
      
      // Add middleware to handle pipeline-specific routes
      server.middlewares.use('/api/pipeline', (req, res, next) => {
        if (req.url === '/health') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok', timestamp: Date.now() }));
          return;
        }
        next();
      });
    },
    
    buildStart() {
      if (options.verbose) {
        console.log('🔧 Pipeline compilation started');
      }
    },
    
    buildEnd() {
      if (options.verbose) {
        console.log('✅ Pipeline compilation completed');
      }
    },
    
    handleHotUpdate(ctx) {
      // Custom HMR handling for pipeline files
      if (ctx.file.includes('user-pipeline-entry.ts')) {
        console.log('🔄 Pipeline entry updated, triggering rebuild...');
        // Let Vite handle the default HMR
        return;
      }
    }
  };
}

/**
 * Validates that the pipeline entry file exists and is readable
 */
export async function validatePipelineEntry(pipelineEntryPath: string): Promise<boolean> {
  try {
    await fs.promises.access(pipelineEntryPath, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}
