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

      // Step 3: Start CLI server (manifold-dev dev)
      console.log('🚀 Starting CLI development server...');
      serverManager = new ServerManager({
        projectPath: project.path,
        uiPort: 3000,
        pipelinePort: 3001,
        timeout: 45000, // Give more time for initial startup
        silent: false
      });

      server = await serverManager.startServer();
      expect(server).toBeDefined();
      expect(server.ready).toBe(true);

      // Step 4: Wait for both servers to be healthy
      console.log('🏥 Checking server health...');
      console.log(`UI URL: ${server.uiUrl}`);
      console.log(`Pipeline URL: ${server.pipelineUrl}`);

      // First, let's check the initial health status
      const initialHealth = await HttpClient.checkDualServerHealth(server.uiUrl, server.pipelineUrl);
      console.log(`Initial health check - UI: ${initialHealth.uiHealthy}, Pipeline: ${initialHealth.pipelineHealthy}`);

      const serversHealthy = await HttpClient.waitForDualServers(
        server.uiUrl,
        server.pipelineUrl,
        30, // 30 attempts
        2000 // 2 second delay
      );

      if (!serversHealthy) {
        const finalHealth = await HttpClient.checkDualServerHealth(server.uiUrl, server.pipelineUrl);
        console.log(`Final health check - UI: ${finalHealth.uiHealthy}, Pipeline: ${finalHealth.pipelineHealthy}`);
      }

      expect(serversHealthy).toBe(true);

      // Step 5: Verify UI server responds
      console.log('🌐 Testing UI server response...');
      const uiResponse = await HttpClient.request(server.uiUrl);
      expect(uiResponse.success).toBe(true);
      expect(uiResponse.statusCode).toBe(200);
      expect(uiResponse.body).toContain('html'); // Should return HTML page

      // Step 6: Verify pipeline server responds
      console.log('⚙️  Testing pipeline server response...');
      const pipelineHealthy = await HttpClient.isPipelineServerHealthy(server.pipelineUrl);
      expect(pipelineHealthy).toBe(true);

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

      // Step 10: Verify pipeline server still responds after rebuild
      console.log('✅ Verifying pipeline server after rebuild...');
      const postRebuildResponse = await HttpClient.request(`${server.pipelineUrl}/temp/pipeline.js`);
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

      // Start server with custom ports
      serverManager = new ServerManager({
        projectPath: project.path,
        uiPort: 3010,
        pipelinePort: 3011,
        timeout: 30000
      });

      server = await serverManager.startServer();
      expect(server.uiPort).toBe(3010);
      expect(server.pipelinePort).toBe(3011);

      // Verify servers respond on custom ports
      const serversHealthy = await HttpClient.waitForDualServers(
        server.uiUrl,
        server.pipelineUrl,
        20,
        1000
      );
      expect(serversHealthy).toBe(true);
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
