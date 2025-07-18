# ManifoldCAD TypeScript Documentation

## Overview

ManifoldCAD is a geometry library dedicated to creating and operating on manifold triangle meshes. A manifold mesh represents a solid object and is crucial for manufacturing, CAD, structural analysis, and other applications.

**Key Features:**

- **Reliability**: Guaranteed manifold output without caveats or edge cases
- **Performance**: Efficient algorithms with extensive parallelization support
- **Vertex Properties**: Support for arbitrary vertex properties (normals, UV coordinates, colors, etc.)
- **Material Mapping**: Enables mapping of materials for rendering use-cases
- **Mesh Boolean Operations**: Guaranteed-manifold Boolean operations (first of its kind)

## Installation and Setup

```bash
npm i manifold-3d
```

```typescript
import Module from "manifold-3d";
const wasm = await Module();
wasm.setup();
const { Manifold } = wasm;
```

## Important Memory Management

⚠️ **Critical**: Since Manifold is a WASM module, it does not automatically garbage-collect like regular JavaScript. You must manually call `delete()` on each object constructed by your scripts (both `Manifold` and `CrossSection` objects).

## Basic Usage Example

```typescript
const { cube, sphere } = Manifold;
const box = cube([100, 100, 100], true);
const ball = sphere(60, 100);
const result = box.subtract(ball);
```

## Core Classes and Types

### Manifold Class

The main class representing an oriented, 2-manifold triangle mesh - a boundary-representation of a solid object.

#### Static Constructors

**Basic Shapes:**

- `Manifold.cube(size?, center?)` - Creates a unit cube
- `Manifold.sphere(radius, circularSegments?)` - Creates a geodesic sphere
- `Manifold.cylinder(height, radiusLow, radiusHigh?, circularSegments?, center?)` - Creates cylinders and cones
- `Manifold.tetrahedron()` - Creates a tetrahedron

**From Cross-Sections:**

- `Manifold.extrude(crossSection, height, nDivisions?, twistDegrees?, scaleTop?, center?)` - Extrudes 2D cross-sections
- `Manifold.revolve(crossSection, circularSegments?, revolveDegrees?)` - Revolves cross-sections around Y-axis

**From Meshes:**

- `Manifold.of(mesh)` - Converts a Mesh into a Manifold
- `Manifold.smooth(mesh, sharpenedEdges?)` - Creates smooth version with tangents

**Boolean Operations:**

- `Manifold.union(manifolds)` - Combines multiple manifolds
- `Manifold.difference(a, b)` - Subtracts b from a
- `Manifold.intersection(a, b)` - Intersection of two manifolds
- `Manifold.hull(manifolds)` - Convex hull of manifolds

**Level Set Construction:**

- `Manifold.level(sdf, bounds, edgeLength, level?, tolerance?)` - Creates mesh from Signed Distance Function

**Utility:**

- `Manifold.compose(manifolds)` - Topological composition of manifolds
- `Manifold.reserveIDs(n)` - Reserves unique mesh IDs

#### Instance Methods

**Boolean Operations:**

- `add(other)` - Union with another manifold
- `subtract(other)` - Subtract another manifold
- `intersect(other)` - Intersect with another manifold

**Transformations:**

- `translate(vec)` - Move in space
- `rotate(angles)` - Euler angle rotation (X, Y, Z in degrees)
- `scale(factor)` - Scale uniformly or per-axis
- `mirror(normal)` - Mirror over plane defined by normal vector
- `warp(function)` - Apply arbitrary vertex transformation function

**Mesh Operations:**

- `refine(n)` - Split every edge into n pieces
- `refineToLength(length)` - Split edges to target length
- `refineToTolerance(tolerance)` - Adaptive refinement based on curvature
- `simplify(tolerance?)` - Simplify mesh within tolerance

**Analysis:**

- `getMesh(normalIdx?)` - Get MeshGL for rendering
- `slice(height)` - Get 2D cross-section at Z-height
- `project()` - Project outline onto X-Y plane
- `getCircularTangents()` - Get tangent vectors for smooth interpolation
- `calculateCurvature(gaussianIdx, meanIdx)` - Calculate vertex curvatures
- `calculateNormals(normalIdx, minSharpAngle?)` - Calculate normal vectors

