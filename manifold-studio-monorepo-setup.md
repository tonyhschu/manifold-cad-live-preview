# Manifold Studio Monorepo Setup Guide

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
  "workspaces": [
    "packages/*"
  ],
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
import { Manifold, exportToOBJ } from '@manifold-studio/wrapper';
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

#### Recommended Approach: Gradual Extraction
Since the project is only 2 weeks old with no external users, we can be more aggressive with changes while preserving the comprehensive testing infrastructure and architectural patterns.

**Phase 1: Create workspace structure**
```bash
# Create new directories
mkdir packages
mkdir packages/wrapper
mkdir packages/configurator
mkdir packages/create-app

# Create root package.json with workspace config
```

**Phase 2: Extract wrapper package (core functionality)**
```bash
# Move core functionality to wrapper
git mv src/lib/ packages/wrapper/src/lib/
git mv src/pipeline/ packages/wrapper/src/pipeline/
git mv src/types/manifold-mesh.d.ts packages/wrapper/src/types/
git mv tests/lib/ packages/wrapper/tests/
git mv tests/pipeline/ packages/wrapper/tests/

# Create wrapper package.json
# Commit the extraction
git commit -m "refactor: extract wrapper package with core functionality"
```

**Phase 3: Extract configurator package (UI and services)**
```bash
# Move UI and service functionality
git mv src/components/ packages/configurator/src/components/
git mv src/services/ packages/configurator/src/services/
git mv src/state/ packages/configurator/src/state/
git mv tests/services/ packages/configurator/tests/
git mv tests/ui/ packages/configurator/tests/

# Update imports to use @manifold-studio/wrapper
# Commit the extraction
git commit -m "refactor: extract configurator package with UI functionality"
```

**Phase 4: Create scaffolding tool**
```bash
# Create create-app package structure
# Implement CLI tool and templates
# Test scaffolding with local packages using npm link

git commit -m "feat: add create-app scaffolding tool"
```

**Phase 5: Update root workspace configuration**
```json
// Root package.json
{
  "name": "manifold-studio",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces",
    "test:wrapper": "npm run test --workspace @manifold-studio/wrapper",
    "test:configurator": "npm run test --workspace @manifold-studio/configurator",
    "dev:configurator": "npm run dev --workspace @manifold-studio/configurator"
  },
  "devDependencies": {
    "typescript": "^5.0.2",
    "vitest": "^1.0.0"
  }
}
```

**Phase 6: Test and validate**
```bash
# Install dependencies with new workspace setup
npm install

# Verify workspace is working
npm ls --workspaces

# Test all packages build
npm run build --workspaces

# Test all packages pass tests
npm run test --workspaces

# Test configurator development mode
npm run dev:configurator
```

### Common Migration Issues and Solutions

#### 1. Import Path Changes
**Problem:** Imports crossing package boundaries need updating
**Solution:** Update import statements to use scoped package names
```typescript
// Before
import { Manifold } from '../lib/manifold';
import { ModelService } from '../services/ModelService';

// After (configurator importing from wrapper)
import { Manifold, exportToOBJ } from '@manifold-studio/wrapper';
```

#### 2. Build Configuration Updates
**Problem:** Different packages need different build configurations
**Solution:** Tailor build configs to package purpose
```typescript
// packages/wrapper/vite.config.ts (library build)
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: ['manifold-3d']
    }
  }
});

// packages/configurator/vite.config.ts (app build)
export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      external: ['@manifold-studio/wrapper']
    }
  }
});
```

#### 3. Testing Environment Configuration
**Problem:** Different packages need different test environments
**Solution:** Configure vitest per package needs
```typescript
// packages/wrapper/vitest.config.ts (Node.js environment)
export default defineConfig({
  test: {
    environment: 'node'
  }
});

// packages/configurator/vitest.config.ts (Browser simulation)
export default defineConfig({
  test: {
    environment: 'happy-dom'
  }
});
```

#### 4. Dependency Management
**Problem:** Deciding what goes where
**Solution:** Follow clear guidelines
- **Root level:** Shared development tools (TypeScript, Vitest)
- **Package level:** Package-specific runtime and build dependencies
- **Peer dependencies:** For optional integrations (like @gltf-transform/core)

### Migration Checklist

**Pre-migration:**
- [ ] Backup current repository (git branch or fork)
- [ ] Document current functionality (both HMR and pipeline modes)
- [ ] Identify package boundaries (wrapper vs configurator functionality)
- [ ] Plan testing strategy for each package

**During migration:**
- [ ] Create workspace structure with packages/ directory
- [ ] Extract wrapper package (core API, pipeline, operation tracking)
- [ ] Extract configurator package (UI, services, state management)
- [ ] Create create-app package (CLI tool and templates)
- [ ] Update all import statements to use scoped package names
- [ ] Configure build systems for each package type
- [ ] Distribute tests to appropriate packages

**Post-migration validation:**
- [ ] Verify `npm install` works in workspace
- [ ] Test `npm run build --workspaces` succeeds
- [ ] Test `npm run test --workspaces` passes
- [ ] Verify configurator development mode works (`npm run dev:configurator`)
- [ ] Test wrapper package independently
- [ ] Validate create-app generates working projects
- [ ] Test cross-package imports resolve correctly
- [ ] Verify operation tracking still works across packages

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

- [ ] Plan migration phases (wrapper → configurator → create-app)
- [ ] Initialize monorepo with workspace configuration
- [ ] Extract wrapper package with core functionality and tests
- [ ] Extract configurator package with UI components and services
- [ ] Create create-app scaffolding tool with templates
- [ ] Set up shared development tools (TypeScript, Vitest)
- [ ] Validate all functionality works across packages
- [ ] Register `@manifold-studio` NPM scope when ready to publish
- [ ] Document cross-package development workflow