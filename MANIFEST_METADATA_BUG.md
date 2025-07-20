# Bug: Model metadata not included in generated manifest.json

## 🐛 Bug Description

The V3 pipeline compiler extracts model metadata from both parametric configs and static model exports, but this metadata is not included in the generated `manifest.json` file. This results in generic fallback descriptions instead of the rich metadata provided by model authors.

## 🔍 Investigation Findings

### Current Behavior

**Model with metadata:**
```typescript
// test-v3-development/components/simple-cube.ts
export const modelMetadata = {
  name: "Simple Cube",
  description: "A basic 5x5x5 cube for testing",  // ← Rich description
  author: "V3 Test Suite"
};
```

**Generated manifest shows generic fallback:**
```json
{
  "id": "components/simple-cube",
  "name": "Simple Cube",
  "type": "static",
  "description": "Model: components/simple-cube"  // ← Generic fallback!
}
```

### Root Cause

The issue is in the manifest generation step:

**✅ Metadata IS extracted** (`packages/configurator/src/pipeline-compiler/model-compiler.ts:74`):
```typescript
const module = await import(moduleUrl);
const defaultExport = module.default;
const metadata = module.modelMetadata;  // ← Extracted correctly

// ...

return {
  id: modelId,
  name: modelName,
  type: modelType,
  // ...
  metadata  // ← Returned in compiled function data
};
```

**❌ Metadata NOT used** (`packages/configurator/src/pipeline-compiler/index.ts:89-93`):
```typescript
const manifest: PipelineManifest = {
  models: compiledFunctions.map(f => ({
    id: f.id,
    name: f.name,
    type: f.type
    // ❌ Missing: f.metadata.description, f.metadata.author, etc.
  })),
  // ...
};
```

## 🎯 Expected Behavior

The manifest should include the extracted metadata:

```json
{
  "id": "components/simple-cube",
  "name": "Simple Cube",
  "type": "static",
  "description": "A basic 5x5x5 cube for testing",
  "author": "V3 Test Suite"
}
```

## 🔧 Proposed Fix

### 1. Update Manifest Generation

**File:** `packages/configurator/src/pipeline-compiler/index.ts`

```typescript
const manifest: PipelineManifest = {
  models: compiledFunctions.map(f => ({
    id: f.id,
    name: f.name,
    type: f.type,
    description: f.metadata?.description || `${f.type} model: ${f.name}`,
    author: f.metadata?.author,
    version: f.metadata?.version
  })),
  // ...
};
```

### 2. Update PipelineManifest Type

**File:** `packages/configurator/src/types/pipeline.ts`

```typescript
export interface PipelineManifest {
  models: Array<{
    id: string;
    name: string;
    type: 'static' | 'parametric';
    description?: string;  // ← Add
    author?: string;       // ← Add
    version?: string;      // ← Add
  }>;
  // ...
}
```

### 3. Handle Both Metadata Sources

The fix should handle metadata from both sources:
- **Parametric models**: Extract from `config.description`, `config.author`, etc.
- **Static models**: Extract from `module.modelMetadata` export

## 🧪 Test Cases

1. **Static model with modelMetadata export** - Should use metadata in manifest
2. **Parametric model with config metadata** - Should use config metadata in manifest  
3. **Model without metadata** - Should fall back to generic description
4. **Mixed project** - Should handle both types correctly

## 📁 Affected Files

- `packages/configurator/src/pipeline-compiler/index.ts` (manifest generation)
- `packages/configurator/src/types/pipeline.ts` (type definitions)
- `test-v3-development/tests/metadata-extraction.test.ts` (existing test that should pass after fix)

## 🔗 Related Issues

This bug affects the user experience in the model selector and metadata display components, as they rely on the manifest data for showing model information.

## 💡 Additional Context

This issue was discovered during an investigation of the component guide accuracy. The metadata extraction system is actually quite sophisticated in V3, but this bug prevents the extracted metadata from reaching the UI layer through the manifest.

## 🏷️ Labels

- bug
- v3-architecture  
- metadata
- manifest
- pipeline-compiler
