/**
 * Model Type Definitions
 * 
 * Core interfaces and types for model handling in V3 architecture.
 * Extracted from V1 model-loader.ts for reuse across V3 components.
 */

import type { ParametricConfig } from '@manifold-studio/wrapper';

/**
 * Interface for model metadata
 * This metadata is used to provide information about the model in the UI
 */
export interface ModelMetadata {
  /** Display name for the model */
  name: string;
  /** Description of what the model represents */
  description: string;
  /** Optional author information */
  author?: string;
  /** Optional version information */
  version?: string;
}

/**
 * Model registry entry interface
 * Represents a discovered model with its basic information
 */
export interface ModelRegistryEntry {
  id: string;
  path: string;
  name: string;
  type: 'static' | 'parametric';
  loader?: () => Promise<any>; // Optional loader function for user project models
}

/**
 * Type definition for model creation functions
 * Each static model exports a function that creates and returns a Manifold object
 */
export type ModelCreator = () => any;

/**
 * Type definition for parametric models
 * These export a ParametricConfig object instead of a simple function
 */
export type ParametricModel = ParametricConfig;

/**
 * Result of loading a model (V1 compatible interface)
 * Used by services and UI components
 */
export interface ModelLoadResult {
  model: any;
  metadata?: ModelMetadata;
  isParametric?: boolean;
  config?: ParametricConfig;
  exports?: { objUrl: string; glbUrl: string };
}

/**
 * Configuration for model discovery
 * Controls how models are discovered and loaded
 */
export interface ModelDiscoveryConfig {
  /** Use hardcoded development models instead of file discovery */
  useDevelopmentModels?: boolean;
  /** Custom model registry to use instead of discovery */
  customModels?: ModelRegistryEntry[];
}

/**
 * Model configuration for V3 pipeline
 * Simplified interface for pipeline-compiled models
 */
export interface ModelConfig {
  id: string;
  name: string;
  type: 'static' | 'parametric';
  config?: ParametricConfig;
}
