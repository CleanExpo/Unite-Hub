/**
 * RuntimeService - Base class for services that should only initialize at runtime
 * Prevents build-time errors from external service dependencies
 */
export abstract class RuntimeService {
  private _isRuntime: boolean = false;
  private _initPromise: Promise<void> | null = null;
  
  constructor() {
    // Determine if we're in a runtime environment
    this._isRuntime = typeof window === 'undefined' && 
                      process.env.NODE_ENV !== 'test' &&
                      !process.env.BUILDING;
  }
  
  /**
   * Check if the service can be initialized
   */
  protected canInitialize(): boolean {
    return this._isRuntime;
  }
  
  /**
   * Initialize the service (lazy initialization)
   */
  async initialize(): Promise<void> {
    if (!this.canInitialize()) {
      console.log(`Skipping initialization of ${this.constructor.name} - not in runtime environment`);
      return;
    }
    
    if (this._initPromise) {
      return this._initPromise;
    }
    
    this._initPromise = this.performInitialization();
    return this._initPromise;
  }
  
  /**
   * Abstract method for actual initialization logic
   */
  protected abstract performInitialization(): Promise<void>;
  
  /**
   * Safe method wrapper that ensures initialization before execution
   */
  protected async safeExecute<T>(
    operation: () => Promise<T>,
    fallback?: T
  ): Promise<T> {
    if (!this.canInitialize()) {
      if (fallback !== undefined) {
        return fallback;
      }
      throw new Error(`${this.constructor.name} is not available in this environment`);
    }
    
    try {
      await this.initialize();
      return await operation();
    } catch (error) {
      console.error(`Error in ${this.constructor.name}:`, error);
      if (fallback !== undefined) {
        return fallback;
      }
      throw error;
    }
  }
  
  /**
   * Check if the service is available in the current environment
   */
  isAvailable(): boolean {
    return this._isRuntime;
  }
  
  /**
   * Get environment info for debugging
   */
  getEnvironmentInfo(): Record<string, unknown> {
    return {
      isRuntime: this._isRuntime,
      nodeEnv: process.env.NODE_ENV,
      isBuilding: !!process.env.BUILDING,
      isBrowser: typeof window !== 'undefined',
      serviceName: this.constructor.name
    };
  }
}

/**
 * Decorator to mark methods as runtime-only
 */
export function RuntimeOnly(
  target: RuntimeService,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value;
  
  descriptor.value = async function(this: RuntimeService, ...args: unknown[]): Promise<unknown> {
    if (!this.isAvailable()) {
      console.warn(`${propertyKey} called outside runtime environment`);
      return undefined;
    }
    
    return originalMethod.apply(this, args);
  };
  
  return descriptor;
}

/**
 * Utility to check if we're in a build environment
 */
export function isBuildTime(): boolean {
  return process.env.BUILDING === 'true' || 
         process.env.NODE_ENV === 'production' && 
         typeof window === 'undefined' &&
         !global.process?.send; // Not in a worker process
}

/**
 * Utility to check if we're in a test environment
 */
export function isTestEnvironment(): boolean {
  return process.env.NODE_ENV === 'test' || 
         process.env.JEST_WORKER_ID !== undefined ||
         process.env.VITEST !== undefined;
}
