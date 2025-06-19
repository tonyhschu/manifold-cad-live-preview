/**
 * Vite Plugin: Manifest Generator
 * 
 * Simple plugin that runs the manifest generation script after each build.
 * Works in both single build and watch modes.
 */

import { Plugin } from 'vite';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ManifestGeneratorOptions {
  /** Command to run for manifest generation */
  command?: string;
  /** Whether to show detailed output */
  verbose?: boolean;
}

/**
 * Plugin that generates manifest.json after each pipeline build
 */
export function manifestGenerator(options: ManifestGeneratorOptions = {}): Plugin {
  const {
    command = 'npm run generate:manifest',
    verbose = true
  } = options;

  return {
    name: 'manifest-generator',
    
    // Run after each build (both single build and watch mode)
    async writeBundle() {
      if (verbose) {
        console.log('🔄 Generating manifest after pipeline build...');
      }
      
      try {
        const { stdout, stderr } = await execAsync(command);
        
        if (verbose && stdout) {
          // Filter out npm noise, show only our script output
          const lines = stdout.split('\n');
          const relevantLines = lines.filter(line => 
            line.includes('🔍') || 
            line.includes('📦') || 
            line.includes('📊') || 
            line.includes('✅') || 
            line.includes('📋') ||
            line.includes('•')
          );
          
          if (relevantLines.length > 0) {
            console.log(relevantLines.join('\n'));
          }
        }
        
        if (stderr && !stderr.includes('npm WARN')) {
          console.warn('Manifest generation warnings:', stderr);
        }
        
      } catch (error) {
        console.error('❌ Failed to generate manifest:', error);
      }
    }
  };
}
