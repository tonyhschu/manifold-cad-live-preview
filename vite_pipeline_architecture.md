# Vite Pipeline Architecture: Models as Library Modules

## Core Philosophy

**Mental Model**: Parametric models are library modules that get compiled just-in-time for Node.js consumption. This aligns perfectly with vite's design as a library bundler.

## Architecture Overview

```
Development Environment          Pipeline Environment
┌─────────────────────┐         ┌─────────────────────┐
│                     │         │                     │
│  npm run dev        │         │  npm run pipeline   │
│  ┌─────────────────┐│         │ ┌─────────────────┐ │
│  │ Vite Dev Server ││         │ │ Vite Build API  │ │
│  │                 ││         │ │                 │ │
│  │ TypeScript      ││         │ │ TypeScript      │ │
│  │ Hot Reload      ││         │ │ Library Mode    │ │
│  │ Browser Target  ││         │ │ Node.js Target  │ │
│  └─────────────────┘│         │ └─────────────────┘ │
└─────────────────────┘         └─────────────────────┘
          │                               │
          └─────── Same vite.config.js ───┘
          └─────── Same TypeScript compilation ─┘
```

## Models as Standard Library Modules

### Model Structure
```typescript
// src/models/gear.ts - Standard library module pattern
import { Manifold } from 'manifold-3d';     // External dependency
import { P, createConfig } from '../lib';   // Local dependencies

export const gearConfig = createConfig({
  teeth: P.number(20, 8, 100),
  module: P.number(2, 0.5, 10)
}, (params) => {
  return generateGear(params);
});

// Standard default export for library consumption
export default gearConfig;
```

### Dependency Model
```typescript
// Models follow standard JavaScript library patterns:

// External dependencies (peer dependencies)
import { Manifold } from 'manifold-3d';
import { scaleLinear } from 'd3-scale';

// Internal dependencies (bundled)
import { P } from '../lib/parameters';
import { createConfig } from '../types/config';
import { helperFunction } from '../utils/geometry';
```

## Vite Library Compilation

### Working with Vite's Design
```javascript
// This is exactly what vite lib mode is designed for
const compileModelLibrary = async (modelPath) => {
  await build({
    // Inherit project's vite configuration
    ...projectViteConfig,
    
    build: {
      lib: {
        entry: modelPath,              // Library entry point
        name: 'ModelLibrary',          // Library name
        formats: ['es'],               // ES module output
        fileName: 'model'              // Output filename
      },
      
      outDir: 'temp/pipeline',
      
      rollupOptions: {
        // Treat these as peer dependencies (like any npm library)
        external: [
          'manifold-3d',
          'd3-scale',
          // Other runtime dependencies
        ]
      }
    }
  });
  
  // Import the compiled library (standard ES module)
  const modelLibrary = await import('./temp/pipeline/model.js');
  return modelLibrary.default;
};
```

### Standard Output Format
```javascript
// Generated output is a normal ES module library:
// temp/pipeline/model.js

import { Manifold } from 'manifold-3d';
import { P, createConfig } from '../lib/index.js';

const gearConfig = createConfig(/* ... */);
export { gearConfig };
export default gearConfig;
```

## Implementation Components

### 1. Library Compiler
```javascript
// src/pipeline/library-compiler.js
import { build } from 'vite';
import path from 'path';

export class ModelLibraryCompiler {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.outputDir = path.join(projectRoot, 'temp/pipeline');
  }

  async compileModel(modelPath) {
    const libraryName = this.getLibraryName(modelPath);
    
    await build({
      configFile: path.join(this.projectRoot, 'vite.config.js'),
      
      build: {
        lib: {
          entry: path.resolve(this.projectRoot, modelPath),
          name: libraryName,
          formats: ['es'],
          fileName: 'model'
        },
        
        outDir: this.outputDir,
        
        rollupOptions: {
          external: this.getExternalDependencies()
        }
      },
      
      logLevel: 'warn' // Reduce build noise
    });
    
    return path.join(this.outputDir, 'model.js');
  }

  async loadCompiledLibrary(compiledPath) {
    // Standard ES module import
    const library = await import(`file://${compiledPath}`);
    return library.default;
  }

  getExternalDependencies() {
    // Standard peer dependency pattern
    return [
      'manifold-3d',
      'd3-scale',
      'd3',
      'clipper-lib'
      // Add other runtime dependencies that shouldn't be bundled
    ];
  }

  getLibraryName(modelPath) {
    const basename = path.basename(modelPath, path.extname(modelPath));
    return `${basename}Model`;
  }
}
```

### 2. Pipeline Runner
```javascript
// src/pipeline/runner.js
import { ModelLibraryCompiler } from './library-compiler.js';
import { validateParameters } from './parameter-validator.js';
import { exportModel } from './model-exporter.js';

