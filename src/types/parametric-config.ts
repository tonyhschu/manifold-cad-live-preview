import type { Manifold } from '../lib/manifold';

// Re-export Tweakpane types for direct usage
export type { BindingParams } from 'tweakpane';

// Tweakpane parameter types (based on BindingParams)
export interface TweakpaneNumberParam {
  value: number;
  min?: number;
  max?: number;
  step?: number;
}

export interface TweakpaneBooleanParam {
  value: boolean;
}

export interface TweakpaneStringParam {
  value: string;
  options?: Record<string, string>;
}

export interface TweakpaneColorParam {
  value: string;
  color?: { type: 'float' | 'int' };
}

// Custom UI escape hatch - NOT YET IMPLEMENTED
// See Issue #14: https://github.com/tonyhschu/manifold-cad-live-preview/issues/14
/*
export interface CustomParam<T = any> {
  type: 'custom';
  value: T;
  setup: (container: HTMLElement, currentValue: T, onChange: (newValue: T) => void) => (() => void) | void;
  fallback?: TweakpaneParam;
}
*/

// Union of all parameter types (custom parameters commented out until Issue #14)
export type TweakpaneParam = 
  | TweakpaneNumberParam 
  | TweakpaneBooleanParam 
  | TweakpaneStringParam 
  | TweakpaneColorParam;

export type ParameterConfig = TweakpaneParam; // | CustomParam; // TODO: Issue #14

// Core configuration interface
export interface ParametricConfig {
  parameters: Record<string, ParameterConfig>;
  generateModel: (params: Record<string, any>) => Manifold;
  name?: string;
  description?: string;
}

// Type helper to extract parameter types from config
export type ExtractParamTypes<T extends Record<string, ParameterConfig>> = {
  [K in keyof T]: T[K] extends { value: infer V } ? V : any;
};

// Parameter builder helpers for ergonomics
export const P = {
  number: (value: number, min?: number, max?: number, step?: number): TweakpaneNumberParam => ({
    value,
    ...(min !== undefined && { min }),
    ...(max !== undefined && { max }),
    ...(step !== undefined && { step })
  }),
  
  boolean: (value: boolean): TweakpaneBooleanParam => ({ value }),
  
  select: (value: string, options: string[] | Record<string, string>): TweakpaneStringParam => {
    // Convert array to object format that Tweakpane expects
    const optionsObj = Array.isArray(options) 
      ? options.reduce((acc, opt) => ({ ...acc, [opt]: opt }), {})
      : options;
    return { value, options: optionsObj };
  },
  
  string: (value: string): TweakpaneStringParam => ({ value }),
  
  color: (value: string): TweakpaneColorParam => ({ 
    value, 
    color: { type: 'float' } 
  }),

  // Custom UI helper - NOT YET IMPLEMENTED
  // See Issue #14: https://github.com/tonyhschu/manifold-cad-live-preview/issues/14
  /*
  custom: <T>(
    value: T, 
    setup: CustomParam<T>['setup'], 
    fallback?: TweakpaneParam
  ): CustomParam<T> => ({
    type: 'custom',
    value,
    setup,
    ...(fallback && { fallback })
  })
  */
};

// Config creation helper
export function createConfig<T extends Record<string, ParameterConfig>>(
  parameters: T,
  modelFn: (params: ExtractParamTypes<T>) => Manifold,
  metadata: { name?: string; description?: string } = {}
): ParametricConfig {
  return {
    parameters,
    generateModel: modelFn as (params: Record<string, any>) => Manifold,
    ...metadata
  };
}