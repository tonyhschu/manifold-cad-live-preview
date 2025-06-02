import { Accessor, Extension, ExtensionProperty, IProperty, PropertyType, ReaderContext, WriterContext } from '@gltf-transform/core';
declare const NAME = "EXT_mesh_manifold";
/**
 * Interface for the properties needed by the manifold extension
 * Defines the core data structure for manifold primitives in glTF
 */
interface IManifoldPrimitive extends IProperty {
    mergeIndices: Accessor;
    mergeValues: Accessor;
    indices: Accessor;
    runIndex: number[] | Uint32Array;
}
/**
 * Property class that represents the manifold extension for a mesh
 * Provides methods to manage manifold-specific data in glTF documents
 */
export declare class ManifoldPrimitive extends ExtensionProperty<IManifoldPrimitive> {
    static EXTENSION_NAME: string;
    extensionName: typeof NAME;
    propertyType: 'ManifoldPrimitive';
    parentTypes: [PropertyType.MESH];
    init(): void;
    getDefaults(): any;
    getMergeIndices(): Accessor | null;
    getMergeValues(): Accessor | null;
    setMerge(indicesAccessor: Accessor, valuesAccessor: Accessor): this;
    getRunIndex(): number[] | Uint32Array;
    setRunIndex(runIndex: number[] | Uint32Array): this;
    setIndices(indices: Accessor): this;
    getIndices(): Accessor;
}
/**
 * Main extension class for the EXT_mesh_manifold extension
 * Handles reading and writing of manifold data in glTF files
 *
 * This extension preserves the topological information from ManifoldCAD
 * meshes when exporting to glTF format, allowing for lossless round-trips.
 */
export declare class EXTManifold extends Extension {
    extensionName: string;
    prewriteTypes: PropertyType[];
    static EXTENSION_NAME: string;
    createManifoldPrimitive(): ManifoldPrimitive;
    read(context: ReaderContext): this;
    prewrite(context: WriterContext): this;
    write(context: WriterContext): this;
}
export {};
//# sourceMappingURL=manifold-gltf.d.ts.map