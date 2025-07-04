// src/lib/gltf-export.ts
// GLB/glTF export utilities for the synchronous Manifold API

import type { ManifoldType } from './manifold';

import {
  Document,
  WebIO,
  Material,
  Accessor
} from "@gltf-transform/core";
import { EXTManifold } from "./manifold-gltf";

/**
 * Attribute definitions for mapping manifold vertex properties to glTF attributes
 */
export const attributeDefs = {
  POSITION: { type: Accessor.Type.VEC3, components: 3 },
  NORMAL: { type: Accessor.Type.VEC3, components: 3 },
  TANGENT: { type: Accessor.Type.VEC4, components: 4 },
  TEXCOORD_0: { type: Accessor.Type.VEC2, components: 2 },
  TEXCOORD_1: { type: Accessor.Type.VEC2, components: 2 },
  COLOR_0: { type: Accessor.Type.VEC3, components: 3 },
  JOINTS_0: { type: Accessor.Type.VEC4, components: 4 },
  WEIGHTS_0: { type: Accessor.Type.VEC4, components: 4 },
  SKIP_1: { type: null, components: 1 },
  SKIP_2: { type: null, components: 2 },
  SKIP_3: { type: null, components: 3 },
  SKIP_4: { type: null, components: 4 },
};

export type Attribute = keyof typeof attributeDefs;

/**
 * Properties for a Manifold primitive in glTF
 */
export interface Properties {
  material: Material;
  attributes: Attribute[];
}

/**
 * Setup the WebIO instance to use the manifold extension
 */
export function setupIO(io: WebIO): WebIO {
  return io.registerExtensions([EXTManifold]);
}

/**
 * Convert a Manifold mesh to a glTF document
 * @param manifoldObject The manifold object to convert
 * @returns A Promise that resolves to an GLB blob
 * @throws Error if the conversion fails
 */
export async function manifoldToGLB(manifoldObject: ManifoldType): Promise<Blob> {
  // Create a new document and IO instance
  const document = new Document();
  const io = new WebIO();
  setupIO(io);

  // Add a buffer to the document
  document.createBuffer();

  // Create a default material optimized for CAD rendering
  const material = document
    .createMaterial()
    .setName("CAD Material")
    .setBaseColorFactor([0.8, 0.8, 0.8, 1.0])
    .setMetallicFactor(0.0)  // Non-metallic for clearer face definition
    .setRoughnessFactor(0.8) // Higher roughness for less reflective, more matte appearance
    .setDoubleSided(false);  // Single-sided for better performance and clearer edges

  // Get mesh data from the manifold object
  const mesh = manifoldObject.getMesh();

  // Create the manifold extension
  const manifoldExtension = document.createExtension(EXTManifold);
  const gltfMesh = document.createMesh().setName("ManifoldMesh");
  const manifoldPrimitive = manifoldExtension.createManifoldPrimitive();
  gltfMesh.setExtension("EXT_mesh_manifold", manifoldPrimitive as any);

  // Get the buffer
  const buffer = document.getRoot().listBuffers()[0];

  // Create primitive indices
  const indicesArray = new Uint32Array(mesh.triVerts);
  const indices = document
    .createAccessor("primitive indices")
    .setBuffer(buffer)
    .setType(Accessor.Type.SCALAR)
    .setArray(indicesArray);

  // Create attributes following the reference implementation pattern
  const attributes = ['POSITION', 'NORMAL'];
  const primitive = document.createPrimitive().setIndices(indices);

  // Create vertex data with positions and calculated flat normals
  const positionsArray = extractPositions(mesh);
  const normalsArray = calculateFlatNormals(positionsArray, indicesArray);

  // Create interleaved vertex properties (position + normal per vertex)
  const numVert = positionsArray.length / 3;
  const vertProperties = new Float32Array(numVert * 6); // 3 for position + 3 for normal

  for (let v = 0; v < numVert; v++) {
    // Position (offset 0-2)
    vertProperties[v * 6 + 0] = positionsArray[v * 3 + 0];
    vertProperties[v * 6 + 1] = positionsArray[v * 3 + 1];
    vertProperties[v * 6 + 2] = positionsArray[v * 3 + 2];

    // Normal (offset 3-5)
    vertProperties[v * 6 + 3] = normalsArray[v * 3 + 0];
    vertProperties[v * 6 + 4] = normalsArray[v * 3 + 1];
    vertProperties[v * 6 + 5] = normalsArray[v * 3 + 2];
  }

  // Create attributes following reference pattern
  let offset = 0;
  for (const attribute of attributes) {
    let components: number;
    let accessorType: any;

    if (attribute === 'POSITION') {
      components = 3;
      accessorType = Accessor.Type.VEC3;
    } else if (attribute === 'NORMAL') {
      components = 3;
      accessorType = Accessor.Type.VEC3;
    } else {
      continue;
    }

    // Extract attribute data from interleaved vertProperties
    const array = new Float32Array(components * numVert);
    for (let v = 0; v < numVert; v++) {
      for (let i = 0; i < components; i++) {
        array[components * v + i] = vertProperties[6 * v + offset + i];
      }
    }

    // Create accessor and assign to primitive
    const accessor = document
      .createAccessor(attribute)
      .setBuffer(buffer)
      .setType(accessorType)
      .setArray(array);

    primitive.setAttribute(attribute, accessor);
    offset += components;
  }

  primitive.setMaterial(material);

  // Add the primitive to the mesh
  gltfMesh.addPrimitive(primitive);

  // Set up the manifold primitive
  manifoldPrimitive.setIndices(indices);
  manifoldPrimitive.setRunIndex([0, indicesArray.length]);

  // Create a node for the mesh
  const node = document
    .createNode()
    .setName("ManifoldNode")
    .setMesh(gltfMesh);

  // Create a scene and add the node
  const scene = document
    .createScene()
    .setName("ManifoldScene")
    .addChild(node);

  // Set as the default scene
  document.getRoot().setDefaultScene(scene);

  // Export to GLB
  const glbData = await io.writeBinary(document);
  return new Blob([glbData], { type: "model/gltf-binary" });
}


