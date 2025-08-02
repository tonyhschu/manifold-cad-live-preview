import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'vite';
import chokidar from 'chokidar';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Removed custom file watcher - let Vite handle temp files naturally

/**
 * Find the path to a package from a user project path
 * This handles both monorepo and published package scenarios
 */
function findPackagePath(userProjectPath: string, packageName: string): string {
  // Try monorepo structure first (most common during development)
  const monorepoPath = path.resolve(userProjectPath, `../packages/${packageName}`);
  if (fs.existsSync(monorepoPath)) {
    return monorepoPath;
  }

  // Try node_modules (published packages) - this is the most common case for users
  const nodeModulesPath = path.resolve(userProjectPath, `node_modules/@manifold-studio/${packageName}`);
  if (fs.existsSync(nodeModulesPath)) {
    return nodeModulesPath;
  }

  // Try relative paths as fallback (for unusual project structures)
  const relativePath = path.resolve(userProjectPath, `../../${packageName}`);
  if (fs.existsSync(relativePath)) {
    return relativePath;
  }

  // Fallback to monorepo path (will fail gracefully if it doesn't exist)
  return monorepoPath;
}

export interface TemplateServerOptions {
  userProjectPath: string;
  port: number;
  pipelinePort: number;
  pipelinePath: string;
  manifestPath: string;
  configuratorDevMode: boolean;
  verbose?: boolean;
}

export interface TemplateServerInstance {
  port: number;
  close: () => Promise<void>;
}

/**
 * Create and start the template-serving UI server
 */
export async function createTemplateServer(options: TemplateServerOptions): Promise<TemplateServerInstance> {
  const {
    userProjectPath,
    port,
    pipelinePort,
    pipelinePath,
    manifestPath,
    configuratorDevMode,
    verbose = false
  } = options;



  // Get template directory path
  const templatesDir = path.resolve(__dirname, '../../templates');
  


  // Verify templates exist
  const indexTemplatePath = path.join(templatesDir, 'index.html');
  const mainTemplatePath = path.join(templatesDir, 'main.js');
  
  if (!fs.existsSync(indexTemplatePath) || !fs.existsSync(mainTemplatePath)) {
    throw new Error(`Template files not found in ${templatesDir}`);
  }

  // Generate dynamic Vite config if in dev mode
  let viteConfig: any = {
    root: userProjectPath,
    server: {
      port,
      strictPort: true, // Fail if port is already in use
      fs: {
        allow: ['..', '.'] // Allow serving files from parent directories
      }
      // Note: Removed proxy configuration - temp files are now served directly from filesystem
    },
    publicDir: false, // Don't serve public directory

    // Disable dependency optimization to prevent cache invalidation issues during development
    optimizeDeps: {
      disabled: true
    },

    // Plugins configuration
    plugins: [
      // Let Vite handle file watching naturally - no custom plugins needed
    ],
    // Build configuration
    build: {
      target: 'esnext', // Support top-level await
      outDir: 'dist',
    },
    // Enable top-level await support
    esbuild: {
      target: 'esnext'
    }
  };

  // Add source aliases in configurator dev mode
  if (configuratorDevMode) {
    // Calculate paths relative to user project (like the working V3 config)
    const configuratorSrcPath = path.resolve(userProjectPath, '../packages/configurator/src');
    const wrapperSrcPath = path.resolve(userProjectPath, '../packages/wrapper/src');



    const typefaceSrcPath = path.resolve(userProjectPath, '../packages/typeface/src');

    viteConfig.resolve = {
      alias: {
        '@manifold-studio/configurator': configuratorSrcPath,
        '@manifold-studio/wrapper': wrapperSrcPath,
        '@manifold-studio/typeface': typefaceSrcPath
      }
    };


  }

  // Create Vite server with custom middleware for template serving
  let server;
  try {
    server = await createServer({
      ...viteConfig,
      plugins: [
      {
        name: 'manifold-template-server',
        configureServer(server) {
          // Serve our templates for the root routes
          server.middlewares.use('/', (req, res, next) => {
            // Parse URL to handle query parameters
            const url = new URL(req.url, `http://${req.headers.host}`);
            const pathname = url.pathname;

            if (pathname === '/' || pathname === '/index.html') {
              // Serve processed index.html template for root path (with or without query params)
              const htmlContent = processTemplate(indexTemplatePath, {
                configuratorDevMode,
                pipelinePath,
                manifestPath,
                userProjectPath
              });

              res.setHeader('Content-Type', 'text/html');
              res.end(htmlContent);
              return;
            }
            
            if (req.url === '/main.js') {
              // Process template and let Vite transform it
              const jsContent = processTemplate(mainTemplatePath, {
                configuratorDevMode,
                pipelinePath,
                manifestPath,
                userProjectPath
              });

              // Create a virtual module that Vite can transform
              const virtualId = 'virtual:main-template';

              // Let Vite handle the transformation
              res.setHeader('Content-Type', 'application/javascript');
              res.end(jsContent);
              return;
            }

            if (req.url === '/diagnostic') {
              // Diagnostic endpoint for debugging
              const diagnostic = {
                aliases: viteConfig.resolve?.alias || {},
                configuratorDevMode,
                pipelinePath,
                manifestPath,
                timestamp: new Date().toISOString(),
                templatesDir: path.dirname(indexTemplatePath)
              };

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(diagnostic, null, 2));
              return;
            }

            next();
          });
        }
      }
    ]
  });

    await server.listen();
  } catch (error: any) {
    if (error.code === 'EADDRINUSE' || error.message?.includes('already in use')) {
      const portError = new Error(`Port ${port} is already in use`);
      (portError as any).code = 'EADDRINUSE';
      throw portError;
    }
    throw error;
  }

  const actualPort = server.config.server.port || port;



  return {
    port: actualPort,
    close: async () => {
      await server.close();
    }
  };
}

/**
 * Process template files by replacing placeholders with actual values
 */
function processTemplate(templatePath: string, context: {
  configuratorDevMode: boolean;
  pipelinePath: string;
  manifestPath: string;
  userProjectPath: string;
}): string {
  const template = fs.readFileSync(templatePath, 'utf-8');

  // Define import paths based on dev mode
  const configuratorImport = context.configuratorDevMode
    ? `/@fs${findPackagePath(context.userProjectPath, 'configurator')}/src/index.ts` // Direct file path for dev
    : '@manifold-studio/configurator'; // Package import (when published)

  const wrapperImport = context.configuratorDevMode
    ? `/@fs${findPackagePath(context.userProjectPath, 'wrapper')}/src/index.ts` // Direct file path for dev
    : '@manifold-studio/wrapper'; // Package import (when published)

  // Replace template placeholders
  return template
    .replace(/\{\{CONFIGURATOR_IMPORT\}\}/g, configuratorImport)
    .replace(/\{\{WRAPPER_IMPORT\}\}/g, wrapperImport)
    .replace(/\{\{PIPELINE_PATH\}\}/g, context.pipelinePath)
    .replace(/\{\{MANIFEST_PATH\}\}/g, context.manifestPath);
}
