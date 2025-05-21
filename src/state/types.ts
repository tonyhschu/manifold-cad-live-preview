/**
 * Application State Types
 * 
 * This file defines the TypeScript interfaces for our application state.
 */

import { ModelMetadata } from '../core/model-loader';

/**
 * Status message state
 */
export interface StatusState {
  message: string;
  isError: boolean;
}

/**
 * Model URL state for downloads
 */
export interface ModelUrlsState {
  objUrl: string;
  glbUrl: string;
}

/**
 * Complete application state definition
 */
export interface ApplicationState {
  currentModelId: string;
  status: StatusState;
  modelUrls: ModelUrlsState;
  modelMetadata: ModelMetadata | null;
  currentModel: any | null;
  availableModels: ModelMetadata[];
}