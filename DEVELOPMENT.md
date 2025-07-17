# Manifold Studio Development Guide

## Overview

This guide covers the development workflow for the V3 CLI-based architecture. The new unified CLI provides automatic model discovery, pipeline generation, and development server management.

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
- **Architecture**: CLI-managed development (automatic model discovery + dual servers)
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
- ✅ **Generates pipeline entries** automatically
- ✅ **Starts dual servers**: UI (port 3000) + Pipeline compiler (port 3001)
- ✅ **Watches for file changes** and regenerates pipeline automatically
- ✅ **Configurator source changes**: Immediate HMR updates (<2 seconds)
- ✅ **Model file changes**: Auto-regenerates pipeline + updates UI
- ✅ **No manual pipeline management** required

**For new projects created with create-app**:

```bash
# Generated projects use the CLI by default
cd my-new-project
npm run dev  # Runs manifold-dev CLI automatically
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

#### Create-App Testing

```bash
# Test scaffolding (creates temp project)
cd packages/create-app
npm run test:scaffold

# Test scaffolded project works with CLI
cd /tmp/test-project
npm run dev  # Should automatically use manifold-dev CLI
```

## File Watching & Hot Reload

### V3 CLI Approach (Recommended)

The new configurator CLI (`npm run dev`) provides unified file watching:

```
┌─ Configurator CLI ──────────────────────────────────────────────────────┐
│  manifold-dev dev (auto-detects development mode)                      │
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
│  npm run dev → manifold-dev CLI                                         │
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
npm test                           # All tests
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

**CLI-Based Architecture**: The new configurator CLI significantly improves the development experience by:

- ✅ **Automatic model discovery** - no manual pipeline entry management
- ✅ **Unified file watching** - detects model file additions/removals automatically
- ✅ **Consistent Vite configuration** - both UI server and pipeline compiler use same aliases
- ✅ **Package import support** - generated pipeline files can import from `@manifold-studio/configurator`
- ✅ **Reduced generated code** - shared types/functions moved to library (63% size reduction)
- ✅ **Clean user projects** - no pipeline infrastructure in user code
- ✅ **Better error handling** - unified logging and error reporting
- ✅ **Simplified templates** - create-app generates minimal, clean projects
