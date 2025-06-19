/**
 * Temp Folder Watcher Service
 * 
 * Simple polling service that watches temp/manifest.json for changes
 * and triggers model discovery updates when the manifest changes.
 * 
 * This is the Phase 3 implementation that connects the model watcher
 * (Phase 2) with the UI updates.
 */

import { refreshAvailableModels } from '../state/store';

interface TempFolderWatcherOptions {
  /** Polling interval in milliseconds (default: 500ms) */
  pollInterval?: number;
  /** Path to the temp directory (default: './temp') */
  tempDir?: string;
  /** Enable debug logging (default: true in development) */
  debug?: boolean;
}

interface ManifestData {
  models: Array<{
    id: string;
    name: string;
    type: 'static' | 'parametric';
    filePath: string;
    blobPath?: string;
    lastUpdated: string;
    status: 'pending' | 'compiling' | 'compiled' | 'error';
    error?: string;
    blobSize?: number;
    compilationTime?: number;
  }>;
  lastBuild: string;
  buildCount: number;
}

export class TempFolderWatcher {
  private pollInterval: number;
  private tempDir: string;
  private debug: boolean;
  private intervalId: number | null = null;
  private lastManifestContent: string | null = null;
  private isRunning = false;

  constructor(options: TempFolderWatcherOptions = {}) {
    this.pollInterval = options.pollInterval ?? 500;
    this.tempDir = options.tempDir ?? './temp';
    this.debug = options.debug ?? (import.meta.env?.DEV ?? true);
    
    if (this.debug) {
      console.log('🔍 TempFolderWatcher initialized:', {
        pollInterval: this.pollInterval,
        tempDir: this.tempDir
      });
    }
  }

  /**
   * Start watching the temp folder for changes
   */
  start(): void {
    if (this.isRunning) {
      console.warn('⚠️ TempFolderWatcher is already running');
      return;
    }

    this.isRunning = true;
    
    if (this.debug) {
      console.log('🚀 Starting temp folder watcher...');
    }

    // Initial check
    this.checkManifest();

    // Set up polling
    this.intervalId = window.setInterval(() => {
      this.checkManifest();
    }, this.pollInterval);

    if (this.debug) {
      console.log(`✅ Temp folder watcher started (polling every ${this.pollInterval}ms)`);
    }
  }

  /**
   * Stop watching the temp folder
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.debug) {
      console.log('🛑 Temp folder watcher stopped');
    }
  }

  /**
   * Check if the manifest.json file has changed
   */
  private async checkManifest(): Promise<void> {
    try {
      const manifestPath = `${this.tempDir}/manifest.json`;
      
      // Try to fetch the manifest file
      const response = await fetch(manifestPath);
      
      if (!response.ok) {
        // File doesn't exist or can't be read
        if (this.lastManifestContent !== null) {
          // We had a manifest before, but now it's gone
          if (this.debug) {
            console.log('📂 Temp folder manifest.json no longer available');
          }
          this.lastManifestContent = null;
        }
        return;
      }

      const manifestContent = await response.text();

      // Check if content has changed
      if (manifestContent !== this.lastManifestContent) {
        if (this.debug) {
          console.log('🔄 Temp folder manifest.json changed!');
        }

        this.lastManifestContent = manifestContent;
        await this.handleManifestChange(manifestContent);
      }

    } catch (error) {
      // Silently handle errors (file might not exist yet)
      if (this.debug && this.lastManifestContent !== null) {
        console.log('📂 Temp folder not accessible:', error);
      }
      this.lastManifestContent = null;
    }
  }

  /**
   * Handle manifest.json changes
   */
  private async handleManifestChange(manifestContent: string): Promise<void> {
    try {
      const manifest: ManifestData = JSON.parse(manifestContent);
      
      if (this.debug) {
        console.log('📋 Manifest updated:', {
          modelCount: manifest.models.length,
          lastBuild: manifest.lastBuild,
          buildCount: manifest.buildCount,
          models: manifest.models.map(m => `${m.id} (${m.status})`)
        });
      }

      // Trigger model discovery refresh
      await refreshAvailableModels();

      if (this.debug) {
        console.log('✅ Model discovery refreshed from temp folder');
      }

    } catch (error) {
      console.error('❌ Error parsing manifest.json:', error);
    }
  }

  /**
   * Get current watcher status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      pollInterval: this.pollInterval,
      tempDir: this.tempDir,
      hasManifest: this.lastManifestContent !== null
    };
  }
}

/**
 * Global watcher instance
 */
let globalWatcher: TempFolderWatcher | null = null;

/**
 * Initialize the temp folder watcher with default settings
 */
export function initializeTempFolderWatcher(options?: TempFolderWatcherOptions): TempFolderWatcher {
  if (globalWatcher) {
    console.warn('⚠️ Temp folder watcher already initialized');
    return globalWatcher;
  }

  globalWatcher = new TempFolderWatcher(options);
  return globalWatcher;
}

/**
 * Start the global temp folder watcher
 */
export function startTempFolderWatcher(): void {
  if (!globalWatcher) {
    globalWatcher = initializeTempFolderWatcher();
  }
  globalWatcher.start();
}

/**
 * Stop the global temp folder watcher
 */
export function stopTempFolderWatcher(): void {
  if (globalWatcher) {
    globalWatcher.stop();
  }
}

/**
 * Get the global watcher instance
 */
export function getTempFolderWatcher(): TempFolderWatcher | null {
  return globalWatcher;
}
