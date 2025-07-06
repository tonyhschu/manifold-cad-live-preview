/**
 * Port Manager for Test Isolation
 * 
 * Manages port allocation to prevent conflicts during parallel test execution
 */

export class PortManager {
  private static usedPorts = new Set<number>();
  private static readonly BASE_PIPELINE_PORT = 3001;
  private static readonly BASE_UI_PORT = 5173;
  private static readonly PORT_RANGE = 100; // Allow 100 port variations

  /**
   * Allocate a unique port pair for pipeline and UI servers
   */
  static allocatePortPair(): { pipelinePort: number; uiPort: number } {
    for (let offset = 0; offset < this.PORT_RANGE; offset++) {
      const pipelinePort = this.BASE_PIPELINE_PORT + offset;
      const uiPort = this.BASE_UI_PORT + offset;

      if (!this.usedPorts.has(pipelinePort) && !this.usedPorts.has(uiPort)) {
        this.usedPorts.add(pipelinePort);
        this.usedPorts.add(uiPort);
        
        return { pipelinePort, uiPort };
      }
    }

    throw new Error('No available port pairs found');
  }

  /**
   * Release a port pair back to the pool
   */
  static releasePortPair(pipelinePort: number, uiPort: number): void {
    this.usedPorts.delete(pipelinePort);
    this.usedPorts.delete(uiPort);
  }

  /**
   * Check if a port is available
   */
  static isPortAvailable(port: number): boolean {
    return !this.usedPorts.has(port);
  }

  /**
   * Reset all port allocations (useful for test cleanup)
   */
  static reset(): void {
    this.usedPorts.clear();
  }
}
