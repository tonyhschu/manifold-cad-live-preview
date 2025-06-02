// src/lib/tracking/operation-registry.ts
// Simple global registry for operation tracking
class OperationRegistry {
    operations = new Map();
    idCounter = 0;
    /**
     * Generate a unique operation ID
     */
    generateId() {
        return `op_${this.idCounter++}`;
    }
    /**
     * Register a new operation
     */
    register(operation) {
        this.operations.set(operation.id, operation);
    }
    /**
     * Get operation by ID
     */
    get(id) {
        return this.operations.get(id);
    }
    /**
     * Build operation tree starting from a root operation ID
     * Returns operations in dependency order (dependencies first)
     */
    buildTree(rootId) {
        const visited = new Set();
        const result = [];
        const visit = (id) => {
            if (visited.has(id))
                return;
            visited.add(id);
            const operation = this.get(id);
            if (!operation)
                return;
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
    clear() {
        this.operations.clear();
        this.idCounter = 0;
    }
    /**
     * Get registry stats for debugging
     */
    getStats() {
        return {
            count: this.operations.size,
            operations: Array.from(this.operations.values())
        };
    }
}
// Global singleton registry
const globalRegistry = new OperationRegistry();
export function getOperationRegistry() {
    return globalRegistry;
}
//# sourceMappingURL=operation-registry.js.map