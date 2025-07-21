# Manifold Studio Development Guide

## Overview

This guide covers the development workflow for the V3 CLI-based architecture. The new unified CLI provides automatic model discovery, pipeline generation, and single-server development with simplified HMR.

## Architecture Components

### 1. **Wrapper Package** (`packages/wrapper`)

- **Purpose**: Manifold WASM bindings and utilities
- **Build**: TypeScript → ESM library
- **Used by**: User projects, configurator, pipeline models

### 2. **Configurator Package** (`packages/configurator`)

- **Purpose**: UI library for model visualization and parameter control + CLI development server
- **Build**: TypeScript → ESM library + CLI tool
- **Used by**: User projects (as library), CLI (as development server)
- **Development**: Test in user projects via CLI, not as standalone app

### 3. **Create-App Package** (`packages/create-app`)

- **Purpose**: Scaffolding tool for new user projects
- **Build**: TypeScript → CLI tool
- **Creates**: Clean user projects with CLI-based development workflow

### 4. **User Projects** (e.g., `test-v3-development`)

- **Purpose**: Regular NPM projects where users build models
- **Architecture**: CLI-managed development (automatic model discovery + single server)
- **Dependencies**: Configurator (for CLI + UI), Wrapper (for models)

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

For day-to-day development (after initial setup):

```bash
# V3 CLI approach (recommended)
cd test-v3-development
npm run dev
```

This starts the **unified configurator CLI** which automatically:

- ✅ **Discovers models** in your project (main.ts + components/)
- ✅ **Generates pipeline files** directly using Vite build API
- ✅ **Starts single server**: UI server (port 3000) serves everything
- ✅ **Watches for file changes** and regenerates pipeline automatically
- ✅ **Configurator source changes**: Immediate HMR updates (<2 seconds)
- ✅ **Model file changes**: Auto-regenerates pipeline + updates UI
- ✅ **No manual pipeline management** required

**For new projects created with create-app**:

```bash
# Generated projects use the CLI by default
cd my-new-project
npm run dev  # Runs manifold-studio CLI automatically
```

**Optional**: If you're also developing the wrapper package:

```bash
# Terminal 1: Wrapper auto-rebuild (only if changing wrapper)
cd packages/wrapper && npm run dev

# Terminal 2: V3 CLI approach
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
# V3 CLI approach (recommended)
cd test-v3-development
npm run dev

# Test configurator changes
# Edit files in packages/configurator/src/ and see immediate results
```

**Key V3 CLI Benefits for Configurator Development**:

- ✅ **Automatic pipeline regeneration** when you add/remove model files
- ✅ **Unified development server** with consistent Vite alias configuration
- ✅ **Better import resolution** - package imports work in generated pipeline files
- ✅ **Reduced generated code** - shared types/functions moved to library (63% reduction)
- ✅ **File watching** - no manual pipeline entry management
- ✅ **Clean user projects** - no pipeline infrastructure in user code

#### Create-App Development

```bash
cd packages/create-app

# Test scaffolding (primary development workflow)
npm run test:scaffold

# Test generated project with CLI
cd /tmp/test-project
npm run dev  # Uses CLI automatically
```

**Note**: Create-app generates clean projects that use the CLI by default. Templates are minimal (only model files + package.json).

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

**Note**: After V3 consolidation, configurator tests now require V3 bridge system mocking for components that use the unified state management.

#### Integration Testing

```bash
# Test V3 CLI workflow (recommended)
cd test-v3-development
npm run dev
# → Add/remove model files → Verify automatic pipeline regeneration → Verify UI updates

# Test generated project workflow
cd packages/create-app
npm run test:scaffold
cd /tmp/test-project
npm run dev  # Should use CLI automatically
# → Add/remove model files → Verify automatic pipeline regeneration
```

#### End-to-End (E2E) Testing with Playwright

The project includes comprehensive browser-based E2E tests using Playwright to verify the complete user experience:

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI (interactive mode)
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed

# Debug E2E tests step by step
npm run test:e2e:debug

