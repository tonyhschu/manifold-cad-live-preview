# Manifold Studio

A modern TypeScript framework for 3D CAD model development with live preview and headless generation capabilities. Built on ManifoldCAD and Vite, this project provides two complementary modes for 3D model development and production.

## Overview

This project offers a complete solution for parametric 3D modeling with two distinct operational modes:

### 🖥️ **Browser HMR Mode** - Interactive Development

- **Live preview** with instant hot module replacement (HMR)
- **Interactive parameter controls** using Tweakpane UI
- **Real-time model updates** as you edit code
- **3D visualization** with camera controls and export options
- **Perfect for**: Model development, parameter tuning, visual debugging

### ⚡ **Pipeline Mode** - Headless Generation

- **Command-line interface** for automated model generation
- **Batch processing** capabilities with parameter overrides
- **Programmatic output** in multiple formats (OBJ, GLB)
- **CI/CD integration** ready for automated workflows
- **Perfect for**: Production builds, batch generation, automation

Both modes share the same TypeScript codebase and model definitions, ensuring consistency between development and production environments.

## 📦 Monorepo Structure

This project uses a monorepo structure with NPM workspaces:

```
manifold-studio/
├── packages/
│   ├── wrapper/                    # @manifold-studio/wrapper
│   │   ├── src/                    # Core Manifold API wrapper
│   │   │   ├── lib/               # Manifold API with operation tracking
│   │   │   ├── pipeline/          # Headless generation capabilities
│   │   │   └── types/             # TypeScript definitions
│   │   └── tests/                 # Node.js environment tests
│   └── configurator/              # @manifold-studio/configurator
│       ├── src/                   # UI components and development environment
│       │   ├── components/        # UI components (canvas, controls)
│       │   ├── services/          # Service layer integration
│       │   ├── models/            # Example 3D models
│       │   └── state/             # State management
│       └── tests/                 # Browser environment tests
└── package.json                   # Workspace configuration
```

### Package Responsibilities

- **@manifold-studio/wrapper**: Core API wrapper with headless capabilities

  - ManifoldCAD API wrapper with top-level await pattern
  - Operation tracking system
  - Export utilities (OBJ, GLB)
  - Headless pipeline functionality for command-line generation

- **@manifold-studio/configurator**: UI components and development environment
  - Interactive UI components (canvas, parameter controls)
  - Service layer integration
  - State management and HMR integration
  - Development server setup

## 🚀 Quick Start

### Browser Mode (Development)

```bash
# Install dependencies
npm install

# Start full development environment (wrapper + configurator)
npm run devAll

# Or start components individually:
# npm run dev:wrapper    # Start wrapper in watch mode
# npm run dev:configurator  # Start configurator dev server
```

Open your browser to http://localhost:5174 to see live 3D models with interactive controls.

### Pipeline Mode (Generation)

```bash
# Generate a model with default parameters
npm run pipeline packages/configurator/src/models/cube.ts

# Generate with custom parameters
npm run pipeline -- packages/configurator/src/models/parametric-hook.ts --params thickness=5,width=20

# Custom output filename
npm run pipeline -- packages/configurator/src/models/hook.ts --output my-hook.obj
```

## 🔧 Development Workflow

### Cross-Package Development

When working with both packages, changes in the wrapper package need to propagate to the configurator:

1. **Wrapper changes** → TypeScript watch rebuilds automatically (~1-2 seconds)
2. **Configurator detects change** → Vite HMR updates the browser
3. **Total time**: ~2-3 seconds for cross-package changes

### Development Commands

```bash
# Full development environment
npm run devAll                    # Start both wrapper watch + configurator dev server

# Individual packages
npm run dev:wrapper               # Wrapper in watch mode (rebuilds on changes)
npm run dev:configurator          # Configurator dev server with HMR

# Building and testing
npm run build                     # Build all packages
npm run test                      # Test all packages
npm run test:wrapper              # Test wrapper package only
npm run test:configurator         # Test configurator package only
```

