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
 * Calculate face normal from three vertices
 */
function calculateFaceNormal(v0: number[], v1: number[], v2: number[]): number[] {
  const edge1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
  const edge2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];

  const normal = [
    edge1[1] * edge2[2] - edge1[2] * edge2[1],
    edge1[2] * edge2[0] - edge1[0] * edge2[2],
    edge1[0] * edge2[1] - edge1[1] * edge2[0]
  ];

  // Normalize
  const length = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]);
  if (length > 0) {
    normal[0] /= length;
    normal[1] /= length;
    normal[2] /= length;
  }

  return normal;
}

/**
 * Create flat-shaded geometry by duplicating vertices for each triangle
 */
function createFlatShadedGeometry(mesh: any): {
  positions: number[];
  normals: number[];
  indices: number[];
} {
  const positions = [];
  const normals = [];
  const indices = [];

  // Process each triangle separately (no shared vertices)
  for (let i = 0; i < mesh.triVerts.length; i += 3) {
    const vertIdx0 = mesh.triVerts[i];
    const vertIdx1 = mesh.triVerts[i + 1];
    const vertIdx2 = mesh.triVerts[i + 2];

    // Get triangle vertices from vertProperties
    const v0 = [
      mesh.vertProperties[vertIdx0 * mesh.numProp + 0],
      mesh.vertProperties[vertIdx0 * mesh.numProp + 1],
      mesh.vertProperties[vertIdx0 * mesh.numProp + 2]
    ];
    const v1 = [
      mesh.vertProperties[vertIdx1 * mesh.numProp + 0],
      mesh.vertProperties[vertIdx1 * mesh.numProp + 1],
      mesh.vertProperties[vertIdx1 * mesh.numProp + 2]
    ];
    const v2 = [
      mesh.vertProperties[vertIdx2 * mesh.numProp + 0],
      mesh.vertProperties[vertIdx2 * mesh.numProp + 1],
      mesh.vertProperties[vertIdx2 * mesh.numProp + 2]
    ];

    // Calculate face normal
    const normal = calculateFaceNormal(v0, v1, v2);

    // Add vertices (each triangle gets its own vertices for flat shading)
    const baseIndex = positions.length / 3;
    positions.push(...v0, ...v1, ...v2);
    normals.push(...normal, ...normal, ...normal);
    indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
  }

  return { positions, normals, indices };
}

/**
 * Create glTF accessors for geometry data
 */
function createGeometryAccessors(
  document: Document,
  buffer: any,
  geometry: { positions: number[]; normals: number[]; indices: number[] }
) {
  const positionAccessor = document
    .createAccessor("POSITION")
    .setBuffer(buffer)
    .setType(Accessor.Type.VEC3)
    .setArray(new Float32Array(geometry.positions));

  const normalAccessor = document
    .createAccessor("NORMAL")
    .setBuffer(buffer)
    .setType(Accessor.Type.VEC3)
    .setArray(new Float32Array(geometry.normals));

  const indexAccessor = document
    .createAccessor("indices")
    .setBuffer(buffer)
    .setType(Accessor.Type.SCALAR)
    .setArray(new Uint32Array(geometry.indices));

  return { positionAccessor, normalAccessor, indexAccessor };
}

/**
 * Create CAD-optimized material for sharp edge rendering
 */
function createCADMaterial(document: Document): Material {
  return document
    .createMaterial("CADMaterial")
    .setBaseColorFactor([0.8, 0.8, 0.9, 1.0]) // Light blue-gray for CAD appearance
    .setMetallicFactor(1.0)  // Non-metallic for clearer face definition
    .setRoughnessFactor(0.8) // Higher roughness for less reflective, more matte appearance
    .setDoubleSided(false);  // Single-sided for better performance and clearer edges
}

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

  // Create CAD-optimized material
  const material = createCADMaterial(document);

  // Get mesh data from the manifold object
  const mesh = manifoldObject.getMesh();

  // Create the manifold extension
  const manifoldExtension = document.createExtension(EXTManifold);
  const gltfMesh = document.createMesh().setName("ManifoldMesh");
  const manifoldPrimitive = manifoldExtension.createManifoldPrimitive();
  gltfMesh.setExtension("EXT_mesh_manifold", manifoldPrimitive as any);

  // Get the buffer
  const buffer = document.getRoot().listBuffers()[0];

  // Create flat-shaded geometry using helper function
  const geometry = createFlatShadedGeometry(mesh);

  // Create glTF accessors using helper function
  const { positionAccessor, normalAccessor, indexAccessor } = createGeometryAccessors(
    document,
    buffer,
    geometry
  );

  // Create the primitive with flat-shaded geometry
  const primitive = document
    .createPrimitive()
    .setIndices(indexAccessor)
    .setAttribute("POSITION", positionAccessor)
    .setAttribute("NORMAL", normalAccessor)
    .setMaterial(material);

  // Add the primitive to the mesh
  gltfMesh.addPrimitive(primitive);

  // Set up the manifold primitive
  manifoldPrimitive.setIndices(indexAccessor);
  manifoldPrimitive.setRunIndex([0, geometry.indices.length]);

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




