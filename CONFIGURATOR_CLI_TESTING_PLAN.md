# Configurator CLI Testing Plan

## Overview

After the configurator compilation work that moved pipeline infrastructure from user projects into the CLI, the create-app test suite is completely out of sync with the new architecture. This document outlines the plan to update all tests to work with the new CLI-based system.

## Current State Analysis

### ❌ What's Broken
- **33 out of 46 tests failing**
- Tests expect old dual-server architecture (removed in configurator compilation)
- Tests expect build scripts that no longer exist (`build:pipeline`, `build:ui`)
- Tests expect files that were removed (pipeline configs, HMR plugins, etc.)
- Tests expect dependencies that are no longer needed

### ✅ What's Working
- Project scaffolding still works (create-app CLI creates projects)
- Basic template processing works (Handlebars templates)
- Error handling for invalid templates works
- Some dependency resolution tests pass

## Architecture Changes Summary

### Old Architecture (What Tests Expect)
```
User Project Structure:
├── index.html
├── src/main.ts
├── vite.config.ts
├── vite.pipeline.config.ts
├── pipeline-entry.ts
├── scripts/generate-manifest.ts
├── vite-plugins/
│   ├── pipeline-hmr.ts
│   └── manifest-generator.ts
└── package.json (with build:pipeline, build:ui scripts)
```

### New Architecture (What Actually Exists)
```
User Project Structure:
├── main.ts
├── components/
│   ├── example.ts
│   └── wheel.ts
├── vite.config.ts
├── tsconfig.json
├── README.md
└── package.json (with manifold-dev dev script)
```

## Testing Plan

### Phase 1: Template Generation Tests Update
**Files**: `tests/integration/template-generation.test.ts`

#### 1.1 Update Required Files List
- Remove files that no longer exist:
  - `vite.pipeline.config.ts`
  - `pipeline-entry.ts`
  - `index.html`
  - `src/main.ts`
  - `vite-plugins/pipeline-hmr.ts`
  - `vite-plugins/manifest-generator.ts`
  - `scripts/generate-manifest.ts`

- Keep files that still exist:
  - `package.json`
  - `tsconfig.json`
  - `vite.config.ts`
  - `main.ts`
  - `components/example.ts`
  - `components/wheel.ts`
  - `README.md`

#### 1.2 Update Package.json Validation
- Remove expectations for old scripts:
  - `build:pipeline`
  - `build:ui`
  - `dev` (old concurrently-based)

- Add expectations for new scripts:
  - `dev: "manifold-dev dev"`
  - `build: "echo 'Build not needed - CLI handles compilation'"`
  - `test: "vitest"`

#### 1.3 Update Dependency Validation
- Remove expectations for old dependencies:
  - `concurrently`
  - Complex Vite configurations

- Keep current dependencies:
  - `manifold-3d`
  - `@manifold-studio/configurator` (file: link)
  - `typescript`
  - `vitest`

### Phase 2: Build System Tests Overhaul
**Files**: `tests/integration/build-system.test.ts`

#### 2.1 Replace Pipeline Build Tests
**Old**: Test `npm run build:pipeline` creates `temp/pipeline.js`
**New**: Test `manifold-dev dev` starts successfully and serves models

#### 2.2 Replace UI Build Tests  
**Old**: Test `npm run build:ui` creates `dist/` folder
**New**: Test CLI serves configurator UI correctly

#### 2.3 New CLI Integration Tests
- Test `manifold-dev dev` command starts without errors
- Test CLI discovers models in `main.ts` and `components/`
- Test CLI serves configurator on expected port
- Test CLI handles model compilation automatically

### Phase 3: HMR System Tests Redesign
**Files**: `tests/integration/hmr-system.test.ts`

#### 3.1 Remove Dual-Server Architecture Tests
- Remove pipeline server startup tests
- Remove UI server startup tests  
- Remove server communication tests

#### 3.2 Add CLI Development Server Tests
- Test `manifold-dev dev` starts single unified server
- Test server responds to configurator requests
- Test server handles model changes via HMR

#### 3.3 Update Hot Module Replacement Tests
- Test file changes trigger model recompilation
- Test configurator updates without full page reload
- Test error handling during development

### Phase 4: Package Validation Tests Update
**Files**: `tests/integration/package-validation.test.ts`

#### 4.1 Update Script Validation
- Remove checks for `build:pipeline`, `build:ui`
- Add checks for `manifold-dev dev`
- Update script command validation logic

#### 4.2 Update Dependency Validation
- Remove checks for old build dependencies
- Validate `@manifold-studio/configurator` file link
- Validate `manifold-3d` runtime dependency

### Phase 5: Installation Tests Update
**Files**: `tests/integration/installation.test.ts`

#### 5.1 Update Post-Installation Validation
- Remove checks for build script availability
- Add checks for `manifold-dev` CLI availability
- Test CLI can be executed after installation

#### 5.2 Update Dependency Installation Tests
- Remove expectations for old dependencies
- Test new simplified dependency structure

### Phase 6: Test Utilities Update
**Files**: `tests/utils/`

#### 6.1 Update ServerManager
- Remove dual-server management
- Add CLI development server management
- Update port allocation for single server

#### 6.2 Update ProjectCreator
- Remove build testing utilities for old scripts
- Add CLI testing utilities
- Update project validation logic

#### 6.3 Update FileValidator
- Remove validation for deleted files
- Add validation for new CLI-generated artifacts
- Update validation patterns

## Implementation Strategy

### Step 1: Create New Test Categories
1. **CLI Integration Tests** - Test the `manifold-dev` command
2. **Model Discovery Tests** - Test automatic model detection
3. **Development Server Tests** - Test unified server functionality
4. **Template Validation Tests** - Test simplified template structure

### Step 2: Update Test Infrastructure
1. Update test utilities to work with CLI
2. Create CLI test helpers
3. Update port management for single server
4. Add CLI process management utilities

### Step 3: Incremental Test Updates
1. Start with template generation tests (easiest)
2. Move to package validation tests
3. Update installation tests
4. Redesign build system tests
5. Overhaul HMR system tests

### Step 4: Add New CLI-Specific Tests
1. Test CLI model discovery
2. Test CLI error handling
3. Test CLI development workflow
4. Test CLI integration with configurator

## Success Criteria

- [ ] All 46 tests pass
- [ ] Tests validate actual CLI behavior
- [ ] Tests cover new development workflow
- [ ] Tests ensure create-app generates working projects
- [ ] Tests validate CLI integration works correctly

## Timeline Estimate

- **Phase 1-2**: 1-2 days (Template and basic validation updates)
- **Phase 3**: 2-3 days (HMR system redesign)
- **Phase 4-5**: 1 day (Package and installation updates)
- **Phase 6**: 1-2 days (Test utilities update)

**Total**: 5-8 days of focused development work

## Next Steps

1. Review this plan with stakeholders
2. Begin with Phase 1 (template generation tests)
3. Update tests incrementally, validating each phase
4. Ensure all tests pass before considering the work complete

This plan will restore the comprehensive test coverage while ensuring tests validate the new CLI-based architecture instead of the deprecated dual-server system.
