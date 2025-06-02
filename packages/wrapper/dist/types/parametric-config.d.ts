import type { ManifoldType } from '../lib/manifold';
export type { BindingParams } from 'tweakpane';
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
    color?: {
        type: 'float' | 'int';
    };
}
export type TweakpaneParam = TweakpaneNumberParam | TweakpaneBooleanParam | TweakpaneStringParam | TweakpaneColorParam;
export type ParameterConfig = TweakpaneParam;
export interface ParametricConfig {
    parameters: Record<string, ParameterConfig>;
    generateModel: (params: Record<string, any>) => ManifoldType;
    name?: string;
    description?: string;
}
export type ExtractParamTypes<T extends Record<string, ParameterConfig>> = {
    [K in keyof T]: T[K] extends {
        value: infer V;
    } ? V : any;
};
export declare const P: {
    number: (value: number, min?: number, max?: number, step?: number) => TweakpaneNumberParam;
    boolean: (value: boolean) => TweakpaneBooleanParam;
    select: (value: string, options: string[] | Record<string, string>) => TweakpaneStringParam;
    string: (value: string) => TweakpaneStringParam;
    color: (value: string) => TweakpaneColorParam;
};
export declare function createConfig<T extends Record<string, ParameterConfig>>(parameters: T, modelFn: (params: ExtractParamTypes<T>) => ManifoldType, metadata?: {
    name?: string;
    description?: string;
}): ParametricConfig;
//# sourceMappingURL=parametric-config.d.ts.map