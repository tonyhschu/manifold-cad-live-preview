// Type definitions for ManifoldMesh and related types

export interface MeshOptions {
  numProp: number;
  triVerts: Uint32Array;
  vertProperties: Float32Array;
  runIndex?: Uint32Array;
  mergeFromVert?: Uint32Array;
  mergeToVert?: Uint32Array;
}

export interface ManifoldMesh {
  numProp: number;
  numVert: number;
  triVerts: Uint32Array;
  vertProperties: Float32Array;
  runIndex: Uint32Array;
  runOriginalID?: Uint32Array;
  mergeFromVert?: Uint32Array;
  mergeToVert?: Uint32Array;
}
