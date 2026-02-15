// Test utilities for configurator package tests
// NOTE: MockBlob implementation is kept consistent with wrapper/tests/test-utils.ts

/**
 * Mock Blob implementation for Node.js testing environment
 * Provides compatibility with both Node.js and browser Blob APIs
 */
export class MockBlob {
  public readonly size: number;
  public readonly type: string;
  private content: string;

  constructor(parts: any[] = [], options: { type?: string } = {}) {
    // Join all parts into a single string
    this.content = parts.map(part => {
      if (typeof part === 'string') {
        return part;
      } else if (part instanceof ArrayBuffer) {
        return new TextDecoder().decode(part);
      } else if (ArrayBuffer.isView(part)) {
        return new TextDecoder().decode(part);
      }
      return String(part);
    }).join('');
    
    this.size = this.content.length;
    this.type = options.type || '';
  }

  async text(): Promise<string> {
    return this.content;
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    return encoder.encode(this.content).buffer;
  }

  async bytes(): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    return encoder.encode(this.content);
  }

  slice(start?: number, end?: number, contentType?: string): MockBlob {
    const slicedContent = this.content.slice(start, end);
    return new MockBlob([slicedContent], { type: contentType || this.type });
  }

  stream(): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();
    const data = encoder.encode(this.content);

    return new ReadableStream({
      start(controller) {
        controller.enqueue(data);
        controller.close();
      }
    });
  }
}

/**
 * Setup mock Blob globally for Node.js environment
 */
export function setupMockBlob() {
  // Only setup MockBlob if Blob is not already defined (e.g., in happy-dom)
  if (typeof global !== 'undefined' && !global.Blob) {
    Object.defineProperty(global, 'Blob', {
      value: MockBlob,
      writable: true,
      configurable: true
    });
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
