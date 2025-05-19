// src/lib/manifold-context.ts
import ManifoldModule, { Manifold, Mesh } from "manifold-3d";

// Type for the initialized Manifold module
export type ManifoldType = Awaited<ReturnType<typeof ManifoldModule>>;

// Create a class to manage the Manifold context
class ManifoldContext {
  private manifoldModule: ManifoldType | null = null;
  private initPromise: Promise<ManifoldType> | null = null;
  private initCount = 0;

  // Initialize Manifold once and cache the result
  async initialize(): Promise<ManifoldType> {
    if (this.manifoldModule) {
      console.log("Returning already initialized Manifold instance");
      return this.manifoldModule;
    }

    if (!this.initPromise) {
      console.log("Starting Manifold initialization (first time)");
      this.initCount++;
      this.initPromise = ManifoldModule().then((wasmModule) => {
        console.log("Manifold WASM module loaded, setting up...");
        wasmModule.setup();
        this.manifoldModule = wasmModule;
        console.log("Manifold initialized successfully");
        return wasmModule;
      });
    } else {
      console.log("Returning pending initialization promise");
      this.initCount++;
    }

    return this.initPromise;
  }

  // Get the module with all manifold functionality
  async getModule(): Promise<ManifoldType> {
    return this.initialize();
  }

  // Check if manifold is already initialized
  isInitialized(): boolean {
    return this.manifoldModule !== null;
  }

  // Get initialization count for testing
  getInitCount(): number {
    return this.initCount;
  }

  /**
   * Get the mesh data from a manifold object
   * @param manifold The manifold object to get mesh data from
   * @returns The mesh data
   */
  async getMeshFromManifold(manifold: Manifold): Promise<Mesh> {
    return manifold.getMesh();
  }
}

// Create and export a singleton instance
export const manifoldContext = new ManifoldContext();

// Helper function to execute a function with the manifold module
export async function withModule<T>(
  fn: (module: ManifoldType) => T
): Promise<T> {
  const module = await manifoldContext.getModule();
  return fn(module);
}