# View test reports
npm run test:e2e:report
```

**What E2E Tests Cover:**

- **HMR Browser Tests**: Verify Hot Module Replacement works without 504 dependency optimization errors
- **Model Switching Tests**: Test model selector functionality and 3D viewer updates
- **Parameter Editing Tests**: Validate parameter controls, real-time updates, and error handling
- **UI Integration Tests**: Ensure all DOM elements load correctly and interact properly

**E2E Test Architecture:**

- **Test Target**: Uses the existing `test-v3-development` project as the test environment
- **Real Browser Testing**: Tests run against the actual configurator UI in Chromium
- **Automatic Setup**: Global setup starts the dev server and waits for it to be ready
- **Comprehensive Coverage**: Tests verify the complete single-server architecture (V3.1)

**E2E Test Files:**

- `tests/e2e/hmr-browser.spec.ts` - HMR functionality and error detection
- `tests/e2e/model-switching.spec.ts` - Model selector and viewer integration
- `tests/e2e/parameter-editing.spec.ts` - Parameter controls and validation
- `tests/e2e/global-setup.ts` - Test environment setup and dev server management
- `tests/e2e/global-teardown.ts` - Cleanup and server shutdown

The E2E tests are essential for validating the V3.1 single-server architecture and ensuring that the critical HMR functionality works correctly without the 504 dependency optimization errors that were problematic during the dual-server to single-server migration.

#### Create-App Testing

```bash
# Test scaffolding (creates temp project)
cd packages/create-app
npm run test:scaffold

# Test scaffolded project works with CLI
cd /tmp/test-project
npm run dev  # Should automatically use manifold-studio CLI
```

## File Watching & Hot Reload

### V3 CLI Approach (Recommended)

The new configurator CLI (`npm run dev`) provides unified file watching:

```
┌─ Configurator CLI ──────────────────────────────────────────────────────┐
│  manifold-studio dev (auto-detects development mode)                   │
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

### Generated Project Architecture

New projects created with create-app use the CLI by default:

```
┌─ User Project ──────────────────────────────────────────────────────────┐
│  my-project/                                                            │
│  ├── main.ts                    # User's main model                     │
│  ├── components/                # User's component models               │
│  │   ├── wheel.ts                                                       │
│  │   └── example.ts                                                     │
│  ├── package.json               # Single "dev" script                   │
│  └── temp/                      # Generated by CLI (gitignored)         │
│                                                                         │
│  npm run dev → manifold-studio CLI                                      │
│  ↓                                                                      │
│  ┌─ CLI Auto-Discovery ─────────────────────────────────────────────────┐ │
│  │  Scans: main.ts, components/*.ts                                    │ │
│  │  Generates: temp/user-pipeline-entry.ts                             │ │
│  │  Starts: UI Server (3000) + Pipeline Compiler (3001)               │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Hot Reload Chain

**V3 CLI Approach**:

1. **Edit configurator source** → Immediate HMR update via source imports
2. **Add/remove model files** → File watcher triggers → Pipeline entry regenerated → UI updates
3. **Edit model source** → Pipeline compiler rebuilds → Configurator detects change → GLB updates
4. **Edit UI config** → Configurator executes pipeline → GLB updates

**Development Project Approach** (test-v3-development):

1. **Edit wrapper source** → Wrapper rebuilds → Project picks up changes
2. **Edit configurator source** → Source imports provide immediate HMR updates
3. **Edit model source** → Pipeline rebuilds → Configurator detects change → GLB updates
4. **Edit UI config** → Configurator executes pipeline → GLB updates

## Common Development Tasks

### Adding New Configurator Features

**V3 CLI Approach (Recommended)**:

1. **Edit configurator source** (`packages/configurator/src/`)
2. **Changes appear immediately** via source imports and HMR
3. **Test in V3 project** (`npm run dev` in `test-v3-development`)
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

**Development Project Approach** (test-v3-development):

1. **Edit model files** (`test-v3-development/main.ts` or `components/`)
2. **Pipeline auto-rebuilds** (if CLI dev server is running)
3. **Configurator detects change** and reloads pipeline
4. **GLB regenerates** with new model

### Testing Create-App Changes

1. **Edit create-app templates** (`packages/create-app/templates/`)
2. **Test scaffolding** with `npm run test:scaffold`
3. **Verify scaffolded project** works with `npm run dev` (should use CLI automatically)
4. **Test CLI features**: Add/remove model files, verify automatic pipeline regeneration

## Troubleshooting

### CLI Permission Denied Error

**Symptoms**: `sh: manifold-studio: Permission denied` when running `npm run dev`

**Cause**: After rebuilding the configurator package, the CLI binary loses execute permissions.

**Solution**:

```bash
# Fix permissions for the CLI binary
chmod +x test-v3-development/node_modules/@manifold-studio/configurator/dist/cli/index.js

