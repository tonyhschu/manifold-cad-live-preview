# Manifold Studio Development Guide

## Overview

This guide covers the development workflow for the V3 pipeline-based architecture. We have multiple moving pieces that need to work together smoothly.

## Architecture Components

### 1. **Wrapper Package** (`packages/wrapper`)

- **Purpose**: Manifold WASM bindings and utilities
- **Build**: TypeScript → ESM library
- **Used by**: User projects, configurator, pipeline models

### 2. **Configurator Package** (`packages/configurator`)

- **Purpose**: UI library for model visualization and parameter control
- **Build**: TypeScript → ESM library only (no standalone app)
- **Used by**: User projects (as library)
- **Development**: Test in `test-v3-development`, not as standalone app

### 3. **Create-App Package** (`packages/create-app`)

- **Purpose**: Scaffolding tool for new user projects
- **Build**: TypeScript → CLI tool
- **Creates**: User projects with V3 dual-server setup

### 4. **User Projects** (e.g., `test-v3-development`)

- **Purpose**: Regular NPM projects where users build models
- **Architecture**: Dual Vite servers (pipeline compiler + UI server)
- **Dependencies**: Wrapper (for models), Configurator (for UI)

## Development Workflows

### 🔧 **Initial Setup (Required Once)**

**Source-Based Development**: We use Vite aliases to import source files directly, eliminating build chain complexity and caching issues.

```bash
# 1. Install dependencies in test project
cd test-v3-development
npm install
cd ..

# 2. Build wrapper package (only needed once, or when wrapper changes)
cd packages/wrapper
npm run build
cd ../..
```

**Note**: The configurator is imported directly from source files - no build step needed during development!

**Why source-based?** This approach provides:

- ✅ **Immediate feedback**: Changes appear in <2 seconds
- ✅ **No caching issues**: Direct source imports eliminate npm link complexity
- ✅ **Native HMR**: Vite handles TypeScript compilation automatically
- ✅ **Clear debugging**: Direct source file error messages

### 🚀 **Quick Start (Most Common)**

For day-to-day V3 development (after initial setup):

```bash
# NEW V3 CLI approach (recommended)
cd test-v3-development
npm run dev:v3
```

This starts the **unified configurator CLI** which automatically:

- ✅ **Discovers models** in your project (main.ts + components/)
- ✅ **Generates pipeline entries** automatically
- ✅ **Starts dual servers**: UI (port 3000) + Pipeline compiler (port 3001)
- ✅ **Watches for file changes** and regenerates pipeline automatically
- ✅ **Configurator source changes**: Immediate HMR updates (<2 seconds)
- ✅ **Model file changes**: Auto-regenerates pipeline + updates UI
- ✅ **No manual pipeline management** required

**Legacy approach** (still available):

```bash
# Old dual-server approach (manual pipeline management)
cd test-v3-development
npm run dev  # Uses concurrently + manual Vite configs
```

**Optional**: If you're also developing the wrapper package:

```bash
# Terminal 1: Wrapper auto-rebuild (only if changing wrapper)
cd packages/wrapper && npm run dev

# Terminal 2: V3 CLI approach
cd test-v3-development && npm run dev:v3
```

### 🔧 **Individual Package Development**

#### Wrapper Development

```bash
# Watch mode (auto-rebuild library)
cd packages/wrapper
npm run dev  # or npm run build:lib -- --watch

# Test changes
npm test
```

#### Configurator Development

**Source-based development** - no build step needed! Changes are immediately visible.

```bash
# NEW: Use V3 CLI for best development experience
cd test-v3-development
npm run dev:v3

# Legacy: Old approach still works
npm run dev

# Test configurator changes
# Edit files in packages/configurator/src/ and see immediate results
```

**Key V3 CLI Benefits for Configurator Development**:

- ✅ **Automatic pipeline regeneration** when you add/remove model files
- ✅ **Unified development server** with consistent Vite alias configuration
- ✅ **Better import resolution** - package imports work in generated pipeline files
- ✅ **Reduced generated code** - shared types/functions moved to library
- ✅ **File watching** - no manual pipeline entry management

#### Create-App Development

```bash
cd packages/create-app
npm run dev  # Template development (if needed)

# Test scaffolding (primary development workflow)
npm run test:scaffold
```

**Note**: Create-app is primarily a scaffolding tool. Most development happens in generated projects using the CLI.

### 🧪 **Testing Workflows**

#### Unit Tests

```bash
# All packages
npm test

# Individual packages
npm run test:wrapper
npm run test:configurator
npm run test:create-app
```

#### Integration Testing

