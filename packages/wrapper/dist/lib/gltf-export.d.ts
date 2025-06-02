import type { ManifoldType } from './manifold';
import { WebIO, Material } from "@gltf-transform/core";
/**
 * Attribute definitions for mapping manifold vertex properties to glTF attributes
 */
export declare const attributeDefs: {
    POSITION: {
        type: import("@gltf-transform/core").GLTF.AccessorType;
        components: number;
    };
    NORMAL: {
        type: import("@gltf-transform/core").GLTF.AccessorType;
        components: number;
    };
    TANGENT: {
        type: import("@gltf-transform/core").GLTF.AccessorType;
        components: number;
    };
    TEXCOORD_0: {
        type: import("@gltf-transform/core").GLTF.AccessorType;
        components: number;
    };
    TEXCOORD_1: {
        type: import("@gltf-transform/core").GLTF.AccessorType;
        components: number;
    };
    COLOR_0: {
        type: import("@gltf-transform/core").GLTF.AccessorType;
        components: number;
    };
    JOINTS_0: {
        type: import("@gltf-transform/core").GLTF.AccessorType;
        components: number;
    };
    WEIGHTS_0: {
        type: import("@gltf-transform/core").GLTF.AccessorType;
        components: number;
    };
    SKIP_1: {
        type: null;
        components: number;
    };
    SKIP_2: {
        type: null;
        components: number;
    };
    SKIP_3: {
        type: null;
        components: number;
    };
    SKIP_4: {
        type: null;
        components: number;
    };
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
export declare function setupIO(io: WebIO): WebIO;
/**
 * Convert a Manifold mesh to a glTF document
 * @param manifoldObject The manifold object to convert
 * @returns A Promise that resolves to an GLB blob
 * @throws Error if the conversion fails
 */
export declare function manifoldToGLB(manifoldObject: ManifoldType): Promise<Blob>;
//# sourceMappingURL=gltf-export.d.ts.map