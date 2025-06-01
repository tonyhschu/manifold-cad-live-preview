# Feature Request: Operation Tracking System for Debugging and Visualization

## Summary

Implement a JavaScript Proxy-based operation tracking system for ManifoldCAD models to enable debugging and visualization of complex CSG operations, similar to PyTorch's computational graph but focused on geometry operations.

## Problem Statement

Debugging complex CSG models is challenging because:
- It's difficult to understand which operations contribute to the final geometry
- No way to toggle individual operations on/off for debugging
- Complex operation hierarchies are hard to visualize
- Difficult to identify problematic operations in large models

## Proposed Solution

A transparent operation tracking system using JavaScript Proxies that:
1. **Automatically tracks CSG operations** without changing existing code
2. **Builds dependency trees** through runtime discovery
3. **Works across module boundaries** seamlessly
4. **Provides rich debugging metadata** for UI visualization

### Core Architecture

- **ManifoldProxy**: Wraps Manifold objects and intercepts CSG operations
- **Operation Registry**: Lightweight global registry storing operation metadata (ID-based references)
- **Runtime Tree Discovery**: Builds operation trees on-demand by walking dependency chains
- **Factory Functions**: Initialize operation metadata for primitive objects

### Key Features

- ✅ **Memory efficient**: No circular references or retained geometry objects
- ✅ **Cross-module transparent**: Works across library boundaries without context passing
- ✅ **Lazy evaluation**: Tree construction only when needed
- ✅ **Cycle detection**: Proper handling of circular dependencies
- ✅ **Flexible cleanup**: Configurable memory management strategies

## Usage Example

```javascript
// Import tracking-enabled version
import { TrackedManifold } from 'manifold-tracking';

// Create tracked objects with metadata
const base = TrackedManifold.cube([10, 10, 2], {
    name: "Base Plate",
    color: "#FF0000"
});

const hole = TrackedManifold.cylinder(2, 2, 3, {
    name: "Mounting Hole"
});

// Operations are automatically tracked
const result = base
    .translate([0, 0, 1])
    .subtract(hole);

// Extract dependency tree for UI
const tree = result.getOperationTree();
console.log(tree);
/*
[
  { id: "op_0", type: "cube", inputIds: [], metadata: { name: "Base Plate" } },
  { id: "op_1", type: "cylinder", inputIds: [], metadata: { name: "Mounting Hole" } },
  { id: "op_2", type: "translate", inputIds: ["op_0"], metadata: { parameters: { offset: [0,0,1] } } },
  { id: "op_3", type: "subtract", inputIds: ["op_2", "op_1"], metadata: {} }
]
*/
```

## UI Integration Benefits

This would enable powerful debugging features in the ManifoldCAD live preview:

### 1. **Operation Tree View**
```
📁 Final Assembly
├── 📦 Base Plate (cube)
├── 📐 Translate (0, 0, 1)
└── ➖ Subtract
    └── 🔵 Mounting Hole (cylinder)
```

### 2. **Layer Toggle Controls**
- Checkbox for each operation to show/hide
- Step-by-step replay functionality
- "Undo" to specific operation points

### 3. **Visual Debugging**
- Highlight individual operations with different colors
- Show intermediate geometry states
- Identify which operations contribute to final result

## Technical Design

### Runtime Tree Discovery
Instead of maintaining global operation history, each proxy stores only its immediate operation info. The full dependency tree is reconstructed on-demand by walking the registry:

```javascript
class ManifoldProxy {
    constructor(target, operationInfo = null) {
        this._target = target;        // Original Manifold object
        this._operation = operationInfo; // THIS operation only
        
        // Auto-register in global registry
        if (operationInfo) {
            getOperationRegistry().register(operationInfo);
        }
    }
    
    _buildOperationTreeFromRegistry() {
        // Walk registry using operation IDs to rebuild full tree
        const registry = getOperationRegistry();
        // ... traverse dependency chain
    }
}
```

### Memory Management
Operations store IDs instead of object references, preventing memory leaks:

```javascript
{
    id: "op_123",
    type: "subtract",
    inputIds: ["op_111", "op_222"], // ID references, not objects
    metadata: { name: "Mounting Hole" },
    timestamp: Date.now()
}
```

### Cross-Module Support
Works transparently across library boundaries through shared operation registry:

```javascript
// bolt-library.js
export function createBolt(length, diameter) {
    const head = TrackedManifold.cylinder(diameter * 1.5, diameter * 1.5, 2);
    const shaft = TrackedManifold.cylinder(diameter/2, diameter/2, length);
    return head.union(shaft); // Tracked automatically
}

// main.js
import { createBolt } from './bolt-library.js';
const bolt = createBolt(20, 5); // Internal operations visible in tree
```

## Implementation Phases

### Phase 1: Core Implementation
- [ ] Basic ManifoldProxy with operation interception
- [ ] Operation registry with lazy initialization
- [ ] Runtime tree discovery algorithm
- [ ] Factory functions for primitives (cube, sphere, cylinder)
- [ ] Basic metadata support (names)

### Phase 2: Enhanced Tracking
- [ ] Advanced metadata (colors, grouping)
- [ ] Registry cleanup and pruning utilities
- [ ] Cycle detection in dependency traversal
- [ ] Untracked object handling
- [ ] Error handling and graceful degradation

### Phase 3: UI Integration
- [ ] Export formats optimized for UI consumption
- [ ] Integration with live preview rendering
- [ ] Operation toggle functionality
- [ ] Step-by-step replay system
- [ ] Performance optimization for large trees

## Benefits for ManifoldCAD Live Preview

1. **Enhanced Debugging**: Users can understand complex models by seeing operation breakdown
2. **Interactive Development**: Toggle operations on/off to isolate issues
3. **Educational Value**: Visual representation helps users learn CSG concepts
4. **Performance Debugging**: Identify expensive operations in complex models
5. **Model Verification**: Ensure operations execute as expected

## Technical Considerations

- **Performance**: Tree construction scales with operation count, but is lazy
- **Memory**: Registry requires periodic cleanup for long-running sessions
- **Compatibility**: Should work transparently with existing ManifoldCAD code
- **Testing**: Need clean registry reset between test cases

## Related Work

This approach is inspired by PyTorch's automatic differentiation system, but adapted for geometry operations rather than gradient computation. The key insight is using runtime tree discovery instead of maintaining global state.

---

**Would love feedback on this approach!** This could significantly improve the debugging experience for complex CSG models in ManifoldCAD.