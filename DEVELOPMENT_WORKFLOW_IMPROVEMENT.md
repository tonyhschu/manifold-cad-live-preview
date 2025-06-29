# Development Workflow Improvement

## Current Issues

### Complex Multi-Package Build Chain
We currently have a complex development workflow with multiple build steps and caching layers:

```
@manifold-studio/wrapper (C++/WASM) → build → npm link
                                              ↓
@manifold-studio/configurator (TS) → build → npm link → test-v3-development
                                              ↓
test-v3-development/main.ts → Vite build → temp/pipeline.js → HMR
```

### Specific Problems Encountered

1. **NPM Link Caching Issues**
   - Changes to configurator source don't propagate to test environment
   - `reloadPipeline()` method added to V3ModelService not available in browser
   - Multiple cache layers: TypeScript build → Vite build → npm link → Vite dev server

2. **Development Feedback Loop Too Slow**
   - Change configurator code → rebuild lib → npm link updates → restart dev server
   - 4+ steps between code change and seeing results
   - Hard to debug HMR issues when the development environment itself has caching problems

3. **Dual Build System Complexity**
   - **Package builds**: wrapper + configurator building their own dist/
   - **User builds**: test-v3-development building pipeline.js with custom HMR
   - Two separate Vite processes with different configurations
   - Custom HMR events getting lost in the complexity

4. **Cache Invalidation Problems**
   - Browser cache, Vite module cache, npm link cache, TypeScript build cache
   - Hard refresh + dev tools cache disable + restart dev server still not enough
   - No clear way to "bust all caches" and start fresh

## Root Cause Analysis

The fundamental issue is **mixing development and distribution workflows**:

- **Distribution workflow**: Source → Build → Package → Consume (optimized for end users)
- **Development workflow**: Source → Direct consumption (optimized for iteration speed)

We're trying to use the distribution workflow for development, which introduces unnecessary complexity and caching layers.

## Recommended Solutions

### Option 1: Source-Based Development (Recommended)

**Approach**: Use Vite aliases to import source files directly during development.

```typescript
// test-v3-development/vite.config.ts
export default {
  resolve: {
    alias: {
      '@manifold-studio/configurator': path.resolve('../packages/configurator/src'),
      '@manifold-studio/wrapper': path.resolve('../packages/wrapper/dist') // Keep as built
    }
  }
}
```

**Benefits**:
- ✅ Single Vite process handles all TypeScript compilation
- ✅ Immediate feedback: change configurator → see results instantly
- ✅ No npm link complexity
- ✅ Natural HMR without custom complexity
- ✅ Wrapper stays as stable built package (rarely changes)

**Workflow**:
```
@manifold-studio/wrapper (built) ──┐
                                   ├─→ test-v3-development (single Vite process)
@manifold-studio/configurator (src) ─┘
```

### Option 2: Monorepo Workspaces

Convert to npm/yarn workspaces for better inter-package dependency management.

**Benefits**:
- ✅ Package manager handles dependencies automatically
- ✅ More reliable than manual npm link
- ✅ Standard industry practice

**Drawbacks**:
- ❌ Still requires build steps
- ❌ Doesn't eliminate caching issues
- ❌ More complex project structure

### Option 3: Direct Source Integration

Copy configurator source into test-v3-development during development.

**Benefits**:
- ✅ Zero linking complexity
- ✅ Single codebase during development

**Drawbacks**:
- ❌ Need to sync changes back to packages/configurator
- ❌ Risk of diverging codebases

## Implementation Plan for Option 1

### Phase 1: Setup Source-Based Development
1. Configure Vite aliases in test-v3-development
2. Remove npm link dependencies
3. Update imports to work with direct source access
4. Test that configurator changes appear immediately

### Phase 2: Simplify HMR System
1. Remove custom HMR complexity (may not be needed with direct source)
2. Rely on Vite's native HMR for configurator changes
3. Keep custom HMR only for pipeline.js changes

### Phase 3: Optimize Build Process
1. Keep wrapper as built package (stable)
2. Only build configurator for distribution/CI
3. Development uses source files exclusively

## Expected Outcomes

### Development Experience
- **Before**: Change code → wait 30+ seconds → maybe see results
- **After**: Change code → see results in <2 seconds

### Debugging Experience  
- **Before**: Is the issue in my code or the build system?
- **After**: Direct source debugging, clear error messages

### HMR Reliability
- **Before**: Custom HMR events getting lost in build complexity
- **After**: Native Vite HMR + minimal custom events for pipeline only

## Migration Strategy

### Step 1: Backup Current State
- Commit all current work
- Document current npm link setup for rollback

### Step 2: Implement Vite Aliases
- Add alias configuration
- Test basic functionality

### Step 3: Remove NPM Links
- Unlink packages
- Update package.json dependencies
- Verify everything still works

### Step 4: Test HMR System
- Verify configurator changes trigger immediate updates
- Test pipeline HMR still works
- Confirm model viewer updates correctly

## Success Criteria

1. **Configurator changes visible in <2 seconds**
2. **No manual build steps during development**
3. **HMR system works reliably**
4. **Clear error messages when things break**
5. **Easy to onboard new developers**

## Rollback Plan

If source-based development doesn't work:
1. Restore npm link setup
2. Investigate alternative caching solutions
3. Consider containerized development environment
