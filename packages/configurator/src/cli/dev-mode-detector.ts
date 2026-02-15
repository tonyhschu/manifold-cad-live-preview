import fs from 'fs';
import path from 'path';

/**
 * Detects if we're running in configurator development mode
 * This happens when:
 * 1. We're in a workspace with configurator source code (monorepo root)
 * 2. The configurator package is a symlink (npm workspace resolution)
 */
export async function detectConfiguratorDevelopment(projectPath: string = process.cwd()): Promise<boolean> {
  try {
    // Check if we're in a workspace with configurator source (running from monorepo root)
    const configuratorSrc = path.resolve(projectPath, './packages/configurator/src');
    if (fs.existsSync(configuratorSrc)) {
      return true;
    }

    // Check if the configurator package is a symlink (workspace-linked = dev mode)
    // npm workspaces always create symlinks for local packages in node_modules
    const configuratorPath = path.resolve(projectPath, 'node_modules/@manifold-studio/configurator');
    try {
      const stat = fs.lstatSync(configuratorPath);
      if (stat.isSymbolicLink()) {
        return true;
      }
    } catch {}

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
