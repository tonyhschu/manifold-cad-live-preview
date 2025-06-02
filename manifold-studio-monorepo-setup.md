# Manifold Studio Monorepo Setup Guide

## 🎉 Current Status: PHASES 1-3 COMPLETE

**Last Updated**: December 2024
**Current State**: Fully functional monorepo with cross-package development workflow

### ✅ Completed Phases

- **✅ Phase 1**: Workspace foundation created
- **✅ Phase 2**: Wrapper package extracted and working
- **✅ Phase 3**: Configurator package extracted and working
- **✅ Documentation**: README updated with new development workflow
- **🔄 Phase 4**: Create scaffolding tool (NEXT)

### 🚀 Current Working Commands

```bash
# Start full development environment
npm run devAll

# Individual packages
npm run dev:wrapper      # Wrapper in watch mode
npm run dev:configurator # Configurator dev server

# Building and testing
npm run build           # Build all packages
npm run test            # Test all packages
```

**Browser URL**: http://localhost:5174

## Repository Structure

This project uses a monorepo approach with NPM Workspaces to manage multiple related packages in a single Git repository.

```
manifold-studio/
├── package.json                    # Root package with workspace configuration
├── README.md                       # Main project documentation
├── .gitignore                      # Shared Git ignore rules
├── packages/
│   ├── wrapper/                    # @manifold-studio/wrapper
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── lib/               # Core Manifold API wrapper
│   │   │   ├── pipeline/          # Headless generation capabilities
│   │   │   ├── tracking/          # Operation tracking system
│   │   │   └── export/            # OBJ/GLB export utilities
│   │   ├── tests/                 # Node.js environment tests
│   │   ├── dist/
│   │   └── README.md
│   ├── configurator/              # @manifold-studio/configurator
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── components/        # UI components (canvas, controls)
│   │   │   ├── services/          # Service layer integration
│   │   │   └── state/             # State management
│   │   ├── tests/                 # happy-dom environment tests
│   │   ├── dist/
│   │   └── README.md
│   └── create-app/                # @manifold-studio/create-app
│       ├── package.json
│       ├── bin/                   # CLI entry point
│       ├── templates/             # Project templates
│       ├── tests/                 # Scaffolding tests
│       └── README.md
└── node_modules/                  # Shared dependencies
```

## NPM Workspace Configuration

### Root package.json

```json
{
  "name": "manifold-studio",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces",
    "lint": "npm run lint --workspaces"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "eslint": "^8.0.0"
  }
}
```

## Package Dependencies

### Dependency Chain

```
@manifold-studio/create-app
    ↓ (generates package.json that depends on)
@manifold-studio/configurator
    ↓ (depends on)
@manifold-studio/wrapper
    ↓ (depends on)
manifold-3d (external package)
```

### Package Responsibilities

**@manifold-studio/wrapper**: Core API wrapper with headless capabilities

- ManifoldCAD API wrapper with top-level await pattern
- Operation tracking system
- Export utilities (OBJ, GLB)
- Headless pipeline functionality for command-line generation
- **Target Environment**: Node.js and Browser

**@manifold-studio/configurator**: UI components and development environment

- Interactive UI components (canvas, parameter controls)
- Service layer integration (ModelService, ExportService, etc.)
- State management and HMR integration
- Development server setup
- **Target Environment**: Browser only

**@manifold-studio/create-app**: Project scaffolding tool

- CLI tool for generating new projects
- Project templates with working examples
- Dependency management and setup automation
- **Target Environment**: Node.js CLI

### Individual Package Configurations

**packages/wrapper/package.json:**

```json
{
  "name": "@manifold-studio/wrapper",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "manifold-3d": "^3.1.0",
    "@gltf-transform/core": "^4.1.3"
  },
  "devDependencies": {
    "typescript": "^5.0.2",
    "vitest": "^1.0.0"
  }
}
```

**packages/configurator/package.json:**

```json
{
  "name": "@manifold-studio/configurator",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "vite build",
    "test": "vitest run",
    "dev": "vite"
  },
  "dependencies": {
    "@manifold-studio/wrapper": "^1.0.0",
    "@google/model-viewer": "^3.3.0",
    "@preact/signals": "^2.0.4",
    "tweakpane": "^4.0.5",
    "three": "^0.158.0"
  },
  "devDependencies": {
    "typescript": "^5.0.2",
    "vite": "^4.4.5",
    "vitest": "^1.0.0",
    "happy-dom": "^12.0.0"
  }
}
```

**packages/create-app/package.json:**

