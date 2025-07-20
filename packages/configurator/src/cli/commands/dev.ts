import fs from 'fs';
import path from 'path';
import { createServer } from 'net';
import type { DevCommandOptions } from '../types.js';
import { detectConfiguratorDevelopment } from '../dev-mode-detector.js';
// Removed: Pipeline server is no longer needed - template server handles everything
import { createPipelineCompiler, buildPipeline } from '../../pipeline-compiler/index.js';
import { createTemplateServer } from '../template-server.js';

/**
 * Check if a port is available
 */
async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on('error', () => resolve(false));
  });
}

/**
 * Find an available port starting from the given port
 */
async function findAvailablePort(startPort: number, maxAttempts: number = 10): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort} (tried ${maxAttempts} ports)`);
}

/**
 * Handle port conflict errors with helpful messages
 */
function handleServerError(error: any, port: number, serverType: string): never {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${port} is already in use for ${serverType}`);
    console.error(`\n💡 Solutions:`);
    console.error(`   1. Stop the process using port ${port}`);
    console.error(`   2. Use a different port: manifold-studio dev --${serverType === 'UI server' ? 'port' : 'pipeline-port'} ${port + 1}`);
    console.error(`   3. Find what's using the port: lsof -ti:${port}`);
    process.exit(1);
  }

  if (error.code === 'EACCES') {
    console.error(`\n❌ Permission denied for ${serverType} on port ${port}`);
    console.error(`\n💡 Solutions:`);
    console.error(`   1. Use a port above 1024: manifold-studio dev --${serverType === 'UI server' ? 'port' : 'pipeline-port'} ${port < 1024 ? 3000 + Math.floor(Math.random() * 1000) : port + 1}`);
    console.error(`   2. Run with elevated permissions (not recommended): sudo manifold-studio dev`);
    console.error(`   3. Check your system's port restrictions`);
    process.exit(1);
  }

  if (error.code === 'EADDRNOTAVAIL') {
    console.error(`\n❌ Network address not available for ${serverType}`);
    console.error(`\n💡 Solutions:`);
    console.error(`   1. Check your network configuration`);
    console.error(`   2. Try using localhost explicitly: modify server config to bind to 127.0.0.1`);
    console.error(`   3. Check if your network interface is up`);
    process.exit(1);
  }

  if (error.code === 'EMFILE' || error.code === 'ENFILE') {
    console.error(`\n❌ Too many open files for ${serverType}`);
    console.error(`\n💡 Solutions:`);
    console.error(`   1. Close other applications to free up file descriptors`);
    console.error(`   2. Increase system limits: ulimit -n 4096`);
    console.error(`   3. Restart your terminal/IDE`);
    process.exit(1);
  }

  // Generic server startup error
  console.error(`\n❌ Failed to start ${serverType} on port ${port}`);
  console.error(`\n🔍 Error details: ${error.message}`);
  if (error.code) {
    console.error(`📋 Error code: ${error.code}`);
  }
  console.error(`\n💡 Try:`);
  console.error(`   1. Use a different port: manifold-studio dev --${serverType === 'UI server' ? 'port' : 'pipeline-port'} ${port + 1}`);
  console.error(`   2. Check system resources and network configuration`);
  console.error(`   3. Restart your development environment`);
  process.exit(1);
}

/**
 * Validate CLI arguments and provide helpful error messages
 */
function validateCliArguments(options: DevCommandOptions): void {
  // Validate port numbers
  const uiPort = parseInt(options.port);
  // Removed: pipelinePort validation no longer needed

  if (isNaN(uiPort) || uiPort < 1 || uiPort > 65535) {
    console.error(`\n❌ Invalid UI server port: ${options.port}`);
    console.error(`\n💡 Port must be a number between 1 and 65535`);
    console.error(`   Example: manifold-studio dev --port 3000`);
    process.exit(1);
  }

  // Removed: Pipeline port validation no longer needed

  // Validate port ranges (warn about privileged ports)
  if (uiPort < 1024) {
    console.warn(`\n⚠️  Warning: UI server port ${uiPort} is a privileged port (< 1024)`);
    console.warn(`   You may need elevated permissions or encounter EACCES errors`);
    console.warn(`   Consider using a port >= 1024 (e.g., 3000)`);
  }

  // Removed: Pipeline port warning no longer needed
}

/**
 * Main dev command implementation
 * This is the entry point for `manifold-studio dev`
 */