export class PipelineRunner {
  constructor() {
    this.compiler = new ModelLibraryCompiler();
  }

  async runSingle(modelPath, params = {}, options = {}) {
    // Compile model as library module
    const compiledPath = await this.compiler.compileModel(modelPath);
    
    try {
      // Load compiled library
      const modelConfig = await this.compiler.loadCompiledLibrary(compiledPath);
      
      // Standard library usage pattern
      const validatedParams = validateParameters(modelConfig.parameters, params);
      const model = modelConfig.generateModel(validatedParams);
      
      // Export to requested formats
      const exports = await exportModel(model, {
        name: modelConfig.name || 'model',
        formats: options.formats || ['obj']
      });
      
      return {
        success: true,
        modelName: modelConfig.name,
        exports
      };
      
    } finally {
      // Cleanup temporary library files
      await this.cleanup(compiledPath);
    }
  }

  async runBatch(modelPath, batchConfig) {
    // Compile once, use many times
    const compiledPath = await this.compiler.compileModel(modelPath);
    
    try {
      const modelConfig = await this.compiler.loadCompiledLibrary(compiledPath);
      const results = [];
      
      for (const paramSet of batchConfig.parameterSets) {
        const result = await this.runModelGeneration(
          modelConfig, 
          paramSet.params, 
          { name: paramSet.name, ...batchConfig.options }
        );
        results.push(result);
      }
      
      return results;
      
    } finally {
      await this.cleanup(compiledPath);
    }
  }
}
```

### 3. CLI Interface
```bash
# Single model compilation and execution
npm run pipeline -- src/models/gear.ts --params teeth=24,module=2

# Batch processing with compiled library reuse
npm run pipeline -- src/models/hook.ts --batch configs/hook-variants.json

# Multiple output formats
npm run pipeline -- src/models/bracket.ts --formats obj,stl,glb
```

## Benefits of Library-First Approach

### 1. **Alignment with Vite's Design**
- Uses vite lib mode as intended
- Standard dependency externalization
- Normal rollup configuration patterns
- Follows established bundler conventions

### 2. **Standard JavaScript Patterns**
- Models are just library modules
- Dependencies follow npm patterns
- Output is standard ES modules
- Import/export using established conventions

### 3. **Ecosystem Compatibility**
- Could publish models as npm packages
- Standard tooling integration (TypeScript, linting, etc.)
- Familiar patterns for JavaScript developers
- Clear mental model for dependency management

### 4. **Performance Benefits**
- Vite's optimized bundling and tree-shaking
- Proper dependency externalization
- Built-in caching and incremental builds
- Rollup's efficient module bundling

## Examples from the Ecosystem

This pattern is used by many modern tools:

- **Astro**: Compiles `.astro` components to JavaScript libraries for SSR
- **SvelteKit**: Compiles Svelte components as libraries for different contexts
- **Nuxt**: Uses vite to compile Vue components for server-side execution
- **Storybook**: Compiles component libraries for different environments

## Implementation Phases

### Phase 1: Basic Library Compilation
- Implement `ModelLibraryCompiler`
- Test with existing TypeScript models
- Validate standard ES module output
- Verify dependency resolution

### Phase 2: Pipeline Integration
- Connect library compilation to model execution
- Implement parameter validation and model generation
- Add export format support
- Create CLI interface

### Phase 3: Batch Processing
- Optimize for library reuse in batch operations
- Add parallel processing capabilities
- Implement progress reporting
- Add batch configuration format

### Phase 4: Production Features
- Error handling and logging improvements
- Performance optimizations
- Integration testing framework
- Documentation and examples

## Technical Considerations

### Dependency Management
```javascript
// Clear separation between bundled and external dependencies
rollupOptions: {
  external: [
    // Runtime dependencies (peer deps)
    'manifold-3d',
    'd3-scale'
  ]
  // Internal utilities get bundled automatically
}
```

### Module Resolution
```typescript
// Standard library import patterns work consistently:
import { P } from '../lib/parameters';        // Bundled (relative)
import { scaleLinear } from 'd3-scale';       // External (npm)
import { Manifold } from 'manifold-3d';       // External (runtime)
```

### Output Consistency
```javascript
// Generated libraries follow standard ES module format:
export const modelConfig = { /* ... */ };
export default modelConfig;

// Can be imported like any library:
const model = await import('./compiled-model.js');
const result = model.default.generateModel(params);
```

This architecture treats models as first-class library modules, working with vite's intended design rather than against it, while maintaining perfect environment consistency between development and pipeline execution.