# Or for any project directory:
chmod +x node_modules/@manifold-studio/configurator/dist/cli/index.js
```

**Note**: This needs to be done every time you rebuild the configurator package during development.

### "Changes not picked up"

**Symptoms**: Edit code but don't see changes in browser

**Solutions**:

1. **For configurator changes**: Should appear immediately with source-based development
2. **For wrapper changes**: Check if wrapper build is running (`npm run dev` in packages/wrapper)
3. **Clear Vite cache**: `rm -rf node_modules/.vite` in test project
4. **Restart dev server**:
   - Development project: `npm run dev` in test-v3-development
   - Generated project: `npm run dev` in user project
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
# Start development (CLI approach - recommended)
cd test-v3-development && npm run dev  # Development project with source imports

# Generated project development
cd my-project && npm run dev              # Uses CLI automatically

# If also developing wrapper
cd packages/wrapper && npm run dev        # Terminal 1: Wrapper auto-rebuild
cd test-v3-development && npm run dev  # Terminal 2: CLI approach

# Individual package development
cd packages/wrapper && npm run build:lib -- --watch  # Only if changing wrapper
cd packages/create-app && npm run test:scaffold       # Create-app scaffolding test

# Testing
npm test                           # All unit tests
npm run test:e2e                   # End-to-end browser tests
npm run test:e2e:ui                # E2E tests with interactive UI
cd packages/create-app && npm run test:scaffold   # Test scaffolding

# Troubleshooting
rm -rf node_modules/.vite          # Clear Vite cache
cd packages/wrapper && npm run build  # Rebuild wrapper if needed
```

### File Locations

- **Wrapper library**: `packages/wrapper/dist/` (built)
- **Configurator source**: `packages/configurator/src/` (used directly via Vite aliases)
- **Configurator CLI**: `packages/configurator/dist/cli/` (built)
- **Pipeline output**: `*/temp/` (generated by CLI, gitignored)
- **Create-app templates**: `packages/create-app/templates/`
- **Test projects**: `test-v3-development/`, `/tmp/test-project`

### Architecture Notes

**Source-Based Development**: The configurator is imported directly from `packages/configurator/src/` using Vite aliases, eliminating build steps and caching issues during development. Only the wrapper requires building since it contains WASM bindings.

**V3 State Management Consolidation**: The legacy store system has been deprecated and replaced with a unified V3 state management system using V3 UIStateManager and V3 bridge components. All UI components now use the V3 bridge exclusively for state synchronization.

**Single-Server Architecture (V3.1)**: The simplified configurator CLI provides optimal development experience:

- ✅ **Automatic model discovery** - no manual pipeline entry management
- ✅ **Unified file watching** - detects model file additions/removals automatically
- ✅ **Single server** - template server handles both UI and pipeline files (port 3000 only)
- ✅ **Vite build API** - pipeline compiler generates JavaScript directly (46% faster builds)
- ✅ **Natural HMR** - Vite's built-in file watching with dependency optimization disabled
- ✅ **Package import support** - generated pipeline files can import from `@manifold-studio/configurator`
- ✅ **Reduced generated code** - shared types/functions moved to library (63% size reduction)
- ✅ **Clean user projects** - no pipeline infrastructure in user code
- ✅ **Better error handling** - unified logging and error reporting
- ✅ **Simplified templates** - create-app generates minimal, clean projects