### Recommended Development Setup

For the best development experience, run both packages in watch mode:

```bash
# Terminal 1: Wrapper watch mode
npm run dev:wrapper

# Terminal 2: Configurator dev server
npm run dev:configurator

# Or use the convenience command:
npm run devAll
```

This ensures that changes to the wrapper package automatically rebuild and propagate to the configurator's live preview.

## 🖥️ Browser Mode - Interactive Development

Browser Mode provides a live development environment with instant feedback and interactive parameter controls.

### Features

- **Hot Module Replacement (HMR)**: Instant updates when you modify model code
- **Interactive Parameter Controls**: Tweakpane-based UI for real-time parameter adjustment
- **3D Visualization**: Built-in 3D viewer with camera controls
- **Multiple Export Formats**: Download models as OBJ or GLB files
- **State Preservation**: Camera position and UI state maintained during code updates

### Getting Started

1. **Start the development server:**

   ```bash
   npm run dev
   ```

2. **Open your browser** to the displayed URL (typically `http://localhost:5173`)

3. **Select a model** from the dropdown to see it rendered in 3D

4. **Adjust parameters** using the control panel on the right

5. **Edit model code** in your editor and see changes instantly

### Creating Models

Models can be created in two ways:

#### Function-Based Models

Simple models that export a function:

```typescript
// packages/configurator/src/models/my-cube.ts
import { Manifold } from "@manifold-studio/wrapper";

export default function createCube(size = 15, centered = true): ManifoldType {
  return Manifold.cube([size, size, size], centered);
}
```

#### Parametric Models

Advanced models with interactive parameter controls:

```typescript
// packages/configurator/src/models/my-parametric-model.ts
import { Manifold, P, createConfig } from "@manifold-studio/wrapper";
import type { ManifoldType } from "@manifold-studio/wrapper";

function createHook(thickness = 3, width = 13, radius = 10): ManifoldType {
  // Your model logic here
  return Manifold.cylinder(width, thickness / 2, thickness / 2);
}

export default createConfig(
  {
    thickness: P.number(3, 1, 10, 0.5),
    width: P.number(13, 5, 50, 1),
    radius: P.number(10, 5, 20, 0.5),
  },
  (params) => createHook(params.thickness, params.width, params.radius),
  {
    name: "My Hook",
    description: "A customizable hook model",
  }
);
```

### Parameter Types

The parameter system supports various input types:

- `P.number(default, min, max, step)` - Numeric sliders
- `P.boolean(default)` - Checkboxes
- `P.select(default, options)` - Dropdown selections
- `P.string(default)` - Text inputs
- `P.color(default)` - Color pickers

### HMR Integration

The HMR system automatically detects changes and updates the appropriate parts:

- **Model changes**: Reloads the current model while preserving camera position
- **UI changes**: Updates interface components without losing state
- **Parameter changes**: Refreshes controls and applies new values

## ⚡ Pipeline Mode - Headless Generation

Pipeline Mode enables automated, headless generation of 3D models from the command line, perfect for production workflows and batch processing.

### Features

- **Command-Line Interface**: Full CLI with help system and error handling
- **Parameter Override**: Specify custom parameters via command line
- **Multiple Model Types**: Supports both function-based and parametric models
- **Output Formats**: Generate OBJ files (GLB support planned)
- **TypeScript Compilation**: Just-in-time compilation using Vite
- **Error Handling**: Comprehensive error reporting and validation

### Basic Usage

```bash
# Generate model with default parameters
npm run pipeline packages/configurator/src/models/cube.ts

# Generate with custom parameters
npm run pipeline -- packages/configurator/src/models/parametric-hook.ts --params thickness=5,width=20

# Specify output filename
npm run pipeline -- packages/configurator/src/models/hook.ts --output custom-hook.obj

# Get help
npm run pipeline -- --help
```

### Parameter Syntax

Parameters are specified as comma-separated key=value pairs:

