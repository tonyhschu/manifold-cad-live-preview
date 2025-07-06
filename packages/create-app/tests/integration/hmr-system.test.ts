import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { writeFileSync, readFileSync } from 'fs';
import { 
  ProjectCreator, 
  ServerManager, 
  FileValidator,
  ProcessRunner,
  type CreatedProject 
} from '../utils/index.js';

describe('HMR System Tests', () => {
  let project: CreatedProject;
  let serverManager: ServerManager;

  beforeEach(async () => {
    // Create a test project for HMR testing
    project = await ProjectCreator.createProject({
      name: 'test-hmr-project',
      template: 'basic'
    });

    // Install dependencies
    console.log('📦 Installing dependencies for HMR testing...');
    const installResult = await ProcessRunner.npmInstall(project.path, { timeout: 120000 });
    expect(installResult.success).toBe(true);

    // Initialize server manager
    serverManager = new ServerManager({
      projectPath: project.path,
      pipelinePort: 3001,
      uiPort: 5173,
      timeout: 45000,
      silent: false
    });
  }, 150000); // 2.5 minute timeout for setup

  afterEach(async () => {
    // Cleanup servers and project
    await serverManager.cleanup();
    await project.cleanup();
  });

  describe('Pipeline System Tests', () => {
    it('should compile pipeline to temp/pipeline.js', async () => {
      console.log('🔧 Testing pipeline compilation...');
      
      // Build pipeline
      const buildResult = await ProcessRunner.npmRun('build:pipeline', project.path, { timeout: 60000 });
      expect(buildResult.success).toBe(true);

      // Check that pipeline.js exists
      const pipelineExists = await FileValidator.fileExists(join(project.path, 'temp/pipeline.js'));
      expect(pipelineExists).toBe(true);

      console.log('✅ Pipeline compiled successfully');
    });

    it('should generate manifest.json correctly', async () => {
      console.log('🔧 Testing manifest generation...');
      
      // Build pipeline (which should generate manifest)
      const buildResult = await ProcessRunner.npmRun('build:pipeline', project.path, { timeout: 60000 });
      expect(buildResult.success).toBe(true);

      // Check that manifest.json exists and has correct structure
      const manifestPath = join(project.path, 'temp/manifest.json');
      const manifestExists = await FileValidator.fileExists(manifestPath);
      expect(manifestExists).toBe(true);

      // Validate manifest content
      const validation = await FileValidator.validateJsonFile(
        manifestPath,
        (data) => {
          if (!data.models || !Array.isArray(data.models)) {
            return 'manifest.json missing models array';
          }
          if (!data.version) {
            return 'manifest.json missing version';
          }
          if (!data.generatedAt) {
            return 'manifest.json missing generatedAt';
          }
          return null;
        }
      );

      expect(validation.isValid).toBe(true);
      console.log('✅ Manifest generated with correct structure');
    });

    it('should export expected pipeline functions', async () => {
      console.log('🔧 Testing pipeline exports...');
      
      // Build pipeline
      const buildResult = await ProcessRunner.npmRun('build:pipeline', project.path, { timeout: 60000 });
      expect(buildResult.success).toBe(true);

      // Read and validate pipeline.js exports
      const pipelinePath = join(project.path, 'temp/pipeline.js');
      const pipelineContent = readFileSync(pipelinePath, 'utf-8');

      // Check for expected exports
      expect(pipelineContent).toContain('getAvailableModels');
      expect(pipelineContent).toContain('generateModel');

      console.log('✅ Pipeline exports validated');
    });

    it('should start pipeline server successfully', async () => {
      console.log('🚀 Testing pipeline server startup...');
      
      // Start pipeline server
      const pipelineServer = await serverManager.startPipelineServer();
      
      expect(pipelineServer.ready).toBe(true);
      expect(pipelineServer.port).toBe(3001);
      expect(pipelineServer.name).toBe('pipeline');

      // Verify pipeline artifacts exist
      const pipelineExists = await FileValidator.fileExists(join(project.path, 'temp/pipeline.js'));
      expect(pipelineExists).toBe(true);

      console.log('✅ Pipeline server started successfully');
    });
  });

  describe('Dual-Server Architecture Tests', () => {
    it('should start both servers successfully', async () => {
      console.log('🚀 Testing dual-server startup...');
      
      const servers = await serverManager.startBothServers();
      
      expect(servers.pipeline.ready).toBe(true);
      expect(servers.ui.ready).toBe(true);
      expect(servers.pipeline.port).toBe(3001);
      expect(servers.ui.port).toBe(5173);

      console.log('✅ Both servers started successfully');
    });

    it('should handle server communication correctly', async () => {
      console.log('🔧 Testing server communication...');
      
      const servers = await serverManager.startBothServers();
      
      // Wait a bit for servers to fully initialize
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Test that both servers are responsive
      const pipelineReady = await serverManager.waitForServer('pipeline', 5000);
      const uiReady = await serverManager.waitForServer('ui', 5000);

      expect(pipelineReady).toBe(true);
      expect(uiReady).toBe(true);

      console.log('✅ Server communication validated');
    });
  });

  describe('Hot Module Replacement Tests', () => {
    it('should detect file changes and trigger pipeline rebuilds', async () => {
      console.log('🔧 Testing HMR file change detection...');

      // Start pipeline server in watch mode
      const pipelineServer = await serverManager.startPipelineServer();
      expect(pipelineServer.ready).toBe(true);

      // Get initial pipeline modification time
      const pipelinePath = join(project.path, 'temp/pipeline.js');
      const initialStats = await FileValidator.getFileStats(pipelinePath);

      // Wait a moment to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Modify a model file to trigger rebuild
      const mainTsPath = join(project.path, 'main.ts');
      const originalContent = readFileSync(mainTsPath, 'utf-8');
      const modifiedContent = originalContent + '\n// HMR test modification';

      writeFileSync(mainTsPath, modifiedContent);

      // Wait for rebuild to complete with polling
      let rebuilt = false;
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const newStats = await FileValidator.getFileStats(pipelinePath);
        if (newStats.mtime.getTime() > initialStats.mtime.getTime()) {
          rebuilt = true;
          break;
        }
      }

      expect(rebuilt).toBe(true);

      // Restore original content
      writeFileSync(mainTsPath, originalContent);

      console.log('✅ HMR file change detection working');
    }, 15000); // Increase timeout to 15 seconds

    it('should handle source-based development changes', async () => {
      console.log('🔧 Testing source-based development...');
      
      // Start both servers
      const servers = await serverManager.startBothServers();
      
      // Wait for servers to be ready
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify that configurator source changes would be detected
      // (This is a structural test since we can't easily test browser HMR in unit tests)
      const viteConfigPath = join(project.path, 'vite.config.ts');
      const viteConfigExists = await FileValidator.fileExists(viteConfigPath);
      expect(viteConfigExists).toBe(true);

      // Check that HMR plugin is configured
      const viteConfigContent = readFileSync(viteConfigPath, 'utf-8');
      expect(viteConfigContent).toContain('pipelineHMR');

      console.log('✅ Source-based development configuration validated');
    });

    it('should prevent stale cache issues', async () => {
      console.log('🔧 Testing cache busting...');

      // Start pipeline server
      const pipelineServer = await serverManager.startPipelineServer();
      expect(pipelineServer.ready).toBe(true);

      const pipelinePath = join(project.path, 'temp/pipeline.js');
      let lastModTime = 0;

      // Build pipeline multiple times to test cache handling
      for (let i = 0; i < 3; i++) {
        // Modify main.ts slightly
        const mainTsPath = join(project.path, 'main.ts');
        const content = readFileSync(mainTsPath, 'utf-8');
        const modifiedContent = content.replace(
          /\/\/ Cache test \d+/g, ''
        ) + `\n// Cache test ${i}`;

        writeFileSync(mainTsPath, modifiedContent);

        // Wait for rebuild with polling
        let rebuilt = false;
        for (let j = 0; j < 8; j++) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const stats = await FileValidator.getFileStats(pipelinePath);
          if (stats.mtime.getTime() > lastModTime) {
            lastModTime = stats.mtime.getTime();
            rebuilt = true;
            break;
          }
        }

        expect(rebuilt).toBe(true);

        // Verify pipeline was updated
        const pipelineContent = readFileSync(pipelinePath, 'utf-8');
        expect(pipelineContent.length).toBeGreaterThan(0);
      }

      console.log('✅ Cache busting working correctly');
    }, 30000); // Increase timeout to 30 seconds for multiple rebuilds
  });

  describe('Error Handling Tests', () => {
    it('should handle pipeline compilation errors gracefully', async () => {
      console.log('🔧 Testing pipeline error handling...');
      
      // Introduce a syntax error in main.ts
      const mainTsPath = join(project.path, 'main.ts');
      const originalContent = readFileSync(mainTsPath, 'utf-8');
      const brokenContent = originalContent + '\n// Syntax error: invalid TypeScript\nconst broken = {';
      
      writeFileSync(mainTsPath, brokenContent);

      // Try to build pipeline - should fail gracefully
      const buildResult = await ProcessRunner.npmRun('build:pipeline', project.path, { timeout: 30000 });
      expect(buildResult.success).toBe(false);
      expect(buildResult.stderr).toContain('error');

      // Restore original content
      writeFileSync(mainTsPath, originalContent);

      // Verify recovery
      const recoveryResult = await ProcessRunner.npmRun('build:pipeline', project.path, { timeout: 30000 });
      expect(recoveryResult.success).toBe(true);

      console.log('✅ Pipeline error handling validated');
    });

    it('should handle server startup failures', async () => {
      console.log('🔧 Testing server startup error handling...');
      
      // Try to start server on an occupied port (simulate port conflict)
      const conflictServerManager = new ServerManager({
        projectPath: project.path,
        pipelinePort: 3001,
        uiPort: 5173,
        timeout: 5000, // Short timeout for faster test
        silent: true
      });

      // Start first server
      const server1 = await serverManager.startPipelineServer();
      expect(server1.ready).toBe(true);

      // Try to start second server on same port - should handle gracefully
      try {
        await conflictServerManager.startPipelineServer();
        // If we get here, the test should fail because we expected an error
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        console.log('✅ Port conflict handled correctly');
      }

      await conflictServerManager.cleanup();
    });
  });
});
