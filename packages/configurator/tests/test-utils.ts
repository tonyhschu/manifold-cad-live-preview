// Test utilities for configurator package tests

/**
 * Mock Blob implementation for Node.js environment
 */
export class MockBlob {
  public readonly size: number;
  public readonly type: string;
  private data: any[];

  constructor(data: any[] = [], options: { type?: string } = {}) {
    this.data = data;
    this.type = options.type || '';
    this.size = this.calculateSize(data);
  }

  private calculateSize(data: any[]): number {
    return data.reduce((total, item) => {
      if (typeof item === 'string') {
        return total + item.length;
      } else if (item instanceof ArrayBuffer) {
        return total + item.byteLength;
      } else if (item && typeof item.length === 'number') {
        return total + item.length;
      }
      return total + 1;
    }, 0);
  }

  slice(start?: number, end?: number, contentType?: string): MockBlob {
    const slicedData = this.data.slice(start, end);
    return new MockBlob(slicedData, { type: contentType || this.type });
  }

  arrayBuffer(): Promise<ArrayBuffer> {
    // Simple mock implementation
    const buffer = new ArrayBuffer(this.size);
    return Promise.resolve(buffer);
  }

  text(): Promise<string> {
    return Promise.resolve(this.data.join(''));
  }

  stream(): ReadableStream {
    // Mock stream implementation
    return new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(this.data.join('')));
        controller.close();
      }
    });
  }
}

/**
 * Setup mock Blob in global environment for Node.js tests
 */
export function setupMockBlob() {
  if (typeof global !== 'undefined' && !global.Blob) {
    (global as any).Blob = MockBlob;
  }
  if (typeof window !== 'undefined' && !window.Blob) {
    (window as any).Blob = MockBlob;
  }
}

/**
 * Create a mock Manifold model for testing
 */
export function createMockModel() {
  return {
    // Mock Manifold object with basic methods
    asOriginal: () => ({
      // Mock ManifoldJS object
      getMesh: () => ({
        vertPos: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
        triVerts: new Uint32Array([0, 1, 2]),
        numVert: 3,
        numTri: 1
      }),
      isEmpty: () => false,
      status: () => 0, // No error
      numVert: () => 3,
      numTri: () => 1
    }),
    // Additional mock methods that might be needed
    isEmpty: () => false,
    numVert: () => 3,
    numTri: () => 1,
    getMesh: () => ({
      vertPos: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
      triVerts: new Uint32Array([0, 1, 2]),
      numVert: 3,
      numTri: 1
    })
  };
}

/**
 * Mock URL for testing
 */
export function createMockUrl(content: string = 'mock-content'): string {
  return `blob:test-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Mock progress callback for testing
 */
export function createMockProgressCallback() {
  const calls: Array<{ progress: number; message?: string }> = [];
  
  const callback = (progress: number, message?: string) => {
    calls.push({ progress, message });
  };

  return {
    callback,
    getCalls: () => calls,
    getLastCall: () => calls[calls.length - 1],
    getCallCount: () => calls.length,
    reset: () => calls.length = 0
  };
}

/**
 * Wait for a specified amount of time (useful for async tests)
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock file for testing file operations
 */
export function createMockFile(name: string, content: string, type: string = 'text/plain') {
  const blob = new MockBlob([content], { type });
  return Object.assign(blob, {
    name,
    lastModified: Date.now(),
    webkitRelativePath: ''
  });
}
