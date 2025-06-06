// src/lib/manifold-gltf.ts
// Based on the ManifoldCAD implementation of the EXT_mesh_manifold extension

import {
  Accessor,
  Extension,
  ExtensionProperty,
  GLTF,
  IProperty,
  PropertyType,
  ReaderContext,
  WriterContext
} from '@gltf-transform/core';

// Extension name for the Manifold-specific glTF extension
const NAME = 'EXT_mesh_manifold';
const MERGE = 'MERGE';

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
 * Definition of the manifold extension in a glTF file
 * Represents the JSON structure for the EXT_mesh_manifold extension
 */
interface ManifoldDef {
  manifoldPrimitive: GLTF.IMeshPrimitive;
  mergeIndices: number;
  mergeValues: number;
}

/**
 * Property class that represents the manifold extension for a mesh
 * Provides methods to manage manifold-specific data in glTF documents
 */
export class ManifoldPrimitive extends ExtensionProperty<IManifoldPrimitive> {
  static EXTENSION_NAME = NAME;
  public declare extensionName: typeof NAME;
  public declare propertyType: 'ManifoldPrimitive';
  public declare parentTypes: [PropertyType.MESH];

  init(): void {
    ManifoldPrimitive.EXTENSION_NAME = NAME;
    this.propertyType = 'ManifoldPrimitive';
    this.parentTypes = [PropertyType.MESH];
  }

  getDefaults(): any {
    return Object.assign(
      super.getDefaults(),
      { manifoldPrimitive: null, mergeIndices: null, mergeValues: null }
    );
  }

  getMergeIndices(): Accessor | null {
    return this.getRef('mergeIndices');
  }

  getMergeValues(): Accessor | null {
    return this.getRef('mergeValues');
  }

  setMerge(indicesAccessor: Accessor, valuesAccessor: Accessor): this {
    if (indicesAccessor.getCount() !== valuesAccessor.getCount()) {
      throw new Error('merge vectors must be the same length.');
    }
    this.setRef('mergeIndices', indicesAccessor);
    return this.setRef('mergeValues', valuesAccessor);
  }

  getRunIndex(): number[] | Uint32Array {
    return this.get('runIndex');
  }

  setRunIndex(runIndex: number[] | Uint32Array): this {
    return this.set('runIndex', runIndex);
  }

  setIndices(indices: Accessor): this {
    return this.setRef('indices', indices);
  }

  getIndices(): Accessor {
    return this.getRef('indices')!;
  }
}

/**
 * Main extension class for the EXT_mesh_manifold extension
 * Handles reading and writing of manifold data in glTF files
 * 
 * This extension preserves the topological information from ManifoldCAD
 * meshes when exporting to glTF format, allowing for lossless round-trips.
 */
export class EXTManifold extends Extension {
  extensionName = NAME;
  prewriteTypes = [PropertyType.ACCESSOR];
  static EXTENSION_NAME = NAME;

  createManifoldPrimitive(): ManifoldPrimitive {
    return new ManifoldPrimitive(this.document.getGraph());
  }

  read(context: ReaderContext): this {
    const { json } = context.jsonDoc;
    const meshDefs = json.meshes || [];

    meshDefs.forEach((meshDef, meshIndex) => {
      if (!meshDef.extensions || !meshDef.extensions[NAME]) return;

      const mesh = context.meshes[meshIndex];
      const manifoldPrimitive = this.createManifoldPrimitive();
      mesh.setExtension(NAME, manifoldPrimitive as any);

      const manifoldDef = meshDef.extensions[NAME] as ManifoldDef;

      if (manifoldDef.manifoldPrimitive) {
        let count = 0;
        const runIndex = Array<number>();
        runIndex.push(count);
        for (const primitive of mesh.listPrimitives()) {
          const indices = primitive.getIndices();
          if (!indices) {
            console.log('Skipping non-indexed primitive ', primitive.getName());
            continue;
          }
          count += indices.getCount();
          runIndex.push(count);
        }
        manifoldPrimitive.setRunIndex(runIndex);
        manifoldPrimitive.setIndices(
          context.accessors[manifoldDef.manifoldPrimitive.indices!]
        );
      }

      if (manifoldDef.mergeIndices != null && manifoldDef.mergeValues != null) {
        manifoldPrimitive.setMerge(
          context.accessors[manifoldDef.mergeIndices],
          context.accessors[manifoldDef.mergeValues]
        );
      }
    });

    return this;
  }

  prewrite(context: WriterContext): this {
    this.document.getRoot().listMeshes().forEach((mesh) => {
      const manifoldPrimitive = mesh.getExtension(NAME) as unknown as ManifoldPrimitive;
      if (!manifoldPrimitive) return;

      const indices = manifoldPrimitive.getIndices();
      context.addAccessorToUsageGroup(
        indices, WriterContext.BufferViewUsage.ELEMENT_ARRAY_BUFFER
      );

      const mergeFrom = manifoldPrimitive.getMergeIndices();
      const mergeTo = manifoldPrimitive.getMergeValues();
      if (!mergeFrom || !mergeTo) return;

      context.addAccessorToUsageGroup(mergeFrom, MERGE);
      context.addAccessorToUsageGroup(mergeTo, MERGE);
    });
    return this;
  }

  write(context: WriterContext): this {
    const { json } = context.jsonDoc;

    this.document.getRoot().listMeshes().forEach((mesh) => {
      const manifoldPrimitive = mesh.getExtension(NAME) as unknown as ManifoldPrimitive;
      if (!manifoldPrimitive) return;

      const meshIndex = context.meshIndexMap.get(mesh)!;
      const meshDef = json.meshes![meshIndex];

      const runIndex = manifoldPrimitive.getRunIndex();
      const numPrimitive = runIndex.length - 1;

      if (numPrimitive !== meshDef.primitives.length) {
        throw new Error(
          'The number of primitives must be exactly one less than the length of runIndex.'
        );
      }

      const mergeIndicesIndex =
        context.accessorIndexMap.get(manifoldPrimitive.getMergeIndices()!)!;
      const mergeValuesIndex =
        context.accessorIndexMap.get(manifoldPrimitive.getMergeValues()!)!;
      const mergeIndices = json.accessors![mergeIndicesIndex];
      const mergeValues = json.accessors![mergeValuesIndex];

      const existingPrimitive = meshDef.primitives[0];
      const primitive = {
        indices: context.accessorIndexMap.get(manifoldPrimitive.getIndices())!,
        mode: existingPrimitive.mode,
        attributes: { 'POSITION': existingPrimitive.attributes['POSITION'] }
      };

      const indices = json.accessors![primitive.indices];
      if (!indices) {
        return;
      }

      if (mergeIndices && mergeValues) {
        indices.sparse = {
          count: mergeIndices.count,
          indices: {
            bufferView: mergeIndices.bufferView!,
            byteOffset: mergeIndices.byteOffset,
            componentType: mergeIndices.componentType
          },
          values: {
            bufferView: mergeValues.bufferView!,
            byteOffset: mergeValues.byteOffset,
          }
        };
      }

      for (let i = 0; i < numPrimitive; ++i) {
        const accessor = json.accessors![meshDef.primitives[i].indices!];
        accessor.bufferView = indices.bufferView;
        accessor.byteOffset = indices.byteOffset! + 4 * runIndex[i];
        accessor.count = runIndex[i + 1] - runIndex[i];
      }

      meshDef.extensions = meshDef.extensions || {};
      meshDef.extensions[NAME] = {
        manifoldPrimitive: primitive,
        mergeIndices: mergeIndicesIndex,
        mergeValues: mergeValuesIndex
      };
    });

    return this;
  }
}
