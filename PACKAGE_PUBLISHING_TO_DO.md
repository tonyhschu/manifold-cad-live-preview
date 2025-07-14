# Package Publishing To-Do

## Overview

This document tracks the issues we're encountering due to unpublished packages and identifies what needs to be updated when we eventually publish the packages to npm. Many of our current workarounds and testing complexities stem from using `file:` dependencies for source-based development instead of published packages.

## Current Source-Based Development Issues

### 1. File Path Dependencies in Templates

**Issue**: Templates use `file:` dependencies with relative paths that break in different directory contexts.

**Current Workaround**:

- Template uses `file:{{packagesPath}}/configurator` with dynamic path resolution
- CLI calculates relative paths from target directory to packages directory

**Files Affected**:

- `packages/create-app/templates/basic/package.json.hbs`

**When Publishing**: Replace `file:` dependencies with published package versions:

```json
// Current (source-based)
"@manifold-studio/configurator": "file:{{packagesPath}}/configurator"

// After publishing
"@manifold-studio/configurator": "^1.0.0"
```

### 2. Test Infrastructure Complexity

**Issue**: Testing installation and dependency resolution is complex with `file:` dependencies.

**Current Workarounds**:

- Complex symlink validation in tests
- Dynamic path resolution testing
- Temporary directory path calculations

**Files Affected**:

- `packages/create-app/tests/integration/installation.test.ts`
- `packages/create-app/tests/utils/file-validator.ts`

**When Publishing**: Tests become simpler with published packages:

- No symlink validation needed
- Standard npm dependency resolution
- No dynamic path calculations required

### 3. Development Environment Setup

**Issue**: Local development requires careful path management and linking.

**Current Workarounds**:

- Vite aliases for import resolution
- Custom build processes to handle source imports
- Manual path synchronization between packages

**Files Affected**:

- `packages/configurator/vite.config.ts`
- `packages/create-app/bin/index.js`

**When Publishing**: Standard npm workflow:

- `npm install` just works
- No custom Vite aliases needed for external packages
- Standard semantic versioning

## Analysis: Source-Based vs Published Development

### Will Publishing Solve All Issues?

**YES - Issues that will be resolved by publishing**:

1. **Template Path Complexity**: Published packages use simple version strings instead of complex relative paths
2. **Test Infrastructure**: Standard npm dependency resolution eliminates symlink testing complexity
3. **User Experience**: `npm install` becomes straightforward without path calculations
4. **CI/CD**: Published packages work seamlessly in any environment

**NO - Issues we'll still have with source-based development**:

1. **Internal Development Workflow**: We still want source-based development for our own work to keep packages in sync
2. **Vite Aliases**: Still needed for internal development to import from source
3. **Build Coordination**: Still need to coordinate changes across packages during development

### Recommended Hybrid Approach

**For Internal Development** (what we do now):

- Keep source-based development with `file:` dependencies
- Use Vite aliases for import resolution
- Maintain current development workflow

**For Published Templates** (what users get):

- Templates reference published package versions
- Standard npm installation workflow
- No complex path resolution needed

## Places That Need Updates When Publishing

### 1. Template Files

**File**: `packages/create-app/templates/basic/package.json.hbs`

```json
// Update devDependencies section
"devDependencies": {
  "@manifold-studio/configurator": "^1.0.0",  // Instead of file: path
  "@types/node": "^20.0.0",
  "typescript": "^5.0.2",
  "vitest": "^1.0.0"
}
```

### 2. CLI Package Creation Logic

**File**: `packages/create-app/bin/index.js`

- Remove `packagesPath` calculation logic
- Remove dynamic path resolution in template context
- Simplify template processing

### 3. Test Infrastructure

**Files**:

- `packages/create-app/tests/integration/installation.test.ts`
- `packages/create-app/tests/utils/file-validator.ts`

**Updates Needed**:

- Remove symlink validation logic
- Simplify dependency validation to standard npm packages
- Remove dynamic path testing

### 4. Documentation

**Files**:

- `README.md`
- `DEVELOPMENT.md`
- Package-specific README files

**Updates Needed**:

- Update installation instructions
- Remove source-based development setup for end users
- Add publishing workflow documentation

### 5. Package.json Files

**Files**: All package.json files in packages/

- Set proper version numbers
- Configure publishing settings
- Set up proper peer dependencies

## Publishing Checklist

### Pre-Publishing

- [ ] Finalize package versions and dependencies
- [ ] Update all template files to use published versions
- [ ] Remove development-specific workarounds from user-facing code
- [ ] Update documentation for published workflow

### Publishing Process

- [ ] Publish `@manifold-studio/configurator` first
- [ ] Update `create-app` templates to reference published configurator
- [ ] Publish `@manifold-studio/create-app`
- [ ] Test published packages in clean environment

### Post-Publishing