/**
 * Extract positions from a manifold mesh
 * @param mesh The mesh data from a manifold instance
 * @returns Float32Array containing position data
 */
function extractPositions(mesh: { vertProperties: Float32Array; numProp: number }): Float32Array {
  const numVerts = mesh.vertProperties.length / mesh.numProp;
  const positions = new Float32Array(numVerts * 3);

  for (let i = 0; i < numVerts; i++) {
    const baseIdx = i * mesh.numProp;
    positions[i * 3] = mesh.vertProperties[baseIdx];
    positions[i * 3 + 1] = mesh.vertProperties[baseIdx + 1];
    positions[i * 3 + 2] = mesh.vertProperties[baseIdx + 2];
  }

  return positions;
}

/**
 * Calculate flat normals for CAD-style rendering
 * Each triangle gets its own face normal, creating sharp edges between faces
 */
function calculateFlatNormals(
  positions: Float32Array,
  indices: Uint32Array
): Float32Array {
  const numVerts = positions.length / 3;
  const normals = new Float32Array(numVerts * 3);

  // For flat shading, we assign the same face normal to all vertices of each triangle
  for (let i = 0; i < indices.length; i += 3) {
    const i0 = indices[i];
    const i1 = indices[i + 1];
    const i2 = indices[i + 2];

    // Get vertex positions
    const p0x = positions[i0 * 3];
    const p0y = positions[i0 * 3 + 1];
    const p0z = positions[i0 * 3 + 2];

    const p1x = positions[i1 * 3];
    const p1y = positions[i1 * 3 + 1];
    const p1z = positions[i1 * 3 + 2];

    const p2x = positions[i2 * 3];
    const p2y = positions[i2 * 3 + 1];
    const p2z = positions[i2 * 3 + 2];

    // Calculate edge vectors
    const e1x = p1x - p0x;
    const e1y = p1y - p0y;
    const e1z = p1z - p0z;

    const e2x = p2x - p0x;
    const e2y = p2y - p0y;
    const e2z = p2z - p0z;

    // Cross product for face normal
    const nx = e1y * e2z - e1z * e2y;
    const ny = e1z * e2x - e1x * e2z;
    const nz = e1x * e2y - e1y * e2x;

    // Normalize the face normal
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    const fnx = len > 0 ? nx / len : 0;
    const fny = len > 0 ? ny / len : 0;
    const fnz = len > 0 ? nz / len : 0;

    // Assign the same face normal to all three vertices of this triangle
    normals[i0 * 3] = fnx;
    normals[i0 * 3 + 1] = fny;
    normals[i0 * 3 + 2] = fnz;

    normals[i1 * 3] = fnx;
    normals[i1 * 3 + 1] = fny;
    normals[i1 * 3 + 2] = fnz;

    normals[i2 * 3] = fnx;
    normals[i2 * 3 + 1] = fny;
    normals[i2 * 3 + 2] = fnz;
  }

  return normals;
}