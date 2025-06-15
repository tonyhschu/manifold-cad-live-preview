# Model Watcher V2 Implementation Plan

## Overview

Replace the current complex HMR system with a clean file-watcher + temp folder approach that separates model compilation from UI updates.

## Architecture: Option A - Separate Vite Instances

```
User Project:
├── Vite Instance 1: Model Watcher & Compilation
│   ├── Watches ./components/**/*.{ts,js}
│   ├── Compiles models on change
│   ├── Generates GLB blobs
│   └── Writes to ./temp/ folder
│
└── Vite Instance 2: UI Server
    ├── Serves configurator UI
    ├── Watches ./temp/ for changes
    └── Updates model viewer when blobs change
```

## Implementation Phases

### Phase 1: Model Watcher Plugin
**Goal**: Create Vite plugin that watches model files and writes compilation results to temp folder

**Verification**:
- [ ] Plugin detects model file changes
- [ ] Compiles TypeScript models successfully
- [ ] Writes temp/manifest.json with model list
- [ ] Console logs show compilation pipeline working

**Files to Create**:
- `packages/configurator/src/plugins/model-watcher.ts`
- `packages/configurator/src/core/model-compiler.ts`

**Test Plan**:
```bash
# 1. Start model watcher only
npm run dev:models

# 2. Edit a model file
# 3. Check temp/ folder contents
ls -la temp/
cat temp/manifest.json

# 4. Verify blob files exist
ls -la temp/blobs/
```

### Phase 2: Blob Generation Pipeline
**Goal**: Generate GLB blobs from compiled models and write to temp folder

**Verification**:
- [ ] Models compile to Manifold objects
- [ ] GLB export pipeline works
- [ ] Blobs written to temp/blobs/
- [ ] Manifest includes blob metadata (size, timestamp)

**Files to Modify**:
- `packages/configurator/src/core/model-compiler.ts`
- `packages/configurator/src/services/ExportService.ts`

**Test Plan**:
```bash
# 1. Edit model file with visible geometry change
# 2. Check blob file is updated
stat temp/blobs/components-chassis-copy.glb

# 3. Verify blob content differs
# Compare file sizes/timestamps before and after edit
```

### Phase 3: UI File Watcher
**Goal**: UI watches temp folder and updates model viewer when blobs change

**Verification**:
- [ ] UI detects temp/manifest.json changes
- [ ] Model selector updates with new models
- [ ] Model viewer updates when current model blob changes
- [ ] No full page reloads

**Files to Create**:
- `packages/configurator/src/watchers/temp-folder-watcher.ts`

**Files to Modify**:
- `packages/configurator/src/components/canvas/ModelViewer.ts`
- `packages/configurator/src/state/store.ts`

**Test Plan**:
```bash
# 1. Start both model watcher and UI
npm run dev

# 2. Edit model file
# 3. Verify UI updates without page reload
# 4. Check browser console for file watcher logs
```

### Phase 4: Integration & Polish
**Goal**: Integrate both Vite instances and add production build support

**Verification**:
- [ ] `npm run dev` starts both instances
- [ ] File changes trigger end-to-end updates
- [ ] `npm run build` generates production assets
- [ ] Debouncing prevents rapid rebuilds

**Files to Create**:
- `packages/configurator/vite.models.config.ts`
- `test-local-project/vite.models.config.ts`

**Files to Modify**:
- `packages/configurator/package.json`
- `test-local-project/package.json`

## Temp Folder Structure

```
temp/
├── manifest.json          # Model registry
├── timestamps.json        # Last update times
├── blobs/
│   ├── main.glb
│   ├── components-chassis-copy.glb
│   └── components-wheel.glb
└── logs/
    └── compilation.log     # Debug info
```

### manifest.json Format
```json
{
  "models": [
    {
      "id": "components/chassis-copy",
      "name": "Chassis Copy",
      "type": "static",
      "blobPath": "./blobs/components-chassis-copy.glb",
      "lastUpdated": "2024-01-15T10:30:00Z",
      "size": 1024
    }
  ],
  "lastBuild": "2024-01-15T10:30:00Z"
}
```

## Key Design Decisions

### 1. File Watching Strategy
- **Use chokidar** for cross-platform file watching
- **Debounce changes** (300ms) to avoid rapid rebuilds
- **Watch only model files** (not temp folder from model watcher side)

### 2. Communication Between Instances
- **File-based communication** via temp folder
- **No WebSockets needed** - simpler architecture
- **Polling manifest.json** every 500ms from UI side

### 3. Error Handling
- **Compilation errors** written to temp/logs/
- **UI shows error state** when compilation fails
- **Graceful degradation** if temp folder missing

### 4. Development vs Production
- **Development**: Both Vite instances running
- **Production**: Pre-compile all models, serve static UI

## Potential Issues & Solutions

### Issue 1: File System Race Conditions
**Problem**: UI reads blob while being written
**Solution**: Write to temp file, then atomic rename

### Issue 2: TypeScript Compilation
**Problem**: Models need compilation before import
**Solution**: Use Vite's built-in TypeScript support

### Issue 3: Import Path Resolution
**Problem**: Dynamic imports might fail
**Solution**: Use absolute paths, configure Vite resolve

### Issue 4: Blob URL Cleanup
**Problem**: Memory leaks from old blob URLs
**Solution**: Revoke old URLs before creating new ones

## Success Criteria

1. **No more HMR conflicts** - Clean separation of concerns
2. **Fast feedback loop** - Model changes visible in <2 seconds
3. **Reliable updates** - No cache invalidation issues
4. **Easy debugging** - Clear logs and temp folder inspection
5. **Scalable** - Works with any number of models

## Migration Plan

1. **Keep existing HMR** as fallback during development
2. **Implement new system** alongside current one
3. **Test thoroughly** with various model types
4. **Switch default** to new system once stable
5. **Remove old HMR code** after verification period
