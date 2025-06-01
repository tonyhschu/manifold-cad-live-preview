// src/lib/tracking/mm-manifold.ts
// Proxy-based tracking wrapper that preserves complete API transparency

// No imports needed from manifold.ts since we receive the class as parameter
import { getOperationRegistry, type OperationInfo } from './operation-registry';

export interface OperationMetadata {
  name?: string;
  [key: string]: any;
}

/**
 * Create a proxy that wraps the original Manifold class with tracking
 */
export function createTrackedManifold(OriginalManifold: any) {

  return new Proxy(OriginalManifold, {
    construct(target, args) {
      // When someone calls new Manifold(), create a tracked instance
      const instance = new target(...args);
      return createTrackedInstance(instance);
    },

    get(target, prop) {
      const value = target[prop];

      // If it's a static method that returns a Manifold, wrap it
      if (typeof value === 'function') {
        return function(...args: any[]) {
          const result = value.apply(target, args);

          // If the result is a Manifold instance, wrap it with tracking
          if (result && typeof result === 'object' && result.constructor === target) {
            return createTrackedInstance(result, {
              type: String(prop),
              inputIds: [],
              metadata: { parameters: args }
            });
          }

          return result;
        };
      }

      return value;
    }
  });
}

/**
 * Create a tracked instance that wraps a Manifold object
 */
function createTrackedInstance(target: any, operationInfo?: {
  type: string;
  inputIds: string[];
  metadata?: OperationMetadata;
}) {
  const registry = getOperationRegistry();
  const operationId = registry.generateId();

  // Register the operation if provided
  if (operationInfo) {
    registry.register({
      id: operationId,
      type: operationInfo.type,
      inputIds: operationInfo.inputIds,
      metadata: operationInfo.metadata || {},
      timestamp: Date.now()
    });
  }

  return new Proxy(target, {
    get(target, prop) {
      // Add tracking-specific methods
      if (prop === 'getOperationTree') {
        return () => registry.buildTree(operationId);
      }

      if (prop === 'getOperationId') {
        return () => operationId;
      }

      const value = target[prop];

      // If it's a method that returns a Manifold, wrap the result
      if (typeof value === 'function') {
        return function(...args: any[]) {
          const result = value.apply(target, args);

          // If the result is a Manifold instance, wrap it with tracking
          if (result && typeof result === 'object' && result.constructor === target.constructor) {
            return createTrackedInstance(result, {
              type: String(prop),
              inputIds: [operationId],
              metadata: { parameters: args }
            });
          }

          return result;
        };
      }

      return value;
    }
  });
}

// The tracked Manifold class is created in manifold.ts after WASM loads
