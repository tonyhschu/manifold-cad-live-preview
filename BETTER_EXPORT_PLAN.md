# Better Export Plan for ManifoldCAD

## Current Problem

Our current approach in `src/lib/manifold.ts` manually wraps and re-exports individual ManifoldCAD methods. This creates several issues:

1. **Maintenance burden**: We need to manually update our wrapper whenever ManifoldCAD adds new features
2. **Incomplete API coverage**: Many operations are missing from our exports
3. **Documentation duplication**: We're rewriting docs that already exist in the ManifoldCAD API
4. **Risk of inconsistencies**: Manual wrapping can introduce subtle differences from the original API

## Proposed Solution

We'll continue using top-level await for synchronous access to ManifoldCAD, but change our export strategy to directly expose the initialized classes:

```typescript
// src/lib/manifold.ts
import ManifoldModule, { Manifold as ManifoldType, Vec3, CrossSection as CrossSectionType } from "manifold-3d";

// Use top-level await to initialize the module (this is the key part we're keeping)
console.log("Initializing Manifold module (top-level await)...");
const manifoldModule = await ManifoldModule();
manifoldModule.setup();
console.log("Manifold module initialized successfully");

// Export the initialized module components directly
export const Manifold = manifoldModule.Manifold;
export const CrossSection = manifoldModule.CrossSection;

// Export types from the original module
export { Vec3, ManifoldType, CrossSectionType };

// Automatically export all utility functions
// This approach dynamically exports all top-level functions that aren't classes
export const utils = Object.fromEntries(
  Object.entries(manifoldModule)
    .filter(([key, value]) => typeof value === 'function' && key !== 'Manifold' && key !== 'CrossSection')
);

// Also export top-level utility functions individually for direct import
Object.entries(utils).forEach(([key, value]) => {
  exports[key] = value;
});

// For advanced usage, export the raw module
export const getModule = () => manifoldModule;
```

## Benefits

1. **Full API access**: Users get access to ALL ManifoldCAD features, including those we haven't manually wrapped
2. **Future-proof**: When ManifoldCAD adds new methods or utility functions, they're automatically available without code changes
3. **Simplified maintenance**: We no longer need to update our exports when ManifoldCAD changes
4. **Original documentation**: Users can rely on the official ManifoldCAD documentation
5. **Preserves synchronous access**: We still keep the top-level await pattern that makes ManifoldCAD easier to use
6. **Automatic utility function exports**: New utility functions added to the ManifoldCAD API will be automatically exported

## Usage Example

The new API would be used with a class-based style:

```typescript
import { Manifold, CrossSection, setCircularSegments } from "../lib/manifold";

// Access utility functions directly
setCircularSegments(64);

// Create shapes using static methods
const box = Manifold.cube([10, 10, 10]);
const ball = Manifold.sphere(5);

// All operations are available as class methods
const result = Manifold.union([box, ball]);
const smoothed = Manifold.smooth(result, 0.5);

// CrossSection is also available
const slice = CrossSection.slice(result, [0, 0, 1], 0);

// You can also access utility functions through the utils object
import { utils } from "../lib/manifold";
utils.resetToCircularDefaults();
```

## Implementation Plan

1. Create a new implementation of `manifold.ts` using the direct export approach
2. Update any files that currently import from the old implementation
3. Document the new API approach in the README
4. Remove the old wrapper functions once transition is complete

This approach concentrates all the async complexity at the module initialization boundary while keeping the core modeling code pure and synchronous, which aligns with the project's goals.