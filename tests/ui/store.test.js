// tests/ui/store.test.js
// UI tests with service mocking - shows clean separation of concerns

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storeFile = path.join(__dirname, '../../dist/state/store.js');

const skipTests = !fs.existsSync(storeFile);

test('Store State Management', async (t) => {
  if (skipTests) {
    return t.skip('Compiled store not found - run npm run compile');
  }

  // Mock the services before importing the store
  const mockModelService = {
    loadModel: async (modelId, onProgress) => {
      // Simulate progress
      onProgress?.(25, 'Loading model...');
      onProgress?.(50, 'Processing...');
      onProgress?.(75, 'Generating exports...');
      onProgress?.(100, 'Complete');
      
      return {
        model: { id: modelId, type: 'mock' },
        metadata: { name: `Mock ${modelId}`, description: 'Test model' },
        exports: {
          objUrl: `blob:mock-obj-${modelId}`,
          glbUrl: `blob:mock-glb-${modelId}`
        }
      };
    },
    getAvailableModels: () => [
      { id: 'test1', name: 'Test Model 1' },
      { id: 'test2', name: 'Test Model 2' }
    ]
  };

  // Mock the service container to return our mock service
  const originalServiceContainer = global.ServiceContainer;
  global.ServiceContainer = {
    getInstance: () => ({
      getModelService: () => mockModelService
    })
  };

  try {
    const storeModule = await import('../../dist/state/store.js');
    
    await t.test('loadModel updates state correctly', async () => {
      const testModelId = 'test-model';
      
      // Track status changes
      const statusUpdates = [];
      const unsubscribe = storeModule.status.subscribe((status) => {
        statusUpdates.push({ ...status });
      });
      
      try {
        // Load model
        const result = await storeModule.loadModel(testModelId);
        
        // Check final state
        assert.strictEqual(storeModule.currentModelId.value, testModelId, 'Current model ID updated');
        assert.ok(storeModule.currentModel.value, 'Current model set');
        assert.strictEqual(storeModule.currentModel.value.id, testModelId, 'Correct model loaded');
        
        // Check metadata
        assert.ok(storeModule.modelMetadata.value, 'Metadata set');
        assert.strictEqual(storeModule.modelMetadata.value.name, `Mock ${testModelId}`, 'Correct metadata');
        
        // Check URLs
        assert.ok(storeModule.modelUrls.value.objUrl, 'OBJ URL set');
        assert.ok(storeModule.modelUrls.value.glbUrl, 'GLB URL set');
        assert.ok(storeModule.modelUrls.value.objUrl.includes(testModelId), 'OBJ URL contains model ID');
        
        // Check computed values
        assert.ok(storeModule.isModelLoaded.value, 'Model is loaded');
        assert.ok(!storeModule.isModelLoading.value, 'Model is not loading');
        
        // Check status progression
        assert.ok(statusUpdates.length > 0, 'Status was updated during loading');
        const finalStatus = statusUpdates[statusUpdates.length - 1];
        assert.strictEqual(finalStatus.message, 'Model loaded successfully', 'Final status correct');
        assert.strictEqual(finalStatus.isError, false, 'No error in final status');
        
        // Verify we got progress updates
        const progressUpdates = statusUpdates.filter(s => s.message.includes('%') || s.message.includes('Loading'));
        assert.ok(progressUpdates.length > 0, 'Received progress updates');
        
      } finally {
        unsubscribe();
      }
    });

    await t.test('loadModel handles errors correctly', async () => {
      // Create a service that throws an error
      const errorModelService = {
        loadModel: async () => {
          throw new Error('Test error');
        }
      };
      
      // Temporarily override the service
      global.ServiceContainer.getInstance = () => ({
        getModelService: () => errorModelService
      });
      
      const statusUpdates = [];
      const unsubscribe = storeModule.status.subscribe((status) => {
        statusUpdates.push({ ...status });
      });
      
      try {
        await assert.rejects(
          () => storeModule.loadModel('error-model'),
          /Test error/,
          'Throws expected error'
        );
        
        // Check error state
        const finalStatus = statusUpdates[statusUpdates.length - 1];
        assert.ok(finalStatus.isError, 'Status shows error');
        assert.ok(finalStatus.message.includes('Test error'), 'Error message in status');
        
      } finally {
        unsubscribe();
        // Restore mock service
        global.ServiceContainer.getInstance = () => ({
          getModelService: () => mockModelService
        });
      }
    });

    await t.test('updateStatus function works', async () => {
      const statusUpdates = [];
      const unsubscribe = storeModule.status.subscribe((status) => {
        statusUpdates.push({ ...status });
      });
      
      try {
        storeModule.updateStatus('Test message', false);
        
        const lastUpdate = statusUpdates[statusUpdates.length - 1];
        assert.strictEqual(lastUpdate.message, 'Test message', 'Message updated');
        assert.strictEqual(lastUpdate.isError, false, 'Error flag set correctly');
        
        storeModule.updateStatus('Error message', true);
        
        const lastError = statusUpdates[statusUpdates.length - 1];
        assert.strictEqual(lastError.message, 'Error message', 'Error message updated');
        assert.strictEqual(lastError.isError, true, 'Error flag set correctly');
        
      } finally {
        unsubscribe();
      }
    });

    await t.test('computed values work correctly', async () => {
      // Reset state
      storeModule.currentModel.value = null;
      storeModule.modelUrls.value = { objUrl: '', glbUrl: '' };
      storeModule.status.value = { message: 'Ready', isError: false };
      
      // Initially not loaded
      assert.ok(!storeModule.isModelLoaded.value, 'Initially not loaded');
      assert.ok(!storeModule.isModelLoading.value, 'Initially not loading');
      
      // Set loading status
      storeModule.status.value = { message: 'Loading model...', isError: false };
      assert.ok(storeModule.isModelLoading.value, 'Shows loading when status contains "Loading"');
      
      // Set loaded state
      storeModule.currentModel.value = { test: true };
      storeModule.modelUrls.value = { objUrl: 'test-obj', glbUrl: 'test-glb' };
      storeModule.status.value = { message: 'Ready', isError: false };
      
      assert.ok(storeModule.isModelLoaded.value, 'Shows loaded when model and URLs are set');
      assert.ok(!storeModule.isModelLoading.value, 'Not loading when ready');
    });

  } finally {
    // Restore original ServiceContainer
    global.ServiceContainer = originalServiceContainer;
  }
});