```json
{
  "name": "@manifold-studio/create-app",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "create-app": "./bin/index.js"
  },
  "files": ["bin", "templates"],
  "scripts": {
    "build": "tsc",
    "test": "vitest run"
  },
  "dependencies": {
    "commander": "^11.0.0",
    "handlebars": "^4.7.0"
  },
  "devDependencies": {
    "typescript": "^5.0.2",
    "vitest": "^1.0.0"
  }
}
```

## Development Workflow

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/your-org/manifold-studio
cd manifold-studio

# Install all dependencies for all packages
npm install
```

### Working with Packages

**Build all packages:**

```bash
npm run build --workspaces
```

**Build specific package:**

```bash
npm run build --workspace @manifold-studio/wrapper
# or
npm run build --workspace packages/wrapper
```

**Add dependency to specific package:**

```bash
npm install three --workspace @manifold-studio/configurator
```

**Run tests:**

```bash
# All packages
npm run test --workspaces

# Specific package
npm run test --workspace @manifold-studio/wrapper
```

### Cross-Package Dependencies

During development, packages can import from each other using their published names:

```typescript
// In configurator/src/index.ts
import { Manifold, exportToOBJ } from "@manifold-studio/wrapper";
```

NPM Workspaces automatically resolves these imports to the local packages, even though they're not published yet.

## Publishing Strategy

### Development Phase

1. Work on all packages simultaneously in the monorepo
2. Test integration using workspace linking
3. Use semantic versioning for each package independently

### Publishing Order

Packages must be published in dependency order:

1. **@manifold-studio/wrapper** (no internal dependencies)
2. **@manifold-studio/configurator** (depends on wrapper)
3. **@manifold-studio/create-app** (generates projects using configurator)

### Publishing Commands

```bash
# Build all packages first
npm run build --workspaces

# Publish in order (from each package directory)
cd packages/wrapper && npm publish
cd packages/configurator && npm publish
cd packages/create-app && npm publish
```

## Git Workflow

### Single Repository Benefits

- **Unified History:** All changes across packages in one timeline
- **Atomic Commits:** Update multiple packages in single commits
- **Coordinated Releases:** Tag releases that span multiple packages
- **Shared Tooling:** Common linting, testing, CI/CD configuration

### Branch Strategy

```bash
# Feature branches for new functionality
git checkout -b feature/add-new-configurator-widget

# Release branches for coordinated releases
git checkout -b release/v1.2.0

# Hotfix branches for urgent fixes
git checkout -b hotfix/wrapper-memory-leak
```

### Commit Message Convention

```
type(scope): description

feat(configurator): add support for custom themes
fix(wrapper): resolve memory leak in mesh processing
docs(create-app): update template documentation
chore(workspace): update shared dependencies
```

## Benefits of This Setup

### For Development

- **Hot Reloading:** Changes in wrapper immediately available in configurator
- **Simplified Testing:** Test integration between packages without publishing
- **Shared Configuration:** Common TypeScript, ESLint, and other tool configs
- **Dependency Management:** Automatic hoisting of shared dependencies

### For Users

- **Consistent Versioning:** Coordinated releases ensure compatibility
- **Simplified Discovery:** All related packages in one place
- **Better Documentation:** Unified README and examples

### For Maintenance

- **Easier Refactoring:** Move code between packages safely
- **Coordinated Breaking Changes:** Update all packages simultaneously
- **Shared CI/CD:** Single pipeline handles all packages

## Testing Strategy

### Package-Level Testing

**Wrapper Package Tests** (Node.js environment):

- Core API functionality and WASM integration
- Operation tracking system
- Export utilities (OBJ, GLB)
- Pipeline functionality
- Cross-platform compatibility

**Configurator Package Tests** (happy-dom environment):

- UI components and interactions
- Service layer integration
- HMR functionality
- Browser-specific features

**Create-App Package Tests** (Node.js environment):

- CLI functionality and argument parsing
- Template generation and file operations
- Package manager integration
- Cross-platform scaffolding

### Integration Testing

**Monorepo Root Tests**:

- End-to-end integration across packages
- Cross-package compatibility
- Generated project validation (create-app output)

This structure ensures new maintainers have a clear mental model: "Test the thing where it lives, test integration at the boundaries."

## Transitioning from Single Package to Monorepo

### Current State Assessment

The current project (`manifold-cad-live-preview`) is a mature 2-week-old TypeScript project with comprehensive testing and dual-mode functionality (browser HMR + headless pipeline).

**Current structure:**

```
manifold-cad-live-preview/
├── package.json
├── src/
│   ├── lib/                    # Core Manifold wrapper
│   ├── components/             # UI components
│   ├── services/               # Service layer
│   ├── pipeline/               # Pipeline functionality
│   └── models/                 # Example models
├── scripts/                    # Pipeline scripts
├── tests/                      # Comprehensive test suite
├── vite.config.js
└── node_modules/
```

**Key Advantages of Current State**:

- Comprehensive testing infrastructure
- Well-established TypeScript configuration
- Working pipeline and HMR systems
- Clear architectural patterns
- No backwards compatibility concerns (2 weeks old, no external users)

### Migration Strategy

#### ✅ COMPLETED: Gradual Extraction Approach

The migration has been successfully completed using a gradual extraction approach that preserved the comprehensive testing infrastructure and architectural patterns.

**✅ Phase 1: Create workspace structure** - COMPLETED

```bash
# ✅ DONE: Created workspace structure
mkdir packages packages/wrapper packages/configurator packages/create-app
# ✅ DONE: Root package.json with workspace config created
```

**✅ Phase 2: Extract wrapper package (core functionality)** - COMPLETED

```bash
# ✅ DONE: Moved core functionality to wrapper
git mv src/lib/ packages/wrapper/src/lib/
git mv src/pipeline/ packages/wrapper/src/pipeline/
git mv src/types/parametric-config.ts packages/wrapper/src/types/
git mv tests/lib/ packages/wrapper/tests/
git mv tests/pipeline/ packages/wrapper/tests/

