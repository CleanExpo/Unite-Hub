import { RuntimeService, isBuildTime } from '../base/RuntimeService';
import { ReconnectableService, ConfigurableService } from '../base/ServiceFactory';
import Redis, { Redis as RedisClient, RedisOptions } from 'ioredis';

/**
 * RedisService - Runtime-safe Redis connection manager
 * Prevents Redis connection attempts during build time
 */
export class RedisService extends RuntimeService implements ReconnectableService, ConfigurableService {
  private client: RedisClient | null = null;
  private config: Record<string, unknown> = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    lazyConnect: true,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableOfflineQueue: true,
  };

  /**
   * Singleton instance
   */
  private static instance: RedisService | null = null;

  /**
   * Get the singleton instance
   */
  static async getInstance(): Promise<RedisService> {
    if (!this.instance) {
      this.instance = new RedisService();
      // Only initialize if not in build time
      if (!isBuildTime()) {
        await this.instance.initialize();
      }
    }
    return this.instance;
  }

  /**
   * Configure the Redis connection
   */
  async configure(config: Record<string, unknown>): Promise<void> {
    this.config = { ...this.config, ...config };
    
    // If already connected, reconnect with new config
    if (this.isConnected()) {
      await this.reconnect();
    }
  }

  /**
   * Perform the actual Redis initialization
   */
  protected async performInitialization(): Promise<void> {
    if (isBuildTime()) {
      console.log('Skipping Redis initialization during build');
      return;
    }

    try {
      // Create Redis client with lazy connection
      this.client = new Redis(this.config as RedisOptions);

      // Set up event handlers
      this.client.on('connect', () => {
        console.log('Redis connected successfully');
      });

      this.client.on('error', (err) => {
        console.error('Redis connection error:', err);
      });

      this.client.on('close', () => {
        console.log('Redis connection closed');
      });

      // Actually connect
      await this.client.connect();
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      this.client = null;
    }
  }

  /**
   * Check if Redis is connected
   */
  isConnected(): boolean {
    return this.client !== null && this.client.status === 'ready';
  }

  /**
   * Reconnect to Redis
   */
  async reconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
    }
    
    this.client = null;
    await this.initialize();
  }

  /**
   * Get a value from Redis
   */
  async get(key: string): Promise<string | null> {
    return this.safeExecute(
      async () => {
        if (!this.client) return null;
        return await this.client.get(key);
      },
      null
    );
  }

  /**
   * Set a value in Redis
   */
  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    return this.safeExecute(
      async () => {
        if (!this.client) return false;
        
        if (ttl) {
          const result = await this.client.set(key, value, 'EX', ttl);
          return result === 'OK';
        } else {
          const result = await this.client.set(key, value);
          return result === 'OK';
        }
      },
      false
    );
  }

  /**
   * Delete a key from Redis
   */
  async del(key: string): Promise<boolean> {
    return this.safeExecute(
      async () => {
        if (!this.client) return false;
        const result = await this.client.del(key);
        return result > 0;
      },
      false
    );
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    return this.safeExecute(
      async () => {
        if (!this.client) return false;
        const result = await this.client.exists(key);
        return result > 0;
      },
      false
    );
  }

  /**
   * Set a hash field
   */
  async hset(key: string, field: string, value: string): Promise<boolean> {
    return this.safeExecute(
      async () => {
        if (!this.client) return false;
        const result = await this.client.hset(key, field, value);
        return result >= 0;
      },
      false
    );
  }

  /**
   * Get a hash field
   */
  async hget(key: string, field: string): Promise<string | null> {
    return this.safeExecute(
      async () => {
        if (!this.client) return null;
        return await this.client.hget(key, field);
      },
      null
    );
  }

  /**
   * Get all hash fields
   */
  async hgetall(key: string): Promise<Record<string, string>> {
    return this.safeExecute(
      async () => {
        if (!this.client) return {};
        return await this.client.hgetall(key);
      },
      {}
    );
  }

  /**
   * Add to a set
   */
  async sadd(key: string, ...members: string[]): Promise<number> {
    return this.safeExecute(
      async () => {
        if (!this.client) return 0;
        return await this.client.sadd(key, ...members);
      },
      0
    );
  }

  /**
   * Get all members of a set
   */
  async smembers(key: string): Promise<string[]> {
    return this.safeExecute(
      async () => {
        if (!this.client) return [];
        return await this.client.smembers(key);
      },
      []
    );
  }

  /**
   * Increment a counter
   */
  async incr(key: string): Promise<number> {
    return this.safeExecute(
      async () => {
        if (!this.client) return 0;
        return await this.client.incr(key);
      },
      0
    );
  }

  /**
   * Set key expiration
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    return this.safeExecute(
      async () => {
        if (!this.client) return false;
        const result = await this.client.expire(key, seconds);
        return result === 1;
      },
      false
    );
  }

  /**
   * Flush all data (use with caution)
   */
  async flushall(): Promise<void> {
    return this.safeExecute(
      async () => {
        if (!this.client) return;
        await this.client.flushall();
      }
    );
  }

  /**
   * Get the raw Redis client (use with caution)
   */
  getClient(): RedisClient | null {
    return this.client;
  }

  /**
   * Gracefully shutdown Redis connection
   */
  async shutdown(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }
}

/**
 * Export a default instance getter for convenience
 */
export const getRedis = () => RedisService.getInstance();
