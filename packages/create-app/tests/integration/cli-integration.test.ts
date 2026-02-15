import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { writeFile } from 'fs/promises';
import {
  TempDir,
  ProjectCreator,
  ServerManager,
  HttpClient,
  FileWatcher,
  CLIHelper,
  type CreatedProject,
  type ServerInstance
} from '../utils/index.js';

describe('CLI Integration Tests', () => {
  let tempDirPath: string;
  let project: CreatedProject;
  let serverManager: ServerManager;
  let server: ServerInstance | null = null;

  beforeEach(async () => {
    tempDirPath = await TempDir.create('cli-integration-test-');
  });

  afterEach(async () => {
    // Clean up server
    if (server && serverManager) {
      await serverManager.killServer();
      server = null;
    }

    // Clean up project
    if (project && project.cleanup) {
      await project.cleanup();
    }

    // Clean up temp directory
    if (tempDirPath) {
      await TempDir.cleanup(tempDirPath);
    }
  });

  describe('Happy Path Workflow', () => {
    it('should complete full development workflow', async () => {
      // Step 1: Create project using create-app
      console.log('🏗️  Creating test project...');
      project = await ProjectCreator.createProject({
        name: 'test-cli-integration',
        template: 'basic'
      });
      expect(project.name).toBe('test-cli-integration');
      expect(project.path).toBeDefined();

      // Step 2: Verify CLI is available
      console.log('🔍 Verifying CLI availability...');
      const cliValidation = await CLIHelper.testCLIAvailability(project.path);
      expect(cliValidation.isValid).toBe(true);

      // Step 3: Start CLI server (manifold-studio dev)
      console.log('🚀 Starting CLI development server...');
      serverManager = new ServerManager({
        projectPath: project.path,
        port: 4000,
        timeout: 45000, // Give more time for initial startup
        silent: false
      });

      server = await serverManager.startServer();
      expect(server).toBeDefined();
      expect(server.ready).toBe(true);

      // Step 4: Wait for server and pipeline files to be accessible
      console.log('🏥 Checking server health...');
      console.log(`Server URL: ${server.url}`);

      // First, let's check the initial health status
      const initialHealth = await HttpClient.checkServerAndPipelineHealth(server.url);
      console.log(`Initial health check - Server: ${initialHealth.serverHealthy}, Pipeline: ${initialHealth.pipelineAccessible}, Manifest: ${initialHealth.manifestAccessible}`);

      const serverHealthy = await HttpClient.waitForServerAndPipeline(
        server.url,
        30, // 30 attempts
        2000 // 2 second delay
      );

      if (!serverHealthy) {
        const finalHealth = await HttpClient.checkServerAndPipelineHealth(server.url);
        console.log(`Final health check - Server: ${finalHealth.serverHealthy}, Pipeline: ${finalHealth.pipelineAccessible}, Manifest: ${finalHealth.manifestAccessible}`);
      }

      expect(serverHealthy).toBe(true);

      // Step 5: Verify server responds
      console.log('🌐 Testing server response...');
      const serverResponse = await HttpClient.request(server.url);
      expect(serverResponse.success).toBe(true);
      expect(serverResponse.statusCode).toBe(200);
      expect(serverResponse.body).toContain('html'); // Should return HTML page

      // Step 6: Verify pipeline files are accessible as static assets
      console.log('⚙️  Testing pipeline file accessibility...');
      const pipelineAccessible = await HttpClient.isPipelineFileAccessible(server.url, '/temp/pipeline.js');
      expect(pipelineAccessible).toBe(true);

      // Step 7: Get baseline for file watching
      console.log('📊 Establishing pipeline baseline...');
      const baseline = await FileWatcher.getPipelineBaseline(project.path);
      console.log(`📊 Baseline timestamp: ${baseline.toISOString()}`);

      // Check if pipeline files exist
      const pipelinePath = join(project.path, 'temp', 'pipeline.js');
      const manifestPath = join(project.path, 'temp', 'manifest.json');
      const pipelineExists = await FileWatcher.fileExists(pipelinePath);
      const manifestExists = await FileWatcher.fileExists(manifestPath);
      console.log(`📊 Pipeline file exists: ${pipelineExists}, Manifest exists: ${manifestExists}`);

      // Step 8: Make edit to model file
      console.log('✏️  Making edit to model file...');
      const mainTsPath = join(project.path, 'main.ts');
      
      // Read current content and make a simple modification
      const originalContent = `import { Manifold } from '@manifold-studio/manifold';

export interface Parameters {
  width: { value: number; min: number; max: number; step: number };
  height: { value: number; min: number; max: number; step: number };
  depth: { value: number; min: number; max: number; step: number };
}

export const parameters: Parameters = {
  width: { value: 20, min: 1, max: 100, step: 1 },
  height: { value: 20, min: 1, max: 100, step: 1 },
  depth: { value: 20, min: 1, max: 100, step: 1 }
};

export function generateModel(params: Parameters): Manifold {
  // Modified: Changed from cube to a slightly different size
  return Manifold.cube([params.width.value + 1, params.height.value, params.depth.value]);
}`;

      await writeFile(mainTsPath, originalContent);
      console.log('✏️  File edit completed, waiting for pipeline rebuild...');

      // Give the file watcher a moment to detect the change
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 9: Verify pipeline triggers and rebuilds
      console.log('🔄 Waiting for pipeline rebuild...');
      const pipelineUpdate = await FileWatcher.waitForFullPipelineUpdate(
        project.path,
        baseline,
        20000 // 20 second timeout
      );

      console.log(`🔄 Pipeline update results:`, {
        pipelineChanged: pipelineUpdate.pipelineChanged,
        manifestChanged: pipelineUpdate.manifestChanged,
        bothChanged: pipelineUpdate.bothChanged,
        pipelineResult: pipelineUpdate.pipelineResult,
        manifestResult: pipelineUpdate.manifestResult
      });

      expect(pipelineUpdate.bothChanged).toBe(true);
      expect(pipelineUpdate.pipelineChanged).toBe(true);
      expect(pipelineUpdate.manifestChanged).toBe(true);

      // Step 10: Verify pipeline files still accessible after rebuild
      console.log('✅ Verifying pipeline files after rebuild...');
      const postRebuildResponse = await HttpClient.request(`${server.url}/temp/pipeline.js`);
      expect(postRebuildResponse.success).toBe(true);

      console.log('🎉 CLI integration test completed successfully!');
    }, 120000); // 2 minute timeout for full test

    it('should handle custom port configuration', async () => {
      // Create project
      project = await ProjectCreator.createProject({
        name: 'test-custom-ports',
        template: 'basic'
      });
      expect(project.name).toBe('test-custom-ports');

      // Start server with custom port
      serverManager = new ServerManager({
        projectPath: project.path,
        port: 3010,
        timeout: 30000
      });

      server = await serverManager.startServer();
      expect(server.port).toBe(3010);

      // Verify server responds on custom port
      const serverHealthy = await HttpClient.waitForServerAndPipeline(
        server.url,
        20,
        1000
      );
      expect(serverHealthy).toBe(true);
    }, 60000);
  });

  describe('Error Scenarios', () => {
    it('should handle missing project gracefully', async () => {
      const nonExistentPath = join(tempDirPath, 'non-existent-project');
      
      serverManager = new ServerManager({
        projectPath: nonExistentPath,
        timeout: 10000
      });

      await expect(serverManager.startServer()).rejects.toThrow();
    });

    it('should detect CLI unavailability', async () => {
      // Create empty directory (no package.json, no CLI)
      const emptyPath = join(tempDirPath, 'empty-project');
      
      const cliValidation = await CLIHelper.testCLIAvailability(emptyPath, 5000);
      expect(cliValidation.isValid).toBe(false);
    });
  });
});
