/**
 * @manifold-studio/wrapper
 *
 * A synchronous wrapper for ManifoldCAD with operation tracking, export utilities,
 * and headless pipeline functionality.
 */
export { Manifold, OriginalManifold, CrossSection, utils, setMinCircularAngle, setMinCircularEdgeLength, setCircularSegments, getCircularSegments, resetToCircularDefaults, triangulate, getModule, getInitCount } from './lib/manifold';
export type { Vec2, Vec3, Vec4, MeshData, ManifoldModuleType, ManifoldType, OriginalManifoldType, CrossSectionType } from './lib/manifold';
export { exportToOBJ, manifoldToOBJ } from './lib/export';
export type { ExportResult, ExportOptions } from './lib/export';
export { manifoldToGLB } from './lib/gltf-export';
export { getOperationRegistry } from './lib/tracking/operation-registry';
export type { OperationInfo } from './lib/tracking/operation-registry';
export { isParametricConfig, extractDefaultParams, mergeParameters, parseParameterString, parseParameterValue, validateRequiredParameters, getParameterInfo } from './pipeline/core';
export { P, createConfig } from './types/parametric-config';
export type { ParametricConfig, ParameterConfig, TweakpaneParam, TweakpaneNumberParam, TweakpaneBooleanParam, TweakpaneStringParam, TweakpaneColorParam, ExtractParamTypes, BindingParams } from './types/parametric-config';
//# sourceMappingURL=index.d.ts.map