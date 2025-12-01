/**
 * Health Tracker - Track shutdown status and active connections
 *
 * Purpose: Maintain real-time health status for graceful shutdown coordination
 *
 * Features:
 * - Track shutdown state (accepting requests or draining)
 * - Monitor active connection count
 * - Thread-safe connection increment/decrement
 * - Reset capability for testing
 *
 * Integration:
 * - Used by /api/health endpoint for readiness checks
 * - Updated by graceful shutdown process
 * - Monitored by connection drain tracker
 */

export interface HealthStatus {
  isShuttingDown: boolean;
  activeConnections: number;
  acceptingRequests: boolean;
}

class HealthTracker {
  private shuttingDown: boolean = false;
  private connections: number = 0;
  private readonly MAX_CONNECTIONS = 1000;

  /**
   * Set shutdown state
   * When true, server stops accepting new requests
   */
  setShuttingDown(flag: boolean): void {
    this.shuttingDown = flag;
  }

  /**
   * Get current shutdown state
   */
  getShuttingDown(): boolean {
    return this.shuttingDown;
  }

  /**
   * Check if server is accepting requests
   * Returns false if shutting down
   */
  isAcceptingRequests(): boolean {
    return !this.shuttingDown;
  }

  /**
   * Increment active connection count
   * Called when new request starts
   */
  incrementConnections(): void {
    this.connections++;
  }

  /**
   * Decrement active connection count
   * Called when request completes
   */
  decrementConnections(): void {
    this.connections = Math.max(0, this.connections - 1);
  }

  /**
   * Get current active connection count
   */
  getActiveConnections(): number {
    return this.connections;
  }

  /**
   * Check if server is ready to accept traffic
   * Returns false if connection limit exceeded or shutting down
   */
  isReady(): boolean {
    return !this.shuttingDown && this.connections < this.MAX_CONNECTIONS;
  }

  /**
   * Get comprehensive health status
   */
  getStatus(): HealthStatus {
    return {
      isShuttingDown: this.shuttingDown,
      activeConnections: this.connections,
      acceptingRequests: this.isAcceptingRequests(),
    };
  }

  /**
   * Reset tracker to initial state
   * Used for testing and server restart
   */
  reset(): void {
    this.shuttingDown = false;
    this.connections = 0;
  }

  /**
   * Force set connection count
   * Used for testing or recovery scenarios
   */
  setConnections(count: number): void {
    this.connections = Math.max(0, count);
  }
}

// Export singleton instance
export const healthTracker = new HealthTracker();

// Export class for testing
export { HealthTracker };
