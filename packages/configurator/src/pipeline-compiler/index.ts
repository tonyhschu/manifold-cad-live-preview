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
      console.log('🔨 Starting pipeline compilation...');

      // Ensure output directory exists
      await this.ensureOutputDirectory();

      // Step 1: Discover model files
      console.log('🔍 Discovering model files...');
      const modelFiles = await discoverModelFilesForCompilation(this.rootDir);
      
      if (modelFiles.length === 0) {
        warnings.push('No model files found');
        console.log('⚠️ No model files found in project');
      } else {
        console.log(`📄 Found ${modelFiles.length} model files:`, modelFiles);
      }

      // Step 2: Compile each model to function
      console.log('🏗️ Compiling models to functions...');
      const compiledFunctions = [];
      
      for (const filePath of modelFiles) {
        try {
          const compiledFunction = await compileModelToFunction(filePath, this.rootDir);
          compiledFunctions.push(compiledFunction);
          console.log(`✅ Compiled: ${filePath}`);
        } catch (error) {
          const errorMsg = `Failed to compile ${filePath}: ${error instanceof Error ? error.message : error}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      // Step 3: Generate pipeline.js code
      console.log('📦 Generating pipeline code...');
      const pipelineCode = generatePipelineCode(compiledFunctions);

      // Step 4: Write pipeline.js
      const pipelinePath = join(this.outputDir, 'pipeline.js');
      await writeFile(pipelinePath, pipelineCode);
      console.log(`✅ Pipeline written to: ${pipelinePath}`);

      // Step 5: Generate manifest.json
      const manifest: PipelineManifest = {
        models: compiledFunctions.map(f => ({
          id: f.id,
          name: f.name,
          type: f.type
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
      console.log(`✅ Manifest written to: ${manifestPath}`);

      const result: PipelineCompilationResult = {
        pipelinePath,
        compiledAt: new Date().toISOString(),
        modelCount: compiledFunctions.length,
        errors,
        warnings
      };

      console.log(`🎉 Pipeline compilation complete! (${result.modelCount} models, ${Date.now() - startTime}ms)`);
      return result;

    } catch (error) {
      const errorMsg = `Pipeline compilation failed: ${error instanceof Error ? error.message : error}`;
      errors.push(errorMsg);
      console.error(`💥 ${errorMsg}`);
      
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
      console.log('👀 Already watching for changes');
      return;
    }

    console.log('👀 Starting file watcher...');
    
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
      console.error('👀 File watcher error:', error);
    });

    this.isWatching = true;
    console.log('✅ File watcher started');
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
    console.log('🛑 File watcher stopped');
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
      console.log(`🔄 File ${event}: ${filePath}`);
      
      try {
        const result = await this.compile();
        onChange?.(result);
        console.log(`✨ Pipeline updated for ${event}: ${filePath}`);
      } catch (error) {
        console.error(`Failed to handle ${event} event:`, error);
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
      console.log(`📁 Created output directory: ${this.outputDir}`);
    }
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
