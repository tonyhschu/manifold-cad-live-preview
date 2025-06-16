/**
 * Pipeline Compiler - Public API
 * 
 * Exports for the pipeline compiler module.
 */

// Main compiler
export {
  PipelineCompilerImpl,
  createPipelineCompiler,
  buildPipeline
} from './index.js';

// File discovery
export {
  discoverModelFilesForCompilation,
  shouldCompileFile,
  categorizeModelFiles,
  sortFilesByPriority
} from './file-discovery.js';

// Model compilation
export {
  compileModelToFunction,
  type CompiledFunction
} from './model-compiler.js';

// Function generation
export {
  generatePipelineCode,
  generateFunctionName,
  generateImports,
  generateTypeDefinitions,
  validateCompiledFunctions
} from './function-generator.js';