export async function devCommand(options: DevCommandOptions) {
  console.log('🚀 Starting Manifold Studio development server...');

  // Validate CLI arguments first
  validateCliArguments(options);

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
    
    // Step 2: Run pipeline compiler to handle everything
    console.log('\n🔨 Running pipeline compiler...');
    const tempDir = path.join(userProjectPath, 'temp');
    const pipelineEntryPath = path.join(tempDir, 'user-pipeline-entry.ts');
    const manifestPath = path.join(tempDir, 'manifest.json');

    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
      console.log(`📁 Created temp directory: ${tempDir}`);
    }

    let modelCount = 0;
    let realPipelineCompiler: any;
    try {
      realPipelineCompiler = createPipelineCompiler(userProjectPath, tempDir);
      const compilationResult = await realPipelineCompiler.compile();
      modelCount = compilationResult.modelCount;
      console.log(`✅ Pipeline compiler generated manifest with ${modelCount} model(s)`);
    } catch (error) {
      console.error('❌ Pipeline compiler failed:', error);
      throw new Error(`Pipeline compilation failed: ${error}`);
    }

    // Step 3: Show what we generated (for proof of concept)
    if (options.verbose) {
      console.log('\n📄 Generated files:');
      console.log('─'.repeat(50));
      console.log(`✅ Pipeline: ${tempDir}/pipeline.js`);
      console.log(`✅ Manifest: ${tempDir}/manifest.json`);
      console.log(`✅ User Pipeline Entry: ${tempDir}/user-pipeline-entry.ts`);
      console.log('─'.repeat(50));
    }

    // Step 7: Pipeline server removed - template server handles everything directly

    // Step 8: Set up file watching using pipeline compiler
    console.log('\n👁️  Setting up file watcher...');
    realPipelineCompiler.startWatching(async (result) => {
      console.log(`🔄 Pipeline updated: ${result.modelCount} model(s) compiled in ${result.compilation?.duration}ms`);
      if (result.errors.length > 0) {
        console.error('❌ Compilation errors:', result.errors);
      }
      // No need to restart pipeline server - template server watches files directly
    });

    // Step 9: Start UI server with template serving
    console.log('\n🌐 Starting UI server...');
    const uiPort = parseInt(options.port);

    let templateServer;
    try {
      templateServer = await createTemplateServer({
        userProjectPath,
        port: uiPort,
        pipelinePort: 0, // No longer used - keeping for interface compatibility
        pipelinePath: '/temp/pipeline.js',
        manifestPath: '/temp/manifest.json',
        configuratorDevMode,
        verbose: options.verbose
      });
    } catch (error: any) {
      handleServerError(error, uiPort, 'UI server');
    }

    console.log('\n✅ Development server started!');
    console.log(`🎯 Watching ${modelCount} models for changes`);
    console.log('📡 File watcher active - add/remove/edit model files to see updates');
    console.log(`\n🌐 UI Server: http://localhost:${templateServer.port}`);

    // Keep the process running
    console.log('\n⏳ Press Ctrl+C to stop...');

    // Handle graceful shutdown with error handling and timeout
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🛑 Shutting down (${signal})...`);

      // Set a timeout to force exit if shutdown takes too long
      const shutdownTimeout = setTimeout(() => {
        console.error('\n⏰ Shutdown timeout reached, forcing exit...');
        process.exit(1);
      }, 10000); // 10 second timeout

      const shutdownTasks = [
        { name: 'Pipeline compiler file watcher', task: () => realPipelineCompiler.stopWatching() },
        { name: 'Template server', task: () => templateServer.close() }
      ];

      let hasErrors = false;

      for (const { name, task } of shutdownTasks) {
        try {
          await Promise.race([
            task(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Timeout')), 3000)
            )
          ]);
          if (options.verbose) {
            console.log(`✅ ${name} closed successfully`);
          }
        } catch (error) {
          console.error(`❌ Error closing ${name.toLowerCase()}:`, error);
          hasErrors = true;
        }
      }

      clearTimeout(shutdownTimeout);

      if (hasErrors) {
        console.log('⚠️  Some components had errors during shutdown, but process will exit');
      } else if (options.verbose) {
        console.log('✅ All components shut down cleanly');
      }

      process.exit(hasErrors ? 1 : 0);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    // Keep process alive
    await new Promise(() => {}); // Infinite promise
    
  } catch (error) {
    console.error('\n❌ Error starting development server:');
    console.error(error);
    process.exit(1);
  }
}
