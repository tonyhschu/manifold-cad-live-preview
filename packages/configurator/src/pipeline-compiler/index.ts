/**
 * Pipeline Compiler - Main Entry Point
 * 
 * Compiles TypeScript model files into a single pipeline.js file
 * that contains all model generation functions.
 */

import { build } from 'vite';
import { resolve, join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import chokidar from 'chokidar';

import type { 
  PipelineCompiler, 
  PipelineCompilationResult,
  PipelineManifest 
} from '../types/pipeline.js';
import { discoverModelFilesForCompilation } from './file-discovery.js';
import { compileModelToFunction } from './model-compiler.js';
import { generatePipelineCode } from './function-generator.js';

/**
 * Pipeline compiler implementation
 */
export class PipelineCompilerImpl implements PipelineCompiler {
  private watcher: chokidar.FSWatcher | null = null;
  private isWatching = false;
  private rootDir: string;
  private outputDir: string;

  constructor(rootDir: string = '.', outputDir: string = './temp') {
    this.rootDir = rootDir;
    this.outputDir = outputDir;
  }

  /**
   * Compile all discovered models into a pipeline
   */
  async compile(): Promise<PipelineCompilationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {


      // Ensure output directory exists
      await this.ensureOutputDirectory();

      // Step 1: Discover model files

      const modelFiles = await discoverModelFilesForCompilation(this.rootDir);
      
      if (modelFiles.length === 0) {
        warnings.push('No model files found');
      }

      // Step 2: Compile each model to function
      const compiledFunctions = [];
      
      for (const filePath of modelFiles) {
        try {
          const compiledFunction = await compileModelToFunction(filePath, this.rootDir);
          compiledFunctions.push(compiledFunction);
        } catch (error) {
          const errorMsg = `Failed to compile ${filePath}: ${error instanceof Error ? error.message : error}`;
          errors.push(errorMsg);
        }
      }

      // Step 3: Generate pipeline.js code
      const pipelineCode = generatePipelineCode(compiledFunctions);

      // Step 4: Write pipeline.js
      const pipelinePath = join(this.outputDir, 'pipeline.js');
      await writeFile(pipelinePath, pipelineCode);

      // Step 5: Generate manifest.json
      const manifest: PipelineManifest = {
        models: compiledFunctions.map(f => ({
          id: f.id,
          name: f.metadata?.name || f.name,
          type: f.type,
          description: f.metadata?.description || `${f.type} model: ${f.name}`,
          author: f.metadata?.author,
          version: f.metadata?.version
        })),
        lastCompiled: new Date().toISOString(),
        version: Date.now(),
        compilation: {
          duration: Date.now() - startTime,
          errors,
          warnings
        }
      };

      const manifestPath = join(this.outputDir, 'manifest.json');
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2));


      // Step 6: Generate user-pipeline-entry.ts for pipeline server compatibility
      const userPipelineEntry = this.generateUserPipelineEntry(compiledFunctions);
      const userPipelineEntryPath = join(this.outputDir, 'user-pipeline-entry.ts');
      await writeFile(userPipelineEntryPath, userPipelineEntry);


      const result: PipelineCompilationResult = {
        pipelinePath,
        compiledAt: new Date().toISOString(),
        modelCount: compiledFunctions.length,
        errors,
        warnings
      };


      return result;

    } catch (error) {
      const errorMsg = `Pipeline compilation failed: ${error instanceof Error ? error.message : error}`;
      errors.push(errorMsg);
      
      return {
        pipelinePath: '',
        compiledAt: new Date().toISOString(),
        modelCount: 0,
        errors,
        warnings
      };
    }
  }

  /**
   * Start watching for file changes and auto-compile
   */
  startWatching(onChange?: (result: PipelineCompilationResult) => void): void {
    if (this.isWatching) {
      return;
    }
    
    const watchPatterns = [
      join(this.rootDir, 'main.{ts,js}'),
      join(this.rootDir, 'components/**/*.{ts,js}')
    ];

    this.watcher = chokidar.watch(watchPatterns, {
      ignored: /node_modules/,
      persistent: true,
      ignoreInitial: true
    });

    this.watcher.on('add', (filePath) => this.handleFileChange('add', filePath, onChange));
    this.watcher.on('change', (filePath) => this.handleFileChange('change', filePath, onChange));
    this.watcher.on('unlink', (filePath) => this.handleFileChange('unlink', filePath, onChange));

    this.watcher.on('error', (error) => {
      // File watcher error
    });

    this.isWatching = true;
  }

  /**
   * Stop watching for file changes
   */
  stopWatching(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    this.isWatching = false;
  }

  /**
   * Handle file change events with debouncing
   */
  private debounceTimer: NodeJS.Timeout | null = null;
  private handleFileChange(
    event: string, 
    filePath: string, 
    onChange?: (result: PipelineCompilationResult) => void
  ): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(async () => {
      try {
        const result = await this.compile();
        onChange?.(result);
      } catch (error) {
        // Failed to handle file change event
      }

      this.debounceTimer = null;
    }, 300); // 300ms debounce
  }

  /**
   * Ensure output directory exists
   */
  private async ensureOutputDirectory(): Promise<void> {
    if (!existsSync(this.outputDir)) {
      await mkdir(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generate user-pipeline-entry.ts file for pipeline server compatibility
   * This creates a TypeScript file with static imports that the pipeline server can serve
   */
  private generateUserPipelineEntry(compiledFunctions: CompiledFunction[]): string {
    // Generate import statements for each model
    const imports = compiledFunctions
      .map(f => `import * as ${f.id.replace(/[\/\-\.]/g, '_')}Model from '../${f.filePath.replace(this.projectPath + '/', '')}';`)
      .join('\n');

    // Generate model definitions array
    const modelDefinitions = compiledFunctions
      .map(f => `  { id: '${f.id}', module: ${f.id.replace(/[\/\-\.]/g, '_')}Model }`)
      .join(',\n');

    // Generate export statements for compatibility
    const exports = compiledFunctions
      .map(f => `export { ${f.id.replace(/[\/\-\.]/g, '_')}Model };`)
      .join('\n');

    return `// Auto-generated pipeline entry
// This file is generated by manifold-studio and should not be edited manually
// Generated at: ${new Date().toISOString()}

// Import shared types and utilities from configurator package
import { ParametricConfig, ParametricModel, StaticModel, ProcessedModel, isParametricConfig, extractDefaultParams, processModels } from '@manifold-studio/configurator/pipeline-runtime/types';

${imports}

export const modelDefinitions = [
${modelDefinitions}
];

// Export individual models for compatibility
${exports}

// ============================================================================
// PIPELINE RUNTIME - Reusable logic (auto-generated, do not edit manually)
// ============================================================================

// Process models using shared function from configurator package
const processedModels: ProcessedModel[] = processModels(modelDefinitions);

// Create pipeline using proven working logic
const pipeline = {
  getAvailableModels() {
    return processedModels.map(model => ({
      id: model.id,
      name: model.name,
      type: model.type
    }));
  },

  async generateModel(modelId: string, params: any = {}) {
    const model = processedModels.find(m => m.id === modelId);
    if (!model) {
      throw new Error(\`Unknown model: \${modelId}\`);
    }

    if (model.type === 'parametric') {
      const parametricModel = model as ParametricModel;
      const finalParams = { ...parametricModel.defaultParams, ...params };
      return parametricModel.config.generateModel(finalParams);
    } else {
      const staticModel = model as StaticModel;
      return staticModel.createFunction();
    }
  },

  getModelConfig(modelId: string) {
    const model = processedModels.find(m => m.id === modelId);
    if (!model) {
      throw new Error(\`Unknown model: \${modelId}\`);
    }

    if (model.type === 'parametric') {
      const parametricModel = model as ParametricModel;
      return {
        id: model.id,
        name: model.name,
        type: 'parametric',
        parameters: parametricModel.config.parameters
      };
    } else {
      return {
        id: model.id,
        name: model.name,
        type: 'static',
        parameters: {}
      };
    }
  }
};

// Export the pipeline as default
export default pipeline;
`;
  }
}

/**
 * Factory function to create pipeline compiler
 */
export function createPipelineCompiler(rootDir?: string, outputDir?: string): PipelineCompiler {
  return new PipelineCompilerImpl(rootDir, outputDir);
}

/**
 * Convenience function for one-off compilation
 */
export async function buildPipeline(rootDir?: string, outputDir?: string): Promise<PipelineCompilationResult> {
  const compiler = createPipelineCompiler(rootDir, outputDir);
  return await compiler.compile();
}
