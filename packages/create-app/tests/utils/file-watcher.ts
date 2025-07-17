import { stat, access } from 'fs/promises';
import { join } from 'path';

export interface FileChangeResult {
  changed: boolean;
  beforeTime?: Date;
  afterTime?: Date;
  timeDiff?: number;
}

export interface WatchOptions {
  timeout?: number;
  pollInterval?: number;
  expectedChange?: 'created' | 'modified' | 'any';
}

/**
 * File watching utility for testing pipeline changes
 * Monitors temp/pipeline.js and other files for modifications
 */
export class FileWatcher {
  /**
   * Get file modification time, returns null if file doesn't exist
   */
  static async getFileModTime(filePath: string): Promise<Date | null> {
    try {
      const stats = await stat(filePath);
      return stats.mtime;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if file exists
   */
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      await access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Wait for a file to be created or modified
   */
  static async waitForFileChange(
    filePath: string, 
    baselineTime: Date | null = null,
    options: WatchOptions = {}
  ): Promise<FileChangeResult> {
    const {
      timeout = 30000,
      pollInterval = 500,
      expectedChange = 'any'
    } = options;

    const startTime = Date.now();
    const initialExists = await this.fileExists(filePath);
    const initialTime = await this.getFileModTime(filePath);

    // If no baseline provided, use current time or file mod time
    const effectiveBaseline = baselineTime || initialTime || new Date();

    while (Date.now() - startTime < timeout) {
      const currentExists = await this.fileExists(filePath);
      const currentTime = await this.getFileModTime(filePath);

      // Check for creation
      if (expectedChange === 'created' && !initialExists && currentExists) {
        return {
          changed: true,
          beforeTime: effectiveBaseline,
          afterTime: currentTime || new Date(),
          timeDiff: currentTime ? currentTime.getTime() - effectiveBaseline.getTime() : 0
        };
      }

      // Check for modification
      if (currentTime && currentTime > effectiveBaseline) {
        if (expectedChange === 'modified' && initialExists) {
          return {
            changed: true,
            beforeTime: effectiveBaseline,
            afterTime: currentTime,
            timeDiff: currentTime.getTime() - effectiveBaseline.getTime()
          };
        }

        if (expectedChange === 'any') {
          return {
            changed: true,
            beforeTime: effectiveBaseline,
            afterTime: currentTime,
            timeDiff: currentTime.getTime() - effectiveBaseline.getTime()
          };
        }
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    return {
      changed: false,
      beforeTime: effectiveBaseline
    };
  }

  /**
   * Monitor user-pipeline-entry.ts file for changes after an edit
   *
   * IMPORTANT: We monitor user-pipeline-entry.ts (the actual file on disk),
   * NOT pipeline.js (which is the served route). The CLI serves the TypeScript
   * file as JavaScript via Vite middleware at /temp/pipeline.js.
   */
  static async waitForPipelineRebuild(
    projectPath: string,
    baselineTime?: Date,
    timeout: number = 15000
  ): Promise<FileChangeResult> {
    const pipelinePath = join(projectPath, 'temp', 'user-pipeline-entry.ts');
    
    // If no baseline provided, get current mod time
    const effectiveBaseline = baselineTime || await this.getFileModTime(pipelinePath) || new Date();
    
    return this.waitForFileChange(pipelinePath, effectiveBaseline, {
      timeout,
      expectedChange: 'any'
    });
  }

  /**
   * Monitor manifest.json file for changes
   */
  static async waitForManifestUpdate(
    projectPath: string,
    baselineTime?: Date,
    timeout: number = 15000
  ): Promise<FileChangeResult> {
    const manifestPath = join(projectPath, 'temp', 'manifest.json');
    
    const effectiveBaseline = baselineTime || await this.getFileModTime(manifestPath) || new Date();
    
    return this.waitForFileChange(manifestPath, effectiveBaseline, {
      timeout,
      expectedChange: 'any'
    });
  }

  /**
   * Wait for both pipeline.js and manifest.json to be updated
   */
  static async waitForFullPipelineUpdate(
    projectPath: string,
    baselineTime?: Date,
    timeout: number = 20000
  ): Promise<{
    pipelineChanged: boolean;
    manifestChanged: boolean;
    bothChanged: boolean;
    pipelineResult: FileChangeResult;
    manifestResult: FileChangeResult;
  }> {
    const [pipelineResult, manifestResult] = await Promise.all([
      this.waitForPipelineRebuild(projectPath, baselineTime, timeout),
      this.waitForManifestUpdate(projectPath, baselineTime, timeout)
    ]);

    return {
      pipelineChanged: pipelineResult.changed,
      manifestChanged: manifestResult.changed,
      bothChanged: pipelineResult.changed && manifestResult.changed,
      pipelineResult,
      manifestResult
    };
  }

  /**
   * Create a baseline timestamp for comparison
   */
  static createBaseline(): Date {
    return new Date();
  }

  /**
   * Get baseline from existing pipeline files
   */
  static async getPipelineBaseline(projectPath: string): Promise<Date> {
    const pipelinePath = join(projectPath, 'temp', 'user-pipeline-entry.ts');
    const manifestPath = join(projectPath, 'temp', 'manifest.json');
    
    const [pipelineTime, manifestTime] = await Promise.all([
      this.getFileModTime(pipelinePath),
      this.getFileModTime(manifestPath)
    ]);

    // Return the latest modification time, or current time if neither exists
    const times = [pipelineTime, manifestTime].filter(Boolean) as Date[];
    return times.length > 0 ? new Date(Math.max(...times.map(t => t.getTime()))) : new Date();
  }
}