**Mesh Processing:**

- `smooth(minSharpAngle?, minSmoothness?)` - Add tangent vectors for smoothing
- `trimByPlane(normal, originOffset)` - Remove geometry behind plane
- `split(normal, originOffset)` - Split by plane into two manifolds
- `splitByPlane(normal, originOffset)` - Convenience version of split

**Properties:**

- `boundingBox()` - Get axis-aligned bounding box
- `genus()` - Get topological genus
- `getSurfaceArea()` - Calculate surface area
- `getVolume()` - Calculate volume
- `isEmpty()` - Check if manifold is empty
- `status()` - Get error status
- `tolerance()` - Get current tolerance value
- `originalID()` - Get original mesh ID
- `asOriginal()` - Reset to new original ID

**Mesh Relations:**

- `getMeshRelation()` - Get relationship data to input meshes
- `numVert()` - Number of vertices
- `numEdge()` - Number of edges
- `numTri()` - Number of triangles

### Mesh Class

Basic mesh representation with vertex and triangle data.

**Properties:**

- `vertPos` - Vertex positions (3×numVert)
- `triVerts` - Triangle vertex indices (3×numTri)
- `vertNormal` - Vertex normals (optional)
- `triNormal` - Triangle normals (optional)
- `halfedgeTangent` - Tangent vectors for smooth interpolation (optional)
- `runIndex` - Material run boundaries (optional)
- `runOriginalID` - Original IDs for material runs (optional)
- `faceID` - Face IDs mapping to source triangles (optional)

### MeshGL Class

Render-ready mesh with all vertex properties interleaved, suitable for graphics libraries.

**Properties:**

- `numProp` - Number of properties per vertex
- `vertProperties` - All vertex data interleaved
- `triVerts` - Triangle indices
- `mergeFromVert` - Merge mapping for manifold reconstruction
- `mergeToVert` - Merge mapping for manifold reconstruction
- `runIndex` - Material boundaries
- `runOriginalID` - Material IDs
- `faceID` - Source face mapping
- `runTransform` - Transforms applied to each run

### CrossSection Class

Represents 2D polygonal cross-sections for extrusion and revolution operations.

**Methods:**

- Construction from polygons
- Boolean operations (union, difference, intersection)
- Offsetting and transformation
- Conversion to/from polygons

### Global Types

**Vec3**: `[number, number, number]` - 3D vector
**Vec2**: `[number, number]` - 2D vector  
**Rect**: Axis-aligned rectangle bounds
**Polygons**: Array of polygon point arrays
**SmoothingHalfedge**: Halfedge smoothing specification

## Advanced Features

### Vertex Properties

Manifolds support arbitrary vertex properties stored as float values in numbered channels:

- Properties can be shared between vertices for efficiency
- Multiple property vertices can be associated with a single geometric vertex
- Useful for normals, UV coordinates, colors, materials, etc.

### Mesh Relations

The library tracks relationships between input and output meshes:

- `OriginalID` tracking through operations
- `faceID` mapping to source faces
- Transform tracking for object-level properties
- Material preservation through Boolean operations

### Smooth Interpolation

Advanced smoothing capabilities:

- Halfedge tangent vectors for C1 continuity
- Quad and triangle interpolation
- Sharp edge preservation
- Curvature-driven refinement

### File Format Support

**Recommended formats:**

- **glTF**: With EXT_mesh_manifold extension for lossless manifold data
- **3MF**: Designed for manifold meshes representing solid objects

**Avoid:**

- **STL**: Lossy format that may break manifoldness

## Error Handling

The library provides robust error handling:

- Status codes for invalid input
- Tolerance tracking through operations
- Guaranteed manifold output or clear error indication

## Performance Considerations

- Built for parallelization and high performance
- WASM-based for near-native speed
- Efficient Boolean operations
- Memory management requires manual cleanup

## Integration Examples

The library includes examples for integration with:

- Three.js
- model-viewer
- glTF workflows
- Various rendering pipelines

## Use Cases

- CAD modeling and design
- 3D printing preparation
- Computational geometry
- Mesh processing and repair
- Boolean solid modeling
- Manufacturing applications
- Structural analysis mesh generation
