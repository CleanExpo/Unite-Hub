/**
 * Visual Retry Handler
 * Phase 39: Visual QA & Stability
 *
 * Retry logic for failed visual generations
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  attempts: number;
  lastError?: Error;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, "onRetry">> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | undefined;
  let delay = config.initialDelayMs;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      const data = await fn();
      return {
        success: true,
        data,
        attempts: attempt,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < config.maxRetries) {
        // Call retry callback
        options.onRetry?.(attempt, lastError);

        // Wait before retrying
        await sleep(delay);

        // Increase delay for next attempt
        delay = Math.min(delay * config.backoffMultiplier, config.maxDelayMs);
      }
    }
  }

  return {
    success: false,
    attempts: config.maxRetries,
    lastError,
  };
}

/**
 * Retry visual asset loading
 */
export async function retryLoadImage(
  url: string,
  options?: RetryOptions
): Promise<RetryResult<HTMLImageElement>> {
  return withRetry(async () => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  }, options);
}

/**
 * Retry visual generation API call
 */
export async function retryGeneration<T>(
  generateFn: () => Promise<T>,
  options?: RetryOptions
): Promise<RetryResult<T>> {
  return withRetry(generateFn, {
    maxRetries: 2, // Fewer retries for generation (expensive)
    initialDelayMs: 2000,
    ...options,
  });
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();

  // Network errors
  if (message.includes("network") || message.includes("fetch")) {
    return true;
  }

  // Timeout errors
  if (message.includes("timeout") || message.includes("timed out")) {
    return true;
  }

  // Rate limiting
  if (message.includes("rate limit") || message.includes("429")) {
    return true;
  }

  // Server errors
  if (message.includes("500") || message.includes("502") || message.includes("503")) {
    return true;
  }

  return false;
}

/**
 * Create a retry state manager for React components
 */
export function createRetryState() {
  return {
    attempt: 0,
    maxAttempts: 3,
    lastError: null as Error | null,
    isRetrying: false,

    canRetry() {
      return this.attempt < this.maxAttempts;
    },

    recordAttempt(error?: Error) {
      this.attempt++;
      if (error) {
        this.lastError = error;
      }
    },

    reset() {
      this.attempt = 0;
      this.lastError = null;
      this.isRetrying = false;
    },
  };
}

// Utility
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default {
  withRetry,
  retryLoadImage,
  retryGeneration,
  isRetryableError,
  createRetryState,
};
