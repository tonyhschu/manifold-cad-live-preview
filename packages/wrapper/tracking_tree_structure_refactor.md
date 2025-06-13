# Operation Tracking Tree Structure Refactor

## Current State

The operation tracking system currently returns a **flat array** in dependency order via `buildTree()`. This doesn't provide the hierarchical structure needed for directory-tree-like UIs.

### Current API

```typescript
const operations = registry.buildTree(rootId); // Returns OperationInfo[]
// [op_0, op_2, op_1, op_3] - flat dependency order
```

### Current Data Structure

```typescript
interface OperationInfo {
  id: string;
  type: string;
  inputIds: string[]; // References to dependencies
  metadata: Record<string, any>;
  timestamp: number;
}
```

## Goal: Tree Structure for UI

Replace the flat array with a hierarchical tree structure for directory-tree UIs that show operation dependencies and allow users to select specific inputs.

### New API

```typescript
const tree = registry.buildTree(rootId); // Returns OperationTreeNode
```

### New Data Structure

```typescript
interface OperationTreeNode {
  operation: OperationInfo;
  inputs: OperationTreeNode[]; // Child operations (dependencies)
  depth: number;
  isLeaf: boolean;
}

// Example tree structure (dependency order - operation at root):
// difference
// ├── translate
// │   └── cube
// └── sphere
```

## Design Decisions

### 1. Tree Direction

**Dependency order (top-down)**: Operation at root, inputs as children. This matches directory tree UIs where folders contain their contents.

### 2. Multiple Parents

**Duplicate nodes**: If an operation is used by multiple parents, show it multiple times in the tree. Simple and clear for UI consumption.

### 3. Tree Traversal

**Depth-first**: Build complete chains before siblings for intuitive tree navigation.

### 4. Property Names

**`inputs` instead of `children`**: More semantically correct - these are the operation's input dependencies.

## Implementation Plan

### 1. Update Interface

```typescript
interface OperationTreeNode {
  operation: OperationInfo;
  inputs: OperationTreeNode[]; // Renamed from children
  depth: number;
  isLeaf: boolean;
}
```

### 2. Replace buildTree Method

```typescript
class OperationRegistry {
  // Replace existing method entirely
  buildTree(rootId: string): OperationTreeNode {
    const buildNode = (id: string, depth: number): OperationTreeNode | null => {
      const operation = this.get(id);
      if (!operation) return null;

      // Build inputs from inputIds (dependency order)
      const inputs = operation.inputIds
        .map((inputId) => buildNode(inputId, depth + 1))
        .filter(Boolean);

      return {
        operation,
        inputs,
        depth,
        isLeaf: inputs.length === 0,
      };
    };

    return buildNode(rootId, 0);
  }
}
```

### 3. Update Tests

- Update existing tests to expect tree structure instead of flat array
- Test tree traversal and structure
- Test multiple inputs scenarios

## Implementation Steps

1. **Update type definitions** in `operation-registry.ts`
2. **Modify `buildTree` method** to return tree structure
3. **Update all tests** to work with new tree format
4. **Update README examples** to show tree structure
5. **Test with actual UI** to ensure it works for directory tree display

## Example Output

### Before (Flat Array)

```typescript
[
  { id: "op_0", type: "cube", inputIds: [] },
  { id: "op_1", type: "translate", inputIds: ["op_0"] },
  { id: "op_2", type: "sphere", inputIds: [] },
  { id: "op_3", type: "difference", inputIds: ["op_1", "op_2"] },
];
```

### After (Tree Structure)

```typescript
{
  operation: { id: 'op_3', type: 'difference' },
  inputs: [
    {
      operation: { id: 'op_1', type: 'translate' },
      inputs: [
        {
          operation: { id: 'op_0', type: 'cube' },
          inputs: [],
          depth: 2,
          isLeaf: true
        }
      ],
      depth: 1,
      isLeaf: false
    },
    {
      operation: { id: 'op_2', type: 'sphere' },
      inputs: [],
      depth: 1,
      isLeaf: true
    }
  ],
  depth: 0,
  isLeaf: false
}
```

This tree structure will be perfect for directory-tree UIs and operation selection!
