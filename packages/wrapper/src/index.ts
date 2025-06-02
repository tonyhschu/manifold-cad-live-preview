/**
 * @manifold-studio/wrapper
 *
 * A synchronous wrapper for ManifoldCAD with operation tracking, export utilities,
 * and headless pipeline functionality.
 */

// Core Manifold API
export {
  Manifold,
  OriginalManifold,
  CrossSection,
  utils,
  setMinCircularAngle,
  setMinCircularEdgeLength,
  setCircularSegments,
  getCircularSegments,
  resetToCircularDefaults,
  triangulate,
  getModule,
  getInitCount
} from './lib/manifold';

// Types
export type {
  Vec2,
  Vec3,
  Vec4,
  MeshData,
  ManifoldModuleType,
  ManifoldType,
  OriginalManifoldType,
  CrossSectionType
} from './lib/manifold';

// Export utilities
export {
  exportToOBJ,
  manifoldToOBJ
} from './lib/export';

export type {
  ExportResult,
  ExportOptions
} from './lib/export';

// GLB export (optional dependency)
export {
  manifoldToGLB
} from './lib/gltf-export';

// Operation tracking
export {
  getOperationRegistry
} from './lib/tracking/operation-registry';

export type {
  OperationInfo
} from './lib/tracking/operation-registry';

// Pipeline utilities
export {
  isParametricConfig,
  extractDefaultParams,
  mergeParameters,
  parseParameterString,
  parseParameterValue,
  validateRequiredParameters,
  getParameterInfo
} from './pipeline/core';

// Parametric configuration types and utilities
export {
  P,
  createConfig
} from './types/parametric-config';

export type {
  ParametricConfig,
  ParameterConfig,
  TweakpaneParam,
  TweakpaneNumberParam,
  TweakpaneBooleanParam,
  TweakpaneStringParam,
  TweakpaneColorParam,
  ExtractParamTypes,
  BindingParams
} from './types/parametric-config';
