# Manifold Studio Project

## Monorepo Architecture

This project is a **monorepo** with 4 core NPM packages that work together to provide a complete 3D modeling development environment:

### 1. **@manifold-studio/wrapper** - Core 3D API
- Wraps ManifoldCAD WASM with synchronous API using top-level await
- Handles 3D operations (union, difference, intersection, etc.)
- Export capabilities (OBJ, GLB, 3MF formats)
- Operation tracking system for debugging
- **Location**: `packages/wrapper/`

### 2. **@manifold-studio/typeface** - Typography Integration
- Font loading and text-to-3D conversion
- Cross-platform font resolution (CDN + local files)
- Text rendering with hole detection for complex characters (O, P, B, etc.)
- Supports Inter, Roboto, Open Sans, Source Code Pro
- **Location**: `packages/typeface/`

### 3. **@manifold-studio/configurator** - Development Environment  
- Web Components + Preact Signals UI architecture
- CLI tool providing `npm run dev` experience
- Hot module replacement for instant feedback
- 3D viewer, parameter controls, model discovery
- Model compilation pipeline
- **Location**: `packages/configurator/`

### 4. **@manifold-studio/create-app** - Project Scaffolding
- CLI tool for `npm create @manifold-studio/app my-project`
- Creates new projects from templates with examples
- **Location**: `packages/create-app/`

## User Project Structure (Scaffolded Projects)

When users run `npm create @manifold-studio/app my-project`, they get:

```
my-project/
├── main.ts              # Main model (V3 format with global manifold)
├── components/          # Additional model components  
│   ├── example.ts       # Sphere example (createConfig format)
│   └── wheel.ts         # Component example
├── package.json         # Dependencies (includes all @manifold-studio packages)
├── tsconfig.json        # TypeScript configuration
└── vite.config.ts       # Development server configuration
```

### Two Model Patterns:

**V3 Format** (main.ts):
```typescript
export default {
  name: "My Model",
  parameters: { width: { value: 10, min: 1, max: 100 } },
  generateModel: (params) => {
    const manifold = globalThis.manifold; // Global access
    return manifold.cube([params.width, 10, 5]);
  }
};
```

**Modern Format** (components/):
```typescript
import { Manifold, P, createConfig } from '@manifold-studio/wrapper';

export default createConfig(
  { width: P.number(10, 1, 100) },
  (params) => Manifold.cube([params.width, 10, 5]),
  { name: "My Model" }
);
```

## Development vs Production

- **reference-project/**: Enhanced development project with extensive examples and testing
- **Scaffolded projects**: Minimal starter with room for user customization
- **Development mode**: CLI auto-detects and uses source packages for HMR
- **Production mode**: CLI uses published packages from NPM

## Common Commands

**For Development (in reference-project/ or user projects):**
- `npm run dev`: Start CLI development server with HMR
- `npm run build`: Build project for production
- `npm run test`: Run project-specific tests

**For Monorepo Development:**
- `npm run build`: Build all packages
- `npm run test`: Run all package tests with Vitest workspace
- `npm run test:watch`: Run tests in watch mode
- `npm run test:e2e`: Run end-to-end browser tests with Playwright
- `npm run devAll`: Start cross-package development with HMR

**Individual Package Commands:**
- `npm run test:wrapper`: Test wrapper package only
- `npm run test:configurator`: Test configurator package only
- `npm run test:typeface`: Test typeface package only
- `npm run test:create-app`: Test create-app package only

## Key Directories & Files

**Development Project:**
- `reference-project/`: Enhanced development project with extensive examples
- `reference-project/components/`: Example models including typeface integration
- `reference-project/assets/fonts/`: Local font files for development

**Package Structure:**
- `packages/wrapper/src/lib/manifold.ts`: Core Manifold API with top-level await
- `packages/typeface/src/`: Font loading and text rendering system
- `packages/configurator/src/cli/`: CLI implementation for `npm run dev`
- `packages/create-app/templates/basic/`: Template for scaffolded projects

## Typeface Integration Capabilities

The project has comprehensive typography support via `@manifold-studio/typeface`:

**Features:**
- Font loading from CDN (Inter, Roboto, Open Sans, Source Code Pro)  
- Local font file support (TTF files in assets/fonts/)
- Text-to-3D conversion with accurate hole detection
- Character-by-character processing for complex text
- Cross-platform compatibility (browser + Node.js)

**Usage Patterns:**
```typescript
import { fontLoader, fonts } from '@manifold-studio/typeface';

async function createText(text: string) {
  await fonts.ensureReady();
  const renderText = fontLoader('Inter');
  const crossSection = renderText(text, { fontSize: 16 });
  return crossSection.extrude(3);
}
```

## Architecture Achievements

✅ **Library Extraction Completed**: Core ManifoldCAD functionality extracted into `@manifold-studio/wrapper`  
✅ **Modular Design**: Clean separation between 3D ops, typography, UI, and scaffolding  
✅ **Cross-Platform**: Works in browser and Node.js environments  
✅ **Developer Experience**: Full HMR, testing, and CLI workflow  
✅ **Typography Integration**: Sophisticated font rendering capabilities

## Project Repository

Github repo URL: https://github.com/tonyhschu/manifold-cad-live-preview/