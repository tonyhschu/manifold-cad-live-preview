import { glob } from 'glob';
import path from 'path';
import fs from 'fs';
import type { ModelFile } from './types.js';

/**
 * Discovers user model files in the project directory
 * Looks for:
 * - main.{ts,js} in project root
 * - components/**\/*.{ts,js} in components directory
 */
export async function discoverUserModels(projectPath: string): Promise<ModelFile[]> {
  const models: ModelFile[] = [];
  
  console.log(`🔍 Discovering models in: ${projectPath}`);
  
  // Find main model
  const mainFiles = await glob('main.{ts,js}', { 
    cwd: projectPath,
    absolute: false 
  });
  
  if (mainFiles.length > 0) {
    const mainFile = mainFiles[0];
    const fullPath = path.join(projectPath, mainFile);
    
    models.push({
      id: 'main',
      filePath: fullPath,
      importPath: `../${mainFile}`,
      exportName: 'mainModel'
    });
    
    console.log(`  ✅ Found main model: ${mainFile}`);
  } else {
    console.log(`  ⚠️  No main model found (looking for main.ts or main.js)`);
  }
  
  // Find component models
  const componentFiles = await glob('components/**/*.{ts,js}', { 
    cwd: projectPath,
    absolute: false 
  });
  
  for (const file of componentFiles) {
    const fullPath = path.join(projectPath, file);
    
    // Convert file path to model ID (remove extension, keep path structure)
    const relativePath = file.replace(/\.(ts|js)$/, '');
    
    // Convert path to valid export name (replace slashes and dashes with underscores)
    const exportName = `${relativePath.replace(/[\/\-\.]/g, '_')}Model`;
    
    models.push({
      id: relativePath,
      filePath: fullPath,
      importPath: `../${file}`,
      exportName
    });
    
    console.log(`  ✅ Found component: ${file} → ${exportName}`);
  }
  
  console.log(`🎯 Discovered ${models.length} model(s) total`);
  
  return models;
}

/**
 * Validates that discovered model files actually exist and are readable
 */
export async function validateModelFiles(models: ModelFile[]): Promise<ModelFile[]> {
  const validModels: ModelFile[] = [];
  
  for (const model of models) {
    try {
      await fs.promises.access(model.filePath, fs.constants.R_OK);
      validModels.push(model);
    } catch (error) {
      console.warn(`⚠️  Model file not accessible: ${model.filePath}`);
    }
  }
  
  return validModels;
}
