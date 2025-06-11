/**
 * Base ServiceFactory class for all external service connections
 * Ensures build-time safety and proper runtime initialization
 */
export abstract class ServiceFactory<T> {
  protected static instances: Map<string, unknown> = new Map();
  protected isInitialized: boolean = false;
  
  /**
   * Get or create a singleton instance of the service
   * @param key Unique identifier for this service instance
   * @returns Promise<T> The service instance
   */
  protected static async getInstance<T>(
    key: string,
    factory: () => Promise<T>
  ): Promise<T> {
    if (!this.instances.has(key)) {
      // Only initialize if we're in a server runtime environment
      if (typeof window === 'undefined') {
        try {
          const instance = await factory();
          this.instances.set(key, instance);
        } catch (error) {
          console.error(`Failed to initialize service ${key}:`, error);
          // Return null instance that won't break build
          this.instances.set(key, null);
        }
      } else {
        // Client-side: return null instance
        this.instances.set(key, null);
      }
    }
    
    return this.instances.get(key) as T;
  }
  
  /**
   * Clear all service instances (useful for testing)
   */
  static clearInstances(): void {
    this.instances.clear();
  }
  
  /**
   * Check if a service is available
   * @param key Service identifier
   * @returns boolean
   */
  static isServiceAvailable(key: string): boolean {
    return this.instances.has(key) && this.instances.get(key) !== null;
  }
  
  /**
   * Abstract method to be implemented by each service
   * Defines how to create the service instance
   */
  protected abstract createInstance(): Promise<T>;
  
  /**
   * Abstract method to check if the service is healthy
   */
  abstract healthCheck(): Promise<boolean>;
  
  /**
   * Abstract method to gracefully shutdown the service
   */
  abstract shutdown(): Promise<void>;
}

/**
 * Interface for services that support configuration
 */
export interface ConfigurableService {
  configure(config: Record<string, unknown>): Promise<void>;
}

/**
 * Interface for services that support reconnection
 */
export interface ReconnectableService {
  reconnect(): Promise<void>;
  isConnected(): boolean;
}

/**
 * Type guard to check if a service is configurable
 */
export function isConfigurable(service: unknown): service is ConfigurableService {
  return service !== null && 
         typeof service === 'object' &&
         'configure' in service && 
         typeof (service as ConfigurableService).configure === 'function';
}

/**
 * Type guard to check if a service is reconnectable
 */
export function isReconnectable(service: unknown): service is ReconnectableService {
  return service !== null &&
         typeof service === 'object' &&
         'reconnect' in service && 
         'isConnected' in service && 
         typeof (service as ReconnectableService).reconnect === 'function' &&
         typeof (service as ReconnectableService).isConnected === 'function';
}
