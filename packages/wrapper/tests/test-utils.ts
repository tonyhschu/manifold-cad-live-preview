// tests/test-utils.ts
// Shared test utilities to avoid duplication

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
  // Only setup MockBlob if Blob is not already defined
  if (typeof global !== 'undefined' && !global.Blob) {
    Object.defineProperty(global, 'Blob', {
      value: MockBlob,
      writable: true,
      configurable: true
    });
  }
}

/**
 * Create a mock model for testing export functionality
 */
export function createMockModel(options: {
  vertices?: number[]
  triangles?: number[]
  vertexCount?: number
} = {}) {
  const {
    vertices = [0, 0, 0, 1, 0, 0, 0, 1, 0], // Default triangle
    triangles = [0, 1, 2],
    vertexCount = 3
  } = options

  return {
    getMesh: () => ({
      vertProperties: new Float32Array(vertices),
      triVerts: new Uint32Array(triangles),
      numProp: vertexCount
    })
  }
}