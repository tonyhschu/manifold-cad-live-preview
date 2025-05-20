# A headless mode for generating output files

If we are able to define a module interface for a particular output, we should be able to enable a sort of headless mode for generating output files. This in turn will enable "mail merge" like capabilities for creating output files based on data.

# A Structured Input Format for Generating Configurable Interfaces

By defining a set of module inputs explicitly, we can potentially automate the creation of config UIs, enable parametric UIs for generating customizable outputs. A common example of this is all of the OpenSCAD UI on Makerworld.com

# A Strucuted Output Format for Debugging

Instead of returning just a single Manifold Object, enable the return of a structured collection of Objects, with something like the following type.

```typescript

type ManifoldObjectGroup {
  operation: 'Union' | 'Intersection' | 'Difference',
  name: string,
  objects: Manifold[],
  material?: GLTFMaterial
}
```

This structure can be displayed as a set of layers a la Figma/Photoshop, with toggles for visibility. This will aid in debugging.

Then, when an export is requested, the operations can be performed to produce the final geometry.
