// Logo component - parametric pyramid using ofMesh
import { Manifold, P, createConfig } from "@manifold-studio/wrapper";

/**
 * Create a triangular pyramid at a specific corner position
 * @param w - width dimension
 * @param h - height dimension
 * @param cornerX - X offset for the corner (-1 for left, +1 for right)
 * @param cornerZ - Z offset for the corner (-1 for back, +1 for front)
 */
function createCornerPyramid(w: number, h: number, cornerX: number, cornerZ: number) {
  // Calculate the center position for this corner
  const centerX = (cornerX * w) / 2;
  const centerZ = (cornerZ * w) / 2;

  // Define the 4 vertices of the pyramid relative to this corner
  const vertices = new Float32Array([
    // Top vertex (at the corner of the cube)
    centerX, h, centerZ,
    // Bottom triangle vertices (forming triangle toward center)
    centerX, 0, centerZ,                    // Corner vertex
    0, 0, centerZ, // Toward center on X
    centerX, 0, 0   // Toward center on Z
  ]);

  // Define the triangular faces - winding depends on corner orientation
  // For consistent outward normals, we need to flip winding for certain corners
  const needsFlip = (cornerX * cornerZ) < 0; // True for corners (-1,+1) and (+1,-1)

  const triangles = needsFlip ?
    // Flipped winding for corners 2 and 4
    new Uint32Array([
      // Bottom face
      1, 3, 2,  // Corner -> Z-center -> X-center

      // Side faces
      0, 1, 2,  // Top -> Corner -> X-center
      0, 2, 3,  // Top -> X-center -> Z-center
      0, 3, 1   // Top -> Z-center -> Corner
    ]) :
    // Normal winding for corners 1 and 3
    new Uint32Array([
      // Bottom face
      1, 2, 3,  // Corner -> X-center -> Z-center

      // Side faces
      0, 2, 1,  // Top -> X-center -> Corner
      0, 3, 2,  // Top -> Z-center -> X-center
      0, 1, 3   // Top -> Corner -> Z-center
    ]);

  // Create the mesh object
  const mesh = {
    vertProperties: vertices,
    triVerts: triangles,
    numProp: 3  // 3 properties per vertex (X, Y, Z)
  };

  return Manifold.ofMesh(mesh);
}

const defaultWidth = 10;
const defaultHeight = defaultWidth / 1.1666667;

// Export parametric config as default for UI compatibility
export default createConfig(
  {
    width: P.number(defaultWidth, 5, 50, 1),
    height: P.number(defaultHeight, 5, 50, 1),
  },
  (params) => {
    const { width: w, height: h } = params;

    const cube = Manifold.cube([w, h, w], true)
      .translate([0, h/2, 0]);

    // Create 4 corner pyramids
    const pyramid1 = createCornerPyramid(w, h, -1, -1); // Back-left
    const pyramid2 = createCornerPyramid(w, h, +1, -1); // Back-right
    const pyramid3 = createCornerPyramid(w, h, +1, +1); // Front-right
    const pyramid4 = createCornerPyramid(w, h, -1, +1); // Front-left

    const allPyramids = Manifold.union([pyramid1, pyramid2, pyramid3, pyramid4]);

    // Subtract all pyramids from the cube
    return cube.subtract(allPyramids);
  },
  {
    name: "Main Logo",
    description: "A parametric Manifold Studio Logo Shape with adjustable width and height"
  }
);
