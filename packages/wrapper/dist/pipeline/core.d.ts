import type { ParametricConfig } from '../types/parametric-config';
/**
 * Helper to determine if a model export is a parametric config
 */
export declare function isParametricConfig(obj: any): obj is ParametricConfig;
/**
 * Helper to extract default parameter values from ParametricConfig
 */
export declare function extractDefaultParams(config: ParametricConfig): Record<string, any>;
/**
 * Helper to merge user parameters with defaults
 * @param defaults Default parameter values
 * @param userParams User-provided parameter overrides
 * @param options Configuration options
 * @returns Merged parameters with user overrides applied
 */
export declare function mergeParameters(defaults: Record<string, any>, userParams: Record<string, any>, options?: {
    logChanges?: boolean;
    onUnknownParam?: (key: string) => void;
}): Record<string, any>;
/**
 * Parse parameter string into typed values
 * Converts string values to appropriate types (number, boolean, string)
 * @param paramString Comma-separated key=value pairs
 * @returns Object with parsed parameter values
 */
export declare function parseParameterString(paramString: string): Record<string, any>;
/**
 * Parse a single parameter value to its appropriate type
 * @param value String value to parse
 * @returns Parsed value (number, boolean, or string)
 */
export declare function parseParameterValue(value: string): any;
/**
 * Validate that all required parameters are present
 * @param params Parameter object to validate
 * @param required Array of required parameter names
 * @throws Error if any required parameters are missing
 */
export declare function validateRequiredParameters(params: Record<string, any>, required: string[]): void;
/**
 * Get parameter information from a ParametricConfig
 * @param config ParametricConfig object
 * @returns Object with parameter metadata
 */
export declare function getParameterInfo(config: ParametricConfig): {
    names: string[];
    defaults: Record<string, any>;
    types: Record<string, string>;
};
//# sourceMappingURL=core.d.ts.map