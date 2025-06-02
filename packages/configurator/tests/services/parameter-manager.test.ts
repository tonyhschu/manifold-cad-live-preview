// Test ParameterManager core functionality (logic only, no DOM/Tweakpane)
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { P, createConfig } from '../../src/types/parametric-config'
import type { ParametricConfig } from '../../src/types/parametric-config'

// Mock DOM and Tweakpane since we're testing in Node.js environment
vi.mock('tweakpane', () => ({
  Pane: vi.fn().mockImplementation(() => ({
    addBinding: vi.fn().mockReturnValue({
      on: vi.fn()
    }),
    dispose: vi.fn()
  }))
}))

// Mock DOM globals
Object.defineProperty(global, 'HTMLElement', {
  value: class MockHTMLElement {},
  writable: true
})

Object.defineProperty(global, 'CustomEvent', {
  value: class MockCustomEvent {
    constructor(public type: string, public detail?: any) {}
  },
  writable: true
})

Object.defineProperty(global, 'document', {
  value: {
    dispatchEvent: vi.fn()
  },
  writable: true
})

describe('ParameterManager Core Logic', () => {
  let mockContainer: HTMLElement
  
  beforeEach(() => {
    mockContainer = new HTMLElement()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('parameter initialization extracts defaults correctly', async () => {
    // Import ParameterManager after mocks are set up
    const { ParameterManager } = await import('../../src/core/parameter-manager')
    
    const testConfig = createConfig(
      {
        width: P.number(10, 1, 100),
        height: P.number(20, 5, 50),  
        enabled: P.boolean(true),
        material: P.select("wood", ["wood", "metal"])
      },
      (params) => ({ mockModel: true, params })
    )

    const manager = new ParameterManager(testConfig, mockContainer)
    const params = manager.getParameters()

    expect(params).toEqual({
      width: 10,
      height: 20,
      enabled: true,
      material: "wood"
    })
  })

  it('getParameters returns copy of current parameters', async () => {
    const { ParameterManager } = await import('../../src/core/parameter-manager')
    
    const testConfig = createConfig(
      {
        x: P.number(5),
        y: P.number(10),
        visible: P.boolean(false)
      },
      (params) => ({ generated: true })
    )

    const manager = new ParameterManager(testConfig, mockContainer)
    const params1 = manager.getParameters()
    const params2 = manager.getParameters()

    // Should return different objects (copies)
    expect(params1).not.toBe(params2)
    // But with same values
    expect(params1).toEqual(params2)
    expect(params1).toEqual({
      x: 5,
      y: 10,
      visible: false
    })
  })

  it('setParameter updates parameter values', async () => {
    const { ParameterManager } = await import('../../src/core/parameter-manager')
    
    const testConfig = createConfig(
      {
        count: P.number(42),
        name: P.string("test"),
        active: P.boolean(true)
      },
      () => ({ mock: true })
    )

    const manager = new ParameterManager(testConfig, mockContainer)
    
    // Update parameters
    manager.setParameter('count', 100)
    manager.setParameter('name', 'updated')
    manager.setParameter('active', false)

    const params = manager.getParameters()
    expect(params).toEqual({
      count: 100,
      name: 'updated',
      active: false
    })
  })

  it('setParameter ignores non-existent parameters', async () => {
    const { ParameterManager } = await import('../../src/core/parameter-manager')
    
    const testConfig = createConfig(
      {
        width: P.number(10)
      },
      () => ({ mock: true })
    )

    const manager = new ParameterManager(testConfig, mockContainer)
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    
    manager.setParameter('nonexistent', 123)
    
    // Should warn about non-existent parameter
    expect(consoleSpy).toHaveBeenCalledWith("Parameter 'nonexistent' does not exist in config")
    
    // Original parameters should be unchanged
    expect(manager.getParameters()).toEqual({ width: 10 })
    
    consoleSpy.mockRestore()
  })

  it('regenerateModel calls config generateModel with current parameters', async () => {
    const { ParameterManager } = await import('../../src/core/parameter-manager')
    
    const mockGenerateModel = vi.fn().mockReturnValue({ result: 'generated' })
    const testConfig = createConfig(
      {
        size: P.number(15),
        enabled: P.boolean(true)
      },
      mockGenerateModel
    )

    const manager = new ParameterManager(testConfig, mockContainer)
    
    // Update a parameter
    manager.setParameter('size', 25)
    
    // Regenerate model
    const result = manager.regenerateModel()
    
    expect(mockGenerateModel).toHaveBeenCalledWith({
      size: 25,
      enabled: true
    })
    expect(result).toEqual({ result: 'generated' })
  })

  it('parameter value types are preserved', async () => {
    const { ParameterManager } = await import('../../src/core/parameter-manager')
    
    const config = createConfig(
      {
        count: P.number(42),
        name: P.string("test"),
        active: P.boolean(true),
        type: P.select("A", ["A", "B", "C"])
      },
      () => ({ mock: true })
    )

    const manager = new ParameterManager(config, mockContainer)
    const params = manager.getParameters()

    // Check parameter types are correct
    expect(typeof params.count).toBe('number')
    expect(typeof params.name).toBe('string')
    expect(typeof params.active).toBe('boolean')
    expect(typeof params.type).toBe('string')
    
    // Check values
    expect(params.count).toBe(42)
    expect(params.name).toBe("test")
    expect(params.active).toBe(true)
    expect(params.type).toBe("A")
  })

  it('destroy method cleans up resources', async () => {
    const { ParameterManager } = await import('../../src/core/parameter-manager')
    const { Pane } = await import('tweakpane')
    
    const testConfig = createConfig(
      { width: P.number(10) },
      () => ({ test: true })
    )

    const manager = new ParameterManager(testConfig, mockContainer)
    
    // Call destroy
    manager.destroy()
    
    // Should have called dispose on the pane
    expect(Pane).toHaveBeenCalled()
    const paneInstance = (Pane as any).mock.results[0].value
    expect(paneInstance.dispose).toHaveBeenCalled()
  })
});
