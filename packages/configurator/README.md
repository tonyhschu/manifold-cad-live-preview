# @manifold-studio/configurator

A library for creating interactive CAD model configurators with V3 pipeline integration.

## Overview

The configurator package provides a complete UI library for building interactive CAD model configurators. It integrates with the V3 pipeline architecture to provide real-time model generation, parameter adjustment, and hot module replacement (HMR) during development.

## Architecture

This package is designed as a **library-only** package. It does not provide standalone development capabilities. Instead, it should be developed and tested within the context of a user project using the `@manifold-studio/create-app` development environment.

### Key Components

- **V3Configurator**: Main configurator class that orchestrates the entire system
- **Model Services**: Handle pipeline loading, model generation, and state management
- **UI Components**: Parameter controls, model viewer, and model list
- **HMR Integration**: Hot module replacement for development workflow
- **State Management**: Reactive state system for UI updates

## Development Workflow

### ⚠️ Important: Library-Only Development

This package **cannot be developed standalone**. Use the following workflow:

1. **Navigate to create-app package**:
   ```bash
   cd packages/create-app
   ```

2. **Start development environment**:
   ```bash
   npm run dev
   ```

3. **Make changes to configurator source files**:
   - Edit files in `packages/configurator/src/`
   - Changes will be reflected immediately via HMR
   - No build step required during development

4. **View changes in browser**:
   - Open http://localhost:5173
   - Changes to configurator source files trigger automatic updates

### Why Library-Only?

The V3 architecture uses a dual-server setup (pipeline compiler + UI server) that requires coordination between multiple packages. The create-app environment provides:

- Source-based imports (no build chain during development)
- Proper Vite alias configuration for cross-package imports
- Pipeline compilation and manifest generation
- HMR integration across package boundaries

## Building

To build the library for distribution:

```bash
npm run build
```

This creates the distributable library files in `dist/lib/`.

## Testing

Run the test suite:

```bash
npm test          # Run all tests
npm run test:watch # Watch mode
```

## Usage

Once built, the configurator can be imported and used in user projects:

```typescript
import { startConfigurator } from '@manifold-studio/configurator';

// Initialize configurator
const container = document.getElementById('configurator');
startConfigurator(container, {
  pipelinePath: './temp/pipeline.js',
  manifestPath: './temp/manifest.json'
});
```

## Source-Based Development Notes

During development, this package is imported directly from source files using Vite aliases:

```typescript
// In create-app vite.config.ts
resolve: {
  alias: {
    '@manifold-studio/configurator': resolve(__dirname, '../configurator/src')
  }
}
```

This enables:
- ✅ No build step during development
- ✅ TypeScript compilation on-the-fly
- ✅ HMR across package boundaries
- ✅ Immediate feedback loop

When publishing packages, update the alias to point to the installed npm package instead.
