import { readFile, stat, readdir } from 'fs/promises';
import { join, relative } from 'path';

export interface FileValidationResult {
  exists: boolean;
  isFile?: boolean;
  isDirectory?: boolean;
  size?: number;
  content?: string;
  error?: string;
}

export interface DirectoryStructure {
  [key: string]: DirectoryStructure | null; // null indicates a file
}

/**
 * Utility for validating files and directory structures
 */
export class FileValidator {
  /**
   * Check if a file or directory exists and get basic info
   */
  static async validate(filePath: string): Promise<FileValidationResult> {
    try {
      const stats = await stat(filePath);
      
      const result: FileValidationResult = {
        exists: true,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        size: stats.size
      };

      // Read content if it's a file and not too large
      if (stats.isFile() && stats.size < 1024 * 1024) { // 1MB limit
        try {
          result.content = await readFile(filePath, 'utf-8');
        } catch (error) {
          result.error = `Failed to read file: ${error}`;
        }
      }

      return result;
    } catch (error) {
      return {
        exists: false,
        error: `File validation failed: ${error}`
      };
    }
  }

  /**
   * Validate that a file exists and contains expected content
   */
  static async validateFileContent(
    filePath: string,
    expectedContent?: string | RegExp,
    options: { partial?: boolean } = {}
  ): Promise<{ valid: boolean; error?: string; content?: string }> {
    const result = await this.validate(filePath);
    
    if (!result.exists) {
      return { valid: false, error: `File does not exist: ${filePath}` };
    }

    if (!result.isFile) {
      return { valid: false, error: `Path is not a file: ${filePath}` };
    }

    if (!result.content) {
      return { valid: false, error: `Could not read file content: ${filePath}` };
    }

    if (!expectedContent) {
      return { valid: true, content: result.content };
    }

    let matches = false;
    if (typeof expectedContent === 'string') {
      matches = options.partial 
        ? result.content.includes(expectedContent)
        : result.content === expectedContent;
    } else {
      matches = expectedContent.test(result.content);
    }

    return {
      valid: matches,
      content: result.content,
      error: matches ? undefined : `Content validation failed for: ${filePath}`
    };
  }

  /**
   * Validate directory structure matches expected structure
   */
  static async validateDirectoryStructure(
    basePath: string,
    expectedStructure: DirectoryStructure
  ): Promise<{ valid: boolean; errors: string[]; missing: string[]; unexpected: string[] }> {
    const errors: string[] = [];
    const missing: string[] = [];
    const unexpected: string[] = [];

    try {
      const actualStructure = await this.getDirectoryStructure(basePath);
      
      // Check for missing files/directories
      this.checkMissing(expectedStructure, actualStructure, '', missing);
      
      // Check for unexpected files/directories
      this.checkUnexpected(expectedStructure, actualStructure, '', unexpected);

    } catch (error) {
      errors.push(`Failed to validate directory structure: ${error}`);
    }

    return {
      valid: errors.length === 0 && missing.length === 0,
      errors,
      missing,
      unexpected
    };
  }

  /**
   * Get the actual directory structure
   */
  private static async getDirectoryStructure(
    dirPath: string,
    maxDepth = 3,
    currentDepth = 0
  ): Promise<DirectoryStructure> {
    if (currentDepth >= maxDepth) {
      return {};
    }

    const structure: DirectoryStructure = {};
    
    try {
      const entries = await readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue; // Skip hidden files
        
        if (entry.isDirectory()) {
          structure[entry.name] = await this.getDirectoryStructure(
            join(dirPath, entry.name),
            maxDepth,
            currentDepth + 1
          );
        } else {
          structure[entry.name] = null;
        }
      }
    } catch (error) {
      // Directory might not exist or be readable
    }

    return structure;
  }

  /**
   * Check for missing files/directories
   */
  private static checkMissing(
    expected: DirectoryStructure,
    actual: DirectoryStructure,
    currentPath: string,
    missing: string[]
  ): void {
    for (const [name, expectedValue] of Object.entries(expected)) {
      const fullPath = currentPath ? `${currentPath}/${name}` : name;
      
      if (!(name in actual)) {
        missing.push(fullPath);
        continue;
      }

      if (expectedValue !== null && actual[name] !== null) {
        // Both are directories, recurse
        this.checkMissing(expectedValue, actual[name] as DirectoryStructure, fullPath, missing);
      }
    }
  }

  /**
   * Check for unexpected files/directories
   */
  private static checkUnexpected(
    expected: DirectoryStructure,
    actual: DirectoryStructure,
    currentPath: string,
    unexpected: string[]
  ): void {
    for (const [name, actualValue] of Object.entries(actual)) {
      const fullPath = currentPath ? `${currentPath}/${name}` : name;
      
      if (!(name in expected)) {
        unexpected.push(fullPath);
        continue;
      }

      if (actualValue !== null && expected[name] !== null) {
        // Both are directories, recurse
        this.checkUnexpected(expected[name] as DirectoryStructure, actualValue, fullPath, unexpected);
      }
    }
  }

  /**
   * Validate that all files in a list exist
   */
  static async validateFilesExist(
    basePath: string,
    filePaths: string[]
  ): Promise<{ valid: boolean; missing: string[]; errors: string[] }> {
    const missing: string[] = [];
    const errors: string[] = [];

    for (const filePath of filePaths) {
      const fullPath = join(basePath, filePath);
      const result = await this.validate(fullPath);
      
      if (!result.exists) {
        missing.push(filePath);
      } else if (result.error) {
        errors.push(`${filePath}: ${result.error}`);
      }
    }

    return {
      valid: missing.length === 0 && errors.length === 0,
      missing,
      errors
    };
  }

  /**
   * Validate JSON file content
   */
  static async validateJsonFile(
    filePath: string,
    validator?: (data: any) => boolean | string
  ): Promise<{ valid: boolean; data?: any; error?: string }> {
    const result = await this.validateFileContent(filePath);
    
    if (!result.valid) {
      return { valid: false, error: result.error };
    }

    try {
      const data = JSON.parse(result.content!);
      
      if (validator) {
        const validationResult = validator(data);
        if (validationResult === true) {
          return { valid: true, data };
        } else {
          return { 
            valid: false, 
            data, 
            error: typeof validationResult === 'string' ? validationResult : 'JSON validation failed'
          };
        }
      }

      return { valid: true, data };
    } catch (error) {
      return { valid: false, error: `Invalid JSON: ${error}` };
    }
  }
}
