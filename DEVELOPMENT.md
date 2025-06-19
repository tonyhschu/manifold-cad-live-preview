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

### � **Initial Setup (Required Once)**

Since our packages aren't published to NPM yet, you need to set up npm linking first. This approach makes `test-v3-development` behave like a real user project that installs packages from npm:

```bash
# 1. Create global npm links for our packages
cd packages/wrapper && npm link
cd ../configurator && npm link
cd ../..

# 2. Link packages in test project
cd test-v3-development
npm link @manifold-studio/wrapper @manifold-studio/configurator
cd ..
```

**Note**: You only need to do this once, or when you clean your npm cache/node_modules.

**Why npm links?** This setup makes `test-v3-development` behave exactly like an end user's project would - it resolves `@manifold-studio/wrapper` and `@manifold-studio/configurator` as if they were installed from npm, but gets the latest local development versions.

### �🚀 **Quick Start (Most Common)**

For day-to-day V3 development (after initial setup):

```bash
# Terminal 1: Auto-rebuild libraries (wrapper + configurator)
npm run dev:libs

# Terminal 2: V3 test project
cd test-v3-development
npm run dev
```

This gives you:

- ✅ **Wrapper auto-rebuild** on source changes
- ✅ **Configurator auto-rebuild** on source changes
- ✅ **Pipeline auto-rebuild** on model changes
- ✅ **UI hot reload** on configurator changes
- ✅ **GLB regeneration** on config changes

### 🔧 **Individual Package Development**

#### Wrapper Development

```bash
# Watch mode (auto-rebuild library)
cd packages/wrapper
npm run build:lib -- --watch

# Test changes
npm test
```

#### Configurator Development

```bash
# Watch mode (auto-rebuild library)
cd packages/configurator
npm run build:lib -- --watch

# Test changes in V3 project
cd test-v3-development
npm run dev
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

1. **Check watchers are running**: `npm run dev:libs` for libraries
2. **Check npm link**: Libraries should be symlinked to test project
3. **Clear Vite cache**: `rm -rf node_modules/.vite` in test project
4. **Restart dev servers**: Sometimes needed after major changes

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

1. **Check library rebuild**: `packages/configurator/dist/` should update
2. **Check npm link**: Test project should use symlinked configurator
3. **Hard refresh**: Browser cache might be stale
4. **Restart UI server**: `npm run dev` in test project

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
# Start everything for V3 development
npm run dev:libs                    # Libraries auto-rebuild
cd test-v3-development && npm run dev  # V3 test project

# Individual package development
cd packages/wrapper && npm run build:lib -- --watch
cd packages/configurator && npm run build:lib -- --watch
cd packages/create-app && npm run dev

# Testing
npm test                           # All tests
cd test-v3-development && npm run build:pipeline  # Test pipeline
cd packages/create-app && npm run test:scaffold   # Test scaffolding

# Troubleshooting
rm -rf node_modules/.vite          # Clear Vite cache
npm run build                      # Full rebuild
```

### File Locations

- **Wrapper library**: `packages/wrapper/dist/`
- **Configurator library**: `packages/configurator/dist/`
- **V3 pipeline output**: `test-v3-development/temp/`
- **Create-app templates**: `packages/create-app/templates/`
- **Test projects**: `test-v3-development/`, `/tmp/test-project`
