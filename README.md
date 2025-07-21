# Manifold Studio

A modern TypeScript framework for 3D CAD model development with live preview and parametric controls.

## 🚀 Quick Start

Get started with a new 3D modeling project in seconds:

```bash
# Create a new project
npx @manifold-studio/create-app my-3d-project

# Start developing
cd my-3d-project
npm install
npm run dev
```

This single command automatically:

- **Discovers your models** (main.ts + components/)
- **Starts development servers** (UI server on port 3000 + pipeline compiler on port 3001)
- **Watches for changes** and regenerates pipeline entries
- **Opens browser** with live 3D preview and parameter controls

**What you get:**

- **3D Canvas**: Real-time model preview with camera controls
- **Parameter Panel**: Sliders and controls for your model parameters
- **Export Tools**: Download STL, OBJ, GLB files instantly
- **Hot Reloading**: Edit code and see changes immediately
- **Automatic Model Discovery**: Add new .ts files and they appear instantly
- **End-to-End Testing**: Comprehensive browser-based testing with Playwright

## Overview

Manifold Studio provides a unified development experience powered by the **Manifold Studio CLI**:

- **Unified CLI**: Single `npm run dev` command handles everything automatically
- **Automatic Model Discovery**: New model files are detected and integrated instantly
- **Live Development**: Hot module reloading with real-time parameter adjustment
- **Pipeline Integration**: Seamless compilation and manifest generation
- **Export Capabilities**: Multiple format support (OBJ, GLB, STL)

