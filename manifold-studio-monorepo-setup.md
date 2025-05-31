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
│   │   ├── dist/
│   │   └── README.md
│   ├── configurator/               # @manifold-studio/configurator
│   │   ├── package.json
│   │   ├── src/
│   │   ├── dist/
│   │   └── README.md
│   └── create-app/                 # @manifold-studio/create-app
│       ├── package.json
│       ├── bin/
│       ├── templates/
│       └── README.md
└── node_modules/                   # Shared dependencies
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

### Individual Package Configurations

**packages/wrapper/package.json:**
```json
{
  "name": "@manifold-studio/wrapper",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "dependencies": {
    "manifold-3d": "^2.0.0"
  }
}
```

**packages/configurator/package.json:**
```json
{
  "name": "@manifold-studio/configurator",
  "version": "1.0.0",
  "main": "dist/index.js",
  "dependencies": {
    "@manifold-studio/wrapper": "^1.0.0",
    "tweakpane": "^4.0.0"
  }
}
```

**packages/create-app/package.json:**
```json
{
  "name": "@manifold-studio/create-app",
  "version": "1.0.0",
  "bin": {
    "create-app": "./bin/index.js"
  },
  "dependencies": {
    "commander": "^11.0.0",
    "handlebars": "^4.7.0"
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

```javascript
// In configurator/src/index.js
import { createWrapper } from '@manifold-studio/wrapper';
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

## Getting Started Checklist

- [ ] Create NPM organization: `@manifold-studio`
- [ ] Initialize monorepo with workspace configuration
- [ ] Set up shared development tools (TypeScript, ESLint, etc.)
- [ ] Create initial package structures
- [ ] Configure CI/CD pipeline for coordinated publishing
- [ ] Document cross-package development workflow