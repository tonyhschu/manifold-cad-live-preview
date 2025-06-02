export interface OperationInfo {
    id: string;
    type: string;
    inputIds: string[];
    metadata: Record<string, any>;
    timestamp: number;
}
declare class OperationRegistry {
    private operations;
    private idCounter;
    /**
     * Generate a unique operation ID
     */
    generateId(): string;
    /**
     * Register a new operation
     */
    register(operation: OperationInfo): void;
    /**
     * Get operation by ID
     */
    get(id: string): OperationInfo | undefined;
    /**
     * Build operation tree starting from a root operation ID
     * Returns operations in dependency order (dependencies first)
     */
    buildTree(rootId: string): OperationInfo[];
    /**
     * Clear all operations (useful for testing)
     */
    clear(): void;
    /**
     * Get registry stats for debugging
     */
    getStats(): {
        count: number;
        operations: OperationInfo[];
    };
}
export declare function getOperationRegistry(): OperationRegistry;
export {};
//# sourceMappingURL=operation-registry.d.ts.map