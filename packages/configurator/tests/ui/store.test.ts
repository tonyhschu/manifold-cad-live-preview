// tests/ui/store.test.ts
// UI tests with service mocking - shows clean separation of concerns

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the service container before importing the store
const mockModelService = {
  loadModel: vi.fn(),
  getAvailableModels: vi.fn(() => [
    { id: 'test1', name: 'Test Model 1' },
    { id: 'test2', name: 'Test Model 2' }
  ]),
  refreshAvailableModels: vi.fn(),
  getCachedModel: vi.fn(() => null),
  clearCache: vi.fn()
}

// Mock the service container
vi.mock('../../src/services', () => ({
  getModelService: () => mockModelService
}))

// Import store after mocking
import {
  status,
  currentModelId,
  currentModel,
  modelMetadata,
  modelUrls,
  isModelLoaded,
  isModelLoading,
  loadModel,
  updateStatus
} from '../../src/state/store'

describe('Store State Management', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()

    // Reset store state
    currentModelId.value = 'demo'
    currentModel.value = null
    modelMetadata.value = null
    modelUrls.value = { objUrl: '', glbUrl: '' }
    status.value = { message: 'Ready', isError: false }

    // Setup default mock implementation
    mockModelService.loadModel.mockImplementation(async (modelId, onProgress) => {
      // Simulate progress
      onProgress?.(25, 'Loading model...')
      onProgress?.(50, 'Processing...')
      onProgress?.(75, 'Generating exports...')
      onProgress?.(100, 'Complete')

      return {
        model: { id: modelId, type: 'mock' },
        metadata: { name: `Mock ${modelId}`, description: 'Test model' },
        exports: {
          objUrl: `blob:mock-obj-${modelId}`,
          glbUrl: `blob:mock-glb-${modelId}`
        }
      }
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('loadModel updates state correctly', async () => {
    const testModelId = 'test-model'

    // Track status changes
    const statusUpdates: Array<{ message: string; isError: boolean }> = []
    const unsubscribe = status.subscribe((statusValue) => {
      statusUpdates.push({ ...statusValue })
    })

    try {
      // Load model
      const result = await loadModel(testModelId)

      // Check final state
      expect(currentModelId.value).toBe(testModelId)
      expect(currentModel.value).toBeDefined()
      expect(currentModel.value.id).toBe(testModelId)

      // Check metadata
      expect(modelMetadata.value).toBeDefined()
      expect(modelMetadata.value?.name).toBe(`Mock ${testModelId}`)

      // Check URLs
      expect(modelUrls.value.objUrl).toBeTruthy()
      expect(modelUrls.value.glbUrl).toBeTruthy()
      expect(modelUrls.value.objUrl).toContain(testModelId)

      // Check computed values
      expect(isModelLoaded.value).toBe(true)
      expect(isModelLoading.value).toBe(false)

      // Check status progression
      expect(statusUpdates.length).toBeGreaterThan(0)
      const finalStatus = statusUpdates[statusUpdates.length - 1]
      expect(finalStatus.message).toBe('Model loaded successfully')
      expect(finalStatus.isError).toBe(false)

      // Verify we got progress updates
      const progressUpdates = statusUpdates.filter(s =>
        s.message.includes('%') || s.message.includes('Loading')
      )
      expect(progressUpdates.length).toBeGreaterThan(0)

    } finally {
      unsubscribe()
    }
  })

  it('loadModel handles errors correctly', async () => {
    // Create a service that throws an error
    mockModelService.loadModel.mockRejectedValueOnce(new Error('Test error'))

    const statusUpdates: Array<{ message: string; isError: boolean }> = []
    const unsubscribe = status.subscribe((statusValue) => {
      statusUpdates.push({ ...statusValue })
    })

    try {
      await expect(loadModel('error-model')).rejects.toThrow('Test error')

      // Check error state
      const finalStatus = statusUpdates[statusUpdates.length - 1]
      expect(finalStatus.isError).toBe(true)
      expect(finalStatus.message).toContain('Test error')

    } finally {
      unsubscribe()
    }
  })

  it('updateStatus function works', () => {
    const statusUpdates: Array<{ message: string; isError: boolean }> = []
    const unsubscribe = status.subscribe((statusValue) => {
      statusUpdates.push({ ...statusValue })
    })

    try {
      updateStatus('Test message', false)

      const lastUpdate = statusUpdates[statusUpdates.length - 1]
      expect(lastUpdate.message).toBe('Test message')
      expect(lastUpdate.isError).toBe(false)

      updateStatus('Error message', true)

      const lastError = statusUpdates[statusUpdates.length - 1]
      expect(lastError.message).toBe('Error message')
      expect(lastError.isError).toBe(true)

    } finally {
      unsubscribe()
    }
  })

  it('computed values work correctly', () => {
    // Reset state
    currentModel.value = null
    modelUrls.value = { objUrl: '', glbUrl: '' }
    status.value = { message: 'Ready', isError: false }

    // Initially not loaded
    expect(isModelLoaded.value).toBe(false)
    expect(isModelLoading.value).toBe(false)

    // Set loading status
    status.value = { message: 'Loading model...', isError: false }
    expect(isModelLoading.value).toBe(true)

    // Set loaded state
    currentModel.value = { test: true }
    modelUrls.value = { objUrl: 'test-obj', glbUrl: 'test-glb' }
    status.value = { message: 'Ready', isError: false }

    expect(isModelLoaded.value).toBe(true)
    expect(isModelLoading.value).toBe(false)
  })

  it('signals are reactive', () => {
    let statusCallCount = 0
    let modelCallCount = 0

    const statusUnsubscribe = status.subscribe(() => {
      statusCallCount++
    })

    const modelUnsubscribe = currentModel.subscribe(() => {
      modelCallCount++
    })

    try {
      // Initial subscription calls
      const initialStatusCalls = statusCallCount
      const initialModelCalls = modelCallCount

      // Update status
      status.value = { message: 'New status', isError: false }
      expect(statusCallCount).toBe(initialStatusCalls + 1)

      // Update model
      currentModel.value = { id: 'test' }
      expect(modelCallCount).toBe(initialModelCalls + 1)

    } finally {
      statusUnsubscribe()
      modelUnsubscribe()
    }
  })

  it('computed values update when dependencies change', () => {
    // Start with a clean state where computed values will change
    currentModel.value = null
    modelUrls.value = { objUrl: '', glbUrl: '' }
    status.value = { message: 'Ready', isError: false }

    let loadedCallCount = 0
    let loadingCallCount = 0

    const loadedUnsubscribe = isModelLoaded.subscribe(() => {
      loadedCallCount++
    })

    const loadingUnsubscribe = isModelLoading.subscribe(() => {
      loadingCallCount++
    })

    try {
      const initialLoadedCalls = loadedCallCount
      const initialLoadingCalls = loadingCallCount

      // Change dependencies to trigger computed value changes
      // This should change isModelLoaded from false to true
      currentModel.value = { test: true }
      modelUrls.value = { objUrl: 'test-obj', glbUrl: 'test-glb' }
      expect(loadedCallCount).toBeGreaterThan(initialLoadedCalls)

      // This should change isModelLoading from false to true
      status.value = { message: 'Loading...', isError: false }
      expect(loadingCallCount).toBeGreaterThan(initialLoadingCalls)

    } finally {
      loadedUnsubscribe()
      loadingUnsubscribe()
    }
  })
});
