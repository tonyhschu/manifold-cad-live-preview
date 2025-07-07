# Browser UI Development Workflow

## Overview

This document outlines the development workflow for the configurator UI in the V3 architecture. The key insight is that the configurator is a **library-only package** that requires a V3 pipeline environment to function, so we develop it within a user project context rather than as a standalone application.

## Current Problem

In the V3 migration, we broke the `npm run dev` workflow inside the configurator folder because:

1. **Configurator became library-only** - No longer a standalone app
2. **Requires V3 pipeline infrastructure** - Needs dual-server setup (pipeline compiler + UI server)
3. **Needs pipeline artifacts** - Requires `/temp/pipeline.js` and `/temp/manifest.json` to function
4. **Source-based development** - Uses direct source imports instead of built packages

## Solution: Development in Create-App Context

### Core Principle

**The configurator source code stays in `packages/configurator/src/` but development happens in `packages/create-app/` using source-based imports.**

### Division of Responsibilities

#### **Configurator Package** (`packages/configurator/`)
- **Source of truth** for all UI JavaScript, CSS, and components
- Contains configurator logic, styling, web components
- Exports `startConfigurator()` API for library consumers
- **Library-only** - no standalone application capability
- **No development server** - relies on consumer projects for development environment

#### **Create-App Package** (`packages/create-app/`)
- **Development environment** for configurator UI changes
- Contains V3 dual-server setup (pipeline compiler + UI server)
- Has example models for testing configurator features
- **Consumer** of configurator library via source-based imports
- Provides the infrastructure configurator needs to function

## Development Workflow

### 1. **Start Development Environment**

```bash
cd packages/create-app
npm run dev
```

This starts:
- **Pipeline compiler** (watches model files, builds `/temp/pipeline.js`)
- **UI server** (serves at localhost:5173 with HMR)
- **Source-based imports** (configurator imported directly from `packages/configurator/src/`)

### 2. **Make UI Changes**

Edit files in their original locations:
- **JavaScript/TypeScript**: `packages/configurator/src/**/*.ts`
- **CSS**: `packages/configurator/src/style.css`
- **Components**: `packages/configurator/src/components/**/*`

### 3. **See Changes Immediately**

- **HMR triggers** automatically when you save files
- **Browser updates** within 1-2 seconds
- **No build step** required during development

### 4. **Test with Real Pipeline**

- **Edit model files** in `packages/create-app/main.ts` or `components/`
- **Pipeline rebuilds** automatically
- **UI updates** to reflect new models/parameters
- **Full V3 workflow** available for testing

## Technical Implementation

### Source-Based Development Setup

The key is Vite alias configuration that points imports directly to source files:

```typescript
// packages/create-app/vite.config.ts
resolve: {
  alias: {
    '@manifold-studio/configurator': resolve(__dirname, '../packages/configurator/src'),
    '@manifold-studio/wrapper': resolve(__dirname, '../packages/wrapper/src')
  }
}
```

When `packages/create-app/src/main.ts` imports:
```typescript
import { startConfigurator } from '@manifold-studio/configurator';
```

Vite resolves it to `packages/configurator/src/index.ts` directly, enabling:
- ✅ **Immediate TypeScript compilation** via Vite
- ✅ **Native HMR** for all configurator files
- ✅ **No build chain complexity** during development
- ✅ **Real-time CSS updates** without page refresh

### File Structure

```
packages/
├── configurator/           # Library source code
│   ├── src/               # ← Edit these files
│   │   ├── style.css      # ← CSS changes here
│   │   ├── components/    # ← Component changes here
│   │   └── index.ts       # ← Main library exports
│   └── package.json       # Library-only scripts
│
├── create-app/            # Development environment
│   ├── src/main.ts        # Imports configurator library
│   ├── vite.config.ts     # Source-based aliases
│   ├── main.ts            # Example models
│   └── package.json       # Development scripts
│
└── wrapper/               # WASM bindings (built separately)
    └── dist/              # Pre-built for development
```

## Migration Plan

### Phase 1: Set Up Create-App Development Environment

1. **Copy V3 setup** from `test-v3-development` to `packages/create-app`
2. **Add source-based aliases** for configurator development
3. **Update npm scripts** for dual-server development
4. **Add example models** for testing configurator features

### Phase 2: Update Configurator Package

1. **Remove standalone dev command** from `packages/configurator/package.json`
2. **Update scripts** to focus on library building and testing only
3. **Add development instructions** pointing to create-app workflow

### Phase 3: Update Documentation

1. **Update DEVELOPMENT.md** to reflect new workflow
2. **Add clear instructions** for configurator UI development
3. **Document the source-based development approach**

### Phase 4: Test and Validate

1. **Verify HMR works** for CSS, JavaScript, and TypeScript changes
2. **Test complete workflow** from UI changes to model updates
3. **Ensure library building** still works for publishing

## Benefits of This Approach

### ✅ **Architectural Alignment**
- Configurator remains library-only as designed
- Development happens in real user project context
- No duplication of V3 infrastructure

### ✅ **Developer Experience**
- **Immediate feedback** - changes appear in <2 seconds
- **Native HMR** - CSS updates without page refresh
- **Real pipeline testing** - full V3 workflow available
- **Familiar file locations** - edit configurator files where they live

### ✅ **Maintenance Benefits**
- **Single source of truth** for V3 development setup
- **No configuration drift** between development environments
- **Real user context** ensures library works as intended

## Comparison to Alternatives

### ❌ **Option 1: Fix configurator dev command**
- Would require duplicating entire V3 dual-server setup
- Creates maintenance burden (two V3 configs to keep in sync)
- Goes against library-only architecture principle
- Needs separate example models for configurator development

### ✅ **Option 2: Development in create-app (chosen)**
- Leverages existing working V3 setup
- Aligns with library-only architecture
- Single source of truth for development configuration
- Real user context for testing

## Success Criteria

After implementation, developers should be able to:

1. **Start development** with single command: `cd packages/create-app && npm run dev`
2. **Edit configurator files** in `packages/configurator/src/`
3. **See changes immediately** via HMR in browser
4. **Test with real models** using full V3 pipeline
5. **Build library** for publishing without issues

## Next Steps

1. **Implement Phase 1** - Set up create-app development environment
2. **Test workflow** - Verify HMR works for all file types
3. **Update documentation** - Reflect new development approach
4. **Validate end-to-end** - Ensure library building and publishing still work

This approach maintains the clean separation between library code and development environment while providing an excellent developer experience for configurator UI development.
