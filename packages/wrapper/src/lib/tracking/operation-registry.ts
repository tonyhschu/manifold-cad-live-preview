// src/lib/tracking/operation-registry.ts
// Simple global registry for operation tracking

export interface OperationInfo {
  id: string;
  type: string;
  inputIds: string[];
  metadata: Record<string, any>;
  timestamp: number;
}

class OperationRegistry {
  private operations = new Map<string, OperationInfo>();
  private idCounter = 0;

  /**
   * Generate a unique operation ID
   */
  generateId(): string {
    return `op_${this.idCounter++}`;
  }

  /**
   * Register a new operation
   */
  register(operation: OperationInfo): void {
    this.operations.set(operation.id, operation);
  }

  /**
   * Get operation by ID
   */
  get(id: string): OperationInfo | undefined {
    return this.operations.get(id);
  }

  /**
   * Build operation tree starting from a root operation ID
   * Returns operations in dependency order (dependencies first)
   */
  buildTree(rootId: string): OperationInfo[] {
    const visited = new Set<string>();
    const result: OperationInfo[] = [];

    const visit = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const operation = this.get(id);
      if (!operation) return;

      // Visit dependencies first
      for (const inputId of operation.inputIds) {
        visit(inputId);
      }

      // Add this operation
      result.push(operation);
    };

    visit(rootId);
    return result;
  }

  /**
   * Clear all operations (useful for testing)
   */
  clear(): void {
    this.operations.clear();
    this.idCounter = 0;
  }

  /**
   * Get registry stats for debugging
   */
  getStats(): { count: number; operations: OperationInfo[] } {
    return {
      count: this.operations.size,
      operations: Array.from(this.operations.values())
    };
  }
}

// Global singleton registry
const globalRegistry = new OperationRegistry();

export function getOperationRegistry(): OperationRegistry {
  return globalRegistry;
}
