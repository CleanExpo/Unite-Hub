/**
 * Task Chunker Utility
 * Breaks down large tasks into smaller chunks to prevent overload
 */

export interface ChunkedTask<T> {
  id: string;
  data: T;
  priority?: number;
  retryCount?: number;
}

export interface ChunkOptions {
  maxChunkSize: number;
  delayBetweenChunks: number;
  maxConcurrent: number;
  retryAttempts: number;
  progressCallback?: (progress: number, total: number) => void;
}

export class TaskChunker<T> {
  private queue: ChunkedTask<T>[] = [];
  private processing = new Set<string>();
  private completed = new Set<string>();
  private failed = new Map<string, Error>();
  private options: ChunkOptions;

  constructor(options: Partial<ChunkOptions> = {}) {
    this.options = {
      maxChunkSize: 10,
      delayBetweenChunks: 100,
      maxConcurrent: 3,
      retryAttempts: 3,
      ...options
    };
  }

  /**
   * Add tasks to the queue
   */
  addTasks(tasks: T[]): void {
    const chunks = this.chunkArray(tasks, this.options.maxChunkSize);
    
    chunks.forEach((chunk, index) => {
      chunk.forEach((task, taskIndex) => {
        this.queue.push({
          id: `${Date.now()}-${index}-${taskIndex}`,
          data: task,
          priority: 0,
          retryCount: 0
        });
      });
    });
  }

  /**
   * Process all queued tasks
   */
  async processAll<R>(
    processor: (task: T) => Promise<R>
  ): Promise<{ results: R[]; errors: Array<{ id: string; error: Error }> }> {
    const results: R[] = [];
    const errors: Array<{ id: string; error: Error }> = [];

    while (this.queue.length > 0 || this.processing.size > 0) {
      // Wait if we're at max concurrent limit
      if (this.processing.size >= this.options.maxConcurrent) {
        await this.delay(50);
        continue;
      }

      // Get next task
      const task = this.getNextTask();
      if (!task) {
        await this.delay(50);
        continue;
      }

      // Process task without awaiting
      this.processTask(task, processor, results, errors);

      // Delay between starting tasks
      if (this.queue.length > 0) {
        await this.delay(this.options.delayBetweenChunks);
      }
    }

    // Report final progress
    this.reportProgress();

    return { results, errors };
  }

  /**
   * Process a single task
   */
  private async processTask<R>(
    task: ChunkedTask<T>,
    processor: (task: T) => Promise<R>,
    results: R[],
    errors: Array<{ id: string; error: Error }>
  ): Promise<void> {
    this.processing.add(task.id);

    try {
      const result = await processor(task.data);
      results.push(result);
      this.completed.add(task.id);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      if (task.retryCount! < this.options.retryAttempts) {
        // Retry with exponential backoff
        task.retryCount! += 1;
        task.priority! -= 1; // Increase priority for retry
        await this.delay(Math.pow(2, task.retryCount!) * 1000);
        this.queue.push(task);
      } else {
        this.failed.set(task.id, err);
        errors.push({ id: task.id, error: err });
      }
    } finally {
      this.processing.delete(task.id);
      this.reportProgress();
    }
  }

  /**
   * Get the next task from queue (priority-based)
   */
  private getNextTask(): ChunkedTask<T> | null {
    if (this.queue.length === 0) return null;

    // Sort by priority (higher priority first)
    this.queue.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    return this.queue.shift()!;
  }

  /**
   * Report progress to callback
   */
  private reportProgress(): void {
    if (this.options.progressCallback) {
      const total = this.completed.size + this.processing.size + this.queue.length + this.failed.size;
      const progress = this.completed.size + this.failed.size;
      this.options.progressCallback(progress, total);
    }
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current status
   */
  getStatus(): {
    queued: number;
    processing: number;
    completed: number;
    failed: number;
  } {
    return {
      queued: this.queue.length,
      processing: this.processing.size,
      completed: this.completed.size,
      failed: this.failed.size
    };
  }

  /**
   * Clear all tasks and reset
   */
  reset(): void {
    this.queue = [];
    this.processing.clear();
    this.completed.clear();
    this.failed.clear();
  }
}

/**
 * Create a rate-limited processor function
 */
export function createRateLimitedProcessor<T, R>(
  processor: (item: T) => Promise<R>,
  options: {
    maxPerSecond: number;
    burstSize?: number;
  }
): (item: T) => Promise<R> {
  const { maxPerSecond, burstSize = maxPerSecond } = options;
  const minDelay = 1000 / maxPerSecond;
  
  let tokens = burstSize;
  let lastRefill = Date.now();
  
  return async (item: T): Promise<R> => {
    // Refill tokens
    const now = Date.now();
    const timePassed = now - lastRefill;
    const tokensToAdd = (timePassed / 1000) * maxPerSecond;
    tokens = Math.min(burstSize, tokens + tokensToAdd);
    lastRefill = now;
    
    // Wait for token if needed
    while (tokens < 1) {
      await new Promise(resolve => setTimeout(resolve, minDelay));
      const now = Date.now();
      const timePassed = now - lastRefill;
      const tokensToAdd = (timePassed / 1000) * maxPerSecond;
      tokens = Math.min(burstSize, tokens + tokensToAdd);
      lastRefill = now;
    }
    
    // Consume token and process
    tokens -= 1;
    return processor(item);
  };
}

/**
 * Batch processor for grouping small tasks
 */
export class BatchProcessor<T, R> {
  private batch: T[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private processing = false;
  
  constructor(
    private processor: (batch: T[]) => Promise<R[]>,
    private options: {
      maxBatchSize: number;
      maxWaitTime: number;
    }
  ) {}
  
  async add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.batch.push(item);
      
      // Store resolver for this item
      const itemIndex = this.batch.length - 1;
      (this.batch as any).__resolvers = (this.batch as any).__resolvers || [];
      (this.batch as any).__resolvers[itemIndex] = { resolve, reject };
      
      // Process if batch is full
      if (this.batch.length >= this.options.maxBatchSize) {
        this.processBatch();
      } else {
        // Set timeout for batch processing
        if (!this.batchTimeout) {
          this.batchTimeout = setTimeout(() => {
            this.processBatch();
          }, this.options.maxWaitTime);
        }
      }
    });
  }
  
  private async processBatch(): Promise<void> {
    if (this.processing || this.batch.length === 0) return;
    
    this.processing = true;
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    
    const currentBatch = [...this.batch];
    const resolvers = (this.batch as any).__resolvers || [];
    this.batch = [];
    (this.batch as any).__resolvers = [];
    
    try {
      const results = await this.processor(currentBatch);
      
      // Resolve individual promises
      results.forEach((result, index) => {
        if (resolvers[index]) {
          resolvers[index].resolve(result);
        }
      });
    } catch (error) {
      // Reject all promises in batch
      resolvers.forEach((resolver: any) => {
        if (resolver) {
          resolver.reject(error);
        }
      });
    } finally {
      this.processing = false;
    }
  }
}
