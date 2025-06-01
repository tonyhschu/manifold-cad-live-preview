# Operation Tree Visualization

## Overview

This document outlines the next increment for the manifold-cad-live-preview project: adding UI integration for operation tree visualization. The core operation tracking functionality has been implemented and tested - now we need to surface it in the browser interface.

## Current State ✅

### Completed: Core Operation Tracking
- **Proxy-based tracking** - Automatic operation capture with zero API changes
- **Operation trees** - `getOperationTree()` returns dependency-ordered operations  
- **Complete test coverage** - All 119 tests passing
- **Cross-module compatibility** - Works in both browser and pipeline modes
- **API transparency** - All existing models work unchanged

### Technical Implementation
```typescript
// Any model automatically gets tracking
const model = Manifold.cube([10, 10, 10])
  .translate([1, 0, 0])
  .union(Manifold.sphere(5));

// Extract operation tree
const tree = model.getOperationTree();
// Returns: [cube, sphere, translate, union] in dependency order
```

### Test Coverage
- **10 Operation Tracking Tests** - Core proxy functionality
- **10 Manifold Integration Tests** - Updated for proxy architecture  
- **99+ Additional Tests** - All existing functionality preserved

## Next Increment: UI Integration 🎯

### Goal
Surface operation tracking in the browser interface to help users debug and understand their CSG models.

### Phase 1: Basic Console Integration
**Start Simple**: Add console logging of operation trees when models load.

```typescript
// In model loading code
const model = await loadModel(modelId);
console.log("Operation Tree:", model.getOperationTree());
```

**Expected Output**:
```
Operation Tree: [
  { id: "op_0", type: "cube", parameters: { size: [10,10,10] }, inputIds: [] },
  { id: "op_1", type: "translate", parameters: { offset: [1,0,0] }, inputIds: ["op_0"] },
  { id: "op_2", type: "sphere", parameters: { radius: 5 }, inputIds: [] },
  { id: "op_3", type: "union", parameters: {}, inputIds: ["op_1", "op_2"] }
]
```

### Phase 2: UI Tree Display
**Add Visual Component**: Create a collapsible tree view in the sidebar.

```typescript
// New component: src/components/operation-tree/operation-tree.ts
export class OperationTreeComponent extends HTMLElement {
  displayTree(operations: OperationInfo[]): void {
    // Render tree with indentation showing dependencies
    // Show operation names, types, and parameters
  }
}
```

**UI Integration Points**:
- Add to existing sidebar alongside parameter controls
- Show/hide toggle for the operation tree panel
- Update when model changes

### Phase 3: Interactive Features
**Enhanced Functionality**:
- Click operation to highlight in 3D view
- Toggle operations on/off to see intermediate results
- Step-by-step replay of model construction
- Export operation tree as JSON

## Implementation Strategy

### 1. Model Service Integration
Update `ModelService.ts` to expose operation trees:

```typescript
export class ModelService {
  async loadModel(modelId: string): Promise<{
    model: any;
    operationTree?: OperationInfo[];
  }> {
    const model = await loadModelById(modelId);
    
    // Extract operation tree if available
    const operationTree = typeof model.getOperationTree === 'function' 
      ? model.getOperationTree() 
      : undefined;
      
    return { model, operationTree };
  }
}
```

### 2. UI Component Structure
```
src/components/
├── operation-tree/
│   ├── operation-tree.ts          # Main tree component
│   ├── operation-node.ts          # Individual operation display
│   └── operation-tree.css         # Styling
```

### 3. Store Integration
Add operation tree state to the global store:

```typescript
// src/ui/store.ts
interface AppState {
  // ... existing state
  operationTree?: OperationInfo[];
  showOperationTree: boolean;
}
```

## Data Structure

### OperationInfo Interface
```typescript
interface OperationInfo {
  id: string;                    // Unique operation ID
  type: string;                  // Operation type (cube, union, etc.)
  inputIds: string[];            // Dependencies
  metadata: {
    parameters?: any;            // Operation parameters
    name?: string;               // User-friendly name
    [key: string]: any;          // Additional metadata
  };
  timestamp: number;             // Creation time
}
```

### Tree Visualization Format
Operations should be displayed in dependency order with visual hierarchy:

```
📦 Base Plate (cube)
  └── 📐 Translated Base (translate)
      └── 🔗 Final Result (union)
          └── ⚪ Hole (sphere)
```

## Benefits

### For Users
- **Debug CSG Models** - See exactly how complex models are constructed
- **Learn by Example** - Understand operation sequences in existing models
- **Optimize Performance** - Identify unnecessary operations
- **Educational Value** - Visual representation of CSG concepts

### For Development
- **Testing Aid** - Verify operation tracking works correctly
- **Model Validation** - Ensure models are constructed as expected
- **Performance Analysis** - Identify bottlenecks in model construction

## Success Criteria

### Phase 1 Complete When:
- [ ] Console logging shows operation trees for all models
- [ ] Tree data includes all operations with correct dependencies
- [ ] No performance impact on model loading

### Phase 2 Complete When:
- [ ] UI component displays operation tree in sidebar
- [ ] Tree shows operation hierarchy with proper indentation
- [ ] Component updates when model changes
- [ ] Toggle to show/hide operation tree panel

### Phase 3 Complete When:
- [ ] Click operations to highlight in 3D view
- [ ] Toggle individual operations on/off
- [ ] Step-by-step model construction replay
- [ ] Export operation tree functionality

## Technical Notes

### Performance Considerations
- Operation tracking adds minimal overhead (proxy calls)
- Tree building is O(n) where n = number of operations
- UI updates should be debounced for complex models

### Browser Compatibility
- Uses existing component architecture (Web Components)
- No additional dependencies required
- Works with current Vite/TypeScript setup

### Future Extensions
- Operation tree diffing between model versions
- Visual operation flow diagrams
- Integration with parametric model controls
- Operation tree templates for common patterns

---

**Ready to implement!** The foundation is solid with comprehensive test coverage. Time to make operation trees visible and useful for debugging CSG models. 🚀