- [ ] Update development documentation
- [ ] Simplify test infrastructure
- [ ] Remove unnecessary workarounds
- [ ] Update CI/CD if applicable

## Common Path Issues Reference

This section documents recurring path-related issues we encounter with source-based development, their root causes, and solutions.

### Issue 1: Template File Dependencies Break in Different Directories

**Problem**: Templates with hardcoded relative paths fail when projects are created in different locations.

**Example**:

```json
// ❌ BROKEN: Hardcoded relative path
"@manifold-studio/configurator": "file:../../configurator"
```

**Root Cause**: The relative path `../../configurator` assumes the project is created exactly 2 directories deep from the packages directory, but tests run in temporary directories with different depths.

**Solution**: Use dynamic template variables

```json
// ✅ FIXED: Dynamic path resolution
"@manifold-studio/configurator": "file:{{packagesPath}}/configurator"
```

**Files Affected**: `packages/create-app/templates/basic/package.json.hbs`

### Issue 2: Vite Alias Discrepancies Between Servers

**Problem**: Import resolution fails when different Vite configurations have mismatched aliases.

**Root Cause**: The UI server and pipeline compiler run separate Vite instances with potentially different alias configurations.

**Solution**: Ensure all Vite configs have identical aliases

```javascript
// Both servers must have the same aliases
resolve: {
  alias: {
    '@': path.resolve(__dirname, 'src'),
    '@manifold-studio/configurator': path.resolve(__dirname, '../configurator/src')
  }
}
```

**Files to Check**:

- `packages/configurator/vite.config.ts`
- Any other Vite configurations in the project

### Issue 3: Symlink Resolution in Tests

**Problem**: `file:` dependencies create symlinks that need special handling in validation.

**Root Cause**: npm creates symlinks for `file:` dependencies, and standard file existence checks may not handle symlinks correctly.

**Technical Details**:

- `file:` dependency: `"@manifold-studio/configurator": "file:../../../configurator"`
- npm creates: `node_modules/@manifold-studio/configurator` → `../../../configurator`
- `fs.stat()` follows symlinks (good for validation)
- `fs.lstat()` doesn't follow symlinks (good for debugging)

**Solution**: Use `fs.stat()` for validation, `fs.lstat()` for debugging

```typescript
// ✅ For validation (follows symlinks)
const stats = await stat(path);
return { exists: true, isDirectory: stats.isDirectory() };

// ✅ For debugging (doesn't follow symlinks)
const symlinkStats = await lstat(path);
if (symlinkStats.isSymbolicLink()) {
  const target = await readlink(path);
  // Handle symlink debugging
}
```

**Files Affected**: `packages/create-app/tests/utils/file-validator.ts`

### Issue 4: Dynamic Path Calculation in CLI

**Problem**: CLI needs to calculate correct relative paths from any target directory to packages directory.

**Root Cause**: Users can run `create-app` from any directory, so the relative path to packages changes.

**Solution**: Calculate relative path dynamically

```javascript
// ✅ Dynamic path calculation
const packagesAbsolutePath = path.resolve(__dirname, "..", "..");
const packagesPath = path.relative(targetDir, packagesAbsolutePath);
```

**Files Affected**: `packages/create-app/bin/index.js`

### Issue 5: Import Path Resolution in Generated Files

**Problem**: Generated files can't import from packages using relative paths.

**Root Cause**: Generated files don't know their relationship to the packages directory structure.

**Solution**: Use Vite aliases or absolute imports in generated code

```typescript
// ❌ BROKEN: Relative imports in generated files
import { something } from "../../../configurator/src/module";

// ✅ FIXED: Use Vite aliases
import { something } from "@manifold-studio/configurator/module";
```

### Path Debugging Checklist

When encountering path issues, check:

1. **Template Variables**: Are all paths using template variables instead of hardcoded relatives?
2. **Vite Aliases**: Do all Vite configurations have matching aliases?
3. **Symlink Handling**: Are file validators using the correct fs methods?
4. **Dynamic Calculation**: Is the CLI calculating paths relative to the target directory?
5. **Import Resolution**: Are generated files using aliases instead of relative imports?

### Quick Debugging Commands

```bash
# Check symlink target
ls -la node_modules/@manifold-studio/configurator

# Verify package resolution
npm ls @manifold-studio/configurator

# Test relative path calculation
node -e "console.log(require('path').relative(process.cwd(), '/path/to/packages'))"
```

## Conclusion

**Publishing will significantly simplify**:

- User experience (standard npm install)
- Test infrastructure (no symlink complexity)
- Template management (simple version strings)
- CI/CD and deployment

**Source-based development should be maintained for**:

- Internal package development
- Keeping packages in sync during development
- Rapid iteration and testing

The hybrid approach allows us to maintain our preferred development workflow while providing users with a standard, reliable installation experience.
