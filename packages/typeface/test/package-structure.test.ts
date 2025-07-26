import { describe, test, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Package Structure', () => {
  test('should have correct package.json configuration', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
    
    expect(packageJson.name).toBe('@manifold-studio/typeface');
    expect(packageJson.main).toBeDefined();
    expect(packageJson.types).toBeDefined();
    
    // Should have OpenType.js as dependency
    expect(packageJson.dependencies['opentype.js']).toBeDefined();
  });

  test('should have all required source files', () => {
    const srcDir = path.join(__dirname, '../src');
    
    // Check that main source files exist
    expect(fs.existsSync(path.join(srcDir, 'index.ts'))).toBe(true);
    expect(fs.existsSync(path.join(srcDir, 'font-registry.ts'))).toBe(true);
    expect(fs.existsSync(path.join(srcDir, 'font-resolver.ts'))).toBe(true);
    expect(fs.existsSync(path.join(srcDir, 'text-renderer.ts'))).toBe(true);
    expect(fs.existsSync(path.join(srcDir, 'font-polygon-classifier.ts'))).toBe(true);
    expect(fs.existsSync(path.join(srcDir, 'font-loader.ts'))).toBe(true);
  });

  test('should have correct build configuration files', () => {
    const packageDir = path.join(__dirname, '..');
    
    // Check that build configuration exists
    expect(fs.existsSync(path.join(packageDir, 'tsconfig.json'))).toBe(true);
    expect(fs.existsSync(path.join(packageDir, 'vite.config.ts'))).toBe(true);
    expect(fs.existsSync(path.join(packageDir, 'vitest.config.ts'))).toBe(true);
  });

  test('should have test infrastructure', () => {
    const testDir = path.join(__dirname, '../test');
    const utilsDir = path.join(testDir, 'utils');
    
    // Check that test utilities exist
    expect(fs.existsSync(path.join(utilsDir, 'font-server.ts'))).toBe(true);
    expect(fs.existsSync(path.join(utilsDir, 'test-helpers.ts'))).toBe(true);
  });

  test('should have font assets for testing', () => {
    const assetsDir = path.join(__dirname, '../../../reference-project/assets/fonts');
    
    // Check that font assets exist
    expect(fs.existsSync(path.join(assetsDir, 'Inter-Regular.ttf'))).toBe(true);
    expect(fs.existsSync(path.join(assetsDir, 'Roboto-Regular.ttf'))).toBe(true);
  });

  test('should have correct TypeScript configuration', () => {
    const tsConfigPath = path.join(__dirname, '../tsconfig.json');
    const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
    
    expect(tsConfig.compilerOptions).toBeDefined();
    expect(tsConfig.compilerOptions.target).toBeDefined();
    expect(tsConfig.compilerOptions.module).toBeDefined();
    expect(tsConfig.compilerOptions.declaration).toBe(true);
  });

  test('should have correct Vite configuration', () => {
    const viteConfigPath = path.join(__dirname, '../vite.config.ts');
    
    // Just check that the file exists and is readable
    expect(fs.existsSync(viteConfigPath)).toBe(true);
    
    const viteConfigContent = fs.readFileSync(viteConfigPath, 'utf8');
    expect(viteConfigContent).toContain('defineConfig');
    expect(viteConfigContent).toContain('lib');
  });

  test('should have correct source file structure', () => {
    const srcDir = path.join(__dirname, '../src');
    
    // Check that index.ts exports the main functions
    const indexContent = fs.readFileSync(path.join(srcDir, 'index.ts'), 'utf8');
    expect(indexContent).toContain('export');
    expect(indexContent).toContain('fontLoader');
    
    // Check that font-registry.ts has the expected structure
    const fontRegistryContent = fs.readFileSync(path.join(srcDir, 'font-registry.ts'), 'utf8');
    expect(fontRegistryContent).toContain('class');
    expect(fontRegistryContent).toContain('FontRegistry');
    
    // Check that font-resolver.ts has the expected structure
    const fontResolverContent = fs.readFileSync(path.join(srcDir, 'font-resolver.ts'), 'utf8');
    expect(fontResolverContent).toContain('class');
    expect(fontResolverContent).toContain('FontResolver');
  });
});