# ✅ DONE: Wrapper package.json, tsconfig.json, vitest.config.ts created
# ✅ DONE: All 66 wrapper tests passing
# ✅ DONE: Wrapper builds successfully
```

**✅ Phase 3: Extract configurator package (UI and services)** - COMPLETED

```bash
# ✅ DONE: Moved UI and service functionality
git mv src/components/ packages/configurator/src/components/
git mv src/services/ packages/configurator/src/services/
git mv src/state/ packages/configurator/src/state/
git mv src/models/ packages/configurator/src/models/
git mv tests/services/ packages/configurator/tests/
git mv tests/ui/ packages/configurator/tests/

# ✅ DONE: Updated all imports to use @manifold-studio/wrapper
# ✅ DONE: Configurator package.json, tsconfig.json, vitest.config.ts created
# ✅ DONE: Vite configuration updated for top-level await support
# ✅ DONE: Configurator builds and dev server working
```

**🔄 Phase 4: Create scaffolding tool** - NEXT

```bash
# TODO: Create create-app package structure
# TODO: Implement CLI tool and templates
# TODO: Test scaffolding with local packages using npm link

git commit -m "feat: add create-app scaffolding tool"
```

**✅ Phase 5: Update root workspace configuration** - COMPLETED

```json
// ✅ DONE: Root package.json with full workspace configuration
{
  "name": "manifold-studio",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces",
    "test:wrapper": "npm run test --workspace @manifold-studio/wrapper",
    "test:configurator": "npm run test --workspace @manifold-studio/configurator",
    "dev": "npm run dev --workspace @manifold-studio/wrapper & npm run dev:configurator",
    "devAll": "npm run dev --workspace @manifold-studio/wrapper & npm run dev:configurator",
    "dev:wrapper": "npm run dev --workspace @manifold-studio/wrapper",
    "dev:configurator": "npm run dev --workspace @manifold-studio/configurator"
  },
  "devDependencies": {
    "typescript": "^5.0.2",
    "vitest": "^1.0.0"
  }
}
```

**✅ Phase 6: Test and validate** - COMPLETED

```bash
# ✅ DONE: All validation steps completed successfully
npm install                    # ✅ Works
npm ls --workspaces           # ✅ Shows both packages
npm run build --workspaces    # ✅ Both packages build
npm run test --workspaces     # ✅ All tests pass
npm run devAll                # ✅ Full dev environment works
```

## 🎯 Current Development Workflow

### Cross-Package Development (WORKING)

Changes in the wrapper package propagate to the configurator:

1. **Wrapper changes** → TypeScript watch rebuilds automatically (~1-2 seconds)
2. **Configurator detects change** → Vite HMR updates the browser
3. **Total time**: ~2-3 seconds for cross-package changes

### Development Commands (WORKING)

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

### Common Migration Issues and Solutions

#### 1. Import Path Changes

**Problem:** Imports crossing package boundaries need updating
**Solution:** Update import statements to use scoped package names

```typescript
// Before
import { Manifold } from "../lib/manifold";
import { ModelService } from "../services/ModelService";