```bash
# Test V3 CLI workflow (recommended)
cd test-v3-development
npm run dev:v3
# → Add/remove model files → Verify automatic pipeline regeneration → Verify UI updates

# Test legacy pipeline compilation
npm run build:pipeline

# Test legacy dual-server workflow
npm run dev
# → Edit models → Verify pipeline rebuilds → Verify UI updates
```

#### Create-App Testing

```bash
# Test scaffolding (creates temp project)
cd packages/create-app
npm run test:scaffold

# Test scaffolded project works
cd /tmp/test-project
npm run dev
```

## File Watching & Hot Reload

### V3 CLI Approach (Recommended)

The new configurator CLI (`npm run dev:v3`) provides unified file watching:

```
┌─ Configurator CLI ──────────────────────────────────────────────────────┐
│  node ../packages/configurator/dist/cli/index.js dev --configurator-dev-mode │
│                                                                         │
│  ┌─ File Watcher ─────────────┐  ┌─ Pipeline Compiler ─────────────────┐ │
│  │  Watches: main.ts,         │  │  Port: 3001                         │ │
│  │  components/*.ts           │  │  Auto-regenerates pipeline entry   │ │
│  │  ↓                         │  │  Vite aliases: @manifold-studio/*  │ │
│  │  Auto-regenerates pipeline │  │  ↓                                  │ │
│  │  entry when files change   │  │  temp/user-pipeline-entry.ts       │ │
│  └────────────────────────────┘  └─────────────────────────────────────┘ │
│                                                                         │
│  ┌─ UI Server ────────────────────────────────────────────────────────┐ │
│  │  Port: 3000                                                        │ │
│  │  Source-based configurator imports (packages/configurator/src/)   │ │
│  │  HMR for configurator changes                                     │ │
│  │  Polls pipeline compiler for model updates                       │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Legacy Dual-Server Approach

The old approach (`npm run dev`) uses separate Vite processes:

```
┌─ Wrapper Source ────────────────┐    ┌─ Configurator Source ──────────┐
│  packages/wrapper/src/          │    │  packages/configurator/src/    │
│  ↓ (Vite --watch)               │    │  ↓ (Source imports via aliases)│
│  packages/wrapper/dist/         │    │  test-v3-development/          │
│  ↓ (npm link)                   │    │  ↓ (Vite HMR)                  │
│  test-v3-development/           │    │  Browser Updates               │
└─────────────────────────────────┘    └────────────────────────────────┘
                                                        │
