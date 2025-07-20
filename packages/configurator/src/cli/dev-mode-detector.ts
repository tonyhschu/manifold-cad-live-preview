import fs from 'fs';
import path from 'path';

/**
 * Detects if we're running in configurator development mode
 * This happens when:
 * 1. We're in a workspace with configurator source code
 * 2. The project has configurator as a local file dependency
 */
export async function detectConfiguratorDevelopment(projectPath: string = process.cwd()): Promise<boolean> {
  try {
    // Check if we're in a workspace with configurator source
    const configuratorSrc = path.resolve(projectPath, './packages/configurator/src');
    const hasConfiguratorSource = fs.existsSync(configuratorSrc);
    
    if (hasConfiguratorSource) {
      return true;
    }
    
    // Check if package.json has configurator as local dependency
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const devDeps = packageJson.devDependencies || {};
      const deps = packageJson.dependencies || {};
      
      const configuratorDep = devDeps['@manifold-studio/configurator'] || deps['@manifold-studio/configurator'];
      
      if (configuratorDep && (configuratorDep.includes('file:') || configuratorDep.includes('link:'))) {
        return true;
      }
    }
    

    return false;
    
  } catch (error) {
    console.warn('⚠️  Error detecting development mode, assuming user project mode:', error);
    return false;
  }
}

/**
 * Gets the configurator source path if in development mode
 */
export function getConfiguratorSourcePath(projectPath: string = process.cwd()): string | null {
  const configuratorSrc = path.resolve(projectPath, './packages/configurator/src');
  
  if (fs.existsSync(configuratorSrc)) {
    return configuratorSrc;
  }
  
  return null;
}
