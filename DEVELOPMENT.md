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
# Single terminal: V3 test project with source-based development
cd test-v3-development
npm run dev
```

This gives you:

- ✅ **Configurator source changes**: Immediate HMR updates (<2 seconds)
- ✅ **Pipeline auto-rebuild** on model changes
- ✅ **UI hot reload** with native Vite HMR
- ✅ **GLB regeneration** on config changes
- ✅ **No build steps** for configurator during development

**Optional**: If you're also developing the wrapper package:

```bash
# Terminal 1: Wrapper auto-rebuild (only if changing wrapper)
cd packages/wrapper && npm run dev

# Terminal 2: V3 test project
cd test-v3-development && npm run dev
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
# Just run the test project - configurator changes appear instantly
cd test-v3-development
npm run dev

# Test configurator changes
# Edit files in packages/configurator/src/ and see immediate results
```

#### Create-App Development

```bash
cd packages/create-app
npm run dev

# Test scaffolding
npm run test:scaffold
```

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
# Test V3 pipeline compilation
cd test-v3-development
npm run build:pipeline

# Test full V3 workflow
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

### What Watches What

```
┌─ Wrapper Source ────────────────┐    ┌─ Configurator Source ──────────┐
│  packages/wrapper/src/          │    │  packages/configurator/src/    │
│  ↓ (Vite --watch)               │    │  ↓ (Vite --watch)              │
│  packages/wrapper/dist/         │    │  packages/configurator/dist/   │
│  ↓ (npm link)                   │    │  ↓ (npm link)                  │
│  test-v3-development/           │    │  test-v3-development/          │
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

1. **Edit wrapper source** → Wrapper rebuilds → V3 project picks up changes
2. **Edit configurator source** → Configurator rebuilds → V3 project picks up changes
3. **Edit model source** → Pipeline rebuilds → Configurator detects change → GLB updates
4. **Edit UI config** → Configurator executes pipeline → GLB updates

## Common Development Tasks

### Adding New Configurator Features

1. **Edit configurator source** (`packages/configurator/src/`)
2. **Library auto-rebuilds** (if `npm run dev:libs` is running)
3. **Test in V3 project** (`test-v3-development`)
4. **Verify changes** in browser

### Adding New Model Features

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
4. **Restart dev server**: `npm run dev` in test-v3-development
5. **Check browser console**: Look for TypeScript compilation errors

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
# Start V3 development (source-based)
cd test-v3-development && npm run dev  # Single command for most development

# If also developing wrapper
cd packages/wrapper && npm run dev     # Terminal 1: Wrapper auto-rebuild
cd test-v3-development && npm run dev  # Terminal 2: V3 test project

# Individual package development
cd packages/wrapper && npm run build:lib -- --watch  # Only if changing wrapper
cd packages/create-app && npm run dev                 # Create-app development

# Testing
npm test                           # All tests
cd test-v3-development && npm run build:pipeline  # Test pipeline
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