```bash
--params thickness=5,width=20,mountingType=magnetic,includeRounding=true
```

**Supported parameter types:**

- **Numbers**: `thickness=5`, `width=20.5`
- **Booleans**: `enabled=true`, `centered=false`
- **Strings**: `mountingType=magnetic`, `material=wood`

### Advanced Usage

```bash
# Complex parametric model with multiple parameters
npm run pipeline -- packages/configurator/src/models/parametric-hook.ts \
  --params thickness=4,width=25,hookRadius=15,segments=32,mountingType=adhesive \
  --output heavy-duty-hook.obj

# Function-based model with parameters
npm run pipeline -- packages/configurator/src/models/cube.ts \
  --params size=25,centered=false \
  --output large-cube.obj
```

### Pipeline Architecture

The pipeline uses Vite's library compilation mode to:

1. **Compile models as ES modules** using TypeScript
2. **Externalize dependencies** like manifold-3d for efficiency
3. **Import compiled modules** dynamically at runtime
4. **Generate output files** in the specified format

This approach ensures consistency between development and production environments while maintaining optimal performance.

### Integration with CI/CD

The pipeline is designed for automation:

```yaml
# Example GitHub Actions workflow
- name: Generate 3D Models
  run: |
    npm run pipeline packages/configurator/src/models/bracket.ts --params size=large
    npm run pipeline packages/configurator/src/models/hook.ts --params thickness=5
```

### Error Handling

The pipeline provides detailed error reporting:

- **Missing files**: Clear messages for non-existent model files
- **Parameter validation**: Warnings for unknown parameters
- **Compilation errors**: TypeScript compilation error details
- **Export failures**: Detailed error messages for export issues

## 🎯 Project Motivation

This project started with frustration trying to use ManifoldCAD as a library. The ManifoldCAD.org web editor works great, but it couldn't import other libraries like clipperjs or d3js. We needed ManifoldCAD to play well with the rest of the NPM ecosystem.

### The WASM Challenge

The main problem is that Manifold is a WASM module which requires async loading. This project solves that by providing a **synchronous modeling API** using top-level await.

### How It Works

When the JavaScript module system loads `manifold.ts`, it:

1. **Sees the top-level await** and waits for the promise to resolve
2. **Waits for WASM initialization** before continuing execution
3. **Only executes the rest** of the code after the WASM is loaded

The top-level await effectively turns the entire module into an asynchronous operation, but the JavaScript module system handles this behind the scenes. Any module that imports from `manifold.ts` will wait until the WASM initialization is complete.

Then, we export **synchronous functions** that use the already-initialized WASM module:

```typescript
// Export primitive creation functions
export function cube(size: Readonly<Vec3> | number, center = false): Manifold {
  return manifoldModule.Manifold.cube(size, center);
}
```

These functions don't need to be async because we know the module is already initialized.

### The Critical Path

**Application startup:**

- The browser loads `main.ts`
- It imports from `core/preview.ts`
- That imports from `lib/manifold.ts`
- JavaScript sees top-level await and waits for WASM to load
- Only after WASM is loaded does execution continue

**Model execution time:**

- When a user selects a model, it triggers `loadAndRenderModel`
- The model loader dynamically imports the model file
- The model file imports from `lib/manifold.ts`
- Since `manifold.ts` was already loaded and initialized, this import is instant
- The model function uses the already-initialized manifold module

### Result

This approach **concentrates all async complexity at the application boundaries** while keeping the core modeling code **pure and synchronous**. You can now:

- ✅ Use ManifoldCAD with any NPM library
- ✅ Write clean, synchronous modeling code
- ✅ Get instant hot module replacement
- ✅ Generate models from command line
- ✅ Integrate with modern TypeScript tooling

The only places where we still need async/await are:

1. Dynamic importing of model files (with `import()`)
2. GLB generation (because the glTF library has some async operations)

This gives you the best of both worlds: the power of ManifoldCAD with the ecosystem of modern JavaScript development.
