// src/lib/manifold-context.ts
import Manifold from 'manifold-3d';

// Type for the initialized Manifold module
export type ManifoldType = Awaited<ReturnType<typeof Manifold>>;

// Create a class to manage the Manifold context
class ManifoldContext {
  private manifold: ManifoldType | null = null;
  private initPromise: Promise<ManifoldType> | null = null;
  private initCount = 0;
  
  // Initialize Manifold once and cache the result
  async initialize(): Promise<ManifoldType> {
    if (this.manifold) {
      console.log('Returning already initialized Manifold instance');
      return this.manifold;
    }
    
    if (!this.initPromise) {
      console.log('Starting Manifold initialization (first time)');
      this.initCount++;
      this.initPromise = Manifold().then(module => {
        console.log('Manifold initialized successfully');
        this.manifold = module;
        return module;
      });
    } else {
      console.log('Returning pending initialization promise');
      this.initCount++;
    }
    
    return this.initPromise;
  }
  
  // Get the initialized manifold instance, initializing if needed
  async getManifold(): Promise<ManifoldType> {
    return this.initialize();
  }
  
  // Check if manifold is already initialized
  isInitialized(): boolean {
    return this.manifold !== null;
  }
  
  // Get initialization count for testing
  getInitCount(): number {
    return this.initCount;
  }
}

// Create and export a singleton instance
export const manifoldContext = new ManifoldContext();

// Helper function to wait for manifold and execute with it
export async function withManifold<T>(fn: (manifold: ManifoldType) => T): Promise<T> {
  const manifold = await manifoldContext.getManifold();
  return fn(manifold);
}