## Single-Server Architecture Details

### Architecture Overview

The V3.1 architecture uses a **single-server approach** that eliminates the complexity of the previous dual-server setup:

```
┌─ V3.1 Single-Server Architecture ──────────────────────────────────────────┐
│                                                                             │
│  ┌─ V3 Pipeline Compiler ─────────────────────────────────────────────────┐ │
│  │  • Discovers models (main.ts + components/*.ts)                        │ │
│  │  • Uses Vite build API to generate temp/pipeline.js directly           │ │
│  │  • Writes manifest.json after Vite build completes                     │ │
│  │  • File watching triggers rebuild automatically                        │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─ Template Server (Port 3000) ──────────────────────────────────────────┐ │
│  │  • Serves UI from packages/configurator/templates/                     │ │
│  │  • Serves temp/pipeline.js and temp/manifest.json as static files      │ │
│  │  • Vite's natural file watching detects temp file changes              │ │
│  │  • HMR works with optimizeDeps disabled                                │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Improvements

- **46% Performance Improvement**: Build times reduced from 581ms to 314ms
- **50% Memory Reduction**: Single Vite server instead of dual-server architecture
- **Simplified Architecture**: No proxy complexity - template server handles everything
- **Perfect HMR**: File watching works with Vite's natural file detection
- **Single Port**: Only port 3000 needed (no more port 3001 pipeline server)

### Trade-offs and Gotchas

#### ✅ **Benefits**

1. **Simpler Mental Model**: Template server is now a "normal" Vite dev server
2. **Better Performance**: Vite build API is faster than on-the-fly transformation
3. **Reduced Memory Usage**: Only one Vite server process running
4. **Cleaner Logs**: No coordination between multiple servers
5. **Easier Debugging**: Single server to monitor and troubleshoot

#### ⚠️ **Trade-offs**

1. **Build Step Required**: Pipeline files are pre-built rather than transformed on-demand
2. **Disk I/O**: Pipeline files written to filesystem instead of served from memory
3. **Vite Build API Dependency**: Relies on Vite's build API stability

#### 🔧 **Critical Gotchas**

1. **Dependency Optimization Must Be Disabled**:

   ```typescript
   // In template-server.ts - REQUIRED for HMR to work
   optimizeDeps: {
     disabled: true; // Prevents cache invalidation errors during page reloads
   }
   ```

   **Why**: When Vite reloads due to temp file changes, it invalidates the dependency optimization cache, but the browser still references old optimized dependencies, causing 504 errors.

2. **Manifest.json Timing**:

   ```typescript
   // Write manifest AFTER Vite build, not before
   await viteBuild(config);
   await writeManifest(manifestPath, manifest); // Must be after build
   ```

   **Why**: Vite's build process clears the output directory, deleting manifest.json if written before the build.

3. **Vite Natural File Watching**:

   - **Don't** create custom file watching plugins for temp files
   - **Do** let Vite handle temp directory watching naturally
   - Vite automatically detects changes to `temp/pipeline.js` and triggers HMR

4. **External Dependencies Configuration**:
   ```typescript
   // Must match between pipeline compiler and template server
   external: ["manifold-3d", "@manifold-studio/wrapper"];
   ```
   **Why**: Ensures consistent module resolution between build and runtime

### Migration Notes

**From Dual-Server (V3.0) to Single-Server (V3.1)**:

- ❌ **Removed**: `packages/configurator/src/cli/pipeline-compiler.ts` (203 lines)
- ❌ **Removed**: Pipeline server startup logic in dev command
- ❌ **Removed**: Proxy configuration in template server
- ✅ **Added**: Vite build API integration in pipeline compiler
- ✅ **Added**: `optimizeDeps: { disabled: true }` in template server
- ✅ **Simplified**: File watching relies on Vite's natural behavior

**Breaking Changes**: None for end users - the CLI interface remains identical.
