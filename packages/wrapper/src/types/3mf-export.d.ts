// Type declarations for @jscadui/3mf-export
// Since the package doesn't provide its own TypeScript declarations

declare module '@jscadui/3mf-export' {
  /**
   * Static file content for [Content_Types].xml
   */
  export const fileForContentTypes: {
    name: string;
    content: string;
  };

  /**
   * Class for generating _rels/.rels file content
   */
  export class FileForRelThumbnail {
    name: string;
    content: string;
    
    constructor();
    add3dModel(path: string): void;
  }

  /**
   * 3MF mesh data structure
   */
  interface Mesh3MF {
    id: string;
    vertices: Float32Array | number[];
    indices: Uint32Array | number[];
    name?: string;
  }

  /**
   * 3MF child component reference
   */
  interface Child3MF {
    objectID: string;
    transform?: number[]; // 4x4 matrix as flat array
  }

  /**
   * 3MF component definition
   */
  interface Component3MF {
    id: string;
    children: Array<Child3MF>;
    name?: string;
  }

  /**
   * 3MF header metadata
   */
  interface Header3MF {
    unit?: 'micron' | 'millimeter' | 'centimeter' | 'inch' | 'foot' | 'meter';
    title?: string;
    author?: string;
    description?: string;
    application?: string;
    creationDate?: string;
    license?: string;
    modificationDate?: string;
  }

  /**
   * Complete 3MF data structure
   */
  interface To3MF {
    meshes: Array<Mesh3MF>;
    components: Array<Component3MF>;
    items: Array<Child3MF>;
    precision: number;
    header: Header3MF;
  }

  /**
   * Convert 3MF data structure to XML string
   * @param data The 3MF data structure
   * @returns XML string representation of the 3MF model
   */
  export function to3dmodel(data: To3MF): string;
}

declare module 'fflate' {
  /**
   * Convert string to Uint8Array
   */
  export function strToU8(str: string): Uint8Array;

  /**
   * Zippable file structure
   */
  export interface Zippable {
    [path: string]: Uint8Array;
  }

  /**
   * Synchronously create a ZIP file
   * @param files Object mapping file paths to Uint8Array data
   * @returns Uint8Array containing the ZIP file
   */
  export function zipSync(files: Zippable): Uint8Array;
}
