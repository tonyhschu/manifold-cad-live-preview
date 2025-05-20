// src/lib/sync-gltf-export.ts
// GLB/glTF export utilities for the synchronous Manifold API

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
 */
export async function manifoldToGLB(manifoldObject: any): Promise<Blob> {
  // Create a new document and IO instance
  const document = new Document();
  const io = new WebIO();
  setupIO(io);

  // Add a buffer to the document
  document.createBuffer();

  // Create a default material
  const material = document
    .createMaterial()
    .setName("Default Material")
    .setBaseColorFactor([0.8, 0.8, 0.8, 1.0])
    .setMetallicFactor(0.1)
    .setRoughnessFactor(0.9);

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

  // Create position attribute
  const positionsArray = extractPositions(mesh);
  const positions = document
    .createAccessor("POSITION")
    .setBuffer(buffer)
    .setType(Accessor.Type.VEC3)
    .setArray(positionsArray);

  // Create normals
  const normalsArray = calculateNormals(positionsArray, indicesArray);
  const normals = document
    .createAccessor("NORMAL")
    .setBuffer(buffer)
    .setType(Accessor.Type.VEC3)
    .setArray(normalsArray);

  // Create the primitive
  const primitive = document
    .createPrimitive()
    .setIndices(indices)
    .setAttribute("POSITION", positions)
    .setAttribute("NORMAL", normals)
    .setMaterial(material);

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
 * Creates a URL for a GLB blob
 */
export function createGLBUrl(glbBlob: Blob): string {
  return URL.createObjectURL(glbBlob);
}

/**
 * Extract positions from a manifold mesh
 */
function extractPositions(mesh: any): Float32Array {
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
 * Calculate normals for a mesh
 */
function calculateNormals(
  positions: Float32Array,
  indices: Uint32Array
): Float32Array {
  const numVerts = positions.length / 3;
  const normals = new Float32Array(numVerts * 3);

  // Initialize normals to zero
  for (let i = 0; i < normals.length; i++) {
    normals[i] = 0;
  }

  // Calculate face normals and accumulate
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

    // Accumulate normals for each vertex
    normals[i0 * 3] += nx;
    normals[i0 * 3 + 1] += ny;
    normals[i0 * 3 + 2] += nz;

    normals[i1 * 3] += nx;
    normals[i1 * 3 + 1] += ny;
    normals[i1 * 3 + 2] += nz;

    normals[i2 * 3] += nx;
    normals[i2 * 3 + 1] += ny;
    normals[i2 * 3 + 2] += nz;
  }

  // Normalize
  for (let i = 0; i < numVerts; i++) {
    const nx = normals[i * 3];
    const ny = normals[i * 3 + 1];
    const nz = normals[i * 3 + 2];

    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);

    if (len > 0) {
      normals[i * 3] = nx / len;
      normals[i * 3 + 1] = ny / len;
      normals[i * 3 + 2] = nz / len;
    }
  }

  return normals;
}