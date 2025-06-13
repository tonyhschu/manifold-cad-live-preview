# @manifold-studio/wrapper

A synchronous TypeScript wrapper for [ManifoldCAD](https://github.com/elalish/manifold) with operation tracking, export utilities, and headless pipeline support.

## 🚀 The Problem This Solves

ManifoldCAD is an excellent 3D modeling library, but it's distributed as a WASM module that requires async initialization. This creates friction when trying to:

- Use ManifoldCAD with the broader NPM ecosystem
- Write clean, synchronous modeling code
- Integrate with modern TypeScript tooling
- Build development environments with hot reloading

**@manifold-studio/wrapper** solves this by providing a **synchronous API** that handles all the async complexity behind the scenes using top-level await.

## ✨ Key Features

- **🔄 Synchronous API** - Write clean modeling code without async/await
- **📊 Operation Tracking** - Debug and visualize your modeling operations
- **📦 Export Utilities** - Built-in OBJ and GLB export functions
- **⚡ Pipeline Ready** - Headless generation for CI/CD and automation
- **🎛️ Parametric System** - Type-safe parameter definitions with UI generation
- **🔍 Full Type Safety** - Complete TypeScript definitions
- **🪶 Zero Overhead** - Transparent proxy to original ManifoldCAD API

## 📦 Installation

```bash
npm install @manifold-studio/wrapper
```

## 🚀 Quick Start

```typescript
import { Manifold, exportToOBJ } from "@manifold-studio/wrapper";

// Create 3D models with synchronous API - no async/await needed!
const box = Manifold.cube([20, 15, 10], true);
const sphere = Manifold.sphere(8);
const result = Manifold.difference(box, sphere);

// Export to file formats
const objData = exportToOBJ(result);
console.log("Generated OBJ:", objData);
```

That's it! No WASM initialization, no async complexity - just clean modeling code.

## 🔧 Core Features

### Synchronous ManifoldCAD API

The wrapper provides transparent access to the complete ManifoldCAD API, but synchronously:

```typescript
import { Manifold, CrossSection } from "@manifold-studio/wrapper";

// All the ManifoldCAD operations you know and love
const cube = Manifold.cube([10, 10, 10]);
const cylinder = Manifold.cylinder(5, 10);
const union = Manifold.union([cube, cylinder]);

// Cross-section operations
const square = CrossSection.square([5, 5]);
const circle = CrossSection.circle(3);
const extruded = square.extrude(10);
```

### Operation Tracking

Track the history of operations for debugging and visualization:

```typescript
import { Manifold, getOperationRegistry } from "@manifold-studio/wrapper";

// Create some operations
const box = Manifold.cube([10, 10, 10]);
const sphere = Manifold.sphere(5);
const result = Manifold.difference([box, sphere]);

// Access the operation history
const registry = getOperationRegistry();
const operations = registry.buildTree(result.getOperationId());

console.log(
  "Operation chain:",
  operations.map((op) => op.type)
);
// Output: ['cube', 'sphere', 'difference']
```

### Export Utilities

Built-in export functions for common 3D formats:

```typescript
import { Manifold, exportToOBJ, manifoldToGLB } from "@manifold-studio/wrapper";

const model = Manifold.cube([20, 20, 20]);

// Export to OBJ format
const objResult = exportToOBJ(model, { filename: "my-cube.obj" });
console.log(objResult.content); // OBJ file content

// Export to GLB format (requires @gltf-transform/core)
const glbBuffer = await manifoldToGLB(model);
// Save glbBuffer to file
```

### Parametric Configuration System

Create type-safe parametric models with automatic UI generation:

````typescript
import { Manifold, P, createConfig } from "@manifold-studio/wrapper";

// Define parameters with types and constraints
const boxConfig = createConfig(
  {
    width: P.number(20, 5, 50, 1), // value, min, max, step
    height: P.number(15, 5, 50, 1),
    depth: P.number(10, 5, 50, 1),
    centered: P.boolean(true),
    material: P.choice("plastic", ["plastic", "metal", "wood"]),
  },
  (params) => {
    // Generate model using parameters
    return Manifold.cube(
      [params.width, params.height, params.depth],
      params.centered
    );
  },
  {
    name: "Parametric Box",
    description: "A customizable box with adjustable dimensions",
  }
);

// Use in applications
const model = boxConfig.generateModel(boxConfig.getDefaults());

## 📚 API Reference

### Core Manifold API

All ManifoldCAD functions are re-exported synchronously:

```typescript
// Static construction methods
Manifold.cube(size: Vec3 | number, center?: boolean): Manifold
Manifold.sphere(radius: number, circularSegments?: number): Manifold
Manifold.cylinder(height: number, radiusLow: number, radiusHigh?: number): Manifold
Manifold.tetrahedron(): Manifold

// Boolean operations
Manifold.union(manifolds: Manifold[]): Manifold
Manifold.difference(manifolds: Manifold[]): Manifold
Manifold.intersection(manifolds: Manifold[]): Manifold

// Instance methods
manifold.translate(offset: Vec3): Manifold
manifold.rotate(angles: Vec3): Manifold
manifold.scale(factor: Vec3 | number): Manifold
manifold.getMesh(): MeshData
````

### Export Functions

```typescript
// OBJ export
exportToOBJ(manifold: Manifold, options?: ExportOptions): ExportResult
manifoldToOBJ(manifold: Manifold): string

// GLB export (async due to gltf-transform library)
manifoldToGLB(manifold: Manifold): Promise<ArrayBuffer>

// Types
interface ExportOptions {
  filename?: string;
}

interface ExportResult {
  content: string;
  filename: string;
}
```

### Operation Tracking

```typescript
// Get the global operation registry
getOperationRegistry(): OperationRegistry

// Registry methods
registry.get(id: string): OperationInfo | undefined
registry.buildTree(rootId: string): OperationInfo[]
registry.getAllOperations(): OperationInfo[]
registry.clear(): void

// Operation info structure
interface OperationInfo {
  id: string;
  type: string;
  inputIds: string[];
  metadata: Record<string, any>;
  timestamp: number;
}

// Tracked manifold methods
manifold.getOperationId(): string
```

### Pipeline Utilities

```typescript
// Parameter handling
isParametricConfig(obj: any): obj is ParametricConfig
extractDefaultParams(config: ParametricConfig): Record<string, any>
mergeParameters(defaults: Record<string, any>, userParams: Record<string, any>): Record<string, any>
parseParameterString(paramStr: string): Record<string, any>
parseParameterValue(value: string): any
validateRequiredParameters(config: ParametricConfig, params: Record<string, any>): void
getParameterInfo(config: ParametricConfig): Array<{name: string, type: string, value: any}>
```

### Parametric Types

```typescript
// Parameter builders
P.number(value: number, min: number, max: number, step?: number): TweakpaneNumberParam
P.boolean(value: boolean): TweakpaneBooleanParam
P.string(value: string): TweakpaneStringParam
P.choice<T>(value: T, options: T[]): TweakpaneParam<T>

// Configuration creator
createConfig<T>(
  parameters: T,
  generateModel: (params: ExtractParamTypes<T>) => Manifold,
  metadata?: { name?: string; description?: string }
): ParametricConfig

// Types
interface ParametricConfig {
  parameters: Record<string, ParameterConfig>;
  generateModel: (params: any) => Manifold;
  metadata?: { name?: string; description?: string };
  getDefaults(): Record<string, any>;
}
```

## 📊 Operation Tracking Deep Dive

Operation tracking allows you to understand and debug the sequence of operations that created a 3D model.

### How It Works

The wrapper uses JavaScript Proxies to intercept ManifoldCAD operations and record them in a global registry:

```typescript
import { Manifold, getOperationRegistry } from "@manifold-studio/wrapper";

// Each operation gets a unique ID and is tracked
const box = Manifold.cube([10, 10, 10]); // op_0: cube
const sphere = Manifold.sphere(5); // op_1: sphere
const moved = sphere.translate([5, 0, 0]); // op_2: translate (input: op_1)
const result = Manifold.difference(box, moved); // op_3: difference (inputs: op_0, op_2)

// Access the operation tree
const registry = getOperationRegistry();
const tree = registry.buildTree(result.getOperationId());

console.log("Operations in dependency order:");
tree.forEach((op) => {
  console.log(`${op.id}: ${op.type} (inputs: ${op.inputIds.join(", ")})`);
});
```

### Use Cases

- **Debugging**: Understand why a model looks unexpected
- **Visualization**: Show operation history in development tools
- **Optimization**: Identify redundant operations
- **Documentation**: Auto-generate model creation steps

### Accessing Operation Data

```typescript
// Get detailed information about any operation
const registry = getOperationRegistry();
const operation = registry.get("op_3");

console.log({
  id: operation.id, // 'op_3'
  type: operation.type, // 'difference'
  inputIds: operation.inputIds, // ['op_0', 'op_2']
  timestamp: operation.timestamp,
  metadata: operation.metadata,
});

// Clear the registry (useful for testing)
registry.clear();
```

## 📦 Export Capabilities

The wrapper provides built-in export functionality for common 3D file formats.

### OBJ Export

```typescript
import { Manifold, exportToOBJ, manifoldToOBJ } from "@manifold-studio/wrapper";

const model = Manifold.sphere(10);

// Method 1: Full export with metadata
const result = exportToOBJ(model, { filename: "sphere.obj" });
console.log(result.filename); // 'sphere.obj'
console.log(result.content); // OBJ file content

// Method 2: Just get the OBJ string
const objString = manifoldToOBJ(model);
```

### GLB Export

GLB export requires the `@gltf-transform/core` dependency and is asynchronous:

```typescript
import { Manifold, manifoldToGLB } from "@manifold-studio/wrapper";

const model = Manifold.cube([20, 20, 20]);

// Export to GLB binary format
const glbBuffer = await manifoldToGLB(model);

// Save to file (Node.js)
import { writeFileSync } from "fs";
writeFileSync("model.glb", Buffer.from(glbBuffer));

// Or create download link (browser)
const blob = new Blob([glbBuffer], { type: "model/gltf-binary" });
const url = URL.createObjectURL(blob);
```

### Export Options

```typescript
interface ExportOptions {
  filename?: string; // Default filename for the export
}

interface ExportResult {
  content: string; // File content
  filename: string; // Resolved filename
}
```

## ⚡ Pipeline Integration

The wrapper includes utilities that power headless 3D model generation in command-line environments.

### Parameter Processing

```typescript
import {
  parseParameterString,
  mergeParameters,
  extractDefaultParams,
} from "@manifold-studio/wrapper";

// Parse command-line parameter strings
const params = parseParameterString("width=20,height=15,centered=true");
// Result: { width: 20, height: 15, centered: true }

// Merge with defaults
const defaults = { width: 10, height: 10, depth: 5 };
const merged = mergeParameters(defaults, params);
// Result: { width: 20, height: 15, depth: 5 }
```

### Parametric Config Validation

````typescript
import {
  isParametricConfig,
  validateRequiredParameters,
  getParameterInfo,
} from "@manifold-studio/wrapper";

// Check if an export is a parametric config
if (isParametricConfig(modelExport)) {
  // Extract parameter information
  const paramInfo = getParameterInfo(modelExport);
  console.log("Available parameters:", paramInfo);

  // Validate user parameters
  const userParams = { width: 25, invalidParam: "test" };
  validateRequiredParameters(modelExport, userParams);
}

## 🔧 Technical Details

### WASM Loading Strategy

The wrapper solves the "WASM async problem" using **top-level await**:

```typescript
// In src/lib/manifold.ts
import ManifoldModule from 'manifold-3d';

// Top-level await - this blocks module loading until WASM is ready
const manifoldModule = await ManifoldModule();
manifoldModule.setup();

// Now we can export synchronous functions
export function cube(size: Vec3 | number, center = false): Manifold {
  return manifoldModule.Manifold.cube(size, center); // Synchronous!
}
````

**How it works:**

1. When JavaScript loads the wrapper module, it sees the top-level await
2. Module loading pauses until the WASM module initializes
3. Only after WASM is ready does the module finish loading
4. All exported functions can now use the initialized WASM synchronously

This concentrates all async complexity at application startup, keeping your modeling code clean and synchronous.

### Proxy Architecture for Operation Tracking

Operation tracking uses JavaScript Proxies to intercept method calls without modifying the original ManifoldCAD API:

```typescript
// Simplified version of the tracking implementation
export function createTrackedManifold(OriginalManifold) {
  return new Proxy(OriginalManifold, {
    construct(target, args) {
      const instance = new target(...args);
      return createTrackedInstance(instance);
    },

    get(target, prop) {
      const value = target[prop];
      if (typeof value === "function") {
        return function (...args) {
          const result = value.apply(target, args);

          // If result is a Manifold, track the operation
          if (isManifoldInstance(result)) {
            const operationId = registry.generateId();
            registry.register({
              id: operationId,
              type: prop,
              inputIds: extractInputIds(args),
              metadata: {},
              timestamp: Date.now(),
            });

            // Attach operation ID to result
            result.getOperationId = () => operationId;
          }

          return result;
        };
      }
      return value;
    },
  });
}
```

This approach provides:

- **Zero API changes** - Original ManifoldCAD API is preserved exactly
- **Transparent tracking** - Operations are recorded automatically
- **Minimal overhead** - Proxy calls are very fast
- **Complete coverage** - All operations are tracked, including chained calls

### Type Safety

The wrapper provides complete TypeScript definitions:

```typescript
// All original types are preserved and re-exported
export type Vec3 = [number, number, number];
export type ManifoldType = /* original Manifold type */;

// Additional wrapper-specific types
export interface OperationInfo {
  id: string;
  type: string;
  inputIds: string[];
  metadata: Record<string, any>;
  timestamp: number;
}

// Parametric system types with full inference
export type ExtractParamTypes<T> = {
  [K in keyof T]: T[K] extends TweakpaneParam<infer U> ? U : never;
};
```

### Performance Considerations

- **WASM Loading**: One-time cost at application startup
- **Operation Tracking**: Minimal overhead (~1-2% performance impact)
- **Memory Usage**: Operation registry grows with model complexity
- **Export Performance**: OBJ export is fast, GLB export has some overhead due to gltf-transform

**Optimization tips:**

- Clear operation registry periodically: `getOperationRegistry().clear()`
- Disable tracking in production if not needed
- Use OBJ export for better performance when GLB features aren't required

## 🚨 Troubleshooting

### Common Issues

#### "Module not found" or WASM loading errors

```bash
Error: Cannot resolve module 'manifold-3d'
```

**Solution**: Ensure `manifold-3d` is installed:

```bash
npm install manifold-3d
```

#### Top-level await not supported

```bash
SyntaxError: Unexpected reserved word 'await'
```

**Solution**: Ensure your environment supports top-level await:

- Node.js 14.8+ with `"type": "module"` in package.json
- Modern bundlers (Vite, Webpack 5+, Rollup)
- Modern browsers (Chrome 89+, Firefox 89+, Safari 15+)

#### TypeScript errors with Manifold types

```bash
Property 'cube' does not exist on type 'typeof Manifold'
```

**Solution**: Ensure TypeScript can find the type definitions:

```json
// tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true
  }
}
```

#### GLB export fails

```bash
Error: @gltf-transform/core not found
```

**Solution**: Install the optional GLB dependency:

```bash
npm install @gltf-transform/core
```

### Performance Issues

#### Slow model generation

- Check operation registry size: `getOperationRegistry().getAllOperations().length`
- Clear registry if it's large: `getOperationRegistry().clear()`
- Profile your model code for inefficient operations

#### Memory leaks

- Operation registry holds references to operation metadata
- Clear registry periodically in long-running applications
- Consider disabling tracking in production builds

## 🎯 Advanced Usage

### Custom Operation Metadata

You can attach custom metadata to operations for enhanced tracking:

```typescript
import { Manifold, getOperationRegistry } from "@manifold-studio/wrapper";

// The registry automatically captures operation info, but you can add custom metadata
const box = Manifold.cube([10, 10, 10]);
const registry = getOperationRegistry();

// Find the operation and add metadata
const operations = registry.getAllOperations();
const cubeOp = operations.find((op) => op.type === "cube");
if (cubeOp) {
  cubeOp.metadata.purpose = "base structure";
  cubeOp.metadata.material = "steel";
}
```

### Working with the Operation Registry

```typescript
// Get all operations in chronological order
const allOps = registry.getAllOperations();

// Find operations by type
const booleanOps = allOps.filter((op) =>
  ["union", "difference", "intersection"].includes(op.type)
);

// Build dependency graph
function buildDependencyGraph(rootId: string) {
  const tree = registry.buildTree(rootId);
  const graph = new Map();

  tree.forEach((op) => {
    graph.set(op.id, {
      operation: op,
      dependencies: op.inputIds.map((id) => registry.get(id)).filter(Boolean),
    });
  });

  return graph;
}
```

## 🤝 Contributing

### Development Setup

```bash
# Clone the repository
git clone https://github.com/your-org/manifold-studio.git
cd manifold-studio

# Install dependencies
npm install

# Build the wrapper package
cd packages/wrapper
npm run build

# Run tests
npm test

# Watch mode for development
npm run dev
```

### Testing

The wrapper uses Vitest for testing:

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Test specific functionality
npm test -- --grep "operation tracking"
```

### Architecture Decisions

**Why Proxies for Tracking?**

- Preserves the original ManifoldCAD API exactly
- No performance overhead for non-tracked usage
- Automatic coverage of all operations including future additions

**Why Top-Level Await?**

- Concentrates async complexity at module boundaries
- Enables clean, synchronous modeling code
- Works with modern JavaScript environments

**Why Global Operation Registry?**

- Simple to use across different parts of an application
- Avoids threading operation context through all function calls
- Easy to clear/reset for testing

### Code Style

- Use TypeScript for all source files
- Follow existing naming conventions
- Add JSDoc comments for public APIs
- Include tests for new functionality

## 📄 License

MIT License - see the [LICENSE](../../LICENSE) file for details.

## 🔗 Related Projects

- **[ManifoldCAD](https://github.com/elalish/manifold)** - The underlying 3D modeling library
- **[@manifold-studio/configurator](../configurator)** - Browser-based development environment
- **[@manifold-studio/create-app](../create-app)** - Project scaffolding tool

---

**Built with ❤️ for the 3D modeling community**