// After (configurator importing from wrapper)
import { Manifold, exportToOBJ } from "@manifold-studio/wrapper";
```

#### 2. Build Configuration Updates

**Problem:** Different packages need different build configurations
**Solution:** Tailor build configs to package purpose

```typescript
// packages/wrapper/vite.config.ts (library build)
export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: ["manifold-3d"],
    },
  },
});

// packages/configurator/vite.config.ts (app build)
export default defineConfig({
  build: {
    outDir: "dist",
    rollupOptions: {
      external: ["@manifold-studio/wrapper"],
    },
  },
});
```

#### 3. Testing Environment Configuration

**Problem:** Different packages need different test environments
**Solution:** Configure vitest per package needs

```typescript
// packages/wrapper/vitest.config.ts (Node.js environment)
export default defineConfig({
  test: {
    environment: "node",
  },
});

// packages/configurator/vitest.config.ts (Browser simulation)
export default defineConfig({
  test: {
    environment: "happy-dom",
  },
});
```

#### 4. Dependency Management

**Problem:** Deciding what goes where
**Solution:** Follow clear guidelines

- **Root level:** Shared development tools (TypeScript, Vitest)
- **Package level:** Package-specific runtime and build dependencies
- **Peer dependencies:** For optional integrations (like @gltf-transform/core)

### Migration Checklist

**✅ Pre-migration:** - COMPLETED

- [x] Backup current repository (git branch or fork)
- [x] Document current functionality (both HMR and pipeline modes)
- [x] Identify package boundaries (wrapper vs configurator functionality)
- [x] Plan testing strategy for each package

**✅ During migration:** - COMPLETED

- [x] Create workspace structure with packages/ directory
- [x] Extract wrapper package (core API, pipeline, operation tracking)
- [x] Extract configurator package (UI, services, state management)
- [ ] Create create-app package (CLI tool and templates) - NEXT PHASE
- [x] Update all import statements to use scoped package names
- [x] Configure build systems for each package type
- [x] Distribute tests to appropriate packages

**✅ Post-migration validation:** - COMPLETED

- [x] Verify `npm install` works in workspace
- [x] Test `npm run build --workspaces` succeeds
- [x] Test `npm run test --workspaces` passes
- [x] Verify configurator development mode works (`npm run dev:configurator`)
- [x] Test wrapper package independently
- [ ] Validate create-app generates working projects - NEXT PHASE
- [x] Test cross-package imports resolve correctly
- [x] Verify operation tracking still works across packages

### Troubleshooting Common Issues

**"Cannot resolve module" errors:**

- Check that package names match between package.json and import statements
- Verify workspace configuration in root package.json
- Run `npm install` to refresh workspace symlinks
- Ensure packages are built before importing (`npm run build --workspaces`)

**Build output in wrong location:**

- Update build tool configurations for each package type
- Check that `outDir` settings are relative to package root
- Verify library vs application build configurations

**Tests failing after migration:**

- Check test environment configurations (Node.js vs happy-dom)
- Update test imports to use scoped package names
- Verify WASM loading works in test environment
- Ensure operation tracking tests work across package boundaries

**Development server issues:**

- Ensure workspace packages are properly symlinked
- Check that configurator can import from local wrapper package
- Verify HMR still works with cross-package imports

## NPM Scope Registration

**When to register**: You don't need to register the `@manifold-studio` scope before starting development. NPM scopes are created automatically when you publish your first scoped package.

**Development workflow**:

- Develop and test locally using workspace linking
- Use `npm link` to test create-app with local packages
- Register scope only when ready for first publish

**Registration**: Free for public scopes, paid for private scopes.

## Getting Started Checklist

- [x] Plan migration phases (wrapper → configurator → create-app)
- [x] Initialize monorepo with workspace configuration
- [x] Extract wrapper package with core functionality and tests
- [x] Extract configurator package with UI components and services
- [ ] Create create-app scaffolding tool with templates - **NEXT PHASE**
- [x] Set up shared development tools (TypeScript, Vitest)
- [x] Validate all functionality works across packages
- [ ] Register `@manifold-studio` NPM scope when ready to publish
- [x] Document cross-package development workflow

## 🚀 Next Steps: Phase 4

The next phase is to create the `@manifold-studio/create-app` scaffolding tool:

1. **Create package structure** for create-app
2. **Implement CLI tool** with commander.js
3. **Create project templates** that use the published packages
4. **Test scaffolding workflow** with local packages
5. **Validate generated projects** work correctly

This will complete the monorepo setup and provide a complete ecosystem for Manifold Studio development.