The CLI uses the same underlying TypeScript API built on [ManifoldCAD](https://github.com/elalish/manifold), ensuring consistency across development and production workflows.

## 📦 Project Scaffolding

### @manifold-studio/create-app

The `create-app` package provides a CLI tool for scaffolding new Manifold Studio projects:

```bash
# Create a new TypeScript project with full configurator UI
npx @manifold-studio/create-app my-project

# Generated project structure:
my-project/
├── main.ts              # Your main 3D model with parametric controls
├── components/          # Additional model components
│   └── example.ts       # Example component
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Development server configuration
└── index.html           # HTML bootstrap
```

**Generated projects include:**

- **TypeScript by default** with full type safety
- **Parametric box example** with width, height, depth controls
- **Component system** for modular model development
- **Hot module reloading** for instant feedback
- **Export functionality** built-in

### Development Workflow for Generated Projects

```bash
cd my-project
npm run dev          # Start Manifold Studio CLI (handles everything)
# Edit main.ts       # See changes instantly in browser
# Add components/    # Automatically discovered and integrated
# No pipeline management needed - CLI handles it all
```

## 🖥️ Developing 3D Models

### Basic Model Structure

Every Manifold Studio model is a TypeScript function that returns a `Manifold` object:

```typescript
import { Manifold, P, createConfig } from "@manifold-studio/wrapper";

// Simple model function
function createBox(width = 20, height = 15, depth = 10) {
  return Manifold.cube([width, height, depth], true);
}

// Parametric configuration for UI controls
const boxConfig = createConfig(
  {
    width: P.number(20, 10, 100, 1),
    height: P.number(15, 10, 100, 1),
    depth: P.number(10, 5, 50, 1),
  },
  (params) => createBox(params.width, params.height, params.depth),
  {
    name: "Parametric Box",
    description: "A customizable box with adjustable dimensions",
  }
);
```

### Parameter Types

Define interactive controls for your models:

```typescript
import { P } from "@manifold-studio/wrapper";

const config = createConfig(
  {
    // Numbers with min, max, step
    width: P.number(20, 1, 100, 0.5),

    // Booleans for toggles
    hasLid: P.boolean(true),

    // Strings for text input
    label: P.string("My Model"),

    // Choices for dropdowns
    material: P.choice("plastic", ["plastic", "metal", "wood"]),
  },
  (params) => {
    // Your model logic using params
    return createModel(params);
  }
);
```

### Component System

Organize complex models using components:

```typescript
// components/wheel.ts
export function createWheel(radius = 10, width = 5) {
  return Manifold.cylinder(width, radius);
}

// main.ts
import { createWheel } from "./components/wheel";

function createCar(wheelRadius = 10) {
  const wheel = createWheel(wheelRadius, 3);
  const body = Manifold.cube([40, 15, 8], true);

  // Position wheels
  const frontWheel = wheel.translate([-12, 0, -6]);
  const backWheel = wheel.translate([12, 0, -6]);

  return Manifold.union([body, frontWheel, backWheel]);
}
```

## ⚡ Pipeline Mode - Headless Generation

Generate 3D models from the command line for automation and CI/CD:

```bash
# Generate a model with default parameters
npm run pipeline packages/configurator/src/models/cube.ts

# Generate with custom parameters
npm run pipeline -- packages/configurator/src/models/parametric-hook.ts --params thickness=5,width=20

# Custom output filename
npm run pipeline -- packages/configurator/src/models/hook.ts --output my-hook.obj
```

**Perfect for:**

- Batch generation of model variants
- CI/CD integration
- Automated testing
- Production builds

## 🎨 Browser Mode - Interactive Development

The browser mode provides a live development environment with instant feedback:

### Features

- **Hot Module Replacement (HMR)**: Instant updates when you modify model code
- **Interactive Parameter Controls**: Real-time parameter adjustment
- **3D Visualization**: Built-in 3D viewer with camera controls
- **Multiple Export Formats**: Download models as OBJ or GLB files
- **Component Discovery**: Automatically finds models in your project

### Getting Started with Browser Mode

1. **Start the development server:**

   ```bash
   npm run dev
   ```

2. **Open your browser** to the displayed URL (typically `http://localhost:3000`)

3. **Select a model** from the dropdown to see it rendered in 3D

4. **Adjust parameters** using the control panel on the right

5. **Edit model code** in your editor and see changes instantly

## � Motivation

ManifoldCAD is great - I really wanted to use it with the rest of the NPM ecosystem. That meant that I had to solve the "WASM in Node.js" problem. Once I solved that, then I built a development environment on top of it. And then it sort of ... spiraled out of control. Here's what I wanted to build:

- **Code-First**: Define models in TypeScript with full IDE support
- **Version Control Friendly**: Models are just code - diff, merge, and collaborate naturally
- **Parametric by Design**: Built-in parameter system with automatic UI generation
- **Export Flexibility**: Generate STL, OBJ, GLB, and other formats programmatically
- **Modern Tooling**: Leverage the entire JavaScript ecosystem

Right now, this is an over-engineered solution for a code CAD environment for designing 3D printed toys for my kids, but perhaps it can be something more.

---

# 🔧 Manifold Studio Internals

_This section covers the internal architecture and development of Manifold Studio itself._

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

## 📦 Monorepo Architecture

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
│   ├── configurator/              # @manifold-studio/configurator
│   │   ├── src/                   # UI components and development environment
│   │   │   ├── components/        # UI components (canvas, controls)
│   │   │   ├── services/          # Service layer integration
│   │   │   ├── examples/          # Example 3D models
│   │   │   └── state/             # State management
│   │   └── tests/                 # Browser environment tests
│   └── create-app/                # @manifold-studio/create-app
│       ├── src/                   # CLI tool source
│       ├── templates/             # Project templates
│       └── bin/                   # Compiled CLI executable
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
  - Library exports for generated projects

- **@manifold-studio/create-app**: Project scaffolding tool
  - CLI for generating new projects
  - TypeScript project templates
  - Handlebars template processing
  - NPM link workflow for local development

## 🔧 Development Workflow

### V3 Architecture - CLI-Based Development

The V3 architecture uses the **Manifold Studio CLI** to provide a unified development experience:

#### Configurator Development

The configurator package **cannot be developed standalone**. Use the CLI development environment:

```bash
# Navigate to test project
cd test-v3-development

# Start CLI (automatically detects development mode)
npm run dev

# Edit configurator source files
# Changes in packages/configurator/src/ are reflected immediately via HMR
```

#### CLI Development Benefits

- **Single command**: `npm run dev` handles model discovery, pipeline generation, and dual servers
- **Automatic model discovery**: New .ts files are detected and integrated instantly
- **No manual pipeline management**: CLI generates pipeline entries automatically
- **Cross-package HMR**: Hot module replacement works across package boundaries
- **Immediate feedback**: Changes are visible instantly in the browser
- **Simplified workflow**: No need to understand pipeline infrastructure

#### Development vs Production

- **Development**: CLI automatically detects development mode for source-based imports
- **Production**: CLI uses published configurator package (when available)

### Cross-Package Development

For monorepo development when working on the framework itself:

1. **Wrapper changes** → TypeScript watch rebuilds automatically (~1-2 seconds)
2. **Configurator detects change** → Vite HMR updates the browser
3. **Total time**: ~2-3 seconds for cross-package changes

### Development Commands

```bash
# V3 CLI Development (Recommended)
cd test-v3-development
npm run dev                    # Start CLI (auto-detects configurator dev mode)

# Monorepo Development (for framework development)
npm run devAll                    # Start both wrapper watch + configurator dev server

# Individual packages
npm run dev:wrapper               # Wrapper in watch mode (rebuilds on changes)
npm run dev:configurator          # Configurator dev server with HMR
npm run dev:create-app            # Create-app in watch mode

# Building and testing
npm run build                     # Build all packages
npm run test                      # Test all packages (unit tests)
npm run test:e2e                  # End-to-end browser tests with Playwright
npm run test:wrapper              # Test wrapper package only
npm run test:configurator         # Test configurator package only
npm run test:create-app           # Test create-app package only
```

### Recommended Development Setup

**V3 CLI Approach (Preferred)**:

```bash
# Single terminal - CLI handles everything
cd test-v3-development
npm run dev
```

**Monorepo Development Approach** (for framework development):

```bash
# Terminal 1: Wrapper watch mode
npm run dev:wrapper

# Terminal 2: Configurator dev server
npm run dev:configurator

# Or use the convenience command:
npm run devAll
```

The V3 CLI approach provides the same functionality with a much simpler workflow.

### Testing Generated Projects

Use the test script to verify the scaffolding workflow:

```bash
# Test the complete scaffolding workflow
./packages/create-app/test-local.sh

# This will:
# 1. Build all packages
# 2. Create npm links
# 3. Generate a test project
# 4. Set up dependencies with npm link
# 5. Verify the project works
```

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