┌─ Model Source ──────────────────┐                     │
│  test-v3-development/main.ts    │                     │
│  test-v3-development/components/│                     │
│  ↓ (Vite pipeline --watch)      │                     │
│  test-v3-development/temp/      │                     │
│  ↓ (Configurator polls)         │ ←───────────────────┘
│  Browser GLB Update             │
└─────────────────────────────────┘
```

### Hot Reload Chain

**V3 CLI Approach**:

1. **Edit configurator source** → Immediate HMR update via source imports
2. **Add/remove model files** → File watcher triggers → Pipeline entry regenerated → UI updates
3. **Edit model source** → Pipeline compiler rebuilds → Configurator detects change → GLB updates
4. **Edit UI config** → Configurator executes pipeline → GLB updates

**Legacy Approach**:

1. **Edit wrapper source** → Wrapper rebuilds → V3 project picks up changes
2. **Edit configurator source** → Source imports provide immediate HMR updates
3. **Edit model source** → Pipeline rebuilds → Configurator detects change → GLB updates
4. **Edit UI config** → Configurator executes pipeline → GLB updates

## Common Development Tasks

### Adding New Configurator Features

**V3 CLI Approach (Recommended)**:

1. **Edit configurator source** (`packages/configurator/src/`)
2. **Changes appear immediately** via source imports and HMR
3. **Test in V3 project** (`npm run dev:v3` in `test-v3-development`)
4. **Verify changes** in browser at http://localhost:3000

**Legacy Approach**:

1. **Edit configurator source** (`packages/configurator/src/`)
2. **Changes appear immediately** via source imports and HMR
3. **Test in V3 project** (`npm run dev` in `test-v3-development`)
4. **Verify changes** in browser

### Adding New Model Features

**V3 CLI Approach (Recommended)**:

1. **Add/edit model files** (`test-v3-development/main.ts` or `components/`)
2. **File watcher detects changes** and auto-regenerates pipeline entry
3. **Pipeline compiler rebuilds** automatically
4. **Configurator detects change** and reloads pipeline
5. **GLB regenerates** with new model

**Legacy Approach**:

1. **Edit model files** (`test-v3-development/main.ts` or `components/`)
2. **Pipeline auto-rebuilds** (if V3 dev server is running)
3. **Configurator detects change** and reloads pipeline
4. **GLB regenerates** with new model

### Testing Create-App Changes

1. **Edit create-app templates** (`packages/create-app/templates/`)
2. **Test scaffolding** with `npm run test:scaffold`
3. **Verify scaffolded project** works with `npm run dev`
4. **Sync from V3** if needed: copy working configs from `test-v3-development`

## Troubleshooting

### "Changes not picked up"

**Symptoms**: Edit code but don't see changes in browser

**Solutions**:

1. **For configurator changes**: Should appear immediately with source-based development
2. **For wrapper changes**: Check if wrapper build is running (`npm run dev` in packages/wrapper)
3. **Clear Vite cache**: `rm -rf node_modules/.vite` in test project
4. **Restart dev server**:
   - V3 CLI: `npm run dev:v3` in test-v3-development
   - Legacy: `npm run dev` in test-v3-development
5. **Check browser console**: Look for TypeScript compilation errors
6. **Check Vite alias configuration**: If package imports fail, verify both UI server and pipeline compiler have the same aliases

### "Pipeline not loading"

**Symptoms**: Configurator shows "Pipeline not available"

**Solutions**:

1. **Check pipeline build**: `temp/pipeline.js` should exist
2. **Check build errors**: Look for TypeScript/compilation errors
3. **Manual rebuild**: `npm run build:pipeline` in test project
4. **Check file serving**: Pipeline should be accessible at `/temp/pipeline.js`

### "Configurator not updating"

**Symptoms**: UI doesn't reflect configurator code changes

**Solutions**:

1. **Source-based development**: Changes should appear immediately (<2 seconds)
2. **Check Vite HMR**: Look for HMR messages in browser console
3. **Hard refresh**: Browser cache might be stale (Cmd+Shift+R / Ctrl+Shift+R)
4. **Check TypeScript errors**: Compilation errors prevent updates
5. **Restart dev server**: `npm run dev` in test-v3-development

## Best Practices

### Development Flow

1. **Start watchers first**: `npm run dev:libs` before working
2. **One terminal per concern**: Libraries, pipeline, UI server
3. **Check console logs**: Both terminal and browser console
4. **Test incrementally**: Small changes, verify each step

### Code Organization

1. **Keep V3 test project clean**: It represents user experience
2. **Sync to create-app regularly**: Don't let templates drift
3. **Update this guide**: When workflows change, update docs
4. **Test end-to-end**: Occasionally test full create-app workflow

### Performance Tips

1. **Use watch modes**: Faster than manual rebuilds
2. **Selective rebuilds**: Only rebuild what changed
3. **Clear caches**: When in doubt, clear Vite caches
4. **Monitor file sizes**: Keep library builds reasonable

## Quick Reference

### Essential Commands

```bash
# Start V3 development (NEW CLI approach - recommended)
cd test-v3-development && npm run dev:v3  # Unified CLI with automatic file watching

# Start V3 development (legacy dual-server approach)
cd test-v3-development && npm run dev     # Manual pipeline management

# If also developing wrapper
cd packages/wrapper && npm run dev        # Terminal 1: Wrapper auto-rebuild
cd test-v3-development && npm run dev:v3  # Terminal 2: V3 CLI approach

# Individual package development
cd packages/wrapper && npm run build:lib -- --watch  # Only if changing wrapper
cd packages/create-app && npm run test:scaffold       # Create-app scaffolding test

# Testing
npm test                           # All tests
cd test-v3-development && npm run build:pipeline  # Test legacy pipeline
cd packages/create-app && npm run test:scaffold   # Test scaffolding

# Troubleshooting
rm -rf node_modules/.vite          # Clear Vite cache (test-v3-development)
cd packages/wrapper && npm run build  # Rebuild wrapper if needed
```

### File Locations

- **Wrapper library**: `packages/wrapper/dist/` (built)
- **Configurator source**: `packages/configurator/src/` (used directly via Vite aliases)
- **V3 pipeline output**: `test-v3-development/temp/`
- **Create-app templates**: `packages/create-app/templates/`
- **Test projects**: `test-v3-development/`, `/tmp/test-project`

### Architecture Notes

**Source-Based Development**: The configurator is imported directly from `packages/configurator/src/` using Vite aliases, eliminating build steps and caching issues during development. Only the wrapper requires building since it contains WASM bindings.

**V3 CLI Benefits**: The new configurator CLI (`npm run dev:v3`) significantly improves the development experience by:

- ✅ **Automatic model discovery** - no manual pipeline entry management
- ✅ **Unified file watching** - detects model file additions/removals automatically
- ✅ **Consistent Vite configuration** - both UI server and pipeline compiler use same aliases
- ✅ **Package import support** - generated pipeline files can import from `@manifold-studio/configurator`
- ✅ **Reduced generated code** - shared types/functions moved to library (63% size reduction)
- ✅ **Better error handling** - unified logging and error reporting
